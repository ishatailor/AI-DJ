import axios from 'axios'

// Get these from your Spotify Developer Dashboard
const CLIENT_ID = '8abeecc3dd25435ea2bd3ed92c080c92'
const CLIENT_SECRET = 'd0886806678f4cc8b1eb298e871fffe8'
const REDIRECT_URI = 'http://localhost:3000/callback'

let accessToken = null
let tokenExpiry = null
// Simple in-memory cache to reduce Spotify API calls and avoid 429
const searchCache = new Map() // key: string, value: { data: any[], expires: number }

const getAccessToken = async () => {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken
  }

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
        }
      }
    )

    accessToken = response.data.access_token
    tokenExpiry = Date.now() + (response.data.expires_in * 1000)
    return accessToken
  } catch (error) {
    console.error('Error getting access token:', error)
    throw new Error('Failed to authenticate with Spotify')
  }
}

export const searchSpotifyTracks = async (query) => {
  console.log('🔍 searchSpotifyTracks called with query:', query)

  try {
    // If query is empty or very short, show a previewable recommendations shelf
    if (!query || query.trim().length < 2) {
      try {
        const recs = await getPreviewableRecommendations(30, 'US')
        return recs
      } catch {
        return []
      }
    }

    const normalized = query.trim().toLowerCase()
    const cacheKey = `q:${normalized}`
    const cached = searchCache.get(cacheKey)
    if (cached && cached.expires > Date.now()) {
      return cached.data
    }

    const token = await getAccessToken()

    // Helper to fetch one page
    const fetchPage = async (offset, market, q) => {
      const resp = await axios.get(`https://api.spotify.com/v1/search`, {
        params: {
          q,
          type: 'track',
          limit: 50,
          offset,
          market
        },
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return resp
    }

    const desiredCount = 20
    const offsets = [0] // keep low to avoid rate limit
    const marketsToTry = ['US', 'GB', 'DE'] // small set to reduce calls
    const baseQuery = query.trim()
    const queryVariations = [baseQuery, `track:${baseQuery}`, `artist:${baseQuery}`]

    const previewable = []
    const seen = new Set()
    let requestCount = 0
    const maxRequests = 5

    for (const q of queryVariations) {
      if (requestCount >= maxRequests) break
      for (const market of marketsToTry) {
        if (requestCount >= maxRequests) break
        for (const offset of offsets) {
          if (requestCount >= maxRequests) break
          let resp
          try {
            resp = await fetchPage(offset, market, q)
          } catch (err) {
            const status = err?.response?.status
            if (status === 429) {
              console.log('🔒 Rate limited (429) — stopping further requests for this search')
              requestCount = maxRequests
              break
            }
            // other errors: skip this attempt
            continue
          }
          requestCount++
          console.log('✅ Spotify API response received:', resp)
          const items = resp?.data?.tracks?.items || []
          for (const track of items) {
            if (!track?.preview_url) continue
            if (seen.has(track.id)) continue
            seen.add(track.id)
            previewable.push({
              id: track.id,
              name: track.name,
              artist: track.artists.map(a => a.name).join(', '),
              album: track.album.name,
              albumArt: track.album.images[0]?.url || 'https://via.placeholder.com/300x300/1db954/ffffff?text=No+Image',
              duration: Math.round(track.duration_ms / 1000),
              uri: track.uri,
              previewUrl: track.preview_url,
              externalUrl: track.external_urls.spotify
            })
            if (previewable.length >= desiredCount) break
          }
          if (previewable.length >= desiredCount) break
          const total = resp?.data?.tracks?.total ?? 0
          if (offset + 50 >= total) break
        }
        if (previewable.length >= desiredCount) break
      }
      if (previewable.length >= desiredCount) break
    }

    if (previewable.length === 0) {
      // As a fallback, show generic previewable recommendations so users can still pick two songs
      try {
        const recs = await getPreviewableRecommendations(30, 'US')
        searchCache.set(cacheKey, { data: recs, expires: Date.now() + 60 * 1000 })
        return recs
      } catch {
        searchCache.set(cacheKey, { data: [], expires: Date.now() + 60 * 1000 })
        return []
      }
    }

    console.log('📊 Real Spotify tracks (previewable only):', previewable)
    const limited = previewable.slice(0, desiredCount)
    searchCache.set(cacheKey, { data: limited, expires: Date.now() + 2 * 60 * 1000 })
    return limited
  } catch (error) {
    console.error('❌ Error searching Spotify tracks:', error)
    console.error('❌ Error details:', error.response?.data || error.message)

    if (error.response?.status === 401) {
      // Token expired, try to refresh
      accessToken = null
      tokenExpiry = null
      console.log('🔄 Token expired, will refresh on next request')
    }
    // On error, return empty results to force real Spotify previews only
    return []
  }
}

export const getTrackFeatures = async (trackId) => {
  try {
    const token = await getAccessToken()

    const response = await axios.get(`https://api.spotify.com/v1/audio-features/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    return response.data
  } catch (error) {
    console.error('Error getting track features:', error)
    throw new Error('Failed to get track features')
  }
}

export const getTrackAnalysis = async (trackId) => {
  try {
    const token = await getAccessToken()

    const response = await axios.get(`https://api.spotify.com/v1/audio-analysis/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    return response.data
  } catch (error) {
    console.error('Error getting track analysis:', error)
    throw new Error('Failed to get track analysis')
  }
}

// Fetch a shelf of previewable tracks from Spotify recommendations
const getPreviewableRecommendations = async (limit = 30, market = 'US') => {
  const token = await getAccessToken()
  // Use a small set of broad seed genres to get mainstream content
  const seedGenres = ['pop', 'dance', 'edm', 'rock']
  const resp = await axios.get('https://api.spotify.com/v1/recommendations', {
    params: {
      limit: Math.min(limit, 50),
      market,
      seed_genres: seedGenres.join(',')
    },
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const tracks = (resp?.data?.tracks || [])
    .filter(t => Boolean(t?.preview_url))
    .map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      album: track.album.name,
      albumArt: track.album.images[0]?.url || 'https://via.placeholder.com/300x300/1db954/ffffff?text=No+Image',
      duration: Math.round(track.duration_ms / 1000),
      uri: track.uri,
      previewUrl: track.preview_url,
      externalUrl: track.external_urls.spotify
    }))
  return tracks
}
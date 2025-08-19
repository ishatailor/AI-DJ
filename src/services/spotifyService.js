import axios from 'axios'

// Get these from your Spotify Developer Dashboard
const CLIENT_ID = '8abeecc3dd25435ea2bd3ed92c080c92'
const CLIENT_SECRET = 'd0886806678f4cc8b1eb298e871fffe8'
const REDIRECT_URI = 'http://localhost:3000/callback'

let accessToken = null
let tokenExpiry = null

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
    // For very short queries, return empty results to force real Spotify previews only
    if (!query || query.trim().length < 2) {
      return []
    }

    const token = await getAccessToken()

    // Helper to fetch one page
    const fetchPage = async (offset, market) => {
      const resp = await axios.get(`https://api.spotify.com/v1/search`, {
        params: {
          q: query,
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
    const offsets = [0, 50, 100]
    const marketsToTry = [
      'US','GB','DE','CA','BR','SE','NO','FI','DK','FR','NL','IE','ES','PT','IT','PL','AU','NZ','JP','MX','AR','CL','IN','ID','PH','SG','MY','TH','TR','AE'
    ]
    const baseQuery = query.trim()
    const queryVariations = new Set()
    queryVariations.add(baseQuery)
    queryVariations.add(`track:${baseQuery}`)
    queryVariations.add(`artist:${baseQuery}`)
    if (baseQuery.includes(' ')) {
      const parts = baseQuery.split(/\s+/)
      if (parts.length >= 2) {
        const first = parts[0]
        const rest = parts.slice(1).join(' ')
        queryVariations.add(`artist:${first} track:${rest}`)
        queryVariations.add(`track:${first} artist:${rest}`)
      }
    }
    const previewable = []
    const seen = new Set()

    for (const q of queryVariations) {
      for (const market of marketsToTry) {
        for (const offset of offsets) {
          const resp = await axios.get(`https://api.spotify.com/v1/search`, {
            params: { q, type: 'track', limit: 50, offset, market },
            headers: { 'Authorization': `Bearer ${token}` }
          })
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
      return []
    }

    console.log('📊 Real Spotify tracks (previewable only):', previewable)
    return previewable
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

const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Handle preflight OPTIONS requests
app.options('*', cors())

app.use(express.json())
app.use(express.static('public'))

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

// Mock data for demo purposes
const mockMixes = new Map()

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI DJ Mixer API is running' })
})

app.post('/api/mixes/generate', async (req, res) => {
  try {
    const { song1, song2 } = req.body
    
    if (!song1 || !song2) {
      return res.status(400).json({ error: 'Two songs are required' })
    }

    // Simulate AI mixing process
    const mixId = `mix_${Date.now()}`
    const mix = {
      id: mixId,
      song1,
      song2,
      status: 'generating',
      createdAt: new Date().toISOString()
    }

    mockMixes.set(mixId, mix)

    // Simulate processing time
    setTimeout(() => {
      mix.status = 'completed'
      mix.audioUrl = `/api/mixes/${mixId}/audio`
      mix.waveform = generateMockWaveform()
      mockMixes.set(mixId, mix)
    }, 4000)

    res.json({ 
      mixId, 
      message: 'Mix generation started',
      estimatedTime: '5 seconds'
    })

  } catch (error) {
    console.error('Error generating mix:', error)
    res.status(500).json({ error: 'Failed to generate mix' })
  }
})

app.get('/api/mixes/:mixId', (req, res) => {
  const { mixId } = req.params
  const mix = mockMixes.get(mixId)
  
  if (!mix) {
    return res.status(404).json({ error: 'Mix not found' })
  }
  
  res.json(mix)
})

app.get('/api/mixes/:mixId/audio', (req, res) => {
  const { mixId } = req.params
  const mix = mockMixes.get(mixId)
  
  if (!mix || mix.status !== 'completed') {
    return res.status(404).json({ error: 'Audio not ready' })
  }
  
  // In a real application, this would serve the actual mixed audio file
  // For demo purposes, we'll return a placeholder
  res.json({ 
    message: 'Audio file would be served here',
    mixId,
    audioUrl: `/api/mixes/${mixId}/audio`
  })
})

app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter required' })
    }

    // Expanded mock search results with more songs
    const mockResults = [
      {
        id: '1',
        name: 'Bohemian Rhapsody',
        artist: 'Queen',
        album: 'A Night at the Opera',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Queen',
        duration: 355,
        uri: 'spotify:track:1',
        previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3?id=1'
      },
      {
        id: '2',
        name: 'Hotel California',
        artist: 'Eagles',
        album: 'Hotel California',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Eagles',
        duration: 391,
        uri: 'spotify:track:2',
        previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3?id=2'
      },
      {
        id: '3',
        name: 'Stairway to Heaven',
        artist: 'Led Zeppelin',
        album: 'Led Zeppelin IV',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Led+Zeppelin',
        duration: 482,
        uri: 'spotify:track:3',
        previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3?id=3'
      },
      {
        id: '4',
        name: 'Imagine',
        artist: 'John Lennon',
        album: 'Imagine',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=John+Lennon',
        duration: 183,
        uri: 'spotify:track:4',
        previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3?id=4'
      },
      {
        id: '5',
        name: 'Hey Jude',
        artist: 'The Beatles',
        album: 'The Beatles 1967-1970',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=The+Beatles',
        duration: 431,
        uri: 'spotify:track:5',
        previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3?id=5'
      },
      {
        id: '6',
        name: 'Smells Like Teen Spirit',
        artist: 'Nirvana',
        album: 'Nevermind',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Nirvana',
        duration: 301,
        uri: 'spotify:track:6',
        previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3?id=6'
      },
      {
        id: '7',
        name: 'Like a Rolling Stone',
        artist: 'Bob Dylan',
        album: 'Highway 61 Revisited',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Bob+Dylan',
        duration: 371,
        uri: 'spotify:track:7',
        previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3?id=7'
      },
      {
        id: '8',
        name: 'I Can\'t Get No Satisfaction',
        artist: 'The Rolling Stones',
        album: 'Out of Our Heads',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Rolling+Stones',
        duration: 224,
        uri: 'spotify:track:8',
        previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3?id=8'
      },
      {
        id: '9',
        name: 'Yesterday',
        artist: 'The Beatles',
        album: 'Help!',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=The+Beatles',
        duration: 125,
        uri: 'spotify:track:9',
        previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3?id=9'
      },
      {
        id: '10',
        name: 'Good Vibrations',
        artist: 'The Beach Boys',
        album: 'Smiley Smile',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Beach+Boys',
        duration: 216,
        uri: 'spotify:track:10',
        previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3?id=10'
      },
      {
        id: '11',
        name: 'Johnny B. Goode',
        artist: 'Chuck Berry',
        album: 'Chuck Berry Is on Top',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Chuck+Berry',
        duration: 163,
        uri: 'spotify:track:11',
        previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3?id=11'
      },
      {
        id: '12',
        name: 'What\'s Going On',
        artist: 'Marvin Gaye',
        album: 'What\'s Going On',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Marvin+Gaye',
        duration: 234,
        uri: 'spotify:track:12',
        previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3?id=12'
      },
      {
        id: '13',
        name: 'My Generation',
        artist: 'The Who',
        album: 'My Generation',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=The+Who',
        duration: 224,
        uri: 'spotify:track:13',
        previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3?id=13'
      },
      {
        id: '14',
        name: 'A Change Is Gonna Come',
        artist: 'Sam Cooke',
        album: 'Ain\'t That Good News',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Sam+Cooke',
        duration: 193,
        uri: 'spotify:track:14',
        previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3?id=14'
      },
      {
        id: '15',
        name: 'Respect',
        artist: 'Aretha Franklin',
        album: 'I Never Loved a Man the Way I Love You',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Aretha+Franklin',
        duration: 147,
        uri: 'spotify:track:15',
        previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3?id=15'
      }
    ].filter(track => 
      (track.name.toLowerCase().includes(q.toLowerCase()) ||
      track.artist.toLowerCase().includes(q.toLowerCase()) ||
      track.album.toLowerCase().includes(q.toLowerCase())) &&
      Boolean(track.previewUrl)
    )

    // Limit results to 20 for performance
    const limitedResults = mockResults.slice(0, 20)

    res.json(limitedResults)

  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: 'Search failed' })
  }
})

app.get('/api/tracks/:trackId/features', async (req, res) => {
  try {
    const { trackId } = req.params
    
    // Mock audio features
    const features = {
      danceability: 0.7 + Math.random() * 0.3,
      energy: 0.6 + Math.random() * 0.4,
      key: Math.floor(Math.random() * 12),
      loudness: -20 + Math.random() * 20,
      mode: Math.random() > 0.5 ? 1 : 0,
      speechiness: Math.random() * 0.1,
      acousticness: Math.random() * 0.3,
      instrumentalness: Math.random() * 0.5,
      liveness: Math.random() * 0.2,
      valence: Math.random(),
      tempo: 80 + Math.random() * 100, // BPM between 80-180
      duration_ms: (3 + Math.random() * 4) * 60 * 1000, // 3-7 minutes
      time_signature: 4
    }
    
    res.json(features)

  } catch (error) {
    console.error('Error getting track features:', error)
    res.status(500).json({ error: 'Failed to get track features' })
  }
})

// --- Spotify library (previewable tracks) ---
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '8abeecc3dd25435ea2bd3ed92c080c92'
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || 'd0886806678f4cc8b1eb298e871fffe8'

async function getSpotifyToken() {
  try {
    console.log('🔑 Getting Spotify token...')
    console.log('Client ID:', SPOTIFY_CLIENT_ID.substring(0, 10) + '...')
    
    const resp = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
      },
      body: 'grant_type=client_credentials'
    })
    
    console.log('Spotify auth response status:', resp.status)
    
    if (!resp.ok) {
      const errorText = await resp.text()
      console.error('Spotify auth error response:', errorText)
      throw new Error(`Spotify auth failed: ${resp.status} - ${errorText}`)
    }
    
    const json = await resp.json()
    console.log('✅ Spotify token obtained successfully')
    return json.access_token
  } catch (error) {
    console.error('❌ Spotify token error:', error.message)
    throw error
  }
}

async function fetchRecommendations(token, { limit = 50, market = 'US', seedGenres, seedArtists } = {}) {
  const params = new URLSearchParams({
    limit: String(Math.min(limit, 50)),
    market
  })
  if (seedArtists && seedArtists.length) {
    params.set('seed_artists', seedArtists.join(','))
  } else if (seedGenres && seedGenres.length) {
    params.set('seed_genres', seedGenres.join(','))
  } else {
    params.set('seed_genres', ['pop','dance','edm','rock'].join(','))
  }
  const resp = await fetch(`https://api.spotify.com/v1/recommendations?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!resp.ok) {
    throw new Error(`Spotify recommendations failed: ${resp.status}`)
  }
  const json = await resp.json()
  const items = Array.isArray(json.tracks) ? json.tracks : []
  return items.filter(t => t?.preview_url).map(track => ({
    id: track.id,
    name: track.name,
    artist: track.artists.map(a => a.name).join(', '),
    album: track.album.name,
    albumArt: track.album.images?.[0]?.url || 'https://via.placeholder.com/300x300/1db954/ffffff?text=No+Image',
    duration: Math.round((track.duration_ms || 0) / 1000),
    uri: track.uri,
    previewUrl: track.preview_url,
    externalUrl: track.external_urls?.spotify
  }))
}

async function fetchSearchPreviewables(token, { q, limit = 50, market = 'US', offset = 0 } = {}) {
  try {
    const params = new URLSearchParams({ q, type: 'track', limit: String(Math.min(limit, 50)), market, offset: String(offset) })
    const resp = await fetch(`https://api.spotify.com/v1/search?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (!resp.ok) {
      if (resp.status === 429) {
        throw new Error('Rate limited - please wait before trying again')
      }
      throw new Error(`Spotify search failed: ${resp.status}`)
    }
    
    const json = await resp.json()
    const items = json?.tracks?.items || []
    
    console.log(`Found ${items.length} total tracks for query "${q}"`)
    
    // Return ALL tracks, not just ones with preview URLs
    // We'll handle the mixing differently
    return items.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      album: track.album.name,
      albumArt: track.album.images?.[0]?.url || 'https://via.placeholder.com/300x300/1db954/ffffff?text=No+Image',
      duration: Math.round((track.duration_ms || 0) / 1000),
      uri: track.uri,
      previewUrl: track.preview_url || null, // May be null
      externalUrl: track.external_urls?.spotify,
      // Add audio features for better mixing
      hasPreview: !!track.preview_url
    }))
  } catch (error) {
    console.error('Search error:', error.message)
    throw error
  }
}

// Real-time Spotify track search for mixing
app.get('/api/spotify/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' })
    }
    
    console.log(`🔍 Starting Spotify search for: "${q}"`)
    
    // Try to get Spotify token
    let token
    try {
      token = await getSpotifyToken()
      console.log(`✅ Got Spotify token: ${token.substring(0, 20)}...`)
    } catch (tokenError) {
      console.error('❌ Spotify token failed:', tokenError.message)
      return res.status(500).json({ 
        error: 'Spotify API not available. Please try again later.',
        details: 'Unable to authenticate with Spotify'
      })
    }
    
    const results = await fetchSearchPreviewables(token, { 
      q: q.trim(), 
      limit: Math.min(parseInt(limit), 50),
      market: 'US'
    })
    
    console.log(`🔍 Spotify search for "${q}" returned ${results.length} tracks with previews`)
    
    // Filter to only show tracks with preview URLs
    const tracksWithPreviews = results.filter(track => track.previewUrl && track.previewUrl.trim() !== '')
    
    res.json({
      query: q,
      tracks: tracksWithPreviews,
      count: tracksWithPreviews.length,
      totalFound: results.length,
      withPreviews: tracksWithPreviews.length
    })
    
  } catch (error) {
    console.error('Spotify search error:', error.message)
    if (error.message.includes('Rate limited')) {
      res.status(429).json({ 
        error: 'Spotify API rate limited. Please wait a moment and try again.',
        retryAfter: 30
      })
    } else {
      res.status(500).json({ error: `Search failed: ${error.message}` })
    }
  }
})

app.get('/api/library', async (req, res) => {
  try {
    const totalLimit = Math.min(parseInt(req.query.limit || '120', 10), 200)
    const token = await getSpotifyToken()
    const envMarkets = (process.env.SPOTIFY_MARKETS || process.env.SPOTIFY_MARKET || 'US,GB,DE').split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
    const markets = envMarkets.length ? envMarkets : ['US','GB','DE']
    const seen = new Set()
    const library = []
    
    // Use more targeted queries that are likely to have preview URLs
    const queries = ['the beatles', 'queen', 'michael jackson', 'madonna', 'elvis presley', 'frank sinatra', 'bob dylan', 'jimi hendrix', 'led zeppelin', 'pink floyd']
    const offsets = [0, 20] // Reduced to avoid rate limiting
    
    for (const market of markets) {
      for (const q of queries) {
        for (const offset of offsets) {
          try {
            console.log(`🔍 Searching for "${q}" in ${market} (offset: ${offset})`)
            const results = await fetchSearchPreviewables(token, { q, limit: 20, market, offset })
            console.log(`✅ Found ${results.length} tracks for "${q}"`)
            
            // Filter to only include tracks with preview URLs
            const tracksWithPreviews = results.filter(track => track.previewUrl && track.previewUrl.trim() !== '')
            console.log(`🎵 ${tracksWithPreviews.length} tracks have preview URLs`)
            
            for (const t of tracksWithPreviews) {
              if (seen.has(t.id)) continue
              seen.add(t.id)
              library.push(t)
              if (library.length >= totalLimit) break
            }
          } catch (e) {
            console.warn(`Search failed for "${q}":`, e.message)
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
          if (library.length >= totalLimit) break
        }
        if (library.length >= totalLimit) break
      }
      if (library.length >= totalLimit) break
    }
    
    if (library.length === 0) {
      console.log('⚠️ No Spotify tracks found, using fallback library')
      // Server-side static fallback from public or dist
      try {
        const publicPath = path.join(__dirname, '..', 'public', 'library.json')
        const distPath = path.join(__dirname, '..', 'dist', 'library.json')
        const filePath = fs.existsSync(publicPath) ? publicPath : (fs.existsSync(distPath) ? distPath : null)
        if (filePath) {
          const raw = fs.readFileSync(filePath, 'utf-8')
          const json = JSON.parse(raw)
          return res.json(Array.isArray(json) ? json : [])
        }
      } catch (e) {
        console.warn('Static library fallback failed:', e.message)
      }
    }
    
    console.log(`🎵 Library built successfully with ${library.length} tracks`)
    res.json(library)
  } catch (e) {
    console.error('Library error:', e?.message || e)
    // Best-effort static fallback even on errors
    try {
      const publicPath = path.join(__dirname, '..', 'public', 'library.json')
      const distPath = path.join(__dirname, '..', 'dist', 'library.json')
      const filePath = fs.existsSync(publicPath) ? publicPath : (fs.existsSync(distPath) ? distPath : null)
      if (filePath) {
        const raw = fs.readFileSync(filePath, 'utf-8')
        const json = JSON.parse(raw)
        return res.json(Array.isArray(json) ? json : [])
      }
    } catch {}
    res.status(500).json({ error: 'Failed to build library' })
  }
})

// --- Spotify Premium User Authentication ---
// Use localhost for development - you can change this in your Spotify app settings
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000'
const SPOTIFY_SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'user-read-recently-played',
  'user-read-playback-position',
  'user-top-read',
  'playlist-read-private',
  'playlist-read-collaborative'
].join(' ')

// Store user tokens (in production, use a proper database)
const userTokens = new Map()

// Spotify Premium user authentication endpoints
app.get('/api/spotify/auth', (req, res) => {
  const state = Math.random().toString(36).substring(7)
  const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: SPOTIFY_SCOPES,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state: state
  })}`
  
  console.log('🔐 Spotify auth URL generated:', authUrl)
  res.json({ authUrl, state })
})

app.get('/api/spotify/callback', async (req, res) => {
  const { code, state } = req.query
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' })
  }
  
  try {
    console.log('🔄 Processing Spotify callback with code:', code.substring(0, 10) + '...')
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: SPOTIFY_REDIRECT_URI
      })
    })
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ Token exchange failed:', tokenResponse.status, errorText)
      throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`)
    }
    
    const tokenData = await tokenResponse.json()
    console.log('✅ Token exchange successful, getting user ID...')
    
    const userId = await getSpotifyUserId(tokenData.access_token)
    console.log('✅ User ID obtained:', userId)
    
    // Store user tokens
    userTokens.set(userId, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000)
    })
    
    console.log('✅ User tokens stored, redirecting to frontend...')
    
    // Redirect back to frontend with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?auth-success=true&userId=${userId}`)
    
  } catch (error) {
    console.error('❌ Spotify callback error:', error)
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?auth-error=${encodeURIComponent(error.message)}`)
  }
})

app.get('/api/spotify/user-tracks', async (req, res) => {
  const { userId } = req.query
  
  if (!userId || !userTokens.has(userId)) {
    return res.status(401).json({ error: 'User not authenticated' })
  }
  
  try {
    console.log('🎵 Fetching user tracks for userId:', userId)
    
    const userToken = userTokens.get(userId)
    if (Date.now() > userToken.expires_at) {
      console.log('🔄 Token expired, refreshing...')
      // Token expired, refresh it
      const newToken = await refreshUserToken(userId, userToken.refresh_token)
      userTokens.set(userId, newToken)
    }
    
    console.log('✅ Token valid, fetching user tracks...')
    const tracks = await fetchUserTracks(userTokens.get(userId).access_token)
    console.log(`🎵 Successfully fetched ${tracks.length} user tracks`)
    
    res.json({ tracks, count: tracks.length })
    
  } catch (error) {
    console.error('❌ Error fetching user tracks:', error)
    res.status(500).json({ error: 'Failed to fetch user tracks' })
  }
})

app.get('/api/spotify/stream/:trackId', async (req, res) => {
  const { trackId } = req.params
  const { userId } = req.query
  
  if (!userId || !userTokens.has(userId)) {
    return res.status(401).json({ error: 'User not authenticated' })
  }
  
  try {
    const userToken = userTokens.get(userId)
    if (Date.now() > userToken.expires_at) {
      const newToken = await refreshUserToken(userId, userToken.refresh_token)
      userTokens.set(userId, newToken)
    }
    
    // Get track streaming URL (this requires Premium)
    const streamUrl = await getTrackStreamUrl(trackId, userTokens.get(userId).access_token)
    res.json({ streamUrl, trackId })
    
  } catch (error) {
    console.error('Error getting stream URL:', error)
    res.status(500).json({ error: 'Failed to get stream URL' })
  }
})

// Generate mix from user's Spotify Premium tracks
app.post('/api/spotify/generate-mix', async (req, res) => {
  const { userId, track1Id, track2Id } = req.body
  
  if (!userId || !userTokens.has(userId)) {
    return res.status(401).json({ error: 'User not authenticated' })
  }
  
  if (!track1Id || !track2Id) {
    return res.status(400).json({ error: 'Two track IDs are required' })
  }
  
  try {
    console.log('🎵 Generating mix for user:', userId, 'with tracks:', track1Id, track2Id)
    
    const userToken = userTokens.get(userId)
    if (Date.now() > userToken.expires_at) {
      const newToken = await refreshUserToken(userId, userToken.refresh_token)
      userTokens.set(userId, newToken)
    }
    
    // Get track details
    const [track1, track2] = await Promise.all([
      getTrackDetails(track1Id, userTokens.get(userId).access_token),
      getTrackDetails(track2Id, userTokens.get(userId).access_token)
    ])
    
    // Create a mock mix (in real app, this would generate actual audio)
    const mixId = `premium_mix_${Date.now()}`
    const mix = {
      id: mixId,
      name: `${track1.name} + ${track2.name}`,
      tracks: [track1, track2],
      generatedAt: new Date().toISOString(),
      status: 'ready',
      // Mock audio URL - in real app, this would be generated audio
      audioUrl: `/api/mixes/${mixId}/audio`,
      duration: 30,
      compatibility: {
        score: Math.floor(Math.random() * 40) + 60,
        bpmScore: Math.floor(Math.random() * 30) + 70,
        keyScore: Math.floor(Math.random() * 30) + 70
      }
    }
    
    console.log('✅ Premium mix generated:', mix.name)
    res.json(mix)
    
  } catch (error) {
    console.error('❌ Error generating premium mix:', error)
    res.status(500).json({ error: 'Failed to generate mix' })
  }
})

// Helper functions for Premium authentication
async function getSpotifyUserId(accessToken) {
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })
  
  if (!response.ok) {
    throw new Error('Failed to get user profile')
  }
  
  const userData = await response.json()
  return userData.id
}

async function refreshUserToken(userId, refreshToken) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to refresh token')
  }
  
  const tokenData = await response.json()
  return {
    access_token: tokenData.access_token,
    refresh_token: refreshToken,
    expires_at: Date.now() + (tokenData.expires_in * 1000)
  }
}

async function fetchUserTracks(accessToken) {
  const tracks = []
  let offset = 0
  const limit = 50
  
  try {
    console.log('🔍 Fetching user tracks from Spotify...')
    
    while (true) {
      const response = await fetch(`https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Failed to fetch user tracks:', response.status, errorText)
        throw new Error(`Failed to fetch user tracks: ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`📊 Fetched ${data.items.length} tracks (offset: ${offset})`)
      
      const userTracks = data.items.map(item => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists.map(a => a.name).join(', '),
        album: item.track.album.name,
        albumArt: item.track.album.images?.[0]?.url || 'https://via.placeholder.com/300x300/1db954/ffffff?text=No+Image',
        duration: Math.round((item.track.duration_ms || 0) / 1000),
        uri: item.track.uri,
        externalUrl: item.track.external_urls?.spotify,
        // Premium tracks have full streaming access
        hasPremiumStream: true,
        previewUrl: item.track.preview_url, // Fallback to preview if available
        // Add mock audio features for mixing (in real app, fetch these from Spotify)
        bpm: Math.floor(Math.random() * 60) + 80, // Random BPM for demo
        key: ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab'][Math.floor(Math.random() * 12)],
        energy: Math.random() * 0.5 + 0.5,
        danceability: Math.random() * 0.5 + 0.5
      }))
      
      tracks.push(...userTracks)
      
      if (data.items.length < limit) break
      offset += limit
      
      // Limit to first 100 tracks to avoid timeouts
      if (offset >= 100) break
    }
    
    console.log(`✅ Successfully fetched ${tracks.length} user tracks`)
    return tracks
    
  } catch (error) {
    console.error('❌ Error in fetchUserTracks:', error)
    throw error
  }
}

async function getTrackStreamUrl(trackId, accessToken) {
  // For Premium users, we can get the actual track data
  // Note: Spotify doesn't provide direct streaming URLs, but we can use the track URI
  // and let the Spotify Web Playback SDK handle the actual streaming
  
  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })
  
  if (!response.ok) {
    throw new Error('Failed to get track info')
  }
  
  return await getTrackDetails(trackId, accessToken)
}

async function getTrackDetails(trackId, accessToken) {
  try {
    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to get track info: ${response.status}`)
    }
    
    const trackData = await response.json()
    
    return {
      id: trackData.id,
      name: trackData.name,
      artist: trackData.artists.map(a => a.name).join(', '),
      album: trackData.album.name,
      albumArt: trackData.album.images?.[0]?.url || 'https://via.placeholder.com/300x300/1db954/ffffff?text=No+Image',
      duration: Math.round((trackData.duration_ms || 0) / 1000),
      uri: trackData.uri,
      externalUrl: trackData.external_urls?.spotify,
      // Premium tracks have full streaming access
      hasPremiumStream: true,
      previewUrl: trackData.preview_url, // Fallback to preview if available
      // Mock audio features for mixing (in real app, fetch these from Spotify)
      bpm: Math.floor(Math.random() * 60) + 80,
      key: ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab'][Math.floor(Math.random() * 12)],
      energy: Math.random() * 0.5 + 0.5,
      danceability: Math.random() * 0.5 + 0.5
    }
  } catch (error) {
    console.error('❌ Error getting track details:', error)
    throw error
  }
}

// Simple proxy to fetch remote audio with permissive CORS for decoding/mixing
app.get('/api/proxy', async (req, res) => {
  try {
    const targetUrl = req.query.url
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing url parameter' })
    }

    const upstream = await fetch(targetUrl)
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Upstream error ${upstream.status}` })
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Content-Type', contentType)
    res.set('Cache-Control', 'no-cache')

    const buffer = Buffer.from(await upstream.arrayBuffer())
    res.send(buffer)
  } catch (err) {
    console.error('Proxy error:', err)
    res.status(500).json({ error: 'Proxy failed' })
  }
})

function generateMockWaveform() {
  const waveform = []
  const duration = 300 // 5 minutes in seconds
  
  for (let i = 0; i < duration * 10; i++) { // 10 points per second
    const time = i * 0.1
    const amplitude = Math.sin(time * 0.5) * 0.5 + 0.5
    waveform.push({
      time: time,
      amplitude: amplitude
    })
  }
  
  return waveform
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`🚀 AI DJ Mixer server running on port ${PORT}`)
  console.log(`📱 Frontend should be running on http://localhost:3000`)
  console.log(`🔗 API available at http://localhost:${PORT}/api`)
})
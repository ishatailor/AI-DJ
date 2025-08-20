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
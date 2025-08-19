const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
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
        previewUrl: null
      },
      {
        id: '2',
        name: 'Hotel California',
        artist: 'Eagles',
        album: 'Hotel California',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Eagles',
        duration: 391,
        uri: 'spotify:track:2',
        previewUrl: null
      },
      {
        id: '3',
        name: 'Stairway to Heaven',
        artist: 'Led Zeppelin',
        album: 'Led Zeppelin IV',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Led+Zeppelin',
        duration: 482,
        uri: 'spotify:track:3',
        previewUrl: null
      },
      {
        id: '4',
        name: 'Imagine',
        artist: 'John Lennon',
        album: 'Imagine',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=John+Lennon',
        duration: 183,
        uri: 'spotify:track:4',
        previewUrl: null
      },
      {
        id: '5',
        name: 'Hey Jude',
        artist: 'The Beatles',
        album: 'The Beatles 1967-1970',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=The+Beatles',
        duration: 431,
        uri: 'spotify:track:5',
        previewUrl: null
      },
      {
        id: '6',
        name: 'Smells Like Teen Spirit',
        artist: 'Nirvana',
        album: 'Nevermind',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Nirvana',
        duration: 301,
        uri: 'spotify:track:6',
        previewUrl: null
      },
      {
        id: '7',
        name: 'Like a Rolling Stone',
        artist: 'Bob Dylan',
        album: 'Highway 61 Revisited',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Bob+Dylan',
        duration: 371,
        uri: 'spotify:track:7',
        previewUrl: null
      },
      {
        id: '8',
        name: 'I Can\'t Get No Satisfaction',
        artist: 'The Rolling Stones',
        album: 'Out of Our Heads',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Rolling+Stones',
        duration: 224,
        uri: 'spotify:track:8',
        previewUrl: null
      },
      {
        id: '9',
        name: 'Yesterday',
        artist: 'The Beatles',
        album: 'Help!',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=The+Beatles',
        duration: 125,
        uri: 'spotify:track:9',
        previewUrl: null
      },
      {
        id: '10',
        name: 'Good Vibrations',
        artist: 'The Beach Boys',
        album: 'Smiley Smile',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Beach+Boys',
        duration: 216,
        uri: 'spotify:track:10',
        previewUrl: null
      },
      {
        id: '11',
        name: 'Johnny B. Goode',
        artist: 'Chuck Berry',
        album: 'Chuck Berry Is on Top',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Chuck+Berry',
        duration: 163,
        uri: 'spotify:track:11',
        previewUrl: null
      },
      {
        id: '12',
        name: 'What\'s Going On',
        artist: 'Marvin Gaye',
        album: 'What\'s Going On',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Marvin+Gaye',
        duration: 234,
        uri: 'spotify:track:12',
        previewUrl: null
      },
      {
        id: '13',
        name: 'My Generation',
        artist: 'The Who',
        album: 'My Generation',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=The+Who',
        duration: 224,
        uri: 'spotify:track:13',
        previewUrl: null
      },
      {
        id: '14',
        name: 'A Change Is Gonna Come',
        artist: 'Sam Cooke',
        album: 'Ain\'t That Good News',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Sam+Cooke',
        duration: 193,
        uri: 'spotify:track:14',
        previewUrl: null
      },
      {
        id: '15',
        name: 'Respect',
        artist: 'Aretha Franklin',
        album: 'I Never Loved a Man the Way I Love You',
        albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Aretha+Franklin',
        duration: 147,
        uri: 'spotify:track:15',
        previewUrl: null
      }
    ].filter(track => 
      track.name.toLowerCase().includes(q.toLowerCase()) ||
      track.artist.toLowerCase().includes(q.toLowerCase()) ||
      track.album.toLowerCase().includes(q.toLowerCase())
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
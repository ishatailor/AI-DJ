const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
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
    }, 5000)

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

    // Mock search results
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
      }
    ].filter(track => 
      track.name.toLowerCase().includes(q.toLowerCase()) ||
      track.artist.toLowerCase().includes(q.toLowerCase()) ||
      track.album.toLowerCase().includes(q.toLowerCase())
    )

    res.json(mockResults)

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
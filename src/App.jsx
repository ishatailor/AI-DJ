import React, { useState, useEffect } from 'react'
import SearchSection from './components/SearchSection'
import LoadingSection from './components/LoadingSection'
import MixPlayer from './components/MixPlayer'
import { generateMix } from './services/mixService'
import { searchSpotifyTracks } from './services/spotifyService'

function App() {
  const [selectedSongs, setSelectedSongs] = useState([null, null])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedMix, setGeneratedMix] = useState(null)
  const [error, setError] = useState(null)
  const [testResults, setTestResults] = useState(null)

  const handleSongSelect = (songIndex, song) => {
    const newSelectedSongs = [...selectedSongs]
    newSelectedSongs[songIndex] = song
    setSelectedSongs(newSelectedSongs)
  }

  const handleGenerateMix = async () => {
    if (!selectedSongs[0] || !selectedSongs[1]) {
      setError('Please select two songs first')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)
    setError(null)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      const mix = await generateMix(selectedSongs[0], selectedSongs[1])
      
      clearInterval(progressInterval)
      setGenerationProgress(100)
      
      setTimeout(() => {
        setIsGenerating(false)
        setGeneratedMix(mix)
      }, 500)

    } catch (err) {
      setError(err.message)
      setIsGenerating(false)
    }
  }

  const testSearch = async () => {
    try {
      console.log('🧪 Testing search functionality...')
      const results = await searchSpotifyTracks('bohemian')
      console.log('🧪 Test search results:', results)
      setTestResults(results)
    } catch (error) {
      console.error('🧪 Test search failed:', error)
      setTestResults({ error: error.message })
    }
  }

  const canGenerate = selectedSongs[0] && selectedSongs[1] && !isGenerating

  return (
    <div className="container">
      <div className="header">
        <h1>AI DJ Mixer</h1>
        <p>Create amazing mixes from your favorite Spotify tracks</p>
      </div>

      {/* Test Section */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.1)', 
        padding: '1rem', 
        borderRadius: '12px', 
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        <button 
          onClick={testSearch}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          🧪 Test Search API
        </button>
        
        {testResults && (
          <div style={{ textAlign: 'left' }}>
            <h4>Test Results:</h4>
            <pre style={{ 
              background: 'rgba(0, 0, 0, 0.3)', 
              padding: '1rem', 
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.9rem'
            }}>
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <SearchSection 
        selectedSongs={selectedSongs}
        onSongSelect={handleSongSelect}
      />

      <button 
        className="generate-btn"
        onClick={handleGenerateMix}
        disabled={!canGenerate}
      >
        {isGenerating ? 'Generating Mix...' : 'Generate Mix'}
      </button>

      {error && (
        <div style={{ 
          textAlign: 'center', 
          color: '#ff6b6b', 
          margin: '1rem 0',
          padding: '1rem',
          background: 'rgba(255, 107, 107, 0.1)',
          borderRadius: '12px'
        }}>
          {error}
        </div>
      )}

      {isGenerating && (
        <LoadingSection progress={generationProgress} />
      )}

      {generatedMix && (
        <MixPlayer mix={generatedMix} />
      )}
    </div>
  )
}

export default App
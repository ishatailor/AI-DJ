import React, { useState } from 'react'
import LibrarySection from './components/SearchSection'
import LoadingSection from './components/LoadingSection'
import MixPlayer from './components/MixPlayer'
import { generateMix } from './services/mixService'

function App() {
  const [selectedSongs, setSelectedSongs] = useState([null, null])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedMix, setGeneratedMix] = useState(null)
  const [error, setError] = useState(null)

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

  const canGenerate = selectedSongs[0] && selectedSongs[1] && !isGenerating

  return (
    <div className="container">
      <div className="header">
        <h1>AI DJ Mixer</h1>
        <p>Create amazing mixes from previewable Spotify tracks</p>
      </div>

      <LibrarySection 
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
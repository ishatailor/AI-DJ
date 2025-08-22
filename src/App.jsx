import React, { useState, useEffect } from 'react'
import FileUploadSection from './components/FileUploadSection'
import LoadingSection from './components/LoadingSection'
import MixPlayer from './components/MixPlayer'
import LocalAudioMixer from './services/localMixService'

function App() {
  const [uploadedTracks, setUploadedTracks] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedMix, setGeneratedMix] = useState(null)
  const [error, setError] = useState(null)
  const [audioMixer, setAudioMixer] = useState(null)

  useEffect(() => {
    // Initialize the audio mixer when component mounts
    const initMixer = async () => {
      const mixer = new LocalAudioMixer()
      const success = await mixer.initialize()
      if (success) {
        setAudioMixer(mixer)
      } else {
        setError('Failed to initialize audio mixer')
      }
    }

    initMixer()

    // Cleanup on unmount
    return () => {
      if (audioMixer) {
        audioMixer.dispose()
      }
    }
  }, [])

  const handleTracksSelected = (tracks) => {
    setUploadedTracks(tracks || [])
    setError(null)
  }

  const handleError = (errorMessage) => {
    setError(errorMessage)
  }

  const handleGenerateMix = async () => {
    if (uploadedTracks.length !== 2 || !audioMixer) {
      setError('Please upload two audio files and ensure audio mixer is ready')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)
    setError(null)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 300)

      // Generate the mix using local audio files
      const mix = await audioMixer.generateMix(uploadedTracks[0], uploadedTracks[1])

      clearInterval(progressInterval)
      setGenerationProgress(100)
      
      setTimeout(() => {
        setIsGenerating(false)
        setGeneratedMix(mix)
      }, 500)

    } catch (err) {
      console.error('Mix generation error:', err)
      setError(err.message || 'Failed to generate mix')
      setIsGenerating(false)
    }
  }

  const canGenerate = uploadedTracks.length === 2 && !isGenerating && audioMixer

  return (
    <div className="container">
      <div className="header">
        <h1>🎵 Local AI DJ Mixer</h1>
        <p>Upload your own audio files and create amazing DJ mixes</p>
      </div>

      <FileUploadSection 
        onTracksSelected={handleTracksSelected}
        onError={handleError}
      />

      {uploadedTracks.length === 2 && (
        <div className="mix-controls">
          <button 
            className="generate-btn"
            onClick={handleGenerateMix}
            disabled={!canGenerate}
          >
            {isGenerating ? '🎬 Generating Mix...' : '🎵 Generate Mix'}
          </button>
          
          <div className="track-info-display">
            <h3>Selected Tracks:</h3>
            <div className="track-pair">
              <div className="track-card">
                <span className="track-number">1</span>
                <div className="track-details">
                  <strong>{uploadedTracks[0]?.name}</strong>
                  <small>BPM: {uploadedTracks[0]?.tempo} | Key: {uploadedTracks[0]?.key}</small>
                </div>
              </div>
              <div className="track-card">
                <span className="track-number">2</span>
                <div className="track-details">
                  <strong>{uploadedTracks[1]?.name}</strong>
                  <small>BPM: {uploadedTracks[1]?.tempo} | Key: {uploadedTracks[1]?.key}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
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
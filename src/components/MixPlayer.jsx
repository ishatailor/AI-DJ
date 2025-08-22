import React, { useState, useRef, useEffect } from 'react'
import './MixPlayer.css'

const MixPlayer = ({ mix }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [showWaveform, setShowWaveform] = useState(false)
  const audioRef = useRef(null)
  const audioContextRef = useRef(null)
  const sourceRef = useRef(null)

  useEffect(() => {
    if (mix && mix.audioBuffer) {
      // Initialize audio context for local playback
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      
      // Create audio source from the rendered buffer
      sourceRef.current = audioContextRef.current.createBufferSource()
      sourceRef.current.buffer = mix.audioBuffer
      
      // Create gain node for volume control
      const gainNode = audioContextRef.current.createGain()
      gainNode.gain.value = volume
      
      // Connect the audio chain
      sourceRef.current.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)
      
      // Set up time update
      const updateTime = () => {
        if (sourceRef.current && audioContextRef.current) {
          const elapsed = audioContextRef.current.currentTime - (sourceRef.current.startTime || 0)
          if (elapsed >= 0 && elapsed <= mix.duration) {
            setCurrentTime(elapsed)
          }
        }
      }
      
      const timeInterval = setInterval(updateTime, 100)
      
      return () => {
        clearInterval(timeInterval)
        if (audioContextRef.current) {
          audioContextRef.current.close()
        }
      }
    }
  }, [mix])

  const togglePlay = () => {
    if (!sourceRef.current || !audioContextRef.current) return

    if (isPlaying) {
      // Stop playback
      try {
        sourceRef.current.stop()
        setIsPlaying(false)
      } catch (error) {
        console.log('Audio already stopped')
      }
    } else {
      // Start playback
      try {
        sourceRef.current = audioContextRef.current.createBufferSource()
        sourceRef.current.buffer = mix.audioBuffer
        
        const gainNode = audioContextRef.current.createGain()
        gainNode.gain.value = volume
        
        sourceRef.current.connect(gainNode)
        gainNode.connect(audioContextRef.current.destination)
        
        sourceRef.current.startTime = audioContextRef.current.currentTime
        sourceRef.current.start(0)
        
        setIsPlaying(true)
        
        // Auto-stop when mix ends
        sourceRef.current.onended = () => {
          setIsPlaying(false)
          setCurrentTime(0)
        }
      } catch (error) {
        console.error('Error starting playback:', error)
      }
    }
  }

  const handleSeek = (e) => {
    if (!sourceRef.current || !audioContextRef.current) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const seekPercent = clickX / rect.width
    const seekTime = seekPercent * mix.duration
    
    // Stop current playback and restart at new position
    try {
      sourceRef.current.stop()
      
      sourceRef.current = audioContextRef.current.createBufferSource()
      sourceRef.current.buffer = mix.audioBuffer
      
      const gainNode = audioContextRef.current.createGain()
      gainNode.gain.value = volume
      
      sourceRef.current.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)
      
      sourceRef.current.startTime = audioContextRef.current.currentTime - seekTime
      sourceRef.current.start(0)
      
      setCurrentTime(seekTime)
      setIsPlaying(true)
      
      sourceRef.current.onended = () => {
        setIsPlaying(false)
        setCurrentTime(0)
      }
    } catch (error) {
      console.error('Error seeking:', error)
    }
  }

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCompatibilityText = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Moderate'
    return 'Challenging'
  }

  if (!mix) {
    return <div className="mix-player">No mix available</div>
  }

  return (
    <div className="mix-player">
      <div className="mix-header">
        <h3>🎵 Your Generated Mix</h3>
        <p>Duration: {formatTime(mix.duration)} | Sample Rate: {mix.sampleRate}Hz</p>
      </div>

      {/* Mix Analysis */}
      {mix.analysis && (
        <div className="mix-analysis">
          <h4>🎛️ Mix Analysis</h4>
          <div className="analysis-grid">
            <div className="analysis-item">
              <span className="analysis-label">Compatibility Score</span>
              <span className="analysis-value">{mix.analysis.compatibilityScore}%</span>
            </div>
            <div className="analysis-item">
              <span className="analysis-label">BPM Difference</span>
              <span className="analysis-value">{mix.analysis.bpmDifference.toFixed(1)}</span>
            </div>
            <div className="analysis-item">
              <span className="analysis-label">Key Compatibility</span>
              <span className="analysis-value">{mix.analysis.keyCompatibility}</span>
            </div>
            <div className="analysis-item">
              <span className="analysis-label">Energy Balance</span>
              <span className="analysis-value">{mix.analysis.energyBalance.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Mix Structure */}
      {mix.mixStructure && (
        <div className="mix-structure">
          <h4>🎬 Mix Structure</h4>
          <div className="structure-timeline">
            {mix.mixStructure.sections.map((section, index) => (
              <div key={index} className="structure-section">
                <div className="section-header">
                  <span className="section-name">{section.name}</span>
                  <span className="section-time">
                    {formatTime(section.start)} - {formatTime(section.end)}
                  </span>
                </div>
                <div className="section-description">{section.description}</div>
                <div className="section-track">
                  <span className="track-indicator">
                    {section.track === 'track1' ? '🎵 Track 1' : 
                     section.track === 'track2' ? '🎵 Track 2' : '🎵 Both Tracks'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Track Selection Details */}
      {mix.trackSelections && (
        <div className="track-selections">
          <h4>🎯 Song Sections Used</h4>
          <div className="selection-grid">
            <div className="selection-item">
              <h5>Track 1: {mix.trackSelections.track1.reason}</h5>
              <p>Used: {formatTime(mix.trackSelections.track1.startTime)} - {formatTime(mix.trackSelections.track1.startTime + mix.trackSelections.track1.duration)}</p>
            </div>
            <div className="selection-item">
              <h5>Track 2: {mix.trackSelections.track2.reason}</h5>
              <p>Used: {formatTime(mix.trackSelections.track2.startTime)} - {formatTime(mix.trackSelections.track2.startTime + mix.trackSelections.track2.duration)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Audio Controls */}
      <div className="audio-controls">
        <button
          className="control-btn"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        <div className="progress-container" onClick={handleSeek}>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(currentTime / mix.duration) * 100}%` }}
            ></div>
          </div>
          <div className="time-display">
            {formatTime(currentTime)} / {formatTime(mix.duration)}
          </div>
        </div>
      </div>

      {/* Volume Control */}
      <div className="volume-control">
        <span>Volume:</span>
        <input
          type="range"
          className="volume-slider"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => {
            const newVolume = parseFloat(e.target.value)
            setVolume(newVolume)
          }}
        />
        <span>{Math.round(volume * 100)}%</span>
      </div>

      {/* Download Button */}
      <div className="download-section">
        <button
          className="download-btn"
          onClick={() => {
            // Convert audio buffer to downloadable file
            if (mix.audioBuffer) {
              const audioData = mix.audioBuffer.getChannelData(0)
              const wavBuffer = this.audioBufferToWav(mix.audioBuffer)
              const blob = new Blob([wavBuffer], { type: 'audio/wav' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'dj-mix.wav'
              a.click()
              URL.revokeObjectURL(url)
            }
          }}
        >
          💾 Download Mix
        </button>
      </div>
    </div>
  )
}

export default MixPlayer
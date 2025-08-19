import React, { useState, useRef, useEffect } from 'react'
import { getMixRecommendations } from '../services/mixService'

const MixPlayer = ({ mix }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [showWaveform, setShowWaveform] = useState(false)
  const audioRef = useRef(null)
  const progressInterval = useRef(null)

  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [])

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    } else {
      audioRef.current?.play()
      setIsPlaying(true)
      startProgressTracking()
    }
  }

  const startProgressTracking = () => {
    progressInterval.current = setInterval(() => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime)
      }
    }, 100)
  }

  const handleTimeUpdate = (e) => {
    const time = e.target.currentTime
    setCurrentTime(time)
  }

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const width = rect.width
    const seekTime = (clickX / width) * mix.structure.totalDuration

    if (audioRef.current) {
      audioRef.current.currentTime = seekTime
      setCurrentTime(seekTime)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCompatibilityColor = (score) => {
    if (score >= 80) return '#4ade80'
    if (score >= 60) return '#fbbf24'
    return '#f87171'
  }

  const getCompatibilityText = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Poor'
  }

  return (
    <div className="mix-player">
      <div className="mix-info">
        <h3>{mix.name}</h3>
        <p>Generated on {new Date(mix.generatedAt).toLocaleDateString()}</p>
      </div>

      <div className="mix-stats">
        <div className="stat-item">
          <div className="stat-value" style={{ color: getCompatibilityColor(mix.compatibility.score) }}>
            {mix.compatibility.score}%
          </div>
          <div className="stat-label">Compatibility</div>
        </div>

        <div className="stat-item">
          <div className="stat-value">{mix.compatibility.bpmScore}%</div>
          <div className="stat-label">BPM Match</div>
        </div>

        <div className="stat-item">
          <div className="stat-value">{mix.compatibility.keyScore}%</div>
          <div className="stat-label">Key Match</div>
        </div>

        <div className="stat-item">
          <div className="stat-value">{formatTime(mix.structure.totalDuration)}</div>
          <div className="stat-label">Mix Duration</div>
        </div>
      </div>

      {/* Duration Information */}
      {mix.originalDurations && (
        <div className="duration-info">
          <h4>Duration Analysis</h4>
          <div className="duration-grid">
            <div className="duration-item">
              <span className="duration-label">Song 1</span>
              <span className="duration-value">{formatTime(mix.originalDurations.song1)}</span>
            </div>
            <div className="duration-item">
              <span className="duration-label">Song 2</span>
              <span className="duration-value">{formatTime(mix.originalDurations.song2)}</span>
            </div>
            <div className="duration-item highlight">
              <span className="duration-label">Mix Length</span>
              <span className="duration-value">{formatTime(mix.originalDurations.average)}</span>
            </div>
          </div>
          <p className="duration-explanation">
            The mix duration is calculated as the average of both songs' lengths for optimal flow.
          </p>
        </div>
      )}

      <div className="compatibility-details">
        <h4>Mix Analysis</h4>
        <p><strong>Overall Score:</strong> {getCompatibilityText(mix.compatibility.score)} ({mix.compatibility.score}%)</p>

        {mix.compatibility.recommendations.length > 0 && (
          <div className="recommendations">
            <h5>Recommendations:</h5>
            <ul>
              {mix.compatibility.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

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
              style={{ width: `${(currentTime / mix.structure.totalDuration) * 100}%` }}
            ></div>
          </div>
          <div className="time-display">
            {formatTime(currentTime)} / {formatTime(mix.structure.totalDuration)}
          </div>
        </div>
      </div>

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
            if (audioRef.current) {
              audioRef.current.volume = newVolume
            }
          }}
        />
        <span>{Math.round(volume * 100)}%</span>
      </div>

      <button
        className="waveform-toggle"
        onClick={() => setShowWaveform(!showWaveform)}
      >
        {showWaveform ? 'Hide' : 'Show'} Waveform
      </button>

      {showWaveform && (
        <div className="waveform-container">
          <svg width="100%" height="100" viewBox={`0 0 ${mix.waveform.length * 2} 100`}>
            {mix.waveform.map((point, index) => (
              <rect
                key={index}
                x={index * 2}
                y={50 - (point.amplitude * 40)}
                width="1"
                height={point.amplitude * 80}
                fill="rgba(255, 255, 255, 0.6)"
              />
            ))}
          </svg>
        </div>
      )}

      <audio
        ref={audioRef}
        src={mix.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentTime(0)
          if (progressInterval.current) {
            clearInterval(progressInterval.current)
          }
        }}
        onError={() => {
          console.log('Audio preview not available - this is expected in demo mode')
        }}
      />
    </div>
  )
}

export default MixPlayer
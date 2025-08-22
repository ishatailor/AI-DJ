import React, { useState, useRef } from 'react'
import './FileUploadSection.css'

const FileUploadSection = ({ onTracksSelected, onError }) => {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedTracks, setUploadedTracks] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFiles = async (files) => {
    setIsProcessing(true)
    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/') || file.name.match(/\.(mp3|mp4|wav|m4a|aac)$/i)
    )

    if (validFiles.length === 0) {
      onError('Please select valid audio files (MP3, MP4, WAV, M4A, AAC)')
      setIsProcessing(false)
      return
    }

    if (validFiles.length > 2) {
      onError('Please select only 2 audio files for mixing')
      setIsProcessing(false)
      return
    }

    try {
      const tracks = await Promise.all(
        validFiles.map(async (file, index) => {
          const audioBuffer = await decodeAudioFile(file)
          return {
            id: `track_${Date.now()}_${index}`,
            name: file.name.replace(/\.[^/.]+$/, ''),
            artist: 'Local File',
            album: 'Local Upload',
            file: file,
            audioBuffer: audioBuffer,
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            // Generate mock audio features for now
            tempo: Math.floor(Math.random() * 60) + 80, // 80-140 BPM
            key: ['C', 'D', 'E', 'F', 'G', 'A', 'B'][Math.floor(Math.random() * 7)],
            energy: Math.random() * 0.8 + 0.2,
            danceability: Math.random() * 0.8 + 0.2,
            hasLocalFile: true
          }
        })
      )

      setUploadedTracks(tracks)
      
      if (tracks.length === 2) {
        onTracksSelected(tracks)
      }
    } catch (error) {
      console.error('Error processing files:', error)
      onError('Error processing audio files. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const decodeAudioFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result
          const audioContext = new (window.AudioContext || window.webkitAudioContext)()
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
          resolve(audioBuffer)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const removeTrack = (trackId) => {
    const updatedTracks = uploadedTracks.filter(track => track.id !== trackId)
    setUploadedTracks(updatedTracks)
    
    if (updatedTracks.length < 2) {
      onTracksSelected(null)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="file-upload-section">
      <div className="upload-header">
        <h2>🎵 Local Audio Mixer</h2>
        <p>Upload two audio files to create your DJ mix</p>
      </div>

      <div 
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${uploadedTracks.length > 0 ? 'has-files' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploadedTracks.length === 0 ? (
          <>
            <div className="upload-icon">📁</div>
            <h3>Drag & Drop Audio Files</h3>
            <p>or</p>
            <button 
              className="upload-btn"
              onClick={openFileDialog}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Choose Files'}
            </button>
            <p className="file-types">Supports: MP3, MP4, WAV, M4A, AAC</p>
          </>
        ) : (
          <div className="uploaded-files">
            <h3>Selected Tracks ({uploadedTracks.length}/2)</h3>
            {uploadedTracks.map((track) => (
              <div key={track.id} className="track-item">
                <div className="track-info">
                  <span className="track-name">{track.name}</span>
                  <span className="track-duration">
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toFixed(0).padStart(2, '0')}
                  </span>
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => removeTrack(track.id)}
                >
                  ✕
                </button>
              </div>
            ))}
            
            {uploadedTracks.length < 2 && (
              <div className="upload-more">
                <p>Upload {2 - uploadedTracks.length} more track{2 - uploadedTracks.length !== 1 ? 's' : ''}</p>
                <button 
                  className="upload-more-btn"
                  onClick={openFileDialog}
                  disabled={isProcessing}
                >
                  Add More Files
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.mp4,.wav,.m4a,.aac"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      {uploadedTracks.length === 2 && (
        <div className="ready-to-mix">
          <h3>🎉 Ready to Mix!</h3>
          <p>Both tracks uploaded successfully. Click "Generate Mix" to create your DJ mix.</p>
        </div>
      )}
    </div>
  )
}

export default FileUploadSection
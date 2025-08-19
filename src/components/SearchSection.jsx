import React, { useState, useEffect } from 'react'
import { fetchPreviewLibrary } from '../services/spotifyService'

const LibrarySection = ({ selectedSongs, onSongSelect }) => {
  const [library, setLibrary] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const items = await fetchPreviewLibrary(150)
        setLibrary(items)
      } catch (e) {
        setError('Failed to load library')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSongClick = (track) => {
    // Decide which slot to fill next: 0 if empty, else 1, else replace 0
    const nextIndex = !selectedSongs[0] ? 0 : (!selectedSongs[1] ? 1 : 0)
    onSongSelect(nextIndex, track)
  }

  return (
    <div className="search-section">
      <div style={{ marginBottom: '1rem' }}>
        <h3>Browse Previewable Tracks</h3>
        <p style={{ opacity: 0.7 }}>Click to select two songs to mix</p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>Loading library…</div>
      )}
      {error && (
        <div style={{ textAlign: 'center', marginTop: '1rem', color: '#ff6b6b' }}>{error}</div>
      )}
      {!loading && !error && library.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '1rem', opacity: 0.7 }}>
          No previewable tracks found. Please try again in a moment.
        </div>
      )}

      <div className="search-grid">
        <div className="search-item" style={{ gridColumn: '1 / -1' }}>
          <div className="search-results" style={{ maxHeight: 500, overflowY: 'auto' }}>
            {library.map((track) => (
              <div
                key={track.id}
                className="search-result-item"
                onClick={() => handleSongClick(track)}
                style={{ cursor: 'pointer' }}
              >
                <img src={track.albumArt} alt={track.album} />
                <div className="search-result-info">
                  <h4>{track.name}</h4>
                  <p>{track.artist} • {track.album}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LibrarySection
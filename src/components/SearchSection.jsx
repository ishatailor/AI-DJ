import React, { useState, useEffect } from 'react'

const LibrarySection = ({ selectedSongs, onSongSelect }) => {
  const [library, setLibrary] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const defaultStatic = [
    {
      id: 'static1',
      name: 'Sample Pop Track',
      artist: 'Sample Artist',
      album: 'Sample Album',
      albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Sample',
      duration: 180,
      uri: 'spotify:track:static1',
      previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      externalUrl: 'https://open.spotify.com/'
    },
    {
      id: 'static2',
      name: 'Sample Dance Track',
      artist: 'Another Artist',
      album: 'Another Album',
      albumArt: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Sample',
      duration: 200,
      uri: 'spotify:track:static2',
      previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      externalUrl: 'https://open.spotify.com/'
    }
  ]

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        // Prefer server library (Spotify-backed); fallback to static file if unavailable
        try {
          const serverResp = await fetch('/api/library?limit=150')
          if (serverResp.ok) {
            const serverData = await serverResp.json()
            if (Array.isArray(serverData) && serverData.length > 0) {
              setLibrary(serverData)
              return
            }
          }
        } catch {}

        const staticResp = await fetch('/library.json')
        if (staticResp.ok) {
          const data = await staticResp.json()
          if (Array.isArray(data) && data.length > 0) {
            setLibrary(data)
            return
          }
        }
        // if both fail, use embedded fallback set below
        setLibrary(defaultStatic)
      } catch (e) {
        // Use embedded static fallback so UI always shows something
        setLibrary(defaultStatic)
        setError(null)
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

      {/* Selected */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {[0,1].map(idx => (
          <div key={idx} style={{ padding: '0.5rem 0.75rem', borderRadius: 8, background: 'rgba(255,255,255,0.08)' }}>
            {selectedSongs[idx] ? `${idx===0?'A':'B'}: ${selectedSongs[idx].name} – ${selectedSongs[idx].artist}` : `${idx===0?'A':'B'}: Select a track`}
          </div>
        ))}
      </div>

      {/* Library as buttons */}
      <div className="search-results" style={{ maxHeight: 520, overflowY: 'auto' }}>
        {library.map((track) => (
          <button
            key={track.id}
            className="search-result-item"
            onClick={() => handleSongClick(track)}
            style={{
              display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
              padding: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer'
            }}
          >
            <img src={track.albumArt} alt={track.album} />
            <div className="search-result-info">
              <h4>{track.name}</h4>
              <p>{track.artist} • {track.album}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default LibrarySection
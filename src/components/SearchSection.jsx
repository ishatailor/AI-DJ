import React, { useState, useEffect } from 'react'

const LibrarySection = ({ selectedSongs, onSongSelect }) => {
  const [library, setLibrary] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const defaultStatic = [
    {
      id: "track1",
      name: "Electronic Beat",
      artist: "SoundHelix",
      album: "Demo Collection",
      albumArt: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
      duration: 180,
      uri: "spotify:track:track1",
      previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    },
    {
      id: "track2",
      name: "Pop Melody",
      artist: "SoundHelix",
      album: "Demo Collection",
      albumArt: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
      duration: 200,
      uri: "spotify:track:track2",
      previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
    },
    {
      id: "track3",
      name: "Rock Riff",
      artist: "SoundHelix",
      album: "Demo Collection",
      albumArt: "https://i.scdn.co/image/ab67616d0000b273de03bfc2991fd5b8de66a58b",
      duration: 220,
      uri: "spotify:track:track3",
      previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
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

  const handleSearch = async (query) => {
    if (!query.trim() || query.trim().length < 2) return
    
    try {
      setSearching(true)
      setError(null)
      
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query.trim())}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        if (data.tracks && data.tracks.length > 0) {
          setLibrary(data.tracks)
          console.log(`🔍 Found ${data.tracks.length} real Spotify tracks for "${query}"`)
        } else {
          setLibrary([])
          setError(`No tracks found for "${query}"`)
        }
      } else if (response.status === 429) {
        setError('Spotify API rate limited. Please wait a moment and try again.')
      } else {
        setError('Search failed. Please try again.')
      }
    } catch (error) {
      console.error('Search error:', error)
      setError('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    handleSearch(searchQuery)
  }

  return (
    <div className="search-section">
      <div style={{ marginBottom: '1rem' }}>
        <h3>Search Real Spotify Tracks</h3>
        <p style={{ opacity: 0.7 }}>Search for real songs to create actual DJ mixes</p>
        
        {/* Real-time Spotify search */}
        <form onSubmit={handleSearchSubmit} style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for songs, artists, or albums..."
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '1rem'
              }}
            />
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: '#1db954',
                color: 'white',
                cursor: searching ? 'not-allowed' : 'pointer',
                opacity: searching ? 0.6 : 1
              }}
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
        
        {/* Quick search suggestions */}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['Queen', 'Michael Jackson', 'Eagles', 'John Lennon', 'Led Zeppelin'].map(artist => (
            <button
              key={artist}
              onClick={() => handleSearch(artist)}
              disabled={searching}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'transparent',
                color: 'white',
                cursor: searching ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {artist}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>Loading initial library…</div>
      )}
      {searching && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>🔍 Searching Spotify for "{searchQuery}"...</div>
      )}
      {error && (
        <div style={{ textAlign: 'center', marginTop: '1rem', color: '#ff6b6b' }}>{error}</div>
      )}
      {!loading && !searching && !error && library.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '1rem', opacity: 0.7 }}>
          Search for songs above to find tracks to mix
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
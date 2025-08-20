import React, { useState, useEffect } from 'react'
import SpotifyAuth from './SpotifyAuth'

const LibrarySection = ({ selectedSongs, onSongSelect }) => {
  const [library, setLibrary] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [spotifyUserId, setSpotifyUserId] = useState(null)
  const [showPremiumLibrary, setShowPremiumLibrary] = useState(false)
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
      
      if (showPremiumLibrary && spotifyUserId) {
        // Search through user's premium library
        await searchPremiumLibrary(query)
        return
      }
      
      // Fallback to public Spotify search
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query.trim())}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        if (data.tracks && data.tracks.length > 0) {
          // Only show tracks with preview URLs
          const tracksWithPreviews = data.tracks.filter(track => track.previewUrl && track.previewUrl.trim() !== '')
          setLibrary(tracksWithPreviews)
          console.log(`🔍 Found ${tracksWithPreviews.length} tracks with previews for "${query}" (total: ${data.totalFound})`)
          
          if (tracksWithPreviews.length === 0) {
            setError(`Found ${data.totalFound} tracks but none have preview URLs available. Try searching for different artists, songs, or genres. Popular tracks often don't have previews due to licensing.`)
          }
        } else {
          setLibrary([])
          setError(`No tracks found for "${query}"`)
        }
      } else if (response.status === 429) {
        setError('Spotify API rate limited. Please wait a moment and try again.')
      } else if (response.status === 500) {
        const errorData = await response.json()
        setError(`Spotify API error: ${errorData.error || 'Service unavailable'}`)
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

  const handleAuthSuccess = (userId) => {
    setSpotifyUserId(userId)
    if (userId) {
      loadPremiumLibrary(userId)
    }
  }

  const handleAuthError = (error) => {
    console.error('Spotify auth error:', error)
    setError('Spotify authentication failed')
  }

  const loadPremiumLibrary = async (userId) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/spotify/user-tracks?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.tracks && data.tracks.length > 0) {
          setLibrary(data.tracks)
          setShowPremiumLibrary(true)
          console.log(`🎵 Loaded ${data.tracks.length} tracks from your Spotify Premium library`)
        } else {
          setError('No tracks found in your library')
        }
      } else {
        setError('Failed to load your music library')
      }
    } catch (error) {
      console.error('Failed to load premium library:', error)
      setError('Failed to load your music library')
    } finally {
      setLoading(false)
    }
  }

  const searchPremiumLibrary = async (query) => {
    if (!spotifyUserId || !query.trim() || query.trim().length < 2) return
    
    try {
      setSearching(true)
      setError(null)
      
      // Search through user's saved tracks
      const userTracks = library.filter(track => 
        track.name.toLowerCase().includes(query.toLowerCase()) ||
        track.artist.toLowerCase().includes(query.toLowerCase()) ||
        track.album.toLowerCase().includes(query.toLowerCase())
      )
      
      setLibrary(userTracks)
      console.log(`🔍 Found ${userTracks.length} tracks matching "${query}" in your library`)
      
    } catch (error) {
      console.error('Premium search error:', error)
      setError('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="search-section">
      {/* Spotify Premium Authentication */}
      <SpotifyAuth 
        onAuthSuccess={handleAuthSuccess}
        onAuthError={handleAuthError}
      />
      
      <div style={{ marginBottom: '1rem' }}>
        <h3>
          {showPremiumLibrary ? '🎵 Your Spotify Premium Library' : 'Search Real Spotify Tracks'}
        </h3>
        <p style={{ opacity: 0.7 }}>
          {showPremiumLibrary 
            ? 'Create DJ mixes from your personal music library' 
            : 'Search for real songs to create actual DJ mixes'
          }
        </p>
        
        {/* Real-time Spotify search */}
        <form onSubmit={handleSearchSubmit} style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={showPremiumLibrary ? "Search your music library..." : "Search for songs, artists, or albums..."}
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
              {searching ? 'Searching...' : (showPremiumLibrary ? 'Search Library' : 'Search')}
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
        
        {/* Alternative search suggestions that might have previews */}
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['indie', 'electronic', 'acoustic', 'cover', 'remix', 'live'].map(term => (
            <button
              key={term}
              onClick={() => handleSearch(term)}
              disabled={searching}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                cursor: searching ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                opacity: 0.8
              }}
            >
              {term}
            </button>
          ))}
        </div>
        
        {/* Info about preview availability */}
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.75rem', 
          background: 'rgba(29, 185, 84, 0.1)', 
          border: '1px solid rgba(29, 185, 84, 0.3)', 
          borderRadius: '8px',
          fontSize: '0.9rem',
          opacity: 0.9
        }}>
          <strong>ℹ️ Note:</strong> Only tracks with available Spotify preview URLs will be displayed. 
          Many popular tracks may not have previews available due to licensing restrictions.
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
          Search for songs above to find tracks with preview URLs
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
              {track.hasPremiumStream && (
                <span style={{ 
                  fontSize: '0.8rem', 
                  color: '#1db954', 
                  fontWeight: 'bold',
                  marginTop: '0.25rem'
                }}>
                  🎵 Premium Stream
                </span>
              )}
              {track.previewUrl && !track.hasPremiumStream && (
                <span style={{ 
                  fontSize: '0.8rem', 
                  color: '#1db954', 
                  fontWeight: 'bold',
                  marginTop: '0.25rem'
                }}>
                  🎵 Preview Available
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default LibrarySection
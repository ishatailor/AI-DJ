import React, { useState, useEffect } from 'react'
import { searchSpotifyTracks } from '../services/spotifyService'

const SearchSection = ({ selectedSongs, onSongSelect }) => {
  const [searchQueries, setSearchQueries] = useState(['', ''])
  const [searchResults, setSearchResults] = useState([[], []])
  const [isSearching, setIsSearching] = useState([false, false])
  const [timeouts, setTimeouts] = useState([null, null])

  const handleSearch = async (query, index) => {
    console.log(`🔍 Searching for: "${query}" in index ${index}`)
    console.log(`🔍 Query length: ${query.length}, trimmed: "${query.trim()}"`)
    
    if (!query.trim()) {
      console.log('❌ Empty query, clearing results')
      setSearchResults(prev => {
        const newResults = [...prev]
        newResults[index] = []
        return newResults
      })
      return
    }

    setIsSearching(prev => {
      const newSearching = [...prev]
      newSearching[index] = true
      return newSearching
    })

    try {
      console.log('🌐 Calling searchSpotifyTracks...')
      const results = await searchSpotifyTracks(query)
      console.log('✅ Search results received:', results)
      console.log('✅ Results type:', typeof results)
      console.log('✅ Results length:', Array.isArray(results) ? results.length : 'Not an array')
      
      setSearchResults(prev => {
        const newResults = [...prev]
        newResults[index] = results || []
        console.log(`📊 Updated search results for index ${index}:`, newResults[index])
        console.log(`📊 Full search results state:`, newResults)
        return newResults
      })
    } catch (error) {
      console.error('❌ Search error:', error)
      console.error('❌ Error details:', error.response?.data || error.message)
      setSearchResults(prev => {
        const newResults = [...prev]
        newResults[index] = []
        return newResults
      })
    } finally {
      setIsSearching(prev => {
        const newSearching = [...prev]
        newSearching[index] = false
        return newSearching
      })
    }
  }

  const handleInputChange = (value, index) => {
    console.log(`📝 Input changed: "${value}" in index ${index}`)
    console.log(`📝 Value type: ${typeof value}`)
    console.log(`📝 Value length: ${value.length}`)
    console.log(`📝 Value trimmed: "${value.trim()}"`)
    
    setSearchQueries(prev => {
      const newQueries = [...prev]
      newQueries[index] = value
      console.log(`📝 Updated search queries:`, newQueries)
      return newQueries
    })

    // Clear previous timeout
    if (timeouts[index]) {
      clearTimeout(timeouts[index])
    }

    // Set new timeout for debounced search
    const timeoutId = setTimeout(() => {
      console.log(`⏰ Timeout triggered for index ${index}, searching for: "${value}"`)
      handleSearch(value, index)
    }, 500)

    setTimeouts(prev => {
      const newTimeouts = [...prev]
      newTimeouts[index] = timeoutId
      return newTimeouts
    })
  }

  const handleSongSelect = (song, index) => {
    console.log(`Song selected:`, song, `for index ${index}`)
    onSongSelect(index, song)
    setSearchQueries(prev => {
      const newQueries = [...prev]
      newQueries[index] = song.name
      return newQueries
    })
    // Don't clear search results - let users see what they searched for
    // setSearchResults(prev => {
    //   const newResults = [...prev]
    //   newResults[index] = []
    //   return newResults
    // })
  }

  const getSelectedSongDisplay = (index) => {
    const song = selectedSongs[index]
    if (!song) return null

    return (
      <div className="selected-song">
        <img src={song.albumArt} alt={song.album} />
        <div>
          <h4>{song.name}</h4>
          <p>{song.artist}</p>
        </div>
      </div>
    )
  }

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeouts.forEach(timeout => {
        if (timeout) clearTimeout(timeout)
      })
    }
  }, [])

  return (
    <div className="search-section">
      {/* Debug Section */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          background: 'rgba(255, 0, 0, 0.1)', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <h4>🔍 Debug Info:</h4>
          <div>Search Queries: {JSON.stringify(searchQueries)}</div>
          <div>Search Results Lengths: {JSON.stringify(searchResults.map(r => r?.length || 0))}</div>
          <div>Is Searching: {JSON.stringify(isSearching)}</div>
          <div>Selected Songs: {JSON.stringify(selectedSongs.map(s => s?.name || null))}</div>
        </div>
      )}
      
      <div className="search-grid">
        {[0, 1].map((index) => (
          <div key={index} className="search-item">
            <label htmlFor={`search-${index}`}>
              Song {index + 1}
            </label>
            
            <input
              id={`search-${index}`}
              type="text"
              className="search-input"
              placeholder={`Search for song ${index + 1}...`}
              value={searchQueries[index]}
              onChange={(e) => {
                console.log(`🔤 Input onChange triggered for index ${index}:`, e.target.value)
                handleInputChange(e.target.value, index)
              }}
            />

            {selectedSongs[index] && getSelectedSongDisplay(index)}

            {isSearching[index] && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                Searching...
              </div>
            )}

            {searchResults[index] && searchResults[index].length > 0 && (
              <div className="search-results">
                <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>
                  Found {searchResults[index].length} results
                </p>
                {console.log(`🎯 Rendering ${searchResults[index].length} results for index ${index}:`, searchResults[index])}
                {searchResults[index].map((track) => (
                  <div
                    key={track.id}
                    className="search-result-item"
                    onClick={() => handleSongSelect(track, index)}
                  >
                    <img src={track.albumArt} alt={track.album} />
                    <div className="search-result-info">
                      <h4>{track.name}</h4>
                      <p>{track.artist} • {track.album}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(!searchResults[index] || searchResults[index].length === 0) && searchQueries[index].length > 0 && !isSearching[index] && (
              <div style={{ textAlign: 'center', marginTop: '1rem', opacity: 0.7 }}>
                {console.log(`❌ No results found for index ${index}. Query: "${searchQueries[index]}", Results:`, searchResults[index], 'Type:', typeof searchResults[index])}
                No results found
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default SearchSection
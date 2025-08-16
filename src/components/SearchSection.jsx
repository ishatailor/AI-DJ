import React, { useState, useEffect } from 'react'
import { searchSpotifyTracks } from '../services/spotifyService'

const SearchSection = ({ selectedSongs, onSongSelect }) => {
  const [searchQueries, setSearchQueries] = useState(['', ''])
  const [searchResults, setSearchResults] = useState([[], []])
  const [isSearching, setIsSearching] = useState([false, false])
  const [timeouts, setTimeouts] = useState([null, null])

  const handleSearch = async (query, index) => {
    console.log(`Searching for: "${query}" in index ${index}`)
    
    if (!query.trim()) {
      console.log('Empty query, clearing results')
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
      console.log('Calling searchSpotifyTracks...')
      const results = await searchSpotifyTracks(query)
      console.log('Search results:', results)
      
      setSearchResults(prev => {
        const newResults = [...prev]
        newResults[index] = results || []
        return newResults
      })
    } catch (error) {
      console.error('Search error:', error)
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
    console.log(`Input changed: "${value}" in index ${index}`)
    
    setSearchQueries(prev => {
      const newQueries = [...prev]
      newQueries[index] = value
      return newQueries
    })

    // Clear previous timeout
    if (timeouts[index]) {
      clearTimeout(timeouts[index])
    }

    // Set new timeout for debounced search
    const timeoutId = setTimeout(() => {
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
    setSearchResults(prev => {
      const newResults = [...prev]
      newResults[index] = []
      return newResults
    })
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
              onChange={(e) => handleInputChange(e.target.value, index)}
            />

            {selectedSongs[index] && getSelectedSongDisplay(index)}

            {isSearching[index] && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                Searching...
              </div>
            )}

            {searchResults[index] && searchResults[index].length > 0 && !selectedSongs[index] && (
              <div className="search-results">
                <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>
                  Found {searchResults[index].length} results
                </p>
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

            {searchResults[index] && searchResults[index].length === 0 && searchQueries[index].length > 0 && !isSearching[index] && (
              <div style={{ textAlign: 'center', marginTop: '1rem', opacity: 0.7 }}>
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
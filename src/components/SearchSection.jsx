import React, { useState, useEffect } from 'react'
import { searchSpotifyTracks } from '../services/spotifyService'

const SearchSection = ({ selectedSongs, onSongSelect }) => {
  const [searchQueries, setSearchQueries] = useState(['', ''])
  const [searchResults, setSearchResults] = useState([[], []])
  const [isSearching, setIsSearching] = useState([false, false])

  const handleSearch = async (query, index) => {
    if (!query.trim()) {
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
      const results = await searchSpotifyTracks(query)
      setSearchResults(prev => {
        const newResults = [...prev]
        newResults[index] = results
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
    const newQueries = [...searchQueries]
    newQueries[index] = value
    setSearchQueries(newQueries)

    // Debounce search
    clearTimeout(searchQueries[index].timeoutId)
    const timeoutId = setTimeout(() => {
      handleSearch(value, index)
    }, 500)

    newQueries[index].timeoutId = timeoutId
    setSearchQueries(newQueries)
  }

  const handleSongSelect = (song, index) => {
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

            {searchResults[index].length > 0 && !selectedSongs[index] && (
              <div className="search-results">
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
          </div>
        ))}
      </div>
    </div>
  )
}

export default SearchSection
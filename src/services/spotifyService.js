import axios from 'axios'

// In a real application, you would get these from environment variables
const CLIENT_ID = 'your_spotify_client_id'
const CLIENT_SECRET = 'your_spotify_client_secret'
const REDIRECT_URI = 'http://localhost:3000/callback'

let accessToken = null
let tokenExpiry = null

const getAccessToken = async () => {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken
  }

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', 
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
        }
      }
    )

    accessToken = response.data.access_token
    tokenExpiry = Date.now() + (response.data.expires_in * 1000)
    return accessToken
  } catch (error) {
    console.error('Error getting access token:', error)
    throw new Error('Failed to authenticate with Spotify')
  }
}

export const searchSpotifyTracks = async (query) => {
  try {
    const token = await getAccessToken()
    
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        q: query,
        type: 'track',
        limit: 10,
        market: 'US'
      }
    })

    return response.data.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      albumArt: track.album.images[0]?.url || '/default-album-art.png',
      duration: Math.round(track.duration_ms / 1000),
      uri: track.uri,
      previewUrl: track.preview_url
    }))
  } catch (error) {
    console.error('Error searching tracks:', error)
    throw new Error('Failed to search Spotify tracks')
  }
}

export const getTrackFeatures = async (trackId) => {
  try {
    const token = await getAccessToken()
    
    const response = await axios.get(`https://api.spotify.com/v1/audio-features/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    return response.data
  } catch (error) {
    console.error('Error getting track features:', error)
    throw new Error('Failed to get track features')
  }
}

export const getTrackAnalysis = async (trackId) => {
  try {
    const token = await getAccessToken()
    
    const response = await axios.get(`https://api.spotify.com/v1/audio-analysis/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    return response.data
  } catch (error) {
    console.error('Error getting track analysis:', error)
    throw new Error('Failed to get track analysis')
  }
}
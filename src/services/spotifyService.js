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
  console.log('🔍 searchSpotifyTracks called with query:', query)
  
  try {
    // Use the backend API instead of Spotify directly for demo purposes
    const apiUrl = `/api/search?q=${encodeURIComponent(query)}`
    console.log('🌐 Making API call to:', apiUrl)
    
    const response = await axios.get(apiUrl)
    console.log('✅ API response received:', response)
    
    if (response.data && Array.isArray(response.data)) {
      console.log('📊 Search results:', response.data)
      return response.data
    } else {
      console.error('❌ Unexpected response format:', response.data)
      return []
    }
  } catch (error) {
    console.error('❌ Error searching tracks:', error)
    console.error('❌ Error details:', error.response?.data || error.message)
    
    // Return empty array if API fails
    console.log('🔄 API failed, returning empty results')
    return []
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
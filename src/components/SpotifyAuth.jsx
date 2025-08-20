import React, { useState, useEffect } from 'react'

const SpotifyAuth = ({ onAuthSuccess, onAuthError }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check if user is already authenticated
    const storedUserId = localStorage.getItem('spotify_user_id')
    if (storedUserId) {
      setUserId(storedUserId)
      setIsAuthenticated(true)
      onAuthSuccess?.(storedUserId)
    }
  }, [onAuthSuccess])

  const handleLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get Spotify auth URL from backend
      const response = await fetch('/api/spotify/auth')
      if (!response.ok) {
        throw new Error('Failed to get auth URL')
      }
      
      const { authUrl } = await response.json()
      
      // Redirect to Spotify for authentication
      window.location.href = authUrl
      
    } catch (error) {
      console.error('Auth error:', error)
      setError('Failed to start authentication')
      onAuthError?.(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('spotify_user_id')
    setIsAuthenticated(false)
    setUserId(null)
    onAuthSuccess?.(null)
  }

  // Handle auth callback from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const authSuccess = urlParams.get('auth-success')
    const authError = urlParams.get('auth-error')
    const callbackUserId = urlParams.get('userId')
    
    if (callbackUserId && authSuccess === 'true') {
      setUserId(callbackUserId)
      setIsAuthenticated(true)
      localStorage.setItem('spotify_user_id', callbackUserId)
      onAuthSuccess?.(callbackUserId)
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    
    if (authError) {
      setError(decodeURIComponent(authError))
      onAuthError?.(authError)
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [onAuthSuccess, onAuthError])

  if (isAuthenticated) {
    return (
      <div style={{
        padding: '1rem',
        background: 'rgba(29, 185, 84, 0.1)',
        border: '1px solid rgba(29, 185, 84, 0.3)',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1db954' }}>
              🎵 Connected to Spotify Premium
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
              User ID: {userId}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: '1rem',
      background: 'rgba(29, 185, 84, 0.1)',
      border: '1px solid rgba(29, 185, 84, 0.3)',
      borderRadius: '8px',
      marginBottom: '1rem',
      textAlign: 'center'
    }}>
      <h4 style={{ margin: '0 0 0.5rem 0', color: '#1db954' }}>
        🎵 Connect Your Spotify Premium Account
      </h4>
      <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', opacity: 0.8 }}>
        Connect your Spotify Premium account to access your personal music library and create real DJ mixes from your actual songs!
      </p>
      
      {error && (
        <div style={{ 
          marginBottom: '1rem', 
          padding: '0.5rem', 
          background: 'rgba(255, 107, 107, 0.2)', 
          border: '1px solid rgba(255, 107, 107, 0.3)', 
          borderRadius: '4px',
          color: '#ff6b6b',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}
      
      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          border: 'none',
          background: '#1db954',
          color: 'white',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          fontSize: '1rem',
          fontWeight: 'bold'
        }}
      >
        {loading ? 'Connecting...' : 'Connect Spotify Premium'}
      </button>
      
      <div style={{ 
        marginTop: '1rem', 
        padding: '0.75rem', 
        background: 'rgba(255, 255, 255, 0.05)', 
        borderRadius: '6px',
        fontSize: '0.8rem',
        opacity: 0.7
      }}>
        <strong>What you'll get:</strong> Access to your personal music library, 
        full track streaming (not just 30-second previews), and the ability to create 
        real DJ mixes from your actual songs!
      </div>
    </div>
  )
}

export default SpotifyAuth
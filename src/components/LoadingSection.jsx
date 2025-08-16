import React from 'react'

const LoadingSection = ({ progress }) => {
  const getLoadingMessage = () => {
    if (progress < 20) return "Analyzing track characteristics..."
    if (progress < 40) return "Calculating BPM and key compatibility..."
    if (progress < 60) return "Creating transition points..."
    if (progress < 80) return "Generating seamless mix..."
    if (progress < 100) return "Finalizing your mix..."
    return "Mix ready!"
  }

  return (
    <div className="loading-section">
      <h3>Creating Your Mix</h3>
      <p>{getLoadingMessage()}</p>
      
      <div className="loading-bar">
        <div 
          className="loading-progress" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <p>{progress}% Complete</p>
      
      <div style={{ marginTop: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-around', 
          maxWidth: '400px', 
          margin: '0 auto' 
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              background: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: '50%',
              margin: '0 auto 0.5rem',
              animation: progress > 20 ? 'pulse 1s infinite' : 'none'
            }}></div>
            <small>BPM Analysis</small>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              background: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: '50%',
              margin: '0 auto 0.5rem',
              animation: progress > 40 ? 'pulse 1s infinite' : 'none'
            }}></div>
            <small>Key Matching</small>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              background: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: '50%',
              margin: '0 auto 0.5rem',
              animation: progress > 60 ? 'pulse 1s infinite' : 'none'
            }}></div>
            <small>Mix Generation</small>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

export default LoadingSection
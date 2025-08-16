import { getTrackFeatures, getTrackAnalysis } from './spotifyService'

// AI Mixing Algorithm
const analyzeCompatibility = (track1, track2) => {
  const bpmDiff = Math.abs(track1.bpm - track2.bpm)
  const keyCompatibility = getKeyCompatibility(track1.key, track1.mode, track2.key, track2.mode)
  const energyDiff = Math.abs(track1.energy - track2.energy)
  const danceabilityDiff = Math.abs(track1.danceability - track2.danceability)
  
  // Calculate overall compatibility score (0-100)
  const bpmScore = Math.max(0, 100 - (bpmDiff * 2)) // BPM difference penalty
  const keyScore = keyCompatibility * 100
  const energyScore = Math.max(0, 100 - (energyDiff * 50))
  const danceabilityScore = Math.max(0, 100 - (danceabilityDiff * 50))
  
  const totalScore = (bpmScore + keyScore + energyScore + danceabilityScore) / 4
  
  return {
    score: Math.round(totalScore),
    bpmScore: Math.round(bpmScore),
    keyScore: Math.round(keyScore),
    energyScore: Math.round(energyScore),
    danceabilityScore: Math.round(danceabilityScore),
    recommendations: generateRecommendations(bpmDiff, keyCompatibility, energyDiff, danceabilityDiff)
  }
}

const getKeyCompatibility = (key1, mode1, key2, mode2) => {
  // Circle of fifths compatibility
  const circleOfFifths = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F']
  const key1Index = circleOfFifths.indexOf(key1)
  const key2Index = circleOfFifths.indexOf(key2)
  
  if (key1 === key2) return 1.0 // Same key
  if (Math.abs(key1Index - key2Index) === 1) return 0.9 // Adjacent keys
  if (Math.abs(key1Index - key2Index) === 2) return 0.7 // Two steps apart
  if (Math.abs(key1Index - key2Index) === 5) return 0.8 // Perfect fourth/fifth
  if (Math.abs(key1Index - key2Index) === 7) return 0.6 // Minor third
  
  return 0.3 // Less compatible
}

const generateRecommendations = (bpmDiff, keyCompatibility, energyDiff, danceabilityDiff) => {
  const recommendations = []
  
  if (bpmDiff > 20) {
    recommendations.push('Consider using a BPM transition technique')
  }
  
  if (keyCompatibility < 0.5) {
    recommendations.push('Keys may clash - consider pitch shifting')
  }
  
  if (energyDiff > 0.4) {
    recommendations.push('Energy levels differ significantly')
  }
  
  if (danceabilityDiff > 0.3) {
    recommendations.push('Danceability varies between tracks')
  }
  
  return recommendations
}

const generateMixStructure = (track1, track2, compatibility) => {
  const totalDuration = track1.duration + track2.duration
  const transitionPoint = Math.min(track1.duration * 0.7, track2.duration * 0.3)
  
  return {
    intro: {
      track: track1,
      start: 0,
      end: transitionPoint,
      fadeIn: 0,
      fadeOut: 2000
    },
    transition: {
      start: transitionPoint - 1000,
      end: transitionPoint + 1000,
      crossfade: 2000
    },
    outro: {
      track: track2,
      start: transitionPoint,
      end: totalDuration,
      fadeIn: 2000,
      fadeOut: 0
    },
    totalDuration: totalDuration
  }
}

export const generateMix = async (song1, song2) => {
  try {
    // Get detailed track features
    const [features1, features2] = await Promise.all([
      getTrackFeatures(song1.id),
      getTrackFeatures(song2.id)
    ])
    
    // Create enhanced track objects with features
    const track1 = {
      ...song1,
      ...features1,
      duration: song1.duration
    }
    
    const track2 = {
      ...song2,
      ...features2,
      duration: song2.duration
    }
    
    // Analyze compatibility
    const compatibility = analyzeCompatibility(track1, track2)
    
    // Generate mix structure
    const mixStructure = generateMixStructure(track1, track2, compatibility)
    
    // Create the final mix object
    const mix = {
      id: `mix_${Date.now()}`,
      name: `${song1.name} + ${song2.name}`,
      tracks: [track1, track2],
      compatibility: compatibility,
      structure: mixStructure,
      generatedAt: new Date().toISOString(),
      // In a real application, this would be the actual mixed audio file
      audioUrl: `/api/mixes/${Date.now()}/audio`,
      waveform: generateWaveform(mixStructure.totalDuration)
    }
    
    return mix
    
  } catch (error) {
    console.error('Error generating mix:', error)
    throw new Error('Failed to generate mix')
  }
}

const generateWaveform = (duration) => {
  // Generate a simple waveform visualization
  const points = Math.floor(duration / 0.1) // One point every 100ms
  const waveform = []
  
  for (let i = 0; i < points; i++) {
    const time = i * 0.1
    const amplitude = Math.sin(time * 0.5) * 0.5 + 0.5 // Simple sine wave
    waveform.push({
      time: time,
      amplitude: amplitude
    })
  }
  
  return waveform
}

export const getMixRecommendations = (track) => {
  // This would typically call an AI service to get recommendations
  // For now, return mock recommendations based on track features
  const recommendations = []
  
  if (track.bpm > 140) {
    recommendations.push('High energy track - pair with similar BPM for seamless mixing')
  } else if (track.bpm < 100) {
    recommendations.push('Lower BPM track - consider gradual BPM increase for energy build')
  }
  
  if (track.energy > 0.8) {
    recommendations.push('High energy - great for peak time mixing')
  } else if (track.energy < 0.4) {
    recommendations.push('Lower energy - perfect for building up to higher energy tracks')
  }
  
  if (track.danceability > 0.8) {
    recommendations.push('Highly danceable - excellent for club mixing')
  }
  
  return recommendations
}
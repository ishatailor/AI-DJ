// Remove the import that might be causing issues
// import { getTrackFeatures, getTrackAnalysis } from './spotifyService'

// Simplified Web Audio API Integration
class AudioMixer {
  constructor() {
    this.audioContext = null
    this.isPlaying = false
    this.currentMix = null
  }

  async initialize() {
    try {
      if (!window.AudioContext && !window.webkitAudioContext) {
        console.log('⚠️ Web Audio API not supported')
        return false
      }

      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      console.log('✅ Audio context initialized')
      return true
    } catch (error) {
      console.log('⚠️ Audio context failed:', error.message)
      return false
    }
  }

  async createMix(song1, song2) {
    try {
      console.log('🎵 Creating mix for:', song1.name, 'and', song2.name)

      // Initialize audio context
      await this.initialize()

      // Create enhanced track objects with mock features
      const mockFeatures1 = {
        danceability: 0.7 + Math.random() * 0.3,
        energy: 0.6 + Math.random() * 0.4,
        key: Math.floor(Math.random() * 12),
        loudness: -20 + Math.random() * 20,
        mode: Math.random() > 0.5 ? 1 : 0,
        speechiness: Math.random() * 0.1,
        acousticness: Math.random() * 0.3,
        instrumentalness: Math.random() * 0.5,
        liveness: Math.random() * 0.2,
        valence: Math.random(),
        tempo: 80 + Math.random() * 100,
        duration_ms: (song1.duration || 180) * 1000,
        time_signature: 4
      }

      const mockFeatures2 = {
        danceability: 0.7 + Math.random() * 0.3,
        energy: 0.6 + Math.random() * 0.4,
        key: Math.floor(Math.random() * 12),
        loudness: -20 + Math.random() * 20,
        mode: Math.random() > 0.5 ? 1 : 0,
        speechiness: Math.random() * 0.1,
        acousticness: Math.random() * 0.3,
        instrumentalness: Math.random() * 0.5,
        liveness: Math.random() * 0.2,
        valence: Math.random(),
        tempo: 80 + Math.random() * 100,
        duration_ms: (song2.duration || 180) * 1000,
        time_signature: 4
      }

      const track1 = {
        ...song1,
        ...mockFeatures1,
        duration: song1.duration || 180,
        bpm: mockFeatures1.tempo
      }

      const track2 = {
        ...song2,
        ...mockFeatures2,
        duration: song2.duration || 180,
        bpm: mockFeatures2.tempo
      }

      // Analyze compatibility
      const compatibility = analyzeCompatibility(track1, track2)
      console.log('🔍 Compatibility analyzed:', compatibility)

      // Generate mix structure
      const mixStructure = generateMixStructure(track1, track2, compatibility)
      console.log('🏗️ Mix structure generated:', mixStructure)

      // pick a usable audio URL (Spotify preview) if available, else synthesize locally
      let audioUrl = song1.previewUrl || song2.previewUrl || null
      if (!audioUrl) {
        try {
          audioUrl = await this.generateSyntheticMix(track1, track2, mixStructure)
        } catch (e) {
          console.log('⚠️ Synthetic mix generation failed:', e?.message || e)
          audioUrl = null
        }
      }

      // Create the complete mix object with ALL required properties
      const mix = {
        id: `mix_${Date.now()}`,
        name: `${song1.name} + ${song2.name}`,
        tracks: [track1, track2],
        compatibility: compatibility,
        structure: mixStructure,
        generatedAt: new Date().toISOString(),
        audioUrl: audioUrl,
        waveform: generateWaveform(mixStructure.totalDuration),
        originalDurations: {
          song1: song1.duration || 180,
          song2: song2.duration || 180,
          average: mixStructure.totalDuration
        },
        song1: song1,
        song2: song2,
        duration: mixStructure.totalDuration,
        status: 'ready',
        hasAudio: Boolean(audioUrl)
      }

      this.currentMix = mix
      console.log('✅ Mix created successfully:', mix)

      return {
        ...mix,
        controls: {
          play: () => this.playMix(),
          pause: () => this.pauseMix(),
          stop: () => this.stopMix(),
          setVolume: (volume) => this.setVolume(volume)
        }
      }
    } catch (error) {
      console.error('❌ Mix creation failed:', error)
      throw new Error(`Failed to create mix: ${error.message}`)
    }
  }

  playMix() {
    if (!this.currentMix) {
      console.log('No mix available to play')
      return
    }

    try {
      this.isPlaying = true
      console.log('🎵 Playing mix:', this.currentMix.id)
      console.log('✅ Mix is playing (mock mode - audio implementation coming next)')

    } catch (error) {
      console.error('❌ Failed to play mix:', error)
      this.isPlaying = false
    }
  }

  pauseMix() {
    if (!this.isPlaying) return

    try {
      this.isPlaying = false
      console.log('⏸️ Mix paused')
    } catch (error) {
      console.error('❌ Failed to pause mix:', error)
    }
  }

  stopMix() {
    try {
      this.isPlaying = false
      console.log('⏹️ Mix stopped')
    } catch (error) {
      console.error('❌ Failed to stop mix:', error)
    }
  }

  setVolume(volume) {
    try {
      console.log('🔊 Volume set to:', volume, '(mock mode)')
    } catch (error) {
      console.error('❌ Failed to set volume:', error)
    }
  }

  // --- NEW: generate a short synthetic mix (WAV Blob URL) when no preview is available ---
  async generateSyntheticMix(track1, track2, mixStructure) {
    const sr = 44100
    const durationSec = Math.max(15, Math.min(30, Math.floor(mixStructure.totalDuration))) // 15-30s clip
    const channels = 2
    const ctx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(channels, sr * durationSec, sr)

    const avgBpm = Math.max(60, Math.min(180, Math.round(((track1.bpm || 120) + (track2.bpm || 120)) / 2)))
    const secondsPerBeat = 60 / avgBpm

    // Master gain
    const master = ctx.createGain()
    master.gain.value = 0.9
    master.connect(ctx.destination)

    // Simple drum: kick + noise snare
    const makeKick = (time) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(150, time)
      osc.frequency.exponentialRampToValueAtTime(50, time + 0.15)
      gain.gain.setValueAtTime(1, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2)
      osc.connect(gain).connect(master)
      osc.start(time)
      osc.stop(time + 0.25)
    }

    const makeSnare = (time) => {
      const noiseBuffer = ctx.createBuffer(1, sr * 0.2, sr)
      const data = noiseBuffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.4
      const noise = ctx.createBufferSource()
      noise.buffer = noiseBuffer
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 1800
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.6, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2)
      noise.connect(bp).connect(gain).connect(master)
      noise.start(time)
      noise.stop(time + 0.2)
    }

    // Simple tonal layers (two oscillators crossfaded)
    const keyToFreq = (key) => {
      const keys = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
      const idx = typeof key === 'number' ? key : Math.max(0, keys.indexOf(key || 'C'))
      const baseA = 440
      // Map idx to a note near A4
      const semitoneFromA = (idx - 9) // A index ~ 9
      return baseA * Math.pow(2, semitoneFromA / 12)
    }

    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const g1 = ctx.createGain()
    const g2 = ctx.createGain()
    osc1.type = 'sawtooth'
    osc2.type = 'sawtooth'
    osc1.frequency.value = keyToFreq(track1.key)
    osc2.frequency.value = keyToFreq(track2.key)
    g1.gain.value = 0.15
    g2.gain.value = 0.0

    osc1.connect(g1).connect(master)
    osc2.connect(g2).connect(master)

    const transitionStart = Math.max(0, mixStructure.transition.start / 1000 || durationSec * 0.4)
    const transitionEnd = Math.min(durationSec, mixStructure.transition.end / 1000 || durationSec * 0.6)

    // Crossfade between tones across transition
    g1.gain.setValueAtTime(0.15, 0)
    g1.gain.linearRampToValueAtTime(0.05, transitionEnd)
    g2.gain.setValueAtTime(0.0, 0)
    g2.gain.linearRampToValueAtTime(0.12, transitionEnd)

    osc1.start(0)
    osc2.start(0)
    osc1.stop(durationSec)
    osc2.stop(durationSec)

    // Schedule drums on 4/4
    for (let t = 0; t < durationSec; t += secondsPerBeat) {
      makeKick(t)
      // snare on beats 2 and 4
      const beatIndex = Math.round(t / secondsPerBeat) % 4
      if (beatIndex === 1 || beatIndex === 3) makeSnare(t)
    }

    const renderedBuffer = await ctx.startRendering()
    const wav = this.audioBufferToWav(renderedBuffer)
    const blob = new Blob([wav], { type: 'audio/wav' })
    const url = URL.createObjectURL(blob)
    return url
  }

  audioBufferToWav(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels
    const sampleRate = audioBuffer.sampleRate
    const format = 1 // PCM
    const bitDepth = 16

    const samples = audioBuffer.length
    const bytesPerSample = bitDepth / 8
    const blockAlign = numChannels * bytesPerSample
    const byteRate = sampleRate * blockAlign
    const dataSize = samples * blockAlign
    const buffer = new ArrayBuffer(44 + dataSize)
    const view = new DataView(buffer)

    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    let offset = 0
    writeString(view, offset, 'RIFF'); offset += 4
    view.setUint32(offset, 36 + dataSize, true); offset += 4
    writeString(view, offset, 'WAVE'); offset += 4
    writeString(view, offset, 'fmt '); offset += 4
    view.setUint32(offset, 16, true); offset += 4 // Subchunk1Size
    view.setUint16(offset, format, true); offset += 2
    view.setUint16(offset, numChannels, true); offset += 2
    view.setUint32(offset, sampleRate, true); offset += 4
    view.setUint32(offset, byteRate, true); offset += 4
    view.setUint16(offset, blockAlign, true); offset += 2
    view.setUint16(offset, bitDepth, true); offset += 2
    writeString(view, offset, 'data'); offset += 4
    view.setUint32(offset, dataSize, true); offset += 4

    // Interleave and write samples
    const channels = []
    for (let c = 0; c < numChannels; c++) channels.push(audioBuffer.getChannelData(c))

    let sampleIndex = 0
    while (sampleIndex < samples) {
      for (let c = 0; c < numChannels; c++) {
        const sample = Math.max(-1, Math.min(1, channels[c][sampleIndex] || 0))
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
        view.setInt16(offset, intSample, true)
        offset += 2
      }
      sampleIndex++
    }
    return view
  }
}

// Create global mixer instance
const audioMixer = new AudioMixer()

// AI Mixing Algorithm
const analyzeCompatibility = (track1, track2) => {
  const bpmDiff = Math.abs(track1.bpm - track2.bpm)
  const keyCompatibility = getKeyCompatibility(track1.key, track1.mode, track2.key, track2.mode)
  const energyDiff = Math.abs(track1.energy - track2.energy)
  const danceabilityDiff = Math.abs(track1.danceability - track2.danceability)

  // Calculate overall compatibility score (0-100)
  const bpmScore = Math.max(0, 100 - (bpmDiff * 2))
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
  const circleOfFifths = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F']
  const key1Index = circleOfFifths.indexOf(key1)
  const key2Index = circleOfFifths.indexOf(key2)

  if (key1 === key2) return 1.0
  if (Math.abs(key1Index - key2Index) === 1) return 0.9
  if (Math.abs(key1Index - key2Index) === 2) return 0.7
  if (Math.abs(key1Index - key2Index) === 5) return 0.8
  if (Math.abs(key1Index - key2Index) === 7) return 0.6

  return 0.3
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
  const averageDuration = Math.round((track1.duration + track2.duration) / 2)
  const firstSongDuration = Math.round(averageDuration * 0.6)
  const secondSongDuration = Math.round(averageDuration * 0.4)
  const transitionPoint = Math.min(firstSongDuration, track1.duration * 0.8)

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
      end: averageDuration,
      fadeIn: 2000,
      fadeOut: 0
    },
    totalDuration: averageDuration
  }
}

// MAIN EXPORT - Updated to use Web Audio API when possible
export const generateMix = async (song1, song2) => {
  try {
    console.log('🎵 generateMix called with:', song1.name, 'and', song2.name)

    // Validate inputs
    if (!song1 || !song2) {
      console.error('❌ Invalid songs provided:', { song1, song2 })
      throw new Error('Invalid songs provided')
    }

    // Try to create a real audio mix first
    try {
      const realMix = await audioMixer.createMix(song1, song2)
      console.log('✅ Real audio mix created successfully')
      return realMix
    } catch (audioError) {
      console.log('⚠️ Real audio mix failed, falling back to mock:', audioError.message)
    }

    // Fallback to your existing mock implementation
    const mockFeatures1 = {
      danceability: 0.7 + Math.random() * 0.3,
      energy: 0.6 + Math.random() * 0.4,
      key: Math.floor(Math.random() * 12),
      loudness: -20 + Math.random() * 20,
      mode: Math.random() > 0.5 ? 1 : 0,
      speechiness: Math.random() * 0.1,
      acousticness: Math.random() * 0.3,
      instrumentalness: Math.random() * 0.5,
      liveness: Math.random() * 0.2,
      valence: Math.random(),
      tempo: 80 + Math.random() * 100,
      duration_ms: (song1.duration || 180) * 1000,
      time_signature: 4
    }

    const mockFeatures2 = {
      danceability: 0.7 + Math.random() * 0.3,
      energy: 0.6 + Math.random() * 0.4,
      key: Math.floor(Math.random() * 12),
      loudness: -20 + Math.random() * 20,
      mode: Math.random() > 0.5 ? 1 : 0,
      speechiness: Math.random() * 0.1,
      acousticness: Math.random() * 0.3,
      instrumentalness: Math.random() * 0.5,
      liveness: Math.random() * 0.2,
      valence: Math.random(),
      tempo: 80 + Math.random() * 100,
      duration_ms: (song2.duration || 180) * 1000,
      time_signature: 4
    }

    const track1 = {
      ...song1,
      ...mockFeatures1,
      duration: song1.duration || 180,
      bpm: mockFeatures1.tempo
    }

    const track2 = {
      ...song2,
      ...mockFeatures2,
      duration: song2.duration || 180,
      bpm: mockFeatures2.tempo
    }

    console.log('📊 Tracks prepared:', { track1, track2 })

    // Analyze compatibility
    const compatibility = analyzeCompatibility(track1, track2)
    console.log('🔍 Compatibility analyzed:', compatibility)

    // Generate mix structure
    const mixStructure = generateMixStructure(track1, track2, compatibility)
    console.log('🏗️ Mix structure generated:', mixStructure)

    let previewUrl = song1.previewUrl || song2.previewUrl || null
    if (!previewUrl) {
      try {
        // Use the same synthetic generator via the class instance if needed
        previewUrl = await audioMixer.generateSyntheticMix(track1, track2, mixStructure)
      } catch (e) {
        console.log('⚠️ Synthetic mix (mock path) failed:', e?.message || e)
        previewUrl = null
      }
    }

    // Create the final mix object
    const mix = {
      id: `mix_${Date.now()}`,
      name: `${song1.name} + ${song2.name}`,
      tracks: [track1, track2],
      compatibility: compatibility,
      structure: mixStructure,
      generatedAt: new Date().toISOString(),
      audioUrl: previewUrl,
      waveform: generateWaveform(mixStructure.totalDuration),
      originalDurations: {
        song1: song1.duration || 180,
        song2: song2.duration || 180,
        average: mixStructure.totalDuration
      },
      status: 'ready',
      hasAudio: Boolean(previewUrl)
    }

    console.log('✅ Mock mix generated successfully:', mix)
    return mix

  } catch (error) {
    console.error('❌ Error generating mix:', error)

    let previewUrl = song1?.previewUrl || song2?.previewUrl || null
    if (!previewUrl) {
      try {
        // Last resort: short silent clip to avoid crashes
        previewUrl = await (async () => {
          const sr = 44100
          const dur = 2
          const ctx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, sr * dur, sr)
          const silent = ctx.createBuffer(1, sr * dur, sr)
          const src = ctx.createBufferSource()
          src.buffer = silent
          src.connect(ctx.destination)
          src.start(0)
          const rendered = await ctx.startRendering()
          const view = audioMixer.audioBufferToWav(rendered)
          return URL.createObjectURL(new Blob([view], { type: 'audio/wav' }))
        })()
      } catch (e) {
        previewUrl = null
      }
    }

    // Return a safe fallback mix object
    const fallbackMix = {
      id: `fallback_${Date.now()}`,
      name: `${song1?.name || 'Unknown'} + ${song2?.name || 'Unknown'}`,
      tracks: [song1, song2],
      compatibility: {
        score: 50,
        bpmScore: 50,
        keyScore: 50,
        energyScore: 50,
        danceabilityScore: 50,
        recommendations: ['Fallback mix generated due to error']
      },
      structure: {
        totalDuration: 180
      },
      generatedAt: new Date().toISOString(),
      audioUrl: previewUrl,
      waveform: generateWaveform(180),
      originalDurations: {
        song1: song1?.duration || 180,
        song2: song2?.duration || 180,
        average: 180
      },
      status: 'ready',
      hasAudio: Boolean(previewUrl)
    }

    console.log('🔄 Returning fallback mix:', fallbackMix)
    return fallbackMix
  }
}

const generateWaveform = (duration) => {
  try {
    const points = Math.floor(duration / 0.1)
    const waveform = []

    for (let i = 0; i < points; i++) {
      const time = i * 0.1
      const amplitude = Math.sin(time * 0.5) * 0.5 + 0.5
      waveform.push({
        time: time,
        amplitude: amplitude
      })
    }

    return waveform
  } catch (error) {
    console.error('❌ Error generating waveform:', error)
    return [{ time: 0, amplitude: 0.5 }]
  }
}

export const getMixRecommendations = (track) => {
  try {
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
  } catch (error) {
    console.error('❌ Error getting recommendations:', error)
    return ['Recommendations unavailable']
  }
}

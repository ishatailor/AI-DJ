import { getTrackFeatures } from './spotifyService'

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

      // Enforce: only generate a mix if BOTH songs have a preview available
      if (!song1?.previewUrl || !song2?.previewUrl) {
        throw new Error('Both selected songs must have a Spotify preview available to generate a mix')
      }

      // Try to fetch real Spotify audio features (tempo/key). Fallback to mock if unavailable.
      const isSpotifyId = (id) => typeof id === 'string' && /^[A-Za-z0-9]{10,}$/.test(id)
      const keyIndexToName = (idx) => ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][Math.max(0, Math.min(11, Number(idx) || 0))]

      let real1 = null
      let real2 = null
      try {
        if (isSpotifyId(song1.id)) real1 = await getTrackFeatures(song1.id)
      } catch {}
      try {
        if (isSpotifyId(song2.id)) real2 = await getTrackFeatures(song2.id)
      } catch {}

      const mockFeatures1 = {
        danceability: 0.7 + Math.random() * 0.3,
        energy: 0.6 + Math.random() * 0.4,
        key: keyIndexToName(real1?.key ?? Math.floor(Math.random() * 12)),
        loudness: -20 + Math.random() * 20,
        mode: real1?.mode ?? (Math.random() > 0.5 ? 1 : 0),
        speechiness: Math.random() * 0.1,
        acousticness: Math.random() * 0.3,
        instrumentalness: Math.random() * 0.5,
        liveness: Math.random() * 0.2,
        valence: Math.random(),
        tempo: real1?.tempo ?? (80 + Math.random() * 100),
        duration_ms: (song1.duration || 180) * 1000,
        time_signature: 4
      }

      const mockFeatures2 = {
        danceability: 0.7 + Math.random() * 0.3,
        energy: 0.6 + Math.random() * 0.4,
        key: keyIndexToName(real2?.key ?? Math.floor(Math.random() * 12)),
        loudness: -20 + Math.random() * 20,
        mode: real2?.mode ?? (Math.random() > 0.5 ? 1 : 0),
        speechiness: Math.random() * 0.1,
        acousticness: Math.random() * 0.3,
        instrumentalness: Math.random() * 0.5,
        liveness: Math.random() * 0.2,
        valence: Math.random(),
        tempo: real2?.tempo ?? (80 + Math.random() * 100),
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

      // Generate mix structure then clamp to 30s preview
      const mixStructure = generateMixStructure(track1, track2, compatibility)
      const PREVIEW_DURATION = 30
      mixStructure.totalDuration = PREVIEW_DURATION
      console.log('🏗️ Mix structure generated:', mixStructure)

      // Render a real 30s overlay mix from both previews (tempo-aligned, EQ'd)
      let audioUrl = null
      try {
        audioUrl = await this.generateOverlayPreviewMix(track1, track2, 30)
      } catch (mixErr) {
        console.log('⚠️ Overlay mix rendering failed, falling back to a single preview URL:', mixErr?.message || mixErr)
        audioUrl = song1.previewUrl || song2.previewUrl
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
        waveform: generateWaveform(30),
        originalDurations: {
          song1: song1.duration || 180,
          song2: song2.duration || 180,
          average: mixStructure.totalDuration
        },
        song1: song1,
        song2: song2,
        duration: 30,
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

  async fetchAndDecode(url) {
    // Route through backend proxy to avoid CORS issues on external previews
    const proxied = `/api/proxy?url=${encodeURIComponent(url)}`
    const response = await fetch(proxied)
    const arrayBuffer = await response.arrayBuffer()
    // Use a temporary online context to decode if needed
    const ctx = this.audioContext || new (window.AudioContext || window.webkitAudioContext)()
    return await ctx.decodeAudioData(arrayBuffer)
  }

  async generateOverlayPreviewMix(track1, track2, durationSec = 30) {
    const sr = 44100
    const channels = 2
    const ctx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(channels, sr * durationSec, sr)

    const master = ctx.createGain()
    master.gain.value = 1.0
    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -8
    compressor.knee.value = 20
    compressor.ratio.value = 3
    compressor.attack.value = 0.003
    compressor.release.value = 0.25
    master.connect(compressor).connect(ctx.destination)

    // Decode previews
    const [buf1, buf2] = await Promise.all([
      this.fetchAndDecode(track1.previewUrl),
      this.fetchAndDecode(track2.previewUrl)
    ])

    // Target BPM as weighted average, clamp playbackRate range for quality
    const targetBpm = Math.max(70, Math.min(150, Math.round(((track1.bpm || 120) * 0.6 + (track2.bpm || 120) * 0.4))))
    const rate1 = Math.max(0.85, Math.min(1.25, targetBpm / (track1.bpm || 120)))
    const rate2 = Math.max(0.85, Math.min(1.25, targetBpm / (track2.bpm || 120)))

    const src1 = ctx.createBufferSource()
    src1.buffer = buf1
    src1.playbackRate.value = rate1
    const src2 = ctx.createBufferSource()
    src2.buffer = buf2
    src2.playbackRate.value = rate2

    // Track 1 chain (keep lows), light mid dip
    const g1 = ctx.createGain()
    const p1 = ctx.createBiquadFilter()
    p1.type = 'peaking'
    p1.frequency.value = 300
    p1.Q.value = 1
    p1.gain.value = -1.5
    src1.connect(p1).connect(g1).connect(master)

    // Track 2 chain (highpass to avoid low-end clash)
    const g2 = ctx.createGain()
    const hp2 = ctx.createBiquadFilter()
    hp2.type = 'highpass'
    hp2.frequency.value = 120
    hp2.Q.value = 0.707
    src2.connect(hp2).connect(g2).connect(master)

    // Scheduling
    // Track 1: fade in 0-2s to 1.0; duck when track2 comes in; fade out 20-30s
    g1.gain.setValueAtTime(0.0, 0)
    g1.gain.linearRampToValueAtTime(1.0, 2.0)
    // Duck around track2 entry window 8-12s
    g1.gain.linearRampToValueAtTime(0.6, 10.0)
    // Recover a bit 12-20s
    g1.gain.linearRampToValueAtTime(0.85, 20.0)
    // Fade out
    g1.gain.linearRampToValueAtTime(0.0, durationSec)

    // Track 2: start at 8s, fade in to 0.9 by 10s, ride, then slight lift to end
    const t2Start = 8.0
    g2.gain.setValueAtTime(0.0, t2Start)
    g2.gain.linearRampToValueAtTime(0.9, t2Start + 2.0)
    g2.gain.linearRampToValueAtTime(1.0, durationSec)

    // Start offsets to avoid cold intros
    const off1 = Math.min(10, Math.max(0, buf1.duration * 0.1))
    const off2 = Math.min(10, Math.max(0, buf2.duration * 0.2))

    const maxDur1 = Math.min(durationSec, (buf1.duration - off1) / rate1)
    const maxDur2 = Math.min(Math.max(0, durationSec - t2Start), (buf2.duration - off2) / rate2)

    src1.start(0, off1, Math.max(0, maxDur1))
    src2.start(t2Start, off2, Math.max(0, maxDur2))

    const renderedBuffer = await ctx.startRendering()
    const wav = this.audioBufferToWav(renderedBuffer)
    const blob = new Blob([wav], { type: 'audio/wav' })
    const url = URL.createObjectURL(blob)
    return url
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
    // Enforce preview availability for both songs
    if (!song1?.previewUrl || !song2?.previewUrl) {
      throw new Error('Both selected songs must have a Spotify preview available to generate a mix')
    }

    const realMix = await audioMixer.createMix(song1, song2)
    console.log('✅ Mix created successfully with previews')
    return realMix

  } catch (error) {
    console.error('❌ Error generating mix:', error)
    throw error
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

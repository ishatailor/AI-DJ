class LocalAudioMixer {
  constructor() {
    this.audioContext = null
    this.masterGain = null
    this.compressor = null
  }

  async initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.compressor = this.audioContext.createDynamicsCompressor()
      
      // Configure compressor for better mix
      this.compressor.threshold.value = -24
      this.compressor.knee.value = 30
      this.compressor.ratio.value = 12
      this.compressor.attack.value = 0.003
      this.compressor.release.value = 0.25
      
      // Connect compressor to master
      this.compressor.connect(this.audioContext.destination)
      this.masterGain.connect(this.compressor)
      
      console.log('✅ LocalAudioMixer initialized successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to initialize LocalAudioMixer:', error)
      return false
    }
  }

  async generateMix(track1, track2, durationSec = 30) {
    if (!this.audioContext) {
      throw new Error('AudioMixer not initialized')
    }

    try {
      console.log('🎵 Starting local mix generation...')
      console.log('📊 Track 1:', track1.name, 'Duration:', track1.duration)
      console.log('📊 Track 2:', track2.name, 'Duration:', track2.duration)

      // Create offline context for rendering
      const offlineCtx = new OfflineAudioContext(
        2, // Stereo
        durationSec * this.audioContext.sampleRate,
        this.audioContext.sampleRate
      )

      // Analyze tracks for compatibility
      const analysis = this.analyzeTracks(track1, track2)
      console.log('🔍 Track analysis:', analysis)

      // Generate mix structure
      const mixStructure = this.generateMixStructure(track1, track2, durationSec, analysis)
      console.log('🎛️ Mix structure:', mixStructure)

      // Create and connect audio sources
      const source1 = offlineCtx.createBufferSource()
      const source2 = offlineCtx.createBufferSource()
      
      source1.buffer = track1.audioBuffer
      source2.buffer = track2.audioBuffer

      // Create processing chains
      const chain1 = this.createTrackChain(offlineCtx, 'track1')
      const chain2 = this.createTrackChain(offlineCtx, 'track2')

      // Connect sources to chains
      source1.connect(chain1.input)
      source2.connect(chain2.input)

      // Connect chains to master
      chain1.output.connect(offlineCtx.destination)
      chain2.output.connect(offlineCtx.destination)

      // Apply mix automation
      this.applyMixAutomation(offlineCtx, source1, source2, chain1, chain2, mixStructure)

      // Start playback
      source1.start(0)
      source2.start(mixStructure.track2Start)

      // Render the mix
      console.log('🎬 Rendering mix...')
      const renderedBuffer = await offlineCtx.startRendering()
      console.log('✅ Mix rendered successfully')

      return {
        audioBuffer: renderedBuffer,
        duration: renderedBuffer.duration,
        sampleRate: renderedBuffer.sampleRate,
        mixStructure: mixStructure,
        analysis: analysis
      }

    } catch (error) {
      console.error('❌ Error generating mix:', error)
      throw error
    }
  }

  createTrackChain(ctx, trackType) {
    const input = ctx.createGain()
    const eq = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    const output = ctx.createGain()

    // Configure EQ based on track type
    if (trackType === 'track1') {
      // Track 1: Full frequency range
      eq.type = 'peaking'
      eq.frequency.value = 1000
      eq.Q.value = 1
      eq.gain.value = 0
    } else {
      // Track 2: High-pass to avoid low-end clash
      eq.type = 'highpass'
      eq.frequency.value = 120
      eq.Q.value = 1
    }

    // Connect the chain
    input.connect(eq)
    eq.connect(gain)
    gain.connect(output)

    return { input, eq, gain, output }
  }

  analyzeTracks(track1, track2) {
    const analysis = {
      bpmDifference: Math.abs(track1.tempo - track2.tempo),
      keyCompatibility: this.analyzeKeyCompatibility(track1.key, track2.key),
      energyBalance: Math.abs(track1.energy - track2.energy),
      durationRatio: Math.min(track1.duration, track2.duration) / Math.max(track1.duration, track2.duration)
    }

    // Calculate overall compatibility score (0-100)
    analysis.compatibilityScore = this.calculateCompatibilityScore(analysis)
    
    return analysis
  }

  analyzeKeyCompatibility(key1, key2) {
    const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    const key1Index = keys.indexOf(key1)
    const key2Index = keys.indexOf(key2)
    
    if (key1Index === -1 || key2Index === -1) return 'unknown'
    
    const distance = Math.abs(key1Index - key2Index)
    
    if (distance === 0) return 'perfect' // Same key
    if (distance === 1 || distance === 6) return 'good' // Adjacent or relative
    if (distance === 2 || distance === 5) return 'moderate' // Somewhat compatible
    return 'challenging' // May clash
  }

  calculateCompatibilityScore(analysis) {
    let score = 100
    
    // BPM difference penalty
    if (analysis.bpmDifference > 20) score -= 30
    else if (analysis.bpmDifference > 10) score -= 15
    
    // Key compatibility penalty
    if (analysis.keyCompatibility === 'challenging') score -= 25
    else if (analysis.keyCompatibility === 'moderate') score -= 15
    else if (analysis.keyCompatibility === 'good') score -= 5
    
    // Energy balance penalty
    if (analysis.energyBalance > 0.6) score -= 20
    else if (analysis.energyBalance > 0.4) score -= 10
    
    return Math.max(0, score)
  }

  generateMixStructure(track1, track2, durationSec, analysis) {
    const structure = {
      duration: durationSec,
      track1Start: 0,
      track2Start: 0,
      crossfadeStart: 0,
      crossfadeDuration: 0,
      sections: []
    }

    // Determine track 2 start time based on compatibility
    if (analysis.compatibilityScore > 70) {
      // High compatibility: start track 2 early for longer blend
      structure.track2Start = durationSec * 0.3
      structure.crossfadeStart = durationSec * 0.4
      structure.crossfadeDuration = durationSec * 0.4
    } else if (analysis.compatibilityScore > 40) {
      // Medium compatibility: moderate overlap
      structure.track2Start = durationSec * 0.4
      structure.crossfadeStart = durationSec * 0.5
      structure.crossfadeDuration = durationSec * 0.3
    } else {
      // Low compatibility: minimal overlap
      structure.track2Start = durationSec * 0.6
      structure.crossfadeStart = durationSec * 0.7
      structure.crossfadeDuration = durationSec * 0.2
    }

    // Define mix sections
    structure.sections = [
      { name: 'intro', start: 0, end: structure.track2Start, description: 'Track 1 solo' },
      { name: 'transition', start: structure.track2Start, end: structure.crossfadeStart, description: 'Track 2 enters' },
      { name: 'crossfade', start: structure.crossfadeStart, end: structure.crossfadeStart + structure.crossfadeDuration, description: 'Both tracks blend' },
      { name: 'outro', start: structure.crossfadeStart + structure.crossfadeDuration, end: durationSec, description: 'Track 2 solo' }
    ]

    return structure
  }

  applyMixAutomation(ctx, source1, source2, chain1, chain2, mixStructure) {
    const currentTime = ctx.currentTime

    // Track 1 automation
    chain1.gain.gain.setValueAtTime(1, currentTime)
    chain1.gain.gain.linearRampToValueAtTime(0.8, currentTime + mixStructure.track2Start)
    chain1.gain.gain.linearRampToValueAtTime(0, currentTime + mixStructure.crossfadeStart + mixStructure.crossfadeDuration)

    // Track 2 automation
    chain2.gain.gain.setValueAtTime(0, currentTime + mixStructure.track2Start)
    chain2.gain.gain.linearRampToValueAtTime(0.6, currentTime + mixStructure.track2Start + 1)
    chain2.gain.gain.linearRampToValueAtTime(1, currentTime + mixStructure.crossfadeStart + mixStructure.crossfadeDuration)

    // Apply tempo adjustment if needed
    if (Math.abs(source1.buffer.duration - source2.buffer.duration) > 0.1) {
      const tempoRatio = source1.buffer.duration / source2.buffer.duration
      source2.playbackRate.value = tempoRatio
      console.log('🎵 Applied tempo adjustment:', tempoRatio)
    }
  }

  async playMix(audioBuffer) {
    if (!this.audioContext) {
      throw new Error('AudioMixer not initialized')
    }

    try {
      const source = this.audioContext.createBufferSource()
      source.buffer = audioBuffer
      
      source.connect(this.masterGain)
      source.start(0)
      
      console.log('🎵 Playing mix...')
      return source
    } catch (error) {
      console.error('❌ Error playing mix:', error)
      throw error
    }
  }

  stopMix() {
    if (this.audioContext) {
      this.audioContext.suspend()
    }
  }

  resumeMix() {
    if (this.audioContext) {
      this.audioContext.resume()
    }
  }

  setMasterVolume(volume) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume))
    }
  }

  dispose() {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.masterGain = null
    this.compressor = null
  }
}

export default LocalAudioMixer
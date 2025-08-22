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

  async generateMix(track1, track2, durationSec = null) {
    if (!this.audioContext) {
      throw new Error('AudioMixer not initialized')
    }

    try {
      console.log('🎵 Starting local mix generation...')
      console.log('📊 Track 1:', track1.name, 'Duration:', track1.duration)
      console.log('📊 Track 2:', track2.name, 'Duration:', track2.duration)

      // Calculate mix duration as average of both songs for equal emphasis
      const mixDuration = durationSec || Math.round((track1.duration + track2.duration) / 2)
      console.log('🎯 Mix duration (average):', mixDuration, 'seconds')

      // Create offline context for rendering
      const offlineCtx = new OfflineAudioContext(
        2, // Stereo
        mixDuration * this.audioContext.sampleRate,
        this.audioContext.sampleRate
      )

      // Analyze tracks for compatibility
      const analysis = this.analyzeTracks(track1, track2)
      console.log('🔍 Track analysis:', analysis)

      // Generate intelligent mix structure with equal emphasis
      const mixStructure = this.generateBalancedMixStructure(track1, track2, mixDuration, analysis)
      console.log('🎛️ Balanced mix structure:', mixStructure)

      // Create and connect audio sources with intelligent song selection
      const source1 = offlineCtx.createBufferSource()
      const source2 = offlineCtx.createBufferSource()
      
      // Select the best parts of each song for mixing
      const track1Selection = this.selectBestSongSection(track1, mixStructure.track1Duration, analysis)
      const track2Selection = this.selectBestSongSection(track2, mixStructure.track2Duration, analysis)
      
      source1.buffer = track1Selection.buffer
      source2.buffer = track2Selection.buffer

      console.log('🎵 Selected sections - Track 1:', track1Selection.startTime, 'to', track1Selection.startTime + track1Selection.duration)
      console.log('🎵 Selected sections - Track 2:', track2Selection.startTime, 'to', track2Selection.startTime + track2Selection.duration)

      // Create processing chains
      const chain1 = this.createTrackChain(offlineCtx, 'track1')
      const chain2 = this.createTrackChain(offlineCtx, 'track2')

      // Connect sources to chains
      source1.connect(chain1.input)
      source2.connect(chain2.input)

      // Connect chains to master
      chain1.output.connect(offlineCtx.destination)
      chain2.output.connect(offlineCtx.destination)

      // Apply balanced mix automation
      this.applyBalancedMixAutomation(offlineCtx, source1, source2, chain1, chain2, mixStructure, track1Selection, track2Selection)

      // Start playback with calculated offsets
      source1.start(0, track1Selection.startTime, track1Selection.duration)
      source2.start(mixStructure.track2Start, track2Selection.startTime, track2Selection.duration)

      // Render the mix
      console.log('🎬 Rendering balanced mix...')
      const renderedBuffer = await offlineCtx.startRendering()
      console.log('✅ Balanced mix rendered successfully')

      return {
        audioBuffer: renderedBuffer,
        duration: renderedBuffer.duration,
        sampleRate: renderedBuffer.sampleRate,
        mixStructure: mixStructure,
        analysis: analysis,
        trackSelections: {
          track1: track1Selection,
          track2: track2Selection
        }
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

  generateBalancedMixStructure(track1, track2, durationSec, analysis) {
    const structure = {
      duration: durationSec,
      track1Duration: durationSec / 2, // Equal emphasis on both tracks
      track2Duration: durationSec / 2,
      track1Start: 0,
      track2Start: 0,
      crossfadeStart: 0,
      crossfadeDuration: 0,
      sections: []
    }

    // Calculate optimal timing for equal emphasis
    if (analysis.compatibilityScore > 70) {
      // High compatibility: longer crossfade for smooth blend
      structure.track2Start = durationSec * 0.3
      structure.crossfadeStart = durationSec * 0.4
      structure.crossfadeDuration = durationSec * 0.4
    } else if (analysis.compatibilityScore > 40) {
      // Medium compatibility: moderate overlap
      structure.track2Start = durationSec * 0.35
      structure.crossfadeStart = durationSec * 0.45
      structure.crossfadeDuration = durationSec * 0.35
    } else {
      // Low compatibility: minimal overlap to avoid clashes
      structure.track2Start = durationSec * 0.45
      structure.crossfadeStart = durationSec * 0.55
      structure.crossfadeDuration = durationSec * 0.25
    }

    // Define mix sections with equal emphasis
    structure.sections = [
      { 
        name: 'intro', 
        start: 0, 
        end: structure.track2Start, 
        description: `Track 1 focus (${Math.round((structure.track2Start / durationSec) * 100)}% of mix)`,
        track: 'track1'
      },
      { 
        name: 'transition', 
        start: structure.track2Start, 
        end: structure.crossfadeStart, 
        description: 'Track 2 enters gradually',
        track: 'both'
      },
      { 
        name: 'crossfade', 
        start: structure.crossfadeStart, 
        end: structure.crossfadeStart + structure.crossfadeDuration, 
        description: 'Both tracks blend equally',
        track: 'both'
      },
      { 
        name: 'outro', 
        start: structure.crossfadeStart + structure.crossfadeDuration, 
        end: durationSec, 
        description: `Track 2 focus (${Math.round(((durationSec - (structure.crossfadeStart + structure.crossfadeDuration)) / durationSec) * 100)}% of mix)`,
        track: 'track2'
      }
    ]

    return structure
  }

  selectBestSongSection(track, targetDuration, analysis) {
    const trackDuration = track.audioBuffer.duration
    const sampleRate = track.audioBuffer.sampleRate
    
    // If track is shorter than target, use the whole track
    if (trackDuration <= targetDuration) {
      return {
        buffer: track.audioBuffer,
        startTime: 0,
        duration: trackDuration,
        reason: 'Full track used (shorter than target)'
      }
    }

    // For longer tracks, select the most compatible section
    const possibleSections = this.findCompatibleSections(track, targetDuration, analysis)
    
    if (possibleSections.length === 0) {
      // Fallback: use middle section
      const startTime = (trackDuration - targetDuration) / 2
      return {
        buffer: track.audioBuffer,
        startTime: startTime,
        duration: targetDuration,
        reason: 'Middle section (fallback)'
      }
    }

    // Select the section with highest compatibility score
    const bestSection = possibleSections.reduce((best, current) => 
      current.compatibilityScore > best.compatibilityScore ? current : best
    )

    return {
      buffer: track.audioBuffer,
      startTime: bestSection.startTime,
      duration: targetDuration,
      reason: `Best compatible section (score: ${bestSection.compatibilityScore})`
    }
  }

  findCompatibleSections(track, targetDuration, analysis) {
    const trackDuration = track.audioBuffer.duration
    const sections = []
    const stepSize = Math.max(1, targetDuration / 4) // Check every quarter of target duration
    
    for (let startTime = 0; startTime <= trackDuration - targetDuration; startTime += stepSize) {
      const endTime = startTime + targetDuration
      
      // Analyze this section's characteristics
      const sectionAnalysis = this.analyzeSongSection(track, startTime, endTime)
      
      // Calculate compatibility with the other track
      const compatibilityScore = this.calculateSectionCompatibility(sectionAnalysis, analysis)
      
      sections.push({
        startTime,
        endTime,
        compatibilityScore,
        analysis: sectionAnalysis
      })
    }
    
    return sections.filter(section => section.compatibilityScore > 30) // Only return reasonably compatible sections
  }

  analyzeSongSection(track, startTime, endTime) {
    // This is a simplified analysis - in a real implementation, you'd analyze the actual audio data
    // For now, we'll use the track's overall characteristics but add some variation
    const sectionDuration = endTime - startTime
    const sectionPosition = startTime / track.duration // 0 = start, 1 = end
    
    return {
      energy: track.energy * (0.8 + 0.4 * Math.sin(sectionPosition * Math.PI)), // Vary energy based on position
      danceability: track.danceability * (0.9 + 0.2 * Math.random()),
      intensity: sectionPosition > 0.3 && sectionPosition < 0.7 ? 1.2 : 0.8, // Middle sections tend to be more intense
      duration: sectionDuration
    }
  }

  calculateSectionCompatibility(sectionAnalysis, overallAnalysis) {
    let score = 100
    
    // Energy balance
    const energyDiff = Math.abs(sectionAnalysis.energy - overallAnalysis.energyBalance)
    if (energyDiff > 0.5) score -= 20
    else if (energyDiff > 0.3) score -= 10
    
    // Intensity compatibility
    if (sectionAnalysis.intensity > 1.1 && overallAnalysis.energyBalance < 0.4) score -= 15
    if (sectionAnalysis.intensity < 0.9 && overallAnalysis.energyBalance > 0.7) score -= 15
    
    return Math.max(0, score)
  }

  applyBalancedMixAutomation(ctx, source1, source2, chain1, chain2, mixStructure, track1Selection, track2Selection) {
    const currentTime = ctx.currentTime

    // Track 1 automation - equal emphasis
    chain1.gain.gain.setValueAtTime(1, currentTime)
    chain1.gain.gain.linearRampToValueAtTime(0.9, currentTime + mixStructure.track2Start)
    chain1.gain.gain.linearRampToValueAtTime(0.5, currentTime + mixStructure.crossfadeStart)
    chain1.gain.gain.linearRampToValueAtTime(0, currentTime + mixStructure.crossfadeStart + mixStructure.crossfadeDuration)

    // Track 2 automation - equal emphasis
    chain2.gain.gain.setValueAtTime(0, currentTime + mixStructure.track2Start)
    chain2.gain.gain.linearRampToValueAtTime(0.7, currentTime + mixStructure.track2Start + 1)
    chain2.gain.gain.linearRampToValueAtTime(0.5, currentTime + mixStructure.crossfadeStart)
    chain2.gain.gain.linearRampToValueAtTime(1, currentTime + mixStructure.crossfadeStart + mixStructure.crossfadeDuration)

    // Apply tempo adjustment if needed for better compatibility
    if (Math.abs(track1Selection.duration - track2Selection.duration) > 0.1) {
      const tempoRatio = track1Selection.duration / track2Selection.duration
      source2.playbackRate.value = tempoRatio
      console.log('🎵 Applied tempo adjustment for compatibility:', tempoRatio)
    }

    // Add subtle EQ adjustments for better blend
    if (mixStructure.crossfadeDuration > 0) {
      // High-pass filter on track 2 during crossfade to avoid low-end clash
      chain2.eq.frequency.setValueAtTime(120, currentTime + mixStructure.crossfadeStart)
      chain2.eq.frequency.linearRampToValueAtTime(80, currentTime + mixStructure.crossfadeStart + mixStructure.crossfadeDuration)
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
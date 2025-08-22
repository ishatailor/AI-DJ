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
      console.log('🎵 Starting balanced Zedd-style mix generation...')
      console.log('📊 Track 1:', track1.name, 'Duration:', track1.duration)
      console.log('📊 Track 2:', track2.name, 'Duration:', track2.duration)

      // Use exact demo structure: 120 seconds (128 bars at 128 BPM)
      const mixDuration = 120
      console.log('🎯 Mix duration (demo structure):', mixDuration, 'seconds (128 bars at 128 BPM)')

      // Create offline context for rendering
      const offlineCtx = new OfflineAudioContext(
        2, // Stereo
        mixDuration * this.audioContext.sampleRate,
        this.audioContext.sampleRate
      )

      // Analyze tracks for compatibility and find optimal mixing points
      const analysis = this.analyzeTracks(track1, track2)
      console.log('🔍 Track analysis:', analysis)

      // Find optimal mixing points based on real audio characteristics
      const mixingPoints = await this.findOptimalMixingPoints(track1, track2, mixDuration, analysis)
      console.log('🎯 Optimal mixing points found:', mixingPoints)

      // Generate balanced mix structure following demo exactly
      const mixStructure = this.generateBalancedMixStructure(track1, track2, mixDuration, mixingPoints, analysis)
      console.log('🎛️ Balanced mix structure:', mixStructure)

      // Create and connect audio sources with balanced song selection
      const source1 = offlineCtx.createBufferSource()
      const source2 = offlineCtx.createBufferSource()
      
      // Select balanced sections: Track 1 from start, Track 2 from later (no intro)
      const track1Selection = this.selectBalancedTrack1Section(track1, mixStructure.track1Duration, analysis)
      const track2Selection = this.selectBalancedTrack2Section(track2, mixStructure.track2Duration, analysis)
      
      source1.buffer = track1Selection.buffer
      source2.buffer = track2Selection.buffer

      console.log('🎵 Balanced sections selected:')
      console.log('   Track 1:', track1Selection.startTime, 'to', track1Selection.startTime + track1Selection.duration, '(', track1Selection.reason, ')')
      console.log('   Track 2:', track2Selection.startTime, 'to', track2Selection.startTime + track2Selection.duration, '(', track2Selection.reason, ')')

      // Create advanced processing chains
      const chain1 = this.createAdvancedTrackChain(offlineCtx, 'track1', mixingPoints)
      const chain2 = this.createAdvancedTrackChain(offlineCtx, 'track2', mixingPoints)

      // Connect sources to chains
      source1.connect(chain1.input)
      source2.connect(chain2.input)

      // Connect chains to master
      chain1.output.connect(offlineCtx.destination)
      chain2.output.connect(offlineCtx.destination)

      // Apply balanced automation following demo structure
      this.applyBalancedAutomation(offlineCtx, source1, source2, chain1, chain2, mixStructure, mixingPoints, track1Selection, track2Selection)

      // Start playback with calculated offsets
      source1.start(0, track1Selection.startTime, track1Selection.duration)
      source2.start(mixStructure.track2Start, track2Selection.startTime, track2Selection.duration)

      // Render the mix
      console.log('🎬 Rendering balanced Zedd-style mix...')
      const renderedBuffer = await offlineCtx.startRendering()
      console.log('✅ Balanced mix rendered successfully')

      return {
        audioBuffer: renderedBuffer,
        duration: renderedBuffer.duration,
        sampleRate: renderedBuffer.sampleRate,
        mixStructure: mixStructure,
        analysis: analysis,
        mixingPoints: mixingPoints,
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

  generateBalancedMixStructure(track1, track2, durationSec, mixingPoints, analysis) {
    // Follow exact demo structure: 120 seconds, 128 bars at 128 BPM
    const structure = {
      duration: durationSec,
      track1Duration: 48, // Track 1 gets 48 seconds (40%)
      track2Duration: 48, // Track 2 gets 48 seconds (40%)
      track1Start: 0,
      track2Start: 48, // Track 2 starts at 48 seconds (after Track 1's main section)
      crossfadeStart: 40, // Start crossfade 8 seconds before Track 2 fully takes over
      crossfadeDuration: 16, // 16 seconds of crossfade
      vocalOverlayStart: 44, // Vocal overlay during crossfade
      vocalOverlayDuration: 8, // 8 seconds of vocal layering
      buildUpSection: null,
      dropSection: null,
      breakdownSection: null,
      sections: []
    }

    // Create exact demo structure sections
    structure.sections = [
      // Track 1 Section (0-48 seconds)
      {
        name: 'intro',
        start: 0,
        end: 16,
        description: 'Track 1 intro (16 bars = 8 seconds)',
        track: 'track1',
        type: 'solo',
        bars: 16
      },
      {
        name: 'build-up-1',
        start: 16,
        end: 32,
        description: 'Track 1 build-up (16 bars = 8 seconds)',
        track: 'track1',
        type: 'build-up',
        bars: 16
      },
      {
        name: 'drop-1',
        start: 32,
        end: 48,
        description: 'Track 1 first drop (16 bars = 8 seconds)',
        track: 'track1',
        type: 'drop',
        bars: 16
      },
      
      // Transition Section (48-64 seconds)
      {
        name: 'transition',
        start: 48,
        end: 64,
        description: 'Track 2 enters, Track 1 fades (16 bars = 8 seconds)',
        track: 'both',
        type: 'crossfade',
        bars: 16
      },
      
      // Track 2 Section (64-112 seconds)
      {
        name: 'build-up-2',
        start: 64,
        end: 80,
        description: 'Track 2 build-up (16 bars = 8 seconds)',
        track: 'track2',
        type: 'build-up',
        bars: 16
      },
      {
        name: 'drop-2',
        start: 80,
        end: 96,
        description: 'Track 2 main drop (16 bars = 8 seconds)',
        track: 'track2',
        type: 'drop',
        bars: 16
      },
      {
        name: 'breakdown',
        start: 96,
        end: 104,
        description: 'Track 2 breakdown (8 bars = 4 seconds)',
        track: 'track2',
        type: 'breakdown',
        bars: 8
      },
      {
        name: 'final-build',
        start: 104,
        end: 112,
        description: 'Final build-up (8 bars = 4 seconds)',
        track: 'track2',
        type: 'build-up',
        bars: 8
      },
      
      // Final Section (112-120 seconds)
      {
        name: 'final-drop',
        start: 112,
        end: 120,
        description: 'Epic final drop with both tracks (8 bars = 4 seconds)',
        track: 'both',
        type: 'final-drop',
        bars: 8
      }
    ]

    return structure
  }

  selectBalancedTrack1Section(track, targetDuration, analysis) {
    const trackDuration = track.audioBuffer.duration
    
    // Track 1: Start from beginning (intro, build-up, drop)
    // This gives the mix its foundation and identity
    if (trackDuration <= targetDuration) {
      return {
        buffer: track.audioBuffer,
        startTime: 0,
        duration: trackDuration,
        reason: 'Full track used from beginning (shorter than target)'
      }
    }

    // For longer tracks, use the beginning section
    // This ensures we get the intro, build-up, and first drop
    return {
      buffer: track.audioBuffer,
      startTime: 0,
      duration: targetDuration,
      reason: 'Beginning section (intro → build-up → drop)'
    }
  }

  selectBalancedTrack2Section(track, targetDuration, analysis) {
    const trackDuration = track.audioBuffer.duration
    
    // Track 2: Skip intro, start from build-up or verse
    // This prevents duplicate beginnings and creates variety
    
    if (trackDuration <= targetDuration) {
      // If track is shorter, use it all but start from a later point
      const skipIntro = Math.min(trackDuration * 0.2, 8) // Skip first 20% or 8 seconds
      const availableDuration = trackDuration - skipIntro
      
      if (availableDuration >= targetDuration) {
        return {
          buffer: track.audioBuffer,
          startTime: skipIntro,
          duration: targetDuration,
          reason: 'Track 2 from build-up (skipped intro)'
        }
      } else {
        return {
          buffer: track.audioBuffer,
          startTime: skipIntro,
          duration: availableDuration,
          reason: 'Track 2 from build-up (full remaining duration)'
        }
      }
    }

    // For longer tracks, find the best section starting after intro
    const skipIntro = Math.min(trackDuration * 0.2, 12) // Skip first 20% or 12 seconds
    const remainingDuration = trackDuration - skipIntro
    
    if (remainingDuration >= targetDuration) {
      // Find the best section after the intro
      const bestSection = this.findBestTrack2Section(track, skipIntro, targetDuration, analysis)
      
      return {
        buffer: track.audioBuffer,
        startTime: bestSection.startTime,
        duration: targetDuration,
        reason: `Best section after intro: ${bestSection.reason}`
      }
    } else {
      // Use all remaining duration after intro
      return {
        buffer: track.audioBuffer,
        startTime: skipIntro,
        duration: remainingDuration,
        reason: 'Full remaining duration after intro'
      }
    }
  }

  findBestTrack2Section(track, startAfter, targetDuration, analysis) {
    const trackDuration = track.audioBuffer.duration
    const sections = []
    const stepSize = Math.max(1, targetDuration / 4) // Check every quarter of target duration
    
    for (let startTime = startAfter; startTime <= trackDuration - targetDuration; startTime += stepSize) {
      const endTime = startTime + targetDuration
      
      // Analyze this section's characteristics
      const sectionAnalysis = this.analyzeSongSection(track, startTime, endTime)
      
      // Calculate compatibility with the other track
      const compatibilityScore = this.calculateSectionCompatibility(sectionAnalysis, analysis)
      
      // Bonus for sections that start with energy (build-up, verse, etc.)
      const energyBonus = sectionAnalysis.intensity > 0.8 ? 20 : 0
      const finalScore = compatibilityScore + energyBonus
      
      sections.push({
        startTime,
        endTime,
        compatibilityScore: finalScore,
        analysis: sectionAnalysis,
        reason: this.describeSectionType(sectionAnalysis)
      })
    }
    
    // Return the section with highest score
    if (sections.length > 0) {
      return sections.reduce((best, current) => 
        current.compatibilityScore > best.compatibilityScore ? current : best
      )
    }
    
    // Fallback: use section starting after intro
    return {
      startTime: startAfter,
      endTime: startAfter + targetDuration,
      compatibilityScore: 50,
      reason: 'Fallback: section after intro'
    }
  }

  describeSectionType(sectionAnalysis) {
    if (sectionAnalysis.intensity > 1.1) return 'High energy (drop/chorus)'
    if (sectionAnalysis.intensity > 0.9) return 'Medium energy (verse/build-up)'
    return 'Lower energy (breakdown/verse)'
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

  applyBalancedAutomation(ctx, source1, source2, chain1, chain2, mixStructure, mixingPoints, track1Selection, track2Selection) {
    const currentTime = ctx.currentTime

    // Track 1 automation with Zedd-style progressive house techniques
    chain1.gain.gain.setValueAtTime(1, currentTime)
    
    // Handle build-up section if present
    if (mixStructure.buildUpSection) {
      // Gradual energy increase during build-up
      chain1.gain.gain.linearRampToValueAtTime(1.2, currentTime + mixStructure.buildUpSection.start)
      chain1.gain.gain.linearRampToValueAtTime(1.4, currentTime + mixStructure.buildUpSection.start + mixStructure.buildUpSection.duration)
    }
    
    // Transition to track 2
    chain1.gain.gain.linearRampToValueAtTime(0.95, currentTime + mixStructure.track2Start)
    chain1.gain.gain.linearRampToValueAtTime(0.7, currentTime + mixStructure.crossfadeStart)
    chain1.gain.gain.linearRampToValueAtTime(0.3, currentTime + mixStructure.crossfadeStart + mixStructure.crossfadeDuration * 0.5)
    chain1.gain.gain.linearRampToValueAtTime(0, currentTime + mixStructure.crossfadeStart + mixStructure.crossfadeDuration)

    // Track 2 automation with Zedd-style techniques
    chain2.gain.gain.setValueAtTime(0, currentTime + mixStructure.track2Start)
    chain2.gain.gain.linearRampToValueAtTime(0.6, currentTime + mixStructure.track2Start + 1)
    chain2.gain.gain.linearRampToValueAtTime(0.7, currentTime + mixStructure.crossfadeStart)
    chain2.gain.gain.linearRampToValueAtTime(0.8, currentTime + mixStructure.crossfadeStart + mixStructure.crossfadeDuration * 0.5)
    chain2.gain.gain.linearRampToValueAtTime(1, currentTime + mixStructure.crossfadeStart + mixStructure.crossfadeDuration)

    // Apply tempo adjustment for better compatibility
    if (Math.abs(track1Selection.duration - track2Selection.duration) > 0.1) {
      const tempoRatio = track1Selection.duration / track2Selection.duration
      source2.playbackRate.value = tempoRatio
      console.log('🎵 Applied tempo adjustment for compatibility:', tempoRatio)
    }

    // Dynamic EQ adjustments during crossfade (Zedd-style frequency management)
    if (mixStructure.crossfadeDuration > 0) {
      // High-pass filter on track 2 during crossfade to avoid low-end clash
      chain2.eq.frequency.setValueAtTime(120, currentTime + mixStructure.crossfadeStart)
      chain2.eq.frequency.linearRampToValueAtTime(80, currentTime + mixStructure.crossfadeStart + mixStructure.crossfadeDuration)
      
      // Boost mid-range on track 1 during crossfade for vocal clarity
      chain1.eq.frequency.setValueAtTime(1000, currentTime + mixStructure.crossfadeStart)
      chain1.eq.gain.setValueAtTime(0, currentTime + mixStructure.crossfadeStart)
      chain1.eq.gain.linearRampToValueAtTime(3, currentTime + mixStructure.crossfadeStart + mixStructure.crossfadeDuration * 0.5)
      chain1.eq.gain.linearRampToValueAtTime(0, currentTime + mixStructure.crossfadeStart + mixStructure.crossfadeDuration)
    }

    // Build-up section automation
    if (mixStructure.buildUpSection) {
      // Increase bass and energy during build-up
      chain1.eq.frequency.setValueAtTime(100, currentTime + mixStructure.buildUpSection.start)
      chain1.eq.gain.setValueAtTime(0, currentTime + mixStructure.buildUpSection.start)
      chain1.eq.gain.linearRampToValueAtTime(2, currentTime + mixStructure.buildUpSection.start + mixStructure.buildUpSection.duration)
      
      // Add compression for build-up intensity
      chain1.compressor.threshold.setValueAtTime(-20, currentTime + mixStructure.buildUpSection.start)
      chain1.compressor.threshold.linearRampToValueAtTime(-15, currentTime + mixStructure.buildUpSection.start + mixStructure.buildUpSection.duration)
    }

    // Breakdown section automation
    if (mixStructure.breakdownSection) {
      // Reduce energy during breakdown
      chain1.gain.gain.linearRampToValueAtTime(0.6, currentTime + mixStructure.breakdownSection.start)
      chain1.gain.gain.linearRampToValueAtTime(0.8, currentTime + mixStructure.breakdownSection.start + mixStructure.breakdownSection.duration)
      
      // High-pass filter to create space
      chain1.eq.frequency.setValueAtTime(200, currentTime + mixStructure.breakdownSection.start)
      chain1.eq.frequency.linearRampToValueAtTime(100, currentTime + mixStructure.breakdownSection.start + mixStructure.breakdownSection.duration)
    }

    // Vocal overlay automation with Zedd-style vocal layering
    if (mixStructure.vocalOverlayDuration > 0) {
      // Boost vocals on track 1 during overlay
      chain1.eq.gain.setValueAtTime(3, currentTime + mixStructure.vocalOverlayStart)
      chain1.eq.gain.linearRampToValueAtTime(0, currentTime + mixStructure.vocalOverlayStart + mixStructure.vocalOverlayDuration)
      
      // Reduce vocals on track 2 during overlay, keep instrumental
      chain2.eq.gain.setValueAtTime(-6, currentTime + mixStructure.vocalOverlayStart)
      chain2.eq.gain.linearRampToValueAtTime(0, currentTime + mixStructure.vocalOverlayStart + mixStructure.vocalOverlayDuration)
      
      // Add subtle reverb to vocals for Zedd-style production
      // Note: In a real implementation, you'd add reverb nodes
      console.log('🎤 Applied Zedd-style vocal layering automation')
    }

    // Master compression automation for professional sound
    if (this.compressor) {
      // Increase compression during high-energy sections
      if (mixStructure.buildUpSection) {
        this.compressor.threshold.setValueAtTime(-24, currentTime + mixStructure.buildUpSection.start)
        this.compressor.threshold.linearRampToValueAtTime(-20, currentTime + mixStructure.buildUpSection.start + mixStructure.buildUpSection.duration)
      }
      
      // Reduce compression during breakdown for dynamic contrast
      if (mixStructure.breakdownSection) {
        this.compressor.threshold.setValueAtTime(-20, currentTime + mixStructure.breakdownSection.start)
        this.compressor.threshold.linearRampToValueAtTime(-18, currentTime + mixStructure.breakdownSection.start + mixStructure.breakdownSection.duration)
      }
    }
  }

  async findOptimalMixingPoints(track1, track2, mixDuration, analysis) {
    console.log('🔍 Finding optimal mixing points using professional Zedd-style techniques...')
    
    const points = {
      bassDrop1: null,
      bassDrop2: null,
      vocalPeaks1: [],
      vocalPeaks2: [],
      energyValleys1: [],
      energyValleys2: [],
      beatAlignment: null,
      buildUpPoints1: [],
      buildUpPoints2: [],
      dropPoints1: [],
      dropPoints2: [],
      breakdownPoints1: [],
      breakdownPoints2: []
    }

    // Analyze bass patterns and find drops (Zedd style: dramatic bass drops)
    points.bassDrop1 = await this.findBassDrops(track1.audioBuffer, 0, Math.min(track1.duration, mixDuration * 0.6))
    points.bassDrop2 = await this.findBassDrops(track2.audioBuffer, 0, Math.min(track2.duration, mixDuration * 0.6))
    
    console.log('🎵 Bass drops found - Track 1:', points.bassDrop1, 'Track 2:', points.bassDrop2)

    // Find vocal peaks and energy valleys
    points.vocalPeaks1 = await this.findVocalPeaks(track1.audioBuffer, 0, Math.min(track1.duration, mixDuration * 0.6))
    points.vocalPeaks2 = await this.findVocalPeaks(track2.audioBuffer, 0, Math.min(track2.duration, mixDuration * 0.6))
    
    points.energyValleys1 = await this.findEnergyValleys(track1.audioBuffer, 0, Math.min(track1.duration, mixDuration * 0.6))
    points.energyValleys2 = await this.findEnergyValleys(track2.audioBuffer, 0, Math.min(track2.duration, mixDuration * 0.6))

    // Find build-up and drop points (progressive house structure)
    points.buildUpPoints1 = await this.findBuildUpPoints(track1.audioBuffer, 0, Math.min(track1.duration, mixDuration * 0.6))
    points.buildUpPoints2 = await this.findBuildUpPoints(track2.audioBuffer, 0, Math.min(track2.duration, mixDuration * 0.6))
    
    points.dropPoints1 = await this.findDropPoints(track1.audioBuffer, 0, Math.min(track1.duration, mixDuration * 0.6))
    points.dropPoints2 = await this.findDropPoints(track2.audioBuffer, 0, Math.min(track2.duration, mixDuration * 0.6))
    
    points.breakdownPoints1 = await this.findBreakdownPoints(track1.audioBuffer, 0, Math.min(track1.duration, mixDuration * 0.6))
    points.breakdownPoints2 = await this.findBreakdownPoints(track2.audioBuffer, 0, Math.min(track2.duration, mixDuration * 0.6))

    // Find beat alignment opportunities using Zedd-style techniques
    points.beatAlignment = this.findProfessionalBeatAlignment(points, mixDuration, analysis)

    console.log('🎯 Professional mixing points analysis complete:', points)
    return points
  }

  async findBassDrops(audioBuffer, startTime, endTime) {
    const sampleRate = audioBuffer.sampleRate
    const startSample = Math.floor(startTime * sampleRate)
    const endSample = Math.floor(endTime * sampleRate)
    const channelData = audioBuffer.getChannelData(0) // Use left channel for analysis
    
    const bassDrops = []
    const windowSize = Math.floor(0.5 * sampleRate) // 0.5 second windows
    const hopSize = Math.floor(0.1 * sampleRate) // 0.1 second hop
    
    for (let i = startSample; i < endSample - windowSize; i += hopSize) {
      const window = channelData.slice(i, i + windowSize)
      
      // Apply low-pass filter to focus on bass frequencies (20-200 Hz)
      const bassEnergy = this.calculateBassEnergy(window, sampleRate)
      
      // Detect sudden drops in bass energy
      if (i > startSample + windowSize) {
        const prevWindow = channelData.slice(i - windowSize, i)
        const prevBassEnergy = this.calculateBassEnergy(prevWindow, sampleRate)
        const dropRatio = prevBassEnergy / (bassEnergy + 0.001)
        
        if (dropRatio > 2.0) { // Significant bass drop detected
          const dropTime = i / sampleRate
          bassDrops.push({
            time: dropTime,
            intensity: dropRatio,
            energy: bassEnergy
          })
        }
      }
    }
    
    // Return the most significant bass drop
    if (bassDrops.length > 0) {
      return bassDrops.reduce((best, current) => 
        current.intensity > best.intensity ? current : best
      )
    }
    
    return null
  }

  calculateBassEnergy(audioData, sampleRate) {
    // Simple low-pass filter and energy calculation
    let energy = 0
    const cutoffFreq = 200 // Hz
    const alpha = 1 / (1 + 2 * Math.PI * cutoffFreq / sampleRate)
    
    let filtered = 0
    for (let i = 0; i < audioData.length; i++) {
      filtered = alpha * audioData[i] + (1 - alpha) * filtered
      energy += filtered * filtered
    }
    
    return energy / audioData.length
  }

  async findVocalPeaks(audioBuffer, startTime, endTime) {
    const sampleRate = audioBuffer.sampleRate
    const startSample = Math.floor(startTime * sampleRate)
    const endSample = Math.floor(endTime * sampleRate)
    const channelData = audioBuffer.getChannelData(0)
    
    const vocalPeaks = []
    const windowSize = Math.floor(0.3 * sampleRate) // 0.3 second windows
    const hopSize = Math.floor(0.05 * sampleRate) // 0.05 second hop
    
    for (let i = startSample; i < endSample - windowSize; i += hopSize) {
      const window = channelData.slice(i, i + windowSize)
      
      // Focus on mid-range frequencies where vocals typically sit (300-3000 Hz)
      const vocalEnergy = this.calculateVocalEnergy(window, sampleRate)
      
      if (vocalEnergy > 0.01) { // Threshold for vocal detection
        const peakTime = i / sampleRate
        vocalPeaks.push({
          time: peakTime,
          energy: vocalEnergy
        })
      }
    }
    
    // Return top 3 vocal peaks
    return vocalPeaks
      .sort((a, b) => b.energy - a.energy)
      .slice(0, 3)
  }

  calculateVocalEnergy(audioData, sampleRate) {
    // Mid-range frequency energy calculation (300-3000 Hz)
    let energy = 0
    const lowCutoff = 300 // Hz
    const highCutoff = 3000 // Hz
    
    const lowAlpha = 1 / (1 + 2 * Math.PI * lowCutoff / sampleRate)
    const highAlpha = 1 / (1 + 2 * Math.PI * highCutoff / sampleRate)
    
    let lowFiltered = 0
    let highFiltered = 0
    
    for (let i = 0; i < audioData.length; i++) {
      lowFiltered = lowAlpha * audioData[i] + (1 - lowAlpha) * lowFiltered
      highFiltered = highAlpha * audioData[i] + (1 - highAlpha) * highFiltered
      
      const midRange = lowFiltered - highFiltered
      energy += midRange * midRange
    }
    
    return energy / audioData.length
  }

  async findEnergyValleys(audioBuffer, startTime, endTime) {
    const sampleRate = audioBuffer.sampleRate
    const startSample = Math.floor(startTime * sampleRate)
    const endSample = Math.floor(endTime * sampleRate)
    const channelData = audioBuffer.getChannelData(0)
    
    const energyValleys = []
    const windowSize = Math.floor(0.5 * sampleRate) // 0.5 second windows
    const hopSize = Math.floor(0.1 * sampleRate) // 0.1 second hop
    
    for (let i = startSample; i < endSample - windowSize; i += hopSize) {
      const window = channelData.slice(i, i + windowSize)
      
      // Calculate overall energy in this window
      let energy = 0
      for (let j = 0; j < window.length; j++) {
        energy += window[j] * window[j]
      }
      energy = energy / window.length
      
      // Detect valleys (low energy points)
      if (energy < 0.005) { // Low energy threshold
        const valleyTime = i / sampleRate
        energyValleys.push({
          time: valleyTime,
          energy: energy
        })
      }
    }
    
    // Return top 3 energy valleys
    return energyValleys
      .sort((a, b) => a.energy - b.energy)
      .slice(0, 3)
  }

  async findBuildUpPoints(audioBuffer, startTime, endTime) {
    const sampleRate = audioBuffer.sampleRate
    const startSample = Math.floor(startTime * sampleRate)
    const endSample = Math.floor(endTime * sampleRate)
    const channelData = audioBuffer.getChannelData(0)
    
    const buildUpPoints = []
    const windowSize = Math.floor(1.0 * sampleRate) // 1 second windows for build-up detection
    const hopSize = Math.floor(0.2 * sampleRate) // 0.2 second hop
    
    for (let i = startSample; i < endSample - windowSize; i += hopSize) {
      const window = channelData.slice(i, i + windowSize)
      
      // Detect gradual energy increase (build-up characteristic)
      const energyProgression = this.calculateEnergyProgression(window, sampleRate)
      
      if (energyProgression.increasing && energyProgression.rate > 0.1) {
        const buildUpTime = i / sampleRate
        buildUpPoints.push({
          time: buildUpTime,
          intensity: energyProgression.rate,
          energy: energyProgression.finalEnergy
        })
      }
    }
    
    // Return top 3 build-up points
    return buildUpPoints
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 3)
  }

  calculateEnergyProgression(audioData, sampleRate) {
    const segments = 4
    const segmentSize = Math.floor(audioData.length / segments)
    const energies = []
    
    for (let i = 0; i < segments; i++) {
      const start = i * segmentSize
      const end = start + segmentSize
      const segment = audioData.slice(start, end)
      
      let energy = 0
      for (let j = 0; j < segment.length; j++) {
        energy += segment[j] * segment[j]
      }
      energies.push(energy / segment.length)
    }
    
    // Calculate if energy is increasing and at what rate
    let increasing = true
    let totalIncrease = 0
    
    for (let i = 1; i < energies.length; i++) {
      if (energies[i] <= energies[i-1]) {
        increasing = false
      }
      totalIncrease += Math.max(0, energies[i] - energies[i-1])
    }
    
    const rate = totalIncrease / (energies[0] + 0.001)
    
    return {
      increasing,
      rate,
      finalEnergy: energies[energies.length - 1]
    }
  }

  async findDropPoints(audioBuffer, startTime, endTime) {
    const sampleRate = audioBuffer.sampleRate
    const startSample = Math.floor(startTime * sampleRate)
    const endSample = Math.floor(endTime * sampleRate)
    const channelData = audioBuffer.getChannelData(0)
    
    const dropPoints = []
    const windowSize = Math.floor(0.5 * sampleRate) // 0.5 second windows
    const hopSize = Math.floor(0.1 * sampleRate) // 0.1 second hop
    
    for (let i = startSample; i < endSample - windowSize; i += hopSize) {
      const window = channelData.slice(i, i + windowSize)
      
      // Detect sudden energy drops (drop characteristic)
      if (i > startSample + windowSize) {
        const prevWindow = channelData.slice(i - windowSize, i)
        const currentEnergy = this.calculateTotalEnergy(window)
        const prevEnergy = this.calculateTotalEnergy(prevWindow)
        
        const dropRatio = prevEnergy / (currentEnergy + 0.001)
        
        if (dropRatio > 1.5) { // Significant drop detected
          const dropTime = i / sampleRate
          dropPoints.push({
            time: dropTime,
            intensity: dropRatio,
            energy: currentEnergy
          })
        }
      }
    }
    
    // Return top 3 drop points
    return dropPoints
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 3)
  }

  calculateTotalEnergy(audioData) {
    let energy = 0
    for (let i = 0; i < audioData.length; i++) {
      energy += audioData[i] * audioData[i]
    }
    return energy / audioData.length
  }

  async findBreakdownPoints(audioBuffer, startTime, endTime) {
    const sampleRate = audioBuffer.sampleRate
    const startSample = Math.floor(startTime * sampleRate)
    const endSample = Math.floor(endTime * sampleRate)
    const channelData = audioBuffer.getChannelData(0)
    
    const breakdownPoints = []
    const windowSize = Math.floor(2.0 * sampleRate) // 2 second windows for breakdown detection
    const hopSize = Math.floor(0.5 * sampleRate) // 0.5 second hop
    
    for (let i = startSample; i < endSample - windowSize; i += hopSize) {
      const window = channelData.slice(i, i + windowSize)
      
      // Detect sustained low energy (breakdown characteristic)
      const energyProfile = this.calculateBreakdownProfile(window, sampleRate)
      
      if (energyProfile.isBreakdown) {
        const breakdownTime = i / sampleRate
        breakdownPoints.push({
          time: breakdownTime,
          duration: energyProfile.duration,
          energy: energyProfile.avgEnergy
        })
      }
    }
    
    // Return top 3 breakdown points
    return breakdownPoints
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 3)
  }

  calculateBreakdownProfile(audioData, sampleRate) {
    const segments = 8
    const segmentSize = Math.floor(audioData.length / segments)
    const energies = []
    
    for (let i = 0; i < segments; i++) {
      const start = i * segmentSize
      const end = start + segmentSize
      const segment = audioData.slice(start, end)
      
      let energy = 0
      for (let j = 0; j < segment.length; j++) {
        energy += segment[j] * segment[j]
      }
      energies.push(energy / segment.length)
    }
    
    // Check if most segments have low energy
    const lowEnergyThreshold = 0.003
    const lowEnergySegments = energies.filter(e => e < lowEnergyThreshold).length
    const isBreakdown = lowEnergySegments >= segments * 0.6 // 60% of segments are low energy
    
    const avgEnergy = energies.reduce((sum, e) => sum + e, 0) / energies.length
    
    return {
      isBreakdown,
      duration: audioData.length / sampleRate,
      avgEnergy
    }
  }

  findProfessionalBeatAlignment(points, mixDuration, analysis) {
    // Zedd-style beat alignment: prioritize dramatic moments
    const alignments = []
    
    // 1. Bass drop synchronization (most dramatic)
    if (points.bassDrop1 && points.bassDrop2) {
      const drop1Time = points.bassDrop1.time
      const drop2Time = points.bassDrop2.time
      const optimalStart = Math.max(0, drop1Time - drop2Time)
      
      alignments.push({
        type: 'bass-drop-sync',
        score: 100,
        optimalTrack2Start: optimalStart,
        description: 'Bass drops synchronized for maximum impact'
      })
    }
    
    // 2. Build-up to drop alignment
    if (points.buildUpPoints1.length > 0 && points.dropPoints2.length > 0) {
      const buildUp1 = points.buildUpPoints1[0]
      const drop2 = points.dropPoints2[0]
      const optimalStart = Math.max(0, buildUp1.time - drop2.time)
      
      alignments.push({
        type: 'build-up-to-drop',
        score: 90,
        optimalTrack2Start: optimalStart,
        description: 'Track 2 drop aligns with Track 1 build-up'
      })
    }
    
    // 3. Breakdown to build-up alignment
    if (points.breakdownPoints1.length > 0 && points.buildUpPoints2.length > 0) {
      const breakdown1 = points.breakdownPoints1[0]
      const buildUp2 = points.buildUpPoints2[0]
      const optimalStart = Math.max(0, breakdown1.time - buildUp2.time)
      
      alignments.push({
        type: 'breakdown-to-build-up',
        score: 85,
        optimalTrack2Start: optimalStart,
        description: 'Track 2 build-up starts during Track 1 breakdown'
      })
    }
    
    // 4. Energy valley alignment
    if (points.energyValleys1.length > 0 && points.energyValleys2.length > 0) {
      const valley1 = points.energyValleys1[0]
      const valley2 = points.energyValleys2[0]
      const optimalStart = Math.max(0, valley1.time - valley2.time)
      
      alignments.push({
        type: 'energy-valley-sync',
        score: 80,
        optimalTrack2Start: optimalStart,
        description: 'Energy valleys synchronized for smooth transition'
      })
    }
    
    // Return the best alignment
    if (alignments.length > 0) {
      const bestAlignment = alignments.reduce((best, current) => 
        current.score > best.score ? current : best
      )
      
      return {
        ...bestAlignment,
        allOptions: alignments
      }
    }
    
    return null
  }

  createAdvancedTrackChain(ctx, trackType, mixingPoints) {
    const input = ctx.createGain()
    const eq = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    const compressor = ctx.createDynamicsCompressor()
    const output = ctx.createGain()

    // Configure EQ based on track type and mixing points
    if (trackType === 'track1') {
      eq.type = 'peaking'
      eq.frequency.value = 1000
      eq.Q.value = 1
      eq.gain.value = 0
    } else {
      // Track 2: High-pass to avoid low-end clash during crossfade
      eq.type = 'highpass'
      eq.frequency.value = 120
      eq.Q.value = 1
    }

    // Add compression for better control
    compressor.threshold.value = -20
    compressor.knee.value = 30
    compressor.ratio.value = 8
    compressor.attack.value = 0.005
    compressor.release.value = 0.1

    // Connect the advanced chain
    input.connect(eq)
    eq.connect(compressor)
    compressor.connect(gain)
    gain.connect(output)

    return { input, eq, gain, compressor, output }
  }

  applyNaturalCrossfadeAutomation(ctx, source1, source2, chain1, chain2, mixStructure, mixingPoints, track1Selection, track2Selection) {
    const currentTime = ctx.currentTime

    // Track 1 automation with Zedd-style progressive house techniques
    chain1.gain.gain.setValueAtTime(1, currentTime)
    
    // Handle build-up section if present
    if (mixStructure.buildUpSection) {
      // Gradual energy increase during build-up
      chain1.gain.gain.linearRampToValueAtTime(1.2, currentTime + mixStructure.buildUpSection.start)
      chain1.gain.gain.linearRampToValueAtTime(1.4, currentTime + mixStructure.buildUpSection.start + mixStructure.buildUpSection.duration)
    }
    
    // Transition to track 2
    chain1.gain.gain.linearRampToValueAtTime(0.95, currentTime + mixStructure.track2Start)
    chain1.gain.gain.linearRampToValueAtTime(0.7, currentTime + mixStructure.crossfadeStart)
    chain1.gain.gain.linearRampToValueAtTime(0.3, currentTime + mixStructure.crossfadeStart + mixStructure.crossfadeDuration * 0.5)
    chain1.gain.gain.linearRampToValueAtTime(0, currentTime + mixStructure.crossfadeStart + mixStructure.crossfadeDuration)

    // Track 2 automation with Zedd-style techniques
    chain2.gain.gain.setValueAtTime(0, currentTime + mixStructure.track2Start)
    chain2.gain.gain.linearRampToValueAtTime(0.6, currentTime + mixStructure.track2Start + 1)
    chain2.gain.gain.linearRampToValueAtTime(0.7, currentTime + mixStructure.crossfadeStart)
    chain2.gain.gain.linearRampToValueAtTime(0.8, currentTime + mixStructure.crossfadeStart + mixStructure.crossfadeDuration * 0.5)
    chain2.gain.gain.linearRampToValueAtTime(1, currentTime + mixStructure.crossfadeStart + mixStructure.crossfadeDuration)

    // Apply tempo adjustment for better compatibility
    if (Math.abs(track1Selection.duration - track2Selection.duration) > 0.1) {
      const tempoRatio = track1Selection.duration / track2Selection.duration
      source2.playbackRate.value = tempoRatio
      console.log('🎵 Applied tempo adjustment for compatibility:', tempoRatio)
    }

    // Dynamic EQ adjustments during crossfade (Zedd-style frequency management)
    if (mixStructure.crossfadeDuration > 0) {
      // High-pass filter on track 2 during crossfade to avoid low-end clash
      chain2.eq.frequency.setValueAtTime(120, currentTime + mixStructure.crossfadeStart)
      chain2.eq.frequency.linearRampToValueAtTime(80, currentTime + mixStructure.crossfadeStart + mixStructure.crossfadeDuration)
      
      // Boost mid-range on track 1 during crossfade for vocal clarity
      chain1.eq.frequency.setValueAtTime(1000, currentTime + mixStructure.crossfadeStart)
      chain1.eq.gain.setValueAtTime(0, currentTime + mixStructure.crossfadeStart)
      chain1.eq.gain.linearRampToValueAtTime(3, currentTime + mixStructure.crossfadeStart + mixStructure.crossfadeDuration * 0.5)
      chain1.eq.gain.linearRampToValueAtTime(0, currentTime + mixStructure.crossfadeStart + mixStructure.crossfadeDuration)
    }

    // Build-up section automation
    if (mixStructure.buildUpSection) {
      // Increase bass and energy during build-up
      chain1.eq.frequency.setValueAtTime(100, currentTime + mixStructure.buildUpSection.start)
      chain1.eq.gain.setValueAtTime(0, currentTime + mixStructure.buildUpSection.start)
      chain1.eq.gain.linearRampToValueAtTime(2, currentTime + mixStructure.buildUpSection.start + mixStructure.buildUpSection.duration)
      
      // Add compression for build-up intensity
      chain1.compressor.threshold.setValueAtTime(-20, currentTime + mixStructure.buildUpSection.start)
      chain1.compressor.threshold.linearRampToValueAtTime(-15, currentTime + mixStructure.buildUpSection.start + mixStructure.buildUpSection.duration)
    }

    // Breakdown section automation
    if (mixStructure.breakdownSection) {
      // Reduce energy during breakdown
      chain1.gain.gain.linearRampToValueAtTime(0.6, currentTime + mixStructure.breakdownSection.start)
      chain1.gain.gain.linearRampToValueAtTime(0.8, currentTime + mixStructure.breakdownSection.start + mixStructure.breakdownSection.duration)
      
      // High-pass filter to create space
      chain1.eq.frequency.setValueAtTime(200, currentTime + mixStructure.breakdownSection.start)
      chain1.eq.frequency.linearRampToValueAtTime(100, currentTime + mixStructure.breakdownSection.start + mixStructure.breakdownSection.duration)
    }

    // Vocal overlay automation with Zedd-style vocal layering
    if (mixStructure.vocalOverlayDuration > 0) {
      // Boost vocals on track 1 during overlay
      chain1.eq.gain.setValueAtTime(3, currentTime + mixStructure.vocalOverlayStart)
      chain1.eq.gain.linearRampToValueAtTime(0, currentTime + mixStructure.vocalOverlayStart + mixStructure.vocalOverlayDuration)
      
      // Reduce vocals on track 2 during overlay, keep instrumental
      chain2.eq.gain.setValueAtTime(-6, currentTime + mixStructure.vocalOverlayStart)
      chain2.eq.gain.linearRampToValueAtTime(0, currentTime + mixStructure.vocalOverlayStart + mixStructure.vocalOverlayDuration)
      
      // Add subtle reverb to vocals for Zedd-style production
      // Note: In a real implementation, you'd add reverb nodes
      console.log('🎤 Applied Zedd-style vocal layering automation')
    }

    // Master compression automation for professional sound
    if (this.compressor) {
      // Increase compression during high-energy sections
      if (mixStructure.buildUpSection) {
        this.compressor.threshold.setValueAtTime(-24, currentTime + mixStructure.buildUpSection.start)
        this.compressor.threshold.linearRampToValueAtTime(-20, currentTime + mixStructure.buildUpSection.start + mixStructure.buildUpSection.duration)
      }
      
      // Reduce compression during breakdown for dynamic contrast
      if (mixStructure.breakdownSection) {
        this.compressor.threshold.setValueAtTime(-20, currentTime + mixStructure.breakdownSection.start)
        this.compressor.threshold.linearRampToValueAtTime(-18, currentTime + mixStructure.breakdownSection.start + mixStructure.breakdownSection.duration)
      }
    }
  }
}

export default LocalAudioMixer
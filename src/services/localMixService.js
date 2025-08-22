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
      console.log('🎵 Starting advanced local mix generation...')
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

      // Analyze tracks for compatibility and find optimal mixing points
      const analysis = this.analyzeTracks(track1, track2)
      console.log('🔍 Track analysis:', analysis)

      // Find optimal mixing points based on real audio characteristics
      const mixingPoints = await this.findOptimalMixingPoints(track1, track2, mixDuration, analysis)
      console.log('🎯 Optimal mixing points found:', mixingPoints)

      // Generate intelligent mix structure with natural crossfades
      const mixStructure = this.generateNaturalMixStructure(track1, track2, mixDuration, mixingPoints, analysis)
      console.log('🎛️ Natural mix structure:', mixStructure)

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

      // Create advanced processing chains with vocal separation
      const chain1 = this.createAdvancedTrackChain(offlineCtx, 'track1', mixingPoints)
      const chain2 = this.createAdvancedTrackChain(offlineCtx, 'track2', mixingPoints)

      // Connect sources to chains
      source1.connect(chain1.input)
      source2.connect(chain2.input)

      // Connect chains to master
      chain1.output.connect(offlineCtx.destination)
      chain2.output.connect(offlineCtx.destination)

      // Apply natural crossfade automation with vocal overlays
      this.applyNaturalCrossfadeAutomation(offlineCtx, source1, source2, chain1, chain2, mixStructure, mixingPoints, track1Selection, track2Selection)

      // Start playback with calculated offsets
      source1.start(0, track1Selection.startTime, track1Selection.duration)
      source2.start(mixStructure.track2Start, track2Selection.startTime, track2Selection.duration)

      // Render the mix
      console.log('🎬 Rendering natural crossfade mix...')
      const renderedBuffer = await offlineCtx.startRendering()
      console.log('✅ Natural crossfade mix rendered successfully')

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

  async findOptimalMixingPoints(track1, track2, mixDuration, analysis) {
    console.log('🔍 Finding optimal mixing points...')
    
    const points = {
      bassDrop1: null,
      bassDrop2: null,
      vocalPeaks1: [],
      vocalPeaks2: [],
      energyValleys1: [],
      energyValleys2: [],
      beatAlignment: null
    }

    // Analyze bass patterns and find drops
    points.bassDrop1 = await this.findBassDrops(track1.audioBuffer, 0, Math.min(track1.duration, mixDuration * 0.6))
    points.bassDrop2 = await this.findBassDrops(track2.audioBuffer, 0, Math.min(track2.duration, mixDuration * 0.6))
    
    console.log('🎵 Bass drops found - Track 1:', points.bassDrop1, 'Track 2:', points.bassDrop2)

    // Find vocal peaks and energy valleys
    points.vocalPeaks1 = await this.findVocalPeaks(track1.audioBuffer, 0, Math.min(track1.duration, mixDuration * 0.6))
    points.vocalPeaks2 = await this.findVocalPeaks(track2.audioBuffer, 0, Math.min(track2.duration, mixDuration * 0.6))
    
    points.energyValleys1 = await this.findEnergyValleys(track1.audioBuffer, 0, Math.min(track1.duration, mixDuration * 0.6))
    points.energyValleys2 = await this.findEnergyValleys(track2.audioBuffer, 0, Math.min(track2.duration, mixDuration * 0.6))

    // Find beat alignment opportunities
    points.beatAlignment = this.findBeatAlignment(points.bassDrop1, points.bassDrop2, mixDuration)

    console.log('🎯 Mixing points analysis complete:', points)
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

  findBeatAlignment(bassDrop1, bassDrop2, mixDuration) {
    if (!bassDrop1 || !bassDrop2) return null
    
    // Find the best alignment between bass drops
    const drop1Time = bassDrop1.time
    const drop2Time = bassDrop2.time
    
    // Calculate optimal timing for track 2 to start
    // We want the bass drop of track 2 to align with a good transition point in track 1
    const optimalStart = Math.max(0, drop1Time - drop2Time)
    
    return {
      track1DropTime: drop1Time,
      track2DropTime: drop2Time,
      optimalTrack2Start: optimalStart,
      alignment: 'bass-drop-sync'
    }
  }

  generateNaturalMixStructure(track1, track2, durationSec, mixingPoints, analysis) {
    const structure = {
      duration: durationSec,
      track1Duration: durationSec / 2,
      track2Duration: durationSec / 2,
      track1Start: 0,
      track2Start: 0,
      crossfadeStart: 0,
      crossfadeDuration: 0,
      vocalOverlayStart: 0,
      vocalOverlayDuration: 0,
      sections: []
    }

    // Use beat alignment if available, otherwise fall back to compatibility-based timing
    if (mixingPoints.beatAlignment) {
      structure.track2Start = mixingPoints.beatAlignment.optimalTrack2Start
      structure.crossfadeStart = structure.track2Start + 2 // Start crossfade 2 seconds after track 2 enters
      structure.crossfadeDuration = Math.min(durationSec * 0.4, 8) // Max 8 seconds or 40% of mix
    } else {
      // Fallback to compatibility-based timing
      if (analysis.compatibilityScore > 70) {
        structure.track2Start = durationSec * 0.3
        structure.crossfadeStart = durationSec * 0.4
        structure.crossfadeDuration = durationSec * 0.4
      } else if (analysis.compatibilityScore > 40) {
        structure.track2Start = durationSec * 0.35
        structure.crossfadeStart = durationSec * 0.45
        structure.crossfadeDuration = durationSec * 0.35
      } else {
        structure.track2Start = durationSec * 0.45
        structure.crossfadeStart = durationSec * 0.55
        structure.crossfadeDuration = durationSec * 0.25
      }
    }

    // Add vocal overlay section if we have vocal peaks
    if (mixingPoints.vocalPeaks1.length > 0 && mixingPoints.vocalPeaks2.length > 0) {
      structure.vocalOverlayStart = structure.crossfadeStart + structure.crossfadeDuration * 0.5
      structure.vocalOverlayDuration = Math.min(durationSec * 0.2, 4) // Max 4 seconds or 20% of mix
    }

    // Define mix sections with natural crossfades
    structure.sections = [
      { 
        name: 'intro', 
        start: 0, 
        end: structure.track2Start, 
        description: `Track 1 focus (${Math.round((structure.track2Start / durationSec) * 100)}% of mix)`,
        track: 'track1',
        type: 'solo'
      },
      { 
        name: 'transition', 
        start: structure.track2Start, 
        end: structure.crossfadeStart, 
        description: 'Track 2 enters at optimal point',
        track: 'both',
        type: 'layered'
      },
      { 
        name: 'crossfade', 
        start: structure.crossfadeStart, 
        end: structure.crossfadeStart + structure.crossfadeDuration, 
        description: 'Natural crossfade with vocal overlay',
        track: 'both',
        type: 'crossfade'
      },
      { 
        name: 'vocal-overlay', 
        start: structure.vocalOverlayStart, 
        end: structure.vocalOverlayStart + structure.vocalOverlayDuration, 
        description: 'Vocals from one track over instrumental from other',
        track: 'both',
        type: 'vocal-overlay'
      },
      { 
        name: 'outro', 
        start: structure.vocalOverlayStart + structure.vocalOverlayDuration, 
        end: durationSec, 
        description: `Track 2 focus (${Math.round(((durationSec - (structure.vocalOverlayStart + structure.vocalOverlayDuration)) / durationSec) * 100)}% of mix)`,
        track: 'track2',
        type: 'solo'
      }
    ]

    return structure
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

    // Track 1 automation with natural crossfade
    chain1.gain.gain.setValueAtTime(1, currentTime)
    chain1.gain.gain.linearRampToValueAtTime(0.95, currentTime + mixStructure.track2Start)
    chain1.gain.gain.linearRampToValueAtTime(0.7, currentTime + mixStructure.crossfadeStart)
    chain1.gain.gain.linearRampToValueAtTime(0.3, currentTime + mixStructure.crossfadeStart + mixStructure.crossfadeDuration * 0.5)
    chain1.gain.gain.linearRampToValueAtTime(0, currentTime + mixStructure.crossfadeStart + mixStructure.crossfadeDuration)

    // Track 2 automation with natural crossfade
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

    // Dynamic EQ adjustments during crossfade
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

    // Vocal overlay automation
    if (mixStructure.vocalOverlayDuration > 0) {
      // Boost vocals on track 1 during overlay
      chain1.eq.gain.setValueAtTime(3, currentTime + mixStructure.vocalOverlayStart)
      chain1.eq.gain.linearRampToValueAtTime(0, currentTime + mixStructure.vocalOverlayStart + mixStructure.vocalOverlayDuration)
      
      // Reduce vocals on track 2 during overlay, keep instrumental
      chain2.eq.gain.setValueAtTime(-6, currentTime + mixStructure.vocalOverlayStart)
      chain2.eq.gain.linearRampToValueAtTime(0, currentTime + mixStructure.vocalOverlayStart + mixStructure.vocalOverlayDuration)
    }
  }
}

export default LocalAudioMixer
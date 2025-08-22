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
      buildUpSection: null,
      dropSection: null,
      breakdownSection: null,
      sections: []
    }

    // Use professional beat alignment if available, otherwise fall back to compatibility-based timing
    if (mixingPoints.beatAlignment) {
      structure.track2Start = mixingPoints.beatAlignment.optimalTrack2Start
      
      // Zedd-style structure: build-up → drop → breakdown → build-up → final drop
      if (mixingPoints.buildUpPoints1.length > 0 && mixingPoints.dropPoints2.length > 0) {
        // Create dramatic build-up to drop section
        structure.buildUpSection = {
          start: Math.max(0, structure.track2Start - 8), // 8 second build-up
          duration: 8,
          type: 'build-up-to-drop'
        }
      }
      
      if (mixingPoints.breakdownPoints1.length > 0 && mixingPoints.buildUpPoints2.length > 0) {
        // Create breakdown to build-up section
        structure.breakdownSection = {
          start: Math.max(0, structure.track2Start - 4), // 4 second breakdown
          duration: 4,
          type: 'breakdown-to-build-up'
        }
      }
      
      // Start crossfade 2 seconds after track 2 enters for smooth transition
      structure.crossfadeStart = structure.track2Start + 2
      structure.crossfadeDuration = Math.min(durationSec * 0.4, 10) // Max 10 seconds or 40% of mix
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

    // Add vocal overlay section if we have vocal peaks (Zedd style: vocal layering)
    if (mixingPoints.vocalPeaks1.length > 0 && mixingPoints.vocalPeaks2.length > 0) {
      // Place vocal overlay during the crossfade for maximum impact
      structure.vocalOverlayStart = structure.crossfadeStart + structure.crossfadeDuration * 0.3
      structure.vocalOverlayDuration = Math.min(durationSec * 0.25, 6) // Max 6 seconds or 25% of mix
    }

    // Create Zedd-style progressive house sections
    structure.sections = []
    
    // Intro section (Track 1 focus)
    if (structure.buildUpSection) {
      structure.sections.push({
        name: 'intro',
        start: 0,
        end: structure.buildUpSection.start,
        description: `Track 1 focus (${Math.round((structure.buildUpSection.start / durationSec) * 100)}% of mix)`,
        track: 'track1',
        type: 'solo'
      })
      
      // Build-up section
      structure.sections.push({
        name: 'build-up',
        start: structure.buildUpSection.start,
        end: structure.buildUpSection.start + structure.buildUpSection.duration,
        description: 'Dramatic build-up to drop',
        track: 'both',
        type: 'build-up'
      })
    } else {
      structure.sections.push({
        name: 'intro',
        start: 0,
        end: structure.track2Start,
        description: `Track 1 focus (${Math.round((structure.track2Start / durationSec) * 100)}% of mix)`,
        track: 'track1',
        type: 'solo'
      })
    }
    
    // Transition section
    structure.sections.push({
      name: 'transition',
      start: structure.track2Start,
      end: structure.crossfadeStart,
      description: 'Track 2 enters at optimal point',
      track: 'both',
      type: 'layered'
    })
    
    // Crossfade section
    structure.sections.push({
      name: 'crossfade',
      start: structure.crossfadeStart,
      end: structure.crossfadeStart + structure.crossfadeDuration,
      description: 'Natural crossfade with vocal overlay',
      track: 'both',
      type: 'crossfade'
    })
    
    // Vocal overlay section (if available)
    if (structure.vocalOverlayDuration > 0) {
      structure.sections.push({
        name: 'vocal-overlay',
        start: structure.vocalOverlayStart,
        end: structure.vocalOverlayStart + structure.vocalOverlayDuration,
        description: 'Vocals from one track over instrumental from other',
        track: 'both',
        type: 'vocal-overlay'
      })
    }
    
    // Breakdown section (if available)
    if (structure.breakdownSection) {
      structure.sections.push({
        name: 'breakdown',
        start: structure.breakdownSection.start,
        end: structure.breakdownSection.start + structure.breakdownSection.duration,
        description: 'Energy breakdown for contrast',
        track: 'both',
        type: 'breakdown'
      })
    }
    
    // Outro section
    const outroStart = structure.vocalOverlayDuration > 0 
      ? structure.vocalOverlayStart + structure.vocalOverlayDuration
      : structure.crossfadeStart + structure.crossfadeDuration
      
    structure.sections.push({
      name: 'outro',
      start: outroStart,
      end: durationSec,
      description: `Track 2 focus (${Math.round(((durationSec - outroStart) / durationSec) * 100)}% of mix)`,
      track: 'track2',
      type: 'solo'
    })

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
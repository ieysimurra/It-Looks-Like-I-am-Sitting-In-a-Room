# Technical Documentation

> Detailed technical information about the implementation of "It Looks Like I Am Sitting in a Room"

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │Control Panel│  │ Spectrum View │  │    Info/About Panel    │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        STATE MANAGER                             │
│  • status: ready | recording | processing | playing              │
│  • currentIteration, maxIterations, filterQ, dryWetMix          │
│  • realtimeMode, showAnalysis, showTranscription                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AUDIO ENGINE                                │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────────┐ │
│  │  Recording │  │  Processing │  │      Playback            │ │
│  │MediaRecorder│ │OfflineAudio │  │  • Normal                │ │
│  │            │  │  Context    │  │  • Loop                  │ │
│  │            │  │             │  │  • Real-time             │ │
│  └────────────┘  └─────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ANALYSIS ENGINE                               │
│  • FFT Analysis (p5.FFT)                                        │
│  • Spectral Metrics (Centroid, Flatness, Peak Ratio, Bandwidth) │
│  • Phase Detection (Speech → Hybrid → Modal)                    │
└─────────────────────────────────────────────────────────────────┘
```

## Audio Processing Pipeline

### Recording Pipeline

```
Microphone → MediaRecorder → Blob → AudioBuffer → Normalize → Fade → Store
                                         │
                                         ▼
                              Speech Recognition (parallel)
```

### Processing Pipeline (Offline)

```
Source Buffer
     │
     ├──────────────────────────────────────┐
     ▼                                      ▼
[Dry Path]                            [Wet Path]
     │                                      │
     │                               ┌──────┴──────┐
     │                               ▼             ▼
     │                         [Peaking Filter 1]  │
     │                               ▼             │
     │                         [Peaking Filter 2]  │
     │                               ▼             │
     │                              ...            │
     │                               ▼             │
     │                         [Peaking Filter 8]  │
     │                               │             │
     │                               ▼             │
     │                    [Air Absorption LPF]     │
     │                               │             │
     │                               ▼             │
     │                    [Convolver (optional)] ──┘
     │                               │
     ▼                               ▼
[Dry Gain]                     [Wet Gain]
     │                               │
     └───────────┬───────────────────┘
                 ▼
          [Master Gain]
                 │
                 ▼
            [Limiter]
                 │
                 ▼
          [Normalize]
                 │
                 ▼
           [Fade In/Out]
                 │
                 ▼
           Output Buffer
```

### Real-time Processing Pipeline

```
Stored Buffer (loop)
        │
        ├────────────────────────────────┐
        ▼                                ▼
   [Dry Path]                       [Wet Path]
        │                                │
        │                    ┌───────────┴───────────┐
        │                    ▼                       ▼
        │            [Peaking Filters (8x)]    [Convolver]
        │                    │                       │
        │                    ▼                       │
        │            [Air Absorption LPF] ──────────┘
        │                    │
        ▼                    ▼
   [Dry Gain]          [Wet Gain]   ← Real-time parameter control
        │                    │
        └──────┬─────────────┘
               ▼
         [Master Gain]  ← Real-time parameter control
               │
               ▼
           [Limiter]
               │
               ▼
          [Destination]
               │
               ▼
          [FFT Analyser]
```

## Key Functions

### Audio Recording

```javascript
async function startRecording() {
  // Request microphone access
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  // Create MediaRecorder
  mediaRecorder = new MediaRecorder(mediaStream);
  
  // Handle data
  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };
  
  // Process on stop
  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const audioBuffer = await decodeAudioData(audioBlob);
    
    // Apply normalization and fade
    normalizeAudioBuffer(audioBuffer, 0.85, true);
    applyFadeInOut(audioBuffer, 0.05, 0.15);
  };
}
```

### Normalization with Soft-Knee Compression

```javascript
function normalizeAudioBuffer(buffer, targetLevel = 0.85, applyCompression = true) {
  const data = buffer.getChannelData(0);
  
  // Find peak
  let peakAmp = Math.max(...data.map(Math.abs));
  
  // Apply soft knee compression above threshold
  if (applyCompression && peakAmp > 0.5) {
    const threshold = 0.5;
    const ratio = 4; // 4:1 compression
    
    for (let i = 0; i < data.length; i++) {
      const absVal = Math.abs(data[i]);
      if (absVal > threshold) {
        const overshoot = absVal - threshold;
        const compressed = threshold + overshoot / ratio;
        data[i] = Math.sign(data[i]) * compressed;
      }
    }
  }
  
  // Normalize to target level
  const gain = targetLevel / peakAmp;
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.max(-1, Math.min(1, data[i] * gain));
  }
}
```

### Fade In/Out (Cosine Curve)

```javascript
function applyFadeInOut(buffer, fadeInDuration, fadeOutDuration) {
  const sampleRate = buffer.sampleRate;
  const data = buffer.getChannelData(0);
  
  // Fade in (cosine curve)
  const fadeInSamples = Math.floor(fadeInDuration * sampleRate);
  for (let i = 0; i < fadeInSamples; i++) {
    data[i] *= 0.5 * (1 - Math.cos(Math.PI * i / fadeInSamples));
  }
  
  // Fade out (cosine curve)
  const fadeOutSamples = Math.floor(fadeOutDuration * sampleRate);
  const fadeOutStart = data.length - fadeOutSamples;
  for (let i = fadeOutStart; i < data.length; i++) {
    const position = i - fadeOutStart;
    data[i] *= 0.5 * (1 + Math.cos(Math.PI * position / fadeOutSamples));
  }
}
```

### Spectral Analysis Metrics

```javascript
function updateSpectralMetrics() {
  const spectrum = fft.analyze();
  const nyquist = 22050;
  
  // Spectral Centroid (center of mass)
  let weightedSum = 0, totalEnergy = 0;
  for (let i = 0; i < spectrum.length; i++) {
    const freq = map(i, 0, spectrum.length, 0, nyquist);
    weightedSum += freq * spectrum[i];
    totalEnergy += spectrum[i];
  }
  spectralMetrics.centroid = weightedSum / totalEnergy;
  
  // Spectral Flatness (Wiener entropy)
  let geometricMean = 0, arithmeticMean = 0;
  for (let i = 1; i < spectrum.length; i++) {
    geometricMean += Math.log(spectrum[i] + 0.0001);
    arithmeticMean += spectrum[i];
  }
  geometricMean = Math.exp(geometricMean / spectrum.length);
  arithmeticMean = arithmeticMean / spectrum.length;
  spectralMetrics.flatness = geometricMean / arithmeticMean;
  
  // Peak Ratio (concentration in peaks)
  const sorted = [...spectrum].sort((a, b) => b - a);
  const topPeakEnergy = sorted.slice(0, 10).reduce((a, b) => a + b, 0);
  spectralMetrics.peakRatio = topPeakEnergy / totalEnergy;
}
```

## Room Presets Configuration

```javascript
const roomPresets = {
  small: { 
    freqs: [120, 240, 380, 520, 780, 1100, 1800, 2400], 
    name: 'Small Room',
    description: 'Domestic space ~20m², tight resonances'
  },
  large: { 
    freqs: [60, 120, 180, 280, 400, 600, 900, 1400], 
    name: 'Large Hall',
    description: 'Concert hall ~500m², spread resonances'
  },
  bathroom: { 
    freqs: [200, 400, 800, 1200, 1600, 2000, 3000, 4000], 
    name: 'Bathroom',
    description: 'Tiled surfaces, strong mid reflections'
  },
  stairwell: { 
    freqs: [80, 160, 320, 480, 640, 960, 1280, 1920], 
    name: 'Stairwell',
    description: 'Vertical space, harmonic relationships'
  },
  cathedral: { 
    freqs: [40, 80, 120, 200, 320, 500, 800, 1200], 
    name: 'Cathedral',
    description: 'Very long decay, low frequencies'
  }
};
```

## Synthetic Impulse Response Generation

```javascript
function generateSyntheticIR(type, sampleRate, duration) {
  const length = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(length);
  
  if (type === 'synthetic_large') {
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // Initial impulse
      if (i < 5) buffer[i] = (Math.random() * 2 - 1) * (1 - i/5);
      
      // Early reflections
      const reflections = [0.03, 0.06, 0.1, 0.15, 0.22, 0.3];
      for (const r of reflections) {
        const idx = Math.floor(r * sampleRate);
        if (i >= idx && i < idx + 200) {
          buffer[i] += (Math.random() * 2 - 1) * 0.3 * Math.exp(-(i - idx) / 100);
        }
      }
      
      // Diffuse tail
      buffer[i] += (Math.random() * 2 - 1) * Math.exp(-t * 2.5) * 0.5;
      
      // Room modes
      for (const f of [60, 90, 120, 180]) {
        buffer[i] += Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 3) * 0.08;
      }
    }
  }
  
  // Normalize
  const maxVal = Math.max(...buffer.map(Math.abs));
  for (let i = 0; i < length; i++) buffer[i] /= maxVal;
  
  return buffer;
}
```

## Phase Detection Algorithm

```javascript
function updatePhaseDetection() {
  const { intelligibility, flatness, peakRatio } = spectralMetrics;
  
  // Speech phase: high intelligibility, high bandwidth
  if (intelligibility > 0.6 && flatness > 0.3) {
    state.currentPhase = 'speech';
  }
  // Hybrid phase: decreasing intelligibility, emerging peaks
  else if (intelligibility > 0.3 && peakRatio < 0.7) {
    state.currentPhase = 'hybrid';
  }
  // Modal phase: low intelligibility, high peak concentration
  else if (peakRatio > 0.5 || flatness < 0.2) {
    state.currentPhase = 'modal';
  }
}
```

## State Management

```javascript
let state = {
  // Status
  status: 'ready', // 'ready' | 'recording' | 'processing' | 'playing'
  
  // Iteration control
  currentIteration: 0,
  maxIterations: 12,
  
  // Audio parameters
  filterQ: 30,          // 5-100
  dryWetMix: 0.7,       // 0-1
  feedbackGain: 0.95,   // 0.5-1
  useConvolver: false,
  
  // UI state
  showComparison: false,
  showInfo: false,
  showPanel: true,
  showAnalysis: true,
  showTranscription: true,
  realtimeMode: false,
  
  // Phase detection
  currentPhase: 'none', // 'speech' | 'hybrid' | 'modal' | 'none'
  phaseHistory: []
};
```

## Performance Considerations

### Memory Management
- Audio buffers are stored in `iterationBuffers[]` array
- Each iteration creates a new AudioBuffer (~10-20MB for 10 seconds)
- Reset function clears all buffers to free memory

### CPU Optimization
- Offline processing uses `OfflineAudioContext` for efficiency
- Real-time processing minimizes node recreation
- FFT analysis runs at 60fps (configurable)

### Browser Compatibility
- MediaRecorder: All modern browsers
- Web Audio API: All modern browsers
- Speech Recognition: Chrome, Edge (WebKit prefix required)

## File Size Reference

| Component | Approximate Size |
|-----------|-----------------|
| sketch.js | ~100 KB |
| style.css | ~8 KB |
| index.html | ~2 KB |
| **Total** | **~110 KB** |

---

*Last updated: January 2025*

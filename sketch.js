/**
 * I Am Sitting in a Room - Interactive Implementation
 * Based on Alvin Lucier's seminal 1969 sound art piece (1969)
 * 
 * For p5.js Web Editor
 * @version 2.0.0
 */

// ============================================
// GLOBAL STATE
// ============================================

let state = {
  status: 'ready',
  currentIteration: 0,
  maxIterations: 12,
  filterQ: 30,
  isAutoProcessing: false,
  useConvolver: false,
  showComparison: false,
  showInfo: false,
  showPanel: true,
  showAnalysis: true,
  showTranscription: true,
  realtimeMode: false,
  dryWetMix: 0.7,
  feedbackGain: 0.95,
  // Phase detection
  currentPhase: 'none', // 'speech', 'hybrid', 'modal', 'none'
  phaseHistory: []
};

// Audio
let mic, recorder, fft;
let iterationBuffers = [];
let iterationSpectra = [];
let iterationMetrics = []; // Store spectral metrics for each iteration
let currentlyPlaying = null;
let recordedChunks = [];
let audioContext = null;

// Real-time processing
let realtimeAudioContext = null;
let realtimeSource = null;
let realtimeFilters = [];
let realtimeConvolver = null;
let realtimeMasterGain = null;
let realtimeDryGain = null;
let realtimeWetGain = null;
let realtimeLimiter = null;

// Spectral analysis metrics
let spectralMetrics = {
  centroid: 0,        // Where is the "mass" of sound
  flatness: 0,        // How tonal vs noisy (0=tonal, 1=noise)
  peakRatio: 0,       // Ratio of peak energy to total
  bandwidth: 0,       // Spectral spread
  dominantFreqs: [],  // Top 3 dominant frequencies
  intelligibility: 1  // Estimated speech intelligibility (1=clear, 0=modal)
};

// Speech Recognition
let speechRecognition = null;
let isRecognizing = false;
let transcribedText = '';
let interimText = '';
let transcriptionHistory = []; // Store transcription for each iteration
let speechRecognitionSupported = false;

// Loop Playback
let isLoopPlaying = false;
let loopPlaybackIndex = 0;
let loopPlaybackTimeout = null;

// Random Processing
let isRandomProcessing = false;
let randomProcessingLog = []; // Store parameters used for each iteration

// Room presets
const roomPresets = {
  small: { freqs: [120, 240, 380, 520, 780, 1100, 1800, 2400], name: 'Small' },
  large: { freqs: [60, 120, 180, 280, 400, 600, 900, 1400], name: 'Hall' },
  bathroom: { freqs: [200, 400, 800, 1200, 1600, 2000, 3000, 4000], name: 'Bath' },
  stairwell: { freqs: [80, 160, 320, 480, 640, 960, 1280, 1920], name: 'Stair' },
  cathedral: { freqs: [40, 80, 120, 200, 320, 500, 800, 1200], name: 'Cathedral' }
};

let currentPreset = 'small';
let roomResonances = [...roomPresets.small.freqs];

// IR presets
let currentIR = 'none';

// Visualization
let spectrogramData = [];
let recordingStartTime = 0;
let recordingDuration = 0;

// UI Elements
let controlPanel, infoPanel, togglePanelBtn;
let btnRecord, btnIterate, btnAuto, btnPlay, btnReset, btnCompare, btnInfo;
let btnRandomProcess, btnLoopPlay;
let sliderIterations, sliderQ, sliderMix, sliderFeedback;
let freqInputs = [];
let presetButtons = [];
let chkConvolver, selectIR;
let exportBtns = {};

// Colors
const C = {
  bg: '#0a0a0f',
  panel: '#12121a',
  grid: 'rgba(255,255,255,0.05)',
  cyan: '#00d4ff',
  magenta: '#ff006e',
  amber: '#ffbe0b',
  emerald: '#06d6a0',
  purple: '#8b5cf6',
  text: '#f0f0f5',
  muted: '#555566'
};

const iterColors = ['#ff006e','#00d4ff','#06d6a0','#ffbe0b','#8b5cf6','#f97316'];

// ============================================
// SETUP
// ============================================

function setup() {
  createCanvas(windowWidth, windowHeight);
  fft = new p5.FFT(0.8, 1024);
  
  // Initialize audio context
  audioContext = getAudioContext();
  
  // Initialize Speech Recognition
  initSpeechRecognition();
  
  createTogglePanelButton();
  createControlPanel();
  createInfoPanel();
  updateUI();
}

// ============================================
// SPEECH RECOGNITION (Web Speech API)
// ============================================

function initSpeechRecognition() {
  // Check for browser support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (SpeechRecognition) {
    speechRecognitionSupported = true;
    speechRecognition = new SpeechRecognition();
    
    // Configuration
    speechRecognition.continuous = true;
    speechRecognition.interimResults = true;
    speechRecognition.lang = 'pt-BR'; // Default to Portuguese, can be changed
    speechRecognition.maxAlternatives = 1;
    
    // Event handlers
    speechRecognition.onstart = () => {
      isRecognizing = true;
      console.log('Speech recognition started');
    };
    
    speechRecognition.onend = () => {
      isRecognizing = false;
      console.log('Speech recognition ended');
      // Save final transcription for iteration 0
      if (transcribedText.trim()) {
        transcriptionHistory[0] = transcribedText.trim();
      }
    };
    
    speechRecognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        transcribedText += finalTranscript;
      }
      interimText = interimTranscript;
    };
    
    speechRecognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Microphone access denied for speech recognition.');
      }
    };
    
    console.log('Speech Recognition initialized');
  } else {
    speechRecognitionSupported = false;
    console.log('Speech Recognition not supported in this browser');
  }
}

function startSpeechRecognition() {
  if (!speechRecognitionSupported || !speechRecognition) return;
  
  transcribedText = '';
  interimText = '';
  
  try {
    speechRecognition.start();
  } catch (e) {
    console.log('Speech recognition already started');
  }
}

function stopSpeechRecognition() {
  if (!speechRecognitionSupported || !speechRecognition) return;
  
  try {
    speechRecognition.stop();
  } catch (e) {
    console.log('Speech recognition already stopped');
  }
}

function setRecognitionLanguage(lang) {
  if (speechRecognition) {
    speechRecognition.lang = lang;
    console.log('Speech recognition language set to:', lang);
  }
}

function createTogglePanelButton() {
  togglePanelBtn = createButton('☰').addClass('toggle-panel-btn');
  togglePanelBtn.mousePressed(() => {
    state.showPanel = !state.showPanel;
    if (state.showPanel) {
      controlPanel.addClass('visible');
      togglePanelBtn.html('✕');
    } else {
      controlPanel.removeClass('visible');
      togglePanelBtn.html('☰');
    }
  });
}

// ============================================
// DRAW
// ============================================

function draw() {
  background(C.bg);
  
  // Calculate margin based on panel visibility
  let margin = state.showPanel ? 320 : 60;
  
  // Update spectral analysis
  if (state.status === 'playing' || state.status === 'recording') {
    updateSpectralMetrics();
  }
  
  if (state.showComparison && iterationSpectra.length > 1) {
    drawComparisonView();
  } else {
    drawGrid(margin);
    drawSpectrum(margin);
    drawResonanceLines(margin);
    drawInfo(margin);
    drawRecordingIndicator(margin);
    drawTranscription(margin);
    
    // Draw spectral analysis panel
    if (state.showAnalysis && (state.status === 'playing' || iterationBuffers.length > 0)) {
      drawSpectralAnalysis(margin);
      drawPhaseIndicator(margin);
      drawConvergenceGraph(margin);
    }
  }
  
  if (state.status === 'recording' || state.status === 'playing') {
    updateSpectrogramData();
  }
  
  // Update recording duration display
  if (state.status === 'recording') {
    recordingDuration = (millis() - recordingStartTime) / 1000;
  }
}

// ============================================
// VISUALIZATION
// ============================================

function drawGrid(margin) {
  stroke(C.grid);
  strokeWeight(1);
  
  // Frequency markers (logarithmic scale)
  let freqMarkers = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
  
  for (let freq of freqMarkers) {
    let x = map(log(freq), log(20), log(20000), margin, width - 20);
    line(x, 60, x, height - 100);
    
    // Frequency labels
    fill(C.muted);
    noStroke();
    textAlign(CENTER);
    textSize(8);
    let label = freq >= 1000 ? (freq / 1000) + 'k' : freq + '';
    text(label, x, 55);
    stroke(C.grid);
  }
  
  // Amplitude grid lines (horizontal)
  for (let i = 0; i <= 5; i++) {
    let y = map(i, 0, 5, 60, height - 100);
    line(margin, y, width - 20, y);
  }
  
  // Axis label
  fill(C.muted);
  noStroke();
  textAlign(LEFT);
  textSize(9);
  text('Hz', width - 15, 55);
}

function drawSpectrum(margin) {
  let spectrum = fft.analyze();
  let nyquist = 22050; // Assuming 44100 Hz sample rate
  
  noFill();
  strokeWeight(2);
  
  // Draw spectrum with logarithmic frequency scale
  beginShape();
  for (let i = 1; i < spectrum.length; i++) {
    // Convert bin index to frequency
    let freq = map(i, 0, spectrum.length, 0, nyquist);
    
    // Skip frequencies below 20Hz
    if (freq < 20) continue;
    
    // Map frequency to x position using logarithmic scale (matching resonance lines)
    let x = map(log(freq), log(20), log(20000), margin, width - 20);
    let y = map(spectrum[i], 0, 255, height - 120, 80);
    let c = lerpColor(color(C.cyan), color(C.magenta), spectrum[i] / 255);
    stroke(c);
    vertex(x, y);
  }
  endShape();
  
  // Fill under spectrum curve
  fill(C.cyan + '20');
  noStroke();
  beginShape();
  vertex(margin, height - 120);
  for (let i = 1; i < spectrum.length; i++) {
    let freq = map(i, 0, spectrum.length, 0, nyquist);
    if (freq < 20) continue;
    let x = map(log(freq), log(20), log(20000), margin, width - 20);
    let y = map(spectrum[i], 0, 255, height - 120, 80);
    vertex(x, y);
  }
  vertex(width - 20, height - 120);
  endShape(CLOSE);
}

function drawResonanceLines(margin) {
  strokeWeight(2);
  
  for (let i = 0; i < roomResonances.length; i++) {
    let freq = roomResonances[i];
    let x = map(log(freq), log(20), log(20000), margin, width - 20);
    let c = lerpColor(color(C.amber), color(C.emerald), i / 7);
    stroke(c);
    drawingContext.setLineDash([5, 5]);
    line(x, 60, x, height - 120);
    drawingContext.setLineDash([]);
    
    noStroke();
    fill(c);
    textAlign(CENTER);
    textSize(9);
    text(freq + 'Hz', x, height - 105);
  }
}

function drawInfo(margin) {
  fill(C.text);
  textAlign(CENTER);
  textSize(16);
  text('I AM SITTING IN A ROOM', (margin + width) / 2, 35);
  
  fill(C.muted);
  textSize(11);
  text('Alvin Lucier (1969) — Interactive Implementation', (margin + width) / 2, 52);
  
  // Frequency labels
  textSize(10);
  textAlign(LEFT);
  text('20 Hz', margin, height - 85);
  textAlign(RIGHT);
  text('20 kHz', width - 20, height - 85);
}

function drawRecordingIndicator(margin) {
  // Real-time mode indicator
  if (state.realtimeMode) {
    let pulse = sin(millis() * 0.008) * 0.3 + 0.7;
    
    // Background bar
    fill(C.panel + 'E0');
    stroke(C.magenta);
    strokeWeight(2);
    rect((margin + width) / 2 - 160, height - 85, 320, 55, 8);
    
    // Live indicator with pulsing
    fill(255, 0, 100, pulse * 255);
    noStroke();
    ellipse((margin + width) / 2 - 130, height - 55, 14, 14);
    
    // Status text
    fill(C.magenta);
    textSize(14);
    textStyle(BOLD);
    textAlign(CENTER);
    text('🔴 REAL-TIME MODE', (margin + width) / 2, height - 62);
    textStyle(NORMAL);
    
    // Info
    fill(C.text);
    textSize(10);
    text('Adjust sliders to hear effect changes instantly', (margin + width) / 2, height - 45);
    
    // Current parameters
    fill(C.cyan);
    textSize(9);
    text('Q: ' + state.filterQ + '  |  Wet: ' + Math.round(state.dryWetMix * 100) + '%  |  Gain: ' + Math.round(state.feedbackGain * 100) + '%', 
         (margin + width) / 2, height - 32);
    
    // Instructions
    fill(C.muted);
    textSize(9);
    text('Press SPACE or click Stop to exit', (margin + width) / 2, height - 18);
    
    return;
  }
  
  // Loop playback indicator
  if (isLoopPlaying) {
    let pulse = sin(millis() * 0.005) * 0.3 + 0.7;
    
    // Background bar
    fill(C.panel + 'E0');
    stroke(C.cyan);
    strokeWeight(2);
    rect((margin + width) / 2 - 150, height - 80, 300, 50, 8);
    
    // Loop icon with animation
    fill(C.cyan);
    noStroke();
    textSize(18);
    textAlign(CENTER);
    let rotatingIcon = frameCount % 60 < 30 ? '🔁' : '🔄';
    text(rotatingIcon, (margin + width) / 2 - 120, height - 50);
    
    // Status text
    fill(C.text);
    textSize(13);
    textStyle(BOLD);
    text('LOOP PLAYBACK', (margin + width) / 2, height - 60);
    textStyle(NORMAL);
    
    // Current iteration info
    fill(C.cyan);
    textSize(11);
    text('Playing: Iteration ' + loopPlaybackIndex + ' of ' + (maxAvailableIteration + 1), (margin + width) / 2, height - 45);
    
    // Progress dots - show all available iterations
    let totalDots = maxAvailableIteration + 1;
    let dotSpacing = min(14, 140 / max(totalDots, 1));
    let dotsWidth = (totalDots - 1) * dotSpacing;
    let startDotX = (margin + width) / 2 - dotsWidth / 2;
    let dotY = height - 32;
    
    for (let i = 0; i <= maxAvailableIteration; i++) {
      if (iterationBuffers[i]) {
        // Active dot (currently playing)
        if (i === loopPlaybackIndex) {
          fill(C.cyan);
          let pulseSize = 10 + sin(millis() * 0.01) * 3;
          ellipse(startDotX + i * dotSpacing, dotY, pulseSize, pulseSize);
        } else {
          // Available but not playing
          fill(C.muted);
          ellipse(startDotX + i * dotSpacing, dotY, 6, 6);
        }
      }
    }
    
    // Instructions
    fill(C.muted);
    textSize(9);
    text('Press SPACE or click Stop to end loop', (margin + width) / 2, height - 18);
    
    return; // Don't show recording indicator when looping
  }
  
  if (state.status !== 'recording') return;
  
  // Pulsing red circle
  let pulse = sin(millis() * 0.01) * 0.3 + 0.7;
  fill(255, 0, 80, pulse * 255);
  noStroke();
  ellipse((margin + width) / 2 - 80, height - 50, 16, 16);
  
  // Recording text with duration
  fill(C.magenta);
  textAlign(LEFT);
  textSize(14);
  text('● REC  ' + formatTime(recordingDuration), (margin + width) / 2 - 60, height - 45);
  
  // Instructions
  fill(C.muted);
  textSize(11);
  textAlign(CENTER);
  text('Press STOP or [R] to finish recording', (margin + width) / 2, height - 25);
}

function drawTranscription(margin) {
  // Check if transcription panel should be shown
  if (!state.showTranscription) return;
  
  // Show transcription panel if we have text or are recording
  let hasTranscription = transcribedText || interimText || transcriptionHistory[0];
  
  if (!hasTranscription && state.status !== 'recording') return;
  
  let panelX = margin + 20;
  let panelY = height - 180;
  let panelW = min(500, width - margin - 260);
  let panelH = 70;
  
  // Don't overlap with recording indicator
  if (state.status === 'recording') {
    panelY = height - 200;
  }
  
  // Background
  fill(C.panel + 'E8');
  stroke(C.cyan + '40');
  strokeWeight(1);
  rect(panelX, panelY, panelW, panelH, 8);
  
  // Title with speech recognition indicator
  fill(C.cyan);
  noStroke();
  textAlign(LEFT);
  textSize(10);
  textStyle(BOLD);
  
  let titleText = '🎤 SPEECH RECOGNITION';
  if (state.status === 'recording' && isRecognizing) {
    // Animated dots
    let dots = '.'.repeat((floor(millis() / 500) % 3) + 1);
    titleText += ' (listening' + dots + ')';
  } else if (!speechRecognitionSupported) {
    titleText += ' (not supported)';
  }
  text(titleText, panelX + 10, panelY + 18);
  textStyle(NORMAL);
  
  // Display text
  let displayText = '';
  
  if (state.status === 'recording') {
    // Show live transcription
    displayText = transcribedText + (interimText ? ' ' + interimText : '');
    if (!displayText && speechRecognitionSupported) {
      displayText = '(Speak now...)';
    } else if (!speechRecognitionSupported) {
      displayText = '(Speech recognition not available in this browser)';
    }
  } else if (transcriptionHistory[0]) {
    // Show saved transcription
    displayText = transcriptionHistory[0];
  }
  
  // Truncate if too long
  if (displayText.length > 200) {
    displayText = '...' + displayText.slice(-197);
  }
  
  // Text box
  fill(C.bg);
  noStroke();
  rect(panelX + 10, panelY + 25, panelW - 20, panelH - 35, 4);
  
  // Transcribed text
  fill(state.status === 'recording' ? C.text : C.muted);
  textSize(11);
  textAlign(LEFT, TOP);
  textWrap(WORD);
  text(displayText || '(No speech detected)', panelX + 15, panelY + 30, panelW - 30, panelH - 45);
  
  // Reset text alignment
  textAlign(LEFT, BASELINE);
}

function formatTime(seconds) {
  let mins = floor(seconds / 60);
  let secs = floor(seconds % 60);
  let ms = floor((seconds % 1) * 10);
  return nf(mins, 2) + ':' + nf(secs, 2) + '.' + ms;
}

function drawComparisonView() {
  fill(C.text);
  textAlign(CENTER);
  textSize(14);
  text('SPECTRAL CONVERGENCE: H(f)ⁿ · X(f)', width / 2, 30);
  
  fill(C.muted);
  textSize(10);
  text('Observing the transformation from intelligibility to resonance', width / 2, 48);
  
  // Show original transcription if available
  if (transcriptionHistory[0]) {
    fill(C.panel + 'E0');
    stroke(C.cyan + '40');
    strokeWeight(1);
    let transcriptW = min(600, width - 80);
    rect((width - transcriptW) / 2, 55, transcriptW, 35, 6);
    
    fill(C.cyan);
    noStroke();
    textSize(9);
    textAlign(LEFT);
    text('🎤 Original speech:', (width - transcriptW) / 2 + 10, 70);
    
    fill(C.text);
    textSize(10);
    let displayText = transcriptionHistory[0];
    if (displayText.length > 80) {
      displayText = displayText.slice(0, 77) + '...';
    }
    text('"' + displayText + '"', (width - transcriptW) / 2 + 10, 82);
  }
  
  let numSpectra = min(iterationSpectra.length, 6);
  let cols = 3;
  let rows = ceil(numSpectra / cols);
  let margin = 40;
  let gapX = 20, gapY = 50;
  let topOffset = transcriptionHistory[0] ? 100 : 70;
  let w = (width - 2 * margin - (cols - 1) * gapX) / cols;
  let h = (height - topOffset - 70 - (rows - 1) * gapY) / rows;
  
  for (let i = 0; i < numSpectra; i++) {
    let col = i % cols;
    let row = floor(i / cols);
    let x = margin + col * (w + gapX);
    let y = topOffset + row * (h + gapY);
    
    drawMiniSpectrumEnhanced(iterationSpectra[i], x, y, w, h, i);
  }
  
  // Legend
  fill(C.muted);
  textSize(10);
  textAlign(LEFT);
  text('🔊 SPEECH: High bandwidth, distributed energy', 40, height - 40);
  text('🔀 HYBRID: Emerging peaks, fading consonants', width/3, height - 40);
  text('🎵 MODAL: Room resonances dominate', 2*width/3, height - 40);
  
  fill(C.muted);
  textSize(9);
  textAlign(CENTER);
  text('Click anywhere to exit comparison view', width/2, height - 15);
}

function drawMiniSpectrumEnhanced(spectrum, x, y, w, h, idx) {
  // Get metrics for this iteration
  let metrics = iterationMetrics[idx] || { phase: 'unknown', peakRatio: 0, flatness: 0.5 };
  
  // Background with phase-colored border
  fill(C.bg);
  let phaseColor = metrics.phase === 'speech' ? C.emerald :
                   metrics.phase === 'hybrid' ? C.amber : C.magenta;
  stroke(phaseColor);
  strokeWeight(2);
  rect(x, y, w, h, 4);
  
  // Phase label
  fill(phaseColor);
  noStroke();
  textAlign(LEFT);
  textSize(9);
  let phaseLabel = metrics.phase === 'speech' ? '🔊 SPEECH' :
                   metrics.phase === 'hybrid' ? '🔀 HYBRID' : '🎵 MODAL';
  text(phaseLabel, x + 5, y - 18);
  
  // Iteration number
  let col = iterColors[idx % iterColors.length];
  fill(col);
  textAlign(RIGHT);
  textSize(10);
  textStyle(BOLD);
  text('Iteration ' + idx, x + w - 5, y - 18);
  textStyle(NORMAL);
  
  // Metrics mini-display
  fill(C.muted);
  textSize(7);
  textAlign(LEFT);
  text('Peak: ' + nf(metrics.peakRatio * 100, 0, 0) + '%', x + 5, y - 8);
  text('Tonal: ' + nf((1 - metrics.flatness) * 100, 0, 0) + '%', x + w/2, y - 8);
  
  // Draw spectrum
  noFill();
  stroke(col);
  strokeWeight(1.5);
  
  beginShape();
  for (let i = 0; i < spectrum.length; i++) {
    let sx = map(i, 0, spectrum.length, x + 2, x + w - 2);
    let sy = map(spectrum[i], 0, 255, y + h - 5, y + 5);
    vertex(sx, sy);
  }
  endShape();
  
  // Fill under curve
  fill(col + '30');
  noStroke();
  beginShape();
  vertex(x + 2, y + h - 5);
  for (let i = 0; i < spectrum.length; i++) {
    let sx = map(i, 0, spectrum.length, x + 2, x + w - 2);
    let sy = map(spectrum[i], 0, 255, y + h - 5, y + 5);
    vertex(sx, sy);
  }
  vertex(x + w - 2, y + h - 5);
  endShape(CLOSE);
  
  // Mark room resonances on spectrum
  stroke(C.amber + '60');
  strokeWeight(1);
  for (let freq of roomResonances) {
    let freqX = map(log(freq), log(20), log(20000), x + 2, x + w - 2);
    if (freqX > x && freqX < x + w) {
      line(freqX, y + h - 5, freqX, y + 5);
    }
  }
}

function updateSpectrogramData() {
  let spectrum = fft.analyze();
  spectrogramData.push([...spectrum]);
  if (spectrogramData.length > 100) spectrogramData.shift();
}

// ============================================
// SPECTRAL ANALYSIS - Based on Lucier's compositional process
// ============================================

function updateSpectralMetrics() {
  let spectrum = fft.analyze();
  let nyquist = 22050; // Assuming 44100 Hz sample rate
  
  // 1. Spectral Centroid - "center of mass" of the spectrum
  let weightedSum = 0;
  let totalEnergy = 0;
  for (let i = 0; i < spectrum.length; i++) {
    let freq = map(i, 0, spectrum.length, 0, nyquist);
    let amp = spectrum[i];
    weightedSum += freq * amp;
    totalEnergy += amp;
  }
  spectralMetrics.centroid = totalEnergy > 0 ? weightedSum / totalEnergy : 0;
  
  // 2. Spectral Flatness - how "tonal" vs "noisy" (Wiener entropy)
  let geometricMean = 0;
  let arithmeticMean = 0;
  let validBins = 0;
  for (let i = 1; i < spectrum.length; i++) {
    let amp = spectrum[i] + 0.0001; // Avoid log(0)
    geometricMean += log(amp);
    arithmeticMean += amp;
    validBins++;
  }
  geometricMean = exp(geometricMean / validBins);
  arithmeticMean = arithmeticMean / validBins;
  spectralMetrics.flatness = arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
  
  // 3. Peak Ratio - ratio of energy in top peaks vs total
  let sortedSpectrum = [...spectrum].sort((a, b) => b - a);
  let topPeakEnergy = 0;
  for (let i = 0; i < min(10, sortedSpectrum.length); i++) {
    topPeakEnergy += sortedSpectrum[i];
  }
  spectralMetrics.peakRatio = totalEnergy > 0 ? topPeakEnergy / totalEnergy : 0;
  
  // 4. Spectral Bandwidth - spread around centroid
  let varianceSum = 0;
  for (let i = 0; i < spectrum.length; i++) {
    let freq = map(i, 0, spectrum.length, 0, nyquist);
    let amp = spectrum[i];
    varianceSum += amp * pow(freq - spectralMetrics.centroid, 2);
  }
  spectralMetrics.bandwidth = totalEnergy > 0 ? sqrt(varianceSum / totalEnergy) : 0;
  
  // 5. Find dominant frequencies (peaks)
  spectralMetrics.dominantFreqs = findDominantPeaks(spectrum, nyquist, 5);
  
  // 6. Intelligibility estimate
  // Speech has energy spread across frequencies; modal sound concentrates in peaks
  // Low flatness + high peak ratio = more modal
  spectralMetrics.intelligibility = constrain(
    spectralMetrics.flatness * 2 - spectralMetrics.peakRatio * 0.5 + 0.3,
    0, 1
  );
  
  // Determine phase based on metrics
  updatePhaseDetection();
}

function findDominantPeaks(spectrum, nyquist, numPeaks) {
  let peaks = [];
  
  // Find local maxima
  for (let i = 2; i < spectrum.length - 2; i++) {
    if (spectrum[i] > spectrum[i-1] && spectrum[i] > spectrum[i+1] &&
        spectrum[i] > spectrum[i-2] && spectrum[i] > spectrum[i+2] &&
        spectrum[i] > 30) { // Threshold
      let freq = map(i, 0, spectrum.length, 0, nyquist);
      peaks.push({ freq: freq, amp: spectrum[i], bin: i });
    }
  }
  
  // Sort by amplitude and take top N
  peaks.sort((a, b) => b.amp - a.amp);
  return peaks.slice(0, numPeaks);
}

function updatePhaseDetection() {
  // Phase detection based on Lucier's three regimes:
  // 1. Speech phase: high intelligibility, high bandwidth, low peak concentration
  // 2. Hybrid phase: decreasing intelligibility, emerging peaks, rhythm still present
  // 3. Modal phase: low intelligibility, high peak concentration, quasi-sinusoidal
  
  let prevPhase = state.currentPhase;
  
  if (spectralMetrics.intelligibility > 0.6 && spectralMetrics.flatness > 0.3) {
    state.currentPhase = 'speech';
  } else if (spectralMetrics.intelligibility > 0.3 && spectralMetrics.peakRatio < 0.7) {
    state.currentPhase = 'hybrid';
  } else if (spectralMetrics.peakRatio > 0.5 || spectralMetrics.flatness < 0.2) {
    state.currentPhase = 'modal';
  }
  
  // Record phase transitions
  if (prevPhase !== state.currentPhase && state.currentPhase !== 'none') {
    state.phaseHistory.push({
      iteration: state.currentIteration,
      phase: state.currentPhase,
      time: millis()
    });
  }
}

function drawSpectralAnalysis(margin) {
  let panelX = width - 220;
  let panelY = 70;
  let panelW = 200;
  let panelH = 180;
  
  // Background
  fill(C.panel + 'E0');
  stroke(C.grid);
  strokeWeight(1);
  rect(panelX, panelY, panelW, panelH, 8);
  
  // Title
  fill(C.cyan);
  noStroke();
  textAlign(LEFT);
  textSize(11);
  textStyle(BOLD);
  text('SPECTRAL ANALYSIS', panelX + 10, panelY + 20);
  textStyle(NORMAL);
  
  // Metrics
  let y = panelY + 40;
  let lineH = 22;
  
  // Centroid
  fill(C.muted);
  textSize(9);
  text('Centroid:', panelX + 10, y);
  fill(C.text);
  text(nf(spectralMetrics.centroid, 0, 0) + ' Hz', panelX + 80, y);
  drawMiniBar(panelX + 140, y - 8, 50, 8, spectralMetrics.centroid / 4000, C.cyan);
  
  // Flatness (tonality)
  y += lineH;
  fill(C.muted);
  text('Tonality:', panelX + 10, y);
  fill(C.text);
  let tonalityLabel = spectralMetrics.flatness < 0.2 ? 'Tonal' : 
                      spectralMetrics.flatness > 0.5 ? 'Noisy' : 'Mixed';
  text(tonalityLabel, panelX + 80, y);
  drawMiniBar(panelX + 140, y - 8, 50, 8, 1 - spectralMetrics.flatness, C.amber);
  
  // Peak concentration
  y += lineH;
  fill(C.muted);
  text('Peak Ratio:', panelX + 10, y);
  fill(C.text);
  text(nf(spectralMetrics.peakRatio * 100, 0, 0) + '%', panelX + 80, y);
  drawMiniBar(panelX + 140, y - 8, 50, 8, spectralMetrics.peakRatio, C.magenta);
  
  // Bandwidth
  y += lineH;
  fill(C.muted);
  text('Bandwidth:', panelX + 10, y);
  fill(C.text);
  text(nf(spectralMetrics.bandwidth, 0, 0) + ' Hz', panelX + 80, y);
  drawMiniBar(panelX + 140, y - 8, 50, 8, spectralMetrics.bandwidth / 3000, C.emerald);
  
  // Dominant frequencies
  y += lineH + 5;
  fill(C.muted);
  text('Dominant Peaks:', panelX + 10, y);
  y += 12;
  fill(C.text);
  textSize(8);
  let freqStr = spectralMetrics.dominantFreqs.slice(0, 3)
    .map(p => nf(p.freq, 0, 0) + 'Hz')
    .join(', ');
  text(freqStr || '--', panelX + 10, y);
}

function drawMiniBar(x, y, w, h, value, col) {
  // Background
  fill(C.bg);
  noStroke();
  rect(x, y, w, h, 2);
  
  // Fill
  fill(col);
  rect(x, y, w * constrain(value, 0, 1), h, 2);
}

function drawPhaseIndicator(margin) {
  let panelX = width - 220;
  let panelY = 260;
  let panelW = 200;
  let panelH = 70;
  
  // Background
  fill(C.panel + 'E0');
  stroke(C.grid);
  strokeWeight(1);
  rect(panelX, panelY, panelW, panelH, 8);
  
  // Title
  fill(C.cyan);
  noStroke();
  textAlign(LEFT);
  textSize(11);
  textStyle(BOLD);
  text('TRANSFORMATION PHASE', panelX + 10, panelY + 20);
  textStyle(NORMAL);
  
  // Phase boxes
  let phases = [
    { id: 'speech', label: 'SPEECH', desc: 'Semantic' },
    { id: 'hybrid', label: 'HYBRID', desc: 'Transition' },
    { id: 'modal', label: 'MODAL', desc: 'Resonance' }
  ];
  
  let boxW = 58;
  let boxH = 30;
  let startX = panelX + 10;
  let boxY = panelY + 30;
  
  for (let i = 0; i < phases.length; i++) {
    let x = startX + i * (boxW + 5);
    let isActive = state.currentPhase === phases[i].id;
    
    // Box
    if (isActive) {
      fill(phases[i].id === 'speech' ? C.emerald :
           phases[i].id === 'hybrid' ? C.amber : C.magenta);
      stroke(255);
    } else {
      fill(C.bg);
      stroke(C.muted);
    }
    strokeWeight(isActive ? 2 : 1);
    rect(x, boxY, boxW, boxH, 4);
    
    // Label
    fill(isActive ? C.bg : C.muted);
    noStroke();
    textAlign(CENTER);
    textSize(8);
    textStyle(BOLD);
    text(phases[i].label, x + boxW/2, boxY + 12);
    textStyle(NORMAL);
    textSize(7);
    text(phases[i].desc, x + boxW/2, boxY + 23);
  }
  
  // Arrow between phases
  stroke(C.muted);
  strokeWeight(1);
  for (let i = 0; i < 2; i++) {
    let x = startX + (i + 1) * (boxW + 5) - 3;
    line(x - 8, boxY + boxH/2, x, boxY + boxH/2);
    // Arrowhead
    line(x - 4, boxY + boxH/2 - 3, x, boxY + boxH/2);
    line(x - 4, boxY + boxH/2 + 3, x, boxY + boxH/2);
  }
}

function drawConvergenceGraph(margin) {
  // Only show if we have iteration data
  if (iterationMetrics.length < 2) return;
  
  let panelX = width - 220;
  let panelY = 340;
  let panelW = 200;
  let panelH = 100;
  
  // Background
  fill(C.panel + 'E0');
  stroke(C.grid);
  strokeWeight(1);
  rect(panelX, panelY, panelW, panelH, 8);
  
  // Title
  fill(C.cyan);
  noStroke();
  textAlign(LEFT);
  textSize(11);
  textStyle(BOLD);
  text('CONVERGENCE H(f)^n', panelX + 10, panelY + 20);
  textStyle(NORMAL);
  
  // Graph area
  let graphX = panelX + 30;
  let graphY = panelY + 30;
  let graphW = panelW - 40;
  let graphH = panelH - 45;
  
  // Axes
  stroke(C.muted);
  strokeWeight(1);
  line(graphX, graphY + graphH, graphX + graphW, graphY + graphH); // X axis
  line(graphX, graphY, graphX, graphY + graphH); // Y axis
  
  // Labels
  fill(C.muted);
  textSize(7);
  textAlign(CENTER);
  text('Iteration', graphX + graphW/2, graphY + graphH + 12);
  
  push();
  translate(graphX - 12, graphY + graphH/2);
  rotate(-HALF_PI);
  text('Selectivity', 0, 0);
  pop();
  
  // Plot peak ratio over iterations (shows convergence)
  if (iterationMetrics.length > 1) {
    noFill();
    stroke(C.magenta);
    strokeWeight(2);
    beginShape();
    for (let i = 0; i < iterationMetrics.length; i++) {
      let x = map(i, 0, max(iterationMetrics.length - 1, 1), graphX, graphX + graphW);
      let y = map(iterationMetrics[i].peakRatio, 0, 1, graphY + graphH, graphY);
      vertex(x, y);
    }
    endShape();
    
    // Plot flatness (inverse = tonality)
    stroke(C.amber);
    strokeWeight(1.5);
    beginShape();
    for (let i = 0; i < iterationMetrics.length; i++) {
      let x = map(i, 0, max(iterationMetrics.length - 1, 1), graphX, graphX + graphW);
      let y = map(1 - iterationMetrics[i].flatness, 0, 1, graphY + graphH, graphY);
      vertex(x, y);
    }
    endShape();
    
    // Legend
    fill(C.magenta);
    noStroke();
    textSize(7);
    textAlign(LEFT);
    rect(panelX + panelW - 70, panelY + 8, 6, 6);
    text('Peak', panelX + panelW - 60, panelY + 14);
    
    fill(C.amber);
    rect(panelX + panelW - 35, panelY + 8, 6, 6);
    text('Tonal', panelX + panelW - 25, panelY + 14);
  }
}

// ============================================
// AUDIO
// ============================================

// ============================================
// AUDIO - Using MediaRecorder for reliable recording
// ============================================

let mediaRecorder = null;
let audioChunks = [];
let mediaStream = null;

function generateSyntheticIR(type, sr = 44100, dur = 2) {
  let len = Math.floor(sr * dur);
  let buf = new Float32Array(len);
  
  if (type === 'synthetic_small') {
    // Small room: short decay, early reflections, higher frequencies
    for (let i = 0; i < len; i++) {
      let t = i / sr;
      // Initial impulse
      if (i < 10) buf[i] = (Math.random() * 2 - 1) * (1 - i/10);
      // Early reflections (discrete echoes)
      let reflections = [0.02, 0.035, 0.05, 0.07, 0.09];
      for (let r of reflections) {
        let idx = Math.floor(r * sr);
        if (i >= idx && i < idx + 100) {
          buf[i] += (Math.random() * 2 - 1) * 0.4 * Math.exp(-(i - idx) / 50);
        }
      }
      // Diffuse tail
      buf[i] += (Math.random() * 2 - 1) * Math.exp(-t * 12) * 0.3;
      // Room modes
      for (let f of [200, 400, 600]) {
        buf[i] += Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 15) * 0.05;
      }
    }
  } else if (type === 'synthetic_large') {
    // Large hall: long decay, spaced reflections, lower frequencies
    for (let i = 0; i < len; i++) {
      let t = i / sr;
      // Initial impulse
      if (i < 5) buf[i] = (Math.random() * 2 - 1) * (1 - i/5);
      // Early reflections (more spaced)
      let reflections = [0.03, 0.06, 0.1, 0.15, 0.22, 0.3];
      for (let r of reflections) {
        let idx = Math.floor(r * sr);
        if (i >= idx && i < idx + 200) {
          buf[i] += (Math.random() * 2 - 1) * 0.3 * Math.exp(-(i - idx) / 100);
        }
      }
      // Long diffuse tail
      buf[i] += (Math.random() * 2 - 1) * Math.exp(-t * 2.5) * 0.5;
      // Low room modes (hall resonances)
      for (let f of [60, 90, 120, 180]) {
        buf[i] += Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 3) * 0.08;
      }
    }
  } else if (type === 'synthetic_plate') {
    // Plate reverb: dense, metallic, bright
    for (let i = 0; i < len; i++) {
      let t = i / sr;
      // Dense initial burst
      if (t < 0.01) {
        buf[i] = (Math.random() * 2 - 1) * (1 - t/0.01);
      }
      // Very dense diffusion (plate characteristic)
      buf[i] += (Math.random() * 2 - 1) * Math.exp(-t * 4) * 0.6;
      // Metallic resonances (higher harmonics)
      for (let j = 1; j <= 12; j++) {
        let f = 300 * j + (Math.random() - 0.5) * 50;
        buf[i] += Math.sin(2 * Math.PI * f * t) * Math.exp(-t * (3 + j * 0.3)) * (0.04 / j);
      }
    }
  } else {
    // Default: medium room
    for (let i = 0; i < len; i++) {
      let t = i / sr;
      if (i < 8) buf[i] = (Math.random() * 2 - 1) * (1 - i/8);
      buf[i] += (Math.random() * 2 - 1) * Math.exp(-t * 6) * 0.4;
    }
  }
  
  // Normalize IR
  let maxVal = 0;
  for (let i = 0; i < len; i++) {
    maxVal = Math.max(maxVal, Math.abs(buf[i]));
  }
  if (maxVal > 0) {
    for (let i = 0; i < len; i++) {
      buf[i] /= maxVal;
    }
  }
  
  return buf;
}

// ============================================
// AUDIO UTILITIES
// ============================================

/**
 * Apply fade in and fade out to an AudioBuffer to prevent clipping
 * @param {AudioBuffer} buffer - The audio buffer to process
 * @param {number} fadeInDuration - Fade in duration in seconds
 * @param {number} fadeOutDuration - Fade out duration in seconds
 */
function applyFadeInOut(buffer, fadeInDuration = 0.05, fadeOutDuration = 0.15) {
  const sampleRate = buffer.sampleRate;
  const fadeInSamples = Math.floor(fadeInDuration * sampleRate);
  const fadeOutSamples = Math.floor(fadeOutDuration * sampleRate);
  
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel);
    const length = data.length;
    
    // Apply fade in (using cosine curve for smooth transition)
    for (let i = 0; i < fadeInSamples && i < length; i++) {
      // Cosine fade: starts at 0, ends at 1
      const fadeGain = 0.5 * (1 - Math.cos(Math.PI * i / fadeInSamples));
      data[i] *= fadeGain;
    }
    
    // Apply fade out (using cosine curve for smooth transition)
    const fadeOutStart = length - fadeOutSamples;
    for (let i = fadeOutStart; i < length; i++) {
      if (i >= 0) {
        // Cosine fade: starts at 1, ends at 0
        const position = i - fadeOutStart;
        const fadeGain = 0.5 * (1 + Math.cos(Math.PI * position / fadeOutSamples));
        data[i] *= fadeGain;
      }
    }
  }
  
  console.log(`Applied fade: ${fadeInDuration}s in, ${fadeOutDuration}s out`);
}

/**
 * Normalize audio buffer to prevent clipping and distortion
 * Uses peak normalization with headroom and soft knee compression
 * @param {AudioBuffer} buffer - The audio buffer to normalize
 * @param {number} targetLevel - Target peak level (0-1), default 0.85
 * @param {boolean} applyCompression - Whether to apply soft compression
 */
function normalizeAudioBuffer(buffer, targetLevel = 0.85, applyCompression = true) {
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel);
    const length = data.length;
    
    // Find peak amplitude
    let peakAmp = 0;
    for (let i = 0; i < length; i++) {
      peakAmp = Math.max(peakAmp, Math.abs(data[i]));
    }
    
    if (peakAmp < 0.001) {
      console.log('Audio too quiet to normalize');
      return;
    }
    
    // Apply soft knee compression if enabled (reduces dynamic range gently)
    if (applyCompression && peakAmp > 0.5) {
      const threshold = 0.5;
      const ratio = 4; // 4:1 compression above threshold
      const knee = 0.1;
      
      for (let i = 0; i < length; i++) {
        const absVal = Math.abs(data[i]);
        const sign = data[i] >= 0 ? 1 : -1;
        
        if (absVal > threshold) {
          // Soft knee compression
          const overshoot = absVal - threshold;
          const compressed = threshold + overshoot / ratio;
          data[i] = sign * compressed;
        }
      }
      
      // Recalculate peak after compression
      peakAmp = 0;
      for (let i = 0; i < length; i++) {
        peakAmp = Math.max(peakAmp, Math.abs(data[i]));
      }
    }
    
    // Normalize to target level
    if (peakAmp > 0.001) {
      const gain = targetLevel / peakAmp;
      for (let i = 0; i < length; i++) {
        data[i] *= gain;
        // Hard clip safety (should not be needed after normalization)
        data[i] = Math.max(-1, Math.min(1, data[i]));
      }
    }
  }
  
  console.log(`Normalized audio to ${(targetLevel * 100).toFixed(0)}% level`);
}

async function startRecording() {
  try {
    // Request microphone access
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Create MediaRecorder
    mediaRecorder = new MediaRecorder(mediaStream);
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = async () => {
      // Stop all tracks
      mediaStream.getTracks().forEach(track => track.stop());
      
      // Stop speech recognition
      stopSpeechRecognition();
      
      // Create blob from chunks
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      
      // Convert to AudioBuffer
      try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        
        // Normalize audio to prevent clipping
        normalizeAudioBuffer(audioBuffer, 0.85, true);
        
        // Apply fade in/out to prevent clicks
        applyFadeInOut(audioBuffer, 0.05, 0.15); // 50ms fade in, 150ms fade out
        
        // Create p5.SoundFile-like object
        let sf = {
          buffer: audioBuffer,
          duration: () => audioBuffer.duration,
          isPlaying: () => false,
          _playing: false,
          _source: null,
          
          play: function() {
            if (this._playing) this.stop();
            const ctx = getAudioContext();
            this._source = ctx.createBufferSource();
            this._source.buffer = this.buffer;
            this._source.connect(ctx.destination);
            this._source.connect(fft.analyser);
            this._source.onended = () => {
              this._playing = false;
              // Don't change status if loop is playing
              if (!isLoopPlaying) {
                state.status = 'ready';
                currentlyPlaying = null;
              }
              updateUI();
            };
            this._source.start();
            this._playing = true;
          },
          
          stop: function() {
            if (this._source) {
              try { this._source.stop(); } catch(e) {}
              this._source = null;
            }
            this._playing = false;
          },
          
          connect: function() {},
          disconnect: function() {},
          onended: function() {}
        };
        
        iterationBuffers[0] = sf;
        state.currentIteration = 0;
        state.status = 'ready';
        
        // Save transcription for this iteration
        if (transcribedText.trim()) {
          transcriptionHistory[0] = transcribedText.trim();
        }
        
        // Capture spectrum
        captureBufferSpectrum(sf.buffer, 0);
        
        updateUI();
        updateTimeline();
        console.log('Recording complete. Duration:', sf.duration().toFixed(2) + 's');
        if (transcriptionHistory[0]) {
          console.log('Transcribed text:', transcriptionHistory[0]);
        }
        
      } catch (err) {
        console.error('Error processing audio:', err);
        state.status = 'ready';
        updateUI();
        alert('Error processing recording. Please try again.');
      }
    };
    
    // Start recording
    mediaRecorder.start();
    state.status = 'recording';
    recordingStartTime = millis();
    recordingDuration = 0;
    spectrogramData = [];
    
    // Start speech recognition
    startSpeechRecognition();
    
    // Connect to FFT for visualization
    await userStartAudio();
    mic = new p5.AudioIn();
    await mic.start();
    fft.setInput(mic);
    
    updateUI();
    
  } catch (err) {
    console.error('Recording error:', err);
    state.status = 'ready';
    updateUI();
    alert('Could not access microphone. Please allow microphone access.');
  }
}

function stopRecording() {
  if (mediaRecorder && state.status === 'recording') {
    mediaRecorder.stop();
    if (mic) mic.stop();
    state.status = 'processing';
    updateUI();
  }
}

function toggleRecording() {
  if (state.status === 'recording') {
    stopRecording();
  } else if (state.status === 'ready') {
    startRecording();
  }
}

function captureBufferSpectrum(audioBuffer, idx) {
  let data = audioBuffer.getChannelData(0);
  let fftSize = 1024;
  let spectrum = new Array(fftSize).fill(0);
  let numWin = min(10, floor(data.length / fftSize));
  
  for (let w = 0; w < numWin; w++) {
    let start = floor(w * data.length / numWin);
    for (let i = 0; i < fftSize && start + i < data.length; i++) {
      spectrum[i] += abs(data[start + i]) * 255;
    }
  }
  let maxVal = max(1, Math.max(...spectrum));
  for (let i = 0; i < spectrum.length; i++) spectrum[i] = (spectrum[i] / maxVal) * 200;
  
  // Smooth
  let smoothed = [];
  for (let i = 0; i < spectrum.length; i++) {
    let sum = 0, cnt = 0;
    for (let j = max(0, i - 5); j <= min(spectrum.length - 1, i + 5); j++) {
      sum += spectrum[j]; cnt++;
    }
    smoothed[i] = sum / cnt;
  }
  iterationSpectra[idx] = smoothed;
  
  // Calculate and store metrics for this iteration
  let metrics = calculateBufferMetrics(smoothed);
  iterationMetrics[idx] = metrics;
  
  console.log(`Iteration ${idx} metrics:`, metrics);
}

function calculateBufferMetrics(spectrum) {
  let nyquist = 22050;
  
  // Spectral centroid
  let weightedSum = 0;
  let totalEnergy = 0;
  for (let i = 0; i < spectrum.length; i++) {
    let freq = map(i, 0, spectrum.length, 0, nyquist);
    let amp = spectrum[i];
    weightedSum += freq * amp;
    totalEnergy += amp;
  }
  let centroid = totalEnergy > 0 ? weightedSum / totalEnergy : 0;
  
  // Spectral flatness
  let geometricMean = 0;
  let arithmeticMean = 0;
  let validBins = 0;
  for (let i = 1; i < spectrum.length; i++) {
    let amp = spectrum[i] + 0.0001;
    geometricMean += log(amp);
    arithmeticMean += amp;
    validBins++;
  }
  geometricMean = exp(geometricMean / validBins);
  arithmeticMean = arithmeticMean / validBins;
  let flatness = arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
  
  // Peak ratio
  let sortedSpectrum = [...spectrum].sort((a, b) => b - a);
  let topPeakEnergy = 0;
  for (let i = 0; i < min(10, sortedSpectrum.length); i++) {
    topPeakEnergy += sortedSpectrum[i];
  }
  let peakRatio = totalEnergy > 0 ? topPeakEnergy / totalEnergy : 0;
  
  // Bandwidth
  let varianceSum = 0;
  for (let i = 0; i < spectrum.length; i++) {
    let freq = map(i, 0, spectrum.length, 0, nyquist);
    let amp = spectrum[i];
    varianceSum += amp * pow(freq - centroid, 2);
  }
  let bandwidth = totalEnergy > 0 ? sqrt(varianceSum / totalEnergy) : 0;
  
  // Determine phase
  let phase = 'speech';
  if (flatness < 0.2 || peakRatio > 0.6) {
    phase = 'modal';
  } else if (flatness < 0.4 || peakRatio > 0.4) {
    phase = 'hybrid';
  }
  
  return {
    centroid: centroid,
    flatness: flatness,
    peakRatio: peakRatio,
    bandwidth: bandwidth,
    phase: phase
  };
}

function processIteration() {
  if (state.currentIteration >= state.maxIterations - 1) {
    state.isAutoProcessing = false;
    updateUI();
    return;
  }
  if (!iterationBuffers[state.currentIteration]) return;
  
  state.status = 'processing';
  updateUI();
  
  processAudioOffline(iterationBuffers[state.currentIteration]).then(processed => {
    state.currentIteration++;
    iterationBuffers[state.currentIteration] = processed;
    captureBufferSpectrum(processed.buffer, state.currentIteration);
    state.status = 'ready';
    updateUI();
    updateTimeline();
    
    if (state.isAutoProcessing && state.currentIteration < state.maxIterations - 1) {
      setTimeout(processIteration, 500);
    } else {
      state.isAutoProcessing = false;
      updateUI();
    }
  }).catch(err => {
    console.error(err);
    state.status = 'ready';
    state.isAutoProcessing = false;
    updateUI();
  });
}

async function processAudioOffline(source) {
  return new Promise((resolve, reject) => {
    let audioBuffer = source.buffer;
    
    if (!audioBuffer || audioBuffer.length === 0) {
      reject(new Error('Invalid audio buffer'));
      return;
    }
    
    try {
      let sampleRate = audioBuffer.sampleRate;
      let length = audioBuffer.length;
      let ctx = new OfflineAudioContext(1, length, sampleRate);
      
      // Source buffer
      let src = ctx.createBufferSource();
      src.buffer = audioBuffer;
      
      // === DRY PATH (original signal) ===
      let dryGain = ctx.createGain();
      dryGain.gain.value = 1.0 - state.dryWetMix;
      
      // === WET PATH (processed signal) ===
      let wetGain = ctx.createGain();
      wetGain.gain.value = state.dryWetMix;
      
      // Create parallel resonant filters (peaking EQ for more natural resonance)
      // Each filter boosts its frequency rather than isolating it
      let filterBank = [];
      let filterMerge = ctx.createGain();
      
      // Calculate boost based on Q - higher Q = more resonance
      let boostDB = map(state.filterQ, 5, 100, 6, 24); // 6dB to 24dB boost
      
      for (let i = 0; i < roomResonances.length; i++) {
        let freq = roomResonances[i];
        
        // Use peaking filter for resonance boost
        let peak = ctx.createBiquadFilter();
        peak.type = 'peaking';
        peak.frequency.value = freq;
        peak.Q.value = state.filterQ / 5; // Peaking Q is different scale
        peak.gain.value = boostDB; // Boost in dB
        
        filterBank.push(peak);
      }
      
      // Chain filters in series for cumulative effect (like real room modes)
      let currentNode = src;
      for (let filter of filterBank) {
        currentNode.connect(filter);
        currentNode = filter;
      }
      currentNode.connect(filterMerge);
      
      // Apply a gentle lowpass to simulate air absorption
      let airAbsorption = ctx.createBiquadFilter();
      airAbsorption.type = 'lowpass';
      airAbsorption.frequency.value = 8000 + (1 - state.dryWetMix) * 8000; // 8-16kHz
      airAbsorption.Q.value = 0.7;
      filterMerge.connect(airAbsorption);
      
      // Convolution (if enabled)
      let postFilter = airAbsorption;
      
      if (state.useConvolver && currentIR !== 'none') {
        let irData = generateSyntheticIR(currentIR, sampleRate, 2.0);
        let irBuffer = ctx.createBuffer(1, irData.length, sampleRate);
        irBuffer.getChannelData(0).set(irData);
        
        let convolver = ctx.createConvolver();
        convolver.buffer = irBuffer;
        
        // Mix convolution with dry filtered signal
        let convGain = ctx.createGain();
        convGain.gain.value = 0.5; // 50% convolution mix
        
        let directGain = ctx.createGain();
        directGain.gain.value = 0.5;
        
        airAbsorption.connect(convolver);
        airAbsorption.connect(directGain);
        convolver.connect(convGain);
        
        // Merge convolution
        let convMerge = ctx.createGain();
        convGain.connect(convMerge);
        directGain.connect(convMerge);
        
        postFilter = convMerge;
      }
      
      postFilter.connect(wetGain);
      
      // Dry path - connect source directly
      src.connect(dryGain);
      
      // === MASTER OUTPUT ===
      let master = ctx.createGain();
      master.gain.value = state.feedbackGain;
      
      dryGain.connect(master);
      wetGain.connect(master);
      
      // Soft limiter to prevent clipping
      let limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -3;
      limiter.knee.value = 6;
      limiter.ratio.value = 12;
      limiter.attack.value = 0.001;
      limiter.release.value = 0.1;
      
      master.connect(limiter);
      limiter.connect(ctx.destination);
      
      // Start processing
      src.start(0);
      
      ctx.startRendering().then(rendered => {
        // Normalize audio to prevent clipping and distortion
        normalizeAudioBuffer(rendered, 0.85, true);
        
        // Apply fade in/out to prevent clicks at start/end
        applyFadeInOut(rendered, 0.03, 0.12); // 30ms fade in, 120ms fade out
        
        // Create sound object
        let sf = {
          buffer: rendered,
          duration: () => rendered.duration,
          isPlaying: () => false,
          _playing: false,
          _source: null,
          
          play: function() {
            if (this._playing) this.stop();
            const actx = getAudioContext();
            this._source = actx.createBufferSource();
            this._source.buffer = this.buffer;
            this._source.connect(actx.destination);
            this._source.connect(fft.analyser);
            this._source.onended = () => {
              this._playing = false;
              // Don't change status if loop is playing
              if (!isLoopPlaying) {
                state.status = 'ready';
                currentlyPlaying = null;
              }
              updateUI();
            };
            this._source.start();
            this._playing = true;
          },
          
          stop: function() {
            if (this._source) {
              try { this._source.stop(); } catch(e) {}
              this._source = null;
            }
            this._playing = false;
          },
          
          connect: function() {},
          disconnect: function() {},
          onended: function() {}
        };
        
        console.log(`Iteration processed: Q=${state.filterQ}, Wet=${state.dryWetMix}, Feedback=${state.feedbackGain}`);
        resolve(sf);
        
      }).catch(err => {
        console.error('Rendering error:', err);
        reject(err);
      });
      
    } catch (err) {
      console.error('Processing setup error:', err);
      reject(err);
    }
  });
}

function playIteration(idx) {
  if (currentlyPlaying) {
    currentlyPlaying.stop();
  }
  let buf = iterationBuffers[idx];
  if (!buf) return;
  
  state.status = 'playing';
  updateUI();
  
  currentlyPlaying = buf;
  buf.play();
}

function stopPlayback() {
  if (currentlyPlaying) {
    currentlyPlaying.stop();
    currentlyPlaying = null;
  }
  // Don't change status if loop is playing
  if (!isLoopPlaying) {
    state.status = 'ready';
  }
  updateUI();
}

// ============================================
// LOOP PLAYBACK - Play all iterations in sequence
// ============================================

let maxAvailableIteration = 0; // Track the highest iteration with audio

function toggleLoopPlayback() {
  if (isLoopPlaying) {
    stopLoopPlayback();
  } else {
    startLoopPlayback();
  }
}

function startLoopPlayback() {
  // Count available iterations
  let availableCount = 0;
  maxAvailableIteration = 0;
  
  for (let i = 0; i < iterationBuffers.length; i++) {
    if (iterationBuffers[i]) {
      availableCount++;
      maxAvailableIteration = i;
    }
  }
  
  if (availableCount === 0) {
    alert('No recordings to play. Record something first!');
    return;
  }
  
  isLoopPlaying = true;
  loopPlaybackIndex = 0;
  state.status = 'playing';
  updateLoopButtonUI();
  updateUI();
  
  console.log('Starting loop playback of', availableCount, 'iterations (max index:', maxAvailableIteration, ')');
  playNextInLoop();
}

function stopLoopPlayback() {
  isLoopPlaying = false;
  
  if (loopPlaybackTimeout) {
    clearTimeout(loopPlaybackTimeout);
    loopPlaybackTimeout = null;
  }
  
  if (currentlyPlaying) {
    currentlyPlaying.stop();
    currentlyPlaying = null;
  }
  
  state.status = 'ready';
  updateLoopButtonUI();
  updateUI();
  
  console.log('Loop playback stopped');
}

function playNextInLoop() {
  if (!isLoopPlaying) return;
  
  // Find next valid buffer starting from current index
  let attempts = 0;
  while (!iterationBuffers[loopPlaybackIndex] && attempts <= maxAvailableIteration) {
    loopPlaybackIndex++;
    if (loopPlaybackIndex > maxAvailableIteration) {
      loopPlaybackIndex = 0;
    }
    attempts++;
  }
  
  let buffer = iterationBuffers[loopPlaybackIndex];
  if (!buffer) {
    console.log('No valid buffer found, stopping loop');
    stopLoopPlayback();
    return;
  }
  
  // Update display to show current playing iteration
  state.currentIteration = loopPlaybackIndex;
  updateTimeline();
  
  // Stop any currently playing audio
  if (currentlyPlaying && currentlyPlaying._source) {
    try {
      currentlyPlaying._source.onended = null; // Remove old handler
      currentlyPlaying.stop();
    } catch(e) {}
  }
  
  currentlyPlaying = buffer;
  
  // Create new audio source for loop playback
  const actx = getAudioContext();
  const source = actx.createBufferSource();
  source.buffer = buffer.buffer;
  source.connect(actx.destination);
  source.connect(fft.analyser);
  
  // Store reference
  buffer._source = source;
  buffer._playing = true;
  
  // Handle when this iteration finishes
  source.onended = () => {
    buffer._playing = false;
    
    if (isLoopPlaying) {
      // Move to next iteration
      let nextIndex = loopPlaybackIndex + 1;
      
      // Loop back to beginning if we've reached the end
      if (nextIndex > maxAvailableIteration) {
        nextIndex = 0;
        console.log('Loop: Restarting from beginning');
      }
      
      loopPlaybackIndex = nextIndex;
      
      // Small gap between iterations for clarity
      loopPlaybackTimeout = setTimeout(playNextInLoop, 300);
    } else {
      currentlyPlaying = null;
      state.status = 'ready';
      updateUI();
    }
  };
  
  // Start playback
  source.start();
  
  console.log('Loop: Playing iteration', loopPlaybackIndex, '/', maxAvailableIteration);
}

function updateLoopButtonUI() {
  if (btnLoopPlay) {
    if (isLoopPlaying) {
      btnLoopPlay.html('⏹ Stop Loop');
      btnLoopPlay.addClass('btn-danger');
      btnLoopPlay.removeClass('btn');
    } else {
      btnLoopPlay.html('🔁 Play All Loop');
      btnLoopPlay.removeClass('btn-danger');
      btnLoopPlay.addClass('btn');
    }
  }
}

// ============================================
// REAL-TIME PROCESSING MODE
// ============================================

let btnRealtimeMode;

function toggleRealtimeMode() {
  if (state.realtimeMode) {
    stopRealtimeMode();
  } else {
    startRealtimeMode();
  }
}

function startRealtimeMode() {
  if (!iterationBuffers[0]) {
    alert('Record something first before using real-time mode!');
    return;
  }
  
  // Stop any current playback
  if (isLoopPlaying) {
    stopLoopPlayback();
  }
  if (currentlyPlaying) {
    currentlyPlaying.stop();
    currentlyPlaying = null;
  }
  
  state.realtimeMode = true;
  updateRealtimeButtonUI();
  
  // Start real-time loop
  startRealtimeLoop();
  
  console.log('Real-time mode started');
}

function stopRealtimeMode() {
  state.realtimeMode = false;
  
  // Stop the real-time loop
  stopRealtimeLoop();
  
  updateRealtimeButtonUI();
  state.status = 'ready';
  updateUI();
  
  console.log('Real-time mode stopped');
}

function startRealtimeLoop() {
  if (!state.realtimeMode) return;
  
  // Get the original recording buffer
  let buffer = iterationBuffers[0];
  if (!buffer || !buffer.buffer) {
    stopRealtimeMode();
    return;
  }
  
  state.status = 'playing';
  updateUI();
  
  playWithRealtimeEffects(buffer.buffer);
}

function playWithRealtimeEffects(audioBuffer) {
  if (!state.realtimeMode) return;
  
  const actx = getAudioContext();
  
  // Create source
  realtimeSource = actx.createBufferSource();
  realtimeSource.buffer = audioBuffer;
  
  // Create effect chain
  rebuildRealtimeEffectChain(actx, realtimeSource);
  
  // When playback ends, restart (loop)
  realtimeSource.onended = () => {
    if (state.realtimeMode) {
      // Small gap before restarting
      setTimeout(() => {
        if (state.realtimeMode) {
          playWithRealtimeEffects(audioBuffer);
        }
      }, 100);
    } else {
      state.status = 'ready';
      updateUI();
    }
  };
  
  realtimeSource.start();
  console.log('Real-time: Playing with effects - Q:', state.filterQ, 'Wet:', state.dryWetMix);
}

function rebuildRealtimeEffectChain(actx, source) {
  // Dry path
  realtimeDryGain = actx.createGain();
  realtimeDryGain.gain.value = 1.0 - state.dryWetMix;
  
  // Wet path with filters
  realtimeWetGain = actx.createGain();
  realtimeWetGain.gain.value = state.dryWetMix;
  
  // Create filter chain
  let boostDB = map(state.filterQ, 5, 100, 6, 24);
  realtimeFilters = [];
  
  let currentNode = source;
  for (let i = 0; i < roomResonances.length; i++) {
    let freq = roomResonances[i];
    let filter = actx.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = freq;
    filter.Q.value = state.filterQ / 5;
    filter.gain.value = boostDB;
    realtimeFilters.push(filter);
    
    currentNode.connect(filter);
    currentNode = filter;
  }
  
  // Air absorption filter
  let airAbsorption = actx.createBiquadFilter();
  airAbsorption.type = 'lowpass';
  airAbsorption.frequency.value = 8000 + (1 - state.dryWetMix) * 8000;
  airAbsorption.Q.value = 0.7;
  currentNode.connect(airAbsorption);
  
  // Connect to wet gain
  airAbsorption.connect(realtimeWetGain);
  
  // Dry path
  source.connect(realtimeDryGain);
  
  // Master output
  realtimeMasterGain = actx.createGain();
  realtimeMasterGain.gain.value = state.feedbackGain;
  
  realtimeDryGain.connect(realtimeMasterGain);
  realtimeWetGain.connect(realtimeMasterGain);
  
  // Limiter
  realtimeLimiter = actx.createDynamicsCompressor();
  realtimeLimiter.threshold.value = -6;
  realtimeLimiter.knee.value = 6;
  realtimeLimiter.ratio.value = 12;
  realtimeLimiter.attack.value = 0.001;
  realtimeLimiter.release.value = 0.1;
  
  realtimeMasterGain.connect(realtimeLimiter);
  realtimeLimiter.connect(actx.destination);
  realtimeLimiter.connect(fft.analyser);
}

function stopRealtimeLoop() {
  if (realtimeSource) {
    try {
      realtimeSource.onended = null;
      realtimeSource.stop();
    } catch(e) {}
    realtimeSource = null;
  }
  
  realtimeFilters = [];
  realtimeDryGain = null;
  realtimeWetGain = null;
  realtimeMasterGain = null;
  realtimeLimiter = null;
}

function updateRealtimeButtonUI() {
  if (btnRealtimeMode) {
    if (state.realtimeMode) {
      btnRealtimeMode.html('⏹ Stop Real-time');
      btnRealtimeMode.addClass('btn-danger');
      btnRealtimeMode.removeClass('btn');
    } else {
      btnRealtimeMode.html('🔴 Real-time Mode');
      btnRealtimeMode.removeClass('btn-danger');
      btnRealtimeMode.addClass('btn');
    }
  }
}

// ============================================
// RANDOM PROCESSING - Process with randomized parameters
// ============================================

function startRandomProcessing() {
  if (!iterationBuffers[0]) {
    alert('Record something first before processing!');
    return;
  }
  
  if (isRandomProcessing) {
    // Stop random processing
    isRandomProcessing = false;
    state.isAutoProcessing = false;
    updateRandomButtonUI();
    updateUI();
    return;
  }
  
  isRandomProcessing = true;
  randomProcessingLog = [];
  state.isAutoProcessing = true;
  updateRandomButtonUI();
  
  console.log('Starting random parameter processing...');
  processIterationWithRandomParams();
}

function processIterationWithRandomParams() {
  if (!isRandomProcessing) {
    updateRandomButtonUI();
    updateUI();
    return;
  }
  
  if (state.currentIteration >= state.maxIterations - 1) {
    isRandomProcessing = false;
    state.isAutoProcessing = false;
    updateRandomButtonUI();
    updateUI();
    console.log('Random processing complete!');
    console.log('Parameters used:', randomProcessingLog);
    return;
  }
  
  if (!iterationBuffers[state.currentIteration]) {
    isRandomProcessing = false;
    state.isAutoProcessing = false;
    updateRandomButtonUI();
    updateUI();
    return;
  }
  
  // Randomize parameters
  let randomParams = randomizeParameters();
  
  // Apply random parameters
  state.filterQ = randomParams.filterQ;
  state.dryWetMix = randomParams.dryWetMix;
  state.feedbackGain = randomParams.feedbackGain;
  state.useConvolver = randomParams.useConvolver;
  
  // Randomly change room preset sometimes
  if (randomParams.changeRoom) {
    let presetKeys = Object.keys(roomPresets);
    let randomPreset = presetKeys[Math.floor(Math.random() * presetKeys.length)];
    roomResonances = [...roomPresets[randomPreset].freqs];
    randomParams.roomPreset = randomPreset;
  }
  
  // Randomly change IR type if convolver is enabled
  if (state.useConvolver) {
    let irTypes = ['synthetic_small', 'synthetic_large', 'synthetic_plate'];
    currentIR = irTypes[Math.floor(Math.random() * irTypes.length)];
    randomParams.irType = currentIR;
  }
  
  // Log parameters
  randomProcessingLog.push({
    iteration: state.currentIteration + 1,
    ...randomParams
  });
  
  // Update UI sliders to reflect new values
  updateSlidersFromState();
  
  console.log(`Iteration ${state.currentIteration + 1} params:`, randomParams);
  
  // Process
  state.status = 'processing';
  updateUI();
  
  processAudioOffline(iterationBuffers[state.currentIteration]).then(processed => {
    state.currentIteration++;
    iterationBuffers[state.currentIteration] = processed;
    captureBufferSpectrum(processed.buffer, state.currentIteration);
    state.status = 'ready';
    updateUI();
    updateTimeline();
    
    if (isRandomProcessing && state.currentIteration < state.maxIterations - 1) {
      setTimeout(processIterationWithRandomParams, 500);
    } else {
      isRandomProcessing = false;
      state.isAutoProcessing = false;
      updateRandomButtonUI();
      updateUI();
    }
  }).catch(err => {
    console.error(err);
    isRandomProcessing = false;
    state.isAutoProcessing = false;
    state.status = 'ready';
    updateRandomButtonUI();
    updateUI();
  });
}

function randomizeParameters() {
  return {
    filterQ: Math.floor(Math.random() * 80) + 20,           // 20-100
    dryWetMix: Math.random() * 0.5 + 0.5,                   // 0.5-1.0 (50-100%)
    feedbackGain: Math.random() * 0.3 + 0.7,                // 0.7-1.0 (70-100%)
    useConvolver: Math.random() > 0.5,                       // 50% chance
    changeRoom: Math.random() > 0.7                          // 30% chance to change room
  };
}

function updateSlidersFromState() {
  if (sliderQ) {
    sliderQ.value(state.filterQ);
    let qVal = select('#q-val');
    if (qVal) qVal.html(state.filterQ);
  }
  if (sliderMix) {
    sliderMix.value(Math.round(state.dryWetMix * 100));
    let mixVal = select('#mix-val');
    if (mixVal) mixVal.html(Math.round(state.dryWetMix * 100) + '%');
  }
  if (sliderFeedback) {
    sliderFeedback.value(Math.round(state.feedbackGain * 100));
    let fbVal = select('#fb-val');
    if (fbVal) fbVal.html(Math.round(state.feedbackGain * 100) + '%');
  }
  if (chkConvolver) {
    chkConvolver.checked(state.useConvolver);
  }
}

function updateRandomButtonUI() {
  if (btnRandomProcess) {
    if (isRandomProcessing) {
      btnRandomProcess.html('⏹ Stop Random');
      btnRandomProcess.addClass('btn-danger');
      btnRandomProcess.removeClass('btn');
    } else {
      btnRandomProcess.html('🎲 Random Process');
      btnRandomProcess.removeClass('btn-danger');
      btnRandomProcess.addClass('btn');
    }
  }
}

// ============================================
// EXPORT
// ============================================

function audioBufferToWav(buffer) {
  let numCh = buffer.numberOfChannels;
  let sr = buffer.sampleRate;
  let bitDepth = 16;
  let bytesPerSample = bitDepth / 8;
  let blockAlign = numCh * bytesPerSample;
  
  let data = buffer.getChannelData(0);
  let dataLen = data.length * bytesPerSample;
  let totalLen = 44 + dataLen;
  
  let ab = new ArrayBuffer(totalLen);
  let view = new DataView(ab);
  
  function writeStr(offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }
  
  writeStr(0, 'RIFF');
  view.setUint32(4, totalLen - 8, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeStr(36, 'data');
  view.setUint32(40, dataLen, true);
  
  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    let s = max(-1, min(1, data[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(offset, s, true);
    offset += 2;
  }
  
  return new Blob([ab], { type: 'audio/wav' });
}

function downloadBlob(blob, name) {
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportCurrent() {
  let buf = iterationBuffers[state.currentIteration];
  if (!buf || !buf.buffer) { alert('No audio'); return; }
  downloadBlob(audioBufferToWav(buf.buffer), 'iteration_' + state.currentIteration + '.wav');
}

async function exportAll() {
  if (typeof JSZip === 'undefined') { alert('JSZip not loaded'); return; }
  let zip = new JSZip();
  for (let i = 0; i <= state.currentIteration; i++) {
    let buf = iterationBuffers[i];
    if (buf && buf.buffer) {
      zip.file('iteration_' + String(i).padStart(2, '0') + '.wav', audioBufferToWav(buf.buffer));
    }
  }
  let blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, 'i_am_sitting_in_a_room.zip');
}

async function exportSequence() {
  let totalLen = 0, sr = 44100, buffers = [];
  for (let i = 0; i <= state.currentIteration; i++) {
    let buf = iterationBuffers[i];
    if (buf && buf.buffer) {
      totalLen += buf.buffer.length;
      sr = buf.buffer.sampleRate;
      buffers.push(buf.buffer);
    }
  }
  if (!buffers.length) { alert('No audio'); return; }
  
  let gap = sr * 1;
  totalLen += gap * (buffers.length - 1);
  
  let ctx = new OfflineAudioContext(1, totalLen, sr);
  let combined = ctx.createBuffer(1, totalLen, sr);
  let ch = combined.getChannelData(0);
  let offset = 0;
  for (let b of buffers) {
    ch.set(b.getChannelData(0), offset);
    offset += b.length + gap;
  }
  downloadBlob(audioBufferToWav(combined), 'full_sequence.wav');
}

function exportSpectrogram() {
  saveCanvas('spectrogram', 'png');
}

// ============================================
// UI CREATION
// ============================================

function createControlPanel() {
  controlPanel = createDiv('').addClass('control-panel visible');
  
  // Title
  createElement('h2', '🎵 I Am Sitting in a Room').parent(controlPanel);
  
  // Status
  let statusDiv = createDiv('').addClass('status-display').parent(controlPanel);
  createDiv('<span class="label">Status</span><span class="value ready" id="status-val">Ready</span>')
    .addClass('status-row').parent(statusDiv);
  createDiv('<span class="label">Iteration</span><span class="value" id="iter-val">0 / 12</span>')
    .addClass('status-row').parent(statusDiv);
  createDiv('<span class="label">Duration</span><span class="value" id="dur-val">--:--</span>')
    .addClass('status-row').parent(statusDiv);
  
  // Recording Buttons
  createElement('h3', 'Recording').parent(controlPanel);
  btnRecord = createButton('🎤 Start Recording').addClass('btn btn-primary').parent(controlPanel);
  btnRecord.mousePressed(toggleRecording);
  
  // Language selector for speech recognition
  let langDiv = createDiv('').addClass('toggle-group').parent(controlPanel);
  createElement('label', 'Speech Language:').parent(langDiv);
  let selectLang = createSelect().addClass('lang-select').parent(controlPanel);
  selectLang.option('Português (BR)', 'pt-BR');
  selectLang.option('English (US)', 'en-US');
  selectLang.option('Español', 'es-ES');
  selectLang.option('Français', 'fr-FR');
  selectLang.option('Deutsch', 'de-DE');
  selectLang.option('Italiano', 'it-IT');
  selectLang.selected('pt-BR');
  selectLang.changed(() => {
    setRecognitionLanguage(selectLang.value());
  });
  
  btnIterate = createButton('🔄 Process Iteration').addClass('btn').parent(controlPanel);
  btnIterate.mousePressed(processIteration);
  
  btnAuto = createButton('⏩ Auto Process All').addClass('btn').parent(controlPanel);
  btnAuto.mousePressed(() => { state.isAutoProcessing = true; processIteration(); });
  
  // Random processing button
  btnRandomProcess = createButton('🎲 Random Process').addClass('btn').parent(controlPanel);
  btnRandomProcess.mousePressed(startRandomProcessing);
  btnRandomProcess.attribute('title', 'Process all iterations with randomized parameters');
  
  btnPlay = createButton('▶ Play Current').addClass('btn').parent(controlPanel);
  btnPlay.mousePressed(() => {
    if (state.status === 'playing') stopPlayback();
    else playIteration(state.currentIteration);
  });
  
  // Loop playback button
  btnLoopPlay = createButton('🔁 Play All Loop').addClass('btn').parent(controlPanel);
  btnLoopPlay.mousePressed(toggleLoopPlayback);
  btnLoopPlay.attribute('title', 'Play all iterations in a continuous loop');
  
  // Real-time mode button
  btnRealtimeMode = createButton('🔴 Real-time Mode').addClass('btn').parent(controlPanel);
  btnRealtimeMode.mousePressed(toggleRealtimeMode);
  btnRealtimeMode.attribute('title', 'Play original recording in loop with real-time effect control');
  
  btnReset = createButton('🗑 Reset All').addClass('btn btn-danger').parent(controlPanel);
  btnReset.mousePressed(() => {
    if (confirm('Reset all?')) resetAll();
  });
  
  btnCompare = createButton('📊 Compare Spectra').addClass('btn').parent(controlPanel);
  btnCompare.mousePressed(() => {
    state.showComparison = !state.showComparison;
  });
  
  // Analysis toggle
  let analysisDiv = createDiv('').addClass('toggle-group').parent(controlPanel);
  let chkAnalysis = createCheckbox('Show Spectral Analysis', true).parent(analysisDiv);
  chkAnalysis.changed(() => { state.showAnalysis = chkAnalysis.checked(); });
  
  // Transcription toggle
  let transcriptDiv = createDiv('').addClass('toggle-group').parent(controlPanel);
  let chkTranscription = createCheckbox('Show Transcription', true).parent(transcriptDiv);
  chkTranscription.changed(() => { state.showTranscription = chkTranscription.checked(); });
  
  // Settings
  createElement('h3', 'Settings').parent(controlPanel);
  
  let iterDiv = createDiv('').addClass('slider-group').parent(controlPanel);
  createElement('label', 'Max Iterations <span id="maxiter-val">12</span>').parent(iterDiv);
  sliderIterations = createSlider(4, 32, 12, 1).parent(iterDiv);
  sliderIterations.input(() => {
    state.maxIterations = sliderIterations.value();
    select('#maxiter-val').html(state.maxIterations);
    updateTimeline();
  });
  
  let qDiv = createDiv('').addClass('slider-group').parent(controlPanel);
  createElement('label', 'Filter Q <span id="q-val">30</span>').parent(qDiv);
  sliderQ = createSlider(5, 100, 30, 1).parent(qDiv);
  sliderQ.input(() => {
    state.filterQ = sliderQ.value();
    select('#q-val').html(state.filterQ);
  });
  
  let mixDiv = createDiv('').addClass('slider-group').parent(controlPanel);
  createElement('label', 'Dry/Wet <span id="mix-val">70%</span>').parent(mixDiv);
  sliderMix = createSlider(0, 100, 70, 1).parent(mixDiv);
  sliderMix.input(() => {
    state.dryWetMix = sliderMix.value() / 100;
    select('#mix-val').html(sliderMix.value() + '%');
  });
  
  let fbDiv = createDiv('').addClass('slider-group').parent(controlPanel);
  createElement('label', 'Feedback <span id="fb-val">95%</span>').parent(fbDiv);
  sliderFeedback = createSlider(50, 100, 95, 1).parent(fbDiv);
  sliderFeedback.input(() => {
    state.feedbackGain = sliderFeedback.value() / 100;
    select('#fb-val').html(sliderFeedback.value() + '%');
  });
  
  // Convolver
  createElement('h3', 'Impulse Response').parent(controlPanel);
  let convDiv = createDiv('').addClass('toggle-group').parent(controlPanel);
  chkConvolver = createCheckbox('Enable Convolution', false).parent(convDiv);
  chkConvolver.changed(() => { state.useConvolver = chkConvolver.checked(); });
  
  selectIR = createSelect().parent(controlPanel);
  selectIR.option('None', 'none');
  selectIR.option('Small Room IR', 'synthetic_small');
  selectIR.option('Large Hall IR', 'synthetic_large');
  selectIR.option('Plate Reverb', 'synthetic_plate');
  selectIR.changed(() => { currentIR = selectIR.value(); });
  
  // Room Resonances
  createElement('h3', 'Room Resonances (Hz)').parent(controlPanel);
  let presetDiv = createDiv('').addClass('preset-btns').parent(controlPanel);
  for (let key in roomPresets) {
    let btn = createButton(roomPresets[key].name).addClass('preset-btn').parent(presetDiv);
    if (key === 'small') btn.addClass('active');
    btn.mousePressed(() => {
      currentPreset = key;
      roomResonances = [...roomPresets[key].freqs];
      updateFreqInputs();
      selectAll('.preset-btn').forEach(b => b.removeClass('active'));
      btn.addClass('active');
    });
    presetButtons.push(btn);
  }
  
  let freqDiv = createDiv('').addClass('freq-grid').parent(controlPanel);
  for (let i = 0; i < 8; i++) {
    let inp = createInput(String(roomResonances[i]), 'number').addClass('freq-input').parent(freqDiv);
    inp.attribute('min', 20);
    inp.attribute('max', 20000);
    inp.input(() => {
      roomResonances[i] = int(inp.value());
      currentPreset = 'custom';
      selectAll('.preset-btn').forEach(b => b.removeClass('active'));
    });
    freqInputs.push(inp);
  }
  
  // Timeline
  createElement('h3', 'Timeline').parent(controlPanel);
  createDiv('').id('timeline').addClass('timeline').parent(controlPanel);
  
  // Export
  createElement('h3', 'Export').parent(controlPanel);
  let expDiv = createDiv('').addClass('export-btns').parent(controlPanel);
  exportBtns.current = createButton('Current WAV').addClass('export-btn').parent(expDiv);
  exportBtns.current.mousePressed(exportCurrent);
  exportBtns.all = createButton('All ZIP').addClass('export-btn').parent(expDiv);
  exportBtns.all.mousePressed(exportAll);
  exportBtns.seq = createButton('Sequence').addClass('export-btn').parent(expDiv);
  exportBtns.seq.mousePressed(exportSequence);
  exportBtns.img = createButton('Image').addClass('export-btn').parent(expDiv);
  exportBtns.img.mousePressed(exportSpectrogram);
  
  // Info button
  btnInfo = createButton('ℹ️ About').addClass('btn').parent(controlPanel);
  btnInfo.mousePressed(() => {
    state.showInfo = !state.showInfo;
    if (state.showInfo) infoPanel.addClass('visible');
    else infoPanel.removeClass('visible');
  });
  
  updateTimeline();
}

function createInfoPanel() {
  infoPanel = createDiv('').addClass('info-panel');
  
  let closeBtn = createButton('×').addClass('close-btn').parent(infoPanel);
  closeBtn.mousePressed(() => {
    state.showInfo = false;
    infoPanel.removeClass('visible');
  });
  
  // Language tabs
  let tabsDiv = createDiv('').addClass('lang-tabs').parent(infoPanel);
  let tabEN = createButton('English').addClass('lang-tab active').parent(tabsDiv);
  let tabPT = createButton('Português').addClass('lang-tab').parent(tabsDiv);
  
  // English Content
  let contentEN = createDiv('').addClass('lang-content active').id('content-en').parent(infoPanel);
  
  createElement('h2', '🎵 Welcome to "I Am Sitting in a Room"').parent(contentEN);
  
  createElement('p', 'This interactive application reimagines <strong>Alvin Lucier\'s</strong> seminal 1969 sound art piece for the digital age. Experience the gradual transformation from intelligible speech to pure acoustic resonance through an iterative feedback process.').parent(contentEN);
  
  createElement('h3', '🎼 About the Original Work').parent(contentEN);
  
  createElement('p', '<strong>Alvin Lucier</strong> (1931–2021) was an American experimental composer and sound artist. A long-time professor at Wesleyan University, Lucier was a member of the influential Sonic Arts Union. His work explored psychoacoustic phenomena and the physical properties of sound. "I Am Sitting in a Room" remains one of the most influential works in sound art history.').parent(contentEN);
  
  createDiv('"I am sitting in a room different from the one you are in now. I am recording the sound of my speaking voice and I am going to play it back into the room again and again until the resonant frequencies of the room reinforce themselves so that any semblance of my speech, with perhaps the exception of rhythm, is destroyed. What you will hear, then, are the natural resonant frequencies of the room articulated by speech. I regard this activity not so much as a demonstration of a physical fact, but more as a way to smooth out any irregularities my speech might have."<br><em>— Alvin Lucier, opening text of the piece</em>').addClass('quote').parent(contentEN);
  
  createElement('p', 'The piece was first created at Brandeis University in 1969 and premiered at the Guggenheim Museum in 1970. Lucier, who had a stutter, saw this work as a way to transform his speech impediment into pure musical resonance.').parent(contentEN);
  
  createElement('h3', '📖 QUICK START TUTORIAL').parent(contentEN);
  
  createDiv('<strong>Step 1: Record your voice</strong><br>Click "🎤 Start Recording" and speak clearly. Say something like the original text, or any phrase. Click "⏹ Stop Recording" when done.').addClass('tutorial-step').parent(contentEN);
  
  createDiv('<strong>Step 2: Process Iteration</strong><br>Click "🔄 Process Iteration". This applies the room\'s resonant filters to your recording. The sound should become slightly more "colored" by the room frequencies.').addClass('tutorial-step').parent(contentEN);
  
  createDiv('<strong>Step 3: Listen to changes</strong><br>Click "▶ Play Current" to hear the processed version. Use the Timeline at the bottom to switch between iterations (click on numbered boxes).').addClass('tutorial-step').parent(contentEN);
  
  createDiv('<strong>Step 4: Repeat processing</strong><br>Click "🔄 Process Iteration" again. Each time, the room resonances become MORE dominant and speech becomes LESS intelligible. After 5-8 iterations, you should hear tonal "singing" instead of words.').addClass('tutorial-step').parent(contentEN);
  
  createDiv('<strong>Step 5: Compare results</strong><br>Click "📊 Compare Spectra" to see how the frequency content changed across iterations visually.').addClass('tutorial-step').parent(contentEN);
  
  createElement('h3', '🎚️ EFFECT PARAMETERS EXPLAINED').parent(contentEN);
  
  createElement('p', '<strong>Filter Q (5-100):</strong> Controls how "sharp" the resonances are. LOW Q (5-20) = subtle, natural coloring. HIGH Q (50-100) = dramatic, ringing resonances that transform speech faster.').parent(contentEN);
  
  createElement('p', '<strong>Dry/Wet (0-100%):</strong> Balance between original (dry) and processed (wet) signal. 0% = no effect. 100% = fully processed. Try 70-90% for noticeable changes.').parent(contentEN);
  
  createElement('p', '<strong>Feedback (50-100%):</strong> Overall gain applied to the processed signal. Higher = louder output, more aggressive transformation.').parent(contentEN);
  
  createElement('p', '<strong>Enable Convolution:</strong> Adds realistic room reverb using Impulse Response simulation. Combines with resonant filters for more natural room sound.').parent(contentEN);
  
  createElement('p', '<strong>Room Presets:</strong> Different virtual spaces with unique resonant frequencies. "Small" has higher frequencies (brighter), "Cathedral" has very low frequencies (deeper, slower transformation).').parent(contentEN);
  
  createElement('h3', '💡 TIPS FOR BEST RESULTS').parent(contentEN);
  
  createElement('p', '• Use <strong>higher Q values (50-80)</strong> to hear more dramatic changes<br>• Set <strong>Dry/Wet to 80-100%</strong> for maximum effect<br>• Try <strong>Cathedral preset</strong> for deep, drone-like results<br>• Process <strong>8-12 iterations</strong> to reach full modal phase<br>• <strong>Enable Convolution</strong> with "Large Hall IR" for realistic reverb').parent(contentEN);
  
  createElement('h3', '🎛️ How to Use This Application').parent(contentEN);
  
  createElement('p', '<strong>🎤 Record Voice:</strong> Click to start recording. Speak naturally—any text will work. The original piece uses the text above, but you can speak anything you like.').parent(contentEN);
  
  createElement('p', '<strong>🔄 Process Iteration:</strong> Apply the virtual room\'s resonant filters to the current recording. Each iteration emphasizes the room\'s natural frequencies while gradually dissolving speech intelligibility.').parent(contentEN);
  
  createElement('p', '<strong>⏩ Auto Process All:</strong> Automatically process all remaining iterations in sequence. Watch (and hear) the transformation unfold.').parent(contentEN);
  
  createElement('p', '<strong>📊 Compare Spectra:</strong> View spectral analysis of multiple iterations side by side to visualize the transformation from speech to resonance.').parent(contentEN);
  
  createElement('p', '<strong>🏠 Room Presets:</strong> Choose different virtual acoustic spaces—each with unique resonant characteristics that will color your transformation differently.').parent(contentEN);
  
  createElement('h3', '🔬 The Transformation Process').parent(contentEN);
  
  createElement('p', 'Each iteration applies a bank of resonant (bandpass) filters simulating the room\'s natural acoustic modes. As iterations progress:').parent(contentEN);
  
  createElement('p', '• Frequencies matching the room\'s resonances are <strong>amplified</strong><br>• Other frequencies gradually <strong>attenuate</strong><br>• Speech intelligibility <strong>decreases</strong><br>• Pure tonal content <strong>emerges</strong>').parent(contentEN);
  
  createElement('p', 'This shift from "intelligibility to musicality" represents a transition from <strong>cognitive listening</strong> (understanding words) to <strong>sensorial listening</strong> (experiencing sound as texture and tone).').parent(contentEN);
  
  createElement('h3', '📈 The Three Phases of Transformation').parent(contentEN);
  
  createElement('p', '<strong>🔊 SPEECH PHASE:</strong> Semantic content is clear. You hear voice formants and room coloration as "normal" reverberation. High spectral bandwidth, distributed energy.').parent(contentEN);
  
  createElement('p', '<strong>🔀 HYBRID PHASE:</strong> Intelligibility decays. Certain frequencies (room modes) gain sustentation and beatings emerge. Prosodic rhythm contours persist as "ghost" patterns.').parent(contentEN);
  
  createElement('p', '<strong>🎵 MODAL PHASE:</strong> Speech disappears. We hear harmonic/quasi-sinusoidal fields (modal peaks) with slow pulsation (beatings between nearby modes). The piece ends when the system "saturates" at these peaks.').parent(contentEN);
  
  createElement('h3', '🧮 The Mathematics: H(f)ⁿ · X(f)').parent(contentEN);
  
  createElement('p', 'If the room has frequency response <strong>H(f)</strong> and your first recording has spectrum <strong>X(f)</strong>, then after <strong>n</strong> iterations the result tends toward <strong>H(f)ⁿ · X(f)</strong>.').parent(contentEN);
  
  createElement('p', 'Since |H(f)| > 1 at resonant peaks (in relative gain terms), these peaks dominate exponentially. This is why at the end we hear "the room playing itself."').parent(contentEN);
  
  createElement('h3', '🎭 Compositional Processes').parent(contentEN);
  
  createElement('p', 'This work exemplifies key concepts in contemporary composition and sound art:').parent(contentEN);
  
  createElement('p', '• <strong>Process as Form:</strong> There is no theme to develop; there is a process that we hear operating<br>• <strong>Space as Instrument:</strong> The work transfers "musical content" from text to architecture<br>• <strong>Emergence:</strong> The final result emerges from system properties, not direct control<br>• <strong>Poetics:</strong> The phrase about "smoothing irregularities" (Lucier had a stutter) links body and space—the room "normalizes" the voice but, in doing so, erases language').parent(contentEN);
  
  createElement('h3', '🏛️ Room Presets Explained').parent(contentEN);
  
  createElement('p', '• <strong>Small Room:</strong> Higher, tighter resonances typical of domestic spaces (~20m²)<br>• <strong>Large Hall:</strong> Lower, more spread resonances of concert halls (~500m²)<br>• <strong>Bathroom:</strong> Strong mid-frequency reflections characteristic of tiled surfaces<br>• <strong>Stairwell:</strong> Vertical resonant space with harmonic relationships<br>• <strong>Cathedral:</strong> Very low resonances with long decay times').parent(contentEN);
  
  createElement('h3', '⌨️ Keyboard Shortcuts').parent(contentEN);
  
  createElement('p', '<strong>Space</strong> — Play/Stop (also stops loop and real-time mode)<br><strong>R</strong> — Start/Stop recording<br><strong>I</strong> — Process next iteration<br><strong>L</strong> — Toggle loop playback<br><strong>E</strong> — Toggle real-time mode<br><strong>X</strong> — Start/Stop random processing<br><strong>T</strong> — Toggle transcription panel<br><strong>H</strong> — Hide/Show control panel<br><strong>← →</strong> — Navigate between iterations').parent(contentEN);
  
  createElement('h3', '🔴 Real-time Mode').parent(contentEN);
  
  createElement('p', '<strong>Real-time Mode</strong> plays your original recording in a continuous loop while allowing you to adjust effect parameters and hear the changes instantly. This is perfect for:').parent(contentEN);
  
  createElement('p', '• <strong>Exploring resonances:</strong> Adjust Filter Q and hear how different settings affect the sound<br>• <strong>Finding sweet spots:</strong> Tweak Dry/Wet balance in real-time<br>• <strong>Comparing room presets:</strong> Switch between rooms and hear the difference immediately<br>• <strong>Live performance:</strong> Use as a live processing tool for sound art performances').parent(contentEN);
  
  createElement('h3', '💾 Export Options').parent(contentEN);
  
  createElement('p', '• <strong>Current WAV:</strong> Export the currently selected iteration<br>• <strong>All ZIP:</strong> Download all iterations as a ZIP archive<br>• <strong>Sequence:</strong> Single WAV file with all iterations concatenated<br>• <strong>Image:</strong> PNG screenshot of the current visualization').parent(contentEN);
  
  createElement('h3', '🔗 Learn More').parent(contentEN);
  
  createElement('p', '• <a href="https://en.wikipedia.org/wiki/I_Am_Sitting_in_a_Room" target="_blank">I Am Sitting in a Room (Wikipedia)</a><br>• <a href="https://en.wikipedia.org/wiki/Alvin_Lucier" target="_blank">Alvin Lucier (Wikipedia)</a><br>• <a href="https://www.youtube.com/watch?v=fAxHlLK3Oyk" target="_blank">Original Recording (YouTube)</a>').parent(contentEN);
  
  // Portuguese Content
  let contentPT = createDiv('').addClass('lang-content').id('content-pt').parent(infoPanel);
  
  createElement('h2', '🎵 Bem-vindo ao "I Am Sitting in a Room"').parent(contentPT);
  
  createElement('p', 'Esta aplicação interativa reimagina a seminal obra de arte sonora de <strong>Alvin Lucier</strong> de 1969 para a era digital. Experimente a transformação gradual da fala inteligível para a pura ressonância acústica através de um processo iterativo de feedback.').parent(contentPT);
  
  createElement('h3', '🎼 Sobre a Obra Original').parent(contentPT);
  
  createElement('p', '<strong>Alvin Lucier</strong> (1931–2021) foi um compositor experimental e artista sonoro americano. Professor por muitos anos na Wesleyan University, Lucier foi membro da influente Sonic Arts Union. Seu trabalho explorava fenômenos psicoacústicos e as propriedades físicas do som. "I Am Sitting in a Room" permanece como uma das obras mais influentes na história da arte sonora.').parent(contentPT);
  
  createDiv('"Estou sentado em uma sala diferente daquela em que você está agora. Estou gravando o som da minha voz falada e vou reproduzi-la na sala repetidamente até que as frequências ressonantes da sala se reforcem de tal modo que qualquer semelhança com minha fala, com talvez a exceção do ritmo, seja destruída. O que você ouvirá, então, são as frequências ressonantes naturais da sala articuladas pela fala. Eu considero esta atividade não tanto como uma demonstração de um fato físico, mas mais como uma maneira de suavizar quaisquer irregularidades que minha fala possa ter."<br><em>— Alvin Lucier, texto de abertura da peça (tradução)</em>').addClass('quote').parent(contentPT);
  
  createElement('p', 'A peça foi criada pela primeira vez na Brandeis University em 1969 e estreou no Guggenheim Museum em 1970. Lucier, que tinha gagueira, via este trabalho como uma forma de transformar seu impedimento de fala em pura ressonância musical.').parent(contentPT);
  
  createElement('h3', '📖 TUTORIAL RÁPIDO').parent(contentPT);
  
  createDiv('<strong>Passo 1: Grave sua voz</strong><br>Clique em "🎤 Start Recording" e fale claramente. Diga algo como o texto original, ou qualquer frase. Clique em "⏹ Stop Recording" quando terminar.').addClass('tutorial-step').parent(contentPT);
  
  createDiv('<strong>Passo 2: Processar Iteração</strong><br>Clique em "🔄 Process Iteration". Isso aplica os filtros ressonantes da sala à sua gravação. O som deve ficar ligeiramente mais "colorido" pelas frequências da sala.').addClass('tutorial-step').parent(contentPT);
  
  createDiv('<strong>Passo 3: Ouça as mudanças</strong><br>Clique em "▶ Play Current" para ouvir a versão processada. Use a Timeline na parte inferior para alternar entre iterações (clique nas caixas numeradas).').addClass('tutorial-step').parent(contentPT);
  
  createDiv('<strong>Passo 4: Repita o processamento</strong><br>Clique em "🔄 Process Iteration" novamente. A cada vez, as ressonâncias da sala se tornam MAIS dominantes e a fala se torna MENOS inteligível. Após 5-8 iterações, você deve ouvir tons "cantando" em vez de palavras.').addClass('tutorial-step').parent(contentPT);
  
  createDiv('<strong>Passo 5: Compare resultados</strong><br>Clique em "📊 Compare Spectra" para ver visualmente como o conteúdo de frequência mudou ao longo das iterações.').addClass('tutorial-step').parent(contentPT);
  
  createElement('h3', '🎚️ PARÂMETROS DE EFEITO EXPLICADOS').parent(contentPT);
  
  createElement('p', '<strong>Filter Q (5-100):</strong> Controla quão "afiadas" são as ressonâncias. Q BAIXO (5-20) = coloração sutil e natural. Q ALTO (50-100) = ressonâncias dramáticas e vibrantes que transformam a fala mais rapidamente.').parent(contentPT);
  
  createElement('p', '<strong>Dry/Wet (0-100%):</strong> Balanço entre sinal original (dry) e processado (wet). 0% = sem efeito. 100% = totalmente processado. Tente 70-90% para mudanças perceptíveis.').parent(contentPT);
  
  createElement('p', '<strong>Feedback (50-100%):</strong> Ganho geral aplicado ao sinal processado. Maior = saída mais alta, transformação mais agressiva.').parent(contentPT);
  
  createElement('p', '<strong>Enable Convolution:</strong> Adiciona reverb realista de sala usando simulação de Resposta ao Impulso. Combina com filtros ressonantes para som de sala mais natural.').parent(contentPT);
  
  createElement('p', '<strong>Presets de Sala:</strong> Diferentes espaços virtuais com frequências ressonantes únicas. "Small" tem frequências mais altas (mais brilhante), "Cathedral" tem frequências muito baixas (mais profundo, transformação mais lenta).').parent(contentPT);
  
  createElement('h3', '💡 DICAS PARA MELHORES RESULTADOS').parent(contentPT);
  
  createElement('p', '• Use <strong>valores de Q mais altos (50-80)</strong> para ouvir mudanças mais dramáticas<br>• Configure <strong>Dry/Wet em 80-100%</strong> para efeito máximo<br>• Tente o <strong>preset Cathedral</strong> para resultados profundos, tipo drone<br>• Processe <strong>8-12 iterações</strong> para alcançar a fase modal completa<br>• <strong>Ative Convolution</strong> com "Large Hall IR" para reverb realista').parent(contentPT);
  
  createElement('h3', '🎛️ Como Usar Esta Aplicação').parent(contentPT);
  
  createElement('p', '<strong>🎤 Gravar Voz:</strong> Clique para começar a gravar. Fale naturalmente—qualquer texto funciona. A peça original usa o texto acima, mas você pode falar o que quiser.').parent(contentPT);
  
  createElement('p', '<strong>🔄 Processar Iteração:</strong> Aplique os filtros ressonantes da sala virtual à gravação atual. Cada iteração enfatiza as frequências naturais da sala enquanto dissolve gradualmente a inteligibilidade da fala.').parent(contentPT);
  
  createElement('p', '<strong>⏩ Processar Todas:</strong> Processa automaticamente todas as iterações restantes em sequência. Observe (e ouça) a transformação se desenrolar.').parent(contentPT);
  
  createElement('p', '<strong>📊 Comparar Espectros:</strong> Visualize a análise espectral de múltiplas iterações lado a lado para ver a transformação da fala para ressonância.').parent(contentPT);
  
  createElement('p', '<strong>🏠 Presets de Sala:</strong> Escolha diferentes espaços acústicos virtuais—cada um com características ressonantes únicas que colorirão sua transformação de forma diferente.').parent(contentPT);
  
  createElement('h3', '🔬 O Processo de Transformação').parent(contentPT);
  
  createElement('p', 'Cada iteração aplica um banco de filtros ressonantes (passa-banda) simulando os modos acústicos naturais da sala. À medida que as iterações progridem:').parent(contentPT);
  
  createElement('p', '• Frequências que correspondem às ressonâncias da sala são <strong>amplificadas</strong><br>• Outras frequências são gradualmente <strong>atenuadas</strong><br>• A inteligibilidade da fala <strong>diminui</strong><br>• Conteúdo tonal puro <strong>emerge</strong>').parent(contentPT);
  
  createElement('p', 'Esta mudança de "inteligibilidade para musicalidade" representa uma transição da <strong>escuta cognitiva</strong> (compreender palavras) para a <strong>escuta sensorial</strong> (experienciar o som como textura e tom).').parent(contentPT);
  
  createElement('h3', '📈 As Três Fases da Transformação').parent(contentPT);
  
  createElement('p', '<strong>🔊 FASE DE FALA:</strong> O conteúdo semântico é claro. Ouvem-se formantes da voz e a cor da sala como reverberação "normal". Alta largura de banda espectral, energia distribuída.').parent(contentPT);
  
  createElement('p', '<strong>🔀 FASE HÍBRIDA:</strong> A inteligibilidade decai. Certas frequências (modos da sala) ganham sustentação e batimentos emergem. Contornos de ritmo prosódico persistem como padrões "fantasma".').parent(contentPT);
  
  createElement('p', '<strong>🎵 FASE MODAL:</strong> A fala desaparece. Ouvimos campos harmônicos/quase-senoidais (picos modais) com pulsação lenta (batimentos entre modos próximos). A peça termina quando o sistema "satura" nesses picos.').parent(contentPT);
  
  createElement('h3', '🧮 A Matemática: H(f)ⁿ · X(f)').parent(contentPT);
  
  createElement('p', 'Se a sala tem resposta em frequência <strong>H(f)</strong> e sua primeira gravação tem espectro <strong>X(f)</strong>, então após <strong>n</strong> iterações o resultado tende a <strong>H(f)ⁿ · X(f)</strong>.').parent(contentPT);
  
  createElement('p', 'Como |H(f)| > 1 nos picos ressonantes (em termos relativos de ganho), esses picos dominam exponencialmente. É por isso que no final ouvimos "a sala tocando a si mesma."').parent(contentPT);
  
  createElement('h3', '🎭 Processos Composicionais').parent(contentPT);
  
  createElement('p', 'Esta obra exemplifica conceitos-chave na composição contemporânea e arte sonora:').parent(contentPT);
  
  createElement('p', '• <strong>Processo como Forma:</strong> Não há tema a desenvolver; há um processo que se ouve operar<br>• <strong>Espaço como Instrumento:</strong> A obra transfere "conteúdo musical" do texto para a arquitetura<br>• <strong>Emergência:</strong> O resultado final emerge das propriedades do sistema, não do controle direto<br>• <strong>Poética:</strong> A frase sobre "suavizar irregularidades" (Lucier tinha gagueira) liga corpo e espaço—a sala "normaliza" a voz mas, ao fazê-lo, apaga a linguagem').parent(contentPT);
  
  createElement('h3', '🏛️ Presets de Sala Explicados').parent(contentPT);
  
  createElement('p', '• <strong>Small Room:</strong> Ressonâncias mais altas e estreitas, típicas de espaços domésticos (~20m²)<br>• <strong>Large Hall:</strong> Ressonâncias mais baixas e espaçadas de salas de concerto (~500m²)<br>• <strong>Bathroom:</strong> Fortes reflexões em médias frequências características de superfícies azulejadas<br>• <strong>Stairwell:</strong> Espaço ressonante vertical com relações harmônicas<br>• <strong>Cathedral:</strong> Ressonâncias muito baixas com longos tempos de decaimento').parent(contentPT);
  
  createElement('h3', '⌨️ Atalhos de Teclado').parent(contentPT);
  
  createElement('p', '<strong>Espaço</strong> — Play/Stop (também para loop e modo tempo real)<br><strong>R</strong> — Iniciar/Parar gravação<br><strong>I</strong> — Processar próxima iteração<br><strong>L</strong> — Alternar reprodução em loop<br><strong>E</strong> — Alternar modo tempo real<br><strong>X</strong> — Iniciar/Parar processamento aleatório<br><strong>T</strong> — Mostrar/Esconder transcrição<br><strong>H</strong> — Mostrar/Esconder painel<br><strong>← →</strong> — Navegar entre iterações').parent(contentPT);
  
  createElement('h3', '🔴 Modo Tempo Real').parent(contentPT);
  
  createElement('p', '<strong>Modo Tempo Real</strong> reproduz sua gravação original em loop contínuo enquanto permite ajustar os parâmetros de efeito e ouvir as mudanças instantaneamente. Isso é perfeito para:').parent(contentPT);
  
  createElement('p', '• <strong>Explorar ressonâncias:</strong> Ajuste o Filter Q e ouça como diferentes configurações afetam o som<br>• <strong>Encontrar pontos ideais:</strong> Ajuste o balanço Dry/Wet em tempo real<br>• <strong>Comparar presets de sala:</strong> Alterne entre salas e ouça a diferença imediatamente<br>• <strong>Performance ao vivo:</strong> Use como ferramenta de processamento ao vivo para performances de arte sonora').parent(contentPT);
  
  createElement('h3', '💾 Opções de Exportação').parent(contentPT);
  
  createElement('p', '• <strong>Current WAV:</strong> Exporta a iteração selecionada<br>• <strong>All ZIP:</strong> Baixa todas as iterações como arquivo ZIP<br>• <strong>Sequence:</strong> Arquivo WAV único com todas as iterações concatenadas<br>• <strong>Image:</strong> Captura PNG da visualização atual').parent(contentPT);
  
  createElement('h3', '💡 Conceitos-Chave para Sistemas Interativos').parent(contentPT);
  
  createElement('p', 'Esta obra oferece um modelo poderoso para sistemas interativos e arte generativa:').parent(contentPT);
  
  createElement('p', '• <strong>Emergência:</strong> O resultado final não é controlado diretamente, mas emerge das propriedades do sistema<br>• <strong>Feedback Iterativo:</strong> Pequenas modificações se acumulam para criar transformações dramáticas<br>• <strong>Processo como Conteúdo:</strong> A metodologia é tão importante quanto o resultado<br>• <strong>Espaço como Instrumento:</strong> O ambiente físico (ou virtual) torna-se um agente criativo').parent(contentPT);
  
  createElement('h3', '🔗 Saiba Mais').parent(contentPT);
  
  createElement('p', '• <a href="https://en.wikipedia.org/wiki/I_Am_Sitting_in_a_Room" target="_blank">I Am Sitting in a Room (Wikipedia)</a><br>• <a href="https://en.wikipedia.org/wiki/Alvin_Lucier" target="_blank">Alvin Lucier (Wikipedia)</a><br>• <a href="https://www.youtube.com/watch?v=fAxHlLK3Oyk" target="_blank">Gravação Original (YouTube)</a>').parent(contentPT);
  
  createElement('h3', '📚 Créditos').parent(contentPT);
  
  createElement('p', 'Implementação interativa em p5.js desenvolvida como parte de projetos de programação criativa e música computacional. Esta aplicação é uma ferramenta educacional e artística que permite explorar os conceitos da obra original de Lucier em um ambiente digital interativo.').parent(contentPT);
  
  // Tab switching
  tabEN.mousePressed(() => {
    tabEN.addClass('active');
    tabPT.removeClass('active');
    select('#content-en').addClass('active');
    select('#content-pt').removeClass('active');
  });
  
  tabPT.mousePressed(() => {
    tabPT.addClass('active');
    tabEN.removeClass('active');
    select('#content-pt').addClass('active');
    select('#content-en').removeClass('active');
  });
}

function updateTimeline() {
  let container = select('#timeline');
  if (!container) return;
  container.html('');
  
  for (let i = 0; i < state.maxIterations; i++) {
    let item = createDiv(i).addClass('timeline-item').parent(container);
    
    if (iterationBuffers[i]) item.addClass('completed');
    if (i === state.currentIteration && iterationBuffers[i]) item.addClass('active');
    if (i === 0 && state.status === 'recording') item.addClass('recording');
    
    item.mousePressed(() => {
      if (iterationBuffers[i]) {
        state.currentIteration = i;
        playIteration(i);
        updateTimeline();
      }
    });
  }
}

function updateFreqInputs() {
  for (let i = 0; i < 8; i++) {
    freqInputs[i].value(roomResonances[i]);
  }
}

function updateUI() {
  // Status
  let statusEl = select('#status-val');
  if (statusEl) {
    statusEl.removeClass('ready');
    statusEl.removeClass('recording');
    statusEl.removeClass('processing');
    if (state.status === 'recording') {
      statusEl.html('Recording...');
      statusEl.addClass('recording');
    } else if (state.status === 'processing') {
      statusEl.html('Processing...');
      statusEl.addClass('processing');
    } else if (state.status === 'playing') {
      statusEl.html('Playing');
      statusEl.addClass('ready');
    } else {
      statusEl.html('Ready');
      statusEl.addClass('ready');
    }
  }
  
  let iterEl = select('#iter-val');
  if (iterEl) iterEl.html(state.currentIteration + ' / ' + state.maxIterations);
  
  // Duration display
  let durEl = select('#dur-val');
  if (durEl) {
    if (state.status === 'recording') {
      durEl.html(formatTime(recordingDuration));
    } else if (iterationBuffers[state.currentIteration]) {
      durEl.html(formatTime(iterationBuffers[state.currentIteration].duration()));
    } else {
      durEl.html('--:--');
    }
  }
  
  // Record button text
  if (btnRecord) {
    if (state.status === 'recording') {
      btnRecord.html('⏹ Stop Recording');
      btnRecord.removeClass('btn-primary');
      btnRecord.addClass('btn-danger');
    } else {
      btnRecord.html('🎤 Start Recording');
      btnRecord.removeClass('btn-danger');
      btnRecord.addClass('btn-primary');
    }
  }
  
  // Buttons state
  let hasRec = iterationBuffers[0] !== undefined;
  let canIter = hasRec && state.currentIteration < state.maxIterations - 1;
  let isIdle = state.status === 'ready';
  let isRecording = state.status === 'recording';
  
  if (btnRecord) {
    if (state.status === 'processing' || state.status === 'playing') {
      btnRecord.attribute('disabled', true);
    } else {
      btnRecord.removeAttribute('disabled');
    }
  }
  if (btnIterate) {
    if (!canIter || !isIdle) btnIterate.attribute('disabled', true);
    else btnIterate.removeAttribute('disabled');
  }
  if (btnAuto) {
    if (!canIter || !isIdle) btnAuto.attribute('disabled', true);
    else btnAuto.removeAttribute('disabled');
  }
  if (btnPlay) {
    if (!hasRec || isRecording || state.status === 'processing') btnPlay.attribute('disabled', true);
    else btnPlay.removeAttribute('disabled');
  }
  if (btnCompare) {
    if (!hasRec) btnCompare.attribute('disabled', true);
    else btnCompare.removeAttribute('disabled');
  }
  
  for (let key in exportBtns) {
    if (exportBtns[key]) {
      if (!hasRec) exportBtns[key].attribute('disabled', true);
      else exportBtns[key].removeAttribute('disabled');
    }
  }
  
  updateTimeline();
}

function resetAll() {
  stopPlayback();
  stopSpeechRecognition();
  stopLoopPlayback();
  stopRealtimeMode();
  isRandomProcessing = false;
  iterationBuffers = [];
  iterationSpectra = [];
  iterationMetrics = [];
  spectrogramData = [];
  transcribedText = '';
  interimText = '';
  transcriptionHistory = [];
  randomProcessingLog = [];
  state.currentIteration = 0;
  state.status = 'ready';
  state.isAutoProcessing = false;
  state.showComparison = false;
  state.currentPhase = 'none';
  state.phaseHistory = [];
  state.realtimeMode = false;
  spectralMetrics = {
    centroid: 0,
    flatness: 0,
    peakRatio: 0,
    bandwidth: 0,
    dominantFreqs: [],
    intelligibility: 1
  };
  updateRandomButtonUI();
  updateLoopButtonUI();
  updateRealtimeButtonUI();
  updateUI();
}

// ============================================
// INTERACTION
// ============================================

function mousePressed() {
  if (state.showComparison) {
    state.showComparison = false;
  }
}

function keyPressed() {
  if (key === ' ') {
    if (state.realtimeMode) {
      stopRealtimeMode();
    } else if (isLoopPlaying) {
      stopLoopPlayback();
    } else if (state.status === 'playing') {
      stopPlayback();
    } else if (iterationBuffers[state.currentIteration]) {
      playIteration(state.currentIteration);
    }
    return false;
  }
  if (key === 'r' || key === 'R') {
    if (!state.realtimeMode) toggleRecording();
  }
  if (key === 'i' || key === 'I') {
    if (state.status === 'ready' && iterationBuffers[state.currentIteration]) processIteration();
  }
  if (key === 'l' || key === 'L') {
    // Toggle loop playback
    if (!state.realtimeMode) toggleLoopPlayback();
  }
  if (key === 't' || key === 'T') {
    // Toggle transcription panel
    state.showTranscription = !state.showTranscription;
  }
  if (key === 'x' || key === 'X') {
    // Start/stop random processing
    if (!state.realtimeMode) startRandomProcessing();
  }
  if (key === 'e' || key === 'E') {
    // Toggle real-time mode
    toggleRealtimeMode();
  }
  if (keyCode === LEFT_ARROW) {
    if (isLoopPlaying || state.realtimeMode) return; // Don't navigate during loop/realtime
    if (state.currentIteration > 0 && iterationBuffers[state.currentIteration - 1]) {
      state.currentIteration--;
      updateTimeline();
      playIteration(state.currentIteration);
    }
  }
  if (keyCode === RIGHT_ARROW) {
    if (isLoopPlaying || state.realtimeMode) return; // Don't navigate during loop/realtime
    if (state.currentIteration < state.maxIterations - 1 && iterationBuffers[state.currentIteration + 1]) {
      state.currentIteration++;
      updateTimeline();
      playIteration(state.currentIteration);
    }
  }
  if (key === 'h' || key === 'H') {
    // Toggle panel visibility
    state.showPanel = !state.showPanel;
    if (state.showPanel) {
      controlPanel.addClass('visible');
      togglePanelBtn.html('✕');
    } else {
      controlPanel.removeClass('visible');
      togglePanelBtn.html('☰');
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

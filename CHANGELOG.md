# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-29

### Added
- Initial release of "It Looks Like I Am Sitting in a Room"
- Voice recording with MediaRecorder API
- Real-time speech recognition (Web Speech API)
- Iterative audio processing simulating room acoustics
- 8-band peaking filter bank for room resonances
- 5 virtual room presets (Small Room, Large Hall, Bathroom, Stairwell, Cathedral)
- Synthetic impulse response generation for convolution reverb
- Real-time mode for live effect manipulation
- Loop playback of all processed iterations
- Random processing with randomized parameters
- Spectral analysis with logarithmic frequency display
- Phase detection (Speech → Hybrid → Modal)
- Convergence graph showing H(f)ⁿ transformation
- Audio normalization with soft-knee compression
- Fade in/out for smooth transitions
- Multiple export options (WAV, ZIP, Sequence, PNG)
- Bilingual documentation (English and Portuguese)
- Comprehensive keyboard shortcuts
- Responsive UI with collapsible panels

### Technical Features
- p5.js framework for creative coding
- p5.sound library for FFT analysis
- Web Audio API for real-time processing
- OfflineAudioContext for iteration processing
- Dynamic compressor/limiter for anti-clipping

## [Unreleased]

### Planned
- Custom impulse response upload
- MIDI controller support
- WebGL-based spectrogram visualization
- Preset saving/loading
- Audio file input (not just microphone)

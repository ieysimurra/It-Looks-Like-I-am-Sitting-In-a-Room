# It Looks Like I Am Sitting in a Room

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![p5.js](https://img.shields.io/badge/p5.js-v1.9.0-ED225D.svg)](https://p5js.org/)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-Enabled-brightgreen.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

> An interactive web-based reimagination of Alvin Lucier's seminal 1969 sound art piece "I Am Sitting in a Room"

🌐 **[Leia em Português](README.pt-BR.md)**

![Interface Preview](assets/screenshots/interface-preview.png)

## 🎵 About the Project

**It Looks Like I Am Sitting in a Room** is an interactive digital implementation of Alvin Lucier's groundbreaking electroacoustic composition. The application allows users to experience the gradual transformation from intelligible speech to pure acoustic resonance through an iterative feedback process—all within a web browser.

### The Original Work

> *"I am sitting in a room different from the one you are in now. I am recording the sound of my speaking voice and I am going to play it back into the room again and again until the resonant frequencies of the room reinforce themselves so that any semblance of my speech, with perhaps the exception of rhythm, is destroyed."*
> 
> — Alvin Lucier, 1969

**Alvin Lucier** (1931–2021) was an American experimental composer and sound artist who explored psychoacoustic phenomena and the physical properties of sound. "I Am Sitting in a Room" remains one of the most influential works in sound art history, demonstrating how space itself can become an instrument.

## ✨ Features

### Core Functionality
- 🎤 **Voice Recording** with real-time speech recognition
- 🔄 **Iterative Processing** simulating room acoustic feedback
- 🔊 **Real-time Mode** for live effect manipulation
- 🔁 **Loop Playback** of all processed iterations
- 🎲 **Random Processing** with randomized parameters
- 📊 **Spectral Analysis** with logarithmic frequency display

### Audio Processing
- 🏠 **Virtual Room Presets** (Small Room, Large Hall, Bathroom, Stairwell, Cathedral)
- 🎚️ **Adjustable Parameters**: Filter Q, Dry/Wet Mix, Feedback Gain
- 🔉 **Convolution Reverb** with synthetic impulse responses
- 📈 **Dynamic Normalization** with soft-knee compression
- 🎵 **Fade In/Out** for smooth transitions

### Visualization
- 📉 **Real-time Spectrum Analyzer** (logarithmic scale)
- 🎯 **Room Resonance Markers** 
- 📊 **Phase Detection** (Speech → Hybrid → Modal)
- 📈 **Convergence Graph** showing H(f)ⁿ transformation
- 🔬 **Spectral Metrics** (Centroid, Flatness, Peak Ratio, Bandwidth)

### Export Options
- 💾 **WAV Export** (individual iterations)
- 📦 **ZIP Archive** (all iterations)
- 🎬 **Sequence Export** (concatenated audio)
- 🖼️ **PNG Screenshot** of visualization

## 🚀 Live Demo

**[▶️ Try it in the p5.js Web Editor](https://editor.p5js.org/ieysimurra/full/X_q8QkuEx)**

Or run locally by opening `index.html` in a modern web browser.

## 📁 Repository Structure

```
It-Looks-Like-I-Am-Sitting-in-a-Room/
├── index.html              # Main HTML file
├── sketch.js               # Core p5.js application (~3000 lines)
├── style.css               # Styling and UI
├── README.md               # Documentation (English)
├── README.pt-BR.md         # Documentation (Portuguese)
├── LICENSE                 # MIT License
├── assets/
│   └── screenshots/        # Interface screenshots
└── docs/
    ├── TECHNICAL.md        # Technical documentation
    ├── TUTORIAL.md         # User tutorial
    └── COMPOSITIONAL.md    # Compositional concepts
```

## 🎮 Quick Start

### Using p5.js Web Editor (Recommended)

1. Go to [p5.js Web Editor]([https://editor.p5js.org/](https://editor.p5js.org/ieysimurra/sketches/X_q8QkuEx))
2. Create a new project
3. Copy the contents of `sketch.js` to the sketch file
4. Copy the contents of `style.css` to a new `style.css` file
5. Update `index.html` to include the CSS link
6. Click **Play** ▶️

### Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/ieysimurra/It-Looks-Like-I-Am-Sitting-in-a-Room.git
   ```

2. Open `index.html` in a modern web browser (Chrome, Firefox, Edge recommended)

3. Allow microphone access when prompted

## 📖 How to Use

### Basic Workflow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  1. RECORD  │ -> │ 2. PROCESS  │ -> │  3. LISTEN  │ -> │  4. REPEAT  │
│    (Voice)  │    │ (Iteration) │    │   (Play)    │    │   (2→3→2)   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Step-by-Step

1. **Record Your Voice**: Click "🎤 Start Recording" and speak clearly
2. **Process Iteration**: Click "🔄 Process Iteration" to apply room resonances
3. **Listen**: Click "▶ Play Current" to hear the processed version
4. **Repeat**: Process more iterations (5-12 recommended) to hear the transformation
5. **Compare**: Use "📊 Compare Spectra" to visualize the spectral evolution

### Real-time Mode

1. Record something first
2. Click "🔴 Real-time Mode" or press `E`
3. Adjust sliders and hear changes instantly
4. Perfect for exploring resonances and finding ideal settings

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Stop (also stops loop and real-time mode) |
| `R` | Start/Stop recording |
| `I` | Process next iteration |
| `L` | Toggle loop playback |
| `E` | Toggle real-time mode |
| `X` | Start/Stop random processing |
| `T` | Toggle transcription panel |
| `H` | Hide/Show control panel |
| `← →` | Navigate between iterations |

## 🎚️ Effect Parameters

| Parameter | Range | Description |
|-----------|-------|-------------|
| **Filter Q** | 5-100 | Resonance sharpness (higher = more dramatic) |
| **Dry/Wet** | 0-100% | Balance between original and processed signal |
| **Feedback** | 50-100% | Overall gain applied to processed signal |
| **Convolution** | On/Off | Adds realistic room reverb |

### Room Presets

| Preset | Frequencies | Character |
|--------|-------------|-----------|
| **Small Room** | 120-2400 Hz | Bright, tight resonances |
| **Large Hall** | 60-1400 Hz | Deep, spread resonances |
| **Bathroom** | 200-4000 Hz | Strong mid reflections |
| **Stairwell** | 80-1920 Hz | Harmonic spacing |
| **Cathedral** | 40-1200 Hz | Very low, drone-like |

## 🔬 The Three Phases of Transformation

The transformation process follows three distinct phases, as described by Lucier:

### 🔊 Speech Phase
- Semantic content is clear
- Voice formants visible in spectrum
- High spectral bandwidth

### 🔀 Hybrid Phase  
- Intelligibility decays
- Room modes gain sustentation
- Prosodic rhythm persists as "ghost" patterns

### 🎵 Modal Phase
- Speech disappears completely
- Quasi-sinusoidal harmonic fields
- "The room playing itself"

## 🧮 The Mathematics

If the room has frequency response **H(f)** and your first recording has spectrum **X(f)**, then after **n** iterations the result tends toward:

```
Result(f) = H(f)ⁿ · X(f)
```

Since |H(f)| > 1 at resonant peaks, these peaks dominate exponentially—which is why we eventually hear pure tones instead of speech.

## 🎭 Compositional Concepts

This work exemplifies key concepts in contemporary composition and sound art:

- **Process as Form**: No theme to develop; we hear a process operating
- **Space as Instrument**: Musical content transfers from text to architecture
- **Emergence**: Final result emerges from system properties, not direct control
- **Poetics**: The phrase about "smoothing irregularities" (Lucier had a stutter) links body and space

## 🛠️ Technical Details

### Technologies Used
- **p5.js** - Creative coding framework
- **p5.sound** - Audio library with FFT analysis
- **Web Audio API** - Real-time audio processing
- **Web Speech API** - Speech recognition
- **MediaRecorder API** - Audio recording

### Audio Processing Pipeline

```
Input → [Peaking Filters (8x)] → [Air Absorption LPF] → [Convolver (optional)]
                                                              ↓
Output ← [Limiter] ← [Master Gain] ← [Dry/Wet Mix] ←─────────┘
```

### Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full support |
| Firefox | ✅ Full support |
| Edge | ✅ Full support |
| Safari | ⚠️ Limited (no speech recognition) |

## 📚 References

### Original Work
- Lucier, A. (1969). *I Am Sitting in a Room*. Lovely Music.
- [Wikipedia: I Am Sitting in a Room](https://en.wikipedia.org/wiki/I_Am_Sitting_in_a_Room)
- [Original Recording (YouTube)](https://www.youtube.com/watch?v=fAxHlLK3Oyk)

### About Alvin Lucier
- [Wikipedia: Alvin Lucier](https://en.wikipedia.org/wiki/Alvin_Lucier)
- Lucier, A. (2012). *Music 109: Notes on Experimental Music*. Wesleyan University Press.

### Technical Resources
- [Web Audio API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [p5.js Reference](https://p5js.org/reference/)
- [p5.sound Library](https://p5js.org/reference/#/libraries/p5.sound)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Ivan Eiji Simurra**

- GitHub: [@ieysimurra](https://github.com/ieysimurra)
- Institution: NICS/UNICAMP (Núcleo Interdisciplinar de Comunicação Sonora)

## 🙏 Acknowledgments

- **Alvin Lucier** (1931–2021) for creating this groundbreaking work
- The **p5.js** community for the excellent creative coding tools
- **NICS/UNICAMP** for supporting computational musicology research

---

## 🔗 Related Projects

Check out other interactive implementations of experimental music works:

- [It Looks Like Mouse Music](https://github.com/ieysimurra/It-Looks-Like-Mouse-Music) - Laurie Spiegel
- [It Looks Like Artikulation](https://github.com/ieysimurra/It-Looks-Like-Artikulation) - György Ligeti
- [It Looks Like On December](https://github.com/ieysimurra/It-Looks-Like-On-December) - Earle Brown
- [It Looks Like Pendulum Music](https://github.com/ieysimurra/It-Looks-Like-Pendulum-Music) - Steve Reich

---

<p align="center">
  <i>"I regard this activity not so much as a demonstration of a physical fact, but more as a way to smooth out any irregularities my speech might have."</i>
  <br>
  — Alvin Lucier
</p>

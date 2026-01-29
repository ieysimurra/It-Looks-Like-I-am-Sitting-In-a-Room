# Contributing to It Looks Like I Am Sitting in a Room

Thank you for your interest in contributing! This document provides guidelines and information for contributors.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:

1. A clear, descriptive title
2. Steps to reproduce the problem
3. Expected behavior vs actual behavior
4. Browser and OS information
5. Screenshots if applicable

### Suggesting Features

Feature suggestions are welcome! Please open an issue with:

1. A clear description of the feature
2. Why this feature would be useful
3. How it relates to the original Lucier work (if applicable)

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly in multiple browsers
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

### Code Style

- Use consistent indentation (2 spaces)
- Add comments for complex logic
- Keep functions focused and modular
- Follow existing naming conventions

### Testing

Before submitting:

1. Test in Chrome, Firefox, and Edge
2. Test microphone recording
3. Test all processing modes
4. Verify export functions work
5. Check mobile responsiveness

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/It-Looks-Like-I-Am-Sitting-in-a-Room.git

# Navigate to directory
cd It-Looks-Like-I-Am-Sitting-in-a-Room

# Open in browser (or use a local server)
open index.html
```

For development with live reload, you can use:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

## Areas for Contribution

### High Priority
- [ ] Safari/WebKit compatibility improvements
- [ ] Mobile touch interface optimization
- [ ] Performance optimization for long recordings

### Medium Priority
- [ ] Additional room presets
- [ ] Custom impulse response loading
- [ ] Preset save/load functionality
- [ ] i18n for additional languages

### Low Priority / Nice to Have
- [ ] WebGL spectrogram visualization
- [ ] MIDI controller mapping
- [ ] OSC protocol support
- [ ] Collaborative features

## Questions?

Feel free to open an issue for any questions about contributing.

---

*Obrigado por contribuir! / Thank you for contributing!*

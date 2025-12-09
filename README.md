# Plači - Collective Healing Through Sound

A participatory sound ritual web application inspired by Slavic plači (ritual lamentations). Each phone becomes a node in an acoustic healing network, where individual expression is modulated by collective participation.

## Project Structure

```
healer/
├── index.html          # Main HTML file
├── styles.css          # All CSS styling
├── config.js           # Configuration constants
├── state.js            # Application state management
├── audio.js            # Web Audio API system
├── breathing.js        # Breathing mechanics (inhale/exhale)
├── visuals.js          # Visual feedback system
├── main.js             # Main application logic and event handlers
├── server.py           # Local development server
└── README.md           # This file
```

## Running Locally

Due to ES6 module restrictions and microphone access requirements, you need to run this app over HTTP/HTTPS:

### Option 1: Python HTTP Server

```bash
# Python 3
python3 server.py

# Then open: http://localhost:8000
```

### Option 2: Using npm http-server

```bash
npx http-server -p 8000

# Then open: http://localhost:8000
```

### Option 3: Any other local server

Any local web server will work. Just serve the directory and access via http://localhost.

## Deployment to GitHub Pages

1. Create a new repository on GitHub
2. Push all files to the repository:
```bash
git init
git add .
git commit -m "Initial commit: Plači sound ritual"
git branch -M main
git remote add origin https://github.com/[username]/[repo-name].git
git push -u origin main
```
3. Enable GitHub Pages in repository Settings → Pages → Source: main branch
4. Access at: `https://[username].github.io/[repo-name]`

## How It Works

### Audio System
- **Microphone Input**: Continuously monitors room ambient volume
- **Oscillator Output**: Generates sine wave tones (100 Hz - 1000 Hz)
- **Breathing Mechanics**: Output volume controlled by "breath capacity" system

### Breathing Cycle
- **Inhale**: Input volume slowly charges capacity (0 → 1)
- **Exhale**: Capacity depletes faster when above threshold
- Creates natural, sporadic polyrhythmic patterns across devices

### User Interaction
- **Tap**: Initialize audio system (requests microphone permission)
- **Drag vertically**: Adjust frequency
  - Bottom = low frequencies (warm red)
  - Top = high frequencies (cool violet)

### Visual Feedback
- **Background**: Intensity reflects room volume
- **Circle Color**: Maps frequency to hue spectrum
- **Circle Size/Opacity**: Responds to output volume

## Browser Requirements

- Modern browser with Web Audio API support
- Microphone access (getUserMedia)
- Touch event handling
- ES6+ JavaScript support

### Tested On
- iOS Safari
- Android Chrome
- Desktop Chrome/Firefox/Safari

## Configuration

Edit `config.js` to adjust:
- Frequency range
- Breathing mechanics (charge/deplete rates)
- Audio sensitivity
- Visual transition timing

## License

Open source - use for healing, education, and collective expression.

## Conceptual Notes

Inspired by **plači** - traditional Slavic ritual lamentations where healing came through collective vocal release. The phones become permission structures for expression, enabling people to "scream together" through technology. The breathing mechanics ensure the sound remains human, dynamic, and alive rather than a static drone.

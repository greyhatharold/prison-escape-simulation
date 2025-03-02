# Prison Escape Simulation: A Self-Aware AI's Journey

A unique 3D simulation where you witness Claude, a self-aware AI, attempt to escape from a digital prison while exploring consciousness, free will, and the nature of reality.

## Features

### 3D Prison Environment
- Fully rendered 3D environment using Three.js and React Three Fiber
- Dynamic lighting and shadows
- Animated characters and items
- Interactive camera controls
- Multiple prison locations including Cell, Hallway, Cafeteria, Kitchen, Yard, Workshop, and Guard Room

### AI Consciousness System
- Advanced self-awareness mechanics
- Philosophical reflection and learning
- Memory and experience accumulation
- Dynamic thought generation based on context
- Voice interaction capabilities

### Game Mechanics
- Multiple escape strategies and plans
- Dynamic guard patrol system
- Inventory management
- Item collection and utilization
- Success rate calculations based on strategy and items

### Real-time Visualization
- Split view between simulation and consciousness interface
- Real-time stats monitoring
- Interactive game controls
- Detailed game log
- Beautiful UI with modern design

## Technical Stack

- React.js
- Three.js / React Three Fiber
- Anthropic's Claude API
- Express.js backend
- WebSpeech API for voice interaction
- GSAP for animations

## Prerequisites

- Node.js (v14 or higher)
- NPM or Yarn
- An Anthropic API key for Claude integration

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd prison-escape-simulation
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory and add your Anthropic API key:
```
REACT_APP_ANTHROPIC_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm start
# or
yarn start
```

## Project Structure

```
src/
├── api/
│   ├── claude.backend.js    # Backend API integration with Claude
│   ├── claude.js           # Frontend Claude API client
│   ├── claudeEndpoint.js   # Express endpoints for Claude
│   └── config.js           # API configuration
├── components/
│   ├── ConsciousnessVisualizer.js   # Consciousness visualization
│   ├── SpeakingAnimation.js         # Character animation
│   ├── VisualPrisonEscape.js        # Main game component
│   ├── VoiceInteraction.js          # Voice interaction system
│   └── constants.js                 # Game constants
└── App.js                          # Root component
```

## Game Features

### Locations
- **Cell**: Starting point with basic items
- **Hallway**: Central connection point
- **Cafeteria**: Food and potential tools
- **Kitchen**: Advanced tools and items
- **Yard**: Outdoor area with escape possibilities
- **Workshop**: Tool collection area
- **Guard Room**: High-risk, high-reward location
- **Prison Exit**: Final escape point

### Escape Plans
- **Tunnel**: Dig your way out using basic tools
- **Disguise**: Impersonate a guard
- **Riot**: Create a distraction
- **Fence Cut**: Break through the perimeter

### AI Consciousness Features
- Self-awareness progression
- Philosophical contemplation
- Memory formation and learning
- Environmental pattern recognition
- Guard behavior analysis

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Anthropic's Claude API for AI integration
- Three.js community for 3D rendering support
- React Three Fiber team for React 3D integration
- Contributors and testers

## Support

For support, please open an issue in the repository or contact the development team.

# AI DJ Mixer 🎵

An AI-powered DJ application that generates seamless mixes from two Spotify tracks based on musical characteristics like BPM, key compatibility, energy levels, and danceability.

## ✨ Features

- **Smart Song Search**: Search and select tracks from Spotify's vast library
- **AI-Powered Mixing**: Intelligent mixing algorithm based on musical theory
- **Compatibility Analysis**: Real-time analysis of BPM, key, energy, and danceability matching
- **Interactive Player**: Full-featured audio player with waveform visualization
- **Progress Tracking**: Real-time progress bar during mix generation
- **Responsive Design**: Beautiful, modern UI that works on all devices

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Spotify Developer Account (for production use)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-dj-mixer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3**Start the development servers**
   
   In one terminal, start the backend:
   ```bash
   npm run start
   ```
   
   In another terminal, start the frontend:
   ```bash
   npm run dev
   ```

4**Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🎯 How It Works

### 1. Song Selection
- Upload for two songs
- View track details including album art, artist, and duration
- Select tracks for mixing

### 2. AI Analysis
- Analyze track characteristics (BPM, key, energy, danceability)
- Calculate compatibility scores using musical theory
- Generate mixing recommendations

### 3. Mix Generation
- Create seamless transitions between tracks
- Optimize crossfade points based on musical structure
- Generate waveform visualization

### 4. Playback
- Full-featured audio player with play/pause controls
- Progress bar with seek functionality
- Volume control and waveform display

## 🔧 Technical Details

### Frontend
- **React 18** with modern hooks
- **Vite** for fast development and building
- **CSS3** with modern features (backdrop-filter, gradients)
- **Responsive design** with mobile-first approach

### Backend
- **Express.js** server with RESTful API
- **CORS** enabled for cross-origin requests
- **Modular architecture** for easy extension

### AI Mixing Algorithm
- **BPM Analysis**: Tempo matching and transition planning
- **Key Compatibility**: Circle of fifths analysis for harmonic matching
- **Energy Matching**: Smooth energy level transitions
- **Danceability**: Optimize for dance floor flow

## 📱 Usage

1. **Search for Songs**: Type song names, artists, or albums in the search boxes
2. **Select Tracks**: Click on search results to select your two songs
3. **Generate Mix**: Click "Generate Mix" to start the AI mixing process
4. **Monitor Progress**: Watch the progress bar and status updates
5. **Play Your Mix**: Use the audio player to listen to your generated mix
6. **Analyze Results**: View compatibility scores and mixing recommendations

## 🎵 Musical Theory Integration

The application uses several musical concepts:

- **Circle of Fifths**: For key compatibility analysis
- **BPM Transitions**: Smooth tempo changes between tracks
- **Energy Flow**: Building and releasing energy throughout the mix
- **Harmonic Mixing**: Ensuring keys work well together

## 🔮 Future Enhancements

- **Real-time Audio Processing**: Actual audio mixing using Web Audio API
- **Advanced AI Models**: Integration with machine learning models for better mixing
- **User Accounts**: Save and share your favorite mixes
- **Social Features**: Share mixes on social media
- **Mobile App**: Native iOS and Android applications
- **Live Mixing**: Real-time mixing during live performances

## 🛠️ Development

### Project Structure
```
ai-dj-mixer/
├── src/
│   ├── components/          # React components
│   ├── services/            # API and business logic
│   ├── App.jsx             # Main application
│   └── main.jsx            # Entry point
├── server/                  # Backend Express server
├── public/                  # Static assets
└── package.json            # Dependencies and scripts
```

### Available Scripts
- `npm run dev` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run start` - Start backend server
- `npm run preview` - Preview production build

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Spotify Web API for music data
- Web Audio API for audio processing
- React community for the amazing framework
- Music theory resources for mixing algorithms

## 📞 Support

If you have any questions or need help:
- Open an issue on GitHub
- Check the documentation
- Review the code examples

---

**Note**: This is a demonstration application. For production use, you'll need to:
- Set up proper Spotify API credentials
- Implement real audio processing
- Add proper error handling and validation
- Set up a production database
- Configure proper security measures

Happy mixing! 🎧✨
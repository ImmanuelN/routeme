# RouteMe 🗺️

A cross-platform mobile navigation application built with React Native and Expo that provides real-time location tracking and turn-by-turn directions using Google Maps APIs.

## Features ✨

- 📍 **Real-time Location Tracking** - Continuously tracks and updates your current position
- 🗺️ **Interactive Map View** - Full-screen Google Maps integration with smooth interactions
- 🎯 **Destination Selection** - Tap anywhere on the map to set your destination
- 🛣️ **Route Visualization** - Visual route polyline from current location to destination
- 📊 **Route Information** - Display distance, ETA, and turn-by-turn directions
- 🔄 **Auto Route Recalculation** - Automatically recalculates route if you deviate
- 🎨 **Clean UI/UX** - Intuitive interface with floating search bar and bottom info card
- 🔐 **Secure Configuration** - API keys stored in environment variables

## Tech Stack 🛠️

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and toolchain
- **react-native-maps** - Map rendering and interactions
- **react-native-maps-directions** - Google Directions API integration
- **Expo Location API** - Real-time location tracking
- **Context API** - Global state management
- **Google Maps API** - Maps and directions services

## Project Structure 📂

```
RouteMe/
├── src/
│   ├── components/
│   │   ├── MapViewContainer.js        # Main map component
│   │   ├── DestinationSearchBar.js    # Search bar component
│   │   ├── RouteDirections.js         # Route rendering component
│   │   └── RouteInfoCard.js           # Route info display
│   ├── hooks/
│   │   └── useUserLocation.js         # Location tracking hook
│   ├── context/
│   │   └── LocationContext.js         # Global location state
│   ├── screens/
│   │   └── HomeScreen.js              # Main app screen
│   ├── utils/
│   │   └── mapHelpers.js              # Map utility functions
│   └── assets/                        # App assets (icons, images)
├── App.js                             # App entry point
├── app.json                           # Expo configuration
├── babel.config.js                    # Babel configuration
├── package.json                       # Dependencies and scripts
├── .env                               # Environment variables
└── README.md                          # This file
```

## Prerequisites 📋

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- Google Maps API Key

## Getting Started 🚀

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/ImmanuelN/routeme.git
cd routeme
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Set Up Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Directions API
   - Geocoding API (for future features)
4. Create credentials (API Key)
5. Copy the API key

### 4. Configure Environment Variables

Create/update the `.env` file in the root directory:

\`\`\`env
GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
\`\`\`

### 5. Update app.json

Open `app.json` and replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key in both iOS and Android configurations.

### 6. Run the App

\`\`\`bash
# Start Expo development server
npm start

# Run on iOS (Mac only)
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
\`\`\`

## Usage 📱

1. **Grant Location Permission** - Allow the app to access your location when prompted
2. **View Your Location** - The map will center on your current position
3. **Set Destination** - Tap anywhere on the map to set a destination
4. **View Route** - The app will calculate and display the route with a blue polyline
5. **Check Route Details** - View distance, ETA, and turn-by-turn directions in the bottom card
6. **Clear Route** - Tap the X button to clear the current destination

## Key Components 🧩

### useUserLocation Hook
Custom hook that handles:
- Location permission requests
- Real-time location tracking
- Error handling
- Manual location refresh

### LocationContext
Provides global state management for:
- Current user location
- Selected destination
- Route information and coordinates
- Loading states

### MapViewContainer
Main map component featuring:
- Google Maps integration
- User location marker
- Destination marker
- Auto-zoom to fit route

### RouteDirections
Handles route calculation:
- Google Directions API integration
- Polyline rendering
- Route deviation detection
- Auto-recalculation

### RouteInfoCard
Displays route information:
- Distance and ETA
- Turn-by-turn instructions
- Scrollable directions list

## Environment Variables 🔐

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | Yes |

## API Keys and Security 🔒

⚠️ **Important Security Notes:**

- Never commit your `.env` file to version control
- Add `.env` to `.gitignore`
- Use separate API keys for development and production
- Restrict your API keys in Google Cloud Console:
  - Set application restrictions (Android/iOS bundle IDs)
  - Set API restrictions (only enable required APIs)

## Troubleshooting 🔧

### Location not updating
- Ensure location permissions are granted
- Check device location services are enabled
- Verify GPS signal (may not work well indoors)

### Map not displaying
- Verify Google Maps API key is correct
- Ensure Maps SDK is enabled in Google Cloud Console
- Check internet connection

### Routes not calculating
- Verify Directions API is enabled
- Check API key has no restrictions blocking the API
- Ensure origin and destination are valid coordinates

### Build errors
\`\`\`bash
# Clear cache and reinstall
rm -rf node_modules
npm install

# Clear Expo cache
expo start -c
\`\`\`

## Future Enhancements 🚀

- [ ] Address search with geocoding
- [ ] Voice turn-by-turn navigation
- [ ] Real-time location sharing
- [ ] Saved routes and favorite places
- [ ] Offline map caching
- [ ] Multiple transportation modes (walking, cycling, transit)
- [ ] Traffic layer integration
- [ ] AR walking directions
- [ ] Route history

## Development Principles 📐

- **Modular Architecture** - Components are reusable and independent
- **React Hooks** - Functional components with modern React patterns
- **Error Handling** - Graceful handling of permissions, API, and connectivity issues
- **Responsive Design** - Clean UI that works across different screen sizes
- **Code Documentation** - Well-commented code for maintainability

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📄

This project is licensed under the ISC License.

## Acknowledgments 🙏

- React Native and Expo teams
- Google Maps Platform
- react-native-maps community

## Support 💬

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using React Native and Expo**

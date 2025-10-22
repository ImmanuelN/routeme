# RouteMe - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Get Your Google Maps API Key
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Enable: Maps SDK for Android, Maps SDK for iOS, Directions API
3. Create and copy your API Key

### Step 2: Configure API Key
Edit `.env` file:
```env
GOOGLE_MAPS_API_KEY=paste_your_key_here
```

Edit `app.json` (2 places):
```json
"googleMapsApiKey": "paste_your_key_here"  // iOS
"apiKey": "paste_your_key_here"           // Android
```

### Step 3: Run the App
```bash
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- Scan QR code for physical device

## 📱 How to Use

1. **Allow location access** when prompted
2. **Tap on map** to set destination
3. **View route** with blue polyline
4. **Check details** in bottom card
5. **Clear route** by tapping X button

## 🎯 Key Features

✅ Real-time GPS tracking
✅ Tap-to-set destination  
✅ Visual route display
✅ Distance & ETA
✅ Turn-by-turn directions
✅ Auto route recalculation

## 📂 Project Structure

```
src/
├── components/     # UI components (Map, Search, Route, Info Card)
├── hooks/          # useUserLocation hook
├── context/        # Global state (LocationContext)
├── screens/        # HomeScreen
├── utils/          # Helper functions
└── assets/         # Images & icons
```

## ⚙️ Tech Stack

- React Native + Expo
- react-native-maps
- react-native-maps-directions
- Expo Location API
- Context API

## 🛠️ Common Commands

```bash
npm start          # Start dev server
npm run ios        # Run on iOS
npm run android    # Run on Android
expo start -c      # Clear cache
```

## ⚠️ Troubleshooting

**Map not showing?**
- Check API key in `.env` and `app.json`
- Enable Maps SDK in Google Cloud Console

**Location not working?**
- Grant location permissions
- Enable GPS on device
- Test outdoors

**Route not calculating?**
- Enable Directions API
- Verify API key

## 📚 More Info

- Full docs: `README.md`
- Setup guide: `SETUP.md`
- Specification: `PROMPT.md`

---

**Ready to navigate! 🗺️**

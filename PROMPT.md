# RouteMe - Project Specification

## Project Name
RouteMe

## Objective
Build a cross-platform mobile application using React Native and Google Maps APIs to provide real-time location tracking and navigation from a user's current position to a chosen destination.

## Tech Stack

- **React Native + Expo** (cross-platform mobile app framework)
- **react-native-maps** (map rendering)
- **react-native-maps-directions** (route drawing)
- **Expo Location API** (real-time location tracking)
- **Context API or Redux** (state management)
- **Firebase** (optional future backend for location sharing)

## Core Features

1. Display Google Map centered on user's current location.
2. Request and handle location permissions gracefully.
3. Track location in real-time using watchPosition.
4. Allow users to search for or tap to set a destination.
5. Draw and update route between current location and destination using Google Directions API.
6. Display route details (ETA, distance, steps).
7. Auto-recalculate route if user deviates.
8. Smooth UI/UX with top search bar and bottom info card.
9. Securely load Google Maps API key from .env.
10. Modular architecture for easy feature expansion.

## Project Structure

```
RouteMe/
├─ src/
│  ├─ components/
│  │  ├─ MapViewContainer.js
│  │  ├─ DestinationSearchBar.js
│  │  └─ RouteDirections.js
│  ├─ hooks/
│  │  └─ useUserLocation.js
│  ├─ context/
│  │  └─ LocationContext.js
│  ├─ screens/
│  │  └─ HomeScreen.js
│  ├─ utils/
│  │  └─ mapHelpers.js
│  ├─ assets/
│  └─ App.js
├─ .env
├─ PROMPT.md
├─ app.json
├─ package.json
└─ README.md
```

## UI Expectations

- Full-screen map view
- Floating destination search bar
- Marker on destination
- Polyline showing route
- Realtime location marker movement
- Bottom info card with ETA, distance, route steps

## Copilot Tasks

🏗️ Initialize an Expo React Native project.

📄 Automatically create a PROMPT.md file in the root directory containing this exact specification for ongoing reference.

🧭 Scaffold the folder structure above.

🗺️ Implement basic MapView showing user location.

📍 Add location permission and real-time tracking.

🚏 Implement destination search and tapping on the map to set destination.

🧭 Integrate Directions API to draw route.

🔄 Add automatic route recalculation on movement.

🧭 Keep UI clean and responsive with reusable components.

🔐 Use .env for storing Google Maps API key.

✍️ Write clean, modular, and well-commented code for every component.

## Future Enhancements (not for MVP)

- Voice turn-by-turn navigation
- Real-time location sharing
- Saved routes / favorite places
- Offline caching of routes and maps
- AR walking directions

## Development Principles

- Modular code structure
- Functional components with React Hooks
- Graceful error handling (permissions, API, connectivity)
- Clean UI with responsive design
- Environment variables for secrets

## Action Items

1. Create an Expo project called RouteMe.
2. Generate the folder structure as described.
3. Create a file PROMPT.md in the root directory and insert this entire prompt text into it.
4. Start implementing the App.js file with a minimal working map showing the user's current location.
5. Commit initial structure to Git.

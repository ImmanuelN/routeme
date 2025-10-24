// Ensure AsyncStorage is available to helpers without forcing a bundle-time import.
// This allows developers to install the package later while keeping a safe
// in-memory fallback during development. If the package is installed, we
// set it on global.RoutemeAsyncStorage so `src/utils/storage.js` can use it.
try {
  // eslint-disable-next-line global-require
  global.RoutemeAsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // Not fatal — storage helper will warn and fall back to in-memory storage.
  // Keep the warning lightweight so the Metro bundler doesn't fail.
  // Developers can install with: `expo install @react-native-async-storage/async-storage`
  // or remove this try/catch and import directly after installing.
  // We intentionally don't throw here to avoid bundler crashes when the package
  // isn't yet installed in a fresh checkout.
  // eslint-disable-next-line no-console
  console.warn('Could not set RoutemeAsyncStorage global:', e?.message || e);
}

import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LocationProvider } from './src/context/LocationContext';
import HomeScreen from './src/screens/HomeScreen';

/**
 * RouteMe App
 * A cross-platform mobile navigation application
 * Provides real-time location tracking and turn-by-turn directions
 * 
 * @returns {React.Component} App component
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <LocationProvider>
        <HomeScreen />
      </LocationProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

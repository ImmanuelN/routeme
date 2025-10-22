import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
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
    <LocationProvider>
      <SafeAreaView style={styles.container}>
        <HomeScreen />
      </SafeAreaView>
    </LocationProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

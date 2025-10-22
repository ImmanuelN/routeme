import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapViewContainer from '../components/MapViewContainer';
import DestinationSearchBar from '../components/DestinationSearchBar';
import RouteDirections from '../components/RouteDirections';
import RouteInfoCard from '../components/RouteInfoCard';
import useUserLocation from '../hooks/useUserLocation';
import { useLocation } from '../context/LocationContext';

/**
 * HomeScreen Component
 * Main screen of the app that integrates all components
 * Handles user location tracking, destination selection, and route display
 */
const HomeScreen = () => {
  const { location, errorMsg, loading } = useUserLocation();
  const { updateCurrentLocation, updateDestination, destination } =
    useLocation();

  // Update global location state when user location changes
  useEffect(() => {
    if (location) {
      updateCurrentLocation(location);
    }
  }, [location]);

  // Show error if location permission denied or unavailable
  useEffect(() => {
    if (errorMsg) {
      Alert.alert('Location Error', errorMsg, [
        {
          text: 'OK',
          onPress: () => console.log('Location error acknowledged'),
        },
      ]);
    }
  }, [errorMsg]);

  /**
   * Handle map press to set destination
   * @param {Object} event - Map press event
   */
  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    updateDestination({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      name: 'Selected Location',
    });
  };

  /**
   * Handle search input (placeholder for future implementation)
   * @param {string} searchText - Search query text
   */
  const handleSearch = (searchText) => {
    console.log('Search:', searchText);
    // TODO: Implement geocoding to convert address to coordinates
    Alert.alert(
      'Search',
      'Address search coming soon! For now, tap on the map to set a destination.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Getting your location...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <Text style={styles.errorHint}>
          Please enable location permissions in your device settings.
        </Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapViewContainer userLocation={location} onMapPress={handleMapPress}>
        {/* Route Directions Overlay */}
        {location && destination && (
          <RouteDirections
            origin={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            destination={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
          />
        )}
      </MapViewContainer>

      {/* Search Bar */}
      <DestinationSearchBar onSearch={handleSearch} />

      {/* Route Information Card */}
      <RouteInfoCard />

      <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default HomeScreen;

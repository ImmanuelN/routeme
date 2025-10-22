import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocation } from '../context/LocationContext';

/**
 * MapViewContainer Component
 * Renders the main map view with user location marker
 * Handles map interactions and updates
 * 
 * @param {Object} props
 * @param {Object} props.userLocation - Current user location
 * @param {Function} props.onMapPress - Handler for map press events
 */
const MapViewContainer = ({ userLocation, onMapPress }) => {
  const mapRef = useRef(null);
  const { destination, routeCoordinates } = useLocation();

  // Animate map to user location when it changes
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(userLocation, 1000);
    }
  }, [userLocation]);

  // Fit map to show both user location and destination when route is available
  useEffect(() => {
    if (
      userLocation &&
      destination &&
      routeCoordinates.length > 0 &&
      mapRef.current
    ) {
      // Fit to coordinates including user location, destination, and route
      const coordinates = [
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: destination.latitude, longitude: destination.longitude },
        ...routeCoordinates,
      ];

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }
  }, [routeCoordinates, destination, userLocation]);

  if (!userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      initialRegion={userLocation}
      showsUserLocation={true}
      showsMyLocationButton={true}
      showsCompass={true}
      showsTraffic={false}
      onPress={onMapPress}
      loadingEnabled={true}
    >
      {/* User Location Marker */}
      <Marker
        coordinate={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        }}
        title="Your Location"
        description="You are here"
        pinColor="blue"
      />

      {/* Destination Marker */}
      {destination && (
        <Marker
          coordinate={{
            latitude: destination.latitude,
            longitude: destination.longitude,
          }}
          title="Destination"
          description={destination.name || 'Selected destination'}
          pinColor="red"
        />
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});

export default MapViewContainer;

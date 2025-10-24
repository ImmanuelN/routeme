import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
 * @param {React.ReactNode} props.children - Child components (e.g., RouteDirections)
 */
const MapViewContainer = ({ userLocation, onMapPress, children }) => {
  const mapRef = useRef(null);
  const { destination, routeCoordinates } = useLocation();
  // Animate map to user location when it changes
  useEffect(() => {
    if (userLocation && mapRef.current) {
      try {
        mapRef.current.animateToRegion(userLocation, 1000);
      } catch (e) {
        // ignore if map not ready
      }
    }
  }, [userLocation]);

  // Fit map to show both user location and destination when route is available
  useEffect(() => {
    if (
      userLocation &&
      destination &&
      routeCoordinates &&
      routeCoordinates.length > 0 &&
      mapRef.current
    ) {
      const coordinates = [
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: destination.latitude, longitude: destination.longitude },
        ...routeCoordinates,
      ];
      try {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        });
      } catch (e) {
        // ignore
      }
    }
  }, [routeCoordinates, destination, userLocation]);
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={userLocation}
        showsUserLocation={true}
        showsMyLocationButton={false}
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

        {/* Render children (e.g., RouteDirections with Polyline) */}
        {children}
      </MapView>

      {/* Custom reposition button (bottom-right) */}
      <TouchableOpacity
        style={styles.recenterBtn}
        onPress={() => {
          if (mapRef.current && userLocation) {
            mapRef.current.animateToRegion(
              {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              500
            );
          }
        }}
      >
        <Ionicons name="locate" size={22} color="#333" />
      </TouchableOpacity>
    </View>
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
  container: {
    flex: 1,
  },
  recenterBtn: {
    position: 'absolute',
    right: 16,
    bottom: 28,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  recenterIcon: {
    fontSize: 22,
  },
});

export default MapViewContainer;

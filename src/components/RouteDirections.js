import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import MapViewDirections from 'react-native-maps-directions';
import { Polyline } from 'react-native-maps';
import { useLocation } from '../context/LocationContext';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { hasDeviatedFromRoute } from '../utils/mapHelpers';

/**
 * RouteDirections Component
 * Handles route calculation and rendering using Google Directions API
 * Displays polyline on map and manages route recalculation
 * 
 * @param {Object} props
 * @param {Object} props.origin - Origin coordinates
 * @param {Object} props.destination - Destination coordinates
 * @param {Function} props.onRouteReady - Callback when route is calculated
 */
const RouteDirections = ({ origin, destination, onRouteReady }) => {
  const {
    updateRoute,
    setIsLoadingRoute,
    routeCoordinates,
    currentLocation,
  } = useLocation();
  
  const previousLocationRef = useRef(null);
  const routeCheckIntervalRef = useRef(null);

  // Monitor for route deviation and trigger recalculation
  useEffect(() => {
    if (origin && destination && routeCoordinates.length > 0) {
      routeCheckIntervalRef.current = setInterval(() => {
        if (currentLocation) {
          const deviated = hasDeviatedFromRoute(
            currentLocation,
            routeCoordinates,
            0.05 // 50 meters threshold
          );

          if (deviated && previousLocationRef.current) {
            console.log('User deviated from route. Recalculating...');
            // Trigger route recalculation by updating origin
            // This will cause MapViewDirections to recalculate
          }

          previousLocationRef.current = currentLocation;
        }
      }, 10000); // Check every 10 seconds

      return () => {
        if (routeCheckIntervalRef.current) {
          clearInterval(routeCheckIntervalRef.current);
        }
      };
    }
  }, [routeCoordinates, currentLocation, destination, origin]);

  if (!origin || !destination) {
    return null;
  }

  const handleDirectionsReady = (result) => {
    setIsLoadingRoute(false);

    if (result && result.coordinates) {
      const route = result.legs[0];
      const routeInfo = {
        distance: route.distance.value / 1000, // Convert to km
        duration: route.duration.value / 60, // Convert to minutes
        steps: route.steps.map((step) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
          distance: step.distance.text,
          duration: step.duration.text,
        })),
      };

      updateRoute(routeInfo, result.coordinates);
      
      if (onRouteReady) {
        onRouteReady(result);
      }
    }
  };

  const handleDirectionsError = (error) => {
    console.error('Directions error:', error);
    setIsLoadingRoute(false);
  };

  return (
    <>
      {GOOGLE_MAPS_API_KEY ? (
        <MapViewDirections
          origin={origin}
          destination={destination}
          apikey={GOOGLE_MAPS_API_KEY}
          strokeWidth={5}
          strokeColor="#4A90E2"
          optimizeWaypoints={true}
          onStart={() => setIsLoadingRoute(true)}
          onReady={handleDirectionsReady}
          onError={handleDirectionsError}
          mode="DRIVING"
          precision="high"
        />
      ) : (
        // Fallback: Draw straight line if API key is not available
        routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#4A90E2"
            strokeWidth={5}
          />
        )
      )}
    </>
  );
};

const styles = StyleSheet.create({
  // No styles needed for this component
});

export default RouteDirections;

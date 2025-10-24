import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Polyline } from 'react-native-maps';
import { useLocation } from '../context/LocationContext';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { hasDeviatedFromRoute, decodePolyline } from '../utils/mapHelpers';

// Log API key status on component mount
console.log('🔑 [RouteDirections] API Key loaded:', GOOGLE_MAPS_API_KEY ? 'YES (length: ' + GOOGLE_MAPS_API_KEY.length + ')' : 'NO - MISSING!');

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
  const isFetchingRef = useRef(false);
  const lastFetchKeyRef = useRef(null);

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

  // Fetch route from Google Directions API
  useEffect(() => {
    if (!origin || !destination || !GOOGLE_MAPS_API_KEY) {
      return;
    }

    // Create a unique key for this route request
    const fetchKey = `${origin.latitude},${origin.longitude}-${destination.latitude},${destination.longitude}`;
    
    // Skip if we're already fetching the same route
    if (isFetchingRef.current) {
      return;
    }
    
    // If this is a different route than last time, allow refetch
    if (lastFetchKeyRef.current === fetchKey) {
      return;
    }

    const fetchRoute = async () => {
      isFetchingRef.current = true;
      lastFetchKeyRef.current = fetchKey;
      
      console.log('🚀 [RouteDirections] Fetching route...');
      setIsLoadingRoute(true);
      
      try {
        const originStr = `${origin.latitude},${origin.longitude}`;
        const destStr = `${destination.latitude},${destination.longitude}`;
        
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&key=${GOOGLE_MAPS_API_KEY}&mode=driving`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK' && data.routes.length > 0) {
          const route = data.routes[0];
          const leg = route.legs[0];
          
          console.log('✅ [RouteDirections] Route calculated:', leg.distance.text, '-', leg.duration.text);
          
          // Decode polyline
          const points = decodePolyline(route.overview_polyline.points);
          
          // Extract route information
          const routeInfo = {
            distance: leg.distance.value / 1000, // Convert to km
            duration: leg.duration.value / 60, // Convert to minutes
            steps: leg.steps.map((step) => ({
              instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
              distance: step.distance.text,
              duration: step.duration.text,
            })),
          };
          
          updateRoute(routeInfo, points);
          
          if (onRouteReady) {
            onRouteReady({ coordinates: points, ...data });
          }
        } else {
          console.error('❌ [RouteDirections] API error:', data.status);
        }
      } catch (error) {
        console.error('❌ [RouteDirections] Fetch error:', error.message);
      } finally {
        setIsLoadingRoute(false);
        isFetchingRef.current = false;
      }
    };

    fetchRoute();
  }, [origin?.latitude, origin?.longitude, destination?.latitude, destination?.longitude, GOOGLE_MAPS_API_KEY]);

  if (!origin || !destination) {
    return null;
  }

  return (
    <>
      {routeCoordinates.length > 0 && (
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#4A90E2"
          strokeWidth={5}
          lineCap="round"
          lineJoin="round"
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  // No styles needed for this component
});

export default RouteDirections;

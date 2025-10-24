import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

/**
 * Custom hook for tracking user's real-time location
 * Handles permission requests and provides location updates
 * 
 * @returns {Object} Location state and utilities
 * @returns {Object|null} location - Current location coordinates
 * @returns {string|null} errorMsg - Error message if permission denied or location unavailable
 * @returns {boolean} loading - Whether location is being fetched
 * @returns {Function} refreshLocation - Manually refresh location
 */
const useUserLocation = () => {
  const [location, setLocation] = useState(null);
  const [heading, setHeading] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let locationSubscription = null;

    const startLocationTracking = async () => {
      try {
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setErrorMsg('Location permission denied. Please enable location access in settings.');
          setLoading(false);
          return;
        }

        // Get initial location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        // Start watching position for real-time updates
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10, // Update every 10 meters
            timeInterval: 5000, // Update every 5 seconds
          },
          (newLocation) => {
            setLocation({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        );

        // Subscribe to device heading (if supported)
        try {
          const headingSub = await Location.watchHeadingAsync((h) => {
            const deg = (h && (h.trueHeading || h.magHeading || h.heading)) || null;
            setHeading(deg);
          });
          // attach to subscription for cleanup
          if (locationSubscription) locationSubscription._headingSub = headingSub;
        } catch (e) {
          // ignore if heading not supported
        }

        setLoading(false);
      } catch (error) {
        setErrorMsg('Error fetching location: ' + error.message);
        setLoading(false);
      }
    };

    startLocationTracking();

    // Cleanup subscription on unmount
    return () => {
      if (locationSubscription) {
        try { locationSubscription.remove(); } catch (e) {}
        try { if (locationSubscription._headingSub && typeof locationSubscription._headingSub.remove === 'function') locationSubscription._headingSub.remove(); } catch (e) {}
      }
    };
  }, []);

  /**
   * Manually refresh the current location
   */
  const refreshLocation = async () => {
    try {
      setLoading(true);
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setLoading(false);
    } catch (error) {
      setErrorMsg('Error refreshing location: ' + error.message);
      setLoading(false);
    }
  };

  return { location, errorMsg, loading, refreshLocation, heading };
};

export default useUserLocation;

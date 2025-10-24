import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapViewContainer from '../components/MapViewContainer';
import DestinationSearchBar from '../components/DestinationSearchBar';
import RouteDirections from '../components/RouteDirections';
import LocationDetailsModal from '../components/LocationDetailsModal';
import ActiveJourneyBar from '../components/ActiveJourneyBar';
import NamePlaceModal from '../components/NamePlaceModal';
import SearchHistoryModal from '../components/SearchHistoryModal';
import useUserLocation from '../hooks/useUserLocation';
import { useLocation } from '../context/LocationContext';
import { saveSearchEntry } from '../utils/storage';
import { Dimensions } from 'react-native';
import { GOOGLE_MAPS_API_KEY } from '@env';

/**
 * HomeScreen Component
 * Main screen of the app that integrates all components
 * Handles user location tracking, destination selection, and route display
 */
const HomeScreen = () => {
  const { location, heading, errorMsg, loading } = useUserLocation();
  const { 
    updateCurrentLocation, 
    updateDestination, 
    destination, 
    startJourney, 
    stopJourney,
    clearDestination,
    isJourneyActive 
  } = useLocation();
  
  const [showFullModal, setShowFullModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingCoords, setPendingCoords] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // history modal is opened via a button on the search bar now

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
    console.log('🗺️ [HomeScreen] Map pressed');
    // Ask user to name this place before saving
    setPendingCoords({ latitude: coordinate.latitude, longitude: coordinate.longitude });
    setShowNameModal(true);
  };

  /**
   * Handle place selection from search
   * @param {Object} place - Selected place with coordinates
   */
  const handlePlaceSelect = (place) => {
    console.log('🔍 [HomeScreen] Place selected:', place.name);
    console.log('🔍 [HomeScreen] place object:', place);
    // If name is missing, prompt to name the place
    if (!place.name || place.name.trim().length === 0) {
      setPendingCoords({ latitude: place.latitude, longitude: place.longitude });
      setShowNameModal(true);
      return;
    }

    updateDestination({
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
      address: place.address,
      timestamp: Date.now(), // Add timestamp to force re-render even for same location
    });

    console.log('🔍 [HomeScreen] updateDestination called, forcing details modal to show');

    // Ensure details modal appears after selecting from search/history
    setShowDetailsModal(true);

    // Save to recent searches
    (async () => {
      try {
        await saveSearchEntry({
          name: place.name,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
        });
      } catch (e) {
        console.warn('⚠️ [HomeScreen] saveSearchEntry failed', e?.message || e);
      }
    })();
  };

  /**
   * Handle starting the journey
   */
  const handleStartJourney = () => {
    console.log('🚀 [HomeScreen] Starting journey');
    startJourney();
    // If details modal was forced open, clear that flag when journey starts so modal hides
    setShowDetailsModal(false);
    // Don't show alert, just start the journey silently
  };

  /**
   * Handle canceling the journey
   */
  const handleCancelJourney = () => {
    Alert.alert(
      'End Journey',
      'Are you sure you want to end this journey?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Journey',
          style: 'destructive',
          onPress: () => {
            console.log('🛑 [HomeScreen] Journey cancelled');
            stopJourney();
            clearDestination();
          },
        },
      ]
    );
  };

  /**
   * Handle expanding the minimized journey bar
   */
  const handleExpandJourney = () => {
    setShowFullModal(true);
  };

  // Memoize origin and destination objects to prevent unnecessary re-renders
  const origin = useMemo(() => {
    if (!location) return null;
    return {
      latitude: location.latitude,
      longitude: location.longitude,
    };
  }, [location?.latitude, location?.longitude]);

  const dest = useMemo(() => {
    if (!destination) return null;
    return {
      latitude: destination.latitude,
      longitude: destination.longitude,
    };
  }, [destination?.latitude, destination?.longitude, destination?.timestamp]);

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
  <MapViewContainer userLocation={location ? { ...location, heading } : null} onMapPress={handleMapPress}>
        {/* Route Directions Overlay */}
        {origin && dest && <RouteDirections origin={origin} destination={dest} />}
      </MapViewContainer>

      {/* Search Bar - Hidden during active journey */}
      {!isJourneyActive && (
        <DestinationSearchBar onPlaceSelect={handlePlaceSelect} onOpenHistory={() => setShowHistoryModal(true)} />
      )}

      {/* Location Details Modal - shown when destination exists or forced by selection */}
      <LocationDetailsModal
        onStartJourney={handleStartJourney}
        forceVisible={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />

      {/* Active Journey Bar - Only during journey */}
      <ActiveJourneyBar 
        onExpand={handleExpandJourney}
        onCancel={handleCancelJourney}
      />

      {/* Full Modal during journey (when expanded) */}
      {isJourneyActive && showFullModal && (
        <LocationDetailsModal 
          forceVisible={true}
          onClose={() => setShowFullModal(false)}
          onStartJourney={() => {
            // start journey action should also collapse the expanded modal
            handleStartJourney();
            setShowFullModal(false);
          }}
        />
      )}

      <SearchHistoryModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onSelect={(entry) => {
          // entry: { latitude, longitude, name, address }
          updateDestination({
            latitude: entry.latitude,
            longitude: entry.longitude,
            name: entry.name,
            address: entry.address,
            favorite: entry.favorite,
            timestamp: Date.now(),
          });
          setShowHistoryModal(false);
          setShowDetailsModal(true);
        }}
      />

      {/* Name unknown place modal */}
      <NamePlaceModal
        visible={showNameModal}
        coords={pendingCoords || { latitude: 0, longitude: 0 }}
        defaultName={''}
        onClose={() => {
          setShowNameModal(false);
          setPendingCoords(null);
        }}
        onSave={(entry) => {
          // entry: { latitude, longitude, name }
          updateDestination({
            latitude: entry.latitude,
            longitude: entry.longitude,
            name: entry.name,
            timestamp: Date.now(),
          });
          (async () => {
              try {
                // Attempt reverse geocoding to capture full formatted address
                let address = '';
                try {
                  // Restrict reverse geocoding to Namibia to keep saved addresses local
                  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${entry.latitude},${entry.longitude}&components=country:NA&key=${GOOGLE_MAPS_API_KEY}`;
                  const res = await fetch(url);
                  const data = await res.json();
                  if (data.status === 'OK' && data.results && data.results.length > 0) {
                    address = data.results[0].formatted_address;
                  }
                } catch (ge) {
                  console.warn('⚠️ [HomeScreen] reverse geocode failed', ge?.message || ge);
                }

                await saveSearchEntry({
                  name: entry.name,
                  address,
                  latitude: entry.latitude,
                  longitude: entry.longitude,
                });
              } catch (e) {
                console.warn('⚠️ [HomeScreen] saveSearchEntry failed', e?.message || e);
              }
            })();

          setShowNameModal(false);
          setPendingCoords(null);
        }}
      />

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

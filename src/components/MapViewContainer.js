import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { useLocation } from '../context/LocationContext';
import { loadFavorites, saveSearchEntry } from '../utils/storage';
import { calculateDistance, getBearing } from '../utils/mapHelpers';
import { on } from '../utils/eventBus';

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
  const { updateDestination } = useLocation();
  const [favorites, setFavorites] = useState([]);
  const [bearingDeg, setBearingDeg] = useState(0);
  const rotationAnim = useRef(new Animated.Value(0)).current;
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

  // Load favorites and subscribe to changes so map updates live
  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      try {
        const favs = await loadFavorites();
        console.log('🔔 [MapViewContainer] loaded favorites count=', (favs || []).length);
        (favs || []).forEach((f, i) => console.log('🔔 [MapViewContainer] fav', i, f && f.name, f && f.latitude, f && f.longitude));
        if (mounted) setFavorites(favs || []);
      } catch (e) {
        // ignore
      }
    };
    refresh();
    const off = on('searchHistoryChanged', refresh);
    return () => {
      mounted = false;
      if (typeof off === 'function') off();
    };
  }, []);

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

  // Compute bearing to next route coordinate for directional arrow
  useEffect(() => {
    try {
      if (!userLocation || !routeCoordinates || routeCoordinates.length === 0) return;
      // find nearest point index on route
      let minIdx = 0;
      let minDist = Infinity;
      for (let i = 0; i < routeCoordinates.length; i++) {
        const d = calculateDistance(userLocation, routeCoordinates[i]);
        if (d < minDist) {
          minDist = d;
          minIdx = i;
        }
      }
      const targetIdx = Math.min(minIdx + 1, routeCoordinates.length - 1);
      const target = routeCoordinates[targetIdx];
      const brng = getBearing(userLocation, target);
      if (brng !== null && !Number.isNaN(brng)) {
        const rounded = Math.round(brng);
        console.log('🔔 [MapViewContainer] bearing computed', { rounded, userLocation, targetIdx, routeLen: routeCoordinates.length });
        setBearingDeg(rounded);
      }
    } catch (e) {
      // ignore
    }
  }, [userLocation, routeCoordinates]);

  // Animate rotation to be relative to device heading if available
  useEffect(() => {
    try {
      if (!userLocation) return;
      const heading = userLocation.heading;
      let targetDeg = bearingDeg || 0;
      if (heading !== undefined && heading !== null) {
        targetDeg = ((bearingDeg - heading) % 360 + 360) % 360;
      }
      // Animate to targetDeg smoothly
      Animated.timing(rotationAnim, {
        toValue: targetDeg,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } catch (e) {
      // ignore
    }
  }, [bearingDeg, userLocation?.heading]);
  
  // If we don't yet have a user location, show a loader instead of attempting to render the map
  if (!userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }
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
        onPoiClick={async (e) => {
          try {
            const evt = e && e.nativeEvent;
            console.log('🔔 [MapViewContainer] onPoiClick', evt && (evt.name || evt.placeId));
            if (!evt) return;
            const { placeId, coordinate, name } = evt;
            // If we have a placeId, fetch place details for richer info
            if (placeId && GOOGLE_MAPS_API_KEY) {
              const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,name,formatted_address&key=${GOOGLE_MAPS_API_KEY}`;
              try {
                const res = await fetch(url);
                const data = await res.json();
                const result = data && data.result;
                if (result && result.geometry && result.geometry.location) {
                  const lat = result.geometry.location.lat;
                  const lng = result.geometry.location.lng;
                  const entry = {
                    latitude: lat,
                    longitude: lng,
                    name: result.name || name || 'Selected place',
                    address: result.formatted_address || '',
                    placeId: placeId,
                    favorite: false,
                  };
                  // persist this clicked POI into saved searches so it can be favorited later
                  try { await saveSearchEntry(entry); } catch (e) { console.warn('⚠️ [MapViewContainer] saveSearchEntry failed', e?.message || e); }
                  updateDestination({ ...entry, timestamp: Date.now() });
                  return;
                }
              } catch (err) {
                console.warn('⚠️ [MapViewContainer] failed to fetch place details', err?.message || err);
              }
            }

            // Fallback: use coordinate and name provided by the event
            if (coordinate) {
              const entry = {
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
                name: name || 'Selected place',
                address: '',
                favorite: false,
              };
              try { await saveSearchEntry(entry); } catch (e) { console.warn('⚠️ [MapViewContainer] saveSearchEntry failed', e?.message || e); }
              updateDestination({ ...entry, timestamp: Date.now() });
            }
          } catch (e) {
            console.warn('⚠️ [MapViewContainer] onPoiClick error', e?.message || e);
          }
        }}
        loadingEnabled={true}
      >
        {/* Favorite Markers (from saved searches) */}
        {favorites
          .filter((f) => f && f.latitude !== undefined && f.longitude !== undefined)
          // don't duplicate the currently selected destination marker
          .filter((f) => !(destination && f.latitude === destination.latitude && f.longitude === destination.longitude))
          .map((item) => {
            const key = item.timestamp || item.placeId || `${item.latitude}-${item.longitude}`;
            // Render a native Marker with title/description for better cross-platform reliability
            return (
              <Marker
                key={key}
                coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                title={item.name || 'Favorite'}
                description={item.address || ''}
                pinColor="#F6C90E"
                accessibilityLabel={`Favorite: ${item.name || item.address || 'saved place'}`}
                onPress={() => {
                  try {
                    updateDestination({
                      latitude: item.latitude,
                      longitude: item.longitude,
                      name: item.name,
                      address: item.address,
                      placeId: item.placeId,
                      favorite: true,
                      timestamp: Date.now(),
                    });
                  } catch (e) {
                    console.warn('⚠️ [Map] failed to set favorite as destination', e?.message || e);
                  }
                }}
                tracksViewChanges={false}
              >
                <Callout>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{item.name || item.address || 'Favorite'}</Text>
                    <TouchableOpacity
                      style={styles.calloutBtn}
                      accessibilityLabel={`Set destination to ${item.name || item.address}`}
                      onPress={() => {
                        try {
                          updateDestination({
                            latitude: item.latitude,
                            longitude: item.longitude,
                            name: item.name,
                            address: item.address,
                            placeId: item.placeId,
                            favorite: true,
                            timestamp: Date.now(),
                          });
                        } catch (e) {
                          console.warn('⚠️ [Map] failed to set favorite as destination', e?.message || e);
                        }
                      }}
                    >
                      <Text style={styles.calloutBtnText}>Set destination</Text>
                    </TouchableOpacity>
                  </View>
                </Callout>
              </Marker>
            );
          })}

        {/* Destination Marker */}
        {destination && (
          <Marker
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title={destination.name || 'Destination'}
            description={destination.name || destination.address || 'Selected destination'}
            pinColor={destination.favorite ? '#F6C90E' : 'red'}
          />
        )}

        {/* Render children (e.g., RouteDirections with Polyline) */}
        {children}
      </MapView>

      {/* Directional arrow (top-left) — rendered after MapView so it sits above the map */}
      {userLocation && routeCoordinates && routeCoordinates.length > 0 && (
        <View style={styles.directionContainer} pointerEvents="none">
          <View style={styles.directionInner}>
            <Animated.View style={{ transform: [{ rotate: rotationAnim.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) }], zIndex: 9999 }}>
              <Ionicons name="arrow-up" size={22} color="#fff" />
            </Animated.View>
          </View>
        </View>
      )}

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
  directionContainer: {
    position: 'absolute',
    left: 12,
    top: 56,
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  directionInner: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recenterIcon: {
    fontSize: 22,
  },
  favoriteMarker: {
    width: 34,
    height: 34,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  favoriteMarkerCol: {
    alignItems: 'center',
  },
  favoriteLabelContainer: {
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: 140,
  },
  favoriteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  calloutContainer: {
    minWidth: 140,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  calloutBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  calloutBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default MapViewContainer;

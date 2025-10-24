import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { on as onEvent, off as offEvent } from '../utils/eventBus';
import { Ionicons } from '@expo/vector-icons';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { loadSearchHistory, saveSearchEntry } from '../utils/storage';

/**
 * DestinationSearchBar Component
 * Search bar with Google Places Autocomplete integration
 * Provides real-time place suggestions as user types
 */
const DestinationSearchBar = ({ onPlaceSelect, onOpenHistory }) => {
  const [searchText, setSearchText] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recent, setRecent] = useState([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const items = await loadSearchHistory();
      if (mounted) setRecent((items || []).slice(0, 3));
    })();
    const unsub = onEvent('searchHistoryChanged', async () => {
      const items = await loadSearchHistory();
      if (mounted) setRecent((items || []).slice(0, 3));
    });
    // clear search when a saved search is selected elsewhere (history modal or map)
    const unsubSelect = onEvent('searchSelected', () => {
      if (!mounted) return;
      setSearchText('');
      setPredictions([]);
    });
    return () => {
      mounted = false;
      try { unsub(); } catch (e) {}
      try { unsubSelect(); } catch (e) {}
    };
  }, []);

  /**
   * Fetch place predictions from Google Places API
   */
  const fetchPlacePredictions = async (input) => {
    if (!input || input.length < 3) {
      setPredictions([]);
      return;
    }

    setIsSearching(true);

    try {
      // Restrict autocomplete predictions to Namibia (country code: NA)
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&components=country:na&key=${GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        setPredictions(data.predictions);
      } else {
        setPredictions([]);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setPredictions([]);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Get place details including coordinates
   */
  const getPlaceDetails = async (placeId) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,name,formatted_address&key=${GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        const { geometry, name, formatted_address } = data.result;
        return {
          latitude: geometry.location.lat,
          longitude: geometry.location.lng,
          name: name,
          address: formatted_address,
        };
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
    return null;
  };

  /**
   * Handle text input changes
   */
  const handleChangeText = (text) => {
    setSearchText(text);
    fetchPlacePredictions(text);
  };

  /**
   * Handle place selection
   */
  const handlePlaceSelect = async (prediction) => {
    console.log('🔔 [DestinationSearchBar] autocomplete selection:', prediction.description, 'place_id=', prediction.place_id);
    setSearchText(prediction.description);
    setPredictions([]);
    Keyboard.dismiss();

    const placeDetails = await getPlaceDetails(prediction.place_id);
    if (placeDetails && onPlaceSelect) {
      onPlaceSelect(placeDetails);
      // Save to recent searches
      try {
        await saveSearchEntry({
          placeId: prediction.place_id,
          name: placeDetails.name,
          address: placeDetails.address,
          latitude: placeDetails.latitude,
          longitude: placeDetails.longitude,
        });
  const items = await loadSearchHistory();
  setRecent((items || []).slice(0, 3));
        // Clear the search input after selection
        setSearchText('');
        setPredictions([]);
      } catch (e) {
        console.warn('⚠️ [DestinationSearchBar] saveRecent failed', e?.message || e);
      }
    }
  };

  /**
   * Clear search
   */
  const handleClear = () => {
    setSearchText('');
    setPredictions([]);
  };

  return (
    <View style={[styles.container, { top: insets.top + 10 }]}>
      <View style={styles.searchBar}>
  <Ionicons name="search" size={18} color="#333" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Search for a destination..."
          value={searchText}
          onChangeText={handleChangeText}
          returnKeyType="search"
          placeholderTextColor="#999"
        />
        {isSearching && <ActivityIndicator size="small" color="#4A90E2" />}
        {searchText.length > 0 && !isSearching && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Ionicons name="close" size={14} color="#666" />
          </TouchableOpacity>
        )}

        {/* History button on the right side of the search bar */}
        <TouchableOpacity style={styles.historyButton} onPress={() => onOpenHistory && onOpenHistory()}>
          <Ionicons name="book-outline" size={18} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Predictions dropdown */}
      {/* Recent searches */}
      {recent.length > 0 && searchText.length === 0 && (
        <View style={styles.predictionsContainer}>
          <FlatList
            data={recent}
            keyExtractor={(item) => `${item.placeId || item.timestamp}-${item.latitude}-${item.longitude}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.predictionItem}
                onPress={async () => {
                  console.log('🔔 [DestinationSearchBar] recent selection:', item.name || item.address, item);
                  Keyboard.dismiss();
                  // clear search bar when selecting a recent item
                  setSearchText('');
                  setPredictions([]);
                  if (onPlaceSelect) onPlaceSelect({
                    latitude: item.latitude,
                    longitude: item.longitude,
                    name: item.name,
                    address: item.address,
                    favorite: item.favorite,
                  });
                  // refresh timestamp in storage
                  try {
                    await saveSearchEntry(item);
                    const items = await loadSearchHistory();
                    setRecent((items || []).slice(0, 3));
                  } catch (err) {
                    console.warn('⚠️ [DestinationSearchBar] refreshRecent failed', err?.message || err);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>🕘</Text>
                </View>
                <View style={styles.predictionTextContainer}>
                  <Text style={styles.mainText} numberOfLines={1}>
                    {item.name || item.address}
                  </Text>
                  <Text style={styles.secondaryText} numberOfLines={1}>
                    {item.address}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {predictions.length > 0 && (
        <View style={styles.predictionsContainer}>
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.predictionItem}
                onPress={() => handlePlaceSelect(item)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>📍</Text>
                </View>
                <View style={styles.predictionTextContainer}>
                  <Text style={styles.mainText} numberOfLines={1}>
                    {item.structured_formatting.main_text}
                  </Text>
                  <Text style={styles.secondaryText} numberOfLines={1}>
                    {item.structured_formatting.secondary_text}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    zIndex: 1000,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  clearText: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  historyButton: {
    marginLeft: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyIcon: {
    fontSize: 18,
  },
  predictionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginTop: 10,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  predictionTextContainer: {
    flex: 1,
  },
  mainText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 3,
  },
  secondaryText: {
    fontSize: 13,
    color: '#999',
  },
});

export default DestinationSearchBar;

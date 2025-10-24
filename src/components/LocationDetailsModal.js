import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocation } from '../context/LocationContext';
import { toggleFavorite } from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { formatDistance, formatDuration } from '../utils/mapHelpers';

const { height } = Dimensions.get('window');

/**
 * LocationDetailsModal Component
 * Modal that shows location details and Start Journey button
 * Similar to Google Maps/Uber interface
 */
const LocationDetailsModal = ({ onStartJourney, forceVisible = false, onClose }) => {
  const insets = useSafeAreaInsets();
  const { destination, routeInfo, isLoadingRoute, clearDestination, isJourneyActive, setDestinationMeta } = useLocation();
  const [visible, setVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(height));

  // Close modal when journey starts (hide only, don't clear destination)
  useEffect(() => {
    if (isJourneyActive && !forceVisible) {
      // hide modal without clearing destination
      handleClose(false);
    }
  }, [isJourneyActive, forceVisible]);

  useEffect(() => {
    // Show if there is a destination and either we are not in a journey OR parent forces visibility
    if (destination && (!isJourneyActive || forceVisible)) {
      console.log('✅ [Modal] Showing for:', destination?.name, 'forceVisible=', forceVisible, 'isJourneyActive=', isJourneyActive);
      console.log('🔍 [Modal] about to set visible=true, slideAnim current=', slideAnim && slideAnim.__getValue ? slideAnim.__getValue() : 'n/a');
      setVisible(true);
      // Use JS driver for now to avoid native-driver edge cases on some devices
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: false,
        tension: 65,
        friction: 11,
      }).start(() => {
        console.log('🔍 [Modal] spring animation completed, slideAnim=', slideAnim && slideAnim.__getValue ? slideAnim.__getValue() : 'n/a');
      });
    } else {
      console.log('🔍 [Modal] hiding (destination present?)', !!destination, 'forceVisible=', forceVisible, 'isJourneyActive=', isJourneyActive);
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        console.log('🔍 [Modal] hide animation completed, setting visible=false');
        setVisible(false);
      });
    }
  }, [destination, isJourneyActive, forceVisible]);

  /**
   * Close the modal.
   * @param {boolean} shouldClear - when true (default) clear destination from context; when false just hide modal
   */
  const handleClose = (shouldClear = true) => {
    console.log('🧭 [LocationDetailsModal] handleClose called, shouldClear=', shouldClear);
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      setVisible(false);
      if (shouldClear) {
        clearDestination();
      } else if (onClose && typeof onClose === 'function') {
        // Inform parent to collapse the expanded modal (during active journey)
        try {
          onClose();
        } catch (err) {
          console.log('❌ [LocationDetailsModal] onClose callback error', err.message);
        }
      }
    });
  };

  const handleStartJourney = () => {
    if (onStartJourney) {
      onStartJourney();
    }
  };

  const handleToggleFavorite = async () => {
    if (!destination) return;
    try {
      // Prefer matching by placeId when available, fallback to lat/lng
      const matcher = destination.placeId
        ? { placeId: destination.placeId }
        : { latitude: destination.latitude, longitude: destination.longitude };
      await toggleFavorite(matcher);
      // update context destination meta so UI reflects change immediately
      if (setDestinationMeta) setDestinationMeta({ favorite: !destination.favorite });
    } catch (e) {
      console.warn('⚠️ [LocationDetailsModal] toggleFavorite failed', e?.message || e);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={() => handleClose(true)}
    >
      <View style={styles.overlay}>
        {/* Backdrop area - pressing this will clear the destination (unless forced visible during journey) */}
        <Pressable
          style={styles.backdrop}
          onPress={() => handleClose(forceVisible ? false : true)}
        />
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          <View>
            {/* Handle Bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="location-outline" size={28} color="#4A90E2" style={{ marginRight: 12 }} />
                <View style={styles.headerTextContainer}>
                  <Text style={styles.locationName} numberOfLines={1}>
                    {destination?.name || 'Selected Location'}
                  </Text>
                  {destination?.address && (
                    <Text style={styles.locationAddress} numberOfLines={2}>
                      {destination.address}
                    </Text>
                  )}
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity style={[styles.favoriteButton, destination?.favorite && styles.favoriteActive]} onPress={handleToggleFavorite}>
                  <Ionicons name={destination?.favorite ? 'star' : 'star-outline'} size={18} color={destination?.favorite ? '#F6C90E' : '#6B7280'} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeButton} onPress={() => handleClose(true)}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Route Info */}
            {isLoadingRoute ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Calculating route...</Text>
              </View>
            ) : routeInfo ? (
              <View style={styles.routeInfoContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{formatDistance(routeInfo.distance)}</Text>
                  <Text style={styles.statLabel}>Distance</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{formatDuration(routeInfo.duration)}</Text>
                  <Text style={styles.statLabel}>Duration</Text>
                </View>
              </View>
            ) : null}

            {/* Start Journey Button */}
            <TouchableOpacity
              style={[
                styles.startButton,
                !routeInfo && styles.startButtonDisabled,
              ]}
              onPress={handleStartJourney}
              disabled={!routeInfo}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>
                {routeInfo ? 'Start Journey' : 'Calculating...'}
              </Text>
            </TouchableOpacity>

            {/* Turn-by-Turn Directions */}
            {routeInfo && routeInfo.steps && routeInfo.steps.length > 0 && (
              <View style={styles.directionsContainer}>
                <Text style={styles.directionsTitle}>
                  Directions ({routeInfo.steps.length} steps)
                </Text>
                <ScrollView
                  style={styles.directionsScroll}
                  showsVerticalScrollIndicator={true}
                >
                  {routeInfo.steps.map((step, index) => (
                    <View key={index} style={styles.directionStep}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepInstruction}>{step.instruction}</Text>
                        <Text style={styles.stepDetails}>
                          {step.distance} • {step.duration}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: height * 0.75,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  locationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  favoriteActive: {
    backgroundColor: '#FFF4D9',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  routeInfoContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  startButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  startButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  directionsContainer: {
    maxHeight: 200,
  },
  directionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  directionsScroll: {
    maxHeight: 180,
  },
  directionStep: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 20,
  },
  stepDetails: {
    fontSize: 13,
    color: '#6B7280',
  },
});

export default LocationDetailsModal;

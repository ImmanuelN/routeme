import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocation } from '../context/LocationContext';
import { Ionicons } from '@expo/vector-icons';
import { formatDistance, formatDuration, calculateDistance, remainingDistanceAlongRoute } from '../utils/mapHelpers';

/**
 * ActiveJourneyBar Component
 * Minimized navigation bar shown during active journey
 * Shows current instruction and ETA
 */
const ActiveJourneyBar = ({ onExpand, onCancel }) => {
  const insets = useSafeAreaInsets();
  const { routeInfo, isJourneyActive, destination, currentLocation, routeCoordinates } = useLocation();

  // Animated percent value and helpers must be declared unconditionally to preserve hook order
  const animatedPercent = useRef(new Animated.Value(0)).current;

  const computePercent = () => {
    try {
      const totalKm = routeInfo?.distance || 0; // in km
      if (!currentLocation || !destination || totalKm <= 0) return 0;

      // Prefer route-based remaining distance
      let remainingKm = null;
      if (routeCoordinates && routeCoordinates.length > 0) {
        remainingKm = remainingDistanceAlongRoute(currentLocation, routeCoordinates);
      }

      // Fallback to straight-line
      if (remainingKm === null || Number.isNaN(remainingKm)) {
        remainingKm = calculateDistance(currentLocation, { latitude: destination.latitude, longitude: destination.longitude });
      }

      const prog = (totalKm - remainingKm) / totalKm;
      const pct = Math.max(0, Math.min(100, Math.round(prog * 100)));
      return pct;
    } catch (e) {
      return 0;
    }
  };
  // Update animation when location/route changes — declared unconditionally to keep Hooks order stable
  useEffect(() => {
    const pct = computePercent();
    Animated.timing(animatedPercent, {
      toValue: pct,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [currentLocation?.latitude, currentLocation?.longitude, destination?.latitude, destination?.longitude, routeInfo?.distance, routeCoordinates && routeCoordinates.length]);

  if (!isJourneyActive || !routeInfo) {
    return null;
  }

  // Get the first step as current instruction
  const currentInstruction = routeInfo.steps?.[0]?.instruction || 'Continue on route';
  // Show total route distance (keep consistent with LocationDetailsModal)
  const totalDistanceKm = routeInfo?.distance || 0;
  const distanceLabel = formatDistance(totalDistanceKm);

  return (
    <View style={[styles.container, { bottom: insets.bottom + 20 }]}>
      <TouchableOpacity
        style={styles.infoArea}
        onPress={onExpand}
        activeOpacity={0.9}
      >
        <View style={styles.leftContent}>
          <View style={styles.instructionContainer}>
            {destination?.name && (
              <Text style={styles.destinationText}>{destination.name} </Text>
            )}
            {destination?.favorite && (
              <Ionicons name="star" size={16} color="#F6C90E" style={{ marginBottom: 6 }} />
            )}
            <Text style={styles.distanceText}>{distanceLabel}</Text>
            <Text style={styles.instructionText} numberOfLines={1}>
              {currentInstruction}
            </Text>
          </View>
          <View style={styles.progressBarRow}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: animatedPercent.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) },
                ]}
              />
            </View>
            <Text style={styles.percentText}>{Math.round(animatedPercent && animatedPercent.__getValue ? animatedPercent.__getValue() : 0)}%</Text>
          </View>
        </View>

      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButtonInline}
        onPress={onCancel}
        activeOpacity={0.8}
      >
        <Text style={styles.cancelText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
    overflow: 'hidden',
  },
  infoArea: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 12,
  },
  leftContent: {
    flex: 1,
  },
  instructionContainer: {
    flex: 1,
    marginRight: 8,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  etaContainer: {
    alignItems: 'flex-end',
  },
  etaLabel: {
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  etaValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  percentText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'right',
  },
  progressFill: {
    height: '100%',
    width: '30%',
    backgroundColor: '#4A90E2',
    borderRadius: 2,
  },
  cancelButtonInline: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  cancelText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default ActiveJourneyBar;

import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocation } from '../context/LocationContext';
import { formatDistance, formatDuration } from '../utils/mapHelpers';

/**
 * LocationDetailsSheet Component
 * Bottom sheet that shows location details and Start Journey button
 * Similar to Google Maps/Uber interface
 */
const LocationDetailsSheet = ({ onStartJourney }) => {
  const bottomSheetRef = useRef(null);
  const insets = useSafeAreaInsets();
  const { destination, routeInfo, isLoadingRoute, clearDestination } = useLocation();

  // Snap points for the bottom sheet
  const snapPoints = useMemo(() => ['25%', '50%', '75%'], []);

  // Show/hide bottom sheet based on destination
  useEffect(() => {
    if (destination) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [destination]);

  if (!destination) {
    return null;
  }

  const handleStartJourney = () => {
    if (onStartJourney) {
      onStartJourney();
    }
    // Keep sheet at minimum height when journey starts
    bottomSheetRef.current?.snapToIndex(0);
  };

  const handleClose = () => {
    clearDestination();
    bottomSheetRef.current?.close();
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onClose={handleClose}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <View style={[styles.contentContainer, { paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.locationIcon}>📍</Text>
            <View style={styles.headerTextContainer}>
              <Text style={styles.locationName} numberOfLines={1}>
                {destination.name || 'Selected Location'}
              </Text>
              {destination.address && (
                <Text style={styles.locationAddress} numberOfLines={2}>
                  {destination.address}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
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
            <Text style={styles.directionsTitle}>Directions</Text>
            <ScrollView
              style={styles.directionsScroll}
              showsVerticalScrollIndicator={false}
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
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
  },
  handleIndicator: {
    backgroundColor: '#D1D5DB',
    width: 40,
    height: 4,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
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
    flex: 1,
  },
  directionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  directionsScroll: {
    flex: 1,
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

export default LocationDetailsSheet;

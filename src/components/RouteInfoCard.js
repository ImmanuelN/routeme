import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useLocation } from '../context/LocationContext';
import { formatDistance, formatDuration } from '../utils/mapHelpers';

/**
 * RouteInfoCard Component
 * Displays route information including ETA, distance, and turn-by-turn steps
 * Shows at the bottom of the screen when a route is active
 */
const RouteInfoCard = () => {
  const { routeInfo, destination, clearDestination, isLoadingRoute } =
    useLocation();

  if (!destination && !isLoadingRoute) {
    return null;
  }

  return (
    <View style={styles.container}>
      {isLoadingRoute ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Calculating route...</Text>
        </View>
      ) : routeInfo ? (
        <>
          {/* Route Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Distance</Text>
              <Text style={styles.summaryValue}>
                {formatDistance(routeInfo.distance)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>ETA</Text>
              <Text style={styles.summaryValue}>
                {formatDuration(routeInfo.duration)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={clearDestination}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Turn-by-Turn Steps */}
          {routeInfo.steps && routeInfo.steps.length > 0 && (
            <ScrollView
              style={styles.stepsContainer}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.stepsTitle}>Directions</Text>
              {routeInfo.steps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepInstruction}>
                      {step.instruction}
                    </Text>
                    <Text style={styles.stepDetails}>
                      {step.distance} • {step.duration}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </>
      ) : (
        <View style={styles.noRouteContainer}>
          <Text style={styles.noRouteText}>
            Tap on the map to set a destination
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: '50%',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  stepsContainer: {
    maxHeight: 300,
    paddingHorizontal: 20,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
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
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  stepDetails: {
    fontSize: 12,
    color: '#999',
  },
  noRouteContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noRouteText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default RouteInfoCard;

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocation } from '../context/LocationContext';
import { formatDistance, formatDuration } from '../utils/mapHelpers';

/**
 * ActiveJourneyBar Component
 * Minimized navigation bar shown during active journey
 * Shows current instruction and ETA
 */
const ActiveJourneyBar = ({ onExpand, onCancel }) => {
  const insets = useSafeAreaInsets();
  const { routeInfo, isJourneyActive } = useLocation();

  if (!isJourneyActive || !routeInfo) {
    return null;
  }

  // Get the first step as current instruction
  const currentInstruction = routeInfo.steps?.[0]?.instruction || 'Continue on route';
  const nextDistance = routeInfo.steps?.[0]?.distance || '';

  return (
    <View style={[styles.container, { bottom: insets.bottom + 20 }]}>
      <TouchableOpacity
        style={styles.infoArea}
        onPress={onExpand}
        activeOpacity={0.9}
      >
        <View style={styles.leftContent}>
          <View style={styles.instructionContainer}>
            <Text style={styles.distanceText}>{nextDistance}</Text>
            <Text style={styles.instructionText} numberOfLines={1}>
              {currentInstruction}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
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

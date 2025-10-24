/**
 * Map Helper Utilities
 * Contains helper functions for map calculations and operations
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} coord1 - First coordinate {latitude, longitude}
 * @param {Object} coord2 - Second coordinate {latitude, longitude}
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (coord1, coord2) => {
  const toRad = (value) => (value * Math.PI) / 180;

  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
      Math.cos(toRad(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Check if user has deviated from the route
 * @param {Object} currentLocation - Current user location
 * @param {Array} routeCoordinates - Array of route coordinates
 * @param {number} threshold - Distance threshold in meters (default: 50)
 * @returns {boolean} True if deviated from route
 */
export const hasDeviatedFromRoute = (
  currentLocation,
  routeCoordinates,
  threshold = 0.05 // 50 meters in km
) => {
  if (!currentLocation || !routeCoordinates || routeCoordinates.length === 0) {
    return false;
  }

  // Find minimum distance to any point on the route
  let minDistance = Infinity;

  for (const coord of routeCoordinates) {
    const distance = calculateDistance(currentLocation, coord);
    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance > threshold;
};

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(2)} km`;
};

/**
 * Format duration for display
 * @param {number} duration - Duration in minutes
 * @returns {string} Formatted duration string
 */
export const formatDuration = (duration) => {
  if (duration < 60) {
    return `${Math.round(duration)} min`;
  }
  const hours = Math.floor(duration / 60);
  const minutes = Math.round(duration % 60);
  return `${hours}h ${minutes}m`;
};

/**
 * Get the region that fits all coordinates
 * @param {Array} coordinates - Array of coordinate objects
 * @returns {Object} Region object with latitude, longitude, and deltas
 */
export const getRegionForCoordinates = (coordinates) => {
  if (!coordinates || coordinates.length === 0) {
    return null;
  }

  let minLat = coordinates[0].latitude;
  let maxLat = coordinates[0].latitude;
  let minLng = coordinates[0].longitude;
  let maxLng = coordinates[0].longitude;

  coordinates.forEach((coord) => {
    minLat = Math.min(minLat, coord.latitude);
    maxLat = Math.max(maxLat, coord.latitude);
    minLng = Math.min(minLng, coord.longitude);
    maxLng = Math.max(maxLng, coord.longitude);
  });

  const latitudeDelta = (maxLat - minLat) * 1.5; // Add 50% padding
  const longitudeDelta = (maxLng - minLng) * 1.5;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(latitudeDelta, 0.02), // Minimum zoom level
    longitudeDelta: Math.max(longitudeDelta, 0.02),
  };
};

/**
 * Decode polyline from Google Directions API
 * @param {string} encoded - Encoded polyline string
 * @returns {Array} Array of coordinate objects
 */
export const decodePolyline = (encoded) => {
  if (!encoded) {
    return [];
  }

  const poly = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return poly;
};

/**
 * Estimate remaining distance along a route polyline from the current location.
 * Strategy: find the nearest point on the polyline (by point sampling) and
 * sum the distances from that point to the end of the route. This is an
 * approximation but much more accurate than straight-line to the destination.
 *
 * @param {Object} currentLocation - { latitude, longitude }
 * @param {Array} routeCoordinates - Array of { latitude, longitude }
 * @returns {number|null} Remaining distance in kilometers, or null if unavailable
 */
export const remainingDistanceAlongRoute = (currentLocation, routeCoordinates) => {
  if (!currentLocation || !routeCoordinates || routeCoordinates.length === 0) return null;

  // Find the nearest sampled point on the route
  let minIdx = 0;
  let minDist = Infinity;
  for (let i = 0; i < routeCoordinates.length; i++) {
    const d = calculateDistance(currentLocation, routeCoordinates[i]);
    if (d < minDist) {
      minDist = d;
      minIdx = i;
    }
  }

  // Remaining distance = distance from current to nearest point + sum of remaining segments
  let remaining = minDist;
  for (let i = minIdx; i < routeCoordinates.length - 1; i++) {
    remaining += calculateDistance(routeCoordinates[i], routeCoordinates[i + 1]);
  }

  return remaining;
};

/**
 * Calculate initial bearing (forward azimuth) from coord1 to coord2 in degrees
 * @param {Object} from - { latitude, longitude }
 * @param {Object} to - { latitude, longitude }
 * @returns {number} Bearing in degrees (0-360), or null if input invalid
 */
export const getBearing = (from, to) => {
  if (!from || !to) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const dLon = toRad(to.longitude - from.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  let brng = toDeg(Math.atan2(y, x));
  brng = (brng + 360) % 360;
  return brng;
};

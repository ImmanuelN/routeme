import React, { createContext, useState, useContext } from 'react';

/**
 * Location Context for managing global location state
 * Provides current location, destination, and route information across the app
 */
const LocationContext = createContext();

/**
 * Custom hook to access LocationContext
 * @throws {Error} If used outside LocationProvider
 */
export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

/**
 * LocationProvider component
 * Wraps the app to provide location state management
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export const LocationProvider = ({ children }) => {
  // Current user location
  const [currentLocation, setCurrentLocation] = useState(null);
  
  // Selected destination
  const [destination, setDestination] = useState(null);
  
  // Route information (distance, duration, steps)
  const [routeInfo, setRouteInfo] = useState(null);
  
  // Route coordinates for drawing polyline
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  
  // Loading state for route calculation
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Journey state (whether navigation has started)
  const [isJourneyActive, setIsJourneyActive] = useState(false);

  /**
   * Update current user location
   * @param {Object} location - Location object with latitude and longitude
   */
  const updateCurrentLocation = (location) => {
    setCurrentLocation(location);
  };

  /**
   * Set a new destination and clear previous route
   * @param {Object} dest - Destination object with latitude and longitude
   */
  const updateDestination = (dest) => {
    console.log('🎯 [Context] New destination:', dest.name);
    setDestination(dest);
    // Clear previous route when new destination is set
    setRouteCoordinates([]);
    setRouteInfo(null);
    // Set loading to true immediately when new destination is selected
    setIsLoadingRoute(true);
  };

  /**
   * Merge arbitrary fields into the current destination (useful for toggling favorite flag)
   * @param {Object} updates - partial destination fields to merge
   */
  const setDestinationMeta = (updates) => {
    setDestination((prev) => {
      if (!prev) return { ...updates };
      return { ...prev, ...updates };
    });
  };

  /**
   * Clear destination and route information
   */
  const clearDestination = () => {
    console.log('🧹 [Context] Clearing destination');
    setDestination(null);
    setRouteCoordinates([]);
    setRouteInfo(null);
    setIsJourneyActive(false);
  };

  /**
   * Start the journey/navigation
   */
  const startJourney = () => {
    console.log('🚀 [Context] Journey started');
    setIsJourneyActive(true);
  };

  /**
   * Stop the journey/navigation
   */
  const stopJourney = () => {
    console.log('🛑 [Context] Journey stopped');
    setIsJourneyActive(false);
  };

  /**
   * Update route information
   * @param {Object} info - Route information (distance, duration, steps)
   * @param {Array} coordinates - Array of coordinate objects for the route
   */
  const updateRoute = (info, coordinates) => {
    console.log('🗺️ [Context] Route updated:', info.distance.toFixed(1) + 'km,', info.duration.toFixed(0) + 'min');
    setRouteInfo(info);
    setRouteCoordinates(coordinates);
  };

  const value = {
    currentLocation,
    destination,
    routeInfo,
    routeCoordinates,
    isLoadingRoute,
    isJourneyActive,
    updateCurrentLocation,
    updateDestination,
    clearDestination,
    updateRoute,
    setIsLoadingRoute,
    startJourney,
    stopJourney,
    setDestinationMeta,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationContext;

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
    setDestination(dest);
    // Clear previous route when new destination is set
    setRouteCoordinates([]);
    setRouteInfo(null);
  };

  /**
   * Clear destination and route information
   */
  const clearDestination = () => {
    setDestination(null);
    setRouteCoordinates([]);
    setRouteInfo(null);
  };

  /**
   * Update route information
   * @param {Object} info - Route information (distance, duration, steps)
   * @param {Array} coordinates - Array of coordinate objects for the route
   */
  const updateRoute = (info, coordinates) => {
    setRouteInfo(info);
    setRouteCoordinates(coordinates);
  };

  const value = {
    currentLocation,
    destination,
    routeInfo,
    routeCoordinates,
    isLoadingRoute,
    updateCurrentLocation,
    updateDestination,
    clearDestination,
    updateRoute,
    setIsLoadingRoute,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationContext;

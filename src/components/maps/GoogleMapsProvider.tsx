'use client';

/**
 * Google Maps Provider
 * Provides Google Maps context and lazy loading
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useJsApiLoader, Libraries } from '@react-google-maps/api';
import { getGoogleMapsApiKey } from '@/lib/firebase/config/environments';

// Libraries to load - must be static to prevent re-renders
const libraries: Libraries = ['places', 'geometry', 'drawing'];

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | null;
  apiKey: string | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: null,
  apiKey: null,
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

interface GoogleMapsProviderProps {
  children: ReactNode;
}

// Track if Google Maps is already loaded globally
let isGoogleMapsLoaded = false;

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [apiKey] = useState<string | null>(() => getGoogleMapsApiKey() || null);
  
  // Check if Google Maps is already available
  const isAlreadyLoaded = typeof window !== 'undefined' && 
    window.google?.maps?.places !== undefined;

  const { isLoaded: hookLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    libraries,
    // Prevent loading if already loaded
    preventGoogleFontsLoading: true,
  });

  // Track global load state
  useEffect(() => {
    if (hookLoaded || isAlreadyLoaded) {
      isGoogleMapsLoaded = true;
    }
  }, [hookLoaded, isAlreadyLoaded]);

  const isLoaded = hookLoaded || isAlreadyLoaded || isGoogleMapsLoaded;

  if (!apiKey) {
    return (
      <GoogleMapsContext.Provider value={{ isLoaded: false, loadError: new Error('Google Maps API key not configured'), apiKey: null }}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError: loadError || null, apiKey }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

/**
 * Higher-order component to wrap components that need Google Maps
 */
export function withGoogleMaps<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> {
  return function WithGoogleMapsWrapper(props: P) {
    return (
      <GoogleMapsProvider>
        <WrappedComponent {...props} />
      </GoogleMapsProvider>
    );
  };
}

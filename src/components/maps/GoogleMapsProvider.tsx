'use client';

/**
 * Google Maps Provider
 * Provides Google Maps context and lazy loading
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LoadScript, Libraries } from '@react-google-maps/api';
import { getGoogleMapsApiKey } from '@/lib/firebase/config/environments';

// Libraries to load
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

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    const key = getGoogleMapsApiKey();
    if (key) {
      setApiKey(key);
    } else {
      setLoadError(new Error('Google Maps API key not configured'));
    }
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback((error: Error) => {
    setLoadError(error);
  }, []);

  if (!apiKey) {
    return (
      <GoogleMapsContext.Provider value={{ isLoaded: false, loadError, apiKey: null }}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={libraries}
      onLoad={handleLoad}
      onError={handleError}
      loadingElement={<div className="flex items-center justify-center p-4">Loading Maps...</div>}
    >
      <GoogleMapsContext.Provider value={{ isLoaded, loadError, apiKey }}>
        {children}
      </GoogleMapsContext.Provider>
    </LoadScript>
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

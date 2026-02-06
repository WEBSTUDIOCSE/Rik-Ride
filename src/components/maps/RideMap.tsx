'use client';

/**
 * RideMap Component
 * Displays ride route, pickup/dropoff locations, and live driver location
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  Circle,
  InfoWindow,
} from '@react-google-maps/api';
import { useGoogleMaps } from './GoogleMapsProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Map container style
const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px',
};

// Default center (India - Delhi NCR)
const defaultCenter = {
  lat: 28.6139,
  lng: 77.209,
};

// Custom map styles for better visibility
const mapStyles = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface RideMapProps {
  pickup?: Location;
  dropoff?: Location;
  driverLocation?: Location;
  showRoute?: boolean;
  showDriverRadius?: boolean;
  driverRadiusMeters?: number;
  height?: string;
  onMapClick?: (location: Location) => void;
  className?: string;
  interactive?: boolean;
}

export function RideMap({
  pickup,
  dropoff,
  driverLocation,
  showRoute = true,
  showDriverRadius = false,
  driverRadiusMeters = 500,
  height = '400px',
  onMapClick,
  className = '',
  interactive = true,
}: RideMapProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<'pickup' | 'dropoff' | 'driver' | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Calculate directions when pickup and dropoff are set
  useEffect(() => {
    if (!isLoaded || !pickup || !dropoff || !showRoute) {
      setDirections(null);
      return;
    }

    setIsLoadingRoute(true);

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: { lat: pickup.lat, lng: pickup.lng },
        destination: { lat: dropoff.lat, lng: dropoff.lng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        setIsLoadingRoute(false);
        if (status === 'OK' && result) {
          setDirections(result);
        } else {
          console.error('Directions request failed:', status);
          setDirections(null);
        }
      }
    );
  }, [isLoaded, pickup, dropoff, showRoute]);

  // Fit bounds to show all markers
  useEffect(() => {
    if (!map || !isLoaded) return;

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    if (pickup) {
      bounds.extend({ lat: pickup.lat, lng: pickup.lng });
      hasPoints = true;
    }
    if (dropoff) {
      bounds.extend({ lat: dropoff.lat, lng: dropoff.lng });
      hasPoints = true;
    }
    if (driverLocation) {
      bounds.extend({ lat: driverLocation.lat, lng: driverLocation.lng });
      hasPoints = true;
    }

    if (hasPoints) {
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [map, isLoaded, pickup, dropoff, driverLocation]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!interactive || !onMapClick || !e.latLng) return;

      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      // Reverse geocode to get address
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        const address = status === 'OK' && results?.[0]
          ? results[0].formatted_address
          : undefined;
        
        onMapClick({ lat, lng, address });
      });
    },
    [interactive, onMapClick]
  );

  // Route info from directions
  const routeInfo = useMemo(() => {
    if (!directions?.routes?.[0]?.legs?.[0]) return null;
    const leg = directions.routes[0].legs[0];
    return {
      distance: leg.distance?.text || '',
      duration: leg.duration?.text || '',
      distanceValue: leg.distance?.value || 0,
      durationValue: leg.duration?.value || 0,
    };
  }, [directions]);

  const mapContainerStyle = useMemo(
    () => ({
      ...containerStyle,
      height,
    }),
    [height]
  );

  if (loadError) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-destructive">
            <p>Failed to load map: {loadError.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className={className}>
        <CardContent className="p-0">
          <Skeleton style={mapContainerStyle} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="relative">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={pickup || driverLocation || defaultCenter}
            zoom={13}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onClick={handleMapClick}
            options={{
              styles: mapStyles,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
              zoomControl: true,
              clickableIcons: false,
            }}
          >
            {/* Pickup Marker */}
            {pickup && (
              <Marker
                position={{ lat: pickup.lat, lng: pickup.lng }}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 24 16 24s16-13 16-24c0-8.837-7.163-16-16-16z" fill="#22c55e"/>
                      <circle cx="16" cy="16" r="8" fill="white"/>
                      <circle cx="16" cy="16" r="4" fill="#22c55e"/>
                    </svg>
                  `),
                  scaledSize: new google.maps.Size(32, 40),
                  anchor: new google.maps.Point(16, 40),
                }}
                onClick={() => setSelectedMarker('pickup')}
              />
            )}

            {/* Dropoff Marker */}
            {dropoff && (
              <Marker
                position={{ lat: dropoff.lat, lng: dropoff.lng }}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 24 16 24s16-13 16-24c0-8.837-7.163-16-16-16z" fill="#ef4444"/>
                      <circle cx="16" cy="16" r="8" fill="white"/>
                      <rect x="12" y="12" width="8" height="8" fill="#ef4444"/>
                    </svg>
                  `),
                  scaledSize: new google.maps.Size(32, 40),
                  anchor: new google.maps.Point(16, 40),
                }}
                onClick={() => setSelectedMarker('dropoff')}
              />
            )}

            {/* Driver Marker */}
            {driverLocation && (
              <>
                <Marker
                  position={{ lat: driverLocation.lat, lng: driverLocation.lng }}
                  icon={{
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="20" r="18" fill="#3b82f6" stroke="white" stroke-width="3"/>
                        <path d="M20 10 L28 25 L20 22 L12 25 Z" fill="white"/>
                      </svg>
                    `),
                    scaledSize: new google.maps.Size(40, 40),
                    anchor: new google.maps.Point(20, 20),
                  }}
                  onClick={() => setSelectedMarker('driver')}
                />

                {/* Driver radius circle */}
                {showDriverRadius && (
                  <Circle
                    center={{ lat: driverLocation.lat, lng: driverLocation.lng }}
                    radius={driverRadiusMeters}
                    options={{
                      fillColor: '#3b82f6',
                      fillOpacity: 0.1,
                      strokeColor: '#3b82f6',
                      strokeOpacity: 0.3,
                      strokeWeight: 1,
                    }}
                  />
                )}
              </>
            )}

            {/* Route */}
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: '#3b82f6',
                    strokeWeight: 5,
                    strokeOpacity: 0.8,
                  },
                }}
              />
            )}

            {/* Info Windows */}
            {selectedMarker === 'pickup' && pickup && (
              <InfoWindow
                position={{ lat: pickup.lat, lng: pickup.lng }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2">
                  <p className="font-semibold text-green-600">Pickup Location</p>
                  <p className="text-sm text-muted-foreground">{pickup.address || 'Selected location'}</p>
                </div>
              </InfoWindow>
            )}

            {selectedMarker === 'dropoff' && dropoff && (
              <InfoWindow
                position={{ lat: dropoff.lat, lng: dropoff.lng }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2">
                  <p className="font-semibold text-red-600">Dropoff Location</p>
                  <p className="text-sm text-muted-foreground">{dropoff.address || 'Selected location'}</p>
                </div>
              </InfoWindow>
            )}

            {selectedMarker === 'driver' && driverLocation && (
              <InfoWindow
                position={{ lat: driverLocation.lat, lng: driverLocation.lng }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2">
                  <p className="font-semibold text-blue-600">Driver Location</p>
                  <p className="text-sm text-muted-foreground">Live tracking enabled</p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>

          {/* Route Info Overlay */}
          {routeInfo && (
            <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg shadow-lg p-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm">
                  📏 {routeInfo.distance}
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  ⏱️ {routeInfo.duration}
                </Badge>
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {isLoadingRoute && (
            <div className="absolute inset-0 bg-card/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                <span className="text-sm text-muted-foreground">Calculating route...</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default RideMap;

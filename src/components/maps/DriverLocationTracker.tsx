'use client';

/**
 * Driver Location Tracker
 * Real-time driver location tracking with Firebase Realtime updates
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { RideMap, Location } from './RideMap';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { throttler, LocationUpdateBatcher } from '@/lib/services/rate-limiter';
import { googleMapsService } from '@/lib/services/google-maps.service';
import { Navigation, MapPin, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { BookingStatus } from '@/lib/firebase/services';

interface DriverLocationTrackerProps {
  bookingId: string;
  driverId: string;
  pickup: Location;
  dropoff: Location;
  isDriver?: boolean; // If true, this user is the driver and can share location
  bookingStatus?: BookingStatus; // Current booking status to show appropriate messages
  onLocationUpdate?: (location: Location) => void;
  onETAUpdate?: (eta: { distance: string; duration: string }) => void;
}

interface DriverLocationData {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp: number;
}

export function DriverLocationTracker({
  bookingId,
  driverId,
  pickup,
  dropoff,
  isDriver = false,
  bookingStatus,
  onLocationUpdate,
  onETAUpdate,
}: DriverLocationTrackerProps) {
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [eta, setEta] = useState<{ distance: string; duration: string } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const batcherRef = useRef<LocationUpdateBatcher | null>(null);

  // Listen to driver location updates from Firestore
  useEffect(() => {
    if (isDriver) return; // Drivers don't need to listen, they broadcast

    const unsubscribe = onSnapshot(
      doc(db, 'driverLocations', driverId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as DriverLocationData;
          const location: Location = {
            lat: data.lat,
            lng: data.lng,
          };
          setDriverLocation(location);
          setLastUpdate(new Date(data.timestamp));
          onLocationUpdate?.(location);
        }
      },
      (err) => {
        console.error('Error listening to driver location:', err);
        setError('Failed to get driver location');
      }
    );

    return () => unsubscribe();
  }, [driverId, isDriver, onLocationUpdate]);

  // Calculate ETA when driver location changes
  useEffect(() => {
    if (!driverLocation) return;

    // Only calculate ETA if we haven't done so recently (throttle)
    if (!throttler.shouldExecute('eta-calculation', 30000)) return; // Every 30 seconds

    const calculateETA = async () => {
      try {
        // Calculate ETA to the appropriate destination based on booking status
        // ACCEPTED: ETA to pickup location (driver coming to pick up student)
        // IN_PROGRESS: ETA to dropoff location (ride in progress to destination)
        const destination = bookingStatus === BookingStatus.IN_PROGRESS ? dropoff : pickup;
        
        const directions = await googleMapsService.getDirections(
          driverLocation,
          destination
        );

        if (directions) {
          const etaInfo = {
            distance: directions.distance.text,
            duration: directions.duration.text,
          };
          setEta(etaInfo);
          onETAUpdate?.(etaInfo);
        }
      } catch (err) {
        console.error('Failed to calculate ETA:', err);
      }
    };

    calculateETA();
  }, [driverLocation, pickup, dropoff, bookingStatus, onETAUpdate]);

  // Start location sharing (for drivers)
  const startLocationSharing = useCallback(() => {
    if (!isDriver) return;

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsTracking(true);
    setError(null);

    // Initialize batcher for location updates
    batcherRef.current = new LocationUpdateBatcher(5000); // Batch every 5 seconds
    batcherRef.current.start(async (updates) => {
      for (const [id, location] of updates) {
        try {
          const driverLocationRef = doc(db, 'driverLocations', id);
          
          // Use setDoc with merge to create the document if it doesn't exist
          await setDoc(driverLocationRef, {
            lat: location.lat,
            lng: location.lng,
            timestamp: serverTimestamp(),
            bookingId,
          }, { merge: true });
        } catch (err) {
          console.error('Failed to update driver location:', err);
        }
      }
    });

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading, speed, accuracy } = position.coords;

        // Only send update if we should (throttled)
        if (googleMapsService.shouldSendLocationUpdate(driverId, 3000)) {
          batcherRef.current?.addUpdate(driverId, latitude, longitude);

          const location: Location = { lat: latitude, lng: longitude };
          setDriverLocation(location);
          setLastUpdate(new Date());
          onLocationUpdate?.(location);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError(getGeolocationErrorMessage(err));
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000, // Accept cached position up to 10 seconds old
        timeout: 15000, // Wait up to 15 seconds for position
      }
    );
  }, [isDriver, driverId, bookingId, onLocationUpdate]);

  // Stop location sharing
  const stopLocationSharing = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    batcherRef.current?.stop();
    batcherRef.current = null;

    setIsTracking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationSharing();
    };
  }, [stopLocationSharing]);

  // Get user-friendly geolocation error message
  const getGeolocationErrorMessage = (error: GeolocationPositionError): string => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location permission denied. Please enable location access.';
      case error.POSITION_UNAVAILABLE:
        return 'Location information unavailable. Please try again.';
      case error.TIMEOUT:
        return 'Location request timed out. Please try again.';
      default:
        return 'An unknown error occurred while getting location.';
    }
  };

  // Force refresh location
  const refreshLocation = useCallback(() => {
    if (!isDriver || !isTracking) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        batcherRef.current?.addUpdate(driverId, latitude, longitude);
        
        const location: Location = { lat: latitude, lng: longitude };
        setDriverLocation(location);
        setLastUpdate(new Date());
        onLocationUpdate?.(location);
      },
      (err) => {
        setError(getGeolocationErrorMessage(err));
      },
      { enableHighAccuracy: true }
    );
  }, [isDriver, isTracking, driverId, onLocationUpdate]);

  return (
    <div className="space-y-4">
      {/* Control Panel for Drivers */}
      {isDriver && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant={isTracking ? 'default' : 'secondary'} className="font-medium">
              {isTracking ? '🟢 Live' : '⚫ Offline'}
            </Badge>
            {lastUpdate && isTracking && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Updated {lastUpdate.toLocaleTimeString('en-IN')}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {isTracking ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshLocation}
                  className="h-8 px-2"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopLocationSharing}
                  className="h-8 px-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  Stop
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={startLocationSharing} className="h-8">
                <Navigation className="h-3.5 w-3.5 mr-1" />
                Share Location
              </Button>
            )}
          </div>
        </div>
      )}

      {isDriver && error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ETA Display - Only show when driver is on the way (ACCEPTED status) */}
      {eta && !isDriver && bookingStatus === BookingStatus.ACCEPTED && (
        <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Driver arriving in</span>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-sm font-semibold">
              {eta.duration}
            </Badge>
            <Badge variant="outline" className="text-xs">{eta.distance} away</Badge>
          </div>
        </div>
      )}

      {/* Ride Progress Display - Show when ride is in progress */}
      {eta && !isDriver && bookingStatus === BookingStatus.IN_PROGRESS && (
        <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Ride in progress</span>
          </div>
          <div className="flex gap-2">
            <Badge variant="default" className="text-sm font-semibold">
              {eta.duration}
            </Badge>
            <Badge variant="outline" className="text-xs">{eta.distance} left</Badge>
          </div>
        </div>
      )}

      {/* Map Display */}
      <RideMap
        pickup={pickup}
        dropoff={dropoff}
        driverLocation={driverLocation || undefined}
        showRoute={true}
        showDriverRadius={isDriver}
        driverRadiusMeters={200}
        height="350px"
        interactive={false}
      />

      {/* Location Status for Students */}
      {!isDriver && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="h-3.5 w-3.5 text-green-600 shrink-0" />
            <span className="truncate">{pickup.address || 'Pickup location'}</span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="h-3.5 w-3.5 text-red-600 shrink-0" />
            <span className="truncate">{dropoff.address || 'Drop location'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverLocationTracker;

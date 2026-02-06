'use client';

/**
 * Enhanced Booking Form with Google Maps Integration
 * Uses real-time location autocomplete and map visualization
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { APIBook, calculateFare, calculatePoolFare, PoolStatus, RideType, POOL_CONFIG } from '@/lib/firebase/services';
import type { PoolRide, PoolMatch, CreatePoolData } from '@/lib/firebase/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  GoogleMapsProvider,
  LocationInput,
  RideMap,
  type LocationResult,
  type Location,
} from '@/components/maps';
import { googleMapsService } from '@/lib/services/google-maps.service';
import { DriverRatingCard } from '@/components/rating';
import { AllDriversContactList } from './AllDriversContactList';
import {
  MapPin,
  Navigation,
  Star,
  Car,
  IndianRupee,
  Phone,
  RefreshCw,
  Loader2,
  CheckCircle,
  User,
  ArrowRight,
  AlertCircle,
  Users,
  Percent,
} from 'lucide-react';

interface NearbyDriver {
  uid: string;
  displayName: string;
  phone?: string | null;
  vehicleRegistrationNumber?: string;
  rating?: number;
  distance?: number;
  profileImage?: string;
}

interface EnhancedBookingFormProps {
  studentId: string;
  studentName: string;
  studentPhone: string;
  onBookingCreated: (bookingId: string) => void;
  onCancel?: () => void;
  initialPickup?: { lat: number; lng: number; address?: string } | null;
  initialDrop?: { lat: number; lng: number; address?: string } | null;
  retryBanner?: string | null;
  onRetryDismiss?: () => void;
  poolId?: string | null;
}

export function EnhancedBookingFormContent({
  studentId,
  studentName,
  studentPhone,
  onBookingCreated,
  onCancel,
  initialPickup,
  initialDrop,
  retryBanner,
  onRetryDismiss,
  poolId,
}: EnhancedBookingFormProps) {
  const [step, setStep] = useState<'location' | 'driver' | 'confirm'>('location');
  const [loading, setLoading] = useState(false);
  const [searchingDrivers, setSearchingDrivers] = useState(false);
  const [error, setError] = useState('');
  const [showAllDrivers, setShowAllDrivers] = useState(false);

  // Location state - initialize from props (e.g., when retrying after driver cancel)
  const [pickupLocation, setPickupLocation] = useState<LocationResult | null>(
    initialPickup ? { placeId: '', lat: initialPickup.lat, lng: initialPickup.lng, address: initialPickup.address || '' } : null
  );
  const [dropLocation, setDropLocation] = useState<LocationResult | null>(
    initialDrop ? { placeId: '', lat: initialDrop.lat, lng: initialDrop.lng, address: initialDrop.address || '' } : null
  );
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    distanceText: string;
    duration: string;
  } | null>(null);

  // Driver state
  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyDriver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<NearbyDriver | null>(null);

  // Pool state
  const [rideType, setRideType] = useState<'solo' | 'pool'>('solo');
  const [searchingPools, setSearchingPools] = useState(false);
  const [poolMatches, setPoolMatches] = useState<PoolMatch[]>([]);
  const [selectedPool, setSelectedPool] = useState<PoolMatch | null>(null);
  const [creatingPool, setCreatingPool] = useState(false);
  const [joinedPoolId, setJoinedPoolId] = useState<string | null>(null);

  // Calculate fare based on distance
  const estimatedFare = useMemo(() => {
    if (!routeInfo) return 0;
    return calculateFare(routeInfo.distance / 1000); // Convert meters to km
  }, [routeInfo]);

  // Calculate pool fare savings
  const poolFareInfo = useMemo(() => {
    if (!routeInfo) return null;
    const distKm = routeInfo.distance / 1000;
    return calculatePoolFare(distKm, POOL_CONFIG.maxSeats);
  }, [routeInfo]);

  // Search for matching pools
  const searchPools = useCallback(async () => {
    if (!pickupLocation || !dropLocation || !routeInfo) return;
    setSearchingPools(true);
    setError('');
    try {
      const distKm = routeInfo.distance / 1000;
      const farePerSeat = calculatePoolFare(distKm, POOL_CONFIG.maxSeats).farePerSeat;
      const result = await APIBook.pool.findMatchingPools({
        studentId,
        studentName,
        studentPhone,
        pickupLocation: { lat: pickupLocation.lat, lng: pickupLocation.lng, address: pickupLocation.address },
        dropLocation: { lat: dropLocation.lat, lng: dropLocation.lng, address: dropLocation.address },
        departureTime: new Date().toISOString(),
        isImmediate: true,
        seatsNeeded: 1,
        distance: distKm,
        maxFarePerSeat: farePerSeat * 1.2,
      });
      if (result.success && result.data) {
        setPoolMatches(result.data);
      } else {
        setPoolMatches([]);
      }
    } catch {
      setPoolMatches([]);
    }
    setSearchingPools(false);
  }, [pickupLocation, dropLocation, routeInfo, studentId, studentName, studentPhone]);

  // Create a new pool ride
  const handleCreatePool = useCallback(async () => {
    if (!pickupLocation || !dropLocation || !routeInfo) return;
    setCreatingPool(true);
    setError('');
    try {
      const distKm = routeInfo.distance / 1000;
      const baseFare = calculateFare(distKm);
      const data: CreatePoolData = {
        studentId,
        studentName,
        studentPhone,
        pickupLocation: { lat: pickupLocation.lat, lng: pickupLocation.lng, address: pickupLocation.address },
        dropLocation: { lat: dropLocation.lat, lng: dropLocation.lng, address: dropLocation.address },
        departureTime: new Date().toISOString(),
        isImmediate: true,
        seatsNeeded: 1,
        distance: distKm,
        baseFare,
      };
      const result = await APIBook.pool.createPool(data);
      if (result.success && result.data) {
        setJoinedPoolId(result.data.id);
        onBookingCreated(result.data.id);
      } else {
        setError(result.error || 'Failed to create pool ride');
      }
    } catch {
      setError('Error creating pool ride');
    }
    setCreatingPool(false);
  }, [pickupLocation, dropLocation, routeInfo, studentId, studentName, studentPhone, onBookingCreated]);

  // Join an existing pool
  const handleJoinPool = useCallback(async (match: PoolMatch) => {
    if (!pickupLocation || !dropLocation) return;
    setLoading(true);
    setError('');
    try {
      const result = await APIBook.pool.joinPool(
        match.poolId,
        studentId,
        studentName,
        studentPhone,
        { lat: pickupLocation.lat, lng: pickupLocation.lng, address: pickupLocation.address },
        { lat: dropLocation.lat, lng: dropLocation.lng, address: dropLocation.address },
        1
      );
      if (result.success) {
        setJoinedPoolId(match.poolId);
        onBookingCreated(match.poolId);
      } else {
        setError(result.error || 'Failed to join pool');
      }
    } catch {
      setError('Error joining pool ride');
    }
    setLoading(false);
  }, [pickupLocation, dropLocation, studentId, studentName, studentPhone, onBookingCreated]);

  // Handle pickup location change
  const handlePickupChange = useCallback((location: LocationResult | null) => {
    setPickupLocation(location);
    setRouteInfo(null);
    setError('');
  }, []);

  // Handle drop location change
  const handleDropChange = useCallback((location: LocationResult | null) => {
    setDropLocation(location);
    setRouteInfo(null);
    setError('');
  }, []);

  // Calculate route when both locations are set
  const calculateRoute = useCallback(async () => {
    if (!pickupLocation || !dropLocation) {
      setError('Please enter both pickup and drop locations');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const directions = await googleMapsService.getDirections(
        { lat: pickupLocation.lat, lng: pickupLocation.lng },
        { lat: dropLocation.lat, lng: dropLocation.lng }
      );

      if (directions) {
        setRouteInfo({
          distance: directions.distance.value,
          distanceText: directions.distance.text,
          duration: directions.duration.text,
        });
      } else {
        setError('Could not calculate route. Please check your locations.');
      }
    } catch (err) {
      console.error('Route calculation error:', err);
      setError('Failed to calculate route. Please try again.');
    }

    setLoading(false);
  }, [pickupLocation, dropLocation]);

  // Search for nearby drivers
  const searchDrivers = useCallback(async () => {
    if (!pickupLocation) {
      setError('Please enter pickup location');
      return;
    }

    setSearchingDrivers(true);
    setError('');

    try {
      const result = await APIBook.booking.getNearbyDrivers(
        { lat: pickupLocation.lat, lng: pickupLocation.lng, address: pickupLocation.address },
        10 // 10km radius
      );

      if (result.success && result.data) {
        setNearbyDrivers(result.data);
        if (result.data.length === 0) {
          setError('No drivers available nearby. Please try again later.');
        } else {
          setStep('driver');
        }
      } else {
        setError(result.error || 'Failed to find drivers');
      }
    } catch (err) {
      setError('Error searching for drivers');
    }

    setSearchingDrivers(false);
  }, [pickupLocation]);

  // Handle proceed to driver selection
  const handleProceedToDrivers = useCallback(async () => {
    if (!routeInfo) {
      await calculateRoute();
    }
    await searchDrivers();
  }, [routeInfo, calculateRoute, searchDrivers]);

  // Select a driver
  const handleSelectDriver = useCallback((driver: NearbyDriver) => {
    setSelectedDriver(driver);
    setStep('confirm');
  }, []);

  // Confirm and create booking
  const handleConfirmBooking = async () => {
    if (!selectedDriver || !pickupLocation || !dropLocation || !routeInfo) {
      setError('Missing booking information');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const distanceKm = routeInfo.distance / 1000;
      const fare = calculateFare(distanceKm);

      const result = await APIBook.booking.createBooking({
        studentId,
        studentName,
        studentPhone,
        driverId: selectedDriver.uid,
        driverName: selectedDriver.displayName,
        driverPhone: selectedDriver.phone || '',
        vehicleNumber: selectedDriver.vehicleRegistrationNumber || '',
        pickupLocation: {
          lat: pickupLocation.lat,
          lng: pickupLocation.lng,
          address: pickupLocation.address,
        },
        dropLocation: {
          lat: dropLocation.lat,
          lng: dropLocation.lng,
          address: dropLocation.address,
        },
        distance: distanceKm,
        fare,
        rideType: poolId ? 'pool' : 'solo',
        poolId: poolId || null,
      });

      if (result.success && result.data) {
        onBookingCreated(result.data.id);
      } else {
        setError(result.error || 'Failed to create booking');
      }
    } catch (err) {
      setError('Error creating booking');
    }

    setLoading(false);
  };

  // Go back to previous step
  const handleBack = useCallback(() => {
    if (step === 'confirm') {
      setStep('driver');
    } else if (step === 'driver') {
      setStep('location');
    }
  }, [step]);

  // Map locations for display
  const mapPickup: Location | undefined = pickupLocation
    ? { lat: pickupLocation.lat, lng: pickupLocation.lng, address: pickupLocation.address }
    : undefined;
  
  const mapDrop: Location | undefined = dropLocation
    ? { lat: dropLocation.lat, lng: dropLocation.lng, address: dropLocation.address }
    : undefined;

  // Auto-calculate route when initial locations are provided (retry after cancel)
  useEffect(() => {
    if (initialPickup && initialDrop && !routeInfo) {
      calculateRoute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Retry Banner - shown when retrying after driver cancel */}
      {retryBanner && (
        <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
            <p className="text-sm text-foreground">{retryBanner}</p>
          </div>
          {onRetryDismiss && (
            <button onClick={onRetryDismiss} className="text-muted-foreground hover:text-foreground text-xs shrink-0 ml-2">
              ✕
            </button>
          )}
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {['location', 'driver', 'confirm'].map((s, index) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s
                  ? 'bg-primary text-primary-foreground'
                  : index < ['location', 'driver', 'confirm'].indexOf(step)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-foreground/50'
              }`}
            >
              {index < ['location', 'driver', 'confirm'].indexOf(step) ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            {index < 2 && (
              <div
                className={`w-12 h-0.5 ${
                  index < ['location', 'driver', 'confirm'].indexOf(step)
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <Alert variant="destructive" className="border-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {/* Show All Drivers Contact List when no nearby drivers found */}
      {error && error.includes('No drivers available') && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            You can contact a driver directly from the list below
          </p>
          <AllDriversContactList showByDefault={true} compact={true} />
        </div>
      )}

      {/* Step 1: Location Selection */}
      {step === 'location' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Select Locations
            </CardTitle>
            <CardDescription>
              Enter your pickup and drop-off locations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ride Type Toggle: Solo vs Pool — hidden when selecting driver for a pool ride */}
            {!poolId && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/30 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => { setRideType('solo'); setPoolMatches([]); setSelectedPool(null); }}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                  rideType === 'solo'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground/60 hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Car className="h-4 w-4" />
                Solo Ride
              </button>
              <button
                type="button"
                onClick={() => setRideType('pool')}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all relative ${
                  rideType === 'pool'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground/60 hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Users className="h-4 w-4" />
                Pool Ride
                {rideType !== 'pool' && (
                  <Badge className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0 bg-green-500 text-white border-0">
                    Save {(POOL_CONFIG.poolDiscount * 100).toFixed(0)}%
                  </Badge>
                )}
              </button>
            </div>
            )}

            {/* Pool Info Banner */}
            {rideType === 'pool' && (
              <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <Percent className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Share your rickshaw, save money!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pool with up to {POOL_CONFIG.maxSeats - 1} other students going the same way and save ~{(POOL_CONFIG.poolDiscount * 100).toFixed(0)}% on fare.
                  </p>
                </div>
              </div>
            )}

            <Separator />

            <LocationInput
              id="pickup"
              label="Pickup Location"
              placeholder="Enter pickup address..."
              onChange={handlePickupChange}
              required
              restrictToIndia
              showCurrentLocation={true}
              value={pickupLocation?.address || ''}
            />

            <LocationInput
              id="dropoff"
              label="Drop Location"
              placeholder="Enter drop address..."
              onChange={handleDropChange}
              required
              restrictToIndia
              value={dropLocation?.address || ''}
            />

            {/* Map Preview */}
            {(pickupLocation || dropLocation) && (
              <div className="mt-4">
                <RideMap
                  pickup={mapPickup}
                  dropoff={mapDrop}
                  showRoute={!!pickupLocation && !!dropLocation}
                  height="300px"
                />
              </div>
            )}

            {/* Route Info + Fare Comparison */}
            {routeInfo && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-secondary/20">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="text-sm bg-muted/50 text-foreground">
                      📏 {routeInfo.distanceText}
                    </Badge>
                    <Badge variant="secondary" className="text-sm bg-muted/50 text-foreground">
                      ⏱️ {routeInfo.duration}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-lg font-semibold text-secondary">
                    <IndianRupee className="h-5 w-5" />
                    {rideType === 'pool' && poolFareInfo
                      ? poolFareInfo.farePerSeat.toFixed(0)
                      : estimatedFare.toFixed(0)}
                  </div>
                </div>

                {/* Pool savings comparison */}
                {rideType === 'pool' && poolFareInfo && (
                  <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="text-sm">
                      <span className="text-muted-foreground line-through">₹{poolFareInfo.baseFare.toFixed(0)}</span>
                      <span className="ml-2 font-semibold text-green-600 dark:text-green-400">₹{poolFareInfo.farePerSeat.toFixed(0)}/seat</span>
                    </div>
                    <Badge className="bg-green-500 text-white border-0">
                      Save ₹{poolFareInfo.savingsPerPerson.toFixed(0)}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            <Separator />

            <div className="flex gap-3">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} className="flex-1">
                  Cancel
                </Button>
              )}
              {rideType === 'solo' ? (
                <Button
                  onClick={handleProceedToDrivers}
                  disabled={!pickupLocation || !dropLocation || loading || searchingDrivers}
                  className="flex-1"
                >
                  {loading || searchingDrivers ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {searchingDrivers ? 'Finding Drivers...' : 'Calculating...'}
                    </>
                  ) : (
                    <>
                      Find Drivers
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={async () => {
                    if (!routeInfo) await calculateRoute();
                    await searchPools();
                    setStep('driver');
                  }}
                  disabled={!pickupLocation || !dropLocation || loading || searchingPools}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {searchingPools ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Finding Pools...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Find Pool Rides
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Driver Selection / Pool Matching */}
      {step === 'driver' && rideType === 'pool' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              Available Pools
            </CardTitle>
            <CardDescription>
              {poolMatches.length > 0
                ? `${poolMatches.length} pool(s) going your way!`
                : 'No matching pools found — create one!'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pool match results */}
            {poolMatches.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {poolMatches.map((match) => (
                  <div
                    key={match.poolId}
                    className="p-4 border-2 rounded-lg transition-all border-border hover:border-green-500/50 hover:bg-green-500/5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-sm">
                          {match.pool.occupiedSeats}/{match.pool.maxSeats} seats taken
                        </span>
                      </div>
                      <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
                        {match.matchScore}% match
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 mb-3">
                      <p>📍 Pickup: ~{match.pickupDeviation.toFixed(1)}km from yours</p>
                      <p>📍 Drop: ~{match.dropDeviation.toFixed(1)}km from yours</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="line-through text-muted-foreground">₹{match.estimatedFare + match.estimatedSavings}</span>
                        <span className="ml-2 font-bold text-green-600 dark:text-green-400">₹{match.estimatedFare.toFixed(0)}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleJoinPool(match)}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join Pool'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-foreground/70 mb-1">No pools on your route yet</p>
                <p className="text-xs text-muted-foreground mb-4">Be the first! Others going your way can join.</p>
              </div>
            )}

            <Separator />

            {/* Create new pool */}
            <Button
              onClick={handleCreatePool}
              disabled={creatingPool}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {creatingPool ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Pool...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  {poolMatches.length > 0 ? 'Create New Pool Instead' : 'Create a Pool Ride'}
                </>
              )}
            </Button>

            <Button variant="outline" onClick={handleBack} className="w-full">
              Back
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Driver Selection (Solo mode) */}
      {step === 'driver' && rideType === 'solo' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Select Driver
            </CardTitle>
            <CardDescription>
              {nearbyDrivers.length} driver(s) available near your pickup location
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Map with driver locations */}
            <RideMap
              pickup={mapPickup}
              dropoff={mapDrop}
              showRoute
              height="200px"
              interactive={false}
            />

            <Separator />

            {/* Driver List */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {nearbyDrivers.map((driver) => (
                <div
                  key={driver.uid}
                  onClick={() => handleSelectDriver(driver)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedDriver?.uid === driver.uid
                      ? 'border-secondary bg-secondary/10'
                      : 'border-white/10 hover:border-secondary/50 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{driver.displayName}</p>
                        {driver.vehicleRegistrationNumber && (
                          <p className="text-sm text-foreground/60">
                            {driver.vehicleRegistrationNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {driver.distance && (
                        <Badge variant="outline" className="border-secondary/30 text-secondary">
                          {(driver.distance / 1000).toFixed(1)} km away
                        </Badge>
                      )}
                    </div>
                  </div>
                  {/* Driver Rating */}
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <DriverRatingCard
                      driverId={driver.uid}
                      driverName={driver.displayName}
                      showDetails
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              onClick={searchDrivers}
              disabled={searchingDrivers}
              className="w-full"
            >
              {searchingDrivers ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Drivers
            </Button>

            <Separator />

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                disabled={!selectedDriver}
                className="flex-1"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirm' && selectedDriver && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Confirm Booking
            </CardTitle>
            <CardDescription>
              Review your ride details before confirming
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Map Preview */}
            <RideMap
              pickup={mapPickup}
              dropoff={mapDrop}
              showRoute
              height="200px"
              interactive={false}
            />

            <Separator />

            {/* Ride Details */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Pickup</p>
                  <p className="font-medium text-foreground">{pickupLocation?.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Drop-off</p>
                  <p className="font-medium text-foreground">{dropLocation?.address}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Driver Info */}
            <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{selectedDriver.displayName}</p>
                  <p className="text-sm text-foreground/60">
                    {selectedDriver.vehicleRegistrationNumber}
                  </p>
                </div>
              </div>
              {selectedDriver.phone && (
                <Button variant="ghost" size="icon">
                  <Phone className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Fare Details */}
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-foreground/60">Ride Type</span>
                <Badge variant="outline" className={rideType === 'pool' ? 'border-green-500/30 text-green-600 dark:text-green-400' : ''}>
                  {rideType === 'pool' ? '🛺 Pool' : '🛺 Solo'}
                </Badge>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-foreground/60">Distance</span>
                <span className="text-foreground">{routeInfo?.distanceText || 'Calculating...'}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-foreground/60">Duration</span>
                <span className="text-foreground">{routeInfo?.duration || 'Calculating...'}</span>
              </div>
              <Separator className="my-2 bg-muted/50" />
              <div className="flex items-center justify-between text-lg font-semibold">
                <span className="text-foreground">Estimated Fare</span>
                <span className="flex items-center text-secondary">
                  <IndianRupee className="h-5 w-5" />
                  {estimatedFare.toFixed(0)}
                </span>
              </div>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleConfirmBooking}
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary/90 shadow-[0px_4px_0px_0px_var(--rickshaw-green-dark)] hover:shadow-[0px_2px_0px_0px_var(--rickshaw-green-dark)] hover:translate-y-[2px] active:shadow-none active:translate-y-1 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Ride
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function EnhancedBookingForm(props: EnhancedBookingFormProps) {
  return (
    <GoogleMapsProvider>
      <EnhancedBookingFormContent {...props} />
    </GoogleMapsProvider>
  );
}

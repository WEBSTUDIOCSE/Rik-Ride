'use client';

/**
 * Enhanced Booking Form with Google Maps Integration
 * Uses real-time location autocomplete and map visualization
 */

import { useState, useCallback, useMemo } from 'react';
import { APIBook, calculateFare } from '@/lib/firebase/services';
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
import {
  MapPin,
  Navigation,
  Star,
  Car,
  Clock,
  IndianRupee,
  Phone,
  RefreshCw,
  Loader2,
  CheckCircle,
  User,
  ArrowRight,
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
}

export function EnhancedBookingFormContent({
  studentId,
  studentName,
  studentPhone,
  onBookingCreated,
  onCancel,
}: EnhancedBookingFormProps) {
  const [step, setStep] = useState<'location' | 'driver' | 'confirm'>('location');
  const [loading, setLoading] = useState(false);
  const [searchingDrivers, setSearchingDrivers] = useState(false);
  const [error, setError] = useState('');

  // Location state
  const [pickupLocation, setPickupLocation] = useState<LocationResult | null>(null);
  const [dropLocation, setDropLocation] = useState<LocationResult | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    distanceText: string;
    duration: string;
  } | null>(null);

  // Driver state
  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyDriver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<NearbyDriver | null>(null);

  // Calculate fare based on distance
  const estimatedFare = useMemo(() => {
    if (!routeInfo) return 0;
    return calculateFare(routeInfo.distance / 1000); // Convert meters to km
  }, [routeInfo]);

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

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {['location', 'driver', 'confirm'].map((s, index) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s
                  ? 'bg-primary text-primary-foreground'
                  : index < ['location', 'driver', 'confirm'].indexOf(step)
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
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
                    ? 'bg-green-500'
                    : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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
            <LocationInput
              id="pickup"
              label="Pickup Location"
              placeholder="Enter pickup address..."
              onChange={handlePickupChange}
              required
              restrictToIndia
              showCurrentLocation={true}
            />

            <LocationInput
              id="dropoff"
              label="Drop Location"
              placeholder="Enter drop address..."
              onChange={handleDropChange}
              required
              restrictToIndia
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

            {/* Route Info */}
            {routeInfo && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="text-sm">
                    📏 {routeInfo.distanceText}
                  </Badge>
                  <Badge variant="secondary" className="text-sm">
                    ⏱️ {routeInfo.duration}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-lg font-semibold">
                  <IndianRupee className="h-5 w-5" />
                  {estimatedFare.toFixed(0)}
                </div>
              </div>
            )}

            <Separator />

            <div className="flex gap-3">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} className="flex-1">
                  Cancel
                </Button>
              )}
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Driver Selection */}
      {step === 'driver' && (
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
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedDriver?.uid === driver.uid
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{driver.displayName}</p>
                        {driver.vehicleRegistrationNumber && (
                          <p className="text-sm text-muted-foreground">
                            {driver.vehicleRegistrationNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {driver.rating && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {driver.rating.toFixed(1)}
                        </Badge>
                      )}
                      {driver.distance && (
                        <Badge variant="outline">
                          {(driver.distance / 1000).toFixed(1)} km
                        </Badge>
                      )}
                    </div>
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
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pickup</p>
                  <p className="font-medium">{pickupLocation?.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Drop-off</p>
                  <p className="font-medium">{dropLocation?.address}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Driver Info */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedDriver.displayName}</p>
                  <p className="text-sm text-muted-foreground">
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
            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Distance</span>
                <span>{routeInfo?.distanceText || 'Calculating...'}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Duration</span>
                <span>{routeInfo?.duration || 'Calculating...'}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Estimated Fare</span>
                <span className="flex items-center">
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
                className="flex-1 bg-green-600 hover:bg-green-700"
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

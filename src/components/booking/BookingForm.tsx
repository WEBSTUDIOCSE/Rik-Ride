'use client';

import { useState, useEffect, useCallback } from 'react';
import { APIBook, type NearbyDriver, type GeoLocation, calculateFare } from '@/lib/firebase/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MapPin,
  Navigation,
  Search,
  Star,
  Car,
  Clock,
  IndianRupee,
  Phone,
  RefreshCw,
  Loader2,
  CheckCircle,
  User,
} from 'lucide-react';

interface BookingFormProps {
  studentId: string;
  studentName: string;
  studentPhone: string;
  onBookingCreated: (bookingId: string) => void;
}

export default function BookingForm({
  studentId,
  studentName,
  studentPhone,
  onBookingCreated,
}: BookingFormProps) {
  const [step, setStep] = useState<'location' | 'driver' | 'confirm'>('location');
  const [loading, setLoading] = useState(false);
  const [searchingDrivers, setSearchingDrivers] = useState(false);
  const [error, setError] = useState('');

  // Location state
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [pickupLocation, setPickupLocation] = useState<GeoLocation | null>(null);
  const [dropLocation, setDropLocation] = useState<GeoLocation | null>(null);
  const [distance, setDistance] = useState(0);
  const [fare, setFare] = useState(0);

  // Driver state
  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyDriver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<NearbyDriver | null>(null);

  // Mock geocoding function - In production, use Google Maps API
  const geocodeAddress = async (address: string): Promise<GeoLocation | null> => {
    // For demo, return mock coordinates based on address
    // In production, integrate with Google Maps Geocoding API
    if (!address.trim()) return null;
    
    // Mock coordinates for GIT campus area (Belgaum, Karnataka)
    const baseLocation = {
      lat: 15.8497 + (Math.random() - 0.5) * 0.02,
      lng: 74.4977 + (Math.random() - 0.5) * 0.02,
    };
    
    return {
      ...baseLocation,
      address: address,
    };
  };

  // Calculate distance between two points
  const calculateDistance = (loc1: GeoLocation, loc2: GeoLocation): number => {
    const R = 6371;
    const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.lat * Math.PI) / 180) *
        Math.cos((loc2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal
  };

  // Search for nearby drivers
  const searchDrivers = async () => {
    if (!pickupLocation) {
      setError('Please enter pickup location');
      return;
    }
    if (!dropLocation) {
      setError('Please enter drop location');
      return;
    }

    setSearchingDrivers(true);
    setError('');

    try {
      const result = await APIBook.booking.getNearbyDrivers(pickupLocation, 10);
      
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
  };

  // Handle location submission
  const handleLocationSubmit = async () => {
    setLoading(true);
    setError('');

    const pickup = await geocodeAddress(pickupAddress);
    const drop = await geocodeAddress(dropAddress);

    if (!pickup) {
      setError('Could not find pickup location');
      setLoading(false);
      return;
    }
    if (!drop) {
      setError('Could not find drop location');
      setLoading(false);
      return;
    }

    setPickupLocation(pickup);
    setDropLocation(drop);

    const dist = calculateDistance(pickup, drop);
    setDistance(dist);
    setFare(calculateFare(dist));

    setLoading(false);
    await searchDrivers();
  };

  // Select a driver
  const handleSelectDriver = (driver: NearbyDriver) => {
    setSelectedDriver(driver);
    setStep('confirm');
  };

  // Confirm and create booking
  const handleConfirmBooking = async () => {
    if (!selectedDriver || !pickupLocation || !dropLocation) {
      setError('Missing booking information');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await APIBook.booking.createBooking({
        studentId,
        studentName,
        studentPhone,
        driverId: selectedDriver.uid,
        driverName: selectedDriver.displayName,
        driverPhone: selectedDriver.phone || '',
        vehicleNumber: selectedDriver.vehicleRegistrationNumber,
        pickupLocation,
        dropLocation,
        distance,
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

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPickupAddress('Current Location');
          setPickupLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: 'Current Location',
          });
        },
        () => {
          setError('Could not get your location');
        }
      );
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Book a Ride
        </CardTitle>
        <CardDescription>
          {step === 'location' && 'Enter your pickup and drop locations'}
          {step === 'driver' && 'Select a driver from available options'}
          {step === 'confirm' && 'Review and confirm your booking'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Indicator */}
        <div className="flex items-center justify-between text-sm">
          <div className={`flex items-center gap-2 ${step === 'location' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'location' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              1
            </div>
            Location
          </div>
          <div className="flex-1 h-px bg-border mx-2" />
          <div className={`flex items-center gap-2 ${step === 'driver' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'driver' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              2
            </div>
            Driver
          </div>
          <div className="flex-1 h-px bg-border mx-2" />
          <div className={`flex items-center gap-2 ${step === 'confirm' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'confirm' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              3
            </div>
            Confirm
          </div>
        </div>

        <Separator />

        {/* Step 1: Location Input */}
        {step === 'location' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pickup Location</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter pickup address"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="icon" onClick={getCurrentLocation}>
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Drop Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter drop address"
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              onClick={handleLocationSubmit}
              className="w-full"
              disabled={loading || searchingDrivers || !pickupAddress || !dropAddress}
            >
              {searchingDrivers ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finding Drivers...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Find Drivers
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Driver Selection */}
        {step === 'driver' && (
          <div className="space-y-4">
            {/* Trip Summary */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate max-w-[150px]">{pickupAddress}</span>
                  </div>
                  <span className="text-muted-foreground">→</span>
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    <span className="truncate max-w-[150px]">{dropAddress}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className="text-muted-foreground">Distance: {distance} km</span>
                  <span className="font-semibold flex items-center gap-1">
                    <IndianRupee className="h-4 w-4" />
                    {fare}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Driver List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Available Drivers ({nearbyDrivers.length})</h3>
                <Button variant="ghost" size="sm" onClick={searchDrivers}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {nearbyDrivers.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No drivers available. Please try again later.
                  </AlertDescription>
                </Alert>
              ) : (
                nearbyDrivers.map((driver) => (
                  <Card
                    key={driver.uid}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedDriver?.uid === driver.uid ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleSelectDriver(driver)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {driver.displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{driver.displayName}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{driver.vehicleType}</span>
                              <span>•</span>
                              <span>{driver.vehicleRegistrationNumber}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            <span className="font-medium">
                              {driver.rating > 0 ? driver.rating.toFixed(1) : 'New'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {driver.distance.toFixed(1)} km away
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm">
                        <span className="flex items-center gap-1">
                          <Car className="h-4 w-4" />
                          {driver.vehicleModel}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {driver.seatingCapacity} seats
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          ~{APIBook.booking.getEstimatedArrival(driver.distance)} min
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Button variant="outline" onClick={() => setStep('location')} className="w-full">
              Back to Location
            </Button>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && selectedDriver && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Ride Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Route */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pickup</p>
                      <p className="font-medium">{pickupAddress}</p>
                    </div>
                  </div>
                  <div className="ml-1.5 h-4 border-l-2 border-dashed border-muted-foreground" />
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className="w-3 h-3 rounded-full border-2 border-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Drop</p>
                      <p className="font-medium">{dropAddress}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Driver Info */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {selectedDriver.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{selectedDriver.displayName}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDriver.vehicleType} • {selectedDriver.vehicleModel}
                    </p>
                    <p className="text-sm font-medium">{selectedDriver.vehicleRegistrationNumber}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    <span>{selectedDriver.rating > 0 ? selectedDriver.rating.toFixed(1) : 'New'}</span>
                  </div>
                </div>

                <Separator />

                {/* Fare Details */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Distance</span>
                    <span>{distance} km</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Time</span>
                    <span>~{APIBook.booking.getEstimatedArrival(distance, false)} min</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total Fare</span>
                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      {fare}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('driver')}
                className="flex-1"
                disabled={loading}
              >
                Change Driver
              </Button>
              <Button
                onClick={handleConfirmBooking}
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Booking
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

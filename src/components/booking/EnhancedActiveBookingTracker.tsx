'use client';

/**
 * Enhanced Active Booking Tracker with Live Map
 * Shows real-time driver location and route
 */

import { useState, useEffect, useCallback } from 'react';
import { APIBook, type Booking, BookingStatus } from '@/lib/firebase/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  GoogleMapsProvider,
  DriverLocationTracker,
  type Location,
} from '@/components/maps';
import {
  Phone,
  Star,
  Clock,
  IndianRupee,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
  MessageSquare,
  User,
  MapPin,
  Navigation,
} from 'lucide-react';

interface EnhancedActiveBookingTrackerProps {
  studentId: string;
  initialBooking?: Booking | null;
  onBookingComplete?: (completedBooking?: Booking) => void;
  onBookingCancelled?: () => void;
}

export function EnhancedActiveBookingTrackerContent({
  studentId,
  initialBooking,
  onBookingComplete,
  onBookingCancelled,
}: EnhancedActiveBookingTrackerProps) {
  const [booking, setBooking] = useState<Booking | null>(initialBooking || null);
  const [loading, setLoading] = useState(!initialBooking);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [eta, setEta] = useState<{ distance: string; duration: string } | null>(null);

  // Subscribe to booking updates
  useEffect(() => {
    if (!initialBooking?.id) {
      const fetchActiveBooking = async () => {
        const result = await APIBook.booking.getStudentActiveBooking(studentId);
        if (result.success) {
          setBooking(result.data);
        }
        setLoading(false);
      };
      fetchActiveBooking();
      return;
    }

    const unsubscribe = APIBook.booking.subscribeToBooking(
      initialBooking.id,
      (updatedBooking) => {
        setBooking(updatedBooking);
        
        // When booking is completed, notify parent with the booking for rating
        if (updatedBooking?.status === BookingStatus.COMPLETED) {
          onBookingComplete?.(updatedBooking);
        }
        
        if (updatedBooking?.status === BookingStatus.CANCELLED) {
          onBookingCancelled?.();
        }
      }
    );

    setLoading(false);
    return () => unsubscribe();
  }, [initialBooking?.id, studentId, onBookingCancelled]);

  // Cancel booking
  const handleCancelBooking = async () => {
    if (!booking) return;

    setCancelling(true);
    setError('');

    const result = await APIBook.booking.cancelBooking(booking.id, studentId);
    
    if (result.success) {
      onBookingCancelled?.();
    } else {
      setError(result.error || 'Failed to cancel booking');
    }

    setCancelling(false);
  };

  // Handle ETA update from map
  const handleETAUpdate = useCallback((etaInfo: { distance: string; duration: string }) => {
    setEta(etaInfo);
  }, []);

  // Get status badge
  const getStatusBadge = (status: BookingStatus) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
      [BookingStatus.PENDING]: { label: 'Waiting for Driver', variant: 'outline', icon: Clock },
      [BookingStatus.ACCEPTED]: { label: 'Driver Assigned', variant: 'secondary', icon: CheckCircle },
      [BookingStatus.IN_PROGRESS]: { label: 'Ride in Progress', variant: 'default', icon: Navigation },
      [BookingStatus.COMPLETED]: { label: 'Completed', variant: 'default', icon: CheckCircle },
      [BookingStatus.CANCELLED]: { label: 'Cancelled', variant: 'destructive', icon: X },
    };

    const statusConfig = config[status] || { label: status, variant: 'outline' as const, icon: AlertCircle };
    const { label, variant, icon: Icon } = statusConfig;

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  // Convert booking locations to map format
  const pickupLocation: Location | undefined = booking?.pickupLocation ? {
    lat: booking.pickupLocation.lat,
    lng: booking.pickupLocation.lng,
    address: booking.pickupLocation.address,
  } : undefined;

  const dropLocation: Location | undefined = booking?.dropLocation ? {
    lat: booking.dropLocation.lat,
    lng: booking.dropLocation.lng,
    address: booking.dropLocation.address,
  } : undefined;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading booking...
        </CardContent>
      </Card>
    );
  }

  if (!booking) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No active booking found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Active Ride</CardTitle>
            {getStatusBadge(booking.status)}
          </div>
          <CardDescription>
            Booking ID: {booking.id.slice(0, 8)}...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Live Map with Driver Tracking */}
          {pickupLocation && dropLocation && booking.driverId && (
            <DriverLocationTracker
              bookingId={booking.id}
              driverId={booking.driverId}
              pickup={pickupLocation}
              dropoff={dropLocation}
              isDriver={false}
              bookingStatus={booking.status}
              onETAUpdate={handleETAUpdate}
            />
          )}

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
                <p className="font-medium">{booking.driverName}</p>
                {booking.vehicleNumber && (
                  <p className="text-sm text-muted-foreground">
                    {booking.vehicleNumber}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {booking.driverPhone && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(`tel:${booking.driverPhone}`)}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="icon">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Ride Details */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pickup</p>
                <p className="font-medium">{booking.pickupLocation?.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Drop-off</p>
                <p className="font-medium">{booking.dropLocation?.address}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Fare Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {booking.distance?.toFixed(1)} km
              </span>
              {eta && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {eta.duration}
                </span>
              )}
            </div>
            <div className="flex items-center text-lg font-semibold">
              <IndianRupee className="h-5 w-5" />
              {booking.fare?.toFixed(0)}
            </div>
          </div>

          {/* Cancel Button (only for pending/accepted status) */}
          {(booking.status === BookingStatus.PENDING ||
            booking.status === BookingStatus.ACCEPTED) && (
            <>
              <Separator />
              <Button
                variant="destructive"
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="w-full"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel Ride
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function EnhancedActiveBookingTracker(props: EnhancedActiveBookingTrackerProps) {
  return (
    <GoogleMapsProvider>
      <EnhancedActiveBookingTrackerContent {...props} />
    </GoogleMapsProvider>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { APIBook, type Booking, BookingStatus } from '@/lib/firebase/services';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  GoogleMapsProvider,
  DriverLocationTracker,
  type Location,
} from '@/components/maps';
import {
  MapPin,
  Navigation,
  Phone,
  Clock,
  IndianRupee,
  Check,
  X,
  Play,
  CheckCircle,
  Loader2,
  Bell,
  User,
  AlertCircle,
  Route,
} from 'lucide-react';

interface DriverBookingManagerProps {
  driverId: string;
  onBookingComplete?: (completedBooking: Booking) => void;
}

function DriverBookingManagerContent({ driverId, onBookingComplete }: DriverBookingManagerProps) {
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Subscribe to pending bookings and check for active booking
  useEffect(() => {
    setLoading(true);

    // Check for active booking first
    const checkActiveBooking = async () => {
      const result = await APIBook.booking.getDriverActiveBooking(driverId);
      if (result.success && result.data) {
        setActiveBooking(result.data);
        
        // Subscribe to active booking updates
        const unsubscribe = APIBook.booking.subscribeToBooking(
          result.data.id,
          (updatedBooking) => {
            if (updatedBooking) {
              if (updatedBooking.status === BookingStatus.COMPLETED) {
                // Notify parent for rating dialog
                onBookingComplete?.(updatedBooking);
                setActiveBooking(null);
              } else if (updatedBooking.status === BookingStatus.CANCELLED) {
                setActiveBooking(null);
              } else {
                setActiveBooking(updatedBooking);
              }
            } else {
              setActiveBooking(null);
            }
          }
        );
        return unsubscribe;
      }
      return null;
    };

    // Subscribe to pending bookings
    const unsubscribePending = APIBook.booking.subscribeToDriverPendingBookings(
      driverId,
      (bookings) => {
        setPendingBookings(bookings);
        setLoading(false);
      }
    );

    let activeUnsubscribe: (() => void) | null = null;
    checkActiveBooking().then((unsub) => {
      activeUnsubscribe = unsub;
      setLoading(false);
    });

    return () => {
      unsubscribePending();
      if (activeUnsubscribe) activeUnsubscribe();
    };
  }, [driverId]);

  // Accept booking
  const handleAcceptBooking = async (bookingId: string) => {
    setActionLoading(bookingId);
    setError('');

    const result = await APIBook.booking.acceptBooking(bookingId, driverId);
    
    if (result.success) {
      // Fetch the booking to set as active with updated status
      const bookingResult = await APIBook.booking.getBooking(bookingId);
      if (bookingResult.success && bookingResult.data) {
        // Important: Update the status to ACCEPTED since acceptBooking just succeeded
        const updatedBooking = {
          ...bookingResult.data,
          status: BookingStatus.ACCEPTED,
        };
        setActiveBooking(updatedBooking);
        
        // Subscribe to real-time updates for this booking
        const unsubscribe = APIBook.booking.subscribeToBooking(
          bookingId,
          (updatedBooking) => {
            if (updatedBooking) {
              if (updatedBooking.status === BookingStatus.COMPLETED) {
                // Notify parent for rating dialog
                onBookingComplete?.(updatedBooking);
                setActiveBooking(null);
              } else if (updatedBooking.status === BookingStatus.CANCELLED) {
                setActiveBooking(null);
              } else {
                setActiveBooking(updatedBooking);
              }
            } else {
              setActiveBooking(null);
            }
          }
        );
        // Note: This creates a new subscription. The cleanup is handled in the main useEffect
      }
    } else {
      setError(result.error || 'Failed to accept booking');
    }

    setActionLoading(null);
  };

  // Reject booking
  const handleRejectBooking = async (bookingId: string) => {
    setActionLoading(bookingId);
    setError('');

    const result = await APIBook.booking.rejectBooking(bookingId, driverId);
    
    if (!result.success) {
      setError(result.error || 'Failed to reject booking');
    }

    setActionLoading(null);
  };

  // Start ride
  const handleStartRide = async () => {
    if (!activeBooking) return;

    setActionLoading('start');
    setError('');

    // Fetch the latest booking status to ensure it's ACCEPTED
    const latestBooking = await APIBook.booking.getBooking(activeBooking.id);
    
    if (!latestBooking.success || !latestBooking.data) {
      setError('Failed to fetch booking status');
      setActionLoading(null);
      return;
    }

    // Verify the booking is in ACCEPTED status
    if (latestBooking.data.status !== BookingStatus.ACCEPTED) {
      setError(`Cannot start ride. Current status: ${latestBooking.data.status}. Expected: accepted`);
      setActionLoading(null);
      return;
    }

    const result = await APIBook.booking.startRide(activeBooking.id, driverId);
    
    if (!result.success) {
      setError(result.error || 'Failed to start ride');
    } else {
      // Update local state to reflect the new status
      setActiveBooking({
        ...activeBooking,
        status: BookingStatus.IN_PROGRESS,
        rideStartTime: new Date().toISOString(),
      });
    }

    setActionLoading(null);
  };

  // Complete ride
  const handleCompleteRide = async () => {
    if (!activeBooking) return;

    setActionLoading('complete');
    setError('');

    const result = await APIBook.booking.completeRide(activeBooking.id, driverId);
    
    if (result.success) {
      setActiveBooking(null);
    } else {
      setError(result.error || 'Failed to complete ride');
    }

    setActionLoading(null);
  };

  // Cancel booking (by driver - works at any status)
  const handleCancelBooking = async () => {
    if (!activeBooking) return;

    setActionLoading('cancel');
    setError('');

    const result = await APIBook.booking.rejectBooking(activeBooking.id, driverId);
    
    if (result.success) {
      setActiveBooking(null);
    } else {
      setError(result.error || 'Failed to cancel booking');
    }

    setActionLoading(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Show active booking management
  if (activeBooking) {
    return (
      <div className="space-y-4">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeBooking.status === BookingStatus.IN_PROGRESS ? (
              <Navigation className="h-5 w-5 text-primary" />
            ) : (
              <Clock className="h-5 w-5 text-blue-500" />
            )}
            <h3 className="font-semibold text-lg">
              {activeBooking.status === BookingStatus.IN_PROGRESS ? 'Ride in Progress' : 'Heading to Pickup'}
            </h3>
          </div>
          <Badge variant={activeBooking.status === BookingStatus.IN_PROGRESS ? 'default' : 'secondary'}>
            {activeBooking.status === BookingStatus.IN_PROGRESS ? 'In Progress' : 'Accepted'}
          </Badge>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Driver Location Tracking */}
        <DriverLocationTracker
          bookingId={activeBooking.id}
          driverId={driverId}
          pickup={{
            lat: activeBooking.pickupLocation.lat,
            lng: activeBooking.pickupLocation.lng,
            address: activeBooking.pickupLocation.address,
          }}
          dropoff={{
            lat: activeBooking.dropLocation.lat,
            lng: activeBooking.dropLocation.lng,
            address: activeBooking.dropLocation.address,
          }}
          isDriver={true}
          bookingStatus={activeBooking.status}
        />

        {/* Student Info - flat, not nested card */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-sm bg-primary/20 text-primary">
                {activeBooking.studentName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{activeBooking.studentName}</p>
              <p className="text-xs text-muted-foreground">Student</p>
            </div>
          </div>
          <Button variant="outline" size="icon" className="rounded-full" asChild>
            <a href={`tel:${activeBooking.studentPhone}`}>
              <Phone className="h-4 w-4" />
            </a>
          </Button>
        </div>

        {/* Route Info */}
        <div className="space-y-2">
          <div className={`flex items-start gap-3 p-3 rounded-lg ${
            activeBooking.status === BookingStatus.ACCEPTED ? 'bg-primary/10 border border-primary/20' : ''
          }`}>
            <div className="mt-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">
                {activeBooking.status === BookingStatus.ACCEPTED ? 'Navigate to Pickup' : 'Pickup'}
              </p>
              <p className="font-medium text-sm truncate">{activeBooking.pickupLocation.address || 'Pickup Location'}</p>
            </div>
            {activeBooking.status === BookingStatus.ACCEPTED && (
              <Button variant="outline" size="sm" className="shrink-0" asChild>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeBooking.pickupLocation.lat},${activeBooking.pickupLocation.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Route className="h-3.5 w-3.5 mr-1" />
                  Navigate
                </a>
              </Button>
            )}
          </div>

          <div className="ml-1.5 h-3 border-l-2 border-dashed border-muted-foreground/40" />

          <div className={`flex items-start gap-3 p-3 rounded-lg ${
            activeBooking.status === BookingStatus.IN_PROGRESS ? 'bg-primary/10 border border-primary/20' : ''
          }`}>
            <div className="mt-1.5">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">
                {activeBooking.status === BookingStatus.IN_PROGRESS ? 'Navigate to Drop' : 'Drop'}
              </p>
              <p className="font-medium text-sm truncate">{activeBooking.dropLocation.address || 'Drop Location'}</p>
            </div>
            {activeBooking.status === BookingStatus.IN_PROGRESS && (
              <Button variant="outline" size="sm" className="shrink-0" asChild>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeBooking.dropLocation.lat},${activeBooking.dropLocation.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Route className="h-3.5 w-3.5 mr-1" />
                  Navigate
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Fare & Distance - inline */}
        <div className="flex items-center justify-between py-3 border-t border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground">Fare</p>
            <p className="text-xl font-bold flex items-center gap-0.5">
              <IndianRupee className="h-4 w-4" />
              {activeBooking.fare}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Distance</p>
            <p className="font-medium">{activeBooking.distance} km</p>
          </div>
        </div>

        {/* Action Buttons */}
        {activeBooking.status === BookingStatus.ACCEPTED && (
          <Button
            onClick={handleStartRide}
            disabled={actionLoading === 'start'}
            className="w-full"
            size="lg"
          >
            {actionLoading === 'start' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Start Ride (Picked up Student)
          </Button>
        )}

        {activeBooking.status === BookingStatus.IN_PROGRESS && (
          <Button
            onClick={handleCompleteRide}
            disabled={actionLoading === 'complete'}
            className="w-full"
            size="lg"
          >
            {actionLoading === 'complete' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Complete Ride (Reached Destination)
          </Button>
        )}

        {/* Cancel Button - available at any status */}
        {(activeBooking.status === BookingStatus.ACCEPTED || activeBooking.status === BookingStatus.IN_PROGRESS) && (
          <Button
            variant="outline"
            onClick={handleCancelBooking}
            disabled={actionLoading === 'cancel'}
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            size="lg"
          >
            {actionLoading === 'cancel' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            Cancel Ride
          </Button>
        )}
      </div>
    );
  }

  // Show pending booking requests
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Booking Requests
        </h3>
        {pendingBookings.length > 0 && (
          <Badge variant="secondary">{pendingBookings.length}</Badge>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {pendingBookings.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Waiting for ride requests...
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Stay online to receive bookings
          </p>
        </div>
      ) : (
        pendingBookings.map((booking) => (
          <div key={booking.id} className="border border-border rounded-xl p-4 space-y-3 hover:border-primary/30 transition-colors">
            {/* Student Info + Fare */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm bg-primary/20 text-primary">
                  {booking.studentName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{booking.studentName}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(booking.bookingTime).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg flex items-center gap-0.5 justify-end">
                  <IndianRupee className="h-4 w-4" />
                  {booking.fare}
                </p>
                <p className="text-xs text-muted-foreground">{booking.distance} km</p>
              </div>
            </div>

            {/* Route */}
            <div className="space-y-1.5 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-muted-foreground truncate">{booking.pickupLocation.address || 'Pickup Location'}</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full border-2 border-primary mt-1.5 shrink-0" />
                <p className="text-muted-foreground truncate">{booking.dropLocation.address || 'Drop Location'}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={() => handleRejectBooking(booking.id)}
                disabled={actionLoading === booking.id}
              >
                {actionLoading === booking.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Decline
                  </>
                )}
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleAcceptBooking(booking.id)}
                disabled={actionLoading === booking.id}
              >
                {actionLoading === booking.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Accept
                  </>
                )}
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function DriverBookingManager(props: DriverBookingManagerProps) {
  return (
    <GoogleMapsProvider>
      <DriverBookingManagerContent {...props} />
    </GoogleMapsProvider>
  );
}

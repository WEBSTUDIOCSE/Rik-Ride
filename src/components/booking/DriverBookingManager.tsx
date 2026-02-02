'use client';

import { useState, useEffect } from 'react';
import { APIBook, type Booking, BookingStatus } from '@/lib/firebase/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
} from 'lucide-react';

interface DriverBookingManagerProps {
  driverId: string;
}

export default function DriverBookingManager({ driverId }: DriverBookingManagerProps) {
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
              if (updatedBooking.status === BookingStatus.COMPLETED ||
                  updatedBooking.status === BookingStatus.CANCELLED) {
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
      // Fetch the booking to set as active
      const bookingResult = await APIBook.booking.getBooking(bookingId);
      if (bookingResult.success && bookingResult.data) {
        setActiveBooking(bookingResult.data);
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

    const result = await APIBook.booking.startRide(activeBooking.id, driverId);
    
    if (!result.success) {
      setError(result.error || 'Failed to start ride');
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {activeBooking.status === BookingStatus.IN_PROGRESS ? (
                  <>
                    <Navigation className="h-5 w-5" />
                    Ride in Progress
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5" />
                    Heading to Pickup
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {activeBooking.status === BookingStatus.IN_PROGRESS
                  ? 'Navigate to the drop location'
                  : 'Navigate to pickup the student'}
              </CardDescription>
            </div>
            <Badge>
              {activeBooking.status === BookingStatus.IN_PROGRESS ? 'In Progress' : 'Accepted'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Student Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="text-lg">
                      {activeBooking.studentName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg">{activeBooking.studentName}</p>
                    <p className="text-sm text-muted-foreground">Student</p>
                  </div>
                </div>
                <Button variant="outline" size="icon" asChild>
                  <a href={`tel:${activeBooking.studentPhone}`}>
                    <Phone className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Route Info */}
          <div className="space-y-3">
            <div className={`flex items-start gap-3 p-3 rounded-lg ${
              activeBooking.status === BookingStatus.ACCEPTED ? 'bg-primary/10' : ''
            }`}>
              <div className="mt-1">
                <div className="w-3 h-3 rounded-full bg-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {activeBooking.status === BookingStatus.ACCEPTED ? 'Navigate to Pickup' : 'Pickup'}
                </p>
                <p className="font-medium">{activeBooking.pickupLocation.address || 'Pickup Location'}</p>
              </div>
              {activeBooking.status === BookingStatus.ACCEPTED && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeBooking.pickupLocation.lat},${activeBooking.pickupLocation.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Navigate
                  </a>
                </Button>
              )}
            </div>

            <div className="ml-1.5 h-4 border-l-2 border-dashed border-muted-foreground" />

            <div className={`flex items-start gap-3 p-3 rounded-lg ${
              activeBooking.status === BookingStatus.IN_PROGRESS ? 'bg-primary/10' : ''
            }`}>
              <div className="mt-1">
                <div className="w-3 h-3 rounded-full border-2 border-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {activeBooking.status === BookingStatus.IN_PROGRESS ? 'Navigate to Drop' : 'Drop'}
                </p>
                <p className="font-medium">{activeBooking.dropLocation.address || 'Drop Location'}</p>
              </div>
              {activeBooking.status === BookingStatus.IN_PROGRESS && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeBooking.dropLocation.lat},${activeBooking.dropLocation.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Navigate
                  </a>
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Fare Info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Fare</p>
              <p className="text-2xl font-bold flex items-center gap-1">
                <IndianRupee className="h-5 w-5" />
                {activeBooking.fare}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Distance</p>
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
        </CardContent>
      </Card>
    );
  }

  // Show pending booking requests
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Booking Requests
        </CardTitle>
        <CardDescription>
          {pendingBookings.length === 0
            ? 'No pending requests. Stay online to receive bookings.'
            : `You have ${pendingBookings.length} pending ${pendingBookings.length === 1 ? 'request' : 'requests'}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {pendingBookings.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Waiting for ride requests...
            </p>
          </div>
        ) : (
          pendingBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardContent className="pt-4 space-y-4">
                {/* Student Info */}
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {booking.studentName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{booking.studentName}</p>
                    <p className="text-sm text-muted-foreground">
                      Requested {new Date(booking.bookingTime).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg flex items-center gap-1 justify-end">
                      <IndianRupee className="h-4 w-4" />
                      {booking.fare}
                    </p>
                    <p className="text-sm text-muted-foreground">{booking.distance} km</p>
                  </div>
                </div>

                {/* Route */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                    <div className="flex-1">
                      <p className="text-muted-foreground">Pickup</p>
                      <p className="font-medium">{booking.pickupLocation.address || 'Pickup Location'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full border-2 border-primary mt-1.5" />
                    <div className="flex-1">
                      <p className="text-muted-foreground">Drop</p>
                      <p className="font-medium">{booking.dropLocation.address || 'Drop Location'}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    className="flex-1"
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
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
}

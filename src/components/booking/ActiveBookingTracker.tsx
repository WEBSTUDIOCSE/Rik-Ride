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
  Star,
  Car,
  Clock,
  IndianRupee,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

interface ActiveBookingTrackerProps {
  studentId: string;
  initialBooking?: Booking | null;
  onBookingComplete?: () => void;
  onBookingCancelled?: () => void;
}

export default function ActiveBookingTracker({
  studentId,
  initialBooking,
  onBookingComplete,
  onBookingCancelled,
}: ActiveBookingTrackerProps) {
  const [booking, setBooking] = useState<Booking | null>(initialBooking || null);
  const [loading, setLoading] = useState(!initialBooking);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Subscribe to booking updates
  useEffect(() => {
    if (!initialBooking?.id) {
      // Fetch active booking if not provided
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

    // Subscribe to real-time updates
    const unsubscribe = APIBook.booking.subscribeToBooking(
      initialBooking.id,
      (updatedBooking) => {
        setBooking(updatedBooking);
        
        // Handle booking completion
        if (updatedBooking?.status === BookingStatus.COMPLETED) {
          setShowRating(true);
        }
        
        // Handle booking cancellation
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

  // Submit rating
  const handleSubmitRating = async () => {
    if (!booking) return;

    setSubmittingRating(true);
    setError('');

    const result = await APIBook.booking.rateDriver(
      booking.id,
      studentId,
      rating,
      review.trim() || undefined
    );

    if (result.success) {
      setShowRating(false);
      onBookingComplete?.();
    } else {
      setError(result.error || 'Failed to submit rating');
    }

    setSubmittingRating(false);
  };

  // Get status display info
  const getStatusInfo = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING:
        return {
          label: 'Waiting for Driver',
          description: 'Your booking request has been sent to the driver',
          variant: 'secondary' as const,
          icon: Clock,
        };
      case BookingStatus.ACCEPTED:
        return {
          label: 'Driver on the way',
          description: 'Driver has accepted your request and is coming to pick you up',
          variant: 'default' as const,
          icon: Car,
        };
      case BookingStatus.IN_PROGRESS:
        return {
          label: 'Ride in Progress',
          description: 'You are on your way to the destination',
          variant: 'default' as const,
          icon: Navigation,
        };
      case BookingStatus.COMPLETED:
        return {
          label: 'Ride Completed',
          description: 'You have reached your destination',
          variant: 'default' as const,
          icon: CheckCircle,
        };
      case BookingStatus.CANCELLED:
        return {
          label: 'Cancelled',
          description: 'This booking has been cancelled',
          variant: 'destructive' as const,
          icon: X,
        };
    }
  };

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!booking) {
    return null;
  }

  const statusInfo = getStatusInfo(booking.status);
  const StatusIcon = statusInfo.icon;

  // Rating modal after ride completion
  if (showRating && booking.status === BookingStatus.COMPLETED && !booking.driverRating) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-2" />
          <CardTitle>Ride Completed!</CardTitle>
          <CardDescription>
            How was your ride with {booking.driverName}?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`p-1 transition-transform hover:scale-110 ${
                  star <= rating ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Star className={`h-8 w-8 ${star <= rating ? 'fill-current' : ''}`} />
              </button>
            ))}
          </div>

          {/* Review Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Write a review (optional)</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience..."
              className="w-full p-3 border rounded-md resize-none h-24"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowRating(false);
                onBookingComplete?.();
              }}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmitRating}
              disabled={submittingRating}
              className="flex-1"
            >
              {submittingRating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Submit Rating'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon className="h-5 w-5" />
              {statusInfo.label}
            </CardTitle>
            <CardDescription>{statusInfo.description}</CardDescription>
          </div>
          <Badge variant={statusInfo.variant}>
            {booking.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Driver Info */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="text-lg">
                    {booking.driverName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{booking.driverName}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{booking.vehicleNumber}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                >
                  <a href={`tel:${booking.driverPhone}`}>
                    <Phone className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Route Info */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <div className="w-3 h-3 rounded-full bg-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Pickup Location</p>
              <p className="font-medium">{booking.pickupLocation.address || 'Pickup Point'}</p>
            </div>
          </div>
          
          <div className="ml-1.5 h-6 border-l-2 border-dashed border-muted-foreground" />
          
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <div className="w-3 h-3 rounded-full border-2 border-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Drop Location</p>
              <p className="font-medium">{booking.dropLocation.address || 'Drop Point'}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Fare Info */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Fare</p>
            <p className="text-2xl font-bold flex items-center gap-1">
              <IndianRupee className="h-5 w-5" />
              {booking.fare}
            </p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-sm text-muted-foreground">Distance</p>
            <p className="font-medium">{booking.distance} km</p>
          </div>
        </div>

        {/* Status-based Actions */}
        {booking.status === BookingStatus.PENDING && (
          <div className="space-y-3">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Waiting for driver to accept your request...
              </AlertDescription>
            </Alert>
            <Button
              variant="destructive"
              onClick={handleCancelBooking}
              disabled={cancelling}
              className="w-full"
            >
              {cancelling ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Cancel Booking
            </Button>
          </div>
        )}

        {booking.status === BookingStatus.ACCEPTED && (
          <div className="space-y-3">
            <Alert>
              <Car className="h-4 w-4" />
              <AlertDescription>
                Driver is on the way to pick you up!
              </AlertDescription>
            </Alert>
            <Button
              variant="destructive"
              onClick={handleCancelBooking}
              disabled={cancelling}
              className="w-full"
            >
              {cancelling ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Cancel Booking
            </Button>
          </div>
        )}

        {booking.status === BookingStatus.IN_PROGRESS && (
          <Alert>
            <Navigation className="h-4 w-4" />
            <AlertDescription>
              Enjoy your ride! You're on your way to the destination.
            </AlertDescription>
          </Alert>
        )}

        {booking.status === BookingStatus.COMPLETED && booking.driverRating && (
          <div className="text-center py-4">
            <CheckCircle className="h-12 w-12 mx-auto mb-2" />
            <p className="font-medium">Ride Completed</p>
            <p className="text-sm text-muted-foreground">
              Thank you for riding with us!
            </p>
          </div>
        )}

        {booking.status === BookingStatus.CANCELLED && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This booking has been cancelled.
            </AlertDescription>
          </Alert>
        )}

        {/* Booking Time Info */}
        <div className="text-sm text-muted-foreground text-center">
          Booked at {new Date(booking.bookingTime).toLocaleString('en-IN')}
        </div>
      </CardContent>
    </Card>
  );
}

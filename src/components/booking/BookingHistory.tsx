'use client';

import { useState, useEffect } from 'react';
import { APIBook, type Booking, BookingStatus } from '@/lib/firebase/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MapPin,
  Navigation,
  Star,
  Clock,
  IndianRupee,
  CheckCircle,
  X,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronUp,
  History,
} from 'lucide-react';

interface BookingHistoryProps {
  userId: string;
  userType: 'student' | 'driver';
}

export default function BookingHistory({ userId, userType }: BookingHistoryProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const result = userType === 'student'
        ? await APIBook.booking.getStudentBookingHistory(userId)
        : await APIBook.booking.getDriverBookingHistory(userId);

      if (result.success && result.data) {
        setBookings(result.data);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [userId, userType]);

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.COMPLETED:
        return <Badge><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case BookingStatus.CANCELLED:
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg">No Ride History</h3>
          <p className="text-muted-foreground">
            {userType === 'student'
              ? "You haven't taken any rides yet."
              : "You haven't completed any rides yet."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Ride History
        </CardTitle>
        <CardDescription>
          {bookings.length} {bookings.length === 1 ? 'ride' : 'rides'} in total
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id} className="overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() =>
                setExpandedBooking(expandedBooking === booking.id ? null : booking.id)
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-center text-center min-w-[60px]">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(booking.bookingTime).split(' ')[1]}
                    </span>
                    <span className="text-xl font-bold">
                      {formatDate(booking.bookingTime).split(' ')[0]}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {userType === 'student' ? booking.driverName : booking.studentName}
                      </span>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[150px]">
                        {booking.pickupLocation.address || 'Pickup'}
                      </span>
                      <span>→</span>
                      <span className="truncate max-w-[150px]">
                        {booking.dropLocation.address || 'Drop'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold flex items-center gap-1 justify-end">
                      <IndianRupee className="h-4 w-4" />
                      {booking.fare}
                    </p>
                    <p className="text-sm text-muted-foreground">{booking.distance} km</p>
                  </div>
                  {expandedBooking === booking.id ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedBooking === booking.id && (
              <div className="px-4 pb-4 pt-2 border-t bg-muted/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Route Details */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Route Details</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Pickup</p>
                          <p className="text-sm">{booking.pickupLocation.address || 'Pickup Location'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full border-2 border-primary mt-1.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Drop</p>
                          <p className="text-sm">{booking.dropLocation.address || 'Drop Location'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Time Details */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Time Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Booked at</span>
                        <span>{formatTime(booking.bookingTime)}</span>
                      </div>
                      {booking.rideStartTime && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Started at</span>
                          <span>{formatTime(booking.rideStartTime)}</span>
                        </div>
                      )}
                      {booking.rideEndTime && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ended at</span>
                          <span>{formatTime(booking.rideEndTime)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rating Section */}
                {booking.status === BookingStatus.COMPLETED && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      {userType === 'student' && booking.driverRating && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Your rating:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= booking.driverRating!
                                    ? 'fill-current'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {userType === 'driver' && booking.studentRating && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Student rating:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= booking.studentRating!
                                    ? 'fill-current'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {booking.driverReview && userType === 'student' && (
                      <p className="text-sm mt-2 italic text-muted-foreground">
                        "{booking.driverReview}"
                      </p>
                    )}
                  </div>
                )}

                {/* Vehicle Info */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Vehicle</span>
                    <span className="font-medium">{booking.vehicleNumber}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { APIBook, type Booking, BookingStatus } from '@/lib/firebase/services';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Star,
  IndianRupee,
  CheckCircle,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  History,
  Car,
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
        return (
          <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />Completed
          </Badge>
        );
      case BookingStatus.CANCELLED:
        return (
          <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
            <X className="h-3 w-3 mr-1" />Cancelled
          </Badge>
        );
      default:
        return <Badge className="bg-white/10 text-white/70">{status}</Badge>;
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
      <div className="bg-white/10 backdrop-blur-md border-2 border-[#FFD700]/30 rounded-xl p-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FFD700]" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-md border-2 border-[#FFD700]/30 rounded-xl p-8 text-center">
        <History className="h-12 w-12 mx-auto mb-4 text-white/40" />
        <h3 className="font-semibold text-lg text-white mb-2">Koi Ride History Nahi</h3>
        <p className="text-white/60 text-sm">
          {userType === 'student'
            ? "Abhi tak koi ride nahi li. Pehli ride book karo! ��"
            : "Abhi tak koi ride complete nahi hui."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-[#FFD700]" />
          <h2 className="text-lg font-semibold text-white">Ride History</h2>
        </div>
        <span className="text-sm text-white/60">
          {bookings.length} {bookings.length === 1 ? 'ride' : 'rides'}
        </span>
      </div>

      {/* Booking List */}
      <div className="space-y-3">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="bg-white/10 backdrop-blur-md border border-[#FFD700]/20 rounded-xl overflow-hidden"
          >
            {/* Booking Summary - Always Visible */}
            <div
              className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() =>
                setExpandedBooking(expandedBooking === booking.id ? null : booking.id)
              }
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left Side - Date & Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Date Badge */}
                  <div className="hidden sm:flex flex-col items-center bg-[#252525] rounded-lg p-2 min-w-[50px]">
                    <span className="text-xs text-[#FFD700]">
                      {formatDate(booking.bookingTime).split(' ')[1]}
                    </span>
                    <span className="text-lg font-bold text-white">
                      {formatDate(booking.bookingTime).split(' ')[0]}
                    </span>
                  </div>

                  {/* Ride Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-white truncate">
                        {userType === 'student' ? booking.driverName : booking.studentName}
                      </span>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-white/60">
                      <MapPin className="h-3 w-3 flex-shrink-0 text-[#009944]" />
                      <span className="truncate">
                        {booking.pickupLocation.address?.split(',')[0] || 'Pickup'}
                      </span>
                      <span className="text-[#FFD700]">→</span>
                      <span className="truncate">
                        {booking.dropLocation.address?.split(',')[0] || 'Drop'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side - Fare & Toggle */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-[#FFD700] flex items-center gap-0.5 justify-end">
                      <IndianRupee className="h-4 w-4" />
                      {booking.fare}
                    </p>
                    <p className="text-xs text-white/50">{booking.distance} km</p>
                  </div>
                  {expandedBooking === booking.id ? (
                    <ChevronUp className="h-5 w-5 text-white/40" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-white/40" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedBooking === booking.id && (
              <div className="px-4 pb-4 pt-2 border-t border-white/10 bg-[#252525]/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Route Details */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-[#FFD700]">Route Details</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#009944] mt-1.5" />
                        <div>
                          <p className="text-xs text-white/50">Pickup</p>
                          <p className="text-sm text-white">{booking.pickupLocation.address || 'Pickup Location'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full border-2 border-red-500 mt-1.5" />
                        <div>
                          <p className="text-xs text-white/50">Drop</p>
                          <p className="text-sm text-white">{booking.dropLocation.address || 'Drop Location'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Time Details */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-[#FFD700]">Time Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/50">Booked at</span>
                        <span className="text-white">{formatTime(booking.bookingTime)}</span>
                      </div>
                      {booking.rideStartTime && (
                        <div className="flex justify-between">
                          <span className="text-white/50">Started at</span>
                          <span className="text-white">{formatTime(booking.rideStartTime)}</span>
                        </div>
                      )}
                      {booking.rideEndTime && (
                        <div className="flex justify-between">
                          <span className="text-white/50">Ended at</span>
                          <span className="text-white">{formatTime(booking.rideEndTime)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rating Section */}
                {booking.status === BookingStatus.COMPLETED && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      {userType === 'student' && booking.driverRating && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white/50">Your rating:</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= booking.driverRating!
                                    ? 'fill-[#FFD700] text-[#FFD700]'
                                    : 'text-white/20'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {userType === 'driver' && booking.studentRating && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white/50">Student rating:</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= booking.studentRating!
                                    ? 'fill-[#FFD700] text-[#FFD700]'
                                    : 'text-white/20'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {booking.driverReview && userType === 'student' && (
                      <p className="text-sm mt-2 italic text-white/60">
                        "{booking.driverReview}"
                      </p>
                    )}
                  </div>
                )}

                {/* Vehicle Info */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-white/50">
                      <Car className="h-4 w-4" />
                      <span>Vehicle</span>
                    </div>
                    <span className="font-medium text-white">{booking.vehicleNumber}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

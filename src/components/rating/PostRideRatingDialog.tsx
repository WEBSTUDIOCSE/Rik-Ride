/**
 * Post-Ride Rating Dialog
 * Shows after a ride is completed to collect rating
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import RatingForm from './RatingForm';
import { 
  RatingService,
  type Booking,
  RatingType,
  BookingStatus,
} from '@/lib/firebase/services';

interface PostRideRatingDialogProps {
  // Booking can be null - dialog won't show
  booking: Booking | null;
  // Who is rating (student rates driver, driver rates student)
  raterType: RatingType;
  onRatingComplete?: () => void;
}

export default function PostRideRatingDialog({
  booking,
  raterType,
  onRatingComplete,
}: PostRideRatingDialogProps) {
  const [open, setOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [canRate, setCanRate] = useState(true);
  const [hasChecked, setHasChecked] = useState<string | null>(null);

  // Derive values from booking and raterType
  const isStudent = raterType === RatingType.STUDENT;
  const userId = isStudent ? booking?.studentId : booking?.driverId;
  const userName = isStudent ? booking?.studentName : booking?.driverName;
  const rateeId = isStudent ? booking?.driverId : booking?.studentId;
  const rateeName = isStudent ? booking?.driverName : booking?.studentName;
  const rateeType = isStudent ? RatingType.DRIVER : RatingType.STUDENT;

  // Check if we should show the rating dialog for completed bookings
  useEffect(() => {
    const checkAndShowDialog = async () => {
      if (!booking || !userId) return;
      
      // Only show for completed bookings
      if (booking.status !== BookingStatus.COMPLETED) {
        setOpen(false);
        return;
      }

      // Don't recheck the same booking
      if (hasChecked === booking.id) return;
      
      setHasChecked(booking.id);

      // Check if user can rate this booking
      const result = await RatingService.canRateBooking(booking.id, userId);
      if (result.success && result.data === true) {
        setCanRate(true);
        setOpen(true);
      } else {
        setCanRate(false);
        setOpen(false);
      }
    };

    checkAndShowDialog();
  }, [booking, userId, hasChecked]);

  const handleSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setOpen(false);
      onRatingComplete?.();
    }, 2000);
  };

  const handleSkip = () => {
    setOpen(false);
  };

  // Don't render if no booking, not completed, or can't rate
  if (!booking || !canRate || !userId || !userName || !rateeId || !rateeName) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        {showSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
            <p className="text-muted-foreground">
              Your feedback helps improve our service.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Rate Your Ride</DialogTitle>
              <DialogDescription>
                How was your experience with {rateeName}?
              </DialogDescription>
            </DialogHeader>
            
            <RatingForm
              bookingId={booking.id}
              raterId={userId}
              raterName={userName}
              raterType={raterType}
              rateeId={rateeId}
              rateeName={rateeName}
              rateeType={rateeType}
              pickupAddress={booking.pickupLocation.address || 'Pickup'}
              dropAddress={booking.dropLocation.address || 'Drop'}
              rideDate={booking.rideEndTime || booking.createdAt}
              fare={booking.fare}
              onSuccess={handleSuccess}
              onCancel={handleSkip}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

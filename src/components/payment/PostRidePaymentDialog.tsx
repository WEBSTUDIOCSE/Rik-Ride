/**
 * Post-Ride Payment Dialog
 * Shows FIRST after ride completion to collect payment
 * Then triggers the rating dialog
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RidePaymentDisplay } from './RidePaymentDisplay';
import { 
  type Booking,
  BookingStatus,
} from '@/lib/firebase/services';

interface PostRidePaymentDialogProps {
  // Booking can be null - dialog won't show
  booking: Booking | null;
  // Callback when payment is completed or skipped
  onPaymentComplete?: () => void;
}

export default function PostRidePaymentDialog({
  booking,
  onPaymentComplete,
}: PostRidePaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState<string | null>(null);

  // Check if we should show the payment dialog for completed bookings
  useEffect(() => {
    if (!booking) return;
    
    // Only show for completed bookings that haven't been rated yet
    if (booking.status !== BookingStatus.COMPLETED) {
      setOpen(false);
      return;
    }

    // Don't show if already rated (payment was already handled)
    if (booking.driverRating) {
      setOpen(false);
      return;
    }

    // Don't recheck the same booking
    if (hasChecked === booking.id) {
      return;
    }
    
    setHasChecked(booking.id);
    setOpen(true);
  }, [booking, hasChecked]);

  const handlePaymentConfirmed = () => {
    setOpen(false);
    onPaymentComplete?.();
  };

  const handleSkipPayment = () => {
    setOpen(false);
    onPaymentComplete?.();
  };

  // Don't render if no booking or not completed
  if (!booking || booking.status !== BookingStatus.COMPLETED) {
    return null;
  }

  // Don't show if already rated
  if (booking.driverRating) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <DialogTitle className="text-2xl">Ride Completed!</DialogTitle>
          <DialogDescription className="text-base">
            Please complete the payment before rating your driver
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Payment Display Component */}
          <RidePaymentDisplay 
            driverId={booking.driverId}
            driverName={booking.driverName}
            fare={booking.fare}
            bookingId={booking.id}
            onPaymentConfirmed={handlePaymentConfirmed}
          />

          {/* Skip Payment Option */}
          <div className="text-center border-t pt-4">
            <Button
              variant="ghost"
              onClick={handleSkipPayment}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              I'll pay later, continue to rating →
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

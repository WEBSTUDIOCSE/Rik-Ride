/**
 * Pending Ratings Component
 * Shows rides that haven't been rated yet
 */

'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Clock, IndianRupee, Star, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  type PendingRating,
  RatingType,
} from '@/lib/firebase/services';
import { cn } from '@/lib/utils';

interface PendingRatingsProps {
  userId: string;
  userName: string;
  userType: RatingType;
  onRatingComplete?: () => void;
  className?: string;
}

export default function PendingRatings({
  userId,
  userName,
  userType,
  onRatingComplete,
  className,
}: PendingRatingsProps) {
  const [pendingRatings, setPendingRatings] = useState<PendingRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState<PendingRating | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadPendingRatings = async () => {
    setLoading(true);
    try {
      const result = await RatingService.getPendingRatings(userId, userType);
      if (result.success && result.data) {
        setPendingRatings(result.data);
      }
    } catch (error) {
      console.error('Error loading pending ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingRatings();
  }, [userId, userType]);

  const handleRateClick = (ride: PendingRating) => {
    setSelectedRide(ride);
    setDialogOpen(true);
  };

  const handleRatingSuccess = () => {
    setDialogOpen(false);
    setSelectedRide(null);
    loadPendingRatings();
    onRatingComplete?.();
  };

  const handleSkip = () => {
    setDialogOpen(false);
    setSelectedRide(null);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (pendingRatings.length === 0) {
    return null; // Don't show if no pending ratings
  }

  return (
    <>
      <Card className={cn('border-yellow-200 bg-yellow-50/50', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Rate Your Recent Rides
          </CardTitle>
          <CardDescription>
            You have {pendingRatings.length} ride{pendingRatings.length > 1 ? 's' : ''} to rate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingRatings.map((ride) => (
            <div
              key={ride.bookingId}
              className="flex items-center justify-between p-4 bg-white rounded-lg border cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleRateClick(ride)}
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{ride.partnerName}</Badge>
                  <span className="text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {new Date(ride.rideDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  {ride.pickupAddress.substring(0, 30)}...
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-3 w-3 text-green-600" />
                  <span className="text-sm font-medium">₹{ride.fare}</span>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Rate <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Rating Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Your Ride</DialogTitle>
            <DialogDescription>
              Share your experience with {selectedRide?.partnerName}
            </DialogDescription>
          </DialogHeader>
          {selectedRide && (
            <RatingForm
              bookingId={selectedRide.bookingId}
              raterId={userId}
              raterName={userName}
              raterType={userType}
              rateeId={selectedRide.partnerId}
              rateeName={selectedRide.partnerName}
              rateeType={selectedRide.partnerType}
              pickupAddress={selectedRide.pickupAddress}
              dropAddress={selectedRide.dropAddress}
              rideDate={selectedRide.rideDate}
              fare={selectedRide.fare}
              onSuccess={handleRatingSuccess}
              onCancel={handleSkip}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

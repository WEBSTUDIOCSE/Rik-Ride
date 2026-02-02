/**
 * User Rating Section
 * Fetches and displays a user's ratings with pending ratings
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import RatingDisplay from './RatingDisplay';
import PendingRatings from './PendingRatings';
import { 
  RatingService,
  type RatingSummary,
} from '@/lib/firebase/services';
import { RatingType } from '@/lib/types/rating.types';

interface UserRatingSectionProps {
  userId: string;
  userName: string;
  userType: RatingType;
  showPendingRatings?: boolean;
  showRecentReviews?: boolean;
  className?: string;
}

export default function UserRatingSection({
  userId,
  userName,
  userType,
  showPendingRatings = true,
  showRecentReviews = true,
  className,
}: UserRatingSectionProps) {
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    
    try {
      console.log('[UserRatingSection] Fetching summary for:', userId, userType);
      const result = await RatingService.getRatingSummary(userId, userType);
      console.log('[UserRatingSection] Result:', result);
      
      if (result.success && result.data) {
        setSummary(result.data);
      } else {
        // Set a default empty summary so the UI still shows
        setSummary({
          userId,
          userType,
          averageRating: 0,
          totalRatings: 0,
          ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          recentRatings: [],
          topTags: [],
          lastUpdated: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('[UserRatingSection] Error:', error);
      // Set default on error too
      setSummary({
        userId,
        userType,
        averageRating: 0,
        totalRatings: 0,
        ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recentRatings: [],
        topTags: [],
        lastUpdated: new Date().toISOString(),
      });
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchSummary();
  }, [userId, userType]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">Loading ratings...</p>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <Star className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-20" />
          <p className="text-muted-foreground">No ratings available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <RatingDisplay
        summary={summary}
        showRecentReviews={showRecentReviews}
      />
      
      {showPendingRatings && (
        <div className="mt-6">
          <PendingRatings
            userId={userId}
            userName={userName}
            userType={userType}
          />
        </div>
      )}
    </div>
  );
}

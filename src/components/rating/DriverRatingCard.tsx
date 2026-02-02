/**
 * Driver Rating Card Component
 * Shows driver rating summary for booking selection
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, User, Shield, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import StarRating from './StarRating';
import { 
  RatingService,
  type RatingSummary,
  RatingType,
  getRatingLabel,
  getRatingColor,
} from '@/lib/firebase/services';
import { cn } from '@/lib/utils';

interface DriverRatingCardProps {
  driverId: string;
  driverName: string;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function DriverRatingCard({
  driverId,
  driverName,
  showDetails = false,
  size = 'md',
  className,
}: DriverRatingCardProps) {
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRating = async () => {
      try {
        const result = await RatingService.getRatingSummary(driverId, RatingType.DRIVER);
        if (result.success && result.data) {
          setSummary(result.data);
        }
      } catch (error) {
        console.error('Error loading driver rating:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRating();
  }, [driverId]);

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-10" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className={cn('flex items-center gap-1 text-muted-foreground', className)}>
        <Star className="h-4 w-4" />
        <span className="text-sm">New Driver</span>
      </div>
    );
  }

  const { averageRating, totalRatings, topTags } = summary;
  const positiveTags = topTags.filter(t => t.tag.category === 'positive').slice(0, 2);
  const isTopRated = averageRating >= 4.5 && totalRatings >= 10;
  const isVerified = totalRatings >= 5;

  if (size === 'sm') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        <span className={cn('text-sm font-medium', getRatingColor(averageRating))}>
          {averageRating.toFixed(1)}
        </span>
        <span className="text-xs text-muted-foreground">({totalRatings})</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn('space-y-2', className)}>
        {/* Rating Row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <StarRating value={averageRating} readonly size={size === 'lg' ? 'md' : 'sm'} />
            <span className={cn('font-semibold ml-1', getRatingColor(averageRating))}>
              {averageRating.toFixed(1)}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {totalRatings} {totalRatings === 1 ? 'review' : 'reviews'}
          </span>
          
          {/* Badges */}
          {isTopRated && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                  <Award className="h-3 w-3 mr-1" />
                  Top Rated
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>This driver has consistently high ratings</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {isVerified && !isTopRated && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>This driver has completed 5+ verified rides</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Top Tags */}
        {showDetails && positiveTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {positiveTags.map(({ tag, count }) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs bg-green-50 text-green-700 border-green-200"
              >
                <ThumbsUp className="h-2 w-2 mr-1" />
                {tag.label}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Rating Display Component
 * Shows a user's rating summary with breakdown
 */

'use client';

import React from 'react';
import { Star, TrendingUp, TrendingDown, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import StarRating from './StarRating';
import { 
  type RatingSummary, 
  type Rating,
  getRatingLabel,
  getRatingColor,
} from '@/lib/firebase/services';
import { cn } from '@/lib/utils';

interface RatingDisplayProps {
  summary: RatingSummary;
  showRecentReviews?: boolean;
  compact?: boolean;
  className?: string;
}

export default function RatingDisplay({
  summary,
  showRecentReviews = true,
  compact = false,
  className,
}: RatingDisplayProps) {
  const { averageRating, totalRatings, ratingBreakdown, recentRatings, topTags } = summary;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <StarRating value={averageRating} readonly size="sm" />
        <span className={cn('font-semibold', getRatingColor(averageRating))}>
          {averageRating.toFixed(1)}
        </span>
        <span className="text-sm text-muted-foreground">
          ({totalRatings} {totalRatings === 1 ? 'review' : 'reviews'})
        </span>
      </div>
    );
  }

  const maxCount = Math.max(...Object.values(ratingBreakdown), 1);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          Ratings & Reviews
        </CardTitle>
        <CardDescription>
          Based on {totalRatings} {totalRatings === 1 ? 'review' : 'reviews'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className={cn('text-4xl font-bold', getRatingColor(averageRating))}>
              {averageRating.toFixed(1)}
            </div>
            <StarRating value={averageRating} readonly size="sm" className="mt-1" />
            <div className="text-sm text-muted-foreground mt-1">
              {getRatingLabel(averageRating)}
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="flex items-center gap-2">
                <span className="w-3 text-sm text-muted-foreground">{stars}</span>
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                <Progress
                  value={(ratingBreakdown[stars as 1|2|3|4|5] / maxCount) * 100}
                  className="h-2 flex-1"
                />
                <span className="w-8 text-sm text-muted-foreground text-right">
                  {ratingBreakdown[stars as 1|2|3|4|5]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Tags */}
        {topTags.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">What people say</h4>
            <div className="flex flex-wrap gap-2">
              {topTags.map(({ tag, count }) => (
                <Badge
                  key={tag.id}
                  variant={tag.category === 'positive' ? 'default' : 'destructive'}
                  className={cn(
                    tag.category === 'positive' && 'bg-green-100 text-green-700 hover:bg-green-200'
                  )}
                >
                  {tag.category === 'positive' ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {tag.label} ({count})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recent Reviews */}
        {showRecentReviews && recentRatings.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Recent Reviews</h4>
            <div className="space-y-4">
              {recentRatings.slice(0, 3).map((rating) => (
                <RatingCard key={rating.id} rating={rating} />
              ))}
            </div>
          </div>
        )}

        {totalRatings === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No reviews yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Individual Rating Card
 */
function RatingCard({ rating }: { rating: Rating }) {
  const date = new Date(rating.createdAt);
  const formattedDate = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">{rating.raterName}</p>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
        </div>
        <StarRating value={rating.rating} readonly size="sm" />
      </div>

      {rating.review && (
        <p className="text-sm text-muted-foreground">{rating.review}</p>
      )}

      {rating.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {rating.tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="text-xs"
            >
              {tag.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

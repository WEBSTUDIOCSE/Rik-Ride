/**
 * Rating Form Component
 * Form for submitting a rating with review and tags
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Send, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import StarRating from './StarRating';
import { 
  RatingService,
  type CreateRatingData,
  type RatingTag,
  RatingType,
  DRIVER_RATING_TAGS,
  STUDENT_RATING_TAGS,
  getRatingLabel,
} from '@/lib/firebase/services';
import { cn } from '@/lib/utils';

const ratingSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  review: z.string().max(500, 'Review must be less than 500 characters').optional(),
  tags: z.array(z.string()).optional(),
});

type RatingFormValues = z.infer<typeof ratingSchema>;

interface RatingFormProps {
  bookingId: string;
  raterId: string;
  raterName: string;
  raterType: RatingType;
  rateeId: string;
  rateeName: string;
  rateeType: RatingType;
  pickupAddress: string;
  dropAddress: string;
  rideDate: string;
  fare: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RatingForm({
  bookingId,
  raterId,
  raterName,
  raterType,
  rateeId,
  rateeName,
  rateeType,
  pickupAddress,
  dropAddress,
  rideDate,
  fare,
  onSuccess,
  onCancel,
}: RatingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [currentRating, setCurrentRating] = useState(0);

  // Get tags based on who is being rated
  const availableTags = rateeType === RatingType.DRIVER ? DRIVER_RATING_TAGS : STUDENT_RATING_TAGS;

  const form = useForm<RatingFormValues>({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      rating: 0,
      review: '',
      tags: [],
    },
  });

  const handleTagToggle = (tagId: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tagId)) {
      newTags.delete(tagId);
    } else {
      newTags.add(tagId);
    }
    setSelectedTags(newTags);
  };

  const onSubmit = async (data: RatingFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const selectedTagObjects = availableTags.filter(tag => selectedTags.has(tag.id));
      
      const ratingData: CreateRatingData = {
        bookingId,
        raterId,
        raterName,
        raterType,
        rateeId,
        rateeName,
        rateeType,
        rating: data.rating,
        review: data.review,
        tags: selectedTagObjects,
        pickupAddress,
        dropAddress,
        rideDate,
        fare,
      };

      const result = await RatingService.submitRating(ratingData);

      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error || 'Failed to submit rating');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter tags based on rating
  const getRelevantTags = () => {
    if (currentRating >= 4) {
      return availableTags.filter(tag => tag.category === 'positive');
    } else if (currentRating <= 2) {
      return availableTags.filter(tag => tag.category === 'negative');
    }
    return availableTags;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate Your Ride</CardTitle>
        <CardDescription>
          How was your experience with {rateeName}?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Star Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem className="text-center">
                  <FormLabel className="text-base">Your Rating</FormLabel>
                  <FormControl>
                    <div className="flex flex-col items-center gap-2">
                      <StarRating
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value);
                          setCurrentRating(value);
                        }}
                        size="lg"
                      />
                      {field.value > 0 && (
                        <span className={cn(
                          'text-lg font-semibold',
                          field.value >= 4 ? 'text-green-600' :
                          field.value >= 3 ? 'text-yellow-600' : 'text-red-600'
                        )}>
                          {getRatingLabel(field.value)}
                        </span>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            {currentRating > 0 && (
              <div className="space-y-2">
                <FormLabel>What stood out? (Optional)</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {getRelevantTags().map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.has(tag.id) ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer transition-colors',
                        selectedTags.has(tag.id) && tag.category === 'positive' && 'bg-green-600 hover:bg-primary/80',
                        selectedTags.has(tag.id) && tag.category === 'negative' && 'bg-red-600 hover:bg-red-700',
                      )}
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      {tag.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Review Text */}
            <FormField
              control={form.control}
              name="review"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Write a Review (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={`Share your experience with ${rateeName}...`}
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Skip for Now
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting || currentRating === 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Rating
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

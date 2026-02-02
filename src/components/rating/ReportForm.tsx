/**
 * Report Form Component
 * Form for reporting issues with a ride or user
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertTriangle, Flag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { 
  RatingService,
  type CreateReportData,
  RatingType,
  ReportCategory,
  formatReportCategory,
} from '@/lib/firebase/services';

const reportSchema = z.object({
  category: z.nativeEnum(ReportCategory, {
    message: 'Please select a category',
  }),
  description: z
    .string()
    .min(20, 'Please provide more details (at least 20 characters)')
    .max(1000, 'Description must be less than 1000 characters'),
});

type ReportFormValues = z.infer<typeof reportSchema>;

interface ReportFormProps {
  bookingId: string;
  ratingId?: string;
  reporterId: string;
  reporterName: string;
  reporterType: RatingType;
  reportedUserId: string;
  reportedUserName: string;
  reportedUserType: RatingType;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReportForm({
  bookingId,
  ratingId,
  reporterId,
  reporterName,
  reporterType,
  reportedUserId,
  reportedUserName,
  reportedUserType,
  onSuccess,
  onCancel,
}: ReportFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      description: '',
    },
  });

  const onSubmit = async (data: ReportFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const reportData: CreateReportData = {
        bookingId,
        ratingId,
        reporterId,
        reporterName,
        reporterType,
        reportedUserId,
        reportedUserName,
        reportedUserType,
        category: data.category,
        description: data.description,
      };

      const result = await RatingService.submitReport(reportData);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      } else {
        setError(result.error || 'Failed to submit report');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-4">
              <Flag className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Report Submitted</h3>
            <p className="text-muted-foreground">
              We will review your report and take appropriate action.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-red-500" />
          Report an Issue
        </CardTitle>
        <CardDescription>
          Report a problem with {reportedUserName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Category Select */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an issue type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(ReportCategory).map((category) => (
                        <SelectItem key={category} value={category}>
                          {formatReportCategory(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Describe the Issue</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide as much detail as possible about what happened..."
                      className="resize-none"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Warning */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                False reports may result in action being taken against your account.
                Please only report genuine issues.
              </AlertDescription>
            </Alert>

            {/* Error */}
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
                  Cancel
                </Button>
              )}
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Flag className="mr-2 h-4 w-4" />
                    Submit Report
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

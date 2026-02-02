/**
 * Rating & Review Types for Rik-Ride
 * Defines all rating-related types and enums
 */

/**
 * Rating type - who is being rated
 */
export enum RatingType {
  DRIVER = 'driver',
  STUDENT = 'student',
}

/**
 * Report status for handling disputes
 */
export enum ReportStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

/**
 * Report category for issues
 */
export enum ReportCategory {
  SAFETY_CONCERN = 'safety_concern',
  RUDE_BEHAVIOR = 'rude_behavior',
  OVERCHARGING = 'overcharging',
  LATE_ARRIVAL = 'late_arrival',
  VEHICLE_CONDITION = 'vehicle_condition',
  ROUTE_DEVIATION = 'route_deviation',
  CANCELLATION = 'cancellation',
  HARASSMENT = 'harassment',
  OTHER = 'other',
}

/**
 * Individual rating interface
 */
export interface Rating {
  id: string;
  bookingId: string;
  
  // Who gave the rating
  raterId: string;
  raterName: string;
  raterType: RatingType; // STUDENT rates DRIVER, or DRIVER rates STUDENT
  
  // Who received the rating
  rateeId: string;
  rateeName: string;
  rateeType: RatingType;
  
  // Rating details
  rating: number; // 1-5 stars
  review: string | null;
  
  // Ride details for context
  pickupAddress: string;
  dropAddress: string;
  rideDate: string;
  fare: number;
  
  // Tags for quick feedback (optional)
  tags: RatingTag[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Rating tags for quick feedback
 */
export interface RatingTag {
  id: string;
  label: string;
  category: 'positive' | 'negative';
}

/**
 * Predefined rating tags for drivers
 */
export const DRIVER_RATING_TAGS: RatingTag[] = [
  // Positive
  { id: 'safe_driving', label: 'Safe Driving', category: 'positive' },
  { id: 'punctual', label: 'Punctual', category: 'positive' },
  { id: 'clean_vehicle', label: 'Clean Vehicle', category: 'positive' },
  { id: 'polite', label: 'Polite & Friendly', category: 'positive' },
  { id: 'knows_routes', label: 'Knows Routes Well', category: 'positive' },
  { id: 'comfortable_ride', label: 'Comfortable Ride', category: 'positive' },
  // Negative
  { id: 'rash_driving', label: 'Rash Driving', category: 'negative' },
  { id: 'late', label: 'Arrived Late', category: 'negative' },
  { id: 'dirty_vehicle', label: 'Dirty Vehicle', category: 'negative' },
  { id: 'rude', label: 'Rude Behavior', category: 'negative' },
  { id: 'wrong_route', label: 'Took Wrong Route', category: 'negative' },
  { id: 'ac_not_working', label: 'AC Not Working', category: 'negative' },
];

/**
 * Predefined rating tags for students
 */
export const STUDENT_RATING_TAGS: RatingTag[] = [
  // Positive
  { id: 'polite_passenger', label: 'Polite', category: 'positive' },
  { id: 'punctual_passenger', label: 'Ready on Time', category: 'positive' },
  { id: 'respectful', label: 'Respectful', category: 'positive' },
  { id: 'clear_directions', label: 'Clear Directions', category: 'positive' },
  // Negative
  { id: 'kept_waiting', label: 'Kept Waiting', category: 'negative' },
  { id: 'rude_passenger', label: 'Rude Behavior', category: 'negative' },
  { id: 'wrong_location', label: 'Wrong Pickup Location', category: 'negative' },
  { id: 'cancelled_last_min', label: 'Last Minute Cancellation', category: 'negative' },
];

/**
 * Issue/Report interface for disputes
 */
export interface Report {
  id: string;
  bookingId: string;
  ratingId: string | null; // Can be linked to a rating
  
  // Reporter info
  reporterId: string;
  reporterName: string;
  reporterType: RatingType;
  
  // Reported user info
  reportedUserId: string;
  reportedUserName: string;
  reportedUserType: RatingType;
  
  // Report details
  category: ReportCategory;
  description: string;
  evidence: ReportEvidence[];
  
  // Status tracking
  status: ReportStatus;
  adminNotes: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolution: string | null;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Evidence attached to a report
 */
export interface ReportEvidence {
  id: string;
  type: 'image' | 'document';
  url: string;
  fileName: string;
  uploadedAt: string;
}

/**
 * Rating summary for a user
 */
export interface RatingSummary {
  userId: string;
  userType: RatingType;
  averageRating: number;
  totalRatings: number;
  ratingBreakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentRatings: Rating[];
  topTags: { tag: RatingTag; count: number }[];
  lastUpdated: string;
}

/**
 * Pending rating - rides that need to be rated
 */
export interface PendingRating {
  bookingId: string;
  rideDate: string;
  partnerId: string;
  partnerName: string;
  partnerType: RatingType;
  pickupAddress: string;
  dropAddress: string;
  fare: number;
}

/**
 * Create rating data interface
 */
export interface CreateRatingData {
  bookingId: string;
  raterId: string;
  raterName: string;
  raterType: RatingType;
  rateeId: string;
  rateeName: string;
  rateeType: RatingType;
  rating: number;
  review?: string;
  tags?: RatingTag[];
  pickupAddress: string;
  dropAddress: string;
  rideDate: string;
  fare: number;
}

/**
 * Create report data interface
 */
export interface CreateReportData {
  bookingId: string;
  ratingId?: string;
  reporterId: string;
  reporterName: string;
  reporterType: RatingType;
  reportedUserId: string;
  reportedUserName: string;
  reportedUserType: RatingType;
  category: ReportCategory;
  description: string;
}

/**
 * User warning for low ratings
 */
export interface UserWarning {
  id: string;
  userId: string;
  userType: RatingType;
  warningType: 'low_rating' | 'multiple_reports' | 'policy_violation';
  message: string;
  issueDate: string;
  acknowledgedAt: string | null;
  isActive: boolean;
}

/**
 * Rating thresholds for warnings
 */
export const RATING_THRESHOLDS = {
  // Minimum average rating before warning
  WARNING_THRESHOLD: 3.0,
  // Minimum average rating before suspension
  SUSPENSION_THRESHOLD: 2.0,
  // Number of consecutive low ratings for warning
  CONSECUTIVE_LOW_RATINGS: 3,
  // Maximum allowed pending reports
  MAX_PENDING_REPORTS: 5,
} as const;

/**
 * Get rating label based on value
 */
export function getRatingLabel(rating: number): string {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 4.0) return 'Very Good';
  if (rating >= 3.5) return 'Good';
  if (rating >= 3.0) return 'Average';
  if (rating >= 2.0) return 'Below Average';
  return 'Poor';
}

/**
 * Get rating color based on value
 */
export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'text-green-600';
  if (rating >= 4.0) return 'text-green-500';
  if (rating >= 3.5) return 'text-yellow-500';
  if (rating >= 3.0) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Format report category for display
 */
export function formatReportCategory(category: ReportCategory): string {
  const labels: Record<ReportCategory, string> = {
    [ReportCategory.SAFETY_CONCERN]: 'Safety Concern',
    [ReportCategory.RUDE_BEHAVIOR]: 'Rude Behavior',
    [ReportCategory.OVERCHARGING]: 'Overcharging',
    [ReportCategory.LATE_ARRIVAL]: 'Late Arrival',
    [ReportCategory.VEHICLE_CONDITION]: 'Vehicle Condition',
    [ReportCategory.ROUTE_DEVIATION]: 'Route Deviation',
    [ReportCategory.CANCELLATION]: 'Cancellation Issue',
    [ReportCategory.HARASSMENT]: 'Harassment',
    [ReportCategory.OTHER]: 'Other',
  };
  return labels[category] || category;
}

/**
 * Format report status for display
 */
export function formatReportStatus(status: ReportStatus): string {
  const labels: Record<ReportStatus, string> = {
    [ReportStatus.PENDING]: 'Pending Review',
    [ReportStatus.UNDER_REVIEW]: 'Under Review',
    [ReportStatus.RESOLVED]: 'Resolved',
    [ReportStatus.DISMISSED]: 'Dismissed',
  };
  return labels[status] || status;
}

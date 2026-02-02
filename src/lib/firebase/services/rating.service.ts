/**
 * Rating Service
 * Handles all rating and review-related Firestore operations
 */

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../collections';
import { firebaseHandler, type ApiResponse } from '../handler';
import {
  type Rating,
  type Report,
  type RatingSummary,
  type PendingRating,
  type CreateRatingData,
  type CreateReportData,
  type UserWarning,
  type RatingTag,
  RatingType,
  ReportStatus,
  ReportCategory,
  RATING_THRESHOLDS,
  DRIVER_RATING_TAGS,
  STUDENT_RATING_TAGS,
} from '@/lib/types/rating.types';
import { type Booking, BookingStatus } from '@/lib/types/user.types';

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Rating Service class
 */
export class RatingService {
  /**
   * Submit a rating for a completed ride
   */
  static async submitRating(data: CreateRatingData): Promise<ApiResponse<Rating>> {
    return firebaseHandler(async () => {
      const ratingId = generateId();
      const now = new Date().toISOString();

      // Validate rating value
      if (data.rating < 1 || data.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Check if rating already exists for this booking
      const existingQuery = query(
        collection(db, COLLECTIONS.RATINGS),
        where('bookingId', '==', data.bookingId),
        where('raterId', '==', data.raterId)
      );
      const existingDocs = await getDocs(existingQuery);
      
      if (!existingDocs.empty) {
        throw new Error('You have already rated this ride');
      }

      const rating: Rating = {
        id: ratingId,
        bookingId: data.bookingId,
        raterId: data.raterId,
        raterName: data.raterName,
        raterType: data.raterType,
        rateeId: data.rateeId,
        rateeName: data.rateeName,
        rateeType: data.rateeType,
        rating: data.rating,
        review: data.review || null,
        tags: data.tags || [],
        pickupAddress: data.pickupAddress,
        dropAddress: data.dropAddress,
        rideDate: data.rideDate,
        fare: data.fare,
        createdAt: now,
        updatedAt: now,
      };

      // Save rating
      await setDoc(doc(db, COLLECTIONS.RATINGS, ratingId), rating);

      // Update booking with rating
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, data.bookingId);
      if (data.raterType === RatingType.STUDENT) {
        await updateDoc(bookingRef, {
          studentRating: data.rating,
          studentReview: data.review || null,
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(bookingRef, {
          driverRating: data.rating,
          driverReview: data.review || null,
          updatedAt: serverTimestamp(),
        });
      }

      // Update ratee's average rating
      await this.updateUserRating(data.rateeId, data.rateeType);

      // Check for low rating warnings
      if (data.rating <= 2) {
        await this.checkAndCreateWarning(data.rateeId, data.rateeType);
      }

      return rating;
    });
  }

  /**
   * Update a user's average rating
   */
  private static async updateUserRating(
    userId: string,
    userType: RatingType
  ): Promise<void> {
    const collection_name = userType === RatingType.DRIVER 
      ? COLLECTIONS.DRIVERS 
      : COLLECTIONS.STUDENTS;

    // Get all ratings for this user
    const ratingsQuery = query(
      collection(db, COLLECTIONS.RATINGS),
      where('rateeId', '==', userId)
    );
    const ratingsSnapshot = await getDocs(ratingsQuery);
    
    if (ratingsSnapshot.empty) return;

    const ratings = ratingsSnapshot.docs.map(doc => doc.data().rating as number);
    const averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const totalRatings = ratings.length;

    // Update user profile
    const userRef = doc(db, collection_name, userId);
    await updateDoc(userRef, {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalRatings: totalRatings,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Check for low ratings and create warning if needed
   */
  private static async checkAndCreateWarning(
    userId: string,
    userType: RatingType
  ): Promise<void> {
    // Get recent ratings
    const recentQuery = query(
      collection(db, COLLECTIONS.RATINGS),
      where('rateeId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(RATING_THRESHOLDS.CONSECUTIVE_LOW_RATINGS)
    );
    const recentDocs = await getDocs(recentQuery);
    
    if (recentDocs.size < RATING_THRESHOLDS.CONSECUTIVE_LOW_RATINGS) return;

    const recentRatings = recentDocs.docs.map(doc => doc.data().rating as number);
    const allLow = recentRatings.every(r => r <= 2);

    if (allLow) {
      // Check if warning already exists
      const warningsQuery = query(
        collection(db, COLLECTIONS.USER_WARNINGS),
        where('userId', '==', userId),
        where('isActive', '==', true),
        where('warningType', '==', 'low_rating')
      );
      const existingWarnings = await getDocs(warningsQuery);
      
      if (existingWarnings.empty) {
        const warning: UserWarning = {
          id: generateId(),
          userId,
          userType,
          warningType: 'low_rating',
          message: `You have received ${RATING_THRESHOLDS.CONSECUTIVE_LOW_RATINGS} consecutive low ratings. Please improve your service to avoid account suspension.`,
          issueDate: new Date().toISOString(),
          acknowledgedAt: null,
          isActive: true,
        };
        await setDoc(doc(db, COLLECTIONS.USER_WARNINGS, warning.id), warning);
      }
    }
  }

  /**
   * Get rating by ID
   */
  static async getRating(ratingId: string): Promise<ApiResponse<Rating>> {
    return firebaseHandler(async () => {
      const ratingDoc = await getDoc(doc(db, COLLECTIONS.RATINGS, ratingId));
      
      if (!ratingDoc.exists()) {
        throw new Error('Rating not found');
      }

      return ratingDoc.data() as Rating;
    });
  }

  /**
   * Get all ratings for a user
   */
  static async getUserRatings(
    userId: string,
    userType: RatingType,
    limitCount: number = 20
  ): Promise<ApiResponse<Rating[]>> {
    return firebaseHandler(async () => {
      const ratingsQuery = query(
        collection(db, COLLECTIONS.RATINGS),
        where('rateeId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(ratingsQuery);
      return snapshot.docs.map(doc => doc.data() as Rating);
    });
  }

  /**
   * Get ratings given by a user
   */
  static async getRatingsGivenBy(
    userId: string,
    limitCount: number = 20
  ): Promise<ApiResponse<Rating[]>> {
    return firebaseHandler(async () => {
      const ratingsQuery = query(
        collection(db, COLLECTIONS.RATINGS),
        where('raterId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(ratingsQuery);
      return snapshot.docs.map(doc => doc.data() as Rating);
    });
  }

  /**
   * Get rating summary for a user
   */
  static async getRatingSummary(
    userId: string,
    userType: RatingType
  ): Promise<ApiResponse<RatingSummary>> {
    return firebaseHandler(async () => {
      const ratingsQuery = query(
        collection(db, COLLECTIONS.RATINGS),
        where('rateeId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(ratingsQuery);
      const ratings = snapshot.docs.map(doc => doc.data() as Rating);

      if (ratings.length === 0) {
        return {
          userId,
          userType,
          averageRating: 0,
          totalRatings: 0,
          ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          recentRatings: [],
          topTags: [],
          lastUpdated: new Date().toISOString(),
        };
      }

      // Calculate average
      const total = ratings.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = Math.round((total / ratings.length) * 10) / 10;

      // Calculate breakdown
      const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach(r => {
        const key = Math.floor(r.rating) as 1 | 2 | 3 | 4 | 5;
        if (key >= 1 && key <= 5) breakdown[key]++;
      });

      // Count tags
      const tagCounts = new Map<string, { tag: RatingTag; count: number }>();
      ratings.forEach(r => {
        r.tags.forEach(tag => {
          const existing = tagCounts.get(tag.id);
          if (existing) {
            existing.count++;
          } else {
            tagCounts.set(tag.id, { tag, count: 1 });
          }
        });
      });

      // Get top 5 tags
      const topTags = Array.from(tagCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        userId,
        userType,
        averageRating,
        totalRatings: ratings.length,
        ratingBreakdown: breakdown,
        recentRatings: ratings.slice(0, 5),
        topTags,
        lastUpdated: new Date().toISOString(),
      };
    });
  }

  /**
   * Get pending ratings for a user (rides not yet rated)
   */
  static async getPendingRatings(
    userId: string,
    userType: RatingType
  ): Promise<ApiResponse<PendingRating[]>> {
    return firebaseHandler(async () => {
      // Get completed bookings in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const userField = userType === RatingType.STUDENT ? 'studentId' : 'driverId';
      const partnerField = userType === RatingType.STUDENT ? 'driverId' : 'studentId';
      const partnerNameField = userType === RatingType.STUDENT ? 'driverName' : 'studentName';
      const ratingField = userType === RatingType.STUDENT ? 'studentRating' : 'driverRating';

      const bookingsQuery = query(
        collection(db, COLLECTIONS.BOOKINGS),
        where(userField, '==', userId),
        where('status', '==', BookingStatus.COMPLETED),
        orderBy('rideEndTime', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(bookingsQuery);
      const pendingRatings: PendingRating[] = [];

      for (const docSnap of snapshot.docs) {
        const booking = docSnap.data() as Booking;
        
        // Check if user has already rated this booking
        if (booking[ratingField as keyof Booking] === null) {
          pendingRatings.push({
            bookingId: booking.id,
            rideDate: booking.rideEndTime || booking.createdAt,
            partnerId: booking[partnerField as keyof Booking] as string,
            partnerName: booking[partnerNameField as keyof Booking] as string,
            partnerType: userType === RatingType.STUDENT ? RatingType.DRIVER : RatingType.STUDENT,
            pickupAddress: booking.pickupLocation.address || 'Unknown',
            dropAddress: booking.dropLocation.address || 'Unknown',
            fare: booking.fare,
          });
        }
      }

      return pendingRatings;
    });
  }

  // ==================== REPORT FUNCTIONS ====================

  /**
   * Submit a report for an issue
   */
  static async submitReport(data: CreateReportData): Promise<ApiResponse<Report>> {
    return firebaseHandler(async () => {
      const reportId = generateId();
      const now = new Date().toISOString();

      const report: Report = {
        id: reportId,
        bookingId: data.bookingId,
        ratingId: data.ratingId || null,
        reporterId: data.reporterId,
        reporterName: data.reporterName,
        reporterType: data.reporterType,
        reportedUserId: data.reportedUserId,
        reportedUserName: data.reportedUserName,
        reportedUserType: data.reportedUserType,
        category: data.category,
        description: data.description,
        evidence: [],
        status: ReportStatus.PENDING,
        adminNotes: null,
        resolvedBy: null,
        resolvedAt: null,
        resolution: null,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, COLLECTIONS.REPORTS, reportId), report);

      // Check if user has too many reports
      await this.checkReportThreshold(data.reportedUserId, data.reportedUserType);

      return report;
    });
  }

  /**
   * Check if a user has too many pending reports
   */
  private static async checkReportThreshold(
    userId: string,
    userType: RatingType
  ): Promise<void> {
    const reportsQuery = query(
      collection(db, COLLECTIONS.REPORTS),
      where('reportedUserId', '==', userId),
      where('status', 'in', [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW])
    );
    
    const snapshot = await getDocs(reportsQuery);
    
    if (snapshot.size >= RATING_THRESHOLDS.MAX_PENDING_REPORTS) {
      // Create warning
      const warning: UserWarning = {
        id: generateId(),
        userId,
        userType,
        warningType: 'multiple_reports',
        message: `You have ${snapshot.size} pending reports. Your account is under review.`,
        issueDate: new Date().toISOString(),
        acknowledgedAt: null,
        isActive: true,
      };
      await setDoc(doc(db, COLLECTIONS.USER_WARNINGS, warning.id), warning);
    }
  }

  /**
   * Get report by ID
   */
  static async getReport(reportId: string): Promise<ApiResponse<Report>> {
    return firebaseHandler(async () => {
      const reportDoc = await getDoc(doc(db, COLLECTIONS.REPORTS, reportId));
      
      if (!reportDoc.exists()) {
        throw new Error('Report not found');
      }

      return reportDoc.data() as Report;
    });
  }

  /**
   * Get reports by user (either reporter or reported)
   */
  static async getUserReports(
    userId: string,
    asReporter: boolean = true
  ): Promise<ApiResponse<Report[]>> {
    return firebaseHandler(async () => {
      const field = asReporter ? 'reporterId' : 'reportedUserId';
      const reportsQuery = query(
        collection(db, COLLECTIONS.REPORTS),
        where(field, '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(reportsQuery);
      return snapshot.docs.map(doc => doc.data() as Report);
    });
  }

  /**
   * Admin: Get all pending reports
   */
  static async getAllPendingReports(): Promise<ApiResponse<Report[]>> {
    return firebaseHandler(async () => {
      const reportsQuery = query(
        collection(db, COLLECTIONS.REPORTS),
        where('status', 'in', [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW]),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(reportsQuery);
      return snapshot.docs.map(doc => doc.data() as Report);
    });
  }

  /**
   * Admin: Update report status
   */
  static async updateReportStatus(
    reportId: string,
    status: ReportStatus,
    adminId: string,
    adminNotes?: string,
    resolution?: string
  ): Promise<ApiResponse<Report>> {
    return firebaseHandler(async () => {
      const reportRef = doc(db, COLLECTIONS.REPORTS, reportId);
      const reportDoc = await getDoc(reportRef);
      
      if (!reportDoc.exists()) {
        throw new Error('Report not found');
      }

      const updates: Partial<Report> = {
        status,
        adminNotes: adminNotes || null,
        updatedAt: new Date().toISOString(),
      };

      if (status === ReportStatus.RESOLVED || status === ReportStatus.DISMISSED) {
        updates.resolvedBy = adminId;
        updates.resolvedAt = new Date().toISOString();
        updates.resolution = resolution || null;
      }

      await updateDoc(reportRef, updates);

      return { ...reportDoc.data(), ...updates } as Report;
    });
  }

  /**
   * Admin: Get all ratings with filters
   */
  static async getAllRatings(
    filters?: {
      minRating?: number;
      maxRating?: number;
      userType?: RatingType;
      startDate?: string;
      endDate?: string;
    },
    limitCount: number = 50
  ): Promise<ApiResponse<Rating[]>> {
    return firebaseHandler(async () => {
      let ratingsQuery = query(
        collection(db, COLLECTIONS.RATINGS),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(ratingsQuery);
      let ratings = snapshot.docs.map(doc => doc.data() as Rating);

      // Apply client-side filters
      if (filters) {
        if (filters.minRating !== undefined) {
          ratings = ratings.filter(r => r.rating >= filters.minRating!);
        }
        if (filters.maxRating !== undefined) {
          ratings = ratings.filter(r => r.rating <= filters.maxRating!);
        }
        if (filters.userType) {
          ratings = ratings.filter(r => r.rateeType === filters.userType);
        }
        if (filters.startDate) {
          ratings = ratings.filter(r => r.createdAt >= filters.startDate!);
        }
        if (filters.endDate) {
          ratings = ratings.filter(r => r.createdAt <= filters.endDate!);
        }
      }

      return ratings;
    });
  }

  /**
   * Admin: Get low-rated users
   */
  static async getLowRatedUsers(
    userType: RatingType,
    threshold: number = RATING_THRESHOLDS.WARNING_THRESHOLD
  ): Promise<ApiResponse<{ userId: string; name: string; rating: number; totalRatings: number }[]>> {
    return firebaseHandler(async () => {
      const collection_name = userType === RatingType.DRIVER 
        ? COLLECTIONS.DRIVERS 
        : COLLECTIONS.STUDENTS;

      const usersQuery = query(
        collection(db, collection_name),
        where('rating', '<=', threshold),
        where('totalRatings', '>=', 3), // At least 3 ratings
        orderBy('rating', 'asc'),
        limit(20)
      );

      const snapshot = await getDocs(usersQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          userId: doc.id,
          name: data.displayName || 'Unknown',
          rating: data.rating || 0,
          totalRatings: data.totalRatings || 0,
        };
      });
    });
  }

  /**
   * Get user warnings
   */
  static async getUserWarnings(userId: string): Promise<ApiResponse<UserWarning[]>> {
    return firebaseHandler(async () => {
      const warningsQuery = query(
        collection(db, COLLECTIONS.USER_WARNINGS),
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('issueDate', 'desc')
      );
      
      const snapshot = await getDocs(warningsQuery);
      return snapshot.docs.map(doc => doc.data() as UserWarning);
    });
  }

  /**
   * Acknowledge a warning
   */
  static async acknowledgeWarning(warningId: string): Promise<ApiResponse<void>> {
    return firebaseHandler(async () => {
      await updateDoc(doc(db, COLLECTIONS.USER_WARNINGS, warningId), {
        acknowledgedAt: new Date().toISOString(),
      });
    });
  }

  /**
   * Get rating tags based on user type
   */
  static getRatingTags(userType: RatingType): RatingTag[] {
    return userType === RatingType.DRIVER ? DRIVER_RATING_TAGS : STUDENT_RATING_TAGS;
  }

  /**
   * Check if user can rate a booking
   */
  static async canRateBooking(
    bookingId: string,
    userId: string
  ): Promise<ApiResponse<boolean>> {
    return firebaseHandler(async () => {
      // Check if booking exists and is completed
      const bookingDoc = await getDoc(doc(db, COLLECTIONS.BOOKINGS, bookingId));
      
      if (!bookingDoc.exists()) {
        return false;
      }

      const booking = bookingDoc.data() as Booking;
      
      if (booking.status !== BookingStatus.COMPLETED) {
        return false;
      }

      // Check if user is part of this booking
      if (booking.studentId !== userId && booking.driverId !== userId) {
        return false;
      }

      // Check if already rated
      const existingQuery = query(
        collection(db, COLLECTIONS.RATINGS),
        where('bookingId', '==', bookingId),
        where('raterId', '==', userId)
      );
      const existingDocs = await getDocs(existingQuery);

      return existingDocs.empty;
    });
  }
}

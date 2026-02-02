# Rating & Review System

## Overview

The Rating & Review System allows students and drivers to rate each other after completed rides. This system helps maintain service quality and builds trust within the platform.

## Features

### ✅ Student Rating Features
- **Rate Driver After Ride (1-5 stars)** - Students can rate their driver immediately after ride completion
- **Write Review/Feedback** - Optional text feedback with up to 500 characters
- **View Driver Ratings Before Booking** - See driver ratings, reviews, and badges when selecting a driver
- **Report Issues** - File reports for safety concerns, rude behavior, overcharging, etc.

### ✅ Driver Rating Features
- **Rate Student Behavior** - Drivers can rate student behavior after rides
- **View Student Rating History** - See a student's rating before accepting a ride
- **Flag Problematic Riders** - Report issues with students for admin review

### ✅ Admin Features
- **View All Ratings** - See all ratings across the platform with filters
- **Handle Disputes** - Review and resolve user reports
- **Low Rating Alerts** - Automatic flagging of users with ratings below threshold
- **Ban Users** - Ability to warn or ban users with consistently low ratings

## Components

### StarRating
Interactive star rating component with hover effects.

```tsx
import { StarRating } from '@/components/rating';

// Interactive (for input)
<StarRating value={rating} onChange={setRating} size="lg" />

// Read-only (for display)
<StarRating value={4.5} readonly size="sm" showValue />
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | number | required | Current rating value (1-5) |
| onChange | (value: number) => void | - | Callback when rating changes |
| readonly | boolean | false | If true, rating cannot be changed |
| size | 'sm' \| 'md' \| 'lg' | 'md' | Size of stars |
| showValue | boolean | false | Show numeric value next to stars |

### RatingForm
Complete form for submitting a rating with review and tags.

```tsx
import { RatingForm } from '@/components/rating';

<RatingForm
  bookingId={booking.id}
  raterId={userId}
  raterName={userName}
  raterType={RatingType.STUDENT}
  rateeId={driverId}
  rateeName={driverName}
  rateeType={RatingType.DRIVER}
  pickupAddress="Campus Gate"
  dropAddress="Railway Station"
  rideDate="2026-02-02"
  fare={150}
  onSuccess={() => console.log('Rating submitted!')}
  onCancel={() => console.log('Rating skipped')}
/>
```

### RatingDisplay
Shows a user's rating summary with breakdown and recent reviews.

```tsx
import { RatingDisplay } from '@/components/rating';

// Full display
<RatingDisplay summary={ratingSummary} showRecentReviews />

// Compact display
<RatingDisplay summary={ratingSummary} compact />
```

### DriverRatingCard
Compact driver rating display for booking selection.

```tsx
import { DriverRatingCard } from '@/components/rating';

<DriverRatingCard
  driverId={driver.uid}
  driverName={driver.displayName}
  showDetails
  size="md"
/>
```

### PendingRatings
Shows rides that haven't been rated yet.

```tsx
import { PendingRatings } from '@/components/rating';

<PendingRatings
  userId={userId}
  userName={userName}
  userType={RatingType.STUDENT}
  onRatingComplete={() => refreshDashboard()}
/>
```

### PostRideRatingDialog
Modal that appears after ride completion.

```tsx
import { PostRideRatingDialog } from '@/components/rating';

<PostRideRatingDialog
  booking={completedBooking}
  userId={userId}
  userName={userName}
  userType="student"
  open={showRatingDialog}
  onClose={() => setShowRatingDialog(false)}
  onRatingComplete={handleRefresh}
/>
```

### ReportForm
Form for reporting issues with a user.

```tsx
import { ReportForm } from '@/components/rating';

<ReportForm
  bookingId={booking.id}
  reporterId={userId}
  reporterName={userName}
  reporterType={RatingType.STUDENT}
  reportedUserId={driverId}
  reportedUserName={driverName}
  reportedUserType={RatingType.DRIVER}
  onSuccess={() => console.log('Report submitted')}
  onCancel={closeModal}
/>
```

### AdminRatingManagement
Complete admin interface for managing ratings and reports.

```tsx
import { AdminRatingManagement } from '@/components/rating';

<AdminRatingManagement adminId={adminUid} />
```

## Service API

### RatingService

```typescript
import { RatingService } from '@/lib/firebase/services';

// Submit a rating
const result = await RatingService.submitRating({
  bookingId: 'booking123',
  raterId: 'user123',
  raterName: 'John Student',
  raterType: RatingType.STUDENT,
  rateeId: 'driver456',
  rateeName: 'Driver Name',
  rateeType: RatingType.DRIVER,
  rating: 5,
  review: 'Great ride!',
  tags: [{ id: 'safe_driving', label: 'Safe Driving', category: 'positive' }],
  pickupAddress: 'Campus',
  dropAddress: 'Station',
  rideDate: '2026-02-02',
  fare: 150,
});

// Get rating summary
const summary = await RatingService.getRatingSummary(userId, RatingType.DRIVER);

// Get pending ratings (rides not yet rated)
const pending = await RatingService.getPendingRatings(userId, RatingType.STUDENT);

// Submit a report
const report = await RatingService.submitReport({
  bookingId: 'booking123',
  reporterId: 'user123',
  reporterName: 'John',
  reporterType: RatingType.STUDENT,
  reportedUserId: 'driver456',
  reportedUserName: 'Driver',
  reportedUserType: RatingType.DRIVER,
  category: ReportCategory.RUDE_BEHAVIOR,
  description: 'Driver was very rude during the ride...',
});

// Admin: Get all pending reports
const reports = await RatingService.getAllPendingReports();

// Admin: Update report status
await RatingService.updateReportStatus(
  reportId,
  ReportStatus.RESOLVED,
  adminId,
  'Warning issued to driver',
  'Driver has been warned'
);

// Get low-rated users
const lowRated = await RatingService.getLowRatedUsers(RatingType.DRIVER, 3.0);
```

## Rating Tags

### Driver Tags (for students to use)
**Positive:**
- Safe Driving
- Punctual
- Clean Vehicle
- Polite & Friendly
- Knows Routes Well
- Comfortable Ride

**Negative:**
- Rash Driving
- Arrived Late
- Dirty Vehicle
- Rude Behavior
- Took Wrong Route
- AC Not Working

### Student Tags (for drivers to use)
**Positive:**
- Polite
- Ready on Time
- Respectful
- Clear Directions

**Negative:**
- Kept Waiting
- Rude Behavior
- Wrong Pickup Location
- Last Minute Cancellation

## Report Categories

| Category | Description |
|----------|-------------|
| Safety Concern | Any safety-related issues |
| Rude Behavior | Impolite or aggressive behavior |
| Overcharging | Charging more than agreed fare |
| Late Arrival | Significant delay without notice |
| Vehicle Condition | Poor vehicle maintenance |
| Route Deviation | Taking longer/different route |
| Cancellation | Issues related to cancellation |
| Harassment | Any form of harassment |
| Other | Other issues not listed |

## Warning System

### Thresholds
```typescript
const RATING_THRESHOLDS = {
  WARNING_THRESHOLD: 3.0,      // Below this triggers warning
  SUSPENSION_THRESHOLD: 2.0,  // Below this triggers suspension review
  CONSECUTIVE_LOW_RATINGS: 3, // 3 consecutive 1-2 star ratings = warning
  MAX_PENDING_REPORTS: 5,     // 5+ pending reports = account review
};
```

### Automatic Actions
1. **3 consecutive ratings ≤ 2 stars**: User receives warning
2. **Average rating < 3.0 (min 3 ratings)**: Appears in admin low-rated list
3. **5+ pending reports**: Account flagged for review

## Database Collections

### ratings
```typescript
{
  id: string;
  bookingId: string;
  raterId: string;
  raterName: string;
  raterType: 'driver' | 'student';
  rateeId: string;
  rateeName: string;
  rateeType: 'driver' | 'student';
  rating: number; // 1-5
  review: string | null;
  tags: RatingTag[];
  pickupAddress: string;
  dropAddress: string;
  rideDate: string;
  fare: number;
  createdAt: string;
  updatedAt: string;
}
```

### reports
```typescript
{
  id: string;
  bookingId: string;
  ratingId: string | null;
  reporterId: string;
  reporterName: string;
  reporterType: 'driver' | 'student';
  reportedUserId: string;
  reportedUserName: string;
  reportedUserType: 'driver' | 'student';
  category: ReportCategory;
  description: string;
  evidence: ReportEvidence[];
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  adminNotes: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### user_warnings
```typescript
{
  id: string;
  userId: string;
  userType: 'driver' | 'student';
  warningType: 'low_rating' | 'multiple_reports' | 'policy_violation';
  message: string;
  issueDate: string;
  acknowledgedAt: string | null;
  isActive: boolean;
}
```

## Integration Points

### 1. After Ride Completion
```tsx
// In student dashboard or booking component
const [showRating, setShowRating] = useState(false);

// When ride status changes to COMPLETED
useEffect(() => {
  if (booking.status === BookingStatus.COMPLETED) {
    setShowRating(true);
  }
}, [booking.status]);

<PostRideRatingDialog
  booking={booking}
  userId={user.uid}
  userName={user.displayName}
  userType="student"
  open={showRating}
  onClose={() => setShowRating(false)}
/>
```

### 2. In Driver Selection
```tsx
// Show driver rating when selecting
<div className="driver-card">
  <DriverRatingCard
    driverId={driver.uid}
    driverName={driver.displayName}
    showDetails
  />
</div>
```

### 3. In User Profile
```tsx
// Show rating summary in profile
<RatingDisplay
  summary={userRatingSummary}
  showRecentReviews
/>
```

### 4. In Dashboard
```tsx
// Show pending ratings prompt
<PendingRatings
  userId={user.uid}
  userName={user.displayName}
  userType={RatingType.STUDENT}
/>
```

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Admin Ratings | `/admin/ratings` | View all ratings and manage reports |

## Firestore Indexes Required

Add these indexes in Firebase Console → Firestore → Indexes:

1. **ratings** - rateeId (Ascending) + createdAt (Descending)
2. **ratings** - raterId (Ascending) + createdAt (Descending)
3. **reports** - status (Ascending) + createdAt (Descending)
4. **reports** - reporterId (Ascending) + createdAt (Descending)
5. **reports** - reportedUserId (Ascending) + status (Ascending)
6. **user_warnings** - userId (Ascending) + isActive (Ascending) + issueDate (Descending)
7. **drivers** - rating (Ascending) + totalRatings (Ascending)
8. **students** - rating (Ascending) + totalRatings (Ascending)

## Testing

### Test Rating Submission
1. Complete a ride as a student
2. Rating dialog should appear
3. Select 4 stars
4. Add tags (Safe Driving, Punctual)
5. Write review
6. Submit
7. Verify rating appears in driver's profile

### Test Report Flow
1. Rate a ride with 1 star
2. Click "Report Issue"
3. Select category and describe issue
4. Submit
5. Login as admin
6. Go to /admin/ratings
7. Find the report
8. Review and resolve

### Test Low Rating Warning
1. Create test driver
2. Submit 3 consecutive 1-star ratings
3. Check user_warnings collection
4. Warning should be created automatically

## Files Created/Modified

### New Files
- `src/lib/types/rating.types.ts` - Rating type definitions
- `src/lib/firebase/services/rating.service.ts` - Rating service
- `src/components/rating/StarRating.tsx` - Star rating input
- `src/components/rating/RatingForm.tsx` - Rating submission form
- `src/components/rating/RatingDisplay.tsx` - Rating summary display
- `src/components/rating/ReportForm.tsx` - Issue reporting form
- `src/components/rating/PendingRatings.tsx` - Pending ratings list
- `src/components/rating/DriverRatingCard.tsx` - Driver rating card
- `src/components/rating/AdminRatingManagement.tsx` - Admin management
- `src/components/rating/PostRideRatingDialog.tsx` - Post-ride dialog
- `src/components/rating/index.ts` - Component exports
- `src/app/admin/ratings/page.tsx` - Admin ratings page

### Modified Files
- `src/lib/firebase/collections.ts` - Added REPORTS, USER_WARNINGS collections
- `src/lib/firebase/services/index.ts` - Export RatingService
- `src/components/admin/AdminDashboard.tsx` - Added ratings link

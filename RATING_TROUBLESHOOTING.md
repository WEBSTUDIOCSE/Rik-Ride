# Rating System Troubleshooting Guide

## Issue: Driver Ratings Not Showing

### Problem
Ratings given by students to drivers are not appearing in the driver's "My Ratings" section.

### Potential Causes & Solutions

#### 1. **Firestore Indexes Missing**
**Symptom:** Console shows "The query requires an index" error

**Solution:**
1. Apply the indexes from `firestore.indexes.json`:
   ```bash
   firebase deploy --only firestore:indexes
   ```

2. Or manually create the index in Firebase Console:
   - Go to Firebase Console → Firestore → Indexes
   - Create composite index:
     - Collection: `ratings`
     - Fields: `rateeId` (Ascending), `createdAt` (Descending)

#### 2. **No Ratings Data Yet**
**Symptom:** Shows "0 reviews" or empty state

**Verification:**
1. Check browser console for logs:
   - `[RatingService] Query returned X ratings`
   - If X = 0, no ratings exist yet

2. Manually check Firestore:
   - Go to Firestore → `ratings` collection
   - Look for documents where `rateeId` = driver's UID
   - Check `rateeType` = "DRIVER"

**Solution:** Create test ratings by:
1. Complete a ride as a student
2. Rate the driver using the PostRideRatingDialog
3. Check that the rating appears in Firestore

#### 3. **Incorrect User ID**
**Symptom:** Ratings exist but don't show for specific driver

**Verification:**
Check browser console logs:
```
[UserRatingSection] Fetching summary for: { userId: "...", userType: "DRIVER" }
[RatingService] getRatingSummary called with: { userId: "...", userType: "DRIVER" }
```

**Solution:**
Ensure the `userId` passed to `UserRatingSection` matches the `rateeId` in ratings documents.

#### 4. **Rating Type Mismatch**
**Symptom:** Student ratings stored with wrong `rateeType`

**Verification:**
Check Firestore ratings documents:
- For driver ratings: `rateeType` should be "DRIVER"
- For student ratings: `rateeType` should be "STUDENT"

**Solution:**
Ensure `PostRideRatingDialog` is passing correct `raterType`:
- Student dashboard: `raterType={RatingType.STUDENT}` → rates driver
- Driver dashboard: `raterType={RatingType.DRIVER}` → rates student

## Debugging Steps

### 1. Open Browser Console
Check for these logs when viewing "My Ratings" tab:

```
[UserRatingSection] Fetching summary for: ...
[RatingService] getRatingSummary called with: ...
[RatingService] Query returned X ratings
[RatingService] Rating: { ... }  // One log per rating
```

### 2. Check Firestore Data
Go to Firebase Console → Firestore:

1. **Check `ratings` collection:**
   ```
   ratings/
     ├─ <ratingId>/
     │   ├─ rateeId: "<driver-uid>"
     │   ├─ rateeType: "DRIVER"
     │   ├─ raterId: "<student-uid>"
     │   ├─ raterType: "STUDENT"
     │   ├─ rating: 5
     │   └─ ...
   ```

2. **Check `drivers` collection:**
   ```
   drivers/
     ├─ <driver-uid>/
     │   ├─ rating: 4.5  // Should auto-update
     │   ├─ totalRatings: 10
     │   └─ ...
   ```

### 3. Test Rating Flow
1. **As Student:**
   - Complete a ride
   - PostRideRatingDialog should appear
   - Submit rating (5 stars + review)
   - Check Firestore for new rating document

2. **As Driver:**
   - Go to dashboard → My Ratings tab
   - Should see the new rating
   - Check console for logs

## Expected Behavior

When a student rates a driver (5 stars):

1. **Rating created in Firestore:**
   - Collection: `ratings`
   - `rateeId` = driver UID
   - `rateeType` = "DRIVER"
   - `raterId` = student UID
   - `raterType` = "STUDENT"

2. **Driver profile updated:**
   - `drivers/<driver-uid>/rating` updated to new average
   - `drivers/<driver-uid>/totalRatings` incremented

3. **Driver dashboard shows:**
   - My Ratings tab displays:
     - Average rating (e.g., 5.0)
     - Total reviews (e.g., 1 review)
     - Rating breakdown (5★: 1, 4★: 0, ...)
     - Recent reviews with student's feedback

## Common Errors

### Error: "The query requires an index"
**Fix:** Deploy Firestore indexes (see solution #1 above)

### Error: "Permission denied"
**Fix:** Check Firestore Security Rules allow reading ratings:
```javascript
match /ratings/{ratingId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == request.resource.data.raterId;
}
```

### Error: "Cannot read property 'uid' of null"
**Fix:** Ensure user is authenticated and profile is loaded before rendering UserRatingSection

## Files to Check

- `src/components/rating/UserRatingSection.tsx` - Displays ratings
- `src/lib/firebase/services/rating.service.ts` - Fetches ratings from Firestore
- `src/components/rating/PostRideRatingDialog.tsx` - Submit rating after ride
- `firestore.indexes.json` - Firestore index configuration
- Firebase Console → Firestore → `ratings` collection - Raw data

## Support

If ratings still don't show after trying the above:

1. Check all console logs
2. Verify Firestore data structure
3. Ensure indexes are deployed
4. Create test rating manually in Firestore
5. Check Firestore Security Rules

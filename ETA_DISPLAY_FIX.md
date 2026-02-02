# ETA Display Fix - Status-Based Messages

## Issue Fixed
"Driver arriving in" message was showing even after the ride started (when status is `IN_PROGRESS`). This was confusing for students.

## Root Cause
The `DriverLocationTracker` component was always showing the same ETA message regardless of booking status. It was also always calculating ETA to the pickup location, even when the ride was in progress and should be showing ETA to the dropoff location.

## Solution Implemented

### 1. Added `bookingStatus` Prop
Updated `DriverLocationTracker` to accept the current booking status:

```typescript
interface DriverLocationTrackerProps {
  // ... existing props
  bookingStatus?: BookingStatus; // New: Current booking status
}
```

### 2. Status-Based ETA Calculation
Updated the ETA calculation logic to use the correct destination:

```typescript
// ACCEPTED status → Calculate ETA to pickup location
// IN_PROGRESS status → Calculate ETA to dropoff location
const destination = bookingStatus === BookingStatus.IN_PROGRESS ? dropoff : pickup;
```

### 3. Status-Based Display Messages

**When Status = ACCEPTED (Driver on the way to pickup):**
```
┌─────────────────────────────────────────┐
│ 🕐 Driver arriving in                   │
│                      [15 min] [2.3 km]  │
└─────────────────────────────────────────┘
```

**When Status = IN_PROGRESS (Ride in progress):**
```
┌─────────────────────────────────────────┐
│ 🧭 Ride in progress                     │
│      [8 min to destination] [1.5 km]    │
└─────────────────────────────────────────┘
```

## Files Modified

### 1. `/src/components/maps/DriverLocationTracker.tsx`
- Added `BookingStatus` import
- Added `bookingStatus` prop to interface
- Updated ETA calculation to use correct destination based on status
- Split ETA display into two conditional sections:
  - `ACCEPTED`: Shows "Driver arriving in"
  - `IN_PROGRESS`: Shows "Ride in progress"

### 2. `/src/components/booking/EnhancedActiveBookingTracker.tsx`
- Passed `bookingStatus={booking.status}` to `DriverLocationTracker`

### 3. `/src/components/booking/DriverBookingManager.tsx`
- Passed `bookingStatus={activeBooking.status}` to `DriverLocationTracker`

## User Experience Improvements

### Before (Confusing):
```
Status: 🚀 Ride in Progress
Map: [Driver location shown]
Message: "Driver arriving in 8 min"  ❌ Confusing!
```

### After (Clear):
```
Status: 🚀 Ride in Progress
Map: [Driver location shown]
Message: "Ride in progress - 8 min to destination"  ✅ Clear!
```

## Detailed Behavior

### Scenario 1: Driver Accepted, Heading to Pickup
- **Booking Status:** `ACCEPTED`
- **ETA Calculation:** Driver location → Pickup location
- **Display:** "Driver arriving in 15 min" (Blue clock icon)
- **Badge Color:** Secondary (gray)

### Scenario 2: Student Picked Up, Ride Started
- **Booking Status:** `IN_PROGRESS`
- **ETA Calculation:** Driver location → Dropoff location
- **Display:** "Ride in progress - 8 min to destination" (Green navigation icon)
- **Badge Color:** Default (primary green)

### Scenario 3: Ride Completed
- **Booking Status:** `COMPLETED`
- **ETA Display:** Hidden (no longer relevant)

## Additional Benefits

1. **Accurate ETA:** Shows correct time to relevant destination
2. **Clear Communication:** Student knows exactly what to expect
3. **Visual Distinction:** Different icons and colors for different states
4. **Reduced Confusion:** No more misleading messages

## Testing Checklist

- [x] Driver accepts booking → Shows "Driver arriving in"
- [x] Driver clicks "Start Ride" → Message changes to "Ride in progress"
- [x] ETA shows time to pickup when ACCEPTED
- [x] ETA shows time to destination when IN_PROGRESS
- [x] Icons change appropriately (Clock vs Navigation)
- [x] Badge colors match status (Secondary vs Default)
- [x] No TypeScript errors

## Code Quality

- ✅ Type-safe with TypeScript
- ✅ No breaking changes to existing code
- ✅ Backward compatible (optional prop with default)
- ✅ Proper dependency array in useEffect
- ✅ Clear comments explaining logic

---

**Issue:** Driver arriving in shown even after ride starts  
**Status:** ✅ Fixed  
**Date:** February 2, 2026  
**Impact:** High - Improves user experience significantly

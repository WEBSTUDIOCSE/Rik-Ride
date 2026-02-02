# Quick Fix Reference

## 🔴 Problem: "No document to update: driverLocations/..."

**Cause:** Document doesn't exist  
**Fix:** Change `updateDoc` to `setDoc` with `merge: true`

```typescript
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';

// ❌ WRONG - throws error if document doesn't exist
await updateDoc(doc(db, 'driverLocations', id), { ... });

// ✅ CORRECT - creates or updates
await setDoc(doc(db, 'driverLocations', id), { ... }, { merge: true });
```

---

## 🔴 Problem: "google api is already presented"

**Cause:** Multiple `GoogleMapsProvider` components on same page  
**Fix:** Use shared provider pattern

```typescript
// ❌ WRONG - Multiple providers
function Page() {
  return (
    <>
      <ComponentA /> {/* has GoogleMapsProvider */}
      <ComponentB /> {/* has GoogleMapsProvider */}
    </>
  );
}

// ✅ CORRECT - Single shared provider
function Page() {
  return (
    <GoogleMapsProvider>
      <ComponentAContent /> {/* no provider */}
      <ComponentBContent /> {/* no provider */}
    </GoogleMapsProvider>
  );
}
```

**Pattern:**
1. Create `ComponentContent` without provider
2. Export both `Component` (with provider) and `ComponentContent` (without)
3. Use Content versions when sharing a provider

---

## 🔴 Problem: Infinite "Loading Maps..."

**Cause:** Google Maps failed to load due to API conflicts  
**Solution:** Same as "google api is already presented" - use single provider

---

## 🔴 Problem: "Booking must be accepted to start ride"

**Cause:** Stale booking status in local state  
**Fix:** Fetch latest status before critical operations

```typescript
// ❌ WRONG - uses potentially stale state
const handleStartRide = async () => {
  await APIBook.booking.startRide(activeBooking.id, driverId);
};

// ✅ CORRECT - verifies current status
const handleStartRide = async () => {
  const latest = await APIBook.booking.getBooking(activeBooking.id);
  if (latest.data.status !== BookingStatus.ACCEPTED) {
    setError(`Cannot start ride. Status: ${latest.data.status}`);
    return;
  }
  await APIBook.booking.startRide(activeBooking.id, driverId);
};
```

---

## 🔴 Problem: Status not updating in real-time

**Cause:** Missing real-time subscription  
**Fix:** Subscribe to Firestore updates

```typescript
useEffect(() => {
  if (!bookingId) return;
  
  const unsubscribe = APIBook.booking.subscribeToBooking(
    bookingId,
    (updatedBooking) => {
      setBooking(updatedBooking);
    }
  );
  
  return () => unsubscribe(); // ⚠️ IMPORTANT: cleanup
}, [bookingId]);
```

---

## 📁 File Structure

```
Components with GoogleMapsProvider:
✅ StudentDashboard (single provider for all children)
✅ DriverBookingManager (standalone, has own provider)
✅ EnhancedBookingForm (standalone, has own provider)
✅ EnhancedActiveBookingTracker (standalone, has own provider)

Content Components (no provider):
✅ StudentDashboardContent (used inside StudentDashboard)
✅ EnhancedBookingFormContent (used inside StudentDashboard)
✅ EnhancedActiveBookingTrackerContent (used inside StudentDashboard)
✅ DriverBookingManagerContent (used inside DriverBookingManager)
```

---

## 🧪 Testing Commands

```bash
# Build project
npm run build

# Run dev server
npm run dev

# Check for errors
npm run build 2>&1 | grep -i error
```

---

## 🚨 Common Gotchas

1. **Always clean up subscriptions** - Return unsubscribe function from useEffect
2. **Merge option for setDoc** - Don't forget `{ merge: true }`
3. **Provider nesting** - Never nest GoogleMapsProvider inside GoogleMapsProvider
4. **Content vs Wrapper** - Use Content components when sharing a provider
5. **Real-time updates** - Subscribe to Firestore for live data, don't rely on local state

---

## 📚 Related Documentation

- `BUG_FIXES_SUMMARY.md` - Detailed fix explanations
- `API_USAGE_MAP.md` - Google Maps API usage guide
- `MAPS_SETUP_GUIDE.md` - Initial setup instructions
- `QUICKSTART_AUTOCOMPLETE.md` - Google Cloud Console setup

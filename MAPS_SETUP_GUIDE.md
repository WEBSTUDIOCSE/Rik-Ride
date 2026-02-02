# Phase 2: Real-time Features - Testing & Troubleshooting Guide

## Google Maps API Setup

### 1. Verify API Key Configuration

The API key is already added to the environment:
```typescript
// src/lib/firebase/config/environments.ts
googleMapsApiKey: "AIzaSyCg5OSjgOD0cb6z7SjIQQc4NAkixNN_xXs"
```

### 2. Enable Required APIs in Google Cloud Console

⚠️ **IMPORTANT**: You must enable these APIs in Google Cloud Console for the autocomplete to work:

1. Go to: https://console.cloud.google.com/
2. Select your project
3. Navigate to: **APIs & Services** > **Library**
4. Search and **ENABLE** these APIs:
   - ✅ **Maps JavaScript API**
   - ✅ **Places API** (Required for autocomplete)
   - ✅ **Geocoding API**
   - ✅ **Directions API**
   - ✅ **Distance Matrix API**

### 3. Verify API Key Restrictions

In Google Cloud Console:
1. Go to: **APIs & Services** > **Credentials**
2. Click on your API key
3. Under **Application restrictions**:
   - Set to "HTTP referrers (web sites)"
   - Add your domains:
     - `localhost:3000/*`
     - `localhost:*`
     - `*.vercel.app/*`
     - Your production domain
4. Under **API restrictions**:
   - Select "Restrict key"
   - Enable the APIs listed above

## Testing the Location Autocomplete

### Test 1: Basic Autocomplete
1. Navigate to the booking form
2. Click on "Pickup Location" input field
3. Type: "Belgaum"
4. You should see dropdown suggestions appear

**Expected Results:**
- Suggestions dropdown appears while typing
- Shows places in Belgaum, Karnataka
- Can select a suggestion
- Map updates when location is selected

### Test 2: Specific Location
1. Type: "KLE Technological University"
2. Should show the university location
3. Select it and verify map marker appears

### Test 3: Address Search
1. Type a full address: "MG Road, Belgaum"
2. Should show address suggestions
3. Select and verify coordinates are captured

## Troubleshooting

### Issue: No Autocomplete Suggestions Appear

**Cause 1: Places API Not Enabled**
```
Solution: Enable Places API in Google Cloud Console
```

**Cause 2: API Key Restrictions**
```
Solution: 
1. Check browser console for errors (F12)
2. Look for "ApiNotActivatedMapError" or similar
3. Verify domain is whitelisted in API key settings
```

**Cause 3: Billing Not Enabled**
```
Solution:
1. Google Maps requires a billing account
2. Go to Google Cloud Console > Billing
3. Enable billing (Google provides $200 free credit/month)
```

### Issue: "This page can't load Google Maps correctly"

**Solution:**
```bash
# Check browser console for the exact error
# Common errors:

# 1. RefererNotAllowedMapError
#    -> Add your domain to HTTP referrers

# 2. ApiNotActivatedMapError
#    -> Enable the required API in console

# 3. InvalidKeyMapError
#    -> Check if API key is correct in environments.ts
```

### Issue: Autocomplete Works But No Suggestions in India

**Solution:**
The autocomplete is restricted to India with:
```typescript
componentRestrictions: { country: 'in' }
```
This is correct. If no suggestions appear:
1. Type more specific terms like city names
2. Try: "Belgaum, Karnataka" or "Bangalore"

## Debug Mode

To see what's happening, check browser console (F12):

```javascript
// You should see:
[GoogleMaps] API loaded successfully

// When typing in location field:
// No errors should appear

// If you see errors like:
// "Google Maps API error: ApiNotActivatedMapError"
// -> Enable Places API

// "Google Maps API error: RefererNotAllowedMapError"
// -> Add localhost:3000 to allowed referrers
```

## Manual Testing Steps

### Step 1: Check if Maps Load
```
1. Open booking form
2. Check if map component appears
3. Should show default location (India)
```

### Step 2: Test Location Input
```
1. Click "Pickup Location"
2. Type "B" (just one letter)
3. Wait 1 second
4. Dropdown should appear with suggestions starting with B
```

### Step 3: Test Full Flow
```
1. Enter pickup: "KLE Tech University, Belgaum"
2. Enter dropoff: "Belgaum Railway Station"
3. Both should show autocomplete
4. Map should show route between them
5. Distance and fare should calculate
```

## Rate Limiting Info

The system implements rate limiting to prevent excessive API calls:

- **Autocomplete**: 300ms debounce (waits 300ms after you stop typing)
- **Geocoding**: 50 requests/minute maximum
- **Directions**: Cached for 10 minutes
- **Location Updates**: Throttled to every 3 seconds

## Common Google Cloud Console Errors

### Error: "Places API has not been used in project"
```
Solution:
1. Go to: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
2. Click "ENABLE"
3. Wait 1-2 minutes for activation
```

### Error: "This API project is not authorized to use this API"
```
Solution:
1. Check if billing is enabled
2. Verify API key has Places API enabled
3. Check API restrictions settings
```

## Quick Fix Checklist

- [ ] Places API enabled in Google Cloud Console
- [ ] Maps JavaScript API enabled
- [ ] Billing account linked to project
- [ ] API key has correct domain restrictions
- [ ] localhost:3000 added to HTTP referrers
- [ ] Browser console shows no errors
- [ ] API key matches the one in environments.ts

## Testing Without Google Maps

If you want to test the booking flow without Google Maps working:

1. Use the original `BookingForm` component (not `EnhancedBookingForm`)
2. It has mock geocoding that works offline
3. Located at: `src/components/booking/BookingForm.tsx`

## Contact for Issues

If autocomplete still doesn't work after following this guide:
1. Check browser console (F12) for exact error message
2. Copy the error message
3. Verify all APIs are enabled in Google Cloud Console
4. Check if billing is enabled (Google Maps requires it)

## Expected API Costs

With the rate limiting implemented:
- **Free tier**: $200 credit/month from Google
- **Autocomplete**: $2.83 per 1000 requests
- **Geocoding**: $5 per 1000 requests
- **Directions**: $5 per 1000 requests

With caching and rate limiting, expected usage for 1000 bookings/month:
- Cost: ~$10-15/month (well within free tier)

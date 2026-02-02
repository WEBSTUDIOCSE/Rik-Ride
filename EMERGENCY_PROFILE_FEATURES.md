# Emergency & Profile Features - User Guide

## 📋 Overview

This guide explains how to use the newly implemented emergency and profile management features in the Rik-Ride application.

---

## 🚨 Emergency Features

### For Students

#### Emergency Contacts Management

**Location**: `/profile` → Emergency Contacts Card

**Features**:
1. **Parent/Guardian Phone**
   - Add or update parent/guardian phone number
   - This is your primary emergency contact
   - Shown first in emergency contact list

2. **Additional Emergency Contacts**
   - Add up to 5 additional emergency contacts
   - Each contact includes:
     - Name
     - Phone number
     - Relationship (Parent, Mother, Father, Sibling, Friend, etc.)
   - Edit or delete contacts anytime
   - Call contacts directly from the list

**How to Add Emergency Contact**:
1. Go to `/profile`
2. Scroll to "Emergency Contacts" card
3. Click "Add Contact" button
4. Fill in name, phone, and relationship
5. Click "Add Contact" to save

#### Emergency SOS Button

**Location**: Student Dashboard during active ride

**Features**:
- **SOS Alert**: One-tap emergency alert
  - Sends location to all emergency contacts
  - Shows booking details
  - Creates SOS record in database
  - Allows quick call to any contact
  
- **Share Ride**: Share ride details via WhatsApp/SMS
  - Generates tracking link
  - Sends to selected emergency contacts
  - Includes driver info and route

**How to Use SOS**:
1. During an active ride, click the "SOS" button
2. Review the emergency contacts list
3. Click "Confirm SOS Alert" to send alerts
4. Your location and ride details are shared immediately

**How to Share Ride**:
1. Click "Share" button during ride
2. Select contacts to share with
3. Click WhatsApp or SMS button
4. Link sent with tracking information

---

## 👤 Profile Management

### For Students

**Location**: `/profile`

#### What You Can Edit:
✅ **No Approval Required**:
- Name (displayName)
- Phone number
- Emergency contacts
- Parent phone

❌ **Read-Only**:
- Email (cannot be changed)
- University email
- Student ID
- Department
- Year

#### Profile Sections:
1. **Profile Information**
   - View all personal details
   - Edit button for name and phone
   - Quick update with inline edit

2. **Emergency Contacts**
   - Manage all emergency contacts
   - Parent phone (primary contact)
   - Up to 5 additional contacts

3. **Account Actions** (Sidebar)
   - Change Password
   - Delete Account
   - Sign Out

4. **Account Info** (Sidebar)
   - Email verification status
   - Student ID
   - Total rides
   - Wallet balance

---

### For Drivers

**Location**: `/profile`

#### Profile Photo
- Upload or change profile photo
- Shown to students during booking
- Max 5MB, JPG/PNG recommended
- Click camera icon to upload

#### What You Can Edit:

✅ **No Approval Required**:
- Name (displayName)
- Phone number
- Profile photo

⚠️ **Requires Admin Re-Approval** (Account Hold):
- Vehicle Type
- Vehicle Model
- Registration Number
- Seating Capacity
- License Number
- License Expiry

#### Account Hold Mechanism:

When you update vehicle or license details:
1. ⚠️ **Warning shown** before saving
2. **Confirm** the update
3. **Account status** → "Pending Approval"
4. 🔒 **Cannot accept rides** until admin approves
5. **Admin receives notification** (TODO: email)
6. Admin reviews and approves/rejects
7. Account reactivated after approval

#### Profile Sections:

1. **Driver Profile** (Header)
   - Profile photo with upload
   - Verification status badge
   - Basic info display

2. **Personal Information**
   - Name, phone, email
   - Edit button (no approval needed)

3. **Vehicle Information**
   - Type, model, registration, capacity
   - Edit button (⚠️ requires approval)
   - Warning message displayed

4. **License Information**
   - License number and expiry
   - Edit button (⚠️ requires approval)
   - Warning message displayed

5. **Account Actions** (Sidebar)
   - Change Password
   - Delete Account
   - Sign Out

6. **Account Info** (Sidebar)
   - Email verification status
   - License number
   - Total rides
   - Rating
   - Total earnings

---

## 🎯 New Signup Features

### Student Signup

**Location**: `/signup` → Student Registration

**New Field**:
- **Parent/Guardian Phone (Optional)**
  - Added after personal phone number
  - Optional field during signup
  - Can be added/updated later in profile
  - Used as primary emergency contact

### Driver Signup

**Location**: `/signup` → Driver Registration

**New Field**:
- **Profile Photo (Optional)**
  - Upload photo during signup
  - Shows preview before upload
  - Max 5MB file size
  - Image format validation
  - Shown to students during booking

---

## 🔧 Technical Implementation

### Emergency Service API

```typescript
import { EmergencyService } from '@/lib/firebase/services';

// Add emergency contact
await EmergencyService.addEmergencyContact(studentId, {
  name: 'John Doe',
  phone: '+91 9876543210',
  relationship: 'Parent'
});

// Trigger SOS alert
await EmergencyService.triggerSOS(
  bookingId,
  studentId,
  { lat: 12.34, lng: 56.78, address: 'Location' }
);

// Share ride details
await EmergencyService.shareRideDetails(
  bookingId,
  studentId,
  phoneNumber
);
```

### Profile Edit Components

```typescript
import { StudentProfileEdit, DriverProfileEdit } from '@/components/profile';

// For students
<StudentProfileEdit 
  student={studentProfile} 
  onUpdate={handleUpdate}
/>

// For drivers
<DriverProfileEdit 
  driver={driverProfile} 
  onUpdate={handleUpdate}
/>
```

### Emergency Components

```typescript
import { EmergencyButton, EmergencyContactManager } from '@/components/emergency';

// During active ride
<EmergencyButton
  booking={activeBooking}
  studentId={student.uid}
  studentName={student.displayName}
  emergencyContacts={student.emergencyContacts}
  parentPhone={student.parentPhone}
  currentLocation={currentLocation}
/>

// In profile page
<EmergencyContactManager
  studentId={student.uid}
  contacts={student.emergencyContacts}
  parentPhone={student.parentPhone}
  onContactsChange={handleContactsChange}
  onParentPhoneChange={handleParentPhoneChange}
/>
```

---

## 📊 Database Schema Updates

### StudentProfile Type
```typescript
interface StudentProfile {
  // ... existing fields
  parentPhone: string | null;
  emergencyContacts: Array<{
    id?: string;
    name: string;
    phone: string;
    relationship: string;
    isDefault?: boolean;
  }>;
}
```

### DriverProfile Type
```typescript
interface DriverProfile {
  // ... existing fields
  profileUpdatePending: boolean;
  pendingUpdates: Partial<DriverProfile> | null;
}
```

### Emergency Collections
- **`sosAlerts`**: SOS alert records
- **`sharedRides`**: Shared ride tracking links

---

## ✅ Testing Checklist

### Student Features
- [ ] Sign up with parent phone
- [ ] Add emergency contacts in profile
- [ ] Edit profile (name, phone)
- [ ] Trigger SOS during ride
- [ ] Share ride details
- [ ] Call emergency contact

### Driver Features
- [ ] Sign up with profile photo
- [ ] Upload profile photo in profile
- [ ] Edit personal info (no hold)
- [ ] Edit vehicle details (account hold)
- [ ] Edit license details (account hold)
- [ ] Verify "Pending Approval" status

### Admin Features
- [ ] Receive notification of driver update (TODO)
- [ ] Approve/reject driver profile updates
- [ ] See pending approval status

---

## 🚀 Next Steps (TODO)

1. **Email Notifications**
   - Admin notification on driver signup
   - Admin notification on driver profile update
   - SOS alert email to emergency contacts

2. **SMS Integration (Twilio)**
   - Send SOS alerts via SMS
   - Send ride tracking links via SMS

3. **WhatsApp Integration**
   - Better WhatsApp share links
   - WhatsApp Business API for alerts

4. **Tracking Page**
   - Public tracking page for shared rides
   - Real-time location updates
   - Estimated arrival times

5. **Admin Email Setup**
   - Configure admin email address
   - Email templates
   - SendGrid/AWS SES integration

---

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Verify network connectivity
3. Ensure proper authentication
4. Contact support with error details

---

Last Updated: February 2, 2026
Version: 1.0.0

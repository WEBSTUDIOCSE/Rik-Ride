# Changelog

## Updates - February 2, 2026

### Student Registration Form Changes

1. **Phone Number Required**
   - Changed phone number from optional to mandatory for all students
   - Updated validation schema to require phone number with proper validation

2. **Year Selection Limited**
   - Changed year selection from 1-6 to 1-4 years only
   - Updated both the form dropdown and validation schema

3. **Department Dropdown UI Fix**
   - Added `className="truncate"` to SelectValue and SelectItem
   - Fixed spacing issue when long department names like "Computer Science & Engineering" are selected
   - Ensured proper text truncation to prevent UI overflow

### Driver Registration Form Changes

1. **Phone Number Required**
   - Phone number is now mandatory for driver registration

2. **Removed Insurance Fields**
   - Removed `insuranceNumber` field
   - Removed `insuranceExpiry` field
   - Updated all related components and services

3. **Added Aadhar Card**
   - Added `aadharNumber` field with 12-digit validation
   - Aadhar number must contain only digits
   - Added validation: min 12 digits, max 12 digits

4. **Added Document Upload Fields**
   - Added "Upload Driving License" file input field
   - Added "Upload Aadhar Card" file input field
   - Both accept images and PDF files
   - Updated section heading from "License & Insurance" to "License & Documents"

### Backend/Type Changes

#### Updated Files:
- `src/lib/validations/auth.ts`
  - Updated `studentSignupSchema`: phone is now required, year max changed to 4
  - Updated `driverSignupSchema`: removed insurance fields, added aadharNumber field

- `src/lib/types/user.types.ts`
  - Updated `DriverProfile` interface: removed insuranceNumber/insuranceExpiry, added aadharNumber
  - Updated `CreateDriverData` interface: removed insuranceNumber/insuranceExpiry, added aadharNumber
  - Updated `CreateStudentData` interface: phone is now required (removed optional flag)

- `src/lib/firebase/services/driver.service.ts`
  - Updated `createDriver` function to use aadharNumber instead of insurance fields

- `src/components/admin/DriverVerificationList.tsx`
  - Updated to display aadharNumber instead of insurance details
  - Changed section heading to "License & Documents"

- `src/components/driver/DriverDashboard.tsx`
  - Updated to display aadharNumber instead of insurance details

### Form Validations

#### Student Signup:
- Display Name: 2-50 characters (required)
- Email: Valid email format (required)
- University Email: Must end with @git-india.edu.in (required)
- Student ID: Max 20 characters (required)
- Department: Required selection
- Year: 1-4 (required)
- **Phone Number: 10-15 digits, valid format (REQUIRED)**
- Password: Min 8 characters (required)
- Confirm Password: Must match (required)

#### Driver Signup:
- Display Name: 2-50 characters (required)
- Email: Valid email format (required)
- **Phone Number: 10-15 digits, valid format (REQUIRED)**
- License Number: Max 20 characters (required)
- License Expiry: Date (required)
- **Aadhar Number: Exactly 12 digits, numbers only (REQUIRED)**
- Vehicle Registration: Max 15 characters (required)
- Vehicle Type: Required selection
- Vehicle Model: Required
- Seating Capacity: 1-10 passengers (required)
- Password: Min 8 characters (required)
- Confirm Password: Must match (required)

### UI Improvements

1. **Better Select Dropdown Handling**
   - Long text in department select now properly truncates
   - No more overflow issues with long option text

2. **File Upload Fields Added**
   - Clear instructions for document uploads
   - Accept both images and PDF formats
   - Helper text to guide users

### Database Schema Updates

The Firestore `drivers` collection now stores:
- `aadharNumber` instead of `insuranceNumber` and `insuranceExpiry`
- All other fields remain the same

### Breaking Changes

⚠️ **Note**: Existing driver profiles in the database may need migration to add the `aadharNumber` field and remove insurance fields.

# Rik-Ride - University Auto Rickshaw Booking Platform

## 📋 Project Overview

**Project Name:** Rik-Ride  
**Developer:** Saurabh Jadhav (Frontend Developer)  
**Target Audience:** University Students & Auto Rickshaw Drivers  
**Purpose:** A dedicated platform for students to book auto rickshaws for university commute

---

## 🎯 Core Concept

Rik-Ride is a university-focused transportation platform that connects students with verified auto rickshaw drivers. The platform ensures safety, convenience, and reliability for student transportation needs.

---

## 👥 User Roles & Authentication

### 1. **Student Users**
- **Registration & Login**
  - Email/Phone-based signup
  - Profile creation with university details
  - Email verification
  - Password reset functionality

### 2. **Rickshaw Drivers/Vehicle Owners**
- **Registration & Login**
  - Email/Phone-based signup
  - Profile creation with vehicle details
  - Document upload for verification
  - Email verification
  - Password reset functionality

### 3. **Admin**
- **Single Admin Access** (Hardcoded)
  - Email: `saurabh@gmail.com`
  - Password: `Saurabh@123`
  - Full system control and verification rights

---

## 🔐 Authentication System

### Student Authentication
- Email/Password login
- Sign up with university email verification
- Profile management
- Forgot password functionality
- Session management

### Rickshaw Driver Authentication
- Email/Password login
- Sign up with document submission
- Profile management (vehicle details, license, etc.)
- Forgot password functionality
- Pending verification status until admin approval

### Admin Authentication
- Hardcoded credentials (for MVP)
- Secure admin dashboard access
- No public registration

---

## ✨ Core Features

### For Students

#### 1. **Booking System**
- Search available rickshaws (only online drivers)
- View driver details (name, rating, vehicle info)
- Book rides with pickup and drop locations
- Real-time ride tracking
- Ride history
- Cancel bookings (with policy)

#### 2. **Profile Management**
- Personal information
- University details (ID, department, year)
- Saved locations (hostel, university gates, common destinations)
- Payment methods
- Booking history

#### 3. **Safety Features**
- Share ride details with friends/family
- SOS/Emergency button
- Driver ratings and reviews
- Ride route tracking

### For Rickshaw Drivers

#### 1. **Availability Management**
- **Online/Offline Toggle Button**
  - Green = Online (Available for bookings)
  - Red = Offline (Not accepting bookings)
  - Only online drivers visible to students

#### 2. **Ride Management**
- Accept/Reject booking requests
- View student pickup location
- Navigate to destination
- Complete ride and collect payment
- Ride history and earnings

#### 3. **Profile & Vehicle Management**
- Personal information
- Vehicle details (registration number, model, capacity)
- Document uploads (license, RC, insurance, ID proof)
- Bank details for payments
- Rating and reviews received

#### 4. **Verification Status**
- Pending verification banner
- Access restricted until admin approval
- Document resubmission if rejected

### For Admin

#### 1. **Driver Verification Dashboard**
- List of pending verification requests
- View submitted documents
  - Driver's license
  - Vehicle registration certificate (RC)
  - Insurance papers
  - ID proof (Aadhar, PAN)
  - Vehicle photos
- Approve/Reject with comments
- Send verification emails

#### 2. **User Management**
- View all students
- View all drivers (approved/pending/rejected)
- Block/Unblock users
- View user activity logs

#### 3. **Platform Management**
- View all active rides
- Monitor platform statistics
- Handle disputes and complaints
- Manage pricing and policies

---

## 📱 Suggested Additional Features

### Priority 1 (Essential)

#### **Payment Integration**
- Multiple payment options (UPI, Cards, Wallets)
- In-app wallet for students
- Automatic fare calculation based on distance
- Driver earning dashboard
- Payment history and receipts

#### **Real-time Features**
- Live location tracking during rides
- Driver ETA estimation
- Push notifications for booking updates
- In-app chat between student and driver

#### **Rating & Review System**
- Students rate drivers after each ride
- Drivers rate students (for behavior)
- Display average ratings
- Review moderation by admin

### Priority 2 (Important)

#### **Ride Sharing**
- Multiple students can share one rickshaw
- Split fare functionality
- Matching students with similar routes
- Reduced per-person cost

#### **Scheduled Rides**
- Book rides in advance
- Recurring bookings (daily university commute)
- Set preferred drivers
- Batch bookings for groups

#### **Safety & Security**
- Emergency contacts setup
- Live ride sharing link
- Route deviation alerts
- Night ride safety features
- Driver background verification badge

#### **Smart Matching Algorithm**
- Match students with nearest available drivers
- Consider driver ratings
- Route optimization
- Peak hour surge pricing alerts

### Priority 3 (Nice to Have)

#### **Loyalty & Rewards**
- Student referral program
- Ride milestones and discounts
- Driver performance bonuses
- University partnership discounts

#### **Analytics Dashboard**
- Student: Spending analysis, frequent routes
- Driver: Earnings report, peak hours
- Admin: Platform usage statistics, revenue

#### **Multi-language Support**
- English, Hindi, and regional languages
- Accessibility features

#### **Carbon Footprint Tracker**
- Show environmental impact of ride-sharing
- Gamification for eco-friendly choices

#### **University Integration**
- Campus gate entry/exit integration
- University ID verification
- Event-based surge management
- Collaboration with university admin

---

## 🗂️ Data Structure Requirements

### Student Profile
- Name, Email, Phone
- University Name, Student ID, Department, Year
- Profile Photo
- Emergency Contact
- Saved Addresses
- Wallet Balance
- Ride History

### Driver Profile
- Name, Email, Phone
- Profile Photo
- License Number & Expiry
- Vehicle Registration Number
- Vehicle Type & Model
- Seating Capacity
- Insurance Details
- Bank Account Details
- Verification Status (Pending/Approved/Rejected)
- Online/Offline Status
- Current Location (when online)
- Ratings & Reviews
- Total Rides Completed
- Earnings

### Admin Profile
- Name, Email
- Role: Super Admin
- Access Logs

### Booking/Ride Data
- Booking ID
- Student ID
- Driver ID
- Pickup Location (coordinates + address)
- Drop Location (coordinates + address)
- Booking Time
- Ride Start Time
- Ride End Time
- Distance
- Fare
- Payment Status
- Rating & Review
- Status (Pending/Accepted/In Progress/Completed/Cancelled)

---

## 🎨 UI/UX Suggestions

### Design Principles
- Clean and minimal interface
- University-themed color scheme
- Easy navigation for first-time users
- Mobile-first design (most students use phones)
- Quick action buttons (Book Now, Go Online)

### Student App Flow
1. Login/Signup
2. Home screen with "Book a Ride" CTA
3. Enter pickup and drop location
4. View available online drivers
5. Select driver and confirm booking
6. Track ride in real-time
7. Complete ride and rate driver

### Driver App Flow
1. Login/Signup & Document Upload
2. Wait for admin verification
3. Home screen with Online/Offline toggle
4. Receive booking notifications
5. Accept/Reject rides
6. Navigate to pickup
7. Complete ride and receive payment

### Admin Dashboard Flow
1. Login
2. Dashboard with pending verifications count
3. Driver verification queue
4. Review documents
5. Approve/Reject with feedback
6. Monitor active rides and users

---

## 🔒 Security & Privacy

- End-to-end encryption for sensitive data
- Secure payment gateway integration
- Regular security audits
- GDPR compliance for student data
- Driver background verification
- Admin action logs
- Two-factor authentication (future)

---

## 📊 Success Metrics

- Number of verified drivers on platform
- Student signup rate
- Daily active rides
- Average driver rating
- Student retention rate
- Booking completion rate
- Average response time
- Platform revenue

---

## 🚀 Development Phases

### Phase 1: MVP (Minimum Viable Product)
- User authentication (3 roles)
- Basic booking system
- Online/Offline toggle for drivers
- Admin verification dashboard
- Simple profile management

### Phase 2: Core Features
- Payment integration
- Real-time tracking
- Rating & review system
- Push notifications
- Ride history

### Phase 3: Advanced Features
- Ride sharing
- Scheduled rides
- Analytics dashboards
- Loyalty programs
- Multi-language support

### Phase 4: Scale & Optimize
- AI-based matching
- Route optimization
- University partnerships
- Mobile apps (iOS/Android)
- Marketing & growth features

---

## 🛠️ Tech Stack Recommendations

### Frontend (Current)
- Next.js 16 (already set up)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui components

### Suggested Backend
- Firebase (Authentication, Firestore, Storage, Cloud Functions)
- Real-time Database for live tracking
- Firebase Cloud Messaging for notifications

### Suggested Additional Tools
- Google Maps API (location & tracking)
- Razorpay/Stripe (payments)
- Twilio (SMS notifications)
- SendGrid (email notifications)
- Socket.io (real-time updates)

---

## 📝 Next Steps

1. **Finalize feature list** - Prioritize must-have vs nice-to-have
2. **Create detailed wireframes** - Design each screen
3. **Set up database schema** - Design data models
4. **Implement authentication flows** - All three user types
5. **Build driver verification system** - Admin dashboard
6. **Develop booking flow** - Student to driver connection
7. **Integrate maps & location** - Real-time tracking
8. **Add payment gateway** - Secure transactions
9. **Testing & bug fixes** - Ensure reliability
10. **Launch beta** - Test with limited users

---

## 💡 Additional Suggestions

### Marketing & Growth
- University campus ambassadors
- Student discount programs
- Driver onboarding incentives
- Social media presence
- Referral bonuses

### Legal & Compliance
- Terms of Service
- Privacy Policy
- Driver agreements
- Insurance coverage
- Local transport authority compliance

### Customer Support
- In-app help center
- FAQ section
- Complaint resolution system
- 24/7 support for emergencies
- Feedback mechanism

---

## 🎓 University-Specific Features

- **Semester pass**: Unlimited rides during semester
- **Library late-night rides**: Special service for late study hours
- **Exam special**: Increased availability during exam weeks
- **Fest transportation**: Special handling during university events
- **Hostel-to-campus routes**: Pre-defined popular routes
- **Group booking for labs**: Multiple students to same destination

---

## 🌟 Competitive Advantages

1. **University-focused**: Unlike generic taxi apps
2. **Verified drivers**: Safety through admin verification
3. **Student-friendly pricing**: Affordable rates
4. **Campus integration**: Understands university schedules
5. **Community building**: Connect students and local drivers
6. **Sustainability**: Promote ride-sharing

---

## 📞 Contact & Collaboration

**Developer:** Saurabh Jadhav  
**Role:** Frontend Developer  
**Project:** Rik-Ride  

---

*This document is a living specification and will be updated as the project evolves.*

**Version:** 1.0  
**Last Updated:** February 2, 2026  
**Status:** Planning & Ideation Phase

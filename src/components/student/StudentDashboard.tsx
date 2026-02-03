'use client';

import { useState, useEffect } from 'react';
import { APIBook, type Booking, type StudentProfile, BookingStatus } from '@/lib/firebase/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Car, 
  LogOut,
  RefreshCw,
  User,
  Wallet,
  History,
  MapPin,
  Star,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GoogleMapsProvider } from '@/components/maps';
import { 
  EnhancedBookingFormContent,
  EnhancedActiveBookingTrackerContent,
  BookingHistory 
} from '@/components/booking';
import { PostRideRatingDialog } from '@/components/rating';
import { PostRidePaymentDialog } from '@/components/payment';
import { NotificationPermissionPrompt, NotificationListener } from '@/components/notification';
import { RatingType } from '@/lib/types/rating.types';

interface StudentDashboardProps {
  userUid: string;
  userEmail: string;
  userName: string;
}

function StudentDashboardContent({ userUid, userEmail, userName }: StudentDashboardProps) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [completedBookingForRating, setCompletedBookingForRating] = useState<Booking | null>(null);
  const [completedBookingForPayment, setCompletedBookingForPayment] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('book');
  const router = useRouter();

  const fetchData = async () => {
    setRefreshing(true);
    
    const [profileResult, activeBookingResult] = await Promise.all([
      APIBook.student.getStudent(userUid),
      APIBook.booking.getStudentActiveBooking(userUid),
    ]);

    if (profileResult.success && profileResult.data) {
      setProfile(profileResult.data);
    }

    if (activeBookingResult.success && activeBookingResult.data) {
      setActiveBooking(activeBookingResult.data);
      setActiveTab('active');
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
    
    // Initialize push notifications
    const initNotifications = async () => {
      const { NotificationService } = await import('@/lib/firebase/services');
      if (NotificationService.isSupported()) {
        // Check if already granted, if not the banner will show
        const status = NotificationService.getPermissionStatus();
        if (status === 'granted') {
          // Silently get token if already granted
          await NotificationService.requestPermissionAndGetToken(userUid, 'student');
        }
      }
    };
    initNotifications();
  }, [userUid]);

  // Subscribe to active booking updates for real-time status changes
  useEffect(() => {
    if (!activeBooking?.id) return;

    const unsubscribe = APIBook.booking.subscribeToBooking(
      activeBooking.id,
      (updatedBooking) => {
        if (updatedBooking) {
          setActiveBooking(updatedBooking);
          
          // If booking is completed, show payment dialog first
          if (updatedBooking.status === BookingStatus.COMPLETED && !updatedBooking.driverRating) {
            console.log('StudentDashboard: Booking completed, setting payment booking');
            setCompletedBookingForPayment(updatedBooking);
          } else if (updatedBooking.status === BookingStatus.CANCELLED) {
            setActiveBooking(null);
            setActiveTab('book');
            fetchData();
          }
        } else {
          setActiveBooking(null);
          setActiveTab('book');
        }
      }
    );

    return () => unsubscribe();
  }, [activeBooking?.id]);

  const handleLogout = async () => {
    await APIBook.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleBookingCreated = (bookingId: string) => {
    // Fetch the new booking and switch to active tab
    APIBook.booking.getBooking(bookingId).then((result) => {
      if (result.success && result.data) {
        setActiveBooking(result.data);
        setActiveTab('active');
      }
    });
  };

  const handleBookingComplete = (completedBooking?: Booking) => {
    // Store the completed booking for rating dialog
    if (completedBooking) {
      setCompletedBookingForRating(completedBooking);
    } else if (activeBooking) {
      // Use current active booking if no parameter passed
      setCompletedBookingForRating({ ...activeBooking, status: BookingStatus.COMPLETED });
    }
    setActiveBooking(null);
    setActiveTab('history');
    fetchData();
  };

  const handleBookingCancelled = () => {
    setActiveBooking(null);
    setActiveTab('book');
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Notification Listener - listens for new notifications in Firestore */}
      <NotificationListener userType="student" />

      {/* Notification Permission Banner */}
      <NotificationPermissionPrompt 
        userId={userUid} 
        userType="student" 
        variant="banner"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-lg">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">Hello, {userName.split(' ')[0]}!</h1>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <Separator />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{profile?.walletBalance || 0}</div>
            <p className="text-xs text-muted-foreground">Available balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.totalRides || 0}</div>
            <p className="text-xs text-muted-foreground">Completed rides</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Status</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {activeBooking ? (
                <Badge variant={activeBooking.status === BookingStatus.IN_PROGRESS ? 'default' : 'secondary'}>
                  {activeBooking.status === BookingStatus.PENDING && '⏳ Waiting for Driver'}
                  {activeBooking.status === BookingStatus.ACCEPTED && '🚗 Driver on the Way'}
                  {activeBooking.status === BookingStatus.IN_PROGRESS && '🚀 Ride in Progress'}
                </Badge>
              ) : (
                <span className="text-muted-foreground">No active ride</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="book" disabled={!!activeBooking}>
            <MapPin className="h-4 w-4 mr-2" />
            Book Ride
          </TabsTrigger>
          <TabsTrigger value="active" disabled={!activeBooking}>
            <Car className="h-4 w-4 mr-2" />
            Active Ride
            {activeBooking && <Badge className="ml-2" variant="secondary">1</Badge>}
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="book" className="mt-6">
          {activeBooking ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  You have an active booking. Please complete or cancel it before booking a new ride.
                </p>
                <Button className="mt-4" onClick={() => setActiveTab('active')}>
                  View Active Booking
                </Button>
              </CardContent>
            </Card>
          ) : (
            <EnhancedBookingFormContent
              studentId={userUid}
              studentName={userName}
              studentPhone={profile?.phone || ''}
              onBookingCreated={handleBookingCreated}
            />
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          {activeBooking ? (
            <EnhancedActiveBookingTrackerContent
              studentId={userUid}
              initialBooking={activeBooking}
              onBookingComplete={handleBookingComplete}
              onBookingCancelled={handleBookingCancelled}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No active booking. Book a ride to get started!
                </p>
                <Button className="mt-4" onClick={() => setActiveTab('book')}>
                  Book a Ride
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <BookingHistory userId={userUid} userType="student" />
        </TabsContent>
      </Tabs>

      {/* Post-Ride Payment Dialog - Shows FIRST when ride completes */}
      <PostRidePaymentDialog
        booking={completedBookingForPayment}
        onPaymentComplete={() => {
          console.log('StudentDashboard: Payment complete, showing rating dialog');
          // Payment done, now show rating with the same booking
          if (completedBookingForPayment) {
            setCompletedBookingForRating(completedBookingForPayment);
          }
          setCompletedBookingForPayment(null);
        }}
      />

      {/* Post-Ride Rating Dialog - Shows SECOND after payment */}
      {/* Only show if payment dialog is not open */}
      {!completedBookingForPayment && (
        <PostRideRatingDialog
          booking={completedBookingForRating}
          raterType={RatingType.STUDENT}
          onRatingComplete={() => {
            console.log('StudentDashboard: Rating complete');
            setCompletedBookingForRating(null);
            fetchData();
          }}
        />
      )}

      {/* Profile Info */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Student ID</p>
                <p className="font-medium">{profile.studentId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{profile.department}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Year</p>
                <p className="font-medium">Year {profile.year}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">University Email</p>
                <p className="font-medium">{profile.universityEmail}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function StudentDashboard(props: StudentDashboardProps) {
  return (
    <GoogleMapsProvider>
      <StudentDashboardContent {...props} />
    </GoogleMapsProvider>
  );
}

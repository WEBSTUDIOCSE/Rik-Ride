'use client';

import { useState, useEffect } from 'react';
import { APIBook, type Booking, type StudentProfile, BookingStatus } from '@/lib/firebase/services';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Car, 
  LogOut,
  RefreshCw,
  History,
  MapPin,
  Menu,
  X,
  User,
  AlertTriangle,
  Phone,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleMapsProvider } from '@/components/maps';
import { 
  EnhancedBookingFormContent,
  EnhancedActiveBookingTrackerContent,
  BookingHistory,
  AllDriversContactList
} from '@/components/booking';
import { PostRideRatingDialog } from '@/components/rating';
import { PostRidePaymentDialog } from '@/components/payment';
import { NotificationPermissionPrompt, NotificationListener } from '@/components/notification';
import { RatingType } from '@/lib/types/rating.types';
import { ThemeToggle } from '@/components/theme';

interface StudentDashboardProps {
  userUid: string;
  userEmail: string;
  userName: string;
}

type TabType = 'book' | 'active' | 'history';

function StudentDashboardContent({ userUid, userEmail, userName }: StudentDashboardProps) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [completedBookingForRating, setCompletedBookingForRating] = useState<Booking | null>(null);
  const [completedBookingForPayment, setCompletedBookingForPayment] = useState<Booking | null>(null);
  const [cancelledBooking, setCancelledBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('book');
  const [menuOpen, setMenuOpen] = useState(false);
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
        const status = NotificationService.getPermissionStatus();
        if (status === 'granted') {
          await NotificationService.requestPermissionAndGetToken(userUid, 'student');
        }
      }
    };
    initNotifications();
  }, [userUid]);

  // Subscribe to active booking updates
  useEffect(() => {
    if (!activeBooking?.id) return;

    const unsubscribe = APIBook.booking.subscribeToBooking(
      activeBooking.id,
      (updatedBooking) => {
        if (updatedBooking) {
          setActiveBooking(updatedBooking);
          
          if (updatedBooking.status === BookingStatus.COMPLETED && !updatedBooking.driverRating) {
            setCompletedBookingForPayment(updatedBooking);
          } else if (updatedBooking.status === BookingStatus.CANCELLED) {
            // Preserve booking info so student can retry with another driver
            setCancelledBooking(updatedBooking);
            setActiveBooking(null);
            setActiveTab('book');
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
    APIBook.booking.getBooking(bookingId).then((result) => {
      if (result.success && result.data) {
        setActiveBooking(result.data);
        setActiveTab('active');
      }
    });
  };

  const handleBookingComplete = (completedBooking?: Booking) => {
    if (completedBooking) {
      setCompletedBookingForRating(completedBooking);
    } else if (activeBooking) {
      setCompletedBookingForRating({ ...activeBooking, status: BookingStatus.COMPLETED });
    }
    setActiveBooking(null);
    setActiveTab('history');
    fetchData();
  };

  const handleBookingCancelled = () => {
    // Store cancelled booking details so student can retry
    if (activeBooking) {
      setCancelledBooking(activeBooking);
    }
    setActiveBooking(null);
    setActiveTab('book');
  };

  const getStatusInfo = () => {
    if (!activeBooking) return null;
    
    switch (activeBooking.status) {
      case BookingStatus.PENDING:
        return { emoji: '⏳', text: 'Finding Driver...', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
      case BookingStatus.ACCEPTED:
        return { emoji: '🚗', text: 'Driver Coming', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case BookingStatus.IN_PROGRESS:
        return { emoji: '🚀', text: 'On the Way!', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-secondary/30 border-t-secondary animate-spin mx-auto" />
          </div>
          <p className="text-foreground/70">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-background">
      {/* Notification Listener */}
      <NotificationListener userType="student" />

      {/* Header - Responsive for Mobile & Desktop */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-secondary/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* User Info */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-secondary/50">
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-base sm:text-lg">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-foreground font-semibold text-base sm:text-lg">
                  Hey, {userName.split(' ')[0]}! 👋
                </h1>
                {statusInfo && (
                  <Badge className={`text-xs px-2 py-0.5 mt-1 ${statusInfo.color} border`}>
                    {statusInfo.emoji} {statusInfo.text}
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={fetchData}
                disabled={refreshing}
                className="text-foreground/70 hover:text-secondary hover:bg-secondary/10"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-foreground/70 hover:text-secondary hover:bg-secondary/10"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-4 top-full mt-2 w-48 bg-card border-2 border-secondary/30 rounded-lg shadow-lg overflow-hidden z-50">
              <Link 
                href="/profile" 
                className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-secondary/10 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <User className="h-4 w-4 text-secondary" />
                <span>Profile</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Notification Banner */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-3">
        <NotificationPermissionPrompt 
          userId={userUid} 
          userType="student" 
          variant="banner"
        />
      </div>

      {/* Tab Navigation - Bottom Style on Mobile, Top on Desktop */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex bg-card rounded-xl p-1.5 border border-secondary/20 max-w-md mx-auto sm:max-w-lg">
          <button
            onClick={() => !activeBooking && setActiveTab('book')}
            disabled={!!activeBooking}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'book'
                ? 'bg-primary text-primary-foreground shadow-[0px_2px_0px_0px_var(--rickshaw-green-dark)]'
                : activeBooking
                ? 'text-foreground/30 cursor-not-allowed'
                : 'text-foreground/70 hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span className="hidden xs:inline">Book</span>
          </button>
          <button
            onClick={() => activeBooking && setActiveTab('active')}
            disabled={!activeBooking}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
              activeTab === 'active'
                ? 'bg-primary text-primary-foreground shadow-[0px_2px_0px_0px_var(--rickshaw-green-dark)]'
                : !activeBooking
                ? 'text-foreground/30 cursor-not-allowed'
                : 'text-foreground/70 hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <Car className="h-4 w-4" />
            <span className="hidden xs:inline">Active</span>
            {activeBooking && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-secondary rounded-full animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-primary text-primary-foreground shadow-[0px_2px_0px_0px_var(--rickshaw-green-dark)]'
                : 'text-foreground/70 hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <History className="h-4 w-4" />
            <span className="hidden xs:inline">History</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
        {/* Book Tab */}
        {activeTab === 'book' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            {activeBooking ? (
              <div className="bg-card backdrop-blur-md border-2 border-secondary/30 rounded-xl p-6 text-center">
                <Car className="h-12 w-12 mx-auto mb-4 text-secondary" />
                <p className="text-foreground mb-4">
                  Aapki ek ride chal rahi hai. Pehle woh complete karo! 🚗
                </p>
                <Button 
                  onClick={() => setActiveTab('active')}
                  className="bg-primary hover:bg-primary/90 text-foreground shadow-[0px_4px_0px_0px_var(--rickshaw-green-dark)] hover:shadow-[0px_2px_0px_0px_var(--rickshaw-green-dark)] hover:translate-y-[2px] active:shadow-none active:translate-y-1 transition-all"
                >
                  Active Ride Dekho
                </Button>
              </div>
            ) : cancelledBooking ? (
              <div className="space-y-4">
                {/* Driver Not Available Alert */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 text-center">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-yellow-500" />
                  <h3 className="font-semibold text-base mb-1">Driver Not Available</h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    {cancelledBooking.driverName} cancelled the ride request.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {cancelledBooking.pickupLocation?.address} → {cancelledBooking.dropLocation?.address}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setCancelledBooking(null);
                    }}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Book New Ride
                  </Button>
                </div>

                {/* Driver Contact List */}
                <AllDriversContactList showByDefault={true} compact={true} />
              </div>
            ) : (
              <EnhancedBookingFormContent
                studentId={userUid}
                studentName={userName}
                studentPhone={profile?.phone || ''}
                onBookingCreated={handleBookingCreated}
              />
            )}
          </div>
        )}

        {/* Active Tab */}
        {activeTab === 'active' && (
          <div className="max-w-2xl mx-auto">
            {activeBooking ? (
              <EnhancedActiveBookingTrackerContent
                studentId={userUid}
                initialBooking={activeBooking}
                onBookingComplete={handleBookingComplete}
                onBookingCancelled={handleBookingCancelled}
              />
            ) : (
              <div className="bg-card backdrop-blur-md border-2 border-secondary/30 rounded-xl p-6 text-center">
                <Car className="h-12 w-12 mx-auto mb-4 text-foreground/50" />
                <p className="text-foreground/70 mb-4">
                  Koi active ride nahi hai. Chaliye book karein! 🛺
                </p>
                <Button 
                  onClick={() => setActiveTab('book')}
                  className="bg-primary hover:bg-primary/90 text-foreground shadow-[0px_4px_0px_0px_var(--rickshaw-green-dark)] hover:shadow-[0px_2px_0px_0px_var(--rickshaw-green-dark)] hover:translate-y-[2px] active:shadow-none active:translate-y-1 transition-all"
                >
                  Ride Book Karo
                </Button>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="max-w-2xl mx-auto">
            <BookingHistory userId={userUid} userType="student" />
          </div>
        )}
      </main>

      {/* Post-Ride Payment Dialog */}
      <PostRidePaymentDialog
        booking={completedBookingForPayment}
        onPaymentComplete={() => {
          if (completedBookingForPayment) {
            setCompletedBookingForRating(completedBookingForPayment);
          }
          setCompletedBookingForPayment(null);
        }}
      />

      {/* Post-Ride Rating Dialog */}
      {!completedBookingForPayment && (
        <PostRideRatingDialog
          booking={completedBookingForRating}
          raterType={RatingType.STUDENT}
          onRatingComplete={() => {
            setCompletedBookingForRating(null);
            fetchData();
          }}
        />
      )}

      {/* Click outside to close menu */}
      {menuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setMenuOpen(false)} 
        />
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

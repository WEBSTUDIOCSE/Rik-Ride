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
  Settings,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

type TabType = 'book' | 'active' | 'history';

function StudentDashboardContent({ userUid, userEmail, userName }: StudentDashboardProps) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [completedBookingForRating, setCompletedBookingForRating] = useState<Booking | null>(null);
  const [completedBookingForPayment, setCompletedBookingForPayment] = useState<Booking | null>(null);
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
    setActiveBooking(null);
    setActiveTab('book');
    fetchData();
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
      <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-[#FFD700]/30 border-t-[#FFD700] animate-spin mx-auto" />
          </div>
          <p className="text-white/70">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Notification Listener */}
      <NotificationListener userType="student" />

      {/* Header - Responsive for Mobile & Desktop */}
      <header className="sticky top-0 z-50 bg-[#1a1a1a]/95 backdrop-blur-md border-b border-[#FFD700]/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* User Info */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-[#FFD700]/50">
                <AvatarFallback className="bg-[#009944] text-white font-bold text-base sm:text-lg">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-white font-semibold text-base sm:text-lg">
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
              <Button 
                variant="ghost" 
                size="icon"
                onClick={fetchData}
                disabled={refreshing}
                className="text-white/70 hover:text-[#FFD700] hover:bg-[#FFD700]/10"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-white/70 hover:text-[#FFD700] hover:bg-[#FFD700]/10"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-4 top-full mt-2 w-48 bg-[#252525] border-2 border-[#FFD700]/30 rounded-lg shadow-lg overflow-hidden z-50">
              <Link 
                href="/profile" 
                className="flex items-center gap-3 px-4 py-3 text-white hover:bg-[#FFD700]/10 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <User className="h-4 w-4 text-[#FFD700]" />
                <span>Profile</span>
              </Link>
              <Link 
                href="/change-password" 
                className="flex items-center gap-3 px-4 py-3 text-white hover:bg-[#FFD700]/10 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <Settings className="h-4 w-4 text-[#FFD700]" />
                <span>Settings</span>
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
        <div className="flex bg-[#252525] rounded-xl p-1.5 border border-[#FFD700]/20 max-w-md mx-auto sm:max-w-lg">
          <button
            onClick={() => !activeBooking && setActiveTab('book')}
            disabled={!!activeBooking}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'book'
                ? 'bg-[#009944] text-white shadow-[0px_2px_0px_0px_#006400]'
                : activeBooking
                ? 'text-white/30 cursor-not-allowed'
                : 'text-white/70 hover:text-white hover:bg-white/5'
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
                ? 'bg-[#009944] text-white shadow-[0px_2px_0px_0px_#006400]'
                : !activeBooking
                ? 'text-white/30 cursor-not-allowed'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Car className="h-4 w-4" />
            <span className="hidden xs:inline">Active</span>
            {activeBooking && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-[#FFD700] rounded-full animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-[#009944] text-white shadow-[0px_2px_0px_0px_#006400]'
                : 'text-white/70 hover:text-white hover:bg-white/5'
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
              <div className="bg-white/10 backdrop-blur-md border-2 border-[#FFD700]/30 rounded-xl p-6 text-center">
                <Car className="h-12 w-12 mx-auto mb-4 text-[#FFD700]" />
                <p className="text-white mb-4">
                  Aapki ek ride chal rahi hai. Pehle woh complete karo! 🚗
                </p>
                <Button 
                  onClick={() => setActiveTab('active')}
                  className="bg-[#009944] hover:bg-[#009944]/90 text-white shadow-[0px_4px_0px_0px_#006400] hover:shadow-[0px_2px_0px_0px_#006400] hover:translate-y-[2px] active:shadow-none active:translate-y-1 transition-all"
                >
                  Active Ride Dekho
                </Button>
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
              <div className="bg-white/10 backdrop-blur-md border-2 border-[#FFD700]/30 rounded-xl p-6 text-center">
                <Car className="h-12 w-12 mx-auto mb-4 text-white/50" />
                <p className="text-white/70 mb-4">
                  Koi active ride nahi hai. Chaliye book karein! 🛺
                </p>
                <Button 
                  onClick={() => setActiveTab('book')}
                  className="bg-[#009944] hover:bg-[#009944]/90 text-white shadow-[0px_4px_0px_0px_#006400] hover:shadow-[0px_2px_0px_0px_#006400] hover:translate-y-[2px] active:shadow-none active:translate-y-1 transition-all"
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

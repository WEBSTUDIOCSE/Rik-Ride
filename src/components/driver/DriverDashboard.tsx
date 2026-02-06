'use client';

import { useState, useEffect } from 'react';
import { APIBook, type DriverProfile, type Booking, VerificationStatus, DriverStatus } from '@/lib/firebase/services';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/theme';
import { 
  Car, 
  Star, 
  LogOut,
  RefreshCw,
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Navigation,
  Power,
  History,
  QrCode,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DriverBookingManager, BookingHistory } from '@/components/booking';
import { PostRideRatingDialog, UserRatingSection } from '@/components/rating';
import { DriverPaymentSettings } from '@/components/payment';
import { NotificationPermissionPrompt, NotificationListener } from '@/components/notification';
import { RatingType } from '@/lib/types/rating.types';

interface DriverDashboardProps {
  userUid: string;
  userEmail: string;
  userName: string;
}

type TabKey = 'requests' | 'history' | 'ratings' | 'payment';

const tabs: { key: TabKey; label: string; icon: typeof Navigation }[] = [
  { key: 'requests', label: 'Rides', icon: Navigation },
  { key: 'history', label: 'History', icon: History },
  { key: 'ratings', label: 'Ratings', icon: Star },
  { key: 'payment', label: 'Payment', icon: QrCode },
];

export default function DriverDashboard({ userUid, userEmail, userName }: DriverDashboardProps) {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('requests');
  const [lastCompletedBooking, setLastCompletedBooking] = useState<Booking | null>(null);
  const router = useRouter();

  const fetchData = async () => {
    setRefreshing(true);
    
    const result = await APIBook.driver.getDriver(userUid);

    if (result.success && result.data) {
      setProfile(result.data);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
    
    const initNotifications = async () => {
      const { NotificationService } = await import('@/lib/firebase/services');
      if (NotificationService.isSupported()) {
        const status = NotificationService.getPermissionStatus();
        if (status === 'granted') {
          await NotificationService.requestPermissionAndGetToken(userUid, 'driver');
        }
      }
    };
    initNotifications();
  }, [userUid]);

  const handleLogout = async () => {
    if (profile?.onlineStatus === DriverStatus.ONLINE) {
      await APIBook.driver.toggleOnlineStatus(userUid, DriverStatus.OFFLINE);
    }
    await APIBook.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleToggleOnline = async () => {
    if (!profile) return;
    
    setTogglingStatus(true);
    
    const newStatus = profile.onlineStatus === DriverStatus.ONLINE 
      ? DriverStatus.OFFLINE 
      : DriverStatus.ONLINE;
    
    let location: { lat: number; lng: number } | undefined;
    if (newStatus === DriverStatus.ONLINE && navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });
        location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      } catch (error) {
        console.error('Failed to get location:', error);
      }
    }
    
    const result = await APIBook.driver.toggleOnlineStatus(userUid, newStatus, location);
    
    if (result.success) {
      setProfile(prev => prev ? { ...prev, onlineStatus: newStatus, currentLocation: location || null } : null);
    }
    
    setTogglingStatus(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold">Profile Not Found</h2>
          <p className="text-sm text-muted-foreground">
            Your driver profile could not be found. Please complete your registration.
          </p>
          <Button onClick={() => router.push('/signup/driver')} className="w-full">
            Complete Registration
          </Button>
        </div>
      </div>
    );
  }

  const isVerified = profile.verificationStatus === VerificationStatus.APPROVED;
  const isPending = profile.verificationStatus === VerificationStatus.PENDING;
  const isRejected = profile.verificationStatus === VerificationStatus.REJECTED;
  const isOnline = profile.onlineStatus === DriverStatus.ONLINE;

  return (
    <div className="min-h-screen pb-20 md:pb-4">
      <NotificationListener userType="driver" />

      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="text-sm bg-primary/20 text-primary font-semibold">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="text-base font-semibold truncate">Hi, {userName.split(' ')[0]}!</h1>
              <div className="flex items-center gap-1.5">
                {isVerified && (
                  <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                )}
                <span className="text-xs text-muted-foreground truncate">
                  {isVerified ? (isOnline ? 'Online' : 'Offline') : isPending ? 'Pending Verification' : 'Not Verified'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={fetchData}
              disabled={refreshing}
              className="h-9 w-9"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9 text-red-400 hover:text-red-500 hover:bg-red-500/10">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 space-y-4">
        {/* Notification Banner */}
        <NotificationPermissionPrompt 
          userId={userUid} 
          userType="driver" 
          variant="banner"
        />

        {/* Verification Alerts */}
        {isPending && (
          <Alert className="border-yellow-500/30 bg-yellow-500/10">
            <Clock className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-sm">
              <strong>Verification Pending</strong> — Your profile is under review. You&apos;ll be able to go online once approved.
            </AlertDescription>
          </Alert>
        )}

        {isRejected && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Verification Rejected</strong> — {profile.verificationNotes || 'Please contact support for details.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Online Toggle - Prominent */}
        {isVerified && (
          <div 
            className={`flex items-center justify-between rounded-xl p-4 transition-colors border ${
              isOnline 
                ? 'bg-primary/10 border-primary/30' 
                : 'bg-card border-border'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-full transition-colors ${isOnline ? 'bg-primary/20' : 'bg-muted'}`}>
                <Power className={`h-5 w-5 transition-colors ${isOnline ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {isOnline ? 'You\'re Online' : 'You\'re Offline'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isOnline ? 'Accepting ride requests' : 'Toggle to start accepting rides'}
                </p>
              </div>
            </div>
            <Switch
              checked={isOnline}
              onCheckedChange={handleToggleOnline}
              disabled={togglingStatus}
              className="scale-110"
            />
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Car className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-lg font-bold">{profile.totalRides}</p>
            <p className="text-[11px] text-muted-foreground">Rides</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <IndianRupee className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-lg font-bold">₹{profile.totalEarnings}</p>
            <p className="text-[11px] text-muted-foreground">Earnings</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="h-3.5 w-3.5 text-yellow-500" />
            </div>
            <p className="text-lg font-bold">
              {profile.rating > 0 ? profile.rating.toFixed(1) : 'N/A'}
            </p>
            <p className="text-[11px] text-muted-foreground">Rating</p>
          </div>
        </div>

        {/* Tab Content Area */}
        {isVerified && (
          <div className="space-y-3">
            {/* Desktop Tab Bar (hidden on mobile, shown on md+) */}
            <div className="hidden md:flex items-center gap-1 bg-card border border-border rounded-xl p-1.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">
              {activeTab === 'requests' && (
                <DriverBookingManager 
                  driverId={profile.uid} 
                  onBookingComplete={(completedBooking) => {
                    setLastCompletedBooking(completedBooking);
                  }}
                />
              )}
              {activeTab === 'history' && (
                <BookingHistory 
                  userId={profile.uid} 
                  userType="driver" 
                />
              )}
              {activeTab === 'ratings' && (
                <UserRatingSection 
                  userId={profile.uid}
                  userName={profile.displayName || userName}
                  userType={RatingType.DRIVER}
                  showPendingRatings
                  showRecentReviews
                />
              )}
              {activeTab === 'payment' && (
                <DriverPaymentSettings driverId={profile.uid} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation (visible only on mobile) */}
      {isVerified && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border safe-bottom">
          <div className="grid grid-cols-4 gap-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 transition-colors relative ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground active:text-foreground'
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                  )}
                  <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                  <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-primary' : ''}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Post-Ride Rating Dialog */}
      <PostRideRatingDialog
        booking={lastCompletedBooking}
        raterType={RatingType.DRIVER}
        onRatingComplete={() => {
          setLastCompletedBooking(null);
          fetchData();
        }}
      />
    </div>
  );
}

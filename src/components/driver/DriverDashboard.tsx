'use client';

import { useState, useEffect } from 'react';
import { APIBook, type DriverProfile, type Booking, VerificationStatus, DriverStatus, BookingStatus } from '@/lib/firebase/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

export default function DriverDashboard({ userUid, userEmail, userName }: DriverDashboardProps) {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
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
    
    // Initialize push notifications
    const initNotifications = async () => {
      const { NotificationService } = await import('@/lib/firebase/services');
      if (NotificationService.isSupported()) {
        // Check if already granted, if not the banner will show
        const status = NotificationService.getPermissionStatus();
        if (status === 'granted') {
          // Silently get token if already granted
          await NotificationService.requestPermissionAndGetToken(userUid, 'driver');
        }
      }
    };
    initNotifications();
  }, [userUid]);

  const handleLogout = async () => {
    // Set offline before logging out
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
    
    // If going online, get current location
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
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">
              Your driver profile could not be found. Please complete your registration.
            </p>
            <Button onClick={() => router.push('/signup/driver')}>
              Complete Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isVerified = profile.verificationStatus === VerificationStatus.APPROVED;
  const isPending = profile.verificationStatus === VerificationStatus.PENDING;
  const isRejected = profile.verificationStatus === VerificationStatus.REJECTED;
  const isOnline = profile.onlineStatus === DriverStatus.ONLINE;

  return (
    <div className="p-4 space-y-4">
      {/* Notification Listener - listens for new notifications in Firestore */}
      <NotificationListener userType="driver" />

      {/* Notification Permission Banner */}
      <NotificationPermissionPrompt 
        userId={userUid} 
        userType="driver" 
        variant="banner"
      />

      {/* Header - Compact */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="text-base bg-primary/20 text-primary">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-bold">Hi, {userName.split(' ')[0]}!</h1>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={fetchData}
            disabled={refreshing}
            className="h-8 w-8"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-500/10">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Verification Status Alerts */}
      {isPending && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <strong>Verification Pending:</strong> Your profile is under review. You will be able to go online once verified by admin.
          </AlertDescription>
        </Alert>
      )}

      {isRejected && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Verification Rejected:</strong> {profile.verificationNotes || 'Please contact support for more information.'}
          </AlertDescription>
        </Alert>
      )}

      <Separator />

      {/* Online Toggle (Only for verified drivers) - Compact */}
      {isVerified && (
        <div className="flex items-center justify-between bg-card rounded-lg p-3 border border-border">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isOnline ? 'bg-primary/20' : 'bg-muted'}`}>
              <Power className={`h-5 w-5 ${isOnline ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <span className="font-medium text-sm">
                {isOnline ? 'You are Online' : 'Go Online'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isOnline ? 'default' : 'secondary'} className="text-xs">
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            <Switch
              checked={isOnline}
              onCheckedChange={handleToggleOnline}
              disabled={togglingStatus}
            />
          </div>
        </div>
      )}

      {/* Stats Cards - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Rides</span>
            <Car className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="text-xl font-bold">{profile.totalRides}</div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Earnings</span>
            <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="text-xl font-bold">₹{profile.totalEarnings}</div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Rating</span>
            <Star className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="text-xl font-bold flex items-center gap-1">
            {profile.rating > 0 ? profile.rating.toFixed(1) : 'N/A'}
            {profile.rating > 0 && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Status</span>
            {isVerified ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            ) : isPending ? (
              <Clock className="h-3.5 w-3.5 text-yellow-500" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-red-500" />
            )}
          </div>
          <div className="text-lg font-bold">
            {isVerified ? 'Verified' : isPending ? 'Pending' : 'Rejected'}
          </div>
        </Card>
      </div>

      {/* Booking Management Section (Only for verified & online drivers) */}
      {isVerified && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Ride Management
            </CardTitle>
            <CardDescription>
              Manage your ride requests and view your history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="requests" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="requests" className="flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Ride Requests
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  My History
                </TabsTrigger>
                <TabsTrigger value="ratings" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  My Ratings
                </TabsTrigger>
                <TabsTrigger value="payment" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Payment Setup
                </TabsTrigger>
              </TabsList>
              <TabsContent value="requests" className="mt-4">
                <DriverBookingManager 
                  driverId={profile.uid} 
                  onBookingComplete={(completedBooking) => {
                    setLastCompletedBooking(completedBooking);
                  }}
                />
              </TabsContent>
              <TabsContent value="history" className="mt-4">
                <BookingHistory 
                  userId={profile.uid} 
                  userType="driver" 
                />
              </TabsContent>
              <TabsContent value="ratings" className="mt-4">
                <UserRatingSection 
                  userId={profile.uid}
                  userName={profile.displayName || userName}
                  userType={RatingType.DRIVER}
                  showPendingRatings
                  showRecentReviews
                />
              </TabsContent>
              <TabsContent value="payment" className="mt-4">
                <DriverPaymentSettings driverId={profile.uid} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Post-Ride Rating Dialog - Shows when a ride is completed */}
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

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
import { Label } from '@/components/ui/label';
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
  FileText,
  Power,
  Bell,
  History,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DriverBookingManager, BookingHistory } from '@/components/booking';
import { PostRideRatingDialog, UserRatingSection } from '@/components/rating';
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
    <div className="p-6 space-y-6">
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

      {isVerified && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Verified Driver:</strong> Your profile has been verified. You can now go online and accept rides.
          </AlertDescription>
        </Alert>
      )}

      <Separator />

      {/* Online Toggle (Only for verified drivers) */}
      {isVerified && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${isOnline ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Power className={`h-6 w-6 ${isOnline ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Availability Status</h2>
                  <p className="text-sm text-muted-foreground">
                    {isOnline 
                      ? 'You are visible to students and can receive ride requests' 
                      : 'Toggle to start accepting ride requests'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={isOnline ? 'default' : 'secondary'}>
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
                <Switch
                  checked={isOnline}
                  onCheckedChange={handleToggleOnline}
                  disabled={togglingStatus}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.totalRides}</div>
            <p className="text-xs text-muted-foreground">Completed rides</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{profile.totalEarnings}</div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {profile.rating > 0 ? profile.rating.toFixed(1) : 'N/A'}
              {profile.rating > 0 && <Star className="h-5 w-5" />}
            </div>
            <p className="text-xs text-muted-foreground">
              {profile.totalRatings} ratings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Verification</CardTitle>
            {isVerified ? (
              <CheckCircle className="h-4 w-4" />
            ) : isPending ? (
              <Clock className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {isVerified ? 'Verified' : isPending ? 'Pending' : 'Rejected'}
            </div>
            <p className="text-xs text-muted-foreground">
              {profile.verifiedAt ? `Since ${new Date(profile.verifiedAt).toLocaleDateString()}` : 'Awaiting review'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Booking Management Section (Only for verified & online drivers) */}
      {isVerified && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Ride Management
            </CardTitle>
            <CardDescription>
              Manage your ride requests and view your history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="requests" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
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
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Vehicle Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicle Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <Label className="text-muted-foreground">Vehicle Type</Label>
              <p className="font-medium">{profile.vehicleType}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Vehicle Model</Label>
              <p className="font-medium">{profile.vehicleModel}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Registration Number</Label>
              <p className="font-medium">{profile.vehicleRegistrationNumber}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Seating Capacity</Label>
              <p className="font-medium">{profile.seatingCapacity} passengers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents & License
          </CardTitle>
          <CardDescription>
            Your uploaded verification documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <Label className="text-muted-foreground">License Number</Label>
              <p className="font-medium">{profile.licenseNumber}</p>
              <p className="text-xs text-muted-foreground">
                Expires: {new Date(profile.licenseExpiry).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Aadhar Number</Label>
              <p className="font-medium">{profile.aadharNumber}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Documents Uploaded</Label>
              <p className="font-medium">{profile.documents.length} files</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Phone</Label>
              <p className="font-medium">{profile.phone || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

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

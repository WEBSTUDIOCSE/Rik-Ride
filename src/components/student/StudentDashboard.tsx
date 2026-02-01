'use client';

import { useState, useEffect } from 'react';
import { APIBook, type DriverProfile, type StudentProfile, VerificationStatus, DriverStatus } from '@/lib/firebase/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Car, 
  MapPin, 
  Star, 
  Phone,
  LogOut,
  RefreshCw,
  Navigation,
  Clock,
  User,
  Wallet
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StudentDashboardProps {
  userUid: string;
  userEmail: string;
  userName: string;
}

export default function StudentDashboard({ userUid, userEmail, userName }: StudentDashboardProps) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [onlineDrivers, setOnlineDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    setRefreshing(true);
    
    const [profileResult, driversResult] = await Promise.all([
      APIBook.student.getStudent(userUid),
      APIBook.driver.getOnlineDrivers(),
    ]);

    if (profileResult.success && profileResult.data) {
      setProfile(profileResult.data);
    }

    if (driversResult.success && driversResult.data) {
      setOnlineDrivers(driversResult.data);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, [userUid]);

  const handleLogout = async () => {
    await APIBook.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
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
            <CardTitle className="text-sm font-medium">Available Drivers</CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{onlineDrivers.length}</div>
            <p className="text-xs text-muted-foreground">Online now</p>
          </CardContent>
        </Card>
      </div>

      {/* Book a Ride Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Book a Ride
          </CardTitle>
          <CardDescription>
            Select an available driver to book your ride
          </CardDescription>
        </CardHeader>
        <CardContent>
          {onlineDrivers.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg">No Drivers Available</h3>
              <p className="text-muted-foreground">
                There are no drivers online at the moment. Please check back later.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={fetchData}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Again
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {onlineDrivers.map((driver) => (
                <Card key={driver.uid} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-green-100 text-green-700">
                          {driver.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{driver.displayName}</h3>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Online
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">
                            {driver.rating > 0 ? driver.rating.toFixed(1) : 'New'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({driver.totalRides} rides)
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{driver.vehicleType}</Badge>
                          <Badge variant="outline">{driver.vehicleRegistrationNumber}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Capacity: {driver.seatingCapacity} passengers
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button className="flex-1" size="sm">
                        <MapPin className="h-4 w-4 mr-2" />
                        Book Now
                      </Button>
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { APIBook } from '@/lib/firebase/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { StudentProfileEdit } from '@/components/profile';
import { DriverProfileEdit } from '@/components/profile';
import UserProfile from './UserProfile';
import { UserRole, StudentProfile, DriverProfile } from '@/lib/types/user.types';
import { LogOut, AlertCircle, Lock, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface ProfileContentProps {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    role?: UserRole;
  };
}

export default function ProfileContent({ user }: ProfileContentProps) {
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadProfile = async () => {
    if (!user.role) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (user.role === UserRole.STUDENT) {
        const result = await APIBook.student.getStudent(user.uid);
        if (result.success && result.data) {
          setStudentProfile(result.data);
        } else {
          setError('Failed to load student profile');
        }
      } else if (user.role === UserRole.DRIVER) {
        const result = await APIBook.driver.getDriver(user.uid);
        if (result.success && result.data) {
          setDriverProfile(result.data);
        } else {
          setError('Failed to load driver profile');
        }
      }
    } catch (err) {
      setError('An error occurred while loading your profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.uid, user.role]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await APIBook.auth.signOut();
    // Auth context will handle redirect
  };

  const handleStudentUpdate = (updatedStudent: StudentProfile) => {
    setStudentProfile(updatedStudent);
  };

  const handleDriverUpdate = (updatedDriver: DriverProfile) => {
    setDriverProfile(updatedDriver);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Profile Content - 2 columns */}
      <div className="lg:col-span-2 space-y-6">
        {/* Role-specific Profile Editor */}
        {user.role === UserRole.STUDENT && studentProfile && (
          <StudentProfileEdit 
            student={studentProfile} 
            onUpdate={handleStudentUpdate}
          />
        )}

        {user.role === UserRole.DRIVER && driverProfile && (
          <DriverProfileEdit 
            driver={driverProfile} 
            onUpdate={handleDriverUpdate}
          />
        )}

        {user.role === UserRole.ADMIN && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{user.displayName || 'Admin'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email || 'No email'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium">Administrator</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!user.role && (
          <Card>
            <CardHeader>
              <CardTitle>Basic Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <UserProfile />
            </CardContent>
          </Card>
        )}

        {user.role === UserRole.STUDENT && !studentProfile && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Student profile not found. Please contact support.</AlertDescription>
          </Alert>
        )}

        {user.role === UserRole.DRIVER && !driverProfile && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Driver profile not found. Please contact support.</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Sidebar - Quick Actions - 1 column */}
      <div className="space-y-6">
        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/change-password" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Lock className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </Link>
            <Link href="/delete-account" className="block">
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {loggingOut ? 'Signing out...' : 'Sign Out'}
            </Button>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Email verified:</span>
              <span className={`text-sm font-medium ${user.emailVerified ? 'text-green-600' : 'text-amber-600'}`}>
                {user.emailVerified ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            {user.role && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Role:</span>
                <span className="text-sm font-medium capitalize">
                  {user.role}
                </span>
              </div>
            )}
            {user.role === UserRole.STUDENT && studentProfile && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Student ID:</span>
                  <span className="text-sm font-medium">
                    {studentProfile.studentId}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Rides:</span>
                  <span className="text-sm font-medium">
                    {studentProfile.totalRides}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Wallet Balance:</span>
                  <span className="text-sm font-medium">
                    ₹{studentProfile.walletBalance}
                  </span>
                </div>
              </>
            )}
            {user.role === UserRole.DRIVER && driverProfile && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">License:</span>
                  <span className="text-sm font-medium">
                    {driverProfile.licenseNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Rides:</span>
                  <span className="text-sm font-medium">
                    {driverProfile.totalRides}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Rating:</span>
                  <span className="text-sm font-medium">
                    {driverProfile.rating > 0 ? `⭐ ${driverProfile.rating.toFixed(1)}` : 'No ratings yet'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Earnings:</span>
                  <span className="text-sm font-medium">
                    ₹{driverProfile.totalEarnings}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { APIBook } from '@/lib/firebase/services';
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
        <div className="bg-card backdrop-blur-md border-2 border-secondary/30 rounded-xl p-6">
          <Skeleton className="h-6 w-48 bg-muted mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full bg-muted" />
            <Skeleton className="h-20 w-full bg-muted" />
            <Skeleton className="h-20 w-full bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="bg-red-500/20 border-red-500">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-red-400">{error}</AlertDescription>
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
          <div className="bg-card backdrop-blur-md border-2 border-secondary rounded-xl p-6">
            <h3 className="text-lg font-bold text-secondary mb-4">Admin Profile</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium text-foreground">{user.displayName || 'Admin'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{user.email || 'No email'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium text-foreground">Administrator</p>
              </div>
            </div>
          </div>
        )}

        {!user.role && (
          <div className="bg-card backdrop-blur-md border-2 border-secondary rounded-xl p-6">
            <h3 className="text-lg font-bold text-secondary mb-4">Basic Profile</h3>
            <UserProfile />
          </div>
        )}

        {user.role === UserRole.STUDENT && !studentProfile && (
          <Alert className="bg-secondary/10 border-secondary/30">
            <AlertCircle className="h-4 w-4 text-secondary" />
            <AlertDescription className="text-secondary">Student profile not found. Please contact support.</AlertDescription>
          </Alert>
        )}

        {user.role === UserRole.DRIVER && !driverProfile && (
          <Alert className="bg-secondary/10 border-secondary/30">
            <AlertCircle className="h-4 w-4 text-secondary" />
            <AlertDescription className="text-secondary">Driver profile not found. Please contact support.</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Sidebar - Quick Actions - 1 column */}
      <div className="space-y-6">
        {/* Account Actions */}
        <div className="bg-card backdrop-blur-md border-2 border-secondary rounded-xl p-6">
          <h3 className="text-lg font-bold text-secondary mb-4">Account Actions</h3>
          <div className="space-y-3">
            <Link href="/change-password" className="block">
              <button className="w-full flex items-center gap-3 bg-primary text-primary-foreground py-3 px-4 rounded-lg font-bold uppercase tracking-wider shadow-[0px_4px_0px_0px_var(--rickshaw-green-dark)] hover:shadow-[0px_2px_0px_0px_var(--rickshaw-green-dark)] hover:translate-y-[2px] active:shadow-none active:translate-y-1 transition-all text-sm">
                <Lock className="h-4 w-4" />
                Password Badlo
              </button>
            </Link>
            <Link href="/delete-account" className="block">
              <button className="w-full flex items-center gap-3 bg-red-500 text-white py-3 px-4 rounded-lg font-bold uppercase tracking-wider shadow-[0px_4px_0px_0px_#991b1b] hover:shadow-[0px_2px_0px_0px_#991b1b] hover:translate-y-[2px] active:shadow-none active:translate-y-1 transition-all text-sm">
                <Trash2 className="h-4 w-4" />
                Account Delete
              </button>
            </Link>
            <button
              className="w-full flex items-center justify-center gap-3 bg-background border-2 border-secondary text-foreground py-3 px-4 rounded-lg font-bold uppercase tracking-wider hover:bg-secondary hover:text-foreground transition-all text-sm disabled:opacity-50"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-card backdrop-blur-md border-2 border-secondary/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-secondary mb-4">Account Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Email verified:</span>
              <span className={`text-sm font-medium ${user.emailVerified ? 'text-primary' : 'text-secondary'}`}>
                {user.emailVerified ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            {user.role && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Role:</span>
                <span className="text-sm font-medium capitalize text-foreground">
                  {user.role}
                </span>
              </div>
            )}
            {user.role === UserRole.STUDENT && studentProfile && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Student ID:</span>
                  <span className="text-sm font-medium text-foreground">
                    {studentProfile.studentId}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Rides:</span>
                  <span className="text-sm font-medium text-foreground">
                    {studentProfile.totalRides}
                  </span>
                </div>
              </>
            )}
            {user.role === UserRole.DRIVER && driverProfile && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">License:</span>
                  <span className="text-sm font-medium text-foreground">
                    {driverProfile.licenseNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Rides:</span>
                  <span className="text-sm font-medium text-foreground">
                    {driverProfile.totalRides}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Rating:</span>
                  <span className="text-sm font-medium text-secondary">
                    {driverProfile.rating > 0 ? `⭐ ${driverProfile.rating.toFixed(1)}` : 'No ratings yet'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Earnings:</span>
                  <span className="text-sm font-medium text-primary">
                    ₹{driverProfile.totalEarnings}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
        <div className="bg-white/10 backdrop-blur-md border-2 border-[#FFD700]/30 rounded-xl p-6">
          <Skeleton className="h-6 w-48 bg-white/20 mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full bg-white/20" />
            <Skeleton className="h-20 w-full bg-white/20" />
            <Skeleton className="h-20 w-full bg-white/20" />
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
          <div className="bg-white/10 backdrop-blur-md border-2 border-[#FFD700] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#FFD700] mb-4">Admin Profile</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Name</p>
                <p className="font-medium text-white">{user.displayName || 'Admin'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="font-medium text-white">{user.email || 'No email'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Role</p>
                <p className="font-medium text-white">Administrator</p>
              </div>
            </div>
          </div>
        )}

        {!user.role && (
          <div className="bg-white/10 backdrop-blur-md border-2 border-[#FFD700] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#FFD700] mb-4">Basic Profile</h3>
            <UserProfile />
          </div>
        )}

        {user.role === UserRole.STUDENT && !studentProfile && (
          <Alert className="bg-[#FFD700]/10 border-[#FFD700]/30">
            <AlertCircle className="h-4 w-4 text-[#FFD700]" />
            <AlertDescription className="text-[#FFD700]">Student profile not found. Please contact support.</AlertDescription>
          </Alert>
        )}

        {user.role === UserRole.DRIVER && !driverProfile && (
          <Alert className="bg-[#FFD700]/10 border-[#FFD700]/30">
            <AlertCircle className="h-4 w-4 text-[#FFD700]" />
            <AlertDescription className="text-[#FFD700]">Driver profile not found. Please contact support.</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Sidebar - Quick Actions - 1 column */}
      <div className="space-y-6">
        {/* Account Actions */}
        <div className="bg-white/10 backdrop-blur-md border-2 border-[#FFD700] rounded-xl p-6">
          <h3 className="text-lg font-bold text-[#FFD700] mb-4">Account Actions</h3>
          <div className="space-y-3">
            <Link href="/change-password" className="block">
              <button className="w-full flex items-center gap-3 bg-[#009944] text-white py-3 px-4 rounded-lg font-bold uppercase tracking-wider shadow-[0px_4px_0px_0px_#006400] hover:shadow-[0px_2px_0px_0px_#006400] hover:translate-y-[2px] active:shadow-none active:translate-y-1 transition-all text-sm">
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
              className="w-full flex items-center justify-center gap-3 bg-[#1a1a1a] border-2 border-[#FFD700] text-white py-3 px-4 rounded-lg font-bold uppercase tracking-wider hover:bg-[#FFD700] hover:text-[#1a1a1a] transition-all text-sm disabled:opacity-50"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white/10 backdrop-blur-md border-2 border-[#FFD700]/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-[#FFD700] mb-4">Account Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Email verified:</span>
              <span className={`text-sm font-medium ${user.emailVerified ? 'text-[#009944]' : 'text-[#FFD700]'}`}>
                {user.emailVerified ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            {user.role && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Role:</span>
                <span className="text-sm font-medium capitalize text-white">
                  {user.role}
                </span>
              </div>
            )}
            {user.role === UserRole.STUDENT && studentProfile && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Student ID:</span>
                  <span className="text-sm font-medium text-white">
                    {studentProfile.studentId}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Rides:</span>
                  <span className="text-sm font-medium text-white">
                    {studentProfile.totalRides}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Wallet Balance:</span>
                  <span className="text-sm font-medium text-[#009944]">
                    ₹{studentProfile.walletBalance}
                  </span>
                </div>
              </>
            )}
            {user.role === UserRole.DRIVER && driverProfile && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">License:</span>
                  <span className="text-sm font-medium text-white">
                    {driverProfile.licenseNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Rides:</span>
                  <span className="text-sm font-medium text-white">
                    {driverProfile.totalRides}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Rating:</span>
                  <span className="text-sm font-medium text-[#FFD700]">
                    {driverProfile.rating > 0 ? `⭐ ${driverProfile.rating.toFixed(1)}` : 'No ratings yet'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Earnings:</span>
                  <span className="text-sm font-medium text-[#009944]">
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

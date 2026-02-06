/**
 * Profile Page - Role-based profile management
 * Displays user information and provides role-specific editing
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { UserRole } from '@/lib/types/user.types';
import ProfileContent from '@/components/auth/ProfileContent';
import { ProfileSkeleton } from '@/components/ui/skeletons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Manage your account settings and preferences',
};

export default async function ProfilePage() {
  // Server-side auth check
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/profile&message=Please sign in to view your profile');
  }

  // Determine back link based on role
  const getBackLink = () => {
    switch (user.role) {
      case UserRole.STUDENT:
        return '/student/dashboard';
      case UserRole.DRIVER:
        return '/driver/dashboard';
      case UserRole.ADMIN:
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-secondary">Profile</h1>
              <p className="text-foreground/70 text-sm md:text-base mt-1">
                Manage your account settings and preferences
              </p>
            </div>
            <Link href={getBackLink()}>
              <button className="flex items-center gap-2 bg-[#1a1a1a] border-2 border-[#FFD700] text-white py-2 px-4 rounded-lg font-bold hover:bg-[#FFD700] hover:text-[#1a1a1a] transition-all">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>

        {/* Profile Content - Role-based */}
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileContent user={user} />
        </Suspense>
      </div>
    </div>
  );
}

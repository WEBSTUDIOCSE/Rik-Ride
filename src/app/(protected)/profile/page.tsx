/**
 * Profile Page - Role-based profile management
 * Displays user information and provides role-specific editing
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { UserRole } from '@/lib/types/user.types';
import ProfileContent from '@/components/auth/ProfileContent';

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
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#FFD700]">Profile</h1>
              <p className="text-white/70 text-sm md:text-base mt-1">
                Manage your account settings and preferences
              </p>
            </div>
            <Link href={getBackLink()}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Profile Content - Role-based */}
        <ProfileContent user={user} />
      </div>
    </div>
  );
}

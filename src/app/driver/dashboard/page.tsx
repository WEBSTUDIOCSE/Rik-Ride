import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import DriverDashboard from '@/components/driver/DriverDashboard';
import { DashboardSkeleton } from '@/components/ui/skeletons';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Driver Dashboard - Rik-Ride',
  description: 'Manage your rides and earnings',
};

export default async function DriverDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<DashboardSkeleton />}>
        <DriverDashboard userUid={user.uid} userEmail={user.email || ''} userName={user.displayName || 'Driver'} />
      </Suspense>
    </div>
  );
}

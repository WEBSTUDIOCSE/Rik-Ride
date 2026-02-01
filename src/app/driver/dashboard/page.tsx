import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import DriverDashboard from '@/components/driver/DriverDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Driver Dashboard - Rik-Ride',
  description: 'Manage your rides and earnings',
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export default async function DriverDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Suspense fallback={<DashboardSkeleton />}>
        <DriverDashboard userUid={user.uid} userEmail={user.email || ''} userName={user.displayName || 'Driver'} />
      </Suspense>
    </div>
  );
}

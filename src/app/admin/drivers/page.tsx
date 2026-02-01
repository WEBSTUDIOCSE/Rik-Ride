import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth/server';
import { isAdminEmail } from '@/lib/types/user.types';
import { redirect } from 'next/navigation';
import DriverManagement from '@/components/admin/DriverManagement';
import { Skeleton } from '@/components/ui/skeleton';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manage Drivers - Rik-Ride Admin',
  description: 'View and manage driver accounts',
};

function ManagementSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default async function DriversPage() {
  const user = await getCurrentUser();

  // Redirect if not admin
  if (!user || !isAdminEmail(user.email || '')) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<ManagementSkeleton />}>
        <DriverManagement adminUid={user.uid} />
      </Suspense>
    </div>
  );
}

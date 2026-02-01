import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth/server';
import { isAdminEmail } from '@/lib/types/user.types';
import { redirect } from 'next/navigation';
import DriverVerificationList from '@/components/admin/DriverVerificationList';
import { Skeleton } from '@/components/ui/skeleton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify Drivers - Rik-Ride Admin',
  description: 'Review and verify driver registrations',
};

function VerificationSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-64" />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-48" />
      ))}
    </div>
  );
}

export default async function VerifyDriversPage() {
  const user = await getCurrentUser();

  if (!user || !user.email || !isAdminEmail(user.email)) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Suspense fallback={<VerificationSkeleton />}>
        <DriverVerificationList adminUid={user.uid} />
      </Suspense>
    </div>
  );
}

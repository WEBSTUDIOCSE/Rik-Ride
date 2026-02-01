import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth/server';
import { isAdminEmail } from '@/lib/types/user.types';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Rik-Ride',
  description: 'Manage drivers, students, and platform settings',
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user || !user.email || !isAdminEmail(user.email)) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Suspense fallback={<DashboardSkeleton />}>
        <AdminDashboard adminEmail={user.email} adminUid={user.uid} />
      </Suspense>
    </div>
  );
}

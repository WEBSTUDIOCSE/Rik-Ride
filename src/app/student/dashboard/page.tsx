import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import StudentDashboard from '@/components/student/StudentDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Dashboard - Rik-Ride',
  description: 'Book auto rickshaws for university commute',
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Suspense fallback={<DashboardSkeleton />}>
        <StudentDashboard userUid={user.uid} userEmail={user.email || ''} userName={user.displayName || 'Student'} />
      </Suspense>
    </div>
  );
}

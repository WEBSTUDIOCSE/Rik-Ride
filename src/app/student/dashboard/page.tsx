import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import StudentDashboard from '@/components/student/StudentDashboard';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Student Dashboard - Rik-Ride',
  description: 'Book auto rickshaws for university commute',
};

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] p-4 md:p-6">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/10 animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
        {/* Tab skeleton */}
        <div className="h-12 bg-white/10 rounded-lg animate-pulse" />
        {/* Content skeleton */}
        <div className="h-64 bg-white/10 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Suspense fallback={<DashboardSkeleton />}>
        <StudentDashboard userUid={user.uid} userEmail={user.email || ''} userName={user.displayName || 'Student'} />
      </Suspense>
    </div>
  );
}

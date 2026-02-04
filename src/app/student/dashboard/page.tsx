import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import StudentDashboard from '@/components/student/StudentDashboard';
import { DashboardSkeleton } from '@/components/ui/skeletons';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Student Dashboard - Rik-Ride',
  description: 'Book auto rickshaws for university commute',
};

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

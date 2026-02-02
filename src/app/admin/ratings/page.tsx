/**
 * Admin Ratings Page
 * View and manage all ratings and reports
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import { isAdminEmail } from '@/lib/types/user.types';
import AdminRatingManagement from '@/components/rating/AdminRatingManagement';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ratings & Reports - Admin',
  description: 'Manage user ratings and reports',
};

export default async function AdminRatingsPage() {
  const user = await getCurrentUser();

  if (!user || !user.email || !isAdminEmail(user.email)) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm" className="mb-2">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">Ratings & Reports</h1>
              <p className="text-muted-foreground mt-1">
                View all ratings and manage user reports
              </p>
            </div>
          </div>
        </div>

        {/* Rating Management */}
        <AdminRatingManagement adminId={user.uid} />
      </div>
    </div>
  );
}

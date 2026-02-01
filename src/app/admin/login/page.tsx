import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import { isAdminEmail } from '@/lib/types/user.types';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login - Rik-Ride',
  description: 'Admin login for Rik-Ride platform',
};

export default async function AdminLoginPage() {
  const user = await getCurrentUser();

  // If already logged in as admin, redirect to dashboard
  if (user && user.email && isAdminEmail(user.email)) {
    redirect('/admin/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <AdminLoginForm />
    </div>
  );
}

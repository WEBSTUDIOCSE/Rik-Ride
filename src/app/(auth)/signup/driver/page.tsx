import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import DriverSignupForm from '@/components/auth/DriverSignupForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Driver Signup - Rik-Ride',
  description: 'Register as a driver to offer rides to students',
};

export default async function DriverSignupPage() {
  const user = await getCurrentUser();

  // Redirect to profile if already logged in
  if (user) {
    redirect('/driver/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <DriverSignupForm />
    </div>
  );
}

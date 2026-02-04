import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import DriverSignupForm from '@/components/auth/DriverSignupForm';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Driver Signup - Rik-Ride',
  description: 'Register as a driver to offer rides to students',
};

export default async function DriverSignupPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/driver/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8 bg-[#1a1a1a]">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[#1a1a1a] overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[#FFD700] opacity-5 [clip-path:polygon(30%_0,_100%_0,_100%_100%,_0%_100%)]"></div>
      </div>
      <div className="relative z-10 w-full flex justify-center">
        <DriverSignupForm />
      </div>
    </div>
  );
}

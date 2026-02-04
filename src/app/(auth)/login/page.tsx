import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your account',
};

export default async function LoginPage() {
  // If already authenticated, redirect to profile
  const user = await getCurrentUser();

  if (user) {
    redirect('/profile');
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#009944] mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

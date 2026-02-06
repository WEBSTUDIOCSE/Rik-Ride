import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Change Password',
  description: 'Update your account password',
};

export default async function ChangePasswordPage() {
  // Server-side auth check
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/change-password&message=Please sign in to change password');
  }

  // Note: We can't check provider on server-side without full user data
  // The form component will handle Google user detection client-side

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 md:mb-8">
          <Link href="/profile">
            <button className="flex items-center gap-2 bg-background border-2 border-secondary text-foreground py-2 px-4 rounded-lg font-bold text-sm hover:bg-secondary hover:text-secondary-foreground transition-all">
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </button>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Password Badlo 🔐</h1>
        </div>

        <div className="flex justify-center px-0 md:px-4">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}

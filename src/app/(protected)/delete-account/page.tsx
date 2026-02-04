import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import DeleteAccountForm from '@/components/auth/DeleteAccountForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Delete Account',
  description: 'Permanently delete your account and all associated data',
};

export default async function DeleteAccountPage() {
  // Server-side auth check - no loading state needed!
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/delete-account&message=Please sign in to access account deletion');
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <Link href="/profile">
            <button className="flex items-center gap-2 bg-[#1a1a1a] border-2 border-[#FFD700] text-white py-2 px-4 rounded-lg font-bold text-sm hover:bg-[#FFD700] hover:text-[#1a1a1a] transition-all">
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </button>
          </Link>
        </div>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-xl md:text-2xl font-bold text-red-500">Account Delete Karo ⚠️</h1>
            <p className="text-gray-400 mt-2 text-sm md:text-base">
              Permanently remove your account and all associated data
            </p>
          </div>
          
          <DeleteAccountForm />
        </div>
      </div>
    </div>
  );
}

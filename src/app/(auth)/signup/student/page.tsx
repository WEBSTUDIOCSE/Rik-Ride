import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import StudentSignupForm from '@/components/auth/StudentSignupForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Signup - Rik-Ride',
  description: 'Create a student account to book auto rickshaws',
};

export default async function StudentSignupPage() {
  const user = await getCurrentUser();

  // Redirect to profile if already logged in
  if (user) {
    redirect('/student/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <StudentSignupForm />
    </div>
  );
}

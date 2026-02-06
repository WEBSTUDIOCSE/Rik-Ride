import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import StudentSignupForm from '@/components/auth/StudentSignupForm';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Student Signup - Rik-Ride',
  description: 'Create a student account to book auto rickshaws',
};

export default async function StudentSignupPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/student/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8 bg-background">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-background overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary opacity-5 [clip-path:polygon(30%_0,_100%_0,_100%_100%,_0%_100%)]"></div>
        <div className="absolute bottom-0 left-0 text-primary/5 text-[200px] leading-none select-none pointer-events-none hidden md:block">🎓</div>
      </div>
      <div className="relative z-10 w-full flex justify-center">
        <StudentSignupForm />
      </div>
    </div>
  );
}

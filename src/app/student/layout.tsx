import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student - Rik-Ride',
  description: 'Book auto rickshaws for university commute',
};

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <>{children}</>;
}

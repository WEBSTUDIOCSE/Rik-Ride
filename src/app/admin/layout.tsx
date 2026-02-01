import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import { isAdminEmail } from '@/lib/types/user.types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin - Rik-Ride',
  description: 'Admin dashboard for managing drivers and students',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Allow access to admin login without authentication
  return <>{children}</>;
}

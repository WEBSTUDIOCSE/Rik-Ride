import { redirect } from 'next/navigation';import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth/server';import { getCurrentUser } from '@/lib/auth/server';

import type { Metadata } from 'next';import type { Metadata } from 'next';



export const metadata: Metadata = {export const metadata: Metadata = {

  title: 'Authentication',  title: 'Authentication',

  description: 'Sign in or create an account',  description: 'Sign in or create an account',

};};



export default async function AuthLayout({export default async function AuthLayout({

  children,  children,

}: {}: {

  children: React.ReactNode;  children: React.ReactNode;

}) {}) {

  // Redirect to profile if already logged in  // Redirect to dashboard if already logged in

  const user = await getCurrentUser();  const user = await getCurrentUser();



  if (user) {  if (user) {

    redirect('/profile');    redirect('/dashboard');

  }  }



  return <>{children}</>;  return <>{children}</>;

}}


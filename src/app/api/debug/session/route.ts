/**
 * Debug Route: Check Current Session Data
 * Temporary route to see what's in the session cookie
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    return NextResponse.json({
      user,
      hasRole: !!user?.role,
      role: user?.role || 'NOT SET',
      uid: user?.uid || 'NOT SET',
    });
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

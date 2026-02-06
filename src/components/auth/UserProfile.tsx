'use client';

import { useAuth } from '@/contexts/AuthContext';
import { APIBook } from '@/lib/firebase/services';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogOut, Mail, User, Calendar, CheckCircle, AlertCircle, Settings, Trash2, Shield, Clock, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function UserProfile() {
  const { user } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError('');
    
    const result = await APIBook.auth.signOut();
    if (!result.success) {
      setLogoutError(result.error || 'Logout failed');
      setLoggingOut(false);
    }
  };

  if (!user) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isGoogleUser = user.providerData[0]?.providerId === 'google.com';

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-lg mx-auto">
        
        {logoutError && (
          <Alert variant="destructive" className="mb-4 bg-red-500/20 border-red-500">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{logoutError}</AlertDescription>
          </Alert>
        )}

        {/* Profile Header Card - Landing page style */}
        <div className="bg-muted/50 backdrop-blur-md border-2 border-secondary rounded-xl p-6 mb-4 shadow-2xl">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-secondary/30 shadow-lg">
              <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
              <AvatarFallback className="text-2xl bg-primary text-foreground font-bold">
                {user.displayName ? getInitials(user.displayName) : 
                 user.email ? getInitials(user.email) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">
                {user.displayName || 'Anonymous User'}
              </h1>
              <p className="text-muted-foreground text-sm truncate flex items-center gap-1 mt-1">
                <Mail className="h-3 w-3 flex-shrink-0" />
                {user.email}
              </p>
              <Badge 
                className={`mt-2 ${user.emailVerified 
                  ? 'bg-primary text-foreground border-rickshaw-green-dark' 
                  : 'bg-secondary/20 text-secondary border-secondary/30'}`}
              >
                {user.emailVerified ? (
                  <><CheckCircle className="mr-1 h-3 w-3" /> Verified ✓</>
                ) : (
                  <><AlertCircle className="mr-1 h-3 w-3" /> Unverified</>
                )}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Stats - Same card style */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/50 backdrop-blur-md border-2 border-secondary/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-secondary mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-bold">Joined</span>
            </div>
            <p className="text-foreground font-semibold text-sm">
              {formatDate(user.metadata.creationTime)}
            </p>
          </div>
          <div className="bg-muted/50 backdrop-blur-md border-2 border-secondary/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-secondary mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-bold">Last Login</span>
            </div>
            <p className="text-foreground font-semibold text-sm">
              {formatDate(user.metadata.lastSignInTime)}
            </p>
          </div>
        </div>

        {/* Account Details Card */}
        <div className="bg-muted/50 backdrop-blur-md border-2 border-secondary/30 rounded-xl p-4 mb-4">
          <h2 className="text-secondary font-bold mb-3 flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Account Details
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">User ID</span>
              <span className="text-foreground text-xs font-mono bg-background border border-border px-2 py-1 rounded max-w-[180px] truncate">
                {user.uid.slice(0, 12)}...
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Provider</span>
              <Badge className="bg-background text-foreground border border-border">
                {isGoogleUser ? '🔗 Google' : '📧 Email'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-muted/50 backdrop-blur-md border-2 border-secondary/30 rounded-xl p-4 mb-4">
          <h2 className="text-secondary font-bold mb-3 flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Security
          </h2>

          {!user.emailVerified && !isGoogleUser && (
            <Alert className="mb-3 bg-secondary/10 border-secondary/30">
              <AlertCircle className="h-4 w-4 text-secondary" />
              <AlertDescription className="text-secondary text-sm">
                Email verify karo account secure karne ke liye! 📧
              </AlertDescription>
            </Alert>
          )}

          {!isGoogleUser && (
            <Link href="/change-password">
              <button className="w-full flex items-center justify-between bg-primary text-foreground py-3 px-4 rounded-lg font-bold uppercase tracking-wider shadow-[0px_4px_0px_0px_var(--rickshaw-green-dark)] hover:shadow-[0px_2px_0px_0px_var(--rickshaw-green-dark)] hover:translate-y-[2px] active:shadow-none active:translate-y-1 transition-all">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5" />
                  <span className="text-sm">Password Badlo</span>
                </div>
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
          )}
        </div>

        {/* Logout Button - Landing page style */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 bg-background border-2 border-secondary text-foreground py-4 px-4 rounded-xl font-bold uppercase tracking-wider hover:bg-secondary hover:text-foreground transition-all mb-4 disabled:opacity-50"
        >
          <LogOut className="h-5 w-5" />
          <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
        </button>

        {/* Danger Zone */}
        <div className="bg-red-500/10 backdrop-blur-md border-2 border-red-500/50 rounded-xl p-4">
          <h2 className="text-red-400 font-bold mb-2 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Danger Zone ⚠️
          </h2>
          <p className="text-muted-foreground text-xs mb-3">
            Account delete karna permanent hai. Sab data hamesha ke liye chala jayega!
          </p>
          <Link href="/delete-account">
            <button className="w-full flex items-center justify-center gap-2 bg-red-500 text-foreground py-3 px-4 rounded-lg font-bold uppercase tracking-wider shadow-[0px_4px_0px_0px_#991b1b] hover:shadow-[0px_2px_0px_0px_#991b1b] hover:translate-y-[2px] active:shadow-none active:translate-y-1 transition-all">
              <Trash2 className="h-4 w-4" />
              <span className="text-sm">Account Delete Karo</span>
            </button>
          </Link>
        </div>

        {/* Footer Tagline */}
        <p className="text-center text-muted-foreground text-xs mt-6 font-bold">
          🛺 RIK<span className="text-secondary">RIDE</span> - Baith Ja Chill Kar!
        </p>
      </div>
    </div>
  );
}

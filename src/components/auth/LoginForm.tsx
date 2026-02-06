'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { APIBook } from '@/lib/firebase/services';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import PasswordInput from '@/components/ui/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Mail, AlertCircle, CheckCircle, Car } from 'lucide-react';
import Link from 'next/link';

export default function LoginForm() {
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  // Check for success/info messages from URL params
  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setSuccessMessage(message);
      // Clear the URL params after showing the message
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  // Note: Page already handles server-side redirect if authenticated
  // This is just a client-side optimization to avoid form render
  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/profile';
      router.push(redirect);
    }
  }, [isAuthenticated, router, searchParams]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setEmailLoading(true);
    setError('');

    const result = await APIBook.auth.loginWithEmail(data.email, data.password);
    
    if (result.success) {
      // Redirect to original page or profile
      const redirect = searchParams.get('redirect') || '/profile';
      router.push(redirect);
    } else {
      setError(result.error || 'Login failed');
    }
    
    setEmailLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');

    const result = await APIBook.auth.loginWithGoogle();
    
    if (result.success) {
      // Redirect to original page or profile
      const redirect = searchParams.get('redirect') || '/profile';
      router.push(redirect);
    } else {
      setError(result.error || 'Google login failed');
    }
    
    setGoogleLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-background overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary opacity-5 [clip-path:polygon(30%_0,_100%_0,_100%_100%,_0%_100%)]"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-stretch md:gap-0">
          
          {/* Left Side - Branding (Desktop Only) */}
          <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-secondary to-amber-500 rounded-l-2xl p-10 flex-col justify-between">
            <div>
              <Link href="/" className="inline-flex items-center gap-2">
                <Car className="h-10 w-10 text-foreground" />
                <span className="text-3xl font-bold italic tracking-wider text-foreground">
                  RIKRIDE
                </span>
              </Link>
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-foreground text-4xl font-bold leading-tight">
                  Baith Ja
                  <br />
                  <span className="text-5xl italic">Chill Kar! 🛺</span>
                </p>
              </div>
              <p className="text-foreground/80 text-lg font-medium">
                Na Meter Ki Tension, Na Bargaining Ka Scene.
              </p>
              <div className="flex items-center gap-4 pt-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">1000+</p>
                  <p className="text-sm text-foreground/70">Students</p>
                </div>
                <div className="w-px h-12 bg-background/30"></div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">50+</p>
                  <p className="text-sm text-foreground/70">Drivers</p>
                </div>
                <div className="w-px h-12 bg-background/30"></div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">⭐ 4.8</p>
                  <p className="text-sm text-foreground/70">Rating</p>
                </div>
              </div>
            </div>
            
            <p className="text-foreground/60 text-sm">
              &quot;College jaana ho ya ghar, ab sab easy hai yaar!&quot;
            </p>
          </div>

          {/* Right Side - Form */}
          <div className="w-full md:w-1/2 bg-muted/50 backdrop-blur-md border-2 border-secondary md:border-l-0 rounded-2xl md:rounded-l-none md:rounded-r-2xl p-6 md:p-10">
            
            {/* Mobile Logo */}
            <div className="text-center mb-4 md:hidden">
              <Link href="/" className="inline-flex items-center gap-2">
                <Car className="h-8 w-8 text-secondary" />
                <span className="text-2xl font-bold italic tracking-wider text-foreground">
                  RIK<span className="text-secondary">RIDE</span>
                </span>
              </Link>
              <p className="text-foreground text-lg font-bold mt-3">Baith Ja, <span className="text-secondary">Chill Kar!</span></p>
              <p className="text-muted-foreground text-xs mt-1">Na Meter, Na Drama 🛺</p>
            </div>

            <div className="text-center md:text-left mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">Wapas Aaye? 👋</h1>
              <p className="text-muted-foreground text-sm">Apna account login karo aur chal pado!</p>
            </div>

            {successMessage && (
              <Alert className="mb-4 bg-green-500/20 border-green-500 text-green-400">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
            
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-500/20 border-red-500">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground text-sm">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="apna email daalo"
                          className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-secondary focus:ring-ring/20 h-12 text-base"
                          {...field}
                          id="login-email"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground text-sm">Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="secret password 🤫"
                          className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-secondary focus:ring-ring/20 h-12 text-base"
                          id="login-password"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <button
                  type="submit"
                  disabled={emailLoading}
                  className="w-full bg-primary text-foreground py-3 md:py-4 text-base md:text-lg font-bold uppercase tracking-wider rounded-lg hover:bg-primary/80 transition-all shadow-[0px_4px_0px_0px_var(--rickshaw-green-dark)] active:shadow-[0px_2px_0px_0px_var(--rickshaw-green-dark)] active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {emailLoading ? 'Ruko zara...' : 'Chalo Login Karo →'}
                </button>
              </form>
            </Form>

            <div className="mt-3 text-center">
              <Link 
                href="/forgot-password" 
                className="text-secondary hover:underline text-sm font-medium"
              >
                Password bhool gaye? 🤔
              </Link>
            </div>

            <div className="mt-5">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-transparent text-muted-foreground">ya fir</span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-card text-foreground py-3 font-bold rounded-lg hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {googleLoading ? 'Ruko...' : 'Google se Login'}
              </button>
            </div>

            <div className="mt-6 text-center text-muted-foreground text-sm">
              Naya hai idhar?{' '}
              <Link href="/signup" className="text-secondary font-bold hover:underline">
                Account banao
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom tagline for mobile */}
        <p className="text-center text-muted-foreground text-xs mt-6 md:hidden">
          🛺 Tera Campus. Teri Ride. Tere Rules.
        </p>
      </div>
    </div>
  );
}

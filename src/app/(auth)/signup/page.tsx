import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import Link from 'next/link';
import { GraduationCap, Car, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign Up - Rik-Ride',
  description: 'Create a new account as student or driver',
};

export default async function SignupPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/profile');
  }

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
                <Car className="h-10 w-10 text-secondary-foreground" />
                <span className="text-3xl font-bold italic tracking-wider text-secondary-foreground">
                  RIKRIDE
                </span>
              </Link>
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-secondary-foreground text-4xl font-bold leading-tight">
                  Gang Mein
                  <br />
                  <span className="text-5xl italic">Shaamil Ho! 🚀</span>
                </p>
              </div>
              <p className="text-secondary-foreground/80 text-lg font-medium">
                Student ho ya Driver, yahan sab ke liye jagah hai!
              </p>
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎓</span>
                  <p className="text-secondary-foreground/80">Students: Auto book karo, tension chodo</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🛺</span>
                  <p className="text-secondary-foreground/80">Drivers: Paisa kamao, apni marzi se</p>
                </div>
              </div>
            </div>
            
            <p className="text-secondary-foreground/60 text-sm">
              &quot;Ek baar try karo, fir daily use karoge!&quot;
            </p>
          </div>

          {/* Right Side - Role Selection */}
          <div className="w-full md:w-1/2 bg-card backdrop-blur-md border-2 border-secondary md:border-l-0 rounded-2xl md:rounded-l-none md:rounded-r-2xl p-6 md:p-10">
            
            {/* Mobile Logo */}
            <div className="text-center mb-4 md:hidden">
              <Link href="/" className="inline-flex items-center gap-2">
                <Car className="h-8 w-8 text-secondary" />
                <span className="text-2xl font-bold italic tracking-wider text-foreground">
                  RIK<span className="text-secondary">RIDE</span>
                </span>
              </Link>
              <p className="text-foreground text-lg font-bold mt-3">Gang Mein <span className="text-secondary">Shaamil Ho!</span></p>
              <p className="text-muted-foreground text-xs mt-1">Apna Side Choose Karo 🚀</p>
            </div>

            <div className="text-center md:text-left mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">Account Banao �</h1>
              <p className="text-muted-foreground text-sm">Tu kaun hai, bata de!</p>
            </div>

            <div className="space-y-4">
              {/* Student Option */}
              <Link href="/signup/student" className="block">
                <div className="p-5 md:p-6 bg-primary/20 border-2 border-primary rounded-xl hover:bg-primary/30 transition-all cursor-pointer group active:scale-[0.98]">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary group-hover:scale-110 transition-transform shrink-0">
                      <GraduationCap className="h-6 w-6 md:h-8 md:w-8 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base md:text-lg text-foreground">Main Student Hoon 📚</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Bus ka chakkar chodo, auto se jao!
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                </div>
              </Link>

              {/* Driver Option */}
              <Link href="/signup/driver" className="block">
                <div className="p-5 md:p-6 bg-secondary/10 border-2 border-secondary rounded-xl hover:bg-secondary/20 transition-all cursor-pointer group active:scale-[0.98]">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-secondary group-hover:scale-110 transition-transform shrink-0">
                      <Car className="h-6 w-6 md:h-8 md:w-8 text-secondary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base md:text-lg text-foreground">Main Driver Hoon 🛺</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Seedha paisa, seedha kaam!
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground group-hover:text-secondary group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                </div>
              </Link>
            </div>

            <div className="mt-6 text-center text-muted-foreground text-sm">
              Pehle se account hai?{' '}
              <Link href="/login" className="text-secondary font-bold hover:underline">
                Login karo
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom tagline for mobile */}
        <p className="text-center text-muted-foreground text-xs mt-6 md:hidden">
          🛺 Na Meter. Na Drama. Sirf Ride.
        </p>
      </div>
    </div>
  );
}

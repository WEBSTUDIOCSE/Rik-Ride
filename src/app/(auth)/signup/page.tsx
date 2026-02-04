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
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#1a1a1a]">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[#1a1a1a] overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[#FFD700] opacity-5 [clip-path:polygon(30%_0,_100%_0,_100%_100%,_0%_100%)]"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-stretch md:gap-0">
          
          {/* Left Side - Branding (Desktop Only) */}
          <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-l-2xl p-10 flex-col justify-between">
            <div>
              <Link href="/" className="inline-flex items-center gap-2">
                <Car className="h-10 w-10 text-[#1a1a1a]" />
                <span className="text-3xl font-bold italic tracking-wider text-[#1a1a1a]">
                  RIKRIDE
                </span>
              </Link>
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-[#1a1a1a] text-4xl font-bold leading-tight">
                  Gang Mein
                  <br />
                  <span className="text-5xl italic">Shaamil Ho! 🚀</span>
                </p>
              </div>
              <p className="text-[#1a1a1a]/80 text-lg font-medium">
                Student ho ya Driver, yahan sab ke liye jagah hai!
              </p>
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎓</span>
                  <p className="text-[#1a1a1a]/80">Students: Auto book karo, tension chodo</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🛺</span>
                  <p className="text-[#1a1a1a]/80">Drivers: Paisa kamao, apni marzi se</p>
                </div>
              </div>
            </div>
            
            <p className="text-[#1a1a1a]/60 text-sm">
              &quot;Ek baar try karo, fir daily use karoge!&quot;
            </p>
          </div>

          {/* Right Side - Role Selection */}
          <div className="w-full md:w-1/2 bg-white/10 backdrop-blur-md border-2 border-[#FFD700] md:border-l-0 rounded-2xl md:rounded-l-none md:rounded-r-2xl p-6 md:p-10">
            
            {/* Mobile Logo */}
            <div className="text-center mb-4 md:hidden">
              <Link href="/" className="inline-flex items-center gap-2">
                <Car className="h-8 w-8 text-[#FFD700]" />
                <span className="text-2xl font-bold italic tracking-wider text-white">
                  RIK<span className="text-[#FFD700]">RIDE</span>
                </span>
              </Link>
              <p className="text-white text-lg font-bold mt-3">Gang Mein <span className="text-[#FFD700]">Shaamil Ho!</span></p>
              <p className="text-gray-500 text-xs mt-1">Apna Side Choose Karo 🚀</p>
            </div>

            <div className="text-center md:text-left mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Account Banao �</h1>
              <p className="text-gray-400 text-sm">Tu kaun hai, bata de!</p>
            </div>

            <div className="space-y-4">
              {/* Student Option */}
              <Link href="/signup/student" className="block">
                <div className="p-5 md:p-6 bg-[#009944]/20 border-2 border-[#009944] rounded-xl hover:bg-[#009944]/30 transition-all cursor-pointer group active:scale-[0.98]">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-[#009944] group-hover:scale-110 transition-transform shrink-0">
                      <GraduationCap className="h-6 w-6 md:h-8 md:w-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base md:text-lg text-white">Main Student Hoon 📚</h3>
                      <p className="text-xs md:text-sm text-gray-400">
                        Bus ka chakkar chodo, auto se jao!
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 md:h-6 md:w-6 text-gray-500 group-hover:text-[#009944] group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                </div>
              </Link>

              {/* Driver Option */}
              <Link href="/signup/driver" className="block">
                <div className="p-5 md:p-6 bg-[#FFD700]/10 border-2 border-[#FFD700] rounded-xl hover:bg-[#FFD700]/20 transition-all cursor-pointer group active:scale-[0.98]">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-[#FFD700] group-hover:scale-110 transition-transform shrink-0">
                      <Car className="h-6 w-6 md:h-8 md:w-8 text-[#1a1a1a]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base md:text-lg text-white">Main Driver Hoon 🛺</h3>
                      <p className="text-xs md:text-sm text-gray-400">
                        Seedha paisa, seedha kaam!
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 md:h-6 md:w-6 text-gray-500 group-hover:text-[#FFD700] group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                </div>
              </Link>
            </div>

            <div className="mt-6 text-center text-gray-400 text-sm">
              Pehle se account hai?{' '}
              <Link href="/login" className="text-[#FFD700] font-bold hover:underline">
                Login karo
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom tagline for mobile */}
        <p className="text-center text-gray-600 text-xs mt-6 md:hidden">
          🛺 Na Meter. Na Drama. Sirf Ride.
        </p>
      </div>
    </div>
  );
}

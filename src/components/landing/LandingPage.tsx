'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Car,
  GraduationCap,
  Shield,
  MapPin,
  Star,
  Phone,
  Menu,
  X,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { ThemeToggle } from '@/components/theme';

export function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const redirectUser = async () => {
      if (!loading && user) {
        try {
          const adminDoc = await getDoc(doc(db, COLLECTIONS.ADMINS, user.uid));
          if (adminDoc.exists()) {
            router.push('/admin/dashboard');
            return;
          }

          const studentDoc = await getDoc(doc(db, COLLECTIONS.STUDENTS, user.uid));
          if (studentDoc.exists()) {
            router.push('/student/dashboard');
            return;
          }

          const driverDoc = await getDoc(doc(db, COLLECTIONS.DRIVERS, user.uid));
          if (driverDoc.exists()) {
            router.push('/driver/dashboard');
            return;
          }
        } catch (error) {
          console.error('Error checking user role:', error);
        }
      }
    };

    redirectUser();
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground overflow-x-hidden">
      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-6 py-4 bg-background border-b-4 border-secondary sticky top-0 z-50">
        <Link href="/" className="text-3xl font-bold italic tracking-wider">
          RIK<span className="text-secondary">RIDE</span>
        </Link>

        <div className="hidden md:flex space-x-8 items-center font-bold">
          <Link href="#features" className="hover:text-secondary transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="hover:text-secondary transition-colors">
            How It Works
          </Link>
          <Link href="#safety" className="hover:text-secondary transition-colors">
            Safety
          </Link>
          <ThemeToggle />
          <Link 
            href="/login" 
            className="bg-primary text-primary-foreground px-5 py-2 rounded shadow-md hover:shadow-none hover:translate-y-1 transition-all"
          >
            Login
          </Link>
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b-4 border-secondary p-6 space-y-4">
          <Link 
            href="#features" 
            className="block font-bold hover:text-secondary"
            onClick={() => setMobileMenuOpen(false)}
          >
            Features
          </Link>
          <Link 
            href="#how-it-works" 
            className="block font-bold hover:text-secondary"
            onClick={() => setMobileMenuOpen(false)}
          >
            How It Works
          </Link>
          <Link 
            href="#safety" 
            className="block font-bold hover:text-secondary"
            onClick={() => setMobileMenuOpen(false)}
          >
            Safety
          </Link>
          <div className="flex gap-3 pt-4">
            <Link 
              href="/login" 
              className="flex-1 bg-primary text-primary-foreground text-center py-3 rounded font-bold"
            >
              Login
            </Link>
            <Link 
              href="/signup" 
              className="flex-1 bg-secondary text-secondary-foreground text-center py-3 rounded font-bold"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <header className="relative min-h-[90vh] flex flex-col-reverse md:flex-row items-center justify-between px-6 md:px-16 pt-12 md:pt-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-secondary -z-10 md:[clip-path:polygon(25%_0,_100%_0,_100%_100%,_0%_100%)] [clip-path:polygon(0_20%,_100%_0,_100%_100%,_0%_100%)]"></div>

        <div className="w-full md:w-1/2 z-10 mt-10 md:mt-0">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-none mb-6 drop-shadow-lg">
            NO WAITING.
            <br />
            <span className="text-secondary md:text-primary tracking-widest">
              JUST RIDING.
            </span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-lg">
            Book the fastest auto in campus. Our drivers know every shortcut, every gali, and every corner.
          </p>

          <div className="bg-muted/50 backdrop-blur-md border-2 border-secondary p-6 rounded-xl max-w-md shadow-2xl">
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-secondary font-bold text-lg">Choose Your Role</p>
              </div>
              
              <Link 
                href="/signup/student"
                className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 text-xl font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all shadow-[0px_6px_0px_0px_var(--rickshaw-green-dark)] active:shadow-[0px_2px_0px_0px_var(--rickshaw-green-dark)] active:translate-y-1"
              >
                <GraduationCap className="h-6 w-6" />
                I am a Student
              </Link>
              
              <Link 
                href="/signup/driver"
                className="w-full flex items-center justify-center gap-3 bg-background border-2 border-secondary py-4 text-xl font-bold uppercase tracking-wider rounded hover:bg-secondary hover:text-secondary-foreground transition-all"
              >
                <Car className="h-6 w-6" />
                I am a Driver
              </Link>
              
              <p className="text-center text-muted-foreground text-sm">
                Already registered?{' '}
                <Link href="/login" className="text-secondary hover:underline font-bold">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex justify-center md:justify-end relative z-10 mb-8 md:mb-0">
          <div className="w-3/4 md:w-full max-w-lg">
            <img 
              src="/image.png" 
              alt="Rik-Ride Auto Rickshaw" 
              className="w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </header>

      {/* FEATURES SECTION */}
      <section id="features" className="bg-primary py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-primary-foreground">
            WHY CHOOSE <span className="text-secondary">RIK-RIDE</span>?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              emoji="⚡"
              title="Super Fast"
              description="We weave through traffic like water. If you are late, it is on you."
              borderColor="border-secondary"
            />
            <FeatureCard
              emoji="💰"
              title="Fixed Rates"
              description="No bargaining. No excuses. Fair prices every single time."
              borderColor="border-foreground"
            />
            <FeatureCard
              emoji="😎"
              title="Pro Drivers"
              description="Our pilots are legends of the street. Safe, swag, and fully verified."
              borderColor="border-secondary"
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="bg-background py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            HOW IT <span className="text-secondary">WORKS</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                  <GraduationCap className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-3xl font-bold">For Students</h3>
              </div>

              <StepItem number={1} title="Sign Up" color="green">
                Create account with your university email
              </StepItem>
              <StepItem number={2} title="Set Emergency Contacts" color="green">
                Add parent or guardian phone for safety
              </StepItem>
              <StepItem number={3} title="Book a Ride" color="green">
                Enter pickup and drop, select a driver
              </StepItem>
              <StepItem number={4} title="Track and Pay" color="green">
                Track in real-time, pay cash or UPI
              </StepItem>

              <Link 
                href="/signup/student"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 text-lg font-bold uppercase rounded shadow-[0px_4px_0px_0px_var(--rickshaw-green-dark)] hover:shadow-none hover:translate-y-1 transition-all"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
                  <Car className="h-8 w-8 text-secondary-foreground" />
                </div>
                <h3 className="text-3xl font-bold">For Drivers</h3>
              </div>

              <StepItem number={1} title="Register and Submit Docs" color="yellow">
                Upload license, RC, and vehicle photos
              </StepItem>
              <StepItem number={2} title="Wait for Verification" color="yellow">
                Admin reviews and approves your profile
              </StepItem>
              <StepItem number={3} title="Go Online" color="yellow">
                Toggle online when ready for rides
              </StepItem>
              <StepItem number={4} title="Earn Money" color="yellow">
                Accept bookings and get paid instantly
              </StepItem>

              <Link 
                href="/signup/driver"
                className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-8 py-4 text-lg font-bold uppercase rounded shadow-[0px_4px_0px_0px_#B8860B] hover:shadow-none hover:translate-y-1 transition-all"
              >
                Register as Driver
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SAFETY SECTION */}
      <section id="safety" className="bg-card text-card-foreground py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            YOUR <span className="text-primary">SAFETY</span> IS OUR PRIORITY
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Multiple layers of safety features to ensure secure rides
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SafetyCard
              icon={<Shield className="h-10 w-10 text-primary" />}
              title="Verified Drivers"
              description="Document verification by admin before activation"
            />
            <SafetyCard
              icon={<Phone className="h-10 w-10 text-red-500" />}
              title="SOS Button"
              description="One-tap emergency alert to all contacts"
            />
            <SafetyCard
              icon={<MapPin className="h-10 w-10 text-primary" />}
              title="Live Tracking"
              description="Share ride location with family via WhatsApp"
            />
            <SafetyCard
              icon={<Star className="h-10 w-10 text-secondary" />}
              title="Driver Ratings"
              description="Check ratings before confirming booking"
            />
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="bg-secondary py-24 text-center px-4">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-secondary-foreground mb-8 uppercase">
          Ready to ride with the Boss?
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/signup/student"
            className="bg-background text-foreground text-xl md:text-2xl font-bold px-10 py-5 rounded-full hover:scale-110 transition-transform shadow-xl"
          >
            Join as Student
          </Link>
          <Link 
            href="/signup/driver"
            className="bg-primary text-primary-foreground text-xl md:text-2xl font-bold px-10 py-5 rounded-full hover:scale-110 transition-transform shadow-xl"
          >
            Join as Driver
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-background py-12 px-6 border-t-4 border-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <Link href="/" className="text-2xl font-bold italic tracking-wider">
                RIK<span className="text-secondary">RIDE</span>
              </Link>
              <p className="text-muted-foreground text-sm">
                Safe and reliable auto rickshaw booking for university students.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-secondary mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/signup/student" className="hover:text-foreground transition-colors">Student Sign Up</Link></li>
                <li><Link href="/signup/driver" className="hover:text-foreground transition-colors">Driver Registration</Link></li>
                <li><Link href="/login" className="hover:text-foreground transition-colors">Login</Link></li>
                <li><Link href="/forgot-password" className="hover:text-foreground transition-colors">Reset Password</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-secondary mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
                <li><Link href="#safety" className="hover:text-foreground transition-colors">Safety Features</Link></li>
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-secondary mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>GIT India University</li>
                <li>support@rik-ride.in</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">
              2026 Rik-Ride Pvt Ltd. Made with love and Masala Chai.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  emoji, 
  title, 
  description, 
  borderColor 
}: { 
  emoji: string; 
  title: string; 
  description: string; 
  borderColor: string;
}) {
  return (
    <div className={`bg-card text-card-foreground p-8 border-b-8 ${borderColor} shadow-xl transform hover:-translate-y-2 transition-transform`}>
      <div className="text-5xl mb-4">{emoji}</div>
      <h3 className="text-2xl md:text-3xl font-bold mb-2">{title}</h3>
      <p className="font-bold text-muted-foreground">{description}</p>
    </div>
  );
}

function StepItem({ 
  number, 
  title, 
  children, 
  color = 'green' 
}: { 
  number: number; 
  title: string; 
  children: React.ReactNode;
  color?: 'green' | 'yellow';
}) {
  const bgColor = color === 'yellow' ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground';
  
  return (
    <div className="flex gap-4 items-start">
      <div className={`h-10 w-10 rounded-full ${bgColor} flex items-center justify-center text-lg font-bold shrink-0`}>
        {number}
      </div>
      <div>
        <h4 className="font-bold text-lg text-foreground">{title}</h4>
        <p className="text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}

function SafetyCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="text-center p-8 bg-muted rounded-xl border-2 border-border hover:border-primary transition-colors">
      <div className="inline-flex items-center justify-center mb-4">
        {icon}
      </div>
      <h4 className="font-bold text-xl mb-2">{title}</h4>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

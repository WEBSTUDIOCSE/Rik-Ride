'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Car,
  GraduationCap,
  Shield,
  MapPin,
  Star,
  Phone,
  Clock,
  QrCode,
  AlertTriangle,
  Menu,
  X,
  LogIn,
  UserPlus,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { UserRole } from '@/lib/types/user.types';

export function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    const redirectUser = async () => {
      if (!loading && user) {
        setCheckingRole(true);
        try {
          console.log('Checking role for user:', user.uid, user.email);
          
          // Check admin collection first (priority order)
          const adminDoc = await getDoc(doc(db, COLLECTIONS.ADMINS, user.uid));
          console.log('Admin doc exists:', adminDoc.exists());
          if (adminDoc.exists()) {
            console.log('Redirecting to admin dashboard');
            router.push('/admin/dashboard');
            return;
          }

          // Check student collection
          const studentDoc = await getDoc(doc(db, COLLECTIONS.STUDENTS, user.uid));
          console.log('Student doc exists:', studentDoc.exists());
          if (studentDoc.exists()) {
            console.log('Redirecting to student dashboard');
            router.push('/student/dashboard');
            return;
          }

          // Check driver collection
          const driverDoc = await getDoc(doc(db, COLLECTIONS.DRIVERS, user.uid));
          console.log('Driver doc exists:', driverDoc.exists());
          if (driverDoc.exists()) {
            console.log('Redirecting to driver dashboard');
            router.push('/driver/dashboard');
            return;
          }

          console.log('No role found for user');
        } catch (error) {
          console.error('Error checking user role:', error);
        } finally {
          setCheckingRole(false);
        }
      }
    };

    redirectUser();
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is logged in, show loading while redirecting
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      {/* Header/Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Car className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold font-heading">Rik-Ride</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link href="#safety" className="text-sm font-medium hover:text-primary transition-colors">
              Safety
            </Link>
            <Link href="#contact" className="text-sm font-medium hover:text-primary transition-colors">
              Contact
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Link>
            </Button>
            <Button asChild>
              <Link href="/signup">
                <UserPlus className="h-4 w-4 mr-2" />
                Sign Up
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background p-4 space-y-4">
            <nav className="flex flex-col gap-3">
              <Link 
                href="#features" 
                className="text-sm font-medium hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="#how-it-works" 
                className="text-sm font-medium hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link 
                href="#safety" 
                className="text-sm font-medium hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Safety
              </Link>
              <Link 
                href="#contact" 
                className="text-sm font-medium hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
            </nav>
            <Separator />
            <div className="flex flex-col gap-2">
              <Button variant="outline" asChild className="w-full">
                <Link href="/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/signup">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Sign Up
                </Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="mx-auto max-w-7xl flex flex-col items-center text-center space-y-8">
          <Badge variant="secondary" className="px-4 py-1">
            🎓 For University Students & Auto Drivers
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold font-heading tracking-tight max-w-4xl">
            Your Campus Ride,
            <span className="text-primary"> Just a Tap Away</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            Connect with verified auto rickshaw drivers for safe, reliable, and affordable 
            transportation to and from your university.
          </p>

          {/* CTA Buttons - Main User Choice */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Button size="lg" className="flex-1 h-14 text-lg" asChild>
              <Link href="/signup/student">
                <GraduationCap className="h-5 w-5 mr-2" />
                I'm a Student
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="flex-1 h-14 text-lg" asChild>
              <Link href="/signup/driver">
                <Car className="h-5 w-5 mr-2" />
                I'm a Driver
              </Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Login here
            </Link>
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-muted/30">
        <div className="mx-auto max-w-7xl text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
            Why Choose Rik-Ride?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built specifically for university students and local auto drivers
          </p>
        </div>

        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature Cards */}
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Verified Drivers</CardTitle>
              <CardDescription>
                All drivers are verified by admin with documents check before they can accept rides
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Live Tracking</CardTitle>
              <CardDescription>
                Track your ride in real-time with Google Maps integration and ETA updates
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Star className="h-10 w-10 text-yellow-500 mb-2" />
              <CardTitle>Ratings & Reviews</CardTitle>
              <CardDescription>
                Rate your driver after every ride. See ratings before booking for peace of mind
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <QrCode className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Easy Payment</CardTitle>
              <CardDescription>
                Pay with cash or scan driver's UPI QR code. No complicated wallet system
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <AlertTriangle className="h-10 w-10 text-red-500 mb-2" />
              <CardTitle>Emergency SOS</CardTitle>
              <CardDescription>
                One-tap SOS button to alert your emergency contacts with live location
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Quick Booking</CardTitle>
              <CardDescription>
                Book a ride in seconds. No surge pricing, transparent fares
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="mx-auto max-w-7xl text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
            How It Works
          </h2>
        </div>

        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* For Students */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">For Students</h3>
            </div>

            <div className="space-y-4">
              <StepItem number={1} title="Sign Up">
                Create account with your university email
              </StepItem>
              <StepItem number={2} title="Set Emergency Contacts">
                Add parent/guardian phone for safety
              </StepItem>
              <StepItem number={3} title="Book a Ride">
                Enter pickup & drop location, select a driver
              </StepItem>
              <StepItem number={4} title="Track & Pay">
                Track ride in real-time, pay cash or UPI at drop
              </StepItem>
              <StepItem number={5} title="Rate Driver">
                Share your experience to help other students
              </StepItem>
            </div>

            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/signup/student">
                Get Started as Student
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* For Drivers */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Car className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold">For Drivers</h3>
            </div>

            <div className="space-y-4">
              <StepItem number={1} title="Register & Submit Documents" variant="driver">
                Upload license, RC, and vehicle photos
              </StepItem>
              <StepItem number={2} title="Wait for Verification" variant="driver">
                Admin reviews and approves your profile
              </StepItem>
              <StepItem number={3} title="Go Online" variant="driver">
                Toggle online when ready to accept rides
              </StepItem>
              <StepItem number={4} title="Accept Bookings" variant="driver">
                Get ride requests from nearby students
              </StepItem>
              <StepItem number={5} title="Upload UPI QR (Optional)" variant="driver">
                Let students pay via GPay/PhonePe
              </StepItem>
            </div>

            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="/signup/driver">
                Register as Driver
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section id="safety" className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-muted/30">
        <div className="mx-auto max-w-7xl text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
            Your Safety is Our Priority
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Multiple layers of safety features to ensure secure rides
          </p>
        </div>

        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SafetyCard
            icon={<Shield className="h-8 w-8 text-primary" />}
            title="Verified Drivers"
            description="Document verification by admin before activation"
          />
          <SafetyCard
            icon={<Phone className="h-8 w-8 text-red-500" />}
            title="SOS Button"
            description="One-tap emergency alert to all contacts"
          />
          <SafetyCard
            icon={<MapPin className="h-8 w-8 text-green-600" />}
            title="Share Ride"
            description="Send live tracking link to family via WhatsApp"
          />
          <SafetyCard
            icon={<Star className="h-8 w-8 text-yellow-500" />}
            title="Driver Ratings"
            description="Check driver ratings before confirming booking"
          />
        </div>
      </section>

      {/* Quick Login Section for Returning Users */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="mx-auto max-w-7xl">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Already Registered?</CardTitle>
              <CardDescription>
                Login to access your dashboard and book rides
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/login">
                    <LogIn className="h-5 w-5 mr-2" />
                    Login to Your Account
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/forgot-password">
                    Forgot Password?
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact/Footer Section */}
      <footer id="contact" className="w-full border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2">
                <Car className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold font-heading">Rik-Ride</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Safe and reliable auto rickshaw booking for university students.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/signup/student" className="hover:text-primary">Student Sign Up</Link></li>
                <li><Link href="/signup/driver" className="hover:text-primary">Driver Registration</Link></li>
                <li><Link href="/login" className="hover:text-primary">Login</Link></li>
                <li><Link href="/forgot-password" className="hover:text-primary">Reset Password</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#how-it-works" className="hover:text-primary">How It Works</Link></li>
                <li><Link href="#safety" className="hover:text-primary">Safety Features</Link></li>
                <li><Link href="#features" className="hover:text-primary">Features</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>GIT India University</li>
                <li>support@rik-ride.in</li>
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2026 Rik-Ride. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="#" className="hover:text-primary">Privacy Policy</Link>
              <Link href="#" className="hover:text-primary">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Step Item Component
function StepItem({ 
  number, 
  title, 
  children, 
  variant = 'student' 
}: { 
  number: number; 
  title: string; 
  children: React.ReactNode;
  variant?: 'student' | 'driver';
}) {
  const bgColor = variant === 'driver' ? 'bg-green-600' : 'bg-primary';
  
  return (
    <div className="flex gap-4">
      <div className={`h-8 w-8 rounded-full ${bgColor} text-white flex items-center justify-center text-sm font-bold shrink-0`}>
        {number}
      </div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}

// Safety Card Component
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
    <div className="text-center p-6 bg-background rounded-lg border">
      <div className="inline-flex items-center justify-center mb-4">
        {icon}
      </div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

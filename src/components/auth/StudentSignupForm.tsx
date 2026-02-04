'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { APIBook, UNIVERSITY_EMAIL_DOMAIN } from '@/lib/firebase/services';
import { studentSignupSchema, type StudentSignupFormData } from '@/lib/validations/auth';
import { Input } from '@/components/ui/input';
import PasswordInput from '@/components/ui/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, GraduationCap, Car } from 'lucide-react';
import Link from 'next/link';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Chemical Engineering',
  'Biotechnology',
  'MBA',
  'MCA',
  'Other',
];

export default function StudentSignupForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const router = useRouter();

  const form = useForm<StudentSignupFormData>({
    resolver: zodResolver(studentSignupSchema),
    defaultValues: {
      displayName: '',
      email: '',
      universityEmail: '',
      studentId: '',
      department: '',
      year: 1,
      phone: '',
      parentPhone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: StudentSignupFormData) => {
    setLoading(true);
    setError('');
    setSuccess('');

    // Register with Firebase Auth
    const authResult = await APIBook.auth.registerWithEmail(
      data.email, 
      data.password, 
      data.displayName
    );
    
    if (!authResult.success || !authResult.data) {
      setError(authResult.error || 'Registration failed');
      setLoading(false);
      return;
    }

    // Create student profile
    const studentResult = await APIBook.student.createStudent(authResult.data.uid, {
      email: data.email,
      displayName: data.displayName,
      password: data.password,
      universityEmail: data.universityEmail,
      studentId: data.studentId,
      department: data.department,
      year: data.year,
      phone: data.phone,
      parentPhone: data.parentPhone,
    });

    if (studentResult.success) {
      setSuccess('Account ban gaya! Email check karo verify karne ke liye.');
      form.reset();
      setTimeout(() => router.push('/login'), 3000);
    } else {
      setError(studentResult.error || 'Profile create nahi ho paya');
    }
    
    setLoading(false);
  };

  return (
    <div className="w-full max-w-4xl px-4">
      <div className="flex flex-col md:flex-row md:items-stretch md:gap-0">
        
        {/* Left Side - Branding (Desktop Only) */}
        <div className="hidden md:flex md:w-2/5 bg-gradient-to-br from-[#009944] to-[#00753A] rounded-l-2xl p-8 flex-col justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <Car className="h-8 w-8 text-white" />
              <span className="text-2xl font-bold italic tracking-wider text-white">
                RIKRIDE
              </span>
            </Link>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-white text-3xl font-bold leading-tight">
                Bus Ka
                <br />
                <span className="text-4xl italic">Chakkar Chodo! 🎓</span>
              </p>
            </div>
            <p className="text-white/80 text-base font-medium">
              Auto se jao, time bachao, class late mat jao!
            </p>
            <div className="space-y-2 pt-4 text-white/80 text-sm">
              <p>✓ Fixed price, no bargaining</p>
              <p>✓ Trusted drivers only</p>
              <p>✓ Track your ride live</p>
              <p>✓ Pay online, no cash stress</p>
            </div>
          </div>
          
          <p className="text-white/50 text-sm">
            &quot;Late hoke bhi cool lagenge ab!&quot;
          </p>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-3/5 bg-white/10 backdrop-blur-md border-2 border-[#009944] md:border-l-0 rounded-2xl md:rounded-l-none md:rounded-r-2xl p-5 md:p-8">
          
          {/* Mobile Logo */}
          <div className="text-center mb-4 md:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <Car className="h-7 w-7 text-[#FFD700]" />
              <span className="text-xl font-bold italic tracking-wider text-white">
                RIK<span className="text-[#FFD700]">RIDE</span>
              </span>
            </Link>
            <p className="text-white text-base font-bold mt-2">Bus Ka Chakkar <span className="text-[#009944]">Chodo!</span></p>
            <p className="text-gray-500 text-xs mt-1">Auto se jao, time bachao 🎓</p>
          </div>

          <div className="text-center md:text-left mb-4">
            <h1 className="text-lg md:text-xl font-bold text-white mb-1">Student Registration 📚</h1>
            <p className="text-gray-400 text-sm">1000+ students pehle se ride le rahe!</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-500/20 border-red-500">
              <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-500/20 border-green-500 text-green-400">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300 text-sm">Full Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John Doe" 
                      className="bg-[#1a1a1a] border-gray-600 text-white placeholder:text-gray-500 focus:border-[#009944] focus:ring-[#009944]/20 h-11 md:h-12 text-base"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm">Personal Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="john@example.com" 
                        className="bg-[#1a1a1a] border-gray-600 text-white placeholder:text-gray-500 focus:border-[#009944] focus:ring-[#009944]/20 h-11 md:h-12 text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="universityEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm">University Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="text" 
                          placeholder="student" 
                          {...field}
                          onChange={(e) => {
                            // Only store the username part, auto-append domain
                            const username = e.target.value.replace(UNIVERSITY_EMAIL_DOMAIN, '');
                            field.onChange(username + UNIVERSITY_EMAIL_DOMAIN);
                          }}
                          value={field.value.replace(UNIVERSITY_EMAIL_DOMAIN, '')}
                          className="bg-[#1a1a1a] border-gray-600 text-white placeholder:text-gray-500 focus:border-[#009944] focus:ring-[#009944]/20 h-11 md:h-12 text-base pr-40"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                          {UNIVERSITY_EMAIL_DOMAIN}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm">Student ID</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="STU123456" 
                        className="bg-[#1a1a1a] border-gray-600 text-white placeholder:text-gray-500 focus:border-[#009944] focus:ring-[#009944]/20 h-11 md:h-12 text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm">Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+91 9876543210" 
                        className="bg-[#1a1a1a] border-gray-600 text-white placeholder:text-gray-500 focus:border-[#009944] focus:ring-[#009944]/20 h-11 md:h-12 text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parentPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm">Parent Phone <span className="text-gray-500">(Optional)</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+91 9876543210" 
                        className="bg-[#1a1a1a] border-gray-600 text-white placeholder:text-gray-500 focus:border-[#009944] focus:ring-[#009944]/20 h-11 md:h-12 text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm">Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full bg-[#1a1a1a] border-gray-600 text-white h-11 md:h-12">
                          <SelectValue placeholder="Select department" className="truncate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#1a1a1a] border-gray-600 max-h-[200px]">
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept} className="truncate text-white hover:bg-gray-700">
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm">Year</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-[#1a1a1a] border-gray-600 text-white h-11 md:h-12">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#1a1a1a] border-gray-600">
                        {[1, 2, 3, 4].map((year) => (
                          <SelectItem key={year} value={year.toString()} className="text-white hover:bg-gray-700">
                            Year {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300 text-sm">Password</FormLabel>
                  <FormControl>
                    <PasswordInput 
                      placeholder="Create a strong password" 
                      className="bg-[#1a1a1a] border-gray-600 text-white placeholder:text-gray-500 focus:border-[#009944] focus:ring-[#009944]/20 h-11 md:h-12 text-base"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300 text-sm">Confirm Password</FormLabel>
                  <FormControl>
                    <PasswordInput 
                      placeholder="Confirm your password" 
                      className="bg-[#1a1a1a] border-gray-600 text-white placeholder:text-gray-500 focus:border-[#009944] focus:ring-[#009944]/20 h-11 md:h-12 text-base"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#009944] text-white py-3 md:py-4 text-base md:text-lg font-bold uppercase tracking-wider rounded-lg hover:bg-green-700 transition-all shadow-[0px_4px_0px_0px_#006400] active:shadow-[0px_2px_0px_0px_#006400] active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Ruko zara...' : 'Account Banao →'}
            </button>
          </form>
        </Form>

        <div className="mt-5 text-center text-gray-400 text-sm">
          Pehle se account hai?{' '}
          <Link href="/login" className="text-[#FFD700] font-bold hover:underline">
            Login karo
          </Link>
        </div>

        <div className="mt-3 text-center text-gray-400 text-sm">
          Driver ho tum?{' '}
          <Link href="/signup/driver" className="text-[#FFD700] font-bold hover:underline">
            Driver wala form bharo
          </Link>
        </div>
        </div>
      </div>

      {/* Bottom tagline for mobile */}
      <p className="text-center text-gray-600 text-xs mt-4 md:hidden">
        🎓 College Life = Sorted!
      </p>
    </div>
  );
}

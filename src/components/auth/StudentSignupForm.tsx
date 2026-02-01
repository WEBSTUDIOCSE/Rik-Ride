'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { APIBook, UNIVERSITY_EMAIL_DOMAIN } from '@/lib/firebase/services';
import { studentSignupSchema, type StudentSignupFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PasswordInput from '@/components/ui/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, GraduationCap } from 'lucide-react';
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
    });

    if (studentResult.success) {
      setSuccess('Account created successfully! Please check your email to verify your account.');
      form.reset();
      setTimeout(() => router.push('/login'), 3000);
    } else {
      setError(studentResult.error || 'Failed to create student profile');
    }
    
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Student Registration</CardTitle>
        <CardDescription>
          Create your account to book auto rickshaws
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4">
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
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="universityEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>University Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder={`student${UNIVERSITY_EMAIL_DOMAIN}`} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student ID</FormLabel>
                    <FormControl>
                      <Input placeholder="STU123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select department" className="truncate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept} className="truncate">
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4].map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            Year {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="Create a strong password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="Confirm your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Student Account'}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>

        <div className="mt-4 text-center text-sm">
          <span className="text-muted-foreground">Are you a driver? </span>
          <Link href="/signup/driver" className="text-primary hover:underline font-medium">
            Register as Driver
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

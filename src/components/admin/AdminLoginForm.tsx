'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { APIBook, isAdminEmail } from '@/lib/firebase/services';
import { adminLoginSchema, type AdminLoginFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PasswordInput from '@/components/ui/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Shield, AlertCircle } from 'lucide-react';

export default function AdminLoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();

  const form = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: AdminLoginFormData) => {
    setLoading(true);
    setError('');

    // Check if email is admin email
    if (!isAdminEmail(data.email)) {
      setError('Invalid admin credentials');
      setLoading(false);
      return;
    }

    // Validate admin credentials
    const validateResult = await APIBook.admin.validateAdminLogin(data.email, data.password);
    
    if (!validateResult.success) {
      setError(validateResult.error || 'Invalid admin credentials');
      setLoading(false);
      return;
    }

    // Login with Firebase Auth
    const loginResult = await APIBook.auth.loginWithEmail(data.email, data.password);
    
    if (loginResult.success) {
      router.push('/admin/dashboard');
      router.refresh();
    } else {
      // If Firebase login fails, try creating admin account first time
      const registerResult = await APIBook.auth.registerWithEmail(
        data.email,
        data.password,
        'Admin'
      );
      
      if (registerResult.success) {
        // Create admin profile
        await APIBook.admin.createAdmin(
          registerResult.data!.uid,
          data.email,
          'Admin'
        );
        
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        setError(loginResult.error || 'Login failed');
      }
    }
    
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
        <CardDescription>
          Sign in to access the admin dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="admin@example.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Enter your password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

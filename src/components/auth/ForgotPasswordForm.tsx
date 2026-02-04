'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { APIBook } from '@/lib/firebase/services';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations/auth';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showBackToLogin?: boolean;
}

export default function ForgotPasswordForm({ 
  onSuccess, 
  onCancel, 
  showBackToLogin = true 
}: ForgotPasswordFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);
    setError('');

    const result = await APIBook.auth.resetPassword(data.email);
    
    if (result.success) {
      setEmailSent(true);
      setError('');
      
      // Call success callback after showing success message
      setTimeout(() => {
        onSuccess?.();
      }, 3000);
    } else {
      setError(result.error || 'Failed to send reset email');
    }
    
    setLoading(false);
  };

  if (emailSent) {
    return (
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md border-2 border-[#009944] rounded-xl p-8 shadow-xl">
        <div className="text-center space-y-4">
          <CheckCircle className="h-12 w-12 mx-auto text-[#009944]" />
          <h2 className="text-2xl font-bold text-white">Email Bhej Diya! ✉️</h2>
          <p className="text-gray-400">
            Password reset link teri email pe bhej diya hai.
            Inbox check kar aur instructions follow kar.
          </p>
        </div>
        <div className="space-y-4 mt-6">
          <div className="text-gray-500 text-center text-sm">
            Email nahi mila? Spam folder check kar ya fir se try kar.
          </div>
          
          <div className="flex gap-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 py-3 px-4 border-2 border-gray-600 text-gray-300 rounded-lg font-semibold hover:bg-gray-800 transition-all"
              >
                Band Kar
              </button>
            )}
            {showBackToLogin && (
              <Link href="/login" className="flex-1">
                <button className="w-full py-3 px-4 bg-[#009944] text-white rounded-lg font-bold hover:bg-[#007a36] transition-all shadow-[0_4px_0_#006630] hover:shadow-[0_2px_0_#006630] hover:translate-y-[2px]">
                  Login Pe Jao
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white/10 backdrop-blur-md border-2 border-[#009944] rounded-xl p-8 shadow-xl">
      {/* Header */}
      <div className="text-center space-y-3 mb-6">
        <Link href="/" className="inline-block">
          <Image src="/icon-192x192.svg" alt="Rik-Ride" width={60} height={60} className="mx-auto" />
        </Link>
        <Mail className="h-8 w-8 text-[#009944] mx-auto" />
        <h2 className="text-2xl font-bold text-white">Password Bhool Gaye? 🤔</h2>
        <p className="text-gray-400">
          Apna email daalo, hum reset link bhej denge.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4 bg-red-500/20 border-red-500 text-red-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Email Daalo</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="apna email likho"
                    className="bg-[#1a1a1a] border-gray-600 text-white placeholder:text-gray-500 focus:border-[#009944] focus:ring-[#009944]/20"
                    {...field}
                    id="forgot-password-email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 py-3 px-4 border-2 border-gray-600 text-gray-300 rounded-lg font-semibold hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                Rehne Do
              </button>
            )}
            {showBackToLogin && !onCancel && (
              <Link href="/login" className="flex-1">
                <button
                  type="button"
                  disabled={loading}
                  className="w-full py-3 px-4 border-2 border-gray-600 text-gray-300 rounded-lg font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Wapas Jao
                </button>
              </Link>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`py-3 px-4 bg-[#009944] text-white rounded-lg font-bold hover:bg-[#007a36] transition-all shadow-[0_4px_0_#006630] hover:shadow-[0_2px_0_#006630] hover:translate-y-[2px] disabled:opacity-50 disabled:hover:translate-y-0 ${onCancel || showBackToLogin ? "flex-1" : "w-full"}`}
            >
              {loading ? 'Ruko zara...' : 'Link Bhejo'}
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}

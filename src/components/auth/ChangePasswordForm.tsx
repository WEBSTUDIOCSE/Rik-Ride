'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { APIBook } from '@/lib/firebase/services';
import { changePasswordSchema, type ChangePasswordFormData } from '@/lib/validations/auth';
import PasswordInput from '@/components/ui/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertCircle, CheckCircle, Lock } from 'lucide-react';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ChangePasswordForm({ onSuccess, onCancel }: ChangePasswordFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setLoading(true);
    setError('');
    setSuccess(false);

    const result = await APIBook.auth.changePassword(data.currentPassword, data.newPassword);
    
    if (result.success) {
      setSuccess(true);
      form.reset();
      
      // Call success callback after showing success message
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } else {
      setError(result.error || 'Failed to change password');
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-md border-2 border-[#009944] rounded-xl p-4 md:p-6">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 text-[#009944]" />
          <h2 className="text-lg md:text-xl font-bold text-white mb-2">Password Badal Gaya! 🎉</h2>
          <p className="text-gray-400 text-sm">
            Tera naya password set ho gaya hai. Ab tu secure hai!
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full mt-4 bg-[#009944] text-white py-3 px-4 rounded-lg font-bold uppercase tracking-wider text-sm shadow-[0px_4px_0px_0px_#006400] hover:shadow-[0px_2px_0px_0px_#006400] hover:translate-y-[2px] active:shadow-none active:translate-y-1 transition-all"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-md border-2 border-[#FFD700] rounded-xl p-4 md:p-6">
      <div className="text-center mb-4 md:mb-6">
        <Lock className="h-8 w-8 md:h-10 md:w-10 text-[#FFD700] mx-auto mb-2" />
        <h2 className="text-lg md:text-xl font-bold text-white">Password Badlo 🔐</h2>
        <p className="text-gray-400 text-sm mt-1">
          Purana password daal aur naya choose kar
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4 bg-red-500/20 border-red-500">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Current Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter your current password"
                      id="current-password-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">New Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter your new password"
                      showStrength={true}
                      id="new-password-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Confirm New Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Confirm your new password"
                      id="confirm-new-password-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1 bg-[#252525] border-2 border-gray-600 text-white py-3 px-4 rounded-lg font-bold uppercase tracking-wider text-sm hover:border-[#FFD700] transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`${onCancel ? "flex-1" : "w-full"} bg-[#009944] text-white py-3 px-4 rounded-lg font-bold uppercase tracking-wider text-sm shadow-[0px_4px_0px_0px_#006400] hover:shadow-[0px_2px_0px_0px_#006400] hover:translate-y-[2px] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50`}
              >
                {loading ? 'Badal raha hai...' : 'Password Badlo'}
              </button>
            </div>
          </form>
        </Form>
    </div>
  );
}

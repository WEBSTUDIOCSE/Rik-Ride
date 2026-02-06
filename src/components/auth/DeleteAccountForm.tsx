'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { deleteAccountSchema, type DeleteAccountFormData } from '@/lib/validations/auth';
import { APIBook } from '@/lib/firebase/services';
import { useAuth } from '@/contexts/AuthContext';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import PasswordInput from '@/components/ui/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DeleteAccountForm() {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const form = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: '',
      confirmText: '',
    },
  });

  const isGoogleUser = user?.providerData[0]?.providerId === 'google.com';

  const handleDeleteAccount = async (data: DeleteAccountFormData) => {
    setIsDeleting(true);
    setError('');

    try {
      const result = await APIBook.auth.deleteAccount(isGoogleUser ? undefined : data.password);
      
      if (result.success) {
        window.location.href = '/login?message=Account deleted successfully';
        return;
      } else {
        setError(result.error || 'Failed to delete account');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGoogleReauth = async () => {
    setIsDeleting(true);
    setError('');

    try {
      const result = await APIBook.auth.deleteAccount();
      
      if (result.success) {
        window.location.href = '/login?message=Account deleted successfully';
        return;
      } else {
        setError(result.error || 'Failed to delete account');
      }
    } catch (err) {
      setError('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!showConfirmation) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Link href="/profile">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </button>
        </Link>

        <div className="bg-red-500/10 backdrop-blur-md border-2 border-red-500 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h2 className="text-xl font-bold text-red-500">Account Delete Karna Hai? ⚠️</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Yeh action undo nahi hoga. Tera poora account aur saara data permanently delete ho jayega!
          </p>
          
          <Alert className="mb-4 bg-red-500/20 border-red-500/50">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              <strong>Warning:</strong> Account delete karne se:
              <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                <li>Saara data permanently delete ho jayega</li>
                <li>Sabhi devices se sign out ho jayega</li>
                <li>Koi bhi associated services access nahi hongi</li>
                <li>Yeh action reverse nahi ho sakta! 💀</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="border-t border-red-500/30 pt-4 mt-4">
            <p className="text-muted-foreground text-sm mb-4">
              Agar pakka confirm hai ki account delete karna hai, toh neeche button press kar.
            </p>
            
            <button 
              onClick={() => setShowConfirmation(true)}
              className="w-full flex items-center justify-center gap-2 bg-red-500 text-foreground py-3 px-4 rounded-lg font-bold uppercase tracking-wider shadow-[0px_4px_0px_0px_#991b1b] hover:shadow-[0px_2px_0px_0px_#991b1b] hover:translate-y-[2px] active:shadow-none active:translate-y-1 transition-all"
            >
              <Trash2 className="h-4 w-4" />
              Samajh gaya, Delete Kar Do
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <button 
        onClick={() => setShowConfirmation(false)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Peeche Jao
      </button>

      <div className="bg-red-500/10 backdrop-blur-md border-2 border-red-500 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="h-6 w-6 text-red-500" />
          <h2 className="text-xl font-bold text-red-500">Final Confirmation 💀</h2>
        </div>
        <p className="text-muted-foreground text-sm mb-4">
          {isGoogleUser 
            ? 'Google se dobara login karke confirm karna padega.'
            : 'Password aur confirmation text enter kar.'}
        </p>

        {error && (
          <Alert className="mb-4 bg-red-500/20 border-red-500">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {isGoogleUser ? (
          <div className="space-y-4">
            <Alert className="bg-red-500/20 border-red-500/50">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                Google se dobara sign in karna padega confirm karne ke liye.
              </AlertDescription>
            </Alert>
            
            <button 
              onClick={handleGoogleReauth}
              disabled={isDeleting}
              className="w-full flex items-center justify-center gap-2 bg-red-500 text-foreground py-3 px-4 rounded-lg font-bold uppercase tracking-wider shadow-[0px_4px_0px_0px_#991b1b] hover:shadow-[0px_2px_0px_0px_#991b1b] hover:translate-y-[2px] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Delete ho raha hai...' : 'Google se Confirm Karo'}
            </button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleDeleteAccount)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Current Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Apna current password daal"
                        disabled={isDeleting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">
                      Type <code className="bg-background px-2 py-1 rounded text-red-500 font-bold border border-red-500/30">DELETE</code> to confirm
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="DELETE likh ke confirm kar"
                        disabled={isDeleting}
                        className="font-mono bg-background border-border text-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <button 
                type="submit" 
                disabled={isDeleting}
                className="w-full flex items-center justify-center gap-2 bg-red-500 text-foreground py-3 px-4 rounded-lg font-bold uppercase tracking-wider shadow-[0px_4px_0px_0px_#991b1b] hover:shadow-[0px_2px_0px_0px_#991b1b] hover:translate-y-[2px] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Delete ho raha hai...' : 'Account Permanently Delete'}
              </button>
            </form>
          </Form>
        )}

        <div className="mt-4 pt-4 border-t border-red-500/30">
          <p className="text-xs text-muted-foreground text-center">
            Yeh action irreversible hai. Delete hone ke baad account recover nahi ho sakta. 😢
          </p>
        </div>
      </div>
    </div>
  );
}

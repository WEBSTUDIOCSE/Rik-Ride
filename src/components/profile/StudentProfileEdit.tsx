'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  Save, 
  Loader2, 
  User, 
  Phone, 
  Mail, 
  GraduationCap,
  Building,
  CalendarDays,
  Edit2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { APIBook } from '@/lib/firebase/services';
import { StudentProfile } from '@/lib/types/user.types';
import { EmergencyContactManager } from '@/components/emergency';

// Validation schema for student profile edit
const studentProfileEditSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15).regex(/^[0-9+\-\s]+$/),
});

type StudentProfileEditData = z.infer<typeof studentProfileEditSchema>;

interface StudentProfileEditProps {
  student: StudentProfile;
  onUpdate?: (updatedStudent: StudentProfile) => void;
}

export default function StudentProfileEdit({ student, onUpdate }: StudentProfileEditProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [localStudent, setLocalStudent] = useState(student);

  const form = useForm<StudentProfileEditData>({
    resolver: zodResolver(studentProfileEditSchema),
    defaultValues: {
      displayName: student.displayName,
      phone: student.phone || '',
    },
  });

  useEffect(() => {
    setLocalStudent(student);
    form.reset({
      displayName: student.displayName,
      phone: student.phone || '',
    });
  }, [student, form]);

  const handleSubmit = async (data: StudentProfileEditData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await APIBook.student.updateStudent(student.uid, {
        displayName: data.displayName,
        phone: data.phone,
      });

      if (result.success) {
        const updatedStudent = { ...localStudent, ...data };
        setLocalStudent(updatedStudent);
        onUpdate?.(updatedStudent);
        setShowEditDialog(false);
        setSuccess('Profile updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while updating profile');
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyContactsChange = (contacts: Array<{ name: string; phone: string; relationship: string }>) => {
    const updatedStudent = { 
      ...localStudent, 
      emergencyContacts: contacts 
    };
    setLocalStudent(updatedStudent);
    onUpdate?.(updatedStudent);
  };

  const handleParentPhoneChange = (phone: string | null) => {
    const updatedStudent = { 
      ...localStudent, 
      parentPhone: phone 
    };
    setLocalStudent(updatedStudent);
    onUpdate?.(updatedStudent);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {error && (
        <Alert className="bg-red-500/20 border-red-500">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-primary/20 border-primary">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">{success}</AlertDescription>
        </Alert>
      )}

      {/* Profile Information Card */}
      <div className="bg-card backdrop-blur-md border-2 border-secondary rounded-xl p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-secondary flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Your personal information</p>
          </div>
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogTrigger asChild>
              <button className="flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 px-4 rounded-lg font-bold uppercase tracking-wider text-xs shadow-[0px_4px_0px_0px_var(--rickshaw-green-dark)] hover:shadow-[0px_2px_0px_0px_var(--rickshaw-green-dark)] hover:translate-y-[2px] active:shadow-none active:translate-y-1 transition-all w-full sm:w-auto">
                <Edit2 className="h-4 w-4" />
                Edit
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-secondary flex items-center gap-2">
                  <Edit2 className="h-5 w-5" />
                  Profile Edit Karo ✏️
                </DialogTitle>
                <DialogDescription>
                  Apni personal information update kar
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">Full Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Apna naam daal" 
                            className="bg-card border-border text-foreground placeholder:text-muted-foreground"
                            {...field} 
                          />
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
                        <FormLabel className="text-muted-foreground">Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+91 9876543210" 
                            className="bg-card border-border text-foreground placeholder:text-muted-foreground"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditDialog(false)}
                      disabled={loading}
                      className="flex-1 bg-card border-2 border-border text-foreground py-3 px-4 rounded-lg font-bold uppercase tracking-wider text-sm hover:border-secondary transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 px-4 rounded-lg font-bold uppercase tracking-wider text-sm shadow-[0px_4px_0px_0px_var(--rickshaw-green-dark)] hover:shadow-[0px_2px_0px_0px_var(--rickshaw-green-dark)] hover:translate-y-[2px] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Profile Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <div className="bg-card rounded-lg p-3 md:p-4 flex items-start gap-3">
            <User className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground mb-1">Name</p>
              <p className="text-foreground font-medium text-sm md:text-base truncate">{localStudent.displayName}</p>
            </div>
          </div>

          <div className="bg-card rounded-lg p-3 md:p-4 flex items-start gap-3">
            <Phone className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground mb-1">Phone</p>
              <p className="text-foreground font-medium text-sm md:text-base truncate">{localStudent.phone || 'Not provided'}</p>
            </div>
          </div>

          <div className="bg-card rounded-lg p-3 md:p-4 flex items-start gap-3">
            <Mail className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground mb-1">Email</p>
              <p className="text-foreground font-medium text-sm md:text-base truncate">{localStudent.email}</p>
            </div>
          </div>

          <div className="bg-card rounded-lg p-3 md:p-4 flex items-start gap-3">
            <GraduationCap className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground mb-1">University Email</p>
              <p className="text-foreground font-medium text-sm md:text-base truncate">{localStudent.universityEmail}</p>
            </div>
          </div>

          <div className="bg-card rounded-lg p-3 md:p-4 flex items-start gap-3">
            <Building className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground mb-1">Department</p>
              <p className="text-foreground font-medium text-sm md:text-base truncate">{localStudent.department}</p>
            </div>
          </div>

          <div className="bg-card rounded-lg p-3 md:p-4 flex items-start gap-3">
            <CalendarDays className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground mb-1">Year</p>
              <p className="text-foreground font-medium text-sm md:text-base">Year {localStudent.year}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contacts Card */}
      <EmergencyContactManager
        studentId={localStudent.uid}
        contacts={localStudent.emergencyContacts || []}
        parentPhone={localStudent.parentPhone}
        onContactsChange={handleEmergencyContactsChange}
        onParentPhoneChange={handleParentPhoneChange}
      />
    </div>
  );
}

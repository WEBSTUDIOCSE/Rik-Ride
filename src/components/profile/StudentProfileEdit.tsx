'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    // Update local state with new contacts
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
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Profile Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </div>
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Update your personal information
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your name" {...field} />
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

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowEditDialog(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{localStudent.displayName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{localStudent.phone || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{localStudent.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">University Email</p>
                <p className="font-medium">{localStudent.universityEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{localStudent.department}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Year</p>
                <p className="font-medium">Year {localStudent.year}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

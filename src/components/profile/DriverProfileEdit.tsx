'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/firebase';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Loader2, 
  User, 
  Phone, 
  Mail, 
  Car,
  FileText,
  Edit2,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Camera,
  Upload,
} from 'lucide-react';
import { APIBook, DocumentType } from '@/lib/firebase/services';
import { DriverProfile, VerificationStatus } from '@/lib/types/user.types';

const VEHICLE_TYPES = [
  'Auto Rickshaw',
  'E-Rickshaw',
  'Tempo',
  'Other',
];

// Fields that require re-verification when changed
const VERIFICATION_REQUIRED_FIELDS = [
  'vehicleType',
  'vehicleModel',
  'vehicleRegistrationNumber',
  'seatingCapacity',
  'licenseNumber',
  'licenseExpiry',
];

// Validation schema for personal info
const personalInfoSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15).regex(/^[0-9+\-\s]+$/),
});

// Validation schema for vehicle info
const vehicleInfoSchema = z.object({
  vehicleType: z.string().min(1, 'Vehicle type is required'),
  vehicleModel: z.string().min(1, 'Vehicle model is required'),
  vehicleRegistrationNumber: z.string().min(1, 'Registration number is required').max(15),
  seatingCapacity: z.number().min(1).max(10),
});

// Validation schema for license info
const licenseInfoSchema = z.object({
  licenseNumber: z.string().min(1, 'License number is required').max(20),
  licenseExpiry: z.string().min(1, 'License expiry is required'),
});

type PersonalInfoData = z.infer<typeof personalInfoSchema>;
type VehicleInfoData = z.infer<typeof vehicleInfoSchema>;
type LicenseInfoData = z.infer<typeof licenseInfoSchema>;

interface DriverProfileEditProps {
  driver: DriverProfile;
  onUpdate?: (updatedDriver: DriverProfile) => void;
}

export default function DriverProfileEdit({ driver, onUpdate }: DriverProfileEditProps) {
  const [showPersonalEdit, setShowPersonalEdit] = useState(false);
  const [showVehicleEdit, setShowVehicleEdit] = useState(false);
  const [showLicenseEdit, setShowLicenseEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [localDriver, setLocalDriver] = useState(driver);
  
  // Photo upload states
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const personalForm = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      displayName: driver.displayName,
      phone: driver.phone || '',
    },
  });

  const vehicleForm = useForm<VehicleInfoData>({
    resolver: zodResolver(vehicleInfoSchema),
    defaultValues: {
      vehicleType: driver.vehicleType,
      vehicleModel: driver.vehicleModel,
      vehicleRegistrationNumber: driver.vehicleRegistrationNumber,
      seatingCapacity: driver.seatingCapacity,
    },
  });

  const licenseForm = useForm<LicenseInfoData>({
    resolver: zodResolver(licenseInfoSchema),
    defaultValues: {
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry,
    },
  });

  useEffect(() => {
    setLocalDriver(driver);
    personalForm.reset({
      displayName: driver.displayName,
      phone: driver.phone || '',
    });
    vehicleForm.reset({
      vehicleType: driver.vehicleType,
      vehicleModel: driver.vehicleModel,
      vehicleRegistrationNumber: driver.vehicleRegistrationNumber,
      seatingCapacity: driver.seatingCapacity,
    });
    licenseForm.reset({
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry,
    });
  }, [driver, personalForm, vehicleForm, licenseForm]);

  const handlePersonalSubmit = async (data: PersonalInfoData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await APIBook.driver.updateDriver(driver.uid, {
        displayName: data.displayName,
        phone: data.phone,
      });

      if (result.success) {
        const updatedDriver = { ...localDriver, ...data };
        setLocalDriver(updatedDriver);
        onUpdate?.(updatedDriver);
        setShowPersonalEdit(false);
        setSuccess('Personal information updated successfully');
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

  // Updates vehicle info and puts account on hold for re-verification
  const handleVehicleSubmit = async (data: VehicleInfoData) => {
    if (!confirm('Updating vehicle details will put your account on hold until admin approves. Continue?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update with pending verification status
      const result = await APIBook.driver.updateDriver(driver.uid, {
        vehicleType: data.vehicleType,
        vehicleModel: data.vehicleModel,
        vehicleRegistrationNumber: data.vehicleRegistrationNumber,
        seatingCapacity: data.seatingCapacity,
        verificationStatus: VerificationStatus.PENDING,
        profileUpdatePending: true,
        pendingUpdates: {
          vehicleType: data.vehicleType,
          vehicleModel: data.vehicleModel,
          vehicleRegistrationNumber: data.vehicleRegistrationNumber,
          seatingCapacity: data.seatingCapacity,
          updatedAt: new Date().toISOString(),
        },
      });

      if (result.success) {
        const updatedDriver = { 
          ...localDriver, 
          ...data,
          verificationStatus: VerificationStatus.PENDING,
          profileUpdatePending: true,
        };
        setLocalDriver(updatedDriver);
        onUpdate?.(updatedDriver);
        setShowVehicleEdit(false);
        setSuccess('Vehicle details updated. Your account is now pending admin approval.');
        
        // TODO: Send email notification to admin
        console.log('TODO: Send admin notification email about driver profile update');
        
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(result.error || 'Failed to update vehicle details');
      }
    } catch (err) {
      setError('An error occurred while updating vehicle details');
      console.error('Vehicle update error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Updates license info and puts account on hold for re-verification
  const handleLicenseSubmit = async (data: LicenseInfoData) => {
    if (!confirm('Updating license details will put your account on hold until admin approves. Continue?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await APIBook.driver.updateDriver(driver.uid, {
        licenseNumber: data.licenseNumber,
        licenseExpiry: data.licenseExpiry,
        verificationStatus: VerificationStatus.PENDING,
        profileUpdatePending: true,
        pendingUpdates: {
          licenseNumber: data.licenseNumber,
          licenseExpiry: data.licenseExpiry,
          updatedAt: new Date().toISOString(),
        },
      });

      if (result.success) {
        const updatedDriver = { 
          ...localDriver, 
          ...data,
          verificationStatus: VerificationStatus.PENDING,
          profileUpdatePending: true,
        };
        setLocalDriver(updatedDriver);
        onUpdate?.(updatedDriver);
        setShowLicenseEdit(false);
        setSuccess('License details updated. Your account is now pending admin approval.');
        
        // TODO: Send email notification to admin
        console.log('TODO: Send admin notification email about driver license update');
        
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(result.error || 'Failed to update license details');
      }
    } catch (err) {
      setError('An error occurred while updating license details');
      console.error('License update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    setError(null);

    try {
      const timestamp = Date.now();
      const fileName = `profile_${driver.uid}_${timestamp}.${file.name.split('.').pop()}`;
      const storagePath = `drivers/${driver.uid}/profile/${fileName}`;
      const storageRef = ref(storage, storagePath);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const result = await APIBook.driver.updateDriver(driver.uid, {
        photoURL: downloadURL,
      });

      if (result.success) {
        const updatedDriver = { ...localDriver, photoURL: downloadURL };
        setLocalDriver(updatedDriver);
        onUpdate?.(updatedDriver);
        setSuccess('Profile photo updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to update photo');
      }
    } catch (err) {
      setError('An error occurred while uploading photo');
      console.error('Photo upload error:', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getStatusBadge = () => {
    if (localDriver.profileUpdatePending) {
      return <Badge variant="secondary">Pending Approval</Badge>;
    }
    switch (localDriver.verificationStatus) {
      case VerificationStatus.APPROVED:
        return <Badge className="bg-green-500">Verified</Badge>;
      case VerificationStatus.PENDING:
        return <Badge variant="secondary">Pending Verification</Badge>;
      case VerificationStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
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

      {localDriver.profileUpdatePending && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your profile update is pending admin approval. You cannot accept rides until approved.
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Photo & Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Driver Profile
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            Status: {getStatusBadge()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Photo */}
            <div className="relative">
              {localDriver.photoURL ? (
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={localDriver.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-28 h-28 rounded-full bg-muted flex items-center justify-center border-4 border-dashed border-muted-foreground">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              {uploadingPhoto && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
              <label
                htmlFor="driverPhoto"
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90"
              >
                <Camera className="h-4 w-4" />
              </label>
              <input
                id="driverPhoto"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                }}
                className="hidden"
                disabled={uploadingPhoto}
              />
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <h3 className="text-xl font-semibold">{localDriver.displayName}</h3>
              <p className="text-muted-foreground">{localDriver.email}</p>
              <p className="text-muted-foreground">{localDriver.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Basic contact information</CardDescription>
            </div>
            <Dialog open={showPersonalEdit} onOpenChange={setShowPersonalEdit}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Personal Information</DialogTitle>
                  <DialogDescription>
                    Update your name and phone number
                  </DialogDescription>
                </DialogHeader>
                <Form {...personalForm}>
                  <form onSubmit={personalForm.handleSubmit(handlePersonalSubmit)} className="space-y-4">
                    <FormField
                      control={personalForm.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={personalForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowPersonalEdit(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{localDriver.displayName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{localDriver.phone || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{localDriver.email}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Information
              </CardTitle>
              <CardDescription>
                <span className="text-amber-600">⚠️ Changes require admin approval</span>
              </CardDescription>
            </div>
            <Dialog open={showVehicleEdit} onOpenChange={setShowVehicleEdit}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Vehicle Information</DialogTitle>
                  <DialogDescription className="text-amber-600">
                    ⚠️ Updating vehicle details will put your account on hold until admin approves.
                  </DialogDescription>
                </DialogHeader>
                <Form {...vehicleForm}>
                  <form onSubmit={vehicleForm.handleSubmit(handleVehicleSubmit)} className="space-y-4">
                    <FormField
                      control={vehicleForm.control}
                      name="vehicleType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {VEHICLE_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={vehicleForm.control}
                      name="vehicleModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Model</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={vehicleForm.control}
                      name="vehicleRegistrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={vehicleForm.control}
                      name="seatingCapacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Seating Capacity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowVehicleEdit(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading} variant="destructive">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
                        Update & Request Approval
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Car className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Vehicle Type</p>
                <p className="font-medium">{localDriver.vehicleType}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Car className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Model</p>
                <p className="font-medium">{localDriver.vehicleModel}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Registration Number</p>
                <p className="font-medium">{localDriver.vehicleRegistrationNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Seating Capacity</p>
                <p className="font-medium">{localDriver.seatingCapacity} passengers</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* License Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                License Information
              </CardTitle>
              <CardDescription>
                <span className="text-amber-600">⚠️ Changes require admin approval</span>
              </CardDescription>
            </div>
            <Dialog open={showLicenseEdit} onOpenChange={setShowLicenseEdit}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit License Information</DialogTitle>
                  <DialogDescription className="text-amber-600">
                    ⚠️ Updating license details will put your account on hold until admin approves.
                  </DialogDescription>
                </DialogHeader>
                <Form {...licenseForm}>
                  <form onSubmit={licenseForm.handleSubmit(handleLicenseSubmit)} className="space-y-4">
                    <FormField
                      control={licenseForm.control}
                      name="licenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={licenseForm.control}
                      name="licenseExpiry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Expiry</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowLicenseEdit(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading} variant="destructive">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
                        Update & Request Approval
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">License Number</p>
                <p className="font-medium">{localDriver.licenseNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">License Expiry</p>
                <p className="font-medium">{localDriver.licenseExpiry}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase/firebase';
import { APIBook, DocumentType } from '@/lib/firebase/services';
import { driverSignupSchema, type DriverSignupFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PasswordInput from '@/components/ui/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, Car, Clock } from 'lucide-react';
import Link from 'next/link';

const VEHICLE_TYPES = [
  'Auto Rickshaw',
  'E-Rickshaw',
  'Tempo',
  'Other',
];

export default function DriverSignupForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [licenseUrl, setLicenseUrl] = useState<string>('');
  const [aadharUrl, setAadharUrl] = useState<string>('');
  const [licenseTempPath, setLicenseTempPath] = useState<string>('');
  const [aadharTempPath, setAadharTempPath] = useState<string>('');
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [uploadingAadhar, setUploadingAadhar] = useState(false);
  
  const router = useRouter();

  const form = useForm<DriverSignupFormData>({
    resolver: zodResolver(driverSignupSchema),
    defaultValues: {
      displayName: '',
      email: '',
      phone: '',
      licenseNumber: '',
      licenseExpiry: '',
      aadharNumber: '',
      vehicleRegistrationNumber: '',
      vehicleType: '',
      vehicleModel: '',
      seatingCapacity: 3,
      password: '',
      confirmPassword: '',
    },
  });

  // Upload license immediately when selected - directly to storage
  const handleLicenseUpload = async (file: File) => {
    setUploadingLicense(true);
    setError('');
    
    try {
      // Upload directly to storage with temporary path
      const timestamp = Date.now();
      const fileName = `license_${timestamp}_${file.name}`;
      const tempPath = `temp_uploads/${fileName}`;
      const storageRef = ref(storage, tempPath);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setLicenseUrl(downloadURL);
      setLicenseTempPath(tempPath);
      setLicenseFile(file);
    } catch (err) {
      console.error('License upload error:', err);
      setError('Failed to upload license. Please try again.');
      setLicenseFile(null);
    }
    
    setUploadingLicense(false);
  };

  // Upload Aadhar immediately when selected - directly to storage
  const handleAadharUpload = async (file: File) => {
    setUploadingAadhar(true);
    setError('');
    
    try {
      // Upload directly to storage with temporary path
      const timestamp = Date.now();
      const fileName = `aadhar_${timestamp}_${file.name}`;
      const tempPath = `temp_uploads/${fileName}`;
      const storageRef = ref(storage, tempPath);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setAadharUrl(downloadURL);
      setAadharTempPath(tempPath);
      setAadharFile(file);
    } catch (err) {
      console.error('Aadhar upload error:', err);
      setError('Failed to upload Aadhar. Please try again.');
      setAadharFile(null);
    }
    
    setUploadingAadhar(false);
  };

  const onSubmit = async (data: DriverSignupFormData) => {
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate files are uploaded
    if (!licenseUrl) {
      setError('Please upload your driving license');
      setLoading(false);
      return;
    }

    if (!aadharUrl) {
      setError('Please upload your Aadhar card');
      setLoading(false);
      return;
    }

    try {
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

      const driverId = authResult.data.uid;

      // Create driver profile FIRST
      const driverResult = await APIBook.driver.createDriver(driverId, {
        email: data.email,
        displayName: data.displayName,
        password: data.password,
        phone: data.phone,
        licenseNumber: data.licenseNumber,
        licenseExpiry: data.licenseExpiry,
        aadharNumber: data.aadharNumber,
        vehicleRegistrationNumber: data.vehicleRegistrationNumber,
        vehicleType: data.vehicleType,
        vehicleModel: data.vehicleModel,
        seatingCapacity: data.seatingCapacity,
      });

      if (!driverResult.success) {
        setError(driverResult.error || 'Failed to create driver profile');
        setLoading(false);
        return;
      }

      // Now upload documents to permanent location
      if (licenseFile) {
        const licenseUpload = await APIBook.driver.uploadDocument(
          driverId,
          licenseFile,
          DocumentType.DRIVING_LICENSE
        );
        if (!licenseUpload.success) {
          setError('Failed to save license document. Please contact support.');
          setLoading(false);
          return;
        }
        
        // Delete temp file after successful permanent upload
        if (licenseTempPath) {
          try {
            const tempRef = ref(storage, licenseTempPath);
            await deleteObject(tempRef);
          } catch (err) {
            console.error('Failed to delete temp license:', err);
            // Non-critical error, continue
          }
        }
      }

      if (aadharFile) {
        const aadharUpload = await APIBook.driver.uploadDocument(
          driverId,
          aadharFile,
          DocumentType.ID_PROOF
        );
        if (!aadharUpload.success) {
          setError('Failed to save Aadhar document. Please contact support.');
          setLoading(false);
          return;
        }
        
        // Delete temp file after successful permanent upload
        if (aadharTempPath) {
          try {
            const tempRef = ref(storage, aadharTempPath);
            await deleteObject(tempRef);
          } catch (err) {
            console.error('Failed to delete temp aadhar:', err);
            // Non-critical error, continue
          }
        }
      }

      setSuccess('Account created successfully! Your profile is pending verification by admin.');
      form.reset();
      setLicenseFile(null);
      setAadharFile(null);
      setLicenseUrl('');
      setAadharUrl('');
      setLicenseTempPath('');
      setAadharTempPath('');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    }
    
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Car className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Driver Registration</CardTitle>
        <CardDescription>
          Register to offer rides to university students
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            After registration, your profile will be reviewed by admin. You can start accepting rides once verified.
          </AlertDescription>
        </Alert>

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
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

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="driver@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Vehicle Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Vehicle Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vehicleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VEHICLE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
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
                  name="vehicleModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Model</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Bajaj RE" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicleRegistrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Number</FormLabel>
                      <FormControl>
                        <Input placeholder="MH12AB1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seatingCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seating Capacity</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select capacity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} passengers
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* License & Documents */}
            <div>
              <h3 className="text-lg font-semibold mb-4">License & Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input placeholder="MH1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="licenseExpiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Expiry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aadharNumber"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Aadhar Card Number</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789012" maxLength={12} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem className="md:col-span-2">
                  <FormLabel className="text-base font-semibold">
                    Upload Driving License <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="image/*,.pdf"
                      required
                      disabled={uploadingLicense}
                      className={!licenseFile ? 'border-destructive' : 'border-primary'}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            setError('License file size must be less than 5MB');
                            e.target.value = '';
                            return;
                          }
                          handleLicenseUpload(file);
                        }
                      }}
                    />
                  </FormControl>
                  {uploadingLicense && (
                    <p className="text-sm mt-1 text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4 animate-spin" /> Uploading...
                    </p>
                  )}
                  {licenseFile && !uploadingLicense && (
                    <p className="text-sm mt-1 text-primary font-medium flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> {licenseFile.name} - Uploaded successfully!
                    </p>
                  )}
                  {!licenseFile && !uploadingLicense && (
                    <p className="text-sm text-destructive mt-1 font-medium">
                      Required: Upload a clear photo or PDF of your driving license (Max 5MB)
                    </p>
                  )}
                </FormItem>

                <FormItem className="md:col-span-2">
                  <FormLabel className="text-base font-semibold">
                    Upload Aadhar Card <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="image/*,.pdf"
                      required
                      disabled={uploadingAadhar}
                      className={!aadharFile ? 'border-destructive' : 'border-primary'}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            setError('Aadhar file size must be less than 5MB');
                            e.target.value = '';
                            return;
                          }
                          handleAadharUpload(file);
                        }
                      }}
                    />
                  </FormControl>
                  {uploadingAadhar && (
                    <p className="text-sm mt-1 text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4 animate-spin" /> Uploading...
                    </p>
                  )}
                  {aadharFile && !uploadingAadhar && (
                    <p className="text-sm mt-1 text-primary font-medium flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> {aadharFile.name} - Uploaded successfully!
                    </p>
                  )}
                  {!aadharFile && !uploadingAadhar && (
                    <p className="text-sm text-destructive mt-1 font-medium">
                      Required: Upload a clear photo or PDF of your Aadhar card (Max 5MB)
                    </p>
                  )}
                </FormItem>
              </div>
            </div>

            {/* Password */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Account Security</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            </div>

            {(!licenseFile || !aadharFile) && !uploadingLicense && !uploadingAadhar && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Documents Required:</strong> Both Driving License and Aadhar Card must be uploaded to create your driver account.
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !licenseFile || !aadharFile || uploadingLicense || uploadingAadhar}
            >
              {loading ? 'Creating Account...' : 'Register as Driver'}
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
          <span className="text-muted-foreground">Are you a student? </span>
          <Link href="/signup/student" className="text-primary hover:underline font-medium">
            Register as Student
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

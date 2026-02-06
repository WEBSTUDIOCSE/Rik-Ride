'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase/firebase';
import { APIBook, DocumentType } from '@/lib/firebase/services';
import { driverSignupSchema, type DriverSignupFormData } from '@/lib/validations/auth';
import { AUTH_ERROR_MESSAGES } from '@/lib/validations/error-messages';
import { Input } from '@/components/ui/input';
import PasswordInput from '@/components/ui/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, Car, Clock, Camera, User } from 'lucide-react';
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
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [licenseUrl, setLicenseUrl] = useState<string>('');
  const [aadharUrl, setAadharUrl] = useState<string>('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>('');
  const [licenseTempPath, setLicenseTempPath] = useState<string>('');
  const [aadharTempPath, setAadharTempPath] = useState<string>('');
  const [profilePhotoTempPath, setProfilePhotoTempPath] = useState<string>('');
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [uploadingAadhar, setUploadingAadhar] = useState(false);
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);
  
  const router = useRouter();

  const form = useForm<DriverSignupFormData>({
    resolver: zodResolver(driverSignupSchema),
    defaultValues: {
      displayName: '',
      email: '',
      phone: '',
      licenseExpiry: '',
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

  // Upload profile photo when selected
  const handleProfilePhotoUpload = async (file: File) => {
    setUploadingProfilePhoto(true);
    setError('');
    
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        setUploadingProfilePhoto(false);
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Profile photo must be less than 5MB');
        setUploadingProfilePhoto(false);
        return;
      }
      
      // Upload directly to storage with temporary path
      const timestamp = Date.now();
      const fileName = `profile_${timestamp}_${file.name}`;
      const tempPath = `temp_uploads/${fileName}`;
      const storageRef = ref(storage, tempPath);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setProfilePhotoUrl(downloadURL);
      setProfilePhotoTempPath(tempPath);
      setProfilePhotoFile(file);
    } catch (err) {
      console.error('Profile photo upload error:', err);
      setError('Failed to upload profile photo. Please try again.');
      setProfilePhotoFile(null);
    }
    
    setUploadingProfilePhoto(false);
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
        licenseExpiry: data.licenseExpiry,
        vehicleRegistrationNumber: data.vehicleRegistrationNumber,
        vehicleType: data.vehicleType,
        vehicleModel: data.vehicleModel,
        seatingCapacity: data.seatingCapacity,
        profilePhotoUrl: profilePhotoUrl || undefined, // Include profile photo if uploaded
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

      setSuccess('Account ban gaya! Admin verify karega aur phir tum ride dene lag jaoge! 🎉');
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
    <div className="w-full max-w-4xl px-4">
      <div className="flex flex-col md:flex-row md:items-stretch md:gap-0">
        
        {/* Left Side - Branding (Desktop Only) */}
        <div className="hidden md:flex md:w-2/5 bg-gradient-to-br from-secondary to-amber-500 rounded-l-2xl p-8 flex-col justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <Car className="h-8 w-8 text-foreground" />
              <span className="text-2xl font-bold italic tracking-wider text-foreground">
                RIKRIDE
              </span>
            </Link>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-foreground text-3xl font-bold leading-tight">
                Sadak Ka
                <br />
                <span className="text-4xl italic">Raja Ban! 🛺</span>
              </p>
            </div>
            <p className="text-foreground/80 text-base font-medium">
              Apne time pe kaam karo, apni marzi se kamao!
            </p>
            <div className="space-y-2 pt-4 text-foreground/80 text-sm">
              <p>💰 Daily earnings withdrawal</p>
              <p>🎯 Fixed fare, no haggling</p>
              <p>📱 Easy app, simple booking</p>
              <p>🔒 Verified students only</p>
            </div>
          </div>
          
          <p className="text-foreground/50 text-sm">
            &quot;50+ drivers pehle se kamaa rahe hai!&quot;
          </p>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-3/5 bg-card backdrop-blur-md border-2 border-secondary md:border-l-0 rounded-2xl md:rounded-l-none md:rounded-r-2xl p-5 md:p-8">
          
          {/* Mobile Logo */}
          <div className="text-center mb-4 md:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <Car className="h-7 w-7 text-secondary" />
              <span className="text-xl font-bold italic tracking-wider text-foreground">
                RIK<span className="text-secondary">RIDE</span>
              </span>
            </Link>
            <p className="text-foreground text-base font-bold mt-2">Sadak Ka <span className="text-secondary">Raja Ban!</span></p>
            <p className="text-muted-foreground text-xs mt-1">Apni marzi se kamao 🛺</p>
          </div>

          <div className="text-center md:text-left mb-4">
            <h1 className="text-lg md:text-xl font-bold text-foreground mb-1">Driver Registration 🛺</h1>
            <p className="text-muted-foreground text-sm">Students ko ride do, paisa kamao!</p>
          </div>

          <Alert className="mb-5 bg-secondary/20 border-secondary">
            <Clock className="h-4 w-4 text-secondary" />
            <AlertDescription className="text-muted-foreground text-sm">
              Registration ke baad admin verify karega. Approve hote hi earning shuru! 💰
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-500/20 border-red-500">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-500/20 border-green-500 text-green-400">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{success}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Personal Information */}
              <div className="bg-muted/50 rounded-xl p-4 border border-border">
                <h3 className="text-base md:text-lg font-semibold mb-4 text-secondary flex items-center gap-2">👤 Personal Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <FormField
                    control={form.control}
                    name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground text-sm">Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your full name" 
                          className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-secondary focus:ring-ring/20 h-11 md:h-12 text-base"
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
                      <FormLabel className="text-muted-foreground text-sm">Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+91 9876543210" 
                          className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-secondary focus:ring-ring/20 h-11 md:h-12 text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-muted-foreground text-sm">Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="driver@example.com" 
                          className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-secondary focus:ring-ring/20 h-11 md:h-12 text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Profile Photo (Optional) */}
            <div className="bg-muted/50 rounded-xl p-4 border border-border">
              <h3 className="text-base md:text-lg font-semibold mb-4 text-secondary flex items-center gap-2">📸 Profile Photo <span className="text-muted-foreground text-xs font-normal">(Optional)</span></h3>
              <div className="flex flex-col items-center gap-4 p-4 border border-border rounded-lg bg-muted/30">
                {/* Photo Preview */}
                <div className="relative">
                  {profilePhotoUrl ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-secondary">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={profilePhotoUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground">
                      <User className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  {uploadingProfilePhoto && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                
                {/* Upload Button */}
                <div className="flex flex-col items-center gap-2">
                  <label
                    htmlFor="profilePhoto"
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer
                      ${uploadingProfilePhoto ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'}
                    `}
                  >
                    <Camera className="h-4 w-4" />
                    {profilePhotoUrl ? 'Change Photo' : 'Upload Photo'}
                  </label>
                  <input
                    id="profilePhoto"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProfilePhotoUpload(file);
                    }}
                    className="hidden"
                    disabled={uploadingProfilePhoto}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    This photo will be shown to students during booking.
                    <br />
                    Max 5MB, JPG/PNG recommended
                  </p>
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h3 className="text-lg font-semibold mb-4 text-secondary flex items-center gap-2">🛺 Vehicle Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vehicleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Vehicle Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border text-foreground focus:border-secondary">
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-border">
                          {VEHICLE_TYPES.map((type) => (
                            <SelectItem key={type} value={type} className="text-foreground hover:bg-secondary/20">
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
                      <FormLabel className="text-muted-foreground">Vehicle Model</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Bajaj RE" className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-secondary focus:ring-ring/20" {...field} />
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
                      <FormLabel className="text-muted-foreground">Registration Number</FormLabel>
                      <FormControl>
                        <Input placeholder="MH12AB1234" className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-secondary focus:ring-ring/20" {...field} />
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
                      <FormLabel className="text-muted-foreground">Seating Capacity</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background border-border text-foreground focus:border-secondary">
                            <SelectValue placeholder="Select capacity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-border">
                          {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                            <SelectItem key={num} value={num.toString()} className="text-foreground hover:bg-secondary/20">
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
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h3 className="text-lg font-semibold mb-3 text-secondary flex items-center gap-2">📄 Documents</h3>
              <p className="text-muted-foreground text-xs mb-3">Kagaz toh dikhane padenge! 📋</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="licenseExpiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground text-sm">License Expiry</FormLabel>
                      <FormControl>
                        <Input type="date" className="bg-background border-border text-foreground focus:border-secondary focus:ring-ring/20 h-10" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* License Upload - Compact */}
                <FormItem>
                  <FormLabel className="text-muted-foreground text-sm">
                    License Photo <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="file" 
                        accept="image/*,.pdf"
                        required
                        disabled={uploadingLicense}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLicenseUpload(file);
                        }}
                        className="bg-background border-border text-foreground text-xs h-10 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-secondary file:text-foreground"
                      />
                      {licenseFile && <span className="text-green-400 text-xs">✓</span>}
                    </div>
                  </FormControl>
                  {uploadingLicense && <p className="text-xs text-secondary">Uploading...</p>}
                </FormItem>

                {/* Aadhar Upload - Compact */}
                <FormItem>
                  <FormLabel className="text-muted-foreground text-sm">
                    Aadhar Photo <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="file" 
                        accept="image/*,.pdf"
                        required
                        disabled={uploadingAadhar}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAadharUpload(file);
                        }}
                        className="bg-background border-border text-foreground text-xs h-10 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-secondary file:text-foreground"
                      />
                      {aadharFile && <span className="text-green-400 text-xs">✓</span>}
                    </div>
                  </FormControl>
                  {uploadingAadhar && <p className="text-xs text-secondary">Uploading...</p>}
                </FormItem>

                {/* Profile Photo Upload - Compact */}
                <FormItem>
                  <FormLabel className="text-muted-foreground text-sm">
                    Profile Photo <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="file" 
                        accept="image/*"
                        required
                        disabled={uploadingProfilePhoto}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleProfilePhotoUpload(file);
                        }}
                        className="bg-background border-border text-foreground text-xs h-10 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-secondary file:text-foreground"
                      />
                      {profilePhotoFile && <span className="text-green-400 text-xs">✓</span>}
                    </div>
                  </FormControl>
                  {uploadingProfilePhoto && <p className="text-xs text-secondary">Uploading...</p>}
                </FormItem>
              </div>
            </div>

            {/* Password */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h3 className="text-lg font-semibold mb-4 text-secondary flex items-center gap-2">🔐 Account Security</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Password</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder="Create a strong password" className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-secondary focus:ring-ring/20" {...field} />
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
                      <FormLabel className="text-muted-foreground">Confirm Password</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder="password dobara daalo" className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-secondary focus:ring-ring/20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {(!licenseFile || !aadharFile) && !uploadingLicense && !uploadingAadhar && (
              <Alert variant="destructive" className="bg-red-500/20 border-red-500 text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Documents Chahiye:</strong> Driving License aur Aadhar Card dono upload karo driver account ke liye.
                </AlertDescription>
              </Alert>
            )}

            <button 
              type="submit" 
              disabled={loading || !licenseFile || !aadharFile || uploadingLicense || uploadingAadhar}
              className="w-full bg-secondary text-secondary-foreground py-3 md:py-4 text-base md:text-lg font-bold uppercase tracking-wider rounded-lg hover:brightness-110 transition-all shadow-[0px_4px_0px_0px_#B8860B] active:shadow-[0px_2px_0px_0px_#B8860B] active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Ruko zara...' : 'Driver Banega Re Tu →'}
            </button>
            </form>
          </Form>

          <div className="mt-5 text-center text-muted-foreground text-sm">
            Pehle se account hai?{' '}
            <Link href="/login" className="text-secondary font-bold hover:underline">
              Login karo
            </Link>
          </div>

          <div className="mt-3 text-center text-muted-foreground text-sm">
            Student ho?{' '}
            <Link href="/signup/student" className="text-primary font-bold hover:underline">
              Student wala form bharo
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom tagline for mobile */}
      <p className="text-center text-muted-foreground text-xs mt-4 md:hidden">
        🛺 Teri Ride. Tere Rules. Teri Kamai.
      </p>
    </div>
  );
}

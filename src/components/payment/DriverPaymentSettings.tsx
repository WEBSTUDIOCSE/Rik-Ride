'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  QrCode, 
  Wallet, 
  Upload, 
  Trash2, 
  Check, 
  Loader2,
  Banknote,
  Smartphone,
  AlertCircle,
  Camera
} from 'lucide-react';
import { PaymentService } from '@/lib/firebase/services/payment.service';
import { DriverPaymentInfo, PaymentMethod } from '@/lib/types/payment.types';
import Image from 'next/image';

interface DriverPaymentSettingsProps {
  driverId: string;
}

export function DriverPaymentSettings({ driverId }: DriverPaymentSettingsProps) {
  const [paymentInfo, setPaymentInfo] = useState<DriverPaymentInfo | null>(null);
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPaymentInfo();
  }, [driverId]);

  const loadPaymentInfo = async () => {
    setLoading(true);
    try {
      const info = await PaymentService.getDriverPaymentInfo(driverId);
      setPaymentInfo(info);
      setUpiId(info?.upiId || '');
    } catch (error) {
      console.error('Error loading payment info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUpiId = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const success = await PaymentService.updateUpiId(driverId, upiId);
      if (success) {
        setMessage({ type: 'success', text: 'UPI ID saved successfully!' });
        await loadPaymentInfo();
      } else {
        setMessage({ type: 'error', text: 'Failed to save UPI ID' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save UPI ID' });
    } finally {
      setSaving(false);
    }
  };

  const handleQrUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file' });
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 2MB' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const url = await PaymentService.uploadQrCode(driverId, file);
      if (url) {
        setMessage({ type: 'success', text: 'QR code uploaded successfully!' });
        await loadPaymentInfo();
      } else {
        setMessage({ type: 'error', text: 'Failed to upload QR code' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload QR code' });
    } finally {
      setUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteQr = async () => {
    if (!confirm('Are you sure you want to delete your QR code?')) return;

    setSaving(true);
    setMessage(null);

    try {
      const success = await PaymentService.deleteQrCode(driverId);
      if (success) {
        setMessage({ type: 'success', text: 'QR code deleted' });
        await loadPaymentInfo();
      } else {
        setMessage({ type: 'error', text: 'Failed to delete QR code' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete QR code' });
    } finally {
      setSaving(false);
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH_ONLY:
        return 'Cash Only';
      case PaymentMethod.UPI:
        return 'UPI Only';
      case PaymentMethod.CASH_AND_UPI:
        return 'Cash & UPI';
      default:
        return 'Not Set';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Payment Settings
        </CardTitle>
        <CardDescription>
          Set up how you want to receive payments from students
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Current Method:</span>
          <Badge variant={paymentInfo?.paymentMethod === PaymentMethod.CASH_ONLY ? 'secondary' : 'default'}>
            {paymentInfo ? getPaymentMethodLabel(paymentInfo.paymentMethod) : 'Cash Only'}
          </Badge>
        </div>

        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription className="flex items-center gap-2">
              {message.type === 'success' ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Cash Payment Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-green-600" />
            <h3 className="font-medium">Cash Payment</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Cash payments are always accepted. Students will pay you directly at the drop location.
          </p>
        </div>

        <Separator />

        {/* UPI ID Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium">UPI ID (Optional)</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Add your UPI ID so students can pay you via Google Pay, PhonePe, Paytm, etc.
          </p>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="upiId" className="sr-only">UPI ID</Label>
              <Input
                id="upiId"
                type="text"
                placeholder="yourname@upi or 9876543210@paytm"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleSaveUpiId} 
              disabled={saving || !upiId.trim()}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Save</span>
            </Button>
          </div>
          
          {paymentInfo?.upiId && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Current: {paymentInfo.upiId}
            </p>
          )}
        </div>

        <Separator />

        {/* QR Code Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-purple-600" />
            <h3 className="font-medium">Payment QR Code (Optional)</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload your GPay/PhonePe/Paytm QR code. This will be shown to students at drop location.
          </p>

          {/* QR Preview */}
          {paymentInfo?.qrCodeUrl && (
            <div className="relative">
              <div className="relative w-48 h-48 border rounded-lg overflow-hidden bg-white mx-auto">
                <Image
                  src={paymentInfo.qrCodeUrl}
                  alt="Payment QR Code"
                  fill
                  className="object-contain p-2"
                  unoptimized
                  priority
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleDeleteQr}
                disabled={saving}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleQrUpload}
              className="hidden"
              id="qr-upload"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full max-w-xs"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  {paymentInfo?.qrCodeUrl ? (
                    <Camera className="h-4 w-4 mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {paymentInfo?.qrCodeUrl ? 'Change QR Code' : 'Upload QR Code'}
                </>
              )}
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            Supported: JPG, PNG, WEBP (Max 2MB)
          </p>
        </div>

        <Separator />

        {/* Tips */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-sm">💡 Tips</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• You can update your UPI ID or QR code anytime</li>
            <li>• Make sure your QR code is clear and scannable</li>
            <li>• Students will see your QR at the drop location</li>
            <li>• Cash is always accepted as backup</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

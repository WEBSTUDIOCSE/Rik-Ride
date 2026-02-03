'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  QrCode, 
  Banknote, 
  Smartphone,
  Loader2,
  Check,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { PaymentService } from '@/lib/firebase/services/payment.service';
import { DriverPaymentInfo, PaymentMethod } from '@/lib/types/payment.types';
import Image from 'next/image';

interface RidePaymentDisplayProps {
  driverId: string;
  driverName: string;
  fare: number;
  bookingId: string;
  onPaymentConfirmed?: () => void;
}

export function RidePaymentDisplay({ 
  driverId, 
  driverName, 
  fare,
  bookingId,
  onPaymentConfirmed 
}: RidePaymentDisplayProps) {
  const [paymentInfo, setPaymentInfo] = useState<DriverPaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadPaymentInfo();
  }, [driverId]);

  const loadPaymentInfo = async () => {
    setLoading(true);
    try {
      console.log('Loading payment info for driver:', driverId);
      const info = await PaymentService.getDriverPaymentInfo(driverId);
      console.log('Payment info loaded:', info);
      setPaymentInfo(info);
    } catch (error) {
      console.error('Error loading payment info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUpi = async () => {
    if (paymentInfo?.upiId) {
      await navigator.clipboard.writeText(paymentInfo.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirmPayment = async (method: 'CASH' | 'UPI') => {
    setConfirming(true);
    try {
      await PaymentService.markPaymentCollected(bookingId, method);
      onPaymentConfirmed?.();
    } catch (error) {
      console.error('Error confirming payment:', error);
    } finally {
      setConfirming(false);
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

  const hasUpiOption = paymentInfo?.upiId || paymentInfo?.qrCodeUrl;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">Pay {driverName}</CardTitle>
        <CardDescription>Your ride is complete!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fare Display */}
        <div className="text-center py-4 bg-primary/5 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Total Fare</p>
          <p className="text-4xl font-bold text-primary">₹{fare}</p>
        </div>

        {/* Payment Options */}
        <div className="space-y-4">
          {/* Cash Option (Always Available) */}
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-green-600" />
                <span className="font-medium">Pay Cash</span>
              </div>
              <Badge variant="secondary">Always Available</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Hand cash directly to the driver
            </p>
          </div>

          {/* UPI/QR Option */}
          {hasUpiOption && (
            <>
              <div className="text-center text-sm text-muted-foreground">
                — OR —
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Pay via UPI</span>
                </div>

                {/* QR Code */}
                {paymentInfo?.qrCodeUrl && (
                  <div className="flex justify-center">
                    <div className="relative w-48 h-48 border rounded-lg overflow-hidden bg-white">
                      <Image
                        src={paymentInfo.qrCodeUrl}
                        alt="Payment QR Code"
                        fill
                        className="object-contain p-2"
                        unoptimized
                        priority
                      />
                    </div>
                  </div>
                )}

                {/* UPI ID */}
                {paymentInfo?.upiId && (
                  <div className="space-y-2">
                    <p className="text-sm text-center text-muted-foreground">
                      {paymentInfo.qrCodeUrl ? 'Or use UPI ID:' : 'Pay to UPI ID:'}
                    </p>
                    <div className="flex items-center justify-center gap-2 bg-muted rounded-lg p-3">
                      <code className="text-sm font-mono">{paymentInfo.upiId}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyUpi}
                        className="h-8 px-2"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-center text-muted-foreground">
                  Scan QR or pay to UPI ID using any UPI app
                </p>
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Confirm Payment Buttons */}
        <div className="space-y-2">
          <p className="text-sm text-center text-muted-foreground">
            After paying, confirm your payment method:
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleConfirmPayment('CASH')}
              disabled={confirming}
            >
              {confirming ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Banknote className="h-4 w-4 mr-2" />
              )}
              Paid Cash
            </Button>
            {hasUpiOption && (
              <Button
                variant="default"
                className="flex-1"
                onClick={() => handleConfirmPayment('UPI')}
                disabled={confirming}
              >
                {confirming ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Smartphone className="h-4 w-4 mr-2" />
                )}
                Paid via UPI
              </Button>
            )}
          </div>
        </div>

        {/* Note */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Payment confirmation helps us track completed rides
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for showing payment method before booking
interface DriverPaymentBadgeProps {
  driverId: string;
  compact?: boolean;
}

export function DriverPaymentBadge({ driverId, compact = false }: DriverPaymentBadgeProps) {
  const [paymentInfo, setPaymentInfo] = useState<DriverPaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentInfo();
  }, [driverId]);

  const loadPaymentInfo = async () => {
    try {
      const info = await PaymentService.getDriverPaymentInfo(driverId);
      setPaymentInfo(info);
    } catch (error) {
      // Ignore errors for badge
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  const hasUpi = paymentInfo?.upiId || paymentInfo?.qrCodeUrl;

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Banknote className="h-3 w-3" />
        <span>Cash</span>
        {hasUpi && (
          <>
            <span>•</span>
            <QrCode className="h-3 w-3" />
            <span>UPI</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Badge variant="outline" className="text-xs">
        <Banknote className="h-3 w-3 mr-1" />
        Cash
      </Badge>
      {hasUpi && (
        <Badge variant="secondary" className="text-xs">
          <QrCode className="h-3 w-3 mr-1" />
          UPI
        </Badge>
      )}
    </div>
  );
}

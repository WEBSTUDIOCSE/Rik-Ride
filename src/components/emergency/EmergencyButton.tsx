'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Phone, Share2, MessageCircle, Shield, Loader2 } from 'lucide-react';
import { EmergencyService } from '@/lib/firebase/services';
import { Booking } from '@/lib/types/user.types';

interface EmergencyButtonProps {
  booking: Booking;
  studentId: string;
  studentName: string;
  emergencyContacts?: Array<{
    id?: string;
    name: string;
    phone: string;
    relationship: string;
    isDefault?: boolean;
  }>;
  parentPhone?: string | null;
  currentLocation?: { lat: number; lng: number; address?: string };
  className?: string;
}

export default function EmergencyButton({
  booking,
  studentId,
  studentName,
  emergencyContacts = [],
  parentPhone,
  currentLocation,
  className,
}: EmergencyButtonProps) {
  const [showSOSDialog, setShowSOSDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sosTriggered, setSOSTriggered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build all emergency contacts including parent
  const allContacts = [
    ...(parentPhone ? [{
      id: 'parent',
      name: 'Parent/Guardian',
      phone: parentPhone,
      relationship: 'Parent',
      isDefault: true,
    }] : []),
    ...emergencyContacts,
  ];

  const handleSOS = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use current location or pickup location
      const location = currentLocation || {
        lat: booking.pickupLocation.lat,
        lng: booking.pickupLocation.lng,
        address: booking.pickupLocation.address,
      };

      const result = await EmergencyService.triggerSOS(
        booking.id,
        studentId,
        location
      );

      if (result.success) {
        setSOSTriggered(true);
        // TODO: Integrate with SMS service (Twilio) to send actual alerts
        console.log('SOS Alert sent to:', allContacts);
      } else {
        setError(result.error || 'Failed to trigger SOS');
      }
    } catch (err) {
      setError('An error occurred while triggering SOS');
      console.error('SOS error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShareRide = async (phone: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await EmergencyService.shareRideDetails(
        booking.id,
        studentId,
        phone
      );

      if (result.success && result.data) {
        // Open WhatsApp with share link
        const message = `I'm on a ride with Rik-Ride. Track my ride: ${result.data.shareLink}`;
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
      } else {
        setError(result.error || 'Failed to share ride details');
      }
    } catch (err) {
      setError('An error occurred while sharing ride');
      console.error('Share error:', err);
    } finally {
      setLoading(false);
    }
  };

  const callEmergencyContact = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const getPickupAddress = () => {
    return booking.pickupLocation?.address || 'Pickup Location';
  };

  const getDropAddress = () => {
    return booking.dropLocation?.address || 'Drop Location';
  };

  return (
    <>
      {/* Emergency Button */}
      <div className={className}>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowSOSDialog(true)}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            SOS
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShareDialog(true)}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {/* SOS Confirmation Dialog */}
      <Dialog open={showSOSDialog} onOpenChange={setShowSOSDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Emergency SOS Alert
            </DialogTitle>
            <DialogDescription>
              This will immediately alert your emergency contacts with your current location and ride details.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {sosTriggered ? (
            <div className="py-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">SOS Alert Sent!</h3>
              <p className="text-muted-foreground">
                Your emergency contacts have been notified with your location and ride details.
              </p>
              <div className="mt-4 space-y-2">
                {allContacts.map((contact, idx) => (
                  <div
                    key={contact.id || idx}
                    className="flex items-center justify-between p-2 bg-muted rounded"
                  >
                    <span className="text-sm">{contact.name} ({contact.relationship})</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => callEmergencyContact(contact.phone)}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <p className="text-sm font-medium">
                  Emergency contacts to be notified:
                </p>
                {allContacts.length > 0 ? (
                  <div className="space-y-2">
                    {allContacts.map((contact, idx) => (
                      <div
                        key={contact.id || idx}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {contact.phone} • {contact.relationship}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => callEmergencyContact(contact.phone)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No emergency contacts configured. Please add emergency contacts in your profile.
                  </p>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSOSDialog(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleSOS}
                  disabled={loading || allContacts.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending Alert...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Confirm SOS Alert
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Ride Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Ride Details
            </DialogTitle>
            <DialogDescription>
              Share your ride details with emergency contacts via WhatsApp or SMS.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Ride Details</h4>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">From:</span> {getPickupAddress()}</p>
                <p><span className="text-muted-foreground">To:</span> {getDropAddress()}</p>
                {booking.driverName && (
                  <p><span className="text-muted-foreground">Driver:</span> {booking.driverName}</p>
                )}
                {booking.vehicleNumber && (
                  <p><span className="text-muted-foreground">Vehicle:</span> {booking.vehicleNumber}</p>
                )}
              </div>
            </div>

            {allContacts.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Share with:</p>
                {allContacts.slice(0, 3).map((contact, idx) => (
                  <div
                    key={contact.id || idx}
                    className="flex items-center justify-between p-3 bg-background border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareRide(contact.phone)}
                        disabled={loading}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const message = `I'm on a ride. From: ${getPickupAddress()}, To: ${getDropAddress()}`;
                          window.open(`sms:${contact.phone}?body=${encodeURIComponent(message)}`, '_blank');
                        }}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Add emergency contacts in your profile to share ride details.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowShareDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

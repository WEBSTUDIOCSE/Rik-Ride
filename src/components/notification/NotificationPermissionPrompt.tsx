/**
 * Notification Permission Prompt Component
 * Asks users to enable push notifications
 */

'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationService } from '@/lib/firebase/services/notification.service';

interface NotificationPermissionPromptProps {
  userId: string;
  userType: 'student' | 'driver' | 'admin';
  onPermissionChange?: (granted: boolean) => void;
  variant?: 'card' | 'inline' | 'banner';
  showDismiss?: boolean;
}

export function NotificationPermissionPrompt({
  userId,
  userType,
  onPermissionChange,
  variant = 'card',
  showDismiss = true,
}: NotificationPermissionPromptProps) {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported' | 'loading'>('loading');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('notification-prompt-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    // Check current permission status
    const status = NotificationService.getPermissionStatus();
    setPermissionStatus(status);
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      const token = await NotificationService.requestPermissionAndGetToken(userId, userType);
      
      if (token) {
        setPermissionStatus('granted');
        onPermissionChange?.(true);
      } else {
        setPermissionStatus(NotificationService.getPermissionStatus());
        onPermissionChange?.(false);
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      setError('Failed to enable notifications. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('notification-prompt-dismissed', 'true');
  };

  // Don't show if dismissed, already granted, or unsupported
  if (isDismissed || permissionStatus === 'granted' || permissionStatus === 'unsupported' || permissionStatus === 'loading') {
    return null;
  }

  // Don't show if permanently denied
  if (permissionStatus === 'denied') {
    return null;
  }

  if (variant === 'banner') {
    return (
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-3">
        <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <p className="text-sm">
              Get notified about ride updates, driver arrivals, and more!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleRequestPermission}
              disabled={isRequesting}
            >
              {isRequesting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Enable
            </Button>
            {showDismiss && (
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-between gap-4 p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <span className="text-sm">Enable notifications for ride updates</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRequestPermission}
          disabled={isRequesting}
        >
          {isRequesting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Enable'
          )}
        </Button>
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Enable Notifications</CardTitle>
              <CardDescription>
                Stay updated on your rides
              </CardDescription>
            </div>
          </div>
          {showDismiss && (
            <Button size="icon" variant="ghost" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="text-sm text-muted-foreground space-y-2">
          {userType === 'student' ? (
            <>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Know when your driver accepts the ride
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Get notified when driver arrives
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Receive ride completion alerts
              </li>
            </>
          ) : userType === 'driver' ? (
            <>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Never miss a booking request
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Get payment confirmations
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Receive rating updates
              </li>
            </>
          ) : (
            <>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Get alerts for pending verifications
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Monitor platform activity
              </li>
            </>
          )}
        </ul>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button
          className="w-full"
          onClick={handleRequestPermission}
          disabled={isRequesting}
        >
          {isRequesting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Enabling...
            </>
          ) : (
            <>
              <Bell className="h-4 w-4 mr-2" />
              Enable Notifications
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Notification Status Badge
 * Shows current notification status with option to enable/disable
 */
interface NotificationStatusBadgeProps {
  userId: string;
  userType: 'student' | 'driver' | 'admin';
}

export function NotificationStatusBadge({ userId, userType }: NotificationStatusBadgeProps) {
  const [status, setStatus] = useState<NotificationPermission | 'unsupported' | 'loading'>('loading');
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    setStatus(NotificationService.getPermissionStatus());
  }, []);

  const handleToggle = async () => {
    if (status === 'granted') {
      // Can't revoke programmatically - direct to settings
      alert('To disable notifications, please update your browser settings.');
      return;
    }

    setIsRequesting(true);
    try {
      const token = await NotificationService.requestPermissionAndGetToken(userId, userType);
      if (token) {
        setStatus('granted');
      } else {
        setStatus(NotificationService.getPermissionStatus());
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  if (status === 'loading' || status === 'unsupported') {
    return null;
  }

  return (
    <Button
      variant={status === 'granted' ? 'outline' : 'secondary'}
      size="sm"
      onClick={handleToggle}
      disabled={isRequesting}
      className="gap-2"
    >
      {isRequesting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : status === 'granted' ? (
        <Bell className="h-4 w-4 text-green-600" />
      ) : (
        <BellOff className="h-4 w-4 text-muted-foreground" />
      )}
      {status === 'granted' ? 'Notifications On' : 'Enable Notifications'}
    </Button>
  );
}

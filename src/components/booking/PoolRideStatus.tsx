'use client';

/**
 * Pool Ride Status Component
 * Shows the status of a pool ride the student is part of:
 * - Waiting for more passengers
 * - Pool ready, searching for driver
 * - Driver assigned, pickup in progress
 * - Ride in progress
 */

import { useState, useEffect } from 'react';
import {
  APIBook,
  PoolStatus,
  ParticipantStatus,
  POOL_CONFIG,
} from '@/lib/firebase/services';
import type { PoolRide } from '@/lib/firebase/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Users,
  Clock,
  MapPin,
  Phone,
  IndianRupee,
  Loader2,
  XCircle,
  CheckCircle,
  Car,
  Navigation,
  User,
  AlertTriangle,
} from 'lucide-react';

interface PoolRideStatusProps {
  poolId: string;
  studentId: string;
  onPoolComplete?: () => void;
  onPoolCancelled?: () => void;
  onSelectDriver?: () => void;
}

export default function PoolRideStatus({
  poolId,
  studentId,
  onPoolComplete,
  onPoolCancelled,
  onSelectDriver,
}: PoolRideStatusProps) {
  const [pool, setPool] = useState<PoolRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const isCreator = pool?.createdBy === studentId;

  // Subscribe to pool updates
  useEffect(() => {
    const unsubscribe = APIBook.pool.subscribeToPool(poolId, (updatedPool) => {
      if (updatedPool) {
        setPool(updatedPool);
        if (updatedPool.status === PoolStatus.COMPLETED) {
          onPoolComplete?.();
        } else if (
          updatedPool.status === PoolStatus.CANCELLED ||
          updatedPool.status === PoolStatus.EXPIRED
        ) {
          onPoolCancelled?.();
        }
      } else {
        onPoolCancelled?.();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [poolId, onPoolComplete, onPoolCancelled]);

  const handleLeavePool = async () => {
    setLeaving(true);
    setError('');
    try {
      const result = await APIBook.pool.leavePool(poolId, studentId);
      if (result.success) {
        onPoolCancelled?.();
      } else {
        setError(result.error || 'Failed to leave pool');
      }
    } catch {
      setError('Error leaving pool');
    }
    setLeaving(false);
  };

  const handleStartPool = async () => {
    setStarting(true);
    setError('');
    try {
      const result = await APIBook.pool.markPoolReady(poolId, studentId);
      if (!result.success) {
        setError(result.error || 'Failed to start pool');
      }
    } catch {
      setError('Error starting pool');
    }
    setStarting(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading pool status...</p>
        </CardContent>
      </Card>
    );
  }

  if (!pool) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-yellow-500" />
          <p className="text-foreground/70">Pool ride not found</p>
        </CardContent>
      </Card>
    );
  }

  const myParticipant = pool.participants.find((p) => p.studentId === studentId);
  const otherParticipants = pool.participants.filter(
    (p) => p.studentId !== studentId && p.status !== ParticipantStatus.CANCELLED
  );

  const getStatusConfig = () => {
    switch (pool.status) {
      case PoolStatus.WAITING:
        return {
          icon: <Users className="h-6 w-6" />,
          title: 'Waiting for Riders',
          subtitle: `${pool.occupiedSeats}/${pool.maxSeats} seats filled — waiting for more students`,
          color: 'text-yellow-500',
          bg: 'bg-yellow-500/10 border-yellow-500/20',
          pulse: true,
        };
      case PoolStatus.READY:
        return {
          icon: <CheckCircle className="h-6 w-6" />,
          title: 'Pool Ready!',
          subtitle: pool.createdBy === studentId
            ? `${pool.occupiedSeats} riders joined — select a driver to start the ride`
            : `${pool.occupiedSeats} riders joined — waiting for pool creator to select a driver`,
          color: 'text-blue-500',
          bg: 'bg-blue-500/10 border-blue-500/20',
          pulse: true,
        };
      case PoolStatus.DRIVER_ASSIGNED:
        return {
          icon: <Car className="h-6 w-6" />,
          title: 'Driver Assigned!',
          subtitle: `${pool.driverName} is coming to pick everyone up`,
          color: 'text-green-500',
          bg: 'bg-green-500/10 border-green-500/20',
          pulse: false,
        };
      case PoolStatus.PICKUP_IN_PROGRESS:
        return {
          icon: <Navigation className="h-6 w-6" />,
          title: 'Picking Up Riders',
          subtitle: 'Driver is picking up pool passengers',
          color: 'text-blue-500',
          bg: 'bg-blue-500/10 border-blue-500/20',
          pulse: false,
        };
      case PoolStatus.IN_PROGRESS:
        return {
          icon: <Car className="h-6 w-6" />,
          title: 'Ride in Progress 🚀',
          subtitle: 'All picked up — on the way!',
          color: 'text-green-500',
          bg: 'bg-green-500/10 border-green-500/20',
          pulse: false,
        };
      case PoolStatus.COMPLETED:
        return {
          icon: <CheckCircle className="h-6 w-6" />,
          title: 'Ride Completed! 🎉',
          subtitle: 'Thanks for pooling!',
          color: 'text-green-500',
          bg: 'bg-green-500/10 border-green-500/20',
          pulse: false,
        };
      case PoolStatus.CANCELLED:
        return {
          icon: <XCircle className="h-6 w-6" />,
          title: 'Pool Cancelled',
          subtitle: 'This pool ride was cancelled',
          color: 'text-red-500',
          bg: 'bg-red-500/10 border-red-500/20',
          pulse: false,
        };
      case PoolStatus.EXPIRED:
        return {
          icon: <Clock className="h-6 w-6" />,
          title: 'Pool Expired',
          subtitle: 'Not enough riders joined in time',
          color: 'text-muted-foreground',
          bg: 'bg-muted/30 border-border',
          pulse: false,
        };
      default:
        return {
          icon: <Users className="h-6 w-6" />,
          title: 'Pool Status',
          subtitle: '',
          color: 'text-muted-foreground',
          bg: 'bg-muted/30 border-border',
          pulse: false,
        };
    }
  };

  const status = getStatusConfig();

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className={`flex items-center gap-4 p-4 rounded-xl border ${status.bg}`}>
            <div className={`${status.color} ${status.pulse ? 'animate-pulse' : ''}`}>
              {status.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">{status.title}</h3>
              <p className="text-sm text-muted-foreground">{status.subtitle}</p>
            </div>
            {pool.status === PoolStatus.WAITING && (
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{pool.availableSeats}</p>
                <p className="text-[10px] text-muted-foreground">seats left</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seat Progress */}
      {(pool.status === PoolStatus.WAITING || pool.status === PoolStatus.READY) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Seats</span>
              <span className="text-sm text-muted-foreground">{pool.occupiedSeats}/{pool.maxSeats}</span>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: pool.maxSeats }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-3 rounded-full transition-colors ${
                    i < pool.occupiedSeats ? 'bg-green-500' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            {!pool.isImmediate && (
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Pool ride in progress
              </p>
            )}

            {/* Start Pool button - only for creator when WAITING with 2+ riders */}
            {isCreator && pool.status === PoolStatus.WAITING && 
              pool.participants.filter(p => p.status !== ParticipantStatus.CANCELLED).length >= POOL_CONFIG.minParticipants && (
              <Button
                onClick={handleStartPool}
                disabled={starting}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
              >
                {starting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 mr-2" />
                    Start Pool with {pool.participants.filter(p => p.status !== ParticipantStatus.CANCELLED).length} Riders
                  </>
                )}
              </Button>
            )}

            {/* Select Driver button - for creator when pool is READY */}
            {isCreator && pool.status === PoolStatus.READY && onSelectDriver && (
              <Button
                onClick={onSelectDriver}
                className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Car className="h-4 w-4 mr-2" />
                Select Driver for Pool Ride
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Participants */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Pool Riders ({pool.participants.filter(p => p.status !== ParticipantStatus.CANCELLED).length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* You */}
          {myParticipant && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  You
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{myParticipant.studentName} (You)</p>
                <p className="text-xs text-muted-foreground truncate">
                  {myParticipant.pickupLocation.address}
                </p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {myParticipant.status === ParticipantStatus.PICKED_UP ? '✅ Picked up' :
                 myParticipant.status === ParticipantStatus.DROPPED_OFF ? '🏁 Dropped off' :
                 '⏳ Waiting'}
              </Badge>
            </div>
          )}

          {/* Other participants */}
          {otherParticipants.map((p) => (
            <div key={p.studentId} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-muted text-foreground text-xs">
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{p.studentName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {p.pickupLocation.address}
                </p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {p.status === ParticipantStatus.PICKED_UP ? '✅ Picked up' :
                 p.status === ParticipantStatus.DROPPED_OFF ? '🏁 Dropped off' :
                 '⏳ Waiting'}
              </Badge>
            </div>
          ))}

          {/* Empty seats */}
          {pool.availableSeats > 0 && pool.status === PoolStatus.WAITING && (
            <div className="flex items-center gap-3 p-3 border border-dashed border-border rounded-lg opacity-50">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <User className="h-3 w-3 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {pool.availableSeats} seat{pool.availableSeats > 1 ? 's' : ''} available...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver Info */}
      {pool.driverId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-4 w-4" />
              Your Driver
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{pool.driverName}</p>
                  {pool.vehicleNumber && (
                    <p className="text-sm text-muted-foreground">{pool.vehicleNumber}</p>
                  )}
                </div>
              </div>
              {pool.driverPhone && (
                <a href={`tel:${pool.driverPhone}`}>
                  <Button variant="outline" size="icon" className="border-green-500/30 text-green-500 hover:bg-green-500/10">
                    <Phone className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fare Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Your Pool Fare</span>
            <span className="flex items-center gap-1 text-lg font-bold text-green-600 dark:text-green-400">
              <IndianRupee className="h-4 w-4" />
              {myParticipant?.totalFare.toFixed(0) || pool.farePerSeat.toFixed(0)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">Solo fare would be</span>
            <span className="text-xs text-muted-foreground line-through">₹{pool.baseFare.toFixed(0)}</span>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Leave Pool */}
      {(pool.status === PoolStatus.WAITING || pool.status === PoolStatus.READY) && (
        <Button
          variant="outline"
          onClick={handleLeavePool}
          disabled={leaving}
          className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10"
        >
          {leaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Leaving...
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 mr-2" />
              Leave Pool
            </>
          )}
        </Button>
      )}
    </div>
  );
}

'use client';

/**
 * Driver Pool Ride Manager
 * Shows pool ride requests for drivers:
 * - Available pool rides needing drivers
 * - Active pool ride with multi-pickup management
 * - Sequential pickup/dropoff tracking
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
  CheckCircle,
  Car,
  Navigation,
  User,
  ArrowDown,
  ChevronRight,
} from 'lucide-react';

interface DriverPoolManagerProps {
  driverId: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  onPoolComplete?: () => void;
}

export default function DriverPoolManager({
  driverId,
  driverName,
  driverPhone,
  vehicleNumber,
  onPoolComplete,
}: DriverPoolManagerProps) {
  const [availablePools, setAvailablePools] = useState<PoolRide[]>([]);
  const [activePool, setActivePool] = useState<PoolRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Subscribe to available pools (READY status)
  useEffect(() => {
    const unsubscribe = APIBook.pool.subscribeToAvailablePools((pools) => {
      setAvailablePools(pools);
      setLoading(false);
    });

    // Also check for driver's active pool
    const checkActivePool = async () => {
      const result = await APIBook.pool.getDriverActivePool(driverId);
      if (result.success && result.data) {
        const active = result.data;
        if (active) {
          setActivePool(active);
          // Subscribe to active pool updates
          const poolUnsub = APIBook.pool.subscribeToPool(active.id, (updated) => {
            if (updated) {
              setActivePool(updated);
              if (updated.status === PoolStatus.COMPLETED) {
                setActivePool(null);
                onPoolComplete?.();
              }
            } else {
              setActivePool(null);
            }
          });
          return poolUnsub;
        }
      }
      return null;
    };

    let activeUnsub: (() => void) | null = null;
    checkActivePool().then((unsub) => {
      activeUnsub = unsub;
    });

    return () => {
      unsubscribe();
      if (activeUnsub) activeUnsub();
    };
  }, [driverId, onPoolComplete]);

  // Accept a pool ride
  const handleAcceptPool = async (pool: PoolRide) => {
    setActionLoading(pool.id);
    setError('');
    try {
      const result = await APIBook.pool.acceptPoolRide(
        pool.id,
        driverId,
        driverName,
        driverPhone,
        vehicleNumber
      );
      if (result.success) {
        setActivePool({ ...pool, status: PoolStatus.DRIVER_ASSIGNED, driverId, driverName, driverPhone, vehicleNumber });
        // Subscribe to updates
        APIBook.pool.subscribeToPool(pool.id, (updated) => {
          if (updated) {
            setActivePool(updated);
            if (updated.status === PoolStatus.COMPLETED) {
              setActivePool(null);
              onPoolComplete?.();
            }
          }
        });
      } else {
        setError(result.error || 'Failed to accept pool ride');
      }
    } catch {
      setError('Error accepting pool ride');
    }
    setActionLoading(null);
  };

  // Pick up a participant
  const handlePickup = async (studentId: string) => {
    if (!activePool) return;
    setActionLoading(studentId);
    setError('');
    try {
      const result = await APIBook.pool.pickupParticipant(activePool.id, studentId);
      if (!result.success) {
        setError(result.error || 'Failed to mark pickup');
      }
    } catch {
      setError('Error marking pickup');
    }
    setActionLoading(null);
  };

  // Drop off a participant
  const handleDropoff = async (studentId: string) => {
    if (!activePool) return;
    setActionLoading(studentId);
    setError('');
    try {
      const result = await APIBook.pool.dropoffParticipant(activePool.id, studentId);
      if (!result.success) {
        setError(result.error || 'Failed to mark dropoff');
      }
    } catch {
      setError('Error marking dropoff');
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground text-sm">Loading pool rides...</span>
        </CardContent>
      </Card>
    );
  }

  // Show active pool ride management
  if (activePool) {
    const activeParticipants = activePool.participants.filter(
      (p) => p.status !== ParticipantStatus.CANCELLED
    );
    const sortedForPickup = [...activeParticipants].sort((a, b) => a.pickupOrder - b.pickupOrder);
    const sortedForDropoff = [...activeParticipants].sort((a, b) => a.dropoffOrder - b.dropoffOrder);
    const allPickedUp = activeParticipants.every(
      (p) => p.status === ParticipantStatus.PICKED_UP || p.status === ParticipantStatus.DROPPED_OFF
    );
    const showDropoffs = allPickedUp || activePool.status === PoolStatus.IN_PROGRESS;

    return (
      <div className="space-y-4">
        {/* Pool Status Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-green-500/10">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold">Pool Ride Active</h3>
                <p className="text-sm text-muted-foreground">
                  {activeParticipants.length} passenger{activeParticipants.length > 1 ? 's' : ''}
                </p>
              </div>
              <Badge className="ml-auto bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
                {activePool.status === PoolStatus.DRIVER_ASSIGNED && 'Go to Pickups'}
                {activePool.status === PoolStatus.PICKUP_IN_PROGRESS && 'Picking Up'}
                {activePool.status === PoolStatus.IN_PROGRESS && 'In Progress'}
              </Badge>
            </div>

            {/* Earnings */}
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
              <span className="text-sm text-muted-foreground">Total Earnings</span>
              <span className="flex items-center gap-1 font-bold text-lg text-green-600 dark:text-green-400">
                <IndianRupee className="h-4 w-4" />
                {(activePool.baseFare * (1 + POOL_CONFIG.driverPoolBonus)).toFixed(0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Pickup Sequence */}
        {!showDropoffs && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Navigation className="h-4 w-4 text-blue-500" />
                Pickup Order
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sortedForPickup.map((p, index) => {
                const isPickedUp = p.status === ParticipantStatus.PICKED_UP || p.status === ParticipantStatus.DROPPED_OFF;
                return (
                  <div key={p.studentId}>
                    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      isPickedUp
                        ? 'bg-green-500/5 border-green-500/20'
                        : 'bg-card border-border'
                    }`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        isPickedUp
                          ? 'bg-green-500 text-white'
                          : 'bg-muted text-foreground'
                      }`}>
                        {isPickedUp ? '✓' : index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{p.studentName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          📍 {p.pickupLocation.address}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {p.studentPhone && (
                          <a href={`tel:${p.studentPhone}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Phone className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        )}
                        {!isPickedUp && (
                          <Button
                            size="sm"
                            onClick={() => handlePickup(p.studentId)}
                            disabled={actionLoading === p.studentId}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                          >
                            {actionLoading === p.studentId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Picked Up'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    {index < sortedForPickup.length - 1 && (
                      <div className="flex justify-center py-1">
                        <ArrowDown className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Dropoff Sequence */}
        {showDropoffs && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" />
                Dropoff Order
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sortedForDropoff.map((p, index) => {
                const isDroppedOff = p.status === ParticipantStatus.DROPPED_OFF;
                return (
                  <div key={p.studentId}>
                    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      isDroppedOff
                        ? 'bg-green-500/5 border-green-500/20'
                        : 'bg-card border-border'
                    }`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        isDroppedOff
                          ? 'bg-green-500 text-white'
                          : 'bg-muted text-foreground'
                      }`}>
                        {isDroppedOff ? '✓' : index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{p.studentName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          📍 {p.dropLocation.address}
                        </p>
                      </div>
                      {!isDroppedOff && (
                        <Button
                          size="sm"
                          onClick={() => handleDropoff(p.studentId)}
                          disabled={actionLoading === p.studentId}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs shrink-0"
                        >
                          {actionLoading === p.studentId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Dropped Off'
                          )}
                        </Button>
                      )}
                    </div>
                    {index < sortedForDropoff.length - 1 && (
                      <div className="flex justify-center py-1">
                        <ArrowDown className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Show available pool rides
  return (
    <div className="space-y-4">
      {availablePools.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-foreground/70 text-sm">No pool rides available right now</p>
            <p className="text-xs text-muted-foreground mt-1">Pool requests will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-green-500" />
            <h3 className="text-sm font-semibold">{availablePools.length} Pool Ride{availablePools.length > 1 ? 's' : ''} Available</h3>
          </div>
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
              {error}
            </div>
          )}
          {availablePools.map((pool) => {
            const participants = pool.participants.filter(
              (p) => p.status !== ParticipantStatus.CANCELLED
            );
            return (
              <Card key={pool.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-sm">
                        {pool.occupiedSeats} passenger{pool.occupiedSeats > 1 ? 's' : ''}
                      </span>
                    </div>
                    <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
                      {pool.status === PoolStatus.READY ? 'Ready' : 'Waiting'}
                    </Badge>
                  </div>

                  {/* Route */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      </div>
                      <p className="text-xs text-muted-foreground">{pool.route.generalPickupArea.address}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      </div>
                      <p className="text-xs text-muted-foreground">{pool.route.generalDropArea.address}</p>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm">
                      <IndianRupee className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {(pool.baseFare * (1 + POOL_CONFIG.driverPoolBonus)).toFixed(0)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">earning</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptPool(pool)}
                      disabled={actionLoading === pool.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {actionLoading === pool.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Accept Pool
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}

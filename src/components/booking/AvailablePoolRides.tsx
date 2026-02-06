'use client';

/**
 * Available Pool Rides Marketplace
 * Shows all open pool rides to students so they can discover and join them
 */

import { useState, useEffect } from 'react';
import { APIBook, PoolStatus, POOL_CONFIG } from '@/lib/firebase/services';
import type { PoolRide } from '@/lib/firebase/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  MapPin,
  IndianRupee,
  Loader2,
  AlertCircle,
  Navigation,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';

interface AvailablePoolRidesProps {
  studentId: string;
  studentName: string;
  studentPhone: string;
  onJoinPool?: (poolId: string) => void;
}

export default function AvailablePoolRides({
  studentId,
  studentName,
  studentPhone,
  onJoinPool,
}: AvailablePoolRidesProps) {
  const [pools, setPools] = useState<PoolRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Subscribe to all available pool rides
  useEffect(() => {
    const unsubscribe = APIBook.pool.subscribeToAvailablePools((availablePools) => {
      // Filter out pools where this student is already a participant
      const filtered = availablePools.filter(
        (pool) =>
          !pool.participants.some((p) => p.studentId === studentId) &&
          pool.availableSeats > 0
      );
      setPools(filtered);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [studentId]);

  const handleQuickJoin = async (pool: PoolRide) => {
    // For quick join, we use the pool's general pickup/drop areas
    setJoiningId(pool.id);
    setError('');
    try {
      const result = await APIBook.pool.joinPool(
        pool.id,
        studentId,
        studentName,
        studentPhone,
        pool.route.generalPickupArea,
        pool.route.generalDropArea,
        1
      );
      if (result.success) {
        onJoinPool?.(pool.id);
      } else {
        setError(result.error || 'Failed to join pool');
      }
    } catch {
      setError('Error joining pool');
    }
    setJoiningId(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground text-sm">Loading available pools...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {pools.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-foreground/70 mb-1">No pool rides available right now</p>
            <p className="text-xs text-muted-foreground">
              Create a new pool or check back soon!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <h3 className="text-sm font-semibold">
                {pools.length} Pool{pools.length > 1 ? 's' : ''} Available
              </h3>
            </div>
            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 text-xs">
              Save up to {(POOL_CONFIG.poolDiscount * 100).toFixed(0)}%
            </Badge>
          </div>

          <div className="space-y-3">
            {pools.map((pool) => {
              const participants = pool.participants.filter(
                (p) => p.status !== 'cancelled'
              );
              const firstParticipant = participants[0];
              
              return (
                <Card key={pool.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {pool.route.routeDirection || 'Pool Ride'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {pool.occupiedSeats}/{pool.maxSeats} seats filled
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          pool.status === PoolStatus.READY
                            ? 'border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/5'
                            : 'border-yellow-500/30 text-yellow-600 dark:text-yellow-400 bg-yellow-500/5'
                        }
                      >
                        {pool.status === PoolStatus.READY ? 'Ready' : 'Waiting'}
                      </Badge>
                    </div>

                    {/* Route */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5 shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                            From
                          </p>
                          <p className="text-xs text-foreground truncate">
                            {pool.route.generalPickupArea.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5 shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                            To
                          </p>
                          <p className="text-xs text-foreground truncate">
                            {pool.route.generalDropArea.address}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Participants Preview */}
                    {participants.length > 0 && (
                      <div className="mb-3 p-2 bg-muted/30 rounded-lg">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                          Riders
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {participants.slice(0, 3).map((p, idx) => (
                            <Badge key={p.studentId} variant="outline" className="text-[10px] py-0 px-1.5">
                              {p.studentName.split(' ')[0]}
                            </Badge>
                          ))}
                          {participants.length > 3 && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                              +{participants.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <Separator className="my-3" />

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1 text-sm">
                          <IndianRupee className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="font-bold text-green-600 dark:text-green-400">
                            {pool.farePerSeat.toFixed(0)}
                          </span>
                          <span className="text-xs text-muted-foreground">/seat</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Save ₹{(pool.baseFare - pool.farePerSeat).toFixed(0)} vs solo
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleQuickJoin(pool)}
                        disabled={joiningId === pool.id}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs"
                      >
                        {joiningId === pool.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            Join Pool
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <Navigation className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Quick Join: </span>
              Tapping "Join Pool" will use the pool's general pickup/drop areas. For custom pickup/drop locations, create a new pool from the booking form.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

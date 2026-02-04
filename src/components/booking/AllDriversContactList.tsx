'use client';

import { useState, useEffect } from 'react';
import { APIBook } from '@/lib/firebase/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, Star, Car, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { VerificationStatus } from '@/lib/types/user.types';

interface DriverContact {
  uid: string;
  displayName: string;
  phone?: string | null;
  vehicleRegistrationNumber?: string;
  rating?: number;
  totalRides?: number;
  profileImage?: string;
}

interface AllDriversContactListProps {
  showByDefault?: boolean;
  compact?: boolean;
}

export function AllDriversContactList({ showByDefault = false, compact = false }: AllDriversContactListProps) {
  const [drivers, setDrivers] = useState<DriverContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(showByDefault);

  useEffect(() => {
    const fetchDrivers = async () => {
      setLoading(true);
      try {
        const result = await APIBook.driver.getDriversByStatus(VerificationStatus.APPROVED, 50);
        if (result.success && result.data) {
          setDrivers(result.data.map(driver => ({
            uid: driver.uid,
            displayName: driver.displayName,
            phone: driver.phone,
            vehicleRegistrationNumber: driver.vehicleRegistrationNumber,
            rating: driver.rating,
            totalRides: driver.totalRides,
          })));
        }
      } catch (error) {
        console.error('Error fetching drivers:', error);
      }
      setLoading(false);
    };

    if (expanded) {
      fetchDrivers();
    }
  }, [expanded]);

  if (!expanded && !showByDefault) {
    return (
      <Button 
        variant="outline" 
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-2"
      >
        <Users className="h-4 w-4" />
        Show All Drivers Contact List
        <ChevronDown className="h-4 w-4" />
      </Button>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className={compact ? "pb-2" : ""}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-secondary" />
              All Drivers
            </CardTitle>
            {!showByDefault && (
              <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
                <ChevronUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-9 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (drivers.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No verified drivers available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className={compact ? "pb-2" : ""}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-secondary" />
              All Drivers ({drivers.length})
            </CardTitle>
            <CardDescription className="mt-1">
              Contact any driver directly for your ride
            </CardDescription>
          </div>
          {!showByDefault && (
            <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {drivers.map((driver) => (
          <div 
            key={driver.uid} 
            className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
          >
            <Avatar className="h-10 w-10 border-2 border-secondary/30">
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {driver.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{driver.displayName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {driver.rating && driver.rating > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-secondary text-secondary" />
                    {driver.rating.toFixed(1)}
                  </span>
                )}
                {driver.totalRides !== undefined && (
                  <span>• {driver.totalRides} rides</span>
                )}
                {driver.vehicleRegistrationNumber && (
                  <span className="flex items-center gap-0.5">
                    <Car className="h-3 w-3" />
                    {driver.vehicleRegistrationNumber}
                  </span>
                )}
              </div>
            </div>
            {driver.phone && (
              <Button 
                size="sm" 
                variant="outline"
                asChild
                className="shrink-0"
              >
                <a href={`tel:${driver.phone}`}>
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </a>
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default AllDriversContactList;

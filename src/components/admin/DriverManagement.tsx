'use client';

import { useState, useEffect } from 'react';
import { APIBook, type DriverProfile, VerificationStatus, DriverStatus } from '@/lib/firebase/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {  
  Car,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Star,
  DollarSign,
  ArrowLeft,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MapPin
} from 'lucide-react';
import Link from 'next/link';

interface DriverManagementProps {
  adminUid: string;
}

export default function DriverManagement({ adminUid }: DriverManagementProps) {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | VerificationStatus>('all');
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);

  const fetchDrivers = async () => {
    setRefreshing(true);
    const result = await APIBook.admin.getAllDrivers();
    
    if (result.success && result.data) {
      setDrivers(result.data);
      applyFilters(result.data, searchQuery, statusFilter);
    }
    
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const applyFilters = (
    driverList: DriverProfile[],
    search: string,
    status: 'all' | VerificationStatus
  ) => {
    let filtered = driverList;

    // Apply status filter
    if (status !== 'all') {
      filtered = filtered.filter((d) => d.verificationStatus === status);
    }

    // Apply search filter
    if (search.trim() !== '') {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (driver) =>
          driver.displayName.toLowerCase().includes(query) ||
          driver.email.toLowerCase().includes(query) ||
          driver.licenseNumber.toLowerCase().includes(query) ||
          driver.vehicleType.toLowerCase().includes(query) ||
          driver.vehicleRegistrationNumber.toLowerCase().includes(query)
      );
    }

    setFilteredDrivers(filtered);
  };

  useEffect(() => {
    applyFilters(drivers, searchQuery, statusFilter);
  }, [searchQuery, statusFilter, drivers]);

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.APPROVED:
        return <Badge><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case VerificationStatus.PENDING:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case VerificationStatus.REJECTED:
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    }
  };

  const getOnlineStatusBadge = (status: DriverStatus) => {
    return status === DriverStatus.ONLINE ? (
      <Badge>Online</Badge>
    ) : (
      <Badge variant="secondary">Offline</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (selectedDriver) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => setSelectedDriver(null)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to List
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{selectedDriver.displayName}</CardTitle>
                  <CardDescription>License: {selectedDriver.licenseNumber}</CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                {getStatusBadge(selectedDriver.verificationStatus)}
                {getOnlineStatusBadge(selectedDriver.onlineStatus)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="font-semibold mb-3">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {selectedDriver.email}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {selectedDriver.phone}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Joined</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {selectedDriver.createdAt && !isNaN(new Date(selectedDriver.createdAt).getTime()) 
                      ? new Date(selectedDriver.createdAt).toLocaleDateString('en-IN')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Rating</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    {selectedDriver.rating.toFixed(1)} ({selectedDriver.totalRatings} reviews)
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Vehicle Information */}
            <div>
              <h3 className="font-semibold mb-3">Vehicle Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Vehicle Type</Label>
                  <p className="font-medium">{selectedDriver.vehicleType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Model</Label>
                  <p className="font-medium">{selectedDriver.vehicleModel}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Registration Number</Label>
                  <p className="font-medium">{selectedDriver.vehicleRegistrationNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Seating Capacity</Label>
                  <p className="font-medium">{selectedDriver.seatingCapacity} passengers</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* License & Documents */}
            <div>
              <h3 className="font-semibold mb-3">License & Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">License Number</Label>
                  <p className="font-medium">{selectedDriver.licenseNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">License Expiry</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {selectedDriver.licenseExpiry && !isNaN(new Date(selectedDriver.licenseExpiry).getTime())
                      ? new Date(selectedDriver.licenseExpiry).toLocaleDateString('en-IN')
                      : 'N/A'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground">Aadhar Card Number</Label>
                  <p className="font-medium">{selectedDriver.aadharNumber}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Ride Stats */}
            <div>
              <h3 className="font-semibold mb-3">Performance Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Car className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Rides</p>
                        <p className="text-2xl font-bold">{selectedDriver.totalRides}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-8 w-8" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Earnings</p>
                        <p className="text-2xl font-bold">₹{selectedDriver.totalEarnings}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Star className="h-8 w-8" />
                      <div>
                        <p className="text-sm text-muted-foreground">Average Rating</p>
                        <p className="text-2xl font-bold">{selectedDriver.rating.toFixed(1)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Verification Info */}
            {selectedDriver.verificationNotes && (
              <div>
                <h3 className="font-semibold mb-3">Verification Notes</h3>
                <Alert>
                  <AlertDescription>{selectedDriver.verificationNotes}</AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Manage Drivers</h1>
            <p className="text-sm text-muted-foreground">
              Total Drivers: {drivers.length}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={fetchDrivers}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter Drivers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by name, email, license, or vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              size="sm"
            >
              All ({drivers.length})
            </Button>
            <Button
              variant={statusFilter === VerificationStatus.PENDING ? 'default' : 'outline'}
              onClick={() => setStatusFilter(VerificationStatus.PENDING)}
              size="sm"
            >
              Pending ({drivers.filter(d => d.verificationStatus === VerificationStatus.PENDING).length})
            </Button>
            <Button
              variant={statusFilter === VerificationStatus.APPROVED ? 'default' : 'outline'}
              onClick={() => setStatusFilter(VerificationStatus.APPROVED)}
              size="sm"
            >
              Approved ({drivers.filter(d => d.verificationStatus === VerificationStatus.APPROVED).length})
            </Button>
            <Button
              variant={statusFilter === VerificationStatus.REJECTED ? 'default' : 'outline'}
              onClick={() => setStatusFilter(VerificationStatus.REJECTED)}
              size="sm"
            >
              Rejected ({drivers.filter(d => d.verificationStatus === VerificationStatus.REJECTED).length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Drivers List */}
      <div className="grid gap-4">
        {filteredDrivers.length === 0 ? (
          <Alert>
            <Car className="h-4 w-4" />
            <AlertDescription>
              {searchQuery || statusFilter !== 'all' 
                ? 'No drivers found matching your filters.' 
                : 'No drivers registered yet.'}
            </AlertDescription>
          </Alert>
        ) : (
          filteredDrivers.map((driver) => (
            <Card key={driver.uid} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Car className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{driver.displayName}</h3>
                        {getStatusBadge(driver.verificationStatus)}
                        {getOnlineStatusBadge(driver.onlineStatus)}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{driver.vehicleType} - {driver.vehicleModel}</span>
                        <span>•</span>
                        <span>{driver.vehicleRegistrationNumber}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {driver.email}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {driver.phone}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {driver.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Rides</p>
                      <p className="font-semibold">{driver.totalRides}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Earnings</p>
                      <p className="font-semibold">₹{driver.totalEarnings}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedDriver(driver)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

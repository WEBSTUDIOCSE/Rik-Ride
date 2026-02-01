'use client';

import { useState, useEffect } from 'react';
import { APIBook, type DashboardStats, type DriverProfile, VerificationStatus } from '@/lib/firebase/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Car, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Activity,
  LogOut,
  Shield,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AdminDashboardProps {
  adminEmail: string;
  adminUid: string;
}

export default function AdminDashboard({ adminEmail, adminUid }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingDrivers, setPendingDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    setRefreshing(true);
    
    const [statsResult, driversResult] = await Promise.all([
      APIBook.admin.getDashboardStats(),
      APIBook.admin.getPendingVerifications(),
    ]);

    if (statsResult.success && statsResult.data) {
      setStats(statsResult.data);
    }

    if (driversResult.success && driversResult.data) {
      setPendingDrivers(driversResult.data);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await APIBook.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  const handleApprove = async (driverId: string) => {
    const result = await APIBook.admin.approveDriver(driverId, adminUid, 'Documents verified successfully');
    if (result.success) {
      fetchData();
    }
  };

  const handleReject = async (driverId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      const result = await APIBook.admin.rejectDriver(driverId, adminUid, reason);
      if (result.success) {
        fetchData();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">{adminEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <Separator />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">Registered students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDrivers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.onlineDrivers || 0} online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingVerifications || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Verified Drivers</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.approvedDrivers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.rejectedDrivers || 0} rejected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link href="/admin/verify-drivers">
          <Button>
            <Clock className="h-4 w-4 mr-2" />
            Verify Drivers
          </Button>
        </Link>
        <Link href="/admin/students">
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Manage Students
          </Button>
        </Link>
        <Link href="/admin/drivers">
          <Button variant="outline">
            <Car className="h-4 w-4 mr-2" />
            Manage Drivers
          </Button>
        </Link>
      </div>

      {/* Pending Verifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Driver Verifications
          </CardTitle>
          <CardDescription>
            Review and approve driver registrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingDrivers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4" />
              <p>No pending verifications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingDrivers.slice(0, 5).map((driver) => (
                <div 
                  key={driver.uid} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Car className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{driver.displayName}</p>
                      <p className="text-sm text-muted-foreground">{driver.email}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{driver.vehicleType}</Badge>
                        <Badge variant="outline">{driver.vehicleRegistrationNumber}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {driver.documents.length} documents
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleApprove(driver.uid)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleReject(driver.uid)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
              {pendingDrivers.length > 5 && (
                <div className="text-center">
                  <Link href="/admin/verify-drivers">
                    <Button variant="link">
                      View all {pendingDrivers.length} pending verifications
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

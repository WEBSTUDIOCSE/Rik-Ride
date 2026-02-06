'use client';

import { useState, useEffect } from 'react';
import { APIBook, type DashboardStats, type DriverProfile, VerificationStatus } from '@/lib/firebase/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Car, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Shield,
  LogOut,
  RefreshCw,
  Star,
  LayoutDashboard,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme';

interface AdminDashboardProps {
  adminEmail: string;
  adminUid: string;
}

type TabKey = 'overview' | 'students' | 'drivers' | 'verify' | 'ratings';

const tabs: { key: TabKey; label: string; icon: typeof LayoutDashboard; href?: string }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'students', label: 'Students', icon: Users, href: '/admin/students' },
  { key: 'drivers', label: 'Drivers', icon: Car, href: '/admin/drivers' },
  { key: 'verify', label: 'Verify', icon: UserCheck, href: '/admin/verify-drivers' },
  { key: 'ratings', label: 'Ratings', icon: Star, href: '/admin/ratings' },
];

export default function AdminDashboard({ adminEmail, adminUid }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingDrivers, setPendingDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
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

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.href) {
      router.push(tab.href);
    } else {
      setActiveTab(tab.key);
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
    <div className="min-h-screen pb-20 md:pb-4">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="text-sm bg-primary/20 text-primary font-semibold">
                <Shield className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="text-base font-semibold truncate">Admin Panel</h1>
              <p className="text-xs text-muted-foreground truncate">{adminEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={fetchData}
              disabled={refreshing}
              className="h-9 w-9"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9 text-red-400 hover:text-red-500 hover:bg-red-500/10">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-4 space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-lg font-bold">{stats?.totalStudents || 0}</p>
            <p className="text-[11px] text-muted-foreground">Students</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Car className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-lg font-bold">{stats?.totalDrivers || 0}</p>
            <p className="text-[11px] text-muted-foreground">Drivers</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-3.5 w-3.5 text-yellow-500" />
            </div>
            <p className="text-lg font-bold">{stats?.pendingVerifications || 0}</p>
            <p className="text-[11px] text-muted-foreground">Pending</p>
          </div>
          <div className="hidden md:block bg-card border border-border rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-lg font-bold">{stats?.approvedDrivers || 0}</p>
            <p className="text-[11px] text-muted-foreground">Verified</p>
          </div>
          <div className="hidden md:block bg-card border border-border rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Car className="h-3.5 w-3.5 text-green-500" />
            </div>
            <p className="text-lg font-bold">{stats?.onlineDrivers || 0}</p>
            <p className="text-[11px] text-muted-foreground">Online</p>
          </div>
        </div>

        {/* Desktop Tab Bar (hidden on mobile, shown on md+) */}
        <div className="hidden md:flex items-center gap-1 bg-card border border-border rounded-xl p-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Additional Stats - Mobile only */}
              <div className="grid grid-cols-2 gap-2 md:hidden">
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      Verified
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.approvedDrivers || 0}</div>
                    <p className="text-xs text-muted-foreground">Approved drivers</p>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Car className="h-4 w-4 text-green-500" />
                      Online
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.onlineDrivers || 0}</div>
                    <p className="text-xs text-muted-foreground">Active now</p>
                  </CardContent>
                </Card>
              </div>

              {/* Pending Verifications */}
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Pending Verifications
                    </CardTitle>
                    {pendingDrivers.length > 0 && (
                      <Badge variant="secondary">{pendingDrivers.length}</Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    Review and approve driver registrations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingDrivers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No pending verifications</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingDrivers.slice(0, 5).map((driver) => (
                        <div 
                          key={driver.uid} 
                          className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/admin/verify-drivers?driver=${driver.uid}`)}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <Car className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{driver.displayName}</p>
                              <p className="text-xs text-muted-foreground truncate">{driver.vehicleType} • {driver.vehicleRegistrationNumber}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-2 shrink-0">
                            {driver.documents.length} docs
                          </Badge>
                        </div>
                      ))}
                      {pendingDrivers.length > 5 && (
                        <div className="text-center pt-2">
                          <Button 
                            variant="link" 
                            size="sm"
                            onClick={() => router.push('/admin/verify-drivers')}
                            className="text-xs"
                          >
                            View all {pendingDrivers.length} pending →
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>


 
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation (visible only on mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border safe-bottom">
        <div className="grid grid-cols-5 gap-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab)}
                className={`flex flex-col items-center justify-center py-2.5 px-1 transition-colors relative ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground active:text-foreground'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-primary' : ''}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

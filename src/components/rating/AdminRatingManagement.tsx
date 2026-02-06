/**
 * Admin Rating Management Component
 * For viewing and managing all ratings and reports
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Star,
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Search,
  User,
  Clock,
  Ban,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import StarRating from './StarRating';
import {
  RatingService,
  type Rating,
  type Report,
  RatingType,
  ReportStatus,
  formatReportCategory,
  formatReportStatus,
  getRatingColor,
  RATING_THRESHOLDS,
} from '@/lib/firebase/services';
import { cn } from '@/lib/utils';

interface AdminRatingManagementProps {
  adminId: string;
}

export default function AdminRatingManagement({ adminId }: AdminRatingManagementProps) {
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [lowRatedUsers, setLowRatedUsers] = useState<{
    drivers: { userId: string; name: string; rating: number; totalRatings: number }[];
    students: { userId: string; name: string; rating: number; totalRatings: number }[];
  }>({ drivers: [], students: [] });
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [resolution, setResolution] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter states
  const [ratingFilter, setRatingFilter] = useState<'all' | 'low' | 'high'>('all');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'driver' | 'student'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load pending reports
      const reportsResult = await RatingService.getAllPendingReports();
      if (reportsResult.success && reportsResult.data) {
        setReports(reportsResult.data);
      }

      // Load all ratings
      const ratingsResult = await RatingService.getAllRatings({}, 100);
      if (ratingsResult.success && ratingsResult.data) {
        setRatings(ratingsResult.data);
      }

      // Load low-rated drivers
      const lowDriversResult = await RatingService.getLowRatedUsers(RatingType.DRIVER);
      const lowStudentsResult = await RatingService.getLowRatedUsers(RatingType.STUDENT);
      
      setLowRatedUsers({
        drivers: lowDriversResult.success && lowDriversResult.data ? lowDriversResult.data : [],
        students: lowStudentsResult.success && lowStudentsResult.data ? lowStudentsResult.data : [],
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportClick = (report: Report) => {
    setSelectedReport(report);
    setAdminNotes(report.adminNotes || '');
    setResolution(report.resolution || '');
    setReportDialogOpen(true);
  };

  const handleUpdateReportStatus = async (newStatus: ReportStatus) => {
    if (!selectedReport) return;

    setIsUpdating(true);
    try {
      const result = await RatingService.updateReportStatus(
        selectedReport.id,
        newStatus,
        adminId,
        adminNotes,
        resolution
      );

      if (result.success) {
        setReportDialogOpen(false);
        loadData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating report:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getFilteredRatings = () => {
    let filtered = ratings;

    if (ratingFilter === 'low') {
      filtered = filtered.filter(r => r.rating <= 2);
    } else if (ratingFilter === 'high') {
      filtered = filtered.filter(r => r.rating >= 4);
    }

    if (userTypeFilter !== 'all') {
      filtered = filtered.filter(r => 
        userTypeFilter === 'driver' 
          ? r.rateeType === RatingType.DRIVER 
          : r.rateeType === RatingType.STUDENT
      );
    }

    return filtered;
  };

  const getStatusBadge = (status: ReportStatus) => {
    const styles = {
      [ReportStatus.PENDING]: 'bg-yellow-100 text-yellow-700',
      [ReportStatus.UNDER_REVIEW]: 'bg-blue-100 text-blue-700',
      [ReportStatus.RESOLVED]: 'bg-green-100 text-green-700',
      [ReportStatus.DISMISSED]: 'bg-muted text-foreground',
    };

    return (
      <Badge className={styles[status]}>
        {formatReportStatus(status)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Flag className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reports.length}</p>
                <p className="text-sm text-muted-foreground">Pending Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <Star className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{ratings.length}</p>
                <p className="text-sm text-muted-foreground">Total Ratings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowRatedUsers.drivers.length}</p>
                <p className="text-sm text-muted-foreground">Low-Rated Drivers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-full">
                <User className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowRatedUsers.students.length}</p>
                <p className="text-sm text-muted-foreground">Low-Rated Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Reports ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="ratings" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            All Ratings
          </TabsTrigger>
          <TabsTrigger value="lowrated" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Low Ratings
          </TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-lg font-medium">No pending reports</p>
                <p className="text-muted-foreground">All reports have been handled</p>
              </CardContent>
            </Card>
          ) : (
            reports.map((report) => (
              <Card
                key={report.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleReportClick(report)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(report.status)}
                        <Badge variant="outline">
                          {formatReportCategory(report.category)}
                        </Badge>
                      </div>
                      <p className="font-medium">
                        {report.reporterName} reported {report.reportedUserName}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {report.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                        <span>Booking: {report.bookingId.substring(0, 8)}...</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Ratings Tab */}
        <TabsContent value="ratings" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={ratingFilter} onValueChange={(v) => setRatingFilter(v as typeof ratingFilter)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="low">Low (1-2)</SelectItem>
                      <SelectItem value="high">High (4-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select value={userTypeFilter} onValueChange={(v) => setUserTypeFilter(v as typeof userTypeFilter)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="User Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="driver">Drivers</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Rating List */}
          <div className="space-y-4">
            {getFilteredRatings().map((rating) => (
              <Card key={rating.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <StarRating value={rating.rating} readonly size="sm" />
                        <span className={cn('font-semibold', getRatingColor(rating.rating))}>
                          {rating.rating}/5
                        </span>
                        <Badge variant="outline">
                          {rating.rateeType === RatingType.DRIVER ? 'Driver' : 'Student'}
                        </Badge>
                      </div>
                      <p className="font-medium">
                        {rating.raterName} → {rating.rateeName}
                      </p>
                      {rating.review && (
                        <p className="text-sm text-muted-foreground">
                          &quot;{rating.review}&quot;
                        </p>
                      )}
                      {rating.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {rating.tags.map((tag) => (
                            <Badge
                              key={tag.id}
                              variant={tag.category === 'positive' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {tag.label}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(rating.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Low Rated Tab */}
        <TabsContent value="lowrated" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Users with ratings below {RATING_THRESHOLDS.WARNING_THRESHOLD} stars (minimum 3 ratings) are listed here. This tab shows two separate sections: one for drivers and one for students.
            </AlertDescription>
          </Alert>

          {/* Low Rated Drivers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Low-Rated Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              {lowRatedUsers.drivers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No low-rated drivers
                </p>
              ) : (
                <div className="space-y-3">
                  {lowRatedUsers.drivers.map((driver) => (
                    <div
                      key={driver.userId}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">{driver.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {driver.totalRatings} reviews
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={cn('text-lg font-bold', getRatingColor(driver.rating))}>
                            {driver.rating.toFixed(1)}
                          </p>
                          <StarRating value={driver.rating} readonly size="sm" />
                        </div>
                        <Button size="sm" variant="destructive">
                          <Ban className="h-4 w-4 mr-1" />
                          Warn
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Rated Students */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Low-Rated Students</CardTitle>
            </CardHeader>
            <CardContent>
              {lowRatedUsers.students.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No low-rated students
                </p>
              ) : (
                <div className="space-y-3">
                  {lowRatedUsers.students.map((student) => (
                    <div
                      key={student.userId}
                      className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.totalRatings} reviews
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={cn('text-lg font-bold', getRatingColor(student.rating))}>
                            {student.rating.toFixed(1)}
                          </p>
                          <StarRating value={student.rating} readonly size="sm" />
                        </div>
                        <Button size="sm" variant="outline">
                          <Ban className="h-4 w-4 mr-1" />
                          Warn
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Detail Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Review and take action on this report
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Reporter</p>
                  <p className="font-medium">{selectedReport.reporterName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reported User</p>
                  <p className="font-medium">{selectedReport.reportedUserName}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <Badge>{formatReportCategory(selectedReport.category)}</Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm bg-muted p-3 rounded-lg">{selectedReport.description}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Admin Notes</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this report..."
                  rows={3}
                />
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Resolution</p>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="What action was taken..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleUpdateReportStatus(ReportStatus.DISMISSED)}
              disabled={isUpdating}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Dismiss
            </Button>
            <Button
              variant="default"
              onClick={() => handleUpdateReportStatus(ReportStatus.UNDER_REVIEW)}
              disabled={isUpdating}
            >
              Under Review
            </Button>
            <Button
              variant="default"
              className="bg-green-600 hover:bg-primary/80"
              onClick={() => handleUpdateReportStatus(ReportStatus.RESOLVED)}
              disabled={isUpdating}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { APIBook, type DriverProfile, type DriverDocument, DocumentType, VerificationStatus, DriverStatus } from '@/lib/firebase/services';
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
  IndianRupee,
  ArrowLeft,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  FileText,
  Check,
  Shield,
  Download,
  X
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface DriverManagementProps {
  adminUid: string;
}

export default function DriverManagement({ adminUid }: DriverManagementProps) {
  const searchParams = useSearchParams();
  const driverIdFromUrl = searchParams.get('driver');
  
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | VerificationStatus>('all');
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
  const [previewDocument, setPreviewDocument] = useState<DriverDocument | null>(null);
  const [verifyingDocId, setVerifyingDocId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch specific driver if ID is in URL
  useEffect(() => {
    const fetchSpecificDriver = async () => {
      if (driverIdFromUrl && !selectedDriver) {
        setLoading(true);
        const result = await APIBook.driver.getDriver(driverIdFromUrl);
        if (result.success && result.data) {
          setSelectedDriver(result.data as DriverProfile);
        }
        setLoading(false);
      }
    };
    
    fetchSpecificDriver();
  }, [driverIdFromUrl]);

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

  const handleVerifyDocument = async (driverId: string, documentId: string) => {
    setVerifyingDocId(documentId);
    
    try {
      const result = await APIBook.admin.verifyDocument(driverId, documentId, adminUid);
      
      if (result.success && selectedDriver) {
        // Refresh driver data
        const updatedDriver = await APIBook.driver.getDriver(driverId);
        if (updatedDriver.success && updatedDriver.data) {
          setSelectedDriver(updatedDriver.data as DriverProfile);
        }
      }
    } catch (err) {
      console.error('Failed to verify document:', err);
    }
    
    setVerifyingDocId(null);
  };

  const handleApprove = async (driver: DriverProfile) => {
    setActionLoading(true);
    const result = await APIBook.admin.approveDriver(
      driver.uid, 
      adminUid, 
      'All documents verified successfully'
    );
    
    if (result.success) {
      // Refresh driver data
      const updatedDriver = await APIBook.driver.getDriver(driver.uid);
      if (updatedDriver.success && updatedDriver.data) {
        setSelectedDriver(updatedDriver.data as DriverProfile);
      }
    }
    setActionLoading(false);
  };

  const handleReject = async (driver: DriverProfile) => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    const result = await APIBook.admin.rejectDriver(driver.uid, adminUid, rejectReason);
    
    if (result.success) {
      // Refresh driver data
      const updatedDriver = await APIBook.driver.getDriver(driver.uid);
      if (updatedDriver.success && updatedDriver.data) {
        setSelectedDriver(updatedDriver.data as DriverProfile);
      }
      setRejectReason('');
    }
    setActionLoading(false);
  };

  const getDocumentLabel = (type: DocumentType) => {
    const labels: Record<DocumentType, string> = {
      [DocumentType.DRIVING_LICENSE]: 'Driving License',
      [DocumentType.VEHICLE_RC]: 'Vehicle RC',
      [DocumentType.INSURANCE]: 'Insurance',
      [DocumentType.ID_PROOF]: 'ID Proof (Aadhar)',
      [DocumentType.VEHICLE_PHOTO]: 'Vehicle Photo',
    };
    return labels[type] || type;
  };

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
      <div className="min-h-screen pb-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border mb-4">
          <div className="flex items-center gap-3 px-4 md:px-6 py-3 max-w-6xl mx-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedDriver(null)}
              className="h-9 w-9 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-semibold truncate">{selectedDriver.displayName}</h1>
              <p className="text-xs text-muted-foreground truncate">License: {selectedDriver.licenseNumber}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              {getStatusBadge(selectedDriver.verificationStatus)}
              {getOnlineStatusBadge(selectedDriver.onlineStatus)}
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-4 max-w-6xl mx-auto">
          <Card className="border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 shrink-0">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">{selectedDriver.displayName}</CardTitle>
                  <CardDescription className="text-xs">License: {selectedDriver.licenseNumber}</CardDescription>
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

            {/* Uploaded Documents */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Uploaded Documents
              </h3>
              {selectedDriver.documents.length === 0 ? (
                <Alert>
                  <AlertDescription>No documents uploaded yet</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {selectedDriver.documents.map((doc) => {
                    const isVerified = !!doc.verifiedAt;
                    const isVerifying = verifyingDocId === doc.id;
                    
                    // Check file type from both URL and fileName
                    const fileNameLower = doc.fileName?.toLowerCase() || '';
                    const urlLower = doc.url.toLowerCase();
                    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fileNameLower) || 
                                   /\.(jpg|jpeg|png|gif|webp|bmp|svg)/i.test(urlLower);
                    const isPDF = /\.pdf$/i.test(fileNameLower) || /\.pdf/i.test(urlLower);
                    
                    return (
                      <Card key={doc.id} className={isVerified ? 'border-primary' : ''}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Document Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{getDocumentLabel(doc.type)}</p>
                                    {isVerified && (
                                      <Badge variant="default" className="flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        Verified
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Uploaded: {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                                    {isVerified && doc.verifiedAt && (
                                      <> • Verified: {new Date(doc.verifiedAt).toLocaleDateString('en-IN')}</>
                                    )}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">{doc.fileName}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {!isVerified && selectedDriver.verificationStatus === VerificationStatus.PENDING && (
                                  <Button 
                                    variant="default"
                                    size="sm" 
                                    onClick={() => handleVerifyDocument(selectedDriver.uid, doc.id)}
                                    disabled={isVerifying}
                                  >
                                    {isVerifying ? (
                                      <>
                                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                        Verifying...
                                      </>
                                    ) : (
                                      <>
                                        <Check className="h-4 w-4 mr-1" />
                                        Verify
                                      </>
                                    )}
                                  </Button>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setPreviewDocument(previewDocument?.id === doc.id ? null : doc)}
                                >
                                  {previewDocument?.id === doc.id ? (
                                    <>
                                      <X className="h-4 w-4 mr-1" />
                                      Hide
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-4 w-4 mr-1" />
                                      Preview
                                    </>
                                  )}
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                  <a href={doc.url} download target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              </div>
                            </div>
                            
                            {/* Document Preview */}
                            {previewDocument?.id === doc.id && (
                              <div className="mt-3 p-2 border rounded-lg bg-muted/50">
                                {isImage ? (
                                  <div className="relative w-full">
                                    <img 
                                      src={doc.url} 
                                      alt={getDocumentLabel(doc.type)}
                                      className="w-full max-h-[600px] object-contain rounded"
                                      onError={(e) => {
                                        // Fallback if image fails to load
                                        e.currentTarget.style.display = 'none';
                                        const parent = e.currentTarget.parentElement;
                                        if (parent) {
                                          parent.innerHTML = `
                                            <div class="text-center py-8">
                                              <p class="text-sm text-muted-foreground mb-2">Failed to load image</p>
                                              <a href="${doc.url}" target="_blank" class="text-primary hover:underline">Open in new tab</a>
                                            </div>
                                          `;
                                        }
                                      }}
                                    />
                                  </div>
                                ) : isPDF ? (
                                  <div className="w-full">
                                    <iframe 
                                      src={`${doc.url}#toolbar=0`}
                                      className="w-full h-[600px] rounded border-0"
                                      title={getDocumentLabel(doc.type)}
                                    />
                                    <div className="mt-2 text-center">
                                      <Button variant="link" asChild size="sm">
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                          Open PDF in new tab for better viewing
                                        </a>
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-8">
                                    <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm font-medium mb-1">Document Preview</p>
                                    <p className="text-xs text-muted-foreground mb-4">
                                      {doc.fileName}
                                    </p>
                                    <div className="flex gap-2 justify-center">
                                      <Button variant="default" asChild>
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                          <Eye className="h-4 w-4 mr-2" />
                                          Open in new tab
                                        </a>
                                      </Button>
                                      <Button variant="outline" asChild>
                                        <a href={doc.url} download>
                                          <Download className="h-4 w-4 mr-2" />
                                          Download
                                        </a>
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {/* Document Verification Summary */}
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>
                        {selectedDriver.documents.filter(d => d.verifiedAt).length} of {selectedDriver.documents.length} documents verified
                      </strong>
                      {selectedDriver.documents.every(d => d.verifiedAt) && (
                        <span className="text-primary"> • All documents verified!</span>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
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
                      <IndianRupee className="h-8 w-8 text-primary" />
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
                <Alert variant={selectedDriver.verificationStatus === VerificationStatus.REJECTED ? 'destructive' : 'default'}>
                  <AlertDescription>{selectedDriver.verificationNotes}</AlertDescription>
                </Alert>
              </div>
            )}

            {/* Approve/Reject Actions - Only for Pending Drivers */}
            {selectedDriver.verificationStatus === VerificationStatus.PENDING && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold">Verification Actions</h3>
                  
                  {/* Check if all documents are verified */}
                  {selectedDriver.documents.length > 0 && !selectedDriver.documents.every(d => d.verifiedAt) && (
                    <Alert>
                      <AlertDescription>
                        <strong>Note:</strong> Please verify all documents before approving the driver.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="rejectReason">Rejection Reason (optional)</Label>
                      <Input
                        id="rejectReason"
                        placeholder="Enter reason if rejecting..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        variant="default"
                        onClick={() => handleApprove(selectedDriver)}
                        disabled={actionLoading || selectedDriver.documents.length === 0 || !selectedDriver.documents.every(d => d.verifiedAt)}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {actionLoading ? 'Processing...' : 'Approve Driver'}
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => handleReject(selectedDriver)}
                        disabled={actionLoading || !rejectReason.trim()}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {actionLoading ? 'Processing...' : 'Reject Driver'}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border mb-4">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-base md:text-xl font-semibold truncate">Manage Drivers</h1>
              <p className="text-xs text-muted-foreground">
                {filteredDrivers.length} {filteredDrivers.length === 1 ? 'driver' : 'drivers'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchDrivers}
            disabled={refreshing}
            className="h-9 w-9 shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="px-4 md:px-6 space-y-4 max-w-6xl mx-auto">
        {/* Search & Filters */}
        <div className="bg-card border border-border rounded-xl p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Search by name, email, license, or vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 text-sm border-0 bg-transparent focus-visible:ring-0 p-0"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              size="sm"
              className="text-xs h-7"
            >
              All ({drivers.length})
            </Button>
            <Button
              variant={statusFilter === VerificationStatus.PENDING ? 'default' : 'outline'}
              onClick={() => setStatusFilter(VerificationStatus.PENDING)}
              size="sm"
              className="text-xs h-7"
            >
              Pending ({drivers.filter(d => d.verificationStatus === VerificationStatus.PENDING).length})
            </Button>
            <Button
              variant={statusFilter === VerificationStatus.APPROVED ? 'default' : 'outline'}
              onClick={() => setStatusFilter(VerificationStatus.APPROVED)}
              size="sm"
              className="text-xs h-7"
            >
              Approved ({drivers.filter(d => d.verificationStatus === VerificationStatus.APPROVED).length})
            </Button>
            <Button
              variant={statusFilter === VerificationStatus.REJECTED ? 'default' : 'outline'}
              onClick={() => setStatusFilter(VerificationStatus.REJECTED)}
              size="sm"
              className="text-xs h-7"
            >
              Rejected ({drivers.filter(d => d.verificationStatus === VerificationStatus.REJECTED).length})
            </Button>
          </div>
        </div>

        {/* Drivers List */}
        <div className="space-y-2">
          {filteredDrivers.length === 0 ? (
            <Alert className="border-border">
              <Car className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No drivers found matching your filters.' 
                  : 'No drivers registered yet.'}
              </AlertDescription>
            </Alert>
          ) : (
            filteredDrivers.map((driver) => (
              <Card 
                key={driver.uid} 
                className="border-border hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => setSelectedDriver(driver)}
              >
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 shrink-0">
                      <Car className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h3 className="font-semibold text-sm truncate">{driver.displayName}</h3>
                        <div className="flex gap-1 shrink-0">
                          {getStatusBadge(driver.verificationStatus)}
                        </div>
                      </div>
                      {/* Mobile layout */}
                      <div className="md:hidden space-y-0.5 text-xs text-muted-foreground">
                        <p className="truncate">{driver.vehicleType} • {driver.vehicleModel} • {driver.vehicleRegistrationNumber}</p>
                        <p className="truncate flex items-center gap-1">
                          <Mail className="h-3 w-3 shrink-0" />
                          {driver.email}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <Badge variant="secondary" className="text-[10px]">
                            <Star className="h-2.5 w-2.5 mr-1" />
                            {driver.rating.toFixed(1)}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {driver.totalRides} rides
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            ₹{driver.totalEarnings}
                          </Badge>
                        </div>
                      </div>
                      {/* Desktop layout */}
                      <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{driver.vehicleType} • {driver.vehicleModel}</span>
                        <span>•</span>
                        <span>{driver.vehicleRegistrationNumber}</span>
                        <span>•</span>
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
                        <span>•</span>
                        <span>{driver.totalRides} rides</span>
                        <span>•</span>
                        <span>₹{driver.totalEarnings}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

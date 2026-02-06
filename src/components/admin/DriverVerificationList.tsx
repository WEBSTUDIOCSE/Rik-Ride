'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { APIBook, type DriverProfile, type DriverDocument, VerificationStatus, DocumentType } from '@/lib/firebase/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Car, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  FileText,
  Phone,
  Mail,
  Calendar,
  RefreshCw,
  Eye,
  Shield,
  Check
} from 'lucide-react';
import Link from 'next/link';

interface DriverVerificationListProps {
  adminUid: string;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function DriverVerificationList({ adminUid }: DriverVerificationListProps) {
  const searchParams = useSearchParams();
  const driverIdFromUrl = searchParams.get('driver');
  
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [verifiedDocs, setVerifiedDocs] = useState<Set<string>>(new Set());
  const [verifyingDocId, setVerifyingDocId] = useState<string | null>(null);

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
    
    let result;
    if (filter === 'all') {
      result = await APIBook.admin.getAllDrivers();
    } else {
      const statusMap: Record<string, VerificationStatus> = {
        'pending': VerificationStatus.PENDING,
        'approved': VerificationStatus.APPROVED,
        'rejected': VerificationStatus.REJECTED,
      };
      result = await APIBook.driver.getDriversByStatus(statusMap[filter]);
    }

    if (result.success && result.data) {
      setDrivers(result.data);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDrivers();
  }, [filter]);

  const handleApprove = async (driver: DriverProfile) => {
    setActionLoading(true);
    const result = await APIBook.admin.approveDriver(
      driver.uid, 
      adminUid, 
      'All documents verified successfully'
    );
    
    if (result.success) {
      setSelectedDriver(null);
      fetchDrivers();
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
      setSelectedDriver(null);
      setRejectReason('');
      fetchDrivers();
    }
    setActionLoading(false);
  };

  const handleVerifyDocument = async (driverId: string, documentId: string) => {
    setVerifyingDocId(documentId);
    
    try {
      const result = await APIBook.admin.verifyDocument(driverId, documentId, adminUid);
      
      if (result.success) {
        // Update local state
        setVerifiedDocs(prev => new Set([...prev, documentId]));
        
        // Refresh driver data
        if (selectedDriver) {
          const updatedDriver = await APIBook.driver.getDriver(driverId);
          if (updatedDriver.success && updatedDriver.data) {
            setSelectedDriver(updatedDriver.data);
          }
        }
      }
    } catch (err) {
      console.error('Failed to verify document:', err);
    }
    
    setVerifyingDocId(null);
  };

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.PENDING:
        return <Badge variant="secondary">Pending</Badge>;
      case VerificationStatus.APPROVED:
        return <Badge>Approved</Badge>;
      case VerificationStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDocumentLabel = (type: DocumentType) => {
    const labels: Record<DocumentType, string> = {
      [DocumentType.DRIVING_LICENSE]: 'Driving License',
      [DocumentType.VEHICLE_RC]: 'Vehicle RC',
      [DocumentType.INSURANCE]: 'Insurance',
      [DocumentType.ID_PROOF]: 'ID Proof',
      [DocumentType.VEHICLE_PHOTO]: 'Vehicle Photo',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Driver Detail View
  if (selectedDriver) {
    return (
      <div className="min-h-screen pb-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border mb-4">
          <div className="flex items-center gap-3 px-4 md:px-6 py-3 max-w-6xl mx-auto">
            <Button variant="ghost" size="icon" onClick={() => setSelectedDriver(null)} className="h-9 w-9 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-semibold truncate">{selectedDriver.displayName}</h1>
              <p className="text-xs text-muted-foreground truncate">{selectedDriver.email}</p>
            </div>
            {getStatusBadge(selectedDriver.verificationStatus)}
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-4 max-w-6xl mx-auto">
          <Card className="border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Car className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">{selectedDriver.displayName}</CardTitle>
                  <CardDescription className="text-xs truncate">{selectedDriver.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contact Information */}
              <div>
                <h3 className="font-semibold text-sm mb-2">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{selectedDriver.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{selectedDriver.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Vehicle Information */}
              <div>
                <h3 className="font-semibold text-sm mb-2">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <p className="text-sm font-medium truncate">{selectedDriver.vehicleType}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Model</Label>
                    <p className="text-sm font-medium truncate">{selectedDriver.vehicleModel}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Registration</Label>
                    <p className="text-sm font-medium truncate">{selectedDriver.vehicleRegistrationNumber}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Capacity</Label>
                    <p className="text-sm font-medium">{selectedDriver.seatingCapacity} passengers</p>
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
                    {new Date(selectedDriver.licenseExpiry).toLocaleDateString()}
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
                    
                    return (
                      <Card key={doc.id} className={isVerified ? 'border-primary' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-4">
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
                              <Button variant="outline" size="sm" asChild>
                                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </a>
                              </Button>
                              
                              {selectedDriver.verificationStatus === VerificationStatus.PENDING && !isVerified && (
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
                            </div>
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
                        <span className="text-primary"> • All documents verified! You can now approve this driver.</span>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>

            {/* Verification Notes (if rejected) */}
            {selectedDriver.verificationStatus === VerificationStatus.REJECTED && selectedDriver.verificationNotes && (
              <>
                <Separator />
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Rejection Reason:</strong> {selectedDriver.verificationNotes}
                  </AlertDescription>
                </Alert>
              </>
            )}

            {/* Actions for Pending */}
            {selectedDriver.verificationStatus === VerificationStatus.PENDING && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rejectReason">Rejection Reason (if rejecting)</Label>
                    <Input
                      id="rejectReason"
                      placeholder="Enter reason for rejection..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button 
                      onClick={() => handleApprove(selectedDriver)}
                      disabled={actionLoading}
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
              </>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  // Driver List View
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
              <h1 className="text-base md:text-xl font-semibold truncate">Driver Verification</h1>
              <p className="text-xs text-muted-foreground">
                {drivers.length} {drivers.length === 1 ? 'driver' : 'drivers'}
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
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {(['pending', 'approved', 'rejected', 'all'] as FilterStatus[]).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className="text-xs h-8"
            >
              {status === 'pending' && <Clock className="h-3 w-3 mr-1.5" />}
              {status === 'approved' && <CheckCircle className="h-3 w-3 mr-1.5" />}
              {status === 'rejected' && <XCircle className="h-3 w-3 mr-1.5" />}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Driver List */}
        {drivers.length === 0 ? (
          <Card className="border-border">
            <CardContent className="text-center py-12">
              <Car className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="font-medium text-sm mb-1">No drivers found</p>
              <p className="text-xs text-muted-foreground">
                {filter === 'pending' && 'No pending driver verifications at this time'}
                {filter === 'approved' && 'No approved drivers yet'}
                {filter === 'rejected' && 'No rejected drivers'}
                {filter === 'all' && 'No drivers have registered yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {drivers.map((driver) => (
              <Card 
                key={driver.uid} 
                className="border-border hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => setSelectedDriver(driver)}
              >
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Car className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="font-semibold text-sm truncate">{driver.displayName}</p>
                        {getStatusBadge(driver.verificationStatus)}
                      </div>
                      {/* Mobile layout */}
                      <div className="md:hidden space-y-0.5 text-xs text-muted-foreground">
                        <p className="truncate flex items-center gap-1">
                          <Mail className="h-3 w-3 shrink-0" />
                          {driver.email}
                        </p>
                        <p className="truncate">{driver.vehicleType} • {driver.vehicleRegistrationNumber}</p>
                        <div className="pt-1">
                          <Badge variant="outline" className="text-[10px]">
                            <FileText className="h-2.5 w-2.5 mr-1" />
                            {driver.documents.length} documents
                          </Badge>
                        </div>
                      </div>
                      {/* Desktop layout */}
                      <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {driver.email}
                        </span>
                        <span>•</span>
                        <span>{driver.vehicleType} • {driver.vehicleRegistrationNumber}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-[10px]">
                          <FileText className="h-2.5 w-2.5 mr-1" />
                          {driver.documents.length} documents
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

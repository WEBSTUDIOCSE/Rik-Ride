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
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedDriver(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Driver Verification</h1>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Car className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle>{selectedDriver.displayName}</CardTitle>
                  <CardDescription>{selectedDriver.email}</CardDescription>
                </div>
              </div>
              {getStatusBadge(selectedDriver.verificationStatus)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="font-semibold mb-3">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedDriver.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedDriver.phone || 'Not provided'}</span>
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
                  <Label className="text-muted-foreground">Vehicle Model</Label>
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
    );
  }

  // Driver List View
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Driver Verification</h1>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchDrivers}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as FilterStatus[]).map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === 'pending' && <Clock className="h-4 w-4 mr-2" />}
            {status === 'approved' && <CheckCircle className="h-4 w-4 mr-2" />}
            {status === 'rejected' && <XCircle className="h-4 w-4 mr-2" />}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Driver List */}
      {drivers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="font-medium mb-2">No drivers found</p>
            <p className="text-sm text-muted-foreground">
              {filter === 'pending' && 'No pending driver verifications at this time'}
              {filter === 'approved' && 'No approved drivers yet'}
              {filter === 'rejected' && 'No rejected drivers'}
              {filter === 'all' && 'No drivers have registered yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {drivers.map((driver) => (
            <Card key={driver.uid} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Car className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold">{driver.displayName}</p>
                      <p className="text-sm text-muted-foreground">{driver.email}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{driver.vehicleType}</Badge>
                        <Badge variant="outline">{driver.vehicleRegistrationNumber}</Badge>
                        <Badge variant="secondary">{driver.documents.length} docs</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(driver.verificationStatus)}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedDriver(driver)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

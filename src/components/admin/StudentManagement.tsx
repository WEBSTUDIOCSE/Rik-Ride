'use client';

import { useState, useEffect } from 'react';
import { APIBook, type StudentProfile } from '@/lib/firebase/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {  
  Users,
  GraduationCap,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Wallet,
  MapPin,
  ArrowLeft,
  Ban,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

interface StudentManagementProps {
  adminUid: string;
}

export default function StudentManagement({ adminUid }: StudentManagementProps) {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);

  const fetchStudents = async () => {
    setRefreshing(true);
    const result = await APIBook.admin.getAllStudents();
    
    if (result.success && result.data) {
      setStudents(result.data);
      setFilteredStudents(result.data);
    }
    
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredStudents(
        students.filter(
          (student) =>
            student.displayName.toLowerCase().includes(query) ||
            student.email.toLowerCase().includes(query) ||
            student.studentId.toLowerCase().includes(query) ||
            student.department.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, students]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (selectedStudent) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => setSelectedStudent(null)}
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
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{selectedStudent.displayName}</CardTitle>
                  <CardDescription>Student ID: {selectedStudent.studentId}</CardDescription>
                </div>
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
                    {selectedStudent.email}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">University Email</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {selectedStudent.universityEmail}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {selectedStudent.phone || 'Not provided'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <p className="font-medium">{selectedStudent.department}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Year</Label>
                  <p className="font-medium">Year {selectedStudent.year}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Joined</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {selectedStudent.createdAt && !isNaN(new Date(selectedStudent.createdAt).getTime())
                      ? new Date(selectedStudent.createdAt).toLocaleDateString('en-IN')
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Ride Stats */}
            <div>
              <h3 className="font-semibold mb-3">Ride Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Wallet className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Wallet Balance</p>
                        <p className="text-2xl font-bold">₹{selectedStudent.walletBalance}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Rides</p>
                        <p className="text-2xl font-bold">{selectedStudent.totalRides}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Saved Addresses</p>
                        <p className="text-2xl font-bold">{selectedStudent.savedAddresses.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Saved Addresses */}
            {selectedStudent.savedAddresses.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Saved Addresses</h3>
                <div className="space-y-2">
                  {selectedStudent.savedAddresses.map((address, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">{address.label}</p>
                            <p className="text-sm text-muted-foreground">{address.address}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
            <h1 className="text-2xl font-bold">Manage Students</h1>
            <p className="text-sm text-muted-foreground">
              Total Students: {students.length}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={fetchStudents}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by name, email, student ID, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Students List */}
      <div className="grid gap-4">
        {filteredStudents.length === 0 ? (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              {searchQuery ? 'No students found matching your search.' : 'No students registered yet.'}
            </AlertDescription>
          </Alert>
        ) : (
          filteredStudents.map((student) => (
            <Card key={student.uid} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{student.displayName}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{student.studentId}</span>
                        <span>•</span>
                        <span>{student.department}</span>
                        <span>•</span>
                        <span>Year {student.year}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {student.email}
                        </span>
                        {student.phone && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {student.phone}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Wallet</p>
                      <p className="font-semibold">₹{student.walletBalance}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Rides</p>
                      <p className="font-semibold">{student.totalRides}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedStudent(student)}
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

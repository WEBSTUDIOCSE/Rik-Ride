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
      <div className="min-h-screen pb-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border mb-4">
          <div className="flex items-center gap-3 px-4 md:px-6 py-3 max-w-6xl mx-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedStudent(null)}
              className="h-9 w-9 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-semibold truncate">{selectedStudent.displayName}</h1>
              <p className="text-xs text-muted-foreground truncate">ID: {selectedStudent.studentId}</p>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-4 max-w-6xl mx-auto">
          <Card className="border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 shrink-0">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">{selectedStudent.displayName}</CardTitle>
                  <CardDescription className="text-xs">Student ID: {selectedStudent.studentId}</CardDescription>
                </div>
              </div>
            </CardHeader>
          <CardContent className="space-y-4">
            {/* Personal Information */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm font-medium flex items-center gap-1.5 mt-0.5">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{selectedStudent.email}</span>
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">University Email</Label>
                  <p className="text-sm font-medium flex items-center gap-1.5 mt-0.5">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{selectedStudent.universityEmail}</span>
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="text-sm font-medium flex items-center gap-1.5 mt-0.5">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{selectedStudent.phone || 'N/A'}</span>
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Department</Label>
                  <p className="text-sm font-medium truncate mt-0.5">{selectedStudent.department}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Year</Label>
                  <p className="text-sm font-medium mt-0.5">Year {selectedStudent.year}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Joined</Label>
                    <p className="text-sm font-medium flex items-center gap-1.5 mt-0.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {selectedStudent.createdAt && !isNaN(new Date(selectedStudent.createdAt).getTime())
                        ? new Date(selectedStudent.createdAt).toLocaleDateString('en-IN')
                        : 'N/A'}
                    </p>
                </div>
              </div>
            </div>

            {/* Ride Stats */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Ride Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-muted/50 border border-border rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-[10px] text-muted-foreground">Total Rides</p>
                  </div>
                  <p className="text-xl font-bold">{selectedStudent.totalRides}</p>
                </div>
                <div className="bg-muted/50 border border-border rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-[10px] text-muted-foreground">Addresses</p>
                  </div>
                  <p className="text-xl font-bold">{selectedStudent.savedAddresses.length}</p>
                </div>
              </div>
            </div>

            {/* Saved Addresses */}
            {selectedStudent.savedAddresses.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-3">Saved Addresses</h3>
                <div className="space-y-2">
                  {selectedStudent.savedAddresses.map((address, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-muted/30 border border-border rounded-lg">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{address.label}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{address.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
              <h1 className="text-base md:text-xl font-semibold truncate">Manage Students</h1>
              <p className="text-xs text-muted-foreground">
                {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchStudents}
            disabled={refreshing}
            className="h-9 w-9 shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="px-4 md:px-6 space-y-4 max-w-6xl mx-auto">
        {/* Search */}
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Search by name, email, student ID, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 text-sm border-0 bg-transparent focus-visible:ring-0 p-0"
            />
          </div>
        </div>

        {/* Students List */}
        <div className="space-y-2">
          {filteredStudents.length === 0 ? (
            <Alert className="border-border">
              <Users className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {searchQuery ? 'No students found matching your search.' : 'No students registered yet.'}
              </AlertDescription>
            </Alert>
          ) : (
            filteredStudents.map((student) => (
              <Card 
                key={student.uid} 
                className="border-border hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => setSelectedStudent(student)}
              >
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 shrink-0">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h3 className="font-semibold text-sm truncate">{student.displayName}</h3>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {student.totalRides} rides
                        </Badge>
                      </div>
                      {/* Mobile layout */}
                      <div className="md:hidden space-y-0.5 text-xs text-muted-foreground">
                        <p className="truncate">{student.studentId} • {student.department} • Year {student.year}</p>
                        <p className="truncate flex items-center gap-1">
                          <Mail className="h-3 w-3 shrink-0" />
                          {student.email}
                        </p>
                      </div>
                      {/* Desktop layout */}
                      <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{student.studentId}</span>
                        <span>•</span>
                        <span>{student.department}</span>
                        <span>•</span>
                        <span>Year {student.year}</span>
                        <span>•</span>
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
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  UserPlus, 
  Trash2, 
  Phone, 
  Edit2, 
  Star, 
  AlertCircle,
  Loader2,
  Users
} from 'lucide-react';
import { EmergencyService } from '@/lib/firebase/services';
import { EmergencyContact } from '@/lib/types/user.types';

const RELATIONSHIPS = [
  'Parent',
  'Mother',
  'Father',
  'Sibling',
  'Spouse',
  'Friend',
  'Relative',
  'Guardian',
  'Other',
];

interface EmergencyContactWithId extends EmergencyContact {
  id?: string;
  isDefault?: boolean;
}

interface EmergencyContactManagerProps {
  studentId: string;
  contacts: EmergencyContactWithId[];
  parentPhone?: string | null;
  onContactsChange?: (contacts: EmergencyContactWithId[]) => void;
  onParentPhoneChange?: (phone: string | null) => void;
}

export default function EmergencyContactManager({
  studentId,
  contacts,
  parentPhone,
  onContactsChange,
  onParentPhoneChange,
}: EmergencyContactManagerProps) {
  const [localContacts, setLocalContacts] = useState<EmergencyContactWithId[]>(contacts);
  const [localParentPhone, setLocalParentPhone] = useState(parentPhone || '');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContactWithId | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for new contact
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: '',
  });

  useEffect(() => {
    setLocalContacts(contacts);
  }, [contacts]);

  useEffect(() => {
    setLocalParentPhone(parentPhone || '');
  }, [parentPhone]);

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone || !newContact.relationship) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const contact: EmergencyContact = {
        name: newContact.name,
        phone: newContact.phone,
        relationship: newContact.relationship,
      };

      const result = await EmergencyService.addEmergencyContact(studentId, contact);

      if (result.success && result.data) {
        const updatedContacts = [...localContacts, result.data];
        setLocalContacts(updatedContacts);
        onContactsChange?.(updatedContacts);
        setNewContact({ name: '', phone: '', relationship: '' });
        setShowAddDialog(false);
        setSuccess('Emergency contact added successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to add contact');
      }
    } catch (err) {
      setError('An error occurred while adding contact');
      console.error('Add contact error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditContact = async () => {
    if (!editingContact) return;

    setLoading(true);
    setError(null);

    try {
      const result = await EmergencyService.updateEmergencyContact(studentId, editingContact);

      if (result.success) {
        const updatedContacts = localContacts.map(c => 
          c.id === editingContact.id ? editingContact : c
        );
        setLocalContacts(updatedContacts);
        onContactsChange?.(updatedContacts);
        setEditingContact(null);
        setShowEditDialog(false);
        setSuccess('Emergency contact updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to update contact');
      }
    } catch (err) {
      setError('An error occurred while updating contact');
      console.error('Update contact error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this emergency contact?')) return;

    setLoading(true);
    setError(null);

    try {
      const result = await EmergencyService.deleteEmergencyContact(studentId, contactId);

      if (result.success) {
        const updatedContacts = localContacts.filter(c => c.id !== contactId);
        setLocalContacts(updatedContacts);
        onContactsChange?.(updatedContacts);
        setSuccess('Emergency contact deleted successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to delete contact');
      }
    } catch (err) {
      setError('An error occurred while deleting contact');
      console.error('Delete contact error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateParentPhone = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await EmergencyService.updateParentPhone(studentId, localParentPhone || '');

      if (result.success) {
        onParentPhoneChange?.(localParentPhone || null);
        setSuccess('Parent phone updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to update parent phone');
      }
    } catch (err) {
      setError('An error occurred while updating parent phone');
      console.error('Update parent phone error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Emergency Contacts
        </CardTitle>
        <CardDescription>
          Manage your emergency contacts for ride safety
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Parent/Guardian Phone */}
        <div className="space-y-2">
          <Label>Parent/Guardian Phone</Label>
          <div className="flex gap-2">
            <Input
              placeholder="+91 9876543210"
              value={localParentPhone}
              onChange={(e) => setLocalParentPhone(e.target.value)}
            />
            <Button
              onClick={handleUpdateParentPhone}
              disabled={loading || localParentPhone === (parentPhone || '')}
              size="sm"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This will be your primary emergency contact
          </p>
        </div>

        {/* Emergency Contacts List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Additional Contacts</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddDialog(true)}
              disabled={localContacts.length >= 5}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>

          {localContacts.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No additional emergency contacts</p>
              <p className="text-sm">Add contacts for enhanced ride safety</p>
            </div>
          ) : (
            <div className="space-y-2">
              {localContacts.map((contact, idx) => (
                <div
                  key={contact.id || idx}
                  className="flex items-center justify-between p-3 border rounded-lg bg-background"
                >
                  <div className="flex items-center gap-3">
                    {contact.isDefault && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {contact.phone} • {contact.relationship}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = `tel:${contact.phone}`}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingContact(contact);
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => contact.id && handleDeleteContact(contact.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {localContacts.length >= 5 && (
            <p className="text-xs text-muted-foreground text-center">
              Maximum 5 additional contacts allowed
            </p>
          )}
        </div>

        {/* Add Contact Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Emergency Contact</DialogTitle>
              <DialogDescription>
                Add a new emergency contact for ride safety notifications
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="contact-name">Name</Label>
                <Input
                  id="contact-name"
                  placeholder="Contact name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="contact-phone">Phone Number</Label>
                <Input
                  id="contact-phone"
                  placeholder="+91 9876543210"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="contact-relationship">Relationship</Label>
                <Select
                  value={newContact.relationship}
                  onValueChange={(value) => setNewContact({ ...newContact, relationship: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map((rel) => (
                      <SelectItem key={rel} value={rel}>
                        {rel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddContact} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Contact'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Contact Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Emergency Contact</DialogTitle>
              <DialogDescription>
                Update emergency contact information
              </DialogDescription>
            </DialogHeader>

            {editingContact && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editingContact.name}
                    onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    value={editingContact.phone}
                    onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-relationship">Relationship</Label>
                  <Select
                    value={editingContact.relationship}
                    onValueChange={(value) => setEditingContact({ ...editingContact, relationship: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIPS.map((rel) => (
                        <SelectItem key={rel} value={rel}>
                          {rel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditContact} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

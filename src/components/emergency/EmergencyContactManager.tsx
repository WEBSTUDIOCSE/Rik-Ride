'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { 
  UserPlus, 
  Trash2, 
  Phone, 
  Edit2, 
  Star, 
  AlertCircle,
  Loader2,
  Users,
  CheckCircle,
  Save,
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
        setSuccess('Emergency contact add ho gaya! ✓');
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
        setSuccess('Contact update ho gaya! ✓');
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
    if (!confirm('Pakka delete karna hai? 🤔')) return;

    setLoading(true);
    setError(null);

    try {
      const result = await EmergencyService.deleteEmergencyContact(studentId, contactId);

      if (result.success) {
        const updatedContacts = localContacts.filter(c => c.id !== contactId);
        setLocalContacts(updatedContacts);
        onContactsChange?.(updatedContacts);
        setSuccess('Contact delete ho gaya! ✓');
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
        setSuccess('Parent phone update ho gaya! ✓');
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
    <div className="bg-white/10 backdrop-blur-md border-2 border-[#FFD700]/30 rounded-xl p-4 md:p-6">
      <div className="mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-bold text-[#FFD700] flex items-center gap-2">
          <Users className="h-5 w-5" />
          Emergency Contacts 🆘
        </h2>
        <p className="text-gray-400 text-sm mt-1">Manage your emergency contacts for ride safety</p>
      </div>

      <div className="space-y-4 md:space-y-6">
        {error && (
          <Alert className="bg-red-500/20 border-red-500">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-[#009944]/20 border-[#009944]">
            <CheckCircle className="h-4 w-4 text-[#009944]" />
            <AlertDescription className="text-[#009944]">{success}</AlertDescription>
          </Alert>
        )}

        {/* Parent/Guardian Phone */}
        <div className="bg-[#252525] rounded-lg p-3 md:p-4 space-y-3">
          <Label className="text-[#FFD700] font-semibold flex items-center gap-2">
            <Star className="h-4 w-4" />
            Parent/Guardian Phone
          </Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="+91 9876543210"
              value={localParentPhone}
              onChange={(e) => setLocalParentPhone(e.target.value)}
              className="bg-[#1a1a1a] border-gray-600 text-white placeholder:text-gray-500 flex-1"
            />
            <button
              onClick={handleUpdateParentPhone}
              disabled={loading || localParentPhone === (parentPhone || '')}
              className="flex items-center justify-center gap-2 bg-[#009944] text-white py-2 px-4 rounded-lg font-bold uppercase tracking-wider text-xs shadow-[0px_4px_0px_0px_#006400] hover:shadow-[0px_2px_0px_0px_#006400] hover:translate-y-[2px] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50 w-full sm:w-auto"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="sm:hidden ml-2">Save</span>
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Yeh tera primary emergency contact hoga 📞
          </p>
        </div>

        {/* Emergency Contacts List */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Label className="text-gray-300 font-semibold">Additional Contacts</Label>
            <button
              onClick={() => setShowAddDialog(true)}
              disabled={localContacts.length >= 5}
              className="flex items-center justify-center gap-2 bg-[#1a1a1a] border-2 border-[#FFD700] text-white py-2 px-4 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-[#FFD700] hover:text-[#1a1a1a] transition-all disabled:opacity-50 w-full sm:w-auto"
            >
              <UserPlus className="h-4 w-4" />
              Add Contact
            </button>
          </div>

          {localContacts.length === 0 ? (
            <div className="text-center py-8 bg-[#252525] rounded-lg">
              <Users className="h-12 w-12 mx-auto mb-2 text-gray-600" />
              <p className="text-gray-400">Koi additional contacts nahi hai</p>
              <p className="text-xs text-gray-500 mt-1">Safety ke liye contacts add kar 🛡️</p>
            </div>
          ) : (
            <div className="space-y-2">
              {localContacts.map((contact, idx) => (
                <div
                  key={contact.id || idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-[#252525] rounded-lg gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {contact.isDefault && (
                      <Star className="h-4 w-4 text-[#FFD700] fill-[#FFD700] flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white truncate">{contact.name}</p>
                      <p className="text-sm text-gray-400 truncate">
                        {contact.phone} • {contact.relationship}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => window.location.href = `tel:${contact.phone}`}
                      className="p-2 bg-[#009944] text-white rounded-lg hover:bg-[#007a33] transition-all"
                    >
                      <Phone className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingContact(contact);
                        setShowEditDialog(true);
                      }}
                      className="p-2 bg-[#1a1a1a] border border-gray-600 text-gray-400 rounded-lg hover:border-[#FFD700] hover:text-white transition-all"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => contact.id && handleDeleteContact(contact.id)}
                      disabled={loading}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {localContacts.length >= 5 && (
            <p className="text-xs text-gray-500 text-center">
              Maximum 5 additional contacts allowed hai 📝
            </p>
          )}
        </div>

        {/* Add Contact Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#FFD700] flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Naya Contact Add Karo ➕
              </DialogTitle>
              <DialogDescription>
                Safety ke liye emergency contact add kar
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="contact-name" className="text-gray-300">Name</Label>
                <Input
                  id="contact-name"
                  placeholder="Contact ka naam"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="bg-[#252525] border-gray-600 text-white placeholder:text-gray-500 mt-1"
                />
              </div>

              <div>
                <Label htmlFor="contact-phone" className="text-gray-300">Phone Number</Label>
                <Input
                  id="contact-phone"
                  placeholder="+91 9876543210"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="bg-[#252525] border-gray-600 text-white placeholder:text-gray-500 mt-1"
                />
              </div>

              <div>
                <Label htmlFor="contact-relationship" className="text-gray-300">Relationship</Label>
                <Select
                  value={newContact.relationship}
                  onValueChange={(value) => setNewContact({ ...newContact, relationship: value })}
                >
                  <SelectTrigger className="bg-[#252525] border-gray-600 text-white mt-1">
                    <SelectValue placeholder="Rishta select kar" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-600">
                    {RELATIONSHIPS.map((rel) => (
                      <SelectItem key={rel} value={rel} className="text-white hover:bg-[#252525]">
                        {rel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => setShowAddDialog(false)}
                className="flex-1 bg-[#252525] border-2 border-gray-600 text-white py-3 px-4 rounded-lg font-bold uppercase tracking-wider text-sm hover:border-[#FFD700] transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddContact} 
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-[#009944] text-white py-3 px-4 rounded-lg font-bold uppercase tracking-wider text-sm shadow-[0px_4px_0px_0px_#006400] hover:shadow-[0px_2px_0px_0px_#006400] hover:translate-y-[2px] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Add
                  </>
                )}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Contact Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#FFD700] flex items-center gap-2">
                <Edit2 className="h-5 w-5" />
                Contact Edit Karo ✏️
              </DialogTitle>
              <DialogDescription>
                Emergency contact info update kar
              </DialogDescription>
            </DialogHeader>

            {editingContact && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name" className="text-gray-300">Name</Label>
                  <Input
                    id="edit-name"
                    value={editingContact.name}
                    onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                    className="bg-[#252525] border-gray-600 text-white mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-phone" className="text-gray-300">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    value={editingContact.phone}
                    onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                    className="bg-[#252525] border-gray-600 text-white mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-relationship" className="text-gray-300">Relationship</Label>
                  <Select
                    value={editingContact.relationship}
                    onValueChange={(value) => setEditingContact({ ...editingContact, relationship: value })}
                  >
                    <SelectTrigger className="bg-[#252525] border-gray-600 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-gray-600">
                      {RELATIONSHIPS.map((rel) => (
                        <SelectItem key={rel} value={rel} className="text-white hover:bg-[#252525]">
                          {rel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => setShowEditDialog(false)}
                className="flex-1 bg-[#252525] border-2 border-gray-600 text-white py-3 px-4 rounded-lg font-bold uppercase tracking-wider text-sm hover:border-[#FFD700] transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditContact} 
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-[#009944] text-white py-3 px-4 rounded-lg font-bold uppercase tracking-wider text-sm shadow-[0px_4px_0px_0px_#006400] hover:shadow-[0px_2px_0px_0px_#006400] hover:translate-y-[2px] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

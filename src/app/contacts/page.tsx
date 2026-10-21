'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Plus, 
  Mail, 
  Phone, 
  Search, 
  Briefcase, 
  ShieldCheck, 
  Calendar,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { formatISTDateTime } from '@/lib/timezone';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: string;
  deals?: { id: string; title: string; stage: string; value: number }[];
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('ADMIN');

  // Edit Modal State
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Modal State
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Notification Toasts
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [accessDeniedAlert, setAccessDeniedAlert] = useState<string | null>(null);

  const checkRole = () => {
    try {
      const match = document.cookie.match(/(^|;)\s*clientflow_session\s*=\s*([^;]+)/);
      if (match) {
        const parsed = JSON.parse(decodeURIComponent(match[2]));
        setUserRole(parsed.role || 'ADMIN');
      }
    } catch {
      // ignore
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkRole();
    fetchContacts();

    const handleRoleChange = () => {
      checkRole();
      fetchContacts();
    };
    window.addEventListener('clientflow_role_changed', handleRoleChange);
    return () => window.removeEventListener('clientflow_role_changed', handleRoleChange);
  }, []);

  // Handle Edit Click
  const openEditModal = (contact: Contact) => {
    if (userRole === 'VIEWER') {
      setAccessDeniedAlert('HTTP 403 Forbidden: Viewers have read-only access and cannot edit contact details.');
      setTimeout(() => setAccessDeniedAlert(null), 4000);
      return;
    }
    setEditingContact(contact);
    setEditForm({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || '',
    });
    setEditError(null);
  };

  const closeEditModal = () => {
    setEditingContact(null);
    setEditError(null);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;

    if (!editForm.name.trim() || !editForm.email.trim()) {
      setEditError('Name and email are required');
      return;
    }

    setSaving(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/contacts/${editingContact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setEditError(data.error || 'Conflict (409): That email is already in use by another contact.');
        } else if (res.status === 403) {
          setEditError('Access Denied (HTTP 403): You do not have permission to edit this contact.');
        } else {
          setEditError(data.error || 'Failed to update contact');
        }
        setSaving(false);
        return;
      }

      // Success: update list state immediately
      setContacts((prev) =>
        prev.map((c) => (c.id === editingContact.id ? { ...c, ...data.contact } : c))
      );

      closeEditModal();
      setSuccessToast(`Contact "${editForm.name}" updated successfully!`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      setEditError(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete Click
  const promptDeleteContact = (contact: Contact) => {
    if (userRole === 'VIEWER') {
      setAccessDeniedAlert('HTTP 403 Forbidden: Viewers have read-only access and cannot delete contacts.');
      setTimeout(() => setAccessDeniedAlert(null), 4000);
      return;
    }

    if (userRole === 'MEMBER') {
      setAccessDeniedAlert('HTTP 403 Forbidden: Team Members cannot delete contacts. Contact an Admin or Owner.');
      setTimeout(() => setAccessDeniedAlert(null), 4000);
      return;
    }

    setContactToDelete(contact);
    setDeleteError(null);
  };

  const closeDeleteModal = () => {
    setContactToDelete(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/contacts/${contactToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error || 'Failed to delete contact.');
        setDeleting(false);
        return;
      }

      // Remove from state immediately
      setContacts((prev) => prev.filter((c) => c.id !== contactToDelete.id));
      const deletedName = contactToDelete.name;
      closeDeleteModal();
      setSuccessToast(`Contact "${deletedName}" has been removed.`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      setDeleteError(err.message || 'An error occurred while deleting.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = contacts.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone && c.phone.includes(q));
  });

  const totalDealsLinked = contacts.reduce((sum, c) => sum + (c.deals ? c.deals.length : 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-xl animate-bounce-subtle">
          <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Access Denied 403 Banner Alert */}
      {accessDeniedAlert && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-rose-600 text-white text-xs font-semibold rounded-xl shadow-xl animate-bounce-subtle">
          <Lock className="w-4 h-4 text-rose-100 shrink-0" />
          <span>{accessDeniedAlert}</span>
        </div>
      )}

      {/* 1. Calm Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="calm-card p-4">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Total Contacts</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">{contacts.length}</div>
          <div className="mt-1 text-xs text-slate-500">Workspace contacts directory</div>
        </div>

        <div className="calm-card p-4">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Linked Deals</span>
            <Briefcase className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-600 font-mono">{totalDealsLinked}</div>
          <div className="mt-1 text-xs text-slate-500">Deals actively tied to contacts</div>
        </div>

        <div className="calm-card p-4">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Duplicate Protection</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700 font-mono">Enforced (409)</div>
          <div className="mt-1 text-xs text-slate-500">Case-insensitive normalization</div>
        </div>
      </div>

      {/* 2. Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 calm-card bg-white">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs calm-input"
          />
        </div>

        {userRole === 'VIEWER' ? (
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            Read-Only Client Directory
          </span>
        ) : (
          <Link
            href="/contacts/new"
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold btn-primary-gradient transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Contact</span>
          </Link>
        )}
      </div>

      {/* 3. Contacts Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 calm-panel">
          Loading contacts directory...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center calm-panel border-dashed border-slate-200 space-y-2">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-sm font-bold text-slate-800">No contacts found</div>
          <p className="text-xs text-slate-500">
            {search ? 'Try clearing your search query' : 'Create your first contact above'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((contact) => (
            <div
              key={contact.id}
              className="calm-card p-4 space-y-3 bg-white relative group transition-all hover:border-blue-300 hover:shadow-md"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-800 shrink-0">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {contact.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons (Pencil + Trash) */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Edit Button (Pencil Icon only) */}
                  <button
                    onClick={() => openEditModal(contact)}
                    title={userRole === 'VIEWER' ? 'Viewers cannot edit contacts (403)' : 'Edit contact details'}
                    className={`p-1.5 rounded-lg border transition-all ${
                      userRole === 'VIEWER'
                        ? 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 cursor-not-allowed'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300'
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button (Trash Icon) */}
                  <button
                    onClick={() => promptDeleteContact(contact)}
                    title={
                      userRole === 'VIEWER' || userRole === 'MEMBER'
                        ? 'Access Denied: Only Admins/Owners can delete (403)'
                        : 'Delete contact'
                    }
                    className={`p-1.5 rounded-lg border transition-all ${
                      userRole === 'VIEWER' || userRole === 'MEMBER'
                        ? 'border-slate-100 bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 cursor-not-allowed'
                        : 'border-slate-200 bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Details (Clean phone row, no extra edit text link) */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span className="font-mono text-slate-700">
                    {contact.phone || <span className="text-slate-400 italic">No phone added</span>}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Added {formatISTDateTime(contact.createdAt)}</span>
                </div>
              </div>

              {/* Linked Deals */}
              {contact.deals && contact.deals.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                    Linked Pipeline Deals ({contact.deals.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {contact.deals.map((deal) => (
                      <span
                        key={deal.id}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 truncate max-w-[200px]"
                        title={deal.title}
                      >
                        {deal.title} ({deal.stage})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit Contact Details</h3>
                  <p className="text-[11px] text-slate-500">Correct phone numbers or update contact info</p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveContact} className="p-5 space-y-4">
              {editError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Name Field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g. Keerthana P"
                  className="w-full px-3 py-2 text-xs calm-input"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Email Address *</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="e.g. keerthana@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs calm-input font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Case-insensitive unique check enforced in this workspace.
                </p>
              </div>

              {/* Phone Field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Phone Number</span>
                  <span className="text-[10px] text-emerald-600 font-medium">Quick Correction</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-xs calm-input font-mono"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Enter correct digits or international format (e.g. +91 ...).
                </p>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold btn-primary-gradient transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Contact Confirmation Modal */}
      {contactToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center font-bold">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Delete Contact</h3>
                  <p className="text-[11px] text-slate-500">Workspace authority required</p>
                </div>
              </div>
              <button
                onClick={closeDeleteModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {deleteError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-xs font-bold text-slate-900">{contactToDelete.name}</div>
                <div className="text-[11px] text-slate-500 font-mono">{contactToDelete.email}</div>
                {contactToDelete.phone && (
                  <div className="text-[11px] text-slate-600 font-mono">{contactToDelete.phone}</div>
                )}
              </div>

              <p className="text-xs text-slate-600">
                Are you sure you want to delete this contact? This will remove the contact from the workspace directory.
              </p>

              {contactToDelete.deals && contactToDelete.deals.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    This contact is currently linked to <strong>{contactToDelete.deals.length} active deal(s)</strong>. The deals will be preserved and unlinked.
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all shadow-xs disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Contact</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, ArrowLeft, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function NewContactPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [existingContacts, setExistingContacts] = useState<{ email: string; name: string }[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/contacts')
      .then((res) => res.json())
      .then((data) => {
        if (data.contacts) {
          setExistingContacts(data.contacts.map((c: any) => ({ email: c.email.toLowerCase(), name: c.name })));
        }
      })
      .catch(() => {});
  }, []);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    const normalized = val.trim().toLowerCase();
    if (normalized.length > 3) {
      const match = existingContacts.find((c) => c.email === normalized);
      if (match) {
        setDuplicateWarning(`Case-insensitive match: "${match.email}" is already registered to "${match.name}" in this workspace.`);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setError(`HTTP 409 Conflict: ${data.error}`);
          return;
        }
        if (res.status === 403) {
          setError(`HTTP 403 Forbidden: Viewer role cannot create contacts.`);
          return;
        }
        throw new Error(data.error || 'Failed to create contact');
      }

      router.push('/contacts');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto my-8 p-6 calm-panel bg-white space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <Link href="/contacts" className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Contacts</span>
        </Link>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
          Duplicate Guard
        </span>
      </div>

      <div>
        <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-600" />
          Add Contact Record
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Email uniqueness is strictly enforced per workspace using case-insensitive normalization.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {duplicateWarning && (
        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-900">Duplicate Email Detected:</span>
            <p className="text-amber-800">{duplicateWarning}</p>
            <p className="text-[11px] text-amber-700">Submitting will return HTTP 409 Conflict to protect existing data.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 text-xs calm-input"
            placeholder="e.g. Maya Lin"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Work Email * <span className="text-slate-400 font-normal">(Case-Insensitive)</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            className={`w-full p-2.5 text-xs calm-input ${
              duplicateWarning ? 'border-amber-400 bg-amber-50/50' : ''
            }`}
            placeholder="e.g. maya@acme.synthetic"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-2.5 text-xs calm-input"
            placeholder="+91 98765 43210"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg btn-primary-gradient font-bold transition-all disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Save Contact'}
        </button>
      </form>
    </div>
  );
}

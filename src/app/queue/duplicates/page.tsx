'use client';

import React, { useState, useEffect } from 'react';
import { 
  CopyCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Play 
} from 'lucide-react';
import Link from 'next/link';

interface DuplicateCluster {
  type: string;
  identifier: string;
  count: number;
  contacts: { id: string; name: string; email: string; phone?: string; createdAt: string }[];
}

export default function DuplicatesQueuePage() {
  const [clusters, setClusters] = useState<DuplicateCluster[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Simulator state
  const [testEmail, setTestEmail] = useState('SOPHIA@AuraRobotics.SYNTHETIC');
  const [simResult, setSimResult] = useState<{ status: number; message: string; type: 'success' | 'conflict' } | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const fetchDuplicates = async () => {
    try {
      const res = await fetch('/api/contacts/duplicates');
      if (res.ok) {
        const data = await res.json();
        setClusters(data.duplicates || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();

    const handleRoleChange = () => fetchDuplicates();
    window.addEventListener('clientflow_role_changed', handleRoleChange);
    return () => window.removeEventListener('clientflow_role_changed', handleRoleChange);
  }, []);

  const runSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimLoading(true);
    setSimResult(null);

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Duplicate Test Probe',
          email: testEmail,
        }),
      });

      const data = await res.json();
      if (res.status === 409) {
        setSimResult({
          status: 409,
          message: `🛡️ HTTP 409 Conflict: ${data.error}`,
          type: 'conflict',
        });
      } else if (res.status === 403) {
        setSimResult({
          status: 403,
          message: `🔒 403 Forbidden: Viewer cannot create contacts (RBAC)`,
          type: 'conflict',
        });
      } else if (res.ok) {
        setSimResult({
          status: 201,
          message: `✅ Created: New contact saved because no duplicate existed`,
          type: 'success',
        });
        fetchDuplicates();
      } else {
        setSimResult({
          status: res.status,
          message: data.error || 'Request failed',
          type: 'conflict',
        });
      }
    } catch (err: any) {
      setSimResult({
        status: 500,
        message: err.message,
        type: 'conflict',
      });
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-base font-bold text-slate-900">
              Duplicate Guard & Normalization
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
              Enforcing
            </span>
          </div>
          <p className="text-xs text-slate-600 max-w-xl">
            Case-insensitive email normalization. Any attempt to register an existing contact with alternate casing is safely rejected with <strong className="text-emerald-800">HTTP 409 Conflict</strong>.
          </p>
        </div>

        <Link
          href="/contacts"
          className="px-3.5 py-2 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all shrink-0"
        >
          View Contacts
        </Link>
      </div>

      {/* 2. Interactive Tester */}
      <div className="calm-panel p-5 bg-white space-y-3">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Test Duplicate Rejection (HTTP 409)
        </h2>
        <p className="text-xs text-slate-500">
          Try submitting an existing contact email in uppercase or mixed casing to verify normalization in action:
        </p>

        <form onSubmit={runSimulation} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            required
            placeholder="e.g. SOPHIA@AURAROBOTICS.SYNTHETIC"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1 px-3 py-2 text-xs calm-input font-mono"
          />

          <button
            type="submit"
            disabled={simLoading}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shrink-0 flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{simLoading ? 'Verifying...' : 'Submit Duplicate Test'}</span>
          </button>
        </form>

        {simResult && (
          <div className={`p-3.5 rounded-lg border text-xs font-medium animate-fade-in ${
            simResult.status === 409
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : simResult.status === 403
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <div>{simResult.message}</div>
            <p className="text-[11px] opacity-80 mt-0.5">
              {simResult.status === 409
                ? 'Case-insensitive index intercepted the duplicate and blocked insertion.'
                : simResult.status === 403
                ? 'Viewer role blocked from mutation.'
                : 'Unique email accepted.'}
            </p>
          </div>
        )}
      </div>

      {/* 3. Clusters Status */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 calm-panel">
            Auditing workspace duplicate clusters...
          </div>
        ) : clusters.length === 0 ? (
          <div className="p-16 text-center calm-panel border-dashed border-slate-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Zero Duplicate Clusters</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All workspace contacts are uniquely normalized. Single source of truth preserved.
            </p>
          </div>
        ) : (
          clusters.map((cluster, idx) => (
            <div key={idx} className="calm-card p-4 space-y-2 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Cluster: {cluster.identifier}
                </span>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {cluster.count} Records
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

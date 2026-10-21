'use client';

import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Clock, 
  ArrowUpRight, 
  AlertTriangle, 
  CheckCircle2 
} from 'lucide-react';
import Link from 'next/link';

interface StaleDeal {
  id: string;
  title: string;
  value: number;
  stage: string;
  daysInactive: number;
  staleLevel: 'YELLOW' | 'RED';
  lastActivityAtIST: string;
  contactName: string;
  priorityScore: number;
  nextAction: string;
}

export default function StaleQueuePage() {
  const [deals, setDeals] = useState<StaleDeal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStale = async () => {
    try {
      const res = await fetch('/api/followups/stale');
      if (res.ok) {
        const data = await res.json();
        setDeals(data.staleDeals || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStale();

    const handleRoleChange = () => fetchStale();
    window.addEventListener('clientflow_role_changed', handleRoleChange);
    return () => window.removeEventListener('clientflow_role_changed', handleRoleChange);
  }, []);

  const redCount = deals.filter(d => d.staleLevel === 'RED').length;
  const yellowCount = deals.filter(d => d.staleLevel === 'YELLOW').length;

  return (
    <div className="space-y-6">
      {/* 1. Calm Header */}
      <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Flame className="w-5 h-5" />
            </span>
            <h1 className="text-base font-bold text-slate-900">
              Stale Deals Watchlist
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
              {deals.length} Stagnant
            </span>
          </div>
          <p className="text-xs text-slate-600 max-w-xl">
            Identifies deals with zero sales touches: <strong className="text-amber-800">Yellow (7–14 days)</strong> and <strong className="text-rose-800">Red (&gt;14 days)</strong> to prevent pipeline leakage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold">
            {yellowCount} Warning (7–14d)
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-rose-100 border border-rose-200 text-rose-900 text-xs font-semibold">
            {redCount} Critical (&gt;14d)
          </div>
        </div>
      </div>

      {/* 2. Deals List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 calm-panel">
            Auditing pipeline dormancy...
          </div>
        ) : deals.length === 0 ? (
          <div className="p-16 text-center calm-panel border-dashed border-slate-200 space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Pipeline Velocity is High</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All active deals have recent touches. Zero stagnant deals detected.
            </p>
            <Link
              href="/pipeline"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold btn-primary-gradient mt-2"
            >
              <span>Back to Pipeline</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          deals.map((deal) => {
            const isRed = deal.staleLevel === 'RED';

            return (
              <div
                key={deal.id}
                className="calm-card p-4 space-y-3 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">
                      {deal.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                      {deal.stage}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      ${deal.value.toLocaleString()}
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      isRed 
                        ? 'bg-rose-50 border-rose-200 text-rose-700' 
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      {deal.daysInactive}d Inactive ({isRed ? 'RED >14D' : 'YELLOW 7-14D'})
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    Lead Contact: <strong className="text-slate-800">{deal.contactName}</strong>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2">
                    <span className="text-slate-600">
                      Last Activity: <strong className="text-slate-800 font-mono">{deal.lastActivityAtIST}</strong>
                    </span>
                    <span className="text-blue-700 font-medium">
                      Next Touch: {deal.nextAction}
                    </span>
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Priority Score</div>
                    <div className="text-lg font-black text-amber-700 font-mono">
                      {deal.priorityScore} <span className="text-xs text-slate-400">/ 30</span>
                    </div>
                  </div>

                  <Link
                    href="/pipeline"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>Re-engage Deal</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

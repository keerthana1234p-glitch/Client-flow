'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertCircle,
  ArrowUpRight,
  Flame,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

interface OverdueItem {
  id: string;
  action: string;
  dueAtIST: string;
  badge: string;
  priorityScore: number;
  deal: {
    id: string;
    title: string;
    value: number;
    stage: string;
    contactName: string;
    lastActivityAtIST: string;
  };
}

export default function OverdueQueuePage() {
  const [items, setItems] = useState<OverdueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOverdue = async () => {
    try {
      const res = await fetch('/api/followups/overdue');
      if (res.ok) {
        const data = await res.json();
        setItems(data.overdue || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdue();

    const handleRoleChange = () => fetchOverdue();
    window.addEventListener('clientflow_role_changed', handleRoleChange);
    return () => window.removeEventListener('clientflow_role_changed', handleRoleChange);
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Calm Header */}
      <div className="p-5 rounded-xl border border-rose-200 bg-rose-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-base font-bold text-slate-900">
              Overdue Follow-up Queue
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
              {items.length} Pending
            </span>
          </div>
          <p className="text-xs text-slate-600 max-w-xl">
            Tasks past their scheduled deadline in Indian Standard Time (IST) automatically receive <strong className="text-rose-700">+10 points</strong> to accelerate follow-up urgency.
          </p>
        </div>

        <div className="text-xs font-mono font-bold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shrink-0 flex items-center gap-1.5 shadow-xs">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>Asia/Kolkata (IST)</span>
        </div>
      </div>

      {/* 2. Calm Scoring Rule Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-lg border border-slate-200 bg-white">
          <span className="text-[10px] text-rose-700 uppercase font-bold block">Overdue Action</span>
          <span className="text-lg font-black text-slate-900 font-mono">+10 pts</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">DueAt &lt; Now (IST)</span>
        </div>
        <div className="p-3 rounded-lg border border-slate-200 bg-white">
          <span className="text-[10px] text-blue-700 uppercase font-bold block">High Value Deal</span>
          <span className="text-lg font-black text-slate-900 font-mono">+5 pts</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Value &gt; $100k</span>
        </div>
        <div className="p-3 rounded-lg border border-slate-200 bg-white">
          <span className="text-[10px] text-amber-700 uppercase font-bold block">Inactivity</span>
          <span className="text-lg font-black text-slate-900 font-mono">+7 to +10 pts</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">7–14d / &gt;14d stale</span>
        </div>
        <div className="p-3 rounded-lg border border-slate-200 bg-white">
          <span className="text-[10px] text-sky-700 uppercase font-bold block">Stage Fit</span>
          <span className="text-lg font-black text-slate-900 font-mono">+3 pts</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Qualified stage</span>
        </div>
      </div>

      {/* 3. Items List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 calm-panel">
            Auditing overdue follow-ups...
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center calm-panel border-dashed border-slate-200 space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">All Follow-ups Up to Date</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Zero overdue items in this workspace. Follow-up accountability is fully satisfied.
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
          items.map((item) => (
            <div
              key={item.id}
              className="calm-card p-4 space-y-3 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900">
                    {item.deal.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    {item.deal.stage}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    ${item.deal.value.toLocaleString()}
                  </span>
                </div>

                <div className="text-xs text-slate-500">
                  Target Contact: <strong className="text-slate-800">{item.deal.contactName}</strong>
                </div>

                <div className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-200 text-xs">
                  <span className="text-[10px] font-bold text-rose-700 block mb-0.5">
                    IST DEADLINE: {item.dueAtIST}
                  </span>
                  <p className="text-slate-800 font-medium">"{item.action}"</p>
                </div>
              </div>

              {/* Priority Score Column */}
              <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Priority Score</div>
                  <div className="text-lg font-black text-rose-600 font-mono">
                    {item.priorityScore} <span className="text-xs text-slate-400">/ 30</span>
                  </div>
                </div>

                <Link
                  href="/pipeline"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>Resolve in Kanban</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

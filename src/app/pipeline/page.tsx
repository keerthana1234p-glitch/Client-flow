'use client';

import React, { useState, useEffect } from 'react';
import { 
  Kanban, 
  Plus, 
  DollarSign, 
  Clock, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  X,
  TrendingUp,
  Flame,
  Award,
  Search,
  ArrowRight,
  Filter,
  Layers,
  Calendar,
  User,
  Zap,
  FileText,
  Sparkles,
  Trash2,
  Loader2,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { formatISTDateTime } from '@/lib/timezone';
import { calculatePriorityScore } from '@/lib/priority';

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  temperature?: string;
  lastActivityAt: string;
  contact?: { name: string; email: string };
  followUps?: { id: string; dueAt: string; status: string; action: string }[];
}

const STAGES = [
  { 
    id: 'LEAD', 
    label: 'Lead', 
    headerColor: 'bg-slate-100 text-slate-800 border-slate-200',
    dotColor: 'bg-slate-500',
    desc: 'Incoming sales leads'
  },
  { 
    id: 'QUALIFIED', 
    label: 'Qualified', 
    headerColor: 'bg-sky-50 text-sky-800 border-sky-200',
    dotColor: 'bg-sky-500',
    desc: 'Budget & fit verified (+3 score)'
  },
  { 
    id: 'WON', 
    label: 'Closed Won', 
    headerColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotColor: 'bg-emerald-500',
    desc: 'Signed contracts'
  },
  { 
    id: 'LOST', 
    label: 'Closed Lost', 
    headerColor: 'bg-rose-50 text-rose-800 border-rose-200',
    dotColor: 'bg-rose-500',
    desc: 'Deferred or closed'
  },
];

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [userRole, setUserRole] = useState<string>('ADMIN');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contacts, setContacts] = useState<{ id: string; name: string; email: string; phone?: string }[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newValue, setNewValue] = useState(50000);
  const [newStage, setNewStage] = useState('LEAD');
  const [newContactId, setNewContactId] = useState('');
  const [newNextAction, setNewNextAction] = useState('Initial Discovery Call');
  const [newDueDate, setNewDueDate] = useState('');
  const [newTemperature, setNewTemperature] = useState<'HOT' | 'WARM' | 'NORMAL'>('WARM');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Deal Modal State
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
  const [isDeletingDeal, setIsDeletingDeal] = useState(false);
  const [deleteDealError, setDeleteDealError] = useState<string | null>(null);

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

  const loadData = async () => {
    try {
      const [dealsRes, contactsRes] = await Promise.all([
        fetch('/api/deals'),
        fetch('/api/contacts')
      ]);

      if (dealsRes.ok) {
        const data = await dealsRes.json();
        setDeals(data.deals || []);
      } else if (dealsRes.status === 401) {
        window.location.href = '/login';
      }

      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setContacts(data.contacts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeals = async () => {
    try {
      const res = await fetch('/api/deals');
      if (res.ok) {
        const data = await res.json();
        setDeals(data.deals || []);
      } else if (res.status === 401) {
        window.location.href = '/login';
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkRole();
    loadData();

    const handleRoleChange = () => {
      checkRole();
      loadData();
    };
    window.addEventListener('clientflow_role_changed', handleRoleChange);
    return () => window.removeEventListener('clientflow_role_changed', handleRoleChange);
  }, []);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleStageMove = async (dealId: string, targetStage: string) => {
    try {
      const res = await fetch(`/api/deals/${dealId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: targetStage }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          notify(`403 Forbidden: ${data.error} (Viewer mode cannot edit records)`, 'error');
          return;
        }
        throw new Error(data.error || 'Failed to update deal stage');
      }

      notify(`Deal transitioned to ${targetStage}`, 'success');
      fetchDeals();
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          value: Number(newValue),
          stage: newStage,
          contactId: newContactId || null,
          nextAction: newNextAction.trim(),
          dueDate: newDueDate || null,
          temperature: newTemperature,
          notes: newNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          notify(`403 Forbidden: Viewer role cannot create deals`, 'error');
          return;
        }
        throw new Error(data.error || 'Failed to create deal');
      }

      notify(`Deal "${newTitle}" created successfully with linked touchpoints`, 'success');
      setIsModalOpen(false);
      setNewTitle('');
      setNewValue(50000);
      setNewContactId('');
      setNewNextAction('Initial Discovery Call');
      setNewDueDate('');
      setNewTemperature('WARM');
      setNewNotes('');
      fetchDeals();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const promptDeleteDeal = (deal: Deal) => {
    if (userRole === 'VIEWER') {
      notify('HTTP 403 Forbidden: Viewers have read-only access and cannot delete deals.', 'error');
      return;
    }
    if (userRole === 'MEMBER') {
      notify('HTTP 403 Forbidden: Team Members cannot delete deals. Only Admins and Owners are authorized.', 'error');
      return;
    }
    setDealToDelete(deal);
    setDeleteDealError(null);
  };

  const handleConfirmDeleteDeal = async () => {
    if (!dealToDelete) return;
    setIsDeletingDeal(true);
    setDeleteDealError(null);

    try {
      const res = await fetch(`/api/deals/${dealToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        setDeleteDealError(data.error || 'Failed to delete deal');
        setIsDeletingDeal(false);
        return;
      }

      setDeals((prev) => prev.filter((d) => d.id !== dealToDelete.id));
      notify(`Deal "${dealToDelete.title}" deleted successfully`, 'success');
      setDealToDelete(null);
    } catch (err: any) {
      setDeleteDealError(err.message || 'An error occurred while deleting.');
    } finally {
      setIsDeletingDeal(false);
    }
  };

  // Metrics
  const activeDeals = deals.filter(d => ['LEAD', 'QUALIFIED'].includes(d.stage));
  const totalPipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
  const wonDeals = deals.filter(d => d.stage === 'WON');
  const totalWonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);

  // Deals with priority score >= 20
  const highPriorityDeals = deals.filter(d => {
    const latestFollowUp = d.followUps && d.followUps[0];
    const score = calculatePriorityScore({
      value: d.value,
      stage: d.stage,
      dueAt: latestFollowUp ? latestFollowUp.dueAt : null,
      lastActivityAt: d.lastActivityAt,
    });
    return score >= 20;
  });

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = !search.trim() || 
      deal.title.toLowerCase().includes(search.toLowerCase()) ||
      (deal.contact && deal.contact.name.toLowerCase().includes(search.toLowerCase()));
    const matchesStage = stageFilter === 'ALL' || deal.stage === stageFilter;
    const dealTemp = (deal.temperature || 'WARM').toUpperCase();
    const isClosed = deal.stage === 'WON' || deal.stage === 'LOST';
    const matchesPriority = priorityFilter === 'ALL' || (!isClosed && dealTemp === priorityFilter);
    return matchesSearch && matchesStage && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* 1. Calm, Clean Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="calm-card p-4">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Active Pipeline Volume</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            ${totalPipelineValue.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {activeDeals.length} active sales deals
          </div>
        </div>

        <div className="calm-card p-4">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Closed Won Revenue</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700 font-mono">
            ${totalWonValue.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {wonDeals.length} deals closed & contracted
          </div>
        </div>

        <div className="calm-card p-4">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>High Priority Follow-ups</span>
            <Flame className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700 font-mono">
            {highPriorityDeals.length} Deals
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Priority score ≥ 20 (requires follow-up)
          </div>
        </div>

        <div className="calm-card p-4">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Total Tracked Pipeline</span>
            <Layers className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            {deals.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Enforced in Indian Standard Time (IST)
          </div>
        </div>
      </div>

      {/* 2. Calm Search, Filter & Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 calm-card bg-white">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by deal title or contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs calm-input"
            />
          </div>

          {/* Calm Stage Filters */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <button
              onClick={() => setStageFilter('ALL')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                stageFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              All ({deals.length})
            </button>
            {STAGES.map((s) => {
              const count = deals.filter(d => d.stage === s.id).length;
              const isSelected = stageFilter === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setStageFilter(s.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : s.dotColor}`} />
                  <span>{s.label}</span>
                  <span className="text-[10px] opacity-80">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Priority Quick Filter */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-200 overflow-x-auto py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden xl:inline">Priority:</span>
            {[
              { id: 'ALL', label: 'All', active: 'bg-slate-800 text-white' },
              { id: 'HOT', label: '🔥 High', active: 'bg-rose-600 text-white shadow-xs' },
              { id: 'WARM', label: '⚡ Medium', active: 'bg-amber-600 text-white shadow-xs' },
              { id: 'NORMAL', label: 'Standard', active: 'bg-slate-600 text-white shadow-xs' },
            ].map((p) => {
              const isSelected = priorityFilter === p.id;
              const count = p.id === 'ALL' 
                ? deals.length 
                : deals.filter(d => (d.temperature || 'WARM').toUpperCase() === p.id).length;
              return (
                <button
                  key={p.id}
                  onClick={() => setPriorityFilter(p.id)}
                  className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                    isSelected
                      ? p.active
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{p.label}</span>
                  <span className="text-[10px] opacity-80">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button: Show New Deal for authorized roles, or calm Read-only badge for Viewer */}
        {userRole === 'VIEWER' ? (
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
            <span>Read-Only Executive View</span>
          </div>
        ) : (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white shadow-md shadow-blue-500/25 transition-all shrink-0 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Deal</span>
          </button>
        )}
      </div>

      {/* 3. Notification Toast */}
      {feedback && (
        <div className={`p-3 rounded-lg flex items-center gap-2 text-xs font-medium border ${
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 4. Kanban Pipeline Stage Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAGES.map((col) => {
          const colDeals = filteredDeals.filter((d) => d.stage === col.id);
          const colValue = colDeals.reduce((sum, d) => sum + d.value, 0);

          return (
            <div
              key={col.id}
              className="flex flex-col min-h-[480px] rounded-xl border border-slate-200 bg-slate-100/60 p-3 space-y-3"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {col.label}
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                  {colDeals.length}
                </span>
              </div>

              {/* Subtotal */}
              <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between px-1">
                <span>Stage Volume:</span>
                <span className="text-slate-900 font-mono font-bold">${colValue.toLocaleString()}</span>
              </div>

              {/* Deal Cards */}
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {colDeals.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 rounded-lg border border-dashed border-slate-200 bg-white/50 flex flex-col items-center justify-center gap-1.5 mt-2">
                    <Kanban className="w-4 h-4 text-slate-300" />
                    <span>No deals in this stage</span>
                  </div>
                ) : (
                  colDeals.map((deal) => {
                    const latestFollowUp = deal.followUps && deal.followUps[0];
                    const priorityScore = calculatePriorityScore({
                      value: deal.value,
                      stage: deal.stage,
                      dueAt: latestFollowUp ? latestFollowUp.dueAt : null,
                      lastActivityAt: deal.lastActivityAt,
                    });

                    // Calm badge color
                    const scoreBadge = priorityScore >= 20
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : priorityScore >= 10
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200';

                    // Priority visual style (Urgency only applies to active pipeline deals: LEAD & QUALIFIED)
                    const isClosedWon = deal.stage === 'WON';
                    const isClosedLost = deal.stage === 'LOST';
                    const isClosed = isClosedWon || isClosedLost;

                    const temp = (deal.temperature || 'WARM').toUpperCase();
                    const priorityStyle = isClosedWon
                      ? {
                          label: 'Closed Won',
                          border: 'border-l-4 border-l-emerald-500 shadow-emerald-500/5',
                          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                          dot: 'bg-emerald-500',
                          icon: Award,
                        }
                      : isClosedLost
                      ? {
                          label: 'Closed Lost',
                          border: 'border-l-4 border-l-slate-300 opacity-75',
                          badge: 'bg-slate-100 text-slate-500 border-slate-200',
                          dot: 'bg-slate-400',
                          icon: Clock,
                        }
                      : temp === 'HOT'
                      ? {
                          label: 'High Priority',
                          border: 'border-l-4 border-l-rose-500 shadow-rose-500/10',
                          badge: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-400/20',
                          dot: 'bg-rose-500 animate-pulse',
                          icon: Flame,
                        }
                      : temp === 'NORMAL'
                      ? {
                          label: 'Standard',
                          border: 'border-l-4 border-l-slate-300',
                          badge: 'bg-slate-100 text-slate-600 border-slate-200',
                          dot: 'bg-slate-400',
                          icon: Clock,
                        }
                      : {
                          label: 'Medium Priority',
                          border: 'border-l-4 border-l-amber-500 shadow-amber-500/10',
                          badge: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-400/20',
                          dot: 'bg-amber-500',
                          icon: Zap,
                        };

                    return (
                      <div
                        key={deal.id}
                        className={`calm-card p-3.5 space-y-2 bg-white relative group transition-all hover:shadow-md ${priorityStyle.border}`}
                      >
                        {/* Top: Status Tag & Value */}
                        <div className="flex items-center justify-between gap-1.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${priorityStyle.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dot}`} />
                            <priorityStyle.icon className="w-3 h-3 shrink-0" />
                            <span>{priorityStyle.label}</span>
                          </span>
                          <span className="text-xs font-mono font-black text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            ${deal.value.toLocaleString()}
                          </span>
                        </div>

                        {/* Title & Value & Actions */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 min-w-0 flex-1">
                            {deal.title}
                          </h3>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                promptDeleteDeal(deal);
                              }}
                              title={
                                userRole === 'VIEWER' || userRole === 'MEMBER'
                                  ? 'Access Denied: Only Admins/Owners can delete (403)'
                                  : 'Delete deal'
                              }
                              className={`p-1 rounded-md border transition-all ${
                                userRole === 'VIEWER' || userRole === 'MEMBER'
                                  ? 'border-slate-100 bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 cursor-not-allowed'
                                  : 'border-slate-200 bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300'
                              }`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Contact */}
                        {deal.contact && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate font-medium">{deal.contact.name}</span>
                          </div>
                        )}

                        {/* Status / Priority Score Meter */}
                        {deal.stage === 'WON' ? (
                          <div className="pt-1.5 border-t border-slate-100 space-y-1.5 text-[10px]">
                            <div className="flex items-center justify-between font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Closed Won • Deal Finalized</span>
                              </span>
                            </div>

                            {/* TeamFlow Sync Status Indicator */}
                            <div className="flex items-center justify-between gap-1 p-1.5 rounded-lg bg-gradient-to-r from-cyan-50 to-sky-50 border border-cyan-200 text-cyan-900 shadow-2xs">
                              <span className="flex items-center gap-1.5 font-bold text-[10px] text-cyan-800">
                                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                                <span>Synced to TeamFlow Delivery</span>
                              </span>
                              <span className="text-[9px] font-mono font-bold bg-white text-cyan-700 px-1.5 py-0.2 rounded border border-cyan-200">
                                HTTP 200 OK
                              </span>
                            </div>
                          </div>
                        ) : deal.stage === 'LOST' ? (
                          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
                            <span className="flex items-center gap-1 font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md w-full justify-center">
                              <span>Closed Lost • Deal Archived</span>
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1 pt-1 border-t border-slate-100">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-500 font-medium">Priority Score</span>
                              <span className={`px-1.5 py-0.2 rounded font-mono font-bold border ${scoreBadge}`}>
                                {priorityScore} / 30
                              </span>
                            </div>
                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  priorityScore >= 20 ? 'bg-rose-500' : priorityScore >= 10 ? 'bg-amber-500' : 'bg-slate-400'
                                }`}
                                style={{ width: `${Math.min(100, (priorityScore / 30) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* IST Date */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>IST Activity:</span>
                          </span>
                          <span className="font-mono text-slate-600 font-medium">
                            {formatISTDateTime(deal.lastActivityAt)}
                          </span>
                        </div>

                        {/* Stage Progression Buttons (Hidden for Viewer, active for authorized roles) */}
                        {userRole !== 'VIEWER' ? (
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                            <span className="text-[10px] text-slate-400 font-medium">Move to:</span>
                            <div className="flex items-center gap-1">
                              {STAGES.filter((s) => s.id !== deal.stage).map((s) => (
                                <button
                                  key={s.id}
                                  onClick={() => handleStageMove(deal.id, s.id)}
                                  className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white transition-all cursor-pointer shadow-2xs"
                                  title={`Move to ${s.label}`}
                                >
                                  {s.id}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Stage:</span>
                            <span className="font-semibold text-slate-700">{deal.stage}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Enterprise Deal Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="calm-panel max-w-2xl w-full p-6 space-y-4 bg-white animate-fade-in shadow-2xl border border-slate-200 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span>Add New Deal</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Establish commercial terms, link client contacts, and schedule touchpoint deadlines in Indian Standard Time (IST).
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1: Core Deal Terms */}
                <div className="space-y-3.5">
                  <div className="border-b border-slate-100 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">1. Commercial Terms</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Deal Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Autonomous Fleet Telemetry Suite"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs calm-input"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Deal Value (USD) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      required
                      value={newValue}
                      onChange={(e) => setNewValue(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs calm-input font-mono"
                    />
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {[25000, 50000, 100000, 250000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setNewValue(val)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors ${
                            newValue === val 
                              ? 'bg-blue-600 text-white font-bold' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          ${val / 1000}k
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Initial Pipeline Stage
                    </label>
                    <select
                      value={newStage}
                      onChange={(e) => setNewStage(e.target.value)}
                      className="w-full px-3 py-2 text-xs calm-input font-medium"
                    >
                      <option value="LEAD">LEAD (New Prospect)</option>
                      <option value="QUALIFIED">QUALIFIED (+3 Priority Score)</option>
                      <option value="WON">CLOSED WON</option>
                      <option value="LOST">CLOSED LOST</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Associated Client Contact</span>
                      <span className="text-[10px] font-normal text-slate-400">({contacts.length} registered)</span>
                    </label>
                    <select
                      value={newContactId}
                      onChange={(e) => setNewContactId(e.target.value)}
                      className="w-full px-3 py-2 text-xs calm-input"
                    >
                      <option value="">-- No Contact Linked (Unassigned) --</option>
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Column 2: Follow-up & Priority Cadence */}
                <div className="space-y-3.5">
                  <div className="border-b border-slate-100 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">2. Follow-up & Urgency Cadence</span>
                  </div>

                  {/* Priority Level Selector */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Priority Level
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setNewTemperature('HOT')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          newTemperature === 'HOT'
                            ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs ring-1 ring-rose-400'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                        <span>High</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewTemperature('WARM')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          newTemperature === 'WARM'
                            ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-xs ring-1 ring-amber-400'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                        <span>Medium</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewTemperature('NORMAL')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          newTemperature === 'NORMAL'
                            ? 'bg-slate-100 border-slate-300 text-slate-800 shadow-xs ring-1 ring-slate-400'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                        <span>Standard</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      First Follow-up Commitment Action
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Initial Discovery Call / Demo"
                      value={newNextAction}
                      onChange={(e) => setNewNextAction(e.target.value)}
                      className="w-full px-3 py-2 text-xs calm-input"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Target Due Date (IST)</span>
                      <span className="text-[10px] text-slate-400">Asia/Kolkata</span>
                    </label>
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs calm-input font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Sets the exact deadline. If missed, CRM automatically flags +10 overdue points!
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Initial Scope Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Key requirements, client timelines, or project budget notes..."
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs calm-input resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg text-xs font-bold btn-primary-gradient disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Creating Deal...' : 'Create Deal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Deal Confirmation Modal */}
      {dealToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center font-bold">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Delete Deal</h3>
                  <p className="text-[11px] text-slate-500">Pipeline authority required</p>
                </div>
              </div>
              <button
                onClick={() => setDealToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {deleteDealError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{deleteDealError}</span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-slate-900">{dealToDelete.title}</div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono font-bold text-blue-600">${dealToDelete.value.toLocaleString()}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[10px]">{dealToDelete.stage}</span>
                </div>
                {dealToDelete.contact && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-200">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>Contact: {dealToDelete.contact.name}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-600">
                Are you sure you want to delete this deal? It will be permanently removed from the Kanban pipeline.
              </p>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDealToDelete(null)}
                  disabled={isDeletingDeal}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteDeal}
                  disabled={isDeletingDeal}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all shadow-xs disabled:opacity-50"
                >
                  {isDeletingDeal ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Deal</span>
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

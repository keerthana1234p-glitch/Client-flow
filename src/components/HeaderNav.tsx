'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Kanban, 
  Users, 
  AlertCircle, 
  Flame, 
  ShieldCheck, 
  Clock, 
  Shield, 
  Crown, 
  Briefcase, 
  UserCheck, 
  Eye,
  LogOut
} from 'lucide-react';
import { OjixLogo } from '@/components/OjixLogo';

interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OWNER' | 'MEMBER' | 'VIEWER';
  workspaceId: string;
  workspaceName?: string;
}

interface NavLinkItem {
  href: string;
  label: string;
  icon: any;
  badge?: string | null;
  badgeColor?: string;
}

// 4 Defined Roles with specific scopes
const FOUR_ROLES = [
  { 
    role: 'ADMIN', 
    label: 'Workspace Admin', 
    name: 'Admin', 
    email: 'admin@test.com', 
    icon: Crown,
    badgeColor: 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-xs',
    scopeDescription: 'Full workspace administration & all queues'
  },
  { 
    role: 'OWNER', 
    label: 'Sales / Account Owner', 
    name: 'Sales Owner', 
    email: 'owner@test.com', 
    icon: Briefcase,
    badgeColor: 'bg-indigo-600 text-white shadow-xs',
    scopeDescription: 'Pipeline leadership, high-value deals & deal health'
  },
  { 
    role: 'MEMBER', 
    label: 'Team Member', 
    name: 'Team Member', 
    email: 'member@test.com', 
    icon: UserCheck,
    badgeColor: 'bg-sky-600 text-white shadow-xs',
    scopeDescription: 'Frontline sales execution & daily follow-up queue'
  },
  { 
    role: 'VIEWER', 
    label: 'Viewer', 
    name: 'Viewer', 
    email: 'viewer@test.com', 
    icon: Eye,
    badgeColor: 'bg-slate-700 text-white shadow-xs',
    scopeDescription: 'Executive auditor view: Pipeline & Contacts only'
  },
];

export function HeaderNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [istTime, setIstTime] = useState<string>('');
  const [overdueCount, setOverdueCount] = useState<number>(0);

  // If on login or signup page, DO NOT render the dashboard header at all
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now);
      setIstTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkSession = () => {
    try {
      const match = document.cookie.match(/(^|;)\s*clientflow_session\s*=\s*([^;]+)/);
      if (match) {
        const parsed = JSON.parse(decodeURIComponent(match[2]));
        setSession(parsed);
      } else {
        setSession(null);
        if (!isAuthPage) {
          router.push('/login');
        }
      }
    } catch {
      setSession(null);
      if (!isAuthPage) {
        router.push('/login');
      }
    }
  };

  const fetchBadgeCounts = async () => {
    try {
      const res = await fetch('/api/followups/overdue');
      if (res.ok) {
        const data = await res.json();
        setOverdueCount((data.overdue || []).length);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    checkSession();
    fetchBadgeCounts();

    const handleRoleChange = () => checkSession();
    window.addEventListener('clientflow_role_changed', handleRoleChange);
    return () => window.removeEventListener('clientflow_role_changed', handleRoleChange);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    document.cookie = 'clientflow_session=; Max-Age=0; path=/;';
    setSession(null);
    window.dispatchEvent(new Event('clientflow_role_changed'));
    router.push('/login');
    router.refresh();
  };

  // If on login or signup page, do not render dashboard header
  if (isAuthPage) {
    return null;
  }

  // Role-Tailored Navigation: Show only what each role actually needs
  const getNavLinks = (): NavLinkItem[] => {
    const role = session?.role;

    if (role === 'VIEWER') {
      return [
        { href: '/contacts', label: 'Client Contacts', icon: Users, badge: null },
        { href: '/pipeline', label: 'Pipeline Overview', icon: Kanban, badge: 'Read-only' },
      ];
    }

    if (role === 'MEMBER') {
      return [
        { href: '/contacts', label: 'Contacts', icon: Users, badge: null },
        { href: '/pipeline', label: 'My Pipeline', icon: Kanban, badge: null },
        { 
          href: '/queue/overdue', 
          label: 'My Overdue Tasks', 
          icon: AlertCircle, 
          badge: overdueCount > 0 ? `${overdueCount}` : null,
          badgeColor: 'bg-rose-100 text-rose-700 border border-rose-200'
        },
      ];
    }

    if (role === 'OWNER') {
      return [
        { href: '/contacts', label: 'Contacts', icon: Users, badge: null },
        { href: '/pipeline', label: 'Pipeline', icon: Kanban, badge: null },
        { 
          href: '/queue/overdue', 
          label: 'Overdue Follow-ups', 
          icon: AlertCircle, 
          badge: overdueCount > 0 ? `${overdueCount}` : null,
          badgeColor: 'bg-rose-100 text-rose-700 border border-rose-200'
        },
        { href: '/queue/stale', label: 'Stale Deals', icon: Flame, badge: null },
      ];
    }

    return [
      { href: '/contacts', label: 'Contacts', icon: Users, badge: null },
      { href: '/pipeline', label: 'Pipeline', icon: Kanban, badge: null },
      { 
        href: '/queue/overdue', 
        label: 'Overdue Follow-ups', 
        icon: AlertCircle, 
        badge: overdueCount > 0 ? `${overdueCount}` : null,
        badgeColor: 'bg-rose-100 text-rose-700 border border-rose-200'
      },
      { href: '/queue/stale', label: 'Stale Deals', icon: Flame, badge: null },
      { href: '/queue/duplicates', label: 'Duplicate Guard', icon: ShieldCheck, badge: null },
    ];
  };

  const navLinks: NavLinkItem[] = getNavLinks();
  const activeRoleConfig = FOUR_ROLES.find(r => r.role === session?.role) || FOUR_ROLES[0];
  const RoleIcon = activeRoleConfig.icon;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* 1. Dashboard Top Utility Bar */}
      <div className="bg-slate-50 border-b border-slate-200/80 px-4 sm:px-6 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Workspace Identity */}
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-slate-500">Workspace:</span>
            <span className="font-semibold text-slate-900">
              {session?.workspaceName || 'Acme Primary Workspace'}
            </span>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
              {session?.workspaceId || 'ws-primary-1'}
            </span>
          </div>

          {/* Active Account Identity, IST Clock */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Active User Badge */}
            {session && (
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 shadow-xs">
                <RoleIcon className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[11px] font-bold text-slate-900">{session.name}</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${activeRoleConfig.badgeColor}`}>
                  {activeRoleConfig.label}
                </span>
              </div>
            )}

            {/* Live IST Clock */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-xs">
              <Clock className="w-3 h-3 text-blue-600" />
              <span>{istTime || 'Loading IST...'}</span>
              <span className="text-[9px] font-sans font-bold text-slate-500 uppercase">IST</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <Link href="/pipeline" className="flex items-center gap-3 group">
          <OjixLogo size={36} className="shrink-0" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors inline-flex items-center gap-1.5">
                <span>OJIX</span>
                <span className="text-slate-300 font-bold">•</span>
                <span className="text-blue-600">ClientFlow</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                CRM
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {session ? (
                <>
                  {activeRoleConfig.name} ({activeRoleConfig.label}) • <span className="text-slate-400">{activeRoleConfig.scopeDescription}</span>
                </>
              ) : (
                'CRM & Follow-up Operating System'
              )}
            </span>
          </div>
        </Link>

        {/* Role-Tailored Nav Tabs & Dedicated Sign Off */}
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
            {navLinks.map((tab) => {
              const isActive = pathname === tab.href;
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${tab.badgeColor || 'bg-slate-200 text-slate-700'}`}>
                      {tab.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Dedicated Sign Off Button */}
          <div className="pl-3 border-l border-slate-200">
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Sign off to switch account"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Sign Off</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Constant Banner for Viewer Role */}
      {session?.role === 'VIEWER' && (
        <div className="bg-rose-50 border-t border-b border-rose-200 px-4 py-2 text-xs text-rose-800 flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-2 font-medium">
            <Shield className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Viewer Mode Active ({session.name}):</strong> Read-only access. Creating or modifying records will safely return <strong>HTTP 403 Forbidden</strong> to verify RBAC enforcement.
            </span>
            <button
              onClick={handleLogout}
              className="ml-auto underline font-bold hover:text-rose-950 shrink-0 text-[11px] flex items-center gap-1"
            >
              <LogOut className="w-3 h-3 text-rose-600" />
              Sign Off to Change Account
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default HeaderNav;

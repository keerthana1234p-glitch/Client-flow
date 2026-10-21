'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  AlertTriangle,
  Loader2,
  Check, 
  CheckCircle2,
  Briefcase, 
  UserCheck, 
  Crown, 
  Sparkles, 
  Clock, 
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { OjixLogo } from '@/components/OjixLogo';

type RoleType = 'ADMIN' | 'OWNER' | 'MEMBER' | 'VIEWER';

interface RoleOption {
  role: RoleType;
  title: string;
  name: string;
  username: string;
  keyBadge: string;
  icon: any;
  accentColor: string;
  borderColor: string;
  badgeBg: string;
  scope: string;
  permissions: string[];
}

const FOUR_ROLES: RoleOption[] = [
  {
    role: 'ADMIN',
    title: 'Workspace Admin',
    name: 'Admin',
    username: 'admin',
    keyBadge: '1',
    icon: Crown,
    accentColor: 'text-slate-900',
    borderColor: 'border-slate-900',
    badgeBg: 'bg-slate-900 text-white',
    scope: 'Full workspace authority: Create, move, edit deals, manage contacts & duplicate shield.',
    permissions: ['Full Pipeline Management', 'Create & Edit All Deals', 'Duplicate Guard Shield', 'Workspace Configurations'],
  },
  {
    role: 'OWNER',
    title: 'Sales / Account Owner',
    name: 'Sales Owner',
    username: 'owner',
    keyBadge: '2',
    icon: Briefcase,
    accentColor: 'text-blue-600',
    borderColor: 'border-blue-500',
    badgeBg: 'bg-blue-600 text-white',
    scope: 'Pipeline leadership: Progress deal stages, manage accounts, and accelerate overdue follow-ups.',
    permissions: ['Move Deal Stages (Lead → Won)', 'High-Value Account Ownership', 'Overdue Follow-up Priority', 'Client Contact Management'],
  },
  {
    role: 'MEMBER',
    title: 'Team Member',
    name: 'Team Member',
    username: 'member',
    keyBadge: '3',
    icon: UserCheck,
    accentColor: 'text-sky-600',
    borderColor: 'border-sky-500',
    badgeBg: 'bg-sky-600 text-white',
    scope: 'Frontline sales: Work assigned leads, add client notes, and execute daily follow-up calls.',
    permissions: ['Assigned Deal Execution', 'Daily Overdue Action Queue', 'Add Client Touchpoint Notes', 'View Contact Directory'],
  },
  {
    role: 'VIEWER',
    title: 'Viewer',
    name: 'Viewer',
    username: 'viewer',
    keyBadge: '4',
    icon: Eye,
    accentColor: 'text-rose-600',
    borderColor: 'border-rose-500',
    badgeBg: 'bg-rose-600 text-white',
    scope: 'Executive auditor: Read-only pipeline and contact visibility. All mutations blocked (403).',
    permissions: ['Read-only Pipeline Inspection', 'Contact Directory View', 'Mutations Blocked (403 Forbidden)', 'Executive Deal Audit'],
  },
];

const ROLE_PIN_LENGTHS: Record<RoleType, number> = {
  ADMIN: 6,
  OWNER: 5,
  MEMBER: 4,
  VIEWER: 3,
};

export function AuthView() {
  const router = useRouter();

  // Selected Role (Default to Admin)
  const [selectedRole, setSelectedRole] = useState<RoleOption>(FOUR_ROLES[0]);
  const [username, setUsername] = useState<string>(FOUR_ROLES[0].username);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [capsLockOn, setCapsLockOn] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Focus ref for zero-friction typing
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Status
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Interactive selection with auto-focus on password field
  const handleSelectRole = (roleItem: RoleOption) => {
    setSelectedRole(roleItem);
    setUsername(roleItem.username);
    setPassword('');
    setError('');
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 60);
  };

  // Keyboard shortcut listener for power-user switching (1, 2, 3, 4)
  useEffect(() => {
    const handleKeyNav = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') return;

      if (e.key === '1') handleSelectRole(FOUR_ROLES[0]);
      else if (e.key === '2') handleSelectRole(FOUR_ROLES[1]);
      else if (e.key === '3') handleSelectRole(FOUR_ROLES[2]);
      else if (e.key === '4') handleSelectRole(FOUR_ROLES[3]);
    };

    window.addEventListener('keydown', handleKeyNav);
    return () => window.removeEventListener('keydown', handleKeyNav);
  }, []);

  const handleLogin = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (!password) {
      setError(`Please enter the password for ${selectedRole.name}.`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      setIsSuccess(true);

      if (data.user) {
        document.cookie = `clientflow_session=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=604800; SameSite=Lax`;
      }
      window.dispatchEvent(new Event('clientflow_role_changed'));
      
      // 450ms vault unlock delay for visual satisfaction
      setTimeout(() => {
        window.location.href = '/pipeline';
      }, 450);
    } catch (err: any) {
      setIsSuccess(false);
      setError(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const SelectedIcon = selectedRole.icon;

  return (
    <div className="w-full min-h-[92vh] flex items-center justify-center p-3 sm:p-6 animate-fade-in relative overflow-hidden">
      {/* Background Ambient Mesh Floating Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-float" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-float" style={{ animationDelay: '2.5s' }} />

      {/* Modern Split-Screen Card */}
      <div className="w-full max-w-6xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl shadow-slate-300/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* ================= LEFT COLUMN: Deep Navy & Electric Blue Gradient Hero ================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#060D1E] via-[#0B1736] to-[#0A192F] text-white p-8 sm:p-10 flex flex-col justify-between space-y-8 relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          
          {/* Subtle Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <OjixLogo size={44} className="drop-shadow-lg" />
              <div>
                <span className="font-black text-xl tracking-tight text-white inline-flex items-center gap-1.5">
                  <span>OJIX</span>
                  <span className="text-blue-400/70 font-bold">•</span>
                  <span className="text-blue-400">ClientFlow</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-blue-300 bg-blue-950/70 border border-blue-800/60 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  Enterprise CRM OS
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                Orchestrate Client Deals with Next-Gen Precision.
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                Streamline client acquisition, automate follow-up cadences in Indian Standard Time (IST), and enforce enterprise-grade security boundaries.
              </p>
            </div>
          </div>

          {/* Middle: Professional 3D Business CRM Illustration */}
          <div className="relative z-10 my-2">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950/40 p-1.5 animate-float group">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden">
                <Image
                  src="/images/crm-illustration.jpg"
                  alt="OJIX ClientFlow 3D CRM Data Pipeline Illustration"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
              </div>

              {/* Floating Glassmorphic Status Badges */}
              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Live Pipeline Engine</span>
              </div>

              <div className="absolute bottom-4 right-4 bg-slate-900/85 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-cyan-300 flex items-center gap-1.5 shadow-lg">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>IST Synchronized</span>
              </div>
            </div>
          </div>

          {/* Bottom Pillar Highlights */}
          <div className="space-y-2.5 relative z-10 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span><strong>Follow-up Accelerator:</strong> Max 30-pt priority triage in IST</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>4-Tier RBAC & Shield:</strong> Strict tenant isolation & 409 guard</span>
            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN: Interactive 4-Role Selection & Entry ================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white relative">
          
          <div className="space-y-5">
            
            {/* Header: Friendly 3D Robot Mascot Greeting Card */}
            <div className="flex items-center gap-3.5 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-sky-50/60 border border-blue-100 shadow-sm relative overflow-hidden">
              {/* Cute Waving 3D Robot with Smooth Float */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 animate-float">
                <Image
                  src="/robot_waving_right_hand.jpg"
                  alt="ClientFlow Mascot Waving Right Hand"
                  width={80}
                  height={80}
                  className="rounded-2xl object-cover shadow-md shadow-blue-500/15 border border-blue-200/80 hover:scale-105 transition-transform"
                  priority
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center" title="Workspace Active">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                </span>
              </div>

              {/* Greeting Bubble */}
              <div className="flex-1 min-w-0 space-y-1">
                <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-snug">
                  {selectedRole.role === 'ADMIN' && "Hi! Welcome back, Workspace Admin 👑"}
                  {selectedRole.role === 'OWNER' && "Hi! Ready to drive client deals, Sales Owner? 💼"}
                  {selectedRole.role === 'MEMBER' && "Hi Team Member! Let's clear overdue follow-ups 🚀"}
                  {selectedRole.role === 'VIEWER' && "Hi Auditor! Read-only inspection mode ready 👁️"}
                </h2>
                <p className="text-[11px] text-slate-600 font-medium line-clamp-2">
                  {selectedRole.role === 'ADMIN' && "Full workspace authority: deals, contacts & security boundaries."}
                  {selectedRole.role === 'OWNER' && "Progress deals from Lead to Won with full pipeline ownership."}
                  {selectedRole.role === 'MEMBER' && "Work assigned leads and execute IST overdue actions."}
                  {selectedRole.role === 'VIEWER' && "View pipeline and contacts with guaranteed 403 mutation guards."}
                </p>
              </div>
            </div>

            {/* Error Feedback */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* 1. The 4 Interactive Role Boxes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Select Account Role
                </label>
                <span className="text-[11px] text-slate-400 font-medium">Click to select role</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FOUR_ROLES.map((roleItem) => {
                  const isSelected = selectedRole.role === roleItem.role;
                  const Icon = roleItem.icon;

                  return (
                    <button
                      key={roleItem.role}
                      type="button"
                      onClick={() => handleSelectRole(roleItem)}
                      className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between gap-2.5 relative group cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20 scale-[1.01]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                          <span className={`p-2 rounded-xl transition-colors ${
                            isSelected 
                              ? 'bg-blue-600 text-white shadow-sm' 
                              : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-slate-900 block leading-tight">
                                {roleItem.name}
                              </span>
                              <kbd className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200" title={`Press ${roleItem.keyBadge} to select`}>
                                {roleItem.keyBadge}
                              </kbd>
                            </div>
                            <span className="text-[11px] font-mono text-slate-500 block">
                              Username: <strong className="text-slate-800 font-mono">{roleItem.username}</strong>
                            </span>
                          </div>
                        </div>

                        {isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full border border-slate-200 group-hover:border-slate-300 shrink-0" />
                        )}
                      </div>

                      <p className="text-[10px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2 line-clamp-2">
                        {roleItem.scope}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Interactive Role Scope Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/30 to-sky-50/20 border border-blue-100/80 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <SelectedIcon className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-extrabold text-slate-900">
                  {selectedRole.title} Permissions & Scope:
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {selectedRole.permissions.map((perm, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>{perm}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Credentials Form Container */}
            <div 
              className="space-y-3.5 pt-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLogin();
                }
              }}
            >
              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">
                  2. Username <span className="text-slate-400 font-normal lowercase">(auto-populated)</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="user_identifier"
                    id="user_identifier"
                    autoComplete="off"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs calm-input font-mono font-medium"
                    placeholder="e.g. admin, owner, member, viewer"
                  />
                </div>
              </div>

              {/* Password Input (Confidential role password) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    3. Password
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Role Protected
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={passwordInputRef}
                    type="text"
                    name="auth_pin_code"
                    id="auth_pin_code"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.getModifierState) {
                        setCapsLockOn(e.getModifierState('CapsLock'));
                      }
                    }}
                    onKeyUp={(e) => {
                      if (e.getModifierState) {
                        setCapsLockOn(e.getModifierState('CapsLock'));
                      }
                    }}
                    className={`w-full pl-9 pr-10 py-2.5 text-xs calm-input font-mono ${
                      showPassword ? 'pin-unmask' : 'pin-mask'
                    }`}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-transform active:scale-90"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Live PIN Length Dots Indicator */}
                <div className="flex items-center justify-between pt-2 px-0.5 text-[10px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">PIN length:</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: ROLE_PIN_LENGTHS[selectedRole.role] }).map((_, i) => (
                        <span
                          key={i}
                          className={`w-2 h-2 rounded-full transition-all duration-200 ${
                            i < password.length
                              ? 'bg-blue-600 scale-110 shadow-xs shadow-blue-500/50'
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {password.length === ROLE_PIN_LENGTHS[selectedRole.role] && (
                    <span className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5 animate-fade-in font-sans">
                      <Check className="w-3 h-3 text-blue-600 stroke-[3]" /> PIN Complete
                    </span>
                  )}
                </div>

                {/* Caps Lock Alert */}
                {capsLockOn && (
                  <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold animate-fade-in">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Caps Lock is ON — check your keyboard case</span>
                  </div>
                )}
              </div>

              {/* Enter Workspace Button with Vault Unlock Animation */}
              <button
                type="button"
                onClick={handleLogin}
                disabled={loading || isSuccess}
                className={`w-full py-3.5 rounded-xl text-xs font-black tracking-wide transition-all flex items-center justify-center gap-2 mt-3 cursor-pointer ${
                  isSuccess
                    ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 ring-2 ring-emerald-400/40 scale-[1.01]'
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 disabled:opacity-80 disabled:cursor-not-allowed text-white shadow-xl shadow-blue-600/25 active:scale-[0.99]'
                }`}
              >
                {isSuccess ? (
                  <div className="flex items-center gap-2 text-white font-extrabold animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                    <span>Access Granted — Opening Workspace...</span>
                  </div>
                ) : loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                    <span>Authenticating as {selectedRole.name}...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Workspace as {selectedRole.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Footer Info */}
          <div className="pt-4 mt-6 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
            <div className="flex items-center gap-1.5 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="font-semibold text-slate-700">Role-Based Access Control (RBAC)</span>
              <span className="text-slate-400">• Strict Password Verification</span>
            </div>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3 text-slate-400" />
              Indian Standard Time (IST) Synchronized
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FolderKanban, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  User, 
  ChevronRight, 
  Layers, 
  TrendingUp, 
  Sparkles, 
  Briefcase, 
  X,
  ArrowRight,
  Filter,
  Check,
  AlertCircle,
  ShieldCheck,
  Crown,
  UserCheck,
  Eye,
  LogOut,
  Zap
} from 'lucide-react';
import { OjixLogo } from '@/components/OjixLogo';

export type TeamFlowRole = 'workspace_admin' | 'project_lead' | 'member' | 'viewer';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface TeamFlowPersona {
  role: TeamFlowRole;
  displayName: string;
  email: string;
  title: string;
  icon: any;
  badgeColor: string;
  permissionsDescription: string;
}

const TEAMFLOW_PERSONAS: TeamFlowPersona[] = [
  {
    role: 'workspace_admin',
    displayName: 'Alex Morgan',
    email: 'admin@ojix.local',
    title: 'Workspace Admin',
    icon: Crown,
    badgeColor: 'bg-indigo-900 text-white border-indigo-700',
    permissionsDescription: 'Full governance, org settings, project creation & all tasks',
  },
  {
    role: 'project_lead',
    displayName: 'Sarah Chen',
    email: 'lead@ojix.local',
    title: 'Project Lead',
    icon: Briefcase,
    badgeColor: 'bg-blue-600 text-white border-blue-500',
    permissionsDescription: 'Lead projects, milestones, task assignment & project reporting',
  },
  {
    role: 'member',
    displayName: 'Marcus Vance',
    email: 'member@ojix.local',
    title: 'Team Member',
    icon: UserCheck,
    badgeColor: 'bg-sky-600 text-white border-sky-500',
    permissionsDescription: 'Contributor: update assigned tasks, move sprint status & notes',
  },
  {
    role: 'viewer',
    displayName: 'Elena Rostova',
    email: 'viewer@ojix.local',
    title: 'Auditor Viewer',
    icon: Eye,
    badgeColor: 'bg-slate-700 text-white border-slate-600',
    permissionsDescription: 'Read-only stakeholder: view boards and reports, zero mutations',
  },
];

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeName: string;
  priority: TaskPriority;
  status: TaskStatus;
  blockerReason?: string;
  dueDate: string;
}

export interface TeamProject {
  id: string;
  name: string;
  objective: string;
  ownerName: string;
  status: string;
  startDate: string;
  dueDate: string;
  dealValue?: number;
  clientName?: string;
}

const TASK_COLUMNS: { id: TaskStatus; label: string; headerColor: string; dotColor: string }[] = [
  { id: 'backlog', label: 'Backlog', headerColor: 'bg-slate-100 text-slate-700 border-slate-200', dotColor: 'bg-slate-400' },
  { id: 'todo', label: 'To Do', headerColor: 'bg-blue-50 text-blue-700 border-blue-200', dotColor: 'bg-blue-500' },
  { id: 'in_progress', label: 'In Progress', headerColor: 'bg-sky-50 text-sky-700 border-sky-200', dotColor: 'bg-sky-500' },
  { id: 'in_review', label: 'In Review', headerColor: 'bg-purple-50 text-purple-700 border-purple-200', dotColor: 'bg-purple-500' },
  { id: 'done', label: 'Done', headerColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotColor: 'bg-emerald-500' },
  { id: 'blocked', label: 'Blocked', headerColor: 'bg-rose-50 text-rose-700 border-rose-200', dotColor: 'bg-rose-500' },
];

const SEED_PROJECTS: TeamProject[] = [
  {
    id: 'proj-infra-01',
    name: 'Q4 Cloud Infrastructure & Distributed Telemetry',
    objective: 'Modernize Kubernetes clusters, establish distributed tracing, and achieve 99.95% uptime.',
    ownerName: 'Sarah Chen (Project Lead)',
    status: 'active',
    startDate: '2026-10-01',
    dueDate: '2026-12-15',
    dealValue: 45000,
    clientName: 'Liam Gallagher (Cloudwave)',
  },
  {
    id: 'proj-telemetry-02',
    name: 'Autonomous Fleet Telemetry Suite Delivery',
    objective: 'Deploy IoT fleet analytics, hardware edge telemetry gateways, and onboard enterprise operators.',
    ownerName: 'Alex Morgan (Workspace Admin)',
    status: 'active',
    startDate: '2026-10-10',
    dueDate: '2026-12-30',
    dealValue: 125000,
    clientName: 'Sophia Sterling (Aura Robotics)',
  },
  {
    id: 'proj-sso-03',
    name: 'Enterprise SSO & Tenant Security Module',
    objective: 'Implement SAML 2.0 / OIDC enterprise authentication, workspace tenant boundaries, and audit trail.',
    ownerName: 'Sarah Chen (Project Lead)',
    status: 'completed',
    startDate: '2026-09-01',
    dueDate: '2026-10-20',
    dealValue: 35000,
    clientName: 'Sophia Sterling (Aura Robotics)',
  },
];

const INITIAL_TASKS: ProjectTask[] = [
  {
    id: 'task-01',
    projectId: 'proj-infra-01',
    title: 'Configure Prometheus & Grafana multi-cluster telemetry',
    description: 'Establish unified cluster scrape configs and alerting thresholds.',
    assigneeName: 'Marcus Vance',
    priority: 'urgent',
    status: 'in_progress',
    dueDate: '2026-11-01',
  },
  {
    id: 'task-02',
    projectId: 'proj-infra-01',
    title: 'Verify multi-region failover and DNS routing',
    description: 'Conduct chaos testing across primary and secondary data centers.',
    assigneeName: 'Sarah Chen',
    priority: 'high',
    status: 'in_review',
    dueDate: '2026-11-10',
  },
  {
    id: 'task-03',
    projectId: 'proj-infra-01',
    title: 'Hardened VPC subnets & security group rules',
    description: 'Audit ingress/egress CIDR blocks to satisfy SOC2 compliance.',
    assigneeName: 'Marcus Vance',
    priority: 'medium',
    status: 'done',
    dueDate: '2026-10-25',
  },
  {
    id: 'task-04',
    projectId: 'proj-infra-01',
    title: 'Edge gateway firmware v2.4 upgrade rollout',
    description: 'Waiting for hardware vendor OEM certificate renewal before deploying.',
    assigneeName: 'Alex Morgan',
    priority: 'urgent',
    status: 'blocked',
    blockerReason: 'Waiting for vendor cryptographic certificate renewal (v2.4.1).',
    dueDate: '2026-11-05',
  },
  {
    id: 'task-05',
    projectId: 'proj-telemetry-02',
    title: 'Design real-time fleet GPS WebSocket ingestion worker',
    description: 'Ensure low-latency message streaming at 10k events/sec.',
    assigneeName: 'Marcus Vance',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2026-11-15',
  },
];

export default function StandaloneTeamFlowPage() {
  const [currentPersona, setCurrentPersona] = useState<TeamFlowPersona>(TEAMFLOW_PERSONAS[1]); // Default Sarah Chen (Lead)
  const [projects, setProjects] = useState<TeamProject[]>(SEED_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-infra-01');
  const [tasks, setTasks] = useState<ProjectTask[]>(INITIAL_TASKS);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('Marcus Vance');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Blocker modal
  const [taskToBlock, setTaskToBlock] = useState<ProjectTask | null>(null);
  const [blockerReasonInput, setBlockerReasonInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load live projects from backend if available
  useEffect(() => {
    const loadBackendProjects = async () => {
      try {
        const res = await fetch('/api/projects?stage=all&api_key=ojix-teamflow-clientflow-2026');
        if (res.ok) {
          const data = await res.json();
          if (data.projects && data.projects.length > 0) {
            const mapped: TeamProject[] = data.projects.map((p: any) => ({
              id: p.id,
              name: p.name,
              objective: p.objective,
              ownerName: p.client?.name || 'ClientFlow Sales',
              status: p.status,
              startDate: p.startDate,
              dueDate: p.dueDate,
              dealValue: p.dealValue,
              clientName: p.client?.name,
            }));
            // Merge unique seed projects with database projects
            setProjects([...SEED_PROJECTS, ...mapped.filter(m => !SEED_PROJECTS.some(s => s.id === m.id))]);
          }
        }
      } catch {
        // fallback to seeds
      }
    };
    loadBackendProjects();
  }, []);

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];
  const projectTasks = tasks.filter(t => t.projectId === activeProject.id);

  // Handle task creation
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPersona.role === 'viewer') {
      setErrorMessage('403 Forbidden: Viewer role has read-only access and cannot create tasks.');
      return;
    }
    if (!taskTitle.trim()) return;

    const newTask: ProjectTask = {
      id: `task-${Date.now().toString(36)}`,
      projectId: activeProject.id,
      title: taskTitle.trim(),
      description: taskDesc.trim() || 'Deliverable task item.',
      assigneeName: taskAssignee,
      priority: taskPriority,
      status: 'todo',
      dueDate: taskDueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    setTasks([newTask, ...tasks]);
    setTaskTitle('');
    setTaskDesc('');
    setIsTaskModalOpen(false);
  };

  // Move task status with RBAC checks
  const handleMoveStatus = (taskId: string, targetStatus: TaskStatus) => {
    if (currentPersona.role === 'viewer') {
      setErrorMessage('403 Forbidden: Viewer role cannot mutate task stages.');
      return;
    }

    if (targetStatus === 'blocked') {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setTaskToBlock(task);
        setBlockerReasonInput('');
      }
      return;
    }

    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, status: targetStatus, blockerReason: undefined };
      }
      return t;
    }));
  };

  // Confirm blocker
  const handleConfirmBlocker = () => {
    if (!taskToBlock || !blockerReasonInput.trim() || blockerReasonInput.trim().length < 5) {
      alert('Blocker reason must be at least 5 characters.');
      return;
    }

    setTasks(tasks.map(t => {
      if (t.id === taskToBlock.id) {
        return {
          ...t,
          status: 'blocked',
          blockerReason: blockerReasonInput.trim(),
        };
      }
      return t;
    }));

    setTaskToBlock(null);
    setBlockerReasonInput('');
  };

  // Progress metrics
  const completedCount = projectTasks.filter(t => t.status === 'done').length;
  const progressPercent = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;
  const blockedCount = projectTasks.filter(t => t.status === 'blocked').length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* 1. Standalone Dedicated Top Bar for OJIX TeamFlow */}
      <header className="sticky top-0 z-40 bg-slate-950 border-b border-slate-800 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Product Badge */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-white">OJIX TeamFlow</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Project Execution OS
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Team Tasks, Milestones & 4-Role RBAC Governance</p>
            </div>
          </div>

          {/* Persona / Role Switcher Header Bar */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 hidden sm:inline">Active Persona:</span>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
              {TEAMFLOW_PERSONAS.map(p => {
                const isSelected = currentPersona.role === p.role;
                const Icon = p.icon;
                return (
                  <button
                    key={p.role}
                    type="button"
                    onClick={() => {
                      setCurrentPersona(p);
                      setErrorMessage(null);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? `${p.badgeColor} shadow-xs scale-102`
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                    title={p.permissionsDescription}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden md:inline">{p.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Back to CRM Switcher Button */}
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-all shadow-xs ml-2"
              title="Return to ClientFlow CRM"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>ClientFlow CRM ↗</span>
            </Link>
          </div>

        </div>
      </header>

      {/* 2. Persona Banner Notice */}
      <div className="bg-slate-950/60 border-b border-slate-800/80 px-4 sm:px-6 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-slate-400">Logged in as:</span>
            <strong className="text-white">{currentPersona.displayName}</strong>
            <span className="text-slate-500">({currentPersona.email})</span>
            <span className="text-slate-400">• {currentPersona.permissionsDescription}</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 hidden sm:inline">
            Role: {currentPersona.role}
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-4">
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Workspace Container */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Active Projects</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white font-mono">{projects.length}</div>
            <span className="text-[10px] text-slate-500">Autonomous delivery workspaces</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Sprint Completion</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-400 font-mono">{progressPercent}%</div>
            <span className="text-[10px] text-slate-500">{completedCount} of {projectTasks.length} tasks completed</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Delivery Contract Value</span>
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white font-mono">
              ${(activeProject?.dealValue || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">Client: {activeProject?.clientName || 'Enterprise'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Blocked Sprint Tasks</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-rose-400 font-mono">{blockedCount}</div>
            <span className="text-[10px] text-slate-500">Requires blocker reason notes</span>
          </div>
        </div>

        {/* Project Selector (Horizontal Tabs) */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-black uppercase text-slate-200 tracking-wider">
                Select Team Project
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {projects.length} Available Projects
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map((proj) => {
              const isSelected = activeProject.id === proj.id;
              return (
                <button
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/40'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono text-cyan-400 font-bold">{proj.id}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold uppercase">
                      {proj.status}
                    </span>
                  </div>
                  <div className="mt-1 font-bold text-xs text-white line-clamp-1">{proj.name}</div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span>👤 {proj.ownerName}</span>
                    <span>Due: {proj.dueDate}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 6-Column Sprint Execution Kanban Board */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">{activeProject.name}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                  {activeProject.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{activeProject.objective}</p>
            </div>

            {currentPersona.role !== 'viewer' ? (
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-600/20 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            ) : (
              <span className="text-[11px] font-semibold text-slate-400 italic">
                👁️ Viewer Mode (Read-only)
              </span>
            )}
          </div>

          {/* Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {TASK_COLUMNS.map((col) => {
              const colTasks = projectTasks.filter(t => t.status === col.id);

              return (
                <div
                  key={col.id}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col min-h-[340px] max-h-[500px]"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                      <span className="text-xs font-bold text-slate-200">{col.label}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                    {colTasks.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 italic">
                        No tasks in {col.label}
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                              task.priority === 'urgent'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : task.priority === 'high'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {task.priority}
                            </span>
                            <span className="text-slate-400 font-mono text-[9px] flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{task.dueDate}</span>
                            </span>
                          </div>

                          <div>
                            <div className="text-xs font-bold text-white line-clamp-2">{task.title}</div>
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{task.description}</p>
                          </div>

                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <User className="w-3 h-3 text-cyan-400" />
                            <span>{task.assigneeName}</span>
                          </div>

                          {task.status === 'blocked' && task.blockerReason && (
                            <div className="p-2 rounded bg-rose-950/80 border border-rose-800 text-rose-200 text-[10px] flex items-start gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                              <span><strong>Blocker:</strong> {task.blockerReason}</span>
                            </div>
                          )}

                          {/* Stage Transition Controls */}
                          {currentPersona.role !== 'viewer' && (
                            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1 text-[9px]">
                              <span className="text-slate-500">Move:</span>
                              {task.status === 'backlog' && (
                                <button
                                  onClick={() => handleMoveStatus(task.id, 'todo')}
                                  className="px-2 py-0.5 rounded font-bold bg-blue-900/60 text-blue-200 hover:bg-blue-800 transition-colors cursor-pointer"
                                >
                                  To Do
                                </button>
                              )}
                              {task.status === 'todo' && (
                                <>
                                  <button
                                    onClick={() => handleMoveStatus(task.id, 'in_progress')}
                                    className="px-2 py-0.5 rounded font-bold bg-sky-900/60 text-sky-200 hover:bg-sky-800 transition-colors cursor-pointer"
                                  >
                                    Start
                                  </button>
                                  <button
                                    onClick={() => handleMoveStatus(task.id, 'blocked')}
                                    className="px-2 py-0.5 rounded font-bold bg-rose-900/60 text-rose-200 hover:bg-rose-800 transition-colors cursor-pointer"
                                  >
                                    Block
                                  </button>
                                </>
                              )}
                              {task.status === 'in_progress' && (
                                <>
                                  <button
                                    onClick={() => handleMoveStatus(task.id, 'in_review')}
                                    className="px-2 py-0.5 rounded font-bold bg-purple-900/60 text-purple-200 hover:bg-purple-800 transition-colors cursor-pointer"
                                  >
                                    Review
                                  </button>
                                  <button
                                    onClick={() => handleMoveStatus(task.id, 'blocked')}
                                    className="px-2 py-0.5 rounded font-bold bg-rose-900/60 text-rose-200 hover:bg-rose-800 transition-colors cursor-pointer"
                                  >
                                    Block
                                  </button>
                                </>
                              )}
                              {task.status === 'in_review' && (
                                <>
                                  <button
                                    onClick={() => handleMoveStatus(task.id, 'done')}
                                    className="px-2 py-0.5 rounded font-bold bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800 transition-colors cursor-pointer"
                                  >
                                    Done
                                  </button>
                                  <button
                                    onClick={() => handleMoveStatus(task.id, 'in_progress')}
                                    className="px-2 py-0.5 rounded font-bold bg-sky-900/60 text-sky-200 hover:bg-sky-800 transition-colors cursor-pointer"
                                  >
                                    Rework
                                  </button>
                                </>
                              )}
                              {task.status === 'blocked' && (
                                <button
                                  onClick={() => handleMoveStatus(task.id, 'in_progress')}
                                  className="px-2 py-0.5 rounded font-bold bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800 transition-colors cursor-pointer"
                                >
                                  Unblock
                                </button>
                              )}
                              {task.status === 'done' && (
                                <button
                                  onClick={() => handleMoveStatus(task.id, 'todo')}
                                  className="px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
                                >
                                  Reopen
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>

      {/* Add Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Create Task for {activeProject.id}</span>
              </h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement Distributed Telemetry Pipeline"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Deliverable details and acceptance criteria..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assignee</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Marcus Vance">Marcus Vance (Member)</option>
                    <option value="Sarah Chen">Sarah Chen (Lead)</option>
                    <option value="Alex Morgan">Alex Morgan (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blocker Reason Modal */}
      {taskToBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-rose-950/60 flex items-center justify-between text-rose-300">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Flag Task as Blocked</span>
              </h3>
              <button onClick={() => setTaskToBlock(null)} className="text-rose-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-300">
                Blocking <strong>{taskToBlock.title}</strong> requires an explicit blocker reason (min 5 chars):
              </p>

              <textarea
                rows={3}
                required
                placeholder="e.g. Waiting for client API credentials or security audit approval..."
                value={blockerReasonInput}
                onChange={(e) => setBlockerReasonInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
              />

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTaskToBlock(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBlocker}
                  className="px-4 py-1.5 rounded-lg font-bold bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Confirm Block
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

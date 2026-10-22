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
  ExternalLink, 
  TrendingUp, 
  Sparkles, 
  Briefcase, 
  X,
  ArrowRight,
  Filter,
  Check,
  AlertCircle,
  ShieldCheck,
  Zap,
  Flame,
  Award
} from 'lucide-react';
import { formatISTDateTime } from '@/lib/timezone';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface DeliveryProject {
  id: string;
  dealId: string;
  name: string;
  title: string;
  objective: string;
  client: {
    name: string;
    email: string;
    phone?: string | null;
  };
  dealValue: number;
  dealStage: string;
  temperature?: string;
  status: string;
  isReadyForExecution: boolean;
  startDate: string;
  dueDate: string;
  workspaceName?: string;
}

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
  createdAt: string;
}

const TASK_COLUMNS: { id: TaskStatus; label: string; headerColor: string; dotColor: string }[] = [
  { id: 'backlog', label: 'Backlog', headerColor: 'bg-slate-100 text-slate-700 border-slate-200', dotColor: 'bg-slate-400' },
  { id: 'todo', label: 'To Do', headerColor: 'bg-blue-50 text-blue-700 border-blue-200', dotColor: 'bg-blue-500' },
  { id: 'in_progress', label: 'In Progress', headerColor: 'bg-sky-50 text-sky-700 border-sky-200', dotColor: 'bg-sky-500' },
  { id: 'in_review', label: 'In Review', headerColor: 'bg-purple-50 text-purple-700 border-purple-200', dotColor: 'bg-purple-500' },
  { id: 'done', label: 'Done', headerColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotColor: 'bg-emerald-500' },
  { id: 'blocked', label: 'Blocked', headerColor: 'bg-rose-50 text-rose-700 border-rose-200', dotColor: 'bg-rose-500' },
];

export default function TeamProjectsPage() {
  const [projects, setProjects] = useState<DeliveryProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<DeliveryProject | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);

  // Task creation modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('Marcus Vance (Dev)');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Blocker modal
  const [taskToBlock, setTaskToBlock] = useState<ProjectTask | null>(null);
  const [blockerReasonInput, setBlockerReasonInput] = useState('');

  // Fetch real projects from ClientFlow CRM deals backend
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects?stage=all&api_key=ojix-teamflow-clientflow-2026');
      if (res.ok) {
        const data = await res.json();
        const fetchedProjects: DeliveryProject[] = data.projects || [];
        setProjects(fetchedProjects);

        // Default to first project (or closed won project)
        if (fetchedProjects.length > 0) {
          const defaultProj = fetchedProjects.find(p => p.dealStage === 'WON') || fetchedProjects[0];
          setSelectedProject(defaultProj);
          loadTasksForProject(defaultProj.id);
        }
      }
    } catch (e) {
      console.error('Error fetching projects:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Load / initialize tasks for selected project from localStorage
  const loadTasksForProject = (projectId: string) => {
    try {
      const stored = localStorage.getItem(`teamflow_tasks_${projectId}`);
      if (stored) {
        setTasks(JSON.parse(stored));
      } else {
        // Default starter sprint tasks if none exist
        const initialTasks: ProjectTask[] = [
          {
            id: `task-${Date.now()}-1`,
            projectId,
            title: 'Technical Kickoff & Architecture Scope',
            description: 'Define API contracts, environment setup, and data boundaries.',
            assigneeName: 'Alex Morgan (Admin)',
            priority: 'urgent',
            status: 'done',
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
          },
          {
            id: `task-${Date.now()}-2`,
            projectId,
            title: 'Core Deliverables Implementation',
            description: 'Build components, integration endpoints, and database models.',
            assigneeName: 'Marcus Vance (Dev)',
            priority: 'high',
            status: 'in_progress',
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
          },
          {
            id: `task-${Date.now()}-3`,
            projectId,
            title: 'Quality Assurance & Delivery Verification',
            description: 'Run automated tests, security checks, and client sign-off audit.',
            assigneeName: 'Sarah Chen (Lead)',
            priority: 'medium',
            status: 'todo',
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
          },
        ];
        setTasks(initialTasks);
        localStorage.setItem(`teamflow_tasks_${projectId}`, JSON.stringify(initialTasks));
      }
    } catch {
      // fallback
    }
  };

  const saveTasks = (newTasks: ProjectTask[]) => {
    setTasks(newTasks);
    if (selectedProject) {
      localStorage.setItem(`teamflow_tasks_${selectedProject.id}`, JSON.stringify(newTasks));
    }
  };

  const handleSelectProject = (proj: DeliveryProject) => {
    setSelectedProject(proj);
    loadTasksForProject(proj.id);
  };

  // Add Task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedProject) return;

    const newTask: ProjectTask = {
      id: `task-${Date.now().toString(36)}`,
      projectId: selectedProject.id,
      title: taskTitle.trim(),
      description: taskDesc.trim() || 'Execution task for client deliverable.',
      assigneeName: taskAssignee,
      priority: taskPriority,
      status: 'todo',
      dueDate: taskDueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    const updated = [newTask, ...tasks];
    saveTasks(updated);

    // Reset Form
    setTaskTitle('');
    setTaskDesc('');
    setIsTaskModalOpen(false);
  };

  // Move task status according to state machine rules
  const handleMoveStatus = (taskId: string, targetStatus: TaskStatus) => {
    if (targetStatus === 'blocked') {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setTaskToBlock(task);
        setBlockerReasonInput('');
      }
      return;
    }

    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, status: targetStatus, blockerReason: undefined };
      }
      return t;
    });
    saveTasks(updated);
  };

  // Confirm Blocker
  const handleConfirmBlocker = () => {
    if (!taskToBlock || !blockerReasonInput.trim() || blockerReasonInput.trim().length < 5) {
      alert('Please provide a descriptive blocker reason (at least 5 characters).');
      return;
    }

    const updated = tasks.map(t => {
      if (t.id === taskToBlock.id) {
        return {
          ...t,
          status: 'blocked' as TaskStatus,
          blockerReason: blockerReasonInput.trim(),
        };
      }
      return t;
    });

    saveTasks(updated);
    setTaskToBlock(null);
    setBlockerReasonInput('');
  };

  // Quick stats
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const blockedTasks = tasks.filter(t => t.status === 'blocked').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[11px] font-bold text-cyan-700 tracking-wider uppercase">
              OJIX Ecosystem Integration
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
            <FolderKanban className="w-6 h-6 text-cyan-600" />
            <span>Team Projects & Task Execution</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Every deal created in ClientFlow automatically provisions a delivery project with 6-stage Kanban execution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pipeline"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
            <span>Back to CRM Pipeline</span>
          </Link>

          {selectedProject && (
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Total Projects from Deals</span>
            <Layers className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            {projects.length}
          </div>
          <span className="text-[10px] text-slate-400">Synced live from CRM database</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Selected Project Progress</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 font-mono">
            {progressPercent}%
          </div>
          <span className="text-[10px] text-slate-400">{completedTasks} of {tasks.length} tasks completed</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Project Contract Value</span>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            ${(selectedProject?.dealValue || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">Client: {selectedProject?.client.name || 'Enterprise'}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Blocked Tasks</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600 font-mono">
            {blockedTasks}
          </div>
          <span className="text-[10px] text-slate-400">Requires blocker note resolution</span>
        </div>
      </div>

      {/* 3. Main Workspace Grid: Project Selector (Left) + Task Board (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: ClientFlow Project Registry */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Select CRM Project
              </span>
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {projects.length} Total
              </span>
            </div>
            
            <p className="text-[11px] text-slate-500">
              Select any project to manage sprint tasks, blockers, and milestone deliverables.
            </p>

            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading projects from CRM...</div>
              ) : projects.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">No projects found. Add a deal in Pipeline!</div>
              ) : (
                projects.map((proj) => {
                  const isSelected = selectedProject?.id === proj.id;
                  const isWon = proj.dealStage === 'WON';

                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => handleSelectProject(proj)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50/50 shadow-sm ring-1 ring-cyan-400/30'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isWon
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : proj.dealStage === 'QUALIFIED'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {proj.dealStage}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-900">
                          ${proj.dealValue.toLocaleString()}
                        </span>
                      </div>

                      <div className="mt-1.5 font-bold text-xs text-slate-900 line-clamp-1">
                        {proj.name}
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="truncate max-w-[150px]">👤 {proj.client.name}</span>
                        <span>Due: {proj.dueDate}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 6-Stage Task Kanban Board */}
        <div className="lg:col-span-8 space-y-4">
          {selectedProject ? (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              {/* Active Project Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{selectedProject.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                      {selectedProject.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{selectedProject.objective}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsTaskModalOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Task</span>
                  </button>
                </div>
              </div>

              {/* 6-Column Kanban Board */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {TASK_COLUMNS.map((col) => {
                  const columnTasks = tasks.filter(t => t.status === col.id);

                  return (
                    <div
                      key={col.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col min-h-[320px] max-h-[460px]"
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                          <span className="text-xs font-bold text-slate-800">{col.label}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-white text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                          {columnTasks.length}
                        </span>
                      </div>

                      {/* Task Cards */}
                      <div className="space-y-2 flex-1 overflow-y-auto pr-0.5">
                        {columnTasks.length === 0 ? (
                          <div className="p-4 text-center text-[11px] text-slate-400 italic">
                            No tasks
                          </div>
                        ) : (
                          columnTasks.map((task) => (
                            <div
                              key={task.id}
                              className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition-all space-y-2"
                            >
                              {/* Priority & Due Date */}
                              <div className="flex items-center justify-between text-[10px]">
                                <span className={`px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                                  task.priority === 'urgent'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : task.priority === 'high'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  {task.priority}
                                </span>
                                <span className="text-slate-400 font-mono text-[9px] flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>{task.dueDate}</span>
                                </span>
                              </div>

                              {/* Title & Desc */}
                              <div className="space-y-0.5">
                                <div className="text-xs font-bold text-slate-900 line-clamp-2">
                                  {task.title}
                                </div>
                                <p className="text-[10px] text-slate-500 line-clamp-2">{task.description}</p>
                              </div>

                              {/* Assignee */}
                              <div className="text-[10px] text-slate-600 flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                <span>{task.assigneeName}</span>
                              </div>

                              {/* Blocker reason if blocked */}
                              {task.status === 'blocked' && task.blockerReason && (
                                <div className="p-1.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[10px] flex items-start gap-1">
                                  <AlertCircle className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                                  <span><strong>Blocker:</strong> {task.blockerReason}</span>
                                </div>
                              )}

                              {/* Allowed Next Transitions */}
                              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1">
                                <span className="text-[9px] text-slate-400 font-medium">Move:</span>
                                {task.status === 'backlog' && (
                                  <button
                                    onClick={() => handleMoveStatus(task.id, 'todo')}
                                    className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
                                  >
                                    To Do
                                  </button>
                                )}

                                {task.status === 'todo' && (
                                  <>
                                    <button
                                      onClick={() => handleMoveStatus(task.id, 'in_progress')}
                                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white transition-colors"
                                    >
                                      Start
                                    </button>
                                    <button
                                      onClick={() => handleMoveStatus(task.id, 'blocked')}
                                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-colors"
                                    >
                                      Block
                                    </button>
                                  </>
                                )}

                                {task.status === 'in_progress' && (
                                  <>
                                    <button
                                      onClick={() => handleMoveStatus(task.id, 'in_review')}
                                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white transition-colors"
                                    >
                                      Review
                                    </button>
                                    <button
                                      onClick={() => handleMoveStatus(task.id, 'blocked')}
                                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-colors"
                                    >
                                      Block
                                    </button>
                                  </>
                                )}

                                {task.status === 'in_review' && (
                                  <>
                                    <button
                                      onClick={() => handleMoveStatus(task.id, 'done')}
                                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors"
                                    >
                                      Accept (Done)
                                    </button>
                                    <button
                                      onClick={() => handleMoveStatus(task.id, 'in_progress')}
                                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white transition-colors"
                                    >
                                      Needs Work
                                    </button>
                                  </>
                                )}

                                {task.status === 'blocked' && (
                                  <>
                                    <button
                                      onClick={() => handleMoveStatus(task.id, 'in_progress')}
                                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors"
                                    >
                                      Resolve & Work
                                    </button>
                                    <button
                                      onClick={() => handleMoveStatus(task.id, 'todo')}
                                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
                                    >
                                      Back to Todo
                                    </button>
                                  </>
                                )}

                                {task.status === 'done' && (
                                  <button
                                    onClick={() => handleMoveStatus(task.id, 'todo')}
                                    className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-300 transition-colors"
                                  >
                                    Reopen
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Select a project from the left panel to manage its execution board.
            </div>
          )}
        </div>
      </div>

      {/* 4. Add Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-cyan-600" />
                <span>Create Sprint Task</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement Webhook Dispatcher"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Key deliverables and acceptance criteria..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assignee</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                  >
                    <option value="Marcus Vance (Dev)">Marcus Vance (Dev)</option>
                    <option value="Sarah Chen (Lead)">Sarah Chen (Lead)</option>
                    <option value="Alex Morgan (Admin)">Alex Morgan (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Blocker Modal */}
      {taskToBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50 text-rose-800">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Flag Task as Blocked</span>
              </h3>
              <button
                type="button"
                onClick={() => setTaskToBlock(null)}
                className="p-1 rounded-md text-rose-400 hover:text-rose-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600">
                You are blocking <strong>{taskToBlock.title}</strong>. Please state what is preventing progress:
              </p>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Blocker Reason (Min 5 chars) *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Waiting for client API credentials or security audit approval..."
                  value={blockerReasonInput}
                  onChange={(e) => setBlockerReasonInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTaskToBlock(null)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBlocker}
                  className="px-4 py-1.5 rounded-lg font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
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

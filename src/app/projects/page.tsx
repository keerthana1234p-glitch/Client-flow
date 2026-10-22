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
  Key, 
  ExternalLink, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  Briefcase, 
  X,
  ArrowRight,
  Filter
} from 'lucide-react';
import { 
  Project, 
  ProjectTask, 
  TaskStatus, 
  TaskPriority, 
  INITIAL_PROJECTS, 
  INITIAL_TASKS 
} from '@/services/teamFlowService';

const TASK_COLUMNS: { id: TaskStatus; label: string; headerColor: string; dotColor: string }[] = [
  { id: 'backlog', label: 'Backlog', headerColor: 'bg-slate-100 text-slate-700 border-slate-200', dotColor: 'bg-slate-400' },
  { id: 'todo', label: 'To Do', headerColor: 'bg-blue-50 text-blue-700 border-blue-200', dotColor: 'bg-blue-500' },
  { id: 'in_progress', label: 'In Progress', headerColor: 'bg-sky-50 text-sky-700 border-sky-200', dotColor: 'bg-sky-500' },
  { id: 'in_review', label: 'In Review', headerColor: 'bg-purple-50 text-purple-700 border-purple-200', dotColor: 'bg-purple-500' },
  { id: 'done', label: 'Done', headerColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotColor: 'bg-emerald-500' },
  { id: 'blocked', label: 'Blocked', headerColor: 'bg-rose-50 text-rose-700 border-rose-200', dotColor: 'bg-rose-500' },
];

export default function TeamProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [tasks, setTasks] = useState<ProjectTask[]>(INITIAL_TASKS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-infra-01');
  
  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [taskToBlock, setTaskToBlock] = useState<ProjectTask | null>(null);
  const [blockerReasonInput, setBlockerReasonInput] = useState('');
  
  // New Task Form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('Marcus Vance');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');

  // New Project Form
  const [projName, setProjName] = useState('');
  const [projObjective, setProjObjective] = useState('');
  const [projDueDate, setProjDueDate] = useState('');
  const [projLead, setProjLead] = useState('Sarah Chen (Project Lead)');

  // Toast feedback
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Load from local storage if available for persistence
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem('ojix_teamflow_projects');
      const savedTasks = localStorage.getItem('ojix_teamflow_tasks');
      if (savedProjects) setProjects(JSON.parse(savedProjects));
      if (savedTasks) setTasks(JSON.parse(savedTasks));
    } catch {
      // fallback
    }
  }, []);

  const saveState = (updatedProjects: Project[], updatedTasks: ProjectTask[]) => {
    try {
      localStorage.setItem('ojix_teamflow_projects', JSON.stringify(updatedProjects));
      localStorage.setItem('ojix_teamflow_tasks', JSON.stringify(updatedTasks));
    } catch {
      // fallback
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];
  const projectTasks = tasks.filter(t => t.projectId === selectedProject.id);

  const completedCount = projectTasks.filter(t => t.status === 'done').length;
  const blockedCount = projectTasks.filter(t => t.status === 'blocked').length;
  const progressPercent = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;

  // Move task status
  const handleMoveStatus = (task: ProjectTask, newStatus: TaskStatus) => {
    if (newStatus === 'blocked') {
      setTaskToBlock(task);
      setBlockerReasonInput(task.blockerReason || '');
      return;
    }

    const updated = tasks.map(t => {
      if (t.id === task.id) {
        return { ...t, status: newStatus, blockerReason: undefined };
      }
      return t;
    });

    setTasks(updated);
    saveState(projects, updated);
    notify(`Task "${task.title}" transitioned to ${newStatus.replace('_', ' ').toUpperCase()}`);
  };

  const confirmBlockTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskToBlock) return;
    if (!blockerReasonInput.trim()) {
      notify('Blocker explanation is required when setting a task to Blocked', 'error');
      return;
    }

    const updated = tasks.map(t => {
      if (t.id === taskToBlock.id) {
        return { ...t, status: 'blocked' as TaskStatus, blockerReason: blockerReasonInput.trim() };
      }
      return t;
    });

    setTasks(updated);
    saveState(projects, updated);
    notify(`Task flagged as BLOCKED with recorded impediment reason`, 'error');
    setTaskToBlock(null);
    setBlockerReasonInput('');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask: ProjectTask = {
      id: `task-${Date.now().toString(36)}`,
      projectId: selectedProject.id,
      title: taskTitle.trim(),
      description: taskDesc.trim() || 'Team task action item.',
      assigneeName: taskAssignee || null,
      priority: taskPriority,
      status: 'todo',
      dueDate: taskDueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveState(projects, updated);
    notify(`Task "${taskTitle}" added to ${selectedProject.name}`);

    setTaskTitle('');
    setTaskDesc('');
    setTaskDueDate('');
    setIsTaskModalOpen(false);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;

    const newProj: Project = {
      id: `proj-${Date.now().toString(36)}`,
      name: projName.trim(),
      objective: projObjective.trim() || 'Execute client deliverables on schedule.',
      ownerId: 'user-lead-sarah',
      ownerName: projLead,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: projDueDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      memberIds: ['user-admin-alex', 'user-lead-sarah'],
    };

    const updated = [newProj, ...projects];
    setProjects(updated);
    saveState(updated, tasks);
    setSelectedProjectId(newProj.id);
    notify(`Project "${projName}" registered in OJIX TeamFlow`);

    setProjName('');
    setProjObjective('');
    setProjDueDate('');
    setIsProjectModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Cross-Product Integration Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#070D22] via-[#0E1A3D] to-[#111F4D] text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Cross-Product Integration Active</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400 border border-slate-700/60 px-2 py-0.5 rounded-full bg-slate-900/60 flex items-center gap-1">
              <Key className="w-3 h-3 text-amber-400" />
              <span>API Key Verified: <strong className="text-slate-200">OJIX_TEAMFLOW_KEY</strong></span>
            </span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Team Projects &amp; Delivery OS</span>
            <span className="text-xs font-normal text-slate-400">powered by OJIX TeamFlow</span>
          </h1>
          <p className="text-xs text-slate-300">
            Seamlessly coordinate team milestones, assign tasks, and triage blockers for closed client deals.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>New Project</span>
          </button>
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* 2. Notification Toast */}
      {feedback && (
        <div className={`p-3 rounded-lg flex items-center gap-2 text-xs font-medium border animate-slide-down ${
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 3. Project Selector & Status Overview Card */}
      <div className="calm-card p-5 bg-white space-y-4">
        {/* Project Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mr-1">Project:</span>
            {projects.map(proj => {
              const isSelected = proj.id === selectedProject.id;
              return (
                <button
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
                  <span>{proj.name}</span>
                </button>
              );
            })}
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 shrink-0">
            {projects.length} Total Projects
          </span>
        </div>

        {/* Selected Project Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-8 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">{selectedProject.name}</h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                selectedProject.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : selectedProject.status === 'completed'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {selectedProject.status}
              </span>
              {selectedProject.dealTitle && (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-blue-500" />
                  <span>Linked CRM Deal: {selectedProject.dealTitle} (${selectedProject.dealValue?.toLocaleString()})</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{selectedProject.objective}</p>
            <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Lead: <strong className="text-slate-700">{selectedProject.ownerName}</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Target Due Date: <strong className="text-slate-700 font-mono">{selectedProject.dueDate}</strong></span>
              </span>
            </div>
          </div>

          {/* Health & Progress Meter */}
          <div className="lg:col-span-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Project Completion</span>
              <span className="font-mono font-black text-blue-700">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>{completedCount} of {projectTasks.length} tasks completed</span>
              {blockedCount > 0 && (
                <span className="flex items-center gap-1 font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{blockedCount} Blocked</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Task Kanban Board (6 Columns from OJIX TeamFlow) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {TASK_COLUMNS.map(col => {
          const colTasks = projectTasks.filter(t => t.status === col.id);

          return (
            <div
              key={col.id}
              className={`flex flex-col min-h-[460px] rounded-xl border p-2.5 space-y-2.5 ${
                col.id === 'blocked' ? 'bg-rose-50/30 border-rose-200' : 'bg-slate-100/60 border-slate-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <span className="text-xs font-black text-slate-800">{col.label}</span>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border bg-white ${
                  col.id === 'blocked' && colTasks.length > 0
                    ? 'text-rose-700 border-rose-300 font-black'
                    : 'text-slate-600 border-slate-200'
                }`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards */}
              <div className="space-y-2 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="p-4 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-lg bg-white/40">
                    No tasks
                  </div>
                ) : (
                  colTasks.map(task => {
                    const priorityBadge = 
                      task.priority === 'urgent' ? 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-400/20' :
                      task.priority === 'high' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      task.priority === 'medium' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                      'bg-slate-100 text-slate-600 border-slate-200';

                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-xl bg-white border shadow-xs space-y-2 transition-all hover:shadow-md ${
                          task.status === 'blocked' ? 'border-l-4 border-l-rose-500 border-rose-200' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${priorityBadge}`}>
                            {task.priority}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{task.dueDate}</span>
                        </div>

                        <h3 className="text-xs font-bold text-slate-900 leading-snug">{task.title}</h3>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{task.description}</p>

                        {/* Blocker Reason Alert if blocked */}
                        {task.blockerReason && (
                          <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[10px] space-y-0.5">
                            <span className="font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Impediment / Blocker:</span>
                            </span>
                            <p className="text-rose-700">{task.blockerReason}</p>
                          </div>
                        )}

                        {/* Assignee */}
                        <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="font-medium truncate max-w-[100px]">{task.assigneeName || 'Unassigned'}</span>
                          </span>

                          {/* Quick Move Dropdown */}
                          <select
                            value={task.status}
                            onChange={(e) => handleMoveStatus(task, e.target.value as TaskStatus)}
                            className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-bold text-slate-700 cursor-pointer"
                          >
                            <option value="backlog">Backlog</option>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="in_review">In Review</option>
                            <option value="done">Done</option>
                            <option value="blocked">Blocked</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Create Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-scale-in">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900">Create Task — {selectedProject.name}</h3>
              </div>
              <button onClick={() => setIsTaskModalOpen(false)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement OpenTelemetry collector daemonsets"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs calm-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Context, deliverables, or checklist..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs calm-input resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-2 py-2 text-xs calm-input"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assignee</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full px-2 py-2 text-xs calm-input"
                  >
                    <option value="Sarah Chen">Sarah Chen (Lead)</option>
                    <option value="Marcus Vance">Marcus Vance (Dev)</option>
                    <option value="Alex Morgan">Alex Morgan (Admin)</option>
                    <option value="Elena Rostova">Elena Rostova (QA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs calm-input font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Blocker Modal */}
      {taskToBlock && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-md w-full overflow-hidden animate-scale-in">
            <div className="px-5 py-4 border-b border-rose-100 bg-rose-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-black text-rose-900">Task Blocked — Impediment Reason</h3>
              </div>
              <button onClick={() => setTaskToBlock(null)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={confirmBlockTask} className="p-5 space-y-3.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Task</span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{taskToBlock.title}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Why is this task blocked? <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Awaiting client firewall port opening or cloud quota approval..."
                  value={blockerReasonInput}
                  onChange={(e) => setBlockerReasonInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs calm-input resize-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  OJIX TeamFlow policy mandates a documented impediment note when moving to Blocked.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTaskToBlock(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20"
                >
                  Confirm Blocked
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. New Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-scale-in">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900">Start New Team Project</h3>
              </div>
              <button onClick={() => setIsProjectModalOpen(false)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mobile POS Gateway Rollout"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className="w-full px-3 py-2 text-xs calm-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Objective / Deliverable Statement</label>
                <textarea
                  rows={2}
                  placeholder="Concise definition of done and business objective..."
                  value={projObjective}
                  onChange={(e) => setProjObjective(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs calm-input resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Project Lead</label>
                  <select
                    value={projLead}
                    onChange={(e) => setProjLead(e.target.value)}
                    className="w-full px-2 py-2 text-xs calm-input"
                  >
                    <option value="Sarah Chen (Project Lead)">Sarah Chen (Lead)</option>
                    <option value="Alex Morgan (Workspace Admin)">Alex Morgan (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Completion</label>
                  <input
                    type="date"
                    value={projDueDate}
                    onChange={(e) => setProjDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs calm-input font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

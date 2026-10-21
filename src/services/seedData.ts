import { User, Contact, Deal, Activity, StageConfig } from '../types';

export const STAGES: StageConfig[] = [
  { id: 'lead', label: 'New Lead', description: 'Fresh inbound inquiries & prospect leads', color: 'slate', badgeBg: 'bg-slate-500/10', badgeText: 'text-slate-400' },
  { id: 'qualified', label: 'Qualified', description: 'Fit confirmed, budget & timing aligned', color: 'sky', badgeBg: 'bg-sky-500/10', badgeText: 'text-sky-400' },
  { id: 'discovery', label: 'Discovery / Demo', description: 'Needs evaluation & product presentation', color: 'indigo', badgeBg: 'bg-indigo-500/10', badgeText: 'text-indigo-400' },
  { id: 'proposal', label: 'Proposal Sent', description: 'Custom statement of work or commercial quote delivered', color: 'amber', badgeBg: 'bg-amber-500/10', badgeText: 'text-amber-400' },
  { id: 'negotiation', label: 'Negotiation', description: 'Legal, terms review, and executive sign-off', color: 'purple', badgeBg: 'bg-purple-500/10', badgeText: 'text-purple-400' },
  { id: 'won', label: 'Closed Won', description: 'Contract signed, onboarding kickoff', color: 'emerald', badgeBg: 'bg-emerald-500/10', badgeText: 'text-emerald-400' },
  { id: 'lost', label: 'Closed Lost', description: 'Archived deal with documented reason', color: 'rose', badgeBg: 'bg-rose-500/10', badgeText: 'text-rose-400' },
];

export const DEMO_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Admin',
    email: 'admin@test.com',
    role: 'admin',
    title: 'Workspace Admin',
    avatar: 'AD'
  },
  {
    id: 'user-sales',
    name: 'Sales Owner',
    email: 'owner@test.com',
    role: 'sales_owner',
    title: 'Sales / Account Owner',
    avatar: 'SO'
  },
  {
    id: 'user-member',
    name: 'Team Member',
    email: 'member@test.com',
    role: 'team_member',
    title: 'Team Member',
    avatar: 'TM'
  },
  {
    id: 'user-viewer',
    name: 'Viewer',
    email: 'viewer@test.com',
    role: 'viewer',
    title: 'Executive Viewer',
    avatar: 'VW'
  }
];

export function getRelativeDate(dayOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().split('T')[0];
}

export function getRelativeISO(dayOffset: number, hourOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(d.getHours() + hourOffset);
  return d.toISOString();
}

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'c-1',
    workspaceId: 'ws-main',
    name: 'Sophia Sterling',
    email: 'sophia@aurarobotics.synthetic',
    phone: '+1 (555) 234-8901',
    organizationName: 'Aura Robotics',
    source: 'Inbound',
    ownerId: 'user-sales',
    ownerName: 'Marcus Vance',
    tags: ['Enterprise', 'Robotics', 'High-Priority'],
    createdAt: getRelativeISO(-25),
    updatedAt: getRelativeISO(-1)
  },
  {
    id: 'c-2',
    workspaceId: 'ws-main',
    name: 'Liam Gallagher',
    email: 'liam@cloudwave.synthetic',
    phone: '+1 (555) 876-1234',
    organizationName: 'CloudWave Solutions',
    source: 'Referral',
    ownerId: 'user-sales',
    ownerName: 'Marcus Vance',
    tags: ['SaaS', 'Cloud'],
    createdAt: getRelativeISO(-18),
    updatedAt: getRelativeISO(-3)
  }
];

export const INITIAL_DEALS: Deal[] = [
  {
    id: 'd-1',
    workspaceId: 'ws-main',
    title: 'Autonomous Fleet Telemetry Suite',
    contactId: 'c-1',
    contactName: 'Sophia Sterling',
    organizationName: 'Aura Robotics',
    stage: 'negotiation',
    estimatedValue: 48000,
    currency: 'USD',
    expectedCloseDate: getRelativeDate(12),
    nextAction: 'Send revised SLA terms per legal comments',
    nextActionDate: getRelativeDate(-2),
    ownerId: 'user-sales',
    ownerName: 'Marcus Vance',
    tags: ['High-Value', 'Q4-Priority'],
    createdAt: getRelativeISO(-25),
    updatedAt: getRelativeISO(-2),
    lastActivityAt: getRelativeISO(-2)
  }
];

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    workspaceId: 'ws-main',
    dealId: 'd-1',
    contactId: 'c-1',
    type: 'meeting',
    title: 'Executive Legal & Pricing Alignment Call',
    description: 'Reviewed custom indemnification clause and payment milestones.',
    performedByUserId: 'user-sales',
    performedByUserName: 'Marcus Vance',
    createdAt: getRelativeISO(-2, -3)
  }
];

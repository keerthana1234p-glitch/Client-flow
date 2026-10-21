export type UserRole = 'admin' | 'sales_owner' | 'team_member' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  title: string;
}

export type DealStage = 'lead' | 'qualified' | 'discovery' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface StageConfig {
  id: DealStage;
  label: string;
  description: string;
  color: string;
  badgeBg: string;
  badgeText: string;
}

export interface Contact {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  phone: string;
  organizationName: string;
  source: 'Referral' | 'Inbound' | 'Outbound' | 'Event' | 'Website' | 'Other';
  ownerId: string;
  ownerName: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  workspaceId: string;
  title: string;
  contactId: string;
  contactName: string;
  organizationName: string;
  stage: DealStage;
  estimatedValue: number;
  currency: string;
  expectedCloseDate: string;
  nextAction: string;
  nextActionDate: string;
  ownerId: string;
  ownerName: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

export type ActivityType = 'note' | 'call' | 'meeting' | 'stage_change' | 'followup_scheduled' | 'created';

export interface Activity {
  id: string;
  workspaceId: string;
  dealId?: string;
  contactId?: string;
  type: ActivityType;
  title: string;
  description: string;
  performedByUserId: string;
  performedByUserName: string;
  createdAt: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchType?: 'email_exact' | 'none';
  existingRecord?: Contact;
  message?: string;
}

export interface FollowupFilter {
  ownerId: string;
  stage: string;
  source: string;
  bucket: 'all' | 'overdue' | 'dueToday' | 'upcoming';
  searchQuery: string;
}

export interface MetricSummary {
  totalPipelineValue: number;
  openDealsCount: number;
  followupsDueToday: number;
  followupsOverdue: number;
  staleDealsCount: number;
  stageBreakdown: Record<DealStage, { count: number; totalValue: number }>;
}

import { 
  Contact, 
  Deal, 
  Activity, 
  User, 
  DealStage, 
  DuplicateCheckResult, 
  MetricSummary, 
  FollowupFilter 
} from '../types';
import { checkPermission } from './rbac';
import { 
  INITIAL_CONTACTS, 
  INITIAL_DEALS, 
  INITIAL_ACTIVITIES, 
  STAGES 
} from './seedData';

class ClientFlowStore {
  private contacts: Contact[] = [...INITIAL_CONTACTS];
  private deals: Deal[] = [...INITIAL_DEALS];
  private activities: Activity[] = [...INITIAL_ACTIVITIES];

  public resetToSyntheticSeed(): void {
    this.contacts = [...INITIAL_CONTACTS];
    this.deals = [...INITIAL_DEALS];
    this.activities = [...INITIAL_ACTIVITIES];
  }

  public checkDuplicateEmail(email: string, excludeContactId?: string): DuplicateCheckResult {
    if (!email || !email.trim()) return { isDuplicate: false };
    const normalized = email.trim().toLowerCase();
    const existing = this.contacts.find(c => 
      c.id !== excludeContactId && c.email.trim().toLowerCase() === normalized
    );

    if (existing) {
      return {
        isDuplicate: true,
        matchType: 'email_exact',
        existingRecord: existing,
        message: `A contact with email "${existing.email}" already exists.`
      };
    }
    return { isDuplicate: false };
  }

  public getContacts(user: User): Contact[] {
    checkPermission(user, 'contact:read');
    return [...this.contacts];
  }

  public createContact(user: User, data: any, options?: any): Contact {
    checkPermission(user, 'contact:create');
    const newContact: Contact = {
      ...data,
      id: `c-${Date.now()}`,
      workspaceId: 'ws-main',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.contacts.unshift(newContact);
    return newContact;
  }

  public updateContact(user: User, contactId: string, data: any): Contact {
    const contact = this.contacts.find(c => c.id === contactId);
    if (!contact) throw new Error('Not found');
    checkPermission(user, 'contact:update', { ownerId: contact.ownerId });
    Object.assign(contact, data);
    return contact;
  }

  public deleteContact(user: User, contactId: string): void {
    const contact = this.contacts.find(c => c.id === contactId);
    if (!contact) throw new Error('Not found');
    checkPermission(user, 'contact:delete', { ownerId: contact.ownerId });
    this.contacts = this.contacts.filter(c => c.id !== contactId);
  }

  public getDeals(user: User): Deal[] {
    checkPermission(user, 'deal:read');
    return [...this.deals];
  }

  public createDeal(user: User, data: any): Deal {
    checkPermission(user, 'deal:create');
    const newDeal: Deal = {
      ...data,
      id: `d-${Date.now()}`,
      workspaceId: 'ws-main',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };
    this.deals.unshift(newDeal);
    return newDeal;
  }

  public updateDealStage(user: User, dealId: string, newStage: DealStage): Deal {
    const deal = this.deals.find(d => d.id === dealId);
    if (!deal) throw new Error('Deal not found');
    checkPermission(user, 'deal:stage_move', { ownerId: deal.ownerId });
    deal.stage = newStage;
    deal.lastActivityAt = new Date().toISOString();
    return deal;
  }

  public scheduleFollowup(user: User, dealId: string, nextAction: string, nextActionDate: string): Deal {
    const deal = this.deals.find(d => d.id === dealId);
    if (!deal) throw new Error('Deal not found');
    checkPermission(user, 'deal:update', { ownerId: deal.ownerId });
    deal.nextAction = nextAction;
    deal.nextActionDate = nextActionDate;
    deal.lastActivityAt = new Date().toISOString();
    return deal;
  }

  public getActivities(user: User, dealId?: string): Activity[] {
    checkPermission(user, 'activity:read');
    if (dealId) return this.activities.filter(a => a.dealId === dealId);
    return [...this.activities];
  }

  public logActivity(user: User, data: any): Activity {
    checkPermission(user, 'activity:create');
    const act: Activity = {
      ...data,
      id: `act-${Date.now()}`,
      performedByUserId: user.id,
      performedByUserName: user.name,
      createdAt: new Date().toISOString(),
    };
    this.activities.unshift(act);
    return act;
  }

  public getMetrics(user: User): MetricSummary {
    const deals = this.getDeals(user);
    const today = new Date().toISOString().split('T')[0];
    let totalPipelineValue = 0;
    let openDealsCount = 0;
    let followupsDueToday = 0;
    let followupsOverdue = 0;
    let staleDealsCount = 0;

    const stageBreakdown: Record<DealStage, { count: number; totalValue: number }> = {
      lead: { count: 0, totalValue: 0 },
      qualified: { count: 0, totalValue: 0 },
      discovery: { count: 0, totalValue: 0 },
      proposal: { count: 0, totalValue: 0 },
      negotiation: { count: 0, totalValue: 0 },
      won: { count: 0, totalValue: 0 },
      lost: { count: 0, totalValue: 0 },
    };

    for (const d of deals) {
      if (stageBreakdown[d.stage]) {
        stageBreakdown[d.stage].count++;
        stageBreakdown[d.stage].totalValue += d.estimatedValue;
      }
      if (d.stage !== 'won' && d.stage !== 'lost') {
        openDealsCount++;
        totalPipelineValue += d.estimatedValue;
        if (d.nextActionDate < today) followupsOverdue++;
        else if (d.nextActionDate === today) followupsDueToday++;
      }
    }

    return {
      totalPipelineValue,
      openDealsCount,
      followupsDueToday,
      followupsOverdue,
      staleDealsCount,
      stageBreakdown,
    };
  }

  public getFollowupQueue(user: User, filter: FollowupFilter): {
    overdue: Deal[];
    dueToday: Deal[];
    upcoming: Deal[];
  } {
    const deals = this.getDeals(user);
    const today = new Date().toISOString().split('T')[0];
    const overdue = deals.filter(d => d.nextActionDate < today && d.stage !== 'won' && d.stage !== 'lost');
    const dueToday = deals.filter(d => d.nextActionDate === today && d.stage !== 'won' && d.stage !== 'lost');
    const upcoming = deals.filter(d => d.nextActionDate > today && d.stage !== 'won' && d.stage !== 'lost');
    return { overdue, dueToday, upcoming };
  }
}

export const store = new ClientFlowStore();

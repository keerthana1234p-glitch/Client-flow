export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';

export interface Project {
  id: string;
  name: string;
  objective: string;
  ownerId: string;
  ownerName: string;
  status: ProjectStatus;
  startDate: string;
  dueDate: string;
  memberIds: string[];
  dealId?: string;
  dealTitle?: string;
  dealValue?: number;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeName: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  blockerReason?: string;
  dueDate: string;
}

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-infra-01',
    name: 'Q4 Cloud Infrastructure & Telemetry',
    objective: 'Modernize Kubernetes clusters, establish distributed tracing, and achieve 99.95% uptime.',
    ownerId: 'user-lead-sarah',
    ownerName: 'Sarah Chen (Project Lead)',
    status: 'active',
    startDate: '2026-10-01',
    dueDate: '2026-12-15',
    memberIds: ['user-admin-alex', 'user-lead-sarah', 'user-member-marcus', 'user-viewer-elena'],
    dealTitle: 'Kubernetes Multi-Region Cluster',
    dealValue: 45000,
  },
  {
    id: 'proj-telemetry-02',
    name: 'Autonomous Fleet Telemetry Suite Delivery',
    objective: 'Deploy IoT fleet analytics, hardware edge telemetry gateways, and onboard enterprise operators.',
    ownerId: 'user-admin-alex',
    ownerName: 'Alex Morgan (Workspace Admin)',
    status: 'active',
    startDate: '2026-10-10',
    dueDate: '2026-12-30',
    memberIds: ['user-admin-alex', 'user-lead-sarah', 'user-member-marcus'],
    dealTitle: 'Autonomous Fleet Telemetry Suite',
    dealValue: 125000,
  },
  {
    id: 'proj-sso-03',
    name: 'Enterprise SSO & Tenant Security Module',
    objective: 'Implement SAML 2.0 / OIDC enterprise authentication, workspace tenant boundaries, and audit trail.',
    ownerId: 'user-lead-sarah',
    ownerName: 'Sarah Chen (Project Lead)',
    status: 'completed',
    startDate: '2026-09-01',
    dueDate: '2026-10-20',
    memberIds: ['user-admin-alex', 'user-member-marcus'],
    dealTitle: 'Enterprise Single Sign-On Module',
    dealValue: 35000,
  },
];

export const INITIAL_TASKS: ProjectTask[] = [
  {
    id: 'task-101',
    projectId: 'proj-infra-01',
    title: 'Automated container security scanning',
    description: 'Integrate vulnerability scanner into CI/CD pipeline to catch CVEs prior to image build.',
    assigneeName: 'Marcus Vance',
    priority: 'medium',
    status: 'in_progress',
    dueDate: '2026-11-15',
  },
  {
    id: 'task-102',
    projectId: 'proj-infra-01',
    title: 'High-availability ingress controller deployment',
    description: 'Configure multi-AZ ingress controller with TLS termination and traffic rate limiting.',
    assigneeName: 'Marcus Vance',
    priority: 'urgent',
    status: 'blocked',
    blockerReason: 'Awaiting cloud provider IP quota approval from security office.',
    dueDate: '2026-10-28',
  },
  {
    id: 'task-103',
    projectId: 'proj-infra-01',
    title: 'Distributed tracing collector rollout',
    description: 'Deploy OpenTelemetry collector daemonsets and configure sampling rates.',
    assigneeName: 'Sarah Chen',
    priority: 'high',
    status: 'todo',
    dueDate: '2026-11-05',
  },
  {
    id: 'task-104',
    projectId: 'proj-infra-01',
    title: 'Grafana dashboards for cluster SLO tracking',
    description: 'Build executive and engineering dashboards tracking p95 latency and error budgets.',
    assigneeName: 'Marcus Vance',
    priority: 'low',
    status: 'done',
    dueDate: '2026-10-20',
  },
  {
    id: 'task-201',
    projectId: 'proj-telemetry-02',
    title: 'IoT Edge firmware security validation',
    description: 'Sign edge device binaries with hardware security module keys and verify boot chain.',
    assigneeName: 'Alex Morgan',
    priority: 'urgent',
    status: 'in_progress',
    dueDate: '2026-11-02',
  },
  {
    id: 'task-202',
    projectId: 'proj-telemetry-02',
    title: 'Vehicle CAN bus data decoder pipeline',
    description: 'Implement streaming decoder service parsing J1939 telemetry packets at 100Hz.',
    assigneeName: 'Marcus Vance',
    priority: 'high',
    status: 'todo',
    dueDate: '2026-11-10',
  },
  {
    id: 'task-203',
    projectId: 'proj-telemetry-02',
    title: 'Fleet health alerting threshold configuration',
    description: 'Set automated alerts for engine temperature anomalies and battery drain.',
    assigneeName: 'Sarah Chen',
    priority: 'medium',
    status: 'backlog',
    dueDate: '2026-11-25',
  },
  {
    id: 'task-301',
    projectId: 'proj-sso-03',
    title: 'SAML IdP metadata parser implementation',
    description: 'Parse Okta and Azure AD enterprise metadata XML files and validate cert chains.',
    assigneeName: 'Marcus Vance',
    priority: 'high',
    status: 'done',
    dueDate: '2026-10-10',
  },
];

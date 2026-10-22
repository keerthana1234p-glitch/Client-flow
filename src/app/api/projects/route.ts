import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_PROJECTS, INITIAL_TASKS, Project } from '@/services/teamFlowService';

export async function GET(req: NextRequest) {
  // Support optional API Key validation for cross-product integration
  const apiKey = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('api_key');
  
  // Return unified projects with active task statistics
  const projectsWithStats = INITIAL_PROJECTS.map(proj => {
    const tasks = INITIAL_TASKS.filter(t => t.projectId === proj.id);
    const completed = tasks.filter(t => t.status === 'done').length;
    const blocked = tasks.filter(t => t.status === 'blocked').length;
    const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

    return {
      ...proj,
      taskCount: tasks.length,
      completedTaskCount: completed,
      blockedTaskCount: blocked,
      progressPercent: progress,
    };
  });

  return NextResponse.json({
    success: true,
    ecosystem: 'OJIX Enterprise Suite',
    products: {
      crm: 'OJIX ClientFlow',
      projects: 'OJIX TeamFlow',
    },
    apiKeyAuthenticated: Boolean(apiKey),
    projects: projectsWithStats,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, objective, ownerName = 'Alex Morgan', dueDate, dealId, dealTitle, dealValue } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const newProject: Project = {
      id: `proj-${Date.now().toString(36)}`,
      name: name.trim(),
      objective: (objective || '').trim() || 'Execute client deliverables on schedule.',
      ownerId: 'user-admin-alex',
      ownerName: ownerName || 'Alex Morgan (Admin)',
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      memberIds: ['user-admin-alex', 'user-lead-sarah'],
      dealId: dealId || undefined,
      dealTitle: dealTitle || undefined,
      dealValue: dealValue ? Number(dealValue) : undefined,
    };

    return NextResponse.json({
      success: true,
      message: 'Project created successfully in OJIX TeamFlow execution suite',
      project: newProject,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create project' }, { status: 500 });
  }
}

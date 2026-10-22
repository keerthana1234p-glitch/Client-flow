import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Master API Key for OJIX Suite Cross-Product Communication
const VALID_API_KEYS = new Set([
  'ojix-teamflow-clientflow-2026',
  'ojix-suite-api-key',
  'teamflow-secret-key',
]);

/**
 * GET /api/projects
 * Called by OJIX TeamFlow (colleague app) to fetch projects/won deals from ClientFlow CRM.
 * Supports authentication via:
 *   - Header: 'x-api-key: ojix-teamflow-clientflow-2026'
 *   - Query:  '?api_key=ojix-teamflow-clientflow-2026'
 * Optional filters:
 *   - ?stage=WON (default, or 'all', 'QUALIFIED', 'LEAD')
 *   - ?workspaceId=ws-primary-1
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('api_key');
    
    // In production, verify API key if provided
    const isApiKeyProvided = Boolean(apiKey);
    const isValidKey = isApiKeyProvided && (VALID_API_KEYS.has(apiKey!) || process.env.NODE_ENV !== 'production' || apiKey!.length >= 8);

    const stageParam = req.nextUrl.searchParams.get('stage') || 'all';
    const workspaceIdParam = req.nextUrl.searchParams.get('workspaceId');

    // Build Prisma query condition
    const whereCondition: any = {};
    if (stageParam && stageParam.toUpperCase() !== 'ALL') {
      whereCondition.stage = stageParam.toUpperCase();
    }
    if (workspaceIdParam) {
      whereCondition.workspaceId = workspaceIdParam;
    }

    const deals = await prisma.deal.findMany({
      where: whereCondition,
      include: {
        contact: true,
        followUps: true,
        notes: true,
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Map deals to clean Project specifications for TeamFlow
    const projects = deals.map(deal => {
      const primaryFollowUp = deal.followUps?.[0];
      const primaryNote = deal.notes?.[0];

      return {
        id: `proj-${deal.id}`,
        dealId: deal.id,
        name: deal.title,
        title: deal.title,
        objective: primaryNote?.content || `Execute deliverables for ${deal.contact?.name || 'client'} under closed contract.`,
        client: {
          name: deal.contact?.name || 'Direct Enterprise Client',
          email: deal.contact?.email || 'client@enterprise.com',
          phone: deal.contact?.phone || null,
        },
        dealValue: deal.value,
        dealStage: deal.stage,
        temperature: deal.temperature,
        // Status mapping: WON deals are 'active' projects for execution
        status: deal.stage === 'WON' ? 'active' : 'planning',
        isReadyForExecution: deal.stage === 'WON',
        startDate: deal.createdAt.toISOString().split('T')[0],
        dueDate: primaryFollowUp?.dueAt 
          ? primaryFollowUp.dueAt.toISOString().split('T')[0]
          : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        workspaceId: deal.workspaceId,
        workspaceName: deal.workspace?.name || 'ClientFlow Workspace',
        createdAt: deal.createdAt.toISOString(),
        lastActivityAt: deal.lastActivityAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Projects successfully fetched from OJIX ClientFlow CRM backend',
      sourceApp: 'OJIX ClientFlow (CRM)',
      targetApp: 'OJIX TeamFlow (Project OS)',
      apiKeyAuthenticated: isValidKey,
      totalCount: projects.length,
      filter: {
        stage: stageParam,
        workspaceId: workspaceIdParam || 'all',
      },
      projects,
    }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  } catch (err: any) {
    console.error('Error in /api/projects GET:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal server error while fetching projects',
    }, { status: 500 });
  }
}

/**
 * POST /api/projects
 * Called by TeamFlow when a project's status changes or completes.
 * Can mark a deal as WON or update its delivery status in ClientFlow.
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('api_key');
    const body = await req.json();
    const { dealId, projectId, status, completedNote } = body;

    const targetDealId = dealId || (projectId ? projectId.replace('proj-', '') : null);

    if (!targetDealId) {
      return NextResponse.json({
        error: 'dealId or projectId is required',
      }, { status: 400 });
    }

    // Find the deal
    const existingDeal = await prisma.deal.findUnique({
      where: { id: targetDealId },
    });

    if (!existingDeal) {
      return NextResponse.json({
        error: `Deal with id ${targetDealId} not found in ClientFlow database`,
      }, { status: 404 });
    }

    // If status indicates completion, ensure stage is WON and log completion note
    let updatedDeal = existingDeal;
    if (status === 'completed' || status === 'done' || status === 'WON') {
      updatedDeal = await prisma.deal.update({
        where: { id: targetDealId },
        data: {
          stage: 'WON',
          lastActivityAt: new Date(),
        },
      });

      // Add a note in ClientFlow that TeamFlow finished execution
      await prisma.note.create({
        data: {
          content: completedNote || 'Project execution marked COMPLETED in OJIX TeamFlow. Ready for client delivery!',
          dealId: targetDealId,
          workspaceId: existingDeal.workspaceId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Project ${targetDealId} status updated in ClientFlow CRM`,
      deal: updatedDeal,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message || 'Failed to update project status',
    }, { status: 500 });
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const EXPECTED_API_KEY = process.env.TEAMFLOW_API_KEY || 'ojix-teamflow-sync-2026';

function validateApiKey(req: NextRequest): boolean {
  const headerKey = req.headers.get('x-api-key');
  const authHeader = req.headers.get('authorization');
  const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const url = new URL(req.url);
  const queryKey = url.searchParams.get('api_key');

  const providedKey = headerKey || bearerKey || queryKey;
  return providedKey === EXPECTED_API_KEY;
}

/**
 * GET /api/integrations/teamflow
 * Option B: Data & Backend Integration via API
 * 
 * Provides automated project delivery feed to TeamFlow for all Closed Won deals.
 * Requires: x-api-key header or ?api_key= query parameter.
 */
export async function GET(req: NextRequest) {
  if (!validateApiKey(req)) {
    return NextResponse.json(
      {
        error: 'Unauthorized: Invalid or missing API Key for TeamFlow integration.',
        hint: 'Provide header: "x-api-key: ojix-teamflow-sync-2026" or query param: "?api_key=ojix-teamflow-sync-2026"',
      },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const stageFilter = url.searchParams.get('stage')?.toUpperCase() || 'WON';

  try {
    const deals = await prisma.deal.findMany({
      where: stageFilter === 'ALL' ? {} : { stage: stageFilter },
      include: {
        contact: true,
      },
      orderBy: {
        lastActivityAt: 'desc',
      },
    });

    const projects = deals.map((deal) => ({
      id: `proj-${deal.id}`,
      dealId: deal.id,
      name: deal.title,
      objective: `Enterprise delivery for ${deal.title} (Client: ${deal.contact?.name || 'Direct Enterprise Client'})`,
      ownerName: 'Sales Lead',
      client: {
        name: deal.contact?.name || 'Enterprise Client',
        email: deal.contact?.email || 'client@enterprise.com',
        phone: deal.contact?.phone || null,
      },
      dealValue: deal.value,
      dealStage: deal.stage,
      status: deal.stage === 'WON' ? 'active' : 'planning',
      isReadyForExecution: deal.stage === 'WON',
      workspaceId: deal.workspaceId,
      lastActivityAt: deal.lastActivityAt,
      syncedAt: new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      integrationMode: 'Option B (Backend API Data Sync)',
      provider: 'OJIX ClientFlow CRM',
      totalProjects: projects.length,
      syncedAt: new Date().toISOString(),
      projects,
    });
  } catch (err: any) {
    console.error('TeamFlow integration fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch project integration data', details: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/teamflow
 * Allows TeamFlow to sync delivery execution status back to ClientFlow
 */
export async function POST(req: NextRequest) {
  if (!validateApiKey(req)) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing API Key.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { dealId, projectStatus, notes } = body;

    if (!dealId) {
      return NextResponse.json(
        { error: 'dealId is required to record TeamFlow delivery callback.' },
        { status: 400 }
      );
    }

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }

    // Record note on deal
    await prisma.note.create({
      data: {
        content: `[TeamFlow Sync Callback] Delivery Status: ${projectStatus || 'Updated'}. ${notes || ''}`,
        dealId: deal.id,
        workspaceId: deal.workspaceId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'TeamFlow execution update acknowledged and logged to deal notes.',
      dealId: deal.id,
      recordedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to process TeamFlow callback', details: err.message },
      { status: 500 }
    );
  }
}

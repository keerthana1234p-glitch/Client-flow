import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  
  // Clear the session cookie
  response.cookies.set('clientflow_session', '', {
    httpOnly: false,
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}

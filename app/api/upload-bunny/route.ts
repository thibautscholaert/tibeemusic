import { streamFromDriveToBunny } from '@/utils/bunny';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { fileId, filename, accessToken } = await req.json();

    if (!fileId || !filename || !accessToken) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
    }

    const bunnyRes = await streamFromDriveToBunny(fileId, filename, accessToken);

    if (bunnyRes.success) {
      return NextResponse.json({ success: true, url: bunnyRes.url }, { status: 200 });
    } else {
      return NextResponse.json({ error: bunnyRes.message }, { status: bunnyRes.status });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur inconnue' }, { status: 500 });
  }
}

import { streamFromDriveToBunny } from '@/utils/bunny';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { files, accessToken } = await req.json();

    if (!files || !accessToken) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
    }

    if (files.length > 50) {
      return NextResponse.json({ error: 'Trop de fichiers' }, { status: 400 });
    }

    const uploads = await Promise.all(
      files.map(async (file: { id: string; name: string }) =>
        streamFromDriveToBunny(file.id, file.name, accessToken)
      )
    );
    const failedUploads = uploads.filter(upload => !upload.success);
    const successfulUploads = uploads.filter(upload => upload.success);
    const failedCount = failedUploads.length;
    const successfulCount = successfulUploads.length;
    const failedFiles = failedUploads.map(upload => ({
      id: upload.fileId,
      message: upload.message,
    }));

    return NextResponse.json({ failedCount, successfulCount, failedFiles }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur inconnue' }, { status: 500 });
  }
}

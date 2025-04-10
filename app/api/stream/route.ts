import { getDriveFileBlob } from '@/utils/googleDrive';
import { createClient } from '@/utils/supabase/server';
import { uploadToSupabase } from '@/utils/supabase/supabaseStorage';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { googleFileId, accessToken } = await req.json();
  const [blob, supabase] = await Promise.all([getDriveFileBlob(googleFileId, accessToken), createClient()]);
      await uploadToSupabase(supabase, googleFileId, blob)
  return NextResponse.json({}, { status: 200 })
}

import { getDriveFileBlob } from '@/utils/googleDrive';
import { createClient } from '@/utils/supabase/server';
import { uploadToSupabase } from '@/utils/supabase/supabaseStorage';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  // TODO : check audio_file table and check files are in sotrage. If not, delete row

  return NextResponse.json({}, { status: 200 });
}

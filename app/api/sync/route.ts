import { createClient } from '@/utils/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: audioFiles } = await supabase
    .from('audio_file')
    .select('drive_id');

  if (audioFiles) {
    for (const audioFile of audioFiles) {
      const { drive_id } = audioFile;
      deleteIfNotExists(supabase, drive_id);
    }
  }
  return NextResponse.json({}, { status: 200 });
}

async function deleteIfNotExists(supabase: SupabaseClient, drive_id: string) {
  const { data: exists } = await supabase.storage.from('temp-audio').exists(drive_id);
  // console.log(`Checking existence of file with drive_id ${drive_id}: ${exists}`);
  if (!exists) {
    console.warn(`File with drive_id ${drive_id} does not exist in storage. Deleting from database.`);
    await supabase.from('audio_file').delete().eq('drive_id', drive_id);
  } else {
    // console.log(`File with drive_id ${drive_id} exists in storage.`);
  }
}

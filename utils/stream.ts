import { SupabaseClient } from '@supabase/supabase-js';
import { cleanFilename } from './bunny';
import { getCachedStreambleFiles } from './cache';
import { getDriveFileBlob } from './googleDrive';
import { uploadToSupabase } from './supabase/supabaseStorage';

export async function streamFromDriveToSupabase(
  supabase: SupabaseClient,
  userId: string,
  fileId: string,
  fileName: string,
  accessToken: string,
  streamify = true
): Promise<string | null> {
  // Vérifie si le fichier est déjà sur Supabase
  const exists = await isFileStreamable(supabase, userId, fileId);

  const { publicUrl } = supabase.storage.from('temp-audio').getPublicUrl(fileId).data;

  console.log('exists', exists, fileName);

  if (exists) {
    return publicUrl;
  }

  if (streamify) {
    if (!exists) {
      const blob = await getDriveFileBlob(fileId, accessToken);
      await Promise.all([uploadToSupabase(supabase, fileId, blob)]);
    }
    await supabase.from('audio_file').upsert(
      {
        user_id: userId,
        inserted_at: new Date(),
        drive_id: fileId,
        name: fileName,
        url: publicUrl,
      },
      { onConflict: 'drive_id', ignoreDuplicates: true }
    );
  }

  return publicUrl;
}

export async function isFileStreamable(
  supabase: SupabaseClient,
  userId: string,
  fileId: string
): Promise<boolean> {
  const list = await getCachedStreambleFiles(supabase, userId);
  return list.some(f => f.drive_id === fileId);
}

export async function streamFromDriveToBunny(
  fileId: string,
  filename: string,
  accessToken: string
): Promise<string | null> {
  const res = await fetch('/api/upload-bunny', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId,
      filename: cleanFilename(filename),
      accessToken,
    }),
  });

  const json = await res.json();
  return json.url;
}

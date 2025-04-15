import { SupabaseClient } from '@supabase/supabase-js';
import { getCachedFileList } from './cache';
import { getDriveFileBlob } from './googleDrive';
import { uploadToSupabase } from './supabase/supabaseStorage';
import { cleanFilename } from './bunny';

export async function streamFromDriveToSupabase(
  supabase: SupabaseClient,
  fileId: string,
  accessToken: string,
  streamify = true
): Promise<string | null> {
  // Vérifie si le fichier est déjà sur Supabase
  const exists = await isFileStreamable(supabase, fileId);

  if (!exists) {
    if (streamify) {
      const blob = await getDriveFileBlob(fileId, accessToken);
      await uploadToSupabase(supabase, fileId, blob);
    } else {
      return null;
    }
  }

  const { data } = supabase.storage.from('temp-audio').getPublicUrl(fileId);
  return data.publicUrl;
}

export async function isFileStreamable(supabase: SupabaseClient, fileId: string): Promise<boolean> {
  const list = await getCachedFileList(supabase);
  return list.some(f => f.name === fileId);
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

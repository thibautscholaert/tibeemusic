import { SupabaseClient } from '@supabase/supabase-js'

export async function uploadToSupabase(
  supabase: SupabaseClient,
  fileName: string,
  file: Blob,
  bucket = 'temp-audio'
) {
  const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
    contentType: file.type,
    upsert: true,
  })

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`)
  }
}

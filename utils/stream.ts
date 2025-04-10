import { SupabaseClient } from "@supabase/supabase-js"
import { getDriveFileBlob } from "./googleDrive"
import { uploadToSupabase } from "./supabase/supabaseStorage"

export async function streamFromDriveToSupabase(
    supabase: SupabaseClient,
    fileId: string,
    accessToken: string
  ): Promise<string> {
    // Vérifie si le fichier est déjà sur Supabase
    const { data: list } = await supabase.storage.from('temp-audio').list()
    const exists = list?.find((f) => f.name === fileId)
  
    if (!exists) {
      const blob = await getDriveFileBlob(fileId, accessToken)
      await uploadToSupabase(supabase, fileId, blob)
    //   await fetch('/api/stream', {
    //     method: 'POST',
    //     body: JSON.stringify({googleFileId: fileId, accessToken}),
    // })
    }
  
    const { data } = supabase.storage.from('temp-audio').getPublicUrl(fileId)
    return data.publicUrl
  }
  
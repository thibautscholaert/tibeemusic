import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";

export async function uploadAudio(supabase: SupabaseClient, file: File, userId: string) {
    const filePath = `${userId}/${file.name}`;
    const { error } = await supabase.storage.from('audio').upload(filePath, file);
    return error;
}

export async function listAudioFiles(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase.storage
        .from('audio')
        .list(`${userId}/`, { limit: 100 });
    return data;
}


export async function getAudioUrl(supabase: SupabaseClient, userId: string, filename: string) {
    const { data } = supabase.storage
        .from('audio')
        .getPublicUrl(`${userId}/${filename}`);
    return data?.publicUrl;
}

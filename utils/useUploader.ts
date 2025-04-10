import { SupabaseClient } from "@supabase/supabase-js";
import { getFileDirectLink, getGoogleDriveToken, listFilesInFolder, uploadToGoogleDrive } from "./googleDrive";
import { streamFromDriveToSupabase } from "./stream";

export async function uploadAudio(supabase: SupabaseClient, file: File, userId: string) {

    //TODO : check quota


    
    const filePath = `${userId}/${file.name}`;
    const googleDriveAccessToken = await getGoogleDriveToken(supabase, userId);
    if(googleDriveAccessToken){
        // TODO : check if already uploaded
        return uploadToGoogleDrive(googleDriveAccessToken, file);
    } else {
               // TODO : check if already uploaded
 const { error } = await supabase.storage.from('audio').upload(filePath, file);
        return error;
    }
}

export async function listAudioFiles(supabase: SupabaseClient, userId: string) {
    const googleDriveAccessToken = await getGoogleDriveToken(supabase, userId);
    if(googleDriveAccessToken) {
        return listFilesInFolder(googleDriveAccessToken);
    } else {
        const { data, error } = await supabase.storage
        .from('audio')
        .list(`${userId}/`, { limit: 100 });
    return data;
    }
    
}

export async function getAudioUrl(supabase: SupabaseClient, userId: string, fileId: string, filename: string) {
    const googleDriveAccessToken = await getGoogleDriveToken(supabase, userId);
    if(googleDriveAccessToken) {
        return streamFromDriveToSupabase(supabase, fileId, googleDriveAccessToken);
    } else {
    const { data } = supabase.storage
        .from('audio')
        .getPublicUrl(`${userId}/${filename}`);
    return data?.publicUrl;
    }
}

export async function getDlUrl(supabase: SupabaseClient, userId: string, filename: string) {
    const googleDriveAccessToken = await getGoogleDriveToken(supabase, userId);
    if(googleDriveAccessToken){
        return getFileDirectLink(googleDriveAccessToken, filename);
    } else {
    const { data } = supabase.storage
        .from('audio')
        .getPublicUrl(`${userId}/${filename}`);
    return data?.publicUrl;
    }
}

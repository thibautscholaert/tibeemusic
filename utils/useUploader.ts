import { IFile } from '@/types/file';
import { IFolder } from '@/types/folder';
import { GoogleDrivePage } from '@/types/google-drive';
import { PostgrestSingleResponse, SupabaseClient } from '@supabase/supabase-js';
import { getCachedDriveFiles, getCachedGoogleDriveToken } from './cache';
import {
    getFileDirectLink,
    getOrCreateFolder,
    listFilesInFolder,
    listFoldersInFolder,
    mapGoogleFile,
    uploadToGoogleDrive,
} from './googleDrive';
import { streamFromDriveToBunny, streamFromDriveToSupabase } from './stream';

export async function uploadAudio(supabase: SupabaseClient, file: File, userId: string) {
    //TODO : check quota
    const filePath = `${userId}/${file.name}`;
    const googleDriveAccessToken = await getCachedGoogleDriveToken(supabase, userId);
    if (googleDriveAccessToken) {
        // TODO : check if already uploaded
        return uploadToGoogleDrive(googleDriveAccessToken, file);
    } else {
        // TODO : check if already uploaded
        const { error } = await supabase.storage.from('audio').upload(filePath, file);
        return error;
    }
}

export async function listAudioFiles(
    supabase: SupabaseClient,
    userId: string,
    options: { folderId?: string; pageToken?: string; filterQuery?: string; tag?: string }
): Promise<GoogleDrivePage | { files: IFile[] } | null> {
    const googleDriveAccessToken = await getCachedGoogleDriveToken(supabase, userId);
    if (googleDriveAccessToken) {
        // return listFilesInFolder(googleDriveAccessToken, options);
        const data = await listFilesInFolder(googleDriveAccessToken, options);
        return {
            ...data,
            files: data.files.map(file => mapGoogleFile(file)),
        };
    } else {
        const path = `${userId}/` + (options.folderId ? `${options.folderId}/` : '');
        const { data, error } = await supabase.storage.from('audio').list(path, { limit: 60 });
        if (error) {
            console.error('Error listing files:', error);
            return null;
        }
        return { files: data };
    }
}

let defaultFolderId: string | null = null;

export async function getDefaultFolder(
    supabase: SupabaseClient,
    userId: string
): Promise<IFolder | null> {
    const googleDriveAccessToken = await getCachedGoogleDriveToken(supabase, userId);
    if (googleDriveAccessToken) {
        defaultFolderId =
            defaultFolderId ?? (await getOrCreateFolder(googleDriveAccessToken, 'TibeeMusic'));
        return { id: defaultFolderId, name: 'TibeeMusic', type: 'folder' };
    }
    return null;
}

export const streamablePlaylist: IFolder = {
    id: 'STREAMABLE',
    name: 'Streamable',
    type: 'playlist',
};

export async function listFolders(supabase: SupabaseClient, userId: string): Promise<IFolder[]> {
    const googleDriveAccessToken = await getCachedGoogleDriveToken(supabase, userId);
    const folders: IFolder[] = [streamablePlaylist];

    const playlists = await supabase.from('playlists').select('*').eq('user_id', userId);

    folders.push(
        ...(playlists.data || []).map(
            playlist =>
                ({
                    id: playlist.id,
                    name: playlist.name,
                    type: 'playlist',
                }) as IFolder
        )
    );

    if (googleDriveAccessToken) {
        const defaultFolder = await getDefaultFolder(supabase, userId);
        if (defaultFolder) {
            folders.push(defaultFolder);
        }
        // folders.push(
        //     ...(await listFoldersInFolder(googleDriveAccessToken)).map(
        //         folder =>
        //             ({
        //                 ...folder,
        //                 type: 'folder',
        //             }) as IFolder
        //     )
        // );
    }

    return folders;
}

export async function listSupaAudioFiles(
    supabase: SupabaseClient,
    userId: string
): Promise<PostgrestSingleResponse<any[]>> {
    return supabase.from('audio_file').select('*').eq('user_id', userId);
}

export async function getAudioUrl(
    supabase: SupabaseClient,
    userId: string,
    fileId: string,
    filename: string
) {
    const googleDriveAccessToken = await getCachedGoogleDriveToken(supabase, userId);
    if (googleDriveAccessToken) {
        return streamFromDriveToSupabase(
            supabase,
            userId,
            fileId,
            filename,
            googleDriveAccessToken,
            false
        );
        // return streamFromDriveToBunny(fileId, googleDriveAccessToken);
        // const exists = await exsistsInBunny(fileId);
        // if (exists) {
        // return getBunnyUrl(filename);
        // }
    } else {
        const { data } = supabase.storage.from('audio').getPublicUrl(`${userId}/${filename}`);
        return data?.publicUrl;
    }
    // return null;
}

export async function streamify(
    supabase: SupabaseClient,
    userId: string,
    fileId: string,
    filename: string,
    streamify = true
) {
    const googleDriveAccessToken = await getCachedGoogleDriveToken(supabase, userId);
    if (googleDriveAccessToken) {
        return streamFromDriveToSupabase(
            supabase,
            userId,
            fileId,
            filename,
            googleDriveAccessToken,
            streamify
        );
        // return streamFromDriveToBunny(fileId, filename, googleDriveAccessToken);
    } else {
        const { data } = supabase.storage.from('audio').getPublicUrl(`${userId}/${filename}`);
        return data?.publicUrl;
    }
}

export async function getDlUrl(supabase: SupabaseClient, userId: string, filename: string) {
    const googleDriveAccessToken = await getCachedGoogleDriveToken(supabase, userId);
    if (googleDriveAccessToken) {
        return getFileDirectLink(googleDriveAccessToken, filename);
    } else {
        const { data } = supabase.storage.from('audio').getPublicUrl(`${userId}/${filename}`);
        return data?.publicUrl;
    }
}

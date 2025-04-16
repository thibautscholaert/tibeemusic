import { GoogleDrivePage } from '@/types/google-drive';
import { SupabaseClient } from '@supabase/supabase-js';
import { getGoogleDriveToken, listFilesInFolder } from './googleDrive';

type Cached = {
  promise: Promise<any>;
  expiresAt: number;
};

const cache: Map<string, Cached> = new Map();

export function clearCache(key: string) {
  cache.delete(key);
}

export async function getCachedGoogleDriveToken(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const cacheKey = 'g-drive-token';
  const now = Date.now();

  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  // ⚡️ Crée une seule promesse et la stocke immédiatement
  const promise = getGoogleDriveToken(supabase, userId);

  // 🧠 Met à jour le cache avec une nouvelle promesse et TTL
  cache.set(cacheKey, {
    promise,
    expiresAt: now + 60_000, // 1 minute
  });

  return promise;
}

export async function getCachedFileList(supabase: SupabaseClient): Promise<any[]> {
  const cacheKey = 'temp-audio';
  const now = Date.now();

  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  // ⚡️ Crée une seule promesse et la stocke immédiatement
  const promise = supabase.storage
    .from(cacheKey)
    .list()
    .then(res => {
      if (res.error) {
        console.error('Supabase error:', res.error.message);
        return [];
      }
      return res.data ?? [];
    });

  // 🧠 Met à jour le cache avec une nouvelle promesse et TTL
  cache.set(cacheKey, {
    promise,
    expiresAt: now + 60_000, // 1 minute
  });

  return promise;
}

export async function getCachedStreambleFiles(
  supabase: SupabaseClient,
  userId: string
): Promise<any[]> {
  const cacheKey = `streamable-${userId}`;
  const now = Date.now();

  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  // ⚡️ Crée une seule promesse et la stocke immédiatement
  const promise = Promise.resolve(
    supabase
      .from('audio_file')
      .select('*')
      .eq('user_id', userId)
      .then(res => {
        if (res.error) {
          console.error('Supabase error:', res.error.message);
          return [];
        }
        return res.data ?? [];
      })
  );

  // 🧠 Met à jour le cache avec une nouvelle promesse et TTL
  cache.set(cacheKey, {
    promise,
    expiresAt: now + 60_000, // 1 minute
  });

  return promise;
}

export async function getCachedDriveFiles(
  userId: string,
  accessToken: string,
  options: { folderId?: string; pageToken?: string; filterQuery?: string; tag?: string }
): Promise<GoogleDrivePage> {
  const cacheKey = `drive-files-${userId}-${options.folderId || ''}-${options.pageToken || ''}-${options.filterQuery || ''}`;
  const now = Date.now();

  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  // ⚡️ Crée une seule promesse et la stocke immédiatement
  const promise = listFilesInFolder(accessToken, options);

  // 🧠 Met à jour le cache avec une nouvelle promesse et TTL
  cache.set(cacheKey, {
    promise,
    expiresAt: now + 60_000, // 1 minute
  });

  return promise;
}

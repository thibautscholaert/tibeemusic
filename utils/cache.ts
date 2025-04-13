import { SupabaseClient } from "@supabase/supabase-js"
import { getDriveFileBlob, getGoogleDriveToken } from "./googleDrive"
import { uploadToSupabase } from "./supabase/supabaseStorage"

type Cached = {
  promise: Promise<any>;
  expiresAt: number;
};

const cache: Map<string, Cached> = new Map();

export async function getCachedGoogleDriveToken(supabase: SupabaseClient, userId: string): Promise<string | null> {
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
    expiresAt: now + 10_000, // 10 secondes
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
  const promise = supabase.storage.from(cacheKey).list().then((res) => {
    if (res.error) {
      console.error('Supabase error:', res.error.message);
      return [];
    }
    return res.data ?? [];
  });

  // 🧠 Met à jour le cache avec une nouvelle promesse et TTL
  cache.set(cacheKey, {
    promise,
    expiresAt: now + 10_000, // 10 secondes
  });

  return promise;
}
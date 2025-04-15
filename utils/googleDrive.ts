import { GoogleDriveFile, GoogleDrivePage } from '@/types/google-drive';
import { SupabaseClient } from '@supabase/supabase-js';
import { getCachedGoogleDriveToken } from './cache';
import { createClient } from './supabase/client';

export async function uploadToGoogleDrive(accessToken: string, file: File, folderName?: string) {
  folderName = folderName || 'TibeeMusic';
  try {
    const folderId = await getOrCreateFolder(accessToken, folderName);

    const metadata = {
      name: file.name,
      mimeType: file.type,
      parents: [folderId],
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', file);

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      }
    );

    // const fileData = await res.json();

    // Rendre le fichier public après l'upload
    // await makeFilePublic(accessToken, fileData.id);
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    return error;
  }
}

// export async function makeFilePublic(accessToken: string, fileId: string) {
//   const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
//     method: 'POST',
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       role: 'reader', // Rôle en lecture seule
//       type: 'anyone', // Permet à n'importe qui d'y accéder
//     }),
//   });

//   return res.json();
// }

//   export async function getFileShareableLink(accessToken: string, fileId: string) {
//     const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,webViewLink`, {
//       method: 'GET',
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//       },
//     });

//     const fileData = await res.json();
//     return fileData.webViewLink; // URL de partage accessible via un navigateur
//   }

export async function getFileDirectLink(accessToken: string, fileId: string) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,webContentLink`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const fileData = await res.json();
  if (fileData.error) {
    throw new Error(fileData.error.message);
  }

  return fileData.webContentLink; // Lien direct vers le fichier
}

export function getDriveStreamLink(fileId: string) {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

export async function listFoldersInFolder(accessToken: string): Promise<GoogleDriveFile[]> {
  const folderId = await getOrCreateFolder(accessToken, 'TibeeMusic');
  const query = encodeURIComponent(
    `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await res.json();
  console.log('Folders in folder:', data);
  if (data.error) {
    throw new Error(data.error.message);
  }

  console.log('Folders in folder:', data.files);

  return data.files; // Liste des dossiers avec leurs détails
}

export async function listFilesInFolder(
  accessToken: string,
  options: { folderId?: string; pageToken?: string; filterQuery?: string; tag?: string }
): Promise<GoogleDrivePage> {
  let { folderId, pageToken, filterQuery, tag } = options;
  console.log('listFilesInFolder', folderId, pageToken, filterQuery);
  folderId = folderId || (await getOrCreateFolder(accessToken, 'TibeeMusic'));
  let query = encodeURIComponent(
    `'${folderId}' in parents and mimeType contains 'audio/' and trashed = false`
  );
  if (filterQuery) {
    query += ` and name contains '${filterQuery}'`;
  }
  if (tag) {
    query += ` and appProperties has { key = 'tag_${tag}' and value='1' }`;
  }
  const url =
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink,mimeType,appProperties),nextPageToken&pageSize=48` +
    (pageToken ? `&pageToken=${pageToken}` : '');
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message);
  }
  console.log('Files in folder:', data);
  return data; // Liste des fichiers avec leurs détails
}

export async function updateTags(accessToken: string | null, fileId: string, tags: string[]) {
  if (!accessToken) {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    accessToken = await getCachedGoogleDriveToken(supabase, session.user.id);
  }
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      appProperties: Object.fromEntries(tags.map(tag => [`tag_${tag}`, '1'])),
    }),
  });
}

export async function clearAllTagsFromFile(
  accessToken: string | null,
  fileId: string
): Promise<void> {
  if (!accessToken) {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    accessToken = await getCachedGoogleDriveToken(supabase, session.user.id);
  }
  // 1. On récupère les appProperties existantes
  const getRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=appProperties`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const fileData = await getRes.json();
  const currentProps = fileData.appProperties ?? {};

  // 2. On prépare un objet avec toutes les props mises à null
  const nullifiedProps = Object.fromEntries(Object.keys(currentProps).map(key => [key, null]));

  // 3. PATCH pour supprimer chaque propriété
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      appProperties: nullifiedProps,
    }),
  });
}

export async function getOrCreateFolder(accessToken: string, folderName: string): Promise<string> {
  // Step 1 – Check if folder exists
  const query = encodeURIComponent(
    `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json();
  if (data.files?.length > 0) {
    return data.files[0].id; // ✅ folder found
  }

  // Step 2 – Create folder if not found
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  const folderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  const folderData = await folderRes.json();
  return folderData.id;
}

export async function refreshAccessToken(refreshToken: string) {
  const body = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  return res.json(); // contains new access_token + expires_in
}

export async function getGoogleDriveToken(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const tokenRes = await supabase
    .from('user_drive_tokens')
    .select('access_token, expires_at')
    .eq('user_id', userId)
    .single();

  if (tokenRes.error || !tokenRes.data) return null;

  let { access_token, expires_at } = tokenRes.data;

  if (new Date(expires_at).getTime() < new Date().getTime()) {
    const refreshedRes = await fetch('/api/oauth/google-drive/refresh', {
      method: 'POST',
    });
    const refreshed = await refreshedRes.json();
    access_token = refreshed.access_token;
  }

  return access_token;
}

export async function getDriveFileBlob(fileId: string, accessToken: string): Promise<Blob> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch file from Drive: ${res.statusText}`);
  }

  return await res.blob();
}

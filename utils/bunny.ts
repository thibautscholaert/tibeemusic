import { getDriveFileBlob } from './googleDrive';

export async function streamFromDriveToBunny(
  fileId: string,
  filename: string,
  accessToken: string
) {
  const exists = await exsistsInBunny(filename);
  if (!exists) {
    const blob = await getDriveFileBlob(fileId, accessToken);
    return uploadToBunny(filename, blob).then(res => {
      return { ...res, url: getBunnyFileUrl(filename) };
    });
  }
  return {
    success: true,
    message: 'File already exists in Bunny',
    status: 200,
    url: getBunnyFileUrl(filename),
  };
}

export async function exsistsInBunny(filename: string) {
  const bunnyApiKey = process.env.BUNNY_STORAGE_ZONE_PWD!;
  const uploadUrl = getBunnyStorageUrl(filename);

  // Étape 0 : Vérifier si le fichier existe déjà
  const headRes = await fetch(uploadUrl, {
    method: 'HEAD',
    headers: {
      AccessKey: bunnyApiKey,
    },
  });

  console.log('File exists:', filename, headRes);

  return headRes.ok;
}

export async function uploadToBunny(filename: string, file: Blob) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const bunnyApiKey = process.env.BUNNY_STORAGE_ZONE_PWD!;
  const uploadUrl = getBunnyStorageUrl(filename);

  console.log(bunnyApiKey);

  const bunnyRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      AccessKey: bunnyApiKey,
      'Content-Type': 'application/octet-stream',
    },
    body: buffer,
  });

  if (!bunnyRes.ok) {
    const errText = await bunnyRes.text();
    return { success: false, message: errText, status: bunnyRes.status };
  }

  return { success: true, message: 'Upload successfull', status: bunnyRes.status };
}

export function getBunnyStorageUrl(filename: string) {
  const bunnyStorageZone = process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE!;
  return `https://storage.bunnycdn.com/${bunnyStorageZone}/${cleanFilename(filename)}`;
}

export function getBunnyFileUrl(filename: string) {
  return `https://tibeemusic.b-cdn.net/${cleanFilename(filename)}`;
}

export function cleanFilename(filename: string): string {
  return filename;
  // const forbiddenChars = /[<>:"/\\|?*]/g;
  // return filename.replace(forbiddenChars, '_');
}

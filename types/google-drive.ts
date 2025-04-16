export interface GoogleDrivePage {
  files: GoogleDriveFile[];
  nextPageToken?: string;
}

export interface GoogleDriveFile {
  id: string
  mimeType: string
  name: string
  url: string
  appProperties: Record<string, string>
  webViewLink: string
}

export interface GoogleDriveFolder {
  id: string
  mimeType: string
  name: string
  url: string
  webViewLink: string
}

export interface GoogleDriveFileList {
  files: GoogleDriveFile[]
}
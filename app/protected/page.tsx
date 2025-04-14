'use client';

import FileList from '@/components/file-list';
import FileUpload from '@/components/file-upload';
import FolderList from '@/components/folder-list';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { usePlayer } from '@/contexts/player-context';
import { IFile } from '@/types/file';
import { IFolder } from '@/types/folder';
import { getCachedGoogleDriveToken } from '@/utils/cache';
import { createClient } from '@/utils/supabase/client';
import { getAudioUrl, listAudioFiles, listFolders } from '@/utils/useUploader';
import { LinkIcon, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function AudioPage() {
  const router = useRouter();
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
  const [folder, setFolder] = useState<IFolder | null>(null);
  const [folders, setFolders] = useState<IFolder[]>([]);
  const [files, setFiles] = useState<IFile[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string>();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  const [filterQuery, setFilterQuery] = useState('');
  const { addToQueue } = usePlayer();

  useEffect(() => {
    checkGoogleDriveConnected();
    fetchFiles();
    fetchFolders();
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [filterQuery, folder]);

  const checkGoogleDriveConnected = async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const token = await getCachedGoogleDriveToken(supabase, session.user.id);
    if (token) {
      setGoogleDriveConnected(true);
    }
  };

  const fetchMore = async () => {
    if (isFetchingMore) return;
    setIsLoadingFiles(true);
    setIsFetchingMore(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const data = await listAudioFiles(supabase, session.user.id, {
        folderId: folder?.id,
        pageToken: nextPageToken,
      });
      if (data) {
        console.log('files', data);
        const newFiles = data.files;
        if ('nextPageToken' in data && data.nextPageToken) {
          setNextPageToken(data.nextPageToken);
        }
        setFiles([...files, ...newFiles]);
        for (const file of newFiles) {
          if (file.id) {
            getAudioUrl(supabase, session.user.id, file.id, file.name, false).then(url => {
              if (url) {
                file.url = url;
                setFiles(prevFiles => {
                  const updatedFiles = [...prevFiles];
                  const index = updatedFiles.findIndex(f => f.id === file.id);
                  if (index !== -1) {
                    updatedFiles[index] = { ...updatedFiles[index], url };
                  }
                  return updatedFiles;
                });
                addToQueue(file);
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setIsFetchingMore(false);
      setIsLoadingFiles(false);
    }
  };

  const hasMore = useMemo(() => {
    return nextPageToken !== undefined && nextPageToken !== null && nextPageToken !== '';
  }, [nextPageToken]);

  const fetchFiles = async () => {
    console.log('fetching files', folder);
    setIsLoadingFiles(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const data = await listAudioFiles(supabase, session.user.id, {
        folderId: folder?.id,
        filterQuery,
      });
      if (data) {
        console.log('files', data);
        const files = data.files;
        if ('nextPageToken' in data && data.nextPageToken) {
          setNextPageToken(data.nextPageToken);
        }
        setFiles(files);
        for (const file of files) {
          if (file.id) {
            getAudioUrl(supabase, session.user.id, file.id, file.name, false).then(url => {
              if (url) {
                file.url = url;
                setFiles(prevFiles => {
                  const updatedFiles = [...prevFiles];
                  const index = updatedFiles.findIndex(f => f.id === file.id);
                  if (index !== -1) {
                    updatedFiles[index] = { ...updatedFiles[index], url };
                  }
                  return updatedFiles;
                });
                addToQueue(file);
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const onSearch = (query: string) => {
    setFilterQuery(query);
  };

  const streamizableFile = async (file: IFile) => {
    file.loading = true;
    setFiles(prevFiles => {
      const updatedFiles = [...prevFiles];
      const index = updatedFiles.findIndex(f => f.id === file.id);
      if (index !== -1) {
        updatedFiles[index] = { ...updatedFiles[index], loading: true };
      }
      return updatedFiles;
    });
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const url = await getAudioUrl(supabase, session.user.id, file.id, file.name);
    if (url) {
      file.url = url;
      file.loading = false;
      setFiles(prevFiles => {
        const updatedFiles = [...prevFiles];
        const index = updatedFiles.findIndex(f => f.id === file.id);
        if (index !== -1) {
          updatedFiles[index] = { ...updatedFiles[index], url, loading: false };
        }
        return updatedFiles;
      });
      addToQueue(file);
    }
  };

  const fetchFolders = async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const data = await listFolders(supabase, session.user.id);
      if (data) {
        console.log('folders', data);
        setFolders(data);
        setFolder(data[0]);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleUploadComplete = () => {
    fetchFiles();
    setIsUploadModalOpen(false);
  };

  return (
    <div className="mx-auto w-full py-4 sm:py-8">
      {/* <UploadToDrive /> */}
      <div className="mb-4 flex items-center justify-between gap-3 px-1 sm:mb-6">
        {/* <h1 className="sm:text-3xl text-xl font-bold">Audio Manager</h1> */}
        {googleDriveConnected ? (
          <div className="flex items-center gap-2">
            <img src="google_drive.png" alt="Google Drive" className="h-8 w-8" />
            {/* <span>connected</span>
          <CheckCircleIcon className="text-green-500 w-4 h-4" /> */}
          </div>
        ) : (
          <Button onClick={() => router.push('/connect-google-drive')}>
            <LinkIcon className="mr-2 h-4 w-4" />
            Connect Google Drive
          </Button>
        )}
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload New File
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <FileUpload onUploadComplete={handleUploadComplete} />
          </DialogContent>
        </Dialog>
      </div>

      <FolderList
        current={folder}
        folders={folders}
        onFolderChange={(folder: IFolder) => {
          setFolder(folder);
        }}
        isLoadingFiles={isLoadingFiles}
      />

      <FileList
        files={files}
        onSearch={onSearch}
        onFilesChange={fetchFiles}
        fetchMore={fetchMore}
        hasMore={hasMore}
        isFetchingMore={isFetchingMore}
        streamizableFile={streamizableFile}
        isLoadingFiles={isLoadingFiles}
      />
    </div>
  );
}

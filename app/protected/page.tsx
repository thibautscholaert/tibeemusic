'use client';

import FileList from '@/components/file-list';
import FileUpload from '@/components/file-upload';
import FolderList from '@/components/folder-list';
import PlayLists from '@/components/playlist-list';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { usePlayer } from '@/contexts/player-context';
import { IFile } from '@/types/file';
import { IFolder } from '@/types/folder';
import { clearCache, getCachedGoogleDriveToken } from '@/utils/cache';
import { createClient } from '@/utils/supabase/client';
import {
  currentPlaylistFolder,
  getAudioUrl,
  listAudioFiles,
  listFolders,
  streamify,
} from '@/utils/useUploader';
import classNames from 'classnames';
import { LinkIcon, UnlinkIcon, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function AudioPage() {
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
  const [folder, setFolder] = useState<IFolder | null>(null);
  const [folders, setFolders] = useState<IFolder[]>([]);
  const [files, setFiles] = useState<IFile[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string>();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [googleDriveConnectedHover, setGoogleDriveConnectedHover] = useState(false);
  const [unlinkDriveOpen, setUnlinkDriveOpen] = useState(false);

  const queueSelected = useMemo(() => {
    return folder?.id === currentPlaylistFolder.id;
  }, [folder]);
  const [filterQuery, setFilterQuery] = useState('');
  const { addToQueue, queue } = usePlayer();

  useEffect(() => {
    init();
  }, []);

  const init = () => {
    checkGoogleDriveConnected();
    fetchFolders();
  };

  useEffect(() => {
    console.log('folder changed', folder);
    if (folder) {
      fetchFiles();
    }
  }, [filterQuery, folder]);

  const checkGoogleDriveConnected = async () => {
    setGoogleDriveConnected(false);
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
    return (
      !queueSelected &&
      nextPageToken !== undefined &&
      nextPageToken !== null &&
      nextPageToken !== ''
    );
  }, [nextPageToken, queueSelected]);

  const fetchFiles = async () => {
    console.log('fetching files', folder);
    setIsLoadingFiles(true);
    if (folder?.id === currentPlaylistFolder.id) {
      if (filterQuery) {
        const filteredFiles = queue.filter(file =>
          file.name.toLowerCase().includes(filterQuery.toLowerCase())
        );
        setFiles(filteredFiles);
      } else {
        setFiles(queue);
      }
      setIsLoadingFiles(false);
      return;
    }

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

  const streamifyFile = async (file: IFile) => {
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
    const url = await streamify(supabase, session.user.id, file.id, file.name);
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
        setFolder(data[1] ? data[1] : data[0]);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleUploadComplete = () => {
    fetchFiles();
    setIsUploadModalOpen(false);
  };

  const handleUnlinkDrive = async () => {
    const supabase = createClient();

    const sessionRes = await supabase.auth.getUser();
    const user = sessionRes.data.user;

    if (user) {
      const { error } = await supabase.from('user_drive_tokens').delete().eq('user_id', user.id);

      if (error) {
        console.error('Error deleting user_drive_tokens:', error);
        toast.error('Failed to unlink Google Drive');
      } else {
        console.log('Tokens deleted successfully');
        toast.success('Google Drive unlinked successfully');
      }
    }
    clearCache('g-drive-token');
    init();
    setUnlinkDriveOpen(false);
  };

  const connectGoogleDrive = async () => {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: 'https://www.googleapis.com/auth/drive',
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  return (
    <div className="mx-auto w-full py-4 sm:py-8">
      <div className="mb-4 flex items-center justify-between gap-3 px-1 sm:mb-6">
        {googleDriveConnected ? (
          <Button
            className={classNames({
              'bg-lime-600 dark:bg-lime-100': !googleDriveConnectedHover,
              'bg-red-600 dark:bg-red-100': googleDriveConnectedHover,
            })}
            onMouseEnter={() => {
              setGoogleDriveConnectedHover(true);
            }}
            onMouseLeave={() => {
              setGoogleDriveConnectedHover(false);
            }}
            onClick={() => setUnlinkDriveOpen(true)}
          >
            <img src="google_drive.png" alt="Google Drive" className="h-6 w-6" />
            <span className="ml-2 w-16">{googleDriveConnectedHover ? 'Unlink' : 'Linked'}</span>
            {googleDriveConnectedHover ? (
              <UnlinkIcon className="ml-2 h-5 w-5 text-red-200 dark:text-red-600" />
            ) : (
              <LinkIcon className="ml-2 h-5 w-5 text-lime-200 dark:text-lime-600" />
            )}
          </Button>
        ) : (
          <Button onClick={connectGoogleDrive}>
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
            <DialogTitle></DialogTitle>
            <FileUpload onUploadComplete={handleUploadComplete} />
          </DialogContent>
        </Dialog>
      </div>

      <FolderList
        current={folder}
        folders={folders.filter(f => f.type === 'folder')}
        onFolderChange={(folder: IFolder) => {
          setFolder(folder);
        }}
        isLoadingFiles={isLoadingFiles}
        googleDriveConnected={googleDriveConnected}
      />

      <div className="my-2" />

      <PlayLists
        current={folder}
        playlists={folders.filter(f => f.type === 'playlist')}
        onFolderChange={(folder: IFolder) => {
          setFolder(folder);
        }}
        isLoadingFiles={isLoadingFiles}
      />

      <div className="my-2" />

      <FileList
        files={files}
        onSearch={onSearch}
        onFilesChange={fetchFiles}
        fetchMore={fetchMore}
        hasMore={hasMore}
        isFetchingMore={isFetchingMore}
        streamifyFile={streamifyFile}
        isLoadingFiles={isLoadingFiles}
      />

      {/* Unlink Google Confirmation Dialog */}
      <Dialog open={unlinkDriveOpen} onOpenChange={open => !open && setUnlinkDriveOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Unlink Google Drive</DialogTitle>
            <DialogDescription>Are you sure you want unlink Google Drive ?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnlinkDriveOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUnlinkDrive}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

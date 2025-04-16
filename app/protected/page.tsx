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
import { getFile } from '@/utils/googleDrive';
import { createClient } from '@/utils/supabase/client';
import {
  getAudioUrl,
  getDefaultFolder,
  listAudioFiles,
  listFolders,
  listSupaAudioFiles,
  streamablePlaylist,
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
  const [streamableFiles, setStreamableFiles] = useState<IFile[]>([]);

  const playlists = useMemo(() => {
    return folders.filter(f => f.type === 'playlist');
  }, [folders]);

  const queueSelected = useMemo(() => {
    return folder?.id === streamablePlaylist.id;
  }, [folder]);
  const [filterQuery, setFilterQuery] = useState('');
  const { addToQueue, play, isPlaying } = usePlayer();

  useEffect(() => {
    init();
  }, []);

  const init = () => {
    checkGoogleDriveConnected();
    fetchFolders();
    fetchStreamableFiles();
  };

  useEffect(() => {
    console.log('folder or filterQuery changed', folder, filterQuery);
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

  const fetchStreamableFiles = async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await listSupaAudioFiles(supabase, session.user.id);
    const files =
      data?.map(f => ({
        ...f,
        id: f.drive_id,
        url: f.url,
      })) || [];
    setStreamableFiles(files);
  };

  const fetchMore = async () => {
    if (!folder) return;
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
        folderId: folder.type === 'playlist' ? undefined : folder.id,
        filterQuery,
        tag: folder.type === 'playlist' ? folder.name : undefined,
        pageToken: nextPageToken,
      });
      setNextPageToken(undefined);
      if (data) {
        console.log('files', data);
        const newFiles = data.files;
        if ('nextPageToken' in data && data.nextPageToken) {
          setNextPageToken(data.nextPageToken);
        }
        setFiles([...files, ...newFiles]);
        for (const file of newFiles) {
          if (file.id) {
            getAudioUrl(supabase, session.user.id, file.id, file.name).then(url => {
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
      files.length > 0 &&
      !queueSelected &&
      nextPageToken !== undefined &&
      nextPageToken !== null &&
      nextPageToken !== ''
    );
  }, [nextPageToken, queueSelected]);

  const fetchFiles = async () => {
    if (!folder) return;
    console.log('fetching files', folder);
    setIsLoadingFiles(true);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      if (folder.id === streamablePlaylist.id) {
        if (filterQuery) {
          const filteredFiles = streamableFiles.filter(file =>
            file.name.toLowerCase().includes(filterQuery.toLowerCase())
          );
          setFiles(filteredFiles);
        } else {
          setFiles(streamableFiles);
        }

        setIsLoadingFiles(false);
        return;
      }

      const data = await listAudioFiles(supabase, session.user.id, {
        folderId: folder.type === 'playlist' ? undefined : folder.id,
        filterQuery,
        tag: folder.type === 'playlist' ? folder.name : undefined,
      });
      setNextPageToken(undefined);

      if (data) {
        console.log('files', data);
        const files = data.files;
        if ('nextPageToken' in data && data.nextPageToken) {
          setNextPageToken(data.nextPageToken);
        }
        setFiles(files);
        for (const file of files) {
          if (file.id) {
            getAudioUrl(supabase, session.user.id, file.id, file.name).then(url => {
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
          updatedFiles[index] = { ...updatedFiles[index], url };
        }
        return updatedFiles;
      });
      setStreamableFiles(prevFiles => {
        const updatedFiles = [...prevFiles];
        const index = updatedFiles.findIndex(f => f.id === file.id);
        if (index !== -1) {
          updatedFiles[index] = { ...updatedFiles[index], url, loading: false };
        }
        return updatedFiles;
      });
      addToQueue(file);
      clearCache(`streamable-${session.user.id}`);
    }
  };

  const fetchFolders = async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const [data, defaultFolder] = await Promise.all([
        listFolders(supabase, session.user.id),
        getDefaultFolder(supabase, session.user.id),
      ]);
      if (data) {
        console.log('folders', data);
        setFolders(data);
        setFolder(
          data.find(f => f.id === defaultFolder?.id) ?? data.filter(f => f.type === 'folder')[0]
        );
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

  const onFileChange = async (file: IFile) => {
    const updatedFile = await getFile(null, file.id);
    if (updatedFile) {
      setFiles(prevFiles => {
        const updatedFiles = [...prevFiles];
        const index = updatedFiles.findIndex(f => f.id === file.id);
        if (index !== -1) {
          updatedFiles[index] = { ...updatedFiles[index], ...updatedFile };
        }
        return updatedFiles;
      });
    }
  };

  const loadPlaylist = async () => {
    if (!folder) return;
    console.log('Loading playlist', folder);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const promises = [];

    let triggeredFirstPlay = false;

    for (const file of files) {
      if (file.id) {
        promises.push(
          streamify(supabase, session.user.id, file.id, file.name).then(url => {
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
              setStreamableFiles(prevFiles => {
                const updatedFiles = [...prevFiles];
                const index = updatedFiles.findIndex(f => f.id === file.id);
                if (index !== -1) {
                  updatedFiles[index] = { ...updatedFiles[index], url, loading: false };
                }
                return updatedFiles;
              });
              addToQueue(file);
              clearCache(`streamable-${session.user.id}`);
              if (!isPlaying && !triggeredFirstPlay) {
                triggeredFirstPlay = true;
                play(file);
              }
            }
          })
        );
      }
    }

    await Promise.all(promises);
    toast.success('Playlist loaded successfully');
    fetchStreamableFiles();
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
          setNextPageToken(undefined);
          setFolder(folder);
        }}
        isLoadingFiles={isLoadingFiles}
        googleDriveConnected={googleDriveConnected}
      />

      <div className="my-2" />

      <PlayLists
        current={folder}
        playlists={playlists}
        onFolderChange={(folder: IFolder) => {
          setNextPageToken(undefined);
          setFolder(folder);
        }}
        isLoadingFiles={isLoadingFiles}
      />

      <div className="my-2" />

      <FileList
        files={files}
        folder={folder}
        onSearch={onSearch}
        onFilesChange={fetchFiles}
        fetchMore={fetchMore}
        hasMore={hasMore}
        isFetchingMore={isFetchingMore}
        streamifyFile={streamifyFile}
        isLoadingFiles={isLoadingFiles}
        streamableFiles={streamableFiles}
        playlists={playlists.filter(f => f.id !== streamablePlaylist.id)}
        onFileChange={onFileChange}
        loadPlaylist={loadPlaylist}
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

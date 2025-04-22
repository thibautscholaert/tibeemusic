'use client';

import { usePlayer } from '@/contexts/player-context';
import { IFile, ITag } from '@/types/file';
import { updateTag } from '@/utils/googleDrive';
import { createClient } from '@/utils/supabase/client';
import { getDlUrl, streamablePlaylist } from '@/utils/useUploader';
import classNames from 'classnames';
import { debounce } from 'lodash';
import {
  AudioLinesIcon,
  CrossIcon,
  Download,
  EditIcon,
  EllipsisVertical,
  ListCheckIcon,
  ListVideoIcon,
  Loader2,
  Pause,
  Play,
  PlayCircleIcon,
  PlaySquareIcon,
  Trash2,
  XIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Input } from './ui/input';
import { IFolder } from '@/types/folder';

interface FileListProps {
  files: IFile[];
  folder: IFolder | null;
  onFilesChange: () => void;
  onSearch: (value: string) => void;
  streamifyFile: (file: IFile) => void;
  fetchMore: () => void;
  isFetchingMore: boolean;
  hasMore: boolean;
  isLoadingFiles: boolean;
  streamableFiles: IFile[];
  playlists: IFolder[];
  onFileChange: (file: IFile) => Promise<void>;
  loadPlaylist: () => Promise<void>;
  deletePlaylist: (playlist: IFolder) => Promise<void>;
  editPlaylist: (playlist: IFolder, name: string) => void;
  deleteFile: (file: IFile) => Promise<void>;
}

export default function FileList({
  files,
  folder,
  onSearch,
  streamifyFile,
  fetchMore,
  isFetchingMore,
  hasMore,
  isLoadingFiles,
  streamableFiles,
  playlists,
  onFileChange,
  loadPlaylist,
  deletePlaylist,
  editPlaylist,
  deleteFile,
}: FileListProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<IFile | null>(null);
  const [playlistToDelete, setPLaylistToDelete] = useState<IFolder | null>(null);
  const [fileToEdit, setFileToEdit] = useState<IFile | null>(null);
  const [query, setQuery] = useState('');
  const [isUpdatingTag, setIsUpdatingTag] = useState(false);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playlistToEdit, setPlaylistToEdit] = useState<IFolder | null>(null);
  const [playlistName, setPlaylistName] = useState('');

  const fullyLoaded = useMemo(
    () => files.every(file => Boolean(file.url) && streamableFiles.some(f => f.id === file.id)),
    [files, streamableFiles]
  );

  const observerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore) {
          fetchMore();
        }
      },
      {
        root: null, // viewport
        rootMargin: '100px', // commence à charger quand l'élément est à 100px du bas
        threshold: 0.5,
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, isFetchingMore, fetchMore, observerRef]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      onSearch(value);
    }, 300),
    []
  );

  const handleChange = (e: any) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const { currentFile, play, pause, isPlaying, currentPlaylist } = usePlayer();

  const handlePlay = async (file: IFile) => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return;
      }

      setIsLoading(true);

      // Play the file using the global player
      play(file);
      setIsLoading(false);
    } catch (error) {
      toast.error('Error playing audio');
      setIsLoading(false);
    }
  };

  const handleDownload = async (file: IFile) => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return;
      }

      const url = await getDlUrl(supabase, session.user.id, file.id);
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast.error('Error getting download URL');
      }
    } catch (error) {
      toast.error('Error downloading file');
    }
  };

  const edit = (file: IFile) => {
    setFileToEdit(file);
  };

  const handleEdit = async () => {
    if (!fileToEdit) return;

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return;
      }

      // TODO
    } catch (error) {
      toast.error('Error deleting file');
    } finally {
      setFileToEdit(null);
    }
  };

  const confirmDelete = (file: IFile) => {
    setFileToDelete(file);
  };

  const handleDeleteFile = async (file: IFile) => {
    if (!file) return;
    setIsLoadingPlaylist(true);
    await deleteFile(file);
    setFileToDelete(null);
    setIsLoadingPlaylist(false);
  };

  const handleUpdateTag = async (file: IFile, tag: ITag) => {
    setIsUpdatingTag(true);
    console.log('updateTag', file, tag);
    await updateTag(null, file.id, { key: tag.key, value: !tag.value });
    await onFileChange(file);
    setIsUpdatingTag(false);
  };

  const handleLoadPlaylist = async () => {
    if (currentPlaylist?.id === folder?.id) {
      toast.info('Playlist already loaded');
      return;
    }
    setIsLoadingPlaylist(true);
    await loadPlaylist();
    setIsLoadingPlaylist(false);
  };

  const handleDeletePlaylist = async (playlist: IFolder) => {
    setIsLoadingPlaylist(true);
    await deletePlaylist(playlist);
    setPLaylistToDelete(null);
    setIsLoadingPlaylist(false);
  };


  const handleEditPlaylist = (playlist: IFolder | null, inputName: string) => {
    if (!playlist) return;
    const name = inputName.trim();
    setError(null);
    if (name === '') {
      setError('Please enter a valid playlist name');
      return;
    }
    if (playlists.some(playlist => playlist.name === name)) {
      setError('Playlist already exists');
      return;
    }
    if (name.length > 20) {
      setError('Playlist name must be less than 20 characters');
      return;
    }
    if (name.length < 4) {
      setError('Playlist name must be at least 4 characters');
      return;
    }
    editPlaylist(playlist, name);
    setPlaylistToEdit(null);
    setPlaylistName('');
  };

  const isStreamablePlaylist = useMemo(() => {
    return streamablePlaylist.id === folder?.id;
  }, [folder]);

  return (
    <>
      <Card>
        <CardHeader>
          {/* <CardTitle>Your Audio Files</CardTitle> */}
          <CardDescription className="flex items-center justify-center">
            <div className="relative w-full max-w-lg">
              <Input
                type="text"
                value={query}
                onChange={handleChange}
                placeholder="Search..."
                className=""
              />
              {query.length > 0 && (
                <button
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 rounded-md"
                  onClick={() => {
                    setQuery('');
                    onSearch('');
                  }}
                >
                  <XIcon className="h-4 w-4 sm:h-6 sm:w-6" />
                </button>
              )}
            </div>

            {folder?.type === 'playlist' && (
              <div className="ml-1 flex items-center gap-0">
                <Button
                  variant={'ghost'}
                  className={classNames('ml-2 gap-2 px-2 sm:px-4', {
                    'text-primary': fullyLoaded,
                  })}
                  onClick={handleLoadPlaylist}
                  disabled={isLoadingPlaylist || isLoading || isLoadingFiles || files.length === 0}
                >
                  {isLoadingPlaylist ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PlayCircleIcon
                      className={classNames('h-6 w-6', {
                        'animate-powerfulPulse': currentPlaylist?.id === folder?.id && isPlaying,
                        'font-bold text-lime-400': fullyLoaded,
                      })}
                    />
                  )}
                  {/* <span>Stream</span> */}
                </Button>

                {!isStreamablePlaylist && <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant={'ghost'} className='px-1' disabled={isLoadingPlaylist || isLoading || isLoadingFiles}
                    >
                      <EllipsisVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-content min-w-24" align="start">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setPlaylistToEdit(folder); setPlaylistName(folder?.name || '') }}
                        disabled={true}>
                        <EditIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setPLaylistToDelete(folder!)}
                        className="px-2"
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                }

              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[60vh]">
          {/* {isLoadingFiles ? () :  */}

          {isLoadingFiles && !isFetchingMore ? (
            <div>
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin sm:h-8 sm:w-8" />
              </div>
              <p className="mt-2 text-center text-muted-foreground">Loading files...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                {files.map((file, index) => {
                  const isPlayingFile = currentFile?.id === file.id && isPlaying;
                  const isFileLoading = isLoading || file?.loading;
                  const streamable =
                    Boolean(file.url) && streamableFiles.some(f => f.id === file.id);
                  return (
                    <div
                      key={`${file.name}-${index}`}
                      className={classNames(
                        'flex w-[500px] max-w-full flex-col gap-1 rounded-lg border p-1 text-xs transition-colors sm:p-2 sm:text-sm'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 px-2">
                        {streamable ? (
                          <AudioLinesIcon
                            className={classNames('h-3 w-3 shrink-0 text-lime-400 sm:h-4 sm:w-4', {
                              'animate-pulse': isPlayingFile,
                            })}
                          />
                        ) : (
                          <AudioLinesIcon
                            className={classNames('h-3 w-3 shrink-0 text-accent sm:h-4 sm:w-4')}
                          />
                        )}
                        <div className="max-w-full flex-grow overflow-x-auto">
                          {playlists &&
                            playlists.map(playlist => {
                              const key = playlist.name;
                              const tag = file.tags?.find(t => t.key === key) || {
                                key,
                                value: false,
                              };
                              // console.log('playlist', playlist, file, key, tag);
                              return (
                                <Button
                                  onClick={() => handleUpdateTag(file, tag)}
                                  disabled={isUpdatingTag}
                                  variant="outline"
                                  size="xs"
                                  key={tag.key}
                                  className={tag.value ? 'text-lime-400' : 'text-muted-foreground'}
                                >
                                  {playlist.name}
                                </Button>
                              );
                            })}
                        </div>
                        <div className="flex items-center gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size={'xs'}>
                                <EllipsisVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-content min-w-24" align="start">
                              <div className="flex flex-col gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownload(file)}
                                >
                                  <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => edit(file)}
                                  disabled={true}>
                                  <EditIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => confirmDelete(file)}
                                  disabled={true}
                                >
                                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                </Button>
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          {streamable ? (
                            isPlayingFile ? (
                              <Button
                                variant="outlineSecondary"
                                size="xs"
                                // className='bg-lime-400'
                                onClick={() => (isPlaying ? pause() : play(file))}
                                disabled={isFileLoading}
                              >
                                {isFileLoading ? (
                                  <Loader2 className="h-3 w-3 animate-spin sm:h-4 sm:w-4" />
                                ) : isPlaying ? (
                                  <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
                                ) : (
                                  <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                                )}
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => handlePlay(file)}
                                disabled={isFileLoading || !file.url}
                              >
                                {isFileLoading ? (
                                  <Loader2 className="h-3 w-3 animate-spin sm:h-4 sm:w-4" />
                                ) : (
                                  <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                                )}
                              </Button>
                            )
                          ) : (
                            <Button
                              variant="outline"
                              size="xs"
                              disabled={isFileLoading}
                              onClick={() => streamifyFile(file)}
                            >
                              {isFileLoading ? <Loader2 className="h-3 w-3 animate-spin sm:h-4 sm:w-4" /> :
                                <AudioLinesIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                              }
                            </Button>

                          )}
                        </div>
                        <span className="line-clamp-1 flex-grow text-ellipsis">{file.name}</span>
                      </div>
                    </div>
                  );
                })}

                {files.length === 0 && (
                  <div className="py-8 text-center">
                    {folder?.type === 'playlist' ? (
                      <>
                        <p className="text-muted-foreground">Empty playlist</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Add files to the playlist to get started
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground">No files uploaded yet</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Upload audio files to get started
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {hasMore && (
                <div ref={observerRef} className="mt-4 flex h-8 w-full items-center justify-center">
                  {isFetchingMore && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!fileToDelete} onOpenChange={open => !open && setFileToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete file "{fileToDelete?.name}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFileToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleDeleteFile(fileToDelete!)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete playlist Confirmation Dialog */}
      <Dialog open={!!playlistToDelete} onOpenChange={open => !open && setPLaylistToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm playlist deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete playlist "{playlistToDelete?.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPLaylistToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleDeletePlaylist(playlistToDelete!)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit playlist name Dialog */}
      <Dialog open={!!playlistToEdit} onOpenChange={open => !open && setPlaylistToEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit playlist name</DialogTitle>
            <DialogDescription>
              <Input
                name="playlistName"
                placeholder="Playlist Name"
                required
                value={playlistName}
                onChange={e => setPlaylistName(e.target.value)}
              />

              {error && <span className="mt-2 text-sm text-red-500">{error}</span>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-between">
            <Button variant="outline" onClick={() => setPlaylistToEdit(null)}>
              Cancel
            </Button>
            <Button variant="default" onClick={() => handleEditPlaylist(playlistToEdit, playlistName)}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!fileToEdit} onOpenChange={open => !open && setFileToEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filename edition</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{fileToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFileToEdit(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleEdit}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

'use client';

import { usePlayer } from '@/contexts/player-context';
import { IFile } from '@/types/file';
import { createClient } from '@/utils/supabase/client';
import { getDlUrl } from '@/utils/useUploader';
import classNames from 'classnames';
import { debounce } from 'lodash';
import {
  AudioLinesIcon,
  Download,
  EditIcon,
  EllipsisVertical,
  Loader2,
  Pause,
  Play,
  Trash2
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
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

interface FileListProps {
  files: IFile[];
  onFilesChange: () => void;
  onSearch: (value: string) => void;
  streamizableFile: (file: IFile) => void;
  fetchMore: () => void;
  isFetchingMore: boolean;
  hasMore: boolean;
  isLoadingFiles: boolean;
}

export default function FileList({
  files,
  onSearch,
  streamizableFile,
  fetchMore,
  isFetchingMore,
  hasMore,
  isLoadingFiles,
}: FileListProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<IFile | null>(null);
  const [fileToEdit, setFileToEdit] = useState<IFile | null>(null);
  const [query, setQuery] = useState('');
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

  const { currentFile, play, pause, isPlaying } = usePlayer();

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

  const handleDelete = async () => {
    if (!fileToDelete) return;

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

      // const { error } = await supabase.storage
      //   .from('audio')
      //   .remove([`${session.user.id}/${fileToDelete}`]);

      // if (error) {
      //   toast.error('Error deleting file');
      // } else {
      //   toast.success('File deleted successfully');
      //   onFilesChange();
      // }
    } catch (error) {
      toast.error('Error deleting file');
    } finally {
      setFileToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          {/* <CardTitle>Your Audio Files</CardTitle> */}
          <CardDescription className="flex items-center justify-center">
            <Input
              type="text"
              value={query}
              onChange={handleChange}
              placeholder="Search..."
              className="w-full max-w-lg"
            />
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[60vh]">
          {/* {isLoadingFiles ? () :  */}

          {isLoadingFiles ? (
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
                  const streamable = Boolean(file.url);
                  // console.log('file', file, isLoading, file?.loading, isFileLoading);
                  return (
                    <div
                      key={`${file.name}-${index}`}
                      className={classNames(
                        'flex w-[500px] max-w-full flex-col rounded-lg border p-1 text-xs transition-colors sm:p-2 sm:text-sm',
                        {
                          // 'bg-lime-400/50 hover:bg-lime-600/80': isPlayingFile,
                          // 'animate-pulse': isPlayingFile,
                          // 'hover:bg-muted/50': !isPlayingFile,
                          // 'bg-green-200/30 dark:bg-green-600/30': streamable,
                        }
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {streamable ? (
                          <AudioLinesIcon className={classNames("h-3 w-3 sm:h-4 sm:w-4 text-lime-400 shrink-0", {
                            'animate-pulse': isPlayingFile,
                          })} />
                        ) : (
                          <AudioLinesIcon className={classNames("h-3 w-3 sm:h-4 sm:w-4 shrink-0 text-accent")} />
                        )}
                        <span className="line-clamp-1 text-ellipsis flex-grow">{file.name}</span>
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
                              onClick={() => streamizableFile(file)}
                            >
                              <AudioLinesIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size={'xs'}>
                                <EllipsisVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-content" align="start">
                              <div className="flex flex-col gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownload(file)}
                                >
                                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => edit(file)}>
                                  <EditIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => confirmDelete(file)}
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {files.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">No files uploaded yet</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Upload audio files to get started
                    </p>
                  </div>
                )}
              </div>
              {hasMore && (
                <div className="mt-4 flex items-center justify-center">
                  <Button onClick={fetchMore} disabled={isFetchingMore}>
                    {isFetchingMore ? (
                      <Loader2 className="h-3 w-3 animate-spin sm:h-4 sm:w-4" />
                    ) : (
                      <span>More</span>
                    )}
                  </Button>
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
              Are you sure you want to delete "{fileToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFileToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
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

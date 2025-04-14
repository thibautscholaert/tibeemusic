'use client';

import { usePlayer } from '@/contexts/player-context';
import { IFile } from '@/types/file';
import { createClient } from '@/utils/supabase/client';
import { getDlUrl } from '@/utils/useUploader';
import classNames from 'classnames';
import { debounce } from 'lodash';
import { AudioLinesIcon, Download, EditIcon, EllipsisVertical, ListPlusIcon, Loader2, Pause, Play, PlusSquareIcon, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './ui/dropdown-menu';

interface FileListProps {
  files: IFile[];
  onFilesChange: () => void;
  onSearch: (value: string) => void;
  streamizableFile: (file: IFile) => void;
  fetchMore: () => void;
  isFetchingMore: boolean;
  hasMore: boolean;
}

export default function FileList({ files, onSearch, streamizableFile, fetchMore, isFetchingMore, hasMore }: FileListProps) {
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
      const { data: { session } } = await supabase.auth.getSession();
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
      const { data: { session } } = await supabase.auth.getSession();
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
      const { data: { session } } = await supabase.auth.getSession();
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
  }

  const confirmDelete = (file: IFile) => {
    setFileToDelete(file);
  };


  const handleDelete = async () => {
    if (!fileToDelete) return;

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
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
          <CardTitle>Your Audio Files</CardTitle>
          <CardDescription>
            <div className="flex gap-2 sm:gap-4 items-center justify-center">
              <Button className='gap-2' size="lg" >
                <AudioLinesIcon className="sm:h-4 sm:w-4 h-3 w-3" />
                <span>Current playlist</span>
              </Button>
              <input
                type="text"
                value={query}
                onChange={handleChange}
                placeholder="Search..."
                className="border rounded px-3 py-2 w-full max-w-sm"
              />
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1 sm:gap-2 justify-center items-center">
            {files.map((file, index) => {
              const isPlayingFile = currentFile?.id === file.id && isPlaying;
              const isFileLoading = isLoading || file?.loading
              const streamable = Boolean(file.url);
              // console.log('file', file, isLoading, file?.loading, isFileLoading);
              return (
                <div
                  key={`${file.name}-${index}`}
                  className={classNames("flex flex-col sm:p-2 p-1 border rounded-lg sm:text-sm text-xs transition-colors w-[500px] max-w-full", {
                    // 'bg-lime-400/50 hover:bg-lime-600/80': isPlayingFile,
                    // 'animate-pulse': isPlayingFile,
                    // 'hover:bg-muted/50': !isPlayingFile,
                    'dark:bg-indigo-900/30 bg-indigo-200/30': streamable
                  })}
                >
                  <div className="flex items-center justify-between">
                    <span className="line-clamp-1 text-ellipsis">{file.name}</span>
                    <div className="flex items-center gap-1">
                      {streamable  ? isPlayingFile ? (<Button
                        variant="outlineSecondary"
                        size="xs"
                        // className='bg-lime-400'
                        onClick={() => isPlaying ? pause() : play(file)}
                        disabled={isFileLoading}
                      >
                        {isFileLoading ? (
                          <Loader2 className="sm:h-4 sm:w-4 h-3 w-3 animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="sm:h-4 sm:w-4 h-3 w-3" />
                        ) : (
                          <Play className="sm:h-4 sm:w-4 h-3 w-3" />
                        )}
                      </Button>) : <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handlePlay(file)}
                        disabled={isFileLoading || !file.url}
                      >
                        {isFileLoading ? (
                          <Loader2 className="sm:h-4 sm:w-4 h-3 w-3 animate-spin" />
                        ) : (
                          <Play className="sm:h-4 sm:w-4 h-3 w-3" />
                        )}
                      </Button> :   <Button
                          variant="outline"
                          size="xs"
                          disabled={isFileLoading}
                          onClick={() => streamizableFile(file)}
                        >
                          <ListPlusIcon className="sm:h-4 sm:w-4 h-3 w-3" />
                        </Button>
                      }

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size={"xs"}>
                            <EllipsisVertical className="sm:h-4 sm:w-4 h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-content" align="start">
                          <div className='flex flex-col gap-1'>
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(file)}
                            >
                              <Download className="sm:h-4 sm:w-4 h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => edit(file)}
                            >
                              <EditIcon className="sm:h-4 sm:w-4 h-3 w-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => confirmDelete(file)}
                            >
                              <Trash2 className="sm:h-4 sm:w-4 h-3 w-3" />
                            </Button>
                          </div>

                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              )
            })}

            {files.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No files uploaded yet</p>
                <p className="text-sm text-muted-foreground mt-2">Upload audio files to get started</p>
              </div>
            )}


          </div>
          {hasMore && <div className='flex justify-center items-center mt-4'>
          <Button onClick={fetchMore} disabled={isFetchingMore}>{
          isFetchingMore ? <Loader2 className="sm:h-4 sm:w-4 h-3 w-3 animate-spin" /> : <span>More</span>}</Button>
          </div>}

        </CardContent>
      </Card >

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
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

      <Dialog open={!!fileToEdit} onOpenChange={(open) => !open && setFileToEdit(null)}>
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
      </Dialog >
    </>
  );
} 
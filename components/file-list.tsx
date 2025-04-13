'use client';

import { usePlayer } from '@/contexts/player-context';
import { IFile } from '@/types/file';
import { createClient } from '@/utils/supabase/client';
import { getDlUrl } from '@/utils/useUploader';
import classNames from 'classnames';
import { AirplayIcon, Download, EllipsisVertical, Loader2, Pause, Play, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './ui/dropdown-menu';

interface FileListProps {
  files: IFile[];
  onFilesChange: () => void;
  streamizableFile: (file: IFile) => void;
}

export default function FileList({ files, onFilesChange, streamizableFile }: FileListProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<IFile | null>(null);
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

      const { error } = await supabase.storage
        .from('audio')
        .remove([`${session.user.id}/${fileToDelete}`]);

      if (error) {
        toast.error('Error deleting file');
      } else {
        toast.success('File deleted successfully');
        onFilesChange();
      }
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
          <CardDescription>Play, download, or delete your audio files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1 sm:gap-2 justify-center items-center">
            {files.map((file, index) => {
              const isPlayingFile = currentFile?.id === file.id && isPlaying;
              const isFileLoading = isLoading || file?.loading
              // console.log('file', file, isLoading, file?.loading, isFileLoading);
              return (
                <div
                  key={`${file.name}-${index}`}
                  className={classNames("flex flex-col sm:p-2 p-1 border rounded-lg sm:text-sm text-xs transition-colors w-[500px] max-w-full", {
                    // 'bg-lime-400/50 hover:bg-lime-600/80': isPlayingFile,
                    // 'animate-pulse': isPlayingFile,
                    // 'hover:bg-muted/50': !isPlayingFile,
                  })}
                >
                  <div className="flex items-center justify-between">
                    <span className="line-clamp-1 text-ellipsis">{file.name}</span>
                    <div className="flex items-center gap-1">
                      {isPlayingFile ? (<Button
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
                      </Button>
                      }

                      {Boolean(file.url) ?
                        <div className='bg-lime-500 border border-input bg-background shadow-sm h-6 rounded-md px-2 text-xs inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium'>
                          <AirplayIcon className="sm:h-4 sm:w-4 h-3 w-3" />
                        </div>
                        :
                        <Button
                          variant="outline"
                          size="xs"
                          disabled={isFileLoading}
                          onClick={() => streamizableFile(file)}
                        >
                          <AirplayIcon className="sm:h-4 sm:w-4 h-3 w-3" />
                        </Button>
                      }

                      {isFileLoading?.valueOf()}


                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size={"sm"}>
                            <EllipsisVertical className="sm:h-4 sm:w-4 h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-content" align="start">
                          <div className='flex flex-col gap-1'>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleDownload(file)}
                            >
                              <Download className="sm:h-4 sm:w-4 h-3 w-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="xs"
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
        </CardContent>
      </Card >

      {/* Delete Confirmation Dialog */}
      < Dialog open={!!fileToDelete
      } onOpenChange={(open) => !open && setFileToDelete(null)}>
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
      </Dialog >
    </>
  );
} 
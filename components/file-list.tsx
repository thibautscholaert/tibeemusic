'use client';

import { usePlayer } from '@/contexts/player-context';
import { createClient } from '@/utils/supabase/client';
import { getDlUrl } from '@/utils/useUploader';
import { Download, Loader2, Play, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

export interface IFile {
  id: string;
  name: string;
  url?: string; 
}
interface FileListProps {
  files: IFile[];
  onFilesChange: () => void;
}

export default function FileList({ files, onFilesChange }: FileListProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<IFile | null>(null);
  const { play, addToQueue } = usePlayer();

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
          <div className="space-y-4">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex flex-col sm:p-4 p-2 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="line-clamp-2 sm:font-medium text-sm sm:text-base">{file.name}</span>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePlay(file)}
                      disabled={isLoading || !file.url}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => confirmDelete(file)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {files.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No files uploaded yet</p>
                <p className="text-sm text-muted-foreground mt-2">Upload audio files to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
    </>
  );
} 
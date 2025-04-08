'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { listAudioFiles } from '@/utils/useUploader';
import FileUpload from '@/components/file-upload';
import FileList from '@/components/file-list';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Upload } from 'lucide-react';

export default function AudioPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const data = await listAudioFiles(supabase, session.user.id);
      if (data) {
        setFiles(data);
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
    <div className="w-full mx-auto sm:py-8 py-4">
      <div className="flex justify-between items-center mb-4 sm:mb-6 gap-3 px-1">
        <h1 className="text-3xl font-bold">Audio Manager</h1>
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
      
      <FileList files={files} onFilesChange={fetchFiles} />
    </div>
  );
} 
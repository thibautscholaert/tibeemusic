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
import { useEffect, useState } from 'react';

export default function AudioPage() {
  const router = useRouter();
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
  const [folder, setFolder] = useState<IFolder | null>(null);
  const [folders, setFolders] = useState<IFolder[]>([]);
  const [files, setFiles] = useState<IFile[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { addToQueue } = usePlayer();

  useEffect(() => {
    checkGoogleDriveConnected();
    fetchFiles();
    fetchFolders();
  }, []);

  const checkGoogleDriveConnected = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const token = await getCachedGoogleDriveToken(supabase, session.user.id);
    if (token) {
      setGoogleDriveConnected(true);
    }
  }

  const fetchFiles = async (folder?: IFolder) => {
    console.log('fetching files', folder);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const data = await listAudioFiles(supabase, session.user.id, folder?.id);
      if (data) {
        console.log('files', data);
        setFiles(data);
        for (const file of data) {
          if (file.id) {
            getAudioUrl(supabase, session.user.id, file.id, file.name, false).then((url) => {
              if (url) {
                file.url = url;
                setFiles((prevFiles) => {
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
    }
  };

  const streamizableFile = async (file: IFile) => {
    file.loading = true;
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles];
      const index = updatedFiles.findIndex(f => f.id === file.id);
      if (index !== -1) {
        updatedFiles[index] = { ...updatedFiles[index], loading: true };
      }
      return updatedFiles;
    });
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const url = await getAudioUrl(supabase, session.user.id, file.id, file.name)
    if (url) {
      file.url = url;
      file.loading = false;
      setFiles((prevFiles) => {
        const updatedFiles = [...prevFiles];
        const index = updatedFiles.findIndex(f => f.id === file.id);
        if (index !== -1) {
          updatedFiles[index] = { ...updatedFiles[index], url, loading: false };
        }
        return updatedFiles;
      });
      addToQueue(file);
    }
  }

  const fetchFolders = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
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
    <div className="w-full mx-auto sm:py-8 py-4">
      {/* <UploadToDrive /> */}
      <div className="flex justify-between items-center mb-4 sm:mb-6 gap-3 px-1">
        {/* <h1 className="sm:text-3xl text-xl font-bold">Audio Manager</h1> */}
        {googleDriveConnected ? <div className='flex items-center gap-2'>
          <img src="google_drive.png" alt="Google Drive" className="w-8 h-8" />
          {/* <span>connected</span>
          <CheckCircleIcon className="text-green-500 w-4 h-4" /> */}
        </div> : <Button onClick={() => router.push('/connect-google-drive')}>
          <LinkIcon className="mr-2 h-4 w-4" />
          Connect Google Drive
        </Button>}
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

      <FolderList current={folder} folders={folders} onFolderChange={(folder: IFolder) => {
        setFolder(folder);
        fetchFiles(folder);
      }} />
      <FileList files={files} onFilesChange={fetchFiles} streamizableFile={streamizableFile} />
    </div>
  );
} 
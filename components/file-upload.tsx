'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { ExternalLinkIcon, InfoIcon, Loader2, Upload } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { uploadAudio } from '@/utils/useUploader';
import { toast } from 'sonner';
import Link from 'next/link';
import { IFolder } from '@/types/folder';

interface FileUploadProps {
  onUploadComplete: () => void;
  rootDriveFolder: IFolder | null;
}

export default function FileUpload({ onUploadComplete, rootDriveFolder }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: string;
    type: string;
  } | null>(null);

  const folderId = rootDriveFolder?.id || '';

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an audio file
    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }

    setSelectedFile(file);

    // Format file size
    const sizeInMB = file.size / (1024 * 1024);
    const formattedSize =
      sizeInMB < 1 ? `${(file.size / 1024).toFixed(2)} KB` : `${sizeInMB.toFixed(2)} MB`;

    setFileInfo({
      name: file.name,
      size: formattedSize,
      type: file.type,
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return;
      }

      const error = await uploadAudio(supabase, selectedFile, session.user.id);
      console.log(error);
      if (error) {
        toast.error('Error uploading file');
      } else {
        toast.success('File uploaded successfully');
        console.log('File uploaded successfully');
        onUploadComplete();
        resetState();
      }
    } catch (error) {
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    resetState();
  };

  const resetState = () => {
    setSelectedFile(null);
    setFileInfo(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Audio File</CardTitle>
        <CardDescription className="flex flex-wrap">
          <span>
            You can select a file and upload it. This component is basic and allows only 1 file
            import.
          </span>
          <span className="font-semibold">
            <InfoIcon className="mr-2 inline h-4 w-4" />I strongly recommend you to go directly to
            google drive to upload/manage your files.
          </span>
          <Button asChild variant={'default'}>
            <Link
              className="mx-auto mt-2 h-full gap-4"
              href={`https://drive.google.com/drive/u/0/folders/${folderId}`}
              target="_blank"
            >
              <img src="google_drive.png" alt="Google Drive" className="h-10 w-10" />
              <span className="text-base">Google Drive</span>
              <div className="inset-0 right-0 top-0">
                <ExternalLinkIcon className="h-6 w-6" />
              </div>
            </Link>
          </Button>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6">
            <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
            <Input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Supported formats: MP3, WAV, OGG, etc.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-medium">File Information</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Name:</span> {fileInfo?.name}
                </p>
                <p>
                  <span className="font-medium">Size:</span> {fileInfo?.size}
                </p>
                <p>
                  <span className="font-medium">Type:</span> {fileInfo?.type}
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancel} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

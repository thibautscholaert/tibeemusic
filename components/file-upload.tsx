'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Loader2, Upload } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { uploadAudio } from '@/utils/useUploader';
import { toast } from 'sonner';

interface FileUploadProps {
  onUploadComplete: () => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: string;
    type: string;
  } | null>(null);

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
    const formattedSize = sizeInMB < 1 
      ? `${(file.size / 1024).toFixed(2)} KB` 
      : `${sizeInMB.toFixed(2)} MB`;
    
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return;
      }

      const error = await uploadAudio(supabase, selectedFile, session.user.id);
      if (error) {
        toast.error('Error uploading file');
      } else {
        toast.success('File uploaded successfully');
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
        <CardDescription>Select an audio file to upload</CardDescription>
      </CardHeader>
      <CardContent>
        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            <Input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Supported formats: MP3, WAV, OGG, etc.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">File Information</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Name:</span> {fileInfo?.name}</p>
                <p><span className="font-medium">Size:</span> {fileInfo?.size}</p>
                <p><span className="font-medium">Type:</span> {fileInfo?.type}</p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpload}
                disabled={uploading}
              >
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
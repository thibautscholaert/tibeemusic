'use client';

import { IFolder } from '@/types/folder';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface FolderListProps {
  current: IFolder | null;
  folders: IFolder[];
  onFolderChange: (folder: IFolder) => void;
}

export default function FolderList({ folders, onFolderChange, current }: FolderListProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your folders</CardTitle>
          {/* <CardDescription>Play, download, or delete your audio files</CardDescription> */}
        </CardHeader>
        <CardContent>
          <div className="grid grid-flow-col auto-cols-max gap-1 sm:gap-2 overflow-x-auto p-2">
            {folders.map((folder, index) => {
              return <Button
                key={`${folder.id}-${index}`}
                onClick={() => onFolderChange(folder)}
                variant={current?.id === folder.id ? 'default' : 'outline'}
              >
                {folder.name}
              </Button>
            })}
          </div>
        </CardContent>
      </Card >
    </>
  );
} 
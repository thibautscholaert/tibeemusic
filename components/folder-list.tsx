'use client';

import { IFolder } from '@/types/folder';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface FolderListProps {
  current: IFolder | null;
  folders: IFolder[];
  onFolderChange: (folder: IFolder) => void;
  isLoadingFiles: boolean;
}

export default function FolderList({
  folders,
  onFolderChange,
  current,
  isLoadingFiles,
}: FolderListProps) {
  return (
    <>
      <Card>
        {/* <CardHeader>
          <CardTitle>Your folders</CardTitle>
        </CardHeader> */}
        <CardContent>
          <div className="grid auto-cols-max grid-flow-col gap-1 overflow-x-auto px-2 sm:gap-2">
            {folders.map((folder, index) => {
              return (
                <Button
                  key={`${folder.id}-${index}`}
                  onClick={() => onFolderChange(folder)}
                  variant={current?.id === folder.id ? 'default' : 'outline'}
                  disabled={isLoadingFiles}
                >
                  {folder.name}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

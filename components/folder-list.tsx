'use client';

import { IFolder } from '@/types/folder';
import classNames from 'classnames';
import {
  AudioLinesIcon,
  FolderDotIcon,
  FolderIcon,
  FolderOpenDotIcon,
  FolderOpenIcon,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

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
        <CardContent>
          <div className="grid auto-cols-max grid-flow-col gap-1 overflow-x-auto px-2 py-2 sm:gap-2">
            <div className="mr-2 flex items-center">
              <img src="google_drive.png" alt="Google Drive" className="h-9 w-9" />
            </div>
            {folders.map((folder, index) => {
              const isActive = current?.id === folder.id;
              return (
                <Button
                  key={`${folder.id}-${index}`}
                  onClick={() => onFolderChange(folder)}
                  variant={isActive ? 'default' : 'outline'}
                  disabled={isLoadingFiles}
                >
                  {folder.name === 'TibeeMusic' ? (
                    isActive ? (
                      <FolderOpenDotIcon className={classNames('mr-2 h-3 w-3 sm:h-5 sm:w-5')} />
                    ) : (
                      <FolderDotIcon className={classNames('mr-2 h-3 w-3 sm:h-5 sm:w-5')} />
                    )
                  ) : isActive ? (
                    <FolderOpenIcon className={classNames('mr-2 h-3 w-3 sm:h-4 sm:w-4')} />
                  ) : (
                    <FolderIcon className={classNames('mr-2 h-3 w-3 sm:h-4 sm:w-4')} />
                  )}
                  <span
                    className={classNames(
                      'max-w-32 overflow-hidden text-ellipsis',
                      folder.name === 'TibeeMusic' ? 'text-base' : ''
                    )}
                  >
                    {folder.name}
                  </span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

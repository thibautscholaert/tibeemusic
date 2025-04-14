'use client';

import { IFolder } from '@/types/folder';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AudioLinesIcon, FolderIcon } from 'lucide-react';
import classNames from 'classnames';

interface FolderListProps {
  current: IFolder | null;
  folders: IFolder[];
  onFolderChange: (folder: IFolder) => void;
  isLoadingFiles: boolean;
  // selectCurrentPlaylist: () => void;
  // queueSelected: boolean;
}

export default function FolderList({
  folders,
  onFolderChange,
  current,
  isLoadingFiles,
  // selectCurrentPlaylist,
  // queueSelected,
}: FolderListProps) {
  return (
    <>
      <Card>
        {/* <CardHeader>
          <CardTitle>Your folders</CardTitle>
        </CardHeader> */}
        <CardContent>
          <div className="grid auto-cols-max grid-flow-col gap-1 overflow-x-auto px-2 sm:gap-2 py-2">
            {/* <Button
              className="gap-1 px-2 sm:gap-2 sm:px-4"
              onClick={selectCurrentPlaylist}
              variant={queueSelected ? 'default' : 'outline'}>
              <AudioLinesIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Current playlist</span>
            </Button> */}
            {folders.map((folder, index) => {
              return (
                <Button
                  key={`${folder.id}-${index}`}
                  onClick={() => onFolderChange(folder)}
                  variant={current?.id === folder.id ? 'default' : 'outline'}
                  disabled={isLoadingFiles}
                >
                  {folder.id === 'STREAMABLE' ? (
                    <AudioLinesIcon className={classNames("h-3 w-3 sm:h-4 sm:w-4 mr-2 shrink-0",
                      `${current?.id === folder.id ? 'text-lime-600' : 'text-lime-400'}`)} />
                  ) : folder.name === 'TibeeMusic' ?
                    <FolderIcon className={classNames("h-3 w-3 sm:h-4 sm:w-4 mr-2 ")} />
                    :
                    <FolderIcon className={classNames("h-3 w-3 sm:h-4 sm:w-4 mr-2 ")} />
                  }
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

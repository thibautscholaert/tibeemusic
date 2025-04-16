'use client';

import { IFolder } from '@/types/folder';
import classNames from 'classnames';
import { AudioLinesIcon, ListPlusIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface FolderListProps {
  current: IFolder | null;
  playlists: IFolder[];
  onFolderChange: (folder: IFolder) => void;
  isLoadingFiles: boolean;
}

export default function PlayLists({
  playlists,
  onFolderChange,
  current,
  isLoadingFiles,
}: FolderListProps) {
  return (
    <>
      <Card>
        {/* <CardHeader>
          <CardTitle>Playlists</CardTitle>
          <CardDescription className="flex items-center justify-center"></CardDescription>
        </CardHeader> */}
        <CardContent>
          <div className="grid auto-cols-max grid-flow-col gap-1 overflow-x-auto px-2 py-2 sm:gap-2">
            <div className="mr-2 flex items-center">
              <img src="playlist.png" alt="playlist" className="h-9 w-9" />
            </div>
            <Button>
              <ListPlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            {playlists.map((folder, index) => {
              const isActive = current?.id === folder.id;
              return (
                <Button
                  key={`${folder.id}-${index}`}
                  onClick={() => onFolderChange(folder)}
                  variant={isActive ? 'default' : 'outline'}
                  disabled={isLoadingFiles}
                >
                  <AudioLinesIcon
                    className={classNames(
                      'mr-2 h-3 w-3 shrink-0 sm:h-4 sm:w-4',
                      `${isActive ? 'text-lime-600' : 'text-lime-400'}`
                    )}
                  />
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

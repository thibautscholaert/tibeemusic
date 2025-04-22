'use client';

import { IFolder } from '@/types/folder';
import { streamablePlaylist } from '@/utils/useUploader';
import { ListPlusIcon, PlayCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';

interface FolderListProps {
  current: IFolder | null;
  playlists: IFolder[];
  onFolderChange: (folder: IFolder) => void;
  isLoadingFiles: boolean;
  addPlaylist: (name: string) => void;
}

export default function PlayLists({
  playlists,
  onFolderChange,
  current,
  isLoadingFiles,
  addPlaylist,
}: FolderListProps) {
  const [addPlaylistOpen, setAddPlaylistOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddPlaylist = (inputName: string) => {
    const name = inputName.trim();
    setError(null);
    if (name === '') {
      setError('Please enter a valid playlist name');
      return;
    }
    if (playlists.some(playlist => playlist.name === name)) {
      setError('Playlist already exists');
      return;
    }
    if (name.length > 20) {
      setError('Playlist name must be less than 20 characters');
      return;
    }
    if (name.length < 4) {
      setError('Playlist name must be at least 4 characters');
      return;
    }
    addPlaylist(name);
    setAddPlaylistOpen(false);
    setPlaylistName('');
  };

  return (
    <>
      <Card>
        {/* <CardHeader>
          <CardTitle>Playlists</CardTitle>
          <CardDescription className="flex items-center justify-center"></CardDescription>
        </CardHeader> */}
        <CardContent>
          <div className="flex items-center justify-between gap-2 px-2 py-1 sm:gap-4">
            <div className="mr-1 flex items-center py-1">
              <img src="playlist.png" alt="playlist" className="h-9 w-9" />
            </div>

            <div className="grid auto-cols-max grid-flow-col gap-1 overflow-x-auto py-1 sm:gap-2">
              {playlists.map((folder, index) => {
                const isActive = current?.id === folder.id;
                const isSteamableFolder = streamablePlaylist.id === folder?.id;
                return (
                  <Button
                    key={`${folder.id}-${index}`}
                    onClick={() => onFolderChange(folder)}
                    variant={isSteamableFolder ? (isActive ? 'secondary' : 'outline') : (isActive ? 'default' : 'outline')}
                    disabled={isLoadingFiles}
                    className="px-2 sm:px-4"
                  >
                    {/* <AudioLinesIcon
                      className={classNames(
                        'mr-2 h-3 w-3 shrink-0 sm:h-4 sm:w-4',
                        `${isActive ? 'text-lime-600' : 'text-lime-400'}`
                      )}
                    /> */}
                    {isSteamableFolder ? <PlayCircleIcon className="h-6 w-6 text-lime-400" /> : folder.name}
                  </Button>
                );
              })}
            </div>
            <Button
              className="px-2"
              variant={'accent'}
              disabled={isLoadingFiles}
              onClick={() => setAddPlaylistOpen(true)}
            >
              <ListPlusIcon className="h-6 w-6 sm:h-7 sm:w-7" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addPlaylistOpen} onOpenChange={open => !open && setAddPlaylistOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new playlist</DialogTitle>
            <DialogDescription>
              <Input
                name="playlistName"
                placeholder="Playlist Name"
                required
                value={playlistName}
                onChange={e => setPlaylistName(e.target.value)}
              />

              {error && <span className="mt-2 text-sm text-red-500">{error}</span>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-between">
            <Button variant="outline" onClick={() => setAddPlaylistOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={() => handleAddPlaylist(playlistName)}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

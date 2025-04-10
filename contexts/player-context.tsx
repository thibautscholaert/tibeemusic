'use client';

import { IFile } from '@/components/file-list';
import { createContext, ReactNode, useContext, useState } from 'react';

interface PlayerContextType {
  currentFile: IFile | null;
  queue: IFile[];
  play: (file: IFile) => void;
  pause: () => void;
  hasNext: () => boolean;
  hasPrevious: () => boolean;
  next: () => void;
  previous: () => void;
  addToQueue: (file: IFile) => void;
  clearQueue: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentFile, setCurrentFile] = useState<IFile | null>(null);
  const [queue, setQueue] = useState<IFile[]>([]);

  const play = (file: IFile | null) => {
    setCurrentFile(file);
  };

  const pause = () => {
    // This is handled by the GlobalPlayer component
  };

  const next = () => {
    if (queue.length > 0) {
      const nextFile = queue[0];
      setQueue((prevQueue) => prevQueue.slice(1));
      setCurrentFile(nextFile);
    }
    //  else {
    //   setCurrentFile(null);
    // }
  };


  const hasNext = () => {
    return queue.length > 0;
  };

  const hasPrevious = () => {
    return  false; // This would require keeping track of history, which we're not implementing for simplicity
  };

  const previous = () => {
    // This would require keeping track of history, which we're not implementing for simplicity
  };

  const addToQueue = (file: IFile) => {
    setQueue((prevQueue) => [...prevQueue, file]);
  };

  const clearQueue = () => {
    setQueue([]);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentFile,
        queue,
        play,
        pause,
        hasNext,
        hasPrevious,
        next,
        previous,
        addToQueue,
        clearQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
} 
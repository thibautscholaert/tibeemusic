'use client';

import { IFile } from '@/components/file-list';
import { createContext, ReactNode, useContext, useState } from 'react';

interface PlayerContextType {
  currentFile: IFile | null;
  isPlaying: boolean;
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
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [isPlaying, setPlaying] = useState<boolean>(false);

  const play = (file: IFile | null) => {
    setCurrentFile(file);
    setQueueIndex(queue.findIndex((f) => f.id === file?.id));
    setPlaying(true);
  };

  const pause = () => {
    setPlaying(false);
    // This is handled by the GlobalPlayer component
  };

  const next = () => {
    if (queue.length > 0) {
      const nextFile = queue[queueIndex + 1];
      setQueueIndex((prev) => prev + 1);
      setCurrentFile(nextFile);
    }
    //  else {
    //   setCurrentFile(null);
    // }
  };


  const hasNext = () => {
    return queue.length > queueIndex + 1;
  };

  const hasPrevious = () => {
    return queue.length > 0 && queueIndex > 0;
  };

  const previous = () => {
    const nextFile = queue[queueIndex - 1];
    setQueueIndex((prev) => prev - 1);
    setCurrentFile(nextFile);
  };

  const addToQueue = (file: IFile) => {
    console.log('Adding to queue:', file);
    // if (queue.length === 0) {
    //   setCurrentFile(file);
    //   setQueueIndex(0);
    // }
    setQueue((prevQueue) => [...prevQueue, file]);
  };

  const clearQueue = () => {
    console.log('clearQueue');
    setQueue([]);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentFile,
        isPlaying,
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
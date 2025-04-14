'use client';

import { IFile } from '@/types/file';
import { createContext, ReactNode, useContext, useState } from 'react';

interface PlayerContextType {
  currentFile: IFile | null;
  isPlaying: boolean;
  queue: IFile[];
  queueIndex: number;
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
      if(queue.length > queueIndex + 1) {
        const nextFile = queue[queueIndex + 1];
        setQueueIndex((prev) => prev + 1);
        setCurrentFile(nextFile);
      } else {
        const nextFile = queue[0];
        setQueueIndex(0);
        setCurrentFile(nextFile);
      }
    }
    //  else {
    //   setCurrentFile(null);
    // }
  };


  const hasNext = () => {
    return true;
  };

  const hasPrevious = () => {
    return true;
  };

  const previous = () => {
    if(queue.length > 0 && queueIndex > 0){
      const nextFile = queue[queueIndex - 1];
      setQueueIndex((prev) => prev - 1);
      setCurrentFile(nextFile);
    } else {
      const nextFile = queue[queue.length - 1];
      setQueueIndex(queue.length - 1);
      setCurrentFile(nextFile);
    }
  
  };

  const addToQueue = (file: IFile) => {
    console.log('Adding to queue:', file.id, file.name);
    // Check if the file is already in the queue
    const isFileInQueue = queue.some((f) => f.id === file.id);
    if (isFileInQueue) {
      console.log('File is already in the queue:', file);
      return;
    }
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
        queueIndex,
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
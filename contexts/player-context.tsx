'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PlayerContextType {
  currentFile: string | null;
  queue: string[];
  play: (filename: string) => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  addToQueue: (filename: string) => void;
  clearQueue: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [queue, setQueue] = useState<string[]>([]);

  const play = (filename: string) => {
    setCurrentFile(filename);
  };

  const pause = () => {
    // This is handled by the GlobalPlayer component
  };

  const next = () => {
    if (queue.length > 0) {
      const nextFile = queue[0];
      setQueue((prevQueue) => prevQueue.slice(1));
      setCurrentFile(nextFile);
    } else {
      setCurrentFile(null);
    }
  };

  const previous = () => {
    // This would require keeping track of history, which we're not implementing for simplicity
  };

  const addToQueue = (filename: string) => {
    setQueue((prevQueue) => [...prevQueue, filename]);
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
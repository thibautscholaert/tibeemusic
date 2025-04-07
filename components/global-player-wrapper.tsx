'use client';

import { usePlayer } from '@/contexts/player-context';
import GlobalPlayer from '@/components/global-player';

export default function GlobalPlayerWrapper() {
  const { currentFile, play, pause, next, previous } = usePlayer();
  
  return (
    <GlobalPlayer 
      currentFile={currentFile}
      onPlay={play}
      onPause={pause}
      onNext={next}
      onPrevious={previous}
    />
  );
} 
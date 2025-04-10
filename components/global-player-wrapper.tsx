'use client';

import { usePlayer } from '@/contexts/player-context';
import GlobalPlayer from '@/components/global-player';

export default function GlobalPlayerWrapper() {
  const { currentFile, play, pause, next, previous, hasNext, hasPrevious } = usePlayer();
  
  return (
    <GlobalPlayer 
      currentFile={currentFile}
      onPlay={play}
      onPause={pause}
      hasNext={hasNext}
      hasPrevious={hasPrevious}
      onNext={next}
      onPrevious={previous}
    />
  );
} 
'use client';

import { usePlayer } from '@/contexts/player-context';
import GlobalPlayer from '@/components/global-player';

export default function GlobalPlayerWrapper() {
  const {
    currentFile,
    isPlaying,
    play,
    pause,
    next,
    previous,
    hasNext,
    hasPrevious,
    queue,
    queueIndex,
    currentPlaylist,
  } = usePlayer();

  return (
    <GlobalPlayer
      currentFile={currentFile}
      currentPlaylist={currentPlaylist}
      isPlaying={isPlaying}
      queue={queue}
      queueIndex={queueIndex}
      onPlay={play}
      onPause={pause}
      hasNext={hasNext}
      hasPrevious={hasPrevious}
      onNext={next}
      onPrevious={previous}
    />
  );
}

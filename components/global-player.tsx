'use client';

import { IFile } from '@/types/file';
import { formatTime } from '@/utils/formatTime';
import {
  ChevronsDownIcon,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpIcon,
  Loader2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

interface GlobalPlayerProps {
  currentFile: IFile | null;
  queue: IFile[];
  queueIndex: number;
  isPlaying: boolean;
  onPlay: (file: IFile) => void;
  onPause: () => void;
  hasNext: () => boolean;
  hasPrevious: () => boolean;
  onNext: () => void;
  onPrevious: () => void;
}

export default function GlobalPlayer({
  currentFile,
  isPlaying: isPlayingExt,
  queue,
  queueIndex,
  onPlay,
  onPause,
  hasNext,
  hasPrevious,
  onNext,
  onPrevious,
}: GlobalPlayerProps) {
  const [hidden, setHidden] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.2);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentFile?.url) {
      loadAudio();
    }
  }, [currentFile]);

  useEffect(() => {
    setIsPlaying(!isPlayingExt);
    togglePlayPause(!isPlayingExt);
  }, [isPlayingExt]);

  const loadAudio = async () => {
    try {
      // Stop current audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      setIsLoading(true);

      // Get URL for the new audio file
      const url = currentFile?.url;
      if (!url) {
        toast.error('Error getting audio URL');
        setIsLoading(false);
        return;
      }

      // Create new audio element
      console.log(url);
      const newAudio = new Audio(url);
      newAudio.id = 'global-player-audio'; // Ajouter un ID pour faciliter la sélection

      // Set up event listeners
      newAudio.addEventListener('loadedmetadata', () => {
        setDuration(newAudio.duration);
        setIsLoading(false);
      });

      newAudio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        onNext(); // Auto-play next track
      });

      newAudio.addEventListener('timeupdate', () => {
        setCurrentTime(newAudio.currentTime);
      });

      // Set volume
      newAudio.volume = volume;
      newAudio.muted = isMuted;

      audioRef.current = newAudio;
      setIsPlaying(true);
      newAudio.play();
      startProgressTracking();
    } catch (error) {
      toast.error('Error playing audio');
      setIsLoading(false);
    }
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    }, 100);
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.volume = value[0];
      setVolume(value[0]);
      setIsMuted(value[0] === 0);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
    }
  };

  const togglePlayPause = (isPlaying: boolean) => {
    if (!currentFile) return;

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }
      onPause();
    } else {
      if (audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
        startProgressTracking();
      }
      onPlay(currentFile);
    }
  };

  if (!currentFile) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center justify-center border-t bg-background px-1 pb-1 transition-transform duration-300 sm:px-6 sm:pb-4 ${hidden ? 'translate-y-[calc(100%-2rem)] sm:translate-y-[calc(100%-2.5rem)]' : 'translate-y-0'}`}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center space-y-4">
        <div className="flex w-full flex-col space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 sm:space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrevious}
                disabled={!hasPrevious()}
                className="h-8 w-8"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => togglePlayPause(isPlaying)}
                className="h-6 w-6 sm:h-10 sm:w-10"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5 animate-pulse" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                disabled={!hasNext()}
                className="h-8 w-8"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button variant="ghost" size="icon" onClick={skipBackward} className="h-8 w-8">
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8">
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Slider
                value={[volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
              <Button variant="ghost" size="icon" onClick={skipForward} className="h-8 w-8">
                <ChevronsRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setHidden(!hidden)}
                size="xs"
                variant="outline"
                // className="absolute top-0.5 right-0.5"
              >
                {hidden ? (
                  <ChevronsUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronsDownIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">{formatTime(currentTime)}</span>
            <Slider
              value={[currentTime]}
              min={0}
              max={duration}
              step={0.1}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
          </div>
          <div className="flex w-full items-center gap-2">
            <span className="text-xs">
              {queueIndex + 1}/{queue.length}
            </span>
            {' - '}
            <span className="truncate text-sm font-medium">{currentFile.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

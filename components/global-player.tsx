'use client';

import { formatTime } from '@/utils/formatTime';
import { createClient } from '@/utils/supabase/client';
import { getAudioUrl } from '@/utils/useUploader';
import { ChevronsLeft, FastForward, Loader2, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { IFile } from './file-list';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

interface GlobalPlayerProps {
  currentFile: IFile | null;
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
  onPlay,
  onPause,
  hasNext,
  hasPrevious,
  onNext,
  onPrevious
}: GlobalPlayerProps) {
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
      const url = currentFile?.url
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
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
      <div className="container mx-auto">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
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
                className="h-10 w-10"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5" />
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
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={skipBackward}
                className="h-8 w-8"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-8 w-8"
              >
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
              <Button
                variant="ghost"
                size="icon"
                onClick={skipForward}
                className="h-8 w-8"
              >
                <FastForward className="h-4 w-4" />
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
          <div className="text-sm font-medium truncate">
            {currentFile.name}
          </div>
        </div>
      </div>
    </div>
  );
} 
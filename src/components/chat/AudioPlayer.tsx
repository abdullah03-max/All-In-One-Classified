import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface AudioPlayerProps {
  src: string;
  isMine: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, isMine }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audio.duration !== Infinity && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    if (audio.readyState >= 1) {
      handleLoadedMetadata();
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    // Safari/Chrome duration bug workaround for recorders
    audio.addEventListener('loadeddata', () => {
      if (audio.duration === Infinity) {
        audio.currentTime = 1e101;
        audio.ontimeupdate = () => {
          audio.ontimeupdate = null;
          setDuration(audio.duration);
          audio.currentTime = 0;
        };
      }
    });

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audioRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => {
        console.error('Playback error:', err);
      });
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const seekTime = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const toggleSpeed = () => {
    setPlaybackRate(prev => {
      if (prev === 1) return 1.5;
      if (prev === 1.5) return 2;
      return 1;
    });
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === Infinity) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2 px-3 rounded-2xl min-w-[240px] sm:min-w-[285px]",
        isMine
          ? "bg-primary-700 text-white"
          : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
      )}
    >
      <button
        onClick={togglePlay}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-95",
          isMine
            ? "bg-white text-primary-700 hover:bg-white/90"
            : "bg-primary-600 text-white hover:bg-primary-700"
        )}
      >
        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} className="ml-0.5" fill="currentColor" />}
      </button>

      <div className="flex-1 flex flex-col gap-0.5">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className={cn(
            "w-full h-1 rounded-lg appearance-none cursor-pointer focus:outline-none accent-current",
            isMine ? "bg-primary-500/50" : "bg-slate-300 dark:bg-slate-600"
          )}
          style={{
            background: `linear-gradient(to right, currentColor ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%)`
          }}
        />
        <div className="flex justify-between items-center text-[10px] opacity-80 select-none">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <button
        onClick={toggleSpeed}
        className={cn(
          "px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight transition-colors shrink-0 select-none",
          isMine
            ? "bg-primary-800 hover:bg-primary-900 text-white"
            : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
        )}
      >
        {playbackRate}x
      </button>
    </div>
  );
};

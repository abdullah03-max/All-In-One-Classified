import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface AudioPlayerProps {
  msgId?: string;
  src: string;
  isMine: boolean;
  activeVoiceMsgId?: string | null;
  isPlayingVoice?: boolean;
  onTogglePlay?: (msgId: string) => void;
  onVoiceEnded?: (msgId: string) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  msgId,
  src,
  isMine,
  activeVoiceMsgId,
  isPlayingVoice,
  onTogglePlay,
  onVoiceEnded,
}) => {
  const isThisActive = msgId && activeVoiceMsgId === msgId;
  const isThisPlaying = isThisActive && !!isPlayingVoice;

  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [waveformBars, setWaveformBars] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const onVoiceEndedRef = useRef(onVoiceEnded);

  useEffect(() => {
    onVoiceEndedRef.current = onVoiceEnded;
  }, [onVoiceEnded]);

  // Extract real audio waveform data using Web Audio API safely or from URL params
  useEffect(() => {
    let isCancelled = false;

    const generateWaveform = async () => {
      // 1. Check if URL contains pre-calculated waveform from recording (?wf=20,45,80...)
      try {
        const urlObj = new URL(src, window.location.origin);
        const wfParam = urlObj.searchParams.get('wf');
        if (wfParam) {
          const parsed = wfParam.split(',').map(v => parseInt(v, 10)).filter(n => !isNaN(n));
          if (parsed.length > 0) {
            const maxVal = Math.max(...parsed, 1);
            const normalized = parsed.map(b => Math.max(12, Math.round((b / maxVal) * 100)));
            if (!isCancelled) {
              setWaveformBars(normalized);
              return;
            }
          }
        }
      } catch (_) {}

      // 2. Otherwise decode audio buffer using Web Audio API
      let audioCtx: AudioContext | null = null;
      try {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const decodedData = await audioCtx.decodeAudioData(arrayBuffer);
        
        const rawData = decodedData.getChannelData(0);
        const samples = 32; // 32 WhatsApp style waveform bars
        const blockSize = Math.floor(rawData.length / samples);
        const bars: number[] = [];

        for (let i = 0; i < samples; i++) {
          const blockStart = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[blockStart + j]);
          }
          const avg = sum / blockSize;
          bars.push(avg);
        }

        const maxVal = Math.max(...bars, 0.001);
        const normalized = bars.map(b => Math.max(12, Math.round((b / maxVal) * 100)));

        if (!isCancelled) {
          setWaveformBars(normalized);
          if (decodedData.duration && decodedData.duration > 0) {
            setDuration(prev => (prev === 0 || prev === Infinity) ? decodedData.duration : prev);
          }
        }
      } catch (err) {
        // Fallback default waveform if CORS or decode fails
        if (!isCancelled) {
          setWaveformBars([
            25, 45, 75, 35, 60, 90, 50, 30, 65, 80, 95, 40, 70, 85, 30, 55,
            75, 40, 60, 85, 95, 50, 35, 70, 80, 45, 60, 30, 50, 35, 20, 15
          ]);
        }
      } finally {
        if (audioCtx && audioCtx.state !== 'closed') {
          try { await audioCtx.close(); } catch {}
        }
      }
    };

    generateWaveform();
    return () => { isCancelled = true; };
  }, [src]);

  // Initialize and preload audio element immediately
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto'; // Immediate background preloading
    audio.src = src;
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audio.duration && audio.duration !== Infinity && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && audio.duration !== Infinity && !isNaN(audio.duration) && duration === 0) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setLocalIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
      if (msgId) {
        onVoiceEndedRef.current?.(msgId);
      }
    };

    const handleError = (e: any) => {
      console.error('[Mobile Voice Debug] Audio element playback error:', e, 'Error Object:', audio.error, 'src:', src);
    };

    if (audio.readyState >= 1) {
      handleLoadedMetadata();
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
    };
  }, [src, msgId, duration]);

  // Sync playback with centralized active state OR standalone local state
  const effectiveIsPlaying = onTogglePlay ? isThisPlaying : localIsPlaying;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (effectiveIsPlaying) {
      console.log(`[Mobile Voice Debug] Attempting play -> msgId: ${msgId || 'local'}, src: ${src}, readyState: ${audio.readyState}, currentTime: ${audio.currentTime}`);
      
      if (audio.currentTime >= audio.duration && audio.duration > 0) {
        audio.currentTime = 0;
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`[Mobile Voice Debug] ✅ Play SUCCESS -> msgId: ${msgId || 'local'}`);
          })
          .catch(err => {
            console.error(`[Mobile Voice Debug] ❌ Play FAILED -> msgId: ${msgId || 'local'}, error:`, err, 'audio.error:', audio.error);
          });
      }
    } else {
      audio.pause();
      if (onTogglePlay && !isThisActive) {
        audio.currentTime = 0;
        setCurrentTime(0);
      }
    }
  }, [effectiveIsPlaying, isThisActive, onTogglePlay, msgId, src]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    if (msgId && onTogglePlay) {
      onTogglePlay(msgId);
    } else {
      setLocalIsPlaying(prev => !prev);
    }
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !waveformRef.current || !duration) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
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

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2 px-3.5 rounded-2xl min-w-[240px] sm:min-w-[290px] shadow-sm select-none",
        isMine
          ? "bg-primary-700 text-white"
          : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
      )}
    >
      {/* Play / Pause Button */}
      <button
        onClick={togglePlay}
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-95 shadow-sm cursor-pointer",
          isMine
            ? "bg-white text-primary-700 hover:bg-white/90"
            : "bg-primary-600 text-white hover:bg-primary-700"
        )}
      >
        {effectiveIsPlaying ? (
          <Pause size={16} fill="currentColor" />
        ) : (
          <Play size={16} className="ml-0.5" fill="currentColor" />
        )}
      </button>

      {/* WhatsApp / Instagram Style Real Waveform Visualization */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div
          ref={waveformRef}
          onClick={handleWaveformClick}
          className="h-8 flex items-center gap-[2.5px] cursor-pointer py-1 group relative"
          title="Click to seek"
        >
          {waveformBars.map((heightPercent, index) => {
            const barProgress = (index / waveformBars.length) * 100;
            const isActive = barProgress <= progressPercent;

            return (
              <span
                key={index}
                className={cn(
                  "flex-1 rounded-full transition-all duration-150 group-hover:scale-y-110",
                  isActive
                    ? isMine ? "bg-white" : "bg-primary-600"
                    : isMine ? "bg-white/35" : "bg-slate-300 dark:bg-slate-600"
                )}
                style={{
                  height: `${heightPercent}%`,
                  minHeight: '4px'
                }}
              />
            );
          })}
        </div>

        {/* Timestamp Display */}
        <div className="flex justify-between items-center text-[10px] opacity-80 font-medium tracking-tight">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Speed Multiplier Pill (1x, 1.5x, 2x) */}
      <button
        onClick={toggleSpeed}
        className={cn(
          "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 transition-colors cursor-pointer",
          isMine
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
        )}
      >
        {playbackRate}x
      </button>
    </div>
  );
};

'use client';
import { useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { apiClient } from '@/utils/api';

interface VideoPlayerProps {
  src: string;
  enrollmentId: string;
  lessonId: string;
  initialPosition?: number;
  onComplete: () => void;
  onProgress?: (position: number, pct: number) => void;
}

export function VideoPlayer({
  src,
  enrollmentId,
  lessonId,
  initialPosition = 0,
  onComplete,
  onProgress,
}: VideoPlayerProps) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const hlsRef        = useRef<Hls | null>(null);
  const completedRef  = useRef(false);
  const saveTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced progress save — fires at most once every 10 s
  const saveProgress = useCallback(
    (position: number, status: 'in_progress' | 'completed', pct?: number) => {
      apiClient.post('/v1/enrollments/' + enrollmentId + '/progress', {
        lessonId,
        status,
        videoPosition: Math.floor(position),
        videoCompletedPct: pct,
      }).catch(() => {}); // best-effort
    },
    [enrollmentId, lessonId],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (Hls.isSupported()) {
      const hls = new Hls({ startPosition: initialPosition });
      hls.loadSource(src);
      hls.attachMedia(video);
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src         = src;
      video.currentTime = initialPosition;
    } else {
      video.src = src; // fallback for non-HLS sources
    }

    const handleTimeUpdate = () => {
      if (!video.duration) return;
      const pct = (video.currentTime / video.duration) * 100;
      onProgress?.(video.currentTime, pct);

      // Debounced 10-second save
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveProgress(video.currentTime, 'in_progress', Math.round(pct));
      }, 10_000);

      // Mark complete at 90 % — once only
      if (pct >= 90 && !completedRef.current) {
        completedRef.current = true;
        saveProgress(video.currentTime, 'completed', 90);
        onComplete();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src, initialPosition, saveProgress, onComplete, onProgress]);

  return (
    <video
      ref={videoRef}
      controls
      className="w-full rounded-lg bg-black"
      playsInline
      style={{ maxHeight: '480px' }}
    />
  );
}

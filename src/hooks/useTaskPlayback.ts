import { useState, useRef, useCallback, useEffect } from 'react';
import { Task } from '@/models';
import { PlaybackEngine, PlaybackSpeed, PlaybackStatus } from '@/utils/PlaybackEngine';

interface UseTaskPlaybackOptions {
  sourceTask: Task;
  autoPlay?: boolean;
  defaultSpeed?: PlaybackSpeed;
}

interface UseTaskPlaybackReturn {
  // Playback task (growing over time)
  playbackTask: Task | null;

  // Playback state
  status: PlaybackStatus;
  progress: number; // 0-100
  speed: PlaybackSpeed;

  // Controls
  play: () => void;
  pause: () => void;
  stop: () => void;
  restart: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
}

/**
 * Hook for task playback management
 *
 * Creates a data-driven playback system where the playback task grows over time
 * as the PlaybackEngine injects data character-by-character.
 *
 * @param sourceTask - Original task to play back
 * @param autoPlay - Whether to start playing automatically
 * @param defaultSpeed - Initial playback speed
 */
export const useTaskPlayback = ({
  sourceTask,
  autoPlay = false,
  defaultSpeed = 1,
}: UseTaskPlaybackOptions): UseTaskPlaybackReturn => {
  const [playbackTask, setPlaybackTask] = useState<Task | null>(null);
  const [status, setStatus] = useState<PlaybackStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [speed, setSpeedState] = useState<PlaybackSpeed>(defaultSpeed);

  const engineRef = useRef<PlaybackEngine | null>(null);

  /**
   * Initialize or get PlaybackEngine instance
   */
  const getEngine = useCallback((): PlaybackEngine => {
    if (!engineRef.current) {
      engineRef.current = new PlaybackEngine(
        sourceTask,
        (updatedTask, progressValue, statusValue) => {
          setPlaybackTask(updatedTask);
          setProgress(progressValue);
          setStatus(statusValue);
        },
        speed
      );
    }
    return engineRef.current;
  }, [sourceTask, speed]);

  /**
   * Play or resume playback
   */
  const play = useCallback(() => {
    const engine = getEngine();
    setStatus('playing');
    engine.play();
  }, [getEngine]);

  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.pause();
      setStatus('paused');
    }
  }, []);

  /**
   * Stop playback and reset
   */
  const stop = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
      setStatus('idle');
      setProgress(0);
      setPlaybackTask(null);
    }
  }, []);

  /**
   * Restart playback from beginning
   */
  const restart = useCallback(() => {
    stop();
    setTimeout(() => {
      play();
    }, 100);
  }, [stop, play]);

  /**
   * Set playback speed
   */
  const setSpeed = useCallback((newSpeed: PlaybackSpeed) => {
    setSpeedState(newSpeed);
    if (engineRef.current) {
      engineRef.current.setSpeed(newSpeed);
    }
  }, []);

  /**
   * Auto play on mount if enabled
   */
  useEffect(() => {
    if (autoPlay) {
      play();
    }

    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, []);

  /**
   * Reset when source task changes
   */
  useEffect(() => {
    stop();
    engineRef.current = null;
  }, [sourceTask.id]);

  return {
    playbackTask,
    status,
    progress,
    speed,
    play,
    pause,
    stop,
    restart,
    setSpeed,
  };
};

import { useState, useEffect, useCallback, useRef } from 'react';
import { DisplayMessage } from '@/models';
import { flattenMessages, AtomicMessageFragment, getFragmentTextLength } from '@/utils/messageFlattener';

// Playback speed options
export type PlaybackSpeed = 0.5 | 1 | 2 | 5 | 10 | 20 | 50;

// Playback state
export type PlaybackState = 'idle' | 'playing' | 'paused' | 'completed';

interface UseHistoryPlaybackOptions {
  messages: DisplayMessage[];
  onComplete?: () => void;
  autoPlay?: boolean;
  defaultSpeed?: PlaybackSpeed;
}

interface UseHistoryPlaybackReturn {
  // State
  playbackState: PlaybackState;
  currentIndex: number;
  displayedFragments: AtomicMessageFragment[]; // Changed from displayedMessages
  speed: PlaybackSpeed;
  progress: number; // 0-100
  totalFragments: number; // Changed from totalMessages

  // Controls
  play: () => void;
  pause: () => void;
  stop: () => void;
  restart: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  jumpTo: (index: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
}

/**
 * History playback Hook - simulates streaming effect for historical messages
 * Progressively displays ATOMIC FRAGMENTS instead of complete messages
 */
export const useHistoryPlayback = ({
  messages,
  onComplete,
  autoPlay = false,
  defaultSpeed = 1
}: UseHistoryPlaybackOptions): UseHistoryPlaybackReturn => {
  // Flatten messages into atomic fragments for granular playback
  const atomicFragments = flattenMessages(messages);

  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [speed, setSpeed] = useState<PlaybackSpeed>(defaultSpeed);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  // Displayed fragments (progressively shown, one at a time)
  // currentIndex -1 means no fragments shown yet
  // currentIndex 0 means show fragment[0]
  // currentIndex 1 means show fragment[0] and fragment[1], etc.
  const displayedFragments = currentIndex >= 0
    ? atomicFragments.slice(0, currentIndex + 1)
    : [];

  // Calculate progress percentage based on fragments
  const progress = atomicFragments.length > 0
    ? Math.round(((currentIndex + 1) / atomicFragments.length) * 100)
    : 0;

  /**
   * Calculate typewriter delay for an atomic fragment
   * Based on text length and fragment type
   * Using react-simple-typewriter: typeSpeed is milliseconds per character
   *
   * IMPORTANT: We limit the maximum delay to prevent long fragments from blocking playback
   */
  const calculateTypewriterDelay = (fragment: AtomicMessageFragment): number => {
    const textLength = getFragmentTextLength(fragment);

    if (textLength === 0) return 0;

    // Typewriter speeds (milliseconds per character) - adjusted to match components
    let msPerChar = 25; // Default speed (increased from 20 for more visible effect)

    switch (fragment.type) {
      case 'user':
        msPerChar = 15; // User messages faster (15ms per char)
        break;
      case 'thinking':
        msPerChar = 25; // AI thinking (25ms per char, increased for visibility)
        break;
      case 'agent-task':
        msPerChar = 25; // Agent tasks (25ms per char)
        break;
      case 'agent-node':
        msPerChar = 25; // Agent nodes/steps (25ms per char)
        break;
      case 'text':
        msPerChar = 25; // General text (25ms per char, matches AgentGroup text)
        break;
      default:
        msPerChar = 0; // No typewriter for tool/human-interaction
    }

    // Calculate time needed in milliseconds
    const calculatedDelay = textLength * msPerChar;

    // Increased maximum delay to 8 seconds to allow longer streaming effect
    // User prefers to see full streaming even if it takes longer
    const MAX_TYPEWRITER_DELAY = 8000;
    return Math.min(calculatedDelay, MAX_TYPEWRITER_DELAY);
  };

  /**
   * Calculate delay between fragments
   * Includes typewriter effect time
   */
  const calculateDelay = (
    prevFragment: AtomicMessageFragment | undefined,
    currentFragment: AtomicMessageFragment,
    speed: PlaybackSpeed
  ): number => {
    // Base delay between fragments (pause after previous fragment completes)
    const BASE_DELAY = 300; // 300ms pause between fragments

    // Calculate typewriter delay for current fragment
    const typewriterDelay = calculateTypewriterDelay(currentFragment);

    // Total delay = base delay + typewriter delay, adjusted by speed
    const totalDelay = (BASE_DELAY + typewriterDelay) / speed;

    return totalDelay;
  };

  /**
   * Schedule next fragment display
   */
  const scheduleNextFragment = useCallback(() => {
    if (!isPlayingRef.current) return;

    const nextIndex = currentIndex + 1;

    // Check if playback completed
    if (nextIndex >= atomicFragments.length) {
      setPlaybackState('completed');
      isPlayingRef.current = false;
      onComplete?.();
      return;
    }

    // Calculate delay based on fragment content (for typewriter effect)
    const prevFragment = atomicFragments[currentIndex];
    const nextFragment = atomicFragments[nextIndex];
    const delay = calculateDelay(prevFragment, nextFragment, speed);

    // Schedule next fragment
    timerRef.current = setTimeout(() => {
      setCurrentIndex(nextIndex);
    }, delay);
  }, [currentIndex, atomicFragments, speed, onComplete]);

  /**
   * Clear timer
   */
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * Play
   */
  const play = useCallback(() => {
    if (atomicFragments.length === 0) return;

    setPlaybackState('playing');
    isPlayingRef.current = true;
  }, [atomicFragments.length]);

  /**
   * Pause
   */
  const pause = useCallback(() => {
    setPlaybackState('paused');
    isPlayingRef.current = false;
    clearTimer();
  }, [clearTimer]);

  /**
   * Stop
   */
  const stop = useCallback(() => {
    setPlaybackState('idle');
    isPlayingRef.current = false;
    clearTimer();
    setCurrentIndex(-1);
  }, [clearTimer]);

  /**
   * Restart
   */
  const restart = useCallback(() => {
    // Stop current playback
    setPlaybackState('idle');
    isPlayingRef.current = false;
    clearTimer();

    // Reset to start (no messages shown)
    setCurrentIndex(-1);

    // Start playing after a brief delay
    setTimeout(() => {
      setPlaybackState('playing');
      isPlayingRef.current = true;
    }, 100);
  }, [clearTimer]);

  /**
   * Jump to specific index
   */
  const jumpTo = useCallback((index: number) => {
    const targetIndex = Math.max(-1, Math.min(index, atomicFragments.length - 1));
    const wasPlaying = isPlayingRef.current;

    // Pause playback
    pause();

    // Update index
    setCurrentIndex(targetIndex);

    // Resume if was playing
    if (wasPlaying && targetIndex < atomicFragments.length - 1) {
      setTimeout(() => play(), 100);
    } else if (targetIndex >= atomicFragments.length - 1) {
      setPlaybackState('completed');
    }
  }, [atomicFragments.length, pause, play]);

  /**
   * Step forward
   */
  const stepForward = useCallback(() => {
    if (currentIndex < atomicFragments.length - 1) {
      jumpTo(currentIndex + 1);
    }
  }, [currentIndex, atomicFragments.length, jumpTo]);

  /**
   * Step backward
   */
  const stepBackward = useCallback(() => {
    if (currentIndex > -1) {
      jumpTo(currentIndex - 1);
    }
  }, [currentIndex, jumpTo]);

  /**
   * Effect: Schedule next fragment when playing
   */
  useEffect(() => {
    if (playbackState === 'playing') {
      scheduleNextFragment();
    }

    return () => clearTimer();
  }, [playbackState, currentIndex, scheduleNextFragment, clearTimer]);

  /**
   * Effect: Auto play on mount if enabled
   */
  useEffect(() => {
    if (autoPlay && atomicFragments.length > 0) {
      play();
    }

    // Cleanup on unmount
    return () => {
      clearTimer();
      isPlayingRef.current = false;
    };
  }, []);

  /**
   * Effect: Reset when messages change
   */
  useEffect(() => {
    stop();
  }, [messages]);

  return {
    playbackState,
    currentIndex,
    displayedFragments,
    speed,
    progress,
    totalFragments: atomicFragments.length,

    play,
    pause,
    stop,
    restart,
    setSpeed,
    jumpTo,
    stepForward,
    stepBackward,
  };
};

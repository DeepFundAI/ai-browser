import { useState, useRef, useCallback, useEffect } from 'react';
import {
  initSpeechRecognitionWithProvider,
  startSpeechRecognition,
  stopSpeechRecognition,
  cleanupSpeechRecognition
} from '@/services/speech-recognition';
import { SpeechRecognitionConfig } from '@/models/speech-recognition/speech-recognition-base';
import { logger } from '@/utils/logger';
import { useLanguageStore } from '@/stores/languageStore';

export type VoiceInputStatus = 'idle' | 'recording' | 'error';

interface UseVoiceInputOptions {
  onTextRecognized?: (text: string) => void;
  onError?: (error: string) => void;
}

/**
 * Hook for voice input functionality
 * Manages speech recognition state and provides control methods
 */
export const useVoiceInput = ({ onTextRecognized, onError }: UseVoiceInputOptions = {}) => {
  const [status, setStatus] = useState<VoiceInputStatus>('idle');
  const isInitialized = useRef(false);
  const isRecordingRef = useRef(false); // Track actual recording state
  const onTextRecognizedRef = useRef(onTextRecognized);
  const onErrorRef = useRef(onError);
  const { language } = useLanguageStore();

  // Update refs when callbacks change
  useEffect(() => {
    onTextRecognizedRef.current = onTextRecognized;
    onErrorRef.current = onError;
  }, [onTextRecognized, onError]);

  // Initialize speech recognition and reinitialize when language changes
  useEffect(() => {
    let mounted = true;
    let initializationStarted = false;

    // Async initialization
    (async () => {
      try {
        // Cleanup previous instance and wait for it to complete
        await cleanupSpeechRecognition();

        // Check if still mounted after cleanup
        if (!mounted) return;

        // Select model based on current language
        const modelType = language === 'zh-CN' ? 'small-cn' : 'small-en';

        const config: SpeechRecognitionConfig = {
          provider: 'vosk',
          modelType
        };

        initializationStarted = true;
        await initSpeechRecognitionWithProvider(config, (text: string) => {
          if (onTextRecognizedRef.current) {
            onTextRecognizedRef.current(text);
          }
        });

        if (mounted) {
          isInitialized.current = true;
        }
      } catch (error) {
        logger.error('Failed to initialize speech recognition', error, 'VoiceInput');
        if (mounted && onErrorRef.current) {
          onErrorRef.current('Speech recognition initialization failed');
        }
      }
    })();

    // Cleanup on unmount or language change
    return () => {
      mounted = false;
      isRecordingRef.current = false;
      if (initializationStarted) {
        cleanupSpeechRecognition();
      }
    };
  }, [language]); // Reinitialize when language changes

  /**
   * Start voice recording
   */
  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return;

    if (!isInitialized.current) {
      const errorMsg = 'Speech recognition not initialized';
      logger.error(errorMsg, undefined, 'VoiceInput');
      if (onErrorRef.current) {
        onErrorRef.current(errorMsg);
      }
      setStatus('error');
      return;
    }

    try {
      isRecordingRef.current = true;
      setStatus('recording');
      await startSpeechRecognition();
    } catch (error) {
      logger.error('Failed to start recording', error, 'VoiceInput');
      isRecordingRef.current = false;
      setStatus('idle');
      if (onErrorRef.current) {
        onErrorRef.current('Failed to start voice recording');
      }
    }
  }, []);

  /**
   * Stop voice recording
   */
  const stopRecording = useCallback(async () => {
    if (!isRecordingRef.current) return;

    try {
      isRecordingRef.current = false;
      await stopSpeechRecognition();
      setStatus('idle');
    } catch (error) {
      logger.error('Failed to stop recording', error, 'VoiceInput');
      isRecordingRef.current = false;
      setStatus('idle');
      if (onErrorRef.current) {
        onErrorRef.current('Failed to stop voice recording');
      }
    }
  }, []);

  /**
   * Toggle recording state
   */
  const toggleRecording = useCallback(async () => {
    if (isRecordingRef.current) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [startRecording, stopRecording]);

  return {
    status,
    isRecording: status === 'recording',
    startRecording,
    stopRecording,
    toggleRecording,
  };
};

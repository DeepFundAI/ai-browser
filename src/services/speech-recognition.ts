import { SpeechRecognitionBase, SpeechRecognitionConfig } from "@/models/speech-recognition/speech-recognition-base";
import { SpeechRecognitionMicrosoft } from "@/models/speech-recognition/speech-recognition-microsoft";
import { SpeechRecognitionVosk } from "@/models/speech-recognition/speech-recognition-vosk";
import { SpeechRecognitionXunfei } from "@/models/speech-recognition/speech-recognition-xunfei";
import { logger } from "@/utils/logger";


let speechRecognition: SpeechRecognitionBase | null = null;
let initializationPromise: Promise<void> | null = null;
let currentCleanup: Promise<void> | null = null;

// New initialization function, supports multiple providers (async to wait for Vosk model loading)
export async function initSpeechRecognitionWithProvider(config: SpeechRecognitionConfig, onRecognized?: (text: string) => void): Promise<void> {
  // Wait for ongoing cleanup to complete
  if (currentCleanup) {
    await currentCleanup;
  }

  initializationPromise = (async () => {
    const {provider} = config;

    let instance: SpeechRecognitionBase;

    switch (provider) {
      case 'microsoft':
        instance = new SpeechRecognitionMicrosoft(config, onRecognized);
        break;
      case 'xunfei':
        instance = new SpeechRecognitionXunfei(config, onRecognized);
        break;
      case 'vosk':
        instance = new SpeechRecognitionVosk(config, onRecognized);
        // Wait for Vosk model to fully load (init() is async)
        await new Promise<void>((resolve) => {
          // Vosk init is called in constructor, wait a bit for it to complete
          // Check every 100ms if model is ready
          const checkReady = setInterval(() => {
            const voskInstance = instance as any;
            if (voskInstance.model && voskInstance.recognizer) {
              clearInterval(checkReady);
              resolve();
            }
          }, 100);

          // Timeout after 30 seconds
          setTimeout(() => {
            clearInterval(checkReady);
            logger.warn('Vosk initialization timeout, proceeding anyway', 'SpeechRecognition');
            resolve();
          }, 30000);
        });
        break;
      default:
        throw new Error(`Unsupported speech recognition provider: ${provider}`);
    }

    speechRecognition = instance;
  })();

  return initializationPromise;
}

// Start speech recognition
export async function startSpeechRecognition() {
  if (speechRecognition?.isRecognizing) {
    return;
  }

  await speechRecognition?.start();
}

// Stop speech recognition
export async function stopSpeechRecognition() {
  if (!speechRecognition?.isRecognizing) {
    return;
  }
  await speechRecognition?.stop();
}

// Cleanup resources
export async function cleanupSpeechRecognition() {
  if (currentCleanup) {
    return currentCleanup;
  }

  currentCleanup = (async () => {
    if (speechRecognition) {
      await speechRecognition.cleanup();
      speechRecognition = null;
    }
    initializationPromise = null;
  })();

  await currentCleanup;
  currentCleanup = null;
}
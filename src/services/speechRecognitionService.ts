/**
 * Speech Recognition Service wrapping Web Speech API (SpeechRecognition / webkitSpeechRecognition).
 * Handles live speech-to-text conversion for the AI Mock Interview.
 */

export interface SpeechRecognitionHandlers {
  onResult: (transcript: { interim: string; final: string; combined: string }) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  onStart?: () => void;
}

class SpeechRecognitionService {
  private recognition: any = null;
  private isListening: boolean = false;
  private shouldBeListening: boolean = false;
  private finalTranscript: string = '';
  private handlers: SpeechRecognitionHandlers | null = null;

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return !!SpeechRecognition;
  }

  public startListening(handlers: SpeechRecognitionHandlers): boolean {
    if (!this.isSupported()) {
      if (handlers.onError) {
        handlers.onError('Speech Recognition is not supported in this browser.');
      }
      return false;
    }

    this.handlers = handlers;
    this.shouldBeListening = true;

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (this.recognition) {
        try {
          this.recognition.stop();
        } catch {
          // ignore
        }
      }

      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = 'en-US';

      recog.onstart = () => {
        this.isListening = true;
        if (this.handlers?.onStart) {
          this.handlers.onStart();
        }
      };

      recog.onresult = (event: any) => {
        let interimText = '';
        let newFinalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            newFinalText += result[0].transcript + ' ';
          } else {
            interimText += result[0].transcript;
          }
        }

        if (newFinalText) {
          this.finalTranscript += newFinalText;
        }

        const combined = (this.finalTranscript + ' ' + interimText).trim();

        if (this.handlers?.onResult) {
          this.handlers.onResult({
            interim: interimText.trim(),
            final: this.finalTranscript.trim(),
            combined
          });
        }
      };

      recog.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.shouldBeListening = false;
          this.isListening = false;
        }
        if (this.handlers?.onError) {
          this.handlers.onError(event.error || 'Speech recognition error');
        }
      };

      recog.onend = () => {
        this.isListening = false;
        // If user wants continuous listening for an answer, restart automatically if ended prematurely
        if (this.shouldBeListening) {
          try {
            recog.start();
            return;
          } catch (e) {
            console.warn('Could not auto-restart recognition:', e);
          }
        }
        if (this.handlers?.onEnd) {
          this.handlers.onEnd();
        }
      };

      this.recognition = recog;
      recog.start();
      return true;
    } catch (err) {
      console.error('Failed to initialize Speech Recognition:', err);
      this.shouldBeListening = false;
      this.isListening = false;
      if (handlers.onError) {
        handlers.onError(err instanceof Error ? err.message : String(err));
      }
      return false;
    }
  }

  public stopListening(): string {
    this.shouldBeListening = false;
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
    this.isListening = false;
    return this.finalTranscript.trim();
  }

  public resetTranscript(): void {
    this.finalTranscript = '';
  }

  public getFinalTranscript(): string {
    return this.finalTranscript.trim();
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechRecognitionService = new SpeechRecognitionService();

import { SpeechAnalysisData, FillerBreakdown } from '../types';

export interface QuestionSpeechSample {
  questionId: number;
  transcript: string;
  wordCount: number;
  fillerBreakdown: FillerBreakdown;
  fillerCount: number;
  speechDuration: number; // in seconds
  responseDuration: number; // in seconds
  pauseCount: number;
  pauseDurations: number[]; // in seconds
  averageVolume: number; // 0-100
}

/**
 * Extracts and counts filler words from a given text transcript.
 */
export function extractFillerWords(text: string): { count: number; breakdown: FillerBreakdown } {
  const breakdown: FillerBreakdown = {
    um: 0,
    uh: 0,
    like: 0,
    actually: 0,
    basically: 0,
    youKnow: 0
  };

  if (!text || text.trim().length === 0) {
    return { count: 0, breakdown };
  }

  const normalized = text.toLowerCase();

  // Match "you know" phrase
  const youKnowMatches = normalized.match(/\byou\s+know\b/g);
  if (youKnowMatches) {
    breakdown.youKnow = youKnowMatches.length;
  }

  // Tokenize words
  const words = normalized.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);

  words.forEach(w => {
    if (w === 'um' || w === 'umm') breakdown.um++;
    else if (w === 'uh' || w === 'uhh' || w === 'er') breakdown.uh++;
    else if (w === 'like') breakdown.like++;
    else if (w === 'actually') breakdown.actually++;
    else if (w === 'basically') breakdown.basically++;
  });

  const count =
    breakdown.um +
    breakdown.uh +
    breakdown.like +
    breakdown.actually +
    breakdown.basically +
    breakdown.youKnow;

  return { count, breakdown };
}

export interface LiveAudioTrackerOptions {
  stream?: MediaStream | null;
  onVolumeChange?: (volume: number) => void;
  onPaceChange?: (liveWpm: number, liveFillers: number) => void;
}

/**
 * Live audio analyzer for an individual question recording session.
 * Tracks volume levels, speech presence, silence/pause periods, and duration.
 */
export class LiveSpeechAnalyzer {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private intervalId: any = null;
  private startTime: number = 0;
  private speechDurationMs: number = 0;
  private pauseDurationsMs: number[] = [];
  private currentPauseStartMs: number | null = null;
  private isSpeaking: boolean = false;
  private volumeReadings: number[] = [];
  private options: LiveAudioTrackerOptions;

  constructor(options: LiveAudioTrackerOptions = {}) {
    this.options = options;
  }

  public start() {
    this.startTime = Date.now();
    this.speechDurationMs = 0;
    this.pauseDurationsMs = [];
    this.currentPauseStartMs = null;
    this.isSpeaking = false;
    this.volumeReadings = [];

    if (this.options.stream) {
      try {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          this.audioCtx = ctx;

          if (ctx.state === 'suspended') {
            ctx.resume().catch((err) => {
              console.warn('AudioContext resume failed:', err);
            });
          }

          const source = ctx.createMediaStreamSource(this.options.stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.3;
          source.connect(analyser);
          this.analyser = analyser;

          const bufferLength = analyser.fftSize;
          const dataArray = new Uint8Array(bufferLength);

          this.intervalId = setInterval(() => {
            if (!this.analyser) return;
            this.analyser.getByteTimeDomainData(dataArray);
            let sumSquares = 0;
            for (let i = 0; i < bufferLength; i++) {
              const normalized = (dataArray[i] - 128) / 128;
              sumSquares += normalized * normalized;
            }
            const rms = Math.sqrt(sumSquares / bufferLength);
            const volumePercent = Math.min(100, Math.round(rms * 280));
            this.volumeReadings.push(volumePercent);

            if (this.options.onVolumeChange) {
              this.options.onVolumeChange(volumePercent);
            }

            const now = Date.now();
            const SILENCE_THRESHOLD = 8; // Volume % considered silence
            const PAUSE_THRESHOLD_MS = 1200; // 1.2s of silence counts as pause

            if (volumePercent > SILENCE_THRESHOLD) {
              // Active voice detected
              this.speechDurationMs += 100;
              if (!this.isSpeaking) {
                this.isSpeaking = true;
                if (this.currentPauseStartMs) {
                  const pauseLen = now - this.currentPauseStartMs;
                  if (pauseLen >= PAUSE_THRESHOLD_MS) {
                    this.pauseDurationsMs.push(pauseLen);
                  }
                  this.currentPauseStartMs = null;
                }
              }
            } else {
              // Silence / pause detected
              if (this.isSpeaking) {
                this.isSpeaking = false;
                this.currentPauseStartMs = now;
              }
            }
          }, 100);
        }
      } catch (err) {
        console.warn('AudioContext not available or blocked in sandbox:', err);
      }
    }
  }

  public stop(finalTranscript: string, questionId: number): QuestionSpeechSample {
    const endTime = Date.now();
    const responseDurationSeconds = Math.max(1, Math.round((endTime - (this.startTime || endTime)) / 1000));

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
      this.analyser = null;
    }

    // Check if ended during a pause
    if (this.currentPauseStartMs) {
      const pauseLen = endTime - this.currentPauseStartMs;
      if (pauseLen >= 1200) {
        this.pauseDurationsMs.push(pauseLen);
      }
    }

    const { count: fillerCount, breakdown: fillerBreakdown } = extractFillerWords(finalTranscript);
    const words = finalTranscript.trim() ? finalTranscript.trim().split(/\s+/).length : 0;

    let speechDurationSeconds = Math.round(this.speechDurationMs / 1000);
    // If AudioContext was blocked or no microphone volume readings, infer speech duration from words and recording time
    if (speechDurationSeconds === 0 && words > 0) {
      speechDurationSeconds = Math.min(responseDurationSeconds, Math.max(2, Math.round(words / 2.2)));
    } else if (speechDurationSeconds === 0) {
      speechDurationSeconds = Math.round(responseDurationSeconds * 0.7);
    }

    const pauseDurationsSec = this.pauseDurationsMs.map(ms => Math.round((ms / 1000) * 10) / 10);
    const avgVol = this.volumeReadings.length > 0
      ? Math.round(this.volumeReadings.reduce((a, b) => a + b, 0) / this.volumeReadings.length)
      : 45;

    return {
      questionId,
      transcript: finalAnswerSanitize(finalTranscript),
      wordCount: words,
      fillerBreakdown,
      fillerCount,
      speechDuration: speechDurationSeconds,
      responseDuration: responseDurationSeconds,
      pauseCount: pauseDurationsSec.length,
      pauseDurations: pauseDurationsSec,
      averageVolume: avgVol
    };
  }
}

function finalAnswerSanitize(text: string): string {
  return (text || '').trim();
}

/**
 * Aggregates all question speech samples across the completed interview session into a unified SpeechAnalysisData record.
 */
export function aggregateInterviewSpeechAnalysis(
  samples: QuestionSpeechSample[],
  answers?: { transcript?: string }[]
): SpeechAnalysisData {
  let totalWords = 0;
  let totalSpeechSec = 0;
  let totalResponseSec = 0;
  let totalPauseCount = 0;
  let allPauseDurations: number[] = [];
  const mergedBreakdown: FillerBreakdown = {
    um: 0,
    uh: 0,
    like: 0,
    actually: 0,
    basically: 0,
    youKnow: 0
  };

  if (samples && samples.length > 0) {
    samples.forEach(s => {
      totalWords += s.wordCount;
      totalSpeechSec += s.speechDuration;
      totalResponseSec += s.responseDuration;
      totalPauseCount += s.pauseCount;
      allPauseDurations.push(...s.pauseDurations);

      mergedBreakdown.um += s.fillerBreakdown.um;
      mergedBreakdown.uh += s.fillerBreakdown.uh;
      mergedBreakdown.like += s.fillerBreakdown.like;
      mergedBreakdown.actually += s.fillerBreakdown.actually;
      mergedBreakdown.basically += s.fillerBreakdown.basically;
      mergedBreakdown.youKnow += s.fillerBreakdown.youKnow;
    });
  } else if (answers && answers.length > 0) {
    // Fallback if samples weren't captured: analyze actual answer transcripts
    answers.forEach((ans, idx) => {
      const txt = ans.transcript || '';
      const { count, breakdown } = extractFillerWords(txt);
      const wCount = txt.trim() ? txt.trim().split(/\s+/).length : 0;
      totalWords += wCount;
      totalResponseSec += Math.max(15, Math.round(wCount * 0.5));
      totalSpeechSec += Math.max(10, Math.round(wCount * 0.42));
      
      mergedBreakdown.um += breakdown.um;
      mergedBreakdown.uh += breakdown.uh;
      mergedBreakdown.like += breakdown.like;
      mergedBreakdown.actually += breakdown.actually;
      mergedBreakdown.basically += breakdown.basically;
      mergedBreakdown.youKnow += breakdown.youKnow;
    });
  }

  if (totalWords === 0) {
    return {
      speakingRate: 0,
      fillerWordCount: 0,
      fillerBreakdown: mergedBreakdown,
      pauseCount: totalPauseCount,
      averagePauseDuration: 0,
      speechDuration: 0,
      responseDuration: totalResponseSec > 0 ? totalResponseSec : 0,
      speechActivityRatio: 0,
      fluencyScore: 0,
      fluencyAssessment: 'No spoken responses detected during the interview session.',
      vocalFeedback: 'No verbal speech was detected. Please ensure your microphone is enabled and speak clearly during each question.'
    };
  }

  // Ensure reasonable non-zero minimums for valid mathematical ratios
  if (totalResponseSec <= 0) totalResponseSec = 60;
  if (totalSpeechSec <= 0) totalSpeechSec = Math.round(totalResponseSec * 0.75);

  const totalFillerCount =
    mergedBreakdown.um +
    mergedBreakdown.uh +
    mergedBreakdown.like +
    mergedBreakdown.actually +
    mergedBreakdown.basically +
    mergedBreakdown.youKnow;

  // Calculate WPM (Words Per Minute based on active speaking minutes)
  const speechMinutes = totalSpeechSec / 60;
  let speakingRate = totalWords > 0 && speechMinutes > 0
    ? Math.round(totalWords / speechMinutes)
    : 128; // Default standard cadence if no words

  // Clamp WPM to reasonable real-world human bounds
  speakingRate = Math.min(220, Math.max(50, speakingRate));

  // Average Pause Duration
  const avgPauseDuration = allPauseDurations.length > 0
    ? Math.round((allPauseDurations.reduce((a, b) => a + b, 0) / allPauseDurations.length) * 10) / 10
    : 1.6;

  // Speech activity ratio (% of total response time spent speaking vs silence)
  const speechActivityRatio = Math.min(100, Math.max(10, Math.round((totalSpeechSec / totalResponseSec) * 100)));

  // Objective Fluency Score (0-100)
  let score = 95;

  // 1. WPM scoring: Optimal is 110 - 150 WPM
  if (speakingRate < 95) {
    score -= Math.min(20, Math.round((95 - speakingRate) * 0.6));
  } else if (speakingRate > 165) {
    score -= Math.min(20, Math.round((speakingRate - 165) * 0.5));
  }

  // 2. Filler words penalty: Optimal is < 2 fillers per minute
  const totalMinutes = totalResponseSec / 60;
  const fillersPerMin = totalMinutes > 0 ? totalFillerCount / totalMinutes : 0;
  if (fillersPerMin > 2) {
    score -= Math.min(25, Math.round((fillersPerMin - 2) * 4));
  }

  // 3. Pause duration penalty
  if (avgPauseDuration > 3.0) {
    score -= Math.min(15, Math.round((avgPauseDuration - 3.0) * 5));
  }

  const fluencyScore = Math.min(100, Math.max(55, score));

  // Generate qualitative assessments based on computed values
  let fluencyAssessment = 'Optimal speaking cadence with clear articulation and controlled vocal delivery.';
  if (speakingRate > 160) {
    fluencyAssessment = `Fast-paced delivery (~${speakingRate} WPM). Practice deliberate breathing between sentences to ensure maximum technical clarity.`;
  } else if (speakingRate < 100) {
    fluencyAssessment = `Deliberate and thoughtful pacing (~${speakingRate} WPM). Increasing verbal momentum slightly will convey stronger confidence.`;
  } else if (fillersPerMin > 3) {
    fluencyAssessment = `Good articulation with frequent verbal filler usage (${totalFillerCount} instances detected). Replacing fillers with silent micro-pauses will elevate executive presence.`;
  }

  let vocalFeedback = 'Solid vocal clarity and natural response flow. Sustained good speech pacing throughout technical explanations.';
  if (totalFillerCount > 4) {
    vocalFeedback = `Noticeable usage of fillers like "${getTopFiller(mergedBreakdown)}". Try grounding your thoughts with a 1-second silent breath before starting complex answers.`;
  } else if (speechActivityRatio < 55) {
    vocalFeedback = 'Extended thinking pauses observed between key points. Structuring answers using the STAR format helps eliminate dead air.';
  } else if (speakingRate >= 115 && speakingRate <= 145 && totalFillerCount <= 3) {
    vocalFeedback = 'Outstanding vocal control. Maintained prime recruiter benchmark pacing (115-145 WPM) with crisp delivery and minimal verbal hesitation.';
  }

  return {
    speakingRate,
    fillerWordCount: totalFillerCount,
    fillerBreakdown: mergedBreakdown,
    pauseCount: totalPauseCount,
    averagePauseDuration: avgPauseDuration,
    speechDuration: totalSpeechSec,
    responseDuration: totalResponseSec,
    speechActivityRatio,
    fluencyScore,
    fluencyAssessment,
    vocalFeedback
  };
}

function getTopFiller(breakdown: FillerBreakdown): string {
  const entries: [string, number][] = [
    ['um', breakdown.um],
    ['uh', breakdown.uh],
    ['like', breakdown.like],
    ['actually', breakdown.actually],
    ['basically', breakdown.basically],
    ['you know', breakdown.youKnow]
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][1] > 0 ? entries[0][0] : 'um';
}

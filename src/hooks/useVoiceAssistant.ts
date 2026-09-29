import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceAssistantConfig } from '../types/config';

export interface UseVoiceAssistantProps {
  config: VoiceAssistantConfig;
  onCommandReceived: (command: string) => void;
  onWakeWordDetected?: () => void;
}

export function useVoiceAssistant({
  config,
  onCommandReceived,
  onWakeWordDetected,
}: UseVoiceAssistantProps) {
  // States
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [isWakeWordMode, setIsWakeWordMode] = useState<boolean>(true); // Continuous wake word mode
  const [wakeWordStatus, setWakeWordStatus] = useState<'idle' | 'listening' | 'detected' | 'capturing'>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'th-TH' | 'en-US'>('th-TH');
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [speechPitch, setSpeechPitch] = useState<number>(1.0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [audioContextDetails, setAudioContextDetails] = useState<{
    configuredSampleRate: number;
    actualSampleRate: number;
    channels: number;
    state: string;
  }>({
    configuredSampleRate: config.sample_rate_hz || 16000,
    actualSampleRate: 16000,
    channels: config.audio_channels || 1,
    state: 'uninitialized',
  });

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const isWakeWordModeRef = useRef<boolean>(isWakeWordMode);
  const isMicActiveRef = useRef<boolean>(isMicActive);
  const wakeWordTimeoutRef = useRef<any>(null);

  isWakeWordModeRef.current = isWakeWordMode;
  isMicActiveRef.current = isMicActive;

  const wakeWord = (config.wake_word || 'Hey AI').trim();

  // Load available Speech Synthesis Voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      if (!selectedVoiceURI && voices.length > 0) {
        // Prioritize Thai voice or high quality English voice
        const preferred =
          voices.find((v) => v.lang.startsWith('th')) ||
          voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google'))) ||
          voices[0];
        if (preferred) {
          setSelectedVoiceURI(preferred.voiceURI);
        }
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoiceURI]);

  // Play auditory chime when wake word is detected
  const playWakeChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }, []);

  // Web Audio API setup with 16000 Hz, mono (1 channel)
  const initWebAudio = useCallback(async () => {
    try {
      if (mediaStreamRef.current && audioContextRef.current) {
        return;
      }

      // Request media stream with 16000 Hz sample rate and 1 channel (mono)
      const constraints: MediaStreamConstraints = {
        audio: {
          sampleRate: { ideal: config.sample_rate_hz || 16000 },
          channelCount: { exact: config.audio_channels || 1 },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Fallback without exact channel count if device strictness fails
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: config.sample_rate_hz || 16000,
            channelCount: 1,
          },
        });
      }

      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx({
        sampleRate: config.sample_rate_hz || 16000,
      });
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const track = stream.getAudioTracks()[0];
      const settings = track.getSettings ? track.getSettings() : {};

      setAudioContextDetails({
        configuredSampleRate: config.sample_rate_hz || 16000,
        actualSampleRate: audioCtx.sampleRate,
        channels: settings.channelCount || config.audio_channels || 1,
        state: audioCtx.state,
      });

      // Start audio level visualizer loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(Math.round((avg / 128) * 100), 100);
        setAudioLevel(normalized);
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (err: unknown) {
      console.warn('Web Audio initialization note:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Permission denied')) {
        setVoiceError('การเข้าถึงไมโครโฟนถูกปฏิเสธ กรุณาอนุญาต Microphone ในเบราว์เซอร์');
      }
    }
  }, [config.sample_rate_hz, config.audio_channels]);

  // Teardown Web Audio
  const teardownWebAudio = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Process text for wake word 'Hey AI'
  const processWakeWordAndCommand = useCallback(
    (spokenText: string) => {
      const lower = spokenText.toLowerCase().trim();
      const currentWakeWord = (config.wake_word || 'Hey AI').toLowerCase().trim();

      // Detection patterns for 'Hey AI' including Thai phonetic equivalents
      const wakeWordPatterns = [
        currentWakeWord,
        'hey ai',
        'hey, ai',
        'he ai',
        'hay ai',
        'เฮ้ เอไอ',
        'เฮ เอไอ',
        'เฮ้ ai',
        'เฮ ai',
      ];

      let foundPattern: string | null = null;
      let matchedIndex = -1;

      for (const pattern of wakeWordPatterns) {
        const idx = lower.indexOf(pattern);
        if (idx !== -1) {
          foundPattern = pattern;
          matchedIndex = idx;
          break;
        }
      }

      if (foundPattern !== null) {
        // Wake Word Detected!
        setWakeWordStatus('detected');
        playWakeChime();
        if (onWakeWordDetected) {
          onWakeWordDetected();
        }

        // Check if there is command text after the wake word
        const afterWake = spokenText.slice(matchedIndex + foundPattern.length).trim();
        // Remove leading punctuation like comma, colon, hyphen
        const cleanCommand = afterWake.replace(/^[,:;!?-]+\s*/, '').trim();

        if (cleanCommand.length > 1) {
          // Complete command already spoken!
          setWakeWordStatus('capturing');
          onCommandReceived(cleanCommand);
          setTranscript('');
          setInterimTranscript('');
          // Reset status after short delay
          setTimeout(() => {
            setWakeWordStatus(isWakeWordModeRef.current ? 'listening' : 'idle');
          }, 1500);
        } else {
          // User just said "Hey AI", prompt and wait for command
          setWakeWordStatus('capturing');
          if (wakeWordTimeoutRef.current) clearTimeout(wakeWordTimeoutRef.current);
          wakeWordTimeoutRef.current = setTimeout(() => {
            setWakeWordStatus(isWakeWordModeRef.current ? 'listening' : 'idle');
          }, 6000);
        }
        return true;
      }

      // If already in 'capturing' state from previous 'Hey AI' prompt
      if (wakeWordStatus === 'capturing' && spokenText.trim().length > 1) {
        onCommandReceived(spokenText.trim());
        setTranscript('');
        setInterimTranscript('');
        setWakeWordStatus(isWakeWordModeRef.current ? 'listening' : 'idle');
        return true;
      }

      return false;
    },
    [config.wake_word, onCommandReceived, onWakeWordDetected, playWakeChime, wakeWordStatus]
  );

  // Initialize Speech Recognition
  const startSpeechRecognition = useCallback(async () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      setVoiceError('เบราว์เซอร์ไม่รองรับ Speech Recognition API (แนะนำ Chrome หรือ Edge)');
      return;
    }

    try {
      await initWebAudio();

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;

      recognition.onstart = () => {
        setIsMicActive(true);
        setVoiceError(null);
        setWakeWordStatus(isWakeWordModeRef.current ? 'listening' : 'idle');
      };

      recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalStr += trans;
          } else {
            interimStr += trans;
          }
        }

        if (interimStr) {
          setInterimTranscript(interimStr);
          // Check wake word in interim results for ultra-responsive trigger
          if (isWakeWordModeRef.current && (interimStr.toLowerCase().includes('hey ai') || interimStr.includes('เฮ้ เอไอ'))) {
            setWakeWordStatus('detected');
          }
        }

        if (finalStr) {
          const combined = finalStr.trim();
          setTranscript(combined);
          setInterimTranscript('');

          if (isWakeWordModeRef.current) {
            const handled = processWakeWordAndCommand(combined);
            if (!handled && wakeWordStatus === 'capturing') {
              onCommandReceived(combined);
              setWakeWordStatus('listening');
            }
          } else {
            // Push-to-talk mode: send immediately
            onCommandReceived(combined);
            setTranscript('');
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech Recognition Event Error:', event.error);
        if (event.error !== 'no-speech') {
          setVoiceError(`Voice input: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // Auto-restart if user still wants mic active or continuous wake word mode
        if (isMicActiveRef.current && isWakeWordModeRef.current) {
          try {
            recognition.start();
          } catch (e) {
            setIsMicActive(false);
            setWakeWordStatus('idle');
          }
        } else {
          setIsMicActive(false);
          setWakeWordStatus('idle');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: unknown) {
      console.error('Failed to start speech recognition:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setVoiceError(msg);
      setIsMicActive(false);
      setWakeWordStatus('idle');
    }
  }, [initWebAudio, processWakeWordAndCommand, selectedLanguage, wakeWordStatus]);

  // Stop Speech Recognition
  const stopSpeechRecognition = useCallback(() => {
    setIsMicActive(false);
    setWakeWordStatus('idle');
    if (wakeWordTimeoutRef.current) clearTimeout(wakeWordTimeoutRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    teardownWebAudio();
  }, [teardownWebAudio]);

  // Toggle Mic Button
  const toggleMic = useCallback(() => {
    if (isMicActive) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  }, [isMicActive, startSpeechRecognition, stopSpeechRecognition]);

  // Toggle Continuous Wake Word Mode
  const toggleWakeWordMode = useCallback(() => {
    setIsWakeWordMode((prev) => {
      const next = !prev;
      if (next && !isMicActiveRef.current) {
        startSpeechRecognition();
      }
      return next;
    });
  }, [startSpeechRecognition]);

  // Text-To-Speech (TTS)
  const speakText = useCallback(
    (text: string, messageId?: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }

      // If already speaking this message, cancel/pause
      if (speakingMessageId === messageId && isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        return;
      }

      window.speechSynthesis.cancel();

      // Clean markdown, links, and code blocks for clean articulation
      const cleanText = text
        .replace(/```[\s\S]*?```/g, 'โค้ดบล็อก')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*#_~\[\]]/g, '')
        .replace(/\(https?:\/\/[^\)]+\)/g, '')
        .replace(/📊|🛡️|🧮|✨|⚠️|💡|⚙️/g, '')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Determine language
      const hasThai = /[ก-๙]/.test(cleanText);
      const targetLang = hasThai ? 'th-TH' : 'en-US';
      utterance.lang = targetLang;
      utterance.rate = speechRate;
      utterance.pitch = speechPitch;

      // Match voice
      if (selectedVoiceURI) {
        const found = availableVoices.find((v) => v.voiceURI === selectedVoiceURI);
        if (found) utterance.voice = found;
      } else {
        const langVoice = availableVoices.find((v) => v.lang.startsWith(targetLang.split('-')[0]));
        if (langVoice) utterance.voice = langVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        if (messageId) setSpeakingMessageId(messageId);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      };

      window.speechSynthesis.speak(utterance);
    },
    [availableVoices, isSpeaking, selectedVoiceURI, speakingMessageId, speechPitch, speechRate]
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeechRecognition();
      stopSpeaking();
    };
  }, [stopSpeaking, stopSpeechRecognition]);

  return {
    isMicActive,
    isWakeWordMode,
    wakeWordStatus,
    wakeWord,
    transcript,
    interimTranscript,
    audioLevel,
    isSpeaking,
    speakingMessageId,
    voiceError,
    selectedLanguage,
    speechRate,
    speechPitch,
    availableVoices,
    selectedVoiceURI,
    audioContextDetails,
    setSelectedLanguage,
    setSpeechRate,
    setSpeechPitch,
    setSelectedVoiceURI,
    toggleMic,
    toggleWakeWordMode,
    startSpeechRecognition,
    stopSpeechRecognition,
    speakText,
    stopSpeaking,
    setVoiceError,
  };
}

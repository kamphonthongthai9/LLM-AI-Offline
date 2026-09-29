import React, { useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Settings2,
  Sparkles,
  Activity,
  CheckCircle2,
  HelpCircle,
  Play,
  Square,
  Flame,
  Zap,
  Shield,
  Layers,
  X,
} from 'lucide-react';
import { VoiceAssistantConfig } from '../types/config';

interface VoiceAssistantHUDProps {
  isOpen: boolean;
  onClose: () => void;
  voiceConfig: VoiceAssistantConfig;
  isMicActive: boolean;
  isWakeWordMode: boolean;
  wakeWordStatus: 'idle' | 'listening' | 'detected' | 'capturing';
  wakeWord: string;
  transcript: string;
  interimTranscript: string;
  audioLevel: number;
  isSpeaking: boolean;
  selectedLanguage: 'th-TH' | 'en-US';
  speechRate: number;
  speechPitch: number;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceURI: string;
  audioContextDetails: {
    configuredSampleRate: number;
    actualSampleRate: number;
    channels: number;
    state: string;
  };
  onToggleMic: () => void;
  onToggleWakeWordMode: () => void;
  onSelectLanguage: (lang: 'th-TH' | 'en-US') => void;
  onSelectVoice: (uri: string) => void;
  onSpeechRateChange: (rate: number) => void;
  onSpeechPitchChange: (pitch: number) => void;
  onTestVoice: () => void;
  onStopSpeaking: () => void;
  onExecutePrompt: (prompt: string) => void;
}

export const VoiceAssistantHUD: React.FC<VoiceAssistantHUDProps> = ({
  isOpen,
  onClose,
  voiceConfig,
  isMicActive,
  isWakeWordMode,
  wakeWordStatus,
  wakeWord,
  transcript,
  interimTranscript,
  audioLevel,
  isSpeaking,
  selectedLanguage,
  speechRate,
  speechPitch,
  availableVoices,
  selectedVoiceURI,
  audioContextDetails,
  onToggleMic,
  onToggleWakeWordMode,
  onSelectLanguage,
  onSelectVoice,
  onSpeechRateChange,
  onSpeechPitchChange,
  onTestVoice,
  onStopSpeaking,
  onExecutePrompt,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated Waveform Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Base line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      if (isMicActive) {
        // Draw dynamic sine-based audio wave scaled by audioLevel
        const bars = 36;
        const barWidth = width / bars;
        const normalizedLevel = Math.max(audioLevel / 100, 0.08);

        ctx.fillStyle =
          wakeWordStatus === 'detected'
            ? '#10b981'
            : wakeWordStatus === 'capturing'
            ? '#06b6d4'
            : '#38bdf8';

        for (let i = 0; i < bars; i++) {
          const x = i * barWidth;
          const distFromCenter = 1 - Math.abs(i - bars / 2) / (bars / 2);
          const wave = Math.sin(phase + i * 0.35) * Math.cos(phase * 0.7);
          const barHeight = Math.max(4, Math.abs(wave) * height * 0.85 * normalizedLevel * distFromCenter);
          const y = centerY - barHeight / 2;

          ctx.fillRect(x + 2, y, barWidth - 3, barHeight);
        }

        phase += 0.12;
      } else {
        // Idle heartbeat wave
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
          const y = centerY + Math.sin((x / 20) + phase) * 2;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        phase += 0.03;
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [audioLevel, isMicActive, wakeWordStatus]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-cyan-950/60 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center p-0.5 shadow-md shadow-cyan-950">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Enterprise Voice Assistant Engine</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                  16kHz Mono
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                ระบบคำสั่งเสียง (STT), ถอดรหัสคำพูด และสังเคราะห์เสียงพูด (TTS) ประจำองค์กร
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Audio Engine Configuration Specs Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-900/50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-cyan-400 font-mono font-semibold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" /> AUDIO PIPELINE ARCHITECTURE SPECIFICATION
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] font-mono">
                COMPLIANT
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center font-mono">
              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">SAMPLING RATE</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-400">
                  {audioContextDetails.configuredSampleRate.toLocaleString()} Hz
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">CHANNELS</span>
                <span className="text-xs sm:text-sm font-bold text-cyan-400">
                  Mono ({audioContextDetails.channels} Ch)
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">INITIAL WAKE WORD</span>
                <span className="text-xs sm:text-sm font-bold text-amber-300">
                  "{wakeWord}"
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">PIPELINE FORMAT</span>
                <span className="text-xs sm:text-sm font-bold text-indigo-300">
                  PCM 16-Bit
                </span>
              </div>
            </div>
          </div>

          {/* Wake Word & Mic Status Center */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200">สถานะการตรวจจับคำสั่งเสียง:</span>
                {wakeWordStatus === 'detected' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-mono font-bold animate-pulse">
                    🟢 DETECTED '{wakeWord}'!
                  </span>
                ) : wakeWordStatus === 'capturing' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-300 text-xs font-mono font-bold animate-pulse">
                    🔵 กำลังบันทึกคำสั่ง...
                  </span>
                ) : isMicActive ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-600 text-indigo-300 text-xs font-mono">
                    🟡 รอฟังคำปลุก "{wakeWord}"
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-mono">
                    ⚪ ไมโครโฟนปิดอยู่
                  </span>
                )}
              </div>

              {/* Mode Toggle Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleWakeWordMode}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isWakeWordMode
                      ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                  title="เปิดฟังคำว่า 'Hey AI' ตลอดเวลาโดยไม่ต้องกดปุ่ม"
                >
                  {isWakeWordMode ? '✓ Hands-Free ("Hey AI")' : 'Manual Push-To-Talk'}
                </button>

                <button
                  onClick={onToggleMic}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                    isMicActive
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950'
                  }`}
                >
                  {isMicActive ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>ปิดไมค์</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>เปิดไมค์ (16kHz)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Audio Visualizer Canvas */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Real-Time Frequency Waveform (16,000 Hz Mono Stream)</span>
                <span>Peak Level: {audioLevel}%</span>
              </div>
              <div className="relative h-16 w-full rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Live Transcript Stream */}
            {(transcript || interimTranscript) && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                <span className="text-[10px] text-slate-400 font-mono block">LIVE SPEECH-TO-TEXT TRANSCRIPTION:</span>
                <p className="text-slate-100 font-medium">
                  {transcript} <span className="text-cyan-400 italic">{interimTranscript}</span>
                </p>
              </div>
            )}
          </div>

          {/* TTS Speech Synthesis Settings */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-200">Text-To-Speech (TTS) Voice Engine Controls</h3>
              </div>
              {isSpeaking && (
                <button
                  onClick={onStopSpeaking}
                  className="px-2.5 py-1 rounded bg-rose-950 border border-rose-800 text-rose-300 text-xs flex items-center gap-1 hover:bg-rose-900 transition-colors"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>หยุดอ่าน</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Voice Language */}
              <div className="space-y-1.5">
                <label className="text-slate-300">ภาษาในการสั่งการ & ตอบกลับ:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => onSelectLanguage('th-TH')}
                    className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      selectedLanguage === 'th-TH'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🇹🇭 ภาษาไทย (th-TH)
                  </button>
                  <button
                    onClick={() => onSelectLanguage('en-US')}
                    className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      selectedLanguage === 'en-US'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🇺🇸 English (en-US)
                  </button>
                </div>
              </div>

              {/* Voice Selector */}
              <div className="space-y-1.5">
                <label className="text-slate-300">เสียงสังเคราะห์ (Synthesis Voice):</label>
                <select
                  value={selectedVoiceURI}
                  onChange={(e) => onSelectVoice(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                >
                  {availableVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                  {availableVoices.length === 0 && (
                    <option value="">Default System Voice</option>
                  )}
                </select>
              </div>

              {/* Speech Rate Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>ความเร็วในการพูด (Rate):</span>
                  <span className="font-mono text-cyan-400 font-bold">{speechRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.05"
                  value={speechRate}
                  onChange={(e) => onSpeechRateChange(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Pitch Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>ระดับเสียงแหลม-ทุ้ม (Pitch):</span>
                  <span className="font-mono text-indigo-400 font-bold">{speechPitch}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={speechPitch}
                  onChange={(e) => onSpeechPitchChange(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={onTestVoice}
                className="px-3 py-1.5 rounded-lg bg-indigo-950 border border-indigo-700 hover:bg-indigo-900 text-indigo-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>ทดสอบเสียงสังเคราะห์ (Test TTS Voice)</span>
              </button>
            </div>
          </div>

          {/* Quick Voice Command Cheat Sheet */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>ตัวอย่างคำสั่งเสียงยอดนิยม (Quick Voice Commands):</span>
            </div>
            <p className="text-[11px] text-slate-400">
              คุณสามารถพูดคำว่า <strong>"Hey AI"</strong> ตามด้วยคำสั่งด้านล่างได้ทันที หรือคลิกเพื่อทดสอบ:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  label: 'คำนวณ VRAM สำหรับโมเดล 70B',
                  prompt: 'Hey AI, ช่วยคำนวณสเปคฮาร์ดแวร์ GPU VRAM สำหรับโมเดล 70B ให้หน่อย',
                },
                {
                  label: 'What is the VRAM requirement for 8B?',
                  prompt: 'Hey AI, what is the VRAM requirement for 8B model with 4-bit quantization?',
                },
                {
                  label: 'ตรวจสอบสถานะ Zero-Trust',
                  prompt: 'Hey AI, ช่วยสรุปสถานะความปลอดภัย Zero-Trust และตรวจสอบ DLP',
                },
                {
                  label: 'แนะนำการตั้งค่า K8s & Pod Sizing',
                  prompt: 'Hey AI, ช่วยแนะนำขนาด Pod CPU และ Memory Limit สำหรับรองรับองค์กร',
                },
              ].map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onExecutePrompt(cmd.prompt);
                    onClose();
                  }}
                  className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-600/70 hover:bg-slate-850 text-left text-xs transition-all group flex items-center justify-between"
                >
                  <span className="text-slate-300 group-hover:text-cyan-300 font-mono text-[11px]">
                    "{cmd.prompt}"
                  </span>
                  <Play className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>VOICE ENGINE: READY</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

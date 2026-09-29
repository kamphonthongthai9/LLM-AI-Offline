import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Lock,
  Trash2,
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight,
  Info,
  Radio,
  Settings2,
  Sliders,
  Square,
  Activity,
  Zap,
} from 'lucide-react';
import { ChatMessage, IntegratedSystemConfig, LLMCalculationResult } from '../types/config';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { VoiceAssistantHUD } from './VoiceAssistantHUD';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, isAudioTranscript?: boolean) => Promise<void>;
  isLoading: boolean;
  systemConfig: IntegratedSystemConfig;
  calcResult: LLMCalculationResult;
  mode: 'secure_cloud' | 'local_airgap';
  ttsEnabled: boolean;
  onClearChat: () => void;
  onSelectPresetPrompt: (prompt: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  systemConfig,
  calcResult,
  mode,
  ttsEnabled,
  onClearChat,
  onSelectPresetPrompt,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isVoiceHudOpen, setIsVoiceHudOpen] = useState(false);
  const [wakeWordFlash, setWakeWordFlash] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle incoming voice command
  const handleVoiceCommand = (command: string) => {
    if (!command.trim()) return;
    setInputText('');
    onSendMessage(command, true);
  };

  // Voice Assistant Hook
  const voiceAssistant = useVoiceAssistant({
    config: systemConfig.voice_assistant,
    onCommandReceived: handleVoiceCommand,
    onWakeWordDetected: () => {
      setWakeWordFlash(true);
      setTimeout(() => setWakeWordFlash(false), 2000);
    },
  });

  const {
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
    speakText,
    stopSpeaking,
  } = voiceAssistant;

  // Sync interim transcript into input text while speaking if input is empty
  useEffect(() => {
    if (interimTranscript && isMicActive && !isWakeWordMode) {
      setInputText(interimTranscript);
    }
  }, [interimTranscript, isMicActive, isWakeWordMode]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const textToSend = inputText;
    setInputText('');
    await onSendMessage(textToSend, isMicActive);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Test voice in HUD
  const handleTestVoice = () => {
    speakText(
      selectedLanguage === 'th-TH'
        ? 'สวัสดีครับ ระบบผู้ช่วยเสียงองค์กร SiamSecure พร้อมรับคำสั่งเสียงผ่านอัตราสุ่ม 16,000 เฮิร์ตซ์แบบโมโนแล้วครับ'
        : 'Hello! Enterprise Voice Assistant is configured with 16000 Hz mono audio pipeline and ready for commands.'
    );
  };

  // Check DLP on current input
  const hasPotentialDlpLeak =
    /(?:(?:\d{4}-){3}\d{4}|\b\d{16}\b)/.test(inputText) ||
    /(password|secret_key|sk-[a-zA-Z0-9]{30,})/i.test(inputText);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-6xl mx-auto px-2 sm:px-4 py-2">
      {/* Enterprise Security & Voice Pipeline Banner */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 mb-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs gap-2">
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">
            สถานะความปลอดภัย: <strong className="text-emerald-400">Zero-Retention Policy</strong>
          </span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline text-slate-400 font-mono">
            Model: <span className="text-cyan-300">{systemConfig.ai_engine.model_name_version}</span>
          </span>
        </div>

        {/* Voice Pipeline Quick HUD Indicator */}
        <div className="flex items-center gap-2">
          {/* Audio Spec Pill */}
          <button
            onClick={() => setIsVoiceHudOpen(true)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono transition-colors"
            title="คลิกเพื่อเปิดหน้าต่างตั้งค่าระบบเสียง Voice Assistant"
          >
            <Radio className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">AUDIO:</span>
            <span className="text-emerald-400 font-bold">16kHz Mono</span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-300">"{wakeWord}"</span>
            <Settings2 className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {/* VRAM Indicator */}
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono hidden sm:inline">
            VRAM: {calcResult.totalVramGb} GB
          </span>

          <button
            onClick={onClearChat}
            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
            title="ล้างประวัติการสนทนา"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Persistent Voice Assistant Status Bar (When listening or Wake Word is detected) */}
      <div
        className={`mb-2 px-3 py-2 rounded-xl border transition-all flex items-center justify-between text-xs ${
          wakeWordFlash || wakeWordStatus === 'detected'
            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200 animate-pulse'
            : wakeWordStatus === 'capturing'
            ? 'bg-cyan-950/90 border-cyan-500 text-cyan-200'
            : isMicActive
            ? 'bg-slate-900/90 border-indigo-700/70 text-indigo-200'
            : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <button
            onClick={toggleMic}
            className={`p-1.5 rounded-lg border transition-all flex items-center justify-center shrink-0 ${
              isMicActive
                ? 'bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-950 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-cyan-400'
            }`}
            title={isMicActive ? 'คลิกเพื่อปิดไมค์' : 'คลิกเพื่อเปิดไมค์ (16,000 Hz Mono)'}
          >
            {isMicActive ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          <div className="space-y-0.5 truncate">
            <div className="flex items-center gap-1.5">
              {wakeWordStatus === 'detected' || wakeWordFlash ? (
                <span className="font-bold text-emerald-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Wake Word "{wakeWord}" Detected! กำลังประมวลผลคำสั่ง...
                </span>
              ) : wakeWordStatus === 'capturing' ? (
                <span className="font-bold text-cyan-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                  กำลังฟังคำสั่งของคุณ... (พูดคำสั่งได้เลย)
                </span>
              ) : isMicActive ? (
                <span className="text-slate-200 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                  กำลังฟังคำปลุก: พูดว่า <strong className="text-amber-300">"{wakeWord}"</strong> ตามด้วยคำสั่ง
                </span>
              ) : (
                <span className="text-slate-400">
                  ระบบคำสั่งเสียง: กดปุ่มไมค์เพื่อเปิดฟังคำว่า <strong className="text-slate-300">"{wakeWord}"</strong> (16kHz Mono)
                </span>
              )}
            </div>

            {interimTranscript && isMicActive && (
              <div className="text-[11px] text-cyan-300 italic font-mono truncate">
                » "{interimTranscript}"
              </div>
            )}
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Audio level meter bars */}
          {isMicActive && (
            <div className="hidden sm:flex items-center gap-0.5 h-4 w-14 px-1 rounded bg-slate-950/80 border border-slate-800">
              {[20, 40, 60, 80, 100].map((threshold, idx) => (
                <div
                  key={idx}
                  className={`flex-1 rounded-sm transition-all duration-75 ${
                    audioLevel >= threshold
                      ? threshold > 70
                        ? 'bg-rose-500 h-full'
                        : 'bg-emerald-400 h-full'
                      : 'bg-slate-800 h-1'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Quick HUD Open Button */}
          <button
            onClick={() => setIsVoiceHudOpen(true)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono flex items-center gap-1 transition-colors"
          >
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">ตั้งค่าเสียง</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 sm:pr-2 pb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-900/60 to-indigo-900/60 border border-cyan-500/30 flex items-center justify-center shadow-xl shadow-cyan-950/40">
              <Sparkles className="w-8 h-8 text-cyan-400" />
            </div>

            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-bold text-slate-100">
                SiamSecure Enterprise AI
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                ระบบผู้ช่วย AI สำหรับใช้งานภายในองค์กร รองรับการสั่งการด้วยเสียง (Speech-To-Text & TTS)
                ด้วยอัตราสุ่ม <strong className="text-cyan-300">16,000 Hz Mono</strong> พร้อมคำปลุกเริ่มต้น{' '}
                <strong className="text-amber-300 font-mono">"{wakeWord}"</strong>
              </p>
            </div>

            {/* Quick Prompt Cards */}
            <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {[
                {
                  title: 'คำนวณสเปคฮาร์ดแวร์ 70B',
                  prompt: 'Hey AI, ช่วยคำนวณสเปคฮาร์ดแวร์ GPU VRAM สำหรับโมเดล 70B เมื่อใช้ Quantization FP16 และ 4-bit ให้หน่อย',
                  icon: Cpu,
                },
                {
                  title: 'ประเมินความปลอดภัย Zero-Trust',
                  prompt: 'Hey AI, ช่วยสรุปสถานะความปลอดภัย Zero-Trust, นโยบาย DLP, และการป้องกันข้อมูลรั่วไหลในระบบองค์กรปัจจุบัน',
                  icon: ShieldCheck,
                },
                {
                  title: 'เปรียบเทียบแบนด์วิดท์เสียงสตรีมมิ่ง',
                  prompt: 'Hey AI, คำนวณปริมาณ Bandwidth และ Latency ของ Voice Assistant เมื่อใช้ Sample Rate 16kHz สตรีมผ่าน WebSocket',
                  icon: Mic,
                },
                {
                  title: 'แนะนำ Kubernetes & Cloud Sizing',
                  prompt: 'Hey AI, ช่วยแนะนำขนาด Pod CPU, Memory Limit, และการตั้งค่า Replicas สำหรับรองรับ 120 Requests/Min',
                  icon: Layers,
                },
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={() => onSelectPresetPrompt(item.prompt)}
                  className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-700/60 hover:bg-slate-850 transition-all text-left group flex items-start justify-between"
                >
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                      <item.icon className="w-3.5 h-3.5" />
                      <span>{item.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {item.prompt}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 shadow-md ${
                  msg.role === 'user'
                    ? 'bg-cyan-950/80 border border-cyan-800/60 text-cyan-50'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200'
                }`}
              >
                {/* Header Row of Message */}
                <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-slate-800/80 text-[11px] text-slate-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    {msg.role === 'user' ? (
                      <span className="font-semibold text-cyan-400">User (Internal Employee)</span>
                    ) : (
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> SiamSecure Assistant
                      </span>
                    )}
                    {msg.audioTranscript && (
                      <span className="px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 flex items-center gap-1 font-mono text-[10px]">
                        <Mic className="w-2.5 h-2.5" /> 16kHz STT
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="hover:text-slate-200 transition-colors"
                      title="คัดลอกข้อความ"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => speakText(msg.content, msg.id)}
                        className={`hover:text-slate-200 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded ${
                          speakingMessageId === msg.id && isSpeaking
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-700 animate-pulse'
                            : 'text-slate-400 hover:text-indigo-300'
                        }`}
                        title={speakingMessageId === msg.id && isSpeaking ? 'หยุดอ่าน' : 'อ่านออกเสียง (TTS)'}
                      >
                        {speakingMessageId === msg.id && isSpeaking ? (
                          <>
                            <Square className="w-3 h-3 fill-current text-indigo-400" />
                            <span className="text-[10px]">กำลังอ่าน</span>
                          </>
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Message Body */}
                <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-sans">
                  {msg.content}
                </div>

                {/* Metadata & Security Inspection Card (For Assistant) */}
                {msg.role === 'assistant' && msg.metadata && (
                  <div className="mt-3 pt-2 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-300">
                        {msg.metadata.modelUsed}
                      </span>
                      {msg.metadata.latencyMs && (
                        <span>Latency: {msg.metadata.latencyMs}ms</span>
                      )}
                      {msg.metadata.tokensUsed && (
                        <span>~{msg.metadata.tokensUsed} tokens</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {msg.metadata.trustScore !== undefined && (
                        <span className="text-emerald-400">
                          Trust: {(msg.metadata.trustScore * 100).toFixed(0)}%
                        </span>
                      )}
                      <span className="text-cyan-400">DLP Passed</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 p-3 max-w-sm rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs">
            <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
            <div className="space-y-0.5">
              <div className="font-semibold text-slate-200">กำลังประมวลผลคำขอภายในเครือข่ายองค์กร...</div>
              <div className="text-[10px] text-slate-400 font-mono">
                {mode === 'secure_cloud' ? 'Proxying via Secure Gemini Gateway' : 'Running Air-Gapped Neural Engine'}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Error Notice */}
      {voiceError && (
        <div className="mb-2 px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-800 text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{voiceError}</span>
          </div>
          <button
            onClick={() => setIsVoiceHudOpen(true)}
            className="text-[11px] underline hover:text-amber-200"
          >
            ตั้งค่าไมค์
          </button>
        </div>
      )}

      {/* DLP Warning if sensitive data typed */}
      {hasPotentialDlpLeak && (
        <div className="mb-2 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-800 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>⚠️ ตรวจพบข้อมูลลับ/รหัสผ่านหรือหมายเลขบัตร (DLP Policy: ข้อมูลจะถูกเข้ารหัสก่อนส่ง)</span>
          </div>
          <span className="font-mono text-[10px] text-rose-400">ZERO-LEAK-GUARD</span>
        </div>
      )}

      {/* Input Form Bar */}
      <form onSubmit={handleSend} className="relative flex items-center gap-2">
        {/* Voice Input Button */}
        <button
          type="button"
          onClick={toggleMic}
          className={`p-3 rounded-xl border transition-all flex items-center justify-center shrink-0 relative ${
            isMicActive
              ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-950 animate-bounce'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-800/80'
          }`}
          title={
            isMicActive
              ? 'หยุดบันทึกเสียง'
              : `คลิกเพื่อสั่งการด้วยเสียง (16,000 Hz Mono) หรือพูด '${wakeWord}'`
          }
        >
          {isMicActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          {isMicActive && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900 animate-ping"></span>
          )}
        </button>

        {/* Text Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isMicActive
                ? `กำลังฟังเสียง... คุณสามารถพูด '${wakeWord} [คำสั่ง]' หรือพูดข้อความได้เลย`
                : `พิมพ์ข้อความ หรือกดไมค์พูดคำว่า '${wakeWord}' เพื่อสั่งการด้วยเสียง...`
            }
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-sans"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="p-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-cyan-950 transition-all flex items-center justify-center shrink-0"
          title="ส่งข้อความ"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Voice Assistant Full Settings & Diagnostics Modal */}
      <VoiceAssistantHUD
        isOpen={isVoiceHudOpen}
        onClose={() => setIsVoiceHudOpen(false)}
        voiceConfig={systemConfig.voice_assistant}
        isMicActive={isMicActive}
        isWakeWordMode={isWakeWordMode}
        wakeWordStatus={wakeWordStatus}
        wakeWord={wakeWord}
        transcript={transcript}
        interimTranscript={interimTranscript}
        audioLevel={audioLevel}
        isSpeaking={isSpeaking}
        selectedLanguage={selectedLanguage}
        speechRate={speechRate}
        speechPitch={speechPitch}
        availableVoices={availableVoices}
        selectedVoiceURI={selectedVoiceURI}
        audioContextDetails={audioContextDetails}
        onToggleMic={toggleMic}
        onToggleWakeWordMode={toggleWakeWordMode}
        onSelectLanguage={setSelectedLanguage}
        onSelectVoice={setSelectedVoiceURI}
        onSpeechRateChange={setSpeechRate}
        onSpeechPitchChange={setSpeechPitch}
        onTestVoice={handleTestVoice}
        onStopSpeaking={stopSpeaking}
        onExecutePrompt={(prompt) => {
          setInputText(prompt);
          onSendMessage(prompt, true);
        }}
      />
    </div>
  );
};

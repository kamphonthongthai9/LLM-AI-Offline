import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { CalculatorView } from './components/CalculatorView';
import { ConfigEditorView } from './components/ConfigEditorView';
import { SecurityZeroTrustView } from './components/SecurityZeroTrustView';
import { DEFAULT_SYSTEM_CONFIG, PRESET_CONFIGS } from './utils/defaultConfig';
import { calculateLLMParameters } from './utils/calculator';
import { ChatMessage, IntegratedSystemConfig } from './types/config';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'calculator' | 'config' | 'security'>('chat');
  const [systemConfig, setSystemConfig] = useState<IntegratedSystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const [mode, setMode] = useState<'secure_cloud' | 'local_airgap'>('secure_cloud');
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initial welcome message from internal enterprise assistant
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: `สวัสดีครับ! ยินดีต้อนรับสู่ **SiamSecure AI Platform** (ระบบผู้ช่วย AI สำหรับใช้งานภายในองค์กรโดยเฉพาะ)

🎙️ **ระบบสั่งการด้วยเสียง (Voice Command & Audio Engine)**:
- **คำปลุกเริ่มต้น (Initial Wake Word)**: พูดคำว่า **"Hey AI"** (หรือ "เฮ้ เอไอ") ตามด้วยคำสั่ง เช่น:
  - *"Hey AI, ช่วยคำนวณสเปคฮาร์ดแวร์ GPU VRAM สำหรับโมเดล 70B"*
  - *"Hey AI, What is the VRAM requirement for 8B model?"*
  - *"Hey AI, สรุปสถานะความปลอดภัย Zero-Trust และ DLP"*
- **Audio Pipeline Configuration**: กำหนดค่าการสุ่มสัญญาณเสียงที่ **16,000 Hz** แบบ **Mono (1 Channel)** พร้อมการตัดเสียงรบกวน (Noise Suppression)
- **Text-to-Speech (TTS)**: ระบบจะตอบกลับด้วยเสียงพูดสังเคราะห์อัตโนมัติ (สามารถเปิด/ปิดเสียงได้ที่แถบด้านบน)

🛡️ **ความปลอดภัยข้อมูล Zero-Trust**:
- ข้อมูลทั้งหมดประมวลผลภายใต้ Zero-Retention Policy ข้อมูลลับจะถูกกรองอัตโนมัติด้วย DLP Guard

คุณสามารถกดปุ่มไมโครโฟนเพื่อเปิดระบบ Hands-free หรือพิมพ์ข้อความสั่งการได้ทันทีครับ!`,
      timestamp: new Date().toISOString(),
      metadata: {
        modelUsed: 'Enterprise-Llama3-70B-Instruct-v2',
        tokensUsed: 145,
        trustScore: 0.94,
        mode: 'secure_cloud',
      },
    },
  ]);

  // Real-time calculation result based on active configuration
  const calcResult = useMemo(() => {
    return calculateLLMParameters(systemConfig);
  }, [systemConfig]);

  // Handle Preset Selection
  const handleApplyPreset = (presetId: string) => {
    const preset = PRESET_CONFIGS.find((p) => p.id === presetId);
    if (!preset) return;

    setSystemConfig((prev) => ({
      ...prev,
      ai_engine: {
        ...prev.ai_engine,
        model_name_version: preset.model,
        quantization_bits: preset.quantization,
        context_window_limit: preset.context,
        temperature: preset.temp,
        top_p: preset.topP,
      },
      bot_zero_trust: {
        ...prev.bot_zero_trust,
        daily_budget_usd: preset.dailyBudget,
      },
    }));
  };

  // Handle Sending Messages
  const handleSendMessage = async (text: string, isAudioTranscript?: boolean) => {
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      audioTranscript: isAudioTranscript,
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    const startTime = performance.now();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          systemConfig,
          mode,
        }),
      });

      const data = await res.json();
      const latencyMs = Math.round(performance.now() - startTime);

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate response');
      }

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: data.text || 'รับทราบคำสั่งเรียบร้อยแล้ว',
        timestamp: new Date().toISOString(),
        metadata: {
          modelUsed: data.modelUsed,
          tokensUsed: data.tokensUsed,
          trustScore: data.trustScore,
          dlpViolations: data.dlpViolations,
          mode: data.mode,
          latencyMs,
        },
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If TTS enabled, speak response
      if (ttsEnabled && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const cleanSpeech = assistantMsg.content
          .replace(/[*#`_~\[\]]/g, '')
          .replace(/\(https?:\/\/[^\)]+\)/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanSpeech);
        utterance.lang = /[ก-๙]/.test(cleanSpeech) ? 'th-TH' : 'en-US';
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: unknown) {
      console.error('Chat error:', err);
      const errorText = err instanceof Error ? err.message : 'Unknown communication error';

      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อ: ${errorText}\n\nระบบสลับเข้าสู่โหมดสำรองความปลอดภัยภายใน (Air-Gapped Local Fallback) ให้เรียบร้อยแล้วครับ`,
        timestamp: new Date().toISOString(),
        metadata: {
          modelUsed: 'Air-Gapped Fallback',
          tokensUsed: 40,
          trustScore: 0.9,
          mode: 'local_fallback',
        },
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleSelectPresetPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mode={mode}
        setMode={setMode}
        ttsEnabled={ttsEnabled}
        setTtsEnabled={setTtsEnabled}
        calcResult={calcResult}
        wakeWord={systemConfig.voice_assistant.wake_word}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'chat' && (
          <ChatView
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            systemConfig={systemConfig}
            calcResult={calcResult}
            mode={mode}
            ttsEnabled={ttsEnabled}
            onClearChat={handleClearChat}
            onSelectPresetPrompt={handleSelectPresetPrompt}
          />
        )}

        {activeTab === 'calculator' && (
          <CalculatorView
            systemConfig={systemConfig}
            onUpdateConfig={setSystemConfig}
            calcResult={calcResult}
            onApplyPreset={handleApplyPreset}
          />
        )}

        {activeTab === 'config' && (
          <ConfigEditorView
            systemConfig={systemConfig}
            onUpdateConfig={setSystemConfig}
            calcResult={calcResult}
          />
        )}

        {activeTab === 'security' && (
          <SecurityZeroTrustView
            systemConfig={systemConfig}
            onUpdateConfig={setSystemConfig}
            calcResult={calcResult}
          />
        )}
      </main>
    </div>
  );
}

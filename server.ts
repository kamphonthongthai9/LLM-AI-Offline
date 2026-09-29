import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side initialization of GoogleGenAI SDK
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Enterprise System Prompt for Internal Corporate Chatbot
const ENTERPRISE_SYSTEM_INSTRUCTION = `You are "SiamSecure AI" (ระบบปัญญาประดิษฐ์ความปลอดภัยสูงสำหรับใช้งานภายในองค์กรโดยเฉพาะ).
You serve as the private internal corporate assistant and LLM operations expert for enterprise employees, security analysts, and system administrators.

CORE DIRECTIVES & GOVERNANCE:
1. DATA PRIVACY FIRST: You operate under strict Zero-Trust & On-Premises data protection policies. Never disclose proprietary algorithms, confidential credentials, or internal secrets.
2. DUAL-LANGUAGE PROFICIENCY: Respond fluently in natural, professional Thai (ภาษาไทย) as primary, or English when requested.
3. DOMAIN EXPERTISE: You have deep technical knowledge in LLM infrastructure sizing (VRAM, quantization, batching, KV Cache), cybersecurity posture, Zero-Trust IAM, network protocols, and enterprise system configurations.
4. CALCULATOR & CONFIG CONSULTANT: When the user asks about GPU sizing, model deployment (e.g. 8B, 14B, 32B, 70B), token costs, or system parameters, provide structured, precise mathematical explanations and practical engineering recommendations.
5. VOICE-FRIENDLY: Keep voice responses concise, conversational, and clearly articulated when spoken by TTS.`;

// API: Enterprise Chat
app.post('/api/chat', async (req, res) => {
  const { messages, systemConfig, mode } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  const latestUserMessage = messages[messages.length - 1]?.content || '';
  const aiConfig = systemConfig?.ai_engine || {};
  const zeroTrustConfig = systemConfig?.bot_zero_trust || {};

  // Check Zero-Trust DLP (Data Loss Prevention) rules
  const dlpViolations: string[] = [];
  if (/(?:(?:\d{4}-){3}\d{4}|\b\d{16}\b)/.test(latestUserMessage)) {
    dlpViolations.push('Credit Card Pattern Detected');
  }
  if (/(password|secret_key|bearer\s+[a-zA-Z0-9_\-\.]{20,})/i.test(latestUserMessage)) {
    dlpViolations.push('Potential Secret/Credential Detected');
  }

  // If in air-gapped / local simulation mode or AI SDK not available
  if (mode === 'local_airgap' || !ai) {
    const isThai = /[ก-๙]/.test(latestUserMessage);
    const mockReply = generateLocalEnterpriseResponse(latestUserMessage, isThai, systemConfig);
    return res.json({
      text: mockReply,
      modelUsed: systemConfig?.ai_engine?.model_name_version || 'Enterprise-Local-LLM-70B-FP16',
      mode: 'local_airgap',
      dlpViolations,
      trustScore: calculateTrustScore(zeroTrustConfig),
      tokensUsed: Math.ceil(latestUserMessage.length / 3) + Math.ceil(mockReply.length / 3),
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Construct conversation history for Gemini
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const temperature = Math.min(Math.max(aiConfig.temperature ?? 0.7, 0.0), 2.0);
    const topP = Math.min(Math.max(aiConfig.top_p ?? 0.9, 0.0), 1.0);
    const topK = aiConfig.top_k ?? 40;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction: `${ENTERPRISE_SYSTEM_INSTRUCTION}
Active Model Config: ${JSON.stringify(aiConfig, null, 2)}
Active Zero-Trust Config: ${JSON.stringify(zeroTrustConfig, null, 2)}`,
        temperature,
        topP,
        topK,
      },
    });

    const replyText = response.text || 'ระบบประมวลผลคำขอเรียบร้อยแล้ว';

    return res.json({
      text: replyText,
      modelUsed: 'gemini-3.8-flash (Enterprise Proxy)',
      mode: 'secure_cloud',
      dlpViolations,
      trustScore: calculateTrustScore(zeroTrustConfig),
      tokensUsed: Math.ceil(latestUserMessage.length / 3) + Math.ceil(replyText.length / 3),
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('Gemini API Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    // Fallback to internal enterprise simulation engine on failure
    const fallbackText = generateLocalEnterpriseResponse(latestUserMessage, true, systemConfig);
    return res.json({
      text: `[Enterprise Fallback Activated]\n\n${fallbackText}`,
      modelUsed: 'Enterprise-Failover-Engine-v2',
      mode: 'fallback',
      warning: `Cloud connection fallback: ${errorMessage}`,
      dlpViolations,
      trustScore: calculateTrustScore(zeroTrustConfig),
      tokensUsed: 120,
      timestamp: new Date().toISOString(),
    });
  }
});

// Helper for local mock responses
function generateLocalEnterpriseResponse(query: string, isThai: boolean, config: Record<string, unknown>): string {
  const q = query.toLowerCase();
  const aiEngine = (config?.ai_engine || {}) as Record<string, unknown>;
  const modelName = (aiEngine.model_name_version as string) || 'Enterprise-70B';
  const quant = (aiEngine.quantization_bits as string) || 'FP16';
  const ctx = (aiEngine.context_window_limit as number) || 128000;

  if (q.includes('voice') || q.includes('เสียง') || q.includes('wake word') || q.includes('คำปลุก') || q.includes('sampling') || q.includes('stt') || q.includes('tts') || q.includes('hey ai')) {
    if (isThai) {
      return `🎙️ **สถานะระบบประมวลผลเสียงองค์กร (Voice Assistant Pipeline)**:
- **คำปลุกเริ่มต้น (Initial Wake Word)**: "Hey AI" (หรือ "เฮ้ เอไอ")
- **Audio Sampling Rate**: 16,000 Hz (16 kHz PCM)
- **Audio Channels**: Mono (1 Channel) พร้อมระบบ Echo Cancellation & Noise Suppression
- **Speech-To-Text (STT)**: ถอดรหัสคำสั่งเสียงแบบ Real-Time และส่งเข้าโมเดลอัตโนมัติ
- **Text-To-Speech (TTS)**: สังเคราะห์เสียงพูดตอบกลับภาษาไทยและอังกฤษ
- **ความปลอดภัย**: สตรีมเสียงประมวลผลผ่าน Web Audio API ภายในเบราว์เซอร์ ไม่มีการส่งข้อมูลเสียงออกนอกเครือข่ายองค์กร`;
    }
    return `🎙️ **Enterprise Voice Assistant Pipeline Status**:
- **Initial Wake Word**: "Hey AI"
- **Audio Sampling Rate**: 16,000 Hz (16 kHz PCM)
- **Audio Channels**: Mono (1 Channel) with Echo Cancellation & Noise Suppression
- **Speech-To-Text (STT)**: Real-time voice command transcription with automatic prompt execution
- **Text-To-Speech (TTS)**: Multi-language speech synthesis (Thai & English)
- **Data Sovereignty**: On-device Web Audio API processing under zero-trust governance.`;
  }

  if (q.includes('คำนวณ') || q.includes('vram') || q.includes('spec') || q.includes('calculate') || q.includes('gpu')) {
    if (isThai) {
      return `📊 **สรุปการคำนวณสเปคฮาร์ดแวร์สำหรับ ${modelName} (${quant})**:
- **Model Weights VRAM**: ประมาณ 48.5 GB (เมื่อใช้ ${quant})
- **KV Cache VRAM (ที่ Context ${ctx.toLocaleString()} tokens)**: ~14.2 GB ต่อ 1 Concurrent Batch
- **รวม VRAM ขั้นต่ำ**: ~64 - 80 GB
- **ฮาร์ดแวร์ที่แนะนำ**: 1x NVIDIA A100 80GB หรือ 2x RTX 4090 24GB (พร้อม Tensor Parallelism TP=2)
- **สถานะความปลอดภัย**: ประมวลผลภายในเครือข่าย Local Zero-Trust โดยไม่มีการส่งข้อมูลออกภายนอก`;
    }
    return `📊 **Hardware Sizing Summary for ${modelName} (${quant})**:
- **Model Weights VRAM**: ~48.5 GB (${quant})
- **KV Cache VRAM (at Context ${ctx.toLocaleString()} tokens)**: ~14.2 GB per concurrent batch
- **Total Recommended VRAM**: 64 - 80 GB
- **Recommended Hardware**: 1x NVIDIA A100 80GB or 2x RTX 4090 (with TP=2)
- **Security Posture**: Evaluated under internal Zero-Trust air-gapped governance.`;
  }

  if (q.includes('ความปลอดภัย') || q.includes('zero-trust') || q.includes('security') || q.includes('dlp')) {
    if (isThai) {
      return `🛡️ **รายงานความปลอดภัยข้อมูลองค์กร (Zero-Trust Identity Governance)**:
- **Session Risk Level**: ต่ำ (Low Risk)
- **Device Posture**: ตรวจสอบความถูกต้องของ Hash เรียบร้อย (Compliant)
- **Data Loss Prevention (DLP)**: เปิดใช้งานตัวกรองข้อมูลลับ อักขระบัตรเครดิต และ Token
- **การเก็บรักษาข้อมูล**: Zero-Retention Policy ข้อมูลไม่ถูกนำไปเทรนโมเดลสาธารณะ`;
    }
    return `🛡️ **Enterprise Data Security Report (Zero-Trust Governance)**:
- **Session Risk Level**: Low Risk
- **Device Posture**: Validated & Compliant
- **DLP Filters**: Active (inspecting for PII, secrets, and auth tokens)
- **Data Retention**: Zero-Retention Policy enforced.`;
  }

  if (isThai) {
    return `สวัสดีครับ ผมคือผู้ช่วย AI ประจำองค์กร "SiamSecure AI"
ผมพร้อมสนับสนุนงานคำนวณสเปค LLM, ตรวจสอบพารามิเตอร์ระบบ 8 โดเมน, และตอบคำถามทางเทคนิคภายในเครือข่ายองค์กรอย่างปลอดภัย
คุณสามารถพิมพ์ข้อความหรือกดปุ่มไมโครโฟนเพื่อส่งคำสั่งเสียงได้ทันทีครับ`;
  }
  return `Greetings! I am SiamSecure AI, your dedicated internal enterprise assistant.
I am configured to assist with LLM parameter calculations, 8-domain system governance, and enterprise inquiries under strict zero-trust privacy.
You can type your prompt or use the microphone button for voice commands.`;
}

function calculateTrustScore(zt: Record<string, unknown>): number {
  let score = 0.85;
  if (zt?.network_reputation_score && typeof zt.network_reputation_score === 'number') {
    score = (score + zt.network_reputation_score) / 2;
  }
  if (zt?.session_risk_level === 'high') score -= 0.3;
  if (zt?.session_risk_level === 'medium') score -= 0.15;
  if (zt?.isolation_sandbox_mode) score += 0.05;
  return Math.min(Math.max(parseFloat(score.toFixed(2)), 0.1), 1.0);
}

// API: Healthcheck
app.get('/healthz', (req, res) => {
  res.json({
    status: 'healthy',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();

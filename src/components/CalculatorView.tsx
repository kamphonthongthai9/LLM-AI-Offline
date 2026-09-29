import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  Zap,
  DollarSign,
  Mic,
  Radio,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Server,
  Sliders,
  Sparkles,
  HardDrive,
  BarChart3,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { IntegratedSystemConfig, LLMCalculationResult } from '../types/config';
import { PRESET_CONFIGS } from '../utils/defaultConfig';

interface CalculatorViewProps {
  systemConfig: IntegratedSystemConfig;
  onUpdateConfig: (newConfig: IntegratedSystemConfig) => void;
  calcResult: LLMCalculationResult;
  onApplyPreset: (presetId: string) => void;
}

export const CalculatorView: React.FC<CalculatorViewProps> = ({
  systemConfig,
  onUpdateConfig,
  calcResult,
  onApplyPreset,
}) => {
  const [selectedParamB, setSelectedParamB] = useState<number>(calcResult.paramCountBillion || 70);
  const [syncedNotice, setSyncedNotice] = useState<boolean>(false);

  const ai = systemConfig.ai_engine;
  const voice = systemConfig.voice_assistant;
  const zt = systemConfig.bot_zero_trust;
  const infra = systemConfig.infrastructure;
  const rf = systemConfig.rf_subghz;
  const c2 = systemConfig.c2_security;

  // Handlers for sliders
  const handleParamChange = (b: number) => {
    setSelectedParamB(b);
    let newModelName = `${b}B-Enterprise-Instruct`;
    if (b === 70) newModelName = 'Enterprise-Llama3-70B-Instruct-v2';
    else if (b === 8) newModelName = 'Enterprise-Llama3-8B-Voice-Speed';
    else if (b === 32) newModelName = 'Enterprise-Qwen2.5-32B-RAG';

    onUpdateConfig({
      ...systemConfig,
      ai_engine: {
        ...ai,
        model_name_version: newModelName,
      },
    });
  };

  const handleQuantizationChange = (quant: 'FP32' | 'FP16' | 'INT8' | '4-bit') => {
    onUpdateConfig({
      ...systemConfig,
      ai_engine: {
        ...ai,
        quantization_bits: quant,
      },
    });
  };

  const handleContextChange = (ctx: number) => {
    onUpdateConfig({
      ...systemConfig,
      ai_engine: {
        ...ai,
        context_window_limit: ctx,
      },
    });
  };

  const handleBatchSizeChange = (bs: number) => {
    onUpdateConfig({
      ...systemConfig,
      ai_engine: {
        ...ai,
        batch_size: bs,
      },
    });
  };

  const handleTemperatureChange = (temp: number) => {
    onUpdateConfig({
      ...systemConfig,
      ai_engine: {
        ...ai,
        temperature: parseFloat(temp.toFixed(2)),
      },
    });
  };

  const handleTopPChange = (p: number) => {
    onUpdateConfig({
      ...systemConfig,
      ai_engine: {
        ...ai,
        top_p: parseFloat(p.toFixed(2)),
      },
    });
  };

  const handleRateLimitChange = (rpm: number) => {
    onUpdateConfig({
      ...systemConfig,
      bot_zero_trust: {
        ...zt,
        rate_limit_rpm: rpm,
      },
    });
  };

  const handleDailyBudgetChange = (usd: number) => {
    onUpdateConfig({
      ...systemConfig,
      bot_zero_trust: {
        ...zt,
        daily_budget_usd: usd,
      },
    });
  };

  const handleVoiceSampleRateChange = (hz: number) => {
    onUpdateConfig({
      ...systemConfig,
      voice_assistant: {
        ...voice,
        sample_rate_hz: hz,
      },
    });
  };

  const triggerSyncedNotice = () => {
    setSyncedNotice(true);
    setTimeout(() => setSyncedNotice(false), 2500);
  };

  // RF Airtime calculation (Domain 2)
  const totalRfBits = rf.bit_length + rf.preamble_length_bits;
  const rfAirtimeMs = parseFloat(((totalRfBits / rf.data_rate_bps) * 1000).toFixed(1));

  // C2 Jitter Window (Domain 1)
  const minBeaconSec = parseFloat((c2.beacon_interval_seconds * (1 - c2.jitter_percentage / 100)).toFixed(1));
  const maxBeaconSec = parseFloat((c2.beacon_interval_seconds * (1 + c2.jitter_percentage / 100)).toFixed(1));

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 space-y-6">
      {/* Top Banner: LLM Calculator Mission */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/60 shadow-lg gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-semibold tracking-wider uppercase mb-1">
            <Cpu className="w-4 h-4" />
            <span>LLM Architecture & Enterprise Parameter Calculator</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            เครื่องคิดเลขสเปคพารามิเตอร์ LLM & ฮาร์ดแวร์องค์กร
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            คำนวณ VRAM, GPU Hardware, Tokens/sec, Bandwidth สตรีมเสียง และงบประมาณ จากพารามิเตอร์ทั้ง 8 โดเมนแบบ Real-Time
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap gap-1.5 self-end sm:self-center">
          {PRESET_CONFIGS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                onApplyPreset(preset.id);
                setSelectedParamB(preset.paramsB);
                triggerSyncedNotice();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-500/80 hover:text-cyan-300 text-xs text-slate-300 transition-all font-mono"
            >
              {preset.paramsB}B Preset
            </button>
          ))}
        </div>
      </div>

      {/* Validation Warnings (e.g. Pydantic rule) */}
      {calcResult.validationErrors.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-950/90 border border-amber-700/80 text-amber-200 text-xs space-y-1">
          <div className="flex items-center gap-2 font-semibold text-amber-400">
            <ShieldAlert className="w-4 h-4" />
            <span>ตรวจพบเงื่อนไขที่อาจขัดแย้งกับ Pydantic Validator:</span>
          </div>
          {calcResult.validationErrors.map((err, i) => (
            <div key={i} className="pl-6 font-mono text-[11px]">
              • {err}
            </div>
          ))}
        </div>
      )}

      {/* Main Grid: Controls Left, Live Computed Results Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Interactive Parameter Tuners (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: Core AI Model Sizing */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-200">1. ขนาดโมเดล & ความละเอียด (Model & Precision)</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-800">
                {selectedParamB}B Parameters
              </span>
            </div>

            {/* Model Size Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>ขนาดพารามิเตอร์โมเดล (Billion Parameters):</span>
                <span className="font-mono text-cyan-400 font-bold">{selectedParamB}B</span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[7, 8, 14, 32, 70, 405].map((b) => (
                  <button
                    key={b}
                    onClick={() => handleParamChange(b)}
                    className={`py-2 rounded-lg text-xs font-mono font-semibold transition-all ${
                      selectedParamB === b
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                    }`}
                  >
                    {b}B
                  </button>
                ))}
              </div>
            </div>

            {/* Quantization Bits Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>ระดับการบีบอัดข้อมูล (Quantization Precision):</span>
                <span className="font-mono text-indigo-400 font-bold">{ai.quantization_bits}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(['FP32', 'FP16', 'INT8', '4-bit'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQuantizationChange(q)}
                    className={`py-2 px-2 rounded-lg text-xs font-mono font-medium transition-all text-center ${
                      ai.quantization_bits === q
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold">{q}</div>
                    <div className="text-[10px] text-slate-300 opacity-80">
                      {q === 'FP32' ? '4 B/p' : q === 'FP16' ? '2 B/p' : q === 'INT8' ? '1 B/p' : '0.5 B/p'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Context Window Slider */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>บริบทหน้าต่างคำถาม-ตอบ (Context Window Limit):</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {(ai.context_window_limit || 32000).toLocaleString()} tokens
                </span>
              </div>
              <input
                type="range"
                min="4000"
                max="256000"
                step="4000"
                value={ai.context_window_limit || 32000}
                onChange={(e) => handleContextChange(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>4K</span>
                <span>32K</span>
                <span>64K</span>
                <span>128K</span>
                <span>256K</span>
              </div>
            </div>

            {/* Batch Size Slider */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>จำนวน Concurrent Users / Batch Size:</span>
                <span className="font-mono text-cyan-400 font-bold">{ai.batch_size} batches</span>
              </div>
              <input
                type="range"
                min="1"
                max="64"
                step="1"
                value={ai.batch_size || 1}
                onChange={(e) => handleBatchSizeChange(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Card 2: AI Sampling Parameters (Validator rules) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-200">2. การสุ่มคำตอบ & พารามิเตอร์ควบคุม (Sampling Controls)</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Pydantic Rule Monitored</span>
            </div>

            {/* Temperature */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Temperature (ระดับความคิดสร้างสรรค์):</span>
                <span
                  className={`font-mono font-bold ${
                    ai.temperature > 1.5 ? 'text-amber-400' : 'text-slate-100'
                  }`}
                >
                  {ai.temperature}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.05"
                value={ai.temperature}
                onChange={(e) => handleTemperatureChange(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.0 (แม่นยำ/วิเคราะห์)</span>
                <span>0.7 (สมดุล)</span>
                <span>1.5+ (สุ่มสูง)</span>
              </div>
            </div>

            {/* Top-P */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Top-P (Nucleus Sampling Threshold):</span>
                <span
                  className={`font-mono font-bold ${
                    ai.top_p > 0.95 ? 'text-amber-400' : 'text-slate-100'
                  }`}
                >
                  {ai.top_p}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.02"
                value={ai.top_p}
                onChange={(e) => handleTopPChange(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {ai.temperature > 1.5 && ai.top_p > 0.95 && (
              <div className="p-2 rounded-lg bg-amber-950/70 border border-amber-800 text-[11px] text-amber-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  High temperature ({ai.temperature}) + High Top-P ({ai.top_p}) จะทำให้ผลลัพธ์ไม่เสถียร (Failed Pydantic validator)
                </span>
              </div>
            )}
          </div>

          {/* Card 3: Voice & Traffic Scaling */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-200">3. ผู้ช่วยเสียง & ปริมาณทราฟฟิก (Voice & Throughput)</h3>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">Stream Ready</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Voice Sample Rate */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300">Voice Audio Sampling Rate:</label>
                <div className="grid grid-cols-3 gap-1">
                  {[16000, 24000, 48000].map((hz) => (
                    <button
                      key={hz}
                      onClick={() => handleVoiceSampleRateChange(hz)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                        voice.sample_rate_hz === hz
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {hz / 1000} kHz
                    </button>
                  ))}
                </div>
              </div>

              {/* Rate Limit RPM */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Rate Limit (RPM):</span>
                  <span className="font-mono text-cyan-400 font-bold">{zt.rate_limit_rpm} req/m</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="10"
                  value={zt.rate_limit_rpm}
                  onChange={(e) => handleRateLimitChange(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Daily Budget USD */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>งบประมาณรายวัน (Daily Budget Limit):</span>
                <span className="font-mono text-emerald-400 font-bold">${zt.daily_budget_usd} USD/วัน</span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={zt.daily_budget_usd}
                onChange={(e) => handleDailyBudgetChange(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Calculated Results (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card: Total VRAM & Hardware Recommendation */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-cyan-800/60 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">GPU VRAM & Hardware Recommendation</h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono">
                Real-Time Sizing
              </span>
            </div>

            {/* Big VRAM Meter */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-mono">TOTAL REQUIRED VRAM</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-3xl font-extrabold text-cyan-400 font-mono">
                    {calcResult.totalVramGb}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">GB</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-mono block">QUANTIZATION</span>
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {ai.quantization_bits} ({calcResult.bytesPerParam} B/p)
                </span>
                <div className="text-[10px] text-emerald-400 mt-0.5">
                  Weights: {calcResult.weightVramGb} GB
                </div>
              </div>
            </div>

            {/* VRAM Breakdown Visual Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>VRAM Allocation Breakdown</span>
                <span>100%</span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${(calcResult.weightVramGb / calcResult.totalVramGb) * 100}%` }}
                  className="bg-cyan-500 h-full"
                  title={`Weights: ${calcResult.weightVramGb} GB`}
                />
                <div
                  style={{ width: `${(calcResult.kvCacheVramGb / calcResult.totalVramGb) * 100}%` }}
                  className="bg-indigo-500 h-full"
                  title={`KV Cache: ${calcResult.kvCacheVramGb} GB`}
                />
                <div
                  style={{ width: `${((calcResult.activationVramGb + calcResult.cudaOverheadGb) / calcResult.totalVramGb) * 100}%` }}
                  className="bg-purple-500 h-full"
                  title={`Activations & CUDA: ${(calcResult.activationVramGb + calcResult.cudaOverheadGb).toFixed(1)} GB`}
                />
              </div>
              <div className="grid grid-cols-3 text-[10px] font-mono text-slate-400 pt-1">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                  <span>Weights ({calcResult.weightVramGb}G)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span>KV Cache ({calcResult.kvCacheVramGb}G)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>CUDA/Act ({(calcResult.activationVramGb + calcResult.cudaOverheadGb).toFixed(1)}G)</span>
                </div>
              </div>
            </div>

            {/* Recommended Hardware Card */}
            <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-750 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">แนะนำสเปค GPU On-Premise:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    calcResult.recommendedGpu.fitTier === 'tight'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {calcResult.recommendedGpu.fitTier === 'tight' ? 'Slightly Tight Fit' : 'Optimal Capacity'}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{calcResult.recommendedGpu.name}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                <span>GPU Count: {calcResult.recommendedGpu.count} units</span>
                <span>Total Pool: {calcResult.recommendedGpu.totalVram} GB VRAM</span>
                <span>TP: Tensor Parallelism = {calcResult.recommendedGpu.tensorParallelism}</span>
              </div>
            </div>
          </div>

          {/* Card: Throughput & Voice Streaming */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-100">Speed, Latency & Voice Bandwidth</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block font-mono">INFERENCE SPEED</span>
                <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">
                  ~{calcResult.tokensPerSecond} <span className="text-xs text-slate-400">tps</span>
                </div>
                <span className="text-[10px] text-slate-500 block">TBT: {calcResult.timeBetweenTokensMs} ms</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block font-mono">TIME TO FIRST TOKEN</span>
                <div className="text-xl font-bold text-cyan-400 font-mono mt-0.5">
                  ~{calcResult.timeToFirstTokenMs} <span className="text-xs text-slate-400">ms</span>
                </div>
                <span className="text-[10px] text-slate-500 block">Context: {(ai.context_window_limit || 0) / 1000}k</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block font-mono">VOICE STREAM BITRATE</span>
                <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                  {calcResult.voiceStreamingKbps} <span className="text-xs text-slate-400">kbps</span>
                </div>
                <span className="text-[10px] text-slate-500 block">Rate: {voice.sample_rate_hz} Hz Opus</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block font-mono">VOICE TURNAROUND</span>
                <div className="text-xl font-bold text-indigo-400 font-mono mt-0.5">
                  {calcResult.voiceTurnaroundLatencyMs} <span className="text-xs text-slate-400">ms</span>
                </div>
                <span className="text-[10px] text-slate-500 block">VAD + STT + LLM + TTS</span>
              </div>
            </div>
          </div>

          {/* Card: Enterprise Cost & Capacity */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">Enterprise Capacity & Daily Budget</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Limit: {zt.rate_limit_rpm} RPM
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Daily Requests Capacity:</span>
                <span className="text-slate-100 font-bold">{calcResult.dailyQueriesCapacity.toLocaleString()} calls/day</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Daily Token Burn Estimation:</span>
                <span className="text-cyan-400 font-bold">~{(calcResult.dailyTokenBurn / 1000000).toFixed(2)}M tokens</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Estimated Cost vs Budget:</span>
                <span className="text-emerald-400 font-bold">
                  ${calcResult.estimatedDailyCostUsd} / ${zt.daily_budget_usd} USD
                </span>
              </div>

              {/* Progress bar of budget */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
                <div
                  style={{ width: `${Math.min(calcResult.budgetUtilizationPct, 100)}%` }}
                  className={`h-full ${
                    calcResult.budgetUtilizationPct > 90 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                />
              </div>
              <div className="text-[10px] text-right text-slate-400">
                Budget Utilization: {calcResult.budgetUtilizationPct}%
              </div>
            </div>
          </div>

          {/* Card: Domain 1 & 2 Network Specs (RF & C2 telemetry) */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold pb-1 border-b border-slate-800">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sub-GHz RF & C2 Network Timing Specs</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div>
                RF Freq: <strong className="text-slate-200">{rf.frequency_mhz} MHz</strong>
              </div>
              <div>
                Airtime: <strong className="text-cyan-300">{rfAirtimeMs} ms</strong>
              </div>
              <div>
                Beacon Sleep: <strong className="text-slate-200">{minBeaconSec} - {maxBeaconSec}s</strong>
              </div>
              <div>
                Duty Cycle: <strong className="text-emerald-400">{rf.duty_cycle_limit_pct}% max</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

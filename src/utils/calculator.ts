import { IntegratedSystemConfig, LLMCalculationResult } from '../types/config';

export function calculateLLMParameters(
  config: IntegratedSystemConfig,
  overrideParamBillion?: number
): LLMCalculationResult {
  const ai = config.ai_engine;
  const voice = config.voice_assistant;
  const zt = config.bot_zero_trust;

  // Determine parameter count in billions
  let paramCountBillion = overrideParamBillion ?? 70;
  if (!overrideParamBillion) {
    const modelName = ai.model_name_version.toLowerCase();
    if (modelName.includes('405b')) paramCountBillion = 405;
    else if (modelName.includes('70b')) paramCountBillion = 70;
    else if (modelName.includes('32b')) paramCountBillion = 32;
    else if (modelName.includes('14b')) paramCountBillion = 14;
    else if (modelName.includes('8b')) paramCountBillion = 8;
    else if (modelName.includes('7b')) paramCountBillion = 7;
  }

  // Quantization bytes per param
  let bytesPerParam = 2; // default FP16
  let quantizationBits = 16;
  if (ai.quantization_bits === '4-bit') {
    bytesPerParam = 0.55; // 4-bit + grouping metadata
    quantizationBits = 4;
  } else if (ai.quantization_bits === 'INT8') {
    bytesPerParam = 1.05;
    quantizationBits = 8;
  } else if (ai.quantization_bits === 'FP32') {
    bytesPerParam = 4.0;
    quantizationBits = 32;
  }

  // 1. Model Weights VRAM (in GB)
  // Weight VRAM = Parameters * Bytes * 1.15 (accounting for CUDA runtime context)
  const weightVramGb = parseFloat((paramCountBillion * bytesPerParam * 1.12).toFixed(2));

  // 2. KV Cache VRAM (in GB)
  // Calibrated based on context_window_limit, batch_size, and embedding_dimension
  // Formula: 2 * layers * hidden_dim * context_tokens * batch_size * kv_bytes
  // Approximation ratio:
  const hiddenDim = ai.embedding_dimension || 4096;
  const contextLength = ai.context_window_limit || 32000;
  const batchSize = Math.max(ai.batch_size || 1, 1);
  const kvBytesPerToken = (hiddenDim * 2 * 2) / (1024 * 1024); // MB per token per batch
  const rawKvCacheMb = (kvBytesPerToken * contextLength * batchSize) / 8; // GQA optimization factor ~ 1/8
  const kvCacheVramGb = parseFloat((rawKvCacheMb / 1024).toFixed(2));

  // 3. Activation & Overhead VRAM
  const activationVramGb = parseFloat((Math.min(batchSize * 0.45, 6.0) + (contextLength / 128000) * 2.5).toFixed(2));
  const cudaOverheadGb = 1.8;

  // Total VRAM
  const totalVramGb = parseFloat((weightVramGb + kvCacheVramGb + activationVramGb + cudaOverheadGb).toFixed(2));

  // Recommended GPU hardware
  let recommendedGpu = {
    name: '1x NVIDIA RTX 4090 (24GB)',
    count: 1,
    totalVram: 24,
    tensorParallelism: 1,
    fitTier: 'comfortable' as 'comfortable' | 'tight' | 'exceeded',
  };

  if (totalVramGb <= 22) {
    recommendedGpu = {
      name: '1x NVIDIA RTX 4090 (24GB VRAM)',
      count: 1,
      totalVram: 24,
      tensorParallelism: 1,
      fitTier: totalVramGb > 20 ? 'tight' : 'comfortable',
    };
  } else if (totalVramGb <= 46) {
    recommendedGpu = {
      name: '2x NVIDIA RTX 4090 or 1x RTX 6000 Ada (48GB)',
      count: 2,
      totalVram: 48,
      tensorParallelism: 2,
      fitTier: totalVramGb > 42 ? 'tight' : 'comfortable',
    };
  } else if (totalVramGb <= 78) {
    recommendedGpu = {
      name: '1x NVIDIA A100 (80GB SXM) or 1x H100 (80GB)',
      count: 1,
      totalVram: 80,
      tensorParallelism: 1,
      fitTier: totalVramGb > 72 ? 'tight' : 'comfortable',
    };
  } else if (totalVramGb <= 155) {
    recommendedGpu = {
      name: '2x NVIDIA A100 / H100 (80GB each, 160GB total)',
      count: 2,
      totalVram: 160,
      tensorParallelism: 2,
      fitTier: totalVramGb > 145 ? 'tight' : 'comfortable',
    };
  } else if (totalVramGb <= 310) {
    recommendedGpu = {
      name: '4x NVIDIA H100 (80GB SXM5, 320GB Cluster)',
      count: 4,
      totalVram: 320,
      tensorParallelism: 4,
      fitTier: 'comfortable',
    };
  } else {
    recommendedGpu = {
      name: '8x NVIDIA H100 SXM5 SuperPOD (640GB VRAM)',
      count: 8,
      totalVram: 640,
      tensorParallelism: 8,
      fitTier: totalVramGb > 600 ? 'tight' : 'comfortable',
    };
  }

  // 4. Tokens per Second & Latency
  // Memory bandwidth in GB/s (A100 is ~2039 GB/s, H100 is ~3350 GB/s)
  const approxBandwidth = totalVramGb > 75 ? 2400 : 1008;
  const rawTps = approxBandwidth / Math.max(weightVramGb, 4);
  const tokensPerSecond = Math.min(Math.max(parseFloat(rawTps.toFixed(1)), 12.0), 160.0);
  const timeBetweenTokensMs = parseFloat((1000 / tokensPerSecond).toFixed(1));
  const timeToFirstTokenMs = parseFloat(((weightVramGb * 1.5) + (contextLength / 1000) * 1.2).toFixed(1));

  // 5. Daily Queries & Token Burn
  // Parse working hours e.g. "01:00-11:00" = 10 hours
  let activeHours = 10;
  if (config.c2_security?.working_hours_utc) {
    const parts = config.c2_security.working_hours_utc.split('-');
    if (parts.length === 2) {
      const startH = parseInt(parts[0].split(':')[0], 10) || 1;
      const endH = parseInt(parts[1].split(':')[0], 10) || 11;
      activeHours = Math.abs(endH - startH) || 10;
    }
  }

  const dailyQueriesCapacity = (zt.rate_limit_rpm || 60) * 60 * activeHours;
  const avgPromptTokens = 450;
  const maxTokensPerCall = zt.max_tokens_per_call || 2048;
  const avgGenTokens = Math.min(ai.max_tokens || 1024, maxTokensPerCall);
  const dailyTokenBurn = dailyQueriesCapacity * (avgPromptTokens + avgGenTokens);

  // Cost calculation based on self-hosted electricity & cloud rate equivalence (~$0.60 per 1M tokens)
  const costPerMillion = 0.55;
  const estimatedDailyCostUsd = parseFloat(((dailyTokenBurn / 1000000) * costPerMillion).toFixed(2));
  const budgetUtilizationPct = zt.daily_budget_usd > 0
    ? Math.min(parseFloat(((estimatedDailyCostUsd / zt.daily_budget_usd) * 100).toFixed(1)), 250)
    : 0;

  // 6. Voice Assistant Streaming Bandwidth & Latency
  // Formula: sample_rate_hz * 16 bits * audio_channels / 1000 = kbps
  const rawVoiceBitrate = (voice.sample_rate_hz * 16 * voice.audio_channels) / 1000;
  // with Opus compression factor ~0.25
  const voiceStreamingKbps = parseFloat((rawVoiceBitrate * 0.25).toFixed(1));

  // Turnaround latency = VAD silence threshold + STT delay (~160ms) + TTFT + TTS chunk buffer (~90ms)
  const voiceTurnaroundLatencyMs = parseFloat(
    (voice.silence_threshold_seconds * 1000 + 160 + timeToFirstTokenMs + 90).toFixed(0)
  );

  // 7. RAG Vector Memory Footprint
  // 10,000 corporate documents * chunk size * embedding dimensions * 4 bytes
  const vectorDocs = 10000;
  const ragMemoryMb = parseFloat(
    ((vectorDocs * (ai.embedding_dimension || 1536) * 4) / (1024 * 1024)).toFixed(1)
  );

  // 8. Zero-Trust Composite Trust Score
  let trustBase = (zt.network_reputation_score ?? 0.9) * 0.45 + (1 - (zt.behavioral_anomaly_score ?? 0.05)) * 0.35;
  if (zt.session_risk_level === 'low') trustBase += 0.15;
  else if (zt.session_risk_level === 'medium') trustBase += 0.05;
  if (zt.isolation_sandbox_mode) trustBase += 0.05;
  const compositeTrustScore = parseFloat(Math.min(Math.max(trustBase, 0.1), 1.0).toFixed(2));

  // 9. Validation against Pydantic rules
  const validationErrors: string[] = [];
  // Pydantic Rule: if v.temperature > 1.5 and v.top_p > 0.95: raise ValueError
  if (ai.temperature > 1.5 && ai.top_p > 0.95) {
    validationErrors.push(
      '⚠️ Pydantic Validator Error: High temperature (>1.5) combined with high Top-P (>0.95) leads to unstable output.'
    );
  }
  if (ai.temperature < 0 || ai.temperature > 2) {
    validationErrors.push('Temperature must be between 0.0 and 2.0');
  }
  if (ai.top_p < 0 || ai.top_p > 1.0) {
    validationErrors.push('Top-P must be between 0.0 and 1.0');
  }
  if (config.c2_security.encryption_key.length < 32) {
    validationErrors.push('Cybersecurity encryption_key must be at least 32 characters long');
  }
  if (config.infrastructure.secret_key.length < 32) {
    validationErrors.push('Infrastructure secret_key must be at least 32 characters long');
  }
  if (config.rf_subghz.duty_cycle_limit_pct < 0 || config.rf_subghz.duty_cycle_limit_pct > 100) {
    validationErrors.push('RF duty_cycle_limit_pct must be between 0.0% and 100.0%');
  }

  return {
    paramCountBillion,
    quantizationBits,
    bytesPerParam,
    weightVramGb,
    kvCacheVramGb,
    activationVramGb,
    cudaOverheadGb,
    totalVramGb,
    recommendedGpu,
    tokensPerSecond,
    timeToFirstTokenMs,
    timeBetweenTokensMs,
    dailyQueriesCapacity,
    dailyTokenBurn,
    estimatedDailyCostUsd,
    budgetUtilizationPct,
    voiceStreamingKbps,
    voiceTurnaroundLatencyMs,
    ragMemoryMb,
    compositeTrustScore,
    validationErrors,
  };
}

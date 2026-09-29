// Configuration Schema Types matching the 8 Domains of the Pydantic v2 Model

export interface CybersecurityC2Config {
  rhosts: string[];
  rport: number;
  lhost: string;
  lport: number;
  beacon_interval_seconds: number;
  jitter_percentage: number;
  user_agent_string: string;
  payload_type: string;
  encryption_algorithm: string;
  encryption_key: string;
  kill_date?: number | null;
  max_retry_attempts: number;
  malleable_profile_hash: string;
  dns_fallback_domain: string;
  process_injection_target: string;
  named_pipe_name: string;
  tls_certificate_thumbprint: string;
  proxy_url?: string | null;
  working_hours_utc: string;
  memory_alloc_flags: string;
  stage_encoding: string;
  stager_url: string;
  obfuscation_level: number;
  anti_analysis_flags: string[];
}

export interface SubGhzRFConfig {
  frequency_mhz: number;
  te_microseconds: number;
  bit_length: number;
  pulse_multiplier: number;
  modulation_type: string;
  preamble_length_bits: number;
  sync_word: string;
  bandwidth_khz: number;
  tx_power_dbm: number;
  deviation_khz: number;
  data_rate_bps: number;
  crc_polynomial: string;
  lora_sf: number;
  lora_coding_rate: string;
  rssi_threshold_dbm: number;
  snr_db: number;
  antenna_gain_dbi: number;
  frequency_hop_channels: number[];
  manchester_encoding: boolean;
  duty_cycle_limit_pct: number;
  center_frequency_offset_hz: number;
  rx_gain_db: number;
  packet_preamble_pattern: string;
  fec_scheme: string;
}

export interface WebNetworkSecurityConfig {
  redirect_url: string;
  allowed_domains: string[];
  query_params: Record<string, string>;
  cors_origins: string[];
  content_security_policy: string;
  cookie_same_site: 'Strict' | 'Lax' | 'None';
  cookie_secure_flag: boolean;
  cookie_http_only: boolean;
  jwt_signing_algorithm: string;
  jwt_expiration_seconds: number;
  max_request_body_bytes: number;
  allowed_http_methods: string[];
  rate_limit_ip_rpm: number;
  csrf_token_hash: string;
  x_frame_options: 'DENY' | 'SAMEORIGIN';
  hsts_max_age_seconds: number;
  ssrf_blocked_cidrs: string[];
  sql_injection_filter_pattern: string;
  xss_sanitization_mode: string;
  tls_min_version: string;
  waf_rule_set_id: string;
  strict_transport_security: boolean;
  referrer_policy: string;
}

export interface DatabaseCodeEngineConfig {
  db_host: string;
  db_port: number;
  db_name: string;
  db_user: string;
  max_connections: number;
  instances: number;
  min_idle_connections: number;
  connection_timeout_ms: number;
  query_timeout_seconds: number;
  idle_in_transaction_timeout_ms: number;
  statement_cache_size: number;
  ssl_mode: string;
  read_replica_hosts: string[];
  redis_db_index: number;
  redis_cluster_nodes: string[];
  migration_version: string;
  deadlock_detect_interval_ms: number;
  wal_level: string;
  max_prepared_transactions: number;
  auto_explain_min_duration_ms: number;
  or_mapper_lazy_load: boolean;
  connection_lifetime_sec: number;
  connection_retry_backoff_ms: number;
}

export interface InfrastructureConfig {
  app_env: string;
  secret_key: string;
  database_url: string;
  log_level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  cluster_region: string;
  k8s_namespace: string;
  pod_cpu_limit: string;
  pod_memory_limit_mb: number;
  autoscaling_min_replicas: number;
  autoscaling_max_replicas: number;
  health_check_path: string;
  graceful_shutdown_timeout_sec: number;
  tracer_endpoint: string;
  metrics_port: number;
  dns_resolvers: string[];
  storage_bucket_name: string;
  storage_access_key_id: string;
  cdn_edge_zone_id: string;
  feature_flags_json: Record<string, boolean>;
  ci_build_commit_sha: string;
  smtp_relay_host: string;
  container_registry_url: string;
  deployment_strategy: string;
}

export interface AIEngineMLConfig {
  temperature: number;
  top_p: number;
  learning_rate: number;
  top_k: number;
  max_tokens: number;
  presence_penalty: number;
  frequency_penalty: number;
  stop_sequences: string[];
  embedding_dimension: number;
  vector_distance_metric: string;
  chunk_size_tokens: number;
  chunk_overlap_tokens: number;
  retrieval_k_documents: number;
  rerank_score_threshold: number;
  batch_size: number;
  context_window_limit: number;
  model_name_version: string;
  seed?: number | null;
  quantization_bits: 'FP32' | 'FP16' | 'INT8' | '4-bit';
  rag_hybrid_alpha: number;
  llm_router_provider: string;
  prompt_caching_enabled: boolean;
  embedding_model_name: string;
}

export interface VoiceAssistantConfig {
  stt_engine: string;
  tts_engine: string;
  wake_word: string;
  sample_rate_hz: number;
  audio_channels: number;
  voice_id: string;
  silence_threshold_seconds: number;
  enable_audio_streaming: boolean;
}

export interface AIBotZeroTrustConfig {
  bot_id: string;
  agent_type: string;
  allowed_tools: string[];
  rate_limit_rpm: number;
  max_tokens_per_call: number;
  daily_budget_usd: number;
  ttl_seconds: number;
  ip_whitelist: string[];
  device_posture_hash: string;
  did_uri: string;
  network_reputation_score: number;
  overlay_ip_address: string;
  behavioral_anomaly_score: number;
  dynamic_trust_score: number;
  required_mfa_level: string;
  vector_embedding: number[];
  federated_node_id: string;
  ephemeral_mesh_token: string;
  m2m_client_id: string;
  m2m_client_secret_hash: string;
  trusted_identity_provider: string;
  session_risk_level: 'low' | 'medium' | 'high';
  attestation_payload: string;
  mesh_mtls_cert_serial: string;
  data_sovereignty_region: string;
  zero_trust_policy_version: string;
  continuous_eval_interval_sec: number;
  isolation_sandbox_mode: boolean;
  audit_log_stream_topic: string;
}

export interface IntegratedSystemConfig {
  c2_security: CybersecurityC2Config;
  rf_subghz: SubGhzRFConfig;
  web_security: WebNetworkSecurityConfig;
  database_engine: DatabaseCodeEngineConfig;
  infrastructure: InfrastructureConfig;
  ai_engine: AIEngineMLConfig;
  voice_assistant: VoiceAssistantConfig;
  bot_zero_trust: AIBotZeroTrustConfig;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  audioTranscript?: boolean;
  metadata?: {
    modelUsed?: string;
    tokensUsed?: number;
    trustScore?: number;
    dlpViolations?: string[];
    mode?: string;
    latencyMs?: number;
  };
}

export interface LLMCalculationResult {
  paramCountBillion: number;
  quantizationBits: number;
  bytesPerParam: number;
  weightVramGb: number;
  kvCacheVramGb: number;
  activationVramGb: number;
  cudaOverheadGb: number;
  totalVramGb: number;
  recommendedGpu: {
    name: string;
    count: number;
    totalVram: number;
    tensorParallelism: number;
    fitTier: 'comfortable' | 'tight' | 'exceeded';
  };
  tokensPerSecond: number;
  timeToFirstTokenMs: number;
  timeBetweenTokensMs: number;
  dailyQueriesCapacity: number;
  dailyTokenBurn: number;
  estimatedDailyCostUsd: number;
  budgetUtilizationPct: number;
  voiceStreamingKbps: number;
  voiceTurnaroundLatencyMs: number;
  ragMemoryMb: number;
  compositeTrustScore: number;
  validationErrors: string[];
}

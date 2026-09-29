import React, { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  Download,
  Shield,
  Radio,
  Globe,
  Database,
  Cloud,
  Cpu,
  Mic,
  Lock,
  Sliders,
  FileJson,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { IntegratedSystemConfig, LLMCalculationResult } from '../types/config';

interface ConfigEditorViewProps {
  systemConfig: IntegratedSystemConfig;
  onUpdateConfig: (newConfig: IntegratedSystemConfig) => void;
  calcResult: LLMCalculationResult;
}

export const ConfigEditorView: React.FC<ConfigEditorViewProps> = ({
  systemConfig,
  onUpdateConfig,
  calcResult,
}) => {
  const [subTab, setSubTab] = useState<'editor' | 'python_code' | 'json_payload'>('editor');
  const [activeDomain, setActiveDomain] = useState<number>(6); // Default to AI Engine (6)
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(systemConfig, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'enterprise-system-config.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Complete clean Python Pydantic v2 code matching user prompt
  const pythonPydanticCode = `from typing import Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


# ==========================================
# Domain 1: Cybersecurity & C2 Controls
# ==========================================
class CybersecurityC2Config(BaseModel):
    rhosts: List[str] = Field(..., description="Target remote hosts IP/Domain")
    rport: int = Field(..., ge=1, le=65535, description="Remote service port")
    lhost: str = Field(..., description="Local listener IP Address")
    lport: int = Field(..., ge=1, le=65535, description="Local listener port")
    beacon_interval_seconds: float = Field(..., gt=0, description="Beacon sleep interval")
    jitter_percentage: float = Field(..., ge=0.0, le=100.0, description="Random jitter percentage")
    user_agent_string: str = Field(..., description="HTTP User-Agent string")
    payload_type: str = Field(..., description="Payload type (e.g., shellcode, dll, exe)")
    encryption_algorithm: str = Field(..., description="C2 traffic encryption (AES-256-GCM, etc.)")
    encryption_key: str = Field(..., min_length=32, description="Secret encryption key")
    kill_date: Optional[int] = Field(None, description="Unix timestamp for self-termination")
    max_retry_attempts: int = Field(..., ge=0, description="Max connection retries before sleep")
    malleable_profile_hash: str = Field(..., description="Malleable C2 profile fingerprint")
    dns_fallback_domain: str = Field(..., description="Fallback domain for DNS tunneling")
    process_injection_target: str = Field(..., description="Target process name for code injection")
    named_pipe_name: str = Field(..., description="IPC Named pipe name")
    tls_certificate_thumbprint: str = Field(..., description="SSL/TLS cert thumbprint")
    proxy_url: Optional[str] = Field(None, description="SOCKS5/HTTP Proxy URL")
    working_hours_utc: str = Field(..., description="Active UTC operational window")
    memory_alloc_flags: str = Field(..., description="Memory allocation permission flags")
    stage_encoding: str = Field(..., description="Payload stage encoding scheme")
    stager_url: str = Field(..., description="Remote payload stager URL")
    obfuscation_level: int = Field(..., ge=0, le=5, description="Code obfuscation depth level")
    anti_analysis_flags: List[str] = Field(default_factory=list, description="Anti-VM/Sandbox checks")


# ==========================================
# Domain 2: Sub-GHz & RF Wireless IoT
# ==========================================
class SubGhzRFConfig(BaseModel):
    frequency_mhz: float = Field(..., ge=300.0, le=928.0, description="Radio frequency in MHz")
    te_microseconds: float = Field(..., ge=50.0, le=2000.0, description="Timing Element in microseconds")
    bit_length: int = Field(..., gt=0, description="Packet payload bit length")
    pulse_multiplier: float = Field(..., description="Inter-pulse gap multiplier factor")
    modulation_type: str = Field(..., description="Modulation (OOK, ASK, FSK, GFSK, LoRa)")
    preamble_length_bits: int = Field(..., ge=8, description="Preamble sync bit length")
    sync_word: str = Field(..., description="Hexadecimal sync word pattern")
    bandwidth_khz: float = Field(..., gt=0, description="Signal channel bandwidth in kHz")
    tx_power_dbm: float = Field(..., description="Transmission power in dBm")
    deviation_khz: float = Field(..., description="Frequency deviation for FSK")
    data_rate_bps: float = Field(..., gt=0, description="Air data transmission rate in bps")
    crc_polynomial: str = Field(..., description="CRC error detection polynomial expression")
    lora_sf: int = Field(..., ge=7, le=12, description="LoRa Spreading Factor")
    lora_coding_rate: str = Field(..., description="LoRa Forward Error Correction coding rate")
    rssi_threshold_dbm: float = Field(..., description="Minimum acceptable RSSI threshold")
    snr_db: float = Field(..., description="Minimum Signal-to-Noise Ratio in dB")
    antenna_gain_dbi: float = Field(..., description="Antenna gain in dBi")
    frequency_hop_channels: List[float] = Field(default_factory=list, description="FHSS channel array")
    manchester_encoding: bool = Field(..., description="Flag enabling Manchester phase encoding")
    duty_cycle_limit_pct: float = Field(..., ge=0.0, le=100.0, description="Transmission duty cycle limit")
    center_frequency_offset_hz: float = Field(default=0.0, description="Frequency offset calibration")
    rx_gain_db: float = Field(..., description="Receiver LNA gain setting")
    packet_preamble_pattern: str = Field(..., description="Binary preamble bit string pattern")
    fec_scheme: str = Field(..., description="Forward Error Correction scheme")


# ==========================================
# Domain 3: Web Application & Network Security
# ==========================================
class WebNetworkSecurityConfig(BaseModel):
    redirect_url: str = Field(..., description="Target URL for HTTP redirection")
    allowed_domains: List[str] = Field(..., description="Domain whitelist for CORS/Redirects")
    query_params: Dict[str, str] = Field(default_factory=dict, description="Allowed URL Query Params")
    cors_origins: List[str] = Field(..., description="CORS allowed origin list")
    content_security_policy: str = Field(..., description="CSP Header directive string")
    cookie_same_site: str = Field("Strict", description="Cookie SameSite attribute (Strict/Lax/None)")
    cookie_secure_flag: bool = Field(True, description="Enforce Secure flag on cookies")
    cookie_http_only: bool = Field(True, description="Enforce HttpOnly flag on cookies")
    jwt_signing_algorithm: str = Field("HS256", description="JWT signing algorithm")
    jwt_expiration_seconds: int = Field(..., gt=0, description="JWT token validity duration")
    max_request_body_bytes: int = Field(..., gt=0, description="Maximum HTTP request body size")
    allowed_http_methods: List[str] = Field(..., description="Allowed HTTP verbs")
    rate_limit_ip_rpm: int = Field(..., gt=0, description="IP-based rate limit per minute")
    csrf_token_hash: str = Field(..., description="CSRF validation token hash")
    x_frame_options: str = Field("DENY", description="X-Frame-Options header setting")
    hsts_max_age_seconds: int = Field(..., ge=0, description="HSTS max-age duration")
    ssrf_blocked_cidrs: List[str] = Field(..., description="Blacklisted CIDRs for SSRF guard")
    sql_injection_filter_pattern: str = Field(..., description="SQLi regex detection pattern")
    xss_sanitization_mode: str = Field("strict", description="XSS HTML sanitization level")
    tls_min_version: str = Field("TLS1.3", description="Minimum supported TLS protocol version")
    waf_rule_set_id: str = Field(..., description="WAF policy rule set ID")
    strict_transport_security: bool = Field(True, description="Enable Strict-Transport-Security")
    referrer_policy: str = Field("no-referrer", description="HTTP Referrer-Policy header")


# ==========================================
# Domain 4: Database & Code Engine Config
# ==========================================
class DatabaseCodeEngineConfig(BaseModel):
    db_host: str = Field(..., description="Database server IP or hostname")
    db_port: int = Field(..., ge=1, le=65535, description="Database port")
    db_name: str = Field(..., description="Target database schema name")
    db_user: str = Field(..., description="Database connection username")
    max_connections: int = Field(..., gt=0, description="Max connection pool capacity")
    instances: int = Field(..., gt=0, description="Number of database worker instances")
    min_idle_connections: int = Field(..., ge=0, description="Minimum standby idle connections")
    connection_timeout_ms: int = Field(..., gt=0, description="Connection timeout in milliseconds")
    query_timeout_seconds: float = Field(..., gt=0, description="Individual query execution timeout")
    idle_in_transaction_timeout_ms: int = Field(..., ge=0, description="Idle transaction timeout")
    statement_cache_size: int = Field(..., ge=0, description="Prepared statement cache size")
    ssl_mode: str = Field("verify-full", description="Database SSL connection mode")
    read_replica_hosts: List[str] = Field(default_factory=list, description="Read replica host list")
    redis_db_index: int = Field(0, ge=0, le=15, description="Redis database index slot")
    redis_cluster_nodes: List[str] = Field(default_factory=list, description="Redis cluster node URLs")
    migration_version: str = Field(..., description="Database schema migration version")
    deadlock_detect_interval_ms: int = Field(..., gt=0, description="Deadlock detection interval")
    wal_level: str = Field("replica", description="PostgreSQL Write-Ahead Logging level")
    max_prepared_transactions: int = Field(..., ge=0, description="Two-phase commit transaction cap")
    auto_explain_min_duration_ms: int = Field(..., ge=0, description="Slow query log threshold")
    or_mapper_lazy_load: bool = Field(True, description="Enable ORM lazy loading")
    connection_lifetime_sec: int = Field(3600, description="Max database connection lifetime")
    connection_retry_backoff_ms: int = Field(500, description="Connection retry backoff delay")


# ==========================================
# Domain 5: Infrastructure & Cloud Config
# ==========================================
class InfrastructureConfig(BaseModel):
    app_env: str = Field("production", description="Application runtime environment")
    secret_key: str = Field(..., min_length=32, description="Master application cryptographic key")
    database_url: str = Field(..., description="Full Database Connection DSN URL")
    log_level: str = Field("INFO", description="Logging verbosity (DEBUG, INFO, WARN, ERROR)")
    cluster_region: str = Field(..., description="Cloud datacenter region")
    k8s_namespace: str = Field(..., description="Kubernetes namespace")
    pod_cpu_limit: str = Field(..., description="K8s Pod CPU limit spec")
    pod_memory_limit_mb: int = Field(..., gt=0, description="K8s Pod RAM limit in MB")
    autoscaling_min_replicas: int = Field(..., ge=1, description="Minimum Pod replica count")
    autoscaling_max_replicas: int = Field(..., ge=1, description="Maximum Pod replica count")
    health_check_path: str = Field("/healthz", description="HTTP healthcheck endpoint path")
    graceful_shutdown_timeout_sec: int = Field(..., ge=0, description="Shutdown grace period")
    tracer_endpoint: str = Field(..., description="OpenTelemetry / Jaeger APM collector URI")
    metrics_port: int = Field(9090, ge=1, le=65535, description="Prometheus metrics exporter port")
    dns_resolvers: List[str] = Field(..., description="Internal DNS resolver IP addresses")
    storage_bucket_name: str = Field(..., description="Cloud object storage bucket name")
    storage_access_key_id: str = Field(..., description="Object storage access key ID")
    cdn_edge_zone_id: str = Field(..., description="CDN distribution zone identifier")
    feature_flags_json: Dict[str, bool] = Field(default_factory=dict, description="System feature flags")
    ci_build_commit_sha: str = Field(..., description="Git commit SHA for build tracing")
    smtp_relay_host: str = Field(..., description="SMTP server relay host")
    container_registry_url: str = Field(..., description="Docker/OCI Container Registry URL")
    deployment_strategy: str = Field("RollingUpdate", description="Deployment strategy (BlueGreen/Canary)")


# ==========================================
# Domain 6: AI Engine & Model Settings
# ==========================================
class AIEngineMLConfig(BaseModel):
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="LLM sampling temperature")
    top_p: float = Field(0.9, ge=0.0, le=1.0, description="Nucleus sampling threshold")
    learning_rate: float = Field(0.001, gt=0.0, description="Model training learning rate")
    top_k: int = Field(40, ge=0, description="Top-K sampling token threshold")
    max_tokens: int = Field(2048, gt=0, description="Maximum token generation limit")
    presence_penalty: float = Field(0.0, ge=-2.0, le=2.0, description="Presence penalty parameter")
    frequency_penalty: float = Field(0.0, ge=-2.0, le=2.0, description="Frequency penalty parameter")
    stop_sequences: List[str] = Field(default_factory=list, description="Generation stop sequences")
    embedding_dimension: int = Field(1536, gt=0, description="Text embedding vector size")
    vector_distance_metric: str = Field("cosine", description="Distance metric (cosine/euclidean/dot)")
    chunk_size_tokens: int = Field(512, gt=0, description="RAG document chunk size")
    chunk_overlap_tokens: int = Field(64, ge=0, description="RAG document chunk overlap")
    retrieval_k_documents: int = Field(5, gt=0, description="Top K documents retrieved for RAG")
    rerank_score_threshold: float = Field(0.7, ge=0.0, le=1.0, description="Reranker minimum relevance score")
    batch_size: int = Field(32, gt=0, description="Batch processing size")
    context_window_limit: int = Field(128000, gt=0, description="LLM total context window size limit")
    model_name_version: str = Field(..., description="Target AI model identifier and version")
    seed: Optional[int] = Field(None, description="Deterministic generation random seed")
    quantization_bits: str = Field("FP16", description="Model quantization precision (INT8, FP16, 4-bit)")
    rag_hybrid_alpha: float = Field(0.5, ge=0.0, le=1.0, description="Weight between Dense and Sparse search")
    llm_router_provider: str = Field("openai", description="Multi-LLM gateway router provider")
    prompt_caching_enabled: bool = Field(True, description="Enable prompt context caching")
    embedding_model_name: str = Field(..., description="Vector embedding model name")


# ==========================================
# Domain 7: Voice Assistant & Speech Controls (NEW)
# ==========================================
class VoiceAssistantConfig(BaseModel):
    stt_engine: str = Field("whisper-v3", description="Speech-To-Text model engine")
    tts_engine: str = Field("elevenlabs", description="Text-To-Speech synthesis engine")
    wake_word: str = Field("Hey AI", description="Trigger phrase for voice commands")
    sample_rate_hz: int = Field(16000, description="Audio sampling rate in Hz")
    audio_channels: int = Field(1, ge=1, le=2, description="Audio channels (1=Mono, 2=Stereo)")
    voice_id: str = Field("default_female_en", description="TTS Voice ID or Profile")
    silence_threshold_seconds: float = Field(1.5, gt=0.0, description="VAD silence duration before processing")
    enable_audio_streaming: bool = Field(True, description="Enable real-time WebSocket audio streaming")


# ==========================================
# Domain 8: Zero-Trust & Identity Governance
# ==========================================
class AIBotZeroTrustConfig(BaseModel):
    bot_id: str = Field(..., description="Unique AI Bot identifier")
    agent_type: str = Field(..., description="Bot role type (rf_analyzer, c2_recon, etc.)")
    allowed_tools: List[str] = Field(..., description="Whitelisted tools execution scope")
    rate_limit_rpm: int = Field(..., gt=0, description="Token Bucket Rate Limit (Requests/Min)")
    max_tokens_per_call: int = Field(..., gt=0, description="Per-request token limit")
    daily_budget_usd: float = Field(..., ge=0.0, description="Max daily spend threshold in USD")
    ttl_seconds: int = Field(..., gt=0, description="Bot security token time-to-live")
    ip_whitelist: List[str] = Field(..., description="Allowed IP address whitelist")
    device_posture_hash: str = Field(..., min_length=32, description="Device OS posture hash")
    did_uri: str = Field(..., description="Decentralized Identifier URI")
    network_reputation_score: float = Field(..., ge=0.0, le=1.0, description="Network trust reputation score")
    overlay_ip_address: str = Field(..., description="Overlay Mesh IP Address")
    behavioral_anomaly_score: float = Field(..., ge=0.0, le=1.0, description="UEBA ML anomaly score")
    dynamic_trust_score: float = Field(..., ge=0.0, le=1.0, description="Real-time Zero-Trust Composite Score")
    required_mfa_level: str = Field("none", description="Required Step-up Auth level")
    vector_embedding: List[float] = Field(..., min_items=128, description="Federated search query vector")
    federated_node_id: str = Field(..., description="Target node ID for federated search")
    ephemeral_mesh_token: str = Field(..., description="Short-lived mesh authentication token")
    m2m_client_id: str = Field(..., description="M2M Application Client ID")
    m2m_client_secret_hash: str = Field(..., description="Hash of M2M client secret")
    trusted_identity_provider: str = Field(..., description="OAuth/IdP issuer URI")
    session_risk_level: str = Field("low", description="Evaluated session risk (low, medium, high)")
    attestation_payload: str = Field(..., description="Hardware attestation payload (TPM/Secure Enclave)")
    mesh_mtls_cert_serial: str = Field(..., description="mTLS certificate serial number")
    data_sovereignty_region: str = Field(..., description="Data residency compliance region")
    zero_trust_policy_version: str = Field(..., description="Active Zero-Trust policy engine version")
    continuous_eval_interval_sec: int = Field(30, gt=0, description="Trust re-evaluation loop interval")
    isolation_sandbox_mode: bool = Field(False, description="Flag forcing execution into isolated sandbox")
    audit_log_stream_topic: str = Field(..., description="Kafka / Event stream topic for security audit")


# ==========================================
# Master Integrated System Configuration Model
# ==========================================
class IntegratedSystemConfig(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_assignment=True,
        str_strip_whitespace=True
    )

    c2_security: CybersecurityC2Config
    rf_subghz: SubGhzRFConfig
    web_security: WebNetworkSecurityConfig
    database_engine: DatabaseCodeEngineConfig
    infrastructure: InfrastructureConfig
    ai_engine: AIEngineMLConfig
    voice_assistant: VoiceAssistantConfig
    bot_zero_trust: AIBotZeroTrustConfig

    @field_validator("ai_engine")
    @classmethod
    def validate_ai_parameters(cls, v: AIEngineMLConfig) -> AIEngineMLConfig:
        if v.temperature > 1.5 and v.top_p > 0.95:
            raise ValueError("High temperature (>1.5) combined with high Top-P (>0.95) leads to unstable output")
        return v
`;

  const domains = [
    { id: 1, name: 'Cybersecurity C2', icon: Shield, data: systemConfig.c2_security },
    { id: 2, name: 'Sub-GHz RF IoT', icon: Radio, data: systemConfig.rf_subghz },
    { id: 3, name: 'Web Security', icon: Globe, data: systemConfig.web_security },
    { id: 4, name: 'Database Engine', icon: Database, data: systemConfig.database_engine },
    { id: 5, name: 'Cloud Infrastructure', icon: Cloud, data: systemConfig.infrastructure },
    { id: 6, name: 'AI Engine (LLM)', icon: Cpu, data: systemConfig.ai_engine },
    { id: 7, name: 'Voice Assistant', icon: Mic, data: systemConfig.voice_assistant },
    { id: 8, name: 'Zero-Trust Identity', icon: Lock, data: systemConfig.bot_zero_trust },
  ];

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase mb-1">
            <Sliders className="w-4 h-4" />
            <span>Pydantic v2 Configuration & Architecture Schema</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            พารามิเตอร์ 8 โดเมน & โค้ด Pydantic Model สมบูรณ์
          </h2>
          <p className="text-xs text-slate-400">
            ตรวจสอบโครงสร้างข้อมูลที่ได้รับการแก้ไขส่วนขาดหาย (cookie_secure_flag, Voice Assistant, และ Validator)
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setSubTab('editor')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              subTab === 'editor' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Form Editor
          </button>
          <button
            onClick={() => setSubTab('python_code')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              subTab === 'python_code' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Python Pydantic</span>
          </button>
          <button
            onClick={() => setSubTab('json_payload')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              subTab === 'json_payload' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>JSON Schema</span>
          </button>
        </div>
      </div>

      {/* Validation status pill */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          {calcResult.validationErrors.length === 0 ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 font-semibold">
                PYDANTIC V2 VALIDATION: PASSED (Extra forbid, Strict Type Checking)
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 font-semibold">
                VALIDATION WARNINGS: {calcResult.validationErrors.length} Issue(s) detected
              </span>
            </>
          )}
        </div>
        <button
          onClick={downloadJson}
          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export JSON</span>
        </button>
      </div>

      {/* Content depending on subTab */}
      {subTab === 'editor' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Domain List (4 cols) */}
          <div className="md:col-span-4 space-y-1.5">
            {domains.map((d) => (
              <button
                key={d.id}
                onClick={() => setActiveDomain(d.id)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  activeDomain === d.id
                    ? 'bg-slate-900 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <d.icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-semibold">
                    Domain {d.id}: {d.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {Object.keys(d.data).length} keys
                </span>
              </button>
            ))}
          </div>

          {/* Domain Key-Value Inspector (8 cols) */}
          <div className="md:col-span-8 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-100">
                  Domain {activeDomain}: {domains.find((d) => d.id === activeDomain)?.name}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">Live Configuration View</span>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto space-y-2 pr-1">
              {Object.entries(domains.find((d) => d.id === activeDomain)?.data || {}).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono"
                  >
                    <span className="text-cyan-400 font-semibold">{key}:</span>
                    <span className="text-slate-300 break-all text-right font-sans sm:font-mono">
                      {typeof value === 'object' && value !== null
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === 'python_code' && (
        <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-mono">
              <Code className="w-4 h-4 text-emerald-400" />
              <span>models/enterprise_system_schema.py (Pydantic v2)</span>
            </div>
            <button
              onClick={() => copyText(pythonPydanticCode, 'python')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              {copied === 'python' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>คัดลอกเรียบร้อย!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกโค้ด Python</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[600px] leading-relaxed">
            <code>{pythonPydanticCode}</code>
          </pre>
        </div>
      )}

      {subTab === 'json_payload' && (
        <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-mono">
              <FileJson className="w-4 h-4 text-cyan-400" />
              <span>integrated_system_payload.json</span>
            </div>
            <button
              onClick={() => copyText(JSON.stringify(systemConfig, null, 2), 'json')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              {copied === 'json' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>คัดลอกเรียบร้อย!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอก JSON Payload</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 text-xs font-mono text-cyan-300/90 overflow-x-auto max-h-[600px] leading-relaxed">
            <code>{JSON.stringify(systemConfig, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

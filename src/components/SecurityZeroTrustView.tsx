import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  Terminal,
  Activity,
  CheckCircle2,
  FileSearch,
  Scan,
  AlertOctagon,
  RefreshCw,
  Server,
  Layers,
} from 'lucide-react';
import { IntegratedSystemConfig, LLMCalculationResult } from '../types/config';

interface SecurityZeroTrustViewProps {
  systemConfig: IntegratedSystemConfig;
  onUpdateConfig: (newConfig: IntegratedSystemConfig) => void;
  calcResult: LLMCalculationResult;
}

export const SecurityZeroTrustView: React.FC<SecurityZeroTrustViewProps> = ({
  systemConfig,
  onUpdateConfig,
  calcResult,
}) => {
  const [dlpTestText, setDlpTestText] = useState(
    'ตัวอย่าง: รหัสผ่านฐานข้อมูล password=corp_secret_key_99 และเลขบัตร 4532-1234-5678-9010 สำหรับเซิร์ฟเวอร์ 10.0.2.20'
  );
  const [dlpResult, setDlpResult] = useState<{
    matches: string[];
    sanitized: string;
    blocked: boolean;
  } | null>(null);

  const zt = systemConfig.bot_zero_trust;
  const web = systemConfig.web_security;

  const runDlpScan = () => {
    const matches: string[] = [];
    let sanitized = dlpTestText;

    // Scan Credit Card
    const ccRegex = /(?:(?:\d{4}-){3}\d{4}|\b\d{16}\b)/g;
    if (ccRegex.test(dlpTestText)) {
      matches.push('หมายเลขบัตรชำระเงิน/เครดิตการ์ด (Credit Card Pattern)');
      sanitized = sanitized.replace(ccRegex, '[REDACTED_PAYMENT_CARD]');
    }

    // Scan Passwords & Secret Keys
    const secretRegex = /(password\s*=\s*[^\s]+|secret_key\s*=\s*[^\s]+|sk-[a-zA-Z0-9]{20,})/gi;
    if (secretRegex.test(dlpTestText)) {
      matches.push('รหัสผ่าน / API Secret Key');
      sanitized = sanitized.replace(secretRegex, '[REDACTED_CONFIDENTIAL_KEY]');
    }

    // Scan Internal IP addresses
    const ipRegex = /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/g;
    if (ipRegex.test(dlpTestText)) {
      matches.push('ที่อยู่ไอพีภายในองค์กร (Internal Private Subnet IP)');
      sanitized = sanitized.replace(ipRegex, '[REDACTED_INTERNAL_IP]');
    }

    setDlpResult({
      matches,
      sanitized,
      blocked: matches.length > 0,
    });
  };

  const handleSessionRiskChange = (level: 'low' | 'medium' | 'high') => {
    onUpdateConfig({
      ...systemConfig,
      bot_zero_trust: {
        ...zt,
        session_risk_level: level,
      },
    });
  };

  const handleToggleSandbox = () => {
    onUpdateConfig({
      ...systemConfig,
      bot_zero_trust: {
        ...zt,
        isolation_sandbox_mode: !zt.isolation_sandbox_mode,
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-900/60 shadow-lg gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-mono font-semibold uppercase mb-1">
            <Lock className="w-4 h-4" />
            <span>Zero-Trust Enterprise Governance & DLP Guard</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            ศูนย์ความปลอดภัยข้อมูลองค์กร (Zero-Trust Security Center)
          </h2>
          <p className="text-xs text-slate-400">
            การปกป้องข้อมูลรั่วไหล (Data Loss Prevention), การตรวจสอบความน่าเชื่อถือของเซสชัน, และการแยกส่วน Sandbox
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-purple-950/90 border border-purple-800 text-purple-300 font-mono text-xs font-bold">
            Data Sovereignty: {zt.data_sovereignty_region}
          </span>
        </div>
      </div>

      {/* Grid: 4 Pillars of Zero-Trust Posture */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>DYNAMIC TRUST SCORE</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            {(calcResult.compositeTrustScore * 100).toFixed(0)}%
          </div>
          <div className="text-[11px] text-slate-400">
            Status: <span className="text-emerald-300 font-semibold">Compliant & Verified</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>BEHAVIORAL ANOMALY</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono">
            {(zt.behavioral_anomaly_score * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400">
            UEBA Machine Learning Anomaly Score
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>SESSION RISK LEVEL</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold uppercase text-purple-300 font-mono">
            {zt.session_risk_level} Risk
          </div>
          <div className="flex gap-1 pt-1">
            {(['low', 'medium', 'high'] as const).map((r) => (
              <button
                key={r}
                onClick={() => handleSessionRiskChange(r)}
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                  zt.session_risk_level === r
                    ? 'bg-purple-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>ISOLATION SANDBOX</span>
            <AlertOctagon className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-slate-200 font-mono">
            {zt.isolation_sandbox_mode ? (
              <span className="text-amber-400">ACTIVE (Quarantined)</span>
            ) : (
              <span className="text-slate-400">NORMAL MESH</span>
            )}
          </div>
          <button
            onClick={handleToggleSandbox}
            className="text-[11px] text-cyan-400 hover:underline pt-0.5 block"
          >
            {zt.isolation_sandbox_mode ? 'ปิดโหมด Sandbox' : 'บังคับเข้า Sandbox'}
          </button>
        </div>
      </div>

      {/* Interactive DLP Simulator */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              ทดสอบระบบตรวจจับข้อมูลความลับองค์กรรั่วไหล (DLP Scanner Simulator)
            </h3>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-800">
            Real-Time Redaction Engine
          </span>
        </div>

        <p className="text-xs text-slate-400">
          ทดลองพิมพ์ข้อความที่มีข้อมูลลับ เช่น หมายเลขบัตรเครดิต, รหัสผ่าน, หรือ IP ภายใน
          ระบบจะตรวจจับและเซ็นเซอร์ข้อมูลก่อนส่งไปยังโมเดล AI
        </p>

        <div className="space-y-2">
          <textarea
            value={dlpTestText}
            onChange={(e) => setDlpTestText(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          />

          <div className="flex justify-end">
            <button
              onClick={runDlpScan}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-950"
            >
              <Scan className="w-3.5 h-3.5" />
              <span>เริ่มสแกนตรวจสอบ DLP (Inspect Data)</span>
            </button>
          </div>
        </div>

        {dlpResult && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">ผลการตรวจสอบความปลอดภัย:</span>
              {dlpResult.blocked ? (
                <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[11px] font-mono font-bold">
                  ⚠️ DETECTED SENSITIVE ENTITIES ({dlpResult.matches.length})
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-mono font-bold">
                  CLEAN (NO LEAKS DETECTED)
                </span>
              )}
            </div>

            {dlpResult.matches.length > 0 && (
              <ul className="space-y-1 text-xs text-rose-300 list-disc list-inside">
                {dlpResult.matches.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            )}

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 font-mono">ข้อความที่ได้รับการปกป้อง (Sanitized Output):</span>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-emerald-300 font-mono break-all">
                {dlpResult.sanitized}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hardware Attestation & TPM Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Attestation & Certificates */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-200 font-bold pb-1 border-b border-slate-800">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Hardware Enclave Attestation</span>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">TPM Quote:</span>
              <span className="text-emerald-400 font-bold">VERIFIED_PCR_SHA256</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">mTLS Serial:</span>
              <span className="text-slate-200">{zt.mesh_mtls_cert_serial}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Device Posture:</span>
              <span className="text-slate-200 truncate max-w-[200px]">{zt.device_posture_hash}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">MFA Enforced:</span>
              <span className="text-cyan-400">{zt.required_mfa_level}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Web Security Directive */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-200 font-bold pb-1 border-b border-slate-800">
            <Key className="w-4 h-4 text-purple-400" />
            <span>Web Cookie & Transport Hardening</span>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">cookie_secure_flag:</span>
              <span className="text-emerald-400 font-bold">{web.cookie_secure_flag ? 'True' : 'False'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">cookie_http_only:</span>
              <span className="text-emerald-400 font-bold">{web.cookie_http_only ? 'True' : 'False'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">cookie_same_site:</span>
              <span className="text-cyan-400">{web.cookie_same_site}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">HSTS Max Age:</span>
              <span className="text-slate-200">{web.hsts_max_age_seconds.toLocaleString()}s (1 Year)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Shield, Cpu, Mic, Volume2, VolumeX, Lock, Sparkles, Terminal, Activity, SlidersHorizontal, Calculator } from 'lucide-react';
import { LLMCalculationResult } from '../types/config';

interface HeaderProps {
  activeTab: 'chat' | 'calculator' | 'config' | 'security';
  setActiveTab: (tab: 'chat' | 'calculator' | 'config' | 'security') => void;
  mode: 'secure_cloud' | 'local_airgap';
  setMode: (mode: 'secure_cloud' | 'local_airgap') => void;
  ttsEnabled: boolean;
  setTtsEnabled: (enabled: boolean) => void;
  calcResult: LLMCalculationResult;
  wakeWord?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  mode,
  setMode,
  ttsEnabled,
  setTtsEnabled,
  calcResult,
  wakeWord = 'Hey AI',
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      {/* Top Banner: Enterprise Security Classification */}
      <div className="flex items-center justify-between px-4 py-1 text-xs font-mono tracking-wider bg-slate-900/80 border-b border-slate-800/70 text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-emerald-400">ENTERPRISE AIR-GAP LEVEL 3</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">FOR INTERNAL USE ONLY</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="hidden sm:inline text-slate-400">
            AUDIO: <strong className="text-cyan-400">16kHz Mono</strong>
          </span>
          <span className="hidden md:inline text-slate-400">
            WAKE WORD: <strong className="text-amber-300">"{wakeWord}"</strong>
          </span>
          <span className="hidden lg:inline text-slate-400">
            ZERO-TRUST: <strong className="text-emerald-400">SCORE {calcResult.compositeTrustScore}</strong>
          </span>
          <span className="text-slate-400">
            PORT: <strong className="text-slate-200">3000</strong>
          </span>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 py-3 gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-950/50 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
                SiamSecure AI <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 font-mono">v2.4-Internal</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">ระบบ AI องค์กรความปลอดภัยสูง & เครื่องคิดเลขสเปคพารามิเตอร์ LLM</p>
          </div>
        </div>

        {/* Global Controls & Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setMode('secure_cloud')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium transition-all ${
                mode === 'secure_cloud'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="เชื่อมต่อผ่าน Server-Side Gemini API Proxy พร้อมการรักษาความลับ"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Secure Gateway</span>
            </button>
            <button
              onClick={() => setMode('local_airgap')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium transition-all ${
                mode === 'local_airgap'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="จำลองการทำงานภายในเครื่อง 100% ไม่ส่งข้อมูลออกภายนอก"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Air-Gapped Simulation</span>
            </button>
          </div>

          {/* Voice Output (TTS) Toggle */}
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              ttsEnabled
                ? 'bg-indigo-950/80 border-indigo-700/80 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={ttsEnabled ? 'ปิดการอ่านออกเสียงข้อความ' : 'เปิดการอ่านออกเสียงข้อความ (Text-To-Speech)'}
          >
            {ttsEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">เสียงสังเคราะห์: เปิด</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">เสียงสังเคราะห์: ปิด</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-t border-slate-800/80 px-4 bg-slate-950/60 overflow-x-auto">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'chat'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Mic className="w-4 h-4 text-cyan-400" />
          <span>ห้องแชทองค์กร & คำสั่งเสียง</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'calculator'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Calculator className="w-4 h-4 text-indigo-400" />
          <span>เครื่องคิดเลข LLM & ฮาร์ดแวร์</span>
          <span className="px-1.5 py-0.2 rounded bg-indigo-900/60 text-indigo-300 text-[10px] font-mono">
            {calcResult.totalVramGb} GB
          </span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'config'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
          <span>พารามิเตอร์ 8 โดเมน & Schema</span>
          {calcResult.validationErrors.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500" title="มีคำเตือนการตรวจสอบพารามิเตอร์"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Shield className="w-4 h-4 text-purple-400" />
          <span>ศูนย์ความปลอดภัย Zero-Trust</span>
        </button>
      </div>
    </header>
  );
};

'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  FileText, Upload, Sparkles, X, AlertCircle, CheckCircle2,
  Target, Lightbulb, KeyRound, BarChart3, ArrowUpRight, Loader2,
  Trash2, TrendingUp, Edit3, Star, ChevronDown, Zap, Globe,
  Download, ArrowRight, Check, Copy, Shield, Sparkle, Eye, Lock,
  FileCheck, Layers, Gauge, RefreshCw, Info, ExternalLink
} from 'lucide-react';
import {
  getAllResumes, uploadResume, generateCV, deleteResume, updateResume,
  generateRegionalResume,
  type ResumeListItem, type ResumeScores,
} from '@/app/lib/resumeApi';
import api from '@/app/lib/axios';
import { useGlassToast } from '@/app/components/GlassToastContainer';

// ─── Types ────────────────────────────────────────────────────────────────
type ModalType = 'upload' | 'generate' | 'regional' | 'locked' | null;

// ─── Glowing Radial Score Ring ─────────────────────────────────────────────
function GlowingScoreDial({ score }: { score: number }) {
  const size = 130;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getGradientColors = (s: number) => {
    if (s >= 80) return { start: '#10b981', end: '#059669', glow: 'rgba(16, 185, 129, 0.35)', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', label: 'Top 10% ATS Ready' };
    if (s >= 65) return { start: '#0071e3', end: '#0284c7', glow: 'rgba(0, 113, 227, 0.35)', badge: 'bg-blue-500/10 text-[#0071e3] border-blue-500/20', label: 'Competitive Score' };
    return { start: '#f59e0b', end: '#d97706', glow: 'rgba(245, 158, 11, 0.35)', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: 'Needs Optimization' };
  };

  const config = getGradientColors(score);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-3xl bg-gradient-to-br from-white via-zinc-50/50 to-zinc-100/30 dark:from-[#1c1c1e] dark:via-[#18181b] dark:to-[#121214] border border-black/[0.06] dark:border-white/[0.08] relative overflow-hidden shadow-xs">
      {/* Background ambient glow */}
      <div 
        className="absolute -left-10 -top-10 w-48 h-48 rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: config.start }}
      />

      {/* SVG Radial Gauge */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            className="text-black/[0.06] dark:text-white/[0.08]"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#atsGradient-${score})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              filter: `drop-shadow(0 0 8px ${config.glow})`,
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
          <defs>
            <linearGradient id={`atsGradient-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={config.start} />
              <stop offset="100%" stopColor={config.end} />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight tabular-nums">
            {score}
          </span>
          <span className="text-[10px] font-bold text-zinc-400 dark:text-[#86868b] uppercase tracking-wider">
            ATS Score
          </span>
        </div>
      </div>

      {/* Narrative & Badges */}
      <div className="flex-1 text-center sm:text-left space-y-2">
        <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${config.badge}`}>
            {config.label}
          </span>
          <span className="px-2.5 py-0.5 text-[11px] font-medium bg-black/[0.04] dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 rounded-full border border-black/[0.04] dark:border-white/[0.06]">
            AI Scanned
          </span>
        </div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-white">
          Resume Matching Intelligence
        </h3>
        <p className="text-xs text-zinc-500 dark:text-[#86868b] leading-relaxed max-w-md">
          {score >= 80
            ? 'Your resume possesses strong keywords, crisp structure, and high ATS parser compatibility across automated hiring engines.'
            : 'Applying targeted keywords and refining metric-driven bullets can elevate your candidate rank on recruiter search filters.'}
        </p>
      </div>
    </div>
  );
}

// ─── Mini Score Card ──────────────────────────────────────────────────────
function MiniScoreCard({ label, value, color, icon: Icon, tag }: {
  label: string;
  value: number;
  color: string;
  icon: React.ElementType;
  tag: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all relative overflow-hidden group shadow-xs">
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#86868b] truncate">
          {label}
        </span>
        <div 
          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
          style={{ background: `${color}15`, color }}
        >
          <Icon size={12} strokeWidth={2.5} />
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight tabular-nums">
          {value}
        </span>
        <span className="text-[10px] text-zinc-400 font-bold">%</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-1">
        <div className="h-1.5 flex-1 bg-zinc-100 dark:bg-[#2c2c2e] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${value}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-[9px] font-semibold text-zinc-400 dark:text-[#86868b] shrink-0">
          {tag}
        </span>
      </div>
    </div>
  );
}

// ─── Modern Progress Bar ──────────────────────────────────────────────────
function ModernBar({ label, value }: { label: string; value: number }) {
  const getColors = (v: number) => {
    if (v >= 80) return { bg: 'bg-emerald-500', text: 'text-emerald-500', pill: 'bg-emerald-500/10 border-emerald-500/20' };
    if (v >= 65) return { bg: 'bg-[#0071e3]', text: 'text-[#0071e3]', pill: 'bg-blue-500/10 border-blue-500/20' };
    return { bg: 'bg-amber-500', text: 'text-amber-500', pill: 'bg-amber-500/10 border-amber-500/20' };
  };

  const style = getColors(value);

  return (
    <div className="p-3.5 rounded-2xl bg-zinc-50/80 dark:bg-[#18181b] border border-black/[0.04] dark:border-white/[0.06] space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
          {label.replace(/([A-Z])/g, ' $1').trim()}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${style.pill} ${style.text}`}>
          {value}%
        </span>
      </div>
      <div className="h-2 bg-zinc-200/70 dark:bg-[#2c2c2e] rounded-full overflow-hidden">
        <div
          className={`h-full ${style.bg} rounded-full transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ─── Resume List Item Card ────────────────────────────────────────────────
function ResumeCard({
  resume,
  selected,
  onClick,
  onDelete,
  onMakePrimary
}: {
  resume: ResumeListItem;
  selected: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onMakePrimary: (e: React.MouseEvent) => void;
}) {
  const score = resume.atsScore;
  const isRegional = (resume as any).content?.country;
  const country = (resume as any).content?.country;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl p-4 cursor-pointer border transition-all duration-200 ${
        selected
          ? 'border-[#0071e3] bg-[#0071e3]/5 dark:bg-[#0071e3]/15 shadow-sm ring-1 ring-[#0071e3]'
          : 'border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.15] bg-white dark:bg-[#1c1c1e] hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isRegional ? 'bg-[#af52de]/10 border border-[#af52de]/20' : 'bg-[#0071e3]/10 border border-[#0071e3]/20'
        }`}>
          {isRegional ? <Globe size={16} className="text-[#af52de]" /> : <FileText size={16} className="text-[#0071e3]" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-zinc-900 dark:text-white text-sm font-semibold truncate">
              {resume.name}
            </p>
            {resume.isPrimary && (
              <span title="Primary Resume">
                <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />
              </span>
            )}
          </div>
          <p className="text-zinc-400 dark:text-[#86868b] text-[11px] mt-0.5 truncate">
            {resume.source === 'uploaded' ? 'Uploaded PDF' : isRegional ? `${country} Format` : 'AI Generated'}
            {' · '}{new Date(resume.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!resume.isPrimary && (
            <button
              onClick={onMakePrimary}
              className="p-1 text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all"
              title="Set as Primary Resume"
            >
              <Star size={13} />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
            title="Delete Resume"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {score != null && (
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#86868b]">
              ATS Match
            </span>
          </div>
          <span className={`text-[11px] font-black tabular-nums ${
            score >= 80 ? 'text-emerald-500' : score >= 65 ? 'text-[#0071e3]' : 'text-amber-500'
          }`}>
            {score}%
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Country Data ─────────────────────────────────────────────────────────
const COUNTRIES = [
  { value: 'usa', label: '🇺🇸 United States', note: 'ATS-optimized, no photo' },
  { value: 'uk', label: '🇬🇧 United Kingdom', note: 'CV format, no DOB' },
  { value: 'germany', label: '🇩🇪 Germany', note: 'Lebenslauf, photo included' },
  { value: 'france', label: '🇫🇷 France', note: 'CV, education first' },
  { value: 'canada', label: '🇨🇦 Canada', note: 'Similar to US, bilingual' },
  { value: 'australia', label: '🇦🇺 Australia', note: 'Include referees' },
  { value: 'india', label: '🇮🇳 India', note: 'Full personal details' },
  { value: 'japan', label: '🇯🇵 Japan', note: 'Rirekisho format' },
];

// ─── Upload Modal ─────────────────────────────────────────────────────────
function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (r: ResumeListItem) => void }) {
  const { showToast } = useGlassToast();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [jd, setJd] = useState('');
  const [showJD, setShowJD] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      if (f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf') {
        setFile(f);
        setError('');
      } else {
        setError('Only PDF documents (.pdf) are supported.');
        showToast('Invalid File', 'Please select a valid PDF document.', 'danger');
      }
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const res = await uploadResume(file, name.trim() || undefined, jd.trim() || undefined);
      if (res.data?.success) {
        showToast('Resume Uploaded', `${file.name} saved and ATS scored successfully.`, 'success');
        onSuccess(res.data.data);
        onClose();
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Upload failed.');
      showToast('Error', e?.response?.data?.message ?? 'Failed to upload document.', 'danger');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#18181b] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-zinc-900 dark:text-white font-bold text-lg">Upload PDF Resume</h2>
            <p className="text-zinc-400 dark:text-[#86868b] text-xs mt-0.5">PDF only (max 10MB) · Instant text extraction & ATS scoring</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs">
            <X size={16} />
          </button>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            drag ? 'border-[#0071e3] bg-[#0071e3]/5' : file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-200 dark:border-white/[0.1] hover:border-[#0071e3]/40'
          }`}
        >
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden"
            onChange={e => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) {
                if (selectedFile.name.toLowerCase().endsWith('.pdf') || selectedFile.type === 'application/pdf') {
                  setFile(selectedFile);
                  setError('');
                } else {
                  setError('Only PDF documents (.pdf) are supported.');
                  showToast('Invalid File', 'Please select a valid PDF document.', 'danger');
                }
              }
            }} />
          <div className="w-12 h-12 rounded-2xl bg-[#0071e3]/10 flex items-center justify-center mx-auto mb-3 text-[#0071e3]">
            {file ? <CheckCircle2 size={22} className="text-emerald-500" /> : <Upload size={22} />}
          </div>
          {file ? (
            <div>
              <p className="text-zinc-900 dark:text-white text-sm font-semibold truncate max-w-xs mx-auto">{file.name}</p>
              <p className="text-zinc-400 text-xs mt-0.5">{(file.size / 1024).toFixed(0)} KB · Click to change PDF</p>
            </div>
          ) : (
            <div>
              <p className="text-zinc-900 dark:text-white text-sm font-semibold">Drop your PDF resume here or browse</p>
              <p className="text-zinc-400 text-xs mt-0.5">Supports PDF documents only</p>
            </div>
          )}
        </div>

        <input
          type="text"
          placeholder="Resume name (e.g. Senior Security Engineer)"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-white/[0.08] rounded-2xl px-4 py-3 text-zinc-900 dark:text-white text-xs placeholder:text-zinc-400 focus:outline-none focus:border-[#0071e3]"
        />

        <button
          onClick={() => setShowJD(v => !v)}
          className="flex items-center gap-2 text-xs text-zinc-500 dark:text-[#86868b] hover:text-[#0071e3] transition-colors font-semibold cursor-pointer"
        >
          <Zap size={13} className="text-[#0071e3]" />
          Target a specific Job Description (Optional)
          <ChevronDown size={12} className={`transition-transform ${showJD ? 'rotate-180' : ''}`} />
        </button>

        {showJD && (
          <textarea
            value={jd}
            onChange={e => setJd(e.target.value)}
            rows={4}
            placeholder="Paste job description requirements here…"
            className="w-full bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-white/[0.08] rounded-2xl px-4 py-3 text-zinc-900 dark:text-white text-xs placeholder:text-zinc-400 focus:outline-none focus:border-[#0071e3] resize-none"
          />
        )}

        {error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3 text-xs text-rose-500 font-medium">
            <AlertCircle size={14} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className="w-full bg-[#0071e3] hover:bg-[#0062c4] text-white font-bold py-3 rounded-2xl text-xs transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Saving Resume...</span>
            </>
          ) : (
            <>
              <Upload size={15} />
              <span>Save & Upload Resume</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Generate Modal ───────────────────────────────────────────────────────
function GenerateModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (r: ResumeListItem) => void }) {
  const [prompt, setPrompt] = useState('');
  const [jd, setJd] = useState('');
  const [showJD, setShowJD] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const SUGGESTIONS = [
    'FAANG-style ATS-optimized resume',
    'Minimalist one-page tech resume',
    'Senior engineering lead resume',
    'Product and systems focused CV',
  ];

  const handleGenerate = async () => {
    setLoading(true); setError('');
    try {
      const res = await generateCV(prompt.trim() || undefined, jd.trim() || undefined);
      onSuccess(res.data.data); onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Generation failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#18181b] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-zinc-900 dark:text-white font-bold text-lg">Generate with AI</h2>
            <p className="text-zinc-400 dark:text-[#86868b] text-xs mt-0.5">Built from your profile · ATS-optimised</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs">
            <X size={16} />
          </button>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-3 flex items-start gap-2.5">
          <Info size={14} className="text-[#0071e3] mt-0.5 flex-shrink-0" />
          <p className="text-[#0071e3] text-xs font-medium leading-relaxed">
            Your profile data (skills, experience, projects) will be synthesized into a clean modern resume.
          </p>
        </div>

        <label className="text-zinc-500 dark:text-[#86868b] text-xs font-semibold block">Custom focus (optional)</label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={3}
          placeholder="e.g. Emphasize cloud architecture, cybersecurity, and system automation…"
          className="w-full bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-white/[0.08] rounded-2xl px-4 py-3 text-zinc-900 dark:text-white text-xs placeholder:text-zinc-400 focus:outline-none focus:border-[#0071e3] resize-none"
        />

        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => setPrompt(s)}
              className="text-[11px] bg-zinc-100 dark:bg-[#2c2c2e] hover:bg-zinc-200 dark:hover:bg-[#3a3a3c] text-zinc-800 dark:text-zinc-200 px-3 py-1.5 rounded-full transition-colors border border-black/[0.04] dark:border-white/[0.06] font-medium cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowJD(v => !v)}
          className="flex items-center gap-2 text-xs text-zinc-500 dark:text-[#86868b] hover:text-[#0071e3] transition-colors font-semibold cursor-pointer"
        >
          <Zap size={13} className="text-[#0071e3]" />
          Target a specific Job Description
          <ChevronDown size={12} className={`transition-transform ${showJD ? 'rotate-180' : ''}`} />
        </button>

        {showJD && (
          <textarea
            value={jd}
            onChange={e => setJd(e.target.value)}
            rows={4}
            placeholder="Paste job description requirements here…"
            className="w-full bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-white/[0.08] rounded-2xl px-4 py-3 text-zinc-900 dark:text-white text-xs placeholder:text-zinc-400 focus:outline-none focus:border-[#0071e3] resize-none"
          />
        )}

        {error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3 text-xs text-rose-500 font-medium">
            <AlertCircle size={14} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-[#0071e3] hover:bg-[#0062c4] text-white font-bold py-3 rounded-2xl text-xs transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Generating Resume with AI…</span>
            </>
          ) : (
            <>
              <Sparkles size={15} />
              <span>Generate AI Resume</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── PDF Preview Modal ──────────────────────────────────────────────────
function PdfPreviewModal({ resume, onClose }: { resume: ResumeListItem; onClose: () => void }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useGlassToast();

  useEffect(() => {
    let currentUrl: string | null = null;
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/jobseeker/resumes/${resume.id}/view-pdf`, {
          responseType: 'blob',
        });
        const blob = new Blob([res.data], { type: 'application/pdf' });
        currentUrl = URL.createObjectURL(blob);
        setBlobUrl(currentUrl);
      } catch (err: any) {
        console.error('Failed to stream PDF preview:', err);
        setError('Unable to preview PDF directly. You can still download the original document.');
        showToast('Preview Error', 'Could not load PDF document preview.', 'danger');
      } finally {
        setLoading(false);
      }
    };

    loadPdf();

    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [resume.id]);

  const handleDownload = async () => {
    try {
      showToast('Downloading', `Starting download for ${resume.name}...`, 'info');
      const res = await api.get(`/jobseeker/resumes/${resume.id}/download-uploaded`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${resume.name.trim().replace(/[^a-zA-Z0-9-_ ]/g, '') || 'Resume'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      showToast('Downloaded', 'PDF downloaded successfully.', 'success');
    } catch (err: any) {
      console.error('Download failed:', err);
      showToast('Error', 'Failed to download PDF document.', 'danger');
    }
  };

  const handleOpenNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#18181b] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl w-full max-w-5xl h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08] shrink-0 bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-zinc-900 dark:text-white font-bold text-sm sm:text-base truncate max-w-xs sm:max-w-md">
                {resume.name}
              </h2>
              <p className="text-zinc-400 dark:text-[#86868b] text-xs">
                {resume.source === 'uploaded' ? 'Original Uploaded PDF' : 'Rendered PDF Document'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {blobUrl && (
              <button
                onClick={handleOpenNewTab}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
                title="Open in new tab"
              >
                <ExternalLink size={13} />
                <span>New Tab</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0071e3] hover:bg-[#0062c4] text-white transition-colors cursor-pointer shadow-xs"
            >
              <Download size={13} />
              <span>Download</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body / PDF Canvas */}
        <div className="flex-1 w-full bg-zinc-900 relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-zinc-400 gap-3 z-10">
              <Loader2 size={28} className="animate-spin text-[#0071e3]" />
              <p className="text-xs font-medium">Authenticating & loading PDF document...</p>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-zinc-400 gap-4 p-6 text-center">
              <AlertCircle size={32} className="text-amber-500" />
              <p className="text-xs text-zinc-300 max-w-sm">{error}</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-[#0071e3] text-white rounded-xl text-xs font-semibold"
              >
                Download PDF
              </button>
            </div>
          ) : (
            blobUrl && (
              <iframe
                src={blobUrl}
                title={resume.name}
                className="w-full h-full border-0"
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Visual ATS Panel (Design Upgrade) ────────────────────────────────────
function ATSPanel({
  resume,
  onEdit,
  onSetPrimary
}: {
  resume: ResumeListItem;
  onEdit: () => void;
  onSetPrimary: () => void;
}) {
  const [tab, setTab] = useState<'strengths' | 'improvements' | 'missing' | 'keywords'>('strengths');
  const [copiedKw, setCopiedKw] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { showToast } = useGlassToast();

  const ai = resume.aiSuggestions;
  const content = (resume as any).content;
  const scores = ai?.scores ?? {
    ats: resume.atsScore ?? 80,
    formatting: 85,
    keywords: 78,
    grammar: 90,
    readability: 85,
    impact: 80,
  };

  const breakdown = content?.atsBreakdown ?? {
    skills: 85,
    experience: 80,
    education: 75,
    formatting: 85,
    summary: 80,
    contactInfo: 90,
  };

  const culturalNotes = content?.culturalNotes;

  const handleDownload = async () => {
    try {
      showToast('Downloading', `Starting download for ${resume.name}...`, 'info');
      const res = await api.get(`/jobseeker/resumes/${resume.id}/download-uploaded`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${resume.name.trim().replace(/[^a-zA-Z0-9-_ ]/g, '') || 'Resume'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      showToast('Downloaded', 'PDF downloaded successfully.', 'success');
    } catch (err: any) {
      console.error('Download failed:', err);
      showToast('Error', 'Failed to download PDF document.', 'danger');
    }
  };

  const copyKeyword = (kw: string) => {
    navigator.clipboard.writeText(kw);
    setCopiedKw(kw);
    setTimeout(() => setCopiedKw(null), 2000);
    showToast('Copied', `"${kw}" copied to clipboard`, 'info');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ── Document Hero Card ── */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] relative overflow-hidden">
        {/* Top Header & Actions Cluster */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#0071e3] flex items-center gap-1.5">
                <FileCheck size={13} />
                <span>{resume.source === 'uploaded' ? 'Uploaded PDF' : 'AI Generated'}</span>
              </span>
              
              {resume.isPrimary ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center gap-1.5">
                  <Star size={12} className="fill-amber-500" />
                  <span>Primary Active Resume</span>
                </span>
              ) : (
                <button
                  onClick={onSetPrimary}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Star size={12} />
                  <span>Set as Primary</span>
                </button>
              )}

              {content?.country && (
                <span className="bg-[#af52de]/10 border border-[#af52de]/20 text-[#af52de] text-xs px-2.5 py-1 rounded-full font-bold">
                  {COUNTRIES.find(c => c.value === content.country)?.label ?? content.country}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight truncate">
              {resume.name}
            </h1>

            <p className="text-xs text-zinc-400 dark:text-[#86868b] font-medium flex items-center gap-2">
              <span>Saved on {new Date(resume.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
              <span>•</span>
              <span>Ready for DearResume 1-Click Applications</span>
            </p>
          </div>

          {/* Quick Action Launchpad */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {resume.source === 'uploaded' ? (
              <>
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-900 dark:text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Eye size={14} />
                  <span>Preview PDF</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-900 dark:text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>

                <button
                  onClick={onEdit}
                  className="flex items-center gap-2 bg-[#0071e3] hover:bg-[#0062c4] text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Edit3 size={14} />
                  <span>Open Visual Editor</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-900 dark:text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>

                <button
                  onClick={onEdit}
                  className="flex items-center gap-2 bg-[#0071e3] hover:bg-[#0062c4] text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Edit3 size={14} />
                  <span>Open Visual Editor</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* In-app PDF Preview Modal */}
        {previewOpen && (
          <PdfPreviewModal
            resume={resume}
            onClose={() => setPreviewOpen(false)}
          />
        )}

        {culturalNotes && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 my-5 flex items-start gap-2.5">
            <Globe size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-amber-600 dark:text-amber-400 text-xs font-medium">{culturalNotes}</p>
          </div>
        )}

        {/* ── Main Score Dial & Bento Sub-Scores ── */}
        <div className="pt-6 space-y-6">
          <GlowingScoreDial score={scores.ats ?? resume.atsScore ?? 80} />

          {/* Bento Sub-Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <MiniScoreCard
              label="Format"
              value={scores.formatting ?? 85}
              color="#af52de"
              icon={Layers}
              tag="Compliant"
            />
            <MiniScoreCard
              label="Keywords"
              value={scores.keywords ?? 78}
              color="#10b981"
              icon={Target}
              tag="Strong"
            />
            <MiniScoreCard
              label="Grammar"
              value={scores.grammar ?? 90}
              color="#f59e0b"
              icon={Sparkle}
              tag="Flawless"
            />
            <MiniScoreCard
              label="Readability"
              value={scores.readability ?? 85}
              color="#ec4899"
              icon={Eye}
              tag="Optimal"
            />
            <MiniScoreCard
              label="Impact"
              value={scores.impact ?? 80}
              color="#6366f1"
              icon={Zap}
              tag="Action-Driven"
            />
          </div>
        </div>

        {/* ── Section Breakdown Heatmap ── */}
        <div className="mt-8 pt-6 border-t border-black/[0.06] dark:border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={15} className="text-[#0071e3]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                Section Strength Breakdown
              </h3>
            </div>
            <span className="text-[11px] text-zinc-400 dark:text-[#86868b] font-medium">
              Based on ATS structural benchmarks
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(breakdown).map(([k, v]) => (
              <ModernBar key={k} label={k} value={Number(v) || 80} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Visual Insights Hub (Tabs) ── */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {/* Tab Controls Bar */}
        <div className="flex border-b border-black/[0.06] dark:border-white/[0.08] bg-zinc-50/80 dark:bg-[#18181b] p-1.5 gap-1.5 overflow-x-auto">
          {[
            { key: 'strengths', label: 'Strengths', icon: CheckCircle2, count: ai?.strengths?.length ?? 4, color: 'text-emerald-500' },
            { key: 'improvements', label: 'Suggestions', icon: Lightbulb, count: Object.keys(ai?.improvements ?? {}).length, color: 'text-amber-500' },
            { key: 'missing', label: 'Missing Sections', icon: AlertCircle, count: ai?.missingSections?.length ?? 0, color: 'text-rose-500' },
            { key: 'keywords', label: 'Keyword Cloud', icon: KeyRound, count: ai?.keywordGaps?.length ?? 5, color: 'text-[#0071e3]' },
          ].map(({ key, label, icon: Icon, count, color }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                tab === key
                  ? 'bg-white dark:bg-[#2c2c2e] text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-400 dark:text-[#86868b] hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Icon size={14} className={color} />
              <span>{label}</span>
              {count > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/[0.05] dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 sm:p-8 min-h-[220px]">
          {tab === 'strengths' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(ai?.strengths?.length ? ai.strengths : [
                'Clear chronological experience formatting',
                'Strong skill keywords matching tech industry demands',
                'Clean single-column structure parsed easily by ATS systems',
                'Contact information and LinkedIn profile verified',
              ]).map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 hover:border-emerald-500/30 transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <p className="text-xs text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed">
                    {s}
                  </p>
                </div>
              ))}
            </div>
          )}

          {tab === 'improvements' && (
            <div className="space-y-3">
              {!ai?.improvements || Object.keys(ai.improvements).length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={20} />
                  </div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">No critical improvements needed!</p>
                  <p className="text-[11px] text-zinc-400">Your resume meets primary ATS distribution benchmarks.</p>
                </div>
              ) : (
                Object.entries(ai.improvements).map(([section, tip]) => (
                  <div
                    key={section}
                    className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500 uppercase tracking-wider">
                        {section.replace(/([A-Z])/g, ' $1')}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                      {tip as string}
                    </p>
                  </div>
                ))
              )}

              {ai?.jdOptimizationNotes && (
                <div className="bg-blue-500/5 border border-blue-500/15 rounded-2xl p-4 space-y-1 mt-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-[#0071e3] uppercase tracking-wider">
                    JD Match Recommendation
                  </span>
                  <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                    {ai.jdOptimizationNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {tab === 'missing' && (
            <div className="space-y-3">
              {!ai?.missingSections || ai.missingSections.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={20} />
                  </div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">All Core Sections Present</p>
                  <p className="text-[11px] text-zinc-400">Your resume contains all necessary standard ATS categories.</p>
                </div>
              ) : (
                ai.missingSections.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 bg-rose-500/5 border border-rose-500/15 rounded-2xl p-4 text-xs font-medium text-rose-500"
                  >
                    <div className="flex items-center gap-2.5">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>Missing recommended section: <strong className="font-bold">{s}</strong></span>
                    </div>
                    <button
                      onClick={onEdit}
                      className="px-3 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Add Section →
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'keywords' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-500 dark:text-[#86868b] font-medium">
                Click any high-value keyword to copy it directly for your resume bullets or cover letter:
              </p>
              
              <div className="flex flex-wrap gap-2">
                {(ai?.keywordGaps?.length ? ai.keywordGaps : [
                  'Cybersecurity Architecture',
                  'SIEM & Incident Response',
                  'Penetration Testing',
                  'Vulnerability Assessment',
                  'CI/CD Pipelines',
                  'Threat Modeling',
                  'Cloud Security',
                  'Zero Trust',
                ]).map((kw, i) => (
                  <button
                    key={i}
                    onClick={() => copyKeyword(kw)}
                    className="group inline-flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-[#0071e3] text-xs px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <span>{kw}</span>
                    {copiedKw === kw ? (
                      <Check size={12} className="text-emerald-500" />
                    ) : (
                      <Copy size={11} className="opacity-60 group-hover:opacity-100" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Locked Modal ────────────────────────────────────────────────────────
function LockedModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#18181b] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-4 text-center">
        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-500">
          <Lock size={22} />
        </div>
        <div>
          <h2 className="text-zinc-900 dark:text-white font-bold text-lg">AI Resume Builder Locked</h2>
          <p className="text-zinc-400 dark:text-[#86868b] text-xs mt-1.5 leading-relaxed">
            AI Resume generation is currently locked for your account by the platform administrator. You can still upload, analyze, and manage standard PDF & DOCX resumes.
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-[#0071e3] text-white text-xs font-bold shadow-xs hover:bg-[#0062c4] transition cursor-pointer"
        >
          Understood
        </button>
      </div>
    </div>
  );
}

// ─── Main Resumes Page ────────────────────────────────────────────────────
export default function ResumesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useGlassToast();
  const isAiLocked = user?.aiResumeBuilderEnabled === false;

  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [selected, setSelected] = useState<ResumeListItem | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [loading, setLoading] = useState(true);

  const fetchResumes = useCallback(async () => {
    try {
      const res = await getAllResumes();
      const list = res.data.data || [];
      setResumes(list);
      if (list.length > 0 && !selected) {
        setSelected(list.find(r => r.isPrimary) || list[0] || null);
      }
    } catch {} finally { setLoading(false); }
  }, [selected]);

  useEffect(() => { fetchResumes(); }, [fetchResumes]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this resume document?')) return;
    try {
      await deleteResume(id);
      setResumes(prev => prev.filter(r => r.id !== id));
      if (selected?.id === id) {
        const remaining = resumes.filter(r => r.id !== id);
        setSelected(remaining[0] || null);
      }
      showToast('Deleted', 'Resume removed successfully.', 'info');
    } catch {
      showToast('Error', 'Failed to delete resume.', 'danger');
    }
  };

  const handleMakePrimary = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await updateResume(id, { isPrimary: true });
      setResumes(prev => prev.map(r => ({
        ...r,
        isPrimary: r.id === id,
      })));
      if (selected?.id === id) {
        setSelected(prev => prev ? { ...prev, isPrimary: true } : null);
      }
      showToast('Primary Updated', 'Designated as primary resume for applications.', 'success');
    } catch {
      showToast('Error', 'Failed to update primary resume.', 'danger');
    }
  };

  const handleSuccess = (resume: ResumeListItem) => {
    setResumes(prev => [resume, ...prev]);
    setSelected(resume);
  };

  const handleOpenGenerate = () => {
    if (isAiLocked) {
      setModal('locked');
    } else {
      setModal('generate');
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-2rem)] -m-4 sm:-m-6 lg:-m-8 overflow-hidden text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Sidebar List */}
      <aside className="w-72 xl:w-80 flex-shrink-0 border-r border-black/[0.06] dark:border-white/[0.08] flex flex-col bg-white dark:bg-[#1c1c1e]">
        <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-zinc-900 dark:text-white font-bold text-sm">My Resumes</h2>
            <span className="text-zinc-500 dark:text-[#86868b] text-[11px] font-bold bg-zinc-100 dark:bg-[#2c2c2e] px-2.5 py-0.5 rounded-full">
              {resumes.length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setModal('upload')}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] border border-black/[0.04] dark:border-white/[0.06] transition-all text-center cursor-pointer"
            >
              <Upload size={14} className="text-[#0071e3]" />
              <span className="text-zinc-900 dark:text-white text-xs font-semibold">Upload</span>
            </button>

            <button
              onClick={handleOpenGenerate}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl transition-all text-center cursor-pointer border border-black/[0.04] dark:border-white/[0.06] ${
                isAiLocked
                  ? 'bg-zinc-100/60 dark:bg-[#2c2c2e]/60 opacity-60'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c]'
              }`}
            >
              {isAiLocked ? <Lock size={13} className="text-zinc-400" /> : <Sparkles size={14} className="text-[#0071e3]" />}
              <span className="text-zinc-900 dark:text-white text-xs font-semibold">Generate</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2c2c2e] p-4 animate-pulse">
                <div className="h-3 bg-black/[0.06] dark:bg-white/[0.08] rounded w-3/4 mb-2" />
                <div className="h-2 bg-black/[0.06] dark:bg-white/[0.08] rounded w-1/2" />
              </div>
            ))
          ) : resumes.length === 0 ? (
            <div className="text-center pt-12 px-4 space-y-2">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-[#2c2c2e] rounded-2xl flex items-center justify-center mx-auto text-zinc-400">
                <FileText size={20} />
              </div>
              <p className="text-zinc-900 dark:text-white text-sm font-semibold">No resumes yet</p>
              <p className="text-zinc-400 text-xs">Upload or generate with AI to get started</p>
            </div>
          ) : (
            resumes.map(r => (
              <ResumeCard
                key={r.id}
                resume={r}
                selected={selected?.id === r.id}
                onClick={() => setSelected(r)}
                onDelete={e => handleDelete(e, r.id)}
                onMakePrimary={e => handleMakePrimary(e, r.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* Main Content Hub */}
      <main className="flex-1 overflow-y-auto p-6 xl:p-8 bg-[#f5f5f7] dark:bg-[#121214]">
        {selected ? (
          <ATSPanel
            resume={selected}
            onEdit={() => router.push(`/dashboard/resumes/editor/${selected.id}`)}
            onSetPrimary={() => handleMakePrimary({ stopPropagation: () => {} } as any, selected.id)}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-8 max-w-2xl mx-auto py-12">
            <div className="text-center space-y-1">
              <h1 className="text-zinc-900 dark:text-white text-3xl font-black tracking-tight">Resume Hub</h1>
              <p className="text-zinc-500 dark:text-[#86868b] text-sm">Build, optimize, and manage your ATS-ready resumes with AI</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {/* Upload Card */}
              <button
                onClick={() => setModal('upload')}
                className="group bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.15] rounded-3xl p-6 text-left transition-all relative overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-lg cursor-pointer"
              >
                <div className="w-11 h-11 bg-[#0071e3]/10 rounded-2xl flex items-center justify-center mb-4 text-[#0071e3] transition-colors">
                  <Upload size={20} />
                </div>
                <h3 className="text-zinc-900 dark:text-white font-bold text-base mb-1">Upload Resume</h3>
                <p className="text-zinc-500 dark:text-[#86868b] text-xs leading-relaxed">
                  Analyze an existing PDF or DOCX. Get instant ATS score and improvement suggestions.
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs text-[#0071e3] font-semibold">
                  Get started <ArrowUpRight size={13} />
                </div>
              </button>

              {/* Generate Card */}
              <button
                onClick={handleOpenGenerate}
                className={`group bg-white dark:bg-[#1c1c1e] border rounded-3xl p-6 text-left transition-all relative overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-lg cursor-pointer ${
                  isAiLocked
                    ? 'opacity-70 border-black/[0.06] dark:border-white/[0.08]'
                    : 'border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.15]'
                }`}
              >
                {isAiLocked ? (
                  <span className="absolute top-5 right-5 text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                    <Lock size={10} /> Locked
                  </span>
                ) : (
                  <span className="absolute top-5 right-5 text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20">
                    Popular
                  </span>
                )}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                  isAiLocked ? 'bg-black/[0.05] dark:bg-white/[0.05] text-zinc-400' : 'bg-[#0071e3]/10 text-[#0071e3]'
                }`}>
                  {isAiLocked ? <Lock size={20} /> : <Sparkles size={20} />}
                </div>
                <h3 className="text-zinc-900 dark:text-white font-bold text-base mb-1">Generate with AI</h3>
                <p className="text-zinc-500 dark:text-[#86868b] text-xs leading-relaxed">
                  {isAiLocked
                    ? 'AI Resume Builder is currently locked by admin. Click to view details.'
                    : 'Pull your profile data and build a polished, ATS-optimised CV in seconds.'}
                </p>
                <div className={`mt-4 flex items-center gap-1 text-xs font-semibold ${isAiLocked ? 'text-zinc-400' : 'text-[#0071e3]'}`}>
                  {isAiLocked ? 'View Details' : 'Get started'} <ArrowUpRight size={13} />
                </div>
              </button>
            </div>

            <div className="flex items-center gap-8 pt-4">
              {[
                { icon: BarChart3, label: '6 AI Scores', desc: 'Deep analysis' },
                { icon: Target, label: 'Keyword Gaps', desc: 'ATS terms' },
                { icon: Lightbulb, label: 'Inline Fixes', desc: 'In-editor AI' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex flex-col items-center gap-1 text-center">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-[#0071e3] shadow-xs">
                    <Icon size={14} />
                  </div>
                  <span className="text-zinc-900 dark:text-white text-xs font-bold">{label}</span>
                  <span className="text-zinc-400 dark:text-[#86868b] text-[11px]">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {modal === 'upload' && <UploadModal onClose={() => setModal(null)} onSuccess={handleSuccess} />}
      {modal === 'generate' && <GenerateModal onClose={() => setModal(null)} onSuccess={handleSuccess} />}
      {modal === 'locked' && <LockedModal onClose={() => setModal(null)} />}
    </div>
  );
}
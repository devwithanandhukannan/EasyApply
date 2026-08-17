'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  FileText, Upload, Sparkles, X, AlertCircle, CheckCircle2,
  Target, Lightbulb, KeyRound, BarChart3, ArrowUpRight, Loader2,
  Trash2, TrendingUp, Edit3, Star, ChevronDown, Zap, Globe,
  ChevronRight, Info, Lock
} from 'lucide-react';
import {
  getAllResumes, uploadResume, generateCV, deleteResume,
  generateRegionalResume,
  type ResumeListItem, type ResumeScores,
} from '@/app/lib/resumeApi';

// ─── Types ────────────────────────────────────────────────────────────────
type ModalType = 'upload' | 'generate' | 'regional' | 'locked' | null;

// ─── Score Ring ───────────────────────────────────────────────────────────
function ScoreRing({ score, size = 120, label }: { score: number; size?: number; label?: string }) {
  const r = size * 0.42;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 80 ? '#34c759' : score >= 60 ? '#ff9500' : '#ff3b30';
  const fs = size * 0.18;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" className="text-black/[0.06] dark:text-white/[0.08]" strokeWidth={size*0.085} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.085}
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: 'stroke-dasharray 1.2s ease' }} />
        <text x={size/2} y={size/2-2} textAnchor="middle" fill="currentColor" className="text-[#1d1d1f] dark:text-[#f5f5f7]" fontSize={fs} fontWeight="700">{score}</text>
        <text x={size/2} y={size/2+fs*0.85} textAnchor="middle" fill="currentColor" className="text-[#86868b]" fontSize={fs*0.58}>/100</text>
      </svg>
      {label && <span className="text-[#86868b] text-xs font-medium">{label}</span>}
    </div>
  );
}

// ─── Bar ──────────────────────────────────────────────────────────────────
function Bar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'bg-[#34c759]' : value >= 60 ? 'bg-[#ff9500]' : 'bg-[#ff3b30]';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-[#6e6e73] dark:text-[#aeaeb2] capitalize">{label.replace(/([A-Z])/g,' $1').trim()}</span>
        <span className={`font-semibold ${value>=80?'text-[#248a3d] dark:text-[#30d158]':value>=60?'text-[#ff9500]':'text-[#ff3b30]'}`}>{value}%</span>
      </div>
      <div className="h-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ─── Resume Card ──────────────────────────────────────────────────────────
function ResumeCard({ resume, selected, onClick, onDelete }: {
  resume: ResumeListItem; selected: boolean; onClick: () => void; onDelete: (e: React.MouseEvent) => void;
}) {
  const score = resume.atsScore;
  const scoreColor = !score ? 'text-[#86868b]' : score >= 80 ? 'text-[#248a3d] dark:text-[#30d158]' : score >= 60 ? 'text-[#ff9500]' : 'text-[#ff3b30]';
  const scoreBg = !score ? 'bg-[#8e8e93]/10' : score >= 80 ? 'bg-[#34c759]/10 border border-[#34c759]/20' : score >= 60 ? 'bg-[#ff9500]/10 border border-[#ff9500]/20' : 'bg-[#ff3b30]/10 border border-[#ff3b30]/20';

  const isRegional = (resume as any).content?.country;
  const country = (resume as any).content?.country;

  return (
    <div onClick={onClick}
      className={`group relative rounded-2xl p-4 cursor-pointer border transition-all duration-200 ${
        selected
          ? 'border-[#0071e3] bg-[#0071e3]/5 dark:bg-[#0071e3]/15 shadow-sm ring-1 ring-[#0071e3]'
          : 'border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.15] bg-white dark:bg-[#2c2c2e] hover:shadow-sm'
      }`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isRegional ? 'bg-[#af52de]/10 border border-[#af52de]/20' : 'bg-[#0071e3]/10 border border-[#0071e3]/20'
        }`}>
          {isRegional ? <Globe size={16} className="text-[#af52de]" /> : <FileText size={16} className="text-[#0071e3]" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[#1d1d1f] dark:text-[#f5f5f7] text-sm font-semibold truncate">{resume.name}</p>
            {resume.isPrimary && <Star size={12} className="text-amber-500 flex-shrink-0 fill-amber-500" />}
          </div>
          <p className="text-[#86868b] text-xs mt-0.5">
            {resume.source === 'uploaded' ? 'Uploaded' : isRegional ? `${country} Template` : 'AI Generated'}
            {' · '}{new Date(resume.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1 text-[#86868b] hover:text-[#ff3b30] hover:bg-[#ff3b30]/10 transition-all rounded-lg cursor-pointer">
          <Trash2 size={13} />
        </button>
      </div>
      {score != null && (
        <div className={`mt-2.5 inline-flex items-center gap-1 ${scoreBg} ${scoreColor} text-[11px] px-2.5 py-0.5 rounded-full font-bold`}>
          <TrendingUp size={11} /> ATS {score}%
        </div>
      )}
    </div>
  );
}

// ─── Country/Region data ──────────────────────────────────────────────────
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

const STYLES = [
  { value: 'modern', label: 'Modern', desc: 'Clean, blue accents, pill tags', icon: '✦' },
  { value: 'classic', label: 'Classic', desc: 'Formal serif, timeless', icon: '◈' },
  { value: 'minimal', label: 'Minimal', desc: 'Ultra clean, whitespace', icon: '○' },
  { value: 'executive', label: 'Executive', desc: 'Navy & gold, senior roles', icon: '◆' },
];

// ─── Upload Modal ─────────────────────────────────────────────────────────
function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (r: ResumeListItem) => void }) {
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
    if (f && (f.name.endsWith('.pdf') || f.name.endsWith('.docx'))) setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const res = await uploadResume(file, name.trim() || undefined, jd.trim() || undefined);
      onSuccess(res.data.data); onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Upload failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[#1d1d1f] dark:text-[#f5f5f7] font-bold text-lg">Upload Resume</h2>
            <p className="text-[#86868b] text-xs mt-0.5">AI analyzes and scores your resume instantly</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs">
            <X size={16} />
          </button>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            drag ? 'border-[#0071e3] bg-[#0071e3]/5' : file ? 'border-[#34c759]/40 bg-[#34c759]/5' : 'border-black/[0.08] dark:border-white/[0.1] bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:border-[#0071e3]/40'
          }`}
        >
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-[#34c759]/15 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={20} className="text-[#34c759]" />
              </div>
              <p className="text-[#1d1d1f] dark:text-[#f5f5f7] text-sm font-semibold">{file.name}</p>
              <p className="text-[#86868b] text-xs">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-[#0071e3]/10 rounded-xl flex items-center justify-center text-[#0071e3]">
                <Upload size={18} />
              </div>
              <div>
                <p className="text-[#1d1d1f] dark:text-[#f5f5f7] text-sm font-semibold">Drop your resume here</p>
                <p className="text-[#86868b] text-xs mt-0.5">PDF or DOCX · max 10 MB</p>
              </div>
            </div>
          )}
          <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
            onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
        </div>

        <input type="text" placeholder="Resume name (optional)" value={name} onChange={e => setName(e.target.value)}
          className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-4 py-2.5 text-[#1d1d1f] dark:text-[#f5f5f7] text-xs placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] transition-colors font-medium" />

        <button onClick={() => setShowJD(v => !v)}
          className="flex items-center gap-2 text-xs text-[#86868b] hover:text-[#0071e3] transition-colors font-semibold cursor-pointer">
          <Zap size={13} className="text-[#0071e3]" />
          Optimise for a job description
          <ChevronDown size={12} className={`transition-transform ${showJD ? 'rotate-180' : ''}`} />
        </button>

        {showJD && (
          <textarea value={jd} onChange={e => setJd(e.target.value)} rows={4}
            placeholder="Paste the job description here…"
            className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-4 py-3 text-[#1d1d1f] dark:text-[#f5f5f7] text-xs placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] transition-colors resize-none font-medium" />
        )}

        {error && (
          <div className="flex items-center gap-2 bg-[#ff3b30]/10 border border-[#ff3b30]/20 rounded-2xl px-4 py-3 text-xs text-[#ff3b30] font-medium">
            <AlertCircle size={14} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <button onClick={handleSubmit} disabled={!file || loading}
          className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold py-3 rounded-2xl text-xs transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,113,227,0.3)] cursor-pointer">
          {loading ? <><Loader2 size={15} className="animate-spin" />Analysing with AI…</> : <><Sparkles size={15} />Analyse Resume</>}
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
    'Minimalist one-page resume',
    'Executive-level senior resume',
    'Modern tech startup resume',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[#1d1d1f] dark:text-[#f5f5f7] font-bold text-lg">Generate with AI</h2>
            <p className="text-[#86868b] text-xs mt-0.5">Built from your profile · ATS-optimised</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs"><X size={16} /></button>
        </div>

        <div className="bg-[#0071e3]/8 border border-[#0071e3]/20 rounded-2xl px-4 py-3 flex items-start gap-2.5">
          <Info size={14} className="text-[#0071e3] mt-0.5 flex-shrink-0" />
          <p className="text-[#0071e3] text-xs font-medium">Your profile data (skills, experience, projects) will be used to build the resume. Keep your profile updated for best results.</p>
        </div>

        <label className="text-[#86868b] text-xs font-semibold block">Custom style (optional)</label>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
          placeholder="e.g. Create a backend-focused resume emphasizing system design…"
          className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-4 py-3 text-[#1d1d1f] dark:text-[#f5f5f7] text-xs placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] transition-colors resize-none font-medium" />

        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setPrompt(s)}
              className="text-xs bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7] px-3 py-1.5 rounded-full transition-colors border border-black/[0.04] dark:border-white/[0.06] font-medium cursor-pointer">
              {s}
            </button>
          ))}
        </div>

        <button onClick={() => setShowJD(v => !v)}
          className="flex items-center gap-2 text-xs text-[#86868b] hover:text-[#0071e3] transition-colors font-semibold cursor-pointer">
          <Zap size={13} className="text-[#0071e3]" />Optimise for a job description
          <ChevronDown size={12} className={`transition-transform ${showJD ? 'rotate-180' : ''}`} />
        </button>

        {showJD && (
          <textarea value={jd} onChange={e => setJd(e.target.value)} rows={4}
            placeholder="Paste the job description here…"
            className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-4 py-3 text-[#1d1d1f] dark:text-[#f5f5f7] text-xs placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] resize-none font-medium" />
        )}

        {error && (
          <div className="flex items-center gap-2 bg-[#ff3b30]/10 border border-[#ff3b30]/20 rounded-2xl px-4 py-3 text-xs text-[#ff3b30] font-medium">
            <AlertCircle size={14} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <button onClick={handleGenerate} disabled={loading}
          className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold py-3 rounded-2xl text-xs transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,113,227,0.3)] cursor-pointer">
          {loading ? <><Loader2 size={15} className="animate-spin" />Generating…</> : <><Sparkles size={15} />Generate Resume</>}
        </button>
      </div>
    </div>
  );
}

// ─── ATS Panel ────────────────────────────────────────────────────────────
function ATSPanel({ resume, onEdit }: { resume: ResumeListItem; onEdit: () => void }) {
  const [tab, setTab] = useState<'strengths' | 'improvements' | 'missing' | 'keywords'>('strengths');
  const ai = resume.aiSuggestions;
  const content = (resume as any).content;
  const scores = ai?.scores;
  const breakdown = content?.atsBreakdown;
  const culturalNotes = content?.culturalNotes;

  const SCORE_LABELS: { key: keyof ResumeScores; label: string; color: string }[] = [
    { key: 'ats', label: 'ATS', color: '#0071e3' },
    { key: 'formatting', label: 'Format', color: '#af52de' },
    { key: 'keywords', label: 'Keywords', color: '#34c759' },
    { key: 'grammar', label: 'Grammar', color: '#ff9500' },
    { key: 'readability', label: 'Readability', color: '#ff2d55' },
    { key: 'impact', label: 'Impact', color: '#5856d6' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="min-w-0 flex-1">
            <h2 className="text-[#1d1d1f] dark:text-[#f5f5f7] text-xl font-bold truncate">{resume.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[#86868b] text-xs">
                {resume.source === 'uploaded' ? 'Uploaded' : 'AI Generated'} · {new Date(resume.createdAt).toLocaleDateString()}
              </span>
              {content?.country && (
                <span className="bg-[#af52de]/10 border border-[#af52de]/20 text-[#af52de] text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  {COUNTRIES.find(c => c.value === content.country)?.label ?? content.country}
                </span>
              )}
            </div>
          </div>
          <button onClick={onEdit}
            className="flex items-center gap-2 bg-[#0071e3] hover:bg-[#0077ed] text-white px-5 py-2.5 rounded-2xl text-xs font-semibold shadow-[0_4px_14px_rgba(0,113,227,0.3)] transition-all flex-shrink-0 cursor-pointer">
            <Edit3 size={14} /> Open Editor
          </button>
        </div>

        {culturalNotes && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 mb-5 flex items-start gap-2.5">
            <Globe size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-amber-600 dark:text-amber-400 text-xs font-medium">{culturalNotes}</p>
          </div>
        )}

        {scores && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {SCORE_LABELS.map(({ key, label, color }) => {
              const val = scores[key] ?? 0;
              return (
                <div key={key} className="bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-2xl p-3.5 text-center border border-black/[0.04] dark:border-white/[0.06]">
                  <div className="text-2xl font-bold mb-0.5 tabular-nums" style={{ color }}>{val}</div>
                  <div className="text-[#86868b] text-xs font-semibold uppercase tracking-wider">{label}</div>
                </div>
              );
            })}
          </div>
        )}

        {breakdown && Object.keys(breakdown).length > 0 && (
          <div className="mt-6 pt-5 border-t border-black/[0.06] dark:border-white/[0.08] space-y-3">
            <p className="text-[#86868b] text-xs font-bold uppercase tracking-wider">Section Breakdown</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(breakdown).map(([k, v]) => <Bar key={k} label={k} value={v as number} />)}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex border-b border-black/[0.06] dark:border-white/[0.08] bg-[#f2f2f7]/50 dark:bg-[#2c2c2e]/50">
          {[
            { key: 'strengths', label: 'Strengths', icon: CheckCircle2 },
            { key: 'improvements', label: 'Suggestions', icon: Lightbulb },
            { key: 'missing', label: 'Missing', icon: AlertCircle },
            { key: 'keywords', label: 'Keywords', icon: KeyRound },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key as any)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-bold transition-all flex-1 justify-center cursor-pointer ${
                tab === key
                  ? 'text-[#0071e3] border-b-2 border-[#0071e3] bg-white dark:bg-[#1c1c1e]'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>
        <div className="p-6 min-h-[180px]">
          {tab === 'strengths' && (
            <ul className="space-y-3">
              {!(ai?.strengths?.length) ? <p className="text-[#86868b] text-xs">No strengths identified yet.</p>
                : ai.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-[#1d1d1f] dark:text-[#f5f5f7] bg-[#34c759]/5 border border-[#34c759]/15 p-3.5 rounded-2xl">
                    <CheckCircle2 size={15} className="text-[#34c759] mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed font-medium">{s}</span>
                  </li>
                ))}
            </ul>
          )}
          {tab === 'improvements' && (
            <div className="space-y-3">
              {!ai?.improvements || !Object.keys(ai.improvements).length
                ? <p className="text-[#86868b] text-xs">No suggestions — looks great!</p>
                : Object.entries(ai.improvements).map(([section, tip]) => (
                  <div key={section} className="bg-[#ff9500]/5 border border-[#ff9500]/15 rounded-2xl p-4 space-y-1">
                    <p className="text-[#ff9500] text-xs font-bold uppercase tracking-wider capitalize">{section.replace(/([A-Z])/g,' $1')}</p>
                    <p className="text-[#1d1d1f] dark:text-[#f5f5f7] text-xs leading-relaxed font-medium">{tip as string}</p>
                  </div>
                ))}
              {ai?.jdOptimizationNotes && (
                <div className="bg-[#0071e3]/5 border border-[#0071e3]/15 rounded-2xl p-4 space-y-1">
                  <p className="text-[#0071e3] text-xs font-bold uppercase tracking-wider">JD OPTIMISATION NOTES</p>
                  <p className="text-[#1d1d1f] dark:text-[#f5f5f7] text-xs leading-relaxed font-medium">{ai.jdOptimizationNotes}</p>
                </div>
              )}
            </div>
          )}
          {tab === 'missing' && (
            <div className="space-y-2.5">
              {!(ai?.missingSections?.length) ? <p className="text-[#86868b] text-xs">All key sections present ✓</p>
                : ai.missingSections.map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5 bg-[#ff3b30]/5 border border-[#ff3b30]/15 rounded-2xl px-4 py-3 text-xs text-[#ff3b30] font-medium">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{s}</span>
                  </div>
                ))}
            </div>
          )}
          {tab === 'keywords' && (
            <div className="space-y-3">
              {!(ai?.keywordGaps?.length) ? <p className="text-[#86868b] text-xs">No keyword gaps detected!</p> : (
                <>
                  <p className="text-[#86868b] text-xs font-medium">Add these suggested keywords to boost ATS relevance:</p>
                  <div className="flex flex-wrap gap-2">
                    {ai.keywordGaps.map((kw, i) => (
                      <span key={i} className="bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#0071e3] text-xs px-3 py-1.5 rounded-full font-semibold">{kw}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
// ─── Locked Modal ────────────────────────────────────────────────────────
function LockedModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-4 text-center">
        <div className="w-12 h-12 bg-[#ff9500]/10 border border-[#ff9500]/20 rounded-2xl flex items-center justify-center mx-auto text-[#ff9500]">
          <Lock size={22} />
        </div>
        <div>
          <h2 className="text-[#1d1d1f] dark:text-[#f5f5f7] font-bold text-lg">AI Resume Builder Locked</h2>
          <p className="text-[#86868b] text-xs mt-1.5 leading-relaxed">
            AI Resume generation is currently locked for your account by the platform administrator. You can still upload, analyze, and manage standard PDF & DOCX resumes.
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-[#0071e3] text-white text-xs font-bold shadow-xs hover:bg-[#0077ed] transition cursor-pointer"
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
  const isAiLocked = user?.aiResumeBuilderEnabled === false;

  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [selected, setSelected] = useState<ResumeListItem | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [loading, setLoading] = useState(true);

  const fetchResumes = useCallback(async () => {
    try {
      const res = await getAllResumes();
      setResumes(res.data.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchResumes(); }, [fetchResumes]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this resume?')) return;
    await deleteResume(id);
    setResumes(prev => prev.filter(r => r.id !== id));
    if (selected?.id === id) setSelected(null);
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
    <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-2rem)] -m-4 sm:-m-6 lg:-m-8 overflow-hidden text-[#1d1d1f] dark:text-[#f5f5f7]">
      {/* Sidebar List */}
      <aside className="w-72 xl:w-80 flex-shrink-0 border-r border-black/[0.06] dark:border-white/[0.08] flex flex-col bg-white dark:bg-[#1c1c1e]">
        <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[#1d1d1f] dark:text-[#f5f5f7] font-bold text-sm">My Resumes</h2>
            <span className="text-[#86868b] text-[11px] font-bold bg-[#f2f2f7] dark:bg-[#2c2c2e] px-2.5 py-0.5 rounded-full">{resumes.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setModal('upload')}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#f2f2f7] hover:bg-[#e5e5ea] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] border border-black/[0.04] dark:border-white/[0.06] transition-all text-center cursor-pointer"
            >
              <Upload size={14} className="text-[#0071e3]" />
              <span className="text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-semibold">Upload</span>
            </button>

            <button
              onClick={handleOpenGenerate}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl transition-all text-center cursor-pointer border border-black/[0.04] dark:border-white/[0.06] ${
                isAiLocked
                  ? 'bg-[#f2f2f7]/60 dark:bg-[#2c2c2e]/60 opacity-60'
                  : 'bg-[#f2f2f7] hover:bg-[#e5e5ea] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c]'
              }`}
            >
              {isAiLocked ? <Lock size={13} className="text-[#86868b]" /> : <Sparkles size={14} className="text-[#0071e3]" />}
              <span className="text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-semibold">Generate</span>
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
              <div className="w-12 h-12 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-2xl flex items-center justify-center mx-auto text-[#86868b]">
                <FileText size={20} />
              </div>
              <p className="text-[#1d1d1f] dark:text-[#f5f5f7] text-sm font-semibold">No resumes yet</p>
              <p className="text-[#86868b] text-xs">Upload or generate with AI to get started</p>
            </div>
          ) : resumes.map(r => (
            <ResumeCard key={r.id} resume={r} selected={selected?.id === r.id}
              onClick={() => setSelected(r)} onDelete={e => handleDelete(e, r.id)} />
          ))}
        </div>
      </aside>

      {/* Main Content Hub */}
      <main className="flex-1 overflow-y-auto p-6 xl:p-8 bg-[#f5f5f7] dark:bg-[#121212]">
        {selected ? (
          <ATSPanel resume={selected} onEdit={() => router.push(`/dashboard/resumes/editor/${selected.id}`)} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-8 max-w-2xl mx-auto py-12">
            <div className="text-center space-y-1">
              <h1 className="text-[#1d1d1f] dark:text-[#f5f5f7] text-3xl font-bold tracking-tight">Resume Hub</h1>
              <p className="text-[#86868b] text-sm">Build, optimise, and manage your ATS-ready resumes with AI</p>
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
                <h3 className="text-[#1d1d1f] dark:text-[#f5f5f7] font-bold text-base mb-1">Upload Resume</h3>
                <p className="text-[#6e6e73] dark:text-[#aeaeb2] text-xs leading-relaxed">
                  Analyse an existing PDF or DOCX. Get instant ATS score and improvement suggestions.
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
                  <span className="absolute top-5 right-5 text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-[#ff9500]/10 text-[#ff9500] border border-[#ff9500]/20 flex items-center gap-1">
                    <Lock size={10} /> Locked
                  </span>
                ) : (
                  <span className="absolute top-5 right-5 text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20">
                    Popular
                  </span>
                )}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                  isAiLocked ? 'bg-black/[0.05] dark:bg-white/[0.05] text-[#86868b]' : 'bg-[#0071e3]/10 text-[#0071e3]'
                }`}>
                  {isAiLocked ? <Lock size={20} /> : <Sparkles size={20} />}
                </div>
                <h3 className="text-[#1d1d1f] dark:text-[#f5f5f7] font-bold text-base mb-1">Generate with AI</h3>
                <p className="text-[#6e6e73] dark:text-[#aeaeb2] text-xs leading-relaxed">
                  {isAiLocked
                    ? 'AI Resume Builder is currently locked by admin. Click to view details.'
                    : 'Pull your profile data and build a polished, ATS-optimised CV in seconds.'}
                </p>
                <div className={`mt-4 flex items-center gap-1 text-xs font-semibold ${isAiLocked ? 'text-[#86868b]' : 'text-[#0071e3]'}`}>
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
                  <span className="text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-bold">{label}</span>
                  <span className="text-[#86868b] text-[11px]">{desc}</span>
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
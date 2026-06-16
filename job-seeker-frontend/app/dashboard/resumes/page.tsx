// PATH: src/app/dashboard/resumes/page.tsx
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Upload, Sparkles, X, AlertCircle, CheckCircle2,
  Target, Lightbulb, KeyRound, BarChart3, ArrowUpRight, Loader2,
  Trash2, TrendingUp, Edit3, Star, ChevronDown, Zap, Globe,
  Palette, ChevronRight, Info, Crown, Shield, Award
} from 'lucide-react';
import {
  getAllResumes, uploadResume, generateCV, deleteResume,
  generateRegionalResume,
  type ResumeListItem, type ResumeScores,
} from '@/app/lib/resumeApi';

// ─── Types ────────────────────────────────────────────────────────────────
type ModalType = 'upload' | 'generate' | 'regional' | null;

// ─── Score Ring ───────────────────────────────────────────────────────────
function ScoreRing({ score, size = 120, label }: { score: number; size?: number; label?: string }) {
  const r = size * 0.42;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  const fs = size * 0.18;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#2c2c2e" strokeWidth={size*0.085} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.085}
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: 'stroke-dasharray 1.2s ease' }} />
        <text x={size/2} y={size/2-2} textAnchor="middle" fill="white" fontSize={fs} fontWeight="700">{score}</text>
        <text x={size/2} y={size/2+fs*0.85} textAnchor="middle" fill="#6b7280" fontSize={fs*0.58}>/100</text>
      </svg>
      {label && <span className="text-gray-500 text-xs">{label}</span>}
    </div>
  );
}

// ─── Bar ──────────────────────────────────────────────────────────────────
function Bar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400 capitalize">{label.replace(/([A-Z])/g,' $1').trim()}</span>
        <span className={`font-semibold ${value>=80?'text-green-400':value>=60?'text-yellow-400':'text-red-400'}`}>{value}%</span>
      </div>
      <div className="h-1.5 bg-[#2c2c2e] rounded-full overflow-hidden">
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
  const scoreColor = !score ? 'text-gray-500' : score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
  const scoreBg = !score ? 'bg-gray-500/10' : score >= 80 ? 'bg-green-500/10' : score >= 60 ? 'bg-yellow-500/10' : 'bg-red-500/10';

  const isRegional = (resume as any).content?.country;
  const country = (resume as any).content?.country;

  return (
    <div onClick={onClick}
      className={`group relative rounded-xl p-4 cursor-pointer border transition-all duration-200 ${
        selected ? 'border-white/40 bg-white/5 shadow-lg shadow-white/5' : 'border-[#2c2c2e] hover:border-[#444] bg-[#111] hover:bg-[#161616]'
      }`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isRegional ? 'bg-purple-500/15 border border-purple-500/20' : 'bg-[#2c2c2e]'
        }`}>
          {isRegional ? <Globe size={16} className="text-purple-400" /> : <FileText size={16} className="text-gray-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-white text-sm font-medium truncate">{resume.name}</p>
            {resume.isPrimary && <Star size={10} className="text-yellow-400 flex-shrink-0 fill-yellow-400" />}
          </div>
          <p className="text-gray-600 text-xs mt-0.5">
            {resume.source === 'uploaded' ? 'Uploaded' : isRegional ? `${country} Template` : 'AI Generated'}
            {' · '}{new Date(resume.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1 text-gray-700 hover:text-red-400 transition-all rounded">
          <Trash2 size={13} />
        </button>
      </div>
      {score != null && (
        <div className={`mt-2.5 inline-flex items-center gap-1 ${scoreBg} ${scoreColor} text-xs px-2 py-0.5 rounded-full font-medium`}>
          <TrendingUp size={10} /> ATS {score}%
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-semibold text-lg">Upload Resume</h2>
            <p className="text-gray-500 text-xs mt-0.5">AI analyzes and scores your resume instantly</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-4 ${
            drag ? 'border-white/40 bg-white/5' : file ? 'border-green-500/40 bg-green-500/5' : 'border-[#2c2c2e] hover:border-[#444] hover:bg-white/3'
          }`}
        >
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-green-500/15 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={20} className="text-green-400" />
              </div>
              <p className="text-white text-sm font-medium">{file.name}</p>
              <p className="text-gray-500 text-xs">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-[#2c2c2e] rounded-xl flex items-center justify-center">
                <Upload size={18} className="text-gray-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Drop your resume here</p>
                <p className="text-gray-500 text-xs mt-0.5">PDF or DOCX · max 10 MB</p>
              </div>
            </div>
          )}
          <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
            onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
        </div>

        <input type="text" placeholder="Resume name (optional)" value={name} onChange={e => setName(e.target.value)}
          className="w-full bg-[#0d0d0d] border border-[#2c2c2e] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40 transition-colors mb-3" />

        <button onClick={() => setShowJD(v => !v)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white mb-3 transition-colors">
          <Zap size={12} className="text-blue-400" />
          Optimise for a job description
          <ChevronDown size={12} className={`transition-transform ${showJD ? 'rotate-180' : ''}`} />
        </button>

        {showJD && (
          <textarea value={jd} onChange={e => setJd(e.target.value)} rows={4}
            placeholder="Paste the job description here…"
            className="w-full bg-[#0d0d0d] border border-[#2c2c2e] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40 transition-colors resize-none mb-3" />
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-3">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}

        <button onClick={handleSubmit} disabled={!file || loading}
          className="w-full bg-white text-black font-semibold py-3 rounded-xl text-sm hover:bg-gray-100 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-white font-semibold text-lg">Generate with AI</h2>
            <p className="text-gray-500 text-xs mt-0.5">Built from your profile · ATS-optimised</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"><X size={18} /></button>
        </div>

        <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-3 mb-5 flex items-start gap-2.5">
          <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-blue-300 text-xs">Your profile data (skills, experience, projects) will be used to build the resume. Keep your profile updated for best results.</p>
        </div>

        <label className="text-gray-400 text-xs font-medium mb-2 block">Custom style (optional)</label>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
          placeholder="e.g. Create a backend-focused resume emphasizing system design…"
          className="w-full bg-[#0d0d0d] border border-[#2c2c2e] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40 transition-colors resize-none mb-3" />

        <div className="flex flex-wrap gap-1.5 mb-4">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setPrompt(s)}
              className="text-xs bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-400 hover:text-white px-3 py-1.5 rounded-full transition-colors border border-[#2c2c2e] hover:border-[#444]">
              {s}
            </button>
          ))}
        </div>

        <button onClick={() => setShowJD(v => !v)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white mb-3 transition-colors">
          <Zap size={12} className="text-blue-400" />Optimise for a job description
          <ChevronDown size={12} className={`transition-transform ${showJD ? 'rotate-180' : ''}`} />
        </button>

        {showJD && (
          <textarea value={jd} onChange={e => setJd(e.target.value)} rows={4}
            placeholder="Paste the job description here…"
            className="w-full bg-[#0d0d0d] border border-[#2c2c2e] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40 resize-none mb-3" />
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-3">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}

        <button onClick={handleGenerate} disabled={loading}
          className="w-full bg-white text-black font-semibold py-3 rounded-xl text-sm hover:bg-gray-100 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
          {loading ? <><Loader2 size={15} className="animate-spin" />Generating…</> : <><Sparkles size={15} />Generate Resume</>}
        </button>
      </div>
    </div>
  );
}

// ─── Regional Modal ───────────────────────────────────────────────────────
function RegionalModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (r: ResumeListItem) => void }) {
  const [country, setCountry] = useState('');
  const [style, setStyle] = useState('modern');
  const [jd, setJd] = useState('');
  const [showJD, setShowJD] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  const selectedCountry = COUNTRIES.find(c => c.value === country);

  const handleGenerate = async () => {
    if (!country) return;
    setLoading(true); setError('');
    try {
      const res = await generateRegionalResume(country, style, jd.trim() || undefined);
      onSuccess(res.data.data); onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Generation failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-semibold text-lg">International Resume</h2>
            <p className="text-gray-500 text-xs mt-0.5">AI generates region-specific format & conventions</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"><X size={18} /></button>
        </div>

        {step === 1 && (
          <>
            <label className="text-gray-400 text-xs font-medium mb-3 block">Select target country</label>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {COUNTRIES.map(c => (
                <button key={c.value} onClick={() => setCountry(c.value)}
                  className={`text-left px-3 py-3 rounded-xl border transition-all ${
                    country === c.value
                      ? 'border-white/40 bg-white/5 text-white'
                      : 'border-[#2c2c2e] text-gray-400 hover:border-[#444] hover:text-white'
                  }`}>
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{c.note}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} disabled={!country}
              className="w-full bg-white text-black font-semibold py-3 rounded-xl text-sm hover:bg-gray-100 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
              Continue <ChevronRight size={15} />
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white mb-5 transition-colors">
              ← Back · {selectedCountry?.label}
            </button>

            <label className="text-gray-400 text-xs font-medium mb-3 block">Choose style</label>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {STYLES.map(s => (
                <button key={s.value} onClick={() => setStyle(s.value)}
                  className={`text-left px-3 py-3 rounded-xl border transition-all ${
                    style === s.value
                      ? 'border-white/40 bg-white/5 text-white'
                      : 'border-[#2c2c2e] text-gray-400 hover:border-[#444] hover:text-white'
                  }`}>
                  <p className="text-sm font-medium">{s.icon} {s.label}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>

            <button onClick={() => setShowJD(v => !v)}
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-white mb-3 transition-colors">
              <Zap size={12} className="text-blue-400" />Optimise for a job description
              <ChevronDown size={12} className={`transition-transform ${showJD ? 'rotate-180' : ''}`} />
            </button>

            {showJD && (
              <textarea value={jd} onChange={e => setJd(e.target.value)} rows={3}
                placeholder="Paste job description…"
                className="w-full bg-[#0d0d0d] border border-[#2c2c2e] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40 resize-none mb-3" />
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-3">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-xs">{error}</p>
              </div>
            )}

            <button onClick={handleGenerate} disabled={loading}
              className="w-full bg-white text-black font-semibold py-3 rounded-xl text-sm hover:bg-gray-100 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={15} className="animate-spin" />Generating {selectedCountry?.label} resume…</> : <><Globe size={15} />Generate Regional Resume</>}
            </button>
          </>
        )}
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
    { key: 'ats', label: 'ATS', color: '#3b82f6' },
    { key: 'formatting', label: 'Format', color: '#8b5cf6' },
    { key: 'keywords', label: 'Keywords', color: '#22c55e' },
    { key: 'grammar', label: 'Grammar', color: '#f59e0b' },
    { key: 'readability', label: 'Readability', color: '#ec4899' },
    { key: 'impact', label: 'Impact', color: '#14b8a6' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#111] border border-[#222] rounded-2xl p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-white text-lg font-semibold truncate">{resume.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-gray-500 text-xs">
                {resume.source === 'uploaded' ? 'Uploaded' : 'AI Generated'} · {new Date(resume.createdAt).toLocaleDateString()}
              </span>
              {content?.country && (
                <span className="bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full">
                  {COUNTRIES.find(c => c.value === content.country)?.label ?? content.country}
                </span>
              )}
            </div>
          </div>
          <button onClick={onEdit}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors flex-shrink-0 ml-4">
            <Edit3 size={14} /> Open Editor
          </button>
        </div>

        {culturalNotes && (
          <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5">
            <Globe size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-amber-300 text-xs">{culturalNotes}</p>
          </div>
        )}

        {scores && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {SCORE_LABELS.map(({ key, label, color }) => {
              const val = scores[key] ?? 0;
              return (
                <div key={key} className="bg-[#0a0a0a] rounded-xl p-3 text-center border border-[#1e1e1e]">
                  <div className="text-xl font-bold mb-0.5 tabular-nums" style={{ color }}>{val}</div>
                  <div className="text-gray-600 text-xs">{label}</div>
                </div>
              );
            })}
          </div>
        )}

        {breakdown && Object.keys(breakdown).length > 0 && (
          <div className="mt-5 space-y-2.5">
            <p className="text-gray-600 text-xs font-medium uppercase tracking-wider">Section Breakdown</p>
            {Object.entries(breakdown).map(([k, v]) => <Bar key={k} label={k} value={v as number} />)}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden">
        <div className="flex border-b border-[#222]">
          {[
            { key: 'strengths', label: 'Strengths', icon: CheckCircle2 },
            { key: 'improvements', label: 'Suggestions', icon: Lightbulb },
            { key: 'missing', label: 'Missing', icon: AlertCircle },
            { key: 'keywords', label: 'Keywords', icon: KeyRound },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key as any)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-medium transition-colors flex-1 justify-center ${
                tab === key ? 'text-white border-b-2 border-white -mb-px bg-white/3' : 'text-gray-600 hover:text-gray-300'
              }`}>
              <Icon size={12} />{label}
            </button>
          ))}
        </div>
        <div className="p-5 min-h-[160px]">
          {tab === 'strengths' && (
            <ul className="space-y-2.5">
              {!(ai?.strengths?.length) ? <p className="text-gray-600 text-sm">No strengths identified yet.</p>
                : ai.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle2 size={14} className="text-green-400 mt-0.5 flex-shrink-0" />{s}
                  </li>
                ))}
            </ul>
          )}
          {tab === 'improvements' && (
            <div className="space-y-3">
              {!ai?.improvements || !Object.keys(ai.improvements).length
                ? <p className="text-gray-600 text-sm">No suggestions — looks great!</p>
                : Object.entries(ai.improvements).map(([section, tip]) => (
                  <div key={section} className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl p-4">
                    <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wide mb-1.5 capitalize">{section.replace(/([A-Z])/g,' $1')}</p>
                    <p className="text-gray-300 text-sm leading-relaxed">{tip as string}</p>
                  </div>
                ))}
              {ai?.jdOptimizationNotes && (
                <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4">
                  <p className="text-blue-400 text-xs font-semibold mb-1.5">JD OPTIMISATION NOTES</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{ai.jdOptimizationNotes}</p>
                </div>
              )}
            </div>
          )}
          {tab === 'missing' && (
            <div className="space-y-2">
              {!(ai?.missingSections?.length) ? <p className="text-gray-600 text-sm">All key sections present ✓</p>
                : ai.missingSections.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 bg-red-500/5 border border-red-500/15 rounded-xl px-4 py-2.5">
                    <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{s}</span>
                  </div>
                ))}
            </div>
          )}
          {tab === 'keywords' && (
            <div>
              {!(ai?.keywordGaps?.length) ? <p className="text-gray-600 text-sm">No keyword gaps detected!</p> : (
                <>
                  <p className="text-gray-600 text-xs mb-3">Add these to boost ATS ranking:</p>
                  <div className="flex flex-wrap gap-2">
                    {ai.keywordGaps.map((kw, i) => (
                      <span key={i} className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs px-3 py-1.5 rounded-full">{kw}</span>
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
export default function ResumesPage() {
  const router = useRouter();
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

  const CREATE_OPTIONS = [
    { key: 'upload' as ModalType, icon: Upload, label: 'Upload', desc: 'PDF or DOCX · AI scores instantly', color: 'border-[#2c2c2e] hover:border-white' },
    { key: 'generate' as ModalType, icon: Sparkles, label: 'Generate', desc: 'From profile · ATS-optimised', color: 'border-[#2c2c2e] hover:border-white' },
    { key: 'regional' as ModalType, icon: Globe, label: 'International', desc: 'DE, FR, UK, JP + 5 more', color: 'border-purple-500/30 hover:border-purple-400/60' },
  ];

  return (
    <div className="flex h-[calc(100vh-80px)] -m-4 md:-m-8 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 xl:w-80 flex-shrink-0 border-r border-[#1e1e1e] flex flex-col bg-[#080808]">
        <div className="p-4 border-b border-[#1e1e1e]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">My Resumes</h2>
            <span className="text-gray-600 text-xs bg-[#1e1e1e] px-2 py-0.5 rounded-full">{resumes.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {CREATE_OPTIONS.map(({ key, icon: Icon, label, desc, color }) => (
              <button key={String(key)} onClick={() => setModal(key)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all text-center group ${color}`}>
                <Icon size={15} className="text-gray-400 group-hover:text-white transition-colors" />
                <span className="text-white text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-[#1e1e1e] p-4 animate-pulse">
                <div className="h-3 bg-[#1e1e1e] rounded w-3/4 mb-2" />
                <div className="h-2 bg-[#1e1e1e] rounded w-1/2" />
              </div>
            ))
          ) : resumes.length === 0 ? (
            <div className="text-center pt-12 px-4">
              <div className="w-12 h-12 bg-[#1e1e1e] rounded-xl flex items-center justify-center mx-auto mb-3">
                <FileText size={20} className="text-gray-700" />
              </div>
              <p className="text-gray-500 text-sm font-medium mb-1">No resumes yet</p>
              <p className="text-gray-700 text-xs">Upload or generate to get started</p>
            </div>
          ) : resumes.map(r => (
            <ResumeCard key={r.id} resume={r} selected={selected?.id === r.id}
              onClick={() => setSelected(r)} onDelete={e => handleDelete(e, r.id)} />
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6 xl:p-8 bg-[#0a0a0a]">
        {selected ? (
          <ATSPanel resume={selected} onEdit={() => router.push(`/dashboard/resumes/editor/${selected.id}`)} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-10 max-w-2xl mx-auto">
            <div className="text-center">
              <h1 className="text-white text-3xl font-semibold tracking-tight mb-2">Resume Hub</h1>
              <p className="text-gray-500 text-sm">Build, optimise, and manage your resumes with AI</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              {[
                { icon: Upload, label: 'Upload Resume', desc: 'Analyse an existing PDF or DOCX. Get instant ATS score and improvement suggestions.', modal: 'upload' as ModalType, badge: null },
                { icon: Sparkles, label: 'Generate with AI', desc: 'Pull your profile data and build a polished, ATS-optimised CV in seconds.', modal: 'generate' as ModalType, badge: 'Popular' },
                { icon: Globe, label: 'International Format', desc: 'Region-specific resumes for Germany, UK, France, Japan and 4 more countries.', modal: 'regional' as ModalType, badge: 'New' },
              ].map(({ icon: Icon, label, desc, modal: m, badge }) => (
                <button key={label} onClick={() => setModal(m)}
                  className="group bg-[#111] border border-[#222] hover:border-[#444] rounded-2xl p-6 text-left transition-all relative overflow-hidden">
                  {badge && (
                    <span className={`absolute top-4 right-4 text-xs px-2 py-0.5 rounded-full font-medium ${
                      badge === 'New' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20' : 'bg-blue-500/15 text-blue-300 border border-blue-500/20'
                    }`}>{badge}</span>
                  )}
                  <div className="w-10 h-10 bg-[#1e1e1e] group-hover:bg-[#2a2a2a] rounded-xl flex items-center justify-center mb-4 transition-colors">
                    <Icon size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1.5">{label}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs text-gray-700 group-hover:text-gray-400 transition-colors">
                    Get started <ArrowUpRight size={11} />
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-8">
              {[
                { icon: BarChart3, label: '6 AI Scores', desc: 'Deep analysis' },
                { icon: Target, label: 'Keyword Gaps', desc: 'ATS terms' },
                { icon: Globe, label: '8 Countries', desc: 'Region formats' },
                { icon: Lightbulb, label: 'Inline Fixes', desc: 'In-editor AI' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex flex-col items-center gap-1 text-center">
                  <Icon size={16} className="text-gray-700" />
                  <span className="text-gray-500 text-xs font-medium">{label}</span>
                  <span className="text-gray-700 text-xs">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {modal === 'upload' && <UploadModal onClose={() => setModal(null)} onSuccess={handleSuccess} />}
      {modal === 'generate' && <GenerateModal onClose={() => setModal(null)} onSuccess={handleSuccess} />}
      {modal === 'regional' && <RegionalModal onClose={() => setModal(null)} onSuccess={handleSuccess} />}
    </div>
  );
}
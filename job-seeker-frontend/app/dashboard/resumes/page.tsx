'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Upload, Sparkles, X, AlertCircle, CheckCircle2,
  Target, Lightbulb, KeyRound, BarChart3, ArrowUpRight, Loader2,
  Trash2, TrendingUp, Edit3, Star, ChevronDown, Zap
} from 'lucide-react';
import {
  getAllResumes, uploadResume, generateCV, deleteResume,
  type ResumeListItem, type ResumeScores,
} from '@/app/lib/resumeApi';

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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2c2c2e" strokeWidth={size * 0.085} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={size * 0.085}
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 1.2s ease' }}
        />
        <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fill="white" fontSize={fs} fontWeight="700">{score}</text>
        <text x={size / 2} y={size / 2 + fs * 0.85} textAnchor="middle" fill="#6b7280" fontSize={fs * 0.58}>/100</text>
      </svg>
      {label && <span className="text-gray-500 text-xs">{label}</span>}
    </div>
  );
}

// ─── Section progress bar ─────────────────────────────────────────────────
function Bar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400 capitalize">{label.replace(/([A-Z])/g, ' $1').trim()}</span>
        <span className="text-white font-medium">{value}%</span>
      </div>
      <div className="h-1.5 bg-[#2c2c2e] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ─── Resume sidebar card ──────────────────────────────────────────────────
function ResumeCard({ resume, selected, onClick, onDelete }: {
  resume: ResumeListItem; selected: boolean; onClick: () => void; onDelete: (e: React.MouseEvent) => void;
}) {
  const score = resume.atsScore;
  const scoreColor = !score ? 'text-gray-500' : score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
  const scoreBg = !score ? 'bg-gray-500/10' : score >= 80 ? 'bg-green-500/10' : score >= 60 ? 'bg-yellow-500/10' : 'bg-red-500/10';

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl p-4 cursor-pointer border transition-all ${selected ? 'border-white bg-[#2c2c2e]' : 'border-[#2c2c2e] hover:border-[#444] bg-[#111]'}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#2c2c2e] flex items-center justify-center flex-shrink-0">
          <FileText size={18} className="text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-white text-sm font-medium truncate">{resume.name}</p>
            {resume.isPrimary && <Star size={11} className="text-yellow-400 flex-shrink-0 fill-yellow-400" />}
          </div>
          <p className="text-gray-500 text-xs mt-0.5">
            {resume.source === 'uploaded' ? 'Uploaded' : 'AI Generated'} · {new Date(resume.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all">
          <Trash2 size={14} />
        </button>
      </div>
      {score != null && (
        <div className={`mt-3 inline-flex items-center gap-1 ${scoreBg} ${scoreColor} text-xs px-2.5 py-1 rounded-full font-medium`}>
          <TrendingUp size={11} /> ATS {score}%
        </div>
      )}
    </div>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────
function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (r: ResumeListItem) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [jd, setJd] = useState('');
  const [showJD, setShowJD] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const res = await uploadResume(file, name.trim() || undefined, jd.trim() || undefined);
      onSuccess(res.data.data);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Upload failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold text-lg">Upload Resume</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        <div onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-[#2c2c2e] hover:border-white rounded-xl p-8 text-center cursor-pointer transition-colors mb-4"
        >
          <Upload size={32} className="text-gray-600 mx-auto mb-3" />
          {file ? <p className="text-white text-sm font-medium">{file.name}</p> : <>
            <p className="text-white text-sm mb-1">Drop your resume here</p>
            <p className="text-gray-500 text-xs">PDF or DOCX · max 10 MB</p>
          </>}
          <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
        </div>
        <input type="text" placeholder="Resume name (optional)" value={name} onChange={e => setName(e.target.value)}
          className="w-full bg-[#111] border border-[#2c2c2e] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white transition-colors mb-3" />
        <button onClick={() => setShowJD(v => !v)} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white mb-3 transition-colors">
          <Zap size={13} /> Optimise for a job description (optional) <ChevronDown size={13} className={showJD ? 'rotate-180' : ''} />
        </button>
        {showJD && (
          <textarea value={jd} onChange={e => setJd(e.target.value)} rows={4}
            placeholder="Paste the job description here…"
            className="w-full bg-[#111] border border-[#2c2c2e] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white transition-colors resize-none mb-3" />
        )}
        {error && <p className="text-red-400 text-xs mb-3 flex items-center gap-1"><AlertCircle size={13} />{error}</p>}
        <button onClick={handleSubmit} disabled={!file || loading}
          className="w-full bg-white text-black font-medium py-3 rounded-xl text-sm hover:bg-gray-100 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" />Analysing with AI…</> : <><Sparkles size={16} />Analyse Resume</>}
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

  const PROMPT_SUGGESTIONS = [
    'Create a FAANG-style ATS-optimized resume',
    'Make a minimalist one-page resume',
    'Create an executive-level resume',
    'Build a modern tech startup resume',
  ];

  const handleGenerate = async () => {
    setLoading(true); setError('');
    try {
      const res = await generateCV(prompt.trim() || undefined, jd.trim() || undefined);
      onSuccess(res.data.data);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Generation failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white font-semibold text-lg">Generate with AI</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-gray-500 text-sm mb-6">We'll use your profile data to create an ATS-optimised CV.</p>

        <label className="text-gray-400 text-xs mb-2 block">Custom style prompt (optional)</label>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
          placeholder="e.g. Create a FAANG-style resume focused on backend engineering…"
          className="w-full bg-[#111] border border-[#2c2c2e] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white transition-colors resize-none mb-3"
        />
        <div className="flex flex-wrap gap-2 mb-4">
          {PROMPT_SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setPrompt(s)}
              className="text-xs bg-[#2c2c2e] hover:bg-[#3c3c3e] text-gray-300 px-3 py-1.5 rounded-full transition-colors">
              {s}
            </button>
          ))}
        </div>
        <button onClick={() => setShowJD(v => !v)} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white mb-3 transition-colors">
          <Zap size={13} /> Optimise for a job description (optional) <ChevronDown size={13} className={showJD ? 'rotate-180' : ''} />
        </button>
        {showJD && (
          <textarea value={jd} onChange={e => setJd(e.target.value)} rows={4}
            placeholder="Paste the job description here…"
            className="w-full bg-[#111] border border-[#2c2c2e] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white transition-colors resize-none mb-3" />
        )}
        {error && <p className="text-red-400 text-xs mb-3 flex items-center gap-1"><AlertCircle size={13} />{error}</p>}
        <button onClick={handleGenerate} disabled={loading}
          className="w-full bg-white text-black font-medium py-3 rounded-xl text-sm hover:bg-gray-100 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" />Generating…</> : <><Sparkles size={16} />Generate Resume</>}
        </button>
      </div>
    </div>
  );
}

// ─── ATS Analysis Panel ───────────────────────────────────────────────────
function ATSPanel({ resume, onEdit }: { resume: ResumeListItem; onEdit: () => void }) {
  const [tab, setTab] = useState<'strengths' | 'improvements' | 'missing' | 'keywords'>('strengths');
  const ai = resume.aiSuggestions;
  const content = resume.content;
  const scores = ai?.scores;
  const breakdown = content?.atsBreakdown;

  const SCORE_LABELS: { key: keyof ResumeScores; label: string; color: string }[] = [
    { key: 'ats', label: 'ATS', color: '#3b82f6' },
    { key: 'formatting', label: 'Format', color: '#8b5cf6' },
    { key: 'keywords', label: 'Keywords', color: '#22c55e' },
    { key: 'grammar', label: 'Grammar', color: '#f59e0b' },
    { key: 'readability', label: 'Readability', color: '#ec4899' },
    { key: 'impact', label: 'Impact', color: '#14b8a6' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-white text-lg font-semibold">{resume.name}</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {resume.source === 'uploaded' ? 'Uploaded' : 'AI Generated'} · {new Date(resume.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onEdit} className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors flex-shrink-0">
            <Edit3 size={15} /> Open Editor
          </button>
        </div>

        {/* 6-Score Grid */}
        {scores && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {SCORE_LABELS.map(({ key, label, color }) => {
              const val = scores[key] ?? 0;
              return (
                <div key={key} className="bg-[#111] rounded-xl p-3 text-center">
                  <div className="text-xl font-bold mb-0.5" style={{ color }}>{val}</div>
                  <div className="text-gray-500 text-xs">{label}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Section breakdown */}
        {breakdown && Object.keys(breakdown).length > 0 && (
          <div className="mt-5 space-y-2.5">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Section Breakdown</p>
            {Object.entries(breakdown).map(([k, v]) => <Bar key={k} label={k} value={v} />)}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl overflow-hidden">
        <div className="flex border-b border-[#2c2c2e]">
          {[
            { key: 'strengths', label: 'Strengths', icon: CheckCircle2 },
            { key: 'improvements', label: 'Suggestions', icon: Lightbulb },
            { key: 'missing', label: 'Missing', icon: AlertCircle },
            { key: 'keywords', label: 'Keywords', icon: KeyRound },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key as any)}
              className={`flex items-center gap-1.5 px-5 py-3.5 text-xs font-medium transition-colors flex-1 justify-center ${tab === key ? 'text-white border-b-2 border-white -mb-px' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
        <div className="p-5 min-h-[180px]">
          {tab === 'strengths' && (
            <ul className="space-y-2">
              {!(ai?.strengths?.length) ? <p className="text-gray-500 text-sm">No strengths identified.</p>
                : ai.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle2 size={15} className="text-green-400 mt-0.5 flex-shrink-0" />{s}
                  </li>
                ))}
            </ul>
          )}
          {tab === 'improvements' && (
            <div className="space-y-3">
              {!ai?.improvements || !Object.keys(ai.improvements).length
                ? <p className="text-gray-500 text-sm">No suggestions — looks great!</p>
                : Object.entries(ai.improvements).map(([section, tip]) => (
                  <div key={section} className="bg-[#111] border border-[#2c2c2e] rounded-xl p-4">
                    <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wide mb-1 capitalize">{section.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="text-gray-300 text-sm">{tip}</p>
                  </div>
                ))}
              {ai?.jdOptimizationNotes && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-blue-400 text-xs font-semibold mb-1">JD OPTIMISATION NOTES</p>
                  <p className="text-gray-300 text-sm">{ai.jdOptimizationNotes}</p>
                </div>
              )}
            </div>
          )}
          {tab === 'missing' && (
            <div className="space-y-2">
              {!(ai?.missingSections?.length) ? <p className="text-gray-500 text-sm">All key sections present ✓</p>
                : ai.missingSections.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-2.5">
                    <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{s}</span>
                  </div>
                ))}
            </div>
          )}
          {tab === 'keywords' && (
            <div>
              {!(ai?.keywordGaps?.length) ? <p className="text-gray-500 text-sm">No keyword gaps!</p> : <>
                <p className="text-gray-500 text-xs mb-3">Add these to boost ATS ranking:</p>
                <div className="flex flex-wrap gap-2">
                  {ai.keywordGaps.map((kw, i) => (
                    <span key={i} className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs px-3 py-1.5 rounded-full">{kw}</span>
                  ))}
                </div>
              </>}
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
  const [showUpload, setShowUpload] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchResumes = useCallback(async () => {
    try {
      const res = await getAllResumes();
      setResumes(res.data.data);
    } catch { } finally { setLoading(false); }
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

  return (
    <div className="flex h-[calc(100vh-80px)] -m-4 md:-m-8">
      {/* Sidebar */}
      <aside className="w-72 xl:w-80 flex-shrink-0 border-r border-[#2c2c2e] flex flex-col bg-[#0a0a0a]">
        <div className="p-5 border-b border-[#2c2c2e]">
          <h2 className="text-white font-semibold text-base mb-4">My Resumes</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowUpload(true)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#1c1c1e] border border-[#2c2c2e] text-white text-xs py-2.5 rounded-xl hover:border-white transition-colors">
              <Upload size={14} /> Upload
            </button>
            <button onClick={() => setShowGenerate(true)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white text-black text-xs py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
              <Sparkles size={14} /> Generate
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[#2c2c2e] p-4 animate-pulse">
              <div className="h-3 bg-[#2c2c2e] rounded w-3/4 mb-2" /><div className="h-2 bg-[#2c2c2e] rounded w-1/2" />
            </div>
          )) : resumes.length === 0 ? (
            <div className="text-center pt-10 px-4"><FileText size={32} className="text-gray-700 mx-auto mb-2" /><p className="text-gray-500 text-xs">No resumes yet</p></div>
          ) : resumes.map(r => (
            <ResumeCard key={r.id} resume={r} selected={selected?.id === r.id}
              onClick={() => setSelected(r)} onDelete={e => handleDelete(e, r.id)} />
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6 xl:p-8">
        {selected ? (
          <ATSPanel resume={selected} onEdit={() => router.push(`/dashboard/resumes/editor/${selected.id}`)} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-8">
            <div className="text-center">
              <h1 className="text-white text-3xl font-semibold mb-2">Resume Hub</h1>
              <p className="text-gray-500">Upload an existing resume or generate a new one with AI</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
              <button onClick={() => setShowUpload(true)}
                className="group bg-[#1c1c1e] border border-[#2c2c2e] hover:border-white rounded-2xl p-8 text-left transition-all">
                <div className="w-12 h-12 bg-[#2c2c2e] group-hover:bg-[#3c3c3e] rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <Upload size={22} className="text-white" />
                </div>
                <h3 className="text-white font-semibold mb-1.5">Upload Resume</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Upload your existing PDF or DOCX. AI scores it and suggests improvements.</p>
                <div className="mt-4 flex items-center gap-1 text-xs text-gray-600 group-hover:text-white transition-colors">Get ATS score <ArrowUpRight size={13} /></div>
              </button>
              <button onClick={() => setShowGenerate(true)}
                className="group bg-[#1c1c1e] border border-[#2c2c2e] hover:border-white rounded-2xl p-8 text-left transition-all">
                <div className="w-12 h-12 bg-white/10 group-hover:bg-white/20 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <Sparkles size={22} className="text-white" />
                </div>
                <h3 className="text-white font-semibold mb-1.5">Generate with AI</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Pull your profile data and create a polished ATS-optimised CV instantly.</p>
                <div className="mt-4 flex items-center gap-1 text-xs text-gray-600 group-hover:text-white transition-colors">Custom prompts supported <ArrowUpRight size={13} /></div>
              </button>
            </div>
            <div className="flex items-center gap-8 text-center">
              {[{ icon: BarChart3, label: '6 Scores', desc: 'Deep analysis' }, { icon: Target, label: 'Keyword Gaps', desc: 'ATS terms' }, { icon: Lightbulb, label: 'AI Suggestions', desc: 'Actionable tips' }].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <Icon size={20} className="text-gray-600" /><span className="text-gray-400 text-xs font-medium">{label}</span><span className="text-gray-600 text-xs">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={handleSuccess} />}
      {showGenerate && <GenerateModal onClose={() => setShowGenerate(false)} onSuccess={handleSuccess} />}
    </div>
  );
}
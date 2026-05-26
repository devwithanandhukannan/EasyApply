'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Mail, Phone, MapPin, Link2, Code2, Globe,
  Briefcase, GraduationCap, Wrench, Award, BookOpen, Star,
  FileText, ExternalLink, ChevronDown, ChevronUp, Clock
} from 'lucide-react';
import api from '@/app/lib/axios';

const STATUS_OPTIONS = ['applied','reviewed','shortlisted','interview','offer','hired','rejected'];
const STATUS_STYLES: Record<string, string> = {
  applied:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  reviewed:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  shortlisted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  interview:   'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  offer:       'bg-orange-500/10 text-orange-400 border-orange-500/20',
  hired:       'bg-green-500/10 text-green-400 border-green-500/20',
  rejected:    'bg-red-500/10 text-red-400 border-red-500/20',
};

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-zinc-900/40 transition-colors">
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-zinc-400" />
          <span className="font-semibold text-white text-sm">{title}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data,          setData]          = useState<any>(null);
  const [isLoading,     setIsLoading]     = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [resumeTab,     setResumeTab]     = useState<'summary' | 'raw'>('summary');

  useEffect(() => { if (params.applicationId) fetchDetail(); }, [params.applicationId]);

  const fetchDetail = async () => {
    try {
      setIsLoading(true);
      const r = await api.get(`/company/jobs/applications/${params.applicationId}`);
      setData(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      setUpdatingStatus(true);
      await api.patch(`/company/jobs/applications/${params.applicationId}/status`, { status });
      setData((prev: any) => ({ ...prev, application: { ...prev.application, status } }));
    } catch { alert('Failed to update status.'); }
    finally { setUpdatingStatus(false); }
  };

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-white" />
    </div>
  );
  if (!data) return null;

  const { application, job, candidate, appliedResume } = data;
  const resumeContent = appliedResume?.content as any;
  const aiSuggestions = appliedResume?.aiSuggestions as any;

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Back */}
      <button onClick={() => router.push(`/dashboard/jobs/${params.id}`)}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to {job?.title}
      </button>

      {/* Top bar */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
            {candidate?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{candidate?.fullName}</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Applied for <span className="text-zinc-300">{job?.title}</span> · {new Date(application.appliedAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Status changer */}
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${STATUS_STYLES[application.status] ?? ''}`}>
            {application.status}
          </span>
          <select
            value={application.status}
            onChange={e => updateStatus(e.target.value)}
            disabled={updatingStatus}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50">
            {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-4">

          {/* Contact */}
          <Section title="Contact Info" icon={Mail}>
            <div className="space-y-3 mt-1">
              {[
                { icon: Mail,    val: candidate?.email,     label: 'Email'    },
                { icon: Phone,   val: candidate?.phone,     label: 'Phone'    },
                { icon: MapPin,  val: candidate?.location,  label: 'Location' },
              ].filter(x => x.val).map(({ icon: Icon, val, label }) => (
                <div key={label} className="flex items-center gap-2.5 text-sm">
                  <Icon className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
                  <span className="text-zinc-300">{val}</span>
                </div>
              ))}
              {[
                { icon: Link2,    val: candidate?.linkedin, label: 'LinkedIn' },
                { icon: Code2,    val: candidate?.github,   label: 'GitHub'   },
                { icon: Globe,    val: candidate?.portfolio, label: 'Portfolio'},
              ].filter(x => x.val).map(({ icon: Icon, val, label }) => (
                <a key={label} href={val} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2.5 text-sm text-violet-400 hover:text-violet-300 transition-colors">
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{label}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </Section>

          {/* Skills */}
          {candidate?.skills?.length > 0 && (
            <Section title="Skills" icon={Wrench}>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {candidate.skills.map((sk: any, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-zinc-900 text-zinc-300 rounded text-xs">{sk.name ?? sk}</span>
                ))}
              </div>
            </Section>
          )}

          {/* Languages */}
          {candidate?.languages?.length > 0 && (
            <Section title="Languages" icon={BookOpen}>
              <div className="space-y-2 mt-1">
                {candidate.languages.map((l: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-zinc-300">{l.language}</span>
                    <span className="text-zinc-500">{l.proficiency}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ATS Score summary */}
          {appliedResume?.atsScore != null && (
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5">
              <p className="text-xs text-zinc-500 mb-2">ATS Score</p>
              <div className="flex items-end gap-2 mb-3">
                <span className={`text-4xl font-bold ${appliedResume.atsScore >= 70 ? 'text-emerald-400' : appliedResume.atsScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {appliedResume.atsScore}
                </span>
                <span className="text-zinc-500 text-sm mb-1">/ 100</span>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all ${appliedResume.atsScore >= 70 ? 'bg-emerald-500' : appliedResume.atsScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${appliedResume.atsScore}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN (2/3) ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Experience */}
          {candidate?.experience?.length > 0 && (
            <Section title="Work Experience" icon={Briefcase}>
              <div className="space-y-4 mt-2">
                {candidate.experience.map((exp: any, i: number) => (
                  <div key={i} className={i > 0 ? 'pt-4 border-t border-zinc-900' : ''}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="font-semibold text-white text-sm">{exp.role}</p>
                        <p className="text-zinc-400 text-xs">{exp.company}{exp.location && ` · ${exp.location}`}</p>
                      </div>
                      <p className="text-xs text-zinc-500 flex-shrink-0">
                        {exp.startMonth && `${exp.startMonth} `}{exp.startYear} – {exp.current ? 'Present' : `${exp.endMonth ?? ''} ${exp.endYear ?? ''}`}
                      </p>
                    </div>
                    {exp.description && <p className="text-zinc-400 text-xs leading-relaxed mt-1">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Education */}
          {candidate?.education?.length > 0 && (
            <Section title="Education" icon={GraduationCap}>
              <div className="space-y-4 mt-2">
                {candidate.education.map((edu: any, i: number) => (
                  <div key={i} className={i > 0 ? 'pt-4 border-t border-zinc-900' : ''}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white text-sm">{edu.degree} in {edu.field}</p>
                        <p className="text-zinc-400 text-xs">{edu.institution}{edu.location && ` · ${edu.location}`}</p>
                      </div>
                      <p className="text-xs text-zinc-500">{edu.startYear} – {edu.endYear ?? 'Present'}</p>
                    </div>
                    {edu.cgpa && <p className="text-xs text-zinc-500 mt-1">CGPA: {edu.cgpa}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Projects */}
          {candidate?.projects?.length > 0 && (
            <Section title="Projects" icon={Globe}>
              <div className="space-y-4 mt-2">
                {candidate.projects.map((p: any, i: number) => (
                  <div key={i} className={i > 0 ? 'pt-4 border-t border-zinc-900' : ''}>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white text-sm">{p.name}</p>
                      {p.githubLink && <a href={p.githubLink} target="_blank" rel="noreferrer" className="text-violet-400 hover:text-violet-300"><Code2 className="h-3.5 w-3.5" /></a>}
                      {p.liveLink && <a href={p.liveLink} target="_blank" rel="noreferrer" className="text-violet-400 hover:text-violet-300"><ExternalLink className="h-3.5 w-3.5" /></a>}
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed">{p.description}</p>
                    {p.technologies?.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {p.technologies.map((t: string, ti: number) => (
                          <span key={ti} className="px-2 py-0.5 bg-zinc-900 text-zinc-400 text-[10px] rounded">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Certifications */}
          {candidate?.certifications?.length > 0 && (
            <Section title="Certifications" icon={Award}>
              <div className="space-y-2 mt-2">
                {candidate.certifications.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">{c.name}</p>
                      <p className="text-xs text-zinc-500">{c.organization}{c.issueDate && ` · ${c.issueDate}`}</p>
                    </div>
                    {c.credentialUrl && (
                      <a href={c.credentialUrl} target="_blank" rel="noreferrer" className="text-violet-400 text-xs hover:underline">View</a>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Applied Resume */}
          {appliedResume && (
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-zinc-900">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-zinc-400" />
                  <span className="font-semibold text-white text-sm">Applied Resume — {appliedResume.name}</span>
                </div>
                <div className="flex gap-2">
                  {(['summary', 'raw'] as const).map(t => (
                    <button key={t} onClick={() => setResumeTab(t)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${resumeTab === t ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}>
                      {t === 'raw' ? 'Raw Content' : 'AI Analysis'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5">
                {resumeTab === 'summary' && aiSuggestions && (
                  <div className="space-y-4">
                    {aiSuggestions.strengths?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-emerald-400 mb-2">✓ Strengths</p>
                        <ul className="space-y-1">
                          {aiSuggestions.strengths.map((s: string, i: number) => (
                            <li key={i} className="text-xs text-zinc-300 flex gap-2"><span className="text-emerald-500 flex-shrink-0">·</span>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiSuggestions.missingSections?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-yellow-400 mb-2">⚠ Missing Sections</p>
                        <div className="flex flex-wrap gap-1.5">
                          {aiSuggestions.missingSections.map((s: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded text-[10px]">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {aiSuggestions.keywordGaps?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-red-400 mb-2">✗ Keyword Gaps</p>
                        <div className="flex flex-wrap gap-1.5">
                          {aiSuggestions.keywordGaps.map((k: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[10px]">{k}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {!aiSuggestions.strengths && !aiSuggestions.missingSections && (
                      <p className="text-zinc-500 text-sm">No AI analysis data available for this resume.</p>
                    )}
                  </div>
                )}

                {resumeTab === 'raw' && (
                  <pre className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                    {resumeContent ? JSON.stringify(resumeContent, null, 2) : 'No raw content stored.'}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Achievements */}
          {candidate?.achievements?.length > 0 && (
            <Section title="Achievements" icon={Star}>
              <div className="space-y-3 mt-2">
                {candidate.achievements.map((a: any, i: number) => (
                  <div key={i}>
                    <p className="text-sm text-white">{a.title}{a.year && <span className="text-zinc-500 ml-2 text-xs">{a.year}</span>}</p>
                    {a.description && <p className="text-xs text-zinc-400 mt-0.5">{a.description}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

        </div>
      </div>
    </div>
  );
}
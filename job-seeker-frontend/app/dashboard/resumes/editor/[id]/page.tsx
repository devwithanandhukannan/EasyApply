'use client';
// npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-color
//   @tiptap/extension-text-style @tiptap/extension-font-family @tiptap/extension-underline
//   @tiptap/extension-link @tiptap/extension-text-align @tiptap/extension-highlight
//   @tiptap/extension-horizontal-rule

import { useEditor, EditorContent, Extension } from '@tiptap/react';
import { type Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import {TextStyle} from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { useEffect, useState, useCallback, useRef, WheelEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Bold, Italic, Underline as UIUnderline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link2, Undo2, Redo2,
  Save, Download, ChevronLeft, Highlighter, Unlink,
  IndentIcon, Type, Loader2, CheckCheck, AlertCircle,
  ZoomIn, ZoomOut, Maximize2, Layers, Sparkles, History,
  ChevronDown, ChevronRight, RotateCcw, X, Zap, Palette,
  FileText, Copy, Trash2, Eye, EyeOff, Settings, Minus,
} from 'lucide-react';
import {
  getResume, updateResume, convertToEditable, optimizeForJD,
  getKeywordSuggestions, restoreVersion, type ResumeListItem, type ResumeVersion,
} from '@/app/lib/resumeApi';

// ══════════════════════════════════════════════════════════════════════════
// Custom TipTap Extensions
// ══════════════════════════════════════════════════════════════════════════
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions: () => ({ types: ['textStyle'] }),
  addGlobalAttributes() {
    return [{ types: this.options.types, attributes: {
      fontSize: { default: null, parseHTML: el => el.style.fontSize || null, renderHTML: attrs => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {} },
    }}];
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }: any) => chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }: any) => chain().setMark('textStyle', { fontSize: null }).run(),
    } as any;
  },
});

const LineHeight = Extension.create({
  name: 'lineHeight',
  addOptions: () => ({ types: ['paragraph', 'heading'] }),
  addGlobalAttributes() {
    return [{ types: this.options.types, attributes: {
      lineHeight: { default: null, parseHTML: el => el.style.lineHeight || null, renderHTML: attrs => attrs.lineHeight ? { style: `line-height: ${attrs.lineHeight}` } : {} },
    }}];
  },
  addCommands() {
    return {
      setLineHeight: (lineHeight: string) => ({ commands }: any) =>
        this.options.types.every((t: string) => commands.updateAttributes(t, { lineHeight })),
    } as any;
  },
});

const Indent = Extension.create({
  name: 'indent',
  addOptions: () => ({ types: ['paragraph', 'heading'], step: 20, max: 200 }),
  addGlobalAttributes() {
    return [{ types: this.options.types, attributes: {
      indent: { default: 0, parseHTML: el => parseInt(el.style.marginLeft || '0') || 0, renderHTML: attrs => attrs.indent ? { style: `margin-left: ${attrs.indent}px` } : {} },
    }}];
  },
  addCommands() {
    return {
      indent: () => ({ editor, commands }: any) => {
        const cur = editor.getAttributes('paragraph').indent || 0;
        return this.options.types.every((t: string) => commands.updateAttributes(t, { indent: Math.min(cur + this.options.step, this.options.max) }));
      },
      outdent: () => ({ editor, commands }: any) => {
        const cur = editor.getAttributes('paragraph').indent || 0;
        return this.options.types.every((t: string) => commands.updateAttributes(t, { indent: Math.max(cur - this.options.step, 0) }));
      },
    } as any;
  },
  addKeyboardShortcuts() {
    return {
      Tab: () => (this.editor.commands as any).indent(),
      'Shift-Tab': () => (this.editor.commands as any).outdent(),
    };
  },
});

// ══════════════════════════════════════════════════════════════════════════
// Toolbar Helpers
// ══════════════════════════════════════════════════════════════════════════
function Divider() { return <div className="w-px h-5 bg-[#2a2a2a] mx-0.5 flex-shrink-0" />; }

function Btn({ onClick, active = false, title, disabled = false, children }: {
  onClick: () => void; active?: boolean; title?: string; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button type="button" title={title} disabled={disabled} onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-colors flex-shrink-0
        ${active ? 'bg-white/15 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}
        ${disabled ? 'opacity-25 cursor-not-allowed' : ''}`}
    >{children}</button>
  );
}

const FONTS = [
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, sans-serif' },
  { label: 'Garamond', value: 'Garamond, serif' },
  { label: 'Calibri', value: 'Calibri, sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
];
const SIZES = ['8','9','10','11','12','13','14','16','18','20','22','24','28','32','36','48'];
const LINE_HEIGHTS = [{ label: '1.0', value: '1' }, { label: '1.15', value: '1.15' }, { label: '1.5', value: '1.5' }, { label: '2.0', value: '2' }, { label: '2.5', value: '2.5' }];
const COLORS = ['#000000','#1a1a1a','#333333','#555555','#888888','#ffffff','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#2563eb','#dc2626'];

function ColorPicker({ label, onSelect, currentColor, icon: Icon }: { label: string; onSelect: (c: string) => void; currentColor: string; icon: any }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button type="button" title={label} onClick={() => setOpen(o => !o)}
        className="h-7 px-1.5 flex flex-col items-center justify-center rounded hover:bg-white/10 transition-colors">
        <Icon size={13} className="text-gray-400" />
        <div className="w-3.5 h-0.5 rounded-sm mt-0.5" style={{ backgroundColor: currentColor }} />
      </button>
      {open && (
        <div className="absolute top-9 left-0 z-50 bg-[#1a1a1a] border border-[#333] rounded-xl p-3 shadow-2xl w-40">
          <p className="text-gray-500 text-xs mb-2">{label}</p>
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => { onSelect(c); setOpen(false); }}
                className="w-6 h-6 rounded border border-[#333] hover:scale-110 transition-transform"
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <input type="color" defaultValue={currentColor} onChange={e => onSelect(e.target.value)}
            className="w-full h-6 rounded cursor-pointer border-0 bg-transparent" />
        </div>
      )}
    </div>
  );
}

function ToolSelect({ value, onChange, options, width = 'w-32' }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[]; width?: string }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`${width} h-7 bg-[#111] border border-[#2a2a2a] text-white text-xs rounded px-1.5 focus:outline-none focus:border-white cursor-pointer`}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Main Toolbar
// ══════════════════════════════════════════════════════════════════════════
function Toolbar({ editor }: { editor: Editor }) {
  const [textColor, setTextColor] = useState('#1a1a1a');
  const [hlColor, setHlColor] = useState('#fef08a');
  const currentFont = editor.getAttributes('textStyle').fontFamily ?? FONTS[0].value;
  const currentSize = editor.getAttributes('textStyle').fontSize?.replace('px', '') ?? '12';
  const currentLH = editor.getAttributes('paragraph').lineHeight ?? '1.5';
  const setLink = useCallback(() => {
    const prev = editor.getAttributes('link').href ?? '';
    const url = window.prompt('URL', prev);
    if (url === null) return;
    if (!url) { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-[#141414] border-b border-[#222] z-20">
      <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo" disabled={!editor.can().undo()}><Undo2 size={14} /></Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo" disabled={!editor.can().redo()}><Redo2 size={14} /></Btn>
      <Divider />
      <ToolSelect width="w-28" value={currentFont} onChange={v => editor.chain().focus().setFontFamily(v).run()} options={FONTS.map(f => ({ label: f.label, value: f.value }))} />
      <ToolSelect width="w-14" value={currentSize} onChange={v => (editor.commands as any).setFontSize(`${v}px`)} options={SIZES.map(s => ({ label: s, value: s }))} />
      <Divider />
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={14} /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={14} /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UIUnderline size={14} /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strike"><Strikethrough size={14} /></Btn>
      <Divider />
      <ColorPicker label="Text Color" icon={Type} currentColor={textColor} onSelect={c => { setTextColor(c); editor.chain().focus().setColor(c).run(); }} />
      <ColorPicker label="Highlight" icon={Highlighter} currentColor={hlColor} onSelect={c => { setHlColor(c); editor.chain().focus().toggleHighlight({ color: c }).run(); }} />
      <Divider />
      <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Left"><AlignLeft size={14} /></Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Center"><AlignCenter size={14} /></Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Right"><AlignRight size={14} /></Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify"><AlignJustify size={14} /></Btn>
      <Divider />
      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List"><List size={14} /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List"><ListOrdered size={14} /></Btn>
      <Divider />
      <Btn onClick={() => (editor.commands as any).outdent()} title="Decrease Indent"><IndentIcon size={14} className="rotate-180" /></Btn>
      <Btn onClick={() => (editor.commands as any).indent()} title="Increase Indent"><IndentIcon size={14} /></Btn>
      <Divider />
      <ToolSelect width="w-20" value={currentLH} onChange={v => (editor.commands as any).setLineHeight(v)} options={LINE_HEIGHTS} />
      <Divider />
      {([1, 2, 3] as const).map(level => (
        <Btn key={level} onClick={() => editor.chain().focus().toggleHeading({ level }).run()} active={editor.isActive('heading', { level })} title={`H${level}`}>
          <span className="font-bold text-xs">H{level}</span>
        </Btn>
      ))}
      <Divider />
      <Btn onClick={setLink} active={editor.isActive('link')} title="Link"><Link2 size={14} /></Btn>
      {editor.isActive('link') && <Btn onClick={() => editor.chain().focus().unsetLink().run()} title="Remove Link"><Unlink size={14} /></Btn>}
      <Divider />
      <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Insert Horizontal Line"><Minus size={14} /></Btn>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Ruler Component (with Top/Bottom markers)
// ══════════════════════════════════════════════════════════════════════════
function HorizontalRuler({ width, marginLeft, marginRight, onMarginChange }: {
  width: number; marginLeft: number; marginRight: number; onMarginChange: (l: number, r: number) => void;
}) {
  const [dragging, setDragging] = useState<'left' | 'right' | null>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    if (!dragging || !rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (dragging === 'left') onMarginChange(Math.max(20, Math.min(x, width / 2 - 40)), marginRight);
    if (dragging === 'right') onMarginChange(marginLeft, Math.max(20, Math.min(width - x, width / 2 - 40)));
  }, [dragging, marginLeft, marginRight, width, onMarginChange]);

  useEffect(() => {
    if (!dragging) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', () => setDragging(null));
    return () => { document.removeEventListener('mousemove', handleMouseMove); };
  }, [dragging, handleMouseMove]);

  const ticks = Array.from({ length: Math.floor(width / 10) }, (_, i) => i * 10);

  return (
    <div ref={rulerRef} className="relative select-none" style={{ width, height: 24, backgroundColor: '#1a1a1a', borderBottom: '1px solid #2a2a2a', flexShrink: 0 }}>
      {/* Tick marks */}
      {ticks.map(x => (
        <div key={x} style={{ position: 'absolute', left: x, top: x % 50 === 0 ? 10 : x % 20 === 0 ? 14 : 17, width: 1, height: x % 50 === 0 ? 14 : x % 20 === 0 ? 10 : 7, backgroundColor: '#444' }} />
      ))}
      {ticks.filter(x => x % 100 === 0 && x > 0).map(x => (
        <span key={x} style={{ position: 'absolute', left: x + 2, top: 2, fontSize: 8, color: '#666', fontFamily: 'monospace' }}>{Math.round(x * 0.265)}</span>
      ))}
      {/* Margin regions */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: marginLeft, height: '100%', backgroundColor: 'rgba(59,130,246,0.08)' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, width: marginRight, height: '100%', backgroundColor: 'rgba(59,130,246,0.08)' }} />
      {/* Left handle */}
      <div onMouseDown={() => setDragging('left')} style={{ position: 'absolute', left: marginLeft - 4, top: 0, width: 8, height: '100%', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        <div style={{ width: 2, height: 16, backgroundColor: '#3b82f6', borderRadius: 1 }} />
      </div>
      {/* Right handle */}
      <div onMouseDown={() => setDragging('right')} style={{ position: 'absolute', right: marginRight - 4, top: 0, width: 8, height: '100%', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        <div style={{ width: 2, height: 16, backgroundColor: '#3b82f6', borderRadius: 1 }} />
      </div>
    </div>
  );
}

function VerticalRuler({ height, marginTop, marginBottom, onMarginChange }: {
  height: number; marginTop: number; marginBottom: number; onMarginChange: (t: number, b: number) => void;
}) {
  const [dragging, setDragging] = useState<'top' | 'bottom' | null>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    if (!dragging || !rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    if (dragging === 'top') onMarginChange(Math.max(20, Math.min(y, height / 2 - 40)), marginBottom);
    if (dragging === 'bottom') onMarginChange(marginTop, Math.max(20, Math.min(height - y, height / 2 - 40)));
  }, [dragging, marginTop, marginBottom, height, onMarginChange]);

  useEffect(() => {
    if (!dragging) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', () => setDragging(null));
    return () => { document.removeEventListener('mousemove', handleMouseMove); };
  }, [dragging, handleMouseMove]);

  const ticks = Array.from({ length: Math.floor(height / 10) }, (_, i) => i * 10);

  return (
    <div ref={rulerRef} className="relative select-none" style={{ width: 24, height, backgroundColor: '#1a1a1a', borderRight: '1px solid #2a2a2a', flexShrink: 0 }}>
      {/* Tick marks */}
      {ticks.map(y => (
        <div key={y} style={{ position: 'absolute', top: y, left: y % 50 === 0 ? 10 : y % 20 === 0 ? 14 : 17, height: 1, width: y % 50 === 0 ? 14 : y % 20 === 0 ? 10 : 7, backgroundColor: '#444' }} />
      ))}
      {ticks.filter(y => y % 100 === 0 && y > 0).map(y => (
        <span key={y} style={{ position: 'absolute', top: y + 2, left: 2, fontSize: 8, color: '#666', fontFamily: 'monospace', transform: 'rotate(-90deg)', transformOrigin: 'left top', width: 20 }}>{Math.round(y * 0.265)}</span>
      ))}
      {/* Margin regions */}
      <div style={{ position: 'absolute', left: 0, top: 0, height: marginTop, width: '100%', backgroundColor: 'rgba(59,130,246,0.08)' }} />
      <div style={{ position: 'absolute', left: 0, bottom: 0, height: marginBottom, width: '100%', backgroundColor: 'rgba(59,130,246,0.08)' }} />
      {/* Top handle */}
      <div onMouseDown={() => setDragging('top')} style={{ position: 'absolute', top: marginTop - 4, left: 0, height: 8, width: '100%', cursor: 'row-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        <div style={{ height: 2, width: 16, backgroundColor: '#3b82f6', borderRadius: 1 }} />
      </div>
      {/* Bottom handle */}
      <div onMouseDown={() => setDragging('bottom')} style={{ position: 'absolute', bottom: marginBottom - 4, left: 0, height: 8, width: '100%', cursor: 'row-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        <div style={{ height: 2, width: 16, backgroundColor: '#3b82f6', borderRadius: 1 }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Left Panel
// ══════════════════════════════════════════════════════════════════════════
type LeftPanel = 'ai' | 'versions' | null;

function AIPanel({
  resumeId, keywordGaps, onKeywordInsert, onJDOptimize,
}: {
  resumeId: string;
  keywordGaps: string[];
  onKeywordInsert: (kw: string) => void;
  onJDOptimize: () => void;
}) {
  const [showJD, setShowJD] = useState(false);
  const [jd, setJd] = useState('');
  const [loadingJD, setLoadingJD] = useState(false);
  const [fetchingKW, setFetchingKW] = useState(false);
  const [liveKeywords, setLiveKeywords] = useState<string[]>(keywordGaps);

  useEffect(() => { setLiveKeywords(keywordGaps); }, [keywordGaps]);

  const handleFetchKeywords = async () => {
    setFetchingKW(true);
    try {
      const res = await getKeywordSuggestions(resumeId);
      setLiveKeywords(res.data.data.missingKeywords ?? []);
    } catch { }
    finally { setFetchingKW(false); }
  };

  const handleJDOptimize = async () => {
    if (!jd.trim()) return;
    setLoadingJD(true);
    try { await onJDOptimize(); } finally { setLoadingJD(false); }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Keywords */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-400 text-xs font-medium">ATS Keywords</p>
          <button onClick={handleFetchKeywords} disabled={fetchingKW}
            className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 flex items-center gap-1">
            {fetchingKW ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />} Refresh
          </button>
        </div>
        {liveKeywords.length === 0 ? (
          <p className="text-gray-600 text-xs">No gaps found.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {liveKeywords.map((kw, i) => (
              <button key={i} onClick={() => onKeywordInsert(kw)}
                className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs px-2.5 py-1 rounded-full hover:bg-blue-500/25 transition-colors">
                + {kw}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* JD Optimizer */}
      <div className="border-t border-[#2c2c2e] pt-4">
        <button onClick={() => setShowJD(v => !v)}
          className="flex items-center justify-between w-full text-gray-400 text-xs font-medium hover:text-white transition-colors mb-2">
          <span className="flex items-center gap-1.5"><Zap size={13} /> Optimise for JD</span>
          <ChevronDown size={13} className={showJD ? 'rotate-180' : ''} />
        </button>
        {showJD && (
          <div className="space-y-2">
            <textarea value={jd} onChange={e => setJd(e.target.value)} rows={5}
              placeholder="Paste job description…"
              className="w-full bg-[#111] border border-[#2c2c2e] rounded-lg px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-white transition-colors resize-none" />
            <button onClick={handleJDOptimize} disabled={!jd.trim() || loadingJD}
              className="w-full bg-white text-black text-xs py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5">
              {loadingJD ? <><Loader2 size={12} className="animate-spin" />Optimising…</> : <><Sparkles size={12} />Optimise Resume</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function VersionsPanel({ versions, onRestore }: { versions: ResumeVersion[]; onRestore: (v: ResumeVersion) => void }) {
  return (
    <div className="p-4 space-y-2">
      <p className="text-gray-500 text-xs mb-3">{versions.length} version{versions.length !== 1 ? 's' : ''} saved</p>
      {versions.length === 0 ? (
        <p className="text-gray-600 text-xs">No versions yet. Edit and save to create versions.</p>
      ) : [...versions].reverse().map(v => (
        <div key={v.id} className="bg-[#111] border border-[#2c2c2e] rounded-lg p-3">
          <p className="text-white text-xs font-medium mb-0.5">{v.label}</p>
          <p className="text-gray-600 text-xs">{new Date(v.savedAt).toLocaleString()}</p>
          <button onClick={() => onRestore(v)} className="mt-2 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
            <RotateCcw size={11} /> Restore this version
          </button>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Main Editor Page
// ══════════════════════════════════════════════════════════════════════════
export default function ResumeEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [resumeName, setResumeName] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [margins, setMargins] = useState({ top: 60, right: 72, bottom: 60, left: 72 });
  const [activePanel, setActivePanel] = useState<LeftPanel>(null);
  const [keywordGaps, setKeywordGaps] = useState<string[]>([]);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [resumeId, setResumeId] = useState('');

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const canvasRef = useRef<HTMLDivElement>(null);

  // A4 dimensions (px at 96dpi)
  const PAGE_W = 794;
  const PAGE_H = 1123;

  // ─── Mouse wheel zoom ────────────────────────────────────────────────
  useEffect(() => {
    const handleWheel = (e: globalThis.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom(z => Math.max(50, Math.min(200, z - Math.sign(e.deltaY) * 10)));
      }
    };
    const el = canvasRef.current;
    if (el) el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el?.removeEventListener('wheel', handleWheel);
  }, []);

  // ─── TipTap ──────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: { depth: 100 } }),
      TextStyle, Color, FontFamily, FontSize, Underline, LineHeight, Indent,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      HorizontalRule,
    ],
    content: '',
    editorProps: { attributes: { class: 'outline-none min-h-full', style: 'min-height: 900px;' } },
  });

  // ─── Load resume ─────────────────────────────────────────────────────
  const loadResume = useCallback(async () => {
    if (!editor) return;
    setLoading(true);
    try {
      let res = await getResume(id);
      let data = res.data.data;

      if (!data.content?.htmlContent) {
        setConverting(true);
        try { res = await convertToEditable(id); data = res.data.data; }
        catch { }
        setConverting(false);
      }

      setResumeName(data.name);
      setResumeId(data.id);
      setKeywordGaps(data.aiSuggestions?.keywordGaps ?? []);
      setVersions(data.content?.versions ?? []);

      const savedMargins = data.content?.margins ?? { top: 60, right: 72, bottom: 60, left: 72 };
      setMargins(savedMargins);

      const html = data.content?.htmlContent;
      if (html) editor.commands.setContent(html);
      else if (data.content?.autoCorrectedText) {
        editor.commands.setContent(`<p>${data.content.autoCorrectedText.replace(/\n/g, '</p><p>')}</p>`);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [id, editor]);

  useEffect(() => { if (editor) loadResume(); }, [editor]);

  // ─── Auto-save ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => {
      clearTimeout(autoSaveTimer.current);
      setSaveState('idle');
      autoSaveTimer.current = setTimeout(handleSave, 4000);
    };
    editor.on('update', onUpdate);
    return () => { editor.off('update', onUpdate); clearTimeout(autoSaveTimer.current); };
  }, [editor]);

  // ─── Save ────────────────────────────────────────────────────────────
  const handleSave = useCallback(async (label?: string) => {
    if (!editor) return;
    setSaveState('saving');
    try {
      await updateResume(id, { htmlContent: editor.getHTML(), name: resumeName || undefined, margins, versionLabel: label });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch { setSaveState('error'); }
  }, [editor, id, resumeName, margins]);

  // ─── Margin change ───────────────────────────────────────────────────
  const handleHorizontalMarginChange = useCallback((l: number, r: number) => {
    setMargins(m => ({ ...m, left: Math.round(l), right: Math.round(r) }));
  }, []);

  const handleVerticalMarginChange = useCallback((t: number, b: number) => {
    setMargins(m => ({ ...m, top: Math.round(t), bottom: Math.round(b) }));
  }, []);

  // ─── Keyword insert ──────────────────────────────────────────────────
  const handleKeywordInsert = useCallback((kw: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(` ${kw}`).run();
  }, [editor]);

  // ─── JD Optimize ─────────────────────────────────────────────────────
  const handleJDOptimize = useCallback(async () => {
    await loadResume();
  }, [loadResume]);

  // ─── Version restore ─────────────────────────────────────────────────
  const handleVersionRestore = useCallback(async (version: ResumeVersion) => {
    if (!editor || !confirm(`Restore "${version.label}"?`)) return;
    try {
      const res = await restoreVersion(id, version.id);
      editor.commands.setContent(res.data.data.htmlContent);
      const refreshed = await getResume(id);
      setVersions(refreshed.data.data.content?.versions ?? []);
    } catch { }
  }, [editor, id]);

  // ─── Export PDF ──────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    if (!editor) return;
    const win = window.open('', '_blank')!;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${resumeName}</title><style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Georgia, serif;font-size:12px;color:#1a1a1a;padding:${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px;max-width:${PAGE_W}px;margin:0 auto}
h1{font-size:26px;font-weight:700;color:#1a1a1a;margin-bottom:4px;text-align:center}
h2{font-size:15px;font-weight:700;color:#1a1a1a;margin-top:18px;margin-bottom:6px;padding-bottom:3px;border-bottom:1px solid #ddd}
h3{font-size:13px;font-weight:600;color:#1a1a1a;margin-top:10px}
p{margin-bottom:5px}ul,ol{margin-left:18px;margin-bottom:6px}li{margin-bottom:3px}
a{color:#1a1a1a;text-decoration:underline}
hr{border:none;border-top:1px solid #ddd;margin:10px 0}
strong{font-weight:700}em{font-style:italic}
@media print{body{padding:20px}@page{margin:15mm}}
</style></head><body>${editor.getHTML()}</body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
  }, [editor, resumeName, margins]);

  const SaveIcon = saveState === 'saving' ? Loader2 : saveState === 'saved' ? CheckCheck : saveState === 'error' ? AlertCircle : Save;
  const saveLabel = saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Error' : 'Save';
  const saveClass = saveState === 'saved' ? 'bg-green-500/15 border-green-500/40 text-green-400' :
    saveState === 'error' ? 'bg-red-500/15 border-red-500/40 text-red-400' : 'bg-[#1c1c1e] border-[#2c2c2e] text-gray-300 hover:text-white hover:border-white';

  const ZOOM_LEVELS = [50, 75, 100, 125, 150];

  const PANEL_TABS = [
    { key: 'ai' as LeftPanel, icon: Sparkles, label: 'AI Tools' },
    { key: 'versions' as LeftPanel, icon: History, label: 'History' },
  ];

  const EDITOR_CSS = `
    .ProseMirror { font-family: Georgia, serif; font-size: 12px; color: #1a1a1a; }
    .ProseMirror h1 { font-size: 26px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; text-align: center; }
    .ProseMirror h2 { font-size: 15px; font-weight: 700; color: #1a1a1a; margin-top: 18px; margin-bottom: 6px; padding-bottom: 3px; border-bottom: 1px solid #ddd; }
    .ProseMirror h3 { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-top: 10px; }
    .ProseMirror p  { margin-bottom: 5px; color: #1a1a1a; }
    .ProseMirror ul { list-style-type: disc; margin-left: 18px; margin-bottom: 6px; }
    .ProseMirror ol { list-style-type: decimal; margin-left: 18px; margin-bottom: 6px; }
    .ProseMirror li { margin-bottom: 3px; color: #1a1a1a; }
    .ProseMirror a  { color: #1a1a1a; text-decoration: underline; }
    .ProseMirror hr { border: none; border-top: 1px solid #ddd; margin: 10px 0; }
    .ProseMirror strong { font-weight: 700; }
    .ProseMirror em { font-style: italic; }
    .ProseMirror u { text-decoration: underline; }
    .ProseMirror s { text-decoration: line-through; }
    .ProseMirror mark { border-radius: 2px; padding: 0 2px; }
    .ProseMirror:focus { outline: none; }
    .ProseMirror ::selection { background: rgba(59,130,246,0.3); }
  `;

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] overflow-hidden" style={{ fontFamily: '"Inter", sans-serif' }}>

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 py-2.5 bg-[#111] border-b border-[#222] z-40 flex-shrink-0">
        <button onClick={() => router.push('/dashboard/resumes')}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm flex-shrink-0">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="w-px h-4 bg-[#333]" />
        <input value={resumeName} onChange={e => setResumeName(e.target.value)}
          className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-600 min-w-0"
          placeholder="Untitled Resume"
        />

        {/* Zoom controls */}
        <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-1 py-1">
          <button onClick={() => setZoom(z => Math.max(50, z - 25))} className="text-gray-400 hover:text-white p-1 transition-colors"><ZoomOut size={14} /></button>
          <select value={zoom} onChange={e => setZoom(Number(e.target.value))}
            className="bg-transparent text-white text-xs w-14 text-center focus:outline-none cursor-pointer">
            {ZOOM_LEVELS.map(z => <option key={z} value={z}>{z}%</option>)}
          </select>
          <button onClick={() => setZoom(z => Math.min(200, z + 25))} className="text-gray-400 hover:text-white p-1 transition-colors"><ZoomIn size={14} /></button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => handleSave('Manual save')} disabled={saveState === 'saving'}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all flex-shrink-0 ${saveClass}`}>
            <SaveIcon size={13} className={saveState === 'saving' ? 'animate-spin' : ''} />
            {saveLabel}
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium flex-shrink-0">
            <Download size={13} /> Export PDF
          </button>
        </div>
      </header>

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      {editor && !loading && <Toolbar editor={editor} />}

      {/* ── Body: Left panel + Canvas ────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left panel tabs */}
        <div className="flex flex-col border-r border-[#222] bg-[#0f0f0f] flex-shrink-0">
          {PANEL_TABS.map(({ key, icon: Icon, label }) => (
            <button key={String(key)} title={label ?? ''} onClick={() => setActivePanel(p => p === key ? null : key)}
              className={`p-3 flex flex-col items-center gap-1 transition-colors text-xs ${activePanel === key ? 'text-white bg-white/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
              <Icon size={16} /><span className="text-[9px]">{label}</span>
            </button>
          ))}
        </div>

        {/* Left expandable panel */}
        {activePanel && (
          <div className="w-60 border-r border-[#222] bg-[#0f0f0f] flex-shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#222]">
              <span className="text-white text-xs font-medium">
                {activePanel === 'ai' ? 'AI Tools' : 'Version History'}
              </span>
              <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white"><X size={14} /></button>
            </div>
            {activePanel === 'ai' && (
              <AIPanel resumeId={id} keywordGaps={keywordGaps} onKeywordInsert={handleKeywordInsert} onJDOptimize={handleJDOptimize} />
            )}
            {activePanel === 'versions' && <VersionsPanel versions={versions} onRestore={handleVersionRestore} />}
          </div>
        )}

        {/* ── Canvas area ────────────────────────────────────────────── */}
        <div ref={canvasRef} className="flex-1 overflow-auto bg-[#181818]">
          {loading || converting ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="relative">
                {/* Skeleton A4 preview */}
                <div style={{ width: 300, background: '#fff', borderRadius: 4, padding: 24, opacity: 0.08 }}>
                  <div style={{ height: 20, background: '#ccc', borderRadius: 4, marginBottom: 8, width: '60%', marginLeft: '20%' }} />
                  <div style={{ height: 10, background: '#ccc', borderRadius: 4, marginBottom: 4, width: '80%', marginLeft: '10%' }} />
                  <div style={{ height: 10, background: '#ccc', borderRadius: 4, marginBottom: 16, width: '70%', marginLeft: '15%' }} />
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ height: 8, background: '#ccc', borderRadius: 4, marginBottom: 6, width: `${70 + (i % 3) * 10}%` }} />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={28} className="text-white animate-spin" />
                </div>
              </div>
              <p className="text-gray-400 text-sm">{converting ? 'Converting to editable format…' : 'Loading resume…'}</p>
            </div>
          ) : (
            <div className="flex py-8" style={{ minHeight: '100%', justifyContent: 'center' }}>
              {/* Vertical Ruler */}
              <VerticalRuler
                height={Math.round(PAGE_H * zoom / 100)}
                marginTop={Math.round(margins.top * zoom / 100)}
                marginBottom={Math.round(margins.bottom * zoom / 100)}
                onMarginChange={handleVerticalMarginChange}
              />

              <div className="flex flex-col items-center">
                {/* Horizontal Ruler */}
                <HorizontalRuler
                  width={Math.round(PAGE_W * zoom / 100)}
                  marginLeft={Math.round(margins.left * zoom / 100)}
                  marginRight={Math.round(margins.right * zoom / 100)}
                  onMarginChange={handleHorizontalMarginChange}
                />

                {/* A4 Paper */}
                <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', marginBottom: `${(zoom / 100 - 1) * PAGE_H}px` }}>
                  <div style={{
                    width: PAGE_W, minHeight: PAGE_H,
                    backgroundColor: '#ffffff',
                    paddingTop: margins.top, paddingRight: margins.right,
                    paddingBottom: margins.bottom, paddingLeft: margins.left,
                    boxShadow: '0 4px 40px rgba(0,0,0,0.5)',
                    borderRadius: 2,
                    position: 'relative',
                  }}>
                    {/* Top margin line */}
                    <div style={{
                      position: 'absolute',
                      top: margins.top,
                      left: 0,
                      right: 0,
                      height: 1,
                      background: 'linear-gradient(to right, transparent, rgba(59,130,246,0.3) 10%, rgba(59,130,246,0.3) 90%, transparent)',
                      pointerEvents: 'none',
                    }} />
                    
                    {/* Bottom margin line */}
                    <div style={{
                      position: 'absolute',
                      bottom: margins.bottom,
                      left: 0,
                      right: 0,
                      height: 1,
                      background: 'linear-gradient(to right, transparent, rgba(59,130,246,0.3) 10%, rgba(59,130,246,0.3) 90%, transparent)',
                      pointerEvents: 'none',
                    }} />

                    {editor && <EditorContent editor={editor} />}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CSS injection ────────────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: EDITOR_CSS }} />
    </div>
  );
}
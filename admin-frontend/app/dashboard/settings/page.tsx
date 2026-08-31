'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  CreditCard,
  Mail,
  Bot,
  Video,
  Sliders,
  Users,
  X,
  Zap,
  Send,
  AlertTriangle,
  Building2,
  Save,
  Loader2,
  CheckCircle2,
  Sun,
  Moon,
  Shield,
  KeyRound,
} from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useGlassToast } from '@/app/components/GlassToastContainer';

type Tab = 'payment' | 'email' | 'ai' | 'video' | 'queue';

export default function SettingsPage() {
  const { mode, setMode } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('payment');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useGlassToast();

  // Settings states
  // Payment
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState('');
  const [razorpayMode, setRazorpayMode] = useState('test');
  const [testingPayment, setTestingPayment] = useState(false);

  // Email
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [emailFrom, setEmailFrom] = useState('');
  const [emailFromName, setEmailFromName] = useState('DearResume');
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);

  // AI
  const [groqApiKey, setGroqApiKey] = useState('');
  const [groqModel, setGroqModel] = useState('llama-3.3-70b-versatile');
  const [allowSeekerAiResumeCreation, setAllowSeekerAiResumeCreation] = useState(true);

  // Video
  const [livekitApiUrl, setLivekitApiUrl] = useState('');
  const [livekitApiKey, setLivekitApiKey] = useState('');
  const [livekitApiSecret, setLivekitApiSecret] = useState('');

  // Queue
  const [walkInQueueMaxGlobal, setWalkInQueueMaxGlobal] = useState(200);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      if (res.data.success) {
        const s = res.data.settings;
        setRazorpayKeyId(s.razorpayKeyId || '');
        setRazorpayKeySecret(s.razorpayKeySecret || '');
        setRazorpayWebhookSecret(s.razorpayWebhookSecret || '');
        setRazorpayMode(s.razorpayMode || 'test');

        setSmtpHost(s.smtpHost || 'smtp.gmail.com');
        setSmtpPort(s.smtpPort || 587);
        setSmtpUser(s.smtpUser || '');
        setSmtpPass(s.smtpPass || '');
        setEmailFrom(s.emailFrom || '');
        setEmailFromName(s.emailFromName || 'DearResume');

        setGroqApiKey(s.groqApiKey || '');
        setGroqModel(s.groqModel || 'llama-3.3-70b-versatile');
        setAllowSeekerAiResumeCreation(s.allowSeekerAiResumeCreation !== undefined ? !!s.allowSeekerAiResumeCreation : true);

        setLivekitApiUrl(s.livekitApiUrl || '');
        setLivekitApiKey(s.livekitApiKey || '');
        setLivekitApiSecret(s.livekitApiSecret || '');

        setWalkInQueueMaxGlobal(s.walkInQueueMaxGlobal || 200);
      }
    } catch (err) {
      console.error(err);
      showToast('Error', 'Failed to load settings', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let res;
      if (activeTab === 'payment') {
        res = await api.put('/admin/settings/payment', {
          razorpayKeyId,
          razorpayKeySecret,
          razorpayWebhookSecret,
          razorpayMode,
        });
      } else if (activeTab === 'email') {
        res = await api.put('/admin/settings/email', {
          smtpHost,
          smtpPort: Number(smtpPort),
          smtpUser,
          smtpPass,
          emailFrom,
          emailFromName,
        });
      } else if (activeTab === 'ai') {
        res = await api.put('/admin/settings/ai', { groqApiKey, groqModel, allowSeekerAiResumeCreation });
      } else if (activeTab === 'video') {
        res = await api.put('/admin/settings/video', {
          livekitApiUrl,
          livekitApiKey,
          livekitApiSecret,
        });
      } else if (activeTab === 'queue') {
        res = await api.put('/admin/settings/queue', {
          walkInQueueMaxGlobal: Number(walkInQueueMaxGlobal),
        });
      }

      if (res?.data?.success) {
        showToast('Saved', `${activeTab.toUpperCase()} configuration encrypted & saved.`, 'success');
        fetchSettings();
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to save settings', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailRecipient) {
      showToast('Validation', 'Please enter a test email address', 'warning');
      return;
    }
    setTestingEmail(true);
    try {
      const res = await api.post('/admin/settings/email/test', {
        smtpHost,
        smtpPort: Number(smtpPort),
        smtpUser,
        smtpPass,
        emailFrom: emailFrom || smtpUser,
        sendTo: testEmailRecipient,
      });
      if (res.data.success) {
        showToast('Success', res.data.message, 'success');
      } else {
        showToast('Failed', res.data.message, 'danger');
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'SMTP test failed', 'danger');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestPayment = async () => {
    setTestingPayment(true);
    try {
      const res = await api.post('/admin/settings/payment/test', {
        razorpayKeyId,
        razorpayKeySecret,
      });
      if (res.data.success) {
        showToast('Verified', res.data.message, 'success');
      } else {
        showToast('Error', res.data.message, 'danger');
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Razorpay connection failed', 'danger');
    } finally {
      setTestingPayment(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'payment', label: 'Payment Gateway', icon: CreditCard },
    { id: 'email', label: 'SMTP Email', icon: Mail },
    { id: 'ai', label: 'Groq AI Model', icon: Bot },
    { id: 'video', label: 'LiveKit Streaming', icon: Video },
    { id: 'queue', label: 'Queue Capacity', icon: Users },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-white tracking-tight">
            Platform Configuration
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] dark:text-zinc-400 mt-1">
            Encrypted credentials, SMTP relays, Groq AI model selection, and maintenance gates
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#0071e3] text-white shadow-xs'
                  : 'bg-white dark:bg-[#121422] border border-black/[0.06] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#181b2e]'
              }`}
            >
              <Icon size={15} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Settings Card */}
      {loading ? (
        <div className="glass-card rounded-3xl p-16 text-center text-zinc-400">
          <div className="inline-block w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs font-medium">Decrypting platform credentials...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="glass-card rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#121422] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-6">
          
          {/* PAYMENT TAB */}
          {activeTab === 'payment' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Razorpay Payment Gateway</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Credentials for company subscription checkout and automated verification. Secrets are encrypted with AES-256 in PostgreSQL.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Razorpay Key ID</label>
                  <input
                    className="input"
                    placeholder="rzp_test_... or rzp_live_..."
                    value={razorpayKeyId}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Environment Mode</label>
                  <select className="select" value={razorpayMode} onChange={(e) => setRazorpayMode(e.target.value)}>
                    <option value="test">Test Mode (Sandbox / Development)</option>
                    <option value="live">Live Mode (Production)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Razorpay Key Secret (Encrypted)</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="••••••••••••••••"
                    value={razorpayKeySecret}
                    onChange={(e) => setRazorpayKeySecret(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Razorpay Webhook Secret (Encrypted)</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="••••••••••••••••"
                    value={razorpayWebhookSecret}
                    onChange={(e) => setRazorpayWebhookSecret(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestPayment}
                  disabled={testingPayment}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  {testingPayment ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                  <span>{testingPayment ? 'Testing Connection...' : 'Test Razorpay Connection'}</span>
                </button>
              </div>
            </div>
          )}

          {/* EMAIL TAB */}
          {activeTab === 'email' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">SMTP Relay / System Email</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Sends transactional notifications, verification codes, and interview invites.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">SMTP Host</label>
                  <input className="input" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com" />
                </div>
                <div>
                  <label className="label">Port</label>
                  <input className="input" type="number" value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} placeholder="587" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">SMTP Username / Email</label>
                  <input className="input" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="workbridge.anandhu@gmail.com" />
                </div>
                <div>
                  <label className="label">App Password (Encrypted)</label>
                  <input className="input" type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder="••••••••••••" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">From Address</label>
                  <input className="input" value={emailFrom} onChange={(e) => setEmailFrom(e.target.value)} placeholder="noreply@dearresume.com" />
                </div>
                <div>
                  <label className="label">Sender Display Name</label>
                  <input className="input" value={emailFromName} onChange={(e) => setEmailFromName(e.target.value)} placeholder="DearResume" />
                </div>
              </div>

              {/* Test Email Box */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#181b2e] border border-black/[0.04] dark:border-white/[0.06] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white">
                  <Send size={14} className="text-[#0071e3]" />
                  <span>Send Live Test Email</span>
                </div>
                <div className="flex gap-2">
                  <input
                    className="input text-xs"
                    placeholder="Enter your email to receive a test message..."
                    value={testEmailRecipient}
                    onChange={(e) => setTestEmailRecipient(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={testingEmail}
                    className="btn-secondary text-xs shrink-0 flex items-center gap-1.5"
                  >
                    {testingEmail ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    <span>{testingEmail ? 'Sending...' : 'Send Test'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI TAB */}
          {activeTab === 'ai' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Groq AI LLM Engine</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Powers instant resume score analysis, ATS parsing, and AI CV generation.
                </p>
              </div>

              <div>
                <label className="label">Groq API Key (Encrypted)</label>
                <input
                  className="input"
                  type="password"
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  placeholder="gsk_••••••••••••••••••••••••"
                />
              </div>

              <div>
                <label className="label">Inference Model</label>
                <select className="select" value={groqModel} onChange={(e) => setGroqModel(e.target.value)}>
                  <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended - High Accuracy)</option>
                  <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Fast & Lightweight)</option>
                  <option value="mixtral-8x7b-32768">mixtral-8x7b-32768 (High Context)</option>
                  <option value="deepseek-r1-distill-llama-70b">deepseek-r1-distill-llama-70b (Reasoning Focus)</option>
                  <option value="gemma2-9b-it">gemma2-9b-it (Google Gemma 2)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-[#181b2e] border border-black/[0.04] dark:border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-white">Allow Seeker AI Resume Creation</div>
                    <div className="text-[11px] text-zinc-400">Master switch allowing candidates to generate and enhance resumes</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={allowSeekerAiResumeCreation}
                  onChange={(e) => setAllowSeekerAiResumeCreation(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0071e3] focus:ring-[#0071e3] cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* VIDEO TAB */}
          {activeTab === 'video' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">LiveKit Video Streaming</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  WebRTC rooms for walk-in queues and live scheduled interviews.
                </p>
              </div>

              <div>
                <label className="label">LiveKit Server URL</label>
                <input
                  className="input"
                  value={livekitApiUrl}
                  onChange={(e) => setLivekitApiUrl(e.target.value)}
                  placeholder="https://livekit.example.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">LiveKit API Key</label>
                  <input className="input" value={livekitApiKey} onChange={(e) => setLivekitApiKey(e.target.value)} placeholder="devkey" />
                </div>
                <div>
                  <label className="label">LiveKit API Secret (Encrypted)</label>
                  <input className="input" type="password" value={livekitApiSecret} onChange={(e) => setLivekitApiSecret(e.target.value)} placeholder="••••••••" />
                </div>
              </div>
            </div>
          )}



          {/* QUEUE TAB */}
          {activeTab === 'queue' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Walk-In Queue Platform Limits</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Global capacity constraints. Employers cannot set room capacity exceeding this platform ceiling.
                </p>
              </div>

              <div>
                <label className="label">Global Maximum Room Queue Capacity</label>
                <input
                  className="input"
                  type="number"
                  value={walkInQueueMaxGlobal}
                  onChange={(e) => setWalkInQueueMaxGlobal(Number(e.target.value))}
                  min={10}
                  max={1000}
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Default is 200 candidates per room. Companies can choose room size &le; this value.
                </p>
              </div>
            </div>
          )}

          {/* Save Button Footer */}
          <div className="flex justify-end pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{saving ? 'Encrypting & Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

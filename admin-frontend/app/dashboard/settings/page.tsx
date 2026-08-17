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
} from 'lucide-react';

type Tab = 'payment' | 'email' | 'ai' | 'video' | 'general' | 'queue';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('payment');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
  const [emailFromName, setEmailFromName] = useState('EasyApply');
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);

  // AI
  const [groqApiKey, setGroqApiKey] = useState('');
  const [groqModel, setGroqModel] = useState('llama-3.3-70b-versatile');

  // Video
  const [livekitApiUrl, setLivekitApiUrl] = useState('');
  const [livekitApiKey, setLivekitApiKey] = useState('');
  const [livekitApiSecret, setLivekitApiSecret] = useState('');

  // General
  const [platformName, setPlatformName] = useState('EasyApply');
  const [platformLogoUrl, setPlatformLogoUrl] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowNewCompanyReg, setAllowNewCompanyReg] = useState(true);
  const [allowNewSeekerReg, setAllowNewSeekerReg] = useState(true);

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
        setEmailFromName(s.emailFromName || 'EasyApply');

        setGroqApiKey(s.groqApiKey || '');
        setGroqModel(s.groqModel || 'llama-3.3-70b-versatile');

        setLivekitApiUrl(s.livekitApiUrl || '');
        setLivekitApiKey(s.livekitApiKey || '');
        setLivekitApiSecret(s.livekitApiSecret || '');

        setPlatformName(s.platformName || 'EasyApply');
        setPlatformLogoUrl(s.platformLogoUrl || '');
        setSupportEmail(s.supportEmail || '');
        setMaintenanceMode(!!s.maintenanceMode);
        setAllowNewCompanyReg(!!s.allowNewCompanyReg);
        setAllowNewSeekerReg(!!s.allowNewSeekerReg);

        setWalkInQueueMaxGlobal(s.walkInQueueMaxGlobal || 200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
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
        res = await api.put('/admin/settings/ai', { groqApiKey, groqModel });
      } else if (activeTab === 'video') {
        res = await api.put('/admin/settings/video', {
          livekitApiUrl,
          livekitApiKey,
          livekitApiSecret,
        });
      } else if (activeTab === 'general') {
        res = await api.put('/admin/settings/general', {
          platformName,
          platformLogoUrl,
          supportEmail,
          maintenanceMode,
          allowNewCompanyReg,
          allowNewSeekerReg,
        });
      } else if (activeTab === 'queue') {
        res = await api.put('/admin/settings/queue', {
          walkInQueueMaxGlobal: Number(walkInQueueMaxGlobal),
        });
      }

      if (res?.data?.success) {
        setMsg({ type: 'success', text: `${activeTab.toUpperCase()} settings saved and encrypted in database.` });
        fetchSettings();
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailRecipient) {
      setMsg({ type: 'error', text: 'Please enter a test email address below' });
      return;
    }
    setTestingEmail(true);
    setMsg(null);
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
        setMsg({ type: 'success', text: res.data.message });
      } else {
        setMsg({ type: 'error', text: res.data.message });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'SMTP test failed' });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestPayment = async () => {
    setTestingPayment(true);
    setMsg(null);
    try {
      const res = await api.post('/admin/settings/payment/test', {
        razorpayKeyId,
        razorpayKeySecret,
      });
      if (res.data.success) {
        setMsg({ type: 'success', text: res.data.message });
      } else {
        setMsg({ type: 'error', text: res.data.message });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Razorpay test failed' });
    } finally {
      setTestingPayment(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'payment', label: 'Razorpay / Payment', icon: CreditCard },
    { id: 'email', label: 'SMTP / Email', icon: Mail },
    { id: 'ai', label: 'AI Configuration (Groq)', icon: Bot },
    { id: 'video', label: 'LiveKit Video', icon: Video },
    { id: 'general', label: 'General & Maintenance', icon: Sliders },
    { id: 'queue', label: 'Walk-In Queue Policy', icon: Users },
  ];

  return (
    <div style={{ width: '100%' }}>
      <div className="page-header">
        <h1 className="page-title">Platform Configuration Hub</h1>
        <p className="page-subtitle">Manage platform-wide API secrets, SMTP, AI models and system parameters</p>
      </div>

      {msg && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{msg.text}</span>
          <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setMsg(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px', width: '100%' }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={`settings-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(t.id); setMsg(null); }}
            >
              <Icon size={16} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', width: '100%' }}>
          Loading credentials...
        </div>
      ) : (
        <form onSubmit={handleSave} className="glass" style={{ padding: '32px', width: '100%', boxSizing: 'border-box' }}>
          {/* PAYMENT TAB */}
          {activeTab === 'payment' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0' }}>Razorpay Gateway Details</h3>
                <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
                  Credentials used for company subscription checkout and payment verification. Secrets are AES-256 encrypted.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
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
                  <label className="label">Gateway Mode</label>
                  <select className="input" value={razorpayMode} onChange={(e) => setRazorpayMode(e.target.value)}>
                    <option value="test">Test Mode (Sandbox)</option>
                    <option value="live">Live Mode (Production)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label className="label">Razorpay Key Secret (Encrypted)</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Enter new key secret (or leave masked)"
                    value={razorpayKeySecret}
                    onChange={(e) => setRazorpayKeySecret(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Razorpay Webhook Secret (Encrypted)</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Enter webhook secret (or leave masked)"
                    value={razorpayWebhookSecret}
                    onChange={(e) => setRazorpayWebhookSecret(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button type="button" className="btn btn-ghost" onClick={handleTestPayment} disabled={testingPayment} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {testingPayment ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                  <span>{testingPayment ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>
            </div>
          )}

          {/* EMAIL TAB */}
          {activeTab === 'email' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0' }}>SMTP / Transactional Email</h3>
                <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
                  Configured for system emails (interview links, verification tokens, offer letters).
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label className="label">SMTP Host</label>
                  <input className="input" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com" />
                </div>
                <div>
                  <label className="label">SMTP Port</label>
                  <input className="input" type="number" value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} placeholder="587" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label className="label">SMTP Username / Email</label>
                  <input className="input" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="workbridge.anandhu@gmail.com" />
                </div>
                <div>
                  <label className="label">SMTP Password / App Password (Encrypted)</label>
                  <input className="input" type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder="••••••••••••" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label className="label">From Address</label>
                  <input className="input" value={emailFrom} onChange={(e) => setEmailFrom(e.target.value)} placeholder="noreply@easyapply.com" />
                </div>
                <div>
                  <label className="label">From Sender Name</label>
                  <input className="input" value={emailFromName} onChange={(e) => setEmailFromName(e.target.value)} placeholder="EasyApply" />
                </div>
              </div>

              {/* Test Email Section */}
              <div style={{ background: 'var(--surface2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '12px' }}>
                  <Send size={16} className="text-indigo-400" />
                  <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>Send Live Test Email</h4>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    className="input"
                    placeholder="Enter recipient email (e.g. your@gmail.com)"
                    value={testEmailRecipient}
                    onChange={(e) => setTestEmailRecipient(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="btn btn-ghost" onClick={handleTestEmail} disabled={testingEmail} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {testingEmail ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    <span>{testingEmail ? 'Sending...' : 'Send Test'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI TAB */}
          {activeTab === 'ai' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0' }}>Groq AI LLM Settings</h3>
                <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
                  Powers ATS resume scoring, job match evaluation, and profile auto-parsing.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="label">Groq API Key (Encrypted)</label>
                <input
                  className="input"
                  type="password"
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  placeholder="gsk_••••••••••••••••••••••••"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="label">Inference Model</label>
                <select className="input" value={groqModel} onChange={(e) => setGroqModel(e.target.value)}>
                  <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended - High Accuracy)</option>
                  <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Fastest)</option>
                  <option value="mixtral-8x7b-32768">mixtral-8x7b-32768 (Long Context)</option>
                </select>
              </div>
            </div>
          )}

          {/* VIDEO TAB */}
          {activeTab === 'video' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0' }}>LiveKit Video Streaming Infrastructure</h3>
                <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
                  Powers walk-in instant rooms and scheduled live technical interview rooms.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="label">LiveKit API Server URL</label>
                <input className="input" value={livekitApiUrl} onChange={(e) => setLivekitApiUrl(e.target.value)} placeholder="https://livekit.interviewer.stibe.in" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
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

          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0' }}>General & Platform Controls</h3>
                <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
                  Brand identity, support routing, and platform registration gate controls.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label className="label">Platform Name</label>
                  <input className="input" value={platformName} onChange={(e) => setPlatformName(e.target.value)} placeholder="EasyApply" />
                </div>
                <div>
                  <label className="label">Support Email</label>
                  <input className="input" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="support@easyapply.com" />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="label">Platform Logo Image URL</label>
                <input className="input" value={platformLogoUrl} onChange={(e) => setPlatformLogoUrl(e.target.value)} placeholder="https://..." />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', background: 'var(--surface2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertTriangle size={18} className="text-amber-400" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>Maintenance Mode</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Shows maintenance banner across frontends</div>
                    </div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Building2 size={18} className="text-indigo-400" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>Allow New Company Signups</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>When disabled, new employer registrations are blocked</div>
                    </div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={allowNewCompanyReg} onChange={(e) => setAllowNewCompanyReg(e.target.checked)} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Users size={18} className="text-purple-400" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>Allow New Job Seeker Signups</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>When disabled, candidate registrations are blocked</div>
                    </div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={allowNewSeekerReg} onChange={(e) => setAllowNewSeekerReg(e.target.checked)} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* QUEUE TAB */}
          {activeTab === 'queue' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0' }}>Walk-In Queue Platform Limits</h3>
                <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
                  Global capacity constraints. Employers cannot set room capacity exceeding this platform ceiling.
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="label">Global Maximum Room Queue Capacity</label>
                <input
                  className="input"
                  type="number"
                  value={walkInQueueMaxGlobal}
                  onChange={(e) => setWalkInQueueMaxGlobal(Number(e.target.value))}
                  min={10}
                  max={1000}
                />
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>
                  Default is 200 candidates per room. Companies can choose room size ≤ this value.
                </p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{saving ? 'Encrypting & Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

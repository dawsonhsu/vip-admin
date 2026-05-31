'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Button, Form, Input, Space } from 'antd';

type Step = 'email' | 'password' | 'register' | 'register-result';

// SVG Trophy icon — drawn inline, no library
function TrophyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 21h8M12 17v4M7 4H5a2 2 0 00-2 2v1c0 3.31 2.69 6 6 6h6c3.31 0 6-2.69 6-6V6a2 2 0 00-2-2h-2"
        stroke="#D4AF37"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 4v7a5 5 0 0010 0V4H7z"
        stroke="#D4AF37"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(212,175,55,0.1)"
      />
    </svg>
  );
}

// Shared label style
const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#a89a72',
  fontWeight: 500,
  marginBottom: 6,
  display: 'block',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(212,175,55,0.3)',
  borderRadius: 8,
  color: '#f0ead6',
  fontSize: 15,
  padding: '10px 14px',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'var(--font-sans), system-ui, sans-serif',
};

const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  height: 48,
  background: 'linear-gradient(135deg, #D4AF37 0%, #b8960f 100%)',
  border: 'none',
  borderRadius: 10,
  color: '#071f18',
  fontSize: 15,
  fontWeight: 800,
  cursor: 'pointer',
  letterSpacing: '0.06em',
  fontFamily: 'var(--font-sans), system-ui, sans-serif',
};

const ghostBtnStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  background: 'transparent',
  border: 'none',
  color: '#a89a72',
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'var(--font-sans), system-ui, sans-serif',
};

export default function WinWinWinLoginPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [registerRow, setRegisterRow] = useState('');
  const [registerInfo, setRegisterInfo] = useState<{ email: string; name: string }>({ email: '', name: '' });

  // Form field state — controlled via Ant Form
  async function checkEmail(values: { email: string }) {
    const nextEmail = values.email.trim().toLowerCase();
    setLoading(true);
    const response = await fetch('/api/winwinwin/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: nextEmail }),
    });
    setLoading(false);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.exists) { message.error('此信箱未登記'); return; }
    setEmail(nextEmail);
    setName(data.name ?? '');
    setStep('password');
  }

  async function login(values: { password: string }) {
    setLoading(true);
    const response = await fetch('/api/winwinwin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: values.password }),
    });
    setLoading(false);
    if (response.ok) { router.replace('/winwinwin/home'); return; }
    const data = await response.json().catch(() => ({}));
    message.error(data?.error === 'disabled' ? '帳號已停用' : '密碼錯誤');
  }

  async function generateRegisterRow(values: { name: string; email: string; password: string }) {
    setLoading(true);
    const response = await fetch('/api/winwinwin/auth/register-row', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: values.name.trim(), email: values.email.trim().toLowerCase(), password: values.password }),
    });
    setLoading(false);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.row) {
      const errs: Record<string, string> = { invalid_email: 'Email 格式不正確', invalid_name: '名稱不可空，最多 32 字', invalid_password: '密碼需 6-128 字元' };
      message.error(errs[data?.error] || '產生失敗');
      return;
    }
    setRegisterRow(data.row);
    setRegisterInfo({ email: data.email, name: data.name });
    setStep('register-result');
  }

  async function copyToClipboard() {
    try { await navigator.clipboard.writeText(registerRow); message.success('已複製，傳給管理員即可'); }
    catch { message.error('複製失敗，請手動長按選取'); }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px 48px',
        boxSizing: 'border-box',
      }}
    >
      {/* Hero brand block */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ marginBottom: 14 }}>
          <TrophyIcon />
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-serif), serif',
            fontSize: 30,
            fontWeight: 900,
            color: '#f0ead6',
            margin: '0 0 8px',
            letterSpacing: '0.04em',
            lineHeight: 1.2,
          }}
        >
          世界盃朋友局
        </h1>
        <p
          style={{
            fontSize: 13,
            color: '#a89a72',
            margin: 0,
            letterSpacing: '0.04em',
          }}
        >
          Pinnacle 即時盤口 · 朋友局僅供記錄 · 無金流
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'linear-gradient(160deg, rgba(15,45,34,0.98) 0%, rgba(10,36,25,0.99) 100%)',
          border: '1px solid rgba(212,175,55,0.28)',
          borderRadius: 16,
          padding: '28px 24px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(212,175,55,0.12) inset',
          boxSizing: 'border-box',
        }}
      >
        {/* Gold top bar */}
        <div
          style={{
            height: 2,
            background: 'linear-gradient(90deg, #D4AF37 0%, rgba(212,175,55,0.2) 100%)',
            borderRadius: 2,
            marginBottom: 24,
          }}
        />

        {step === 'email' && (
          <Form layout="vertical" onFinish={checkEmail} requiredMark={false}>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Email</label>
              <Form.Item
                name="email"
                style={{ marginBottom: 0 }}
                rules={[{ required: true, message: '請輸入 email' }, { type: 'email', message: 'email 格式不正確' }]}
              >
                <Input size="large" autoComplete="email" inputMode="email" style={inputStyle} />
              </Form.Item>
            </div>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <button type="submit" style={primaryBtnStyle} disabled={loading}>
                {loading ? '確認中…' : '下一步'}
              </button>
              <button type="button" style={ghostBtnStyle} onClick={() => setStep('register')}>
                還沒有帳號？申請加入
              </button>
            </Space>
          </Form>
        )}

        {step === 'password' && (
          <Form layout="vertical" onFinish={login} requiredMark={false}>
            <p style={{ fontFamily: 'var(--font-serif), serif', fontSize: 18, fontWeight: 700, color: '#f0ead6', margin: '0 0 20px' }}>
              你好，{name}
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>密碼</label>
              <Form.Item name="password" style={{ marginBottom: 0 }} rules={[{ required: true, message: '請輸入密碼' }]}>
                <Input.Password size="large" autoComplete="current-password" style={inputStyle} />
              </Form.Item>
            </div>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <button type="submit" style={primaryBtnStyle} disabled={loading}>
                {loading ? '登入中…' : '登入'}
              </button>
              <button type="button" style={ghostBtnStyle} onClick={() => setStep('email')}>
                換一個 email
              </button>
            </Space>
          </Form>
        )}

        {step === 'register' && (
          <Form layout="vertical" onFinish={generateRegisterRow} requiredMark={false}>
            <p style={{ fontFamily: 'var(--font-serif), serif', fontSize: 17, fontWeight: 700, color: '#f0ead6', margin: '0 0 6px' }}>
              申請加入朋友局
            </p>
            <p style={{ fontSize: 12, color: '#a89a72', margin: '0 0 20px', lineHeight: 1.6 }}>
              填完按「產生申請碼」，把產出的一行字傳給管理員，幫你加進去後就能登入。
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>顯示名稱</label>
              <Form.Item name="name" style={{ marginBottom: 0 }} rules={[{ required: true, message: '請輸入名稱' }]}>
                <Input size="large" maxLength={32} style={inputStyle} />
              </Form.Item>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <Form.Item name="email" style={{ marginBottom: 0 }} rules={[{ required: true, message: '請輸入 email' }, { type: 'email', message: 'email 格式不正確' }]}>
                <Input size="large" autoComplete="email" inputMode="email" style={inputStyle} />
              </Form.Item>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>密碼（至少 6 字元）</label>
              <Form.Item name="password" style={{ marginBottom: 0 }} rules={[{ required: true, message: '請輸入密碼' }, { min: 6, message: '至少 6 字元' }]}>
                <Input.Password size="large" autoComplete="new-password" style={inputStyle} />
              </Form.Item>
            </div>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <button type="submit" style={primaryBtnStyle} disabled={loading}>
                {loading ? '產生中…' : '產生申請碼'}
              </button>
              <button type="button" style={ghostBtnStyle} onClick={() => setStep('email')}>
                已有帳號，回去登入
              </button>
            </Space>
          </Form>
        )}

        {step === 'register-result' && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>✅</span>
              <p style={{ fontFamily: 'var(--font-serif), serif', fontSize: 17, fontWeight: 700, color: '#f0ead6', margin: 0 }}>
                申請碼已產生
              </p>
            </div>
            <p style={{ fontSize: 12, color: '#a89a72', margin: 0, lineHeight: 1.6 }}>
              把下方整段傳給管理員（{registerInfo.name} / {registerInfo.email}），加好後就可以用剛剛設的密碼登入。
            </p>
            <textarea
              readOnly
              value={registerRow}
              rows={4}
              onClick={(e) => (e.currentTarget as HTMLTextAreaElement).select()}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(212,175,55,0.25)',
                borderRadius: 8,
                color: '#4ade80',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 11,
                padding: '10px 12px',
                boxSizing: 'border-box',
                resize: 'none',
                lineHeight: 1.6,
              }}
            />
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <button type="button" style={primaryBtnStyle} onClick={copyToClipboard}>
                複製申請碼
              </button>
              <button type="button" style={ghostBtnStyle} onClick={() => { setStep('email'); setRegisterRow(''); }}>
                回登入
              </button>
            </Space>
          </Space>
        )}
      </div>
    </div>
  );
}

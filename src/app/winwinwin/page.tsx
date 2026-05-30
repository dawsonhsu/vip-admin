'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Button, Card, Form, Input, Space, Typography } from 'antd';

type Step = 'email' | 'password' | 'register' | 'register-result';

export default function WinWinWinLoginPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [registerRow, setRegisterRow] = useState('');
  const [registerInfo, setRegisterInfo] = useState<{ email: string; name: string }>({
    email: '',
    name: '',
  });

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
    if (!response.ok || !data.exists) {
      message.error('此信箱未登記');
      return;
    }

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

    if (response.ok) {
      router.replace('/winwinwin/home');
      return;
    }

    const data = await response.json().catch(() => ({}));
    if (data?.error === 'disabled') {
      message.error('帳號已停用');
      return;
    }
    message.error('密碼錯誤');
  }

  async function generateRegisterRow(values: { name: string; email: string; password: string }) {
    setLoading(true);
    const response = await fetch('/api/winwinwin/auth/register-row', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      }),
    });
    setLoading(false);

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.row) {
      const errs: Record<string, string> = {
        invalid_email: 'Email 格式不正確',
        invalid_name: '名稱不可空，最多 32 字',
        invalid_password: '密碼需 6-128 字元',
      };
      message.error(errs[data?.error] || '產生失敗');
      return;
    }

    setRegisterRow(data.row);
    setRegisterInfo({ email: data.email, name: data.name });
    setStep('register-result');
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(registerRow);
      message.success('已複製，傳給管理員即可');
    } catch {
      message.error('複製失敗，請手動長按選取');
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '56px 18px 24px',
        boxSizing: 'border-box',
        background: 'linear-gradient(180deg, #eef6ff 0%, #f8fafc 45%, #ffffff 100%)',
      }}
    >
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        <div>
          <Typography.Text strong style={{ color: '#1668dc', letterSpacing: 0 }}>
            winwinwin
          </Typography.Text>
          <Typography.Title level={2} style={{ margin: '8px 0 0', fontSize: 30 }}>
            世界盃朋友局
          </Typography.Title>
          <Typography.Text type="secondary">登入後查看賽事、冠軍盤與下注紀錄。</Typography.Text>
        </div>

        <Card style={{ borderRadius: 8, border: '1px solid #e5e7eb' }} styles={{ body: { padding: 20 } }}>
          {step === 'email' && (
            <Form layout="vertical" onFinish={checkEmail} requiredMark={false}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: '請輸入 email' },
                  { type: 'email', message: 'email 格式不正確' },
                ]}
              >
                <Input size="large" autoComplete="email" inputMode="email" />
              </Form.Item>
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                  下一步
                </Button>
                <Button type="text" block onClick={() => setStep('register')}>
                  還沒有帳號？申請加入
                </Button>
              </Space>
            </Form>
          )}

          {step === 'password' && (
            <Form layout="vertical" onFinish={login} requiredMark={false}>
              <Typography.Title level={4} style={{ marginTop: 0 }}>
                你好，{name}
              </Typography.Title>
              <Form.Item name="password" label="密碼" rules={[{ required: true, message: '請輸入密碼' }]}>
                <Input.Password size="large" autoComplete="current-password" />
              </Form.Item>
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                  登入
                </Button>
                <Button type="text" block onClick={() => setStep('email')}>
                  換一個 email
                </Button>
              </Space>
            </Form>
          )}

          {step === 'register' && (
            <Form layout="vertical" onFinish={generateRegisterRow} requiredMark={false}>
              <Typography.Title level={4} style={{ marginTop: 0 }}>
                申請加入朋友局
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
                填完按「產生申請碼」，把產出的一行字傳給管理員，幫你加進去後就能登入。
              </Typography.Paragraph>
              <Form.Item name="name" label="顯示名稱" rules={[{ required: true, message: '請輸入名稱' }]}>
                <Input size="large" maxLength={32} />
              </Form.Item>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: '請輸入 email' },
                  { type: 'email', message: 'email 格式不正確' },
                ]}
              >
                <Input size="large" autoComplete="email" inputMode="email" />
              </Form.Item>
              <Form.Item
                name="password"
                label="密碼（自己想一個，至少 6 字元）"
                rules={[
                  { required: true, message: '請輸入密碼' },
                  { min: 6, message: '至少 6 字元' },
                ]}
              >
                <Input.Password size="large" autoComplete="new-password" />
              </Form.Item>
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                  產生申請碼
                </Button>
                <Button type="text" block onClick={() => setStep('email')}>
                  已有帳號，回去登入
                </Button>
              </Space>
            </Form>
          )}

          {step === 'register-result' && (
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <Typography.Title level={4} style={{ marginTop: 0 }}>
                ✅ 申請碼已產生
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 0 }}>
                把下方整段傳給管理員（{registerInfo.name} / {registerInfo.email}），加好後就可以用剛剛設的密碼登入。
              </Typography.Paragraph>
              <Input.TextArea
                value={registerRow}
                readOnly
                autoSize={{ minRows: 3, maxRows: 6 }}
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}
                onClick={(e) => (e.currentTarget as HTMLTextAreaElement).select()}
              />
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Button type="primary" size="large" block onClick={copyToClipboard}>
                  複製申請碼
                </Button>
                <Button
                  type="text"
                  block
                  onClick={() => {
                    setStep('email');
                    setRegisterRow('');
                  }}
                >
                  回登入
                </Button>
              </Space>
            </Space>
          )}
        </Card>
      </Space>
    </div>
  );
}

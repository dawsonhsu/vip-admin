'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Button, Card, Form, Input, Space, Typography } from 'antd';

type Step = 'email' | 'password';

export default function WinWinWinLoginPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

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
          {step === 'email' ? (
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
              <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                下一步
              </Button>
            </Form>
          ) : (
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
        </Card>
      </Space>
    </div>
  );
}

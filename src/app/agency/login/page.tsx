'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Form, Input, Tabs, Typography, Space, Alert, message } from 'antd';
import { MobileOutlined, LockOutlined, SafetyOutlined, MessageOutlined } from '@ant-design/icons';
import { agencyAccount } from '@/data/agency/shared';

const { Title, Text, Paragraph } = Typography;

// 對應後端三支登入 API：
//   POST /agency/login/auth  phone + password + google_code
//   POST /agency/pwd/login   phone + password
//   POST /agency/otp/login   otp_id + code
// Demo 不驗證憑證，任意輸入即可進入。

export default function AgencyLoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState('password');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const signIn = () => {
    setLoading(true);
    try {
      localStorage.setItem('agency-demo-session', agencyAccount.username);
    } catch {
      // 私密模式下寫入失敗不阻擋 demo
    }
    setTimeout(() => {
      setLoading(false);
      router.push('/agency/home');
    }, 400);
  };

  const passwordForm = (
    <Form layout="vertical" onFinish={signIn} initialValues={{ phone: agencyAccount.phone }}>
      <Form.Item
        name="phone"
        label="手機號碼"
        rules={[{ required: true, message: '請輸入手機號碼' }]}
      >
        <Input
          data-e2e-id="agency-login-phone-input"
          size="large"
          prefix={<MobileOutlined />}
          placeholder="09xxxxxxxxx"
        />
      </Form.Item>
      <Form.Item name="password" label="密碼" rules={[{ required: true, message: '請輸入密碼' }]}>
        <Input.Password
          data-e2e-id="agency-login-password-input"
          size="large"
          prefix={<LockOutlined />}
          placeholder="請輸入登入密碼"
        />
      </Form.Item>
      <Form.Item name="google_code" label="Google 驗證碼" extra="未綁定 2FA 的帳號可留空">
        <Input
          data-e2e-id="agency-login-google-code-input"
          size="large"
          prefix={<SafetyOutlined />}
          maxLength={6}
          placeholder="6 位數驗證碼"
        />
      </Form.Item>
      <Button
        data-e2e-id="agency-login-submit-btn"
        type="primary"
        size="large"
        htmlType="submit"
        loading={loading}
        block
      >
        登 入
      </Button>
    </Form>
  );

  const otpForm = (
    <Form layout="vertical" onFinish={signIn} initialValues={{ phone: agencyAccount.phone }}>
      <Form.Item
        name="phone"
        label="手機號碼"
        rules={[{ required: true, message: '請輸入手機號碼' }]}
      >
        <Input
          data-e2e-id="agency-login-otp-phone-input"
          size="large"
          prefix={<MobileOutlined />}
          placeholder="09xxxxxxxxx"
        />
      </Form.Item>
      <Form.Item label="簡訊驗證碼" required>
        <Space.Compact style={{ width: '100%' }}>
          <Form.Item name="code" noStyle rules={[{ required: true, message: '請輸入驗證碼' }]}>
            <Input
              data-e2e-id="agency-login-otp-code-input"
              size="large"
              prefix={<MessageOutlined />}
              maxLength={6}
              placeholder="6 位數驗證碼"
            />
          </Form.Item>
          <Button
            data-e2e-id="agency-login-otp-send-btn"
            size="large"
            onClick={() => {
              setOtpSent(true);
              message.success('驗證碼已送出（demo 不會真的發送簡訊）');
            }}
          >
            {otpSent ? '重新發送' : '取得驗證碼'}
          </Button>
        </Space.Compact>
      </Form.Item>
      <Button
        data-e2e-id="agency-login-otp-submit-btn"
        type="primary"
        size="large"
        htmlType="submit"
        loading={loading}
        block
      >
        登 入
      </Button>
    </Form>
  );

  return (
    <div
      data-e2e-id="agency-login-root"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      }}
    >
      <Card
        data-e2e-id="agency-login-card"
        style={{ width: '100%', maxWidth: 420 }}
        styles={{ body: { padding: 32 } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 4 }}>
            Filbet 代理後台
          </Title>
          <Text type="secondary">Agency Portal</Text>
        </div>

        <Alert
          data-e2e-id="agency-login-demo-hint"
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
          message="Demo 環境"
          description="此為假登入，任意填寫即可進入。"
        />

        <Tabs
          data-e2e-id="agency-login-tabs"
          activeKey={tab}
          onChange={setTab}
          items={[
            { key: 'password', label: '密碼登入', children: passwordForm },
            { key: 'otp', label: 'OTP 登入', children: otpForm },
          ]}
        />

        <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 16, marginBottom: 0 }}>
          密碼連續錯誤 5 次將鎖定帳號 7 天，請聯繫線上客服解鎖。
        </Paragraph>
      </Card>
    </div>
  );
}

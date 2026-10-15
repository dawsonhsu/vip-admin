'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Form, Input, Tabs, Typography, Space, Alert, message } from 'antd';
import { MobileOutlined, LockOutlined, SafetyOutlined, MessageOutlined } from '@ant-design/icons';
import { agencyAccount } from '@/data/agency/shared';

const { Title, Text, Paragraph } = Typography;

// 对应后端三支登录 API：
//   POST /agency/login/auth  phone + password + google_code
//   POST /agency/pwd/login   phone + password
//   POST /agency/otp/login   otp_id + code
// Demo 不验证凭证，任意输入即可进入。

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
      // 私密模式下写入失败不阻挡 demo
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
        label="手机号码"
        rules={[{ required: true, message: '请输入手机号码' }]}
      >
        <Input
          data-e2e-id="agency-login-phone-input"
          size="large"
          prefix={<MobileOutlined />}
          placeholder="09xxxxxxxxx"
        />
      </Form.Item>
      <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
        <Input.Password
          data-e2e-id="agency-login-password-input"
          size="large"
          prefix={<LockOutlined />}
          placeholder="请输入登录密码"
        />
      </Form.Item>
      <Form.Item name="google_code" label="Google 验证码" extra="未绑定 2FA 的账号可留空">
        <Input
          data-e2e-id="agency-login-google-code-input"
          size="large"
          prefix={<SafetyOutlined />}
          maxLength={6}
          placeholder="6 位数验证码"
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
        label="手机号码"
        rules={[{ required: true, message: '请输入手机号码' }]}
      >
        <Input
          data-e2e-id="agency-login-otp-phone-input"
          size="large"
          prefix={<MobileOutlined />}
          placeholder="09xxxxxxxxx"
        />
      </Form.Item>
      <Form.Item label="短信验证码" required>
        <Space.Compact style={{ width: '100%' }}>
          <Form.Item name="code" noStyle rules={[{ required: true, message: '请输入验证码' }]}>
            <Input
              data-e2e-id="agency-login-otp-code-input"
              size="large"
              prefix={<MessageOutlined />}
              maxLength={6}
              placeholder="6 位数验证码"
            />
          </Form.Item>
          <Button
            data-e2e-id="agency-login-otp-send-btn"
            size="large"
            onClick={() => {
              setOtpSent(true);
              message.success('验证码已发送（demo 不会真的发送短信）');
            }}
          >
            {otpSent ? '重新发送' : '获取验证码'}
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
            Filbet 代理后台
          </Title>
          <Text type="secondary">Agency Portal</Text>
        </div>

        <Alert
          data-e2e-id="agency-login-demo-hint"
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
          message="Demo 环境"
          description="此为假登录，任意填写即可进入。"
        />

        <Tabs
          data-e2e-id="agency-login-tabs"
          activeKey={tab}
          onChange={setTab}
          items={[
            { key: 'password', label: '密码登录', children: passwordForm },
            { key: 'otp', label: 'OTP 登录', children: otpForm },
          ]}
        />

        <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 16, marginBottom: 0 }}>
          密码连续错误 5 次将锁定账号 7 天，请联系线上客服解锁。
        </Paragraph>
      </Card>
    </div>
  );
}

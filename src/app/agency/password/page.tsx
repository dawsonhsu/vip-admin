'use client';

import React from 'react';
import { Alert, Button, Card, Form, Input, message, Typography } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined, LockOutlined, MobileOutlined } from '@ant-design/icons';
import { agencyAccount } from '@/data/agency/shared';

interface PasswordFormValues {
  phone: string;
  password: string;
  new_password: string;
  confirm_password: string;
}

export default function AgencyPasswordPage() {
  const [form] = Form.useForm<PasswordFormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  const submit = () => {
    messageApi.success('密码已更新（demo 不会真的变更）');
    form.resetFields();
  };

  const visibilityIcon = (field: string, visible: boolean) => visible
    ? <EyeOutlined data-e2e-id={`agency-password-${field}-visibility-btn`} aria-label="隐藏密码" />
    : <EyeInvisibleOutlined data-e2e-id={`agency-password-${field}-visibility-btn`} aria-label="显示密码" />;

  return (
    <div style={{ width: '100%', maxWidth: 520, margin: '24px auto' }}>
      {contextHolder}
      <Card data-e2e-id="agency-password-form-card">
        <Typography.Title level={5} style={{ marginTop: 0 }}>修改密码</Typography.Title>
        <Alert
          type="info"
          showIcon
          message="密码规则"
          description="新密码至少 8 个字符，且须同时包含英文字母与数字。此为演示环境，提交后不会实际变更密码。"
          style={{ marginBottom: 24 }}
        />
        <Form<PasswordFormValues>
          data-e2e-id="agency-password-form"
          form={form}
          layout="vertical"
          initialValues={{ phone: agencyAccount.phone }}
          onFinish={submit}
          requiredMark={false}
        >
          <Form.Item name="phone" label="手机号码">
            <Input data-e2e-id="agency-password-phone-input" prefix={<MobileOutlined />} disabled autoComplete="tel" />
          </Form.Item>
          <Form.Item name="password" label="当前密码" rules={[{ required: true, message: '请输入当前密码' }]}>
            <Input.Password
              data-e2e-id="agency-password-current-input"
              prefix={<LockOutlined />}
              placeholder="请输入当前密码"
              autoComplete="current-password"
              iconRender={(visible) => visibilityIcon('current', visible)}
            />
          </Form.Item>
          <Form.Item
            name="new_password"
            label="新密码"
            validateFirst
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '新密码至少需要 8 个字符' },
              { pattern: /^(?=.*[A-Za-z])(?=.*\d)[\s\S]+$/, message: '新密码须同时包含英文字母与数字' },
            ]}
          >
            <Input.Password
              data-e2e-id="agency-password-new-input"
              prefix={<LockOutlined />}
              placeholder="至少 8 个字符，包含英文字母与数字"
              autoComplete="new-password"
              iconRender={(visible) => visibilityIcon('new', visible)}
            />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label="确认新密码"
            dependencies={['new_password']}
            validateFirst
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value: string) {
                  return !value || value === getFieldValue('new_password')
                    ? Promise.resolve()
                    : Promise.reject(new Error('两次输入的新密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              data-e2e-id="agency-password-confirm-input"
              prefix={<LockOutlined />}
              placeholder="请再次输入新密码"
              autoComplete="new-password"
              iconRender={(visible) => visibilityIcon('confirm', visible)}
            />
          </Form.Item>
          <Button data-e2e-id="agency-password-submit-btn" type="primary" htmlType="submit" block>更新密码</Button>
        </Form>
      </Card>
    </div>
  );
}

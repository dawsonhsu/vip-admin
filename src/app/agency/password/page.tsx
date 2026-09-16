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
    messageApi.success('密碼已更新（demo 不會真的變更）');
    form.resetFields();
  };

  const visibilityIcon = (field: string, visible: boolean) => visible
    ? <EyeOutlined data-e2e-id={`agency-password-${field}-visibility-btn`} aria-label="隱藏密碼" />
    : <EyeInvisibleOutlined data-e2e-id={`agency-password-${field}-visibility-btn`} aria-label="顯示密碼" />;

  return (
    <div style={{ width: '100%', maxWidth: 520, margin: '24px auto' }}>
      {contextHolder}
      <Card data-e2e-id="agency-password-form-card">
        <Typography.Title level={5} style={{ marginTop: 0 }}>修改密碼</Typography.Title>
        <Alert
          type="info"
          showIcon
          message="密碼規則"
          description="新密碼至少 8 個字元，且須同時包含英文字母與數字。此為示範環境，送出後不會實際變更密碼。"
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
          <Form.Item name="phone" label="手機號碼">
            <Input data-e2e-id="agency-password-phone-input" prefix={<MobileOutlined />} disabled autoComplete="tel" />
          </Form.Item>
          <Form.Item name="password" label="目前密碼" rules={[{ required: true, message: '請輸入目前密碼' }]}>
            <Input.Password
              data-e2e-id="agency-password-current-input"
              prefix={<LockOutlined />}
              placeholder="請輸入目前密碼"
              autoComplete="current-password"
              iconRender={(visible) => visibilityIcon('current', visible)}
            />
          </Form.Item>
          <Form.Item
            name="new_password"
            label="新密碼"
            validateFirst
            rules={[
              { required: true, message: '請輸入新密碼' },
              { min: 8, message: '新密碼至少需要 8 個字元' },
              { pattern: /^(?=.*[A-Za-z])(?=.*\d)[\s\S]+$/, message: '新密碼須同時包含英文字母與數字' },
            ]}
          >
            <Input.Password
              data-e2e-id="agency-password-new-input"
              prefix={<LockOutlined />}
              placeholder="至少 8 個字元，包含英文字母與數字"
              autoComplete="new-password"
              iconRender={(visible) => visibilityIcon('new', visible)}
            />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label="確認新密碼"
            dependencies={['new_password']}
            validateFirst
            rules={[
              { required: true, message: '請再次輸入新密碼' },
              ({ getFieldValue }) => ({
                validator(_, value: string) {
                  return !value || value === getFieldValue('new_password')
                    ? Promise.resolve()
                    : Promise.reject(new Error('兩次輸入的新密碼不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              data-e2e-id="agency-password-confirm-input"
              prefix={<LockOutlined />}
              placeholder="請再次輸入新密碼"
              autoComplete="new-password"
              iconRender={(visible) => visibilityIcon('confirm', visible)}
            />
          </Form.Item>
          <Button data-e2e-id="agency-password-submit-btn" type="primary" htmlType="submit" block>更新密碼</Button>
        </Form>
      </Card>
    </div>
  );
}

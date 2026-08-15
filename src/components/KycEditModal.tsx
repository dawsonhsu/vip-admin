'use client';

import React, { useEffect } from 'react';
import { Button, DatePicker, Form, Input, Modal, Select, Space, Typography, theme } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type { KycRecord } from '@/data/kycData';

const { Text } = Typography;
const { TextArea } = Input;

interface EditFormValues {
  firstName: string;
  middleName?: string;
  lastName: string;
  birthday: Dayjs;
  gender: KycRecord['gender'];
  phone: string;
  nationality: KycRecord['nationality'];
  birthplace: string;
  currentAddress: string;
  permanentAddress: string;
  nearestBranch: string;
  occupation: string;
  incomeSource: string;
  userMessage?: string;
}

interface KycEditModalProps {
  open: boolean;
  record: KycRecord | null;
  onCancel: () => void;
  onSave: (record: KycRecord) => void;
}

const branchOptions = ['Makati Branch', 'Quezon City Branch', 'Cebu Branch', 'Davao Branch', 'Pasay Branch'];

export default function KycEditModal({ open, record, onCancel, onSave }: KycEditModalProps) {
  const [form] = Form.useForm<EditFormValues>();
  const { token } = theme.useToken();

  useEffect(() => {
    if (!open || !record) return;
    form.resetFields();
    form.setFieldsValue({
      firstName: record.firstName,
      middleName: record.middleName || undefined,
      lastName: record.lastName,
      birthday: dayjs(record.birthday),
      gender: record.gender,
      phone: record.phone,
      nationality: record.nationality,
      birthplace: record.birthplace,
      currentAddress: record.currentAddress,
      permanentAddress: record.permanentAddress,
      nearestBranch: record.nearestBranch,
      occupation: record.occupation,
      incomeSource: record.incomeSource,
      userMessage: record.userMessage,
    });
  }, [form, open, record]);

  const handleSave = async () => {
    if (!record) return;
    const values = await form.validateFields();
    onSave({
      ...record,
      ...values,
      phone: record.phone,
      middleName: values.middleName || '',
      birthday: values.birthday.format('YYYY-MM-DD'),
      userMessage: record.userMessage,
    });
  };

  const documentLabels = ['證件照-正面', '證件照-反面', '手持證件照'];

  return (
    <Modal
      data-e2e-id="kyc-edit-modal"
      title="編輯kyc"
      open={open}
      onCancel={onCancel}
      width={900}
      destroyOnClose
      footer={(
        <Space>
          <Button data-e2e-id="kyc-edit-cancel-btn" onClick={onCancel}>取消</Button>
          <Button data-e2e-id="kyc-edit-confirm-btn" type="primary" onClick={handleSave}>確定</Button>
        </Space>
      )}
    >
      <Form form={form} layout="vertical" requiredMark>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 20 }}>
          <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: '請輸入 First Name' }]}>
            <Input data-e2e-id="kyc-edit-first-name-input" placeholder="請輸入 First Name" />
          </Form.Item>
          <Form.Item name="middleName" label="Middle Name">
            <Input data-e2e-id="kyc-edit-middle-name-input" placeholder="請輸入 Middle Name" />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: '請輸入 Last Name' }]}>
            <Input data-e2e-id="kyc-edit-last-name-input" placeholder="請輸入 Last Name" />
          </Form.Item>
          <Form.Item name="birthday" label="生日" rules={[{ required: true, message: '請選擇生日' }]}>
            <DatePicker data-e2e-id="kyc-edit-birthday-picker" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="gender" label="性別" rules={[{ required: true, message: '請選擇性別' }]}>
            <Select
              data-e2e-id="kyc-edit-gender-select"
              options={[{ value: '男', label: '男' }, { value: '女', label: '女' }]}
            />
          </Form.Item>
          <Form.Item name="phone" label="手機號" rules={[{ required: true }]}>
            <Input data-e2e-id="kyc-edit-phone-input" addonBefore="+63" disabled />
          </Form.Item>
          <Form.Item name="nationality" label="國籍" rules={[{ required: true, message: '請選擇國籍' }]}>
            <Select
              data-e2e-id="kyc-edit-nationality-select"
              options={[{ value: 'Philippines', label: 'Philippines' }, { value: 'Others', label: 'Others' }]}
            />
          </Form.Item>
          <Form.Item name="birthplace" label="出生地" rules={[{ required: true, message: '請輸入出生地' }]}>
            <Input data-e2e-id="kyc-edit-birthplace-input" placeholder="請輸入出生地" />
          </Form.Item>
          <Form.Item name="currentAddress" label="現住址" rules={[{ required: true, message: '請輸入現住址' }]}>
            <Input data-e2e-id="kyc-edit-current-address-input" placeholder="請輸入現住址" />
          </Form.Item>
          <Form.Item name="permanentAddress" label="常住地址" rules={[{ required: true, message: '請輸入常住地址' }]}>
            <Input data-e2e-id="kyc-edit-permanent-address-input" placeholder="請輸入常住地址" />
          </Form.Item>
          <Form.Item name="nearestBranch" label="鄰近分行" rules={[{ required: true, message: '請選擇鄰近分行' }]}>
            <Select
              data-e2e-id="kyc-edit-nearest-branch-select"
              options={branchOptions.map((value) => ({ value, label: value }))}
            />
          </Form.Item>
          <Form.Item name="occupation" label="工作性質" rules={[{ required: true, message: '請選擇工作性質' }]}>
            <Select
              data-e2e-id="kyc-edit-occupation-select"
              options={['受僱', '自僱', '學生', '退休', '其他'].map((value) => ({ value, label: value }))}
            />
          </Form.Item>
          <Form.Item name="incomeSource" label="收入來源" rules={[{ required: true, message: '請選擇收入來源' }]}>
            <Select
              data-e2e-id="kyc-edit-income-source-select"
              options={['薪資', '生意', '投資', '其他'].map((value) => ({ value, label: value }))}
            />
          </Form.Item>
        </div>

        <Form.Item label="證件圖片">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            {documentLabels.map((label, index) => (
              <div key={label}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>{label}</Text>
                <div
                  style={{
                    height: 112,
                    border: `1px dashed ${token.colorBorder}`,
                    borderRadius: token.borderRadius,
                    background: index === 0 ? token.colorInfoBg : index === 1 ? token.colorWarningBg : token.colorSuccessBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: token.colorTextSecondary,
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </Form.Item>

        <Form.Item name="userMessage" label="用戶留言">
          <TextArea
            data-e2e-id="kyc-edit-user-message-textarea"
            disabled
            rows={3}
            placeholder="用戶提交審核時的留言"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

'use client';

import React, { useEffect } from 'react';
import { Alert, Button, Descriptions, Drawer, Form, Input, Space, Table, Typography, message, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { KycEditFieldChange, KycRecord } from '@/data/kycData';

const { Text } = Typography;
const { TextArea } = Input;

interface ReviewFormValues {
  reason?: string;
}

interface KycEditReviewDrawerProps {
  open: boolean;
  record: KycRecord | null;
  currentOperator: string;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

export default function KycEditReviewDrawer({
  open,
  record,
  currentOperator,
  onClose,
  onApprove,
  onReject,
}: KycEditReviewDrawerProps) {
  const [form] = Form.useForm<ReviewFormValues>();
  const { token } = theme.useToken();
  const pendingEdit = record?.pendingEdit;
  const isSelfReview = Boolean(pendingEdit && currentOperator === pendingEdit.submittedBy);

  useEffect(() => {
    if (open) form.resetFields();
  }, [form, open, record]);

  const columns: ColumnsType<KycEditFieldChange> = [
    {
      title: '欄位',
      dataIndex: 'label',
      width: 150,
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: '原值',
      dataIndex: 'oldValue',
      render: (value: string) => (
        <span style={{ color: token.colorTextSecondary, textDecoration: 'line-through' }}>{value || '-'}</span>
      ),
    },
    {
      title: '新值',
      dataIndex: 'newValue',
      render: (value: string) => (
        <span style={{ color: token.colorSuccess, fontWeight: 600 }}>{value || '-'}</span>
      ),
    },
  ];

  const handleApprove = () => {
    if (!pendingEdit || isSelfReview) return;
    onApprove();
    message.success('編輯已核准，資料已更新');
    onClose();
  };

  const handleReject = async () => {
    if (!pendingEdit || isSelfReview) return;
    const values = await form.validateFields();
    onReject(values.reason?.trim() || '');
    message.success('編輯已駁回，變更已捨棄');
    onClose();
  };

  return (
    <Drawer
      data-e2e-id="kyc-edit-review-drawer"
      title="編輯複核"
      open={open}
      onClose={onClose}
      width={720}
      destroyOnClose
      footer={(
        <div style={{ textAlign: 'right' }}>
          <Button data-e2e-id="kyc-edit-review-cancel-btn" onClick={onClose}>取消</Button>
        </div>
      )}
    >
      {pendingEdit && (
        <>
          <Descriptions bordered size="small" column={2} style={{ marginBottom: 20 }}>
            <Descriptions.Item label="提交者">{pendingEdit.submittedBy}</Descriptions.Item>
            <Descriptions.Item label="提交時間">{pendingEdit.submittedAt}</Descriptions.Item>
          </Descriptions>

          {isSelfReview && (
            <Alert
              data-e2e-id="kyc-edit-review-self-lock-alert"
              type="warning"
              showIcon
              message="不可審核自己提交的編輯，請切換操作員"
              style={{ marginBottom: 20 }}
            />
          )}

          <Table
            data-e2e-id="kyc-edit-review-diff-table"
            rowKey="field"
            columns={columns}
            dataSource={pendingEdit.changes}
            size="small"
            pagination={false}
            style={{ marginBottom: 24 }}
          />

          <Form form={form} layout="vertical">
            <Form.Item
              name="reason"
              label="駁回原因"
              rules={[{
                validator: (_, value) => {
                  if (!value?.trim()) return Promise.reject(new Error('駁回時必須填寫駁回原因'));
                  return Promise.resolve();
                },
              }]}
            >
              <TextArea
                data-e2e-id="kyc-edit-review-reject-reason-textarea"
                rows={4}
                disabled={isSelfReview}
                placeholder="駁回時必填"
              />
            </Form.Item>

            <Space>
              <Button
                data-e2e-id="kyc-edit-review-approve-btn"
                type="primary"
                disabled={isSelfReview}
                onClick={handleApprove}
              >
                核准
              </Button>
              <Button
                data-e2e-id="kyc-edit-review-reject-btn"
                danger
                disabled={isSelfReview}
                onClick={handleReject}
              >
                駁回
              </Button>
            </Space>
          </Form>
        </>
      )}
    </Drawer>
  );
}

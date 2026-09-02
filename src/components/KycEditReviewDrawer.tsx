'use client';

import React, { useEffect } from 'react';
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Image,
  Input,
  Space,
  Table,
  Typography,
  message,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  kycEditReviewStatusColorMap,
  kycEditReviewStatusLabelMap,
  type KycEditFieldChange,
  type KycEditReviewEntry,
} from '@/data/kycData';

const { Text } = Typography;
const { TextArea } = Input;

interface ReviewFormValues {
  reason?: string;
}

interface KycEditReviewDrawerProps {
  open: boolean;
  entry: KycEditReviewEntry | null;
  currentOperator: string;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

export default function KycEditReviewDrawer({
  open,
  entry,
  currentOperator,
  onClose,
  onApprove,
  onReject,
}: KycEditReviewDrawerProps) {
  const [form] = Form.useForm<ReviewFormValues>();
  const { token } = theme.useToken();
  const isPending = entry?.status === 'Pending';
  const isSelfReview = Boolean(entry && currentOperator === entry.submittedBy);
  const locked = !isPending || isSelfReview;

  useEffect(() => {
    if (open && isPending) form.resetFields();
  }, [form, isPending, open, entry]);

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
    if (locked) return;
    onApprove();
    message.success('編輯已核准，資料已更新');
    onClose();
  };

  const handleReject = async () => {
    if (locked) return;
    const values = await form.validateFields();
    onReject(values.reason?.trim() || '');
    message.success('編輯已駁回，變更已捨棄');
    onClose();
  };

  return (
    <Drawer
      data-e2e-id="kyc-edit-review-drawer"
      title={isPending ? '編輯複核' : '複核詳情'}
      open={open}
      onClose={onClose}
      width={760}
      destroyOnClose
      footer={(
        <div style={{ textAlign: 'right' }}>
          <Button data-e2e-id="kyc-edit-review-cancel-btn" onClick={onClose}>關閉</Button>
        </div>
      )}
    >
      {entry && (
        <>
          <Descriptions bordered size="small" column={2} style={{ marginBottom: 20 }}>
            <Descriptions.Item label="會員UID">{entry.uid}</Descriptions.Item>
            <Descriptions.Item label="手機號">+63 {entry.phone}</Descriptions.Item>
            <Descriptions.Item label="提交者">{entry.submittedBy}</Descriptions.Item>
            <Descriptions.Item label="提交時間">{entry.submittedAt}</Descriptions.Item>
            <Descriptions.Item label="複核狀態">
              <span style={{ color: kycEditReviewStatusColorMap[entry.status], fontWeight: 500 }}>
                {kycEditReviewStatusLabelMap[entry.status]}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="複核人">{entry.reviewedBy || '-'}</Descriptions.Item>
            <Descriptions.Item label="複核時間">{entry.reviewedAt || '-'}</Descriptions.Item>
            <Descriptions.Item label="駁回原因">{entry.reason || '-'}</Descriptions.Item>
          </Descriptions>

          {isSelfReview && isPending && (
            <Alert
              data-e2e-id="kyc-edit-review-self-lock-alert"
              type="warning"
              showIcon
              message="不可複核自己提交的編輯"
              style={{ marginBottom: 20 }}
            />
          )}

          <Text strong style={{ display: 'block', marginBottom: 8 }}>欄位變更</Text>
          {entry.changes.length ? (
            <Table
              data-e2e-id="kyc-edit-review-diff-table"
              rowKey="field"
              columns={columns}
              dataSource={entry.changes}
              size="small"
              pagination={false}
              style={{ marginBottom: 24 }}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="本次未變更欄位"
              style={{ marginBottom: 24 }}
            />
          )}

          {entry.photoChanges.length > 0 && (
            <>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>證件照變更</Text>
              <div
                data-e2e-id="kyc-edit-review-photo-diff"
                style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}
              >
                {entry.photoChanges.map((photo) => (
                  <div
                    key={photo.slot}
                    style={{
                      border: `1px solid ${token.colorBorderSecondary}`,
                      borderRadius: token.borderRadius,
                      padding: 12,
                    }}
                  >
                    <Text style={{ display: 'block', marginBottom: 8 }}>{photo.label}</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>原圖</Text>
                        <Image
                          src={photo.oldImage}
                          alt={`${photo.label} 原圖`}
                          width="100%"
                          height={140}
                          style={{ objectFit: 'cover', borderRadius: token.borderRadiusSM, opacity: 0.7 }}
                        />
                      </div>
                      <span style={{ color: token.colorTextSecondary }}>→</span>
                      <div style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: token.colorSuccess }}>新圖</Text>
                        <Image
                          src={photo.newImage}
                          alt={`${photo.label} 新圖`}
                          width="100%"
                          height={140}
                          style={{
                            objectFit: 'cover',
                            borderRadius: token.borderRadiusSM,
                            border: `1px solid ${token.colorSuccessBorder}`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {isPending && (
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
                  disabled={locked}
                  placeholder="駁回時必填"
                />
              </Form.Item>

              <Space>
                <Button
                  data-e2e-id="kyc-edit-review-approve-btn"
                  type="primary"
                  disabled={locked}
                  onClick={handleApprove}
                >
                  核准
                </Button>
                <Button
                  data-e2e-id="kyc-edit-review-reject-btn"
                  danger
                  disabled={locked}
                  onClick={handleReject}
                >
                  駁回
                </Button>
              </Space>
            </Form>
          )}
        </>
      )}
    </Drawer>
  );
}

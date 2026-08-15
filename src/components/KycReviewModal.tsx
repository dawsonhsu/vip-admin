'use client';

import React, { useEffect } from 'react';
import { Button, Descriptions, Form, Input, Modal, Radio, Space, Tag } from 'antd';
import type { KycRecord, KycStatus } from '@/data/kycData';
import { kycStatusColorMap, kycStatusLabelMap } from '@/data/kycData';

const { TextArea } = Input;

interface ReviewFormValues {
  decision: Extract<KycStatus, 'Approved' | 'Rejected' | 'Resubmit Required'>;
  remark?: string;
}

interface KycReviewModalProps {
  open: boolean;
  record: KycRecord | null;
  onCancel: () => void;
  onConfirm: (decision: ReviewFormValues['decision'], remark: string) => void;
}

export default function KycReviewModal({ open, record, onCancel, onConfirm }: KycReviewModalProps) {
  const [form] = Form.useForm<ReviewFormValues>();
  const decision = Form.useWatch('decision', form);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({ decision: 'Approved', remark: '' });
  }, [form, open, record]);

  const handleConfirm = async () => {
    const values = await form.validateFields();
    onConfirm(values.decision, values.remark?.trim() || '');
  };

  return (
    <Modal
      data-e2e-id="kyc-review-modal"
      title="審核"
      open={open}
      onCancel={onCancel}
      width={820}
      destroyOnClose
      footer={(
        <Space>
          <Button data-e2e-id="kyc-review-cancel-btn" onClick={onCancel}>取消</Button>
          <Button data-e2e-id="kyc-review-confirm-btn" type="primary" onClick={handleConfirm}>確定</Button>
        </Space>
      )}
    >
      {record && (
        <>
          <Descriptions bordered size="small" column={2} style={{ marginBottom: 20 }}>
            <Descriptions.Item label="UID">{record.uid}</Descriptions.Item>
            <Descriptions.Item label="手機號">+63 {record.phone}</Descriptions.Item>
            <Descriptions.Item label="目前狀態">
              <Tag color={kycStatusColorMap[record.status]}>{record.status}（{kycStatusLabelMap[record.status]}）</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="驗證結果">{record.verifyResult}</Descriptions.Item>
            <Descriptions.Item label="姓名">{record.firstName} {record.middleName} {record.lastName}</Descriptions.Item>
            <Descriptions.Item label="生日 / 性別">{record.birthday} / {record.gender}</Descriptions.Item>
            <Descriptions.Item label="國籍 / 出生地">{record.nationality} / {record.birthplace}</Descriptions.Item>
            <Descriptions.Item label="鄰近分行">{record.nearestBranch}</Descriptions.Item>
            <Descriptions.Item label="現住址" span={2}>{record.currentAddress}</Descriptions.Item>
            <Descriptions.Item label="常住地址" span={2}>{record.permanentAddress || '-'}</Descriptions.Item>
          </Descriptions>

          <Form form={form} layout="vertical">
            <Form.Item name="decision" label="審核決定" rules={[{ required: true, message: '請選擇審核決定' }]}>
              <Radio.Group data-e2e-id="kyc-review-decision-radio">
                <Space direction="vertical">
                  <Radio value="Approved">通過 (Approved)</Radio>
                  <Radio value="Rejected">駁回 (Rejected)</Radio>
                  <Radio value="Resubmit Required">需重新提交 (Resubmit Required)</Radio>
                </Space>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              name="remark"
              label="備註"
              rules={[{
                validator: (_, value) => {
                  if (decision !== 'Approved' && !value?.trim()) {
                    return Promise.reject(new Error('駁回或要求重新提交時必須填寫備註'));
                  }
                  return Promise.resolve();
                },
              }]}
            >
              <TextArea data-e2e-id="kyc-review-remark-textarea" rows={4} placeholder="請輸入審核備註" />
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
}

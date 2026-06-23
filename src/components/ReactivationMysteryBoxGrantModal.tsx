'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Radio,
  Space,
  Table,
  Tag,
  Upload,
  message,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  grantIdentifierTypeOptions,
  mockGrantResult,
  type GrantRejectedEntry,
  type GrantResult,
} from '@/data/reactivationMysteryBoxData';

const { TextArea } = Input;

const E2E = 'reactivation-mystery-box-grant-modal';

interface Props {
  open: boolean;
  onClose: () => void;
}

const normalizeUploadFileList = (event: any) =>
  Array.isArray(event) ? event : event?.fileList;

const parseIdentifiers = (raw?: string) =>
  String(raw ?? '')
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

export default function ReactivationMysteryBoxGrantModal({ open, onClose }: Props) {
  const [form] = Form.useForm();
  const [grantResult, setGrantResult] = useState<GrantResult | null>(null);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        identifierType: 'memberId',
        grantIdentifiers: '',
        grantCsv: [],
      });
      setGrantResult(null);
    }
  }, [open, form]);

  const rejectedColumns: ColumnsType<GrantRejectedEntry> = [
    { title: '名单值', dataIndex: 'identifier', width: 180 },
    {
      title: '拒绝原因',
      dataIndex: 'reason',
      render: (value) => <Tag color="warning">{value}</Tag>,
    },
  ];

  const handleGrant = async () => {
    const values = form.getFieldsValue();
    const identifiers = parseIdentifiers(values.grantIdentifiers);
    const fileList = values.grantCsv ?? [];

    if (identifiers.length === 0 && fileList.length === 0) {
      message.warning('请先输入名单或上传 CSV');
      return;
    }

    const baseCount = identifiers.length || mockGrantResult.successCount + mockGrantResult.rejectedCount;
    const rejectedCount = Math.min(2, Math.max(1, Math.floor(baseCount / 5)));
    const rejectedEntries = Array.from({ length: rejectedCount }, (_, index) => ({
      key: `reject-${index + 1}`,
      identifier:
        identifiers[index] ??
        mockGrantResult.rejectedEntries[index % mockGrantResult.rejectedEntries.length].identifier,
      reason: '仍有未开盲盒',
    }));

    setGrantResult({
      successCount: Math.max(baseCount - rejectedCount, 0),
      rejectedCount,
      rejectedEntries,
    });
    message.success('派发完成');
  };

  return (
    <Modal
      title="召回盲盒 - 名单派发"
      open={open}
      onCancel={onClose}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button data-e2e-id={`${E2E}-footer-close-btn`} onClick={onClose}>
            关闭
          </Button>
        </div>
      }
      width={680}
      styles={{ body: { maxHeight: '72vh', overflowY: 'auto' } }}
    >
      <div data-e2e-id={`${E2E}-modal`}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            identifierType: 'memberId',
            grantIdentifiers: '',
            grantCsv: [],
          }}
        >
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              type="info"
              showIcon
              message="每人本期发 1 个盲盒;同一时间最多持有 1 个未开盲盒。"
            />

            <Form.Item
              label="识别类型"
              name="identifierType"
              rules={[{ required: true, message: '请选择识别类型' }]}
            >
              <Radio.Group data-e2e-id={`${E2E}-grant-identifier-type-radio`}>
                {grantIdentifierTypeOptions.map((option) => (
                  <Radio key={option.value} value={option.value}>
                    {option.label}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>

            <Form.Item
              label="名单输入"
              name="grantIdentifiers"
              extra="支持逗号或换行分隔；本期仅支持人工名单投放。"
            >
              <TextArea
                data-e2e-id={`${E2E}-grant-identifiers-textarea`}
                rows={6}
                placeholder={`例: 09171234567, U900301\n09181234568`}
              />
            </Form.Item>

            <Form.Item
              label="CSV 上传"
              name="grantCsv"
              valuePropName="fileList"
              getValueFromEvent={normalizeUploadFileList}
            >
              <Upload
                data-e2e-id={`${E2E}-grant-csv-upload`}
                accept=".csv"
                maxCount={1}
                beforeUpload={() => false}
              >
                <Button
                  data-e2e-id={`${E2E}-grant-csv-upload-btn`}
                  icon={<UploadOutlined />}
                >
                  上传 CSV
                </Button>
              </Upload>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Button
                data-e2e-id={`${E2E}-grant-submit-btn`}
                type="primary"
                onClick={handleGrant}
              >
                派发
              </Button>
            </div>

            {grantResult && (
              <Card size="small" data-e2e-id={`${E2E}-grant-result-card`}>
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <span>
                    成功派发 {grantResult.successCount} 笔 / 拒绝 {grantResult.rejectedCount} 笔
                  </span>
                  <Table
                    data-e2e-id={`${E2E}-grant-rejected-table`}
                    columns={rejectedColumns}
                    dataSource={grantResult.rejectedEntries}
                    rowKey="key"
                    size="small"
                    pagination={false}
                  />
                </Space>
              </Card>
            )}
          </Space>
        </Form>
      </div>
    </Modal>
  );
}

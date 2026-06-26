'use client';

import React, { useEffect } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import {
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Typography,
  message,
} from 'antd';
import {
  marqueeJumpTypeOptions,
  marqueeTypeOptions,
  type MarqueeItem,
  type MarqueeJumpType,
  type MarqueeStatus,
  type MarqueeType,
} from '@/data/marqueeData';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const E2E = 'marquee-config-modal';

export interface MarqueeConfigSubmitValues {
  content: string;
  type: MarqueeType;
  status: MarqueeStatus;
  sort: number;
  jumpType: MarqueeJumpType;
  h5Url: string;
  appUrl: string;
  startTime: string;
  endTime: string;
}

interface MarqueeConfigFormValues {
  content?: string;
  type?: MarqueeType;
  status?: MarqueeStatus;
  sort?: number | null;
  range?: [Dayjs, Dayjs];
  jumpType?: MarqueeJumpType;
  h5Url?: string;
  appUrl?: string;
}

interface MarqueeConfigModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  record?: MarqueeItem | null;
  onClose: () => void;
  onSubmit: (values: MarqueeConfigSubmitValues) => void;
}

const createDefaultValues = (): MarqueeConfigFormValues => ({
  content: undefined,
  type: 'announcement',
  status: 'enabled',
  sort: 0,
  range: undefined,
  jumpType: 'none',
  h5Url: '',
  appUrl: '',
});

const createRecordValues = (record: MarqueeItem): MarqueeConfigFormValues => ({
  content: record.content,
  type: record.type,
  status: record.status,
  sort: record.sort,
  range: [dayjs(record.startTime), dayjs(record.endTime)],
  jumpType: record.jumpType,
  h5Url: record.h5Url,
  appUrl: record.appUrl,
});

export default function MarqueeConfigModal({
  open,
  mode,
  record,
  onClose,
  onSubmit,
}: MarqueeConfigModalProps) {
  const [form] = Form.useForm<MarqueeConfigFormValues>();
  const jumpType = Form.useWatch('jumpType', form) ?? 'none';

  useEffect(() => {
    if (!open) return;

    form.resetFields();
    form.setFieldsValue(record ? createRecordValues(record) : createDefaultValues());
  }, [form, open, record]);

  const placeholder = jumpType === 'external' ? 'https://...' : '/promo/xxx 或頁面代碼';

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const range = values.range;

      if (!range?.[0] || !range[1]) {
        message.error('請選擇生效時間');
        return;
      }

      const nextJumpType = values.jumpType ?? 'none';

      onSubmit({
        content: values.content?.trim() ?? '',
        type: values.type ?? 'announcement',
        status: values.status ?? 'enabled',
        sort: Number(values.sort ?? 0),
        jumpType: nextJumpType,
        h5Url: nextJumpType === 'none' ? '' : values.h5Url?.trim() ?? '',
        appUrl: nextJumpType === 'none' ? '' : values.appUrl?.trim() ?? '',
        startTime: range[0].format('YYYY-MM-DD HH:mm:ss'),
        endTime: range[1].format('YYYY-MM-DD HH:mm:ss'),
      });
      message.success(mode === 'create' ? '跑馬燈已新增' : '跑馬燈已更新');
      onClose();
    } catch {
      message.error('請檢查必填項');
    }
  };

  return (
    <Modal
      title={mode === 'create' ? '新增跑馬燈' : '編輯跑馬燈'}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="確定"
      cancelText="取消"
      width={720}
      centered
      okButtonProps={{ 'data-e2e-id': `${E2E}-ok-btn` }}
      cancelButtonProps={{ 'data-e2e-id': `${E2E}-cancel-btn` }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={createDefaultValues()}
        data-e2e-id={`${E2E}-form`}
      >
        <Form.Item
          name="content"
          label="內容"
          rules={[{ required: true, whitespace: true, message: '請輸入跑馬燈內容' }]}
        >
          <Input.TextArea
            rows={2}
            maxLength={120}
            showCount
            data-e2e-id={`${E2E}-content-input`}
          />
        </Form.Item>

        <Form.Item
          name="type"
          label="類型"
          rules={[{ required: true, message: '請選擇類型' }]}
        >
          <Select
            options={marqueeTypeOptions}
            data-e2e-id={`${E2E}-type-select`}
          />
        </Form.Item>

        <Form.Item name="status" label="狀態">
          <Radio.Group data-e2e-id={`${E2E}-status-radio`}>
            <Radio value="enabled" data-e2e-id={`${E2E}-status-enabled-radio`}>啟用</Radio>
            <Radio value="disabled" data-e2e-id={`${E2E}-status-disabled-radio`}>停用</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item name="sort" label="排序">
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <InputNumber
              min={0}
              style={{ width: 180 }}
              data-e2e-id={`${E2E}-sort-input`}
            />
            <Text type="secondary">數字越大越靠前</Text>
          </Space>
        </Form.Item>

        <Form.Item
          name="range"
          label="生效時間"
          rules={[{ required: true, message: '請選擇生效時間' }]}
        >
          <RangePicker
            showTime
            style={{ width: '100%' }}
            data-e2e-id={`${E2E}-range-picker`}
          />
        </Form.Item>

        <Form.Item name="jumpType" label="跳轉類型">
          <Radio.Group
            data-e2e-id={`${E2E}-jump-type-radio`}
            onChange={(event) => {
              if (event.target.value === 'none') {
                form.setFieldsValue({ h5Url: '', appUrl: '' });
              }
            }}
          >
            {marqueeJumpTypeOptions.map((option) => (
              <Radio
                key={option.value}
                value={option.value}
                data-e2e-id={`${E2E}-jump-type-${option.value}-radio`}
              >
                {option.label}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>

        {jumpType !== 'none' && (
          <>
            <Form.Item name="h5Url" label="H5 跳轉連結">
              <Input
                allowClear
                placeholder={placeholder}
                data-e2e-id={`${E2E}-h5-url-input`}
              />
            </Form.Item>
            <Form.Item name="appUrl" label="APP 跳轉連結">
              <Input
                allowClear
                placeholder={placeholder}
                data-e2e-id={`${E2E}-app-url-input`}
              />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
}

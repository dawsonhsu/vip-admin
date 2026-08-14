'use client';

import React, { useEffect, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Steps,
  Typography,
  Upload,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import {
  materialCategoryOptions,
  materialLinkTypeOptions,
  materialPlatformOptions,
  materialPopupFrequencyOptions,
  materialPopupScopeOptions,
  materialStatusOptions,
  type MaterialItem,
  type MaterialLinkType,
  type MaterialPlatform,
  type MaterialPopupFrequency,
  type MaterialPopupScope,
  type MaterialStatus,
} from '@/data/materialData';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const E2E = 'material-config-modal';

export interface MaterialConfigSubmitValues {
  platforms: MaterialPlatform[];
  category: string;
  name: string;
  description: string;
  hasImage: boolean;
  linkType: MaterialLinkType;
  h5Url: string;
  appUrl: string;
  content: string;
  priority: number;
  popupFrequency: MaterialPopupFrequency;
  popupScope: MaterialPopupScope;
  startTime: string;
  endTime: string;
  status: MaterialStatus;
}

interface MaterialConfigFormValues {
  platforms?: MaterialPlatform[];
  platform?: MaterialPlatform;
  category?: string;
  name?: string;
  description?: string;
  imageFiles?: UploadFile[];
  linkType?: MaterialLinkType;
  h5Url?: string;
  appUrl?: string;
  content?: string;
  priority?: number | null;
  popupFrequency?: MaterialPopupFrequency;
  popupScope?: MaterialPopupScope;
  range?: [Dayjs, Dayjs];
  status?: MaterialStatus;
  googleCode?: string;
}

interface MaterialConfigModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  record?: MaterialItem | null;
  onClose: () => void;
  onSubmit: (values: MaterialConfigSubmitValues) => void;
}

const createDefaultValues = (): MaterialConfigFormValues => ({
  platforms: [],
  platform: undefined,
  category: undefined,
  name: '',
  description: '',
  imageFiles: [],
  linkType: 'internal',
  h5Url: '',
  appUrl: '',
  content: '',
  priority: 0,
  popupFrequency: 'daily_once',
  popupScope: 'all',
  range: undefined,
  status: 'enabled',
  googleCode: '',
});

const createRecordValues = (record: MaterialItem): MaterialConfigFormValues => ({
  platforms: [],
  platform: record.platform,
  category: record.category,
  name: record.name,
  description: record.description,
  imageFiles: record.hasImage
    ? [{ uid: `material-image-${record.id}`, name: `${record.name || '素材'}.webp`, status: 'done' }]
    : [],
  linkType: record.linkType,
  h5Url: record.h5Url,
  appUrl: record.appUrl,
  content: record.content,
  priority: record.priority,
  popupFrequency: record.popupFrequency,
  popupScope: record.popupScope,
  range: [dayjs(record.startTime), dayjs(record.endTime)],
  status: record.status,
  googleCode: '',
});

const normalizeUploadFileList = (event: UploadFile[] | { fileList?: UploadFile[] }) =>
  Array.isArray(event) ? event : event?.fileList;

export default function MaterialConfigModal({
  open,
  mode,
  record,
  onClose,
  onSubmit,
}: MaterialConfigModalProps) {
  const [form] = Form.useForm<MaterialConfigFormValues>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!open) return;

    setCurrent(0);
    form.resetFields();
    form.setFieldsValue(record ? createRecordValues(record) : createDefaultValues());
  }, [form, open, record]);

  const handleNext = async () => {
    const firstStepFields: Array<keyof MaterialConfigFormValues> = [
      mode === 'create' ? 'platforms' : 'platform',
      'category',
      'name',
      'description',
      'imageFiles',
      'priority',
      'linkType',
      'appUrl',
      'h5Url',
      'popupFrequency',
      'popupScope',
    ];

    try {
      await form.validateFields(firstStepFields);
      setCurrent(1);
    } catch {
      message.error('請檢查必填項');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const range = values.range;

      if (!range?.[0] || !range[1]) {
        message.error('請選擇展示時間');
        return;
      }

      const platforms = mode === 'create'
        ? values.platforms ?? []
        : values.platform
          ? [values.platform]
          : [];

      onSubmit({
        platforms,
        category: values.category ?? '',
        name: values.name?.trim() ?? '',
        description: values.description?.trim() ?? '',
        hasImage: Boolean(values.imageFiles?.length),
        linkType: values.linkType ?? 'internal',
        h5Url: values.h5Url?.trim() ?? '',
        appUrl: values.appUrl?.trim() ?? '',
        content: values.content?.trim() ?? '',
        priority: Number(values.priority ?? 0),
        popupFrequency: values.popupFrequency ?? 'daily_once',
        popupScope: values.popupScope ?? 'all',
        startTime: range[0].format('YYYY-MM-DD HH:mm:ss'),
        endTime: range[1].format('YYYY-MM-DD HH:mm:ss'),
        status: values.status ?? 'enabled',
      });
      onClose();
    } catch {
      message.error('請檢查必填項');
    }
  };

  return (
    <Modal
      title={mode === 'create' ? '新增素材' : '編輯素材'}
      open={open}
      onCancel={onClose}
      width={760}
      centered
      footer={current === 0 ? (
        <Space>
          <Button onClick={onClose} data-e2e-id={`${E2E}-cancel-btn`}>
            取消
          </Button>
          <Button type="primary" onClick={handleNext} data-e2e-id={`${E2E}-next-btn`}>
            下一步
          </Button>
        </Space>
      ) : (
        <Space>
          <Button onClick={() => setCurrent(0)} data-e2e-id={`${E2E}-previous-btn`}>
            上一步
          </Button>
          <Button type="primary" onClick={handleSubmit} data-e2e-id={`${E2E}-submit-btn`}>
            確定
          </Button>
        </Space>
      )}
      styles={{ body: { maxHeight: 'calc(100vh - 190px)', overflowY: 'auto' } }}
      data-e2e-id={`${E2E}-root`}
    >
      <Steps
        current={current}
        items={[{ title: '素材設定' }, { title: '內容與時段' }]}
        style={{ marginBottom: 24 }}
        data-e2e-id={`${E2E}-steps`}
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={createDefaultValues()}
        data-e2e-id={`${E2E}-form`}
      >
        <div data-e2e-id={`${E2E}-step-one`} style={{ display: current === 0 ? 'block' : 'none' }}>
          {mode === 'create' ? (
            <Form.Item
              name="platforms"
              label="平台"
              rules={[{ required: true, type: 'array', min: 1, message: '請至少選擇一個平台' }]}
              extra={<Text type="secondary">可一次選擇多個平台，將為每個平台各新增一筆素材</Text>}
            >
              <Select
                mode="multiple"
                placeholder="請選擇平台（可複選）"
                options={materialPlatformOptions}
                data-e2e-id={`${E2E}-platforms-select`}
              />
            </Form.Item>
          ) : (
            <Form.Item
              name="platform"
              label="平台"
              rules={[{ required: true, message: '請選擇平台' }]}
            >
              <Select
                placeholder="請選擇平台"
                options={materialPlatformOptions}
                data-e2e-id={`${E2E}-platform-select`}
              />
            </Form.Item>
          )}

          <Form.Item
            name="category"
            label="素材種類"
            rules={[{ required: true, message: '請選擇素材種類' }]}
          >
            <Select
              placeholder="請選擇素材種類"
              options={materialCategoryOptions}
              data-e2e-id={`${E2E}-category-select`}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="名稱"
            extra="部分素材種類將顯示名稱於客戶端 Ex：自媒體號"
          >
            <Input placeholder="請輸入名稱" data-e2e-id={`${E2E}-name-input`} />
          </Form.Item>

          <Form.Item
            name="description"
            label="說明"
            extra="管理人員自行記錄用途使用，只在後台可見"
          >
            <Input placeholder="請輸入說明" data-e2e-id={`${E2E}-description-input`} />
          </Form.Item>

          <Form.Item
            name="imageFiles"
            label="圖片"
            valuePropName="fileList"
            getValueFromEvent={normalizeUploadFileList}
            extra="請上傳 .webp 格式的圖片"
          >
            <Upload
              listType="picture-card"
              accept=".webp,image/webp"
              maxCount={1}
              beforeUpload={() => false}
              data-e2e-id={`${E2E}-image-upload`}
            >
              <button
                type="button"
                style={{ border: 0, background: 'none', cursor: 'pointer' }}
                data-e2e-id={`${E2E}-image-upload-btn`}
              >
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上傳</div>
              </button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="priority"
            label="展示優先級"
            extra="0~1000整數，數字越大越高"
          >
            <InputNumber
              min={0}
              max={1000}
              precision={0}
              style={{ width: 180 }}
              data-e2e-id={`${E2E}-priority-input`}
            />
          </Form.Item>

          <Form.Item name="linkType" label="鏈接類型">
            <Radio.Group data-e2e-id={`${E2E}-link-type-radio`}>
              {materialLinkTypeOptions.map((option) => (
                <Radio
                  key={option.value}
                  value={option.value}
                  data-e2e-id={`${E2E}-link-type-${option.value}-radio`}
                >
                  {option.label}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>

          <Form.Item name="appUrl" label="APP跳轉路徑">
            <Input
              placeholder="請輸入APP跳轉路徑"
              data-e2e-id={`${E2E}-app-url-input`}
            />
          </Form.Item>

          <Form.Item name="h5Url" label="H5跳轉路徑">
            <Input
              placeholder="請輸入H5跳轉路徑"
              data-e2e-id={`${E2E}-h5-url-input`}
            />
          </Form.Item>

          <Form.Item name="popupFrequency" label="彈窗出現頻率">
            <Radio.Group data-e2e-id={`${E2E}-popup-frequency-radio`}>
              {materialPopupFrequencyOptions.map((option) => (
                <Radio
                  key={option.value}
                  value={option.value}
                  data-e2e-id={`${E2E}-popup-frequency-${option.value}-radio`}
                >
                  {option.label}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>

          <Form.Item name="popupScope" label="彈窗可見範圍">
            <Radio.Group data-e2e-id={`${E2E}-popup-scope-radio`}>
              {materialPopupScopeOptions.map((option) => (
                <Radio
                  key={option.value}
                  value={option.value}
                  data-e2e-id={`${E2E}-popup-scope-${option.value}-radio`}
                >
                  {option.label}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        </div>

        <div data-e2e-id={`${E2E}-step-two`} style={{ display: current === 1 ? 'block' : 'none' }}>
          <Form.Item name="content" label="內容">
            <Input.TextArea
              rows={4}
              placeholder="請輸入內容"
              data-e2e-id={`${E2E}-content-input`}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="狀態"
            rules={[{ required: true, message: '請選擇狀態' }]}
          >
            <Select
              placeholder="請選擇狀態"
              options={materialStatusOptions}
              data-e2e-id={`${E2E}-status-select`}
            />
          </Form.Item>

          <Form.Item
            name="range"
            label="展示時間"
            rules={[{ required: true, message: '請選擇展示時間' }]}
          >
            <RangePicker
              showTime
              style={{ width: '100%' }}
              data-e2e-id={`${E2E}-display-range-picker`}
            />
          </Form.Item>

          <Form.Item
            name="googleCode"
            label="谷歌驗證碼"
            rules={[{ required: true, whitespace: true, message: '請輸入谷歌驗證碼' }]}
          >
            <Input
              placeholder="請輸入谷歌驗證碼"
              data-e2e-id={`${E2E}-google-code-input`}
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}

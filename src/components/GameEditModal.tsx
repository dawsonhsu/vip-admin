'use client';

import React, { useEffect } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Typography,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs, { type Dayjs } from 'dayjs';
import {
  gameStatusOptions,
  gameTypeOptions,
  pagcorCategoryOptions,
  providerOptions,
  venueOptions,
  weightTagOptions,
  type GameManagementRecord,
  type GameStatus,
  type GameType,
  type PagcorCategory,
  type ProviderName,
  type VenueCode,
  type WeightTag,
} from '@/data/gameManagementData';

const { RangePicker } = DatePicker;
const { Text } = Typography;

export interface GameEditValues {
  gameId?: string;
  gameNameEn: string;
  gameNameTg?: string;
  client1Icon: UploadFile[];
  client2Icon?: UploadFile[];
  status: GameStatus;
  maintenanceRange?: [Dayjs, Dayjs];
  venue: VenueCode;
  provider: ProviderName;
  gameTypes?: GameType[];
  pagcorCategory?: PagcorCategory;
  rateTemplate: string;
  sortWeight?: number | null;
  recommendWeight?: number | null;
  weightedTags?: WeightTag[];
  hot: boolean;
  hotDeadline?: Dayjs;
  isNew: boolean;
  newDeadline?: Dayjs;
}

interface GameEditModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  record?: GameManagementRecord;
  onCancel: () => void;
  onSubmit: (values: GameEditValues) => void;
}

const normalizeUploadFileList = (event: UploadFile[] | { fileList?: UploadFile[] }) => (
  Array.isArray(event) ? event : event?.fileList || []
);

const mockUploadFile = (uid: string, name: string): UploadFile => ({
  uid,
  name,
  status: 'done',
});

const fieldId = (field: string) => `game-edit-${field}`;

export default function GameEditModal({
  open,
  mode,
  record,
  onCancel,
  onSubmit,
}: GameEditModalProps) {
  const [form] = Form.useForm<GameEditValues>();

  useEffect(() => {
    if (!open) return;

    form.resetFields();
    if (mode === 'edit' && record) {
      const maintenanceStart = dayjs(record.updatedAt);
      form.setFieldsValue({
        gameId: record.gameId,
        gameNameEn: record.gameNameEn,
        gameNameTg: record.gameNameTg,
        client1Icon: [mockUploadFile('client1', 'client1.webp')],
        client2Icon: [mockUploadFile('client2', 'client2.webp')],
        status: record.status,
        maintenanceRange: record.status === '維護中'
          ? [maintenanceStart, maintenanceStart.add(2, 'hour')]
          : undefined,
        venue: record.venue,
        provider: record.provider,
        gameTypes: [record.gameType],
        pagcorCategory: record.pagcorCategory,
        rateTemplate: record.rateTemplate,
        sortWeight: record.sortWeight,
        recommendWeight: record.recommendWeight,
        weightedTags: record.weightedTags,
        hot: record.hot,
        isNew: record.isNew,
      });
      return;
    }

    form.setFieldsValue({
      gameId: undefined,
      gameNameEn: undefined,
      gameNameTg: undefined,
      client1Icon: [],
      client2Icon: [],
      status: '上架',
      maintenanceRange: undefined,
      venue: undefined,
      provider: undefined,
      gameTypes: undefined,
      pagcorCategory: undefined,
      rateTemplate: '標準 0.85',
      sortWeight: undefined,
      recommendWeight: undefined,
      weightedTags: undefined,
      hot: false,
      hotDeadline: undefined,
      isNew: false,
      newDeadline: undefined,
    });
  }, [form, mode, open, record]);

  const uploadButton = (
    <button type="button" style={{ border: 0, background: 'none', cursor: 'pointer' }}>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上傳</div>
    </button>
  );

  return (
    <Modal
      data-e2e-id="game-edit-modal"
      title={mode === 'edit' ? '編輯遊戲參數' : '新增遊戲'}
      width={1000}
      open={open}
      destroyOnClose
      onCancel={onCancel}
      styles={{ body: { maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' } }}
      footer={(
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button
              data-e2e-id="game-edit-submit-btn"
              type="primary"
              onClick={() => form.submit()}
            >
              提交
            </Button>
            <Button data-e2e-id="game-edit-cancel-btn" onClick={onCancel}>
              取消
            </Button>
          </Space>
        </div>
      )}
    >
      <Form<GameEditValues>
        form={form}
        layout="horizontal"
        labelAlign="right"
        labelCol={{ flex: '140px' }}
        wrapperCol={{ flex: 1 }}
        colon
        onFinish={onSubmit}
      >
        <Form.Item label="遊戲ID" name="gameId">
          <Input
            data-e2e-id={fieldId('game-id-input')}
            disabled
            placeholder={mode === 'add' ? '保存後自動生成' : undefined}
          />
        </Form.Item>

        <Form.Item label="遊戲名稱(EN)" name="gameNameEn" rules={[{ required: true, message: '請輸入遊戲名稱' }]}>
          <Input
            data-e2e-id={fieldId('name-en-input')}
            maxLength={50}
            showCount
            allowClear
            placeholder="英文文本，前端展示文本。（50字內）"
          />
        </Form.Item>

        <Form.Item label="遊戲名稱(Tg)" name="gameNameTg">
          <Input
            data-e2e-id={fieldId('name-tg-input')}
            maxLength={50}
            showCount
            allowClear
            placeholder="菲律賓語文本，前端展示文本。如果未配置，則使用英文文本"
          />
        </Form.Item>

        <Form.Item
          label="客戶端1採集圖標"
          name="client1Icon"
          valuePropName="fileList"
          getValueFromEvent={normalizeUploadFileList}
          rules={[{ required: true, message: '請上傳客戶端1採集圖標' }]}
          extra={<Text type="secondary">375×500，.webp，≤0.5MB</Text>}
        >
          <Upload
            data-e2e-id={fieldId('client1-icon-input')}
            listType="picture-card"
            maxCount={1}
            accept=".webp"
            beforeUpload={() => false}
          >
            {uploadButton}
          </Upload>
        </Form.Item>

        <Form.Item
          label="客戶端2採集圖標"
          name="client2Icon"
          valuePropName="fileList"
          getValueFromEvent={normalizeUploadFileList}
          extra={<Text type="secondary">375×500，.webp，≤0.5MB</Text>}
        >
          <Upload
            data-e2e-id={fieldId('client2-icon-input')}
            listType="picture-card"
            maxCount={1}
            accept=".webp"
            beforeUpload={() => false}
          >
            {uploadButton}
          </Upload>
        </Form.Item>

        <Form.Item label="遊戲狀態" name="status" rules={[{ required: true }]}>
          <Select data-e2e-id={fieldId('status-input')}>
            {gameStatusOptions.map((status) => (
              <Select.Option key={status} value={status} disabled={status === '維護中'}>
                {status}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item noStyle shouldUpdate={(previous, current) => previous.status !== current.status}>
          {({ getFieldValue }) => getFieldValue('status') === '維護中' ? (
            <Form.Item
              label="維護起止時間"
              name="maintenanceRange"
              rules={[{ required: true, message: '請選擇維護起止時間' }]}
            >
              <RangePicker data-e2e-id={fieldId('maintenance-range-input')} showTime style={{ width: '100%' }} />
            </Form.Item>
          ) : null}
        </Form.Item>

        <Form.Item label="歸屬場館" name="venue" rules={[{ required: true }]}>
          <Select data-e2e-id={fieldId('venue-input')} options={venueOptions.map((value) => ({ value, label: value }))} />
        </Form.Item>

        <Form.Item label="出品廠商" name="provider" rules={[{ required: true }]}>
          <Select data-e2e-id={fieldId('provider-input')} options={providerOptions.map((value) => ({ value, label: value }))} />
        </Form.Item>

        <Form.Item label="類型標籤" name="gameTypes">
          <Select
            data-e2e-id={fieldId('game-types-input')}
            mode="multiple"
            options={gameTypeOptions.map((value) => ({ value, label: value }))}
          />
        </Form.Item>

        <Form.Item label="Pagcor類型分類" name="pagcorCategory">
          <Select
            data-e2e-id={fieldId('pagcor-category-input')}
            allowClear
            options={pagcorCategoryOptions.map((value) => ({ value, label: value }))}
          />
        </Form.Item>

        <Form.Item label="遊戲費率" name="rateTemplate">
          <Input data-e2e-id={fieldId('rate-template-input')} disabled />
        </Form.Item>

        <Form.Item label="遊戲排序權重" name="sortWeight">
          <InputNumber
            data-e2e-id={fieldId('sort-weight-input')}
            min={0}
            max={9999}
            precision={0}
            style={{ width: '100%' }}
            placeholder="0～9999整數，數字越大排序越高"
          />
        </Form.Item>

        <Form.Item
          label="推薦權重"
          name="recommendWeight"
          extra="大於 0 即為推薦遊戲，顯示於客戶端搜尋頁 Recommended Games；0 或不填表示不推薦"
        >
          <InputNumber
            data-e2e-id={fieldId('recommend-weight-input')}
            min={0}
            max={9999}
            precision={0}
            style={{ width: '100%' }}
            placeholder="0～9999整數，數字越大排序越前"
          />
        </Form.Item>

        <Form.Item label="遊戲加權標籤" name="weightedTags">
          <Select
            data-e2e-id={fieldId('weighted-tags-input')}
            mode="multiple"
            options={weightTagOptions.map((value) => ({ value, label: value }))}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="是否HOT" name="hot" rules={[{ required: true }]}>
              <Radio.Group data-e2e-id={fieldId('hot-input')}>
                <Radio value>是</Radio>
                <Radio value={false}>否</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="HOT截止日期" name="hotDeadline">
              <DatePicker data-e2e-id={fieldId('hot-deadline-input')} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="是否NEW" name="isNew" rules={[{ required: true }]}>
              <Radio.Group data-e2e-id={fieldId('new-input')}>
                <Radio value>是</Radio>
                <Radio value={false}>否</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="NEW截止日期" name="newDeadline">
              <DatePicker data-e2e-id={fieldId('new-deadline-input')} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

'use client';

import React from 'react';
import {
  Button,
  Checkbox,
  Col,
  Divider,
  Form,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
  message,
} from 'antd';

const { Title } = Typography;

interface JackpotBoardSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

interface JackpotBoardSettingsValues {
  multiplierThreshold: number;
  amountThreshold: number;
  thresholdLogic: 'AND' | 'OR';
  scope: 'slot';
  settledOnly: boolean;
  autoRemoveVoided: boolean;
  sortBy: 'multiplier' | 'amount';
  streamRetention: '24h' | '48h';
  topPeriods: string[];
  displayLimit: number;
  publishMode: 'auto' | 'manual';
}

const defaultSettingsValues: JackpotBoardSettingsValues = {
  multiplierThreshold: 100,
  amountThreshold: 20000,
  thresholdLogic: 'AND',
  scope: 'slot',
  settledOnly: true,
  autoRemoveVoided: true,
  sortBy: 'multiplier',
  streamRetention: '48h',
  topPeriods: ['today', 'week'],
  displayLimit: 50,
  publishMode: 'auto',
};

export default function JackpotBoardSettingsModal({
  open,
  onClose,
}: JackpotBoardSettingsModalProps) {
  const [form] = Form.useForm<JackpotBoardSettingsValues>();

  const handleSave = async () => {
    try {
      await form.validateFields();
      message.success('設定已儲存');
      onClose();
    } catch {
      message.error('請確認設定欄位');
    }
  };

  return (
    <Modal
      title="爆獎榜設定"
      open={open}
      width={720}
      closable={false}
      maskClosable={false}
      onCancel={onClose}
      afterOpenChange={(visible) => {
        if (visible) form.setFieldsValue(defaultSettingsValues);
      }}
      footer={(
        <Space>
          <Button onClick={onClose} data-e2e-id="jackpot-board-settings-cancel-btn">
            取消
          </Button>
          <Button type="primary" onClick={handleSave} data-e2e-id="jackpot-board-settings-save-btn">
            儲存
          </Button>
        </Space>
      )}
      data-e2e-id="jackpot-board-settings-modal"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={defaultSettingsValues}
        data-e2e-id="jackpot-board-settings-form"
      >
        <Divider orientation="left">
          <Title level={5} style={{ margin: 0 }}>觸發門檻</Title>
        </Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="multiplierThreshold" label="倍數門檻" rules={[{ required: true }]}>
              <InputNumber
                min={1}
                addonAfter="×"
                style={{ width: '100%' }}
                data-e2e-id="jackpot-board-settings-multiplier-threshold-input"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="amountThreshold" label="金額門檻" rules={[{ required: true }]}>
              <InputNumber
                min={0}
                precision={2}
                prefix="₱"
                style={{ width: '100%' }}
                data-e2e-id="jackpot-board-settings-amount-threshold-input"
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="thresholdLogic" label="組合邏輯">
              <Radio.Group data-e2e-id="jackpot-board-settings-threshold-logic-radio">
                <Radio value="AND" data-e2e-id="jackpot-board-settings-threshold-logic-and-radio">AND</Radio>
                <Radio value="OR" data-e2e-id="jackpot-board-settings-threshold-logic-or-radio">OR</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="scope" label="適用範圍">
              <Select disabled data-e2e-id="jackpot-board-settings-scope-select">
                <Select.Option value="slot">老虎機 Slot</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">
          <Title level={5} style={{ margin: 0 }}>風控聯動</Title>
        </Divider>
        <Form.Item name="settledOnly" label="僅收「已結算、無爭議」注單" valuePropName="checked">
          <Switch data-e2e-id="jackpot-board-settings-settled-only-switch" />
        </Form.Item>
        <Form.Item name="autoRemoveVoided" label="注單事後作廢 → 自動下架對應記錄" valuePropName="checked">
          <Switch data-e2e-id="jackpot-board-settings-auto-remove-voided-switch" />
        </Form.Item>

        <Divider orientation="left">
          <Title level={5} style={{ margin: 0 }}>榜單呈現</Title>
        </Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="sortBy" label="排序方式">
              <Radio.Group data-e2e-id="jackpot-board-settings-sort-radio">
                <Radio value="multiplier" data-e2e-id="jackpot-board-settings-sort-multiplier-radio">倍數</Radio>
                <Radio value="amount" data-e2e-id="jackpot-board-settings-sort-amount-radio">金額</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="streamRetention" label="即時流保留時長">
              <Select data-e2e-id="jackpot-board-settings-stream-retention-select">
                <Select.Option value="24h">24h</Select.Option>
                <Select.Option value="48h">48h</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="topPeriods" label="Top 榜週期">
              <Checkbox.Group data-e2e-id="jackpot-board-settings-top-periods-checkbox-group">
                <Space>
                  <Checkbox value="today" data-e2e-id="jackpot-board-settings-top-period-today-checkbox">今日</Checkbox>
                  <Checkbox value="week" data-e2e-id="jackpot-board-settings-top-period-week-checkbox">本週</Checkbox>
                </Space>
              </Checkbox.Group>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="displayLimit" label="顯示條數" rules={[{ required: true }]}>
              <InputNumber
                min={1}
                max={200}
                style={{ width: '100%' }}
                data-e2e-id="jackpot-board-settings-display-limit-input"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">
          <Title level={5} style={{ margin: 0 }}>上榜模式</Title>
        </Divider>
        <Form.Item name="publishMode">
          <Radio.Group data-e2e-id="jackpot-board-settings-publish-mode-radio">
            <Radio value="auto" data-e2e-id="jackpot-board-settings-publish-mode-auto-radio">自動</Radio>
            <Radio value="manual" disabled data-e2e-id="jackpot-board-settings-publish-mode-manual-radio">
              人工 <Tag style={{ marginLeft: 4 }}>即將推出</Tag>
            </Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
}

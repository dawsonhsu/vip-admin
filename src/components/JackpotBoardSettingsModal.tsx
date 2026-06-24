'use client';

import React from 'react';
import {
  Button,
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
  message,
} from 'antd';

interface JackpotBoardSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

interface JackpotBoardSettingsValues {
  multiplierThreshold: number;
  amountThreshold: number;
  thresholdLogic: 'AND' | 'OR';
  scope: 'slot';
  enabled: boolean;
}

const defaultSettingsValues: JackpotBoardSettingsValues = {
  multiplierThreshold: 100,
  amountThreshold: 20000,
  thresholdLogic: 'AND',
  scope: 'slot',
  enabled: true,
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
      width={640}
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
        <Divider orientation="left">功能開關</Divider>
        <Form.Item name="enabled" label="總開關" valuePropName="checked" tooltip="關閉後前台爆獎榜立即隱藏">
          <Switch
            checkedChildren="啟用"
            unCheckedChildren="停用"
            data-e2e-id="jackpot-board-settings-enabled-switch"
          />
        </Form.Item>
        <Divider orientation="left">觸發門檻</Divider>
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
              <Select
                disabled
                options={[{ value: 'slot', label: '老虎機 Slot' }]}
                data-e2e-id="jackpot-board-settings-scope-select"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

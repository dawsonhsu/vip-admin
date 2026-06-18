'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  Form,
  InputNumber,
  Radio,
  Space,
  Table,
  Typography,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import ActivityConfigWizardShell, {
  type WizardStepDef,
} from './activityConfigShared/ActivityConfigWizardShell';
import { BaseConfigStep, baseConfigInitialValues, BASE_CONFIG_STEP_FIELDS } from './activityConfigShared/BaseConfigStep';
import { FreeSpinStep, defaultFreeSpinValues } from './activityConfigShared/FreeSpinStep';
import {
  dailyMultiDepositLadderDefault,
  dailyMultiDepositDefaultConfig,
  type DailyMultiDepositLadderRow,
} from '@/data/dailyMultiDepositActivityData';

const { Text } = Typography;

const E2E = 'daily-multi-deposit-config-modal';
const ACTIVITY_ID = 22;
const ACTIVITY_NAME = '每日多存阶梯活动';
const HIDDEN_BASE_FIELDS: string[] = [];

interface Props {
  open: boolean;
  onClose: () => void;
}

function BonusConfigStep() {
  const [ladder, setLadder] = useState<DailyMultiDepositLadderRow[]>(() =>
    dailyMultiDepositLadderDefault.map((r) => ({ ...r }))
  );

  const updateRow = (key: string, field: keyof DailyMultiDepositLadderRow, value: number | null) => {
    setLadder((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: Number(value ?? 0) } : r))
    );
  };

  const addRow = () => {
    setLadder((prev) => [
      ...prev,
      {
        key: `tier-${Date.now()}`,
        startAmount: 0,
        bonusRate: 0,
        freeSpinCount: 0,
        principalRollover: 0,
        bonusRollover: 0,
      },
    ]);
  };

  const deleteRow = (key: string) => {
    setLadder((prev) => prev.filter((r) => r.key !== key));
  };

  const columns: ColumnsType<DailyMultiDepositLadderRow> = [
    {
      title: '档位',
      width: 60,
      render: (_, __, i) => <Text>第 {i + 1} 档</Text>,
    },
    {
      title: '起存金额≥',
      dataIndex: 'startAmount',
      width: 160,
      render: (_, r) => (
        <InputNumber
          data-e2e-id={`${E2E}-ladder-start-amount-${r.key}`}
          min={0}
          precision={2}
          value={r.startAmount}
          addonAfter="P"
          style={{ width: '100%' }}
          onChange={(v) => updateRow(r.key, 'startAmount', v)}
        />
      ),
    },
    {
      title: '礼金比例',
      dataIndex: 'bonusRate',
      width: 150,
      render: (_, r) => (
        <InputNumber
          data-e2e-id={`${E2E}-ladder-bonus-rate-${r.key}`}
          min={0}
          max={150}
          precision={2}
          value={r.bonusRate}
          addonAfter="%"
          style={{ width: '100%' }}
          onChange={(v) => updateRow(r.key, 'bonusRate', v)}
        />
      ),
    },
    {
      title: '免费旋转次数',
      dataIndex: 'freeSpinCount',
      width: 150,
      render: (_, r) => (
        <InputNumber
          data-e2e-id={`${E2E}-ladder-fs-count-${r.key}`}
          min={0}
          max={999}
          precision={0}
          value={r.freeSpinCount}
          addonAfter="次"
          style={{ width: '100%' }}
          onChange={(v) => updateRow(r.key, 'freeSpinCount', v)}
        />
      ),
    },
    {
      title: '本金打码倍数',
      dataIndex: 'principalRollover',
      width: 150,
      render: (_, r) => (
        <InputNumber
          data-e2e-id={`${E2E}-ladder-principal-rollover-${r.key}`}
          min={0}
          max={99}
          value={r.principalRollover}
          addonAfter="倍"
          style={{ width: '100%' }}
          onChange={(v) => updateRow(r.key, 'principalRollover', v)}
        />
      ),
    },
    {
      title: '礼金打码倍数',
      dataIndex: 'bonusRollover',
      width: 150,
      render: (_, r) => (
        <InputNumber
          data-e2e-id={`${E2E}-ladder-bonus-rollover-${r.key}`}
          min={0}
          max={99}
          value={r.bonusRollover}
          addonAfter="倍"
          style={{ width: '100%' }}
          onChange={(v) => updateRow(r.key, 'bonusRollover', v)}
        />
      ),
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right',
      render: (_, r) => (
        <Button
          data-e2e-id={`${E2E}-ladder-delete-${r.key}`}
          type="link"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => deleteRow(r.key)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <Card
      size="small"
      title="彩金配置"
      data-e2e-id={`${E2E}-bonus-card`}
      style={{ marginTop: 0, marginBottom: 8 }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Form.Item
          label="每日多次存款数量"
          name="dailyDepositCount"
          rules={[{ required: true, message: '请输入每日多次存款数量' }]}
          style={{ marginBottom: 0 }}
        >
          <InputNumber
            data-e2e-id={`${E2E}-daily-deposit-count`}
            min={1}
            precision={0}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label="奖励公式"
          name="rewardFormula"
          rules={[{ required: true, message: '请选择奖励公式' }]}
          style={{ marginBottom: 0 }}
        >
          <Radio.Group data-e2e-id={`${E2E}-reward-formula-radio`}>
            <Radio value="ratio">比例发放</Radio>
            <Radio value="fixed">定额发放</Radio>
          </Radio.Group>
        </Form.Item>

        <div>
          <Text strong>阶梯配置</Text>
        </div>

        <Table
          data-e2e-id={`${E2E}-ladder-table`}
          columns={columns}
          dataSource={ladder}
          rowKey="key"
          size="small"
          pagination={false}
          scroll={{ x: 900 }}
          onRow={(record) =>
            ({
              'data-e2e-id': `${E2E}-ladder-row-${record.key}`,
            } as React.HTMLAttributes<HTMLTableRowElement>)
          }
        />

        <Button
          data-e2e-id={`${E2E}-ladder-add-btn`}
          icon={<PlusOutlined />}
          onClick={addRow}
        >
          新增档位
        </Button>
      </Space>
    </Card>
  );
}

export default function DailyMultiDepositConfigModal({ open, onClose }: Props) {
  const initialValues = {
    ...baseConfigInitialValues(
      ACTIVITY_ID,
      ACTIVITY_NAME,
      'deposit',
      '2026-05-01 00:00:00',
      '2026-06-30 23:59:59',
    ),
    introSource: 'frontend',
    dailyDepositCount: dailyMultiDepositDefaultConfig.dailyDepositCount,
    rewardFormula: dailyMultiDepositDefaultConfig.rewardFormula,
    freeSpin: defaultFreeSpinValues,
    googleCode: undefined,
  };

  const steps: WizardStepDef[] = [
    {
      title: '基础配置',
      validateFields: BASE_CONFIG_STEP_FIELDS.filter((f) => !HIDDEN_BASE_FIELDS.includes(f)),
      render: () => (
        <BaseConfigStep
          e2ePrefix={E2E}
          activityId={ACTIVITY_ID}
          activityName={ACTIVITY_NAME}
          activityTypeDefault="deposit"
          hideFields={HIDDEN_BASE_FIELDS}
        />
      ),
    },
    {
      title: '彩金配置',
      validateFields: ['dailyDepositCount', 'rewardFormula'],
      render: () => <BonusConfigStep />,
    },
    {
      title: '免费旋转配置',
      validateFields: ['googleCode'],
      render: (form) => (
        <FreeSpinStep
          form={form}
          e2ePrefix={E2E}
          gameLimitToProvider
        />
      ),
    },
  ];

  return (
    <ActivityConfigWizardShell
      open={open}
      onClose={onClose}
      title="每日多存阶梯活动 - 编辑配置"
      steps={steps}
      initialValues={initialValues}
      saveMessage="每日多存阶梯活动配置已保存"
      e2ePrefix={E2E}
    />
  );
}

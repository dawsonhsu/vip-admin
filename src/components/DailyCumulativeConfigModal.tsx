'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  Form,
  InputNumber,
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
import { GameRestrictionCascader } from './GameRestrictionCascader';
import {
  dailyCumulativeLadderDefault,
  type DailyCumulativeLadderRow,
} from '@/data/dailyCumulativeActivityData';

const { Text } = Typography;

const E2E = 'daily-cumulative-config-modal';
const ACTIVITY_ID = 13;
const ACTIVITY_NAME = '日累计存款/流水多重奖励系列活动';

interface Props {
  open: boolean;
  onClose: () => void;
}

function CumulativeRewardStep() {
  const [ladder, setLadder] = useState<DailyCumulativeLadderRow[]>(() =>
    dailyCumulativeLadderDefault.map((r) => ({ ...r }))
  );

  const updateLadderRow = (key: string, field: keyof DailyCumulativeLadderRow, value: number | null) => {
    setLadder((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: Number(value ?? 0) } : r))
    );
  };

  const addRow = () => {
    const last = ladder[ladder.length - 1];
    setLadder((prev) => [
      ...prev,
      {
        key: `ladder-${Date.now()}`,
        threshold: (last?.threshold ?? 0) + 1000,
        cumulativeRollover: (last?.cumulativeRollover ?? 0) + 2000,
        bonusAmount: (last?.bonusAmount ?? 0) + 10,
        freeSpinCount: (last?.freeSpinCount ?? 0) + 5,
        rolloverMultiplier: last?.rolloverMultiplier ?? 1,
      },
    ]);
  };

  const deleteRow = (key: string) => {
    setLadder((prev) => prev.filter((r) => r.key !== key));
  };

  const columns: ColumnsType<DailyCumulativeLadderRow> = [
    {
      title: '档位',
      width: 60,
      render: (_, __, i) => <Text>第 {i + 1} 档</Text>,
    },
    {
      title: '累計存款',
      dataIndex: 'threshold',
      width: 160,
      render: (_, r) => (
        <InputNumber
          data-e2e-id={`${E2E}-ladder-threshold-${r.key}`}
          min={0}
          value={r.threshold}
          addonAfter="P"
          style={{ width: '100%' }}
          onChange={(v) => updateLadderRow(r.key, 'threshold', v)}
        />
      ),
    },
    {
      title: '累計流水',
      dataIndex: 'cumulativeRollover',
      width: 160,
      render: (_, r) => (
        <InputNumber
          data-e2e-id={`${E2E}-ladder-cumulative-rollover-${r.key}`}
          min={0}
          value={r.cumulativeRollover}
          addonAfter="P"
          style={{ width: '100%' }}
          onChange={(v) => updateLadderRow(r.key, 'cumulativeRollover', v)}
        />
      ),
    },
    {
      title: '彩金',
      dataIndex: 'bonusAmount',
      width: 140,
      render: (_, r) => (
        <InputNumber
          data-e2e-id={`${E2E}-ladder-bonus-${r.key}`}
          min={0}
          value={r.bonusAmount}
          prefix="₱"
          style={{ width: '100%' }}
          onChange={(v) => updateLadderRow(r.key, 'bonusAmount', v)}
        />
      ),
    },
    {
      title: 'FS 次數',
      dataIndex: 'freeSpinCount',
      width: 130,
      render: (_, r) => (
        <InputNumber
          data-e2e-id={`${E2E}-ladder-fs-count-${r.key}`}
          min={0}
          value={r.freeSpinCount}
          addonAfter="次"
          style={{ width: '100%' }}
          onChange={(v) => updateLadderRow(r.key, 'freeSpinCount', v)}
        />
      ),
    },
    {
      title: '流水倍數',
      dataIndex: 'rolloverMultiplier',
      width: 130,
      render: (_, r) => (
        <InputNumber
          data-e2e-id={`${E2E}-ladder-rollover-${r.key}`}
          min={0}
          value={r.rolloverMultiplier}
          addonAfter="倍"
          style={{ width: '100%' }}
          onChange={(v) => updateLadderRow(r.key, 'rolloverMultiplier', v)}
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
      title="累計奖励配置"
      data-e2e-id={`${E2E}-reward-card`}
      style={{ marginTop: 0, marginBottom: 8 }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Form.Item
          label="流水場館/遊戲限制"
          name="wagerVenueRestriction"
          rules={[{ required: true, message: '請選擇流水場館/遊戲限制' }]}
          tooltip="流水消耗僅限於選定的遊戲類型與廠商"
          style={{ marginBottom: 0 }}
        >
          <GameRestrictionCascader
            placeholder="選擇遊戲類型 → 廠商"
            data-e2e-id={`${E2E}-wager-venue-restriction-cascader`}
          />
        </Form.Item>

        <Table
          data-e2e-id={`${E2E}-ladder-table`}
          columns={columns}
          dataSource={ladder}
          rowKey="key"
          size="small"
          pagination={false}
          scroll={{ x: 880 }}
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

export default function DailyCumulativeConfigModal({ open, onClose }: Props) {
  const initialValues = {
    ...baseConfigInitialValues(
      ACTIVITY_ID,
      ACTIVITY_NAME,
      'other',
      '2025-12-31 08:00:00',
      '2028-06-28 23:59:59',
    ),
    freeSpin: defaultFreeSpinValues,
    googleCode: undefined,
  };

  const HIDDEN_BASE_FIELDS = ['ruleSource', 'introSource', 'activityScope', 'depositChannels', 'wagerVenueRestriction'];

  const steps: WizardStepDef[] = [
    {
      title: '基础配置',
      validateFields: BASE_CONFIG_STEP_FIELDS.filter((f) => !HIDDEN_BASE_FIELDS.includes(f)),
      render: () => (
        <BaseConfigStep
          e2ePrefix={E2E}
          activityId={ACTIVITY_ID}
          activityName={ACTIVITY_NAME}
          activityTypeDefault="other"
          hideFields={HIDDEN_BASE_FIELDS}
        />
      ),
    },
    {
      title: '累計奖励配置',
      validateFields: ['wagerVenueRestriction'],
      render: () => <CumulativeRewardStep />,
    },
    {
      title: '免费旋转配置',
      validateFields: ['googleCode'],
      render: (form) => (
        <FreeSpinStep
          form={form}
          e2ePrefix={E2E}
          hideFields={['reviewMode', 'creditMode']}
          gameLimitToProvider
        />
      ),
    },
  ];

  return (
    <ActivityConfigWizardShell
      open={open}
      onClose={onClose}
      title="日累計存款 - 编辑配置"
      steps={steps}
      initialValues={initialValues}
      saveMessage="日累計存款配置已保存"
      e2ePrefix={E2E}
    />
  );
}

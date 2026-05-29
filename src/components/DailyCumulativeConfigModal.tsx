'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Table,
  TimePicker,
  Typography,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import ActivityConfigWizardShell, {
  type WizardStepDef,
} from './activityConfigShared/ActivityConfigWizardShell';
import { BaseConfigStep, baseConfigInitialValues, BASE_CONFIG_STEP_FIELDS } from './activityConfigShared/BaseConfigStep';
import { FreeSpinStep, defaultFreeSpinValues } from './activityConfigShared/FreeSpinStep';
import {
  dailyCumulativeLadderDefault,
  dailyCumulativeDefaultConfig,
  type DailyCumulativeLadderRow,
} from '@/data/dailyCumulativeActivityData';

const { Text } = Typography;
const { RangePicker: TimeRangePicker } = TimePicker;

const E2E = 'daily-cumulative-config-modal';
const ACTIVITY_ID = 13;
const ACTIVITY_NAME = '日累计存款/流水多重奖励系列活动';

interface Props {
  open: boolean;
  onClose: () => void;
}

function CumulativeRewardStep() {
  const [cumulationType, setCumulationType] = useState(dailyCumulativeDefaultConfig.cumulationType);
  const [settleCycle, setSettleCycle] = useState(dailyCumulativeDefaultConfig.settleCycle);
  const [budgetCap, setBudgetCap] = useState(dailyCumulativeDefaultConfig.budgetCap);
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
      title: '累計門檻',
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
        <Row gutter={24} align="middle">
          <Col span={12}>
            <Space>
              <Text style={{ whiteSpace: 'nowrap' }}>累計類型：</Text>
              <Radio.Group
                data-e2e-id={`${E2E}-cumulation-type-radio`}
                value={cumulationType}
                onChange={(e) => setCumulationType(e.target.value)}
              >
                <Radio value="deposit">存款金額</Radio>
                <Radio value="turnover">流水金額</Radio>
              </Radio.Group>
            </Space>
          </Col>
          <Col span={12}>
            <Space>
              <Text style={{ whiteSpace: 'nowrap' }}>結算週期：</Text>
              <Select
                data-e2e-id={`${E2E}-settle-cycle-select`}
                value={settleCycle}
                style={{ width: 120 }}
                onChange={setSettleCycle}
                options={[
                  { value: 'realtime', label: '即时' },
                  { value: 'hour', label: '小时' },
                  { value: 'day', label: '日' },
                ]}
              />
            </Space>
          </Col>
        </Row>

        <Row gutter={24} align="middle">
          <Col span={12}>
            <Space>
              <Text style={{ whiteSpace: 'nowrap' }}>統計時段：</Text>
              <TimeRangePicker
                data-e2e-id={`${E2E}-time-range-picker`}
                format="HH:mm"
                defaultValue={[dayjs('00:00', 'HH:mm'), dayjs('23:59', 'HH:mm')]}
              />
            </Space>
          </Col>
          <Col span={12}>
            <Space>
              <Text style={{ whiteSpace: 'nowrap' }}>預算上限：</Text>
              <InputNumber
                data-e2e-id={`${E2E}-budget-cap-input`}
                min={0}
                value={budgetCap}
                prefix="₱"
                style={{ width: 160 }}
                onChange={(v) => setBudgetCap(Number(v ?? 0))}
              />
            </Space>
          </Col>
        </Row>

        <Table
          data-e2e-id={`${E2E}-ladder-table`}
          columns={columns}
          dataSource={ladder}
          rowKey="key"
          size="small"
          pagination={false}
          scroll={{ x: 720 }}
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

  const steps: WizardStepDef[] = [
    {
      title: '基础配置',
      validateFields: BASE_CONFIG_STEP_FIELDS,
      render: () => (
        <BaseConfigStep
          e2ePrefix={E2E}
          activityId={ACTIVITY_ID}
          activityName={ACTIVITY_NAME}
          activityTypeDefault="other"
        />
      ),
    },
    {
      title: '累計奖励配置',
      validateFields: [],
      render: () => <CumulativeRewardStep />,
    },
    {
      title: '免费旋转配置',
      validateFields: ['googleCode'],
      render: (form) => <FreeSpinStep form={form} e2ePrefix={E2E} />,
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

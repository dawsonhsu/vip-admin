'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  Row,
  Space,
  Table,
  Typography,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ActivityConfigWizardShell, {
  type WizardStepDef,
} from './activityConfigShared/ActivityConfigWizardShell';
import { BaseConfigStep, baseConfigInitialValues, BASE_CONFIG_STEP_FIELDS } from './activityConfigShared/BaseConfigStep';
import { FreeSpinStep, defaultFreeSpinValues } from './activityConfigShared/FreeSpinStep';
import {
  vipCheckinTierDefaults,
  vipCheckinDefaultConfig,
  type VipCheckinTierRow,
} from '@/data/vipCheckinActivityData';

const { Text } = Typography;

const E2E = 'vip-checkin-config-modal';
const ACTIVITY_ID = 25;
const ACTIVITY_NAME = 'vip签到';

interface Props {
  open: boolean;
  onClose: () => void;
}

function CheckinRewardStep() {
  const { token } = theme.useToken();
  const [rows, setRows] = useState<VipCheckinTierRow[]>(() =>
    vipCheckinTierDefaults.map((r) => ({ ...r }))
  );
  const [cycleDays, setCycleDays] = useState(vipCheckinDefaultConfig.cycleDays);
  const [rewardDaysStr, setRewardDaysStr] = useState(
    vipCheckinDefaultConfig.rewardDays.join(', ')
  );

  const updateRow = (key: string, field: keyof VipCheckinTierRow, value: number | null) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: Number(value ?? 0) } : r))
    );
  };

  const numInput = (
    key: string,
    field: keyof VipCheckinTierRow,
    addonAfter?: string,
    prefix?: string,
    e2eSuffix?: string,
  ) => (
    <InputNumber
      data-e2e-id={`${E2E}-tier-${key}-${e2eSuffix ?? field}`}
      min={0}
      value={rows.find((r) => r.key === key)?.[field] as number}
      addonAfter={addonAfter}
      prefix={prefix}
      style={{ width: '100%' }}
      onChange={(v) => updateRow(key, field, v)}
    />
  );

  const columns: ColumnsType<VipCheckinTierRow> = [
    {
      title: '等级区间',
      dataIndex: 'tierName',
      width: 140,
      fixed: 'left',
      render: (v, r) => (
        <div>
          <Text strong>{v}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {r.vipRange}
          </Text>
        </div>
      ),
    },
    {
      title: '第6天 彩金',
      dataIndex: 'day6P',
      width: 110,
      render: (_, r) => numInput(r.key, 'day6P', 'P', undefined, 'day6P'),
    },
    {
      title: '第6天 流水',
      dataIndex: 'day6Flow',
      width: 100,
      render: (_, r) => numInput(r.key, 'day6Flow', '倍', undefined, 'day6Flow'),
    },
    {
      title: '第7天 彩金',
      dataIndex: 'day7P',
      width: 110,
      render: (_, r) => numInput(r.key, 'day7P', 'P', undefined, 'day7P'),
    },
    {
      title: '第7天 流水',
      dataIndex: 'day7Flow',
      width: 100,
      render: (_, r) => numInput(r.key, 'day7Flow', '倍', undefined, 'day7Flow'),
    },
    {
      title: '第7天 FS次數',
      dataIndex: 'day7FS',
      width: 110,
      render: (_, r) => numInput(r.key, 'day7FS', '次', undefined, 'day7FS'),
    },
    {
      title: '第7天 FS流水',
      dataIndex: 'day7FSFlow',
      width: 110,
      render: (_, r) => numInput(r.key, 'day7FSFlow', '倍', undefined, 'day7FSFlow'),
    },
    {
      title: '第16天 彩金',
      dataIndex: 'day16P',
      width: 110,
      render: (_, r) => numInput(r.key, 'day16P', 'P', undefined, 'day16P'),
    },
    {
      title: '第16天 流水',
      dataIndex: 'day16Flow',
      width: 110,
      render: (_, r) => numInput(r.key, 'day16Flow', '倍', undefined, 'day16Flow'),
    },
    {
      title: '第17天 彩金',
      dataIndex: 'day17P',
      width: 110,
      render: (_, r) => numInput(r.key, 'day17P', 'P', undefined, 'day17P'),
    },
    {
      title: '第17天 流水',
      dataIndex: 'day17Flow',
      width: 110,
      render: (_, r) => numInput(r.key, 'day17Flow', '倍', undefined, 'day17Flow'),
    },
    {
      title: '第17天 FS次數',
      dataIndex: 'day17FS',
      width: 110,
      render: (_, r) => numInput(r.key, 'day17FS', '次', undefined, 'day17FS'),
    },
    {
      title: '第17天 FS流水',
      dataIndex: 'day17FSFlow',
      width: 110,
      render: (_, r) => numInput(r.key, 'day17FSFlow', '倍', undefined, 'day17FSFlow'),
    },
    {
      title: '第26天 彩金',
      dataIndex: 'day26P',
      width: 110,
      render: (_, r) => numInput(r.key, 'day26P', 'P', undefined, 'day26P'),
    },
    {
      title: '第26天 流水',
      dataIndex: 'day26Flow',
      width: 110,
      render: (_, r) => numInput(r.key, 'day26Flow', '倍', undefined, 'day26Flow'),
    },
    {
      title: '第27天 彩金',
      dataIndex: 'day27P',
      width: 110,
      render: (_, r) => numInput(r.key, 'day27P', 'P', undefined, 'day27P'),
    },
    {
      title: '第27天 流水',
      dataIndex: 'day27Flow',
      width: 110,
      render: (_, r) => numInput(r.key, 'day27Flow', '倍', undefined, 'day27Flow'),
    },
    {
      title: '第27天 FS次數',
      dataIndex: 'day27FS',
      width: 110,
      render: (_, r) => numInput(r.key, 'day27FS', '次', undefined, 'day27FS'),
    },
    {
      title: '第27天 FS流水',
      dataIndex: 'day27FSFlow',
      width: 110,
      render: (_, r) => numInput(r.key, 'day27FSFlow', '倍', undefined, 'day27FSFlow'),
    },
    {
      title: '補簽門檻',
      dataIndex: 'makeupDeposit',
      width: 120,
      fixed: 'right',
      render: (_, r) => numInput(r.key, 'makeupDeposit', 'P', undefined, 'makeupDeposit'),
    },
    {
      title: '補簽上限/月',
      dataIndex: 'makeupLimit',
      width: 120,
      fixed: 'right',
      render: (_, r) => numInput(r.key, 'makeupLimit', '次', undefined, 'makeupLimit'),
    },
  ];

  return (
    <Card
      size="small"
      title="簽到獎勵配置"
      data-e2e-id={`${E2E}-reward-card`}
      style={{ marginTop: 0, marginBottom: 8 }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={24}>
          <Col span={8}>
            <Space>
              <Text>週期天數：</Text>
              <InputNumber
                data-e2e-id={`${E2E}-cycle-days-input`}
                min={1}
                max={365}
                value={cycleDays}
                addonAfter="天"
                style={{ width: 140 }}
                onChange={(v) => setCycleDays(Number(v ?? 27))}
              />
            </Space>
          </Col>
          <Col span={16}>
            <Space>
              <Text>獎勵節點（天）：</Text>
              <Form.Item
                name="rewardDays"
                noStyle
              >
                <input
                  data-e2e-id={`${E2E}-reward-days-input`}
                  value={rewardDaysStr}
                  onChange={(e) => setRewardDaysStr(e.target.value)}
                  placeholder="逗号分隔，例：6, 7, 16, 17, 26, 27"
                  style={{
                    width: 260,
                    padding: '4px 11px',
                    border: `1px solid ${token.colorBorder}`,
                    borderRadius: token.borderRadius,
                    background: token.colorBgContainer,
                    color: token.colorText,
                    fontSize: token.fontSize,
                  }}
                />
              </Form.Item>
            </Space>
          </Col>
        </Row>

        <Table
          data-e2e-id={`${E2E}-tier-table`}
          columns={columns}
          dataSource={rows}
          rowKey="key"
          size="small"
          pagination={false}
          scroll={{ x: 2400 }}
          onRow={(record) =>
            ({
              'data-e2e-id': `${E2E}-tier-row-${record.key}`,
            } as React.HTMLAttributes<HTMLTableRowElement>)
          }
        />
      </Space>
    </Card>
  );
}

export default function VipCheckinConfigModal({ open, onClose }: Props) {
  const initialValues = {
    ...baseConfigInitialValues(
      ACTIVITY_ID,
      ACTIVITY_NAME,
      'other',
      '2026-01-09 00:00:00',
      '2026-03-31 14:34:08',
    ),
    rewardDays: '6, 7, 16, 17, 26, 27',
    freeSpin: defaultFreeSpinValues,
    googleCode: undefined,
  };

  const HIDDEN_BASE_FIELDS = ['ruleSource', 'introSource', 'activityScope', 'depositChannels'];

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
      title: '免费旋转配置',
      validateFields: ['googleCode'],
      render: (form) => (
        <FreeSpinStep form={form} e2ePrefix={E2E} hideFields={['reviewMode', 'creditMode']} />
      ),
    },
  ];

  return (
    <ActivityConfigWizardShell
      open={open}
      onClose={onClose}
      title="VIP 簽到 - 编辑配置"
      steps={steps}
      initialValues={initialValues}
      saveMessage="VIP 簽到配置已保存"
      e2ePrefix={E2E}
    />
  );
}

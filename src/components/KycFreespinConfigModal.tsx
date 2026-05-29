'use client';

import React, { useState } from 'react';
import {
  Card,
  Col,
  Form,
  InputNumber,
  Radio,
  Row,
  Space,
  Typography,
} from 'antd';
import ActivityConfigWizardShell, {
  type WizardStepDef,
} from './activityConfigShared/ActivityConfigWizardShell';
import { BaseConfigStep, baseConfigInitialValues, BASE_CONFIG_STEP_FIELDS } from './activityConfigShared/BaseConfigStep';
import { FreeSpinStep, defaultFreeSpinValues } from './activityConfigShared/FreeSpinStep';
import { kycFreespinDefaultConfig } from '@/data/kycFreespinActivityData';

const { Text } = Typography;

const E2E = 'kyc-freespin-config-modal';
const ACTIVITY_ID = 19;
const ACTIVITY_NAME = 'KYC Free Spin';

interface Props {
  open: boolean;
  onClose: () => void;
}

function KycTriggerStep() {
  const [kycLevel, setKycLevel] = useState(kycFreespinDefaultConfig.kycLevel);
  const [claimLimit, setClaimLimit] = useState(kycFreespinDefaultConfig.claimLimitPerUser);
  const [triggerTiming, setTriggerTiming] = useState(kycFreespinDefaultConfig.triggerTiming);
  const [delayDays, setDelayDays] = useState(kycFreespinDefaultConfig.delayDays);
  const [requireFirstDeposit, setRequireFirstDeposit] = useState(kycFreespinDefaultConfig.requireFirstDeposit);
  const [fsCount, setFsCount] = useState(kycFreespinDefaultConfig.fsCount);
  const [betAmount, setBetAmount] = useState(kycFreespinDefaultConfig.betAmount);
  const [validityDays, setValidityDays] = useState(kycFreespinDefaultConfig.validityDays);

  const labelStyle: React.CSSProperties = {
    display: 'inline-block',
    width: 130,
    textAlign: 'right',
    marginRight: 8,
    lineHeight: '32px',
    flexShrink: 0,
  };

  return (
    <Card
      size="small"
      title="KYC 触发配置"
      data-e2e-id={`${E2E}-trigger-card`}
      style={{ marginTop: 0, marginBottom: 8 }}
    >
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <Row gutter={24}>
          <Col span={24}>
            <Space align="center">
              <Text style={labelStyle}>觸發 KYC 等級：</Text>
              <Radio.Group
                data-e2e-id={`${E2E}-kyc-level-radio`}
                value={kycLevel}
                onChange={(e) => setKycLevel(e.target.value)}
              >
                <Radio value="T1">T1 完成</Radio>
                <Radio value="T2">T2 完成</Radio>
                <Radio value="T3">T3 完成</Radio>
              </Radio.Group>
            </Space>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Space align="center">
              <Text style={labelStyle}>每人領取上限：</Text>
              <InputNumber
                data-e2e-id={`${E2E}-claim-limit-input`}
                min={1}
                max={5}
                value={claimLimit}
                addonAfter="次"
                style={{ width: 140 }}
                onChange={(v) => setClaimLimit(Number(v ?? 1))}
              />
            </Space>
          </Col>
          <Col span={12}>
            <Space align="center">
              <Text style={labelStyle}>是否要求首存：</Text>
              <Radio.Group
                data-e2e-id={`${E2E}-require-first-deposit-radio`}
                value={requireFirstDeposit}
                onChange={(e) => setRequireFirstDeposit(e.target.value)}
              >
                <Radio value="yes">要</Radio>
                <Radio value="no">不要</Radio>
              </Radio.Group>
            </Space>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={24}>
            <Space align="center">
              <Text style={labelStyle}>觸發時機：</Text>
              <Radio.Group
                data-e2e-id={`${E2E}-trigger-timing-radio`}
                value={triggerTiming}
                onChange={(e) => setTriggerTiming(e.target.value)}
              >
                <Radio value="instant">KYC 通過即時派發</Radio>
                <Radio value="delayed">延遲 N 天</Radio>
              </Radio.Group>
              {triggerTiming === 'delayed' && (
                <InputNumber
                  data-e2e-id={`${E2E}-delay-days-input`}
                  min={1}
                  max={30}
                  value={delayDays}
                  addonAfter="天"
                  style={{ width: 120 }}
                  onChange={(v) => setDelayDays(Number(v ?? 1))}
                />
              )}
            </Space>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Space align="center">
              <Text style={labelStyle}>FS 派發次數：</Text>
              <InputNumber
                data-e2e-id={`${E2E}-fs-count-input`}
                min={1}
                value={fsCount}
                addonAfter="次"
                style={{ width: 140 }}
                onChange={(v) => setFsCount(Number(v ?? 10))}
              />
            </Space>
          </Col>
          <Col span={12}>
            <Space align="center">
              <Text style={labelStyle}>單次投注額：</Text>
              <InputNumber
                data-e2e-id={`${E2E}-bet-amount-input`}
                min={0}
                step={0.01}
                precision={2}
                value={betAmount}
                prefix="₱"
                style={{ width: 140 }}
                onChange={(v) => setBetAmount(Number(v ?? 0.2))}
              />
            </Space>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Space align="center">
              <Text style={labelStyle}>有效期：</Text>
              <InputNumber
                data-e2e-id={`${E2E}-validity-days-input`}
                min={1}
                value={validityDays}
                addonAfter="天"
                style={{ width: 140 }}
                onChange={(v) => setValidityDays(Number(v ?? 7))}
              />
            </Space>
          </Col>
        </Row>
      </Space>
    </Card>
  );
}

export default function KycFreespinConfigModal({ open, onClose }: Props) {
  const initialValues = {
    ...baseConfigInitialValues(
      ACTIVITY_ID,
      ACTIVITY_NAME,
      'other',
      '2026-01-09 00:00:00',
      '2026-12-31 23:59:59',
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
      title: 'KYC 触发配置',
      validateFields: [],
      render: () => <KycTriggerStep />,
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
      title="KYC Free Spin - 编辑配置"
      steps={steps}
      initialValues={initialValues}
      saveMessage="KYC Free Spin 配置已保存"
      e2ePrefix={E2E}
    />
  );
}

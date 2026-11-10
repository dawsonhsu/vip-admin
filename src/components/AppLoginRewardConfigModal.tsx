'use client';

import React from 'react';
import { Card, Col, Form, Input, InputNumber, Radio, Row, Typography } from 'antd';
import type { FormInstance } from 'antd';
import ActivityConfigWizardShell, { type WizardStepDef } from './activityConfigShared/ActivityConfigWizardShell';
import { BaseConfigStep, baseConfigInitialValues, BASE_CONFIG_STEP_FIELDS } from './activityConfigShared/BaseConfigStep';
import { FreeSpinStep, defaultFreeSpinValues } from './activityConfigShared/FreeSpinStep';
import { GameRestrictionCascader } from './GameRestrictionCascader';
import { appLoginRewardDefaultConfig } from '@/data/appLoginRewardData';

const E2E = 'app-login-reward-config-modal';
const HIDDEN_BASE_FIELDS = ['depositChannels', 'wagerVenueRestriction'];
const cashItemProps = { labelCol: { span: 24 }, wrapperCol: { span: 24 }, colon: false };

function RewardConfigStep({ form }: { form: FormInstance }) {
  const rewardType = Form.useWatch('rewardType', form) ?? appLoginRewardDefaultConfig.rewardType;
  const amount = Form.useWatch(['cash', 'amount'], form);
  const multiplier = Form.useWatch(['cash', 'rolloverMultiplier'], form);
  const rollover = Number(amount ?? 0) * Number(multiplier ?? 0);

  return (
    <>
      <Form.Item label="奖励类型" name="rewardType" rules={[{ required: true, message: '请选择奖励类型' }]}>
        <Radio.Group data-e2e-id={`${E2E}-reward-type-radio`}>
          <Radio value="cash" data-e2e-id={`${E2E}-reward-cash-radio`}>现金</Radio>
          <Radio value="freeSpin" data-e2e-id={`${E2E}-reward-freespin-radio`}>Free Spin</Radio>
        </Radio.Group>
      </Form.Item>
      {rewardType === 'cash' && (
        <Card size="small" title="现金配置" data-e2e-id={`${E2E}-cash-card`}>
          <Row gutter={[16, 12]}>
            <Col span={12}>
              <Form.Item {...cashItemProps} label="现金金额" name={['cash', 'amount']}
                rules={[{ required: true, type: 'number', min: 0.01, message: '请输入大于或等于 0.01 的现金金额' }]}>
                <InputNumber data-e2e-id={`${E2E}-cash-amount-input`} prefix="₱" min={0.01} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item {...cashItemProps} label="流水倍数" name={['cash', 'rolloverMultiplier']}
                tooltip="流水要求 = 现金金额 × 流水倍数，填 0 表示无流水要求"
                rules={[{ required: true, type: 'number', min: 0, message: '请输入大于或等于 0 的流水倍数' }]}>
                <InputNumber data-e2e-id={`${E2E}-cash-rollover-multiplier-input`} min={0} step={0.5} addonAfter="倍" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item {...cashItemProps} label="流水场馆限制" name={['cash', 'venueRestriction']} tooltip="留空表示全部场馆流水都计入">
                <GameRestrictionCascader data-e2e-id={`${E2E}-cash-venue-restriction-cascader`} placeholder="选择游戏类型 / 厂商" />
              </Form.Item>
              <Typography.Text type="secondary" style={{ fontSize: 12 }} data-e2e-id={`${E2E}-cash-rollover-required-text`}>
                流水要求：₱ {rollover.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography.Text>
            </Col>
          </Row>
        </Card>
      )}
      {rewardType === 'freeSpin' && (
        <FreeSpinStep form={form} e2ePrefix={E2E} showGoogleCode={false}
          hideFields={['reviewMode', 'creditMode']} gameLimitToProvider showSpinCount />
      )}
      <Form.Item label="谷歌验证码" name="googleCode" rules={[{ required: true, message: '请输入谷歌验证码' }]} style={{ marginTop: 16 }}>
        <Input.Password data-e2e-id={`${E2E}-form-google-code-input`} maxLength={6} placeholder="请输入谷歌验证码" />
      </Form.Item>
    </>
  );
}

export default function AppLoginRewardConfigModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const initialValues = {
    ...baseConfigInitialValues(35, 'App登录奖励', 'other', '2026-11-03 00:00:00', '2026-12-31 23:59:59'),
    ...appLoginRewardDefaultConfig,
    freeSpin: { ...defaultFreeSpinValues, ...appLoginRewardDefaultConfig.freeSpin },
    googleCode: undefined,
  };
  const steps: WizardStepDef[] = [
    {
      title: '基础配置',
      validateFields: BASE_CONFIG_STEP_FIELDS.filter((field) => !HIDDEN_BASE_FIELDS.includes(field)),
      render: () => <BaseConfigStep e2ePrefix={E2E} activityId={35} activityName="App登录奖励" activityTypeDefault="other" hideFields={HIDDEN_BASE_FIELDS} />,
    },
    { title: '奖励配置', render: (form) => <RewardConfigStep form={form} /> },
  ];

  return <ActivityConfigWizardShell open={open} onClose={onClose} title="App登录奖励 - 编辑配置"
    steps={steps} initialValues={initialValues} saveMessage="App登录奖励配置已保存" e2ePrefix={E2E} />;
}

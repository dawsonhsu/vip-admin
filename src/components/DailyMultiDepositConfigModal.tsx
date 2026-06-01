'use client';

import React from 'react';
import ActivityConfigWizardShell, {
  type WizardStepDef,
} from './activityConfigShared/ActivityConfigWizardShell';
import { BaseConfigStep, baseConfigInitialValues, BASE_CONFIG_STEP_FIELDS } from './activityConfigShared/BaseConfigStep';

const E2E = 'daily-multi-deposit-config-modal';
const ACTIVITY_ID = 22;
const ACTIVITY_NAME = '每日多存阶梯活动';
const HIDDEN_BASE_FIELDS = ['depositChannels'];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function DailyMultiDepositConfigModal({ open, onClose }: Props) {
  const initialValues = {
    ...baseConfigInitialValues(
      ACTIVITY_ID,
      ACTIVITY_NAME,
      'deposit',
      '2026-05-01 00:00:00',
      '2026-05-31 23:59:59',
    ),
    introSource: 'frontend',
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

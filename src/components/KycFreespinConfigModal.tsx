'use client';

import React from 'react';
import ActivityConfigWizardShell, {
  type WizardStepDef,
} from './activityConfigShared/ActivityConfigWizardShell';
import { BaseConfigStep, baseConfigInitialValues, BASE_CONFIG_STEP_FIELDS } from './activityConfigShared/BaseConfigStep';
import { FreeSpinStep, defaultFreeSpinValues } from './activityConfigShared/FreeSpinStep';
import { kycFreespinDefaultConfig } from '@/data/kycFreespinActivityData';

const E2E = 'kyc-freespin-config-modal';
const ACTIVITY_ID = 19;
const ACTIVITY_NAME = 'KYC Free Spin';

interface Props {
  open: boolean;
  onClose: () => void;
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
    freeSpin: { ...defaultFreeSpinValues, fsCount: kycFreespinDefaultConfig.fsCount },
    googleCode: undefined,
  };

  const HIDDEN_BASE_FIELDS = ['depositChannels', 'wagerVenueRestriction'];

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
        <FreeSpinStep
          form={form}
          e2ePrefix={E2E}
          hideFields={['reviewMode', 'creditMode']}
          gameLimitToProvider
          showSpinCount
        />
      ),
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

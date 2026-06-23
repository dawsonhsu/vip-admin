'use client';

import React, { useMemo, useState } from 'react';
import {
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
  theme,
} from 'antd';
import type { FormInstance } from 'antd';
import ActivityConfigWizardShell, {
  type WizardStepDef,
} from './activityConfigShared/ActivityConfigWizardShell';
import {
  BaseConfigStep,
  BASE_CONFIG_STEP_FIELDS,
  baseConfigInitialValues,
} from './activityConfigShared/BaseConfigStep';
import { FreeSpinStep, defaultFreeSpinValues } from './activityConfigShared/FreeSpinStep';
import { GameRestrictionCascader } from './GameRestrictionCascader';
import {
  defaultPrizePool,
  prizeTypeLabels,
  type PrizeConfig,
  type PrizeType,
} from '@/data/reactivationMysteryBoxData';

const { Text } = Typography;

const E2E = 'reactivation-mystery-box-config-modal';
const ACTIVITY_ID = 31;
const ACTIVITY_NAME = '召回盲盒';
const HIDDEN_BASE_FIELDS = ['wagerVenueRestriction', 'depositChannels'];
const PRIZE_TABS: PrizeType[] = ['bonus', 'depositCoupon', 'rebateCoupon', 'freeSpins', 'filCoins'];

const compactItemProps = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
  colon: false,
  style: { marginBottom: 0 },
};

interface Props {
  open: boolean;
  onClose: () => void;
}

const clonePaths = (paths?: string[][]) => paths?.map((path) => [...path]);

const clonePrizePool = (): PrizeConfig[] =>
  defaultPrizePool.map((prize) => ({
    ...prize,
    venueRestriction: clonePaths(prize.venueRestriction),
    gameRestriction: clonePaths(prize.gameRestriction),
  }));

const getEnabledWeightTotal = (prizePool?: Partial<PrizeConfig>[]) =>
  (prizePool ?? []).reduce(
    (sum, prize) => (prize.enabled ? sum + Number(prize.weight ?? 0) : sum),
    0
  );

const isWeightTotalValid = (value: number) => Math.abs(value - 100) < 0.001;

function ValueAmountFields({
  form,
  index,
  type,
  enabled,
}: {
  form: FormInstance;
  index: number;
  type: PrizeType;
  enabled: boolean;
}) {
  const prizeValues = (Form.useWatch(['prizePool', index], form) ?? defaultPrizePool[index]) as PrizeConfig;
  const valueMode = prizeValues.valueMode ?? 'fixed';
  const suffixMap: Record<PrizeType, string> = {
    bonus: 'P',
    depositCoupon: '% / P',
    rebateCoupon: '% / P',
    freeSpins: '次',
    filCoins: 'C',
  };

  if (valueMode === 'range') {
    return (
      <>
        <Col span={6}>
          <Form.Item
            {...compactItemProps}
            label="最小值"
            name={['prizePool', index, 'valueMin']}
            rules={[{ required: enabled, message: '请输入最小值' }]}
          >
            <InputNumber
              data-e2e-id={`${E2E}-prize-${type}-value-min-input`}
              min={0}
              addonAfter={suffixMap[type]}
              disabled={!enabled}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            {...compactItemProps}
            label="最大值"
            name={['prizePool', index, 'valueMax']}
            rules={[{ required: enabled, message: '请输入最大值' }]}
          >
            <InputNumber
              data-e2e-id={`${E2E}-prize-${type}-value-max-input`}
              min={0}
              addonAfter={suffixMap[type]}
              disabled={!enabled}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
      </>
    );
  }

  return (
    <Col span={6}>
      <Form.Item
        {...compactItemProps}
        label="固定值"
        name={['prizePool', index, 'valueFixed']}
        rules={[{ required: enabled, message: '请输入固定值' }]}
      >
        <InputNumber
          data-e2e-id={`${E2E}-prize-${type}-value-fixed-input`}
          min={0}
          addonAfter={suffixMap[type]}
          disabled={!enabled}
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Col>
  );
}

function PrizePanel({
  form,
  index,
  type,
}: {
  form: FormInstance;
  index: number;
  type: PrizeType;
}) {
  const { token } = theme.useToken();
  const prizeValues = (Form.useWatch(['prizePool', index], form) ?? defaultPrizePool[index]) as PrizeConfig;
  const enabled = prizeValues.enabled ?? defaultPrizePool[index].enabled;

  const renderExtraFields = () => {
    switch (type) {
      case 'bonus':
        return (
          <Row gutter={[16, 12]}>
            <Col span={16}>
              <Form.Item
                {...compactItemProps}
                label="适用场馆"
                name={['prizePool', index, 'venueRestriction']}
              >
                <GameRestrictionCascader
                  placeholder="选择游戏类型 → 厂商"
                  data-e2e-id={`${E2E}-prize-bonus-venue-cascader`}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                {...compactItemProps}
                label="流水倍数"
                name={['prizePool', index, 'rolloverMultiplier']}
              >
                <InputNumber
                  data-e2e-id={`${E2E}-prize-bonus-rollover-input`}
                  min={0}
                  addonAfter="倍"
                  disabled={!enabled}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        );
      case 'depositCoupon':
        return (
          <Row gutter={[16, 12]}>
            <Col span={8}>
              <Form.Item
                {...compactItemProps}
                label="最低存款额"
                name={['prizePool', index, 'minDeposit']}
              >
                <InputNumber
                  data-e2e-id={`${E2E}-prize-depositCoupon-min-deposit-input`}
                  min={0}
                  prefix="₱"
                  disabled={!enabled}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                {...compactItemProps}
                label="流水限制"
                name={['prizePool', index, 'rolloverLimit']}
              >
                <InputNumber
                  data-e2e-id={`${E2E}-prize-depositCoupon-rollover-limit-input`}
                  min={0}
                  addonAfter="倍"
                  disabled={!enabled}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                {...compactItemProps}
                label="领取门槛"
                name={['prizePool', index, 'historyDepositThreshold']}
              >
                <InputNumber
                  data-e2e-id={`${E2E}-prize-depositCoupon-history-deposit-threshold-input`}
                  min={0}
                  precision={0}
                  addonBefore="历史存款≥"
                  addonAfter="次"
                  disabled={!enabled}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        );
      case 'rebateCoupon':
        return (
          <Row gutter={[16, 12]}>
            <Col span={8}>
              <Form.Item
                {...compactItemProps}
                label="彩金上限"
                name={['prizePool', index, 'bonusCap']}
              >
                <InputNumber
                  data-e2e-id={`${E2E}-prize-rebateCoupon-bonus-cap-input`}
                  min={0}
                  prefix="₱"
                  disabled={!enabled}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                {...compactItemProps}
                label="流水限制"
                name={['prizePool', index, 'rolloverLimit']}
              >
                <InputNumber
                  data-e2e-id={`${E2E}-prize-rebateCoupon-rollover-limit-input`}
                  min={0}
                  addonAfter="倍"
                  disabled={!enabled}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                {...compactItemProps}
                label="游戏限制"
                name={['prizePool', index, 'gameRestriction']}
              >
                <GameRestrictionCascader
                  placeholder="选择游戏类型 → 厂商"
                  data-e2e-id={`${E2E}-prize-rebateCoupon-game-restriction-cascader`}
                />
              </Form.Item>
            </Col>
          </Row>
        );
      case 'freeSpins':
        return (
          <FreeSpinStep
            form={form}
            e2ePrefix={`${E2E}-freeSpins`}
            showGoogleCode={false}
          />
        );
      case 'filCoins':
        return null;
      default:
        return null;
    }
  };
  const extraFields = renderExtraFields();
  const showExtraDivider = type === 'bonus' || type === 'depositCoupon' || type === 'rebateCoupon';

  return (
    <div
      data-e2e-id={`${E2E}-tab-panel-${type}`}
      style={{
        background: token.colorFillAlter,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadiusLG,
        padding: 16,
      }}
    >
      <Form.Item hidden name={['prizePool', index, 'type']}>
        <Input />
      </Form.Item>
      <Form.Item hidden name={['prizePool', index, 'label']}>
        <Input />
      </Form.Item>

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={[16, 12]} align="top">
          <Col span={8}>
            <Form.Item
              {...compactItemProps}
              label="启用"
              name={['prizePool', index, 'enabled']}
              valuePropName="checked"
            >
              <Switch
                data-e2e-id={`${E2E}-prize-${type}-enabled-switch`}
                checkedChildren="启用"
                unCheckedChildren="停用"
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              {...compactItemProps}
              label="权重(%)"
              name={['prizePool', index, 'weight']}
              rules={[{ required: enabled, message: '请输入权重' }]}
            >
              <InputNumber
                data-e2e-id={`${E2E}-prize-${type}-weight-input`}
                min={0}
                max={100}
                precision={2}
                addonAfter="%"
                disabled={!enabled}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 12]}>
          <Col span={8}>
            <Form.Item
              {...compactItemProps}
              label="出值模式"
              name={['prizePool', index, 'valueMode']}
              rules={[{ required: enabled, message: '请选择出值模式' }]}
            >
              <Radio.Group
                data-e2e-id={`${E2E}-prize-${type}-value-mode-radio`}
                disabled={!enabled}
              >
                <Radio value="fixed">固定值</Radio>
                <Radio value="range">区间随机</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <ValueAmountFields form={form} index={index} type={type} enabled={enabled} />
        </Row>

        {type === 'freeSpins' ? extraFields : showExtraDivider && extraFields && (
          <>
            <Divider orientation="left" style={{ margin: '4px 0 0' }}>
              专属设定
            </Divider>
            {extraFields}
          </>
        )}
      </Space>
    </div>
  );
}

function PrizePoolStep({ form }: { form: FormInstance }) {
  const [activeTab, setActiveTab] = useState<PrizeType>('bonus');
  const { token } = theme.useToken();
  const prizePool = (Form.useWatch('prizePool', form) ?? defaultPrizePool) as PrizeConfig[];
  const totalWeight = useMemo(() => getEnabledWeightTotal(prizePool), [prizePool]);
  const enabledCount = prizePool.filter((prize) => prize.enabled).length;
  const totalValid = isWeightTotalValid(totalWeight);

  return (
    <Space
      direction="vertical"
      size={16}
      style={{ width: '100%' }}
      data-e2e-id={`${E2E}-prize-pool-card`}
    >
      <div
        data-e2e-id={`${E2E}-total-weight-card`}
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          padding: '8px 12px',
          background: token.colorFillAlter,
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: token.borderRadius,
        }}
      >
        <Text strong>TOTAL WEIGHT</Text>
        <Tag color={totalValid ? 'success' : 'error'} style={{ marginInlineEnd: 0 }}>
          {totalWeight.toFixed(2)}%
        </Tag>
        <Text type="secondary">已启用 {enabledCount} 个奖品</Text>
        <Text type="secondary">启用奖品权重总和需等于 100%</Text>
      </div>

      <Form.Item
        hidden
        name="prizeWeightTotal"
        dependencies={['prizePool']}
        rules={[
          {
            validator: () => {
              const currentPool = form.getFieldValue('prizePool') as PrizeConfig[];
              const currentTotal = getEnabledWeightTotal(currentPool);
              return isWeightTotalValid(currentTotal)
                ? Promise.resolve()
                : Promise.reject(new Error('启用奖品权重总和必须等于 100%'));
            },
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Tabs
        data-e2e-id={`${E2E}-prize-tabs`}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as PrizeType)}
        items={PRIZE_TABS.map((type, index) => ({
          key: type,
          label: (
            <span data-e2e-id={`${E2E}-tab-${type}`}>
              {prizeTypeLabels[type]}
            </span>
          ),
          children: <PrizePanel form={form} index={index} type={type} />,
        }))}
      />
    </Space>
  );
}

export default function ReactivationMysteryBoxConfigModal({ open, onClose }: Props) {
  const initialValues = {
    ...baseConfigInitialValues(
      ACTIVITY_ID,
      ACTIVITY_NAME,
      'blindbox',
      '2026-06-18 00:00:00',
      '2026-12-31 23:59:59'
    ),
    activityScope: 'specified',
    prizePool: clonePrizePool(),
    freeSpin: { ...defaultFreeSpinValues },
    prizeWeightTotal: undefined,
  };

  const steps: WizardStepDef[] = [
    {
      title: '基本设置',
      validateFields: BASE_CONFIG_STEP_FIELDS.filter((field) => !HIDDEN_BASE_FIELDS.includes(field)),
      render: () => (
        <BaseConfigStep
          e2ePrefix={E2E}
          activityId={ACTIVITY_ID}
          activityName={ACTIVITY_NAME}
          activityTypeDefault="blindbox"
          hideFields={HIDDEN_BASE_FIELDS}
        />
      ),
    },
    {
      title: '奖品池与机率',
      validateFields: ['prizeWeightTotal'],
      render: (form) => <PrizePoolStep form={form} />,
    },
  ];

  return (
    <ActivityConfigWizardShell
      open={open}
      onClose={onClose}
      title="召回盲盒 - 活动配置"
      steps={steps}
      initialValues={initialValues}
      saveMessage="召回盲盒活动配置已保存"
      e2ePrefix={E2E}
    />
  );
}

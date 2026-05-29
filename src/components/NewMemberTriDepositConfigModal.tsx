'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  Modal,
  Radio,
  Row,
  Space,
  Steps,
  Table,
  Tabs,
  Typography,
  Upload,
  message,
  theme,
} from 'antd';
import {
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  defaultSelectedDepositChannels,
  depositChannels,
  gameOptions,
  providerOptions,
  tierConfigDefault,
  type RewardFormula,
  type TriDepositTabConfig,
  type TriDepositTabKey,
  type TriDepositTierConfig,
} from '@/data/newMemberTriDepositData';
import { BaseConfigStep } from './activityConfigShared/BaseConfigStep';
import { FreeSpinStep, defaultFreeSpinValues } from './activityConfigShared/FreeSpinStep';

const { Text } = Typography;

const TAB_KEYS: TriDepositTabKey[] = ['dep1', 'dep2', 'dep3'];

type NumericTierField =
  | 'minDeposit'
  | 'bonusRatio'
  | 'bonusAmount'
  | 'freeSpinTotal'
  | 'principalRollover'
  | 'bonusRollover';

interface NewMemberTriDepositConfigModalProps {
  open: boolean;
  onClose: () => void;
}

const cloneTierConfig = (): Record<TriDepositTabKey, TriDepositTabConfig> =>
  TAB_KEYS.reduce((acc, key) => {
    acc[key] = {
      ...tierConfigDefault[key],
      tiers: tierConfigDefault[key].tiers.map((tier) => ({ ...tier })),
    };
    return acc;
  }, {} as Record<TriDepositTabKey, TriDepositTabConfig>);

const uploadButton = (e2eId: string, label = '上传') => (
  <button
    data-e2e-id={e2eId}
    type="button"
    style={{ border: 0, background: 'none', cursor: 'pointer' }}
  >
    <PlusOutlined />
    <div style={{ marginTop: 8 }}>{label}</div>
  </button>
);

const normalizeUploadFileList = (event: any) =>
  Array.isArray(event) ? event : event?.fileList;

const E2E = 'new-member-tri-deposit-config-modal';

export default function NewMemberTriDepositConfigModal({
  open,
  onClose,
}: NewMemberTriDepositConfigModalProps) {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<TriDepositTabKey>('dep1');
  const [configData, setConfigData] = useState<Record<TriDepositTabKey, TriDepositTabConfig>>(
    cloneTierConfig
  );
  const [currentStep, setCurrentStep] = useState(0);
  const { token } = theme.useToken();

  useEffect(() => {
    if (!open) setCurrentStep(0);
  }, [open]);

  const stepItems = [
    { title: '基础配置', key: 'basic' },
    { title: '彩金配置', key: 'bonus' },
    { title: '免费旋转配置', key: 'freespin' },
  ];

  const STEP_FIELDS: Record<number, string[]> = {
    0: [
      'activityType',
      'activityId',
      'name',
      'ruleSource',
      'status',
      'timeRange',
      'introSource',
      'activityScope',
      'depositChannels',
    ],
    1: [],
    2: ['googleCode'],
  };

  const handleNext = async () => {
    try {
      await form.validateFields(STEP_FIELDS[currentStep]);
      setCurrentStep((step) => Math.min(step + 1, stepItems.length - 1));
    } catch {
      /* validation errors shown inline */
    }
  };

  const handlePrev = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const handleOk = () => {
    form
      .validateFields()
      .then(() => {
        message.success('活动配置已保存');
        onClose();
      })
      .catch(() => {
        message.error('请检查必填项');
      });
  };

  const updateTabConfig = (
    tabKey: TriDepositTabKey,
    patch: Partial<Pick<TriDepositTabConfig, 'rewardFormula' | 'bonusCap' | 'enabled'>>
  ) => {
    setConfigData((prev) => ({
      ...prev,
      [tabKey]: {
        ...prev[tabKey],
        ...patch,
      },
    }));
  };

  const updateTier = (
    tabKey: TriDepositTabKey,
    tierKey: string,
    field: NumericTierField,
    value: number | null
  ) => {
    setConfigData((prev) => ({
      ...prev,
      [tabKey]: {
        ...prev[tabKey],
        tiers: prev[tabKey].tiers.map((tier) =>
          tier.key === tierKey ? { ...tier, [field]: Number(value ?? 0) } : tier
        ),
      },
    }));
  };

  const addTier = (tabKey: TriDepositTabKey) => {
    setConfigData((prev) => {
      const tiers = prev[tabKey].tiers;
      const lastTier = tiers[tiers.length - 1];
      const nextIndex = tiers.length + 1;
      const nextTier: TriDepositTierConfig = {
        key: `${tabKey}-tier-${Date.now()}`,
        minDeposit: (lastTier?.minDeposit ?? 0) + 100,
        bonusRatio: lastTier?.bonusRatio ?? 1,
        bonusAmount: lastTier?.bonusAmount ?? 5,
        freeSpinTotal: lastTier?.freeSpinTotal ?? nextIndex,
        principalRollover: lastTier?.principalRollover ?? 1,
        bonusRollover: lastTier?.bonusRollover ?? 1,
      };

      return {
        ...prev,
        [tabKey]: {
          ...prev[tabKey],
          tiers: [...tiers, nextTier],
        },
      };
    });
  };

  const deleteTier = (tabKey: TriDepositTabKey, tierKey: string) => {
    setConfigData((prev) => ({
      ...prev,
      [tabKey]: {
        ...prev[tabKey],
        tiers: prev[tabKey].tiers.filter((tier) => tier.key !== tierKey),
      },
    }));
  };

  const createTierColumns = (
    tabKey: TriDepositTabKey,
    formula: RewardFormula
  ): ColumnsType<TriDepositTierConfig> => [
    {
      title: '档位',
      width: 70,
      render: (_, __, index) => <Text>第 {index + 1} 档</Text>,
    },
    {
      title: '起存金额≥',
      dataIndex: 'minDeposit',
      width: 150,
      render: (value, record) => (
        <InputNumber
          data-e2e-id={`${E2E}-tier-table-min-deposit-input-${tabKey}-${record.key}`}
          min={0}
          value={value}
          addonAfter="P"
          style={{ width: '100%' }}
          onChange={(nextValue) => updateTier(tabKey, record.key, 'minDeposit', nextValue)}
        />
      ),
    },
    {
      title: formula === 'ratio' ? '礼金比例 %' : '礼金金额 P',
      dataIndex: formula === 'ratio' ? 'bonusRatio' : 'bonusAmount',
      width: 150,
      render: (value, record) => (
        <InputNumber
          data-e2e-id={`${E2E}-tier-table-bonus-${formula}-input-${tabKey}-${record.key}`}
          min={0}
          value={value}
          step={formula === 'ratio' ? 0.1 : 1}
          addonAfter={formula === 'ratio' ? '%' : 'P'}
          style={{ width: '100%' }}
          onChange={(nextValue) =>
            updateTier(
              tabKey,
              record.key,
              formula === 'ratio' ? 'bonusRatio' : 'bonusAmount',
              nextValue
            )
          }
        />
      ),
    },
    {
      title: '免费旋转次数',
      dataIndex: 'freeSpinTotal',
      width: 140,
      render: (value, record) => (
        <InputNumber
          data-e2e-id={`${E2E}-tier-table-freespin-count-input-${tabKey}-${record.key}`}
          min={0}
          value={value}
          addonAfter="次"
          style={{ width: '100%' }}
          onChange={(nextValue) => updateTier(tabKey, record.key, 'freeSpinTotal', nextValue)}
        />
      ),
    },
    {
      title: '本金打码倍数',
      dataIndex: 'principalRollover',
      width: 140,
      render: (value, record) => (
        <InputNumber
          data-e2e-id={`${E2E}-tier-table-principal-rollover-input-${tabKey}-${record.key}`}
          min={0}
          value={value}
          addonAfter="倍"
          style={{ width: '100%' }}
          onChange={(nextValue) => updateTier(tabKey, record.key, 'principalRollover', nextValue)}
        />
      ),
    },
    {
      title: '礼金打码倍数',
      dataIndex: 'bonusRollover',
      width: 140,
      render: (value, record) => (
        <InputNumber
          data-e2e-id={`${E2E}-tier-table-bonus-rollover-input-${tabKey}-${record.key}`}
          min={0}
          value={value}
          addonAfter="倍"
          style={{ width: '100%' }}
          onChange={(nextValue) => updateTier(tabKey, record.key, 'bonusRollover', nextValue)}
        />
      ),
    },
    {
      title: '操作',
      width: 90,
      fixed: 'right',
      render: (_, record) => (
        <Button
          data-e2e-id={`${E2E}-tier-table-delete-btn-${tabKey}-${record.key}`}
          type="link"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => deleteTier(tabKey, record.key)}
        >
          删除
        </Button>
      ),
    },
  ];

  const renderTabContent = (tabKey: TriDepositTabKey) => {
    const currentConfig = configData[tabKey];

    return (
      <div
        data-e2e-id={`${E2E}-tab-panel-${tabKey}`}
        style={{
          background: token.colorFillAlter,
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: token.borderRadiusLG,
          padding: 16,
        }}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Row gutter={24} align="middle">
            <Col span={12}>
              <Space>
                <Text style={{ display: 'inline-block', width: 110, textAlign: 'right' }}>
                  奖励公式：
                </Text>
                <Radio.Group
                  data-e2e-id={`${E2E}-reward-formula-radio-${tabKey}`}
                  value={currentConfig.rewardFormula}
                  onChange={(event) =>
                    updateTabConfig(tabKey, { rewardFormula: event.target.value })
                  }
                >
                  <Radio value="ratio">比例发放</Radio>
                  <Radio value="fixed">定额发放</Radio>
                </Radio.Group>
              </Space>
            </Col>
            <Col span={12}>
              <Space>
                <Text style={{ display: 'inline-block', width: 110, textAlign: 'right' }}>
                  彩金上限：
                </Text>
                <InputNumber
                  data-e2e-id={`${E2E}-bonus-cap-input-${tabKey}`}
                  prefix="₱"
                  min={0}
                  value={currentConfig.bonusCap}
                  style={{ width: 160 }}
                  onChange={(value) => updateTabConfig(tabKey, { bonusCap: Number(value ?? 0) })}
                />
              </Space>
            </Col>
          </Row>

          <Row gutter={24} align="top">
            <Col span={12}>
              <Space align="start">
                <Text
                  style={{
                    display: 'inline-block',
                    width: 110,
                    textAlign: 'right',
                    lineHeight: '32px',
                  }}
                >
                  状态：
                </Text>
                <Radio.Group
                  data-e2e-id={`${E2E}-status-radio-${tabKey}`}
                  value={currentConfig.enabled ? 'open' : 'closed'}
                  onChange={(event) =>
                    updateTabConfig(tabKey, { enabled: event.target.value === 'open' })
                  }
                  style={{ paddingTop: 4 }}
                >
                  <Radio value="open">开启</Radio>
                  <Radio value="closed">关闭</Radio>
                </Radio.Group>
              </Space>
            </Col>
            <Col span={12}>
              <Space align="start">
                <Text
                  style={{
                    display: 'inline-block',
                    width: 110,
                    textAlign: 'right',
                    lineHeight: '32px',
                  }}
                >
                  活动页 Banner：
                </Text>
                <Upload
                  data-e2e-id={`${E2E}-banner-upload-${tabKey}`}
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={() => false}
                >
                  {uploadButton(
                    `${E2E}-banner-upload-btn-${tabKey}`,
                    'Banner'
                  )}
                </Upload>
              </Space>
            </Col>
          </Row>

          <Table
            columns={createTierColumns(tabKey, currentConfig.rewardFormula)}
            dataSource={currentConfig.tiers}
            rowKey="key"
            onRow={(record) =>
              ({
                'data-e2e-id': `${E2E}-tier-table-row-${tabKey}-${record.key}`,
              } as React.HTMLAttributes<HTMLTableRowElement>)
            }
            size="small"
            pagination={false}
            scroll={{ x: 940 }}
          />

          <Button
            data-e2e-id={`${E2E}-tier-table-add-btn-${tabKey}`}
            icon={<PlusOutlined />}
            onClick={() => addTier(tabKey)}
          >
            新增级距
          </Button>
        </Space>
      </div>
    );
  };

  return (
    <Modal
      title="新人三存活动 - 编辑配置"
      open={open}
      onCancel={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <Button
            data-e2e-id={`${E2E}-footer-cancel-btn`}
            onClick={onClose}
          >
            取消
          </Button>
          {currentStep > 0 && (
            <Button
              data-e2e-id={`${E2E}-footer-prev-btn`}
              onClick={handlePrev}
            >
              上一步
            </Button>
          )}
          {currentStep < stepItems.length - 1 ? (
            <Button
              data-e2e-id={`${E2E}-footer-next-btn`}
              type="primary"
              onClick={handleNext}
            >
              下一步
            </Button>
          ) : (
            <Button
              data-e2e-id={`${E2E}-footer-submit-btn`}
              type="primary"
              onClick={handleOk}
            >
              OK
            </Button>
          )}
        </div>
      }
      width={1120}
      styles={{
        content: {
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 40px)',
        },
        header: { flexShrink: 0 },
        footer: { flexShrink: 0 },
        body: {
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          paddingRight: 16,
        },
      }}
      centered
    >
      <div data-e2e-id={`${E2E}-modal`}>
        <Steps
          data-e2e-id={`${E2E}-steps`}
          current={currentStep}
          items={stepItems}
          style={{ marginBottom: 24 }}
        />
        <Form
          form={form}
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 18 }}
          labelAlign="right"
          initialValues={{
            activityType: 'deposit',
            activityId: 30,
            name: '新人三存活动',
            ruleSource: 'backend',
            status: 'active',
            timeRange: [
              dayjs('2026-05-23 00:00:00'),
              dayjs('2026-12-31 23:59:59'),
            ],
            introSource: 'backend',
            activityScope: 'all',
            depositChannels: defaultSelectedDepositChannels,
            freeSpin: defaultFreeSpinValues,
            googleCode: undefined,
          }}
        >
          <div
            data-e2e-id={`${E2E}-step-basic`}
            style={{ display: currentStep === 0 ? 'block' : 'none' }}
          >
            <BaseConfigStep
              e2ePrefix={E2E}
              activityId={30}
              activityName="新人三存活动"
              activityTypeDefault="deposit"
            />
          </div>

          <div
            data-e2e-id={`${E2E}-step-bonus`}
            style={{ display: currentStep === 1 ? 'block' : 'none' }}
          >
            <Card
              title="彩金配置"
              size="small"
              style={{ marginTop: 0, marginBottom: 8 }}
              data-e2e-id={`${E2E}-bonus-config-card`}
            >
              <Tabs
                data-e2e-id={`${E2E}-tabs`}
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key as TriDepositTabKey)}
                items={TAB_KEYS.map((tabKey) => ({
                  key: tabKey,
                  label: (
                    <span data-e2e-id={`${E2E}-tab-${tabKey}`}>
                      {configData[tabKey].label}
                    </span>
                  ),
                  children: renderTabContent(tabKey),
                }))}
              />
            </Card>
          </div>

          <div
            data-e2e-id={`${E2E}-step-freespin`}
            style={{ display: currentStep === 2 ? 'block' : 'none' }}
          >
            <FreeSpinStep form={form} e2ePrefix={E2E} />
          </div>
        </Form>
      </div>
    </Modal>
  );
}

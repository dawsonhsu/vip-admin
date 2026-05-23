'use client';

import React, { useMemo, useState } from 'react';
import {
  Button,
  Cascader,
  Checkbox,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tabs,
  Typography,
  Upload,
  message,
} from 'antd';
import {
  DeleteOutlined,
  PlusOutlined,
  SettingOutlined,
  UploadOutlined,
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

const { Text } = Typography;
const { RangePicker } = DatePicker;

const TAB_KEYS: TriDepositTabKey[] = ['dep1', 'dep2', 'dep3'];
const LEVEL_OPTIONS = [
  { value: 'OPEN', label: 'OPEN' },
  { value: 'PROVIDER', label: 'PROVIDER' },
  { value: 'GAME', label: 'GAME' },
];

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

interface FreeSpinContext {
  tabKey: TriDepositTabKey;
  tierKey: string;
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

export default function NewMemberTriDepositConfigModal({
  open,
  onClose,
}: NewMemberTriDepositConfigModalProps) {
  const [form] = Form.useForm();
  const [freeSpinForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState<TriDepositTabKey>('dep1');
  const [configData, setConfigData] = useState<Record<TriDepositTabKey, TriDepositTabConfig>>(
    cloneTierConfig
  );
  const [freeSpinOpen, setFreeSpinOpen] = useState(false);
  const [freeSpinContext, setFreeSpinContext] = useState<FreeSpinContext | null>(null);

  const freeSpinLevel = Form.useWatch('dispatchLevel', freeSpinForm) ?? 'GAME';
  const selectedProvider = Form.useWatch('provider', freeSpinForm);

  const gameLimitOptions = useMemo(() => {
    const typeMap = new Map<string, Map<string, { value: string; label: string }[]>>();
    gameOptions.forEach((game) => {
      const providerMap = typeMap.get(game.gameType) ?? new Map<string, { value: string; label: string }[]>();
      const games = providerMap.get(game.provider) ?? [];
      games.push({ value: game.value, label: game.label });
      providerMap.set(game.provider, games);
      typeMap.set(game.gameType, providerMap);
    });

    return Array.from(typeMap.entries()).map(([gameType, providerMap]) => ({
      value: gameType,
      label: gameType,
      children: Array.from(providerMap.entries()).map(([provider, games]) => ({
        value: provider,
        label: provider,
        children: games,
      })),
    }));
  }, []);

  const filteredGameOptions = selectedProvider
    ? gameOptions.filter((game) => game.provider === selectedProvider)
    : [];

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

  const openFreeSpinModal = (tabKey: TriDepositTabKey, tierKey: string) => {
    setFreeSpinContext({ tabKey, tierKey });
    freeSpinForm.setFieldsValue({
      dispatchLevel: 'GAME',
      provider: undefined,
      gameId: undefined,
      betAmount: undefined,
      rollover: undefined,
      validityDays: 7,
      gameLimit: undefined,
      minWithdraw: undefined,
      maxWithdraw: undefined,
      reviewMode: 'auto',
      creditMode: 'auto',
      googleCode: undefined,
    });
    setFreeSpinOpen(true);
  };

  const closeFreeSpinModal = () => {
    setFreeSpinOpen(false);
    setFreeSpinContext(null);
  };

  const handleFreeSpinOk = () => {
    freeSpinForm
      .validateFields()
      .then(() => {
        message.success('免费旋转配置已保存');
        closeFreeSpinModal();
      })
      .catch(() => {
        message.error('请检查免费旋转必填项');
      });
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
          data-e2e-id={`new-member-tri-deposit-config-modal-tier-table-min-deposit-input-${tabKey}-${record.key}`}
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
          data-e2e-id={`new-member-tri-deposit-config-modal-tier-table-bonus-${formula}-input-${tabKey}-${record.key}`}
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
      width: 190,
      render: (value, record) => (
        <Space.Compact style={{ width: '100%' }}>
          <InputNumber
            data-e2e-id={`new-member-tri-deposit-config-modal-tier-table-freespin-count-input-${tabKey}-${record.key}`}
            min={0}
            value={value}
            addonAfter="次"
            style={{ width: 95 }}
            onChange={(nextValue) => updateTier(tabKey, record.key, 'freeSpinTotal', nextValue)}
          />
          <Button
            data-e2e-id={`new-member-tri-deposit-config-modal-tier-table-freespin-config-btn-${tabKey}-${record.key}`}
            icon={<SettingOutlined />}
            onClick={() => openFreeSpinModal(tabKey, record.key)}
          >
            配置
          </Button>
        </Space.Compact>
      ),
    },
    {
      title: '本金打码倍数',
      dataIndex: 'principalRollover',
      width: 140,
      render: (value, record) => (
        <InputNumber
          data-e2e-id={`new-member-tri-deposit-config-modal-tier-table-principal-rollover-input-${tabKey}-${record.key}`}
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
          data-e2e-id={`new-member-tri-deposit-config-modal-tier-table-bonus-rollover-input-${tabKey}-${record.key}`}
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
          data-e2e-id={`new-member-tri-deposit-config-modal-tier-table-delete-btn-${tabKey}-${record.key}`}
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
      <div data-e2e-id={`new-member-tri-deposit-config-modal-tab-panel-${tabKey}`}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space size={24} wrap>
            <Space>
              <Text>奖励公式</Text>
              <Radio.Group
                data-e2e-id={`new-member-tri-deposit-config-modal-reward-formula-radio-${tabKey}`}
                value={currentConfig.rewardFormula}
                onChange={(event) =>
                  updateTabConfig(tabKey, { rewardFormula: event.target.value })
                }
              >
                <Radio value="ratio">比例发放</Radio>
                <Radio value="fixed">定额发放</Radio>
              </Radio.Group>
            </Space>
            <Space>
              <Text>彩金上限</Text>
              <InputNumber
                data-e2e-id={`new-member-tri-deposit-config-modal-bonus-cap-input-${tabKey}`}
                prefix="₱"
                min={0}
                value={currentConfig.bonusCap}
                style={{ width: 160 }}
                onChange={(value) => updateTabConfig(tabKey, { bonusCap: Number(value ?? 0) })}
              />
            </Space>
            <Space>
              <Text>状态</Text>
              <Radio.Group
                data-e2e-id={`new-member-tri-deposit-config-modal-status-radio-${tabKey}`}
                value={currentConfig.enabled ? 'open' : 'closed'}
                onChange={(event) =>
                  updateTabConfig(tabKey, { enabled: event.target.value === 'open' })
                }
              >
                <Radio value="open">开启</Radio>
                <Radio value="closed">关闭</Radio>
              </Radio.Group>
            </Space>
          </Space>

          <Space align="start">
            <Text style={{ lineHeight: '32px' }}>活动页 Banner</Text>
            <Upload
              data-e2e-id={`new-member-tri-deposit-config-modal-banner-upload-${tabKey}`}
              listType="picture-card"
              maxCount={1}
              beforeUpload={() => false}
            >
              {uploadButton(
                `new-member-tri-deposit-config-modal-banner-upload-btn-${tabKey}`,
                'Banner'
              )}
            </Upload>
          </Space>

          <Table
            columns={createTierColumns(tabKey, currentConfig.rewardFormula)}
            dataSource={currentConfig.tiers}
            rowKey="key"
            onRow={(record) =>
              ({
                'data-e2e-id': `new-member-tri-deposit-config-modal-tier-table-row-${tabKey}-${record.key}`,
              } as React.HTMLAttributes<HTMLTableRowElement>)
            }
            size="small"
            pagination={false}
            scroll={{ x: 940 }}
          />

          <Button
            data-e2e-id={`new-member-tri-deposit-config-modal-tier-table-add-btn-${tabKey}`}
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
    <>
      <Modal
        title="新人三存活动 - 编辑配置"
        open={open}
        onCancel={onClose}
        onOk={handleOk}
        okText="OK"
        cancelText="Cancel"
        okButtonProps={{ 'data-e2e-id': 'new-member-tri-deposit-config-modal-footer-submit-btn' }}
        cancelButtonProps={{ 'data-e2e-id': 'new-member-tri-deposit-config-modal-footer-cancel-btn' }}
        width={1120}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto', paddingRight: 16 } }}
        centered
      >
        <div data-e2e-id="new-member-tri-deposit-config-modal-modal">
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
            }}
          >
            <Form.Item label="活动类型" name="activityType" rules={[{ required: true }]}>
              <Radio.Group data-e2e-id="new-member-tri-deposit-config-modal-form-activity-type-radio">
                <Radio value="blindbox">盲盒类</Radio>
                <Radio value="rebate">返水类</Radio>
                <Radio value="deposit">首存类</Radio>
                <Radio value="leaderboard">排行榜类</Radio>
                <Radio value="extra">附加类</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item label="活动ID" name="activityId" rules={[{ required: true }]}>
              <InputNumber
                data-e2e-id="new-member-tri-deposit-config-modal-form-activity-id-input"
                disabled
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item label="活动名称" name="name" rules={[{ required: true }]}>
              <Input
                data-e2e-id="new-member-tri-deposit-config-modal-form-name-input"
                placeholder="请输入活动名称"
              />
            </Form.Item>

            <Form.Item label="活动规则来源" name="ruleSource" rules={[{ required: true }]}>
              <Radio.Group data-e2e-id="new-member-tri-deposit-config-modal-form-rule-source-radio">
                <Radio value="backend">后台配置</Radio>
                <Radio value="code">开发代码配置</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item label="活动状态" name="status" rules={[{ required: true }]}>
              <Select
                data-e2e-id="new-member-tri-deposit-config-modal-form-status-select"
                options={[
                  { value: 'active', label: '有效' },
                  { value: 'closed', label: '失效' },
                ]}
              />
            </Form.Item>

            <Form.Item label="活动持续时间" name="timeRange" rules={[{ required: true }]}>
              <RangePicker
                data-e2e-id="new-member-tri-deposit-config-modal-form-time-range"
                showTime
                style={{ width: '100%' }}
                format="YYYY-MM-DD HH:mm:ss"
              />
            </Form.Item>

            <Form.Item label="活动介绍页来源" name="introSource" rules={[{ required: true }]}>
              <Radio.Group data-e2e-id="new-member-tri-deposit-config-modal-form-intro-source-radio">
                <Radio value="backend">后台配置</Radio>
                <Radio value="frontend">前端开发设计</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item label="活动范围" name="activityScope" rules={[{ required: true }]}>
              <Radio.Group data-e2e-id="new-member-tri-deposit-config-modal-form-activity-scope-radio">
                <Radio value="all">全部会员</Radio>
                <Radio value="specified">指定名单</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item label="存款渠道" name="depositChannels" rules={[{ required: true }]}>
              <Checkbox.Group
                data-e2e-id="new-member-tri-deposit-config-modal-form-deposit-channels-checkbox"
                options={depositChannels.map((channel) => ({ value: channel, label: channel }))}
              />
            </Form.Item>

            <Divider orientation="left">彩金配置</Divider>

            <Tabs
              data-e2e-id="new-member-tri-deposit-config-modal-tabs"
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as TriDepositTabKey)}
              items={TAB_KEYS.map((tabKey) => ({
                key: tabKey,
                label: (
                  <span data-e2e-id={`new-member-tri-deposit-config-modal-tab-${tabKey}`}>
                    {configData[tabKey].label}
                  </span>
                ),
                children: renderTabContent(tabKey),
              }))}
            />
          </Form>
        </div>
      </Modal>

      <Modal
        title="免费旋转配置"
        open={freeSpinOpen}
        onCancel={closeFreeSpinModal}
        onOk={handleFreeSpinOk}
        okText="OK"
        cancelText="Cancel"
        width={760}
        okButtonProps={{
          'data-e2e-id': 'new-member-tri-deposit-config-modal-freespin-ok-btn',
        }}
        cancelButtonProps={{
          'data-e2e-id': 'new-member-tri-deposit-config-modal-freespin-cancel-btn',
        }}
      >
        <div data-e2e-id="new-member-tri-deposit-config-modal-freespin-inner-modal">
          <Form
            form={freeSpinForm}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 17 }}
            labelAlign="right"
            initialValues={{
              dispatchLevel: 'GAME',
              validityDays: 7,
              reviewMode: 'auto',
              creditMode: 'auto',
            }}
          >
            <Form.Item label="当前档位">
              <Text type="secondary">
                {freeSpinContext
                  ? `${configData[freeSpinContext.tabKey].label} / ${freeSpinContext.tierKey}`
                  : '-'}
              </Text>
            </Form.Item>

            <Form.Item label="派发层级" name="dispatchLevel" rules={[{ required: true }]}>
              <Radio.Group data-e2e-id="new-member-tri-deposit-config-modal-freespin-level-radio">
                {LEVEL_OPTIONS.map((option) => (
                  <Radio key={option.value} value={option.value}>
                    {option.label}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>

            <Form.Item
              label="厂商"
              name="provider"
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const level = getFieldValue('dispatchLevel');
                    if ((level === 'PROVIDER' || level === 'GAME') && !value) {
                      return Promise.reject(new Error('请选择厂商'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <Select
                data-e2e-id="new-member-tri-deposit-config-modal-freespin-provider-select"
                allowClear
                placeholder="请选择厂商"
                options={providerOptions}
                onChange={() => freeSpinForm.setFieldValue('gameId', undefined)}
              />
            </Form.Item>

            <Form.Item
              label="赠送游戏"
              name="gameId"
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (getFieldValue('dispatchLevel') === 'GAME' && !value) {
                      return Promise.reject(new Error('请选择赠送游戏'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <Select
                data-e2e-id="new-member-tri-deposit-config-modal-freespin-game-select"
                allowClear
                disabled={!selectedProvider}
                placeholder={selectedProvider ? '请选择游戏' : '请先选择厂商'}
                options={filteredGameOptions}
              />
            </Form.Item>

            <Form.Item label="单次投注额" name="betAmount">
              <InputNumber
                data-e2e-id="new-member-tri-deposit-config-modal-freespin-bet-amount-input"
                min={0}
                step={0.01}
                precision={2}
                placeholder="例：0.20"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              label="流水倍数"
              name="rollover"
              extra="无流水要求请留空或填 0"
            >
              <InputNumber
                data-e2e-id="new-member-tri-deposit-config-modal-freespin-rollover-input"
                min={0}
                step={0.5}
                addonAfter="倍"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item label="有效期（天）" name="validityDays" rules={[{ required: true }]}>
              <InputNumber
                data-e2e-id="new-member-tri-deposit-config-modal-freespin-validity-days-input"
                min={1}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item label="场馆限制" name="gameLimit">
              <Cascader
                data-e2e-id="new-member-tri-deposit-config-modal-freespin-game-limit-cascader"
                options={gameLimitOptions}
                placeholder="游戏类型 / 厂商 / 游戏"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item label="最低提款" name="minWithdraw">
              <InputNumber
                data-e2e-id="new-member-tri-deposit-config-modal-freespin-min-withdraw-input"
                min={0}
                prefix="₱"
                placeholder="不限"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item label="最高提款" name="maxWithdraw">
              <InputNumber
                data-e2e-id="new-member-tri-deposit-config-modal-freespin-max-withdraw-input"
                min={0}
                prefix="₱"
                placeholder="不限"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              label="封面图"
              name="cover"
              extra="建议尺寸 4:5（例：400×500），档案 ≤ 500KB；未上传将使用预设 SVG"
            >
              <Upload
                data-e2e-id="new-member-tri-deposit-config-modal-freespin-cover-upload"
                listType="picture-card"
                maxCount={1}
                beforeUpload={() => false}
              >
                <Button
                  data-e2e-id="new-member-tri-deposit-config-modal-freespin-cover-upload-btn"
                  icon={<UploadOutlined />}
                >
                  上传
                </Button>
              </Upload>
            </Form.Item>

            <Form.Item label="礼金审核方式" name="reviewMode" rules={[{ required: true }]}>
              <Radio.Group data-e2e-id="new-member-tri-deposit-config-modal-freespin-review-mode-radio">
                <Radio value="auto">自动</Radio>
                <Radio value="manual">人工</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item label="礼金是否自动到帐" name="creditMode" rules={[{ required: true }]}>
              <Radio.Group data-e2e-id="new-member-tri-deposit-config-modal-freespin-credit-mode-radio">
                <Radio value="manual">手动领取</Radio>
                <Radio value="auto">自动到帐</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              label="谷歌验证码"
              name="googleCode"
              rules={[{ required: true, message: '请输入谷歌验证码' }]}
            >
              <Input.Password
                data-e2e-id="new-member-tri-deposit-config-modal-freespin-google-code-input"
                maxLength={6}
                placeholder="请输入谷歌验证码"
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </>
  );
}

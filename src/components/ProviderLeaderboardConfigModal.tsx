'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  TimePicker,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd';
import { DeleteOutlined, PlusOutlined, QuestionCircleOutlined, UploadOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import ActivityConfigWizardShell, {
  type WizardStepDef,
} from './activityConfigShared/ActivityConfigWizardShell';
import {
  BaseConfigStep,
  BASE_CONFIG_STEP_FIELDS,
  baseConfigInitialValues,
} from './activityConfigShared/BaseConfigStep';
import {
  GEMINI_PROVIDER_VALUE,
  LEVEL_OPTIONS,
  freeSpinProviderOptions,
} from './activityConfigShared/FreeSpinStep';
import { ALL_RESTRICTION_PATHS } from './GameRestrictionCascader';
import RichTextEditor, { isRichTextEmpty, richTextToPlainText } from './RichTextEditor';
import {
  DEFAULT_DISPATCH_TIME,
  DEFAULT_LEADERBOARD_PROVIDERS,
  DEFAULT_LEADERBOARD_RULES,
  DEFAULT_MIN_BET,
  DEFAULT_RANK_COUNT,
  DEFAULT_RANK_REWARD_ROWS,
  DEFAULT_ROLLOVER_MULTIPLIER,
  LEADERBOARD_FREE_SPIN_GAME_OPTIONS,
  LEADERBOARD_PROVIDER_CATALOG,
  PROVIDER_LEADERBOARD_ACTIVITY_ID,
  PROVIDER_LEADERBOARD_ACTIVITY_NAME,
  calcBudget,
  normalizeRankRows,
  providerLogoDataUri,
  validateProviders,
  validateRankRows,
  type FreeSpinReward,
  type LeaderboardProviderRow,
  type RankRewardRow,
  type RewardType,
} from '@/data/providerLeaderboardConfig';

const { Text } = Typography;
const e2ePrefix = 'provider-leaderboard-config-modal';
const ACTIVITY_RULES_MAX_LENGTH = 2000;
const CHANGE_WARNING = '活動進行中修改將於次一統計日 00:00:00 生效，不回溯。';

interface Props {
  open: boolean;
  onClose: () => void;
}

const formatCurrency = (value: number) =>
  `₱ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const catalogProvider = (code?: string) =>
  LEADERBOARD_PROVIDER_CATALOG.find((provider) => provider.code === code);

function HiddenFormField() {
  return null;
}

interface ProviderTableProps {
  value?: LeaderboardProviderRow[];
  onChange?: (value: LeaderboardProviderRow[]) => void;
}

function ProviderTable({ value = [], onChange }: ProviderTableProps) {
  const validationMessages = validateProviders(value);
  const usedCodes = new Set(value.map((row) => row.providerCode).filter(Boolean));

  const updateRow = (key: string, patch: Partial<LeaderboardProviderRow>) => {
    onChange?.(value.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const columns: ColumnsType<LeaderboardProviderRow> = [
    {
      title: 'Logo',
      key: 'logo',
      width: 210,
      render: (_, row) => (
        <Space direction="vertical" size={4}>
          <Image
            src={row.logoUrl}
            alt={`${catalogProvider(row.providerCode)?.name ?? '廠商'} Logo`}
            width={120}
            height={40}
            preview={false}
            style={{ objectFit: 'contain', borderRadius: 4 }}
          />
          <Upload
            data-e2e-id={`${e2ePrefix}-provider-logo-upload-${row.key}`}
            accept=".png,.webp"
            showUploadList={false}
            beforeUpload={(file) => {
              if (file.size > 1024 * 1024) {
                message.error('Logo 檔案不可超過 1MB');
                return false;
              }
              updateRow(row.key, {
                logoUrl: URL.createObjectURL(file),
                logoFileName: file.name,
              });
              return false;
            }}
          >
            <Button
              data-e2e-id={`${e2ePrefix}-provider-logo-btn-${row.key}`}
              size="small"
              icon={<UploadOutlined />}
            >
              上傳 / 替換
            </Button>
          </Upload>
          {row.logoFileName ? (
            <Text type="secondary" style={{ fontSize: 11, maxWidth: 190 }} ellipsis={{ tooltip: row.logoFileName }}>
              {row.logoFileName}
            </Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: '廠商',
      dataIndex: 'providerCode',
      width: 175,
      render: (providerCode: string, row) => (
        <Select
          data-e2e-id={`${e2ePrefix}-provider-select-${row.key}`}
          value={providerCode || undefined}
          placeholder="請選擇廠商"
          style={{ width: '100%' }}
          options={LEADERBOARD_PROVIDER_CATALOG.map((provider) => ({
            value: provider.code,
            label: provider.name,
            disabled: provider.code !== providerCode && usedCodes.has(provider.code),
          }))}
          onChange={(nextCode) => {
            const provider = catalogProvider(nextCode);
            updateRow(row.key, {
              providerCode: nextCode,
              excludedGames: [],
              logoUrl: providerLogoDataUri(provider?.name ?? nextCode),
              logoFileName: undefined,
            });
          }}
        />
      ),
    },
    {
      title: '遊戲類型',
      key: 'gameTypes',
      width: 125,
      render: (_, row) => catalogProvider(row.providerCode)?.gameTypes.join('、') ?? '—',
    },
    {
      title: '排除遊戲',
      dataIndex: 'excludedGames',
      width: 250,
      render: (excludedGames: string[], row) => {
        const provider = catalogProvider(row.providerCode);
        const options = provider?.gameTypes.map((gameType) => ({
          label: gameType,
          options: provider.games
            .filter((game) => game.gameType === gameType)
            .map((game) => ({ value: game.code, label: game.name })),
        }));
        return (
          <Select
            data-e2e-id={`${e2ePrefix}-excluded-games-select-${row.key}`}
            mode="multiple"
            value={excludedGames}
            disabled={!row.providerCode}
            placeholder="選擇不計入的遊戲"
            maxTagCount="responsive"
            options={options}
            style={{ width: '100%' }}
            onChange={(nextValue) => updateRow(row.key, { excludedGames: nextValue })}
          />
        );
      },
    },
    {
      title: '計入遊戲數',
      key: 'includedGames',
      width: 110,
      render: (_, row) => {
        const total = catalogProvider(row.providerCode)?.games.length ?? 0;
        return `${Math.max(0, total - row.excludedGames.length)} / ${total}`;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 70,
      render: (_, row) => (
        <Button
          data-e2e-id={`${e2ePrefix}-provider-delete-btn-${row.key}`}
          type="link"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => onChange?.(value.filter((item) => item.key !== row.key))}
        >
          刪除
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Table
        data-e2e-id={`${e2ePrefix}-provider-table`}
        rowKey="key"
        columns={columns}
        dataSource={value}
        pagination={false}
        size="small"
        scroll={{ x: 940 }}
      />
      <Button
        data-e2e-id={`${e2ePrefix}-provider-add-btn`}
        icon={<PlusOutlined />}
        style={{ marginTop: 12 }}
        disabled={usedCodes.size >= LEADERBOARD_PROVIDER_CATALOG.length}
        onClick={() =>
          onChange?.([
            ...value,
            {
              key: `provider-${Date.now()}`,
              providerCode: '',
              logoUrl: providerLogoDataUri('廠商'),
              excludedGames: [],
            },
          ])
        }
      >
        新增廠商
      </Button>
      {validationMessages.length > 0 ? (
        <ul style={{ color: '#ff4d4f', margin: '8px 0 0', paddingLeft: 20 }}>
          {validationMessages.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

function ProviderConfigStep({ form }: { form: FormInstance }) {
  const providers = (Form.useWatch('providers', form) ?? []) as LeaderboardProviderRow[];

  const updateProviders = (nextProviders: LeaderboardProviderRow[]) => {
    const shouldRevalidate = form.getFieldError('providers').length > 0;
    form.setFieldValue('providers', nextProviders);
    if (shouldRevalidate) {
      void form.validateFields(['providers']).catch(() => undefined);
    }
  };

  return (
    <Card title="參與廠商" size="small">
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message={
          <span>
            每個廠商各自獨立排名；注單只計入所屬廠商的榜。廠商涵蓋其所有遊戲類型（Evolution 旗下子品牌視為同一廠商{' '}
            <Tooltip title="NetEnt、Red Tiger、BTG 等 Evolution 旗下子品牌均合併計入 Evolution 榜。">
              <QuestionCircleOutlined data-e2e-id={`${e2ePrefix}-evolution-tooltip`} />
            </Tooltip>
            ）；活動期間新上架遊戲自動納入；排除遊戲的投注不計入。
          </span>
        }
      />
      <Alert type="warning" showIcon message={CHANGE_WARNING} style={{ marginBottom: 12 }} />
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        Logo 建議 360×120，png / webp，≤ 1MB；未上傳沿用廠商管理的 Logo
      </Text>
      <Form.Item
        name="providers"
        hidden
        rules={[
          {
            validator: (_, rows: LeaderboardProviderRow[]) => {
              const errors = validateProviders(rows);
              return errors.length
                ? Promise.reject(new Error('請修正上方列出的問題後再繼續'))
                : Promise.resolve();
            },
          },
        ]}
      >
        <HiddenFormField />
      </Form.Item>
      <ProviderTable value={providers} onChange={updateProviders} />
    </Card>
  );
}

interface FreeSpinRewardModalProps {
  open: boolean;
  value?: FreeSpinReward;
  onCancel: () => void;
  onSave: (value: FreeSpinReward) => void;
}

function FreeSpinRewardModal({ open, value, onCancel, onSave }: FreeSpinRewardModalProps) {
  const [form] = Form.useForm<FreeSpinReward>();
  const level = Form.useWatch('dispatchLevel', form);
  const provider = Form.useWatch('provider', form);
  const isGemini = provider === GEMINI_PROVIDER_VALUE;
  const filteredGames = useMemo(
    () => (provider ? LEADERBOARD_FREE_SPIN_GAME_OPTIONS.filter((game) => game.provider === provider) : []),
    [provider],
  );

  return (
    <Modal
      data-e2e-id={`${e2ePrefix}-freespin-modal`}
      title="Free Spin 獎勵配置"
      open={open}
      destroyOnClose
      onCancel={onCancel}
      afterOpenChange={(isOpen) => {
        if (isOpen && value) form.setFieldsValue(value);
      }}
      onOk={() => form.validateFields().then(onSave)}
      okButtonProps={{ 'data-e2e-id': `${e2ePrefix}-freespin-modal-ok-btn` }}
      cancelButtonProps={{ 'data-e2e-id': `${e2ePrefix}-freespin-modal-cancel-btn` }}
    >
      <Form form={form} layout="vertical" initialValues={value} preserve={false}>
        <Form.Item name="dispatchLevel" label="派發層級" rules={[{ required: true }]}>
          <Radio.Group
            data-e2e-id={`${e2ePrefix}-freespin-level-radio`}
            options={LEVEL_OPTIONS}
            onChange={(event) => {
              const nextLevel = event.target.value as FreeSpinReward['dispatchLevel'];
              if (nextLevel === 'OPEN') form.setFieldsValue({ provider: undefined, gameId: undefined, activityCode: undefined });
              if (nextLevel === 'PROVIDER') form.setFieldValue('gameId', undefined);
            }}
          />
        </Form.Item>
        <Form.Item
          name="provider"
          label="廠商"
          rules={[{ required: level !== 'OPEN', message: '請選擇廠商' }]}
          extra={level === 'OPEN' ? '玩家自選廠商與遊戲' : level === 'PROVIDER' ? '玩家於該廠商內自選遊戲' : undefined}
        >
          <Select
            data-e2e-id={`${e2ePrefix}-freespin-provider-select`}
            allowClear
            disabled={level === 'OPEN'}
            placeholder="請選擇廠商"
            options={freeSpinProviderOptions}
            onChange={(nextProvider) => {
              form.setFieldValue('gameId', undefined);
              if (nextProvider !== GEMINI_PROVIDER_VALUE) form.setFieldValue('activityCode', undefined);
            }}
          />
        </Form.Item>
        <Form.Item
          name="gameId"
          label="贈送遊戲"
          rules={[{ required: level === 'GAME', message: '請選擇贈送遊戲' }]}
        >
          <Select
            data-e2e-id={`${e2ePrefix}-freespin-game-select`}
            allowClear
            disabled={level !== 'GAME' || !provider}
            placeholder={provider ? '請選擇遊戲' : '請先選擇廠商'}
            options={filteredGames}
          />
        </Form.Item>
        {isGemini ? (
          <Form.Item
            name="activityCode"
            label="活動代碼"
            rules={[{ required: true, message: '請輸入活動代碼' }]}
            extra={<span style={{ color: '#d46b08' }}>Gemini 除次數外，其他參數以廠商後台為準</span>}
          >
            <Input data-e2e-id={`${e2ePrefix}-freespin-activity-code-input`} />
          </Form.Item>
        ) : null}
        <Row gutter={12}>
          <Col span={8}>
            <Form.Item name="spins" label="免費旋轉次數" rules={[{ required: true }]}>
              <InputNumber data-e2e-id={`${e2ePrefix}-freespin-spins-input`} min={1} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="betAmount" label="單次投注額" rules={[{ required: true }]}>
              <InputNumber data-e2e-id={`${e2ePrefix}-freespin-bet-input`} min={0.01} precision={2} addonBefore="₱" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="validityDays" label="有效期（天）" rules={[{ required: true }]}>
              <InputNumber data-e2e-id={`${e2ePrefix}-freespin-validity-input`} min={1} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="minWithdraw" label="最低提款">
              <InputNumber data-e2e-id={`${e2ePrefix}-freespin-min-withdraw-input`} min={0} precision={2} addonBefore="₱" placeholder="不限" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="maxWithdraw" label="最高提款">
              <InputNumber data-e2e-id={`${e2ePrefix}-freespin-max-withdraw-input`} min={0} precision={2} addonBefore="₱" placeholder="不限" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Alert type="info" showIcon message="流水倍數沿用第 4 步全活動設定（贏得金額 × 倍數）" />
      </Form>
    </Modal>
  );
}

interface RankRewardTableProps {
  value?: RankRewardRow[];
  onChange?: (value: RankRewardRow[]) => void;
  rankCount: number;
  providerCount: number;
  activityDays: number;
}

function RankRewardTable({ value = [], onChange, rankCount, providerCount, activityDays }: RankRewardTableProps) {
  const [editingKey, setEditingKey] = useState<string>();
  const editingRow = value.find((row) => row.key === editingKey);
  const validationMessages = validateRankRows(value, rankCount);
  const budget = calcBudget(value, providerCount);

  const emit = (nextRows: RankRewardRow[]) => onChange?.(normalizeRankRows(nextRows));
  const updateRow = (key: string, patch: Partial<RankRewardRow>) =>
    emit(value.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const fsSummary = (reward?: FreeSpinReward) => {
    if (!reward) return '未配置';
    const providerLabel = reward.provider ?? '玩家自選';
    const gameLabel = LEADERBOARD_FREE_SPIN_GAME_OPTIONS.find((game) => game.value === reward.gameId)?.label;
    return [reward.dispatchLevel, providerLabel, gameLabel, `${reward.spins} 次`, `₱${reward.betAmount.toFixed(2)}/次`, `${reward.validityDays} 天`]
      .filter(Boolean)
      .join(' · ');
  };

  const columns: ColumnsType<RankRewardRow> = [
    { title: '名次', width: 80, render: (_, row) => row.start === row.end ? row.start : `${row.start}–${row.end}` },
    {
      title: '名次迄', dataIndex: 'end', width: 115,
      render: (end: number, row) => (
        <InputNumber
          data-e2e-id={`${e2ePrefix}-rank-end-input-${row.key}`}
          value={end}
          min={row.start}
          precision={0}
          style={{ width: '100%' }}
          onChange={(next) => updateRow(row.key, { end: Number(next ?? row.start) })}
        />
      ),
    },
    { title: '人數', width: 75, render: (_, row) => Math.max(0, row.end - row.start + 1) },
    {
      title: '獎勵類型', dataIndex: 'rewardType', width: 135,
      render: (rewardType: RewardType, row) => (
        <Select
          data-e2e-id={`${e2ePrefix}-reward-type-select-${row.key}`}
          value={rewardType}
          style={{ width: '100%' }}
          options={[
            { value: 'cash', label: '現金' },
            { value: 'freeSpin', label: 'Free Spin' },
            { value: 'mallCoin', label: '商城幣' },
          ]}
          onChange={(nextType: RewardType) => {
            if (nextType === 'cash') updateRow(row.key, { rewardType: nextType, amount: 1000, freeSpin: undefined });
            if (nextType === 'mallCoin') updateRow(row.key, { rewardType: nextType, amount: 500, freeSpin: undefined });
            if (nextType === 'freeSpin') {
              updateRow(row.key, {
                rewardType: nextType,
                amount: undefined,
                freeSpin: { ...(DEFAULT_RANK_REWARD_ROWS.find((item) => item.rewardType === 'freeSpin')?.freeSpin as FreeSpinReward) },
              });
            }
          }}
        />
      ),
    },
    {
      title: '獎勵內容', width: 310,
      render: (_, row) => {
        if (row.rewardType === 'cash') return (
          <Space size={6} style={{ width: '100%' }}>
            <InputNumber data-e2e-id={`${e2ePrefix}-cash-amount-input-${row.key}`} value={row.amount} min={0.01} precision={2} addonBefore="₱" style={{ width: 190 }} onChange={(amount) => updateRow(row.key, { amount: Number(amount ?? 0) })} />
            <Text type="secondary">每人</Text>
          </Space>
        );
        if (row.rewardType === 'mallCoin') return (
          <Space size={6} style={{ width: '100%' }}>
            <InputNumber data-e2e-id={`${e2ePrefix}-coin-amount-input-${row.key}`} value={row.amount} min={1} precision={0} addonAfter="幣" style={{ width: 190 }} onChange={(amount) => updateRow(row.key, { amount: Number(amount ?? 0) })} />
            <Text type="secondary">每人</Text>
          </Space>
        );
        return (
          <Space size={4} wrap>
            <Text>{fsSummary(row.freeSpin)}</Text>
            <Button data-e2e-id={`${e2ePrefix}-freespin-config-btn-${row.key}`} type="link" size="small" onClick={() => setEditingKey(row.key)}>配置</Button>
          </Space>
        );
      },
    },
    {
      title: '單列預算', width: 190,
      render: (_, row) => {
        const count = Math.max(0, row.end - row.start + 1);
        if (row.rewardType === 'cash') return formatCurrency(count * Number(row.amount ?? 0));
        if (row.rewardType === 'mallCoin') return `${(count * Number(row.amount ?? 0)).toLocaleString()} 幣`;
        const spins = count * Number(row.freeSpin?.spins ?? 0);
        return `${spins.toLocaleString()} 次（面額 ${formatCurrency(spins * Number(row.freeSpin?.betAmount ?? 0))}）`;
      },
    },
    {
      title: '操作', width: 75,
      render: (_, row) => (
        <Button data-e2e-id={`${e2ePrefix}-rank-delete-btn-${row.key}`} type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => emit(value.filter((item) => item.key !== row.key))}>刪除</Button>
      ),
    },
  ];

  const lastEnd = value[value.length - 1]?.end ?? 0;
  return (
    <div>
      <Table data-e2e-id={`${e2ePrefix}-rank-table`} rowKey="key" columns={columns} dataSource={value} pagination={false} size="small" scroll={{ x: 1020 }} />
      <Button
        data-e2e-id={`${e2ePrefix}-rank-add-btn`}
        icon={<PlusOutlined />}
        disabled={lastEnd >= rankCount}
        style={{ marginTop: 12 }}
        onClick={() => emit([...value, { key: `rank-${Date.now()}`, start: lastEnd + 1, end: lastEnd + 1, rewardType: 'cash', amount: 1000 }])}
      >
        增加
      </Button>
      {validationMessages.length > 0 ? (
        <ul style={{ color: '#ff4d4f', margin: '8px 0 0', paddingLeft: 20 }}>
          {validationMessages.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : null}
      <Card type="inner" size="small" style={{ marginTop: 16 }}>
        <Text strong>預算估算（預設獎勵金額為示意）</Text>
        <Row gutter={[12, 16]} style={{ marginTop: 12 }}>
          <Col span={6}><Statistic title="每個廠商榜每日最高現金" value={budget.perBoard.cash} prefix="₱" precision={2} /></Col>
          <Col span={6}><Statistic title="每個廠商榜 Free Spin" value={budget.perBoard.freeSpinSpins} suffix={`次（面額 ${formatCurrency(budget.perBoard.freeSpinFaceValue)}）`} /></Col>
          <Col span={6}><Statistic title="每個廠商榜商城幣" value={budget.perBoard.mallCoin} suffix="幣" /></Col>
          <Col span={6}><Statistic title={`全部廠商每日最高（×${providerCount} 家廠商）`} value={budget.allProviders.cash} prefix="現金 ₱" precision={2} /></Col>
          <Col span={8}><Statistic title="全部廠商 Free Spin" value={budget.allProviders.freeSpinSpins} suffix={`次（面額 ${formatCurrency(budget.allProviders.freeSpinFaceValue)}）`} /></Col>
          <Col span={8}><Statistic title="全部廠商商城幣" value={budget.allProviders.mallCoin} suffix="幣" /></Col>
          <Col span={8}><Text type="secondary">活動期間最高 = 每日最高 × 活動天數（{activityDays} 天）</Text></Col>
        </Row>
      </Card>
      <FreeSpinRewardModal
        open={Boolean(editingKey)}
        value={editingRow?.freeSpin}
        onCancel={() => setEditingKey(undefined)}
        onSave={(freeSpin) => {
          if (editingKey) updateRow(editingKey, { freeSpin });
          setEditingKey(undefined);
        }}
      />
    </div>
  );
}

function RankRewardStep({ form }: { form: FormInstance }) {
  const rankCount = Form.useWatch('rankCount', form) ?? DEFAULT_RANK_COUNT;
  const providers = (Form.useWatch('providers', form) ?? []) as LeaderboardProviderRow[];
  const rankRows = (Form.useWatch('rankRows', form) ?? []) as RankRewardRow[];
  const timeRange = Form.useWatch('timeRange', form) as [Dayjs, Dayjs] | undefined;
  const activityDays = timeRange?.length === 2 ? Math.max(1, timeRange[1].startOf('day').diff(timeRange[0].startOf('day'), 'day') + 1) : 0;

  const updateRankRows = (nextRows: RankRewardRow[]) => {
    const shouldRevalidate = form.getFieldError('rankRows').length > 0;
    form.setFieldValue('rankRows', nextRows);
    if (shouldRevalidate) {
      void form.validateFields(['rankRows']).catch(() => undefined);
    }
  };

  return (
    <Card title="排名獎勵表（所有廠商共用）" size="small">
      <Alert type="info" showIcon style={{ marginBottom: 12 }} message="所有廠商共用同一張獎勵表，各廠商榜各自依此發獎；同一會員可同時在多個廠商榜得獎。名次區間金額為「每人」獎勵，不是區間總額。" />
      <Alert type="warning" showIcon message={CHANGE_WARNING} style={{ marginBottom: 16 }} />
      <Form.Item name="rankCount" label="排名人數" rules={[{ required: true, message: '請輸入排名人數' }]}>
        <InputNumber
          data-e2e-id={`${e2ePrefix}-rank-count-input`}
          min={1}
          precision={0}
          style={{ width: 220 }}
          onChange={() => { void form.validateFields(['rankRows']).catch(() => undefined); }}
        />
      </Form.Item>
      <Form.Item
        name="rankRows"
        hidden
        rules={[
          {
            validator: (_, rows: RankRewardRow[]) => {
              const errors = validateRankRows(rows, Number(form.getFieldValue('rankCount')));
              return errors.length
                ? Promise.reject(new Error('請修正上方列出的問題後再繼續'))
                : Promise.resolve();
            },
          },
        ]}
      >
        <HiddenFormField />
      </Form.Item>
      <RankRewardTable
        value={rankRows}
        onChange={updateRankRows}
        rankCount={Number(rankCount)}
        providerCount={providers.length}
        activityDays={activityDays}
      />
    </Card>
  );
}

function DispatchRulesStep() {
  return (
    <Card title="派發設定與規則" size="small">
      <Alert type="warning" showIcon message="活動進行中修改將於次一統計日 00:00:00 生效，不回溯；當日仍依原配置計算與派發。" style={{ marginBottom: 16 }} />
      <Form.Item name="minBet" label="最低投注（上榜門檻）" rules={[{ required: true, message: '請輸入最低投注' }]} extra="當日該廠商累計有效投注 ≥ 此金額才進入該廠商排名；未達標不排名，名額不遞補">
        <InputNumber data-e2e-id={`${e2ePrefix}-min-bet-input`} min={0} precision={2} addonBefore="₱" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="rolloverMultiplier" label="流水倍數" rules={[{ required: true, message: '請輸入流水倍數' }]} extra="現金：獎金 × 倍數；Free Spin：贏得金額 × 倍數；商城幣不設流水；0 = 無流水要求">
        <InputNumber data-e2e-id={`${e2ePrefix}-rollover-input`} min={0} step={0.5} addonAfter="倍" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="settleCycle" label="統計週期" rules={[{ required: true }]}>
        <Radio.Group data-e2e-id={`${e2ePrefix}-settle-cycle-radio`} disabled options={[{ value: 'daily', label: '每日' }]} />
      </Form.Item>
      <Form.Item name="dispatchTime" label="派發時間（隔日）" rules={[{ required: true, message: '請選擇派發時間' }]} extra="隔日自動派發，不需審核">
        <TimePicker data-e2e-id={`${e2ePrefix}-dispatch-time-picker`} format="HH:mm:ss" style={{ width: '100%' }} />
      </Form.Item>
      <Descriptions title="規則說明" column={1} bordered size="small" style={{ marginBottom: 20 }}>
        <Descriptions.Item label="排名依據">每個廠商各自獨立每日榜，依會員於該廠商遊戲的累計有效投注排名；一筆注單只計入其遊戲所屬廠商。廠商包含旗下所有遊戲類型，新上架遊戲自動納入；排除遊戲不計入。</Descriptions.Item>
        <Descriptions.Item label="計分歸日">每日 00:00:00–23:59:59（GMT+8），依注單結算時間歸屬；日終後才結算的注單計入其實際結算日。</Descriptions.Item>
        <Descriptions.Item label="上榜門檻">當日該廠商有效投注必須 ≥ 門檻；未達標者不排名。合格人數少於獎勵名額時，剩餘名額不派發、不累積、不遞補。</Descriptions.Item>
        <Descriptions.Item label="同分排序">有效投注相同時，較早達到最終分數者（使其達標的該筆注單之結算時間較早）排名較前，不並列。</Descriptions.Item>
        <Descriptions.Item label="獎勵表">所有廠商榜共用同一張獎勵表；每列可獨立選擇現金、Free Spin 或商城幣，區間金額為每人獎勵。</Descriptions.Item>
        <Descriptions.Item label="多榜得獎">同一會員可於同一天在多個廠商榜得獎。</Descriptions.Item>
        <Descriptions.Item label="派發">隔日於設定時間自動派發，不需人工審核。現金流水 = 獎勵 × 倍數；Free Spin 流水 = 贏得金額 × 倍數；商城幣無流水；0 為無流水要求。流水場館範圍沿用第 1 步限制。</Descriptions.Item>
        <Descriptions.Item label="修改生效">活動進行中可修改，儲存後於次一統計日 00:00:00 生效且不回溯；當日仍依原配置計算與派發。</Descriptions.Item>
        <Descriptions.Item label="不處理事項">① 日終後結算的注單依實際結算日計入；② 派獎後的取消／重新結算不追回；③ 不設帳號排除，所有會員均可參加；④ 不排除對沖投注。</Descriptions.Item>
      </Descriptions>
      <Form.Item
        name="activityRules"
        label="活動規則"
        required
        rules={[{
          validator: (_, value) => {
            if (isRichTextEmpty(value)) return Promise.reject(new Error('請輸入活動規則'));
            if (richTextToPlainText(value).length > ACTIVITY_RULES_MAX_LENGTH) return Promise.reject(new Error(`活動規則不可超過 ${ACTIVITY_RULES_MAX_LENGTH} 字`));
            return Promise.resolve();
          },
        }]}
      >
        <RichTextEditor data-e2e-id={`${e2ePrefix}-activity-rules-editor`} minHeight={220} maxLength={ACTIVITY_RULES_MAX_LENGTH} />
      </Form.Item>
    </Card>
  );
}

export default function ProviderLeaderboardConfigModal({ open, onClose }: Props) {
  const hiddenBaseFields = ['depositChannels'];
  const effectiveDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const initialValues = {
    ...baseConfigInitialValues(
      PROVIDER_LEADERBOARD_ACTIVITY_ID,
      PROVIDER_LEADERBOARD_ACTIVITY_NAME,
      'leaderboard',
      '2026-09-12 00:00:00',
      '2026-12-31 23:59:59',
    ),
    wagerVenueRestriction: ALL_RESTRICTION_PATHS,
    providers: DEFAULT_LEADERBOARD_PROVIDERS.map((row) => ({ ...row, excludedGames: [...row.excludedGames] })),
    rankCount: DEFAULT_RANK_COUNT,
    rankRows: DEFAULT_RANK_REWARD_ROWS.map((row) => ({ ...row, freeSpin: row.freeSpin ? { ...row.freeSpin } : undefined })),
    minBet: DEFAULT_MIN_BET,
    rolloverMultiplier: DEFAULT_ROLLOVER_MULTIPLIER,
    settleCycle: 'daily',
    dispatchTime: dayjs(`2026-01-01 ${DEFAULT_DISPATCH_TIME}`),
    activityRules: DEFAULT_LEADERBOARD_RULES,
  };

  const steps: WizardStepDef[] = [
    {
      title: '基础配置',
      validateFields: BASE_CONFIG_STEP_FIELDS.filter((field) => !hiddenBaseFields.includes(field)),
      render: () => (
        <>
          <BaseConfigStep e2ePrefix={e2ePrefix} activityId={PROVIDER_LEADERBOARD_ACTIVITY_ID} activityName={PROVIDER_LEADERBOARD_ACTIVITY_NAME} activityTypeDefault="leaderboard" hideFields={hiddenBaseFields} />
          <Alert type="info" showIcon message="統計週期固定為「每日」（00:00:00–23:59:59 GMT+8），注單依「結算時間」歸屬統計日；隔日於派發時間自動派獎。" />
        </>
      ),
    },
    { title: '廠商配置', validateFields: ['providers'], render: (form) => <ProviderConfigStep form={form} /> },
    { title: '排名與獎勵', validateFields: ['rankCount', 'rankRows'], render: (form) => <RankRewardStep form={form} /> },
    { title: '派發設定與規則', validateFields: ['minBet', 'rolloverMultiplier', 'settleCycle', 'dispatchTime', 'activityRules'], render: () => <DispatchRulesStep /> },
  ];

  return (
    <ActivityConfigWizardShell
      open={open}
      onClose={onClose}
      title="廠商排行榜 - 编辑配置"
      steps={steps}
      initialValues={initialValues}
      saveMessage={`廠商排行榜配置已保存，將於 ${effectiveDate} 00:00:00（次一統計日）生效，不回溯`}
      e2ePrefix={e2ePrefix}
    />
  );
}

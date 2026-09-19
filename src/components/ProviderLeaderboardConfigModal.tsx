'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Tag,
  Table,
  Tooltip,
  TreeSelect,
  Typography,
} from 'antd';
import { DeleteOutlined, FolderOutlined, PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
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
  DEFAULT_LEADERBOARD_PROVIDERS,
  DEFAULT_LEADERBOARD_RULES,
  DEFAULT_POPUP_TEXT,
  DEFAULT_RANK_COUNT,
  DEFAULT_RANK_REWARD_ROWS,
  DEFAULT_ROLLOVER_MULTIPLIER,
  LEADERBOARD_FREE_SPIN_GAME_OPTIONS,
  LEADERBOARD_PROVIDER_CATALOG,
  PROVIDER_LEADERBOARD_ACTIVITY_ID,
  PROVIDER_LEADERBOARD_ACTIVITY_NAME,
  normalizeRankRows,
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
      title: '廠商',
      dataIndex: 'providerCode',
      width: 180,
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
            updateRow(row.key, {
              providerCode: nextCode,
              excludedGameTypes: [],
              excludedGames: [],
            });
          }}
        />
      ),
    },
    {
      title: (
        <Space size={4}>
          上榜門檻
          <Tooltip title="當日該廠商累計有效投注 ≥ 門檻才進入該廠商排名；未達標不排名，名額不遞補；0 = 不設門檻">
            <QuestionCircleOutlined />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'minBet',
      width: 190,
      render: (minBet: number, row) => (
        <InputNumber
          data-e2e-id={`${e2ePrefix}-provider-min-bet-input-${row.key}`}
          value={minBet}
          min={0}
          precision={2}
          addonBefore="₱"
          style={{ width: '100%' }}
          onChange={(nextValue) => updateRow(row.key, { minBet: nextValue as number })}
        />
      ),
    },
    {
      title: (
        <Space size={4}>
          排除遊戲
          <Tooltip title="勾選「遊戲類型」= 排除該廠商此類型全部遊戲（含之後新上架的該類型遊戲）；勾選「遊戲」= 只排除該款遊戲">
            <QuestionCircleOutlined />
          </Tooltip>
        </Space>
      ),
      key: 'exclusions',
      width: 420,
      render: (_, row) => {
        const provider = catalogProvider(row.providerCode);
        const selectedTypes = row.excludedGameTypes ?? [];
        const selectedValues = [
          ...selectedTypes.map((gameType) => ({
            value: `type:${gameType}`,
            label: `${gameType}・整個類型`,
          })),
          ...row.excludedGames.map((gameCode) => ({
            value: `game:${gameCode}`,
            label: provider?.games.find((game) => game.code === gameCode)?.name ?? gameCode,
          })),
        ];
        const treeData = provider?.gameTypes.map((gameType) => ({
          value: `type:${gameType}`,
          searchText: gameType,
          title: (
            <Space size={6}>
              <FolderOutlined />
              <Text strong>{gameType}</Text>
            </Space>
          ),
          children: provider.games
            .filter((game) => game.gameType === gameType)
            .map((game) => ({
              value: `game:${game.code}`,
              searchText: game.name,
              title: game.name,
              disabled: selectedTypes.includes(gameType),
            })),
        }));
        return (
          <TreeSelect
            data-e2e-id={`${e2ePrefix}-excluded-games-select-${row.key}`}
            treeCheckable
            treeCheckStrictly
            showSearch
            treeNodeFilterProp="searchText"
            value={selectedValues}
            disabled={!row.providerCode}
            placeholder="選擇要排除的遊戲類型或遊戲"
            maxTagCount="responsive"
            treeData={treeData}
            style={{ width: '100%' }}
            tagRender={({ value: selectedValue, closable, onClose }) => {
              const selectedValueText = String(selectedValue);
              const isType = selectedValueText.startsWith('type:');
              const tagText = isType
                ? `${selectedValueText.slice('type:'.length)}・整個類型`
                : provider?.games.find(
                    (game) => game.code === selectedValueText.slice('game:'.length),
                  )?.name ?? selectedValueText.slice('game:'.length);
              return (
                <Tag
                  color={isType ? 'processing' : undefined}
                  closable={closable}
                  onClose={onClose}
                  icon={isType ? <FolderOutlined /> : undefined}
                  style={{ marginInlineEnd: 4 }}
                >
                  {tagText}
                </Tag>
              );
            }}
            onChange={(nextValue) => {
              const values = (nextValue as Array<{ value: string }>).map((item) => item.value);
              const excludedGameTypes = values
                .filter((item) => item.startsWith('type:'))
                .map((item) => item.slice('type:'.length)) as LeaderboardProviderRow['excludedGameTypes'];
              const excludedGames = values
                .filter((item) => item.startsWith('game:'))
                .map((item) => item.slice('game:'.length))
                .filter((gameCode) => {
                  const gameType = provider?.games.find((game) => game.code === gameCode)?.gameType;
                  return !gameType || !excludedGameTypes.includes(gameType);
                });
              updateRow(row.key, { excludedGameTypes, excludedGames });
            }}
          />
        );
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
        scroll={{ x: 860 }}
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
              minBet: 1000,
              excludedGameTypes: [],
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
            ）；活動期間新上架遊戲自動納入（排除類型下的新遊戲除外）；排除遊戲類型／遊戲的投注不計入。
          </span>
        }
      />
      <Alert type="warning" showIcon message={CHANGE_WARNING} style={{ marginBottom: 12 }} />
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
        if (isOpen && value) form.setFieldsValue({ ...value, dispatchLevel: 'GAME' });
      }}
      onOk={() => form.validateFields().then(onSave)}
      okButtonProps={{ 'data-e2e-id': `${e2ePrefix}-freespin-modal-ok-btn` }}
      cancelButtonProps={{ 'data-e2e-id': `${e2ePrefix}-freespin-modal-cancel-btn` }}
    >
      <Form form={form} layout="vertical" initialValues={{ ...value, dispatchLevel: 'GAME' }} preserve={false}>
        <Form.Item
          name="dispatchLevel"
          label="派發層級"
          rules={[{ required: true }]}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>目前僅開放 GAME（指定廠商＋指定遊戲）</Text>}
        >
          <Radio.Group
            data-e2e-id={`${e2ePrefix}-freespin-level-radio`}
            options={LEVEL_OPTIONS.map((option) => ({
              ...option,
              disabled: option.value === 'OPEN' || option.value === 'PROVIDER',
            }))}
          />
        </Form.Item>
        <Form.Item
          name="provider"
          label="廠商"
          rules={[{ required: true, message: '請選擇廠商' }]}
        >
          <Select
            data-e2e-id={`${e2ePrefix}-freespin-provider-select`}
            allowClear
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
          rules={[{ required: true, message: '請選擇贈送遊戲' }]}
        >
          <Select
            data-e2e-id={`${e2ePrefix}-freespin-game-select`}
            allowClear
            disabled={!provider}
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
}

function RankRewardTable({ value = [], onChange, rankCount }: RankRewardTableProps) {
  const [editingKey, setEditingKey] = useState<string>();
  const editingRow = value.find((row) => row.key === editingKey);
  const validationMessages = validateRankRows(value, rankCount);

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
  const rankRows = (Form.useWatch('rankRows', form) ?? []) as RankRewardRow[];

  const updateRankRows = (nextRows: RankRewardRow[]) => {
    const shouldRevalidate = form.getFieldError('rankRows').length > 0;
    form.setFieldValue('rankRows', nextRows);
    if (shouldRevalidate) {
      void form.validateFields(['rankRows']).catch(() => undefined);
    }
  };

  return (
    <Card title="排名獎勵表（所有廠商共用）" size="small">
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
      />
    </Card>
  );
}

function DispatchRulesStep() {
  return (
    <Card title="派發設定與文案" size="small">
      <Alert type="warning" showIcon message="活動進行中修改將於次一統計日 00:00:00 生效，不回溯；當日仍依原配置計算與派發。" style={{ marginBottom: 16 }} />
      <Form.Item name="rolloverMultiplier" label="流水倍數" rules={[{ required: true, message: '請輸入流水倍數' }]} extra="現金：獎金 × 倍數；Free Spin：贏得金額 × 倍數；商城幣不設流水；0 = 無流水要求">
        <InputNumber data-e2e-id={`${e2ePrefix}-rollover-input`} min={0} step={0.5} addonAfter="倍" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item label="派發時間" extra="每日固定時間自動派發前一統計日獎勵，不需審核">
        <Text data-e2e-id={`${e2ePrefix}-dispatch-time-text`}>隔日 04:30:00（GMT+8，固定）</Text>
      </Form.Item>
      <Form.Item
        name="popupText"
        label="彈窗文案"
        tooltip="派獎後通知得獎會員的彈窗標題文案"
        rules={[{ required: true, message: '請輸入彈窗文案' }]}
      >
        <Input data-e2e-id={`${e2ePrefix}-popup-text-input`} />
      </Form.Item>
      <Form.Item
        name="activityRules"
        label="活動規則"
        tooltip="前台 Standard T&C 與彈窗下方顯示的活動規則"
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
    providers: DEFAULT_LEADERBOARD_PROVIDERS.map((row) => ({
      ...row,
      excludedGameTypes: [...row.excludedGameTypes],
      excludedGames: [...row.excludedGames],
    })),
    rankCount: DEFAULT_RANK_COUNT,
    rankRows: DEFAULT_RANK_REWARD_ROWS.map((row) => ({ ...row, freeSpin: row.freeSpin ? { ...row.freeSpin } : undefined })),
    rolloverMultiplier: DEFAULT_ROLLOVER_MULTIPLIER,
    popupText: DEFAULT_POPUP_TEXT,
    activityRules: DEFAULT_LEADERBOARD_RULES,
  };

  const steps: WizardStepDef[] = [
    {
      title: '基础配置',
      validateFields: BASE_CONFIG_STEP_FIELDS.filter((field) => !hiddenBaseFields.includes(field)),
      render: () => <BaseConfigStep e2ePrefix={e2ePrefix} activityId={PROVIDER_LEADERBOARD_ACTIVITY_ID} activityName={PROVIDER_LEADERBOARD_ACTIVITY_NAME} activityTypeDefault="leaderboard" hideFields={hiddenBaseFields} />,
    },
    { title: '廠商配置', validateFields: ['providers'], render: (form) => <ProviderConfigStep form={form} /> },
    { title: '排名與獎勵', validateFields: ['rankCount', 'rankRows'], render: (form) => <RankRewardStep form={form} /> },
    { title: '派發設定與文案', validateFields: ['rolloverMultiplier', 'popupText', 'activityRules'], render: () => <DispatchRulesStep /> },
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

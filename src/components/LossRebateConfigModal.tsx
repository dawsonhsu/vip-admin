'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  Cascader,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import { DeleteOutlined, PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { GameType } from '@/data/memberStatsData';
import ActivityConfigWizardShell, {
  type WizardStepDef,
} from './activityConfigShared/ActivityConfigWizardShell';
import {
  BaseConfigStep,
  BASE_CONFIG_STEP_FIELDS,
  baseConfigInitialValues,
} from './activityConfigShared/BaseConfigStep';
import RichTextEditor, { isRichTextEmpty, richTextToPlainText } from './RichTextEditor';
import { freeSpinRestrictionCatalog } from '@/data/mockData';
import { ALL_RESTRICTION_PATHS } from './GameRestrictionCascader';
import {
  DEFAULT_ACTIVITY_RULES,
  DEFAULT_LOSS_REBATE_SETTINGS,
  DEFAULT_OVERRIDE_GROUPS,
  DEFAULT_POPUP_TEXT,
  DEFAULT_VIP_RATE_MATRIX,
  LOSS_REBATE_ACTIVITY_ID,
  LOSS_REBATE_ACTIVITY_NAME,
  LOSS_REBATE_GAME_TYPES,
  LOSS_REBATE_DISPATCH_LABEL,
  VIP_TIERS,
  type LossRebateOverrideGroup,
  type RowStatus,
  type VipRateMatrix,
  type VipTierDef,
  type VipTierKey,
} from '@/data/lossRebateConfig';

const { Text } = Typography;

type RestrictionCatalogEntry = [GameType, (typeof freeSpinRestrictionCatalog)[GameType]];

interface GameCascaderOption {
  value: string;
  label: string;
  children?: GameCascaderOption[];
  disabled?: boolean;
}

// Local 3-level options (遊戲類型 → 廠商 → 遊戲) shared by 覆蓋層「指定遊戲」與「排除遊戲」。
// Kept local so the shared GameRestrictionCascader (type → 廠商 only) stays unchanged.
const overrideGameOptions: GameCascaderOption[] = (
  Object.entries(freeSpinRestrictionCatalog) as RestrictionCatalogEntry[]
).map(([gameType, providers]) => ({
  value: gameType,
  label: gameType,
  children: providers.map((provider) => ({
    value: provider.code,
    label: provider.name,
    children: provider.games.map((game) => ({
      value: game.code,
      label: game.name,
    })),
  })),
}));

const e2ePrefix = 'loss-rebate-config-modal';

/** 活動規則純文字字數上限 */
const ACTIVITY_RULES_MAX_LENGTH = 2000;

const statusOptions = [
  { value: 'enabled', label: '啟用' },
  { value: 'disabled', label: '停用' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

function TitleWithTip({ title, tip, e2eId }: { title: string; tip: string; e2eId: string }) {
  return (
    <>
      <Text strong>{title}</Text>
      <Tooltip title={tip}>
        <Text type="secondary" style={{ marginLeft: 6, cursor: 'help' }}>
          <QuestionCircleOutlined data-e2e-id={e2eId} />
        </Text>
      </Tooltip>
    </>
  );
}

function LossRebateRateStep() {
  const [rateMatrix, setRateMatrix] = useState<VipRateMatrix>(() =>
    VIP_TIERS.reduce((acc, tier) => {
      acc[tier.key] = { ...DEFAULT_VIP_RATE_MATRIX[tier.key] };
      return acc;
    }, {} as VipRateMatrix)
  );
  const [overrideRows, setOverrideRows] = useState<LossRebateOverrideGroup[]>(() =>
    DEFAULT_OVERRIDE_GROUPS.map((row) => ({
      ...row,
      gamePaths: row.gamePaths.map((path) => [...path]),
    }))
  );

  const updateRate = (tierKey: VipTierKey, gameType: GameType, value: number) => {
    setRateMatrix((current) => ({
      ...current,
      [tierKey]: { ...current[tierKey], [gameType]: value },
    }));
  };

  const updateOverrideRow = <K extends keyof LossRebateOverrideGroup>(
    key: string,
    field: K,
    value: LossRebateOverrideGroup[K],
  ) => {
    setOverrideRows((current) =>
      current.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    );
  };

  const addOverrideRow = () => {
    setOverrideRows((current) => [
      ...current,
      {
        key: `override-${Date.now()}`,
        groupName: '',
        gamePaths: [],
        rate: 0,
        status: 'enabled',
      },
    ]);
  };

  const matrixColumns: ColumnsType<VipTierDef> = [
    {
      title: 'VIP 等級',
      dataIndex: 'label',
      width: 150,
      fixed: 'left',
      render: (_, row) => (
        <div>
          <div>{row.label}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {row.levelRange}
          </Text>
        </div>
      ),
    },
    ...LOSS_REBATE_GAME_TYPES.map<ColumnsType<VipTierDef>[number]>((gameType) => ({
      title: gameType,
      dataIndex: gameType,
      width: 130,
      render: (_: unknown, row: VipTierDef) => (
        <InputNumber
          data-e2e-id={`${e2ePrefix}-matrix-rate-${row.key}-${gameType}`}
          min={0}
          max={100}
          step={0.1}
          addonAfter="%"
          value={rateMatrix[row.key][gameType]}
          style={{ width: '100%' }}
          onChange={(value) => updateRate(row.key, gameType, Number(value ?? 0))}
        />
      ),
    })),
  ];

  const buildOverrideOptions = (
    currentRowKey: string,
    rows: LossRebateOverrideGroup[],
  ): GameCascaderOption[] => {
    const usedByOthers = new Set<string>();
    rows.forEach((r) => {
      if (r.key === currentRowKey) return;
      r.gamePaths.forEach((path) => usedByOthers.add(path.join('/')));
    });
    const mark = (options: GameCascaderOption[], prefix: string[]): GameCascaderOption[] =>
      options.map((opt) => {
        const path = [...prefix, opt.value];
        if (opt.children) {
          return { ...opt, children: mark(opt.children, path) };
        }
        return { ...opt, disabled: usedByOthers.has(path.join('/')) };
      });
    return mark(overrideGameOptions, []);
  };

  const overrideColumns: ColumnsType<LossRebateOverrideGroup> = [
    {
      title: '組命名',
      dataIndex: 'groupName',
      width: 160,
      render: (_, row) => (
        <Input
          data-e2e-id={`${e2ePrefix}-override-group-name-${row.key}`}
          value={row.groupName}
          placeholder="如：熱門電子"
          onChange={(e) => updateOverrideRow(row.key, 'groupName', e.target.value)}
        />
      ),
    },
    {
      title: '指定遊戲',
      dataIndex: 'gamePaths',
      width: 380,
      render: (_, row) => (
        <Cascader
          data-e2e-id={`${e2ePrefix}-override-games-${row.key}`}
          multiple
          options={buildOverrideOptions(row.key, overrideRows)}
          value={row.gamePaths}
          placeholder="選擇遊戲類型 → 廠商 → 遊戲"
          showCheckedStrategy={Cascader.SHOW_CHILD}
          maxTagCount="responsive"
          style={{ width: '100%' }}
          onChange={(value) =>
            updateOverrideRow(row.key, 'gamePaths', value as string[][])
          }
        />
      ),
    },
    {
      title: '返利比例',
      dataIndex: 'rate',
      width: 160,
      render: (_, row) => (
        <InputNumber
          data-e2e-id={`${e2ePrefix}-override-rate-${row.key}`}
          min={0}
          max={100}
          step={0.1}
          addonAfter="%"
          value={row.rate}
          style={{ width: '100%' }}
          onChange={(value) => updateOverrideRow(row.key, 'rate', Number(value ?? 0))}
        />
      ),
    },
    {
      title: '狀態',
      dataIndex: 'status',
      width: 130,
      render: (_, row) => (
        <Select
          data-e2e-id={`${e2ePrefix}-override-status-${row.key}`}
          value={row.status}
          options={statusOptions}
          style={{ width: '100%' }}
          onChange={(value: RowStatus) => updateOverrideRow(row.key, 'status', value)}
        />
      ),
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      render: (_, row) => (
        <Button
          data-e2e-id={`${e2ePrefix}-override-delete-${row.key}`}
          type="link"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() =>
            setOverrideRows((current) => current.filter((item) => item.key !== row.key))
          }
        >
          刪除
        </Button>
      ),
    },
  ];

  return (
    <Card
      data-e2e-id={`${e2ePrefix}-rate-card`}
      size="small"
      title={<TitleWithTip title="返利比例配置" tip="命中優先級：排除遊戲 > 指定遊戲 > VIP × 遊戲類型，一注只命中一條規則" e2eId={`${e2ePrefix}-priority-tooltip`} />}
      style={{ marginBottom: 8 }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <TitleWithTip title="基準層（VIP × 遊戲類型）" tip="未命中指定遊戲的投注，依會員 VIP 分級與遊戲類型套用比例" e2eId={`${e2ePrefix}-base-tooltip`} />
          <Table
            data-e2e-id={`${e2ePrefix}-matrix-table`}
            columns={matrixColumns}
            dataSource={VIP_TIERS}
            rowKey="key"
            size="small"
            pagination={false}
            scroll={{ x: 1060 }}
            style={{ marginTop: 8 }}
            onRow={(record) =>
              ({
                'data-e2e-id': `${e2ePrefix}-matrix-row-${record.key}`,
              } as React.HTMLAttributes<HTMLTableRowElement>)
            }
          />
        </div>

        <div>
          <TitleWithTip title="覆蓋層（指定遊戲）" tip="優先於基準層；組內遊戲合併計算，套用單一比例（不分 VIP）。同一款遊戲只能屬於一組。前台活動頁的遊戲推薦列即顯示此處遊戲" e2eId={`${e2ePrefix}-override-tooltip`} />
          <Table
            data-e2e-id={`${e2ePrefix}-override-table`}
            columns={overrideColumns}
            dataSource={overrideRows}
            rowKey="key"
            size="small"
            pagination={false}
            scroll={{ x: 930 }}
            style={{ marginTop: 8 }}
            onRow={(record) =>
              ({
                'data-e2e-id': `${e2ePrefix}-override-row-${record.key}`,
              } as React.HTMLAttributes<HTMLTableRowElement>)
            }
          />
          <Button
            data-e2e-id={`${e2ePrefix}-override-add-btn`}
            icon={<PlusOutlined />}
            onClick={addOverrideRow}
            style={{ marginTop: 12 }}
          >
            新增指定遊戲
          </Button>
        </div>

        <div>
          <TitleWithTip title="排除遊戲" tip="完全不計入輸值返利（不計有效投注與派彩），優先級最高" e2eId={`${e2ePrefix}-excluded-games-tooltip`} />
          <Form.Item
            name="excludedGames"
            wrapperCol={{ span: 24 }}
            style={{ marginTop: 8, marginBottom: 0 }}
          >
            <Cascader
              data-e2e-id={`${e2ePrefix}-excluded-games-cascader`}
              multiple
              options={overrideGameOptions}
              placeholder="選擇遊戲類型 → 廠商 → 遊戲"
              showCheckedStrategy={Cascader.SHOW_CHILD}
              maxTagCount="responsive"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </div>
      </Space>
    </Card>
  );
}

function RebateSettingsStep() {
  return (
    <Card
      data-e2e-id={`${e2ePrefix}-settings-card`}
      size="small"
      title="返利設置與彈窗"
      style={{ marginBottom: 8 }}
    >
      <Form.Item
        name="minNetLoss"
        label="起始淨輸門檻"
        tooltip="會員當日淨輸值（含指定遊戲，不含排除遊戲）需超過此金額才派發，達標後以整筆淨輸計算；0 = 不設門檻"
        rules={[{ required: true, message: '請輸入起始淨輸門檻' }]}
        style={{ marginBottom: 16 }}
      >
        <InputNumber
          data-e2e-id={`${e2ePrefix}-min-net-loss-input`}
          min={0}
          step={100}
          precision={2}
          addonBefore="₱"
          placeholder="0 = 不設門檻"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="rebateCap"
        label="返利上限"
        tooltip="單一會員單日返利總額上限（含指定遊戲）；0 = 不限"
        rules={[{ required: true, message: '請輸入返利上限' }]}
        style={{ marginBottom: 16 }}
      >
        <InputNumber
          data-e2e-id={`${e2ePrefix}-rebate-cap-input`}
          min={0}
          step={100}
          precision={2}
          addonBefore="₱"
          placeholder="0 = 不限"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="rolloverMultiplier"
        label="打碼倍數"
        tooltip="打碼要求 = 實派返利 × 倍數；計入範圍沿用基础配置「流水場館/遊戲限制」"
        rules={[{ required: true, message: '請輸入打碼倍數' }]}
        style={{ marginBottom: 16 }}
      >
        <InputNumber
          data-e2e-id={`${e2ePrefix}-rollover-multiplier-input`}
          min={0}
          step={0.5}
          addonAfter="倍"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        label="派發時間"
        tooltip="每日結算前一日 00:00:00–23:59:59 的淨輸，自動派發至獎金餘額，無需領取"
        style={{ marginBottom: 16 }}
      >
        <Text data-e2e-id={`${e2ePrefix}-dispatch-time-text`}>{LOSS_REBATE_DISPATCH_LABEL}</Text>
      </Form.Item>

      <Form.Item
        name="popupText"
        label="彈窗文案"
        tooltip="派發後通知會員的彈窗標題"
        rules={[{ required: true, message: '請輸入彈窗文案' }]}
        style={{ marginBottom: 16 }}
      >
        <Input data-e2e-id={`${e2ePrefix}-popup-text-input`} />
      </Form.Item>

      <Form.Item
        name="activityRules"
        label="活動規則"
        tooltip="前台活動頁 Standard T&C 與彈窗下方顯示的活動規則"
        rules={[
          {
            validator: (_, value) => {
              if (isRichTextEmpty(value)) {
                return Promise.reject(new Error('請輸入活動規則'));
              }
              if (richTextToPlainText(value).length > ACTIVITY_RULES_MAX_LENGTH) {
                return Promise.reject(
                  new Error(`活動規則不可超過 ${ACTIVITY_RULES_MAX_LENGTH} 字`)
                );
              }
              return Promise.resolve();
            },
          },
        ]}
        required
        style={{ marginBottom: 0 }}
      >
        <RichTextEditor
          data-e2e-id={`${e2ePrefix}-activity-rules-editor`}
          placeholder="請輸入活動規則，例如結算週期、淨輸值認定、派發方式等"
          minHeight={220}
          maxLength={ACTIVITY_RULES_MAX_LENGTH}
        />
      </Form.Item>
    </Card>
  );
}

export default function LossRebateConfigModal({ open, onClose }: Props) {
  const hiddenBaseFields = ['depositChannels'];
  const initialValues = {
    ...baseConfigInitialValues(
      LOSS_REBATE_ACTIVITY_ID,
      LOSS_REBATE_ACTIVITY_NAME,
      'rebate',
      '2026-09-01 00:00:00',
      '2026-12-31 23:59:59',
    ),
    // 打碼計入範圍預設「所有遊戲」(全平台)，避免必填空值卡在 Step 1；沒設就全平台。
    wagerVenueRestriction: ALL_RESTRICTION_PATHS,
    excludedGames: [],
    minNetLoss: DEFAULT_LOSS_REBATE_SETTINGS.minNetLoss,
    rebateCap: DEFAULT_LOSS_REBATE_SETTINGS.rebateCap,
    rolloverMultiplier: DEFAULT_LOSS_REBATE_SETTINGS.rolloverMultiplier,
    popupText: DEFAULT_POPUP_TEXT,
    activityRules: DEFAULT_ACTIVITY_RULES,
  };

  const steps: WizardStepDef[] = [
    {
      title: '基础配置',
      validateFields: BASE_CONFIG_STEP_FIELDS.filter(
        (field) => !hiddenBaseFields.includes(field)
      ),
      render: () => (
        <BaseConfigStep
          e2ePrefix={e2ePrefix}
          activityId={LOSS_REBATE_ACTIVITY_ID}
          activityName={LOSS_REBATE_ACTIVITY_NAME}
          activityTypeDefault="rebate"
          hideFields={hiddenBaseFields}
        />
      ),
    },
    {
      title: '返利比例配置',
      validateFields: [],
      render: () => <LossRebateRateStep />,
    },
    {
      title: '返利設置與彈窗',
      validateFields: [
        'minNetLoss',
        'rebateCap',
        'rolloverMultiplier',
        'popupText',
        'activityRules',
      ],
      render: () => <RebateSettingsStep />,
    },
  ];

  return (
    <ActivityConfigWizardShell
      open={open}
      onClose={onClose}
      title="輸值返利 - 编辑配置"
      steps={steps}
      initialValues={initialValues}
      saveMessage="輸值返利配置已保存"
      e2ePrefix={e2ePrefix}
    />
  );
}

'use client';

import React, { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Cascader,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Table,
  TimePicker,
  Typography,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
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
  SETTLE_CYCLE_OPTIONS,
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
      title="返利比例配置"
      style={{ marginBottom: 8 }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          data-e2e-id={`${e2ePrefix}-priority-alert`}
          type="info"
          showIcon
          message="命中優先級：排除遊戲 > 指定遊戲 > VIP × 遊戲類型 > 未設不返；一注只命中一條規則。排除遊戲不計入任何輸值返利。指定遊戲的比例會覆蓋該遊戲原本所屬的 VIP × 遊戲類型比例。最低輸值、返利上限、流水倍數、統計週期、派發時間為「全活動共用一組」，於下一步設定。"
        />

        <div>
          <Text strong>基準層（VIP × 遊戲類型）</Text>
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
          <Text strong>覆蓋層（指定遊戲）</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              即需求中的「遊戲推薦」，同一份資料。
            </Text>
          </div>
          <Table
            data-e2e-id={`${e2ePrefix}-override-table`}
            columns={overrideColumns}
            dataSource={overrideRows}
            rowKey="key"
            size="small"
            pagination={false}
            scroll={{ x: 960 }}
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
          <Text strong>排除遊戲</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              選中的遊戲完全不計入輸值返利，優先級高於指定遊戲與 VIP 矩陣。
            </Text>
          </div>
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
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="計算公式">
          有效投注額 − 派彩金額 = 淨輸值；淨輸值 × 返利比例 = 返利金額（淨輸值 ≤ 0 不派發）
        </Descriptions.Item>
        <Descriptions.Item label="比例來源">
          指定遊戲 &gt; VIP × 遊戲類型；排除遊戲不計
        </Descriptions.Item>
        <Descriptions.Item label="封頂層級">
          返利上限套用於「單會員 / 單結算週期」的返利總額，非逐規則
        </Descriptions.Item>
        <Descriptions.Item label="帳變 / 流水記錄">
          封頂前依命中規則分筆計算，派發時合併為單筆帳變
        </Descriptions.Item>
        <Descriptions.Item label="打碼計入範圍">
          沿用基础配置的「流水場館/遊戲限制」
        </Descriptions.Item>
      </Descriptions>

      <Form.Item
        name="minNetLoss"
        label="最低輸值"
        tooltip="當期淨輸值需達到此金額才派發返利"
        rules={[{ required: true, message: '請輸入最低輸值' }]}
        style={{ marginTop: 20, marginBottom: 16 }}
      >
        <InputNumber
          data-e2e-id={`${e2ePrefix}-min-net-loss-input`}
          min={0}
          step={100}
          precision={2}
          addonBefore="₱"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="rebateCap"
        label="返利上限"
        tooltip="單一會員單一結算週期的返利上限。留空 = 無上限；填 0 = 該期不派發（與投注返利的「0 = 不限」相反，請留意）"
        style={{ marginBottom: 16 }}
      >
        <InputNumber
          data-e2e-id={`${e2ePrefix}-rebate-cap-input`}
          min={0}
          step={100}
          precision={2}
          addonBefore="₱"
          placeholder="空白 = 無上限"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="rolloverMultiplier"
        label="流水倍數"
        rules={[{ required: true, message: '請輸入流水倍數' }]}
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
        name="settleCycle"
        label="統計週期"
        rules={[{ required: true, message: '請選擇統計週期' }]}
        style={{ marginBottom: 16 }}
      >
        <Radio.Group data-e2e-id={`${e2ePrefix}-settle-cycle-radio`}>
          {SETTLE_CYCLE_OPTIONS.map((option) => (
            <Radio key={option.value} value={option.value}>
              {option.label}
            </Radio>
          ))}
        </Radio.Group>
      </Form.Item>

      <Form.Item
        name="dispatchTime"
        label="派發時間"
        tooltip="日結＝每日該時間派發；週結＝每週一該時間派發上週；月結＝每月 1 日該時間派發上月"
        rules={[{ required: true, message: '請選擇派發時間' }]}
        style={{ marginBottom: 16 }}
      >
        <TimePicker
          data-e2e-id={`${e2ePrefix}-dispatch-time-picker`}
          format="HH:mm:ss"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="popupText"
        label="彈窗文案"
        rules={[{ required: true, message: '請輸入彈窗文案' }]}
        style={{ marginBottom: 16 }}
      >
        <Input data-e2e-id={`${e2ePrefix}-popup-text-input`} />
      </Form.Item>

      <Form.Item
        name="activityRules"
        label="活動規則"
        tooltip="彈窗下方顯示的活動規則說明，支援標題、清單、粗體等排版"
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
    settleCycle: DEFAULT_LOSS_REBATE_SETTINGS.settleCycle,
    // 專案未載入 dayjs customParseFormat plugin，純時間字串無法直接解析，
    // 故補一個基準日期再交給 TimePicker（僅取時分秒）。
    dispatchTime: dayjs(`2026-01-01 ${DEFAULT_LOSS_REBATE_SETTINGS.dispatchTime}`),
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
      // rebateCap 非必填，不列入 Step 3 驗證
      validateFields: [
        'minNetLoss',
        'rolloverMultiplier',
        'settleCycle',
        'dispatchTime',
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

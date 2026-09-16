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
  DEFAULT_LOSS_CAPS,
  DEFAULT_LOSS_REBATE_SETTINGS,
  DEFAULT_MIN_NET_LOSS,
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

interface BaseRuleRow {
  key: GameType;
  gameType: GameType;
  minNetLoss: number;
  cap: number;
}

function LossRebateRateStep() {
  const [baseRows, setBaseRows] = useState<BaseRuleRow[]>(() =>
    LOSS_REBATE_GAME_TYPES.map((gameType) => ({
      key: gameType,
      gameType,
      minNetLoss: DEFAULT_MIN_NET_LOSS[gameType],
      cap: DEFAULT_LOSS_CAPS[gameType],
    }))
  );
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

  const updateBaseRow = (key: GameType, field: 'minNetLoss' | 'cap', value: number) => {
    setBaseRows((current) =>
      current.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    );
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
        minNetLoss: 0,
        cap: 0,
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

  const baseColumns: ColumnsType<BaseRuleRow> = [
    {
      title: '遊戲類型',
      dataIndex: 'gameType',
      width: 160,
      render: (value) => <Text>{value}</Text>,
    },
    {
      title: '起始淨輸門檻',
      dataIndex: 'minNetLoss',
      width: 200,
      render: (_, row) => (
        <InputNumber
          data-e2e-id={`${e2ePrefix}-base-min-net-loss-${row.gameType}`}
          min={0}
          step={100}
          precision={2}
          addonBefore="₱"
          placeholder="0 = 不設門檻"
          value={row.minNetLoss}
          style={{ width: '100%' }}
          onChange={(value) => updateBaseRow(row.key, 'minNetLoss', Number(value ?? 0))}
        />
      ),
    },
    {
      title: '返利上限',
      dataIndex: 'cap',
      width: 190,
      render: (_, row) => (
        <InputNumber
          data-e2e-id={`${e2ePrefix}-base-cap-${row.gameType}`}
          min={0}
          step={100}
          precision={2}
          addonBefore="₱"
          placeholder="0 = 不限"
          value={row.cap}
          style={{ width: '100%' }}
          onChange={(value) => updateBaseRow(row.key, 'cap', Number(value ?? 0))}
        />
      ),
    },
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
      title: '起始淨輸門檻',
      dataIndex: 'minNetLoss',
      width: 200,
      render: (_, row) => (
        <InputNumber
          data-e2e-id={`${e2ePrefix}-override-min-net-loss-${row.key}`}
          min={0}
          step={100}
          precision={2}
          addonBefore="₱"
          placeholder="0 = 不設門檻"
          value={row.minNetLoss}
          style={{ width: '100%' }}
          onChange={(value) => updateOverrideRow(row.key, 'minNetLoss', Number(value ?? 0))}
        />
      ),
    },
    {
      title: '返利上限',
      dataIndex: 'cap',
      width: 190,
      render: (_, row) => (
        <InputNumber
          data-e2e-id={`${e2ePrefix}-override-cap-${row.key}`}
          min={0}
          step={100}
          precision={2}
          addonBefore="₱"
          placeholder="0 = 不限"
          value={row.cap}
          style={{ width: '100%' }}
          onChange={(value) => updateOverrideRow(row.key, 'cap', Number(value ?? 0))}
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
          message="命中優先級：排除遊戲 > 指定遊戲 > VIP × 遊戲類型 > 未設不返；一注只命中一條規則。排除遊戲不計入輸值返利；指定遊戲不再計入所屬場館。同一款遊戲不可被不同組重複選取，同組遊戲合併淨輸並共用門檻／比例／上限。各場館與各分組獨立判斷，淨輸值需「超過」門檻，達標後以整筆淨輸計算，再套用該列上限；淨輸值 ≤ 0 不派發。門檻 0 = 不設門檻，上限 0 = 不限。上限以單會員／單結算週期／單一規則計算，活動總額不再封頂。流水倍數、統計週期、派發時間仍為全活動共用，於下一步設定。"
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
          <Text strong>基準層門檻與上限（各場館獨立，不分 VIP）</Text>
          <Table
            data-e2e-id={`${e2ePrefix}-base-table`}
            columns={baseColumns}
            dataSource={baseRows}
            rowKey="key"
            size="small"
            pagination={false}
            scroll={{ x: 550 }}
            style={{ marginTop: 8 }}
            onRow={(record) =>
              ({
                'data-e2e-id': `${e2ePrefix}-base-row-${record.gameType}`,
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
            scroll={{ x: 1320 }}
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
          有效投注額 − 派彩金額 = 淨輸值；各場館／分組淨輸值需超過該列門檻，達標後以整筆淨輸 × 返利比例計算，再套用該列上限（淨輸值 ≤ 0 不派發）
        </Descriptions.Item>
        <Descriptions.Item label="比例來源">
          指定遊戲 &gt; VIP × 遊戲類型；排除遊戲不計
        </Descriptions.Item>
        <Descriptions.Item label="封頂層級">
          各場館／指定遊戲分組獨立設定門檻與上限，不分 VIP；上限 0 = 不限，活動返利總額無全域上限
        </Descriptions.Item>
        <Descriptions.Item label="帳變 / 流水記錄">
          各規則獨立計算並封頂後加總，派發時合併為單筆帳變；總額 × 全域流水倍數 = 打碼要求
        </Descriptions.Item>
        <Descriptions.Item label="打碼計入範圍">
          沿用基础配置的「流水場館/遊戲限制」
        </Descriptions.Item>
      </Descriptions>

      <Form.Item
        name="rolloverMultiplier"
        label="流水倍數"
        rules={[{ required: true, message: '請輸入流水倍數' }]}
        style={{ marginTop: 20, marginBottom: 16 }}
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
      validateFields: [
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

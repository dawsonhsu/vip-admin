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
  Select,
  Space,
  Table,
  Typography,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
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
import { freeSpinRestrictionCatalog } from '@/data/mockData';

const { Text } = Typography;

type RestrictionCatalogEntry = [GameType, (typeof freeSpinRestrictionCatalog)[GameType]];

interface GameCascaderOption {
  value: string;
  label: string;
  children?: GameCascaderOption[];
}

// Local 3-level options (遊戲類型 → 廠商 → 遊戲) for the 覆蓋層「指定遊戲」picker.
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

const e2ePrefix = 'cashback-config-modal';
const ACTIVITY_ID = 32;
const ACTIVITY_NAME = '投注返利';

const GAME_TYPES: GameType[] = [
  'Slots',
  'Live',
  'Table',
  'Arcade',
  'Bingo',
  'Fishing',
  'Sports',
];

type RowStatus = 'enabled' | 'disabled';

interface BaseRateRow {
  key: GameType;
  gameType: GameType;
  rate: number;
  multiplier: number;
  status: RowStatus;
}

interface OverrideRateRow {
  key: string;
  gamePaths: string[][];
  rate: number;
  multiplier: number;
  status: RowStatus;
}

const DEFAULT_RATES: Record<GameType, number> = {
  Slots: 0.8,
  Live: 0.3,
  Table: 0.3,
  Arcade: 0.6,
  Bingo: 0.5,
  Fishing: 0.6,
  Sports: 0.4,
};

const initialBaseRows: BaseRateRow[] = GAME_TYPES.map((gameType) => ({
  key: gameType,
  gameType,
  rate: DEFAULT_RATES[gameType],
  multiplier: 1,
  status: 'enabled',
}));

const initialOverrideRows: OverrideRateRow[] = [
  {
    key: 'override-1',
    gamePaths: [
      ['Slots', 'JILI', 'super_ace'],
      ['Slots', 'PG', 'mahjong_ways'],
    ],
    rate: 1,
    multiplier: 1,
    status: 'enabled',
  },
];

const statusOptions = [
  { value: 'enabled', label: '啟用' },
  { value: 'disabled', label: '停用' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

function CashbackRateStep() {
  const [baseRows, setBaseRows] = useState<BaseRateRow[]>(() =>
    initialBaseRows.map((row) => ({ ...row }))
  );
  const [overrideRows, setOverrideRows] = useState<OverrideRateRow[]>(() =>
    initialOverrideRows.map((row) => ({
      ...row,
      gamePaths: row.gamePaths.map((path) => [...path]),
    }))
  );

  const updateBaseRow = <K extends keyof BaseRateRow>(
    key: GameType,
    field: K,
    value: BaseRateRow[K],
  ) => {
    setBaseRows((current) =>
      current.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    );
  };

  const updateOverrideRow = <K extends keyof OverrideRateRow>(
    key: string,
    field: K,
    value: OverrideRateRow[K],
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
        gamePaths: [],
        rate: 0,
        multiplier: 1,
        status: 'enabled',
      },
    ]);
  };

  const baseColumns: ColumnsType<BaseRateRow> = [
    {
      title: '遊戲類型',
      dataIndex: 'gameType',
      width: 160,
      render: (value) => <Text>{value}</Text>,
    },
    {
      title: '返利率',
      dataIndex: 'rate',
      width: 180,
      render: (_, row) => (
        <InputNumber
          data-e2e-id={`${e2ePrefix}-base-rate-${row.gameType}`}
          min={0}
          max={100}
          step={0.1}
          addonAfter="%"
          value={row.rate}
          style={{ width: '100%' }}
          onChange={(value) => updateBaseRow(row.key, 'rate', Number(value ?? 0))}
        />
      ),
    },
    {
      title: '打碼倍數',
      dataIndex: 'multiplier',
      width: 180,
      render: (_, row) => (
        <InputNumber
          data-e2e-id={`${e2ePrefix}-base-multiplier-${row.gameType}`}
          min={0}
          step={0.5}
          addonAfter="倍"
          value={row.multiplier}
          style={{ width: '100%' }}
          onChange={(value) =>
            updateBaseRow(row.key, 'multiplier', Number(value ?? 0))
          }
        />
      ),
    },
    {
      title: '狀態',
      dataIndex: 'status',
      width: 140,
      render: (_, row) => (
        <Select
          data-e2e-id={`${e2ePrefix}-base-status-${row.gameType}`}
          value={row.status}
          options={statusOptions}
          style={{ width: '100%' }}
          onChange={(value: RowStatus) => updateBaseRow(row.key, 'status', value)}
        />
      ),
    },
  ];

  const overrideColumns: ColumnsType<OverrideRateRow> = [
    {
      title: '指定遊戲',
      dataIndex: 'gamePaths',
      width: 360,
      render: (_, row) => (
        <Cascader
          data-e2e-id={`${e2ePrefix}-override-games-${row.key}`}
          multiple
          options={overrideGameOptions}
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
      title: '返利率',
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
      title: '打碼倍數',
      dataIndex: 'multiplier',
      width: 160,
      render: (_, row) => (
        <InputNumber
          data-e2e-id={`${e2ePrefix}-override-multiplier-${row.key}`}
          min={0}
          step={0.5}
          addonAfter="倍"
          value={row.multiplier}
          style={{ width: '100%' }}
          onChange={(value) =>
            updateOverrideRow(row.key, 'multiplier', Number(value ?? 0))
          }
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
      title="返利率配置"
      style={{ marginBottom: 8 }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          data-e2e-id={`${e2ePrefix}-priority-alert`}
          type="info"
          showIcon
          message="命中優先級：指定遊戲 > 遊戲類型 > 未設不返；一注只命中一條。"
        />

        <div>
          <Text strong>基準層（遊戲類型）</Text>
          <Table
            data-e2e-id={`${e2ePrefix}-base-table`}
            columns={baseColumns}
            dataSource={baseRows}
            rowKey="key"
            size="small"
            pagination={false}
            scroll={{ x: 660 }}
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
          <Table
            data-e2e-id={`${e2ePrefix}-override-table`}
            columns={overrideColumns}
            dataSource={overrideRows}
            rowKey="key"
            size="small"
            pagination={false}
            scroll={{ x: 910 }}
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
      </Space>
    </Card>
  );
}

function DistributionStep() {
  return (
    <Card
      data-e2e-id={`${e2ePrefix}-distribution-card`}
      size="small"
      title="派發與彈窗"
      style={{ marginBottom: 8 }}
    >
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="結算週期">
          T+1（隔日凌晨結算，自動派發至獎金餘額，無需玩家領取）
        </Descriptions.Item>
        <Descriptions.Item label="打碼計入範圍">
          沿用基础配置的「流水場館/遊戲限制」
        </Descriptions.Item>
      </Descriptions>
      <Form.Item
        name="popupText"
        label="彈窗文案"
        rules={[{ required: true, message: '請輸入彈窗文案' }]}
        style={{ marginTop: 20, marginBottom: 0 }}
      >
        <Input data-e2e-id={`${e2ePrefix}-popup-text-input`} />
      </Form.Item>
    </Card>
  );
}

export default function CashbackConfigModal({ open, onClose }: Props) {
  const hiddenBaseFields = ['depositChannels'];
  const initialValues = {
    ...baseConfigInitialValues(
      ACTIVITY_ID,
      ACTIVITY_NAME,
      'rebate',
      '2026-09-06 00:00:00',
      '2026-12-31 23:59:59',
    ),
    popupText: 'Congratulations! You received Cashback Bonus!',
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
          activityId={ACTIVITY_ID}
          activityName={ACTIVITY_NAME}
          activityTypeDefault="rebate"
          hideFields={hiddenBaseFields}
        />
      ),
    },
    {
      title: '返利率配置',
      validateFields: [],
      render: () => <CashbackRateStep />,
    },
    {
      title: '派發與彈窗',
      validateFields: ['popupText'],
      render: () => <DistributionStep />,
    },
  ];

  return (
    <ActivityConfigWizardShell
      open={open}
      onClose={onClose}
      title="投注返利 - 编辑配置"
      steps={steps}
      initialValues={initialValues}
      saveMessage="投注返利配置已保存"
      e2ePrefix={e2ePrefix}
    />
  );
}

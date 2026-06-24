'use client';

import React, { useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  ColumnHeightOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import JackpotBoardExclusionModal from '@/components/JackpotBoardExclusionModal';
import JackpotBoardSettingsModal from '@/components/JackpotBoardSettingsModal';
import {
  generateJackpotEvents,
  providerGames,
  slotProviders,
  type JackpotEvent,
  type SlotProviderCode,
} from '@/data/jackpotBoardData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const formatCurrency = (v: number) => `₱${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface FilterValues {
  range?: [Dayjs, Dayjs];
  account?: string;
  phone?: string;
  game?: string;
  provider?: SlotProviderCode | 'all';
  multiplierMin?: number | null;
  multiplierMax?: number | null;
  winAmountMin?: number | null;
  winAmountMax?: number | null;
}

const providerNameMap = slotProviders.reduce<Record<SlotProviderCode, string>>((acc, provider) => {
  acc[provider.code] = provider.name;
  return acc;
}, {} as Record<SlotProviderCode, string>);

const gameOptions = Object.entries(providerGames).flatMap(([provider, games]) =>
  games.map((game) => ({
    value: game.name,
    label: `${game.name} / ${provider}`,
  }))
);

const createDefaultFilters = (): FilterValues => ({
  range: [dayjs().subtract(3, 'day').startOf('day'), dayjs().endOf('day')],
  account: undefined,
  phone: undefined,
  provider: 'all',
  game: 'all',
  multiplierMin: undefined,
  multiplierMax: undefined,
  winAmountMin: undefined,
  winAmountMax: undefined,
});

const formatMultiplier = (value: number) =>
  `${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}×`;

const renderVipTag = (vipLevel: string) => {
  const level = Number(vipLevel.replace('VIP', ''));
  return <Tag color={level >= 5 ? 'purple' : 'blue'}>{vipLevel}</Tag>;
};

const renderMultiplier = (value: number) => (
  <Text
    strong={value >= 300}
    style={{ color: value >= 1000 ? '#cf1322' : value >= 300 ? '#d46b08' : undefined }}
  >
    {formatMultiplier(value)}
  </Text>
);

export default function JackpotBoardPage() {
  const [form] = Form.useForm<FilterValues>();
  const defaultFilters = useMemo(createDefaultFilters, []);
  const events = useMemo(() => generateJackpotEvents(), []);
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exclusionOpen, setExclusionOpen] = useState(false);

  const filteredEvents = useMemo(() => events.filter((record) => {
    const range = filters.range;
    if (range?.[0] && range?.[1]) {
      const pushTime = dayjs(record.pushTime);
      if (pushTime.isBefore(range[0]) || pushTime.isAfter(range[1])) return false;
    }

    const account = filters.account?.trim().toLowerCase();
    if (account && !record.account.toLowerCase().includes(account)) return false;

    const phone = filters.phone?.trim();
    if (phone && !record.phone.includes(phone)) return false;

    if (filters.game && filters.game !== 'all' && record.game !== filters.game) return false;
    if (filters.provider && filters.provider !== 'all' && record.provider !== filters.provider) return false;
    if (typeof filters.multiplierMin === 'number' && record.multiplier < filters.multiplierMin) return false;
    if (typeof filters.multiplierMax === 'number' && record.multiplier > filters.multiplierMax) return false;
    if (typeof filters.winAmountMin === 'number' && record.winAmount < filters.winAmountMin) return false;
    if (typeof filters.winAmountMax === 'number' && record.winAmount > filters.winAmountMax) return false;

    return true;
  }), [events, filters]);

  const handleQuery = () => {
    setFilters(form.getFieldsValue());
  };

  const handleReset = () => {
    const nextFilters = createDefaultFilters();
    form.setFieldsValue(nextFilters);
    setFilters(nextFilters);
  };

  const columns: ColumnsType<JackpotEvent> = [
    { title: '推送時間', dataIndex: 'pushTime', width: 170 },
    { title: '帳號', dataIndex: 'account', width: 160 },
    { title: '手機號', dataIndex: 'phone', width: 140 },
    {
      title: 'VIP等級',
      dataIndex: 'vipLevel',
      width: 110,
      render: (value: string) => renderVipTag(value),
    },
    { title: '遊戲', dataIndex: 'game', width: 170 },
    {
      title: 'Provider',
      dataIndex: 'provider',
      width: 130,
      render: (value: SlotProviderCode) => (
        <Tooltip title={providerNameMap[value]}>
          <Tag color="geekblue">{value}</Tag>
        </Tooltip>
      ),
    },
    {
      title: '注額',
      dataIndex: 'betAmount',
      width: 130,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: '倍數',
      dataIndex: 'multiplier',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.multiplier - b.multiplier,
      defaultSortOrder: 'descend',
      render: (value: number) => renderMultiplier(value),
    },
    {
      title: '贏分',
      dataIndex: 'winAmount',
      width: 150,
      align: 'right',
      render: (value: number) => formatCurrency(value),
      sorter: (a, b) => a.winAmount - b.winAmount,
    },
    { title: '來源注單號', dataIndex: 'sourceBetNo', width: 220 },
  ];

  return (
    <div data-e2e-id="jackpot-board-page">
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>爆獎榜管理</Title>
        <Text type="secondary">運營管理 / 爆獎榜管理</Text>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          initialValues={defaultFilters}
          style={{ rowGap: 12, flexWrap: 'wrap', marginBottom: 16 }}
          data-e2e-id="jackpot-board-filter-form"
        >
          <Form.Item name="range" label="時間範圍">
            <RangePicker
              showTime
              style={{ width: 380 }}
              data-e2e-id="jackpot-board-filter-range-picker"
            />
          </Form.Item>
          <Form.Item name="account" label="帳號">
            <Input
              allowClear
              placeholder="輸入帳號"
              style={{ width: 180 }}
              data-e2e-id="jackpot-board-filter-account-input"
            />
          </Form.Item>
          <Form.Item name="phone" label="手機號">
            <Input
              allowClear
              placeholder="輸入手機號"
              style={{ width: 180 }}
              data-e2e-id="jackpot-board-filter-phone-input"
            />
          </Form.Item>
          <Form.Item name="game" label="遊戲">
            <Select
              showSearch
              optionFilterProp="label"
              style={{ width: 220 }}
              data-e2e-id="jackpot-board-filter-game-select"
            >
              <Select.Option value="all" label="全部">全部</Select.Option>
              {gameOptions.map((game) => (
                <Select.Option key={game.value} value={game.value} label={game.label}>
                  {game.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="provider" label="Provider">
            <Select style={{ width: 160 }} data-e2e-id="jackpot-board-filter-provider-select">
              <Select.Option value="all">全部</Select.Option>
              {slotProviders.map((provider) => (
                <Select.Option key={provider.code} value={provider.code}>
                  {provider.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="倍數區間">
            <Space align="center" size={6}>
              <Form.Item name="multiplierMin" noStyle>
                <InputNumber
                  min={0}
                  placeholder="最小"
                  style={{ width: 110 }}
                  data-e2e-id="jackpot-board-filter-multiplier-min-input"
                />
              </Form.Item>
              <Text type="secondary">~</Text>
              <Form.Item name="multiplierMax" noStyle>
                <InputNumber
                  min={0}
                  placeholder="最大"
                  style={{ width: 110 }}
                  data-e2e-id="jackpot-board-filter-multiplier-max-input"
                />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item label="贏分區間">
            <Space align="center" size={6}>
              <Form.Item name="winAmountMin" noStyle>
                <InputNumber
                  min={0}
                  prefix="₱"
                  placeholder="最小"
                  style={{ width: 130 }}
                  data-e2e-id="jackpot-board-filter-win-amount-min-input"
                />
              </Form.Item>
              <Text type="secondary">~</Text>
              <Form.Item name="winAmountMax" noStyle>
                <InputNumber
                  min={0}
                  prefix="₱"
                  placeholder="最大"
                  style={{ width: 130 }}
                  data-e2e-id="jackpot-board-filter-win-amount-max-input"
                />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleQuery}
                data-e2e-id="jackpot-board-query-btn"
              >
                查詢
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
                data-e2e-id="jackpot-board-reset-btn"
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card size="small" data-e2e-id="jackpot-board-list-card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <Space wrap>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setSettingsOpen(true)}
              data-e2e-id="jackpot-board-settings-btn"
            >
              設定
            </Button>
            <Button
              onClick={() => setExclusionOpen(true)}
              data-e2e-id="jackpot-board-exclusion-btn"
            >
              排除與隱私名單
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => message.success('已匯出當前篩選結果')}
              data-e2e-id="jackpot-board-export-btn"
            >
              匯出
            </Button>
          </Space>
          <Space>
            <Tooltip title="刷新">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => message.success('列表已刷新')}
                data-e2e-id="jackpot-board-refresh-btn"
              />
            </Tooltip>
            <Tooltip title="列高">
              <Button
                icon={<ColumnHeightOutlined />}
                onClick={() => message.info('原型暫未提供列高切換')}
                data-e2e-id="jackpot-board-rowheight-btn"
              />
            </Tooltip>
            <Tooltip title="欄位設定">
              <Button
                icon={<SettingOutlined />}
                onClick={() => message.info('原型暫未提供欄位設定')}
                data-e2e-id="jackpot-board-column-setting-btn"
              />
            </Tooltip>
          </Space>
        </div>

        <Table
          rowKey="key"
          columns={columns}
          dataSource={filteredEvents}
          scroll={{ x: 1500 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 條`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          data-e2e-id="jackpot-board-table"
        />
      </Card>

      <JackpotBoardSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <JackpotBoardExclusionModal
        open={exclusionOpen}
        onClose={() => setExclusionOpen(false)}
      />
    </div>
  );
}

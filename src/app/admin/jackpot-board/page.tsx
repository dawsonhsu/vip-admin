'use client';

import React, { useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  DownloadOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  StopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TableRowSelection } from 'antd/es/table/interface';
import JackpotBoardExclusionModal from '@/components/JackpotBoardExclusionModal';
import JackpotBoardSettingsModal from '@/components/JackpotBoardSettingsModal';
import {
  generateJackpotEvents,
  providerGames,
  slotProviders,
  type JackpotEvent,
  type JackpotEventStatus,
  type SlotProviderCode,
} from '@/data/jackpotBoardData';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const formatCurrency = (v: number) => `₱${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type StatusTabKey = 'all' | JackpotEventStatus;

interface FilterValues {
  range?: [Dayjs, Dayjs];
  account?: string;
  game?: string;
  provider?: SlotProviderCode | 'all';
  multiplierMin?: number;
  multiplierMax?: number;
  winAmountMin?: number;
  winAmountMax?: number;
}

type RemoveContext =
  | { mode: 'single'; record: JackpotEvent }
  | { mode: 'batch' };

const statusConfig: Record<JackpotEventStatus, { label: string; color: string }> = {
  listed: { label: '上榜中', color: 'success' },
  removed: { label: '已下架', color: 'default' },
  risk_blocked: { label: '風控攔截', color: 'error' },
};

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
  provider: 'all',
  game: 'all',
});

const formatMultiplier = (value: number) =>
  `${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}×`;

const renderStatusTag = (record: JackpotEvent) => {
  const config = statusConfig[record.status];
  const tag = (
    <Tag color={config.color} data-e2e-id={`jackpot-board-status-tag-${record.key}`}>
      {config.label}
    </Tag>
  );

  if (record.status === 'removed' && record.removedReason) {
    return <Tooltip title={`下架原因：${record.removedReason}`}>{tag}</Tooltip>;
  }

  return tag;
};

const renderVipTag = (vipLevel: string) => {
  const level = Number(vipLevel.replace('VIP', ''));
  return <Tag color={level >= 5 ? 'purple' : 'blue'}>{vipLevel}</Tag>;
};

export default function JackpotBoardPage() {
  const [form] = Form.useForm<FilterValues>();
  const defaultFilters = useMemo(createDefaultFilters, []);
  const [events, setEvents] = useState<JackpotEvent[]>(() => generateJackpotEvents());
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  const [activeStatus, setActiveStatus] = useState<StatusTabKey>('all');
  const [enabled, setEnabled] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exclusionOpen, setExclusionOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [removeContext, setRemoveContext] = useState<RemoveContext | null>(null);
  const [removeReason, setRemoveReason] = useState('');
  const [betDrawerRecord, setBetDrawerRecord] = useState<JackpotEvent | null>(null);
  const [accountDrawerRecord, setAccountDrawerRecord] = useState<JackpotEvent | null>(null);

  const stats = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return {
      todayListed: events.filter((event) => event.triggerTime.startsWith(today)).length,
      listed: events.filter((event) => event.status === 'listed').length,
      removed: events.filter((event) => event.status === 'removed').length,
      highestMultiplier: events.reduce((max, event) => Math.max(max, event.multiplier), 0),
    };
  }, [events]);

  const statusCounts = useMemo(() => ({
    all: events.length,
    listed: events.filter((event) => event.status === 'listed').length,
    removed: events.filter((event) => event.status === 'removed').length,
    risk_blocked: events.filter((event) => event.status === 'risk_blocked').length,
  }), [events]);

  const filteredEvents = useMemo(() => events.filter((record) => {
    if (activeStatus !== 'all' && record.status !== activeStatus) return false;

    const range = filters.range;
    if (range?.[0] && range?.[1]) {
      const triggerTime = dayjs(record.triggerTime);
      if (triggerTime.isBefore(range[0]) || triggerTime.isAfter(range[1])) return false;
    }

    const account = filters.account?.trim().toLowerCase();
    if (account) {
      const masked = record.account.toLowerCase();
      const raw = record.accountRaw.toLowerCase();
      if (!masked.includes(account) && !raw.includes(account)) return false;
    }

    if (filters.game && filters.game !== 'all' && record.game !== filters.game) return false;
    if (filters.provider && filters.provider !== 'all' && record.provider !== filters.provider) return false;
    if (typeof filters.multiplierMin === 'number' && record.multiplier < filters.multiplierMin) return false;
    if (typeof filters.multiplierMax === 'number' && record.multiplier > filters.multiplierMax) return false;
    if (typeof filters.winAmountMin === 'number' && record.winAmount < filters.winAmountMin) return false;
    if (typeof filters.winAmountMax === 'number' && record.winAmount > filters.winAmountMax) return false;

    return true;
  }), [activeStatus, events, filters]);

  const selectedListedKeys = useMemo(() => {
    const selected = new Set(selectedRowKeys.map(String));
    return events
      .filter((event) => selected.has(event.key) && event.status === 'listed')
      .map((event) => event.key);
  }, [events, selectedRowKeys]);

  const handleQuery = () => {
    setFilters(form.getFieldsValue());
  };

  const handleReset = () => {
    const nextFilters = createDefaultFilters();
    form.setFieldsValue(nextFilters);
    setFilters(nextFilters);
  };

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked);
    message.success(checked ? '爆獎榜已啟用' : '爆獎榜已停用');
  };

  const handleBatchRemove = () => {
    if (selectedListedKeys.length === 0) {
      message.warning('請先選取上榜中記錄');
      return;
    }
    setRemoveReason('');
    setRemoveContext({ mode: 'batch' });
  };

  const handleConfirmRemove = () => {
    const reason = removeReason.trim();
    if (!reason) {
      message.warning('請輸入下架原因');
      return;
    }
    if (!removeContext) return;

    const targetKeys = removeContext.mode === 'single'
      ? [removeContext.record.key]
      : selectedListedKeys;

    if (targetKeys.length === 0) {
      message.warning('沒有可下架的上榜中記錄');
      return;
    }

    const targetSet = new Set(targetKeys);
    setEvents((prev) => prev.map((event) => (
      targetSet.has(event.key) && event.status === 'listed'
        ? {
          ...event,
          status: 'removed',
          removedReason: reason,
          lastOperator: 'admin01',
        }
        : event
    )));
    setSelectedRowKeys((prev) => prev.filter((key) => !targetSet.has(String(key))));
    setRemoveContext(null);
    setRemoveReason('');
    message.success(removeContext.mode === 'single' ? '已下架該筆記錄' : `已下架 ${targetKeys.length} 筆記錄`);
  };

  const rowSelection: TableRowSelection<JackpotEvent> = {
    selectedRowKeys,
    onChange: (nextSelectedRowKeys) => setSelectedRowKeys(nextSelectedRowKeys),
  };

  const columns: ColumnsType<JackpotEvent> = [
    { title: '觸發時間', dataIndex: 'triggerTime', width: 170, fixed: 'left' },
    { title: '帳號', dataIndex: 'account', width: 120 },
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
      render: (value: number) => (
        <Text
          strong={value >= 300}
          style={{ color: value >= 1000 ? '#cf1322' : value >= 300 ? '#d46b08' : undefined }}
        >
          {formatMultiplier(value)}
        </Text>
      ),
    },
    {
      title: '贏分',
      dataIndex: 'winAmount',
      width: 150,
      align: 'right',
      render: (value: number) => formatCurrency(value),
      sorter: (a, b) => a.winAmount - b.winAmount,
    },
    {
      title: '狀態',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => renderStatusTag(record),
    },
    { title: '來源注單號', dataIndex: 'sourceBetNo', width: 200 },
    { title: '最後操作人', dataIndex: 'lastOperator', width: 120 },
    {
      title: '操作',
      width: 230,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          {record.status === 'listed' && (
            <Button
              danger
              type="link"
              size="small"
              icon={<StopOutlined />}
              onClick={() => {
                setRemoveReason('');
                setRemoveContext({ mode: 'single', record });
              }}
              data-e2e-id={`jackpot-board-remove-btn-${record.key}`}
            >
              下架
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setBetDrawerRecord(record)}
            data-e2e-id={`jackpot-board-view-bet-btn-${record.key}`}
          >
            查看注單
          </Button>
          <Button
            type="link"
            size="small"
            icon={<UserOutlined />}
            onClick={() => setAccountDrawerRecord(record)}
            data-e2e-id={`jackpot-board-view-account-btn-${record.key}`}
          >
            查看帳號
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div data-e2e-id="jackpot-board-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
        <Space direction="vertical" size={4}>
          <Space align="center">
            <Title level={4} style={{ margin: 0 }}>爆獎榜管理</Title>
            <Tag color={enabled ? 'success' : 'default'} data-e2e-id="jackpot-board-enabled-status-tag">
              ● {enabled ? '啟用中' : '已停用'}
            </Tag>
          </Space>
          <Text type="secondary">運營管理 / 爆獎榜管理</Text>
        </Space>
        <Space wrap style={{ justifyContent: 'flex-end' }}>
          <Text>總開關</Text>
          <Switch
            checked={enabled}
            onChange={handleEnabledChange}
            data-e2e-id="jackpot-board-enabled-switch"
          />
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
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Statistic title="今日上榜數" value={stats.todayListed} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="上榜中" value={stats.listed} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="已下架" value={stats.removed} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="最高倍數" value={formatMultiplier(stats.highestMultiplier)} />
          </Col>
        </Row>
      </Card>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          initialValues={defaultFilters}
          style={{ rowGap: 12, flexWrap: 'wrap' }}
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
              placeholder="遮罩或原帳號"
              style={{ width: 180 }}
              data-e2e-id="jackpot-board-filter-account-input"
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

      <Card size="small">
        <Tabs
          activeKey={activeStatus}
          onChange={(key) => setActiveStatus(key as StatusTabKey)}
          items={[
            { key: 'all', label: <span data-e2e-id="jackpot-board-status-tab-all">全部 ({statusCounts.all})</span> },
            { key: 'listed', label: <span data-e2e-id="jackpot-board-status-tab-listed">上榜中 ({statusCounts.listed})</span> },
            { key: 'removed', label: <span data-e2e-id="jackpot-board-status-tab-removed">已下架 ({statusCounts.removed})</span> },
            { key: 'risk_blocked', label: <span data-e2e-id="jackpot-board-status-tab-risk-blocked">風控攔截 ({statusCounts.risk_blocked})</span> },
          ]}
          data-e2e-id="jackpot-board-status-tabs"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <Space>
            <Button
              danger
              icon={<StopOutlined />}
              disabled={selectedListedKeys.length === 0}
              onClick={handleBatchRemove}
              data-e2e-id="jackpot-board-batch-remove-btn"
            >
              批量下架
            </Button>
            <Text type="secondary">已選取 {selectedRowKeys.length} 筆，可下架 {selectedListedKeys.length} 筆</Text>
          </Space>
        </div>
        <Table
          rowKey="key"
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredEvents}
          scroll={{ x: 1800 }}
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

      <Modal
        title={removeContext?.mode === 'batch' ? '批量下架' : '下架爆獎記錄'}
        open={!!removeContext}
        closable={false}
        maskClosable={false}
        onCancel={() => setRemoveContext(null)}
        footer={(
          <Space>
            <Button
              onClick={() => setRemoveContext(null)}
              data-e2e-id="jackpot-board-remove-cancel-btn"
            >
              取消
            </Button>
            <Button
              danger
              type="primary"
              onClick={handleConfirmRemove}
              data-e2e-id="jackpot-board-remove-confirm-btn"
            >
              確認下架
            </Button>
          </Space>
        )}
        data-e2e-id="jackpot-board-remove-modal"
      >
        <Paragraph type="secondary">
          {removeContext?.mode === 'batch'
            ? `將下架 ${selectedListedKeys.length} 筆上榜中記錄。`
            : `將下架帳號 ${removeContext?.record.account ?? '-'} 的上榜記錄。`}
        </Paragraph>
        <Input.TextArea
          rows={4}
          value={removeReason}
          onChange={(event) => setRemoveReason(event.target.value)}
          placeholder="請輸入下架原因"
          data-e2e-id="jackpot-board-remove-reason-textarea"
        />
      </Modal>

      <Drawer
        title="注單詳情"
        open={!!betDrawerRecord}
        width={520}
        closable={false}
        maskClosable={false}
        onClose={() => setBetDrawerRecord(null)}
        extra={(
          <Button onClick={() => setBetDrawerRecord(null)} data-e2e-id="jackpot-board-bet-drawer-close-btn">
            關閉
          </Button>
        )}
        data-e2e-id="jackpot-board-bet-drawer"
      >
        {betDrawerRecord && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="來源注單號">{betDrawerRecord.sourceBetNo}</Descriptions.Item>
            <Descriptions.Item label="觸發時間">{betDrawerRecord.triggerTime}</Descriptions.Item>
            <Descriptions.Item label="Provider">{providerNameMap[betDrawerRecord.provider]}</Descriptions.Item>
            <Descriptions.Item label="遊戲">{betDrawerRecord.game}</Descriptions.Item>
            <Descriptions.Item label="注額">{formatCurrency(betDrawerRecord.betAmount)}</Descriptions.Item>
            <Descriptions.Item label="倍數">{formatMultiplier(betDrawerRecord.multiplier)}</Descriptions.Item>
            <Descriptions.Item label="贏分">{formatCurrency(betDrawerRecord.winAmount)}</Descriptions.Item>
            <Descriptions.Item label="狀態">{renderStatusTag(betDrawerRecord)}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      <Drawer
        title="帳號資訊"
        open={!!accountDrawerRecord}
        width={480}
        closable={false}
        maskClosable={false}
        onClose={() => setAccountDrawerRecord(null)}
        extra={(
          <Button onClick={() => setAccountDrawerRecord(null)} data-e2e-id="jackpot-board-account-drawer-close-btn">
            關閉
          </Button>
        )}
        data-e2e-id="jackpot-board-account-drawer"
      >
        {accountDrawerRecord && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="遮罩帳號">{accountDrawerRecord.account}</Descriptions.Item>
              <Descriptions.Item label="原始帳號">{accountDrawerRecord.accountRaw}</Descriptions.Item>
              <Descriptions.Item label="VIP等級">{renderVipTag(accountDrawerRecord.vipLevel)}</Descriptions.Item>
              <Descriptions.Item label="最近上榜遊戲">{accountDrawerRecord.game}</Descriptions.Item>
            </Descriptions>
            <Card size="small">
              <Text type="secondary">
                此頁為爆獎榜展示用資訊。若需停用展示，可加入排除與隱私名單或下架單筆記錄。
              </Text>
            </Card>
          </Space>
        )}
      </Drawer>

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

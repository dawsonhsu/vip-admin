'use client';

import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Typography,
} from 'antd';
import {
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { GameType } from '@/data/memberStatsData';
import {
  generateCashbackReport,
  type CashbackBreakdownRow,
  type CashbackReportRow,
} from '@/data/cashbackReportData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const E2E = 'cashback-report';
const GAME_TYPES: GameType[] = [
  'Slots',
  'Live',
  'Table',
  'Arcade',
  'Bingo',
  'Fishing',
  'Sports',
];

interface ReportFilters {
  account?: string;
  uid?: string;
  vipLevel?: number;
  gameType?: GameType;
  rolloverStatus?: 'pending' | 'done';
  settledRange?: [Dayjs, Dayjs];
}

const formatCurrency = (value: number) =>
  `₱ ${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const escapeCsvCell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const downloadCsv = (rows: CashbackReportRow[]) => {
  const csvRows: (string | number)[][] = [
    [
      '序號',
      '玩家帳號',
      '會員UID',
      'VIP等級',
      '有效投注金額',
      '流水返利金額',
      '打碼要求',
      '打碼進度',
      '打碼狀態',
      '結算時間',
    ],
    ...rows.map((row) => [
      row.id,
      row.account,
      row.uid,
      `V${row.vipLevel}`,
      row.effectiveBet.toFixed(2),
      row.cashbackAmount.toFixed(2),
      row.rolloverRequired.toFixed(2),
      row.rolloverProgress.toFixed(2),
      row.rolloverDone ? '已達標' : '未達標',
      row.settledAt,
    ]),
  ];
  const content = `\uFEFF${csvRows
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\n')}`;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.setAttribute('download', 'cashback-report.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
};

export default function CashbackReportPage() {
  const [form] = Form.useForm<ReportFilters>();
  const [filters, setFilters] = useState<ReportFilters>({});
  const [allRows] = useState(() => generateCashbackReport(35));
  const [selectedRow, setSelectedRow] = useState<CashbackReportRow | null>(null);

  const filteredRows = useMemo(
    () =>
      allRows.filter((row) => {
        if (
          filters.account &&
          !row.account.toLowerCase().includes(filters.account.toLowerCase())
        ) {
          return false;
        }
        if (filters.uid && !row.uid.includes(filters.uid)) return false;
        if (filters.vipLevel !== undefined && row.vipLevel !== filters.vipLevel) {
          return false;
        }
        if (
          filters.gameType &&
          !row.breakdown.some((item) => item.gameType === filters.gameType)
        ) {
          return false;
        }
        if (filters.rolloverStatus === 'done' && !row.rolloverDone) return false;
        if (filters.rolloverStatus === 'pending' && row.rolloverDone) return false;
        if (filters.settledRange?.length === 2) {
          const settledAt = dayjs(row.settledAt);
          if (
            settledAt.isBefore(filters.settledRange[0].startOf('day')) ||
            settledAt.isAfter(filters.settledRange[1].endOf('day'))
          ) {
            return false;
          }
        }
        return true;
      }),
    [allRows, filters]
  );

  const stats = useMemo(() => {
    const totalEffectiveBet = filteredRows.reduce(
      (sum, row) => sum + row.effectiveBet,
      0
    );
    const totalCashback = filteredRows.reduce(
      (sum, row) => sum + row.cashbackAmount,
      0
    );
    const cashbackToGgr = totalEffectiveBet
      ? Math.round((totalCashback / (totalEffectiveBet * 0.03)) * 10000) / 100
      : 0;

    return {
      members: new Set(filteredRows.map((row) => row.uid)).size,
      totalEffectiveBet,
      totalCashback,
      cashbackToGgr,
      rolloverPending: filteredRows.filter((row) => !row.rolloverDone).length,
    };
  }, [filteredRows]);

  const columns: ColumnsType<CashbackReportRow> = [
    { title: '序號', dataIndex: 'id', width: 70, fixed: 'left' },
    {
      title: '玩家帳號',
      dataIndex: 'account',
      width: 150,
      fixed: 'left',
      render: (value, row) => (
        <a
          data-e2e-id={`${E2E}-table-account-${row.uid}`}
          style={{ color: '#1668dc' }}
        >
          {value}
        </a>
      ),
    },
    { title: '會員UID', dataIndex: 'uid', width: 110 },
    {
      title: 'VIP等級',
      dataIndex: 'vipLevel',
      width: 90,
      render: (value) => `V${value}`,
    },
    {
      title: '有效投注金額',
      dataIndex: 'effectiveBet',
      width: 150,
      align: 'right',
      render: formatCurrency,
    },
    {
      title: '流水返利金額',
      dataIndex: 'cashbackAmount',
      width: 150,
      align: 'right',
      render: formatCurrency,
    },
    {
      title: '打碼要求',
      dataIndex: 'rolloverRequired',
      width: 140,
      align: 'right',
      render: formatCurrency,
    },
    {
      title: '打碼進度',
      dataIndex: 'rolloverProgress',
      width: 140,
      align: 'right',
      render: formatCurrency,
    },
    {
      title: '打碼狀態',
      dataIndex: 'rolloverDone',
      width: 110,
      render: (done, row) => (
        <Text
          data-e2e-id={`${E2E}-table-rollover-status-${row.id}`}
          style={{ color: done ? '#52c41a' : '#fa8c16' }}
        >
          {done ? '已達標' : '未達標'}
        </Text>
      ),
    },
    { title: '結算時間', dataIndex: 'settledAt', width: 180 },
  ];

  const detailColumns: ColumnsType<CashbackBreakdownRow> = [
    { title: '遊戲類型', dataIndex: 'gameType', width: 110 },
    {
      title: '有效投注額',
      dataIndex: 'effectiveBet',
      width: 140,
      align: 'right',
      render: formatCurrency,
    },
    {
      title: '返利率',
      dataIndex: 'rate',
      width: 100,
      align: 'right',
      render: (value) => `${value}%`,
    },
    {
      title: '返利金額',
      dataIndex: 'cashback',
      width: 130,
      align: 'right',
      render: formatCurrency,
    },
    {
      title: '打碼倍數',
      dataIndex: 'multiplier',
      width: 110,
      align: 'right',
      render: (value) => `${value} 倍`,
    },
    {
      title: '該類型打碼要求',
      dataIndex: 'rolloverForType',
      width: 160,
      align: 'right',
      render: formatCurrency,
    },
  ];

  const handleReset = () => {
    form.resetFields();
    setFilters({});
  };

  return (
    <div data-e2e-id={`${E2E}-page`}>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, color: '#e8e8e8' }}>
          投注返利報表
        </Title>
        <Text type="secondary">投注返利（Cashback）派發與打碼追蹤</Text>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          style={{ gap: 12, flexWrap: 'wrap', rowGap: 12 }}
        >
          <Form.Item name="account" label="會員帳號">
            <Input
              data-e2e-id={`${E2E}-filter-account-input`}
              placeholder="輸入帳號"
              allowClear
              style={{ width: 140 }}
            />
          </Form.Item>
          <Form.Item name="uid" label="會員UID">
            <Input
              data-e2e-id={`${E2E}-filter-uid-input`}
              placeholder="輸入 UID"
              allowClear
              style={{ width: 130 }}
            />
          </Form.Item>
          <Form.Item name="vipLevel" label="VIP等級">
            <Select
              data-e2e-id={`${E2E}-filter-vip-level-select`}
              placeholder="全部"
              allowClear
              style={{ width: 100 }}
              options={Array.from({ length: 31 }, (_, value) => ({
                value,
                label: `V${value}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="gameType" label="遊戲類型">
            <Select
              data-e2e-id={`${E2E}-filter-game-type-select`}
              placeholder="全部"
              allowClear
              style={{ width: 120 }}
              options={GAME_TYPES.map((value) => ({ value, label: value }))}
            />
          </Form.Item>
          <Form.Item name="rolloverStatus" label="打碼狀態">
            <Select
              data-e2e-id={`${E2E}-filter-rollover-status-select`}
              placeholder="全部"
              allowClear
              style={{ width: 120 }}
              options={[
                { value: 'pending', label: '未達標' },
                { value: 'done', label: '已達標' },
              ]}
            />
          </Form.Item>
          <Form.Item name="settledRange" label="結算時間">
            <RangePicker
              data-e2e-id={`${E2E}-filter-settled-range`}
              style={{ width: 260 }}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                data-e2e-id={`${E2E}-filter-query-btn`}
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => setFilters(form.getFieldsValue())}
              >
                查詢
              </Button>
              <Button
                data-e2e-id={`${E2E}-filter-reset-btn`}
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={5}>
          <Card>
            <Statistic
              data-e2e-id={`${E2E}-summary-members`}
              title="涉及會員數"
              value={stats.members}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              data-e2e-id={`${E2E}-summary-effective-bet`}
              title="總有效投注"
              value={stats.totalEffectiveBet}
              prefix="₱"
              precision={2}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              data-e2e-id={`${E2E}-summary-cashback`}
              title="總返利"
              value={stats.totalCashback}
              prefix="₱"
              precision={2}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              data-e2e-id={`${E2E}-summary-cashback-ggr-ratio`}
              title="返利佔 GGR 比（模擬）"
              value={stats.cashbackToGgr}
              suffix="%"
              precision={2}
              valueStyle={{ color: '#1668dc' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              data-e2e-id={`${E2E}-summary-rollover-pending`}
              title="打碼未達標筆數"
              value={stats.rolloverPending}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button
            data-e2e-id={`${E2E}-toolbar-export-btn`}
            icon={<DownloadOutlined />}
            onClick={() => downloadCsv(filteredRows)}
          >
            導出 Excel
          </Button>
        </div>
        <Table
          data-e2e-id={`${E2E}-table`}
          columns={columns}
          dataSource={filteredRows}
          rowKey="id"
          size="small"
          scroll={{ x: 1390 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 筆`,
          }}
          onRow={(record) =>
            ({
              'data-e2e-id': `${E2E}-table-row-${record.id}`,
              onClick: () => setSelectedRow(record),
              style: { cursor: 'pointer' },
            } as React.HTMLAttributes<HTMLTableRowElement>)
          }
        />
      </Card>

      <Drawer
        data-e2e-id={`${E2E}-detail-drawer`}
        title={selectedRow ? `返利明細 — ${selectedRow.account}` : '返利明細'}
        open={Boolean(selectedRow)}
        onClose={() => setSelectedRow(null)}
        width={860}
      >
        <Table
          data-e2e-id={`${E2E}-detail-table`}
          columns={detailColumns}
          dataSource={selectedRow?.breakdown ?? []}
          rowKey="gameType"
          size="small"
          pagination={false}
          scroll={{ x: 750 }}
          onRow={(record) =>
            ({
              'data-e2e-id': `${E2E}-detail-row-${record.gameType}`,
            } as React.HTMLAttributes<HTMLTableRowElement>)
          }
        />
      </Drawer>
    </div>
  );
}

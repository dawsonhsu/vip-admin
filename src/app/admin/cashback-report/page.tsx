'use client';

import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
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
import {
  generateCashbackReport,
  type CashbackBreakdownRow,
  type CashbackReportRow,
} from '@/data/cashbackReportData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const E2E = 'cashback-report';

interface ReportFilters {
  account?: string;
  uid?: string;
  phone?: string;
  vipLevel?: number;
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
      '手機號',
      'VIP等級',
      '統計日期',
      '有效投注金額',
      '流水返利金額',
      '打碼要求',
      '結算時間',
    ],
    ...rows.map((row) => [
      row.id,
      row.account,
      row.uid,
      row.phone,
      `V${row.vipLevel}`,
      row.statDate,
      row.effectiveBet.toFixed(2),
      row.cashbackAmount.toFixed(2),
      row.rolloverRequired.toFixed(2),
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
  const [allRows] = useState(() => generateCashbackReport());
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
        if (filters.phone && !row.phone.includes(filters.phone)) return false;
        if (filters.vipLevel !== undefined && row.vipLevel !== filters.vipLevel) {
          return false;
        }
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

    return {
      members: new Set(filteredRows.map((row) => row.uid)).size,
      totalEffectiveBet,
      totalCashback,
    };
  }, [filteredRows]);

  const columns: ColumnsType<CashbackReportRow> = [
    { title: '序號', dataIndex: 'id', width: 70, fixed: 'left' },
    {
      title: '玩家帳號',
      dataIndex: 'account',
      width: 140,
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
    { title: '會員UID', dataIndex: 'uid', width: 100 },
    { title: '手機號', dataIndex: 'phone', width: 130 },
    {
      title: 'VIP等級',
      dataIndex: 'vipLevel',
      width: 90,
      render: (value) => `V${value}`,
    },
    { title: '統計日期', dataIndex: 'statDate', width: 120 },
    {
      title: '有效投注金額',
      dataIndex: 'effectiveBet',
      width: 140,
      align: 'right',
      render: formatCurrency,
    },
    {
      title: '流水返利金額',
      dataIndex: 'cashbackAmount',
      width: 140,
      align: 'right',
      render: formatCurrency,
    },
    {
      title: '打碼要求',
      dataIndex: 'rolloverRequired',
      width: 130,
      align: 'right',
      render: formatCurrency,
    },
    { title: '結算時間', dataIndex: 'settledAt', width: 170 },
    {
      title: '操作',
      key: 'action',
      width: 90,
      fixed: 'right',
      render: (_, row) => (
        <Button
          data-e2e-id={`${E2E}-table-detail-btn-${row.id}`}
          type="link"
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedRow(row);
          }}
        >
          明細
        </Button>
      ),
    },
  ];

  const detailColumns: ColumnsType<CashbackBreakdownRow> = [
    {
      title: '命中規則',
      dataIndex: 'ruleTier',
      width: 110,
      render: (value: CashbackBreakdownRow['ruleTier']) =>
        value === 'game' ? '指定遊戲' : '遊戲類型',
    },
    {
      title: '統計對象',
      key: 'target',
      width: 200,
      render: (_, row) =>
        row.ruleTier === 'game' ? (
          <div>
            <div>{row.groupName}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {`${row.gameType} · ${(row.groupGames ?? []).join('、')}`}
            </Text>
          </div>
        ) : (
          row.gameType
        ),
    },
    {
      title: '起始有效投注額',
      dataIndex: 'minEffectiveBet',
      width: 130,
      align: 'right',
      render: (value: number) => (value > 0 ? formatCurrency(value) : '不設門檻'),
    },
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
      title: '返利金額（封頂前）',
      dataIndex: 'cashbackBeforeCap',
      width: 150,
      align: 'right',
      render: formatCurrency,
    },
    {
      title: '返利上限',
      dataIndex: 'cap',
      width: 130,
      align: 'right',
      render: (value: number) => (value > 0 ? formatCurrency(value) : '不限'),
    },
    {
      title: '實派返利金額',
      dataIndex: 'cashback',
      width: 170,
      align: 'right',
      render: (value: number, row) => (
        <>
          {formatCurrency(value)}
          {row.capped ? (
            <Text style={{ color: '#fa8c16' }}>（已封頂）</Text>
          ) : null}
        </>
      ),
    },
    {
      title: '打碼倍數',
      dataIndex: 'multiplier',
      width: 110,
      align: 'right',
      render: (value) => `${value} 倍`,
    },
    {
      title: '該規則打碼要求',
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
        <Text type="secondary">投注返利（Cashback）派發明細（每會員每日一筆）</Text>
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
          <Form.Item name="phone" label="手機號">
            <Input
              data-e2e-id={`${E2E}-filter-phone-input`}
              placeholder="輸入手機號"
              allowClear
              style={{ width: 150 }}
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
        <Col span={8}>
          <Card>
            <Statistic
              data-e2e-id={`${E2E}-summary-members`}
              title="不重複人數"
              value={stats.members}
            />
          </Card>
        </Col>
        <Col span={8}>
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
        <Col span={8}>
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
          scroll={{ x: 1320 }}
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
        title={
          selectedRow
            ? `返利明細 — ${selectedRow.account}（${selectedRow.statDate}）`
            : '返利明細'
        }
        open={Boolean(selectedRow)}
        onClose={() => setSelectedRow(null)}
        width={1320}
      >
        {selectedRow ? (
          <Descriptions
            data-e2e-id={`${E2E}-detail-descriptions`}
            size="small"
            column={4}
            bordered
            style={{ marginBottom: 16 }}
          >
            <Descriptions.Item label="玩家帳號">
              {selectedRow.account}
            </Descriptions.Item>
            <Descriptions.Item label="手機號">{selectedRow.phone}</Descriptions.Item>
            <Descriptions.Item label="VIP等級">
              {`V${selectedRow.vipLevel}`}
            </Descriptions.Item>
            <Descriptions.Item label="統計日期">
              {selectedRow.statDate}
            </Descriptions.Item>
            <Descriptions.Item label="結算時間">
              {selectedRow.settledAt}
            </Descriptions.Item>
            <Descriptions.Item label="實派返利總額">
              {formatCurrency(selectedRow.cashbackAmount)}
            </Descriptions.Item>
            <Descriptions.Item label="指定遊戲返利小計">
              {formatCurrency(selectedRow.gameRuleCashback)}
            </Descriptions.Item>
            <Descriptions.Item label="遊戲類型返利小計">
              {formatCurrency(selectedRow.typeRuleCashback)}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
        <Table
          data-e2e-id={`${E2E}-detail-table`}
          columns={detailColumns}
          dataSource={selectedRow?.breakdown ?? []}
          rowKey="key"
          size="small"
          pagination={false}
          scroll={{ x: 1400 }}
          onRow={(record) =>
            ({
              'data-e2e-id': `${E2E}-detail-row-${record.key}`,
            } as React.HTMLAttributes<HTMLTableRowElement>)
          }
        />
      </Drawer>
    </div>
  );
}

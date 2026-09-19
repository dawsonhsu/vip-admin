'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button, Card, Col, DatePicker, Form, Input, Row, Space, Table, Tooltip, Typography, message,
} from 'antd';
import { DownloadOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { buildAgencyReportRows, type AgencyReportRow } from '@/data/agency/adminBridge';
import { downloadCsv, toCsvCell } from '@/lib/agencyUtils';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

interface FilterValues {
  username?: string;
  dateRange: [Dayjs, Dayjs];
}

interface ReportSummary extends AgencyReportRow {
  key: string;
  label: string;
  agentCount: number;
}

const currentMonth = (): [Dayjs, Dayjs] => [dayjs().startOf('month'), dayjs().endOf('month')];
const formatInteger = (value: number) => value.toLocaleString('en-US');
const formatAmount = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const averageFirstDeposit = (row: Pick<AgencyReportRow, 'firstDepositUsers' | 'firstDepositAmount'>) => (
  row.firstDepositUsers === 0 ? null : row.firstDepositAmount / row.firstDepositUsers
);
const registrationConversion = (row: Pick<AgencyReportRow, 'registrationUsers' | 'firstDepositUsers'>) => (
  row.registrationUsers === 0 ? null : row.firstDepositUsers / row.registrationUsers * 100
);
const renderSigned = (value: number) => (
  <span style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>{formatAmount(value)}</span>
);
const newTitle = (title: string) => (
  <span>{title}<Tooltip title="本期新增欄位"><Text type="secondary">＊</Text></Tooltip></span>
);

const sumRows = (rows: AgencyReportRow[], key: string, label: string): ReportSummary => {
  const moneyKeys = [
    'firstDepositAmount', 'depositAmount', 'withdrawAmount', 'depositWithdrawDiff', 'validBet', 'ggr', 'bonus', 'ngr',
  ] as const;
  const cents = Object.fromEntries(moneyKeys.map((field) => [field, 0])) as Record<(typeof moneyKeys)[number], number>;
  const total = rows.reduce<ReportSummary>((result, row) => {
    moneyKeys.forEach((field) => { cents[field] += Math.round(row[field] * 100); });
    result.memberCount += row.memberCount;
    result.registrationUsers += row.registrationUsers;
    result.loginUsers += row.loginUsers;
    result.firstDepositUsers += row.firstDepositUsers;
    result.depositUsers += row.depositUsers;
    result.depositCount += row.depositCount;
    result.withdrawUsers += row.withdrawUsers;
    result.withdrawCount += row.withdrawCount;
    result.betUsers += row.betUsers;
    return result;
  }, {
    key, label, uid: key, username: label, agentCount: rows.length,
    memberCount: 0, registrationUsers: 0, loginUsers: 0, firstDepositUsers: 0, firstDepositAmount: 0,
    depositUsers: 0, depositCount: 0, depositAmount: 0, withdrawUsers: 0, withdrawCount: 0,
    withdrawAmount: 0, depositWithdrawDiff: 0, betUsers: 0, validBet: 0, ggr: 0, bonus: 0, ngr: 0,
  });
  moneyKeys.forEach((field) => { total[field] = cents[field] / 100; });
  return total;
};

const numericColumns = (withSort: boolean): ColumnsType<AgencyReportRow> => [
  {
    title: newTitle('累積會員總數'), dataIndex: 'memberCount', key: 'memberCount', width: 140, align: 'right',
    ...(withSort ? { sorter: (a: AgencyReportRow, b: AgencyReportRow) => a.memberCount - b.memberCount } : {}), render: formatInteger,
  },
  { title: '註冊人數', dataIndex: 'registrationUsers', key: 'registrationUsers', width: 110, align: 'right', ...(withSort ? { sorter: (a: AgencyReportRow, b: AgencyReportRow) => a.registrationUsers - b.registrationUsers } : {}), render: formatInteger },
  { title: '登入人數', dataIndex: 'loginUsers', key: 'loginUsers', width: 110, align: 'right', ...(withSort ? { sorter: (a: AgencyReportRow, b: AgencyReportRow) => a.loginUsers - b.loginUsers } : {}), render: formatInteger },
  { title: '首存人數', dataIndex: 'firstDepositUsers', key: 'firstDepositUsers', width: 110, align: 'right', ...(withSort ? { sorter: (a: AgencyReportRow, b: AgencyReportRow) => a.firstDepositUsers - b.firstDepositUsers } : {}), render: formatInteger },
  { title: '首存金額', dataIndex: 'firstDepositAmount', key: 'firstDepositAmount', width: 130, align: 'right', ...(withSort ? { sorter: (a: AgencyReportRow, b: AgencyReportRow) => a.firstDepositAmount - b.firstDepositAmount } : {}), render: formatAmount },
  {
    title: '人均首存', key: 'averageFirstDeposit', width: 130, align: 'right',
    ...(withSort ? { sorter: (a: AgencyReportRow, b: AgencyReportRow) => (averageFirstDeposit(a) ?? -1) - (averageFirstDeposit(b) ?? -1) } : {}),
    render: (_value: unknown, row: AgencyReportRow) => averageFirstDeposit(row) === null ? '-' : formatAmount(averageFirstDeposit(row)!),
  },
  {
    title: '註充率', key: 'registrationConversion', width: 100, align: 'right',
    ...(withSort ? { sorter: (a: AgencyReportRow, b: AgencyReportRow) => (registrationConversion(a) ?? -1) - (registrationConversion(b) ?? -1) } : {}),
    render: (_value: unknown, row: AgencyReportRow) => registrationConversion(row) === null ? '-' : `${registrationConversion(row)!.toFixed(2)}%`,
  },
  { title: '存款人數', dataIndex: 'depositUsers', key: 'depositUsers', width: 110, align: 'right', ...(withSort ? { sorter: (a: AgencyReportRow, b: AgencyReportRow) => a.depositUsers - b.depositUsers } : {}), render: formatInteger },
  { title: '存款次數', dataIndex: 'depositCount', key: 'depositCount', width: 110, align: 'right', ...(withSort ? { sorter: (a: AgencyReportRow, b: AgencyReportRow) => a.depositCount - b.depositCount } : {}), render: formatInteger },
  { title: '存款金額', dataIndex: 'depositAmount', key: 'depositAmount', width: 130, align: 'right', ...(withSort ? { sorter: (a: AgencyReportRow, b: AgencyReportRow) => a.depositAmount - b.depositAmount } : {}), render: formatAmount },
  { title: '提款人數', dataIndex: 'withdrawUsers', key: 'withdrawUsers', width: 110, align: 'right', ...(withSort ? { sorter: (a: AgencyReportRow, b: AgencyReportRow) => a.withdrawUsers - b.withdrawUsers } : {}), render: formatInteger },
  { title: '提款次數', dataIndex: 'withdrawCount', key: 'withdrawCount', width: 110, align: 'right', ...(withSort ? { sorter: (a: AgencyReportRow, b: AgencyReportRow) => a.withdrawCount - b.withdrawCount } : {}), render: formatInteger },
  { title: '提款金額', dataIndex: 'withdrawAmount', key: 'withdrawAmount', width: 130, align: 'right', ...(withSort ? { sorter: (a: AgencyReportRow, b: AgencyReportRow) => a.withdrawAmount - b.withdrawAmount } : {}), render: formatAmount },
  { title: '存提差', dataIndex: 'depositWithdrawDiff', key: 'depositWithdrawDiff', width: 130, align: 'right', ...(withSort ? { sorter: (a: AgencyReportRow, b: AgencyReportRow) => a.depositWithdrawDiff - b.depositWithdrawDiff } : {}), render: renderSigned },
  { title: newTitle('投注人數'), dataIndex: 'betUsers', key: 'betUsers', width: 120, align: 'right', ...(withSort ? { sorter: (a: AgencyReportRow, b: AgencyReportRow) => a.betUsers - b.betUsers } : {}), render: formatInteger },
  { title: newTitle('有效投注'), dataIndex: 'validBet', key: 'validBet', width: 130, align: 'right', ...(withSort ? { sorter: (a: AgencyReportRow, b: AgencyReportRow) => a.validBet - b.validBet } : {}), render: formatAmount },
  { title: newTitle('GGR'), dataIndex: 'ggr', key: 'ggr', width: 130, align: 'right', ...(withSort ? { sorter: (a: AgencyReportRow, b: AgencyReportRow) => a.ggr - b.ggr } : {}), render: renderSigned },
  { title: newTitle('Bonus'), dataIndex: 'bonus', key: 'bonus', width: 130, align: 'right', ...(withSort ? { sorter: (a: AgencyReportRow, b: AgencyReportRow) => a.bonus - b.bonus } : {}), render: formatAmount },
  { title: newTitle('NGR'), dataIndex: 'ngr', key: 'ngr', width: 130, align: 'right', ...(withSort ? { sorter: (a: AgencyReportRow, b: AgencyReportRow) => a.ngr - b.ngr } : {}), render: renderSigned },
];

export default function AgencyReportPage() {
  const router = useRouter();
  const [form] = Form.useForm<FilterValues>();
  const [filters, setFilters] = useState<FilterValues | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  // 表格排序後的完整結果；小計必須取自「排序後」的當頁，否則排序翻頁時小計與畫面不符。
  const [sortedRows, setSortedRows] = useState<AgencyReportRow[] | null>(null);

  useEffect(() => {
    const dateRange = currentMonth();
    form.setFieldsValue({ dateRange });
    setFilters({ dateRange });
  }, [form]);

  const startDate = filters?.dateRange[0].format('YYYY-MM-DD') ?? '';
  const endDate = filters?.dateRange[1].format('YYYY-MM-DD') ?? '';
  const allRows = useMemo(() => filters ? buildAgencyReportRows(startDate, endDate) : [], [endDate, filters, startDate]);
  const filteredRows = useMemo(() => {
    const keyword = filters?.username?.trim().toLowerCase();
    return keyword ? allRows.filter((row) => row.username.toLowerCase().includes(keyword)) : allRows;
  }, [allRows, filters?.username]);
  useEffect(() => { setSortedRows(null); }, [filteredRows]);
  const pageRows = useMemo(() => {
    const offset = (pagination.current - 1) * pagination.pageSize;
    return (sortedRows ?? filteredRows).slice(offset, offset + pagination.pageSize);
  }, [filteredRows, pagination, sortedRows]);
  const summaries = useMemo(() => [
    sumRows(pageRows, 'page', '小計'),
    sumRows(filteredRows, 'all', '總計'),
  ], [filteredRows, pageRows]);

  const search = (values: FilterValues) => {
    if (values.dateRange[1].startOf('day').diff(values.dateRange[0].startOf('day'), 'day') + 1 > 90) {
      void message.error('統計時間最長為 90 天');
      return;
    }
    setFilters({ username: values.username?.trim() || undefined, dateRange: values.dateRange });
    setPagination((current) => ({ ...current, current: 1 }));
  };
  const reset = () => {
    const dateRange = currentMonth();
    form.setFieldsValue({ username: undefined, dateRange });
    setFilters({ dateRange });
    setPagination((current) => ({ ...current, current: 1 }));
  };
  const onExport = () => {
    const lines = [
      ['代理帳號', '累積會員總數', '註冊人數', '登入人數', '首存人數', '首存金額', '人均首存', '註充率', '存款人數', '存款次數', '存款金額', '提款人數', '提款次數', '提款金額', '存提差', '投注人數', '有效投注', 'GGR', 'Bonus', 'NGR'],
      ...filteredRows.map((row) => [
        row.username, String(row.memberCount), String(row.registrationUsers), String(row.loginUsers), String(row.firstDepositUsers),
        formatAmount(row.firstDepositAmount), averageFirstDeposit(row) === null ? '-' : formatAmount(averageFirstDeposit(row)!),
        registrationConversion(row) === null ? '-' : `${registrationConversion(row)!.toFixed(2)}%`,
        String(row.depositUsers), String(row.depositCount), formatAmount(row.depositAmount), String(row.withdrawUsers),
        String(row.withdrawCount), formatAmount(row.withdrawAmount), formatAmount(row.depositWithdrawDiff), String(row.betUsers),
        formatAmount(row.validBet), formatAmount(row.ggr), formatAmount(row.bonus), formatAmount(row.ngr),
      ]),
    ];
    downloadCsv(`代理統計報表_${startDate}_${endDate}.csv`, lines.map((line) => line.map(toCsvCell).join(',')).join('\n'));
  };

  const columns: ColumnsType<AgencyReportRow> = [
    {
      title: '代理帳號', dataIndex: 'username', key: 'username', width: 150, fixed: 'left',
      sorter: (a, b) => a.username.localeCompare(b.username),
      render: (value: string) => (
        <a
          data-e2e-id={`agency-report-table-agent-link-${value}`}
          onClick={() => router.push(`/admin/member-stats?agent=${encodeURIComponent(value)}&start=${startDate}&end=${endDate}`)}
        >{value}</a>
      ),
    },
    ...numericColumns(true),
  ];
  const summaryColumns: ColumnsType<ReportSummary> = [
    { title: '類型', dataIndex: 'label', key: 'label', width: 70, fixed: 'left' },
    { title: '代理數', dataIndex: 'agentCount', key: 'agentCount', width: 90, align: 'right', render: formatInteger },
    ...(numericColumns(false) as ColumnsType<ReportSummary>),
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Title level={4} style={{ margin: 0 }}>代理統計報表</Title>

      <Card size="small" data-e2e-id="agency-report-filter-card">
        <Form form={form} layout="vertical" onFinish={search}>
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item label="代理帳號" name="username">
                <Input data-e2e-id="agency-report-filter-agent-input" placeholder="輸入代理帳號" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Form.Item label="統計時間" name="dateRange" rules={[{ required: true, message: '請選擇統計時間' }]}>
                <RangePicker data-e2e-id="agency-report-filter-date-range" style={{ width: '100%' }} allowClear={false} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label=" ">
                <Space>
                  <Button data-e2e-id="agency-report-filter-query-btn" type="primary" icon={<SearchOutlined />} htmlType="submit">查詢</Button>
                  <Button data-e2e-id="agency-report-filter-reset-btn" icon={<ReloadOutlined />} onClick={reset}>重置</Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card size="small" title="統計" data-e2e-id="agency-report-summary-card">
        <Table<ReportSummary>
          dataSource={summaries} columns={summaryColumns} pagination={false} size="small" rowKey="key" scroll={{ x: 'max-content' }}
          onRow={(record) => ({ 'data-e2e-id': `agency-report-summary-${record.key}` } as React.HTMLAttributes<HTMLTableRowElement>)}
        />
      </Card>

      <Card size="small" data-e2e-id="agency-report-table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>代理統計報表 <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>示範資料</Text></Title>
          <Button type="primary" icon={<DownloadOutlined />} onClick={onExport} disabled={!filters} data-e2e-id="agency-report-toolbar-export-btn">匯出 CSV</Button>
        </div>
        <Table<AgencyReportRow>
          data-e2e-id="agency-report-table"
          rowKey="uid" dataSource={filteredRows} columns={columns} scroll={{ x: 'max-content' }} size="small"
          onRow={(record) => ({ 'data-e2e-id': `agency-report-table-row-${record.uid}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          pagination={{ ...pagination, total: filteredRows.length, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'], showTotal: (total) => `共 ${total} 筆` }}
          onChange={(next, _tableFilters, _sorter, extra) => {
            setPagination({ current: next.current ?? 1, pageSize: next.pageSize ?? 20 });
            setSortedRows(extra.currentDataSource);
          }}
        />
      </Card>
    </Space>
  );
}

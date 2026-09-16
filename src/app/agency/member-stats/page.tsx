'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, DatePicker, Drawer, Form, Input, Row, Select, Space, Table, Typography } from 'antd';
import { DownloadOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import {
  agencyMemberDailyStats, aggregateAgencyMemberStats, sumAgencyMemberStats,
  type AgencyMemberDailyStat, type AgencyMemberMetrics, type AgencyMemberStat,
} from '@/data/agency/memberStats';
import { agencyRangeOf, downloadCsv, formatCount, formatPeso, maskPhone, toCsvCell } from '@/lib/agencyUtils';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
type MemberSearchType = '手機號' | '帳號' | 'UID';
type StatSortKey = keyof AgencyMemberStat | 'dateRange';
interface FilterValues {
  searchValue?: string;
  dateRange: [Dayjs, Dayjs];
}
interface Filters extends FilterValues {
  searchType: MemberSearchType;
}

const metrics: Array<{ key: keyof AgencyMemberMetrics; title: string; count?: boolean; signed?: boolean }> = [
  { key: 'depositCount', title: '存款次數', count: true },
  { key: 'totalDeposit', title: '總存款' },
  { key: 'withdrawCount', title: '提款次數', count: true },
  { key: 'totalWithdraw', title: '總提款' },
  { key: 'depositFee', title: '存款手續費' },
  { key: 'withdrawFee', title: '提款手續費' },
  { key: 'totalBet', title: '總投注' },
  { key: 'excludedBet', title: '排除投注額' },
  { key: 'validBet', title: '有效流水' },
  { key: 'totalPayout', title: '總派獎' },
  { key: 'ggr', title: 'GGR', signed: true },
  { key: 'fsBet', title: 'FS 投注額' },
  { key: 'fsGgr', title: 'FS GGR', signed: true },
  { key: 'jpBet', title: 'JP 投注額' },
  { key: 'jpGgr', title: 'JP GGR', signed: true },
  { key: 'totalBonus', title: '總彩金' },
  { key: 'totalCommission', title: '總佣金' },
];

function metricColumns<T extends AgencyMemberMetrics>(sortable = true): ColumnsType<T> {
  return metrics.map(({ key, title, count, signed }) => ({
    title, key, dataIndex: key, width: 130, align: 'right',
    ...(sortable ? { sorter: (a: T, b: T) => a[key] - b[key] } : {}),
    render: (value: number) => count ? formatCount(value) : signed ? (
      <span style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>{formatPeso(value)}</span>
    ) : formatPeso(value),
  }));
}

export default function AgencyMemberStatsPage() {
  const [form] = Form.useForm<FilterValues>();
  const [searchType, setSearchType] = useState<MemberSearchType>('手機號');
  const [filters, setFilters] = useState<Filters | null>(null);
  const [dailyRows, setDailyRows] = useState<AgencyMemberDailyStat[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [sort, setSort] = useState<{ key: StatSortKey; order: 'ascend' | 'descend' } | null>(null);
  const [drawerTarget, setDrawerTarget] = useState<AgencyMemberStat | null>(null);

  useEffect(() => {
    const dateRange = agencyRangeOf('month');
    form.setFieldsValue({ dateRange });
    setFilters({ searchType: '手機號', dateRange });
    setDailyRows(agencyMemberDailyStats());
  }, [form]);

  const queryStart = filters?.dateRange[0].format('YYYY-MM-DD') ?? '';
  const queryEnd = filters?.dateRange[1].format('YYYY-MM-DD') ?? '';
  const dateRangeText = `${queryStart} ~ ${queryEnd}`;
  const filteredRows = useMemo(() => dailyRows.filter((row) => {
    if (!filters || row.date < queryStart || row.date > queryEnd) return false;
    const value = filters.searchValue?.trim().toLowerCase();
    if (!value) return true;
    const field = filters.searchType === '手機號' ? row.phone : filters.searchType === '帳號' ? row.username : row.uid;
    return field.toLowerCase().includes(value);
  }), [dailyRows, filters, queryStart, queryEnd]);
  const aggregatedRows = useMemo(() => aggregateAgencyMemberStats(filteredRows), [filteredRows]);
  const sortedRows = useMemo(() => {
    if (!sort || sort.key === 'dateRange') return aggregatedRows;
    const key = sort.key;
    return [...aggregatedRows].sort((a, b) => {
      const left = a[key];
      const right = b[key];
      const compared = typeof left === 'number' && typeof right === 'number'
        ? left - right : String(left).localeCompare(String(right));
      return compared * (sort.order === 'ascend' ? 1 : -1);
    });
  }, [aggregatedRows, sort]);
  const pagedRows = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    return sortedRows.slice(start, start + pagination.pageSize);
  }, [sortedRows, pagination]);
  const summaryRows = useMemo(() => [
    { key: 'page', label: '小計', memberCount: pagedRows.length, ...sumAgencyMemberStats(pagedRows) },
    { key: 'all', label: '總計', memberCount: aggregatedRows.length, ...sumAgencyMemberStats(aggregatedRows) },
  ], [pagedRows, aggregatedRows]);
  const detailRows = useMemo(() => filteredRows.filter((row) => row.uid === drawerTarget?.uid)
    .sort((a, b) => b.date.localeCompare(a.date)), [drawerTarget, filteredRows]);

  const search = (values: FilterValues) => {
    setFilters({ searchType, searchValue: values.searchValue?.trim(), dateRange: values.dateRange });
    setPagination((current) => ({ ...current, current: 1 }));
    setDrawerTarget(null);
  };
  const reset = () => {
    const dateRange = agencyRangeOf('month');
    form.setFieldsValue({ searchValue: undefined, dateRange });
    setSearchType('手機號');
    setFilters({ searchType: '手機號', dateRange });
    setPagination((current) => ({ ...current, current: 1 }));
    setDrawerTarget(null);
  };
  const onExport = () => {
    const lines = [
      ['統計日期', 'UID', '帳號', '手機號', ...metrics.map(({ title }) => title)],
      ...sortedRows.map((row) => [
        dateRangeText, row.uid, row.username, maskPhone(row.phone),
        ...metrics.map(({ key, count }) => count ? String(row[key]) : formatPeso(row[key])),
      ]),
    ];
    downloadCsv(`會員日統計_${queryStart}_${queryEnd}.csv`, lines.map((line) => line.map(toCsvCell).join(',')).join('\n'));
  };

  const columns: ColumnsType<AgencyMemberStat> = [
    { title: '統計日期', key: 'dateRange', width: 240, ellipsis: true, sorter: () => 0, render: () => <span style={{ whiteSpace: 'nowrap' }}>{dateRangeText}</span> },
    { title: 'UID', key: 'uid', dataIndex: 'uid', width: 110, sorter: (a, b) => a.uid.localeCompare(b.uid) },
    {
      title: '帳號', key: 'username', dataIndex: 'username', width: 140,
      sorter: (a, b) => a.username.localeCompare(b.username),
      render: (_, record) => <a data-e2e-id={`agency-member-stats-table-member-link-${record.uid}`} onClick={() => setDrawerTarget(record)}>{record.username}</a>,
    },
    { title: '手機號', key: 'phone', dataIndex: 'phone', width: 140, sorter: (a, b) => a.phone.localeCompare(b.phone), render: (value: string) => maskPhone(value) },
    ...metricColumns<AgencyMemberStat>(),
    {
      title: '操作', key: 'action', width: 100, fixed: 'right',
      render: (_, record) => <Button data-e2e-id={`agency-member-stats-table-detail-btn-${record.uid}`} size="small" onClick={() => setDrawerTarget(record)}>查看</Button>,
    },
  ];
  const summaryColumns: ColumnsType<(typeof summaryRows)[number]> = [
    { title: '類型', dataIndex: 'label', width: 60 },
    { title: '總人數', dataIndex: 'memberCount', width: 90, align: 'right', render: formatCount },
    ...metricColumns<(typeof summaryRows)[number]>(false),
  ];
  const detailColumns: ColumnsType<AgencyMemberDailyStat> = [
    { title: '統計日期', dataIndex: 'date', width: 120, sorter: (a, b) => a.date.localeCompare(b.date), defaultSortOrder: 'descend' },
    ...metricColumns<AgencyMemberDailyStat>(),
  ];
  const onTableChange: TableProps<AgencyMemberStat>['onChange'] = (next, _tableFilters, sorter) => {
    const active = Array.isArray(sorter) ? sorter[0] : sorter;
    setSort(active.order ? { key: active.columnKey as StatSortKey, order: active.order } : null);
    setPagination({ current: next.current ?? 1, pageSize: next.pageSize ?? 20 });
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card size="small" data-e2e-id="agency-member-stats-filter-card">
        <Form form={form} layout="vertical" onFinish={search}>
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item name="searchValue" label={
                <Select
                  data-e2e-id="agency-member-stats-filter-search-type-select"
                  value={searchType}
                  onChange={(value) => { setSearchType(value); form.setFieldValue('searchValue', undefined); }}
                  variant="borderless" size="small" style={{ width: 88 }}
                  options={['手機號', '帳號', 'UID'].map((value) => ({ label: value, value }))}
                />
              }>
                <Input data-e2e-id="agency-member-stats-filter-search-value-input" placeholder={`輸入${searchType}`} allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Form.Item label="統計時間" name="dateRange" rules={[{ required: true, message: '請選擇統計時間' }]}>
                <RangePicker data-e2e-id="agency-member-stats-filter-date-range" style={{ width: '100%' }} allowClear={false} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label=" ">
                <Space>
                  <Button data-e2e-id="agency-member-stats-filter-query-btn" type="primary" icon={<SearchOutlined />} htmlType="submit" disabled={!filters}>查詢</Button>
                  <Button data-e2e-id="agency-member-stats-filter-reset-btn" icon={<ReloadOutlined />} onClick={reset}>重置</Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card size="small" title="統計" data-e2e-id="agency-member-stats-summary-card">
        <Table
          dataSource={summaryRows} columns={summaryColumns} pagination={false} size="small" rowKey="key" scroll={{ x: 'max-content' }}
          onRow={(record) => ({ 'data-e2e-id': `agency-member-stats-summary-${record.key}` } as React.HTMLAttributes<HTMLTableRowElement>)}
        />
      </Card>

      <Card size="small" data-e2e-id="agency-member-stats-table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>會員日統計 <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>示範資料</Text></Title>
          <Button type="primary" icon={<DownloadOutlined />} onClick={onExport} disabled={!filters} data-e2e-id="agency-member-stats-toolbar-export-btn">匯出</Button>
        </div>
        <Table<AgencyMemberStat>
          data-e2e-id="agency-member-stats-table"
          rowKey="uid" dataSource={sortedRows}
          columns={columns.map((column) => ({ ...column, sortOrder: sort && sort.key === column.key ? sort.order : null }))}
          onChange={onTableChange}
          onRow={(record) => ({ 'data-e2e-id': `agency-member-stats-table-row-${record.uid}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          scroll={{ x: 'max-content' }} size="small"
          pagination={{ ...pagination, total: aggregatedRows.length, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'], showTotal: (total) => `共 ${total} 筆` }}
        />
      </Card>

      <Drawer
        width={1200} open={!!drawerTarget} onClose={() => setDrawerTarget(null)}
        title={drawerTarget ? `${drawerTarget.username} - 每日明細（${dateRangeText}）` : ''}
      >
        <div data-e2e-id="agency-member-stats-drawer">
          <Table<AgencyMemberDailyStat>
            key={`${drawerTarget?.uid}-${queryStart}-${queryEnd}`}
            rowKey={(record) => `${record.uid}-${record.date}`} columns={detailColumns} dataSource={detailRows}
            onRow={(record) => ({ 'data-e2e-id': `agency-member-stats-drawer-row-${record.uid}-${record.date}` } as React.HTMLAttributes<HTMLTableRowElement>)}
            scroll={{ x: 'max-content' }} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 筆` }} size="small"
          />
        </div>
      </Drawer>
    </Space>
  );
}

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Checkbox, Col, DatePicker, Dropdown, Form, Popover, Row, Select, Space, Statistic, Table, Typography } from 'antd';
import { ColumnHeightOutlined, DownloadOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import {
  ActiveMemberModal, ChildGgrModal, PagcorTaxModal, VenueFeeModal,
} from '@/components/agency/CommissionDetailModals';
import { AGENCY_COMMISSION_SEED, generateAgencyCommissions, type AgencyCommissionRow } from '@/data/agency/commission';
import { agencyAccount } from '@/data/agency/shared';
import {
  commissionStateColors, commissionStateLabels, downloadCsv, formatCount, formatPercent, formatPeso, formatTs, toCsvCell,
} from '@/lib/agencyUtils';

const { Title, Text, Link } = Typography;
type DetailKind = 'ggr' | 'active' | 'tax' | 'venue_fee';
interface CommissionFilters { month?: Dayjs | null; state?: number; settle_type?: number; reach_standard?: number }

const colorHex: Record<string, string> = { default: '#8c8c8c', geekblue: '#2f54eb', green: '#52c41a', red: '#f5222d' };
const columnSpecs: Array<{ key: keyof AgencyCommissionRow; title: string; width: number }> = [
  { key: 'id', title: '訂單ID', width: 220 },
  { key: 'settle_begin_date', title: '結算週期', width: 230 },
  { key: 'last_tax_ggr', title: '歷史 GGR 結餘', width: 165 },
  { key: 'last_profit', title: '歷史盈利結餘', width: 165 },
  { key: 'ggr', title: '本期 GGR', width: 165 },
  { key: 'active', title: '活躍會員數', width: 120 },
  { key: 'tax', title: '稅收', width: 160 },
  { key: 'venue_fee', title: '場館費', width: 160 },
  { key: 'bonus', title: '活動禮金', width: 160 },
  { key: 'tax_ggr', title: '稅後 GGR', width: 165 },
  { key: 'profit', title: '淨盈利', width: 165 },
  { key: 'percent', title: '佣金比例', width: 110 },
  { key: 'adjust', title: '校準', width: 150 },
  { key: 'amount', title: '應發金額', width: 170 },
  { key: 'state', title: '狀態', width: 130 },
  { key: 'created_at', title: '產生時間', width: 190 },
];
const moneyFields = new Set<keyof AgencyCommissionRow>(['last_tax_ggr', 'last_profit', 'ggr', 'tax', 'venue_fee', 'bonus', 'tax_ggr', 'profit', 'adjust', 'amount']);

function displayValue(row: AgencyCommissionRow, key: keyof AgencyCommissionRow): string {
  if (moneyFields.has(key)) return formatPeso(row[key]);
  if (key === 'settle_begin_date') return `${dayjs.unix(row.settle_begin_date).format('YYYY-MM-DD')} ～ ${dayjs.unix(row.settle_end_date).format('YYYY-MM-DD')}`;
  if (key === 'active') return formatCount(row.active);
  if (key === 'percent') return formatPercent(row.percent);
  if (key === 'created_at') return formatTs(row.created_at);
  if (key === 'state') return commissionStateLabels[row.state] || '未知狀態';
  return String(row[key]);
}

export default function AgencyCommissionPage() {
  const [form] = Form.useForm<CommissionFilters>();
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<CommissionFilters>({});
  const [revision, setRevision] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [density, setDensity] = useState<TableProps<AgencyCommissionRow>['size']>('small');
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [detail, setDetail] = useState<{ kind: DetailKind; row: AgencyCommissionRow } | null>(null);

  useEffect(() => {
    form.setFieldsValue({ settle_type: 2 });
    setFilters({ settle_type: 2 });
    setMounted(true);
  }, [form]);

  // 對應 GET /agency/commission/report；此展示只產生月結資料，週結查詢回傳空集合。
  const allRows = useMemo(() => mounted ? generateAgencyCommissions(AGENCY_COMMISSION_SEED) : [], [mounted, revision]);
  const rows = useMemo(() => allRows.filter((row) => {
    if (filters.month && dayjs.unix(row.settle_begin_date).format('YYYY-MM') !== filters.month.format('YYYY-MM')) return false;
    if (filters.state !== undefined && row.state !== filters.state) return false;
    if (filters.settle_type !== undefined && filters.settle_type !== agencyAccount.settle_type) return false;
    return filters.reach_standard === undefined || row.reach_standard === filters.reach_standard;
  }), [allRows, filters]);
  const totals = rows.reduce((sum, row) => {
    const amount = Math.round(Number(row.amount) * 100);
    sum.amount += amount;
    if (row.state === 2) sum.pending += amount;
    const payoutAt = dayjs.unix(row.settle_begin_date).add(1, 'month').date(5).hour(10).unix();
    if (row.state === 3 && payoutAt <= dayjs().unix()) sum.paid += amount;
    return sum;
  }, { amount: 0, paid: 0, pending: 0 });

  const visibleSpecs = columnSpecs.filter((column) => !hiddenColumns.includes(column.key));
  const columns: ColumnsType<AgencyCommissionRow> = visibleSpecs.map((column) => ({
    ...column, dataIndex: column.key, fixed: column.key === 'id' ? 'left' : undefined,
    align: moneyFields.has(column.key) || ['active', 'percent'].includes(column.key) ? 'right' : 'left',
    render: (_, row) => {
      const value = displayValue(row, column.key);
      if (['ggr', 'active', 'tax', 'venue_fee'].includes(column.key)) {
        return <Link data-e2e-id={`agency-commission-detail-${column.key}-${row.id}-link`} onClick={() => setDetail({ kind: column.key as DetailKind, row })}>{value}</Link>;
      }
      if (column.key === 'state') return <span style={{ color: colorHex[commissionStateColors[row.state]] || '#8c8c8c' }}>{value}</span>;
      if (column.key === 'amount') return <strong style={{ color: Number(row.amount) < 0 ? '#f5222d' : undefined }}>{value}</strong>;
      return <span style={{ color: moneyFields.has(column.key) && Number(row[column.key]) < 0 ? '#f5222d' : undefined }}>{value}</span>;
    },
  }));

  const applyFilters = (values: CommissionFilters) => {
    setFilters(values);
    setPagination((current) => ({ ...current, current: 1 }));
  };
  const reset = () => {
    form.resetFields();
    form.setFieldsValue({ settle_type: 2 });
    applyFilters({ settle_type: 2 });
  };
  const exportCsv = () => downloadCsv(`佣金報表_展示_${dayjs().format('YYYYMMDD_HHmmss')}.csv`, [
    columnSpecs.map((column) => toCsvCell(column.title)).join(','),
    ...rows.map((row) => columnSpecs.map((column) => toCsvCell(displayValue(row, column.key))).join(',')),
  ].join('\n'));

  return (
    <div>
      <Card data-e2e-id="agency-commission-filter-card" style={{ marginBottom: 16 }}>
        <Form form={form} layout="horizontal" colon={false} labelCol={{ flex: '0 0 90px' }} wrapperCol={{ flex: 1 }} onFinish={applyFilters}>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} xl={6}><Form.Item name="month" label="結算週期">
              <DatePicker data-e2e-id="agency-commission-filter-month-picker" picker="month" format="YYYY-MM" placeholder="全部月份" style={{ width: '100%' }} />
            </Form.Item></Col>
            <Col xs={24} sm={12} xl={6}><Form.Item name="state" label="審核狀態">
              <Select data-e2e-id="agency-commission-filter-state-select" allowClear placeholder="全部狀態" options={Object.entries(commissionStateLabels).filter(([value]) => value !== '0').map(([value, label]) => ({ value: Number(value), label }))} />
            </Form.Item></Col>
            <Col xs={24} sm={12} xl={6}><Form.Item name="settle_type" label="結算方式">
              <Select data-e2e-id="agency-commission-filter-settle-type-select" allowClear placeholder="全部方式" options={[{ value: 1, label: '每週' }, { value: 2, label: '每月' }]} />
            </Form.Item></Col>
            <Col xs={24} sm={12} xl={6}><Form.Item name="reach_standard" label="達標狀態">
              <Select data-e2e-id="agency-commission-filter-reach-standard-select" allowClear placeholder="全部狀態" options={[{ value: 1, label: '不達標' }, { value: 2, label: '達標' }]} />
            </Form.Item></Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Space>
            <Button data-e2e-id="agency-commission-filter-reset-btn" onClick={reset} style={{ background: '#e6a23c', borderColor: '#e6a23c', color: '#fff' }}>重置</Button>
            <Button data-e2e-id="agency-commission-filter-search-btn" htmlType="submit" style={{ background: '#67c23a', borderColor: '#67c23a', color: '#fff' }}>搜尋</Button>
          </Space></div>
        </Form>
      </Card>

      <Card data-e2e-id="agency-commission-table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>佣金報表</Title>
          <Space wrap>
            <Button data-e2e-id="agency-commission-toolbar-export-btn" type="primary" icon={<DownloadOutlined />} onClick={exportCsv} disabled={!mounted || !rows.length}>匯出 CSV</Button>
            <Button data-e2e-id="agency-commission-toolbar-refresh-btn" icon={<ReloadOutlined />} onClick={() => setRevision((value) => value + 1)}>重新整理</Button>
            <Dropdown trigger={['click']} menu={{ selectable: true, selectedKeys: [density || 'small'], onClick: ({ key }) => setDensity(key as TableProps<AgencyCommissionRow>['size']), items: [
              { key: 'small', label: <span data-e2e-id="agency-commission-density-small-option">緊湊</span> },
              { key: 'middle', label: <span data-e2e-id="agency-commission-density-middle-option">適中</span> },
              { key: 'large', label: <span data-e2e-id="agency-commission-density-large-option">寬鬆</span> },
            ] }}><Button data-e2e-id="agency-commission-toolbar-density-btn" icon={<ColumnHeightOutlined />}>密度</Button></Dropdown>
            <Popover trigger="click" placement="bottomRight" title="顯示欄位" content={<Space direction="vertical">
              {columnSpecs.map((column) => <Checkbox key={column.key} data-e2e-id={`agency-commission-setting-${column.key}-checkbox`}
                checked={!hiddenColumns.includes(column.key)} disabled={visibleSpecs.length === 1 && !hiddenColumns.includes(column.key)}
                onChange={(event) => setHiddenColumns((current) => event.target.checked ? current.filter((key) => key !== column.key) : [...current, column.key])}>{column.title}</Checkbox>)}
              <Button data-e2e-id="agency-commission-setting-reset-btn" size="small" onClick={() => setHiddenColumns([])}>恢復全部欄位</Button>
            </Space>}><Button data-e2e-id="agency-commission-toolbar-settings-btn" icon={<SettingOutlined />}>設定</Button></Popover>
          </Space>
        </div>
        <Row gutter={[24, 16]} style={{ padding: 16, marginBottom: 16, background: '#fafafa', borderRadius: 8 }}>
          <Col xs={24} sm={12} xl={6}><Statistic title="累計應發佣金" value={totals.amount / 100} formatter={(value) => formatPeso(String(value))} valueStyle={{ fontSize: 22 }} /></Col>
          <Col xs={24} sm={12} xl={6}><Statistic title="已發放" value={totals.paid / 100} formatter={(value) => formatPeso(String(value))} valueStyle={{ fontSize: 22, color: '#52c41a' }} /></Col>
          <Col xs={24} sm={12} xl={6}><Statistic title="待審核" value={totals.pending / 100} formatter={(value) => formatPeso(String(value))} valueStyle={{ fontSize: 22, color: '#2f54eb' }} /></Col>
          <Col xs={24} sm={12} xl={6}><Statistic title="本期活躍會員" value={rows[0]?.active || 0} formatter={(value) => formatCount(Number(value))} valueStyle={{ fontSize: 22 }} /></Col>
        </Row>
        <Alert type="info" showIcon style={{ marginBottom: 16 }} message="應發金額計算方式"
          description="稅後 GGR ＝ 本期 GGR − 稅收 − 場館費 − 活動禮金；淨盈利 ＝ 稅後 GGR ＋ 歷史盈利結餘；應發金額 ＝ 淨盈利 × 佣金比例 ＋ 校準。不達標時應發金額為零；負結餘帶入下期。審核拒絕仍保留試算金額，通過後於次月 5 日發放。" />
        <div style={{ marginBottom: 12 }}><Text type="secondary">合成展示資料；彙總依查詢條件計算，本期活躍會員取查詢結果最新週期。</Text></div>
        <Table data-e2e-id="agency-commission-table" columns={columns} dataSource={mounted ? rows : []} size={density} rowKey="id"
          scroll={{ x: visibleSpecs.reduce((sum, column) => sum + column.width, 0) }}
          locale={{ emptyText: filters.settle_type === 1 ? '此代理採每月結算，無每週結算資料' : '沒有符合條件的佣金資料' }}
          onRow={(row) => ({ 'data-e2e-id': `agency-commission-row-${row.id}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          pagination={{ ...pagination, showSizeChanger: true, showQuickJumper: true,
            onChange: (current, pageSize) => setPagination({ current, pageSize }),
            showTotal: (total, range) => `當前：第 ${total ? Math.ceil(range[0] / pagination.pageSize) : 0} 頁, 共 ${total} 筆資料`,
            itemRender: (page, type, element) => <span data-e2e-id={`agency-commission-page-${type}-${page}-btn`}>{element}</span>,
          }} />
      </Card>
      {detail?.kind === 'ggr' && <ChildGgrModal open onClose={() => setDetail(null)} row={detail.row} />}
      {detail?.kind === 'active' && <ActiveMemberModal open onClose={() => setDetail(null)} row={detail.row} />}
      {detail?.kind === 'tax' && <PagcorTaxModal open onClose={() => setDetail(null)} row={detail.row} />}
      {detail?.kind === 'venue_fee' && <VenueFeeModal open onClose={() => setDetail(null)} row={detail.row} />}
    </div>
  );
}

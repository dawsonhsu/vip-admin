'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Checkbox, Col, DatePicker, Dropdown, Form, Input, Popover, Row, Segmented, Select, Space, Table, Typography } from 'antd';
import { CheckOutlined, ColumnHeightOutlined, CopyOutlined, DownloadOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { generateAgencyBonuses, type AgencyBonusRow } from '@/data/agency/commission';
import { agencyBonusCashTypes } from '@/data/agency/shared';
import { agencyRangeOf, agencySeed, bonusReviewStateLabels, downloadCsv, formatPeso, formatTs, toCsvCell } from '@/lib/agencyUtils';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
interface BonusFormValues { ty: number; username?: string; cash_type?: number; dateRange?: [Dayjs, Dayjs] | null }
interface BonusFilters { ty: number; username?: string; cash_type?: number; start_time?: number; end_time?: number }
type BonusColumnKey = keyof AgencyBonusRow | 'sequence';
const BONUS_SEED = agencySeed('agency-bonus', 20260916);
const reviewColors: Record<number, string> = { 1: '#d48806', 2: '#52c41a', 3: '#f5222d' };
const cashTypeColors: Record<number, string> = Object.fromEntries(Object.keys(agencyBonusCashTypes).map((key, index) => [key, ['#1677ff', '#389e0d', '#722ed1', '#d48806', '#08979c', '#c41d7f'][index % 6]]));
const columnSpecs: Array<{ key: BonusColumnKey; title: string; width: number }> = [
  { key: 'sequence', title: '序號', width: 80 },
  { key: 'username', title: '會員帳號', width: 180 },
  { key: 'phone', title: '手機', width: 160 },
  { key: 'activity_id', title: '活動ID', width: 190 },
  { key: 'cash_type', title: '禮金類型', width: 140 },
  { key: 'bonus', title: '禮金金額', width: 160 },
  { key: 'multiple', title: '打碼倍數', width: 110 },
  { key: 'review_state', title: '審核狀態', width: 120 },
  { key: 'review_name', title: '審核人', width: 140 },
  { key: 'review_at', title: '審核時間', width: 190 },
  { key: 'remark', title: '備註', width: 280 },
  { key: 'created_at', title: '發放時間', width: 190 },
];
function displayValue(row: AgencyBonusRow, key: BonusColumnKey, index: number): string {
  if (key === 'sequence') return String(index + 1);
  if (key === 'bonus') return formatPeso(row.bonus);
  if (key === 'multiple') return `${row.multiple}x`;
  if (key === 'created_at' || key === 'review_at') return formatTs(row[key]);
  if (key === 'cash_type') return agencyBonusCashTypes[row.cash_type] || '其他禮金';
  if (key === 'review_state') return bonusReviewStateLabels[row.review_state] || '未知狀態';
  return String(row[key] || '—');
}

export default function AgencyBonusPage() {
  const [form] = Form.useForm<BonusFormValues>();
  const formTy = Form.useWatch('ty', form);
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<BonusFilters>({ ty: 1 });
  const [revision, setRevision] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [density, setDensity] = useState<TableProps<AgencyBonusRow>['size']>('small');
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  useEffect(() => {
    const dateRange = agencyRangeOf('month');
    form.setFieldsValue({ ty: 1, dateRange });
    setFilters({ ty: 1, start_time: dateRange[0].unix(), end_time: dateRange[1].unix() });
    setMounted(true);
  }, [form]);

  // 對應 GET /agency/child/bonus/list，bonus_total 與當前篩選集合一致，跨頁加總。
  const allRows = useMemo(() => mounted ? generateAgencyBonuses(BONUS_SEED) : [], [mounted, revision]);
  const rows = useMemo(() => allRows.filter((row) => {
    if (filters.username && !row.username.toLowerCase().includes(filters.username)) return false;
    if (filters.cash_type !== undefined && row.cash_type !== filters.cash_type) return false;
    if (filters.start_time !== undefined && row.created_at < filters.start_time) return false;
    if (filters.end_time !== undefined && row.created_at > filters.end_time) return false;
    return true;
  }), [allRows, filters]);
  const bonus_total = (rows.reduce((sum, row) => sum + Math.round(Number(row.bonus) * 100), 0) / 100).toFixed(2);

  const visibleSpecs = columnSpecs.filter((column) => !hiddenColumns.includes(column.key));
  const columns: ColumnsType<AgencyBonusRow> = visibleSpecs.map((column) => ({
    ...column, dataIndex: column.key === 'sequence' ? undefined : column.key,
    fixed: column.key === 'sequence' ? 'left' : undefined,
    align: column.key === 'bonus' ? 'right' : ['sequence', 'multiple'].includes(column.key) ? 'center' : 'left',
    render: (_, row, index) => {
      const value = displayValue(row, column.key, (pagination.current - 1) * pagination.pageSize + index);
      if (column.key === 'username') return <Text data-e2e-id={`agency-bonus-copy-${row.id}-text`} copyable={{ text: row.username, tooltips: ['複製會員帳號', '已複製'], icon: [<CopyOutlined key="copy" data-e2e-id={`agency-bonus-copy-${row.id}-btn`} />, <CheckOutlined key="copied" data-e2e-id={`agency-bonus-copied-${row.id}-btn`} />] }}>{row.username}</Text>;
      if (column.key === 'cash_type') return <span style={{ color: cashTypeColors[row.cash_type] || '#595959' }}>{value}</span>;
      if (column.key === 'review_state') return <span style={{ color: reviewColors[row.review_state] || '#595959' }}>{value}</span>;
      return value;
    },
  }));

  const applyFilters = (values: BonusFormValues) => {
    const dateRange = values.dateRange || (values.ty === 1 ? agencyRangeOf('month') : undefined);
    setFilters({
      ty: values.ty, username: values.username?.trim().toLowerCase(), cash_type: values.cash_type,
      start_time: dateRange?.[0].startOf('day').unix(), end_time: dateRange?.[1].endOf('day').unix(),
    });
    setPagination((current) => ({ ...current, current: 1 }));
  };
  const reset = () => {
    const dateRange = agencyRangeOf('month');
    form.resetFields();
    form.setFieldsValue({ ty: 1, dateRange });
    applyFilters({ ty: 1, dateRange });
  };
  const exportCsv = () => downloadCsv(`禮金列表_展示_${dayjs().format('YYYYMMDD_HHmmss')}.csv`, [
    columnSpecs.map((column) => toCsvCell(column.title)).join(','),
    ...rows.map((row, index) => columnSpecs.map((column) => toCsvCell(displayValue(row, column.key, index))).join(',')),
  ].join('\n'));

  return (
    <div>
      <Card data-e2e-id="agency-bonus-filter-card" style={{ marginBottom: 16 }}>
        <Form form={form} layout="horizontal" colon={false} labelCol={{ flex: '0 0 90px' }} wrapperCol={{ flex: 1 }} onFinish={applyFilters}>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} xl={6}><Form.Item name="ty" label="統計口徑">
              <Segmented data-e2e-id="agency-bonus-filter-ty-segmented" block options={[
                { value: 1, label: <span data-e2e-id="agency-bonus-filter-month-option">按月</span> },
                { value: 2, label: <span data-e2e-id="agency-bonus-filter-total-option">累計</span> },
              ]} onChange={(value) => form.setFieldValue('dateRange', value === 1 ? agencyRangeOf('month') : null)} />
            </Form.Item></Col>
            <Col xs={24} sm={12} xl={6}><Form.Item name="username" label="會員帳號">
              <Input data-e2e-id="agency-bonus-filter-username-input" placeholder="請輸入會員帳號" allowClear />
            </Form.Item></Col>
            <Col xs={24} sm={12} xl={6}><Form.Item name="cash_type" label="禮金類型">
              <Select data-e2e-id="agency-bonus-filter-cash-type-select" placeholder="全部禮金類型" allowClear showSearch optionFilterProp="label" options={Object.entries(agencyBonusCashTypes).map(([value, label]) => ({ value: Number(value), label }))} />
            </Form.Item></Col>
            <Col xs={24} sm={12} xl={6}><Form.Item name="dateRange" label="發放時間" rules={[{ required: formTy !== 2, message: '按月查詢請選擇發放時間' }]}>
              <RangePicker data-e2e-id="agency-bonus-filter-date-range-picker" format="YYYY-MM-DD" placeholder={['開始日期', '結束日期']} allowClear={formTy === 2} style={{ width: '100%' }} />
            </Form.Item></Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Space>
            <Button data-e2e-id="agency-bonus-filter-reset-btn" onClick={reset} style={{ background: '#e6a23c', borderColor: '#e6a23c', color: '#fff' }}>重置</Button>
            <Button data-e2e-id="agency-bonus-filter-search-btn" htmlType="submit" style={{ background: '#67c23a', borderColor: '#67c23a', color: '#fff' }}>搜尋</Button>
          </Space></div>
        </Form>
      </Card>

      <Card data-e2e-id="agency-bonus-table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <Space wrap size={20}>
            <Title level={5} style={{ margin: 0 }}>禮金列表</Title>
            <Text data-e2e-id="agency-bonus-total-text">禮金總額：<strong style={{ color: '#1677ff', fontSize: 18 }}>{formatPeso(bonus_total)}</strong></Text>
          </Space>
          <Space wrap>
            <Button data-e2e-id="agency-bonus-toolbar-export-btn" type="primary" icon={<DownloadOutlined />} onClick={exportCsv} disabled={!mounted || !rows.length}>匯出 CSV</Button>
            <Button data-e2e-id="agency-bonus-toolbar-refresh-btn" icon={<ReloadOutlined />} onClick={() => setRevision((value) => value + 1)}>重新整理</Button>
            <Dropdown trigger={['click']} menu={{ selectable: true, selectedKeys: [density || 'small'], onClick: ({ key }) => setDensity(key as TableProps<AgencyBonusRow>['size']), items: [
              { key: 'small', label: <span data-e2e-id="agency-bonus-density-small-option">緊湊</span> },
              { key: 'middle', label: <span data-e2e-id="agency-bonus-density-middle-option">適中</span> },
              { key: 'large', label: <span data-e2e-id="agency-bonus-density-large-option">寬鬆</span> },
            ] }}><Button data-e2e-id="agency-bonus-toolbar-density-btn" icon={<ColumnHeightOutlined />}>密度</Button></Dropdown>
            <Popover trigger="click" placement="bottomRight" title="顯示欄位" content={<Space direction="vertical">
              {columnSpecs.map((column) => <Checkbox key={column.key} data-e2e-id={`agency-bonus-setting-${column.key}-checkbox`}
                checked={!hiddenColumns.includes(column.key)} disabled={visibleSpecs.length === 1 && !hiddenColumns.includes(column.key)}
                onChange={(event) => setHiddenColumns((current) => event.target.checked ? current.filter((key) => key !== column.key) : [...current, column.key])}>{column.title}</Checkbox>)}
              <Button data-e2e-id="agency-bonus-setting-reset-btn" size="small" onClick={() => setHiddenColumns([])}>恢復全部欄位</Button>
            </Space>}><Button data-e2e-id="agency-bonus-toolbar-settings-btn" icon={<SettingOutlined />}>設定</Button></Popover>
          </Space>
        </div>
        <div style={{ marginBottom: 16 }}><Text type="secondary">合成展示資料。{filters.ty === 1 ? '按月查詢' : '累計查詢'}；禮金總額包含符合條件的全部審核狀態及所有分頁。</Text></div>
        <Table data-e2e-id="agency-bonus-table" columns={columns} dataSource={mounted ? rows : []} size={density} rowKey="id"
          scroll={{ x: visibleSpecs.reduce((sum, column) => sum + column.width, 0) }} locale={{ emptyText: '沒有符合條件的禮金資料' }}
          onRow={(row) => ({ 'data-e2e-id': `agency-bonus-row-${row.id}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          pagination={{ ...pagination, showSizeChanger: true, showQuickJumper: true,
            onChange: (current, pageSize) => setPagination({ current, pageSize }),
            showTotal: (total, range) => `當前：第 ${total ? Math.ceil(range[0] / pagination.pageSize) : 0} 頁, 共 ${total} 筆資料`,
            itemRender: (page, type, element) => <span data-e2e-id={`agency-bonus-page-${type}-${page}-btn`}>{element}</span>,
          }} />
      </Card>
    </div>
  );
}

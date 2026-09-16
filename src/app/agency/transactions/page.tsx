'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Checkbox, Col, DatePicker, Dropdown, Form, Popover, Row, Space, Statistic, Table, Typography } from 'antd';
import { CheckOutlined, ColumnHeightOutlined, CopyOutlined, DownloadOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { AGENCY_COMMISSION_SEED, generateAgencyTransactions, type AgencyCommissionTrans } from '@/data/agency/commission';
import { agencyTransCashTypes } from '@/data/agency/shared';
import { downloadCsv, formatPeso, formatTs, toCsvCell } from '@/lib/agencyUtils';

const { Title, Text } = Typography;
interface TransactionFilters { month?: Dayjs | null }
const cashTypeColors: Record<number, string> = { 1001: '#52c41a', 1002: '#1677ff', 1003: '#d48806' };
const columnSpecs: Array<{ key: keyof AgencyCommissionTrans; title: string; width: number }> = [
  { key: 'id', title: '訂單ID', width: 260 },
  { key: 'bill_no', title: '流水號', width: 320 },
  { key: 'username', title: '代理帳號', width: 160 },
  { key: 'cash_type_fmt', title: '帳變類型', width: 130 },
  { key: 'amount', title: '帳變金額', width: 165 },
  { key: 'before_amount', title: '帳變前餘額', width: 170 },
  { key: 'after_amount', title: '帳變後餘額', width: 170 },
  { key: 'operator_name', title: '操作人', width: 140 },
  { key: 'device', title: '終端', width: 120 },
  { key: 'remark', title: '備註', width: 400 },
  { key: 'created_at', title: '帳變時間', width: 190 },
];
const moneyFields = new Set<keyof AgencyCommissionTrans>(['amount', 'before_amount', 'after_amount']);
function displayValue(row: AgencyCommissionTrans, key: keyof AgencyCommissionTrans): string {
  if (moneyFields.has(key)) return formatPeso(row[key]);
  if (key === 'created_at') return formatTs(row.created_at);
  if (key === 'cash_type_fmt') return agencyTransCashTypes[row.cash_type] || row.cash_type_fmt;
  return String(row[key]);
}

export default function AgencyTransactionsPage() {
  const [form] = Form.useForm<TransactionFilters>();
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [revision, setRevision] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [density, setDensity] = useState<TableProps<AgencyCommissionTrans>['size']>('small');
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  useEffect(() => {
    const month = dayjs().startOf('month');
    form.setFieldsValue({ month });
    setFilters({ month });
    setMounted(true);
  }, [form]);

  // 對應 GET /agency/commission/trans/list；month 必填，並與佣金報表使用相同種子。
  const monthRows = useMemo(() => mounted && filters.month
    ? generateAgencyTransactions(AGENCY_COMMISSION_SEED, filters.month.format('YYYY-MM')) : [], [mounted, filters.month, revision]);
  const rows = useMemo(() => [...monthRows].reverse(), [monthRows]);
  const payoutTotal = monthRows.filter((row) => row.cash_type === 1001).reduce((sum, row) => sum + Math.round(Number(row.amount) * 100), 0) / 100;
  const balance = useMemo(() => {
    if (!mounted || !filters.month) return '0.00';
    if (monthRows.length) return monthRows[monthRows.length - 1].after_amount;
    // 無帳變月份仍承接最近一期餘額，不能將餘額誤顯示為零。
    for (let offset = 1; offset <= 12; offset++) {
      const earlier = generateAgencyTransactions(AGENCY_COMMISSION_SEED, filters.month.subtract(offset, 'month').format('YYYY-MM'));
      if (earlier.length) return earlier[earlier.length - 1].after_amount;
    }
    return '0.00';
  }, [mounted, filters.month, monthRows]);

  const visibleSpecs = columnSpecs.filter((column) => !hiddenColumns.includes(column.key));
  const columns: ColumnsType<AgencyCommissionTrans> = visibleSpecs.map((column) => ({
    ...column, dataIndex: column.key, fixed: column.key === 'id' ? 'left' : undefined,
    align: moneyFields.has(column.key) ? 'right' : 'left',
    render: (_, row) => {
      const value = displayValue(row, column.key);
      if (column.key === 'bill_no') return <Text data-e2e-id={`agency-transactions-copy-${row.id}-text`} copyable={{ text: row.bill_no, tooltips: ['複製流水號', '已複製'], icon: [<CopyOutlined key="copy" data-e2e-id={`agency-transactions-copy-${row.id}-btn`} />, <CheckOutlined key="copied" data-e2e-id={`agency-transactions-copied-${row.id}-btn`} />] }}>{row.bill_no}</Text>;
      if (column.key === 'cash_type_fmt') return <span style={{ color: cashTypeColors[row.cash_type] || '#595959' }}>{value}</span>;
      if (column.key === 'amount') return <span style={{ color: Number(row.amount) > 0 ? '#52c41a' : Number(row.amount) < 0 ? '#f5222d' : undefined }}>{Number(row.amount) > 0 ? '+ ' : ''}{value}</span>;
      return value;
    },
  }));
  const applyFilters = (values: TransactionFilters) => {
    if (!values.month) return;
    setFilters(values);
    setPagination((current) => ({ ...current, current: 1 }));
  };
  const reset = () => {
    const month = dayjs().startOf('month');
    form.resetFields();
    form.setFieldsValue({ month });
    applyFilters({ month });
  };
  const exportCsv = () => downloadCsv(`佣金帳變_展示_${filters.month?.format('YYYY-MM') || ''}.csv`, [
    columnSpecs.map((column) => toCsvCell(column.title)).join(','),
    ...rows.map((row) => columnSpecs.map((column) => toCsvCell(displayValue(row, column.key))).join(',')),
  ].join('\n'));

  return (
    <div>
      <Card data-e2e-id="agency-transactions-filter-card" style={{ marginBottom: 16 }}>
        <Form form={form} layout="horizontal" colon={false} labelCol={{ flex: '0 0 90px' }} wrapperCol={{ flex: 1 }} onFinish={applyFilters}>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} xl={6}><Form.Item name="month" label="月份" rules={[{ required: true, message: '請選擇查詢月份' }]}>
              <DatePicker data-e2e-id="agency-transactions-filter-month-picker" picker="month" allowClear={false} format="YYYY-MM" placeholder="請選擇月份" style={{ width: '100%' }} disabledDate={(date) => date.isAfter(dayjs(), 'month')} />
            </Form.Item></Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Space>
            <Button data-e2e-id="agency-transactions-filter-reset-btn" onClick={reset} style={{ background: '#e6a23c', borderColor: '#e6a23c', color: '#fff' }}>重置</Button>
            <Button data-e2e-id="agency-transactions-filter-search-btn" htmlType="submit" style={{ background: '#67c23a', borderColor: '#67c23a', color: '#fff' }}>搜尋</Button>
          </Space></div>
        </Form>
      </Card>

      <Card data-e2e-id="agency-transactions-table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>佣金帳變</Title>
          <Space wrap>
            <Button data-e2e-id="agency-transactions-toolbar-export-btn" type="primary" icon={<DownloadOutlined />} onClick={exportCsv} disabled={!mounted || !rows.length}>匯出 CSV</Button>
            <Button data-e2e-id="agency-transactions-toolbar-refresh-btn" icon={<ReloadOutlined />} onClick={() => setRevision((value) => value + 1)}>重新整理</Button>
            <Dropdown trigger={['click']} menu={{ selectable: true, selectedKeys: [density || 'small'], onClick: ({ key }) => setDensity(key as TableProps<AgencyCommissionTrans>['size']), items: [
              { key: 'small', label: <span data-e2e-id="agency-transactions-density-small-option">緊湊</span> },
              { key: 'middle', label: <span data-e2e-id="agency-transactions-density-middle-option">適中</span> },
              { key: 'large', label: <span data-e2e-id="agency-transactions-density-large-option">寬鬆</span> },
            ] }}><Button data-e2e-id="agency-transactions-toolbar-density-btn" icon={<ColumnHeightOutlined />}>密度</Button></Dropdown>
            <Popover trigger="click" placement="bottomRight" title="顯示欄位" content={<Space direction="vertical">
              {columnSpecs.map((column) => <Checkbox key={column.key} data-e2e-id={`agency-transactions-setting-${column.key}-checkbox`}
                checked={!hiddenColumns.includes(column.key)} disabled={visibleSpecs.length === 1 && !hiddenColumns.includes(column.key)}
                onChange={(event) => setHiddenColumns((current) => event.target.checked ? current.filter((key) => key !== column.key) : [...current, column.key])}>{column.title}</Checkbox>)}
              <Button data-e2e-id="agency-transactions-setting-reset-btn" size="small" onClick={() => setHiddenColumns([])}>恢復全部欄位</Button>
            </Space>}><Button data-e2e-id="agency-transactions-toolbar-settings-btn" icon={<SettingOutlined />}>設定</Button></Popover>
          </Space>
        </div>
        <Row gutter={[24, 16]} style={{ padding: 16, marginBottom: 12, background: '#fafafa', borderRadius: 8 }}>
          <Col xs={24} sm={12}><Statistic title="本月發放合計" value={payoutTotal} formatter={(value) => formatPeso(String(value))} valueStyle={{ color: '#52c41a', fontSize: 24 }} /></Col>
          <Col xs={24} sm={12}><Statistic title="目前佣金餘額" value={balance} formatter={(value) => formatPeso(String(value))} valueStyle={{ fontSize: 24 }} /></Col>
        </Row>
        <div style={{ marginBottom: 16 }}><Text type="secondary">合成展示資料。發放合計僅計佣金發放；餘額為查詢月份最後一筆帳變後餘額，無帳變時承接上期。</Text></div>
        <Table data-e2e-id="agency-transactions-table" columns={columns} dataSource={mounted ? rows : []} size={density} rowKey="id"
          scroll={{ x: visibleSpecs.reduce((sum, column) => sum + column.width, 0) }} locale={{ emptyText: '此月份沒有佣金帳變' }}
          onRow={(row) => ({ 'data-e2e-id': `agency-transactions-row-${row.id}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          pagination={{ ...pagination, showSizeChanger: true, showQuickJumper: true,
            onChange: (current, pageSize) => setPagination({ current, pageSize }),
            showTotal: (total, range) => `當前：第 ${total ? Math.ceil(range[0] / pagination.pageSize) : 0} 頁, 共 ${total} 筆資料`,
            itemRender: (page, type, element) => <span data-e2e-id={`agency-transactions-page-${type}-${page}-btn`}>{element}</span>,
          }} />
      </Card>
    </div>
  );
}

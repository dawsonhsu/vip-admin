'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { Button, Card, Checkbox, Col, DatePicker, Form, Input, Modal, Popover, Row, Select, Space, Statistic, Table, Tooltip, Typography, message } from 'antd';
import { CloseOutlined, DownloadOutlined, ReloadOutlined, SearchOutlined, SettingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { appLoginRewardRecords, type AppLoginRewardRecord } from '@/data/appLoginRewardData';

const E2E = 'app-login-reward-report-modal';
const { Text } = Typography;
type SearchField = 'phone' | 'account' | 'uid';
interface ReportFilters {
  searchField: SearchField;
  searchText: string;
  dispatchedRange: [Dayjs, Dayjs] | null;
  terminal: 'all' | AppLoginRewardRecord['terminal'];
  rewardType: 'all' | 'cash' | 'freespin' | 'both';
  rolloverStatus: 'all' | NonNullable<AppLoginRewardRecord['rolloverStatus']>;
}

const getDefaultFilters = (): ReportFilters => ({
  searchField: 'phone',
  searchText: '',
  dispatchedRange: [dayjs('2026-11-03 00:00:00'), dayjs('2026-11-10 23:59:59')],
  terminal: 'all',
  rewardType: 'all',
  rolloverStatus: 'all',
});
const splitTerms = (value: string) => value.split(',').map((term) => term.trim().toLowerCase()).filter(Boolean);
const formatCurrency = (value: number) => `₱ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const renderOptional = (value: string | number | null) => value === null ? <Text type="secondary">—</Text> : value;
const renderMoney = (value: number | null) => value === null ? renderOptional(null) : formatCurrency(value);

// One column definition list keeps the table, column picker and complete CSV in sync.
const reportFields: { key: keyof AppLoginRewardRecord; title: string; width: number }[] = [
  { key: 'orderId', title: '派发单号', width: 220 },
  { key: 'dispatchedAt', title: '派发时间', width: 180 },
  { key: 'phone', title: '手机号', width: 135 },
  { key: 'account', title: '会员账号', width: 170 },
  { key: 'uid', title: 'UID', width: 110 },
  { key: 'terminal', title: '登录终端', width: 100 },
  { key: 'appVersion', title: 'App 版本', width: 105 },
  { key: 'cashAmount', title: '彩金金额 (₱)', width: 135 },
  { key: 'rolloverMultiplier', title: '流水倍数', width: 100 },
  { key: 'rolloverRequired', title: '流水要求 (₱)', width: 135 },
  { key: 'rolloverCompleted', title: '已完成流水 (₱)', width: 150 },
  { key: 'rolloverStatus', title: '流水状态', width: 110 },
  { key: 'fsGame', title: '免费旋转游戏', width: 300 },
  { key: 'fsCount', title: '旋转次数', width: 100 },
  { key: 'fsUsed', title: '已使用次数', width: 110 },
  { key: 'fsPayout', title: '免费旋转派彩 (₱)', width: 170 },
];
const moneyFields = new Set(['cashAmount', 'rolloverRequired', 'rolloverCompleted', 'fsPayout']);
const gameLabel = (row: AppLoginRewardRecord) => row.fsCount === null ? null : `${row.fsProvider} / ${row.fsGame}`;

function downloadCsv(rows: AppLoginRewardRecord[]) {
  const escapeCell = (value: string | number | null) => {
    const text = value === null ? '—' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };
  const csvRows = [
    reportFields.map((field) => field.title),
    ...rows.map((row) => reportFields.map(({ key }) => {
      if (key === 'fsGame') return gameLabel(row);
      if (key === 'rolloverMultiplier') return row[key] === null ? null : `${row[key]}倍`;
      const value = row[key];
      return moneyFields.has(key) && typeof value === 'number' ? value.toFixed(2) : value;
    })),
  ];
  const blob = new Blob(['\uFEFF', csvRows.map((row) => row.map(escapeCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  // The export timestamp is evaluated only on a user action, in GMT+8.
  const exportDate = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');
  link.download = `app-login-reward-report-${exportDate}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AppLoginRewardReportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form] = Form.useForm<ReportFilters>();
  const searchText = Form.useWatch('searchText', form) ?? '';
  const searchCount = splitTerms(searchText).length;
  const [filters, setFilters] = useState<ReportFilters>(getDefaultFilters);
  const [page, setPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => reportFields.map((field) => field.key));

  useEffect(() => {
    if (open) {
      const defaults = getDefaultFilters();
      form.setFieldsValue({ ...defaults, dispatchedRange: defaults.dispatchedRange ?? undefined });
      setFilters(defaults);
      setPage(1);
    }
  }, [open, form]);

  const filteredRows = useMemo(() => {
    const terms = new Set(splitTerms(filters.searchText));
    return appLoginRewardRecords.filter((row) => {
      if (terms.size && !terms.has(row[filters.searchField].toLowerCase())) return false;
      if (filters.dispatchedRange) {
        const [start, end] = filters.dispatchedRange;
        // Both strings represent GMT+8 wall-clock values, independent of browser timezone.
        if (row.dispatchedAt < start.format('YYYY-MM-DD HH:mm:ss') || row.dispatchedAt > end.format('YYYY-MM-DD HH:mm:ss')) return false;
      }
      if (filters.terminal !== 'all' && row.terminal !== filters.terminal) return false;
      const rewardType = row.cashAmount === null ? 'freespin' : row.fsCount === null ? 'cash' : 'both';
      if (filters.rewardType !== 'all' && rewardType !== filters.rewardType) return false;
      return filters.rolloverStatus === 'all' || row.rolloverStatus === filters.rolloverStatus;
    });
  }, [filters]);

  const stats = useMemo(() => {
    const eligible = filteredRows.filter((row) => ['进行中', '已完成', '已失效'].includes(row.rolloverStatus ?? ''));
    const completed = eligible.filter((row) => row.rolloverStatus === '已完成').length;
    return [
      { key: 'members', title: '派发人数', value: new Set(filteredRows.map((row) => row.uid)).size, precision: 0 },
      { key: 'cash', title: '彩金派发总额', value: filteredRows.reduce((sum, row) => sum + (row.cashAmount ?? 0), 0), prefix: '₱', precision: 2 },
      { key: 'spins', title: '免费旋转派发次数', value: filteredRows.reduce((sum, row) => sum + (row.fsCount ?? 0), 0), precision: 0 },
      { key: 'payout', title: '免费旋转累计派彩', value: filteredRows.reduce((sum, row) => sum + (row.fsPayout ?? 0), 0), prefix: '₱', precision: 2 },
      { key: 'completion', title: '流水完成率', value: eligible.length ? completed / eligible.length * 100 : 0, suffix: '%', precision: 2 },
    ];
  }, [filteredRows]);

  const columns: ColumnsType<AppLoginRewardRecord> = reportFields.filter((field) => visibleColumns.includes(field.key)).map(({ key, title, width }) => ({
    key, title, dataIndex: key, width,
    fixed: key === 'orderId' ? 'left' : undefined,
    sorter: key === 'dispatchedAt' ? (a, b) => a.dispatchedAt.localeCompare(b.dispatchedAt)
      : key === 'cashAmount' ? (a, b) => (a.cashAmount ?? -1) - (b.cashAmount ?? -1) : undefined,
    onHeaderCell: () => ({ 'data-e2e-id': `${E2E}-table-header-${key}` } as React.HTMLAttributes<HTMLTableCellElement>),
    render: (value: AppLoginRewardRecord[keyof AppLoginRewardRecord], row) => {
      if (key === 'fsGame') return renderOptional(gameLabel(row));
      if (value === null) return renderOptional(null);
      if (moneyFields.has(key)) return renderMoney(value as number);
      if (key === 'rolloverMultiplier') return `${value}倍`;
      if (key === 'rolloverStatus') return <Text type={value === '已完成' ? 'success' : value === '已失效' ? 'danger' : undefined}>{value}</Text>;
      return value;
    },
  }));

  return (
    <Modal title="App登录奖励 - 报表" open={open} onCancel={onClose} width="94%" style={{ top: 20 }}
      closeIcon={<CloseOutlined data-e2e-id={`${E2E}-close-icon`} />}
      styles={{ body: { maxHeight: '78vh', overflowY: 'auto', padding: 16 } }}
      footer={<div style={{ textAlign: 'right' }}><Button data-e2e-id={`${E2E}-footer-close-btn`} onClick={onClose}>关闭</Button></div>}>
      <div data-e2e-id={`${E2E}-modal`}>
        <Card size="small" style={{ marginBottom: 12 }}>
          <Form form={form} layout="inline" initialValues={getDefaultFilters()} style={{ gap: 8, rowGap: 8, flexWrap: 'wrap' }}
            onFinish={(values: ReportFilters) => { setFilters(values); setPage(1); }}>
            <Form.Item label="搜索字段">
              <Space direction="vertical" size={2}>
                <Space.Compact>
                  <Form.Item name="searchField" noStyle>
                    <Select data-e2e-id={`${E2E}-filter-search-field-select`} style={{ width: 110 }} options={[
                      { value: 'phone', label: '手机号' }, { value: 'account', label: '会员账号' }, { value: 'uid', label: 'UID' },
                    ]} />
                  </Form.Item>
                  <Form.Item name="searchText" noStyle rules={[{
                    validator: (_, value: string) => splitTerms(value ?? '').length <= 5000 ? Promise.resolve() : Promise.reject(new Error('最多支持 5000 个查询值')),
                  }]}>
                    <Input data-e2e-id={`${E2E}-filter-search-input`} allowClear placeholder="支持批量查询，以 ',' 分隔 1~5000" style={{ width: 320 }} />
                  </Form.Item>
                </Space.Compact>
                <Text type={searchCount > 5000 ? 'danger' : 'secondary'} style={{ fontSize: 12 }} data-e2e-id={`${E2E}-filter-search-count-text`}>{searchCount} / 5000</Text>
              </Space>
            </Form.Item>
            <Form.Item name="dispatchedRange" label="派发时间">
              <DatePicker.RangePicker data-e2e-id={`${E2E}-filter-dispatched-range`} showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: 360 }} />
            </Form.Item>
            <Form.Item name="terminal" label="登录终端">
              <Select data-e2e-id={`${E2E}-filter-terminal-select`} style={{ width: 110 }} options={['all', 'Android', 'iOS'].map((value) => ({ value, label: value === 'all' ? '全部' : value }))} />
            </Form.Item>
            <Form.Item name="rewardType" label="奖励类型">
              <Select data-e2e-id={`${E2E}-filter-reward-type-select`} style={{ width: 160 }} options={[
                { value: 'all', label: '全部' }, { value: 'cash', label: '仅彩金' }, { value: 'freespin', label: '仅免费旋转' }, { value: 'both', label: '彩金+免费旋转' },
              ]} />
            </Form.Item>
            <Form.Item name="rolloverStatus" label="流水状态">
              <Select data-e2e-id={`${E2E}-filter-rollover-status-select`} style={{ width: 110 }} options={['all', '进行中', '已完成', '已失效', '无流水'].map((value) => ({ value, label: value === 'all' ? '全部' : value }))} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button data-e2e-id={`${E2E}-filter-reset-btn`} icon={<ReloadOutlined />} onClick={() => form.resetFields()}>重置</Button>
                <Button data-e2e-id={`${E2E}-filter-query-btn`} type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          {stats.map(({ key, ...stat }) => (
            <Col key={key} flex="1" style={{ minWidth: 0 }}>
              <Card style={{ height: '100%' }}>
                <Statistic {...stat} data-e2e-id={`${E2E}-summary-${key}`} valueStyle={{ fontSize: 22, lineHeight: 1.25, whiteSpace: 'nowrap' }} />
              </Card>
            </Col>
          ))}
        </Row>
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button data-e2e-id={`${E2E}-toolbar-export-btn`} icon={<DownloadOutlined />} onClick={() => downloadCsv(filteredRows)}>导出</Button>
          <Tooltip title="刷新">
            <Button data-e2e-id={`${E2E}-toolbar-refresh-btn`} aria-label="刷新" icon={<ReloadOutlined />} onClick={() => {
              setFilters((current) => ({ ...current }));
              message.success('已刷新');
            }} />
          </Tooltip>
          <Popover trigger="click" placement="bottomRight" title="列设置" content={
            <Space direction="vertical">
              {reportFields.map((field) => <Checkbox key={field.key} data-e2e-id={`${E2E}-column-${field.key}-checkbox`}
                checked={visibleColumns.includes(field.key)} disabled={field.key === 'orderId'}
                onChange={(event) => setVisibleColumns((current) => event.target.checked ? [...current, field.key] : current.filter((key) => key !== field.key))}>{field.title}</Checkbox>)}
            </Space>
          }>
            <Tooltip title="列设置"><Button data-e2e-id={`${E2E}-toolbar-settings-btn`} aria-label="列设置" icon={<SettingOutlined />} /></Tooltip>
          </Popover>
        </div>
        <Table data-e2e-id={`${E2E}-table`} columns={columns} dataSource={filteredRows} rowKey="orderId" size="small" scroll={{ x: 2430 }}
          onRow={(row) => ({ 'data-e2e-id': `${E2E}-table-row-${row.orderId}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          pagination={{ current: page, pageSize: 20, showSizeChanger: false, onChange: setPage, showTotal: (total) => `共 ${total} 笔`,
            itemRender: (pageNumber, type, originalElement) => <span data-e2e-id={`${E2E}-pagination-${type}-${pageNumber}`}>{originalElement}</span>,
          }} />
      </div>
    </Modal>
  );
}

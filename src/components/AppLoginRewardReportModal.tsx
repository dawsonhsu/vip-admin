'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { Button, Card, Col, DatePicker, Form, Input, Modal, Row, Select, Space, Statistic, Table, Tooltip, message } from 'antd';
import { CloseOutlined, DownloadOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { appLoginRewardRecords, type AppLoginRewardRecord } from '@/data/appLoginRewardData';

const E2E = 'app-login-reward-report-modal';
type RewardType = 'cash' | 'freespin' | 'both';
interface ReportFilters {
  searchText: string;
  dispatchedRange: [Dayjs, Dayjs] | null;
  rewardType: 'all' | RewardType;
}

const getDefaultFilters = (): ReportFilters => ({
  searchText: '',
  dispatchedRange: [dayjs('2026-11-03 00:00:00'), dayjs('2026-11-10 23:59:59')],
  rewardType: 'all',
});
const splitTerms = (value: string) => value.split(',').map((term) => term.trim().toLowerCase()).filter(Boolean);
const formatCurrency = (value: number) => `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const rewardTypeLabels: Record<RewardType, string> = { cash: '彩金', freespin: '免费旋转', both: '彩金+免费旋转' };
const getRewardType = (row: AppLoginRewardRecord): RewardType => row.cashAmount === null ? 'freespin' : row.fsCount === null ? 'cash' : 'both';
const getRewardContent = (row: AppLoginRewardRecord) => {
  const parts: string[] = [];
  if (row.cashAmount !== null) {
    const rollover = row.rolloverMultiplier === 0 ? '无流水' : `${row.rolloverMultiplier}倍流水`;
    parts.push(`彩金 ${formatCurrency(row.cashAmount)}（${rollover}）`);
  }
  if (row.fsCount !== null) parts.push(`${row.fsProvider} / ${row.fsGame} ${row.fsCount} 次`);
  return parts.join('；');
};

const statisticCardStyle: React.CSSProperties = { height: '100%' };
const statisticValueStyle: React.CSSProperties = {
  fontSize: 22,
  lineHeight: 1.25,
  whiteSpace: 'nowrap',
};

// Share column order and displayed text between the table and CSV export.
const reportFields: { key: string; title: string; width: number; value: (row: AppLoginRewardRecord) => string }[] = [
  { key: 'dispatchedAt', title: '派发时间', width: 180, value: (row) => row.dispatchedAt },
  { key: 'account', title: '会员账号', width: 170, value: (row) => row.account },
  { key: 'phone', title: '手机号', width: 135, value: (row) => row.phone },
  { key: 'uid', title: 'UID', width: 110, value: (row) => row.uid },
  { key: 'terminal', title: '登录终端', width: 100, value: (row) => row.terminal },
  { key: 'rewardType', title: '奖励类型', width: 160, value: (row) => rewardTypeLabels[getRewardType(row)] },
  { key: 'rewardContent', title: '奖励内容', width: 420, value: getRewardContent },
  { key: 'dispatchStatus', title: '派发状态', width: 100, value: () => '已派发' },
];

function downloadCsv(rows: AppLoginRewardRecord[]) {
  const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const csvRows = [
    reportFields.map((field) => field.title),
    ...rows.map((row) => reportFields.map((field) => field.value(row))),
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
  const [filters, setFilters] = useState<ReportFilters>(getDefaultFilters);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (open) {
      const defaults = getDefaultFilters();
      form.setFieldsValue({ ...defaults, dispatchedRange: defaults.dispatchedRange ?? undefined });
      setFilters(defaults);
      setPage(1);
    }
  }, [open, form]);

  const filteredRows = useMemo(() => {
    const terms = splitTerms(filters.searchText ?? '');
    return appLoginRewardRecords.filter((row) => {
      if (filters.dispatchedRange) {
        const [start, end] = filters.dispatchedRange;
        // Compare GMT+8 wall-clock values independently of browser timezone.
        if (row.dispatchedAt < start.format('YYYY-MM-DD HH:mm:ss') || row.dispatchedAt > end.format('YYYY-MM-DD HH:mm:ss')) return false;
      }
      if (terms.length && !terms.some((term) => row.account.toLowerCase().includes(term) || row.phone.includes(term))) return false;
      return filters.rewardType === 'all' || getRewardType(row) === filters.rewardType;
    });
  }, [filters]);

  const stats = useMemo(() => ({
    members: new Set(filteredRows.map((row) => row.uid)).size,
    cash: filteredRows.reduce((sum, row) => sum + (row.cashAmount ?? 0), 0),
    spins: filteredRows.reduce((sum, row) => sum + (row.fsCount ?? 0), 0),
  }), [filteredRows]);

  const columns: ColumnsType<AppLoginRewardRecord> = reportFields.map(({ key, title, width, value }) => ({
    key, title, width,
    fixed: key === 'dispatchedAt' ? 'left' : undefined,
    sorter: key === 'dispatchedAt' ? (a, b) => a.dispatchedAt.localeCompare(b.dispatchedAt) : undefined,
    onHeaderCell: () => ({ 'data-e2e-id': `${E2E}-table-header-${key}` } as React.HTMLAttributes<HTMLTableCellElement>),
    render: (_, row) => value(row),
  }));

  const resetFilters = () => {
    const defaults = getDefaultFilters();
    form.resetFields();
    form.setFieldsValue({ ...defaults, dispatchedRange: defaults.dispatchedRange ?? undefined });
    setFilters(defaults);
    setPage(1);
  };

  return (
    <Modal title="App登录奖励 - 报表" open={open} onCancel={onClose} width="94%" style={{ top: 20 }}
      closeIcon={<CloseOutlined data-e2e-id={`${E2E}-close-icon`} />}
      styles={{ body: { maxHeight: '78vh', overflowY: 'auto', padding: 16 } }}
      footer={<div style={{ textAlign: 'right' }}><Button data-e2e-id={`${E2E}-footer-close-btn`} onClick={onClose}>关闭</Button></div>}>
      <div data-e2e-id={`${E2E}-modal`}>
        <Card style={{ marginBottom: 16 }}>
          <Form form={form} layout="inline" initialValues={getDefaultFilters()} style={{ gap: 10, rowGap: 12, flexWrap: 'wrap' }}
            onFinish={(values: ReportFilters) => { setFilters(values); setPage(1); }}>
            <Form.Item name="dispatchedRange" label="派发时间">
              <DatePicker.RangePicker data-e2e-id={`${E2E}-filter-dispatched-range`} showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: 360 }} />
            </Form.Item>
            <Form.Item name="searchText" label="会员账号/手机号">
              <Input data-e2e-id={`${E2E}-filter-search-input`} allowClear placeholder="输入账号或手机号，多个以逗号分隔" style={{ width: 280 }} />
            </Form.Item>
            <Form.Item name="rewardType" label="奖励类型">
              <Select data-e2e-id={`${E2E}-filter-reward-type-select`} style={{ width: 160 }} options={[
                { value: 'all', label: '全部' }, { value: 'cash', label: '彩金' }, { value: 'freespin', label: '免费旋转' }, { value: 'both', label: '彩金+免费旋转' },
              ]} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button data-e2e-id={`${E2E}-filter-query-btn`} type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
                <Button data-e2e-id={`${E2E}-filter-reset-btn`} icon={<ReloadOutlined />} onClick={resetFilters}>重置</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col flex="1" style={{ minWidth: 0 }}>
            <Card style={statisticCardStyle}><Statistic data-e2e-id={`${E2E}-summary-members`} title="派发人数" value={stats.members} valueStyle={statisticValueStyle} /></Card>
          </Col>
          <Col flex="1" style={{ minWidth: 0 }}>
            <Card style={statisticCardStyle}><Statistic data-e2e-id={`${E2E}-summary-cash`} title="彩金派发总额" value={stats.cash} formatter={() => formatCurrency(stats.cash)} valueStyle={statisticValueStyle} /></Card>
          </Col>
          <Col flex="1" style={{ minWidth: 0 }}>
            <Card style={statisticCardStyle}><Statistic data-e2e-id={`${E2E}-summary-spins`} title="免费旋转总次数" value={stats.spins} suffix="次" valueStyle={statisticValueStyle} /></Card>
          </Col>
        </Row>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <Space wrap>
              <Button data-e2e-id={`${E2E}-toolbar-export-btn`} icon={<DownloadOutlined />} onClick={() => downloadCsv(filteredRows)}>导出</Button>
            </Space>
            <Space>
              <Tooltip title="刷新">
                <Button data-e2e-id={`${E2E}-toolbar-refresh-btn`} aria-label="刷新" icon={<ReloadOutlined />} onClick={() => {
                  setFilters((current) => ({ ...current }));
                  message.success('列表已刷新');
                }} />
              </Tooltip>
            </Space>
          </div>
          <Table data-e2e-id={`${E2E}-table`} columns={columns} dataSource={filteredRows} rowKey="orderId" size="small" scroll={{ x: 1475 }}
            onRow={(row) => ({ 'data-e2e-id': `${E2E}-table-row-${row.orderId}` } as React.HTMLAttributes<HTMLTableRowElement>)}
            pagination={{ current: page, pageSize: 20, showSizeChanger: false, onChange: setPage, showTotal: (total) => `共 ${total} 笔`,
              itemRender: (pageNumber, type, originalElement) => <span data-e2e-id={`${E2E}-pagination-${type}-${pageNumber}`}>{originalElement}</span>,
            }} />
        </Card>
      </div>
    </Modal>
  );
}

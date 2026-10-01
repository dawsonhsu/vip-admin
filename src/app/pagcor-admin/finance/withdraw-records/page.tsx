'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Checkbox, Col, DatePicker, Dropdown, Form, Input, Popover, Row, Select, Space, Table, Typography } from 'antd';
import { ColumnHeightOutlined, FolderOpenOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { usePagcorSite, type PagcorDataSite } from '@/components/PagcorSiteContext';
import { generatePagcorWithdrawals, pagcorWithdrawAccountTypes, type PagcorWithdrawal, pagcorWithdrawalStatuses } from '@/data/pagcorFinanceData';
import { downloadCsv, formatPagcorAmount, rangeOf, toCsvCell, type PagcorQuickRange } from '@/lib/pagcorReportUtils';

const { Title } = Typography;
const { RangePicker } = DatePicker;

// Build each end independently to avoid shared Dayjs internals triggering rc-util isEqual warnings.
function rangeLastDays(days: number): [Dayjs, Dayjs] {
  const ts = Date.now();
  const from = dayjs(ts);
  const to = dayjs(ts);
  return [from.subtract(days - 1, 'day').startOf('day'), to.endOf('day')];
}

interface Filters {
  username?: string;
  uid?: string;
  phone?: string;
  status?: PagcorWithdrawal['status'];
  accountType?: string;
  dateRange?: [Dayjs | null, Dayjs | null] | null;
}

const columns: ColumnsType<PagcorWithdrawal> = [
  { title: '订单号', key: 'id', dataIndex: 'id', width: 220, align: 'center', fixed: 'left' },
  { title: 'UID', key: 'uid', dataIndex: 'uid', width: 200, align: 'center', onCell: () => ({ style: { whiteSpace: 'nowrap' } }) },
  { title: '用户名', key: 'username', dataIndex: 'username', width: 190, align: 'center' },
  { title: '手机号', key: 'phone', dataIndex: 'phone', width: 150, align: 'center' },
  { title: '门店', key: 'site', dataIndex: 'site', width: 280, align: 'center', ellipsis: true },
  { title: '提款金额', key: 'amount', dataIndex: 'amount', width: 150, align: 'center', render: formatPagcorAmount },
  { title: '到账金额', key: 'paidAmount', dataIndex: 'paidAmount', width: 150, align: 'center', render: formatPagcorAmount },
  { title: '手续费', key: 'fee', dataIndex: 'fee', width: 130, align: 'center', render: formatPagcorAmount },
  { title: '提款账户类型', key: 'accountType', dataIndex: 'accountType', width: 160, align: 'center' },
  { title: '状态', key: 'status', dataIndex: 'status', width: 120, align: 'center' },
  { title: '创建时间', key: 'createdAt', dataIndex: 'createdAt', width: 190, align: 'center' },
  { title: '更新时间', key: 'updatedAt', dataIndex: 'updatedAt', width: 190, align: 'center' },
];

const exportColumns: Array<[string, (record: PagcorWithdrawal) => string]> = [
  ['订单号', (r) => String(r.id)],
  ['UID', (r) => String(r.uid)],
  ['用户名', (r) => String(r.username)],
  ['手机号', (r) => String(r.phone)],
  ['门店', (r) => String(r.site)],
  ['提款金额', (r) => formatPagcorAmount(r.amount)],
  ['到账金额', (r) => formatPagcorAmount(r.paidAmount)],
  ['手续费', (r) => formatPagcorAmount(r.fee)],
  ['提款账户类型', (r) => String(r.accountType)],
  ['状态', (r) => r.status],
  ['创建时间', (r) => String(r.createdAt)],
  ['更新时间', (r) => String(r.updatedAt)],
];

const quickButtons: Array<{ key: PagcorQuickRange; label: string; id: string }> = [
  { key: 'today', label: '今 日', id: 'today' },
  { key: 'yesterday', label: '昨 日', id: 'yesterday' },
  { key: 'week', label: '本 周', id: 'week' },
  { key: 'month', label: '本 月', id: 'month' },
  { key: 'lastMonth', label: '上 月', id: 'last-month' },
];

export default function WithdrawRecordsPage() {
  const [form] = Form.useForm<Filters>();
  const { site } = usePagcorSite();
  const brand: PagcorDataSite = site === 'filplay' ? 'filplay' : 'filbet';
  const [allRecords, setAllRecords] = useState<Record<PagcorDataSite, PagcorWithdrawal[]>>({ filbet: [], filplay: [] });
  const [filters, setFilters] = useState<Filters>({});
  const [activeQuick, setActiveQuick] = useState<PagcorQuickRange | null>(null);
  const [mounted, setMounted] = useState(false);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [density, setDensity] = useState<'small' | 'middle' | 'large'>('small');
  const [visibleColumns, setVisibleColumns] = useState(columns.map((column) => String(column.key)));

  useEffect(() => {
    const anchor = dayjs();
    setAllRecords({
      filbet: generatePagcorWithdrawals('filbet', anchor, 180),
      filplay: generatePagcorWithdrawals('filplay', anchor, 60),
    });
    const defaults: { dateRange: [Dayjs, Dayjs] } = { dateRange: rangeLastDays(30) };
    form.setFieldsValue(defaults);
    setFilters(defaults);
    setMounted(true);
  }, [form]);

  const onReset = () => {
    const defaults: { dateRange: [Dayjs, Dayjs] } = { dateRange: rangeLastDays(30) };
    form.resetFields();
    form.setFieldsValue(defaults);
    setFilters(defaults);
    setActiveQuick(null);
    setCurrent(1);
  };

  useEffect(() => {
    const nextOptions = pagcorWithdrawAccountTypes[brand];
    const value = form.getFieldValue('accountType');
    if (value !== undefined && !nextOptions.includes(value)) {
      form.setFieldsValue({ accountType: undefined });
    }
    setFilters((previous) => previous.accountType !== undefined && !nextOptions.includes(previous.accountType)
      ? { ...previous, accountType: undefined } : previous);
    setCurrent(1);
  }, [brand, form]);

  const filteredData = useMemo(() => allRecords[brand].filter((record) => {
    if (filters.username && !record.username.includes(filters.username.trim())) return false;
    if (filters.uid && !record.uid.includes(filters.uid.trim())) return false;
    if (filters.accountType && record.accountType !== filters.accountType) return false;
    if (filters.phone && !record.phone.includes(filters.phone.trim())) return false;
    if (filters.status && record.status !== filters.status) return false;
    const range = filters.dateRange;
    const time = dayjs(record.createdAt);
    if (range?.[0] && time.isBefore(range[0])) return false;
    if (range?.[1] && time.isAfter(range[1])) return false;
    return true;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [allRecords, brand, filters]);

  const onSearch = () => {
    const values = form.getFieldsValue();
    setFilters({
      ...values,
      dateRange: values.dateRange ? [values.dateRange[0]?.startOf('day') ?? null, values.dateRange[1]?.endOf('day') ?? null] : null,
    });
    setCurrent(1);
  };

  const onExport = () => {
    const lines = [
      exportColumns.map(([title]) => title).map(toCsvCell).join(','),
      ...filteredData.map((record) => exportColumns.map(([, get]) => get(record)).map(toCsvCell).join(',')),
    ];
    downloadCsv(`提款记录_${dayjs().format('YYYYMMDD_HHmmss')}.csv`, lines.join('\n'));
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }} data-e2e-id="withdraw-records-filter-card">
        <Form form={form} layout="horizontal" colon={false} labelCol={{ flex: '0 0 88px' }} wrapperCol={{ flex: '1 1 0', style: { minWidth: 0 } }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="username" label="用户名">
                <Input data-e2e-id="withdraw-records-filter-username-input" placeholder="请输入用户名" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="phone" label="手机号">
                <Input data-e2e-id="withdraw-records-filter-phone-input" placeholder="请输入手机号" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="uid" label="UID">
                <Input data-e2e-id="withdraw-records-filter-uid-input" placeholder="请输入UID" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="status" label="状态">
                <Select data-e2e-id="withdraw-records-filter-status-select" placeholder="请选择" allowClear
                  options={pagcorWithdrawalStatuses.map((value) => ({ value, label: value }))} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="accountType" label="提款账户类型">
                <Select data-e2e-id="withdraw-records-filter-account-type-select" placeholder="请选择" allowClear
                  options={pagcorWithdrawAccountTypes[brand].map((value) => ({ value, label: value }))} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="选择日期">
                <Space wrap={false} size={8}>
                  <Form.Item name="dateRange" noStyle>
                    <RangePicker data-e2e-id="withdraw-records-filter-date-range"
                      format="YYYY-MM-DD" placeholder={['开始日期', '结束日期']} style={{ width: 280 }}
                      onChange={() => setActiveQuick(null)} />
                  </Form.Item>
                  {quickButtons.map((button) => (
                    <Button key={button.key} data-e2e-id={`withdraw-records-filter-quick-${button.id}-btn`}
                      type={activeQuick === button.key ? 'primary' : 'text'}
                      onClick={() => { setActiveQuick(button.key); form.setFieldsValue({ dateRange: rangeOf(button.key) }); }}>
                      {button.label}
                    </Button>
                  ))}
                </Space>
              </Form.Item>
            </Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button data-e2e-id="withdraw-records-filter-reset-btn" onClick={onReset}
                style={{ background: '#e6a23c', borderColor: '#e6a23c', color: '#fff' }}>重 置</Button>
              <Button data-e2e-id="withdraw-records-filter-search-btn" onClick={onSearch}
                style={{ background: '#67c23a', borderColor: '#67c23a', color: '#fff' }}>搜 索</Button>
            </Space>
          </div>
        </Form>
      </Card>
      <Card data-e2e-id="withdraw-records-table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Title level={5} style={{ margin: 0 }}>提款记录</Title>
          <Space>
            <Button data-e2e-id="withdraw-records-toolbar-export-btn" type="primary" icon={<FolderOpenOutlined />} onClick={onExport}>导 出</Button>
            <Button data-e2e-id="withdraw-records-toolbar-refresh-btn" aria-label="刷新" icon={<ReloadOutlined />}
              onClick={() => { setFilters({ ...filters }); setCurrent(1); }} />
            <Dropdown trigger={['click']} menu={{
              selectedKeys: [density],
              items: [{ key: 'small', label: <span data-e2e-id="withdraw-records-density-small">紧凑</span> },
                { key: 'middle', label: <span data-e2e-id="withdraw-records-density-middle">默认</span> },
                { key: 'large', label: <span data-e2e-id="withdraw-records-density-large">宽松</span> }],
              onClick: ({ key }) => { if (key === 'small' || key === 'middle' || key === 'large') setDensity(key); },
            }}>
              <Button data-e2e-id="withdraw-records-toolbar-density-btn" aria-label="表格密度" icon={<ColumnHeightOutlined />} />
            </Dropdown>
            <Popover trigger="click" placement="bottomRight" content={(
              <Space direction="vertical">
                {columns.map((column) => (
                  <Checkbox key={String(column.key)} data-e2e-id={`withdraw-records-column-${String(column.key).replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}-checkbox`}
                    checked={visibleColumns.includes(String(column.key))}
                    disabled={visibleColumns.length === 1 && visibleColumns.includes(String(column.key))}
                    onChange={(event) => setVisibleColumns((previous) => event.target.checked
                      ? [...previous, String(column.key)] : previous.filter((key) => key !== String(column.key)))}>
                    {String(column.title)}
                  </Checkbox>
                ))}
              </Space>
            )}>
              <Button data-e2e-id="withdraw-records-toolbar-settings-btn" aria-label="列设置" icon={<SettingOutlined />} />
            </Popover>
          </Space>
        </div>
        <Table<PagcorWithdrawal>
          data-e2e-id="withdraw-records-table"
          columns={columns.filter((column) => visibleColumns.includes(String(column.key)))}
          dataSource={mounted ? filteredData : []} rowKey="id"
          onRow={(record) => ({ 'data-e2e-id': `withdraw-records-table-row-${record.id.toLowerCase()}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          scroll={{ x: 2130 }} size={density}
          pagination={{ current, pageSize, showSizeChanger: true, showQuickJumper: true,
            onChange: (page, size) => { setCurrent(size === pageSize ? page : 1); setPageSize(size); },
            showTotal: (total, range) => `当前：第 ${Math.ceil(range[0] / pageSize)} 页, 共 ${total} 条数据`,
          }}
        />
      </Card>
    </div>
  );
}

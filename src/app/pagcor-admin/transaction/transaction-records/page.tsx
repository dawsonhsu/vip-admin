'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Checkbox, Col, DatePicker, Dropdown, Form, Input, Popover, Row, Select, Space, Table, Typography } from 'antd';
import { ColumnHeightOutlined, FolderOpenOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import PagcorBrandTabs, { pagcorBrandLabels, type PagcorBrand } from '@/components/PagcorBrandTabs';
import { generatePagcorTransactions, pagcorTransactionTypes, type PagcorTransaction } from '@/data/pagcorFinanceData';
import { downloadCsv, formatPagcorAmount, rangeOf, toCsvCell, type PagcorQuickRange } from '@/lib/pagcorReportUtils';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface Filters {
  username?: string;
  uid?: string;
  type?: PagcorTransaction['type'];
  dateRange?: [Dayjs | null, Dayjs | null] | null;
}

const formatSignedAmount = (value: number) => `${value > 0 ? '+' : ''}${formatPagcorAmount(value)}`;

const columns: ColumnsType<PagcorTransaction> = [
  { title: '流水号', key: 'id', dataIndex: 'id', width: 220, align: 'center', fixed: 'left' },
  { title: 'UID', key: 'uid', dataIndex: 'uid', width: 200, align: 'center', onCell: () => ({ style: { whiteSpace: 'nowrap' } }) },
  { title: '用户名', key: 'username', dataIndex: 'username', width: 190, align: 'center' },
  { title: 'VIP', key: 'vip', dataIndex: 'vip', width: 90, align: 'center' },
  { title: '交易类型', key: 'type', dataIndex: 'type', width: 120, align: 'center' },
  { title: '交易前金额', key: 'before', dataIndex: 'before', width: 160, align: 'center', render: formatPagcorAmount },
  { title: '交易金额', key: 'amount', dataIndex: 'amount', width: 160, align: 'center', render: formatSignedAmount },
  { title: '交易后金额', key: 'after', dataIndex: 'after', width: 160, align: 'center', render: formatPagcorAmount },
  { title: '交易时间', key: 'createdAt', dataIndex: 'createdAt', width: 190, align: 'center' },
];

const exportColumns: Array<[string, (record: PagcorTransaction) => string]> = [
  ['流水号', (r) => String(r.id)],
  ['UID', (r) => String(r.uid)],
  ['用户名', (r) => String(r.username)],
  ['VIP', (r) => String(r.vip)],
  ['交易类型', (r) => String(r.type)],
  ['交易前金额', (r) => formatPagcorAmount(r.before)],
  ['交易金额', (r) => formatSignedAmount(r.amount)],
  ['交易后金额', (r) => formatPagcorAmount(r.after)],
  ['交易时间', (r) => String(r.createdAt)],
];

const quickButtons: Array<{ key: PagcorQuickRange; label: string; id: string }> = [
  { key: 'today', label: '今 日', id: 'today' },
  { key: 'yesterday', label: '昨 日', id: 'yesterday' },
  { key: 'week', label: '本 周', id: 'week' },
  { key: 'month', label: '本 月', id: 'month' },
  { key: 'lastMonth', label: '上 月', id: 'last-month' },
];

export default function TransactionRecordsPage() {
  const [form] = Form.useForm<Filters>();
  const [brand, setBrand] = useState<PagcorBrand>('filbet');
  const [allRecords, setAllRecords] = useState<Record<PagcorBrand, PagcorTransaction[]>>({ filbet: [], filplay: [] });
  const [filters, setFilters] = useState<Filters>({});
  const [activeQuick, setActiveQuick] = useState<PagcorQuickRange | null>('month');
  const [mounted, setMounted] = useState(false);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [density, setDensity] = useState<'small' | 'middle' | 'large'>('small');
  const [visibleColumns, setVisibleColumns] = useState(columns.map((column) => String(column.key)));

  useEffect(() => {
    const anchor = dayjs();
    setAllRecords({
      filbet: generatePagcorTransactions('filbet', anchor, 400),
      filplay: generatePagcorTransactions('filplay', anchor, 150),
    });
    const defaults = { dateRange: rangeOf('month') };
    form.setFieldsValue(defaults);
    setFilters(defaults);
    setMounted(true);
  }, [form]);

  const onReset = () => {
    const defaults = { dateRange: rangeOf('month') };
    form.resetFields();
    form.setFieldsValue(defaults);
    setFilters(defaults);
    setActiveQuick('month');
    setCurrent(1);
  };

  const onBrandChange = (nextBrand: PagcorBrand) => {
    setBrand(nextBrand);
    onReset();
  };

  const filteredData = useMemo(() => allRecords[brand].filter((record) => {
    if (filters.username && !record.username.includes(filters.username.trim())) return false;
    if (filters.uid && !record.uid.includes(filters.uid.trim())) return false;
    if (filters.type && record.type !== filters.type) return false;
    const range = filters.dateRange;
    const time = dayjs(record.createdAt);
    if (range?.[0] && time.isBefore(range[0])) return false;
    if (range?.[1] && time.isAfter(range[1])) return false;
    return true;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [allRecords, brand, filters]);

  const onSearch = () => {
    setFilters(form.getFieldsValue());
    setCurrent(1);
  };

  const onExport = () => {
    const lines = [
      ['品牌归属', ...exportColumns.map(([title]) => title)].map(toCsvCell).join(','),
      ...filteredData.map((record) => [brand, ...exportColumns.map(([, get]) => get(record))].map(toCsvCell).join(',')),
    ];
    downloadCsv(`交易记录_${pagcorBrandLabels[brand]}_${dayjs().format('YYYYMMDD_HHmmss')}.csv`, lines.join('\n'));
  };

  return (
    <div>
      <PagcorBrandTabs value={brand} onChange={onBrandChange} e2ePrefix="transaction-records" />
      <Card style={{ marginBottom: 16 }} data-e2e-id="transaction-records-filter-card">
        <Form form={form} layout="horizontal" colon={false} labelCol={{ flex: '0 0 88px' }} wrapperCol={{ flex: 1 }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="username" label="用户名">
                <Input data-e2e-id="transaction-records-filter-username-input" placeholder="请输入用户名" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="uid" label="UID">
                <Input data-e2e-id="transaction-records-filter-uid-input" placeholder="请输入UID" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="type" label="交易类型">
                <Select data-e2e-id="transaction-records-filter-type-select" placeholder="请选择" allowClear
                  options={pagcorTransactionTypes.map((value) => ({ value, label: value }))} />
              </Form.Item>
            </Col>
            <Col xs={24} xl={18}>
              <Form.Item label="交易时间">
                <Space wrap size={8}>
                  <Form.Item name="dateRange" noStyle>
                    <RangePicker data-e2e-id="transaction-records-filter-date-range" showTime
                      format="YYYY-MM-DD HH:mm:ss" placeholder={['开始日期', '结束日期']} style={{ width: 380 }}
                      onChange={() => setActiveQuick(null)} />
                  </Form.Item>
                  {quickButtons.map((button) => (
                    <Button key={button.key} data-e2e-id={`transaction-records-filter-quick-${button.id}-btn`}
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
              <Button data-e2e-id="transaction-records-filter-reset-btn" onClick={onReset}
                style={{ background: '#e6a23c', borderColor: '#e6a23c', color: '#fff' }}>重 置</Button>
              <Button data-e2e-id="transaction-records-filter-search-btn" onClick={onSearch}
                style={{ background: '#67c23a', borderColor: '#67c23a', color: '#fff' }}>搜 索</Button>
            </Space>
          </div>
        </Form>
      </Card>
      <Card data-e2e-id="transaction-records-table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Title level={5} style={{ margin: 0 }}>交易记录 · {pagcorBrandLabels[brand]}</Title>
          <Space>
            <Button data-e2e-id="transaction-records-toolbar-export-btn" type="primary" icon={<FolderOpenOutlined />} onClick={onExport}>导 出</Button>
            <Button data-e2e-id="transaction-records-toolbar-refresh-btn" aria-label="刷新" icon={<ReloadOutlined />}
              onClick={() => { setFilters({ ...filters }); setCurrent(1); }} />
            <Dropdown trigger={['click']} menu={{
              selectedKeys: [density],
              items: [{ key: 'small', label: <span data-e2e-id="transaction-records-density-small">紧凑</span> },
                { key: 'middle', label: <span data-e2e-id="transaction-records-density-middle">默认</span> },
                { key: 'large', label: <span data-e2e-id="transaction-records-density-large">宽松</span> }],
              onClick: ({ key }) => { if (key === 'small' || key === 'middle' || key === 'large') setDensity(key); },
            }}>
              <Button data-e2e-id="transaction-records-toolbar-density-btn" aria-label="表格密度" icon={<ColumnHeightOutlined />} />
            </Dropdown>
            <Popover trigger="click" placement="bottomRight" content={(
              <Space direction="vertical">
                {columns.map((column) => (
                  <Checkbox key={String(column.key)} data-e2e-id={`transaction-records-column-${String(column.key).replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}-checkbox`}
                    checked={visibleColumns.includes(String(column.key))}
                    disabled={visibleColumns.length === 1 && visibleColumns.includes(String(column.key))}
                    onChange={(event) => setVisibleColumns((previous) => event.target.checked
                      ? [...previous, String(column.key)] : previous.filter((key) => key !== String(column.key)))}>
                    {String(column.title)}
                  </Checkbox>
                ))}
              </Space>
            )}>
              <Button data-e2e-id="transaction-records-toolbar-settings-btn" aria-label="列设置" icon={<SettingOutlined />} />
            </Popover>
          </Space>
        </div>
        <Table<PagcorTransaction>
          data-e2e-id="transaction-records-table"
          columns={columns.filter((column) => visibleColumns.includes(String(column.key)))}
          dataSource={mounted ? filteredData : []} rowKey="id"
          onRow={(record) => ({ 'data-e2e-id': `transaction-records-table-row-${record.id.toLowerCase()}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          scroll={{ x: 1490 }} size={density}
          pagination={{ current, pageSize, showSizeChanger: true, showQuickJumper: true,
            onChange: (page, size) => { setCurrent(size === pageSize ? page : 1); setPageSize(size); },
            showTotal: (total, range) => `当前：第 ${Math.ceil(range[0] / pageSize)} 页, 共 ${total} 条数据`,
          }}
        />
      </Card>
    </div>
  );
}

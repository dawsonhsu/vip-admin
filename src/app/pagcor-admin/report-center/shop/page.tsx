'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, DatePicker, Form, Row, Select, Space, Table, Typography } from 'antd';
import {
  ColumnHeightOutlined, FolderOpenOutlined, ReloadOutlined, SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import PagcorGgrInfo from '@/components/PagcorGgrInfo';
import {
  generatePagcorShopReport,
  pagcorCategories,
  pagcorProviders,
  type PagcorShopReportRow,
  type PagcorTaxAmounts,
} from '@/data/pagcorMockData';
import {
  derivePagcorAmounts,
  downloadCsv,
  formatPagcorAmount,
  rangeOf,
  seedForPagcorDateRange,
  toCsvCell,
  type PagcorQuickRange,
} from '@/lib/pagcorReportUtils';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const amount = (value: number) => formatPagcorAmount(value);

type AmountSide = 'onsite' | 'online';

const exportColumns: Array<[string, (r: PagcorShopReportRow) => string]> = [
  ['门店', (r) => r.shop],
  ['Onsite 有效投注', (r) => amount(r.onsite.validBet)],
  ['Onsite 有效派彩', (r) => amount(r.onsite.payout)],
  ['Onsite GGR', (r) => amount(derivePagcorAmounts(r.onsite).ggr)],
  ['Onsite FS 投注', (r) => amount(r.onsite.fsBet)],
  ['Onsite FS 派彩', (r) => amount(r.onsite.fsPayout)],
  ['Onsite FS GGR', (r) => amount(derivePagcorAmounts(r.onsite).fsGgr)],
  ['Onsite JP 貢獻', (r) => amount(r.onsite.jpContribution)],
  ['Onsite JP 派彩', (r) => amount(r.onsite.jpPayout)],
  ['Online 有效投注', (r) => amount(r.online.validBet)],
  ['Online 有效派彩', (r) => amount(r.online.payout)],
  ['Online GGR', (r) => amount(derivePagcorAmounts(r.online).ggr)],
  ['Online FS 投注', (r) => amount(r.online.fsBet)],
  ['Online FS 派彩', (r) => amount(r.online.fsPayout)],
  ['Online FS GGR', (r) => amount(derivePagcorAmounts(r.online).fsGgr)],
  ['Online JP 貢獻', (r) => amount(r.online.jpContribution)],
  ['Online JP 派彩', (r) => amount(r.online.jpPayout)],
];

function amountGroup(side: AmountSide, label: string): ColumnsType<PagcorShopReportRow>[number] {
  const infoId = `report-shop-${side}-ggr-info`;
  const read = (row: PagcorShopReportRow): PagcorTaxAmounts => row[side];
  return {
    title: label,
    align: 'center',
    children: [
      { title: '有效投注', width: 150, align: 'center', render: (_v, row) => amount(read(row).validBet) },
      { title: '有效派彩', width: 150, align: 'center', render: (_v, row) => amount(read(row).payout) },
      {
        title: <span>GGR<PagcorGgrInfo dataE2eId={infoId} /></span>,
        width: 150,
        align: 'center',
        render: (_v, row) => amount(derivePagcorAmounts(read(row)).ggr),
      },
      { title: 'FS 投注', width: 150, align: 'center', render: (_v, row) => amount(read(row).fsBet) },
      { title: 'FS 派彩', width: 150, align: 'center', render: (_v, row) => amount(read(row).fsPayout) },
      { title: 'FS GGR', width: 150, align: 'center', render: (_v, row) => amount(derivePagcorAmounts(read(row)).fsGgr) },
      { title: 'JP 貢獻', width: 150, align: 'center', render: (_v, row) => amount(read(row).jpContribution) },
      { title: 'JP 派彩', width: 150, align: 'center', render: (_v, row) => amount(read(row).jpPayout) },
    ],
  };
}

export default function ShopTaxReportPage() {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [activeQuick, setActiveQuick] = useState<PagcorQuickRange | null>('month');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    form.setFieldsValue({ dateRange: rangeOf('month') });
    setFilters({ dateRange: rangeOf('month') });
    setMounted(true);
  }, [form]);

  const allRows = useMemo(() => generatePagcorShopReport(
    seedForPagcorDateRange(filters.dateRange, 20260908),
  ), [filters.dateRange]);

  const filteredData = useMemo(() => allRows.filter((row) => {
    if (filters.provider && row.provider !== filters.provider) return false;
    if (filters.category && row.pagcorCategory !== filters.category) return false;
    return true;
  }), [allRows, filters]);

  const applyQuick = (key: PagcorQuickRange) => {
    const dateRange = rangeOf(key);
    setActiveQuick(key);
    form.setFieldsValue({ dateRange });
    setFilters((current) => ({ ...current, dateRange }));
  };

  const onReset = () => {
    form.resetFields();
    form.setFieldsValue({ dateRange: rangeOf('month') });
    setActiveQuick('month');
    setFilters({ dateRange: rangeOf('month') });
  };

  const onExport = () => {
    const lines = [
      exportColumns.map(([title]) => title).join(','),
      ...filteredData.map((row) => exportColumns.map(([, get]) => toCsvCell(get(row))).join(',')),
    ];
    downloadCsv(`门店税收报表_${dayjs().format('YYYYMMDD_HHmmss')}.csv`, lines.join('\n'));
  };

  const columns: ColumnsType<PagcorShopReportRow> = [
    { title: '门店', dataIndex: 'shop', width: 360, align: 'center', fixed: 'left', ellipsis: true },
    amountGroup('onsite', 'Onsite'),
    amountGroup('online', 'Online'),
  ];

  const quickButtons: Array<{ key: PagcorQuickRange; label: string }> = [
    { key: 'today', label: '今 日' },
    { key: 'yesterday', label: '昨 日' },
    { key: 'week', label: '本 周' },
    { key: 'month', label: '本 月' },
    { key: 'lastMonth', label: '上 月' },
  ];

  return (
    <div>
      <Card data-e2e-id="report-shop-filter-card" style={{ marginBottom: 16 }}>
        <Form form={form} layout="horizontal" colon={false} labelCol={{ flex: '0 0 112px' }} wrapperCol={{ flex: 1 }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="provider" label="游戏厂商">
                <Select data-e2e-id="report-shop-filter-provider-select" placeholder="请选择品牌" allowClear showSearch optionFilterProp="label" options={pagcorProviders.map((v) => ({ label: v, value: v }))} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="category" label="pagcor游戏分类">
                <Select data-e2e-id="report-shop-filter-category-select" placeholder="请选择" allowClear options={pagcorCategories.map((v) => ({ label: v, value: v }))} />
              </Form.Item>
            </Col>
            <Col xs={24} xl={12}>
              <Form.Item label="时间范围">
                <Space wrap size={8}>
                  <Form.Item name="dateRange" noStyle>
                    <RangePicker data-e2e-id="report-shop-filter-date-range" format="YYYY-MM-DD" placeholder={['开始日期', '结束日期']} style={{ width: 280 }} onChange={() => setActiveQuick(null)} />
                  </Form.Item>
                  {quickButtons.map((button) => (
                    <Button key={button.key} data-e2e-id={`report-shop-filter-quick-${button.key}-btn`} type={activeQuick === button.key ? 'primary' : 'text'} onClick={() => applyQuick(button.key)}>
                      {button.label}
                    </Button>
                  ))}
                </Space>
              </Form.Item>
            </Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button data-e2e-id="report-shop-filter-reset-btn" onClick={onReset} style={{ background: '#e6a23c', borderColor: '#e6a23c', color: '#fff' }}>重 置</Button>
              <Button data-e2e-id="report-shop-filter-search-btn" onClick={() => setFilters(form.getFieldsValue())} style={{ background: '#67c23a', borderColor: '#67c23a', color: '#fff' }}>搜 寻</Button>
            </Space>
          </div>
        </Form>
      </Card>

      <Card data-e2e-id="report-shop-table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Title level={5} style={{ margin: 0 }}>门店税收报表</Title>
          <Space>
            <Button data-e2e-id="report-shop-toolbar-export-btn" type="primary" icon={<FolderOpenOutlined />} onClick={onExport}>导 出</Button>
            <Button
              data-e2e-id="report-shop-toolbar-refresh-btn"
              icon={<ReloadOutlined />}
              onClick={() => setFilters((current) => ({
                ...current,
                dateRange: current.dateRange ? [...current.dateRange] : undefined,
              }))}
            />
            <Button data-e2e-id="report-shop-toolbar-density-btn" icon={<ColumnHeightOutlined />} />
            <Button data-e2e-id="report-shop-toolbar-settings-btn" icon={<SettingOutlined />} />
          </Space>
        </div>
        <Table
          data-e2e-id="report-shop-table"
          columns={columns}
          dataSource={mounted ? filteredData : []}
          rowKey="id"
          onRow={(record) => ({ 'data-e2e-id': `report-shop-table-row-${record.id}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          scroll={{ x: 2760 }}
          pagination={{ pageSize: 20, showSizeChanger: true, showQuickJumper: true, showTotal: (total, range) => `当前：第 ${Math.ceil(range[0] / 20)} 页, 共 ${total} 条数据` }}
          size="small"
        />
      </Card>
    </div>
  );
}

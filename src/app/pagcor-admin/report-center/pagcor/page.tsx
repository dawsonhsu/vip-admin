'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, DatePicker, Form, Row, Select, Space, Table, Typography } from 'antd';
import {
  ColumnHeightOutlined, FolderOpenOutlined, ReloadOutlined, SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { usePagcorSite } from '@/components/PagcorSiteContext';
import PagcorGgrInfo from '@/components/PagcorGgrInfo';
import {
  generatePagcorTaxReport,
  pagcorCategories,
  pagcorProviders,
  pagcorSites,
  type PagcorTaxReportRow,
} from '@/data/pagcorMockData';
import {
  pagcorSiteShare,
  scopePagcorAmounts,
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

const exportColumns: Array<[string, (r: PagcorTaxReportRow, index: number) => string]> = [
  ['序号', (_r, index) => String(index + 1)],
  ['游戏厂商', (r) => r.provider],
  ['厂商游戏分类', (r) => r.providerGameCategory],
  ['pagcor分类名称', (r) => r.pagcorCategory],
  ['Onsite 有效投注', (r) => amount(r.onsite.validBet)],
  ['Online 有效投注', (r) => amount(r.online.validBet)],
  ['Onsite FS 投注', (r) => amount(r.onsite.fsBet)],
  ['Online FS 投注', (r) => amount(r.online.fsBet)],
  ['Onsite JP 貢獻', (r) => amount(r.onsite.jpContribution)],
  ['Online JP 貢獻', (r) => amount(r.online.jpContribution)],
  ['Onsite 派彩', (r) => amount(r.onsite.payout)],
  ['Online 派彩', (r) => amount(r.online.payout)],
  ['Onsite FS 派彩', (r) => amount(r.onsite.fsPayout)],
  ['Online FS 派彩', (r) => amount(r.online.fsPayout)],
  ['Onsite JP 派彩', (r) => amount(r.onsite.jpPayout)],
  ['Online JP 派彩', (r) => amount(r.online.jpPayout)],
  ['Onsite 有效投注盈亏', (r) => amount(derivePagcorAmounts(r.onsite, r.rate).ggr)],
  ['Online 有效投注盈亏', (r) => amount(derivePagcorAmounts(r.online, r.rate).ggr)],
  ['Onsite FS 盈亏', (r) => amount(derivePagcorAmounts(r.onsite, r.rate).fsGgr)],
  ['Online FS 盈亏', (r) => amount(derivePagcorAmounts(r.online, r.rate).fsGgr)],
  ['税率', (r) => `${(r.rate * 100).toFixed(2)}%`],
  ['Onsite 有效税收', (r) => amount(derivePagcorAmounts(r.onsite, r.rate).tax)],
  ['Online 有效税收', (r) => amount(derivePagcorAmounts(r.online, r.rate).tax)],
  ['测试账号投注', (r) => amount(r.testValidBet)],
  ['测试账号派彩', (r) => amount(r.testPayout)],
  ['测试账号GGR', (r) => amount(r.testGgr)],
  ['最后操作人', (r) => r.lastOperator],
];

export default function PagcorTaxReportPage() {
  const { site } = usePagcorSite();
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [activeQuick, setActiveQuick] = useState<PagcorQuickRange | null>('month');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    form.setFieldsValue({ dateRange: rangeOf('month') });
    setFilters({ dateRange: rangeOf('month') });
    setMounted(true);
  }, [form]);

  const allRows = useMemo(() => {
    const seed = seedForPagcorDateRange(filters.dateRange, 20260907);
    return generatePagcorTaxReport(seed).map((row) => {
      const share = pagcorSiteShare(seed, row.id);
      const testAmounts = scopePagcorAmounts({
        validBet: row.testValidBet, payout: row.testPayout,
        fsBet: 0, fsPayout: 0, jpContribution: 0, jpPayout: 0,
      }, share, site);
      return {
        ...row,
        onsite: scopePagcorAmounts(row.onsite, share, site),
        online: scopePagcorAmounts(row.online, share, site),
        testValidBet: testAmounts.validBet,
        testPayout: testAmounts.payout,
        testGgr: Math.round(derivePagcorAmounts(testAmounts).ggr * 100) / 100,
      };
    });
  }, [filters.dateRange, site]);

  const filteredData = useMemo(() => allRows.filter((row) => {
    if (filters.site && row.site !== filters.site) return false;
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
      ...filteredData.map((row, index) => exportColumns.map(([, get]) => toCsvCell(get(row, index))).join(',')),
    ];
    downloadCsv(`Pagcor税收报表_${dayjs().format('YYYYMMDD_HHmmss')}.csv`, lines.join('\n'));
  };

  const quickButtons: Array<{ key: PagcorQuickRange; label: string }> = [
    { key: 'today', label: '今 日' },
    { key: 'yesterday', label: '昨 日' },
    { key: 'week', label: '本 周' },
    { key: 'month', label: '本 月' },
    { key: 'lastMonth', label: '上 月' },
  ];

  const columns: ColumnsType<PagcorTaxReportRow> = [
    { title: '序号', width: 80, align: 'center', fixed: 'left', render: (_v, _r, index) => index + 1 },
    { title: '游戏厂商', dataIndex: 'provider', width: 120, align: 'center', fixed: 'left' },
    { title: '厂商游戏分类', dataIndex: 'providerGameCategory', width: 160, align: 'center' },
    { title: 'pagcor分类名称', dataIndex: 'pagcorCategory', width: 160, align: 'center' },
    { title: 'Onsite 有效投注', width: 150, align: 'center', render: (_v, r) => amount(r.onsite.validBet) },
    { title: 'Online 有效投注', width: 150, align: 'center', render: (_v, r) => amount(r.online.validBet) },
    { title: 'Onsite FS 投注', width: 150, align: 'center', render: (_v, r) => amount(r.onsite.fsBet) },
    { title: 'Online FS 投注', width: 150, align: 'center', render: (_v, r) => amount(r.online.fsBet) },
    { title: 'Onsite JP 貢獻', width: 150, align: 'center', render: (_v, r) => amount(r.onsite.jpContribution) },
    { title: 'Online JP 貢獻', width: 150, align: 'center', render: (_v, r) => amount(r.online.jpContribution) },
    { title: 'Onsite 派彩', width: 150, align: 'center', render: (_v, r) => amount(r.onsite.payout) },
    { title: 'Online 派彩', width: 150, align: 'center', render: (_v, r) => amount(r.online.payout) },
    { title: 'Onsite FS 派彩', width: 150, align: 'center', render: (_v, r) => amount(r.onsite.fsPayout) },
    { title: 'Online FS 派彩', width: 150, align: 'center', render: (_v, r) => amount(r.online.fsPayout) },
    { title: 'Onsite JP 派彩', width: 150, align: 'center', render: (_v, r) => amount(r.onsite.jpPayout) },
    { title: 'Online JP 派彩', width: 150, align: 'center', render: (_v, r) => amount(r.online.jpPayout) },
    {
      title: <span>Onsite 有效投注盈亏<PagcorGgrInfo dataE2eId="report-pagcor-onsite-ggr-info" /></span>,
      width: 190,
      align: 'center',
      render: (_v, r) => amount(derivePagcorAmounts(r.onsite, r.rate).ggr),
    },
    {
      title: <span>Online 有效投注盈亏<PagcorGgrInfo dataE2eId="report-pagcor-online-ggr-info" /></span>,
      width: 190,
      align: 'center',
      render: (_v, r) => amount(derivePagcorAmounts(r.online, r.rate).ggr),
    },
    { title: 'Onsite FS 盈亏', width: 150, align: 'center', render: (_v, r) => amount(derivePagcorAmounts(r.onsite, r.rate).fsGgr) },
    { title: 'Online FS 盈亏', width: 150, align: 'center', render: (_v, r) => amount(derivePagcorAmounts(r.online, r.rate).fsGgr) },
    { title: '税率', width: 110, align: 'center', render: (_v, r) => `${(r.rate * 100).toFixed(2)}%` },
    { title: 'Onsite 有效税收', width: 150, align: 'center', render: (_v, r) => amount(derivePagcorAmounts(r.onsite, r.rate).tax) },
    { title: 'Online 有效税收', width: 150, align: 'center', render: (_v, r) => amount(derivePagcorAmounts(r.online, r.rate).tax) },
    { title: '测试账号投注', dataIndex: 'testValidBet', width: 150, align: 'center', render: amount },
    { title: '测试账号派彩', dataIndex: 'testPayout', width: 150, align: 'center', render: amount },
    { title: '测试账号GGR', dataIndex: 'testGgr', width: 150, align: 'center', render: amount },
    { title: '最后操作人', dataIndex: 'lastOperator', width: 130, align: 'center' },
  ];

  return (
    <div>
      <Card data-e2e-id="report-pagcor-filter-card" style={{ marginBottom: 16 }}>
        <Form form={form} layout="horizontal" colon={false} labelCol={{ flex: '0 0 96px' }} wrapperCol={{ flex: '1 1 0', style: { minWidth: 0 } }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="site" label="业务归属">
                <Select data-e2e-id="report-pagcor-filter-site-select" placeholder="请选择" allowClear showSearch optionFilterProp="label" options={pagcorSites.map((v) => ({ label: v, value: v }))} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="provider" label="游戏厂商">
                <Select data-e2e-id="report-pagcor-filter-provider-select" placeholder="请选择品牌" allowClear showSearch optionFilterProp="label" options={pagcorProviders.map((v) => ({ label: v, value: v }))} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="category" label="Pagcor分类">
                <Select data-e2e-id="report-pagcor-filter-category-select" placeholder="请选择" allowClear options={pagcorCategories.map((v) => ({ label: v, value: v }))} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="选择日期">
                <Space wrap={false} size={8}>
                  <Form.Item name="dateRange" noStyle>
                    <RangePicker data-e2e-id="report-pagcor-filter-date-range" format="YYYY-MM-DD" placeholder={['开始日期', '结束日期']} style={{ width: 280 }} onChange={() => setActiveQuick(null)} />
                  </Form.Item>
                  {quickButtons.map((button) => (
                    <Button key={button.key} data-e2e-id={`report-pagcor-filter-quick-${button.key}-btn`} type={activeQuick === button.key ? 'primary' : 'text'} onClick={() => applyQuick(button.key)}>
                      {button.label}
                    </Button>
                  ))}
                </Space>
              </Form.Item>
            </Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button data-e2e-id="report-pagcor-filter-reset-btn" onClick={onReset} style={{ background: '#e6a23c', borderColor: '#e6a23c', color: '#fff' }}>重 置</Button>
              <Button data-e2e-id="report-pagcor-filter-search-btn" onClick={() => setFilters(form.getFieldsValue())} style={{ background: '#67c23a', borderColor: '#67c23a', color: '#fff' }}>搜 寻</Button>
            </Space>
          </div>
        </Form>
      </Card>

      <Card data-e2e-id="report-pagcor-table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Title level={5} style={{ margin: 0 }}>Pagcor税收报表</Title>
          <Space>
            <Button data-e2e-id="report-pagcor-toolbar-export-btn" type="primary" icon={<FolderOpenOutlined />} onClick={onExport}>导 出</Button>
            <Button
              data-e2e-id="report-pagcor-toolbar-refresh-btn"
              icon={<ReloadOutlined />}
              onClick={() => setFilters((current) => ({
                ...current,
                dateRange: current.dateRange ? [...current.dateRange] : undefined,
              }))}
            />
            <Button data-e2e-id="report-pagcor-toolbar-density-btn" icon={<ColumnHeightOutlined />} />
            <Button data-e2e-id="report-pagcor-toolbar-settings-btn" icon={<SettingOutlined />} />
          </Space>
        </div>
        <Table
          data-e2e-id="report-pagcor-table"
          columns={columns}
          dataSource={mounted ? filteredData : []}
          rowKey="id"
          onRow={(record) => ({ 'data-e2e-id': `report-pagcor-table-row-${record.id}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          scroll={{ x: 4050 }}
          pagination={{ pageSize: 20, showSizeChanger: true, showQuickJumper: true, showTotal: (total, range) => `当前：第 ${Math.ceil(range[0] / 20)} 页, 共 ${total} 条数据` }}
          size="small"
        />
      </Card>
    </div>
  );
}

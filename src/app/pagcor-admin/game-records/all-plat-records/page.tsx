'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Card, Table, Input, DatePicker, Button, Space, Typography, Form, Select, Row, Col,
} from 'antd';
import {
  ReloadOutlined, FolderOpenOutlined, ColumnHeightOutlined, SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import {
  generatePagcorBetRecords,
  pagcorSites,
  pagcorProviders,
  pagcorGameTypes,
  pagcorBetTypes,
  pagcorBrands,
  pagcorOrderTypes,
  pagcorTimeTypes,
  pagcorJpTypeLabels,
  pagcorJpTypes,
  type PagcorBetRecord,
  type PagcorJpDetail,
  type PagcorJpType,
} from '@/data/pagcorMockData';

const { Title } = Typography;
const { RangePicker } = DatePicker;

type QuickRange = 'today' | 'yesterday' | 'week' | 'month' | 'lastMonth';

// 兩端各自從同一時間戳獨立建構 dayjs 實例。若改用 now.startOf()/now.endOf()，
// 兩個 clone 會共用同一份內部物件參照，觸發 rc-util isEqual 的
// "There may be circular references" 警告。
function rangeOf(key: QuickRange): [Dayjs, Dayjs] {
  const ts = Date.now();
  const from = dayjs(ts);
  const to = dayjs(ts);
  switch (key) {
    case 'today':
      return [from.startOf('day'), to.endOf('day')];
    case 'yesterday':
      return [from.subtract(1, 'day').startOf('day'), to.subtract(1, 'day').endOf('day')];
    case 'week':
      return [from.startOf('week'), to.endOf('week')];
    case 'month':
      return [from.startOf('month'), to.endOf('month')];
    case 'lastMonth':
      return [from.subtract(1, 'month').startOf('month'), to.subtract(1, 'month').endOf('month')];
  }
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// 導出欄位與表格欄位完全一致（含 JP 四欄）；Multi 的 Seed Money 同列表留空，明細只在頁面展開看
const exportColumns: Array<[string, (r: PagcorBetRecord) => string]> = [
  ['品牌归属', (r) => r.brandOwner],
  ['Transaction ID', (r) => r.transactionId],
  ['Gaming Site', (r) => r.gamingSite],
  ['Onsite Bet', (r) => r.onsiteBet],
  ['Online Bet', (r) => r.onlineBet],
  ['注单类型', (r) => r.orderType],
  ['商户编号', (r) => r.merchantNo],
  ['UID', (r) => r.uid],
  ['游戏代码', (r) => r.gameCode],
  ['游戏名称', (r) => r.gameName],
  ['游戏类型', (r) => r.gameType],
  ['体育类型', (r) => r.sportsType],
  ['品牌', (r) => r.provider],
  ['投注金额', (r) => r.betAmount],
  ['状态', (r) => r.state],
  ['派彩', (r) => r.payout],
  ['开奖结果', (r) => r.drawResult],
  ['GGR', (r) => r.ggr],
  ['JP Contribution', (r) => r.jpContribution],
  ['JP Payout', (r) => r.jpPayout],
  ['JP Type', (r) => (r.jpType === '-' ? '-' : pagcorJpTypeLabels[r.jpType])],
  ['Seed Money', (r) => r.seedMoney],
  ['结算时间', (r) => r.settleTime],
  ['投注时间', (r) => r.betTime],
];

function toCsvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export default function AllPlatRecordsPage() {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [allRecords, setAllRecords] = useState<PagcorBetRecord[]>([]);
  const [activeQuick, setActiveQuick] = useState<QuickRange | null>('month');
  const [mounted, setMounted] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    setAllRecords(generatePagcorBetRecords(400));
    form.setFieldsValue({ timeType: 'bet', dateRange: rangeOf('month') });
    setFilters({ timeType: 'bet', dateRange: rangeOf('month') });
    setMounted(true);
  }, [form]);

  const applyQuick = (key: QuickRange) => {
    setActiveQuick(key);
    form.setFieldsValue({ dateRange: rangeOf(key) });
  };

  const filteredData = useMemo(() => {
    return allRecords.filter((r) => {
      if (filters.uid && !r.uid.includes(String(filters.uid).trim())) return false;
      if (filters.username && !r.username.includes(String(filters.username).trim())) return false;
      if (filters.gameType && r.gameType !== filters.gameType) return false;
      if (filters.site && r.gamingSite !== filters.site) return false;
      if (filters.betType === 'Onsite' && r.onsiteBet !== 'YES') return false;
      if (filters.betType === 'Online' && r.onlineBet !== 'YES') return false;
      if (filters.provider && r.provider.toLowerCase() !== String(filters.provider).toLowerCase()) return false;
      if (filters.brandOwner?.length && !filters.brandOwner.includes(r.brandOwner)) return false;
      if (filters.orderType && r.orderType !== filters.orderType) return false;
      if (filters.jpType && r.jpType !== filters.jpType) return false;

      const range = filters.dateRange as [Dayjs, Dayjs] | undefined;
      if (range?.[0] && range?.[1]) {
        const target = filters.timeType === 'settle' ? r.settleTime : r.betTime;
        if (target === '-') return false;
        const t = dayjs(target);
        if (t.isBefore(range[0]) || t.isAfter(range[1])) return false;
      }
      return true;
    });
  }, [filters, allRecords]);

  const onSearch = () => setFilters(form.getFieldsValue());

  const onReset = () => {
    form.resetFields();
    form.setFieldsValue({ timeType: 'bet', dateRange: rangeOf('month') });
    setActiveQuick('month');
    setFilters({ timeType: 'bet', dateRange: rangeOf('month') });
  };

  const onExport = () => {
    const lines = [
      exportColumns.map(([title]) => title).join(','),
      ...filteredData.map((r) => exportColumns.map(([, get]) => toCsvCell(get(r))).join(',')),
    ];
    downloadCsv(`全平台投注记录_${dayjs().format('YYYYMMDD_HHmmss')}.csv`, lines.join('\n'));
  };

  const toggleJpDetail = (id: number) => {
    setExpandedRowKeys((keys) => (keys.includes(id) ? keys.filter((k) => k !== id) : [...keys, id]));
  };

  // Multi 展開後的 JP 詳情欄位
  const jpDetailColumns: ColumnsType<PagcorJpDetail> = [
    { title: 'JP Type', dataIndex: 'jpType', width: 160, align: 'center', render: (v: PagcorJpType) => pagcorJpTypeLabels[v] },
    { title: 'JP Payout', dataIndex: 'jpPayout', width: 180, align: 'center' },
    { title: 'Seed Money', dataIndex: 'seedMoney', width: 180, align: 'center' },
  ];

  // 欄位定義 1:1 對應 admin-pagcor-fat 全平台投注记录（寬度與 fixed 皆取自線上實測）
  const columns: ColumnsType<PagcorBetRecord> = [
    { title: '品牌归属', dataIndex: 'brandOwner', width: 150, align: 'center', fixed: 'left' },
    { title: 'Transaction ID', dataIndex: 'transactionId', width: 480, align: 'center', fixed: 'left' },
    { title: 'Gaming Site', dataIndex: 'gamingSite', width: 360, align: 'center', ellipsis: true },
    { title: 'Onsite Bet', dataIndex: 'onsiteBet', width: 300, align: 'center' },
    { title: 'Online Bet', dataIndex: 'onlineBet', width: 300, align: 'center' },
    { title: '注单类型', dataIndex: 'orderType', width: 120, align: 'center' },
    { title: '商户编号', dataIndex: 'merchantNo', width: 200, align: 'center' },
    { title: 'UID', dataIndex: 'uid', width: 360, align: 'center' },
    { title: '游戏代码', dataIndex: 'gameCode', width: 200, align: 'center' },
    { title: '游戏名称', dataIndex: 'gameName', width: 200, align: 'center' },
    { title: '游戏类型', dataIndex: 'gameType', width: 200, align: 'center' },
    { title: '体育类型', dataIndex: 'sportsType', width: 160, align: 'center' },
    { title: '品牌', dataIndex: 'provider', width: 150, align: 'center' },
    { title: '投注金额', dataIndex: 'betAmount', width: 150, align: 'center' },
    { title: '状态', dataIndex: 'state', width: 150, align: 'center' },
    { title: '派彩', dataIndex: 'payout', width: 150, align: 'center' },
    { title: '开奖结果', dataIndex: 'drawResult', width: 150, align: 'center' },
    { title: 'GGR', dataIndex: 'ggr', width: 150, align: 'center' },
    { title: 'JP Contribution', dataIndex: 'jpContribution', width: 170, align: 'center' },
    { title: 'JP Payout', dataIndex: 'jpPayout', width: 150, align: 'center' },
    {
      title: 'JP Type',
      dataIndex: 'jpType',
      width: 130,
      align: 'center',
      render: (value: PagcorBetRecord['jpType'], record) => {
        if (value === '-') return '-';
        if (value !== 'multi') return pagcorJpTypeLabels[value];
        // Multi＝同時中兩筆獎池，以超連結展開 JP 詳情
        return (
          <a
            data-e2e-id={`all-plat-records-jp-multi-link-${record.id}`}
            onClick={() => toggleJpDetail(record.id)}
          >
            {pagcorJpTypeLabels.multi}
          </a>
        );
      },
    },
    { title: 'Seed Money', dataIndex: 'seedMoney', width: 150, align: 'center' },
    { title: '结算时间', dataIndex: 'settleTime', width: 200, align: 'center' },
    { title: '投注时间', dataIndex: 'betTime', width: 200, align: 'center', fixed: 'right' },
  ];

  const quickButtons: Array<{ key: QuickRange; label: string }> = [
    { key: 'today', label: '今 日' },
    { key: 'yesterday', label: '昨 日' },
    { key: 'week', label: '本 周' },
    { key: 'month', label: '本 月' },
    { key: 'lastMonth', label: '上 月' },
  ];

  return (
    <div>
      {/* Filter Card */}
      <Card style={{ marginBottom: 16 }} data-e2e-id="all-plat-records-filter-card">
        <Form form={form} layout="horizontal" colon={false} labelCol={{ flex: '0 0 88px' }} wrapperCol={{ flex: 1 }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="uid" label="UID">
                <Input data-e2e-id="all-plat-records-filter-uid-input" placeholder="请输入UID" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="username" label="用户名">
                <Input data-e2e-id="all-plat-records-filter-username-input" placeholder="请输入用户名" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="gameType" label="游戏类型">
                <Select
                  data-e2e-id="all-plat-records-filter-game-type-select"
                  placeholder="请选择"
                  allowClear
                  options={pagcorGameTypes}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="site" label="业务归属">
                <Select
                  data-e2e-id="all-plat-records-filter-site-select"
                  placeholder="请选择"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={pagcorSites.map((s) => ({ label: s, value: s }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="betType" label="投注类型">
                <Select
                  data-e2e-id="all-plat-records-filter-bet-type-select"
                  placeholder="请选择"
                  allowClear
                  options={pagcorBetTypes.map((b) => ({ label: b, value: b }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="provider" label="游戏厂商">
                <Select
                  data-e2e-id="all-plat-records-filter-provider-select"
                  placeholder="请选择品牌"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={pagcorProviders.map((p) => ({ label: p, value: p }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="brandOwner" label="品牌归属">
                <Select
                  data-e2e-id="all-plat-records-filter-brand-owner-select"
                  mode="multiple"
                  placeholder="请选择品牌归属"
                  allowClear
                  options={pagcorBrands.map((b) => ({ label: b, value: b }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="orderType" label="注单类型">
                <Select
                  data-e2e-id="all-plat-records-filter-order-type-select"
                  placeholder="请选择注单类型"
                  allowClear
                  options={pagcorOrderTypes.map((o) => ({ label: o, value: o }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="jpType" label="JP Type">
                <Select
                  data-e2e-id="all-plat-records-filter-jp-type-select"
                  placeholder="请选择JP类型"
                  allowClear
                  options={pagcorJpTypes.map((t) => ({ label: pagcorJpTypeLabels[t], value: t }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="timeType" label="时间类别">
                <Select data-e2e-id="all-plat-records-filter-time-type-select" options={pagcorTimeTypes} />
              </Form.Item>
            </Col>
            <Col xs={24} xl={18}>
              <Form.Item label="选择日期" labelCol={{ flex: '0 0 88px' }}>
                <Space wrap size={8}>
                  <Form.Item name="dateRange" noStyle>
                    <RangePicker
                      data-e2e-id="all-plat-records-filter-date-range"
                      showTime
                      format="YYYY-MM-DD HH:mm:ss"
                      placeholder={['开始日期', '结束日期']}
                      style={{ width: 380 }}
                      onChange={() => setActiveQuick(null)}
                    />
                  </Form.Item>
                  {quickButtons.map((b) => (
                    <Button
                      key={b.key}
                      data-e2e-id={`all-plat-records-filter-quick-${b.key}-btn`}
                      type={activeQuick === b.key ? 'primary' : 'text'}
                      onClick={() => applyQuick(b.key)}
                    >
                      {b.label}
                    </Button>
                  ))}
                </Space>
              </Form.Item>
            </Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button
                data-e2e-id="all-plat-records-filter-reset-btn"
                onClick={onReset}
                style={{ background: '#e6a23c', borderColor: '#e6a23c', color: '#fff' }}
              >
                重 置
              </Button>
              <Button
                data-e2e-id="all-plat-records-filter-search-btn"
                onClick={onSearch}
                style={{ background: '#67c23a', borderColor: '#67c23a', color: '#fff' }}
              >
                搜 索
              </Button>
            </Space>
          </div>
        </Form>
      </Card>

      {/* Table Card */}
      <Card data-e2e-id="all-plat-records-table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Title level={5} style={{ margin: 0 }}>全平台投注记录</Title>
          <Space>
            <Button data-e2e-id="all-plat-records-toolbar-export-btn" type="primary" icon={<FolderOpenOutlined />} onClick={onExport}>
              导 出
            </Button>
            <Button data-e2e-id="all-plat-records-toolbar-refresh-btn" icon={<ReloadOutlined />} />
            <Button data-e2e-id="all-plat-records-toolbar-density-btn" icon={<ColumnHeightOutlined />} />
            <Button data-e2e-id="all-plat-records-toolbar-settings-btn" icon={<SettingOutlined />} />
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={mounted ? filteredData : []}
          rowKey="id"
          onRow={(record) => ({ 'data-e2e-id': `all-plat-records-table-row-${record.id}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          expandable={{
            expandedRowKeys,
            showExpandColumn: false,
            rowExpandable: (record) => record.jpType === 'multi',
            onExpand: (_expanded, record) => toggleJpDetail(record.id),
            // 表格橫向可捲動，明細以 sticky 貼齊可視區左緣，避免展開後看不到內容
            expandedRowRender: (record) => (
              <div style={{ position: 'sticky', left: 0, width: 'fit-content', maxWidth: '100%' }}>
                <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                  JP 詳情（本注同時中 {record.jpDetails?.length ?? 0} 筆獎池）
                </Typography.Text>
                <Table
                  data-e2e-id={`all-plat-records-jp-detail-table-${record.id}`}
                  columns={jpDetailColumns}
                  dataSource={record.jpDetails ?? []}
                  rowKey="jpType"
                  size="small"
                  bordered
                  pagination={false}
                  style={{ maxWidth: 560 }}
                />
              </div>
            ),
          }}
          scroll={{ x: 4930 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t, range) => `当前：第 ${Math.ceil(range[0] / 20)} 页, 共 ${t} 条数据`,
          }}
          size="small"
        />
      </Card>
    </div>
  );
}

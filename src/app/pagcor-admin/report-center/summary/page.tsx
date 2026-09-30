'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, DatePicker, Form, Row, Select, Space, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import PagcorGgrInfo from '@/components/PagcorGgrInfo';
import {
  generatePagcorTaxReport,
  pagcorCategories,
  type PagcorCategory,
  type PagcorTaxAmounts,
  type PagcorTaxReportRow,
} from '@/data/pagcorMockData';
import {
  derivePagcorAmounts,
  formatPagcorAmount,
  rangeOf,
  seedForPagcorDateRange,
  type PagcorQuickRange,
} from '@/lib/pagcorReportUtils';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface SummaryFilters {
  category?: PagcorCategory | 'all';
  dateRange?: [Dayjs, Dayjs];
}

const bettorCountCategorySeeds: Record<PagcorCategory | 'all', number> = {
  all: 0x9e3779b9,
  ECasino: 0x243f6a88,
  Sports: 0xb7e15162,
  'E-bingo': 0x8aed2a6b,
  'Specialty games': 0xc6ef3720,
};

type SummaryBrand = 'filbet' | 'filplay';
const summaryBrands: Array<{ key: SummaryBrand; label: string }> = [
  { key: 'filbet', label: 'Filbet' }, { key: 'filplay', label: 'Filplay' },
];

function hashValue(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function deriveBettorCount(seed: number, brand: SummaryBrand, category: PagcorCategory | 'all' = 'all') {
  let mixed = (seed ^ bettorCountCategorySeeds[category] ^ hashValue(brand)) >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 16), 0x7feb352d);
  mixed = Math.imul(mixed ^ (mixed >>> 15), 0x846ca68b);
  mixed = (mixed ^ (mixed >>> 16)) >>> 0;
  if (brand === 'filplay') return category === 'all' ? 33 + (mixed % 8) : 17 + (mixed % 4);
  return category === 'all' ? 100 + (mixed % 31) : 50 + (mixed % 17);
}

function splitAmounts(amounts: PagcorTaxAmounts, share: number, brand: SummaryBrand): PagcorTaxAmounts {
  const result = { ...amounts };
  for (const key of Object.keys(amounts) as Array<keyof PagcorTaxAmounts>) {
    const cents = Math.round(amounts[key] * 100);
    const filbetCents = Math.round(cents * share);
    result[key] = (brand === 'filbet' ? filbetCents : cents - filbetCents) / 100;
  }
  return result;
}

export default function ReportSummaryPage() {
  const [form] = Form.useForm<SummaryFilters>();
  const [filters, setFilters] = useState<SummaryFilters>({});
  const [activeQuick, setActiveQuick] = useState<PagcorQuickRange | null>('month');
  const [mounted, setMounted] = useState(false);
  const [reportRows, setReportRows] = useState<PagcorTaxReportRow[]>([]);

  useEffect(() => {
    form.setFieldsValue({ category: 'all', dateRange: rangeOf('month') });
    setFilters({ category: 'all', dateRange: rangeOf('month') });
    setMounted(true);
  }, [form]);

  const reportSeed = useMemo(
    () => seedForPagcorDateRange(filters.dateRange, 20260907),
    [filters.dateRange],
  );

  useEffect(() => {
    if (mounted) setReportRows(generatePagcorTaxReport(reportSeed));
  }, [mounted, reportSeed]);

  const brandSummaries = useMemo(() => summaryBrands.map((brand) => {
    const totals = reportRows.reduce((result, row, index) => {
      if (filters.category && filters.category !== 'all' && row.pagcorCategory !== filters.category) return result;
      const share = 0.68 + (hashValue(`${reportSeed}:${index}:${row.provider}`) / 4294967295) * 0.14;
      for (const amounts of [row.onsite, row.online]) {
        const values = splitAmounts(amounts, share, brand.key);
        result.validBet += values.validBet;
        result.payout += values.payout;
        result.ggr += derivePagcorAmounts(values, row.rate).ggr;
        result.jpContribution += values.jpContribution;
        result.jpPayout += values.jpPayout;
      }
      return result;
    }, { validBet: 0, payout: 0, ggr: 0, jpContribution: 0, jpPayout: 0 });
    return {
      ...brand,
      bettorCount: deriveBettorCount(reportSeed, brand.key, filters.category ?? 'all'),
      statCards: [
        { key: 'valid-bet', label: '有效投注金额', value: totals.validBet, color: '#1890ff' },
        { key: 'payout', label: '有效派彩金额', value: totals.payout, color: '#faad14' },
        { key: 'ggr', label: 'GGR', value: totals.ggr, color: '#52c41a', info: true },
        { key: 'jp-contribution', label: 'JP 貢獻總額', value: totals.jpContribution, color: '#722ed1' },
        { key: 'jp-payout', label: 'JP 派彩總額', value: totals.jpPayout, color: '#eb2f96' },
      ],
    };
  }), [filters.category, reportRows, reportSeed]);

  const applyQuick = (key: PagcorQuickRange) => {
    const dateRange = rangeOf(key);
    setActiveQuick(key);
    form.setFieldsValue({ dateRange });
  };

  const onReset = () => {
    form.resetFields();
    form.setFieldsValue({ category: 'all', dateRange: rangeOf('month') });
    setActiveQuick('month');
    setFilters({ category: 'all', dateRange: rangeOf('month') });
  };

  const quickButtons: Array<{ key: PagcorQuickRange; label: string }> = [
    { key: 'today', label: '今 天' },
    { key: 'yesterday', label: '昨 天' },
    { key: 'week', label: '本 周' },
    { key: 'month', label: '本 月' },
    { key: 'lastMonth', label: '上 月' },
  ];

  return (
    <div>
      <Card data-e2e-id="report-summary-filter-card" style={{ marginBottom: 16 }}>
        <Form form={form} layout="horizontal" colon={false} labelCol={{ flex: '0 0 88px' }} wrapperCol={{ flex: 1 }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="category" label="Pagcor分类">
                <Select
                  data-e2e-id="report-summary-filter-category-select"
                  options={[{ label: '全部', value: 'all' }, ...pagcorCategories.map((value) => ({ label: value, value }))]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} xl={18}>
              <Form.Item label="选择日期">
                <Space wrap size={8}>
                  <Form.Item name="dateRange" noStyle>
                    <RangePicker data-e2e-id="report-summary-filter-date-range" format="YYYY-MM-DD" placeholder={['开始日期', '结束日期']} style={{ width: 280 }} onChange={() => setActiveQuick(null)} />
                  </Form.Item>
                  {quickButtons.map((button) => (
                    <Button key={button.key} data-e2e-id={`report-summary-filter-quick-${button.key}-btn`} type={activeQuick === button.key ? 'primary' : 'text'} onClick={() => applyQuick(button.key)}>
                      {button.label}
                    </Button>
                  ))}
                </Space>
              </Form.Item>
            </Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button data-e2e-id="report-summary-filter-reset-btn" onClick={onReset} style={{ background: '#e6a23c', borderColor: '#e6a23c', color: '#fff' }}>重 置</Button>
              <Button data-e2e-id="report-summary-filter-search-btn" onClick={() => setFilters(form.getFieldsValue())} style={{ background: '#67c23a', borderColor: '#67c23a', color: '#fff' }}>搜 索</Button>
            </Space>
          </div>
        </Form>
      </Card>

      {brandSummaries.map((brand) => (
        <Card key={brand.key} data-e2e-id={`report-summary-${brand.key}-card`} style={{ marginBottom: 16 }} title={<Title level={5} style={{ margin: 0 }}>{brand.label}</Title>}>
          <Title level={5} style={{ marginTop: 0 }}>金额统计</Title>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {brand.statCards.map((stat) => (
              <Card
                key={stat.key}
                data-e2e-id={`report-summary-${brand.key}-stat-${stat.key}`}
                variant="borderless"
                style={{ background: stat.color, flex: '1 1 230px', minWidth: 0 }}
                styles={{ body: { padding: '20px 22px' } }}
              >
                <Text style={{ color: '#fff', fontSize: 14 }}>
                  {stat.label}
                  {stat.info && <PagcorGgrInfo dataE2eId={`report-summary-${brand.key}-ggr-info`} color="#fff" />}
                </Text>
                <div style={{ marginTop: 10, color: '#fff', fontSize: 24, whiteSpace: 'nowrap', fontWeight: 600, lineHeight: 1.2 }}>
                  {mounted ? formatPagcorAmount(stat.value) : '0.00'}
                </div>
              </Card>
            ))}
          </div>
          <Title level={5}>数量统计</Title>
          <Card data-e2e-id={`report-summary-${brand.key}-stat-bettor-count`} variant="borderless" style={{ background: '#13c2c2', flex: '1 1 230px', maxWidth: 320 }} styles={{ body: { padding: '20px 22px' } }}>
            <Text style={{ color: '#fff', fontSize: 14 }}>投注用户数</Text>
            <div style={{ marginTop: 10, color: '#fff', fontSize: 24, whiteSpace: 'nowrap', fontWeight: 600, lineHeight: 1.2 }}>
              {mounted ? brand.bettorCount.toLocaleString('en-US') : '0'}
            </div>
          </Card>
        </Card>
      ))}
    </div>
  );
}

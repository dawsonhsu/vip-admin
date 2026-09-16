'use client';

import React, { useState } from 'react';
import { Alert, Button, Card, Descriptions, Segmented, Space, Table, Tabs, Typography, message } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  agencyAccount, agencyActiveThreshold, agencyPagcorTaxRates, agencyVenues,
  type AgencyPagcorTaxRate, type AgencyVenueSetting,
} from '@/data/agency/shared';
import { downloadCsv, formatCount, formatPercent, formatPeso, settleTypeLabels, toCsvCell } from '@/lib/agencyUtils';

interface CommSettingData {
  id: string;
  level: number;
  ggr: string;
  ggr_fmt: string;
  active: number;
  percent: string;
}

// 週結與月結各自設定遞增階梯，金額、門檻與比例皆為示範資料。
const ladderSettings: Record<number, CommSettingData[]> = {
  1: [
    { id: 'weekly-1', level: 1, ggr: '10000.00', active: 5, percent: '15.00' },
    { id: 'weekly-2', level: 2, ggr: '50000.00', active: 10, percent: '20.00' },
    { id: 'weekly-3', level: 3, ggr: '150000.00', active: 20, percent: '25.00' },
    { id: 'weekly-4', level: 4, ggr: '400000.00', active: 40, percent: '30.00' },
    { id: 'weekly-5', level: 5, ggr: '1000000.00', active: 80, percent: '35.00' },
    { id: 'weekly-6', level: 6, ggr: '2500000.00', active: 150, percent: '40.00' },
  ].map((row) => ({ ...row, ggr_fmt: `≥ ${formatPeso(row.ggr)}` })),
  2: [
    { id: 'monthly-1', level: 1, ggr: '40000.00', active: 10, percent: '20.00' },
    { id: 'monthly-2', level: 2, ggr: '200000.00', active: 20, percent: '25.00' },
    { id: 'monthly-3', level: 3, ggr: '600000.00', active: 40, percent: '30.00' },
    { id: 'monthly-4', level: 4, ggr: '1600000.00', active: 80, percent: '35.00' },
    { id: 'monthly-5', level: 5, ggr: '4000000.00', active: 150, percent: '40.00' },
    { id: 'monthly-6', level: 6, ggr: '10000000.00', active: 300, percent: '45.00' },
  ].map((row) => ({ ...row, ggr_fmt: `≥ ${formatPeso(row.ggr)}` })),
};

const ladderColumns: ColumnsType<CommSettingData> = [
  { title: '階級', dataIndex: 'level', width: 100, render: (value: number) => formatCount(value) },
  { title: 'GGR 門檻', dataIndex: 'ggr_fmt', width: 220, align: 'right' },
  { title: '活躍會員門檻', dataIndex: 'active', width: 180, align: 'right', render: (value: number) => `≥ ${formatCount(value)}` },
  { title: '佣金比例', dataIndex: 'percent', width: 140, align: 'right', render: (value: string) => formatPercent(value) },
];
const taxColumns: ColumnsType<AgencyPagcorTaxRate> = [
  { title: '分類', dataIndex: 'pagcor_name', width: 280 },
  { title: '稅率', dataIndex: 'pagcor_tax_ratio', width: 160, align: 'right', render: (value: string) => formatPercent(value) },
];
const venueColumns: ColumnsType<AgencyVenueSetting> = [
  { title: '場館代碼', dataIndex: 'venue_id', width: 150 },
  { title: '場館名稱', dataIndex: 'name', width: 260 },
  { title: '費率', dataIndex: 'fee_ratio', width: 150, align: 'right', render: (value: string) => formatPercent(value) },
];

type RateTab = 'ladder' | 'tax' | 'venue';

export default function AgencyRatesPage() {
  const [settleType, setSettleType] = useState(agencyAccount.settle_type);
  const [tab, setTab] = useState<RateTab>('ladder');
  const [revision, setRevision] = useState(0);
  const [pageSizes, setPageSizes] = useState<Record<RateTab, number>>({ ladder: 20, tax: 20, venue: 20 });
  const [messageApi, contextHolder] = message.useMessage();

  const exportTable = (kind: RateTab) => {
    const rows = kind === 'ladder'
      ? [['階級', 'GGR 門檻', '活躍會員門檻', '佣金比例'], ...ladderSettings[settleType].map((row) => [formatCount(row.level), row.ggr_fmt, formatCount(row.active), formatPercent(row.percent)])]
      : kind === 'tax'
        ? [['分類', '稅率'], ...agencyPagcorTaxRates.map((row) => [row.pagcor_name, formatPercent(row.pagcor_tax_ratio)])]
        : [['場館代碼', '場館名稱', '費率'], ...agencyVenues.map((row) => [row.venue_id, row.name, formatPercent(row.fee_ratio)])];
    const filename = kind === 'ladder' ? `佣金階梯_${settleTypeLabels[settleType]}` : kind === 'tax' ? 'PAGCOR稅率' : '廠商費率';
    downloadCsv(`${filename}_示範資料.csv`, rows.map((row) => row.map(toCsvCell).join(',')).join('\n'));
  };

  const toolbar = (kind: RateTab, title: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
      <Typography.Title level={5} style={{ margin: 0 }}>{title}</Typography.Title>
      <Space>
        <Button data-e2e-id={`agency-rates-${kind}-export-btn`} icon={<DownloadOutlined />} onClick={() => exportTable(kind)}>匯出</Button>
        <Button
          data-e2e-id={`agency-rates-${kind}-refresh-btn`}
          icon={<ReloadOutlined />}
          aria-label={`重新整理${title}`}
          title="重新整理"
          onClick={() => { setRevision((value) => value + 1); messageApi.success('費率已重新整理（示範資料）'); }}
        />
      </Space>
    </div>
  );

  const pagination = (kind: RateTab) => ({
    pageSize: pageSizes[kind],
    showSizeChanger: true,
    showQuickJumper: true,
    onChange: (_: number, size: number) => setPageSizes((values) => ({ ...values, [kind]: size })),
    showTotal: (total: number, range: [number, number]) => `當前：第 ${Math.max(1, Math.ceil(range[0] / pageSizes[kind]))} 頁, 共 ${total} 筆資料`,
  });

  return (
    <div>
      {contextHolder}
      <Alert type="info" showIcon message="費率由平台統一設定，代理端僅供查詢。以下佣金階梯、PAGCOR 稅率與廠商費率均為示範資料。" style={{ marginBottom: 16 }} />
      <Tabs
        data-e2e-id="agency-rates-tabs"
        activeKey={tab}
        onChange={(key) => setTab(key as RateTab)}
        items={[
          {
            key: 'ladder',
            label: <span data-e2e-id="agency-rates-ladder-tab">佣金階梯</span>,
            children: (
              <>
                <Card data-e2e-id="agency-rates-threshold-card" style={{ marginBottom: 16 }}>
                  <Segmented
                    data-e2e-id="agency-rates-settle-type-segmented"
                    value={settleType}
                    onChange={(value) => setSettleType(Number(value))}
                    options={[
                      { value: 1, label: <span data-e2e-id="agency-rates-weekly-option">每週結算</span> },
                      { value: 2, label: <span data-e2e-id="agency-rates-monthly-option">每月結算</span> },
                    ]}
                    style={{ marginBottom: 20 }}
                  />
                  <Descriptions
                    size="small"
                    column={{ xs: 1, sm: 2 }}
                    items={[
                      { key: 'bet', label: '有效投注門檻', children: formatPeso(agencyActiveThreshold.active_bet_amount) },
                      { key: 'deposit', label: '存款門檻', children: formatPeso(agencyActiveThreshold.active_deposit_amount) },
                    ]}
                  />
                  <Typography.Text type="secondary">會員須同時達到有效投注與存款兩項門檻，才計入活躍會員；佣金階級依 GGR 與活躍會員門檻判定。</Typography.Text>
                </Card>
                <Card data-e2e-id="agency-rates-ladder-card">
                  {toolbar('ladder', `佣金階梯 · ${settleTypeLabels[settleType]}`)}
                  <Table<CommSettingData> key={`${settleType}-${revision}`} data-e2e-id="agency-rates-ladder-table" columns={ladderColumns} dataSource={ladderSettings[settleType]} size="small" rowKey="id" scroll={{ x: 640 }} pagination={pagination('ladder')} />
                </Card>
              </>
            ),
          },
          {
            key: 'tax',
            label: <span data-e2e-id="agency-rates-tax-tab">PAGCOR 稅率</span>,
            children: (
              <Card data-e2e-id="agency-rates-tax-card">
                {toolbar('tax', 'PAGCOR 稅率')}
                <Table<AgencyPagcorTaxRate> key={revision} data-e2e-id="agency-rates-tax-table" columns={taxColumns} dataSource={agencyPagcorTaxRates} size="small" rowKey="id" scroll={{ x: 440 }} pagination={pagination('tax')} />
              </Card>
            ),
          },
          {
            key: 'venue',
            label: <span data-e2e-id="agency-rates-venue-tab">廠商費率</span>,
            children: (
              <Card data-e2e-id="agency-rates-venue-card">
                {toolbar('venue', '廠商費率')}
                <Table<AgencyVenueSetting> key={revision} data-e2e-id="agency-rates-venue-table" columns={venueColumns} dataSource={agencyVenues} size="small" rowKey="venue_id" scroll={{ x: 560 }} pagination={pagination('venue')} />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}

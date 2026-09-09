'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Col,
  DatePicker,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Typography,
  theme,
} from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  formatMetric,
  getChartDefaults,
  getGroupMetrics,
  getMetricByKey,
  getSeries,
  type ChartUnit,
  type DashboardSeriesRow,
  type DashboardStatTime,
} from '@/data/dashboardData';

const { RangePicker } = DatePicker;
const { Text } = Typography;

export interface DashboardChartModalProps {
  open: boolean;
  onClose: () => void;
  metricKey: string;
  statTime: DashboardStatTime;
}

const escapeCsvCell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export default function DashboardChartModal({
  open,
  onClose,
  metricKey,
  statTime,
}: DashboardChartModalProps) {
  const { token } = theme.useToken();
  const clickedMetric = getMetricByKey(metricKey);
  const groupMetrics = useMemo(
    () => getGroupMetrics(clickedMetric.group),
    [clickedMetric.group]
  );
  const [selectedMetricKey, setSelectedMetricKey] = useState(metricKey);
  const [range, setRange] = useState<[Dayjs, Dayjs]>(statTime.range);
  const [unit, setUnit] = useState<ChartUnit>('日');
  const [rangeAnchor, setRangeAnchor] = useState<Dayjs | null>(null);

  useEffect(() => {
    if (!open) return;
    const defaults = getChartDefaults(statTime.quickKey, statTime.range);
    setSelectedMetricKey(metricKey);
    setRange([defaults.start, defaults.end]);
    setUnit(defaults.unit);
    setRangeAnchor(null);
  }, [metricKey, open, statTime.quickKey, statTime.range]);

  const selectedMetric = getMetricByKey(selectedMetricKey);
  const compactLabel = (raw: number | string) => {
    const value = Number(raw);
    if (selectedMetric.format === 'rate') return `${value.toFixed(1)}%`;
    if (selectedMetric.format === 'decimal') return value.toFixed(0);
    const abs = Math.abs(value);
    if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
    return Math.round(value).toString();
  };
  const series = useMemo(
    () =>
      getSeries(
        clickedMetric.group,
        range[0].format('YYYY-MM-DD'),
        range[1].format('YYYY-MM-DD'),
        unit
      ),
    [clickedMetric.group, range, unit]
  );

  const columns = useMemo<ColumnsType<DashboardSeriesRow>>(
    () => [
      {
        title: '統計日期',
        dataIndex: 'bucket',
        key: 'bucket',
        width: 120,
        fixed: 'left',
        sorter: (a, b) => String(a.bucket).localeCompare(String(b.bucket)),
        defaultSortOrder: 'descend' as const,
      },
      ...groupMetrics.map((metric) => ({
        title: metric.label,
        dataIndex: metric.key,
        key: metric.key,
        align: 'right' as const,
        width: 150,
        sorter: (a: DashboardSeriesRow, b: DashboardSeriesRow) =>
          Number(a[metric.key]) - Number(b[metric.key]),
        render: (value: number) => formatMetric(Number(value), metric.format),
      })),
    ],
    [groupMetrics]
  );

  const disabledDate = (current: Dayjs) => {
    if (!rangeAnchor) return false;
    return (
      current.isBefore(rangeAnchor.subtract(179, 'day'), 'day') ||
      current.isAfter(rangeAnchor.add(179, 'day'), 'day')
    );
  };

  const exportCsv = () => {
    const csvRows: (string | number)[][] = [
      ['統計日期', ...groupMetrics.map((metric) => metric.label)],
      ...series.map((row) => [
        row.bucket,
        ...groupMetrics.map((metric) =>
          formatMetric(Number(row[metric.key]), metric.format)
        ),
      ]),
    ];
    const content = `\uFEFF${csvRows
      .map((row) => row.map(escapeCsvCell).join(','))
      .join('\n')}`;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.setAttribute('download', `dashboard-${clickedMetric.group}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <Modal
      data-e2e-id="dashboard-chart-modal"
      open={open}
      onCancel={onClose}
      title="數據圖表"
      width={1100}
      footer={null}
      destroyOnClose
    >
      <Row gutter={[16, 12]} align="bottom" style={{ marginBottom: 20 }}>
        <Col xs={24} md={8}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary">數據項目</Text>
            <Select
              data-e2e-id="dashboard-chart-item-select"
              value={selectedMetricKey}
              options={groupMetrics.map((metric) => ({
                label: metric.label,
                value: metric.key,
              }))}
              onChange={setSelectedMetricKey}
              style={{ width: '100%' }}
            />
          </Space>
        </Col>
        <Col xs={24} md={10}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary">數據時間</Text>
            <RangePicker
              data-e2e-id="dashboard-chart-range"
              value={range}
              allowClear={false}
              disabledDate={disabledDate}
              onCalendarChange={(dates) => {
                const selected = dates?.filter((date): date is Dayjs => Boolean(date)) ?? [];
                setRangeAnchor(selected.length === 1 ? selected[0] : null);
              }}
              onChange={(dates) => {
                if (dates?.[0] && dates[1]) setRange([dates[0], dates[1]]);
                setRangeAnchor(null);
              }}
              style={{ width: '100%' }}
            />
          </Space>
        </Col>
        <Col xs={24} md={6}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary">數據單位</Text>
            <Segmented
              data-e2e-id="dashboard-chart-unit"
              block
              options={['日', '週', '月']}
              value={unit}
              onChange={(value) => setUnit(value as ChartUnit)}
            />
          </Space>
        </Col>
      </Row>

      <div style={{ width: '100%', height: 340, marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 16, right: 28, left: 12, bottom: 8 }}>
            <CartesianGrid stroke={token.colorBorderSecondary} strokeDasharray="3 3" />
            <XAxis
              dataKey="bucket"
              tick={{ fill: token.colorTextSecondary, fontSize: 12 }}
              axisLine={{ stroke: token.colorBorder }}
              tickLine={{ stroke: token.colorBorder }}
              minTickGap={24}
            />
            <YAxis
              tick={{ fill: token.colorTextSecondary, fontSize: 12 }}
              axisLine={{ stroke: token.colorBorder }}
              tickLine={{ stroke: token.colorBorder }}
              tickFormatter={(value: number) => formatMetric(value, selectedMetric.format)}
              width={100}
            />
            <RechartsTooltip
              formatter={(value: number) => [
                formatMetric(Number(value), selectedMetric.format),
                selectedMetric.label,
              ]}
              contentStyle={{
                backgroundColor: token.colorBgElevated,
                borderColor: token.colorBorder,
                color: token.colorText,
                borderRadius: token.borderRadius,
              }}
              labelStyle={{ color: token.colorText }}
              itemStyle={{ color: token.colorPrimary }}
            />
            <Line
              type="monotone"
              dataKey={selectedMetricKey}
              name={selectedMetric.label}
              stroke={token.colorPrimary}
              strokeWidth={2}
              dot={series.length <= 32 ? { r: 3, fill: token.colorPrimary } : false}
              activeDot={{ r: 5 }}
            >
              {series.length <= 14 ? (
                <LabelList
                  dataKey={selectedMetricKey}
                  position="top"
                  offset={10}
                  formatter={compactLabel}
                  style={{ fill: token.colorPrimary, fontSize: 11 }}
                />
              ) : null}
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: 12,
        }}
      >
        <Button
          data-e2e-id="dashboard-chart-export"
          icon={<DownloadOutlined />}
          onClick={exportCsv}
        >
          匯出數據
        </Button>
      </div>
      <Table<DashboardSeriesRow>
        rowKey="bucket"
        columns={columns}
        dataSource={series}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        scroll={{ x: 'max-content' }}
        size="small"
      />
    </Modal>
  );
}

'use client';

import React, { useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type GamePlatform = 'JDB' | 'PG' | 'Wali' | 'JILI' | 'FC' | 'PP';

interface BetMonitorRecord {
  key: string;
  id: number;
  queryDate: string;
  platform: GamePlatform;
  route: number;
  platformCount: number;
  vendorCount: number;
  createdAt: string;
  updatedAt: string;
}

const platformOptions: GamePlatform[] = ['JDB', 'PG', 'Wali', 'JILI', 'FC', 'PP'];

function generateMockRecords(): BetMonitorRecord[] {
  const records: BetMonitorRecord[] = [];
  const startId = 199992;
  const baseDate = dayjs('2026-06-01');
  for (let i = 0; i < 177; i += 1) {
    const platform = platformOptions[i % platformOptions.length];
    const route = (i % 3) + 1;
    const platformCount = 1500 + Math.floor(Math.random() * 3000);
    const drift = Math.floor(Math.random() * 60) - 20;
    const vendorCount = Math.max(0, platformCount + drift);
    const queryDate = baseDate.subtract(Math.floor(i / 6), 'day');
    const created = queryDate.add(16, 'hour').add(i % 30, 'minute');
    const updated = created.add(2 + (i % 5), 'minute');

    records.push({
      key: `bet-monitor-${startId - i}`,
      id: startId - i,
      queryDate: queryDate.format('YYYY-MM-DD'),
      platform,
      route,
      platformCount,
      vendorCount,
      createdAt: created.format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: updated.format('YYYY-MM-DD HH:mm:ss'),
    });
  }
  return records;
}

const mockRecords = generateMockRecords();

const defaultRange: [Dayjs, Dayjs] = [
  dayjs().subtract(7, 'day').startOf('day'),
  dayjs().endOf('day'),
];

interface FilterState {
  platform?: GamePlatform | 'all';
  range?: [Dayjs, Dayjs];
}

export default function BetMonitorPage() {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<FilterState>({
    platform: 'all',
    range: defaultRange,
  });

  const filteredRecords = useMemo(() => {
    return mockRecords.filter((record) => {
      if (filters.platform && filters.platform !== 'all' && record.platform !== filters.platform) {
        return false;
      }
      if (filters.range) {
        const created = dayjs(record.createdAt);
        if (created.isBefore(filters.range[0]) || created.isAfter(filters.range[1])) {
          return false;
        }
      }
      return true;
    });
  }, [filters]);

  const columns: ColumnsType<BetMonitorRecord> = [
    { title: 'ID', dataIndex: 'id', width: 110, fixed: 'left' },
    { title: '查詢日期', dataIndex: 'queryDate', width: 140 },
    {
      title: '遊戲平台',
      dataIndex: 'platform',
      width: 130,
      render: (value: GamePlatform) => <Tag color="geekblue">{value}</Tag>,
    },
    { title: '線路', dataIndex: 'route', width: 100 },
    {
      title: '平台紀錄數',
      dataIndex: 'platformCount',
      width: 140,
      align: 'right',
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: '廠商紀錄數',
      dataIndex: 'vendorCount',
      width: 140,
      align: 'right',
      render: (value: number, record) => {
        const diff = value - record.platformCount;
        const color = diff === 0 ? undefined : 'danger';
        return (
          <Space size={4}>
            <Text>{value.toLocaleString()}</Text>
            {diff !== 0 && (
              <Text type={color} style={{ fontSize: 12 }}>
                ({diff > 0 ? `+${diff}` : diff})
              </Text>
            )}
          </Space>
        );
      },
    },
    { title: '創建時間', dataIndex: 'createdAt', width: 200 },
    { title: '更新時間', dataIndex: 'updatedAt', width: 200 },
  ];

  const handleQuery = () => {
    const values = form.getFieldsValue();
    setFilters({
      platform: values.platform ?? 'all',
      range: values.range,
    });
  };

  const handleReset = () => {
    form.resetFields();
    form.setFieldsValue({ platform: 'all', range: defaultRange });
    setFilters({ platform: 'all', range: defaultRange });
  };

  return (
    <div data-e2e-id="bet-monitor-page">
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>注單監控</Title>
        <Text type="secondary">系統 / 注單監控</Text>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          initialValues={{ platform: 'all', range: defaultRange }}
          style={{ rowGap: 12, flexWrap: 'wrap' }}
        >
          <Form.Item name="platform" label="遊戲平台">
            <Select style={{ width: 160 }} data-e2e-id="bet-monitor-platform-select">
              <Select.Option value="all">全部</Select.Option>
              {platformOptions.map((platform) => (
                <Select.Option key={platform} value={platform}>
                  {platform}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="range" label="創建時間">
            <RangePicker
              showTime
              style={{ width: 380 }}
              data-e2e-id="bet-monitor-range-picker"
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleQuery}
                data-e2e-id="bet-monitor-query-btn"
              >
                查詢
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
                data-e2e-id="bet-monitor-reset-btn"
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card size="small">
        <Table
          rowKey="key"
          columns={columns}
          dataSource={filteredRecords}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 條`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          data-e2e-id="bet-monitor-table"
        />
      </Card>
    </div>
  );
}

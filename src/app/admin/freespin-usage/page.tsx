'use client';

import React, { useState, useMemo } from 'react';
import {
  Card, Table, Input, Select, DatePicker, Button, Row, Col, Space, Statistic, Typography, Form,
} from 'antd';
import { SearchOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { generateFreeSpinGrants, generateFreeSpinUsage, type FreeSpinUsageItem } from '@/data/mockData';
import Link from 'next/link';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const providers = [
  { code: 'FC', name: 'FC Game' },
  { code: 'JDB', name: 'JDB' },
  { code: 'JILI', name: 'JILI' },
  { code: 'PG', name: 'PG SOFT' },
  { code: 'PP', name: 'Pragmatic Play' },
];

const formatCurrency = (val: number) => `₱${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function FreeSpinUsagePage() {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [allUsage] = useState(() => {
    const grants = generateFreeSpinGrants(60);
    return generateFreeSpinUsage(120, grants);
  });

  const filteredData = useMemo(() => {
    return allUsage.filter((item) => {
      if (filters.grantId && !item.grantId.toLowerCase().includes(filters.grantId.toLowerCase())) return false;
      if (filters.playerId && !item.playerId.toLowerCase().includes(filters.playerId.toLowerCase())) return false;
      if (filters.providerCode && item.providerCode !== filters.providerCode) return false;
      if (filters.gameName && !item.gameName.toLowerCase().includes(filters.gameName.toLowerCase())) return false;
      return true;
    });
  }, [filters, allUsage]);

  const stats = useMemo(() => {
    const totalBet = filteredData.reduce((s, i) => s + i.betAmount, 0);
    const totalWin = filteredData.reduce((s, i) => s + i.winAmount, 0);
    const totalNet = filteredData.reduce((s, i) => s + i.netWin, 0);
    return {
      total: filteredData.length,
      totalBet: +totalBet.toFixed(2),
      totalWin: +totalWin.toFixed(2),
      totalNet: +totalNet.toFixed(2),
    };
  }, [filteredData]);

  const columns: ColumnsType<FreeSpinUsageItem> = [
    { title: '記錄 ID', dataIndex: 'id', width: 120 },
    {
      title: '派發 ID', dataIndex: 'grantId', width: 120,
      render: (val) => <Link href="/admin/freespin-grants" style={{ color: '#1668dc' }}>{val}</Link>,
    },
    { title: '玩家', dataIndex: 'playerId', width: 120, render: (val) => <a style={{ color: '#1668dc' }}>{val}</a> },
    { title: '廠商', dataIndex: 'providerName', width: 120 },
    { title: '遊戲', dataIndex: 'gameName', width: 140 },
    { title: '廠商回合 ID', dataIndex: 'vendorRoundId', width: 140 },
    {
      title: '投注額', dataIndex: 'betAmount', width: 100,
      render: (val) => formatCurrency(val),
      sorter: (a, b) => a.betAmount - b.betAmount,
    },
    {
      title: '派彩額', dataIndex: 'winAmount', width: 100,
      render: (val) => formatCurrency(val),
      sorter: (a, b) => a.winAmount - b.winAmount,
    },
    {
      title: '淨贏輸', dataIndex: 'netWin', width: 110,
      render: (val) => (
        <span style={{ color: val >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {formatCurrency(val)}
        </span>
      ),
      sorter: (a, b) => a.netWin - b.netWin,
    },
    { title: '回合時間', dataIndex: 'roundTime', width: 170, sorter: (a, b) => a.roundTime.localeCompare(b.roundTime) },
  ];

  const onSearch = () => {
    const values = form.getFieldsValue();
    setFilters(values);
  };

  const onReset = () => {
    form.resetFields();
    setFilters({});
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Free Spin 使用記錄</Title>
        <Text type="secondary">查詢所有 Free Spin 的實際使用回合與投注派彩明細</Text>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" style={{ gap: 12, flexWrap: 'wrap', rowGap: 12 }}>
          <Form.Item name="grantId" label="派發 ID">
            <Input placeholder="輸入派發 ID" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="playerId" label="玩家帳號">
            <Input placeholder="輸入帳號" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="providerCode" label="廠商">
            <Select placeholder="全部" allowClear style={{ width: 130 }}>
              {providers.map(p => <Select.Option key={p.code} value={p.code}>{p.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="gameName" label="遊戲">
            <Input placeholder="搜尋遊戲名稱" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="dateRange" label="日期區間">
            <RangePicker style={{ width: 260 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={onSearch}>查詢</Button>
              <Button icon={<ReloadOutlined />} onClick={onReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="記錄總筆數" value={stats.total} /></Card></Col>
        <Col span={6}><Card><Statistic title="總投注額" value={stats.totalBet} prefix="₱" precision={2} /></Card></Col>
        <Col span={6}><Card><Statistic title="總派彩額" value={stats.totalWin} prefix="₱" precision={2} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="總淨贏輸"
              value={Math.abs(stats.totalNet)}
              prefix={stats.totalNet >= 0 ? '₱' : '-₱'}
              precision={2}
              valueStyle={{ color: stats.totalNet >= 0 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button icon={<DownloadOutlined />}>導出 CSV</Button>
        </div>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          scroll={{ x: 1300 }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 筆` }}
          size="small"
        />
      </Card>
    </div>
  );
}

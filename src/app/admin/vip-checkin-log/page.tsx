'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Card, Table, Tag, Input, Select, DatePicker, Button, Row, Col, Space, Statistic, Typography, Form,
} from 'antd';
import { SearchOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { generateCheckinLogs, tierRanges, type CheckinLogItem } from '@/data/mockData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function VipCheckinLogPage() {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [allLogs] = useState(() => generateCheckinLogs(51));

  const filteredData = useMemo(() => {
    return allLogs.filter((item) => {
      if (filters.account && !item.account.toLowerCase().includes(filters.account.toLowerCase())) return false;
      if (filters.uid && !item.uid.includes(filters.uid)) return false;
      if (filters.vipLevel !== undefined && filters.vipLevel !== null && item.vipLevel !== filters.vipLevel) return false;
      if (filters.tierRange && item.tierRange !== filters.tierRange) return false;
      if (filters.checkinType && item.checkinType !== filters.checkinType) return false;
      if (filters.hasReward === 'yes' && !item.rewardNode) return false;
      if (filters.hasReward === 'no' && item.rewardNode) return false;
      return true;
    });
  }, [filters]);

  const [todayCount, setTodayCount] = useState(0);

  const stats = useMemo(() => ({
    total: filteredData.length,
    makeup: filteredData.filter(i => i.checkinType === 'makeup').length,
    rewarded: filteredData.filter(i => i.rewardNode).length,
  }), [filteredData]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setTodayCount(filteredData.filter(i => i.checkinTime.startsWith(today)).length);
  }, [filteredData]);

  const columns: ColumnsType<CheckinLogItem> = [
    { title: '序號', dataIndex: 'id', width: 70, fixed: 'left' },
    {
      title: '會員帳號', dataIndex: 'account', width: 130, fixed: 'left',
      render: (val, r) => <a style={{ color: '#1668dc' }}>{val}</a>,
    },
    { title: '會員 UID', dataIndex: 'uid', width: 100 },
    {
      title: 'VIP 等級', dataIndex: 'vipLevel', width: 90,
      render: (val) => <Tag color="blue">V{val}</Tag>,
    },
    {
      title: '等級區間', dataIndex: 'tierRange', width: 100,
      render: (val) => {
        const colors: Record<string, string> = { Bronze: '#cd7f32', Silver: '#c0c0c0', Gold: '#ffd700', Platinum: '#e5e4e2', Diamond: '#b9f2ff' };
        return <Tag color={colors[val] || 'default'}>{val}</Tag>;
      },
    },
    { title: '簽到日 (Day)', dataIndex: 'checkinDay', width: 110 },
    { title: '簽到前連續天數', dataIndex: 'consecutiveBefore', width: 140 },
    { title: '簽到後連續天數', dataIndex: 'consecutiveAfter', width: 140 },
    {
      title: '簽到類型', dataIndex: 'checkinType', width: 100,
      render: (val) => val === 'makeup'
        ? <Tag color="orange">補簽</Tag>
        : <Tag color="green">一般</Tag>,
    },
    {
      title: '補簽存款金額', dataIndex: 'makeupDeposit', width: 130,
      render: (val) => val ? `₱${val.toLocaleString()}` : '-',
    },
    {
      title: '觸發獎勵節點', dataIndex: 'rewardNode', width: 130,
      render: (val) => val ? <Tag color="purple">Day {val}</Tag> : '-',
    },
    { title: '當前週期', dataIndex: 'currentCycle', width: 100 },
    { title: '簽到時間', dataIndex: 'checkinTime', width: 180 },
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
        <Title level={4} style={{ margin: 0, color: '#e8e8e8' }}>VIP 簽到日誌</Title>
        <Text type="secondary">查詢所有會員的每日簽到行為與獎勵觸發記錄</Text>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" style={{ gap: 12, flexWrap: 'wrap', rowGap: 12 }}>
          <Form.Item name="account" label="會員帳號">
            <Input placeholder="輸入帳號" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="uid" label="會員 UID">
            <Input placeholder="輸入 UID" allowClear style={{ width: 130 }} />
          </Form.Item>
          <Form.Item name="vipLevel" label="VIP 等級">
            <Select placeholder="全部" allowClear style={{ width: 100 }}>
              {Array.from({ length: 31 }, (_, i) => (
                <Select.Option key={i} value={i}>V{i}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="tierRange" label="等級區間">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              {tierRanges.map(t => <Select.Option key={t} value={t}>{t}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="checkinType" label="簽到類型">
            <Select placeholder="全部" allowClear style={{ width: 100 }}>
              <Select.Option value="normal">一般</Select.Option>
              <Select.Option value="makeup">補簽</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="hasReward" label="是否觸發獎勵">
            <Select placeholder="全部" allowClear style={{ width: 100 }}>
              <Select.Option value="yes">是</Select.Option>
              <Select.Option value="no">否</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="簽到時間">
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
        <Col span={6}><Card><Statistic title="簽到總筆數" value={stats.total} /></Card></Col>
        <Col span={6}><Card><Statistic title="補簽筆數" value={stats.makeup} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="獎勵觸發筆數" value={stats.rewarded} valueStyle={{ color: '#722ed1' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="當日簽到人數" value={todayCount} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button icon={<DownloadOutlined />}>導出 Excel</Button>
        </div>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          scroll={{ x: 1600 }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 筆` }}
          size="small"
        />
      </Card>
    </div>
  );
}

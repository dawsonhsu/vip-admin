'use client';

import React, { useState, useMemo } from 'react';
import {
  Card, Table, Tag, Input, Select, DatePicker, Button, Row, Col, Space, Statistic, Typography, Form,
} from 'antd';
import { SearchOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { generateRewards, tierRanges, type RewardItem } from '@/data/mockData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const rewardTypes = ['簽到獎勵', '升級禮金', '生日禮金', '半月禮金', '返現獎勵'];
export default function VipRewardsPage() {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [allRewards] = useState(() => generateRewards(35));

  const filteredData = useMemo(() => {
    return allRewards.filter((item) => {
      if (filters.account && !item.account.toLowerCase().includes(filters.account.toLowerCase())) return false;
      if (filters.uid && !item.uid.includes(filters.uid)) return false;
      if (filters.vipLevel !== undefined && filters.vipLevel !== null && item.vipLevel !== filters.vipLevel) return false;
      if (filters.tierRange && item.tierRange !== filters.tierRange) return false;
      if (filters.rewardType && item.rewardType !== filters.rewardType) return false;
      if (filters.claimStatus && item.claimStatus !== filters.claimStatus) return false;
      return true;
    });
  }, [filters]);

  const stats = useMemo(() => ({
    total: filteredData.length,
    members: new Set(filteredData.map(i => i.uid)).size,
    totalAmount: filteredData.reduce((sum, i) => sum + i.bonusAmount, 0),
    totalSpins: filteredData.reduce((sum, i) => sum + i.freeSpins, 0),
    pending: filteredData.filter(i => i.claimStatus === 'pending').length,
  }), [filteredData]);

  const columns: ColumnsType<RewardItem> = [
    { title: '序號', dataIndex: 'id', width: 70, fixed: 'left' },
    {
      title: '會員帳號', dataIndex: 'account', width: 130, fixed: 'left',
      render: (val, record) => <a data-e2e-id={`vip-rewards-table-account-link-${record.uid}`} style={{ color: '#1668dc' }}>{val}</a>,
    },
    { title: '會員 UID', dataIndex: 'uid', width: 100 },
    {
      title: 'VIP 等級', dataIndex: 'vipLevel', width: 90,
      render: (val, record) => <Tag data-e2e-id={`vip-rewards-table-vip-tag-${record.uid}`} color="blue">V{val}</Tag>,
    },
    {
      title: '等級區間', dataIndex: 'tierRange', width: 100,
      render: (val, record) => {
        const colors: Record<string, string> = { Bronze: '#cd7f32', Silver: '#c0c0c0', Gold: '#ffd700', Platinum: '#e5e4e2', Diamond: '#b9f2ff' };
        return <Tag data-e2e-id={`vip-rewards-table-tier-tag-${record.uid}`} color={colors[val] || 'default'}>{val}</Tag>;
      },
    },
    {
      title: '獎勵類型', dataIndex: 'rewardType', width: 110,
      render: (val, record) => {
        const colors: Record<string, string> = { '簽到獎勵': 'green', '升級禮金': 'blue', '生日禮金': 'magenta', '半月禮金': 'cyan', '返現獎勵': 'orange' };
        return <Tag data-e2e-id={`vip-rewards-table-reward-type-tag-${record.uid}-${record.id}`} color={colors[val] || 'default'}>{val}</Tag>;
      },
    },
    {
      title: '獎金金額', dataIndex: 'bonusAmount', width: 110,
      render: (val) => `₱${val.toLocaleString()}`,
    },
    { title: 'Free Spins', dataIndex: 'freeSpins', width: 100 },
    {
      title: '流水倍數', dataIndex: 'turnoverMultiplier', width: 100,
      render: (val) => `${val}x`,
    },
    {
      title: '領取狀態', dataIndex: 'claimStatus', width: 100,
      render: (val, record) => val === 'claimed'
        ? <Tag data-e2e-id={`vip-rewards-table-claim-status-tag-${record.uid}-${record.id}`} color="green">已領取</Tag>
        : <Tag data-e2e-id={`vip-rewards-table-claim-status-tag-${record.uid}-${record.id}`} color="orange">待領取</Tag>,
    },
    { title: '發放時間', dataIndex: 'distributionDate', width: 180 },
    {
      title: '領取時間', dataIndex: 'claimDate', width: 180,
      render: (val) => val || '-',
    },
  ];

  const onSearch = () => setFilters(form.getFieldsValue());
  const onReset = () => { form.resetFields(); setFilters({}); };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, color: '#e8e8e8' }}>VIP 獎勵表</Title>
        <Text type="secondary">管理與追蹤 VIP 會員獎勵發放記錄</Text>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" style={{ gap: 12, flexWrap: 'wrap', rowGap: 12 }}>
          <Form.Item name="account" label="會員帳號">
            <Input data-e2e-id="vip-rewards-filter-account-input" placeholder="輸入帳號" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="uid" label="會員 UID">
            <Input data-e2e-id="vip-rewards-filter-uid-input" placeholder="輸入 UID" allowClear style={{ width: 130 }} />
          </Form.Item>
          <Form.Item name="vipLevel" label="VIP 等級">
            <Select data-e2e-id="vip-rewards-filter-vip-level-select" placeholder="全部" allowClear style={{ width: 100 }}>
              {Array.from({ length: 31 }, (_, i) => (
                <Select.Option key={i} value={i}>V{i}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="tierRange" label="等級區間">
            <Select data-e2e-id="vip-rewards-filter-tier-range-select" placeholder="全部" allowClear style={{ width: 120 }}>
              {tierRanges.map(t => <Select.Option key={t} value={t}>{t}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="rewardType" label="獎勵類型">
            <Select data-e2e-id="vip-rewards-filter-reward-type-select" placeholder="全部" allowClear style={{ width: 120 }}>
              {rewardTypes.map(t => <Select.Option key={t} value={t}>{t}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="claimStatus" label="領取狀態">
            <Select data-e2e-id="vip-rewards-filter-claim-status-select" placeholder="全部" allowClear style={{ width: 110 }}>
              <Select.Option value="pending">待領取</Select.Option>
              <Select.Option value="claimed">已領取</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="distDateRange" label="發放時間">
            <RangePicker data-e2e-id="vip-rewards-filter-dist-date-range" style={{ width: 260 }} />
          </Form.Item>
          <Form.Item name="claimDateRange" label="領取時間">
            <RangePicker data-e2e-id="vip-rewards-filter-claim-date-range" style={{ width: 260 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button data-e2e-id="vip-rewards-filter-query-btn" type="primary" icon={<SearchOutlined />} onClick={onSearch}>查詢</Button>
              <Button data-e2e-id="vip-rewards-filter-reset-btn" icon={<ReloadOutlined />} onClick={onReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={5}><Card><Statistic data-e2e-id="vip-rewards-summary-total" title="獎勵總筆數" value={stats.total} /></Card></Col>
        <Col span={5}><Card><Statistic data-e2e-id="vip-rewards-summary-members" title="涉及會員數" value={stats.members} /></Card></Col>
        <Col span={5}><Card><Statistic data-e2e-id="vip-rewards-summary-total-amount" title="發放總金額" value={stats.totalAmount} prefix="₱" precision={2} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={5}><Card><Statistic data-e2e-id="vip-rewards-summary-total-spins" title="Free Spins 總數" value={stats.totalSpins} valueStyle={{ color: '#1668dc' }} /></Card></Col>
        <Col span={4}><Card><Statistic data-e2e-id="vip-rewards-summary-pending" title="待領取" value={stats.pending} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
      </Row>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button data-e2e-id="vip-rewards-toolbar-export-btn" icon={<DownloadOutlined />}>導出 Excel</Button>
        </div>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          onRow={(record) => ({ 'data-e2e-id': `vip-rewards-table-row-${record.uid}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          scroll={{ x: 1500 }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 筆` }}
          size="small"
        />
      </Card>
    </div>
  );
}

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, DatePicker, Form, Row, Space, Statistic, Typography } from 'antd';
import {
  DollarOutlined, GiftOutlined, TeamOutlined, UserAddOutlined,
  UsergroupAddOutlined, WalletOutlined, UnorderedListOutlined,
  BankOutlined, SwapOutlined, TrophyOutlined, RiseOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { buildAgencyProfile, type ProfileResult } from '@/data/agency/profile';
import { agencyRangeOf, formatCount, formatPeso, type AgencyQuickRange } from '@/lib/agencyUtils';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
type DateRange = [Dayjs, Dayjs];
const quickRanges: Array<{ key: AgencyQuickRange; label: string }> = [
  { key: 'today', label: '今日' },
  { key: 'yesterday', label: '昨日' },
  { key: 'week', label: '本週' },
  { key: 'month', label: '本月' },
  { key: 'lastMonth', label: '上月' },
];

interface Metric {
  key: string;
  field: keyof ProfileResult['stat'];
  title: string;
  icon: React.ReactNode;
  color: string;
  money?: boolean;
  signed?: boolean;
  demoAdded?: boolean;
}

const groups: Array<{ title: string; tiles: Metric[] }> = [
  { title: '會員', tiles: [
    { key: 'members-total', field: 'members', title: '累積會員總數', icon: <TeamOutlined />, color: '#1668dc' },
    { key: 'reg', field: 'reg', title: '註冊人數', icon: <UserAddOutlined />, color: '#722ed1' },
    { key: 'first-deposit-users', field: 'first_deposit', title: '首存人數', icon: <UsergroupAddOutlined />, color: '#d48806' },
    { key: 'first-deposit-amount', field: 'first_deposit_amount', title: '首存金額', icon: <WalletOutlined />, color: '#d48806', money: true, demoAdded: true },
  ] },
  { title: '存款', tiles: [
    { key: 'deposit-users', field: 'deposit_users', title: '存款人數', icon: <TeamOutlined />, color: '#08979c', demoAdded: true },
    { key: 'deposit-count', field: 'deposit_count', title: '存款筆數', icon: <UnorderedListOutlined />, color: '#08979c', demoAdded: true },
    { key: 'deposit-amount', field: 'deposit_amount', title: '存款金額', icon: <WalletOutlined />, color: '#08979c', money: true, demoAdded: true },
  ] },
  { title: '提款', tiles: [
    { key: 'withdraw-users', field: 'withdraw_users', title: '提款人數', icon: <TeamOutlined />, color: '#597ef7', demoAdded: true },
    { key: 'withdraw-count', field: 'withdraw_count', title: '提款筆數', icon: <UnorderedListOutlined />, color: '#597ef7', demoAdded: true },
    { key: 'withdraw-amount', field: 'withdraw_amount', title: '提款金額', icon: <BankOutlined />, color: '#597ef7', money: true, demoAdded: true },
    { key: 'dw-diff', field: 'dw_diff', title: '存提差', icon: <SwapOutlined />, color: '#389e0d', money: true, signed: true, demoAdded: true },
  ] },
  { title: '營收', tiles: [
    { key: 'bet-users', field: 'bet_users', title: '投注人數', icon: <TeamOutlined />, color: '#1668dc', demoAdded: true },
    { key: 'valid-bet', field: 'valid_bet', title: '有效投注', icon: <TrophyOutlined />, color: '#1668dc', money: true, demoAdded: true },
    { key: 'ggr', field: 'ggr', title: 'GGR', icon: <DollarOutlined />, color: '#389e0d', money: true, signed: true },
    { key: 'bonus', field: 'bonus', title: 'Bonus', icon: <GiftOutlined />, color: '#c41d7f', money: true },
    { key: 'ngr', field: 'ngr', title: 'NGR', icon: <RiseOutlined />, color: '#389e0d', money: true, signed: true, demoAdded: true },
  ] },
];

export default function AgencyHomePage() {
  const [form] = Form.useForm<{ dateRange: DateRange }>();
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [activeQuick, setActiveQuick] = useState<AgencyQuickRange | null>('month');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const range = agencyRangeOf('month');
    form.setFieldsValue({ dateRange: range });
    setDateRange(range);
    setMounted(true);
  }, [form]);

  const profile = useMemo(() => mounted && dateRange
    ? buildAgencyProfile(dateRange[0].startOf('day').unix(), dateRange[1].endOf('day').unix())
    : null, [mounted, dateRange, revision]);

  const applyQuick = (key: AgencyQuickRange) => {
    const range = agencyRangeOf(key);
    form.setFieldsValue({ dateRange: range });
    setDateRange(range);
    setActiveQuick(key);
  };

  return (
    <div>
      <Card data-e2e-id="agency-home-filter-card" style={{ marginBottom: 16 }}>
        <Form
          data-e2e-id="agency-home-filter-form"
          form={form}
          layout="horizontal"
          colon={false}
          onFinish={(values) => { setDateRange([...values.dateRange]); setRevision((value) => value + 1); }}
        >
          <Row gutter={[16, 0]} align="middle">
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="dateRange" label="日期區間" rules={[{ required: true, message: '請選擇日期區間' }]}>
                <RangePicker
                  data-e2e-id="agency-home-filter-date-range"
                  format="YYYY-MM-DD"
                  placeholder={['開始日期', '結束日期']}
                  style={{ width: '100%' }}
                  allowClear={false}
                  onChange={(range) => {
                    setActiveQuick(null);
                    if (range?.[0] && range[1]) setDateRange([range[0], range[1]]);
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} xl={18}>
              <Space wrap style={{ marginBottom: 24 }}>
                {quickRanges.map(({ key, label }) => (
                  <Button data-e2e-id={`agency-home-filter-quick-${key}-btn`} key={key} type={activeQuick === key ? 'primary' : 'text'} onClick={() => applyQuick(key)}>{label}</Button>
                ))}
              </Space>
            </Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button data-e2e-id="agency-home-filter-reset-btn" onClick={() => { form.resetFields(); applyQuick('month'); }} style={{ background: '#e6a23c', borderColor: '#e6a23c', color: '#fff' }}>重置</Button>
              <Button data-e2e-id="agency-home-filter-search-btn" htmlType="submit" style={{ background: '#67c23a', borderColor: '#67c23a', color: '#fff' }}>搜尋</Button>
            </Space>
          </div>
        </Form>
      </Card>


      <Alert
        showIcon
        type="info"
        message="示範資料：每小時固定快照，數據依所選區間彙總；存提款金額與筆數、有效投注、GGR 及 Bonus 與會員日統計同區間總計完全一致。＊標示之指標後端 /agency/profile 尚未提供，上線前需擴充。"
        style={{ marginBottom: 16 }}
      />

      {groups.map((group) => (
        <section key={group.title} style={{ marginBottom: 24 }}>
          <Title level={5}>{group.title}</Title>
          <Row gutter={[16, 16]}>
            {group.tiles.map((tile) => {
              const value = profile?.stat[tile.field];
              const color = tile.signed ? Number(value) < 0 ? '#cf1322' : '#389e0d' : tile.color;
              return (
                <Col key={tile.key} xs={24} sm={12} xl={6}>
                  <Card data-e2e-id={`agency-home-stat-${tile.key}-card`} style={{ height: '100%', borderTop: `3px solid ${color}55` }} styles={{ body: { padding: 20 } }}>
                    <Statistic
                      title={<Space><span style={{ color }}>{tile.icon}</span><span>{tile.title}{tile.demoAdded && <Text type="secondary" title="示範新增指標">＊</Text>}</span></Space>}
                      value={value ?? 0}
                      formatter={(amount) => !profile ? '—' : tile.money ? formatPeso(Number(amount)) : formatCount(Number(amount))}
                      valueStyle={{ fontSize: 24, color, overflowWrap: 'anywhere' }}
                    />
                  </Card>
                </Col>
              );
            })}
          </Row>
        </section>
      ))}
    </div>
  );
}

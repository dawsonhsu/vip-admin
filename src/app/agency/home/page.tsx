'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, DatePicker, Descriptions, Form, Row, Space, Statistic, Table, Typography } from 'antd';
import {
  DollarOutlined, DownloadOutlined, GiftOutlined, ReloadOutlined,
  TeamOutlined, UserAddOutlined, UsergroupAddOutlined, WalletOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { buildAgencyProfile, type ProfileResult } from '@/data/agency/profile';
import { agencyBonusCashTypes } from '@/data/agency/shared';
import {
  agencyRangeOf, downloadCsv, formatCount, formatPercent, formatPeso, formatTs,
  settleTypeLabels, toCsvCell, type AgencyQuickRange,
} from '@/lib/agencyUtils';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
type DateRange = [Dayjs, Dayjs];
type GameRow = ProfileResult['stat']['ggr_detail'][number];
type BonusRow = ProfileResult['stat']['bonus_list'][number];
const chartColors = ['#1668dc', '#13a8a8', '#722ed1', '#d48806', '#389e0d', '#c41d7f', '#597ef7', '#d46b08'];
const quickRanges: Array<{ key: AgencyQuickRange; label: string }> = [
  { key: 'today', label: '今日' },
  { key: 'yesterday', label: '昨日' },
  { key: 'week', label: '本週' },
  { key: 'month', label: '本月' },
  { key: 'lastMonth', label: '上月' },
];

function share(amount: string, total?: string): string {
  return formatPercent(Number(total) ? Number(amount) / Number(total) * 100 : 0);
}

export default function AgencyHomePage() {
  const [form] = Form.useForm<{ dateRange: DateRange }>();
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [activeQuick, setActiveQuick] = useState<AgencyQuickRange | null>('month');
  const [revision, setRevision] = useState(0);
  const [gamePageSize, setGamePageSize] = useState(20);
  const [bonusPageSize, setBonusPageSize] = useState(20);

  useEffect(() => {
    const range = agencyRangeOf('month');
    form.setFieldsValue({ dateRange: range });
    setDateRange(range);
    setMounted(true);
  }, [form]);

  const profile = useMemo(() => mounted && dateRange
    ? buildAgencyProfile(dateRange[0].startOf('day').unix(), dateRange[1].endOf('day').unix())
    : null, [mounted, dateRange, revision]);
  const stat = profile?.stat;

  const applyQuick = (key: AgencyQuickRange) => {
    const range = agencyRangeOf(key);
    form.setFieldsValue({ dateRange: range });
    setDateRange(range);
    setActiveQuick(key);
  };

  const exportTable = (kind: 'ggr' | 'bonus') => {
    if (!stat) return;
    const rows = kind === 'ggr'
      ? [['遊戲分類', 'GGR', '佔比'], ...stat.ggr_detail.map((row) => [row.name, formatPeso(row.ggr), share(row.ggr, stat.ggr)]), ['合計', formatPeso(stat.ggr), share(stat.ggr, stat.ggr)]]
      : [['禮金類型', '金額', '佔比'], ...stat.bonus_list.map((row) => [agencyBonusCashTypes[row.cash_type], formatPeso(row.bonus), share(row.bonus, stat.bonus)]), ['合計', formatPeso(stat.bonus), share(stat.bonus, stat.bonus)]];
    downloadCsv(`首頁看板_${kind === 'ggr' ? 'GGR遊戲分類' : '活動禮金分類'}_${dateRange?.[0].format('YYYYMMDD')}_${dateRange?.[1].format('YYYYMMDD')}.csv`, rows.map((row) => row.map(toCsvCell).join(',')).join('\n'));
  };

  const toolbar = (kind: 'ggr' | 'bonus', title: string) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
      <Title level={5} style={{ margin: 0 }}>{title}</Title>
      <Space>
        <Button data-e2e-id={`agency-home-${kind}-export-btn`} icon={<DownloadOutlined />} onClick={() => exportTable(kind)} disabled={!profile}>匯出</Button>
        <Button data-e2e-id={`agency-home-${kind}-refresh-btn`} icon={<ReloadOutlined />} aria-label={`重新整理${title}`} title="重新整理" onClick={() => setRevision((value) => value + 1)} />
      </Space>
    </div>
  );

  const gameColumns: ColumnsType<GameRow> = [
    {
      title: '遊戲分類', dataIndex: 'name', width: 140,
      render: (name: string, row) => (
        <Space><span aria-hidden style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: chartColors[(row.game_class - 1) % chartColors.length] }} />{name}</Space>
      ),
    },
    { title: 'GGR', dataIndex: 'ggr', width: 180, align: 'right', render: (value: string) => <span style={{ color: Number(value) < 0 ? '#cf1322' : '#389e0d' }}>{formatPeso(value)}</span> },
    { title: '佔比', width: 100, align: 'right', render: (_, row) => share(row.ggr, stat?.ggr) },
  ];
  const bonusColumns: ColumnsType<BonusRow> = [
    { title: '禮金類型', dataIndex: 'cash_type', width: 150, render: (value: number) => agencyBonusCashTypes[value] ?? String(value) },
    { title: '金額', dataIndex: 'bonus', width: 170, align: 'right', render: (value: string) => formatPeso(value) },
    { title: '佔比', width: 100, align: 'right', render: (_, row) => share(row.bonus, stat?.bonus) },
  ];
  const tiles = [
    { key: 'ggr', title: 'GGR', value: stat?.ggr, money: true, icon: <DollarOutlined />, color: Number(stat?.ggr) < 0 ? '#cf1322' : '#389e0d' },
    { key: 'members', title: '會員總數', value: stat?.members, money: false, icon: <TeamOutlined />, color: '#1668dc' },
    { key: 'active-members', title: '活躍會員', value: stat?.active_members, money: false, icon: <UsergroupAddOutlined />, color: '#08979c' },
    { key: 'reg', title: '當月註冊', value: stat?.reg, money: false, icon: <UserAddOutlined />, color: '#722ed1' },
    { key: 'first-deposit', title: '當月首存', value: stat?.first_deposit, money: false, icon: <WalletOutlined />, color: '#d48806' },
    { key: 'bonus', title: '活動禮金', value: stat?.bonus, money: true, icon: <GiftOutlined />, color: '#c41d7f' },
  ];

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
        message="示範資料：總額與人數採共用會員當月統計，日期切換呈現模擬分類分布；當月首存以當月註冊且已首存的會員估算。"
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {tiles.map((tile) => (
          <Col key={tile.key} xs={24} sm={12} xl={8} xxl={4}>
            <Card data-e2e-id={`agency-home-stat-${tile.key}-card`} style={{ height: '100%', borderTop: `3px solid ${tile.color}55` }} styles={{ body: { padding: 20 } }}>
              <Statistic
                title={<Space><span style={{ color: tile.color }}>{tile.icon}</span>{tile.title}</Space>}
                value={tile.value ?? 0}
                formatter={(value) => !profile ? '—' : tile.money ? formatPeso(Number(value)) : formatCount(Number(value))}
                valueStyle={{ fontSize: 24, color: tile.color, overflowWrap: 'anywhere' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card data-e2e-id="agency-home-ggr-card" style={{ height: '100%' }}>
            {toolbar('ggr', 'GGR 遊戲分類明細')}
            <div style={{ height: 260, minWidth: 0 }} role="img" aria-label="GGR 遊戲分類圓環圖，詳細數值列於下方表格">
              {mounted && stat && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stat.ggr_detail.map((row) => ({ ...row, value: Number(row.ggr) }))} dataKey="value" nameKey="name" innerRadius={65} outerRadius={105} paddingAngle={2} isAnimationActive={false}>
                      {stat.ggr_detail.map((row, index) => <Cell key={row.game_class} fill={chartColors[index % chartColors.length]} stroke="none" />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatPeso(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <Table<GameRow>
              data-e2e-id="agency-home-ggr-table"
              size="small"
              rowKey="game_class"
              columns={gameColumns}
              dataSource={mounted ? stat?.ggr_detail ?? [] : []}
              scroll={{ x: 420 }}
              pagination={{ pageSize: gamePageSize, showSizeChanger: true, showQuickJumper: true, onChange: (_, size) => setGamePageSize(size), showTotal: (total, range) => `當前：第 ${Math.max(1, Math.ceil(range[0] / gamePageSize))} 頁, 共 ${total} 筆資料` }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card data-e2e-id="agency-home-bonus-card" style={{ height: '100%' }}>
            {toolbar('bonus', '活動禮金分類')}
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>依活動類型彙總會員禮金，金額與會員列表活動禮金加總一致。</Text>
            <Table<BonusRow>
              data-e2e-id="agency-home-bonus-table"
              size="small"
              rowKey="cash_type"
              columns={bonusColumns}
              dataSource={mounted ? stat?.bonus_list ?? [] : []}
              scroll={{ x: 420 }}
              pagination={{ pageSize: bonusPageSize, showSizeChanger: true, showQuickJumper: true, onChange: (_, size) => setBonusPageSize(size), showTotal: (total, range) => `當前：第 ${Math.max(1, Math.ceil(range[0] / bonusPageSize))} 頁, 共 ${total} 筆資料` }}
              summary={() => stat ? (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}><Text strong>合計</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right"><Text strong>{formatPeso(stat.bonus)}</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">{share(stat.bonus, stat.bonus)}</Table.Summary.Cell>
                </Table.Summary.Row>
              ) : null}
            />
          </Card>
        </Col>
      </Row>

      <Card data-e2e-id="agency-home-account-card" title="帳號資訊">
        <Descriptions
          bordered
          size="small"
          column={{ xs: 1, sm: 2, xl: 3 }}
          items={[
            { key: 'username', label: '代理帳號', children: profile?.username ?? '—' },
            { key: 'uid', label: 'UID', children: profile?.uid ?? '—' },
            { key: 'phone', label: '手機號碼', children: profile?.phone ?? '—' },
            { key: 'real_username', label: '真實姓名', children: profile ? [profile.real_username.first_name, profile.real_username.middle_name, profile.real_username.last_name].filter(Boolean).join(' ') : '—' },
            { key: 'settle_type', label: '結算週期', children: profile ? settleTypeLabels[profile.settle_type] : '—' },
            { key: 'last_login_at', label: '最後登入時間', children: profile ? formatTs(profile.last_login_at) : '—' },
            { key: 'last_login_ip', label: '最後登入 IP', children: profile?.last_login_ip ?? '—' },
            { key: 'last_login_addr', label: '最後登入地點', children: profile?.last_login_addr ?? '—' },
          ]}
        />
      </Card>
    </div>
  );
}

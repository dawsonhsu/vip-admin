'use client';

import React, { useState, useMemo } from 'react';
import {
  Card, Table, Tag, Input, Select, DatePicker, Button, Row, Col, Space, Statistic, Typography, Form, Tooltip, Modal, InputNumber, message, Drawer, Descriptions, Progress, Switch, Timeline,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, DownloadOutlined, PlusOutlined, CopyOutlined, EyeOutlined, RetweetOutlined, FieldTimeOutlined, StopOutlined, WarningOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { generateFreeSpinGrants, generateFreeSpinUsage, type FreeSpinGrantItem, type FreeSpinUsageItem } from '@/data/mockData';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const providers = [
  { code: 'FC', name: 'FC Game' },
  { code: 'JDB', name: 'JDB' },
  { code: 'JILI', name: 'JILI' },
  { code: 'PG', name: 'PG SOFT' },
  { code: 'PP', name: 'Pragmatic Play' },
];

const activityOptions = ['春節首存活動', 'VIP月禮', '週年慶活動', '新遊戲推廣'];

const formatCurrency = (val: number) => `₱${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const providerGames: Record<string, { code: string; name: string }[]> = {
  FC: [
    { code: 'night_market', name: 'Night Market' },
    { code: 'chinese_ny', name: 'Chinese New Year' },
    { code: 'sugar_bang', name: 'Sugar Bang Bang' },
  ],
  JDB: [
    { code: 'zeus', name: 'Zeus' },
    { code: 'cowboys', name: 'Cowboys' },
    { code: 'golden_genie', name: 'Golden Genie' },
  ],
  JILI: [
    { code: 'super_ace', name: 'Super Ace' },
    { code: 'fortune_gems', name: 'Fortune Gems' },
    { code: 'golden_empire', name: 'Golden Empire' },
  ],
  PG: [
    { code: 'fortune_tiger', name: 'Fortune Tiger' },
    { code: 'fortune_rabbit', name: 'Fortune Rabbit' },
    { code: 'mahjong_ways', name: 'Mahjong Ways' },
  ],
  PP: [
    { code: 'sweet_bonanza', name: 'Sweet Bonanza' },
    { code: 'gates_olympus', name: 'Gates of Olympus' },
    { code: 'starlight_princess', name: 'Starlight Princess' },
  ],
};

type BatchAction = 'resend' | 'extend' | 'cancel' | null;

const renderClaimStatus = (val: FreeSpinGrantItem['claimStatus']) => {
  const map: Record<string, { color: string; label: string }> = {
    claimed: { color: 'default', label: '已領取' },
    in_use: { color: 'processing', label: '使用中' },
    completed: { color: 'success', label: '已完成' },
    expired: { color: 'error', label: '已過期' },
  };
  const cfg = map[val] || { color: 'default', label: val };
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
};

const renderDispatchStatus = (record: FreeSpinGrantItem) => {
  const val = record.dispatchStatus;
  const map: Record<string, { color: string; label: string }> = {
    pending: { color: 'default', label: '待處理' },
    dispatched: { color: 'blue', label: '已派發' },
    settled: { color: 'success', label: '已結算' },
    failed: { color: 'error', label: '失敗' },
  };
  const cfg = map[val] || { color: 'default', label: val };

  if (val === 'failed') {
    return (
      <Tooltip
        title={
          <div>
            <div><strong>失敗原因：</strong>{record.failureReason || '未知'}</div>
            <div><strong>已重試：</strong>{record.retryCount}/3</div>
          </div>
        }
      >
        <Tag color={cfg.color} icon={<WarningOutlined />} style={{ cursor: 'help' }}>
          {cfg.label} ({record.retryCount}/3)
        </Tag>
      </Tooltip>
    );
  }
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
};

export default function FreeSpinGrantsPage() {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [allGrants, setAllGrants] = useState(() => generateFreeSpinGrants(60));
  const [allUsage] = useState<FreeSpinUsageItem[]>(() => generateFreeSpinUsage(200, generateFreeSpinGrants(60)));
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [selectedGrantType, setSelectedGrantType] = useState<string | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [drawerGrant, setDrawerGrant] = useState<FreeSpinGrantItem | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchAction, setBatchAction] = useState<BatchAction>(null);
  const [batchForm] = Form.useForm();

  const filteredData = useMemo(() => {
    const now = dayjs();
    return allGrants.filter((item) => {
      if (filters.playerId && !item.playerId.toLowerCase().includes(filters.playerId.toLowerCase())) return false;
      if (filters.name && !item.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.vendorEventId && !(item.vendorEventId || '').toLowerCase().includes(filters.vendorEventId.toLowerCase())) return false;
      if (filters.sourceType && item.sourceType !== filters.sourceType) return false;
      if (filters.activityName && item.sourceActivityName !== filters.activityName) return false;
      if (filters.grantType && item.grantType !== filters.grantType) return false;
      if (filters.providerCode && item.providerCode !== filters.providerCode) return false;
      if (filters.claimStatus && item.claimStatus !== filters.claimStatus) return false;
      if (filters.dispatchStatus && item.dispatchStatus !== filters.dispatchStatus) return false;
      if (filters.settlementStatus === 'settled' && !item.settledAt) return false;
      if (filters.settlementStatus === 'unsettled' && item.settledAt) return false;
      if (filters.expireSoon) {
        const hoursLeft = dayjs(item.expireAt).diff(now, 'hour');
        const hourThreshold = filters.expireSoon === '24h' ? 24 : 24 * 7;
        if (hoursLeft < 0 || hoursLeft > hourThreshold) return false;
        if (item.claimStatus === 'completed' || item.claimStatus === 'expired') return false;
      }
      if (filters.expireDateRange && filters.expireDateRange.length === 2) {
        const [start, end] = filters.expireDateRange;
        const expireDay = dayjs(item.expireAt);
        if (expireDay.isBefore(start, 'day') || expireDay.isAfter(end, 'day')) return false;
      }
      if (filters.dateRange && filters.dateRange.length === 2) {
        const [start, end] = filters.dateRange;
        const createdDay = dayjs(item.createdAt);
        if (createdDay.isBefore(start, 'day') || createdDay.isAfter(end, 'day')) return false;
      }
      return true;
    });
  }, [filters, allGrants]);

  const stats = useMemo(() => {
    const totalBet = filteredData.reduce((s, i) => s + i.totalBet, 0);
    const totalWin = filteredData.reduce((s, i) => s + i.totalWin, 0);
    const rtp = totalBet > 0 ? +(totalWin / totalBet * 100).toFixed(1) : 0;
    return {
      total: filteredData.length,
      inUse: filteredData.filter(i => i.claimStatus === 'in_use').length,
      completed: filteredData.filter(i => i.claimStatus === 'completed').length,
      expired: filteredData.filter(i => i.claimStatus === 'expired').length,
      failed: filteredData.filter(i => i.dispatchStatus === 'failed').length,
      pendingSettle: filteredData.filter(i => i.dispatchStatus === 'dispatched').length,
      totalBet: +totalBet.toFixed(2),
      totalWin: +totalWin.toFixed(2),
      rtp,
    };
  }, [filteredData]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success(`已複製：${text}`);
  };

  const columns: ColumnsType<FreeSpinGrantItem> = [
    { title: '派發 ID', dataIndex: 'id', width: 110, fixed: 'left', render: (val, record) => <a onClick={() => setDrawerGrant(record)}>{val}</a> },
    { title: '名稱', dataIndex: 'name', width: 130 },
    { title: '玩家', dataIndex: 'playerId', width: 120, fixed: 'left', render: (val) => <a style={{ color: '#1668dc' }}>{val}</a> },
    {
      title: '廠商事件 ID', dataIndex: 'vendorEventId', width: 150,
      render: (val: string | null) => {
        if (!val) return <Text type="secondary">—</Text>;
        return (
          <Space size={4}>
            <Text style={{ fontSize: 12 }}>{val}</Text>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={(e) => { e.stopPropagation(); copyToClipboard(val); }}
            />
          </Space>
        );
      },
    },
    {
      title: '來源', dataIndex: 'sourceType', width: 90,
      render: (val) => val === 'activity'
        ? <Tag color="blue">活動</Tag>
        : <Tag color="green">手動</Tag>,
    },
    {
      title: '關聯活動', dataIndex: 'sourceActivityName', width: 130,
      render: (val) => val || '—',
    },
    {
      title: '贈送類型', dataIndex: 'grantType', width: 100,
      render: (val) => {
        const map: Record<string, { color: string; label: string }> = {
          open: { color: 'purple', label: '不限' },
          provider: { color: 'orange', label: '廠商' },
          game: { color: 'cyan', label: '遊戲' },
        };
        const cfg = map[val] || { color: 'default', label: val };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: '廠商', dataIndex: 'providerName', width: 120,
      render: (val) => val || '—',
    },
    {
      title: '遊戲', dataIndex: 'games', width: 140,
      render: (games: FreeSpinGrantItem['games']) => {
        if (!games || games.length === 0) return '—';
        if (games.length === 1) return games[0].name;
        return (
          <Tooltip title={games.map(g => g.name).join(', ')}>
            <span>{games[0].name} <Tag style={{ marginLeft: 4 }}>+{games.length - 1}</Tag></span>
          </Tooltip>
        );
      },
    },
    {
      title: '投注額', dataIndex: 'betAmount', width: 90,
      render: (val) => formatCurrency(val),
    },
    {
      title: '進度', width: 160,
      render: (_, r) => {
        const pct = r.totalSpins > 0 ? Math.round(r.usedSpins / r.totalSpins * 100) : 0;
        return (
          <div>
            <Progress percent={pct} size="small" style={{ marginBottom: 2 }} />
            <Text style={{ fontSize: 12 }} type="secondary">{r.usedSpins} / {r.totalSpins}</Text>
          </div>
        );
      },
    },
    {
      title: '累計投注', dataIndex: 'totalBet', width: 110,
      render: (val) => formatCurrency(val),
    },
    {
      title: '累計贏得', dataIndex: 'totalWin', width: 110,
      render: (val) => formatCurrency(val),
    },
    {
      title: 'RTP', width: 90,
      render: (_, r) => {
        if (r.totalBet === 0) return <Text type="secondary">—</Text>;
        const rtp = +(r.totalWin / r.totalBet * 100).toFixed(1);
        const color = rtp > 500 ? '#ff4d4f' : rtp > 150 ? '#faad14' : '#52c41a';
        return <span style={{ color, fontWeight: 500 }}>{rtp}%</span>;
      },
    },
    {
      title: '領取狀態', dataIndex: 'claimStatus', width: 100,
      render: renderClaimStatus,
    },
    {
      title: '派發狀態', width: 130,
      render: (_, record) => renderDispatchStatus(record),
    },
    {
      title: '到期時間', dataIndex: 'expireAt', width: 170,
      render: (val, r) => {
        if (r.claimStatus === 'completed' || r.claimStatus === 'expired') return val;
        const hoursLeft = dayjs(val).diff(dayjs(), 'hour');
        if (hoursLeft < 0) return <span style={{ color: '#ff4d4f' }}>{val}</span>;
        if (hoursLeft < 24) return <span style={{ color: '#ff4d4f' }}>⚠️ {val}</span>;
        if (hoursLeft < 24 * 3) return <span style={{ color: '#faad14' }}>{val}</span>;
        return val;
      },
    },
    { title: '建立時間', dataIndex: 'createdAt', width: 170, sorter: (a, b) => a.createdAt.localeCompare(b.createdAt) },
    {
      title: '操作', key: 'action', width: 130, fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setDrawerGrant(record)}>詳情</Button>
          {record.dispatchStatus === 'failed' && record.retryCount < 3 && (
            <Button type="link" size="small" onClick={() => handleResend(record)}>補發</Button>
          )}
        </Space>
      ),
    },
  ];

  const handleResend = (record: FreeSpinGrantItem) => {
    Modal.confirm({
      title: '確認補發 Free Spin',
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>將對以下記錄重新呼叫廠商 API 派發：</p>
          <div style={{ background: '#fafafa', padding: 12, borderRadius: 4, fontSize: 13 }}>
            <div><strong>派發 ID：</strong>{record.id}</div>
            <div><strong>玩家：</strong>{record.playerId}</div>
            <div><strong>名稱：</strong>{record.name}</div>
            <div><strong>失敗原因：</strong>{record.failureReason || '—'}</div>
            <div><strong>已重試：</strong>{record.retryCount}/3</div>
          </div>
        </div>
      ),
      okText: '確認補發',
      cancelText: '取消',
      onOk: () => {
        setAllGrants(prev => prev.map(g =>
          g.id === record.id
            ? { ...g, dispatchStatus: 'dispatched' as const, failureReason: null, retryCount: g.retryCount + 1, vendorEventId: `VE${Math.floor(Math.random() * 900000 + 100000)}` }
            : g
        ));
        message.success(`已補發成功（${record.id}）`);
      },
    });
  };

  const handleBatchConfirm = () => {
    if (batchAction === 'extend') {
      const values = batchForm.getFieldsValue();
      const days = values.extendDays || 7;
      setAllGrants(prev => prev.map(g =>
        selectedRowKeys.includes(g.id) && g.claimStatus !== 'expired' && g.claimStatus !== 'completed'
          ? { ...g, expireAt: dayjs(g.expireAt).add(days, 'day').format('YYYY-MM-DD HH:mm:ss') }
          : g
      ));
      message.success(`已批量延期 ${selectedRowKeys.length} 筆（+${days} 天）`);
    } else if (batchAction === 'resend') {
      setAllGrants(prev => prev.map(g =>
        selectedRowKeys.includes(g.id) && g.dispatchStatus === 'failed' && g.retryCount < 3
          ? { ...g, dispatchStatus: 'dispatched' as const, failureReason: null, retryCount: g.retryCount + 1, vendorEventId: `VE${Math.floor(Math.random() * 900000 + 100000)}` }
          : g
      ));
      message.success(`已批量補發 ${selectedRowKeys.length} 筆`);
    } else if (batchAction === 'cancel') {
      setAllGrants(prev => prev.map(g =>
        selectedRowKeys.includes(g.id) && (g.claimStatus === 'claimed' || g.claimStatus === 'in_use')
          ? { ...g, claimStatus: 'expired' as const }
          : g
      ));
      message.success(`已批量取消 ${selectedRowKeys.length} 筆`);
    }
    setBatchAction(null);
    setSelectedRowKeys([]);
    batchForm.resetFields();
  };

  const onSearch = () => {
    const values = form.getFieldsValue();
    setFilters(values);
  };

  const onReset = () => {
    form.resetFields();
    setFilters({});
  };

  const drawerUsage = useMemo(() => {
    if (!drawerGrant) return [] as FreeSpinUsageItem[];
    return allUsage.filter(u => u.grantId === drawerGrant.id);
  }, [drawerGrant, allUsage]);

  const drawerProgress = drawerGrant
    ? Math.round((drawerGrant.usedSpins / Math.max(drawerGrant.totalSpins, 1)) * 100)
    : 0;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Free Spin 派發記錄</Title>
        <Text type="secondary">查詢所有 Free Spin 派發記錄與領取、派發狀態</Text>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" style={{ gap: 12, flexWrap: 'wrap', rowGap: 12 }}>
          <Form.Item name="playerId" label="玩家帳號">
            <Input placeholder="輸入帳號" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="name" label="名稱">
            <Input placeholder="輸入名稱" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="vendorEventId" label="廠商事件 ID">
            <Input placeholder="VE…" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="sourceType" label="來源">
            <Select placeholder="全部" allowClear style={{ width: 100 }}>
              <Select.Option value="activity">活動</Select.Option>
              <Select.Option value="manual">手動</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="activityName" label="關聯活動">
            <Select placeholder="全部" allowClear style={{ width: 140 }}>
              {activityOptions.map(a => <Select.Option key={a} value={a}>{a}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="grantType" label="贈送類型">
            <Select placeholder="全部" allowClear style={{ width: 100 }}>
              <Select.Option value="open">不限</Select.Option>
              <Select.Option value="provider">廠商</Select.Option>
              <Select.Option value="game">遊戲</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="providerCode" label="廠商">
            <Select placeholder="全部" allowClear style={{ width: 130 }}>
              {providers.map(p => <Select.Option key={p.code} value={p.code}>{p.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="claimStatus" label="領取狀態">
            <Select placeholder="全部" allowClear style={{ width: 110 }}>
              <Select.Option value="claimed">已領取</Select.Option>
              <Select.Option value="in_use">使用中</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="expired">已過期</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="dispatchStatus" label="派發狀態">
            <Select placeholder="全部" allowClear style={{ width: 110 }}>
              <Select.Option value="pending">待處理</Select.Option>
              <Select.Option value="dispatched">已派發</Select.Option>
              <Select.Option value="settled">已結算</Select.Option>
              <Select.Option value="failed">失敗</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="settlementStatus" label="結算">
            <Select placeholder="全部" allowClear style={{ width: 110 }}>
              <Select.Option value="settled">已結算</Select.Option>
              <Select.Option value="unsettled">未結算</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="expireSoon" label="即將過期">
            <Select placeholder="全部" allowClear style={{ width: 110 }}>
              <Select.Option value="24h">24 小時內</Select.Option>
              <Select.Option value="7d">7 天內</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="建立日期">
            <RangePicker style={{ width: 240 }} />
          </Form.Item>
          <Form.Item name="expireDateRange" label="到期日期">
            <RangePicker style={{ width: 240 }} />
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
        <Col span={6}><Card><Statistic title="派發總筆數" value={stats.total} /></Card></Col>
        <Col span={6}><Card><Statistic title="使用中筆數" value={stats.inUse} valueStyle={{ color: '#1668dc' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="派發失敗" value={stats.failed} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="待結算筆數" value={stats.pendingSettle} valueStyle={{ color: '#faad14' }} /></Card></Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="已完成筆數" value={stats.completed} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="總投注" value={stats.totalBet} prefix="₱" precision={2} /></Card></Col>
        <Col span={6}><Card><Statistic title="總派彩" value={stats.totalWin} prefix="₱" precision={2} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="整體 RTP"
              value={stats.rtp}
              suffix="%"
              precision={1}
              valueStyle={{ color: stats.rtp > 500 ? '#ff4d4f' : stats.rtp > 150 ? '#faad14' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
          <Space>
            {selectedRowKeys.length > 0 && (
              <>
                <Text strong>已選 {selectedRowKeys.length} 筆</Text>
                <Button icon={<RetweetOutlined />} onClick={() => setBatchAction('resend')}>批量補發</Button>
                <Button icon={<FieldTimeOutlined />} onClick={() => setBatchAction('extend')}>批量延期</Button>
                <Button icon={<StopOutlined />} danger onClick={() => setBatchAction('cancel')}>批量取消</Button>
                <Button type="link" onClick={() => setSelectedRowKeys([])}>清除選擇</Button>
              </>
            )}
          </Space>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>手動派發</Button>
            <Button icon={<DownloadOutlined />}>導出 CSV</Button>
          </Space>
        </div>
        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            preserveSelectedRowKeys: true,
          }}
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          scroll={{ x: 2400 }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 筆` }}
          size="small"
        />
      </Card>

      <Drawer
        title={drawerGrant ? `派發詳情 ${drawerGrant.id}` : ''}
        width={960}
        open={!!drawerGrant}
        onClose={() => setDrawerGrant(null)}
        extra={drawerGrant && drawerGrant.dispatchStatus === 'failed' && drawerGrant.retryCount < 3 ? (
          <Button type="primary" icon={<RetweetOutlined />} onClick={() => { handleResend(drawerGrant); }}>補發</Button>
        ) : null}
      >
        {drawerGrant && (
          <div>
            <Title level={5}>基本資訊</Title>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="派發 ID">{drawerGrant.id}</Descriptions.Item>
              <Descriptions.Item label="名稱">{drawerGrant.name}</Descriptions.Item>
              <Descriptions.Item label="玩家">{drawerGrant.playerId}</Descriptions.Item>
              <Descriptions.Item label="幣別">{drawerGrant.currency}</Descriptions.Item>
              <Descriptions.Item label="來源">{drawerGrant.sourceType === 'activity' ? '活動' : '手動'}</Descriptions.Item>
              <Descriptions.Item label="關聯活動">{drawerGrant.sourceActivityName || '—'}</Descriptions.Item>
              <Descriptions.Item label="廠商事件 ID" span={2}>
                {drawerGrant.vendorEventId ? (
                  <Space>
                    <Text copyable={{ text: drawerGrant.vendorEventId }}>{drawerGrant.vendorEventId}</Text>
                  </Space>
                ) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="建立人">{drawerGrant.createdBy}</Descriptions.Item>
              <Descriptions.Item label="建立時間">{drawerGrant.createdAt}</Descriptions.Item>
              <Descriptions.Item label="備註" span={2}>{drawerGrant.remark || '—'}</Descriptions.Item>
            </Descriptions>

            <Title level={5}>設定</Title>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="贈送類型">
                {drawerGrant.grantType === 'open' ? '不限' : drawerGrant.grantType === 'provider' ? '廠商' : '遊戲'}
              </Descriptions.Item>
              <Descriptions.Item label="廠商">{drawerGrant.providerName || '—'}</Descriptions.Item>
              <Descriptions.Item label="遊戲清單" span={2}>
                {drawerGrant.games && drawerGrant.games.length > 0
                  ? drawerGrant.games.map(g => <Tag key={g.code}>{g.name}</Tag>)
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="總次數">{drawerGrant.totalSpins}</Descriptions.Item>
              <Descriptions.Item label="單轉投注">{formatCurrency(drawerGrant.betAmount)}</Descriptions.Item>
              <Descriptions.Item label="最低提領">{drawerGrant.minWithdraw != null ? formatCurrency(drawerGrant.minWithdraw) : '不限'}</Descriptions.Item>
              <Descriptions.Item label="最高提領">{drawerGrant.maxWithdraw != null ? formatCurrency(drawerGrant.maxWithdraw) : '不限'}</Descriptions.Item>
              <Descriptions.Item label="到期時間" span={2}>{drawerGrant.expireAt}</Descriptions.Item>
            </Descriptions>

            <Title level={5}>進度</Title>
            <Card style={{ marginBottom: 24 }}>
              <Progress percent={drawerProgress} />
              <div style={{ marginTop: 4, marginBottom: 16, fontSize: 13 }}>
                已使用 <strong>{drawerGrant.usedSpins}</strong> / {drawerGrant.totalSpins} 次（剩餘 {drawerGrant.totalSpins - drawerGrant.usedSpins} 次）
              </div>
              <Row gutter={16}>
                <Col span={6}><Statistic title="累計投注" value={drawerGrant.totalBet} prefix="₱" precision={2} /></Col>
                <Col span={6}><Statistic title="累計派彩" value={drawerGrant.totalWin} prefix="₱" precision={2} valueStyle={{ color: '#52c41a' }} /></Col>
                <Col span={6}>
                  <Statistic
                    title="RTP"
                    value={drawerGrant.totalBet > 0 ? +(drawerGrant.totalWin / drawerGrant.totalBet * 100).toFixed(1) : 0}
                    suffix="%"
                    precision={1}
                    valueStyle={{
                      color: drawerGrant.totalBet > 0 && drawerGrant.totalWin / drawerGrant.totalBet > 5
                        ? '#ff4d4f'
                        : drawerGrant.totalBet > 0 && drawerGrant.totalWin / drawerGrant.totalBet > 1.5
                          ? '#faad14' : '#52c41a',
                    }}
                  />
                </Col>
                <Col span={6}>
                  <div style={{ fontSize: 14, color: '#8c8c8c' }}>狀態</div>
                  <div style={{ marginTop: 8 }}>
                    {renderClaimStatus(drawerGrant.claimStatus)}
                    {renderDispatchStatus(drawerGrant)}
                  </div>
                </Col>
              </Row>
              {drawerGrant.dispatchStatus === 'failed' && drawerGrant.failureReason && (
                <div style={{ marginTop: 12, padding: 12, background: '#fff2f0', borderRadius: 4, border: '1px solid #ffccc7' }}>
                  <WarningOutlined style={{ color: '#ff4d4f', marginRight: 6 }} />
                  <strong>失敗原因：</strong>{drawerGrant.failureReason}
                  <span style={{ marginLeft: 12 }}><strong>重試次數：</strong>{drawerGrant.retryCount}/3</span>
                </div>
              )}
            </Card>

            <Title level={5}>使用記錄 ({drawerUsage.length} 筆)</Title>
            <Table
              size="small"
              style={{ marginBottom: 24 }}
              columns={[
                { title: '記錄 ID', dataIndex: 'id', width: 110 },
                { title: '遊戲', dataIndex: 'gameName', width: 140 },
                { title: '廠商回合 ID', dataIndex: 'vendorRoundId', width: 130 },
                { title: '投注', dataIndex: 'betAmount', width: 80, render: formatCurrency },
                { title: '派彩', dataIndex: 'winAmount', width: 90, render: formatCurrency },
                {
                  title: '淨贏輸', dataIndex: 'netWin', width: 90,
                  render: (v: number) => <span style={{ color: v >= 0 ? '#52c41a' : '#ff4d4f' }}>{formatCurrency(v)}</span>,
                },
                { title: '時間', dataIndex: 'roundTime', width: 160 },
              ]}
              dataSource={drawerUsage}
              rowKey="id"
              pagination={{ pageSize: 10, size: 'small' }}
              locale={{ emptyText: '尚無使用記錄' }}
            />

            <Title level={5}>操作日誌</Title>
            <Timeline
              items={[
                { color: 'blue', children: <><strong>{drawerGrant.createdAt}</strong> {drawerGrant.createdBy} 建立派發</> },
                ...(drawerGrant.vendorEventId ? [{ color: 'green' as const, children: <><strong>{drawerGrant.createdAt}</strong> 廠商 API 派發成功（event_id={drawerGrant.vendorEventId}）</> }] : []),
                ...(drawerGrant.dispatchStatus === 'failed' ? [{ color: 'red' as const, children: <><strong>{drawerGrant.createdAt}</strong> 廠商 API 失敗：{drawerGrant.failureReason}（重試 {drawerGrant.retryCount}/3）</> }] : []),
                ...(drawerGrant.usedAt ? [{ color: 'gray' as const, children: <><strong>{drawerGrant.usedAt}</strong> 玩家首次使用</> }] : []),
                ...(drawerGrant.settledAt ? [{ color: 'green' as const, children: <><strong>{drawerGrant.settledAt}</strong> 廠商結算完成</> }] : []),
              ]}
            />
          </div>
        )}
      </Drawer>

      <Modal
        title={batchAction === 'resend' ? '批量補發' : batchAction === 'extend' ? '批量延期' : '批量取消'}
        open={batchAction !== null}
        onCancel={() => { setBatchAction(null); batchForm.resetFields(); }}
        onOk={handleBatchConfirm}
        okText="確認"
        cancelText="取消"
        okButtonProps={batchAction === 'cancel' ? { danger: true } : undefined}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>將對選中的 <strong>{selectedRowKeys.length}</strong> 筆記錄執行以下操作：</Text>
        </div>
        {batchAction === 'resend' && (
          <div style={{ background: '#f6ffed', padding: 12, borderRadius: 4, border: '1px solid #b7eb8f' }}>
            僅對「失敗且重試次數 &lt; 3」的記錄生效。
          </div>
        )}
        {batchAction === 'extend' && (
          <Form form={batchForm} layout="vertical">
            <Form.Item name="extendDays" label="延長天數" rules={[{ required: true, message: '請輸入延長天數' }]}>
              <InputNumber min={1} max={90} style={{ width: '100%' }} placeholder="例：7" />
            </Form.Item>
            <Text type="secondary">僅對「未完成、未過期」的記錄生效。</Text>
          </Form>
        )}
        {batchAction === 'cancel' && (
          <div style={{ background: '#fff2f0', padding: 12, borderRadius: 4, border: '1px solid #ffccc7' }}>
            <WarningOutlined style={{ color: '#ff4d4f', marginRight: 6 }} />
            取消後將無法恢復。僅對「已領取 / 使用中」的記錄生效。
          </div>
        )}
      </Modal>

      <Modal
        title="手動派發 Free Spin"
        open={createOpen}
        width={640}
        onCancel={() => { setCreateOpen(false); createForm.resetFields(); setSelectedGrantType(null); setSelectedProviders([]); }}
        onOk={() => {
          createForm.validateFields().then((values) => {
            const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
            const expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + (values.expireDays || 7));
            const newGrant: FreeSpinGrantItem = {
              id: `FS${String(allGrants.length + 1).padStart(4, '0')}`,
              name: values.name,
              playerId: values.playerId,
              sourceType: 'manual',
              sourceActivityName: values.activityName || null,
              grantType: values.grantType,
              providerCode: values.grantType === 'open' ? null : (values.providerCodes?.[0] || null),
              providerName: values.grantType === 'open' ? null : providers.find(p => p.code === values.providerCodes?.[0])?.name || null,
              games: values.grantType === 'game' && values.gameCodes
                ? values.gameCodes.map((gc: string) => {
                    for (const pCode of (values.providerCodes || [])) {
                      const found = providerGames[pCode]?.find(g => g.code === gc);
                      if (found) return found;
                    }
                    return { code: gc, name: gc };
                  })
                : null,
              totalSpins: values.totalSpins,
              usedSpins: 0,
              betAmount: values.betAmount || 0.20,
              totalBet: 0,
              totalWin: 0,
              claimStatus: 'claimed',
              dispatchStatus: 'pending',
              vendorEventId: null,
              currency: 'PHP',
              minWithdraw: values.minWithdraw ?? null,
              maxWithdraw: values.maxWithdraw ?? null,
              expireAt: expireDate.toISOString().replace('T', ' ').slice(0, 19),
              usedAt: null,
              settledAt: null,
              failureReason: null,
              retryCount: 0,
              createdBy: 'admin',
              createdAt: now,
              remark: values.remark || null,
            };
            setAllGrants(prev => [newGrant, ...prev]);
            setCreateOpen(false);
            createForm.resetFields();
            setSelectedGrantType(null);
            setSelectedProviders([]);
            message.success('派發成功');
          });
        }}
        okText="確認派發"
        cancelText="取消"
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="名稱" rules={[{ required: true, message: '請輸入名稱' }]}>
            <Input placeholder="此名稱將顯示在用戶端" />
          </Form.Item>
          <Form.Item name="playerId" label="發放對象" rules={[{ required: true, message: '請輸入玩家帳號' }]}>
            <Input placeholder="輸入玩家帳號，多個以逗號分隔" />
          </Form.Item>
          <Form.Item name="grantType" label="贈送類型" rules={[{ required: true, message: '請選擇贈送類型' }]}>
            <Select
              placeholder="請選擇"
              onChange={(val) => { setSelectedGrantType(val); setSelectedProviders([]); createForm.setFieldsValue({ providerCodes: undefined, gameCodes: undefined }); }}
            >
              <Select.Option value="open">不限</Select.Option>
              <Select.Option value="provider">廠商</Select.Option>
              <Select.Option value="game">遊戲</Select.Option>
            </Select>
          </Form.Item>
          {(selectedGrantType === 'provider' || selectedGrantType === 'game') && (
            <Form.Item name="providerCodes" label="廠商" rules={[{ required: true, message: '請選擇廠商' }]}>
              <Select
                mode="multiple"
                placeholder="選擇廠商"
                onChange={(vals: string[]) => { setSelectedProviders(vals); createForm.setFieldsValue({ gameCodes: undefined }); }}
              >
                {providers.map(p => <Select.Option key={p.code} value={p.code}>{p.name}</Select.Option>)}
              </Select>
            </Form.Item>
          )}
          {selectedGrantType === 'game' && selectedProviders.length > 0 && (
            <Form.Item name="gameCodes" label="遊戲" rules={[{ required: true, message: '請選擇遊戲' }]}>
              <Select mode="multiple" placeholder="選擇遊戲（可複選）">
                {selectedProviders.flatMap(pCode =>
                  (providerGames[pCode] || []).map(g => (
                    <Select.Option key={g.code} value={g.code}>{providers.find(p => p.code === pCode)?.name} - {g.name}</Select.Option>
                  ))
                )}
              </Select>
            </Form.Item>
          )}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="totalSpins" label="贈送次數" rules={[{ required: true, message: '請輸入次數' }]}>
                <InputNumber min={1} max={999999} style={{ width: '100%' }} placeholder="次數" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="betAmount" label="單轉投注額">
                <InputNumber min={0.01} step={0.10} style={{ width: '100%' }} placeholder="預設 0.20" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="expireDays" label="有效天數">
                <InputNumber min={1} max={365} style={{ width: '100%' }} placeholder="預設 7 天" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="minWithdraw" label="最低提領金額">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="不限" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maxWithdraw" label="最高提領金額">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="不限" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="activityName" label="關聯活動（非必填）">
            <Select placeholder="選擇活動" allowClear>
              {activityOptions.map(a => <Select.Option key={a} value={a}>{a}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="備註（非必填）">
            <Input.TextArea rows={2} placeholder="派發原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import {
  Card, Table, Tag, Input, Select, DatePicker, Button, Row, Col, Space, Statistic, Typography, Form, Tooltip, Modal, InputNumber, message,
} from 'antd';
import { SearchOutlined, ReloadOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { generateFreeSpinGrants, type FreeSpinGrantItem } from '@/data/mockData';

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

export default function FreeSpinGrantsPage() {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [allGrants, setAllGrants] = useState(() => generateFreeSpinGrants(60));
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [selectedGrantType, setSelectedGrantType] = useState<string | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

  const filteredData = useMemo(() => {
    return allGrants.filter((item) => {
      if (filters.playerId && !item.playerId.toLowerCase().includes(filters.playerId.toLowerCase())) return false;
      if (filters.name && !item.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.sourceType && item.sourceType !== filters.sourceType) return false;
      if (filters.grantType && item.grantType !== filters.grantType) return false;
      if (filters.providerCode && item.providerCode !== filters.providerCode) return false;
      if (filters.claimStatus && item.claimStatus !== filters.claimStatus) return false;
      if (filters.dispatchStatus && item.dispatchStatus !== filters.dispatchStatus) return false;
      return true;
    });
  }, [filters, allGrants]);

  const stats = useMemo(() => ({
    total: filteredData.length,
    inUse: filteredData.filter(i => i.claimStatus === 'in_use').length,
    completed: filteredData.filter(i => i.claimStatus === 'completed').length,
    expired: filteredData.filter(i => i.claimStatus === 'expired').length,
  }), [filteredData]);

  const columns: ColumnsType<FreeSpinGrantItem> = [
    { title: '派發 ID', dataIndex: 'id', width: 120, fixed: 'left' },
    { title: '名稱', dataIndex: 'name', width: 130 },
    { title: '玩家', dataIndex: 'playerId', width: 120, fixed: 'left', render: (val) => <a style={{ color: '#1668dc' }}>{val}</a> },
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
        return games[0].name;
      },
    },
    {
      title: '投注額', dataIndex: 'betAmount', width: 100,
      render: (val) => formatCurrency(val),
    },
    {
      title: '次數', width: 90,
      render: (_, r) => `${r.usedSpins} / ${r.totalSpins}`,
    },
    {
      title: '累計贏得', dataIndex: 'totalWin', width: 110,
      render: (val) => formatCurrency(val),
    },
    {
      title: '領取狀態', dataIndex: 'claimStatus', width: 100,
      render: (val) => {
        const map: Record<string, { status: 'default' | 'processing' | 'success' | 'error'; label: string }> = {
          claimed: { status: 'default', label: '已領取' },
          in_use: { status: 'processing', label: '使用中' },
          completed: { status: 'success', label: '已完成' },
          expired: { status: 'error', label: '已過期' },
        };
        const cfg = map[val] || { status: 'default', label: val };
        return <Tag color={cfg.status}>{cfg.label}</Tag>;
      },
    },
    {
      title: '派發狀態', dataIndex: 'dispatchStatus', width: 100,
      render: (val) => {
        const map: Record<string, { color: string; label: string }> = {
          pending: { color: 'default', label: '待處理' },
          dispatched: { color: 'blue', label: '已派發' },
          settled: { color: 'success', label: '已結算' },
          failed: { color: 'error', label: '失敗' },
        };
        const cfg = map[val] || { color: 'default', label: val };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: '最後使用時間', dataIndex: 'usedAt', width: 170,
      render: (val) => val || '—',
    },
    { title: '建立時間', dataIndex: 'createdAt', width: 170, sorter: (a, b) => a.createdAt.localeCompare(b.createdAt) },
    { title: '到期時間', dataIndex: 'expireAt', width: 170 },
    {
      title: '操作', key: 'action', width: 100, fixed: 'right',
      render: (_, record) => {
        if (record.dispatchStatus === 'failed') {
          return (
            <Button
              type="link"
              size="small"
              onClick={() => handleResend(record)}
            >
              補發
            </Button>
          );
        }
        return <Text type="secondary">—</Text>;
      },
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
            <div><strong>次數：</strong>{record.totalSpins} 次</div>
          </div>
        </div>
      ),
      okText: '確認補發',
      cancelText: '取消',
      onOk: () => {
        setAllGrants(prev => prev.map(g =>
          g.id === record.id
            ? { ...g, dispatchStatus: 'dispatched' as const }
            : g
        ));
        message.success(`已補發成功（${record.id}）`);
      },
    });
  };

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
          <Form.Item name="sourceType" label="來源">
            <Select placeholder="全部" allowClear style={{ width: 100 }}>
              <Select.Option value="activity">活動</Select.Option>
              <Select.Option value="manual">手動</Select.Option>
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
          <Form.Item name="dateRange" label="建立日期">
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
        <Col span={6}><Card><Statistic title="派發總筆數" value={stats.total} /></Card></Col>
        <Col span={6}><Card><Statistic title="使用中筆數" value={stats.inUse} valueStyle={{ color: '#1668dc' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="已完成筆數" value={stats.completed} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="已過期筆數" value={stats.expired} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
      </Row>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, gap: 8 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>手動派發</Button>
          <Button icon={<DownloadOutlined />}>導出 CSV</Button>
        </div>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          scroll={{ x: 2000 }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 筆` }}
          size="small"
        />
      </Card>

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
              totalWin: 0,
              claimStatus: 'claimed',
              dispatchStatus: 'pending',
              vendorEventId: null,
              currency: 'PHP',
              minWithdraw: values.minWithdraw ?? null,
              maxWithdraw: values.maxWithdraw ?? null,
              expireAt: expireDate.toISOString().replace('T', ' ').slice(0, 19),
              usedAt: null,
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
            <Input placeholder="輸入活動名稱" />
          </Form.Item>
          <Form.Item name="remark" label="備註（非必填）">
            <Input.TextArea rows={2} placeholder="派發原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

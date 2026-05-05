'use client';

import React, { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from 'antd';
import {
  CloseCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
  SettingOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  freeBetGrantRecords,
  freeBetRewardConfigs,
  type FreeBetGrantRecord,
  type FreeBetRewardConfig,
} from '@/data/freeBetActivityData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const formatCurrency = (value: number) =>
  `₱${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// 移除菲律宾国码 +63 前缀（含可能的 63 / +63 / 0063）
const formatPhone = (phone: string) => {
  if (!phone) return phone;
  return phone.replace(/^\+?0*63/, '').replace(/^\+/, '');
};

const BTI_STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: '未激活', color: 'default' },
  1: { label: '可使用', color: 'processing' },
  2: { label: '已使用', color: 'success' },
  3: { label: '已过期', color: 'error' },
  4: { label: '已过期(未使用)', color: 'error' },
  5: { label: '失败', color: 'error' },
  6: { label: '已取消', color: 'default' },
  7: { label: '待激活', color: 'warning' },
};

function getAvailableActions(record: FreeBetGrantRecord): string[] {
  const actions: string[] = [];

  if (record.grantStatus === 'failed') {
    actions.push('重试发放');
  }

  if (record.btiStatusCode !== null && [0, 1, 7].includes(record.btiStatusCode)) {
    actions.push('取消');
  }

  if (record.btiStatusCode !== null) {
    actions.push('同步状态');
  }

  return actions;
}

function getActionKey(action: string) {
  if (action === '同步状态') return 'sync-status';
  if (action === '取消') return 'cancel';
  if (action === '重试发放') return 'retry-grant';
  return 'action';
}

function showErrorMessage(record: FreeBetGrantRecord) {
  const isFailed = record.grantStatus === 'failed';
  const title = isFailed ? '发放失败详情' : '发放警告详情';
  const color = isFailed ? '#ff4d4f' : '#faad14';
  const Icon = isFailed ? CloseCircleOutlined : ExclamationCircleOutlined;

  Modal.info({
    title: (
      <Space>
        <Icon style={{ color }} />
        <span>{title}</span>
      </Space>
    ),
    icon: null,
    width: 560,
    okText: '关闭',
    content: (
      <div style={{ marginTop: 12 }}>
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="发放单号">
            <Text code>{record.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="会员">
            {record.playerAccount} <Text type="secondary">（UID: {record.uid}）</Text>
          </Descriptions.Item>
          <Descriptions.Item label="错误码">
            <Text code style={{ color }}>{record.errorCode ?? '—'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="发生时间">
            {record.errorAt ?? '—'}
          </Descriptions.Item>
          <Descriptions.Item label="BTi 状态">
            {record.btiStatusCode !== null ? (
              <Tag color={BTI_STATUS_MAP[record.btiStatusCode]?.color}>
                {BTI_STATUS_MAP[record.btiStatusCode]?.label}
              </Tag>
            ) : <Text type="secondary">—</Text>}
          </Descriptions.Item>
        </Descriptions>
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: isFailed ? '#fff2f0' : '#fffbe6',
            border: `1px solid ${isFailed ? '#ffccc7' : '#ffe58f'}`,
            borderRadius: 6,
          }}
        >
          <Text strong style={{ color, display: 'block', marginBottom: 6 }}>错误信息</Text>
          <Text style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {record.errorMessage ?? '未获取到错误信息，请查看 BTi 同步日志。'}
          </Text>
        </div>
        {isFailed && (
          <div style={{ marginTop: 12, padding: 8, background: '#f6f6f6', borderRadius: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              提示：发放失败记录不包含 Assignee ID 与操作人，请核查错误码后使用「重试发放」。
            </Text>
          </div>
        )}
      </div>
    ),
  });
}

function confirmAction(action: string, record: FreeBetGrantRecord) {
  if (action === '同步状态') {
    message.success(`已对 ${record.playerAccount} 发起 BTi 状态同步`);
    return;
  }

  const configMap: Record<string, { title: string; content: string; onOkMessage: string }> = {
    '取消': {
      title: '确认取消 FreeBet',
      content: `确定取消会员 ${record.playerAccount} 的 FreeBet（${formatCurrency(record.rewardAmount)}）？此操作将向 BTi 发起取消请求。`,
      onOkMessage: `已对 ${record.playerAccount} 发起 FreeBet 取消`,
    },
    '重试发放': {
      title: '确认重试发放',
      content: `确定对会员 ${record.playerAccount} 重新发放 FreeBet（${formatCurrency(record.rewardAmount)}）？`,
      onOkMessage: `已对 ${record.playerAccount} 发起重试发放`,
    },
  };

  const config = configMap[action];
  if (!config) return;

  Modal.confirm({
    title: config.title,
    icon: <ExclamationCircleOutlined />,
    content: config.content,
    okText: '确定',
    cancelText: '取消',
    onOk: () => message.success(config.onOkMessage),
  });
}

export default function FreeBetCampaignPage() {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [drawerRecord, setDrawerRecord] = useState<FreeBetGrantRecord | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [editingConfigKey, setEditingConfigKey] = useState<number | null>(null);
  const [configData, setConfigData] = useState<FreeBetRewardConfig[]>(freeBetRewardConfigs);
  const [editForm] = Form.useForm();

  const filteredGrants = useMemo(() => {
    return freeBetGrantRecords.filter((item) => {
      if (filters.uid && !item.uid.toLowerCase().includes(filters.uid.toLowerCase())) return false;
      if (filters.playerAccount && !item.playerAccount.toLowerCase().includes(filters.playerAccount.toLowerCase())) return false;
      if (filters.phone && !item.phone.includes(filters.phone)) return false;
      if (filters.assigneeId && !String(item.assigneeId).includes(String(filters.assigneeId))) return false;
      if (filters.vipLevelAtSettlement && item.vipLevelAtSettlement !== filters.vipLevelAtSettlement) return false;
      if (filters.grantStatus && item.grantStatus !== filters.grantStatus) return false;
      if (filters.btiStatusCode !== undefined && filters.btiStatusCode !== null && item.btiStatusCode !== filters.btiStatusCode) return false;
      return true;
    });
  }, [filters]);

  const stats = useMemo(() => {
    const success = filteredGrants.filter((i) => i.grantStatus === 'success').length;
    const active = filteredGrants.filter((i) => i.btiStatusCode === 1).length;
    const used = filteredGrants.filter((i) => i.btiStatusCode === 2).length;
    const failed = filteredGrants.filter((i) => i.grantStatus === 'failed').length;
    const warning = filteredGrants.filter((i) => i.grantStatus === 'warning' || i.btiStatusCode === 7).length;
    const totalAmount = filteredGrants
      .filter((i) => i.grantStatus === 'success')
      .reduce((sum, i) => sum + i.rewardAmount, 0);
    const usageRate = success > 0 ? Math.round((used / success) * 100) : 0;

    return { total: filteredGrants.length, success, active, used, failed, warning, totalAmount, usageRate };
  }, [filteredGrants]);

  const handleBatchSync = () => {
    message.success(`已对 ${selectedRowKeys.length} 笔记录发起 BTi 状态同步`);
    setSelectedRowKeys([]);
  };


  const handleConfigEdit = (record: FreeBetRewardConfig) => {
    setEditingConfigKey(record.key);
    editForm.setFieldsValue({
      bonusId: record.bonusId,
      rewardAmount: record.rewardAmount,
    });
  };

  const handleConfigSave = (key: number) => {
    const values = editForm.getFieldsValue();
    const now = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Manila' }).replace('T', ' ');
    setConfigData((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, ...values, lastUpdatedBy: 'current_admin', lastUpdatedAt: now }
          : item
      )
    );
    setEditingConfigKey(null);
    message.success('配置已更新');
  };

  const configColumns: ColumnsType<FreeBetRewardConfig> = [
    {
      title: 'VIP 等级',
      dataIndex: 'vipLevel',
      width: 90,
      render: (value) => <Tag color="blue">VIP{value}</Tag>,
    },
    {
      title: 'Bonus ID',
      dataIndex: 'bonusId',
      width: 120,
      render: (value, record) => {
        if (editingConfigKey === record.key) {
          return <Form.Item name="bonusId" style={{ margin: 0 }}><InputNumber data-e2e-id={`freebet-campaign-config-table-bonus-id-input-${record.key}`} style={{ width: 100 }} /></Form.Item>;
        }
        return <Text code>{value}</Text>;
      },
    },
    {
      title: 'FreeBet 金额',
      dataIndex: 'rewardAmount',
      width: 130,
      render: (value, record) => {
        if (editingConfigKey === record.key) {
          return <Form.Item name="rewardAmount" style={{ margin: 0 }}><InputNumber data-e2e-id={`freebet-campaign-config-table-reward-amount-input-${record.key}`} style={{ width: 110 }} prefix="₱" /></Form.Item>;
        }
        return <Text strong>{formatCurrency(value)}</Text>;
      },
    },
    {
      title: '最后更新人',
      dataIndex: 'lastUpdatedBy',
      width: 140,
      render: (value) => <Text type="secondary">{value}</Text>,
    },
    {
      title: '最后更新时间',
      dataIndex: 'lastUpdatedAt',
      width: 170,
      render: (value) => <Text type="secondary">{value}</Text>,
    },
    {
      title: '操作',
      width: 100,
      render: (_, record) => {
        if (editingConfigKey === record.key) {
          return (
            <Space size={4}>
              <Button data-e2e-id={`freebet-campaign-config-table-cancel-btn-${record.key}`} type="link" size="small" onClick={() => setEditingConfigKey(null)}>取消</Button>
              <Button data-e2e-id={`freebet-campaign-config-table-save-btn-${record.key}`} type="link" size="small" icon={<SaveOutlined />} onClick={() => handleConfigSave(record.key)}>保存</Button>
            </Space>
          );
        }
        return <Button data-e2e-id={`freebet-campaign-config-table-edit-btn-${record.key}`} type="link" size="small" icon={<EditOutlined />} onClick={() => handleConfigEdit(record)}>编辑</Button>;
      },
    },
  ];

  const handleMemberClick = (record: FreeBetGrantRecord) => {
    message.info(`跳转至会员详情页：${record.uid} / ${record.playerAccount}（后续文件提供）`);
  };

  const grantColumns: ColumnsType<FreeBetGrantRecord> = [
    {
      title: 'UID',
      dataIndex: 'uid',
      width: 100,
      fixed: 'left',
      render: (value, record) => (
        <a style={{ color: '#1668dc' }} onClick={() => handleMemberClick(record)}>{value}</a>
      ),
    },
    {
      title: '会员账号',
      dataIndex: 'playerAccount',
      width: 140,
      fixed: 'left',
      render: (value, record) => (
        <a style={{ color: '#1668dc' }} onClick={() => handleMemberClick(record)}>{value}</a>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 130,
      render: (value, record) => (
        <a style={{ color: '#1668dc' }} onClick={() => handleMemberClick(record)}>{formatPhone(value)}</a>
      ),
    },
    {
      title: 'VIP',
      dataIndex: 'vipLevelAtSettlement',
      width: 80,
      render: (value) => <Tag color="purple">V{value}</Tag>,
    },
    {
      title: '触发注单号',
      dataIndex: 'triggerBetId',
      width: 150,
      render: (value) => <Text code>{value}</Text>,
    },
    {
      title: '应发金额',
      dataIndex: 'rewardAmount',
      width: 110,
      sorter: (a, b) => a.rewardAmount - b.rewardAmount,
      render: (value) => <Text strong>{formatCurrency(value)}</Text>,
    },
    {
      title: '发放状态',
      dataIndex: 'grantStatus',
      width: 100,
      filters: [
        { text: '成功', value: 'success' },
        { text: '警告', value: 'warning' },
        { text: '失败', value: 'failed' },
      ],
      onFilter: (value, record) => record.grantStatus === value,
      render: (value: FreeBetGrantRecord['grantStatus'], record) => {
        if (value === 'success') {
          return <Tag color="success">成功</Tag>;
        }
        // warning / failed 可点击展开 error message
        const label = value === 'warning' ? '警告' : '失败';
        const color = value === 'warning' ? 'warning' : 'error';
        return (
          <Tag
            color={color}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => showErrorMessage(record)}
          >
            {label} <InfoCircleOutlined style={{ fontSize: 10, marginLeft: 2 }} />
          </Tag>
        );
      },
    },
    {
      title: (
        <Tooltip title="状态未即时同步，需手动同步状态">
          BTi 状态 <InfoCircleOutlined style={{ fontSize: 12 }} />
        </Tooltip>
      ),
      dataIndex: 'btiStatusCode',
      width: 120,
      filters: Object.entries(BTI_STATUS_MAP).map(([code, info]) => ({
        text: info.label,
        value: Number(code),
      })),
      onFilter: (value, record) => record.btiStatusCode === value,
      render: (value: number | null) => {
        if (value === null) return <Text type="secondary">—</Text>;
        const info = BTI_STATUS_MAP[value];
        return info ? <Tag color={info.color}>{info.label}</Tag> : <Tag>{value}</Tag>;
      },
    },
    {
      title: 'Assignee ID',
      dataIndex: 'assigneeId',
      width: 110,
      render: (value, record) => {
        if (record.grantStatus === 'failed' || value === null || value === undefined) {
          return <Text type="secondary">—</Text>;
        }
        return <Text code>{value}</Text>;
      },
    },
    {
      title: '发放时间',
      dataIndex: 'grantedAt',
      width: 170,
      sorter: (a, b) => (a.grantedAt ?? '').localeCompare(b.grantedAt ?? ''),
      render: (value) => value || <Text type="secondary">—</Text>,
    },
    {
      title: '使用时间',
      dataIndex: 'usedAt',
      width: 170,
      render: (value) => value || <Text type="secondary">—</Text>,
    },
    {
      title: '到期时间',
      dataIndex: 'activeTill',
      width: 170,
      render: (value) => value || <Text type="secondary">—</Text>,
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      width: 180,
      render: (value: string | null, record) => {
        if (record.grantStatus === 'failed' || !value) {
          return <Text type="secondary">—</Text>;
        }
        return value;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => {
        const actions = getAvailableActions(record);
        if (actions.length === 0) return <Text type="secondary">—</Text>;
        return (
          <Space size={4} wrap>
            {actions.map((action) => (
              <Button
                data-e2e-id={`freebet-campaign-table-action-btn-${getActionKey(action)}-${record.id}`}
                key={action}
                type="link"
                size="small"
                style={{ padding: '0 4px' }}
                danger={action === '取消'}
                onClick={() => confirmAction(action, record)}
              >
                {action}
              </Button>
            ))}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>世界杯冠军 FreeBet 发放记录</Title>
        <Text type="secondary">活动期间：2026/05 ~ 2026/06/10 | Bonus ID: 9776</Text>
      </div>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" style={{ gap: 8, flexWrap: 'wrap', rowGap: 8 }}>
          <Form.Item name="uid" label="UID">
            <Input data-e2e-id="freebet-campaign-filter-uid-input" placeholder="输入 UID" allowClear style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="playerAccount" label="会员账号">
            <Input data-e2e-id="freebet-campaign-filter-player-account-input" placeholder="输入账号" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input data-e2e-id="freebet-campaign-filter-phone-input" placeholder="输入手机号" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="assigneeId" label="Assignee ID">
            <Input data-e2e-id="freebet-campaign-filter-assignee-id-input" placeholder="输入 ID" allowClear style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="vipLevelAtSettlement" label="VIP 等级">
            <Select data-e2e-id="freebet-campaign-filter-vip-level-select" placeholder="全部" allowClear style={{ width: 100 }}>
              {Array.from({ length: 30 }, (_, i) => (
                <Select.Option key={i + 1} value={i + 1}>VIP{i + 1}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="grantStatus" label="发放状态">
            <Select data-e2e-id="freebet-campaign-filter-grant-status-select" placeholder="全部" allowClear style={{ width: 100 }}>
              <Select.Option value="success">成功</Select.Option>
              <Select.Option value="warning">警告</Select.Option>
              <Select.Option value="failed">失败</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="btiStatusCode" label="BTi 状态">
            <Select data-e2e-id="freebet-campaign-filter-bti-status-select" placeholder="全部" allowClear style={{ width: 140 }}>
              {Object.entries(BTI_STATUS_MAP).map(([code, info]) => (
                <Select.Option key={code} value={Number(code)}>{info.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="发放时间">
            <RangePicker data-e2e-id="freebet-campaign-filter-date-range" style={{ width: 240 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button data-e2e-id="freebet-campaign-filter-query-btn" type="primary" icon={<SearchOutlined />} onClick={() => setFilters(form.getFieldsValue())}>查询</Button>
              <Button data-e2e-id="freebet-campaign-filter-reset-btn" icon={<ReloadOutlined />} onClick={() => { form.resetFields(); setFilters({}); }}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Stats Cards */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card size="small"><Statistic title="总记录" value={stats.total} /></Card>
        </Col>
        <Col span={4}>
          <Card size="small"><Statistic title="发放成功" value={stats.success} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="待处理"
              value={stats.failed + stats.warning}
              valueStyle={{ color: stats.failed + stats.warning > 0 ? '#ff4d4f' : undefined }}
              suffix={stats.failed > 0 ? <Badge count={`${stats.failed} 失败`} style={{ backgroundColor: '#ff4d4f', marginLeft: 8 }} /> : null}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small"><Statistic title="已使用" value={stats.used} valueStyle={{ color: '#1668dc' }} /></Card>
        </Col>
        <Col span={4}>
          <Card size="small"><Statistic title="使用率" value={stats.usageRate} suffix="%" /></Card>
        </Col>
        <Col span={4}>
          <Card size="small"><Statistic title="总发放金额" value={stats.totalAmount} prefix="₱" /></Card>
        </Col>
      </Row>

      {/* Action Buttons */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button data-e2e-id="freebet-campaign-toolbar-config-btn" icon={<SettingOutlined />} onClick={() => setConfigModalOpen(true)}>奖励配置</Button>
        <Button data-e2e-id="freebet-campaign-toolbar-export-btn" icon={<DownloadOutlined />}>导出</Button>
      </div>

      {/* Batch Actions + Table */}
      <Card
        size="small"
        title={
          selectedRowKeys.length > 0 ? (
            <Space>
              <Text>已选 {selectedRowKeys.length} 笔</Text>
              <Button data-e2e-id="freebet-campaign-toolbar-batch-sync-btn" size="small" icon={<SyncOutlined />} onClick={handleBatchSync}>批次同步状态</Button>
              <Button data-e2e-id="freebet-campaign-toolbar-clear-selection-btn" size="small" icon={<CloseCircleOutlined />} onClick={() => setSelectedRowKeys([])}>取消选择</Button>
            </Space>
          ) : null
        }
      >
        <Table
          columns={grantColumns}
          dataSource={filteredGrants}
          rowKey="id"
          onRow={(record) => ({ 'data-e2e-id': `freebet-campaign-table-row-${record.id}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          size="small"
          scroll={{ x: 2200 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{ pageSize: 20, showTotal: (total) => `共 ${total} 笔`, showSizeChanger: true }}
        />
      </Card>

      {/* Config Modal */}
      <Modal
        title="VIP 等级奖励配置表"
        open={configModalOpen}
        onCancel={() => { setConfigModalOpen(false); setEditingConfigKey(null); }}
        footer={null}
        width={860}
      >
        <div data-e2e-id="freebet-campaign-config-modal">
          <Form form={editForm} component={false}>
            <Table
              columns={configColumns}
              dataSource={configData}
              rowKey="key"
              onRow={(record) => ({ 'data-e2e-id': `freebet-campaign-config-table-row-${record.key}` } as React.HTMLAttributes<HTMLTableRowElement>)}
              size="small"
              pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 笔` }}
            />
          </Form>
        </div>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title="发放详情"
        placement="right"
        width={520}
        open={!!drawerRecord}
        onClose={() => setDrawerRecord(null)}
        extra={
          drawerRecord && (
            <Button
              data-e2e-id="freebet-campaign-drawer-sync-bti-btn"
              type="primary"
              size="small"
              icon={<SyncOutlined />}
              onClick={() => message.success('已同步 BTi 状态')}
            >
              同步 BTi
            </Button>
          )
        }
      >
        {drawerRecord && (
          <div data-e2e-id="freebet-campaign-drawer">
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="发放单号">{drawerRecord.id}</Descriptions.Item>
              <Descriptions.Item label="UID">
                <Text code>{drawerRecord.uid}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="会员账号">
                <Text strong>{drawerRecord.playerAccount}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="手机号">{formatPhone(drawerRecord.phone)}</Descriptions.Item>
              <Descriptions.Item label="结算时 VIP">
                <Tag color="purple">VIP{drawerRecord.vipLevelAtSettlement}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="触发注单号">
                <Text code>{drawerRecord.triggerBetId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="应发金额">
                <Text strong>{formatCurrency(drawerRecord.rewardAmount)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Bonus ID">
                <Text code>{drawerRecord.bonusId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Assignee ID">
                {drawerRecord.grantStatus === 'failed' || drawerRecord.assigneeId === null ? (
                  <Text type="secondary">—</Text>
                ) : (
                  <Text code>{drawerRecord.assigneeId}</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="BTi 状态">
                {drawerRecord.btiStatusCode !== null ? (
                  <Tag color={BTI_STATUS_MAP[drawerRecord.btiStatusCode]?.color}>
                    {BTI_STATUS_MAP[drawerRecord.btiStatusCode]?.label}
                  </Tag>
                ) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="发放状态">
                {drawerRecord.grantStatus === 'success' ? (
                  <Tag color="success">成功</Tag>
                ) : (
                  <Space>
                    <Tag color={drawerRecord.grantStatus === 'warning' ? 'warning' : 'error'}>
                      {drawerRecord.grantStatus === 'warning' ? '警告' : '失败'}
                    </Tag>
                    <Button
                      data-e2e-id={`freebet-campaign-drawer-error-info-btn-${drawerRecord.id}`}
                      size="small"
                      type="link"
                      style={{ padding: 0, height: 'auto' }}
                      icon={<InfoCircleOutlined />}
                      onClick={() => showErrorMessage(drawerRecord)}
                    >
                      查看错误信息
                    </Button>
                  </Space>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="触发结算时间">{drawerRecord.triggerSettledAt}</Descriptions.Item>
              <Descriptions.Item label="发放时间">{drawerRecord.grantedAt ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="使用时间">{drawerRecord.usedAt ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="到期时间">{drawerRecord.activeTill ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="最后同步时间">{drawerRecord.lastSyncAt ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="操作人">
                {drawerRecord.grantStatus === 'failed' || !drawerRecord.operator ? (
                  <Text type="secondary">—</Text>
                ) : (
                  drawerRecord.operator
                )}
              </Descriptions.Item>
              <Descriptions.Item label="备注">{drawerRecord.remark}</Descriptions.Item>
            </Descriptions>

            <div>
              <Text strong style={{ display: 'block', marginBottom: 12 }}>操作日志</Text>
              <Timeline
                items={[
                  {
                    color: 'green',
                    children: `${drawerRecord.triggerSettledAt} — 注单结算触发资格判定`,
                  },
                  ...(drawerRecord.grantedAt ? [{
                    color: drawerRecord.grantStatus === 'failed' ? 'red' as const : 'green' as const,
                    children: `${drawerRecord.grantedAt} — ${drawerRecord.operator ?? 'system'} 发起 BTi Assign Bonus (bonusId: ${drawerRecord.bonusId})`,
                  }] : []),
                  ...(drawerRecord.grantStatus === 'failed' ? [{
                    color: 'red' as const,
                    children: (
                      <Space>
                        <Text>{drawerRecord.errorAt ?? ''} — BTi 返回错误，发放失败</Text>
                        <Button
                          data-e2e-id={`freebet-campaign-drawer-timeline-error-detail-btn-${drawerRecord.id}`}
                          size="small"
                          type="link"
                          style={{ padding: 0, height: 'auto' }}
                          onClick={() => showErrorMessage(drawerRecord)}
                        >
                          查看详情
                        </Button>
                      </Space>
                    ),
                  }] : []),
                  ...(drawerRecord.grantStatus === 'warning' ? [{
                    color: 'orange' as const,
                    children: `BTi 返回 warning，assigneeId: ${drawerRecord.assigneeId}，等待 active`,
                  }] : []),
                  ...(drawerRecord.usedAt ? [{
                    color: 'blue' as const,
                    children: `${drawerRecord.usedAt} — 用户使用 FreeBet 投注`,
                  }] : []),
                  ...(drawerRecord.lastSyncAt ? [{
                    color: 'gray' as const,
                    children: `${drawerRecord.lastSyncAt} — 最后同步 BTi 状态`,
                  }] : []),
                ]}
              />
            </div>

            <Space>
              {getAvailableActions(drawerRecord).map((action) => (
                <Button data-e2e-id={`freebet-campaign-drawer-action-btn-${getActionKey(action)}-${drawerRecord.id}`} key={action} danger={action === '取消'} onClick={() => confirmAction(action, drawerRecord)}>{action}</Button>
              ))}
            </Space>
          </Space>
          </div>
        )}
      </Drawer>
    </div>
  );
}

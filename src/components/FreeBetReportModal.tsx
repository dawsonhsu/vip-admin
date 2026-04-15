'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import {
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
  Descriptions,
} from 'antd';
import {
  CloseCircleOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  freeBetGrantRecords,
  type FreeBetGrantRecord,
} from '@/data/freeBetActivityData';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const formatCurrency = (value: number) =>
  `₱${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

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

function confirmAction(action: string, record: FreeBetGrantRecord) {
  if (action === '同步状态') {
    message.success(`已对 ${record.playerAccount} 发起 BTi 状态同步`);
    return;
  }
  const configMap: Record<string, { title: string; content: string; onOkMessage: string }> = {
    取消: {
      title: '确认取消 FreeBet',
      content: `确定取消会员 ${record.playerAccount} 的 FreeBet（${formatCurrency(record.rewardAmount)}）？此操作将向 BTi 发起取消请求。`,
      onOkMessage: `已对 ${record.playerAccount} 发起 FreeBet 取消`,
    },
    重试发放: {
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
            {record.playerAccount}{' '}
            <Text type="secondary">（UID: {record.uid}）</Text>
          </Descriptions.Item>
          <Descriptions.Item label="错误码">
            <Text code style={{ color }}>
              {record.errorCode ?? '—'}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="发生时间">
            {record.errorAt ?? '—'}
          </Descriptions.Item>
          <Descriptions.Item label="BTi 状态">
            {record.btiStatusCode !== null ? (
              <Tag color={BTI_STATUS_MAP[record.btiStatusCode]?.color}>
                {BTI_STATUS_MAP[record.btiStatusCode]?.label}
              </Tag>
            ) : (
              <Text type="secondary">—</Text>
            )}
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
          <Text strong style={{ color, display: 'block', marginBottom: 6 }}>
            错误信息
          </Text>
          <Text style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {record.errorMessage ?? '未获取到错误信息，请查看 BTi 同步日志。'}
          </Text>
        </div>
        {isFailed && (
          <div
            style={{
              marginTop: 12,
              padding: 8,
              background: '#f6f6f6',
              borderRadius: 4,
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              提示：发放失败记录不包含 Assignee ID 与操作人，请核查错误码后使用「重试发放」。
            </Text>
          </div>
        )}
      </div>
    ),
  });
}

interface FreeBetReportModalProps {
  open: boolean;
  onClose: () => void;
}

// 取得今日日期范围 [今日 00:00:00, 今日 23:59:59]
const getTodayRange = (): [Dayjs, Dayjs] => [
  dayjs().startOf('day'),
  dayjs().endOf('day'),
];

export default function FreeBetReportModal({
  open,
  onClose,
}: FreeBetReportModalProps) {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({ dateRange: getTodayRange() });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 首次打开或重新打开时，重置为今日查询
  useEffect(() => {
    if (open) {
      const today = getTodayRange();
      form.setFieldsValue({ dateRange: today });
      setFilters({ dateRange: today });
    }
  }, [open, form]);

  const filteredGrants = useMemo(() => {
    return freeBetGrantRecords.filter((item) => {
      if (filters.uid && !item.uid.toLowerCase().includes(filters.uid.toLowerCase()))
        return false;
      if (
        filters.playerAccount &&
        !item.playerAccount.toLowerCase().includes(filters.playerAccount.toLowerCase())
      )
        return false;
      if (filters.phone && !item.phone.includes(filters.phone)) return false;
      if (
        filters.vipLevelAtSettlement &&
        item.vipLevelAtSettlement !== filters.vipLevelAtSettlement
      )
        return false;
      if (filters.grantStatus && item.grantStatus !== filters.grantStatus) return false;
      if (
        filters.btiStatusCode !== undefined &&
        filters.btiStatusCode !== null &&
        item.btiStatusCode !== filters.btiStatusCode
      )
        return false;
      if (
        filters.dateRange &&
        Array.isArray(filters.dateRange) &&
        filters.dateRange.length === 2 &&
        filters.dateRange[0] &&
        filters.dateRange[1]
      ) {
        const [start, end] = filters.dateRange as [Dayjs, Dayjs];
        const granted = item.grantedAt;
        if (!granted) return false;
        const g = dayjs(granted);
        if (g.isBefore(start) || g.isAfter(end)) return false;
      }
      return true;
    });
  }, [filters]);

  const stats = useMemo(() => {
    // 警告也视为发放成功（BTi 已接收，仅待激活）
    const successful = filteredGrants.filter(
      (i) => i.grantStatus === 'success' || i.grantStatus === 'warning'
    );
    const success = successful.length;
    // 可使用：BTi 状态码 = 1
    const available = filteredGrants.filter((i) => i.btiStatusCode === 1).length;
    // 已使用：BTi 状态码 = 2
    const used = filteredGrants.filter((i) => i.btiStatusCode === 2).length;
    const failed = filteredGrants.filter((i) => i.grantStatus === 'failed').length;
    const totalAmount = successful.reduce((sum, i) => sum + i.rewardAmount, 0);
    const usageRate = success > 0 ? Math.round((used / success) * 100) : 0;

    return { total: filteredGrants.length, success, available, used, failed, totalAmount, usageRate };
  }, [filteredGrants]);

  const grantColumns: ColumnsType<FreeBetGrantRecord> = [
    {
      title: 'UID',
      dataIndex: 'uid',
      width: 100,
      fixed: 'left',
      render: (value) => <a style={{ color: '#1668dc' }}>{value}</a>,
    },
    {
      title: '会员账号',
      dataIndex: 'playerAccount',
      width: 140,
      fixed: 'left',
      render: (value) => <a style={{ color: '#1668dc' }}>{value}</a>,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 130,
      render: (value) => <Text>{formatPhone(value)}</Text>,
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
        if (value === 'success') return <Tag color="success">成功</Tag>;
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
        if (
          record.grantStatus === 'failed' ||
          value === null ||
          value === undefined
        ) {
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
      width: 180,
      fixed: 'right',
      render: (_, record) => {
        const actions = getAvailableActions(record);
        if (actions.length === 0) return <Text type="secondary">—</Text>;
        return (
          <Space size={4} wrap>
            {actions.map((action) => (
              <Button
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

  const handleBatchSync = () => {
    message.success(`已对 ${selectedRowKeys.length} 笔记录发起 BTi 状态同步`);
    setSelectedRowKeys([]);
  };

  return (
    <Modal
      title="世界杯冠军 FreeBet - 发放报表"
      open={open}
      onCancel={onClose}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button onClick={onClose}>关闭</Button>
        </div>
      }
      width="94%"
      style={{ top: 20 }}
      styles={{ body: { maxHeight: '78vh', overflowY: 'auto', padding: 16 } }}
    >
      {/* Filters */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <Form form={form} layout="inline" style={{ gap: 8, rowGap: 8, flexWrap: 'wrap' }}>
          <Form.Item name="uid" label="UID">
            <Input placeholder="输入 UID" allowClear style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="playerAccount" label="会员账号">
            <Input placeholder="输入账号" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="输入手机号" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="vipLevelAtSettlement" label="VIP">
            <Select placeholder="全部" allowClear style={{ width: 100 }}>
              {Array.from({ length: 30 }, (_, i) => (
                <Select.Option key={i + 1} value={i + 1}>
                  VIP{i + 1}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="grantStatus" label="发放状态">
            <Select placeholder="全部" allowClear style={{ width: 100 }}>
              <Select.Option value="success">成功</Select.Option>
              <Select.Option value="warning">警告</Select.Option>
              <Select.Option value="failed">失败</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="btiStatusCode" label="BTi 状态">
            <Select placeholder="全部" allowClear style={{ width: 140 }}>
              {Object.entries(BTI_STATUS_MAP).map(([code, info]) => (
                <Select.Option key={code} value={Number(code)}>
                  {info.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="发放时间">
            <RangePicker style={{ width: 240 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => setFilters(form.getFieldsValue())}
              >
                查询
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  const today = getTodayRange();
                  form.resetFields();
                  form.setFieldsValue({ dateRange: today });
                  setFilters({ dateRange: today });
                }}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Stats */}
      <Row gutter={8} style={{ marginBottom: 12 }}>
        <Col span={6}>
          <Card size="small">
            <Tooltip title="包含 BTi 返回 success 与 warning 的记录">
              <Statistic
                title="发放成功"
                value={stats.success}
                valueStyle={{ color: '#52c41a' }}
              />
            </Tooltip>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="发放失败"
              value={stats.failed}
              valueStyle={{ color: stats.failed > 0 ? '#ff4d4f' : undefined }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Tooltip title="使用率 = 已使用笔数 / 发放成功笔数（BTi 状态码 = 2 / grantStatus ∈ {success, warning}）">
              <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>
                使用率
              </div>
              <Space size={6} align="baseline">
                <span style={{ fontSize: 24, fontWeight: 500, color: '#1668dc' }}>
                  {stats.used}
                </span>
                <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)' }}>笔</span>
                <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)' }}>/</span>
                <span style={{ fontSize: 20, fontWeight: 500, color: '#1668dc' }}>
                  {stats.usageRate}%
                </span>
              </Space>
            </Tooltip>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="总发放金额" value={stats.totalAmount} prefix="₱" />
          </Card>
        </Col>
      </Row>

      {/* Action bar: 导出 */}
      <div
        style={{
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
        }}
      >
        <Button icon={<DownloadOutlined />}>导出</Button>
      </div>

      {/* Table */}
      <Card
        size="small"
        title={
          selectedRowKeys.length > 0 ? (
            <Space>
              <Text>已选 {selectedRowKeys.length} 笔</Text>
              <Button
                size="small"
                icon={<SyncOutlined />}
                onClick={handleBatchSync}
              >
                批次同步状态
              </Button>
              <Button
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => setSelectedRowKeys([])}
              >
                取消选择
              </Button>
            </Space>
          ) : null
        }
      >
        <Table
          columns={grantColumns}
          dataSource={filteredGrants}
          rowKey="id"
          size="small"
          scroll={{ x: 2380 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `共 ${total} 笔`,
            showSizeChanger: true,
          }}
        />
      </Card>
    </Modal>
  );
}

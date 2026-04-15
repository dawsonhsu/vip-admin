'use client';

import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  DownloadOutlined,
  EditOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  activeActivities,
  inactiveActivities,
  vipTasks,
  activityTypes,
  updaters,
  type ActivityRecord,
  type VipTaskRecord,
} from '@/data/activityListData';
import FreeBetConfigModal from '@/components/FreeBetConfigModal';
import FreeBetReportModal from '@/components/FreeBetReportModal';

// 识别哪些活动是 FreeBet 类型（可拆独立配置 + 报表）
const FREEBET_ACTIVITY_IDS = new Set<number>([29]);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const statusTag = (status: '进行中' | '关闭') =>
  status === '进行中' ? (
    <Tag color="success">进行中</Tag>
  ) : (
    <Tag color="default">关闭</Tag>
  );

function ActivityTable({ data }: { data: ActivityRecord[] }) {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [freebetConfigOpen, setFreebetConfigOpen] = useState(false);
  const [freebetReportOpen, setFreebetReportOpen] = useState(false);

  const handleEditConfig = (record: ActivityRecord) => {
    if (FREEBET_ACTIVITY_IDS.has(record.id)) {
      setFreebetConfigOpen(true);
      return;
    }
    message.info(`编辑活动 #${record.id}: ${record.name}`);
  };

  const handleViewReport = (record: ActivityRecord) => {
    if (FREEBET_ACTIVITY_IDS.has(record.id)) {
      setFreebetReportOpen(true);
      return;
    }
    message.info(`查看报表 #${record.id}: ${record.name}`);
  };

  const reportLinks = (value: string, record: ActivityRecord) => {
    if (value === '-') return <Text type="secondary">—</Text>;
    return (
      <Space size={4} split={<Text type="secondary">|</Text>}>
        {value.split('|').map((v) => (
          <a key={v} onClick={() => handleViewReport(record)}>
            {v.trim()}
          </a>
        ))}
      </Space>
    );
  };

  const filtered = useMemo(() => {
    return data.filter((item) => {
      if (filters.id && !String(item.id).includes(String(filters.id))) return false;
      if (filters.updatedBy && item.updatedBy !== filters.updatedBy) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.type && item.type !== filters.type) return false;
      return true;
    });
  }, [data, filters]);

  const columns: ColumnsType<ActivityRecord> = [
    {
      title: '活动ID',
      dataIndex: 'id',
      width: 80,
      fixed: 'left',
      sorter: (a, b) => a.id - b.id,
      render: (value) => <Text strong>{value}</Text>,
    },
    { title: '活动类型', dataIndex: 'type', width: 170 },
    {
      title: '活动名称',
      dataIndex: 'name',
      width: 260,
      render: (value) => (
        <Space>
          <Text>{value}</Text>
          <Tooltip title="复制名称">
            <Button
              type="text"
              size="small"
              icon={<span style={{ fontSize: 12 }}>📋</span>}
              onClick={() => {
                navigator.clipboard.writeText(value);
                message.success('已复制');
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '活动状态',
      dataIndex: 'status',
      width: 100,
      render: statusTag,
    },
    {
      title: '活动介绍页EN',
      dataIndex: 'introEN',
      width: 150,
      render: (value) =>
        value === '-' ? (
          <Text type="secondary">—</Text>
        ) : (
          <a href={value} target="_blank" rel="noopener noreferrer">
            {value.length > 20 ? value.substring(0, 20) + '…' : value}
          </a>
        ),
    },
    {
      title: '活动介绍页TA',
      dataIndex: 'introTA',
      width: 150,
      render: (value) =>
        value === '-' ? (
          <Text type="secondary">—</Text>
        ) : (
          <a href={value} target="_blank" rel="noopener noreferrer">
            {value.length > 20 ? value.substring(0, 20) + '…' : value}
          </a>
        ),
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      width: 160,
      sorter: (a, b) => a.startTime.localeCompare(b.startTime),
    },
    { title: '结束时间', dataIndex: 'endTime', width: 160 },
    {
      title: '活动循环周期',
      dataIndex: 'cycle',
      width: 110,
      render: (value) =>
        value === '-' ? <Text type="secondary">—</Text> : <Tag>{value}</Tag>,
    },
    {
      title: '结算周期',
      dataIndex: 'settleCycle',
      width: 100,
      render: (value) =>
        value === '-' ? <Text type="secondary">—</Text> : <Tag color="blue">{value}</Tag>,
    },
    {
      title: '实时报表',
      dataIndex: 'report',
      width: 180,
      render: (value, record) => reportLinks(value, record),
    },
    {
      title: '预算上限',
      dataIndex: 'budgetLimit',
      width: 130,
      render: (value) =>
        value === '-' ? <Text type="secondary">—</Text> : <Text strong>{value}</Text>,
    },
    {
      title: '当期实发',
      dataIndex: 'currentPaid',
      width: 140,
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 170,
      sorter: (a, b) => a.updatedAt.localeCompare(b.updatedAt),
    },
    { title: '更新人', dataIndex: 'updatedBy', width: 180 },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0} split={<span style={{ color: '#d9d9d9' }}>|</span>}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditConfig(record)}
          >
            编辑配置
          </Button>
          {FREEBET_ACTIVITY_IDS.has(record.id) && (
            <Button
              type="link"
              size="small"
              icon={<BarChartOutlined />}
              onClick={() => handleViewReport(record)}
            >
              查看报表
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" style={{ gap: 8, flexWrap: 'wrap', rowGap: 8 }}>
          <Form.Item name="id" label="活动ID">
            <Input placeholder="请输入" allowClear style={{ width: 130 }} />
          </Form.Item>
          <Form.Item name="updatedBy" label="更新人">
            <Select placeholder="请选择更新人" allowClear style={{ width: 200 }}>
              {updaters.map((u) => (
                <Select.Option key={u} value={u}>
                  {u}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="活动状态">
            <Select placeholder="请选择" allowClear style={{ width: 120 }}>
              <Select.Option value="进行中">进行中</Select.Option>
              <Select.Option value="关闭">关闭</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="type" label="活动类型">
            <Select placeholder="请选择" allowClear style={{ width: 180 }}>
              {activityTypes.map((t) => (
                <Select.Option key={t} value={t}>
                  {t}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="更新时间">
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
                  form.resetFields();
                  setFilters({});
                }}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <div
        style={{
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
        }}
      >
        <Button icon={<DownloadOutlined />}>导出</Button>
        <Button icon={<ReloadOutlined />} />
        <Button icon={<SettingOutlined />} />
      </div>

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="key"
        size="small"
        scroll={{ x: 2300 }}
        pagination={{
          pageSize: 20,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
      />
      <FreeBetConfigModal
        open={freebetConfigOpen}
        onClose={() => setFreebetConfigOpen(false)}
      />
      <FreeBetReportModal
        open={freebetReportOpen}
        onClose={() => setFreebetReportOpen(false)}
      />
    </>
  );
}

function VipTaskTable() {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});

  const filtered = useMemo(() => {
    return vipTasks.filter((item) => {
      if (filters.taskId && !item.taskId.includes(filters.taskId)) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.taskType && item.taskType !== filters.taskType) return false;
      if (filters.vipRange && item.vipRange !== filters.vipRange) return false;
      return true;
    });
  }, [filters]);

  const taskTypeColor = (type: string) => {
    const map: Record<string, string> = {
      新手任务: 'gold',
      日常任务: 'blue',
      周常任务: 'purple',
      成就任务: 'magenta',
    };
    return map[type] ?? 'default';
  };

  const vipRangeColor = (range: string) => {
    const map: Record<string, string> = {
      青铜: 'volcano',
      白银: 'default',
      黄金: 'gold',
    };
    return map[range] ?? 'default';
  };

  const columns: ColumnsType<VipTaskRecord> = [
    {
      title: '序号',
      dataIndex: 'seq',
      width: 60,
      fixed: 'left',
      sorter: (a, b) => a.seq - b.seq,
    },
    {
      title: '任务ID',
      dataIndex: 'taskId',
      width: 170,
      render: (value) => <Text code>{value}</Text>,
    },
    {
      title: '任务名称',
      dataIndex: 'name',
      width: 320,
      render: (value) => (
        <Tooltip title={value} placement="topLeft">
          <Text style={{ fontSize: 12 }}>{value}</Text>
        </Tooltip>
      ),
    },
    {
      title: '任务介绍',
      dataIndex: 'description',
      width: 320,
      render: (value) => (
        <Tooltip title={value} placement="topLeft">
          <Text type="secondary" style={{ fontSize: 12 }}>
            {value.length > 60 ? value.substring(0, 60) + '…' : value}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '任务状态',
      dataIndex: 'status',
      width: 90,
      render: statusTag,
    },
    { title: '任务生效时间', dataIndex: 'effectiveTime', width: 280 },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      width: 110,
      filters: [
        { text: '新手任务', value: '新手任务' },
        { text: '日常任务', value: '日常任务' },
      ],
      onFilter: (value, record) => record.taskType === value,
      render: (value) => <Tag color={taskTypeColor(value)}>{value}</Tag>,
    },
    {
      title: '归属等级区间',
      dataIndex: 'vipRange',
      width: 130,
      render: (value) =>
        value === '-' ? (
          <Text type="secondary">—</Text>
        ) : (
          <Tag color={vipRangeColor(value)}>{value}</Tag>
        ),
    },
    {
      title: '任务奖励',
      dataIndex: 'reward',
      width: 380,
      render: (value) => (
        <Tooltip title={value} placement="topLeft">
          <Text style={{ fontSize: 12, color: '#fa8c16' }}>
            {value.length > 60 ? value.substring(0, 60) + '…' : value}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '重置时间',
      dataIndex: 'resetTime',
      width: 90,
      render: (value) =>
        value === '-' ? <Text type="secondary">—</Text> : <Tag>{value}</Tag>,
    },
    { title: '更新时间', dataIndex: 'updatedAt', width: 170 },
    {
      title: '更新人',
      dataIndex: 'updatedBy',
      width: 170,
      render: (value) =>
        value === '-' ? <Text type="secondary">—</Text> : value,
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => message.info(`查看任务 ${record.taskId}`)}
        >
          查看任务配置
        </Button>
      ),
    },
    {
      title: '奖励报表明细',
      key: 'report',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => message.info(`奖励报表 ${record.taskId}`)}
        >
          查看报表
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" style={{ gap: 8, flexWrap: 'wrap', rowGap: 8 }}>
          <Form.Item name="taskId" label="任务ID">
            <Input placeholder="请输入" allowClear style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="status" label="任务状态">
            <Select placeholder="请选择" allowClear style={{ width: 120 }}>
              <Select.Option value="进行中">进行中</Select.Option>
              <Select.Option value="关闭">关闭</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="taskType" label="任务类型">
            <Select placeholder="请选择" allowClear style={{ width: 140 }}>
              <Select.Option value="新手任务">新手任务</Select.Option>
              <Select.Option value="日常任务">日常任务</Select.Option>
              <Select.Option value="周常任务">周常任务</Select.Option>
              <Select.Option value="成就任务">成就任务</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="vipRange" label="归属等级">
            <Select placeholder="请选择" allowClear style={{ width: 120 }}>
              <Select.Option value="青铜">青铜</Select.Option>
              <Select.Option value="白银">白银</Select.Option>
              <Select.Option value="黄金">黄金</Select.Option>
            </Select>
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
                  form.resetFields();
                  setFilters({});
                }}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <div
        style={{
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
        }}
      >
        <Button icon={<DownloadOutlined />}>导出</Button>
        <Button icon={<ReloadOutlined />} />
        <Button icon={<SettingOutlined />} />
      </div>

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="key"
        size="small"
        scroll={{ x: 2600 }}
        pagination={{
          pageSize: 20,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
          showSizeChanger: true,
        }}
      />
    </>
  );
}

export default function ActivityListPage() {
  const [activeTab, setActiveTab] = useState('active');

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          活动列表
        </Title>
        <Text type="secondary">
          运营管理 / 限时活动 与 VIP 任务中心（同步自 FAT 环境，共 {activeActivities.length + inactiveActivities.length} 个活动 + {vipTasks.length} 个任务）
        </Text>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'active',
            label: `限时活动（有效）· ${activeActivities.length}`,
            children: <ActivityTable data={activeActivities} />,
          },
          {
            key: 'inactive',
            label: `限时活动（失效）· ${inactiveActivities.length}`,
            children: <ActivityTable data={inactiveActivities} />,
          },
          {
            key: 'vipTask',
            label: `VIP 任务中心 · ${vipTasks.length}`,
            children: <VipTaskTable />,
          },
        ]}
      />
    </div>
  );
}

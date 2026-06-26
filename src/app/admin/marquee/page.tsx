'use client';

import React, { useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  ColumnHeightOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import MarqueeConfigModal, { type MarqueeConfigSubmitValues } from '@/components/MarqueeConfigModal';
import {
  generateMarqueeItems,
  marqueeJumpTypeOptions,
  marqueeStatusOptions,
  marqueeTypeOptions,
  type MarqueeItem,
  type MarqueeJumpType,
  type MarqueeStatus,
  type MarqueeType,
} from '@/data/marqueeData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface FilterValues {
  type?: MarqueeType | 'all';
  status?: MarqueeStatus | 'all';
  updatedRange?: [Dayjs, Dayjs];
}

const createDefaultFilters = (): FilterValues => ({
  type: 'all',
  status: 'all',
  updatedRange: undefined,
});

const typeLabelMap = marqueeTypeOptions.reduce<Record<MarqueeType, string>>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {} as Record<MarqueeType, string>);

const jumpTypeLabelMap = marqueeJumpTypeOptions.reduce<Record<MarqueeJumpType, string>>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {} as Record<MarqueeJumpType, string>);

const typeColorMap: Record<MarqueeType, string> = {
  announcement: 'blue',
  activity: 'green',
  jackpot: 'gold',
  maintenance: 'volcano',
  other: 'default',
};

export default function MarqueePage() {
  const [form] = Form.useForm<FilterValues>();
  const defaultFilters = useMemo(createDefaultFilters, []);
  const [data, setData] = useState(() => generateMarqueeItems());
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingRecord, setEditingRecord] = useState<MarqueeItem | null>(null);

  const filteredData = useMemo(() => data.filter((record) => {
    if (filters.type && filters.type !== 'all' && record.type !== filters.type) return false;
    if (filters.status && filters.status !== 'all' && record.status !== filters.status) return false;

    const updatedRange = filters.updatedRange;
    if (updatedRange?.[0] && updatedRange?.[1]) {
      const updatedAt = dayjs(record.updatedAt);
      if (updatedAt.isBefore(updatedRange[0]) || updatedAt.isAfter(updatedRange[1])) return false;
    }

    return true;
  }), [data, filters]);

  const handleQuery = () => {
    setFilters(form.getFieldsValue());
  };

  const handleReset = () => {
    const nextFilters = createDefaultFilters();
    form.setFieldsValue(nextFilters);
    setFilters(nextFilters);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingRecord(null);
    setModalOpen(true);
  };

  const openEditModal = (record: MarqueeItem) => {
    setModalMode('edit');
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleSubmit = (values: MarqueeConfigSubmitValues) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    if (modalMode === 'create') {
      setData((prev) => {
        const nextId = prev.reduce((max, item) => Math.max(max, item.id), 0) + 1;
        const nextItem: MarqueeItem = {
          ...values,
          key: `marquee-${nextId}`,
          id: nextId,
          creator: 'admin',
          updatedAt: now,
        };

        return [nextItem, ...prev];
      });
      return;
    }

    if (!editingRecord) return;

    setData((prev) => prev.map((item) => (
      item.id === editingRecord.id
        ? {
          ...item,
          ...values,
          updatedAt: now,
        }
        : item
    )));
  };

  const handleDelete = (id: number) => {
    setData((prev) => prev.filter((item) => item.id !== id));
    message.success('跑馬燈已刪除');
  };

  const handleStatusChange = (record: MarqueeItem, checked: boolean) => {
    const nextStatus: MarqueeStatus = checked ? 'enabled' : 'disabled';
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    setData((prev) => prev.map((item) => (
      item.id === record.id
        ? {
          ...item,
          status: nextStatus,
          updatedAt: now,
        }
        : item
    )));
    message.success(checked ? '跑馬燈已啟用' : '跑馬燈已停用');
  };

  const renderJump = (record: MarqueeItem) => {
    if (record.jumpType === 'none') return <Text type="secondary">—</Text>;

    return (
      <Tooltip
        title={(
          <Space direction="vertical" size={0}>
            <span>H5：{record.h5Url || '—'}</span>
            <span>APP：{record.appUrl || '—'}</span>
          </Space>
        )}
      >
        <Tag color={record.jumpType === 'internal' ? 'processing' : 'purple'}>
          {jumpTypeLabelMap[record.jumpType]}
        </Tag>
      </Tooltip>
    );
  };

  const columns: ColumnsType<MarqueeItem> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    {
      title: '內容',
      dataIndex: 'content',
      width: 300,
      ellipsis: true,
      render: (value: string) => (
        <Tooltip title={value}>
          <Text style={{ maxWidth: 280 }} ellipsis>
            {value}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '類型',
      dataIndex: 'type',
      width: 110,
      render: (value: MarqueeType) => (
        <Tag color={typeColorMap[value]}>{typeLabelMap[value]}</Tag>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'status',
      width: 90,
      render: (value: MarqueeStatus, record) => (
        <Switch
          checked={value === 'enabled'}
          checkedChildren="啟用"
          unCheckedChildren="停用"
          onChange={(checked) => handleStatusChange(record, checked)}
          data-e2e-id={`marquee-status-switch-${record.id}`}
        />
      ),
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 90,
      sorter: (a, b) => a.sort - b.sort,
      defaultSortOrder: 'descend',
    },
    {
      title: '跳轉',
      dataIndex: 'jumpType',
      width: 160,
      render: (_, record) => renderJump(record),
    },
    {
      title: '生效時間',
      width: 320,
      render: (_, record) => `${record.startTime} ~ ${record.endTime}`,
    },
    { title: '建立人', dataIndex: 'creator', width: 110 },
    { title: '更新時間', dataIndex: 'updatedAt', width: 170 },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          <Button
            type="link"
            size="small"
            onClick={() => openEditModal(record)}
            data-e2e-id={`marquee-edit-btn-${record.id}`}
          >
            編輯
          </Button>
          <Popconfirm
            title="確定刪除此跑馬燈？"
            okText="刪除"
            cancelText="取消"
            onConfirm={() => handleDelete(record.id)}
            okButtonProps={{ 'data-e2e-id': `marquee-delete-confirm-ok-btn-${record.id}` }}
            cancelButtonProps={{ 'data-e2e-id': `marquee-delete-confirm-cancel-btn-${record.id}` }}
          >
            <Button
              type="link"
              size="small"
              danger
              data-e2e-id={`marquee-delete-btn-${record.id}`}
            >
              刪除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div data-e2e-id="marquee-page">
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>跑馬燈管理</Title>
        <Text type="secondary">運營管理 / 跑馬燈管理</Text>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          initialValues={defaultFilters}
          style={{ rowGap: 12, flexWrap: 'wrap', marginBottom: 16 }}
          data-e2e-id="marquee-filter-form"
        >
          <Form.Item name="type" label="類型">
            <Select style={{ width: 160 }} data-e2e-id="marquee-filter-type-select">
              <Select.Option value="all">全部</Select.Option>
              {marqueeTypeOptions.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="狀態">
            <Select style={{ width: 140 }} data-e2e-id="marquee-filter-status-select">
              <Select.Option value="all">全部</Select.Option>
              {marqueeStatusOptions.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="updatedRange" label="更新時間範圍">
            <RangePicker
              showTime
              style={{ width: 380 }}
              data-e2e-id="marquee-filter-updated-range-picker"
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleQuery}
                data-e2e-id="marquee-query-btn"
              >
                查詢
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
                data-e2e-id="marquee-reset-btn"
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card size="small" data-e2e-id="marquee-list-card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <Space wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
              data-e2e-id="marquee-create-btn"
            >
              新增跑馬燈
            </Button>
          </Space>
          <Space>
            <Tooltip title="刷新">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => message.success('列表已刷新')}
                data-e2e-id="marquee-refresh-btn"
              />
            </Tooltip>
            <Tooltip title="列高">
              <Button
                icon={<ColumnHeightOutlined />}
                onClick={() => message.info('原型暫未提供列高切換')}
                data-e2e-id="marquee-rowheight-btn"
              />
            </Tooltip>
            <Tooltip title="欄位設定">
              <Button
                icon={<SettingOutlined />}
                onClick={() => message.info('原型暫未提供欄位設定')}
                data-e2e-id="marquee-column-setting-btn"
              />
            </Tooltip>
          </Space>
        </div>

        <Table
          rowKey="key"
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 1640 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 條`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onRow={(record) =>
            ({
              'data-e2e-id': `marquee-table-row-${record.id}`,
            } as React.HTMLAttributes<HTMLTableRowElement>)
          }
          data-e2e-id="marquee-table"
        />
      </Card>

      <MarqueeConfigModal
        open={modalOpen}
        mode={modalMode}
        record={editingRecord}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

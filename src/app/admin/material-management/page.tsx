'use client';

import React, { useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  ColumnHeightOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import MaterialConfigModal, {
  type MaterialConfigSubmitValues,
} from '@/components/MaterialConfigModal';
import {
  generateMaterialItems,
  materialCategoryOptions,
  materialPlatformOptions,
  materialStatusOptions,
  type MaterialItem,
  type MaterialLinkType,
  type MaterialPlatform,
  type MaterialStatus,
} from '@/data/materialData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface FilterValues {
  platform?: MaterialPlatform | 'all';
  category?: string | 'all';
  effectiveRange?: [Dayjs, Dayjs];
  status?: MaterialStatus | 'all';
}

const createDefaultFilters = (): FilterValues => ({
  platform: 'all',
  category: 'all',
  effectiveRange: undefined,
  status: 'all',
});

const linkTypeLabelMap: Record<MaterialLinkType, string> = {
  internal: '站內跳轉',
  external: '外部鏈接',
  none: '-',
};

export default function MaterialManagementPage() {
  const [form] = Form.useForm<FilterValues>();
  const defaultFilters = useMemo(createDefaultFilters, []);
  const [data, setData] = useState(() => generateMaterialItems());
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingRecord, setEditingRecord] = useState<MaterialItem | null>(null);

  const filteredData = useMemo(() => data.filter((record) => {
    if (filters.platform && filters.platform !== 'all' && record.platform !== filters.platform) {
      return false;
    }
    if (filters.category && filters.category !== 'all' && record.category !== filters.category) {
      return false;
    }
    if (filters.status && filters.status !== 'all' && record.status !== filters.status) {
      return false;
    }

    const effectiveRange = filters.effectiveRange;
    if (effectiveRange?.[0] && effectiveRange?.[1]) {
      const startTime = dayjs(record.startTime);
      if (startTime.isBefore(effectiveRange[0]) || startTime.isAfter(effectiveRange[1])) {
        return false;
      }
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

  const openEditModal = (record: MaterialItem) => {
    setModalMode('edit');
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleSubmit = (values: MaterialConfigSubmitValues) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    if (modalMode === 'create') {
      const { platforms, ...materialValues } = values;
      setData((prev) => {
        const idBase = Date.now();
        const nextItems = platforms.map((platform, index): MaterialItem => {
          const id = `7${idBase}${String(index).padStart(3, '0')}`;
          return {
            ...materialValues,
            key: `material-${id}`,
            id,
            platform,
            updatedAt: now,
            updater: 'davinci@filbetph.com',
          };
        });

        return [...nextItems, ...prev];
      });
      message.success(`已為 ${platforms.length} 個平台新增素材`);
      return;
    }

    if (!editingRecord || !values.platforms[0]) return;

    const { platforms, ...materialValues } = values;
    setData((prev) => prev.map((item) => (
      item.id === editingRecord.id
        ? {
          ...item,
          ...materialValues,
          platform: platforms[0],
          updatedAt: now,
        }
        : item
    )));
    message.success('素材已更新');
  };

  const handleDelete = (id: string) => {
    setData((prev) => prev.filter((item) => item.id !== id));
    message.success('素材已刪除');
  };

  const handleStatusChange = (record: MaterialItem, checked: boolean) => {
    const nextStatus: MaterialStatus = checked ? 'enabled' : 'disabled';
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
    message.success(checked ? '素材已啟用' : '素材已停用');
  };

  const showImagePreview = (record: MaterialItem) => {
    Modal.info({
      title: '圖片預覽',
      content: <Text type="secondary">{record.name || record.id} 的素材圖片預覽</Text>,
      okText: '關閉',
      okButtonProps: { 'data-e2e-id': `material-preview-close-btn-${record.id}` },
    });
  };

  const showContentDetail = (record: MaterialItem) => {
    Modal.info({
      title: '素材內容',
      content: <div style={{ whiteSpace: 'pre-wrap' }}>{record.content}</div>,
      okText: '關閉',
      okButtonProps: { 'data-e2e-id': `material-content-detail-close-btn-${record.id}` },
    });
  };

  const columns: ColumnsType<MaterialItem> = [
    {
      title: 'No',
      width: 70,
      render: (_, __, index) => index + 1,
    },
    { title: 'ID', dataIndex: 'id', width: 180 },
    { title: '平台', dataIndex: 'platform', width: 100 },
    { title: '素材種類', dataIndex: 'category', width: 150 },
    { title: '名稱', dataIndex: 'name', width: 180 },
    {
      title: '說明',
      dataIndex: 'description',
      width: 240,
      ellipsis: true,
      render: (value: string) => value || '-',
    },
    {
      title: '圖片',
      dataIndex: 'hasImage',
      width: 100,
      render: (hasImage: boolean, record) => hasImage ? (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => showImagePreview(record)}
          data-e2e-id={`material-preview-btn-${record.id}`}
        >
          Preview
        </Button>
      ) : '-',
    },
    {
      title: '鏈接類型',
      dataIndex: 'linkType',
      width: 110,
      render: (value: MaterialLinkType) => linkTypeLabelMap[value],
    },
    {
      title: '跳轉鏈接',
      width: 260,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>H5: {record.h5Url || '-'}</Text>
          <Text>APP: {record.appUrl || '-'}</Text>
        </Space>
      ),
    },
    {
      title: '內容',
      dataIndex: 'content',
      width: 90,
      render: (content: string, record) => content ? (
        <Button
          type="link"
          size="small"
          onClick={() => showContentDetail(record)}
          data-e2e-id={`material-content-detail-btn-${record.id}`}
        >
          詳情
        </Button>
      ) : '-',
    },
    {
      title: '展示優先級',
      dataIndex: 'priority',
      width: 120,
      sorter: (a, b) => a.priority - b.priority,
    },
    {
      title: '生效時段',
      width: 190,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>{record.startTime}</Text>
          <Text>{record.endTime}</Text>
        </Space>
      ),
    },
    {
      title: '是否過期',
      width: 100,
      render: (_, record) => dayjs(record.endTime).isBefore(dayjs()) ? '已過期' : '未過期',
    },
    {
      title: '狀態',
      dataIndex: 'status',
      width: 90,
      render: (value: MaterialStatus, record) => (
        <Switch
          checked={value === 'enabled'}
          checkedChildren="啟用"
          unCheckedChildren="停用"
          onChange={(checked) => handleStatusChange(record, checked)}
          data-e2e-id={`material-status-switch-${record.id}`}
        />
      ),
    },
    { title: '更新時間', dataIndex: 'updatedAt', width: 170 },
    { title: '更新人', dataIndex: 'updater', width: 190 },
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
            data-e2e-id={`material-edit-btn-${record.id}`}
          >
            編輯
          </Button>
          <Popconfirm
            title="確定刪除此素材？"
            okText="刪除"
            cancelText="取消"
            onConfirm={() => handleDelete(record.id)}
            okButtonProps={{ 'data-e2e-id': `material-delete-confirm-ok-btn-${record.id}` }}
            cancelButtonProps={{ 'data-e2e-id': `material-delete-confirm-cancel-btn-${record.id}` }}
          >
            <Button
              type="link"
              size="small"
              danger
              data-e2e-id={`material-delete-btn-${record.id}`}
            >
              刪除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div data-e2e-id="material-page">
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>素材管理</Title>
        <Text type="secondary">運營管理 / 素材管理</Text>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          initialValues={defaultFilters}
          style={{ rowGap: 12, flexWrap: 'wrap', marginBottom: 16 }}
          data-e2e-id="material-filter-form"
        >
          <Form.Item name="platform" label="平台">
            <Select style={{ width: 150 }} data-e2e-id="material-filter-platform-select">
              <Select.Option value="all">全部</Select.Option>
              {materialPlatformOptions.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="category" label="素材種類">
            <Select style={{ width: 180 }} data-e2e-id="material-filter-category-select">
              <Select.Option value="all">全部</Select.Option>
              {materialCategoryOptions.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="effectiveRange" label="生效時間">
            <RangePicker
              showTime
              style={{ width: 380 }}
              data-e2e-id="material-filter-effective-range-picker"
            />
          </Form.Item>

          <Form.Item name="status" label="狀態">
            <Select style={{ width: 140 }} data-e2e-id="material-filter-status-select">
              <Select.Option value="all">全部</Select.Option>
              {materialStatusOptions.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleQuery}
                data-e2e-id="material-query-btn"
              >
                查詢
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
                data-e2e-id="material-reset-btn"
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card size="small" data-e2e-id="material-list-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 12,
            flexWrap: 'wrap',
          }}
        >
          <Space wrap>
            <Button
              onClick={() => message.info('原型暫未提供素材種類設置')}
              data-e2e-id="material-category-setting-btn"
            >
              素材種類設置
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
              data-e2e-id="material-create-btn"
            >
              新增
            </Button>
          </Space>

          <Space>
            <Tooltip title="刷新">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => message.success('列表已刷新')}
                data-e2e-id="material-refresh-btn"
              />
            </Tooltip>
            <Tooltip title="列高">
              <Button
                icon={<ColumnHeightOutlined />}
                onClick={() => message.info('原型暫未提供列高切換')}
                data-e2e-id="material-rowheight-btn"
              />
            </Tooltip>
            <Tooltip title="欄位設定">
              <Button
                icon={<SettingOutlined />}
                onClick={() => message.info('原型暫未提供欄位設定')}
                data-e2e-id="material-column-setting-btn"
              />
            </Tooltip>
          </Space>
        </div>

        <Table
          rowKey="key"
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 2480 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 條`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onRow={(record) =>
            ({
              'data-e2e-id': `material-table-row-${record.id}`,
            } as React.HTMLAttributes<HTMLTableRowElement>)
          }
          data-e2e-id="material-table"
        />
      </Card>

      <MaterialConfigModal
        open={modalOpen}
        mode={modalMode}
        record={editingRecord}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

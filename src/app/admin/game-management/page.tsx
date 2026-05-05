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
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import type { TablePaginationConfig } from 'antd/es/table';
import type { ColumnsType } from 'antd/es/table';
import {
  AppstoreOutlined,
  ColumnHeightOutlined,
  EditOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  ToolOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import {
  gameManagementData,
  gameStatusOptions,
  gameTypeOptions,
  providerOptions,
  venueOptions,
  weightTagOptions,
  yesNoOptions,
  type GameManagementRecord,
  type WeightTag,
} from '@/data/gameManagementData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface GameManagementFilters {
  venue?: string;
  provider?: string;
  gameType?: string;
  weightTags?: WeightTag[];
  gameIds?: string;
  gameNameEn?: string;
  status?: string;
  maintainer?: string;
  updatedRange?: [Dayjs, Dayjs];
  hot?: '是' | '否';
  providerGameId?: string;
  compliant?: '是' | '否';
}

const parseExactKeywords = (value?: string) =>
  (value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const renderBooleanTag = (value: boolean, trueLabel = '是', falseLabel = '否', trueColor = 'success', falseColor = 'default') => (
  <Tag color={value ? trueColor : falseColor}>{value ? trueLabel : falseLabel}</Tag>
);

const renderStatusTag = (status: GameManagementRecord['status']) => {
  if (status === '上架') return <Tag color="success">上架</Tag>;
  if (status === '下架') return <Tag color="default">下架</Tag>;
  return <Tag color="orange">維護中</Tag>;
};

const renderApiStatusTag = (status: GameManagementRecord['apiStatus']) => (
  <Tag color={status === '正常' ? 'success' : 'error'}>{status}</Tag>
);

const renderGameTypeTag = (type: GameManagementRecord['gameType']) => {
  const colorMap: Record<GameManagementRecord['gameType'], string> = {
    Slot: 'gold',
    Live: 'purple',
    Fishing: 'cyan',
    Sport: 'green',
    Card: 'geekblue',
  };
  return <Tag color={colorMap[type]}>{type}</Tag>;
};

const renderWeightTags = (tags: WeightTag[]) => (
  <Space size={4} wrap>
    {tags.map((tag) => (
      <Tag key={tag} color={tag === 'S' ? 'magenta' : tag === 'A' ? 'blue' : tag === 'B' ? 'purple' : 'default'}>
        {tag}
      </Tag>
    ))}
  </Space>
);

const filterFieldConfigs = [
  {
    key: 'venue',
    node: (
      <Form.Item name="venue" label="所屬場館">
        <Select data-e2e-id="game-management-filter-venue-select" placeholder="請選擇場館" allowClear style={{ width: 160 }}>
          {venueOptions.map((venue) => (
            <Select.Option key={venue} value={venue}>
              {venue}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    ),
  },
  {
    key: 'provider',
    node: (
      <Form.Item name="provider" label="所屬廠商">
        <Select data-e2e-id="game-management-filter-provider-select" placeholder="請選擇廠商" allowClear style={{ width: 180 }}>
          {providerOptions.map((provider) => (
            <Select.Option key={provider} value={provider}>
              {provider}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    ),
  },
  {
    key: 'gameType',
    node: (
      <Form.Item name="gameType" label="遊戲類型">
        <Select data-e2e-id="game-management-filter-game-type-select" placeholder="請選擇類型" allowClear style={{ width: 160 }}>
          {gameTypeOptions.map((type) => (
            <Select.Option key={type} value={type}>
              {type}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    ),
  },
  {
    key: 'weightTags',
    node: (
      <Form.Item name="weightTags" label="加權標籤">
        <Select
          mode="multiple"
          data-e2e-id="game-management-filter-weight-tags-select"
          placeholder="請選擇加權標籤"
          allowClear
          style={{ width: 200 }}
          maxTagCount="responsive"
        >
          {weightTagOptions.map((tag) => (
            <Select.Option key={tag} value={tag}>
              {tag}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    ),
  },
  {
    key: 'gameIds',
    node: (
      <Form.Item name="gameIds" label="遊戲 ID">
        <Input
          data-e2e-id="game-management-filter-game-ids-input"
          placeholder={'ID只能精確搜索，支持批量查詢, 以"," 分隔1～5000字符'}
          allowClear
          maxLength={5000}
          style={{ width: 360 }}
        />
      </Form.Item>
    ),
  },
  {
    key: 'gameNameEn',
    node: (
      <Form.Item name="gameNameEn" label="遊戲名稱(EN)">
        <Input
          data-e2e-id="game-management-filter-game-name-en-input"
          placeholder="名稱支持模糊搜索（100字內）"
          allowClear
          maxLength={100}
          style={{ width: 240 }}
        />
      </Form.Item>
    ),
  },
  {
    key: 'status',
    node: (
      <Form.Item name="status" label="遊戲狀態">
        <Select data-e2e-id="game-management-filter-status-select" placeholder="請選擇狀態" allowClear style={{ width: 160 }}>
          {gameStatusOptions.map((status) => (
            <Select.Option key={status} value={status}>
              {status}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    ),
  },
  {
    key: 'maintainer',
    node: (
      <Form.Item name="maintainer" label="維護人">
        <Input
          data-e2e-id="game-management-filter-maintainer-input"
          placeholder="名稱支持模糊搜索（100字內）"
          allowClear
          maxLength={100}
          style={{ width: 240 }}
        />
      </Form.Item>
    ),
  },
  {
    key: 'updatedRange',
    node: (
      <Form.Item name="updatedRange" label="更新時間">
        <RangePicker
          data-e2e-id="game-management-filter-updated-range"
          showTime
          style={{ width: 360 }}
        />
      </Form.Item>
    ),
  },
  {
    key: 'hot',
    node: (
      <Form.Item name="hot" label="HOT">
        <Select data-e2e-id="game-management-filter-hot-select" placeholder="請選擇" allowClear style={{ width: 120 }}>
          {yesNoOptions.map((item) => (
            <Select.Option key={item} value={item}>
              {item}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    ),
  },
  {
    key: 'providerGameId',
    node: (
      <Form.Item name="providerGameId" label="廠商遊戲代碼">
        <Input
          data-e2e-id="game-management-filter-provider-game-id-input"
          placeholder={'ID只能精確搜索，支持批量查詢, 以"," 分隔1～5000字符'}
          allowClear
          maxLength={5000}
          style={{ width: 360 }}
        />
      </Form.Item>
    ),
  },
  {
    key: 'compliant',
    node: (
      <Form.Item name="compliant" label="是否合規">
        <Select data-e2e-id="game-management-filter-compliant-select" placeholder="請選擇" allowClear style={{ width: 120 }}>
          {yesNoOptions.map((item) => (
            <Select.Option key={item} value={item}>
              {item}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    ),
  },
];

export default function GameManagementPage() {
  const [form] = Form.useForm<GameManagementFilters>();
  const [filters, setFilters] = useState<GameManagementFilters>({});
  const [collapsed, setCollapsed] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [tableSize, setTableSize] = useState<'small' | 'middle'>('small');
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
  });

  const filteredData = useMemo(() => {
    const selectedGameIds = parseExactKeywords(filters.gameIds);
    const selectedProviderGameIds = parseExactKeywords(filters.providerGameId);
    const lowerGameNameEn = filters.gameNameEn?.trim().toLowerCase();
    const lowerMaintainer = filters.maintainer?.trim().toLowerCase();

    return gameManagementData.filter((item) => {
      if (filters.venue && item.venue !== filters.venue) return false;
      if (filters.provider && item.provider !== filters.provider) return false;
      if (filters.gameType && item.gameType !== filters.gameType) return false;
      if (filters.weightTags?.length && !filters.weightTags.some((tag) => item.weightedTags.includes(tag))) return false;
      if (selectedGameIds.length && !selectedGameIds.includes(item.gameId.toLowerCase())) return false;
      if (lowerGameNameEn && !item.gameNameEn.toLowerCase().includes(lowerGameNameEn)) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (lowerMaintainer && !item.maintainer.toLowerCase().includes(lowerMaintainer)) return false;
      if (filters.updatedRange?.length === 2) {
        const [start, end] = filters.updatedRange;
        const updatedAt = dayjs(item.updatedAt);
        if (updatedAt.isBefore(start) || updatedAt.isAfter(end)) return false;
      }
      if (filters.hot && item.hot !== (filters.hot === '是')) return false;
      if (selectedProviderGameIds.length && !selectedProviderGameIds.includes(item.providerGameId.toLowerCase())) return false;
      if (filters.compliant && item.compliant !== (filters.compliant === '是')) return false;
      return true;
    });
  }, [filters]);

  const columns: ColumnsType<GameManagementRecord> = [
    {
      title: '序號',
      key: 'serial',
      width: 72,
      fixed: 'left',
      render: (_, __, index) => {
        const current = pagination.current || 1;
        const pageSize = pagination.pageSize || 20;
        return current > 0 ? (current - 1) * pageSize + index + 1 : index + 1;
      },
    },
    {
      title: '遊戲ID',
      dataIndex: 'gameId',
      width: 110,
      fixed: 'left',
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: '遊戲名稱En',
      dataIndex: 'gameNameEn',
      width: 220,
      ellipsis: true,
    },
    {
      title: '遊戲名稱Tg',
      dataIndex: 'gameNameTg',
      width: 220,
      ellipsis: true,
    },
    {
      title: '遊戲類型',
      dataIndex: 'gameType',
      width: 110,
      render: renderGameTypeTag,
    },
    {
      title: '客戶端1菜單圖標',
      key: 'client1Icon',
      width: 140,
      align: 'center',
      render: () => (
        <Tooltip title="mock icon">
          <PictureOutlined style={{ fontSize: 18, color: '#8c8c8c' }} />
        </Tooltip>
      ),
    },
    {
      title: '客戶端2菜單圖標',
      key: 'client2Icon',
      width: 140,
      align: 'center',
      render: () => (
        <Tooltip title="mock icon">
          <PictureOutlined style={{ fontSize: 18, color: '#8c8c8c' }} />
        </Tooltip>
      ),
    },
    {
      title: '遊戲狀態',
      dataIndex: 'status',
      width: 110,
      render: renderStatusTag,
    },
    {
      title: '三方接口狀態',
      dataIndex: 'apiStatus',
      width: 130,
      render: renderApiStatusTag,
    },
    {
      title: '所屬廠商',
      dataIndex: 'provider',
      width: 160,
    },
    {
      title: '所屬場館',
      dataIndex: 'venue',
      width: 100,
    },
    {
      title: '是否合規',
      dataIndex: 'compliant',
      width: 100,
      render: (value: boolean) => renderBooleanTag(value, '是', '否', 'blue', 'red'),
    },
    {
      title: '是否免費旋轉',
      dataIndex: 'hasFreeSpin',
      width: 120,
      render: (value: boolean) => renderBooleanTag(value),
    },
    {
      title: 'Pagcor類型分類',
      dataIndex: 'pagcorCategory',
      width: 160,
    },
    {
      title: '是否參與盲盒活動',
      dataIndex: 'blindBoxEnabled',
      width: 140,
      render: (value: boolean) => renderBooleanTag(value),
    },
    {
      title: '費率模板',
      dataIndex: 'rateTemplate',
      width: 120,
    },
    {
      title: '排序權重',
      dataIndex: 'sortWeight',
      width: 110,
      sorter: (a, b) => a.sortWeight - b.sortWeight,
    },
    {
      title: '加權標籤',
      dataIndex: 'weightedTags',
      width: 140,
      render: renderWeightTags,
    },
    {
      title: '最終權重',
      dataIndex: 'finalWeight',
      width: 110,
      sorter: (a, b) => a.finalWeight - b.finalWeight,
    },
    {
      title: 'HOT',
      dataIndex: 'hot',
      width: 80,
      render: (value: boolean) => renderBooleanTag(value, '是', '否', 'gold', 'default'),
    },
    {
      title: 'NEW',
      dataIndex: 'isNew',
      width: 80,
      render: (value: boolean) => renderBooleanTag(value, '是', '否', 'lime', 'default'),
    },
    {
      title: '更新時間',
      dataIndex: 'updatedAt',
      width: 180,
      sorter: (a, b) => dayjs(a.updatedAt).valueOf() - dayjs(b.updatedAt).valueOf(),
    },
    {
      title: '維護人',
      dataIndex: 'maintainer',
      width: 120,
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0} split={<span style={{ color: '#d9d9d9' }}>|</span>}>
          <Button data-e2e-id={`game-management-table-edit-btn-${record.gameId}`} type="link" size="small" icon={<EditOutlined />}>
            編輯
          </Button>
          <Button data-e2e-id={`game-management-table-config-btn-${record.gameId}`} type="link" size="small" icon={<ToolOutlined />}>
            配置
          </Button>
          <Button data-e2e-id={`game-management-table-log-btn-${record.gameId}`} type="link" size="small" icon={<FileTextOutlined />}>
            日誌
          </Button>
        </Space>
      ),
    },
  ];

  const visibleFields = collapsed ? filterFieldConfigs.slice(0, 6) : filterFieldConfigs;

  const runBatchAction = (actionName: string) => {
    if (!selectedRowKeys.length) {
      message.warning(`請先勾選要${actionName}的遊戲`);
      return;
    }
    message.success(`已選擇 ${selectedRowKeys.length} 筆，準備${actionName}`);
  };

  const handleSearch = () => {
    setFilters(form.getFieldsValue());
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({});
    setSelectedRowKeys([]);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>遊戲管理</Title>
        <Text type="secondary">對應 FAT 遊戲列表管理原型，包含合規篩選、加權標籤與批量操作工具列。</Text>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" style={{ gap: 12, flexWrap: 'wrap', rowGap: 12 }}>
          {visibleFields.map((field) => (
            <React.Fragment key={field.key}>{field.node}</React.Fragment>
          ))}
          <Form.Item style={{ marginInlineStart: 'auto' }}>
            <Space>
              <Button data-e2e-id="game-management-filter-query-btn" type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                查詢
              </Button>
              <Button data-e2e-id="game-management-filter-reset-btn" icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
              <Button data-e2e-id="game-management-filter-toggle-btn" type="link" onClick={() => setCollapsed((value) => !value)}>
                {collapsed ? '展開' : '收起'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
          <Space wrap>
            <Button data-e2e-id="game-management-toolbar-batch-status-btn" onClick={() => runBatchAction('批量設置遊戲狀態')}>
              批量設置遊戲狀態
            </Button>
            <Button data-e2e-id="game-management-toolbar-batch-weight-btn" onClick={() => runBatchAction('批量設置排序標籤')}>
              批量設置排序標籤
            </Button>
            <Button data-e2e-id="game-management-toolbar-type-directory-btn" icon={<AppstoreOutlined />} onClick={() => message.info('類型目錄')}>
              類型目錄
            </Button>
            <Button data-e2e-id="game-management-toolbar-weight-directory-btn" icon={<FolderOutlined />} onClick={() => message.info('加權標籤目錄維護')}>
              加權標籤目錄維護
            </Button>
            <Button data-e2e-id="game-management-toolbar-create-btn" type="primary" icon={<PlusOutlined />} onClick={() => message.info('單筆新增')}>
              單筆新增
            </Button>
            <Button data-e2e-id="game-management-toolbar-batch-create-btn" icon={<UploadOutlined />} onClick={() => message.info('批量新增')}>
              批量新增
            </Button>
            <Button data-e2e-id="game-management-toolbar-export-btn" icon={<FolderOpenOutlined />} onClick={() => message.success(`已準備導出 ${filteredData.length} 筆資料`)}>
              導出
            </Button>
          </Space>
          <Space>
            <Tooltip title="刷新">
              <Button data-e2e-id="game-management-toolbar-refresh-btn" icon={<ReloadOutlined />} onClick={() => message.success('已刷新列表')} />
            </Tooltip>
            <Tooltip title={`列高：${tableSize === 'small' ? '緊湊' : '標準'}`}>
              <Button
                data-e2e-id="game-management-toolbar-density-btn"
                icon={<ColumnHeightOutlined />}
                onClick={() => setTableSize((value) => (value === 'small' ? 'middle' : 'small'))}
              />
            </Tooltip>
            <Tooltip title="欄位設定">
              <Button data-e2e-id="game-management-toolbar-settings-btn" icon={<SettingOutlined />} onClick={() => message.info('欄位設定')} />
            </Tooltip>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="key"
          size={tableSize}
          scroll={{ x: 3200 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          onChange={(nextPagination) => setPagination(nextPagination)}
          onRow={(record) => ({ 'data-e2e-id': `game-management-table-row-${record.gameId}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 筆`,
          }}
        />
      </Card>
    </div>
  );
}

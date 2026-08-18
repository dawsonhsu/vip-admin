'use client';

import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, DatePicker, Drawer, Form, Progress, Select, Space, Table, Tag, Typography } from 'antd';
import { DownloadOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import {
  batchDispatchStatusMap,
  dispatchTaskStore,
} from '@/data/dispatchTaskStore';
import type {
  BatchDispatchStatus,
  BatchDispatchTask,
  BatchResultRow,
} from '@/data/mockData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const escapeCsvCell = (value: string | number | null) => {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
};

const downloadTaskFailedCsv = (task: BatchDispatchTask) => {
  const csv = [
    '會員識別,UID,狀態,失敗原因',
    ...task.failedList.map((row) => [
      escapeCsvCell(row.identifierRaw),
      escapeCsvCell(row.userId),
      '失敗',
      escapeCsvCell(row.failureReason),
    ].join(',')),
  ].join('\n');
  downloadTextFile(`${task.id}-failed.csv`, `\uFEFF${csv}`);
};

const failureDetailColumns: ColumnsType<BatchResultRow> = [
  { title: '會員識別', dataIndex: 'identifierRaw', width: 180 },
  { title: 'UID', dataIndex: 'userId', width: 160, render: (value: string | null) => value || '—' },
  { title: '狀態', dataIndex: 'status', width: 90, render: () => <Tag color="error">失敗</Tag> },
  { title: '失敗原因', dataIndex: 'failureReason', render: (value: string | null) => value || '—' },
];

export default function FreeSpinBatchLogPage() {
  const router = useRouter();
  const tasks = useSyncExternalStore(
    dispatchTaskStore.subscribe,
    dispatchTaskStore.getSnapshot,
    dispatchTaskStore.getServerSnapshot
  );
  const [form] = Form.useForm();
  const defaultSubmittedRange: [dayjs.Dayjs, dayjs.Dayjs] = [
    dayjs().startOf('day'),
    dayjs().endOf('day'),
  ];
  const [filters, setFilters] = useState<{
    submittedRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
    operator: string | undefined;
  }>(() => ({
    submittedRange: [dayjs().startOf('day'), dayjs().endOf('day')],
    operator: undefined,
  }));
  const [failureDetailTaskId, setFailureDetailTaskId] = useState<string | null>(null);
  const operatorOptions = useMemo(
    () => Array.from(new Set(tasks.map((task) => task.operator))),
    [tasks]
  );
  const filteredTasks = useMemo(() => tasks.filter((task) => {
    if (filters.submittedRange) {
      const ts = dayjs(task.submittedAt);
      const start = filters.submittedRange[0].startOf('day');
      const end = filters.submittedRange[1].endOf('day');
      if (ts.isBefore(start) || ts.isAfter(end)) return false;
    }
    if (filters.operator && task.operator !== filters.operator) return false;
    return true;
  }), [filters, tasks]);
  const failureDetailTask = useMemo(
    () => tasks.find((task) => task.id === failureDetailTaskId) || null,
    [failureDetailTaskId, tasks]
  );

  const onSearch = () => {
    const values = form.getFieldsValue();
    setFilters({
      submittedRange: values.submittedRange ?? null,
      operator: values.operator,
    });
  };

  const onReset = () => {
    const submittedRange: [dayjs.Dayjs, dayjs.Dayjs] = [
      dayjs().startOf('day'),
      dayjs().endOf('day'),
    ];
    form.setFieldsValue({ submittedRange, operator: undefined });
    setFilters({ submittedRange, operator: undefined });
  };

  const dispatchTaskColumns: ColumnsType<BatchDispatchTask> = [
    { title: '批次號', dataIndex: 'id', width: 175, fixed: 'left' },
    { title: '活動名稱', dataIndex: 'activityName', width: 150 },
    { title: '派發人', dataIndex: 'operator', width: 190 },
    { title: '提交時間', dataIndex: 'submittedAt', width: 165 },
    { title: '完成時間', dataIndex: 'finishedAt', width: 165, render: (value: string | null) => value || '—' },
    { title: '總筆數', dataIndex: 'total', width: 85 },
    {
      title: '成功 / 失敗',
      width: 120,
      render: (_, task) => (
        <Space size={4}>
          <Text style={{ color: '#389e0d' }}>{task.successCount}</Text>
          <Text type="secondary">/</Text>
          <Text type={task.failedCount > 0 ? 'danger' : 'secondary'}>{task.failedCount}</Text>
        </Space>
      ),
    },
    {
      title: '進度',
      width: 150,
      render: (_, task) => {
        const percent = task.total > 0 ? Math.round((task.processed / task.total) * 100) : 0;
        return task.status === 'processing'
          ? <Progress percent={percent} size="small" />
          : <Progress percent={100} size="small" />;
      },
    },
    {
      title: '狀態',
      dataIndex: 'status',
      width: 105,
      render: (value: BatchDispatchStatus) => {
        const status = batchDispatchStatusMap[value];
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, task) => (
        <Space direction="vertical" size={0} align="start">
          <Button
            type="link"
            size="small"
            style={{ paddingInline: 0 }}
            data-e2e-id={`freespin-batch-log-view-all-btn-${task.id}`}
            onClick={() => router.push(`/admin/freespin-grants?batchNo=${encodeURIComponent(task.id)}`)}
          >
            查看所有
          </Button>
          {task.failedCount > 0 && (
            <Button
              type="link"
              size="small"
              style={{ paddingInline: 0 }}
              data-e2e-id={`freespin-batch-log-failure-detail-btn-${task.id}`}
              onClick={() => setFailureDetailTaskId(task.id)}
            >
              查看失敗明細
            </Button>
          )}
          {task.failedCount > 0 && (
            <Button
              type="link"
              size="small"
              style={{ paddingInline: 0 }}
              data-e2e-id={`freespin-batch-log-download-btn-${task.id}`}
              onClick={() => downloadTaskFailedCsv(task)}
            >
              下載失敗清單
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div data-e2e-id="freespin-batch-log-page">
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>FS 批量派發紀錄</Title>
        <Text type="secondary">查看批量派發任務進度、結果與失敗明細</Text>
      </div>

      <Card data-e2e-id="freespin-batch-log-filter-card" style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          initialValues={{ submittedRange: defaultSubmittedRange }}
          style={{ gap: 12, flexWrap: 'wrap', rowGap: 12 }}
        >
          <Form.Item name="submittedRange" label="提交時間">
            <RangePicker
              data-e2e-id="freespin-batch-log-filter-submitted-range"
              style={{ width: 260 }}
            />
          </Form.Item>
          <Form.Item name="operator" label="派發人">
            <Select
              data-e2e-id="freespin-batch-log-filter-operator-select"
              allowClear
              placeholder="全部"
              style={{ width: 200 }}
            >
              {operatorOptions.map((operator) => (
                <Select.Option key={operator} value={operator}>{operator}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                data-e2e-id="freespin-batch-log-filter-query-btn"
                type="primary"
                icon={<SearchOutlined />}
                onClick={onSearch}
              >
                查詢
              </Button>
              <Button
                data-e2e-id="freespin-batch-log-filter-reset-btn"
                icon={<ReloadOutlined />}
                onClick={onReset}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card data-e2e-id="freespin-batch-log-list-card">
        <Table<BatchDispatchTask>
          data-e2e-id="freespin-batch-log-table"
          rowKey="id"
          columns={dispatchTaskColumns}
          dataSource={filteredTasks}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 筆` }}
          scroll={{ x: 1520 }}
          size="small"
        />
      </Card>

      <Drawer
        title={failureDetailTask ? `失敗明細 ${failureDetailTask.id}` : '失敗明細'}
        width={760}
        open={!!failureDetailTask}
        onClose={() => setFailureDetailTaskId(null)}
        extra={failureDetailTask ? (
          <Button
            icon={<DownloadOutlined />}
            data-e2e-id="freespin-batch-log-drawer-download-btn"
            onClick={() => downloadTaskFailedCsv(failureDetailTask)}
          >
            下載失敗清單
          </Button>
        ) : null}
      >
        <Table<BatchResultRow>
          data-e2e-id="freespin-batch-log-failure-detail-table"
          rowKey="key"
          columns={failureDetailColumns}
          dataSource={failureDetailTask?.failedList || []}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 700 }}
          size="small"
        />
      </Drawer>
    </div>
  );
}

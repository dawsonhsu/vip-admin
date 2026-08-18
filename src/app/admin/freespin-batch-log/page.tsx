'use client';

import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { Button, Card, Drawer, Progress, Space, Table, Tag, Typography, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
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
  const tasks = useSyncExternalStore(
    dispatchTaskStore.subscribe,
    dispatchTaskStore.getSnapshot,
    dispatchTaskStore.getServerSnapshot
  );
  const [failureDetailTaskId, setFailureDetailTaskId] = useState<string | null>(null);
  const failureDetailTask = useMemo(
    () => tasks.find((task) => task.id === failureDetailTaskId) || null,
    [failureDetailTaskId, tasks]
  );

  const handleRetryFailed = (taskId: string) => {
    const retryTask = dispatchTaskStore.retryFailed(taskId);
    if (retryTask) message.success(`已建立重派任務 ${retryTask.id}`);
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
      width: 340,
      fixed: 'right',
      render: (_, task) => task.failedCount > 0 ? (
        <Space size={2} wrap={false}>
          <Button
            type="link"
            size="small"
            data-e2e-id={`freespin-batch-log-failure-detail-btn-${task.id}`}
            onClick={() => setFailureDetailTaskId(task.id)}
          >
            查看失敗明細
          </Button>
          <Button
            type="link"
            size="small"
            data-e2e-id={`freespin-batch-log-download-btn-${task.id}`}
            onClick={() => downloadTaskFailedCsv(task)}
          >
            下載失敗清單
          </Button>
          {task.status !== 'processing' && (
            <Button
              type="link"
              size="small"
              data-e2e-id={`freespin-batch-log-retry-btn-${task.id}`}
              onClick={() => handleRetryFailed(task.id)}
            >
              重派失敗
            </Button>
          )}
        </Space>
      ) : '—',
    },
  ];

  return (
    <div data-e2e-id="freespin-batch-log-page">
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>FS 批量派發紀錄</Title>
        <Text type="secondary">查看批量派發任務進度、結果與失敗明細</Text>
      </div>

      <Card data-e2e-id="freespin-batch-log-list-card">
        <Table<BatchDispatchTask>
          data-e2e-id="freespin-batch-log-table"
          rowKey="id"
          columns={dispatchTaskColumns}
          dataSource={tasks}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 筆` }}
          scroll={{ x: 1650 }}
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

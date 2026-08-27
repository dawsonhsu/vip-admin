'use client';

import React, { useMemo, useState } from 'react';
import { Button, Card, Empty, Select, Space, Table, Tooltip, Typography, message, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined } from '@ant-design/icons';
import KycChangeLogModal from '@/components/KycChangeLogModal';
import KycEditReviewDrawer from '@/components/KycEditReviewDrawer';
import {
  kycOperators,
  kycStatusColorMap,
  kycStatusLabelMap,
  type KycRecord,
  type KycStatus,
} from '@/data/kycData';
import { kycStore, useKycRecords } from '@/data/kycStore';

const { Title, Text } = Typography;

export default function KycReviewPage() {
  const { token } = theme.useToken();
  const records = useKycRecords();
  const [currentOperator, setCurrentOperator] = useState('Darren');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [reviewRecord, setReviewRecord] = useState<KycRecord | null>(null);
  const [logRecord, setLogRecord] = useState<KycRecord | null>(null);

  const pendingRecords = useMemo(
    () => records.filter((record) => record.pendingEdit),
    [records],
  );

  const columns: ColumnsType<KycRecord> = [
    {
      title: '序號',
      key: 'index',
      width: 72,
      align: 'center',
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: '提交時間',
      key: 'pendingSubmittedAt',
      width: 170,
      render: (_, record) => record.pendingEdit?.submittedAt || '-',
    },
    {
      title: '會員信息',
      key: 'memberInfo',
      width: 180,
      render: (_, record) => (
        <div style={{ fontSize: 12, lineHeight: '20px' }}>
          <div><Text type="secondary">UID: </Text>{record.uid}</div>
          <div><Text type="secondary">手機號: </Text>+63 {record.phone}</div>
        </div>
      ),
    },
    {
      title: '提交者',
      key: 'submittedBy',
      width: 110,
      render: (_, record) => record.pendingEdit?.submittedBy || '-',
    },
    {
      title: '變更內容',
      key: 'changes',
      width: 430,
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
          {record.pendingEdit?.changes.map((change) => (
            <div key={change.field}>
              <span>「{change.label}：</span>
              <span style={{ color: token.colorTextSecondary, textDecoration: 'line-through' }}>
                {change.oldValue || '-'}
              </span>
              <span> → </span>
              <span style={{ color: token.colorSuccess, fontWeight: 600 }}>
                {change.newValue || '-'}
              </span>
              <span>」</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: '目前KYC狀態',
      dataIndex: 'status',
      width: 150,
      render: (status: KycStatus) => (
        <span style={{ color: kycStatusColorMap[status], fontWeight: 500 }}>
          {status}（{kycStatusLabelMap[status]}）
        </span>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 170,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0} split={<span style={{ color: token.colorSplit }}>|</span>}>
          <Button
            data-e2e-id={`kyc-review-table-review-btn-${record.uid}`}
            type="link"
            size="small"
            style={{ paddingInline: 4 }}
            onClick={() => setReviewRecord(record)}
          >
            複核
          </Button>
          <Button
            data-e2e-id={`kyc-review-table-change-log-btn-${record.uid}`}
            type="link"
            size="small"
            style={{ paddingInline: 4 }}
            onClick={() => setLogRecord(record)}
          >
            異動記錄
          </Button>
        </Space>
      ),
    },
  ];

  const handleReload = () => {
    kycStore.reset();
    setCurrentPage(1);
    message.success('KYC 複核列表已刷新');
  };

  return (
    <div data-e2e-id="kyc-review-page">
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>KYC 複核</Title>
      </div>

      <Card
        title={<span data-e2e-id="kyc-review-pending-count">待複核編輯（{pendingRecords.length}）</span>}
        extra={(
          <Space>
            <Space size={6}>
              <Text type="secondary">當前操作員：</Text>
              <Select
                data-e2e-id="kyc-review-current-operator-select"
                value={currentOperator}
                style={{ width: 110 }}
                options={kycOperators.map((operator) => ({ value: operator, label: operator }))}
                onChange={setCurrentOperator}
              />
            </Space>
            <Tooltip title="刷新">
              <Button
                data-e2e-id="kyc-review-reload-btn"
                aria-label="刷新"
                icon={<ReloadOutlined />}
                onClick={handleReload}
              />
            </Tooltip>
          </Space>
        )}
      >
        <Table
          data-e2e-id="kyc-review-table"
          rowKey="key"
          columns={columns}
          dataSource={pendingRecords}
          size="small"
          scroll={{ x: 1280 }}
          locale={{
            emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="目前沒有待複核的編輯" />,
          }}
          onRow={(record) => ({
            'data-e2e-id': `kyc-review-table-row-${record.uid}`,
          } as React.HTMLAttributes<HTMLTableRowElement>)}
          pagination={{
            current: currentPage,
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 條/總共 ${total} 條`,
            onChange: (page, size) => {
              setCurrentPage(size !== pageSize ? 1 : page);
              setPageSize(size);
            },
          }}
        />
      </Card>

      <KycEditReviewDrawer
        open={Boolean(reviewRecord)}
        record={reviewRecord}
        currentOperator={currentOperator}
        onClose={() => setReviewRecord(null)}
        onApprove={() => {
          if (!reviewRecord) return;
          kycStore.approveEdit(reviewRecord.key, currentOperator);
          setReviewRecord(null);
        }}
        onReject={(reason) => {
          if (!reviewRecord) return;
          kycStore.rejectEdit(reviewRecord.key, currentOperator, reason);
          setReviewRecord(null);
        }}
      />
      <KycChangeLogModal
        open={Boolean(logRecord)}
        record={logRecord}
        onClose={() => setLogRecord(null)}
      />
    </div>
  );
}

'use client';

import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Empty,
  Form,
  Image,
  Input,
  Select,
  Space,
  Table,
  Tooltip,
  Typography,
  message,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import KycChangeLogModal from '@/components/KycChangeLogModal';
import KycEditReviewDrawer from '@/components/KycEditReviewDrawer';
import {
  kycEditReviewStatusColorMap,
  kycEditReviewStatusLabelMap,
  kycEditReviewStatuses,
  kycOperators,
  type KycEditReviewEntry,
  type KycEditReviewStatus,
  type KycRecord,
} from '@/data/kycData';
import { kycStore, useKycCurrentOperator, useKycEditReviews, useKycRecords } from '@/data/kycStore';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface KycReviewFilters {
  uid?: string;
  phone?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  statuses?: KycEditReviewStatus[];
  submittedBy?: string[];
  submittedRange?: [Dayjs, Dayjs];
}

const includes = (value: string, query?: string) => (
  !query || value.toLowerCase().includes(query.trim().toLowerCase())
);

export default function KycReviewPage() {
  const { token } = theme.useToken();
  const [form] = Form.useForm<KycReviewFilters>();
  const records = useKycRecords();
  const reviews = useKycEditReviews();
  const currentOperator = useKycCurrentOperator();
  const [filters, setFilters] = useState<KycReviewFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [reviewEntry, setReviewEntry] = useState<KycEditReviewEntry | null>(null);
  const [logRecord, setLogRecord] = useState<KycRecord | null>(null);

  const pendingCount = useMemo(
    () => reviews.filter((entry) => entry.status === 'Pending').length,
    [reviews],
  );

  const filteredReviews = useMemo(() => reviews.filter((entry) => {
    if (filters.uid && !includes(entry.uid, filters.uid)) return false;
    if (filters.phone) {
      const query = filters.phone.replace(/\s|\+63/g, '').toLowerCase();
      if (!entry.phone.toLowerCase().includes(query)) return false;
    }
    if (!includes(entry.firstName, filters.firstName)) return false;
    if (!includes(entry.middleName, filters.middleName)) return false;
    if (!includes(entry.lastName, filters.lastName)) return false;
    if (filters.statuses?.length && !filters.statuses.includes(entry.status)) return false;
    if (filters.submittedBy?.length && !filters.submittedBy.includes(entry.submittedBy)) return false;
    if (filters.submittedRange?.length === 2) {
      const submittedAt = dayjs(entry.submittedAt);
      if (submittedAt.isBefore(filters.submittedRange[0]) || submittedAt.isAfter(filters.submittedRange[1])) {
        return false;
      }
    }
    return true;
  }), [filters, reviews]);

  const columns: ColumnsType<KycEditReviewEntry> = [
    {
      title: '序號',
      key: 'index',
      width: 72,
      align: 'center',
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: '提交時間',
      dataIndex: 'submittedAt',
      width: 170,
    },
    {
      title: '會員信息',
      key: 'memberInfo',
      width: 180,
      render: (_, entry) => (
        <div style={{ fontSize: 12, lineHeight: '20px' }}>
          <div><Text type="secondary">UID: </Text>{entry.uid}</div>
          <div><Text type="secondary">手機號: </Text>+63 {entry.phone}</div>
        </div>
      ),
    },
    {
      title: '變更內容',
      key: 'changes',
      width: 440,
      render: (_, entry) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
          {entry.changes.map((change) => (
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
          {entry.photoChanges.map((photo) => (
            <div
              key={photo.slot}
              data-e2e-id={`kyc-review-photo-change-${photo.slot}-${entry.uid}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span>「{photo.label}：</span>
              <Image
                src={photo.oldImage}
                alt={`${photo.label} 原圖`}
                width={62}
                height={40}
                style={{ objectFit: 'cover', borderRadius: 4, opacity: 0.7 }}
              />
              <span style={{ color: token.colorTextSecondary }}>→</span>
              <Image
                src={photo.newImage}
                alt={`${photo.label} 新圖`}
                width={62}
                height={40}
                style={{
                  objectFit: 'cover',
                  borderRadius: 4,
                  border: `1px solid ${token.colorSuccessBorder}`,
                }}
              />
              <span>」</span>
            </div>
          ))}
          {!entry.changes.length && !entry.photoChanges.length && <span>-</span>}
        </div>
      ),
    },
    {
      title: '提交者',
      dataIndex: 'submittedBy',
      width: 110,
    },
    {
      title: '複核狀態',
      dataIndex: 'status',
      width: 110,
      render: (status: KycEditReviewStatus) => (
        <span style={{ color: kycEditReviewStatusColorMap[status], fontWeight: 500 }}>
          {kycEditReviewStatusLabelMap[status]}
        </span>
      ),
    },
    {
      title: '複核人',
      dataIndex: 'reviewedBy',
      width: 100,
      render: (value: string) => value || '-',
    },
    {
      title: '複核時間',
      dataIndex: 'reviewedAt',
      width: 170,
      render: (value: string) => value || '-',
    },
    {
      title: '駁回原因',
      dataIndex: 'reason',
      width: 200,
      render: (value: string) => <span style={{ whiteSpace: 'normal' }}>{value || '-'}</span>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 170,
      fixed: 'right',
      render: (_, entry) => {
        const isSelfSubmitted = entry.submittedBy === currentOperator;
        const reviewDisabled = entry.status === 'Pending' && isSelfSubmitted;
        return (
          <Space size={0} split={<span style={{ color: token.colorSplit }}>|</span>}>
            {entry.status === 'Pending' ? (
              <Tooltip title={reviewDisabled ? '不可複核自己提交的編輯' : ''}>
                <Button
                  data-e2e-id={`kyc-review-table-review-btn-${entry.uid}`}
                  type="link"
                  size="small"
                  disabled={reviewDisabled}
                  style={{ paddingInline: 4 }}
                  onClick={() => setReviewEntry(entry)}
                >
                  複核
                </Button>
              </Tooltip>
            ) : (
              <Button
                data-e2e-id={`kyc-review-table-detail-btn-${entry.uid}`}
                type="link"
                size="small"
                style={{ paddingInline: 4 }}
                onClick={() => setReviewEntry(entry)}
              >
                詳情
              </Button>
            )}
            <Button
              data-e2e-id={`kyc-review-table-change-log-btn-${entry.uid}`}
              type="link"
              size="small"
              style={{ paddingInline: 4 }}
              onClick={() => {
                const record = records.find((item) => item.key === entry.recordKey) || null;
                setLogRecord(record);
              }}
            >
              異動記錄
            </Button>
          </Space>
        );
      },
    },
  ];

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const submittedRange = values.submittedRange?.length === 2
      ? [values.submittedRange[0].startOf('day'), values.submittedRange[1].endOf('day')] as [Dayjs, Dayjs]
      : undefined;
    setFilters({ ...values, submittedRange });
    setCurrentPage(1);
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({});
    setCurrentPage(1);
  };

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

      <Card size="small" style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" style={{ gap: 12, rowGap: 12, flexWrap: 'wrap' }}>
          <Form.Item name="uid" label="會員UID">
            <Input data-e2e-id="kyc-review-filter-uid-input" allowClear placeholder="請輸入會員UID" style={{ width: 170 }} />
          </Form.Item>
          <Form.Item name="phone" label="手機號">
            <Input data-e2e-id="kyc-review-filter-phone-input" allowClear placeholder="請輸入手機號" style={{ width: 170 }} />
          </Form.Item>
          <Form.Item name="firstName" label="First Name">
            <Input data-e2e-id="kyc-review-filter-first-name-input" allowClear placeholder="請輸入 First Name" style={{ width: 170 }} />
          </Form.Item>
          <Form.Item name="middleName" label="Middle Name">
            <Input data-e2e-id="kyc-review-filter-middle-name-input" allowClear placeholder="請輸入 Middle Name" style={{ width: 170 }} />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name">
            <Input data-e2e-id="kyc-review-filter-last-name-input" allowClear placeholder="請輸入 Last Name" style={{ width: 170 }} />
          </Form.Item>
          <Form.Item name="statuses" label="複核狀態">
            <Select
              data-e2e-id="kyc-review-filter-status-select"
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              placeholder="請選擇複核狀態"
              style={{ width: 220 }}
              options={kycEditReviewStatuses.map((status) => ({
                value: status,
                label: kycEditReviewStatusLabelMap[status],
              }))}
            />
          </Form.Item>
          <Form.Item name="submittedBy" label="提交者">
            <Select
              data-e2e-id="kyc-review-filter-submitted-by-select"
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              placeholder="請選擇提交者"
              style={{ width: 200 }}
              options={kycOperators.map((operator) => ({ value: operator, label: operator }))}
            />
          </Form.Item>
          <Form.Item name="submittedRange" label="提交時間">
            <RangePicker data-e2e-id="kyc-review-filter-submitted-range" style={{ width: 260 }} />
          </Form.Item>
          <Form.Item style={{ marginInlineStart: 'auto' }}>
            <Space>
              <Button data-e2e-id="kyc-review-filter-reset-btn" onClick={handleReset}>重置</Button>
              <Button data-e2e-id="kyc-review-filter-query-btn" type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查詢</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title={(
          <span data-e2e-id="kyc-review-pending-count">
            複核條目（待複核 {pendingCount}／總 {reviews.length}）
          </span>
        )}
        extra={(
          <Tooltip title="刷新">
            <Button
              data-e2e-id="kyc-review-reload-btn"
              aria-label="刷新"
              icon={<ReloadOutlined />}
              onClick={handleReload}
            />
          </Tooltip>
        )}
      >
        <Table
          data-e2e-id="kyc-review-table"
          rowKey="id"
          columns={columns}
          dataSource={filteredReviews}
          size="small"
          scroll={{ x: 1800 }}
          locale={{
            emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="查無符合條件的複核條目" />,
          }}
          onRow={(entry) => ({
            'data-e2e-id': `kyc-review-table-row-${entry.uid}`,
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
        open={Boolean(reviewEntry)}
        entry={reviewEntry}
        currentOperator={currentOperator}
        onClose={() => setReviewEntry(null)}
        onApprove={() => {
          if (!reviewEntry) return;
          kycStore.approveEdit(reviewEntry.id, currentOperator);
          setReviewEntry(null);
        }}
        onReject={(reason) => {
          if (!reviewEntry) return;
          kycStore.rejectEdit(reviewEntry.id, currentOperator, reason);
          setReviewEntry(null);
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

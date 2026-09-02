'use client';

import React from 'react';
import { Empty, Image, Modal, Table, Typography, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  kycEditReviewStatusColorMap,
  kycEditReviewStatusLabelMap,
  kycStatusColorMap,
  type KycChangeLogEntry,
  type KycEditFieldChange,
  type KycEditReviewStatus,
  type KycRecord,
  type KycStatus,
} from '@/data/kycData';

const { Text } = Typography;

interface KycChangeLogModalProps {
  open: boolean;
  record: KycRecord | null;
  onClose: () => void;
}

const renderStatus = (status: KycStatus | '') => (
  status
    ? <span style={{ color: kycStatusColorMap[status], fontWeight: 500 }}>{status}</span>
    : <span>-</span>
);

export default function KycChangeLogModal({ open, record, onClose }: KycChangeLogModalProps) {
  const { token } = theme.useToken();

  const columns: ColumnsType<KycChangeLogEntry> = [
    { title: '異動時間', dataIndex: 'time', width: 170 },
    { title: '操作', dataIndex: 'action', width: 100 },
    {
      title: '異動前狀態',
      dataIndex: 'statusBefore',
      width: 145,
      render: renderStatus,
    },
    {
      title: '異動後狀態',
      dataIndex: 'statusAfter',
      width: 145,
      render: renderStatus,
    },
    {
      title: '複核狀態',
      dataIndex: 'reviewStatus',
      width: 110,
      render: (value: KycEditReviewStatus | null | undefined) => (
        value
          ? (
            <span style={{ color: kycEditReviewStatusColorMap[value], fontWeight: 500 }}>
              {kycEditReviewStatusLabelMap[value]}
            </span>
          )
          : <span>-</span>
      ),
    },
    {
      title: '備註',
      dataIndex: 'remark',
      render: (value: string) => (
        <span style={{ whiteSpace: 'normal' }}>{value?.trim() || '-'}</span>
      ),
    },
    { title: '異動人員', dataIndex: 'operator', width: 130 },
  ];

  const diffColumns: ColumnsType<KycEditFieldChange> = [
    {
      title: '欄位',
      dataIndex: 'label',
      width: 150,
      render: (value: string) => <strong>{value}</strong>,
    },
    {
      title: '異動前',
      dataIndex: 'oldValue',
      render: (value: string) => (
        <span style={{ color: token.colorTextSecondary, textDecoration: 'line-through' }}>{value || '-'}</span>
      ),
    },
    {
      title: '異動後',
      dataIndex: 'newValue',
      render: (value: string) => (
        <span style={{ color: token.colorSuccess, fontWeight: 600 }}>{value || '-'}</span>
      ),
    },
  ];

  return (
    <Modal
      data-e2e-id="kyc-change-log-modal"
      title="異動記錄"
      open={open}
      onCancel={onClose}
      width={1120}
      footer={null}
    >
      {record?.changeLog.length ? (
        <Table
          data-e2e-id="kyc-change-log-table"
          rowKey="id"
          columns={columns}
          dataSource={record.changeLog}
          size="small"
          pagination={false}
          expandable={{
            rowExpandable: (entry) => Boolean(entry.changes?.length || entry.photoChanges?.length),
            expandedRowRender: (entry) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Boolean(entry.changes?.length) && (
                  <Table
                    data-e2e-id="kyc-change-log-diff-table"
                    rowKey="field"
                    columns={diffColumns}
                    dataSource={entry.changes}
                    size="small"
                    pagination={false}
                  />
                )}
                {entry.photoChanges?.map((photo) => (
                  <div key={photo.slot} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Text strong style={{ width: 110 }}>{photo.label}</Text>
                    <Image
                      src={photo.oldImage}
                      alt={`${photo.label} 異動前`}
                      width={96}
                      height={62}
                      style={{ objectFit: 'cover', borderRadius: 4, opacity: 0.7 }}
                    />
                    <span style={{ color: token.colorTextSecondary }}>→</span>
                    <Image
                      src={photo.newImage}
                      alt={`${photo.label} 異動後`}
                      width={96}
                      height={62}
                      style={{
                        objectFit: 'cover',
                        borderRadius: 4,
                        border: `1px solid ${token.colorSuccessBorder}`,
                      }}
                    />
                  </div>
                ))}
              </div>
            ),
          }}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暫無該筆異動記錄" />
      )}
    </Modal>
  );
}

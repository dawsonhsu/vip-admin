'use client';

import React from 'react';
import { Empty, Modal, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { KycChangeLogEntry, KycRecord } from '@/data/kycData';

interface KycChangeLogModalProps {
  open: boolean;
  record: KycRecord | null;
  onClose: () => void;
}

const columns: ColumnsType<KycChangeLogEntry> = [
  { title: '時間', dataIndex: 'time', width: 170 },
  { title: '操作人', dataIndex: 'operator', width: 100 },
  { title: '操作', dataIndex: 'action', width: 130 },
  { title: '詳情', dataIndex: 'detail' },
];

export default function KycChangeLogModal({ open, record, onClose }: KycChangeLogModalProps) {
  return (
    <Modal
      data-e2e-id="kyc-change-log-modal"
      title="異動記錄"
      open={open}
      onCancel={onClose}
      width={760}
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
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暫無該筆審核異動記錄" />
      )}
    </Modal>
  );
}

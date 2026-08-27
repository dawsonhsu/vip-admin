'use client';

import React from 'react';
import { Empty, Modal, Table, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { KycChangeLogEntry, KycEditFieldChange, KycRecord } from '@/data/kycData';

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
  const { token } = theme.useToken();
  const diffColumns: ColumnsType<KycEditFieldChange> = [
    {
      title: '欄位',
      dataIndex: 'label',
      width: 150,
      render: (value: string) => <strong>{value}</strong>,
    },
    {
      title: '原值',
      dataIndex: 'oldValue',
      render: (value: string) => (
        <span style={{ color: token.colorTextSecondary, textDecoration: 'line-through' }}>{value || '-'}</span>
      ),
    },
    {
      title: '新值',
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
          expandable={{
            rowExpandable: (entry) => Boolean(entry.changes?.length),
            expandedRowRender: (entry) => (
              <Table
                data-e2e-id="kyc-change-log-diff-table"
                rowKey="field"
                columns={diffColumns}
                dataSource={entry.changes}
                size="small"
                pagination={false}
              />
            ),
          }}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暫無該筆審核異動記錄" />
      )}
    </Modal>
  );
}

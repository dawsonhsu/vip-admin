'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Card, Table, Input, DatePicker, Button, Space, Typography, Form,
} from 'antd';
import {
  ReloadOutlined, FolderOpenOutlined, ColumnHeightOutlined, SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface TransferRecord {
  id: number;
  transferTime: string;
  memberUid: string;
  memberAccount: string;
  memberPhone: string;
  toInviterUid: string;
  toInviterAccount: string;
  toInviterPhone: string;
  operator: string;
  remark: string;
}

function generatePHPhone(): string {
  const prefix = ['905', '906', '915', '916', '917', '926', '927', '935', '936', '945', '955', '956', '975', '976', '995', '996'];
  const p = prefix[Math.floor(Math.random() * prefix.length)];
  const num = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `+63${p}${num}`;
}

function generateUid(): string {
  return Math.floor(10000000000000000 + Math.random() * 90000000000000000).toString();
}

function generateTransferRecords(count: number = 30): TransferRecord[] {
  const operators = ['admin01', 'admin02', 'cs_manager', 'risk_admin', 'super_admin'];
  const remarks = [
    '會員申請轉移邀請人',
    '經查實為同一推薦人',
    '邀請關係錯誤修正',
    '會員客訴，核實後轉移',
    '推薦人離職，轉移至新負責人',
    '渠道歸屬調整',
    '代理結構優化調整',
  ];
  const records: TransferRecord[] = [];
  for (let i = 1; i <= count; i++) {
    const date = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
    records.push({
      id: i,
      transferTime: date.toISOString().replace('T', ' ').slice(0, 19),
      memberUid: generateUid(),
      memberAccount: `user${Math.floor(Math.random() * 90000 + 10000)}`,
      memberPhone: generatePHPhone(),
      toInviterUid: generateUid(),
      toInviterAccount: `user${Math.floor(Math.random() * 90000 + 10000)}`,
      toInviterPhone: generatePHPhone(),
      operator: operators[Math.floor(Math.random() * operators.length)],
      remark: remarks[Math.floor(Math.random() * remarks.length)],
    });
  }
  return records.sort((a, b) => b.transferTime.localeCompare(a.transferTime));
}

export default function InviterTransferLogPage() {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [allRecords, setAllRecords] = useState<TransferRecord[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setAllRecords(generateTransferRecords(30));
    setMounted(true);
  }, []);

  const filteredData = useMemo(() => {
    return allRecords.filter((item) => {
      if (filters.memberPhone && !item.memberPhone.includes(filters.memberPhone)) return false;
      if (filters.toInviterPhone && !item.toInviterPhone.includes(filters.toInviterPhone)) return false;
      return true;
    });
  }, [filters, allRecords]);

  const onSearch = () => {
    const values = form.getFieldsValue();
    setFilters(values);
  };

  const onReset = () => {
    form.resetFields();
    setFilters({});
  };

  const columns: ColumnsType<TransferRecord> = [
    {
      title: '轉移時間',
      dataIndex: 'transferTime',
      width: 180,
      sorter: (a, b) => a.transferTime.localeCompare(b.transferTime),
    },
    {
      title: '被轉移會員',
      key: 'member',
      width: 220,
      render: (_, r) => (
        <div style={{ fontSize: 12, lineHeight: '20px' }}>
          <div><Text type="secondary">UID：</Text><span>{r.memberUid}</span></div>
          <div><Text type="secondary">帳號：</Text><a data-e2e-id={`inviter-transfer-table-member-link-${r.memberUid}`} style={{ color: '#1668dc' }}>{r.memberAccount}</a></div>
          <div><Text type="secondary">手機：</Text><span>{r.memberPhone}</span></div>
        </div>
      ),
    },
    {
      title: '轉移目標',
      key: 'toInviter',
      width: 220,
      render: (_, r) => (
        <div style={{ fontSize: 12, lineHeight: '20px' }}>
          <div><Text type="secondary">UID：</Text><span>{r.toInviterUid}</span></div>
          <div><Text type="secondary">帳號：</Text><a data-e2e-id={`inviter-transfer-table-target-link-${r.toInviterUid}`} style={{ color: '#1668dc' }}>{r.toInviterAccount}</a></div>
          <div><Text type="secondary">手機：</Text><span>{r.toInviterPhone}</span></div>
        </div>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      width: 120,
    },
    {
      title: '備註',
      dataIndex: 'remark',
      width: 200,
      ellipsis: true,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, color: '#e8e8e8' }}>邀請人轉移紀錄</Title>
        <Text type="secondary">查詢所有邀請人轉移操作歷史紀錄</Text>
      </div>

      {/* Filter Card */}
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" style={{ gap: 12, flexWrap: 'wrap', rowGap: 12 }}>
          <Form.Item name="memberPhone" label="被轉移會員手機">
            <Input data-e2e-id="inviter-transfer-filter-member-phone-input" placeholder="輸入手機號" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="toInviterPhone" label="目標邀請人手機">
            <Input data-e2e-id="inviter-transfer-filter-target-phone-input" placeholder="輸入手機號" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="dateRange" label="轉移時間">
            <RangePicker data-e2e-id="inviter-transfer-filter-date-range" showTime placeholder={['開始時間', '結束時間']} style={{ width: 380 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button data-e2e-id="inviter-transfer-filter-query-btn" type="primary" onClick={onSearch}>查詢</Button>
              <Button data-e2e-id="inviter-transfer-filter-reset-btn" onClick={onReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Table Card */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Space>
            <Button data-e2e-id="inviter-transfer-toolbar-export-btn" icon={<FolderOpenOutlined />}>導出</Button>
            <Button data-e2e-id="inviter-transfer-toolbar-refresh-btn" icon={<ReloadOutlined />} />
            <Button data-e2e-id="inviter-transfer-toolbar-density-btn" icon={<ColumnHeightOutlined />} />
            <Button data-e2e-id="inviter-transfer-toolbar-settings-btn" icon={<SettingOutlined />} />
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          onRow={(record) => ({ 'data-e2e-id': `inviter-transfer-table-row-${record.id}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          scroll={{ x: 1300 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 筆`,
          }}
          size="small"
        />
      </Card>
    </div>
  );
}

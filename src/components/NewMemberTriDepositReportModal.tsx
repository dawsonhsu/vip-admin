'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  bonusOrderRecords,
  bonusOrderStatusOptions,
  type BonusOrderStatus,
  type DepositSeq,
  type TriDepositBonusOrderRecord,
} from '@/data/newMemberTriDepositData';

const { Text } = Typography;
const { RangePicker } = DatePicker;

type SearchField = 'phone' | 'account' | 'uid';

const searchFieldOptions: { value: SearchField; label: string }[] = [
  { value: 'phone', label: '手机号' },
  { value: 'account', label: '会员账号' },
  { value: 'uid', label: 'UID' },
];

const statusMap: Record<BonusOrderStatus, { label: string; color: string }> = {
  pending: { label: '未领取', color: 'default' },
  claimed: { label: '已领取', color: 'success' },
  expired: { label: '已过期', color: 'error' },
  reviewing: { label: '待审核', color: 'warning' },
};

const depositSeqMap: Record<DepositSeq, { label: string; color: string }> = {
  1: { label: '首存', color: 'blue' },
  2: { label: '二存', color: 'cyan' },
  3: { label: '三存', color: 'purple' },
};

const formatCurrency = (value: number) =>
  `₱ ${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

interface NewMemberTriDepositReportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewMemberTriDepositReportModal({
  open,
  onClose,
}: NewMemberTriDepositReportModalProps) {
  const [form] = Form.useForm();
  const [searchField, setSearchField] = useState<SearchField>('phone');
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({
    orderStatus: 'all',
    depositSeq: 'all',
  });

  useEffect(() => {
    if (open) {
      form.setFieldsValue({ orderStatus: 'all', depositSeq: 'all' });
    }
  }, [open, form]);

  const searchCount = useMemo(() => {
    if (!searchText.trim()) return 0;
    return searchText
      .split(',')
      .map((term) => term.trim())
      .filter(Boolean).length;
  }, [searchText]);

  const filteredRecords = useMemo(() => {
    return bonusOrderRecords.filter((record) => {
      const terms = String(filters.searchText ?? '')
        .split(',')
        .map((term) => term.trim().toLowerCase())
        .filter(Boolean);

      if (terms.length > 0) {
        const field = (filters.searchField ?? 'phone') as SearchField;
        const value = String(record[field]).toLowerCase();
        if (!terms.some((term) => value.includes(term))) return false;
      }

      if (filters.claimedRange && Array.isArray(filters.claimedRange)) {
        const [start, end] = filters.claimedRange as [Dayjs, Dayjs];
        if (start && end) {
          if (record.claimedAt === '-') return false;
          const claimedAt = dayjs(record.claimedAt);
          if (claimedAt.isBefore(start) || claimedAt.isAfter(end)) return false;
        }
      }

      if (filters.orderStatus && filters.orderStatus !== 'all' && record.orderStatus !== filters.orderStatus) {
        return false;
      }

      if (
        filters.depositSeq &&
        filters.depositSeq !== 'all' &&
        record.depositSeq !== Number(filters.depositSeq)
      ) {
        return false;
      }

      if (filters.depositMin !== undefined && filters.depositMin !== null && record.depositAmount < filters.depositMin) {
        return false;
      }

      if (filters.depositMax !== undefined && filters.depositMax !== null && record.depositAmount > filters.depositMax) {
        return false;
      }

      if (filters.bonusMin !== undefined && filters.bonusMin !== null && record.bonusAmount < filters.bonusMin) {
        return false;
      }

      if (filters.bonusMax !== undefined && filters.bonusMax !== null && record.bonusAmount > filters.bonusMax) {
        return false;
      }

      return true;
    });
  }, [filters]);

  const columns: ColumnsType<TriDepositBonusOrderRecord> = [
    {
      title: '礼金订单ID',
      dataIndex: 'orderId',
      width: 160,
      fixed: 'left',
      render: (value) => <Text code>{value}</Text>,
    },
    {
      title: '礼金订单状态',
      dataIndex: 'orderStatus',
      width: 110,
      render: (value: BonusOrderStatus) => {
        const status = statusMap[value];
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    {
      title: '领取时间',
      dataIndex: 'claimedAt',
      width: 170,
      render: (value) => (value === '-' ? <Text type="secondary">—</Text> : value),
    },
    { title: '手机号', dataIndex: 'phone', width: 130 },
    { title: '会员账号', dataIndex: 'account', width: 140 },
    {
      title: 'UID',
      dataIndex: 'uid',
      width: 100,
      render: (value) => <Text>{value}</Text>,
    },
    {
      title: '存款次数',
      dataIndex: 'depositSeq',
      width: 90,
      render: (value: DepositSeq) => {
        const seq = depositSeqMap[value];
        return <Tag color={seq.color}>{seq.label}</Tag>;
      },
    },
    {
      title: '存款金额',
      dataIndex: 'depositAmount',
      width: 110,
      sorter: (a, b) => a.depositAmount - b.depositAmount,
      render: (value) => formatCurrency(value),
    },
    {
      title: '礼金金额',
      dataIndex: 'bonusAmount',
      width: 110,
      sorter: (a, b) => a.bonusAmount - b.bonusAmount,
      render: (value) => <Text strong style={{ color: '#fa8c16' }}>{formatCurrency(value)}</Text>,
    },
    {
      title: '总流水要求金额',
      dataIndex: 'totalRolloverRequired',
      width: 130,
      render: (value) => formatCurrency(value),
    },
    {
      title: '发放旋转次数',
      dataIndex: 'freeSpinTotal',
      width: 110,
      render: (value) => `${value} 次`,
    },
    {
      title: '未使用次数',
      dataIndex: 'freeSpinUnused',
      width: 110,
      render: (value) => `${value} 次`,
    },
    {
      title: '累计派彩',
      dataIndex: 'cumulativePayout',
      width: 120,
      render: (value) => formatCurrency(value),
    },
  ];

  const handleQuery = () => {
    setFilters({
      ...form.getFieldsValue(),
      searchField,
      searchText,
    });
  };

  const handleReset = () => {
    form.resetFields();
    form.setFieldsValue({ orderStatus: 'all', depositSeq: 'all' });
    setSearchField('phone');
    setSearchText('');
    setFilters({ orderStatus: 'all', depositSeq: 'all' });
  };

  return (
    <Modal
      title="新人三存活动 - 礼金明细"
      open={open}
      onCancel={onClose}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button data-e2e-id="new-member-tri-deposit-report-modal-footer-close-btn" onClick={onClose}>
            关闭
          </Button>
        </div>
      }
      width="94%"
      style={{ top: 20 }}
      styles={{ body: { maxHeight: '78vh', overflowY: 'auto', padding: 16 } }}
    >
      <div data-e2e-id="new-member-tri-deposit-report-modal-modal">
        <Card size="small" style={{ marginBottom: 12 }}>
          <Form
            form={form}
            layout="inline"
            initialValues={{ orderStatus: 'all', depositSeq: 'all' }}
            style={{ gap: 8, rowGap: 8, flexWrap: 'wrap' }}
          >
            <Form.Item label={searchFieldOptions.find((item) => item.value === searchField)?.label}>
              <Space direction="vertical" size={2}>
                <Space.Compact>
                  <Select
                    data-e2e-id="new-member-tri-deposit-report-modal-filter-search-field-select"
                    value={searchField}
                    style={{ width: 110 }}
                    options={searchFieldOptions}
                    onChange={setSearchField}
                  />
                  <Input
                    data-e2e-id="new-member-tri-deposit-report-modal-filter-search-input"
                    allowClear
                    value={searchText}
                    placeholder="支持批量查询，以 ',' 分隔 1~5000"
                    style={{ width: 320 }}
                    onChange={(event) => setSearchText(event.target.value)}
                  />
                </Space.Compact>
                <Text
                  data-e2e-id="new-member-tri-deposit-report-modal-filter-search-count-text"
                  type={searchCount > 5000 ? 'danger' : 'secondary'}
                  style={{ fontSize: 12 }}
                >
                  {searchCount} / 5000
                </Text>
              </Space>
            </Form.Item>

            <Form.Item name="claimedRange" label="领取时间">
              <RangePicker
                data-e2e-id="new-member-tri-deposit-report-modal-filter-claimed-range"
                showTime
                style={{ width: 260 }}
                format="YYYY-MM-DD HH:mm:ss"
              />
            </Form.Item>

            <Form.Item name="orderStatus" label="礼金状态">
              <Select
                data-e2e-id="new-member-tri-deposit-report-modal-filter-order-status-select"
                style={{ width: 110 }}
                options={[
                  { value: 'all', label: '全部' },
                  ...bonusOrderStatusOptions,
                ]}
              />
            </Form.Item>

            <Form.Item name="depositSeq" label="存款次数">
              <Select
                data-e2e-id="new-member-tri-deposit-report-modal-filter-deposit-seq-select"
                style={{ width: 110 }}
                options={[
                  { value: 'all', label: '全部' },
                  { value: 1, label: '首存' },
                  { value: 2, label: '二存' },
                  { value: 3, label: '三存' },
                ]}
              />
            </Form.Item>

            <Form.Item label="存款金额">
              <Space.Compact>
                <Form.Item name="depositMin" noStyle>
                  <InputNumber
                    data-e2e-id="new-member-tri-deposit-report-modal-filter-deposit-min-input"
                    prefix="₱"
                    min={0}
                    placeholder="最小"
                    style={{ width: 115 }}
                  />
                </Form.Item>
                <Form.Item name="depositMax" noStyle>
                  <InputNumber
                    data-e2e-id="new-member-tri-deposit-report-modal-filter-deposit-max-input"
                    prefix="₱"
                    min={0}
                    placeholder="最大"
                    style={{ width: 115 }}
                  />
                </Form.Item>
              </Space.Compact>
            </Form.Item>

            <Form.Item label="礼金金额">
              <Space.Compact>
                <Form.Item name="bonusMin" noStyle>
                  <InputNumber
                    data-e2e-id="new-member-tri-deposit-report-modal-filter-bonus-min-input"
                    prefix="₱"
                    min={0}
                    placeholder="最小"
                    style={{ width: 115 }}
                  />
                </Form.Item>
                <Form.Item name="bonusMax" noStyle>
                  <InputNumber
                    data-e2e-id="new-member-tri-deposit-report-modal-filter-bonus-max-input"
                    prefix="₱"
                    min={0}
                    placeholder="最大"
                    style={{ width: 115 }}
                  />
                </Form.Item>
              </Space.Compact>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  data-e2e-id="new-member-tri-deposit-report-modal-filter-reset-btn"
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                >
                  重置
                </Button>
                <Button
                  data-e2e-id="new-member-tri-deposit-report-modal-filter-query-btn"
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleQuery}
                >
                  查询
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        <div
          style={{
            marginBottom: 12,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <Button
            data-e2e-id="new-member-tri-deposit-report-modal-toolbar-export-btn"
            icon={<DownloadOutlined />}
            onClick={() => message.success('已导出 xlsx')}
          >
            导出
          </Button>
          <Button
            data-e2e-id="new-member-tri-deposit-report-modal-toolbar-refresh-btn"
            icon={<ReloadOutlined />}
            onClick={() => message.success('已刷新')}
          />
          <Button
            data-e2e-id="new-member-tri-deposit-report-modal-toolbar-settings-btn"
            icon={<SettingOutlined />}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredRecords}
          rowKey="id"
          onRow={(record) =>
            ({
              'data-e2e-id': `new-member-tri-deposit-report-modal-table-row-${record.orderId}`,
            } as React.HTMLAttributes<HTMLTableRowElement>)
          }
          size="small"
          scroll={{ x: 1660 }}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `共 ${total} 笔`,
            showSizeChanger: true,
          }}
        />
      </div>
    </Modal>
  );
}

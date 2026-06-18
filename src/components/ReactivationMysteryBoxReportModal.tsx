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
  openStatusOptions,
  prizeTypeLabels,
  prizeTypeOptions,
  recallBoxOpenRecords,
  type BoxOpenStatus,
  type PrizeType,
  type RecallBoxOpenRecord,
} from '@/data/reactivationMysteryBoxData';

const { Text } = Typography;
const { RangePicker } = DatePicker;

type SearchField = 'phone' | 'account' | 'uid';

const E2E = 'reactivation-mystery-box-report-modal';

const searchFieldOptions: { value: SearchField; label: string }[] = [
  { value: 'phone', label: '手机' },
  { value: 'account', label: '账号' },
  { value: 'uid', label: 'UID' },
];

const statusMap: Record<BoxOpenStatus, { label: string; color: string }> = {
  pending: { label: '待领取', color: 'default' },
  claimed: { label: '已领取', color: 'success' },
};

const prizeColorMap: Record<PrizeType, string> = {
  bonus: 'gold',
  depositCoupon: 'blue',
  rebateCoupon: 'cyan',
  freeSpins: 'purple',
  filCoins: 'magenta',
};

interface Props {
  open: boolean;
  onClose: () => void;
}

const getDefaultFilters = (): Record<string, any> => ({
  grantedRange: [
    dayjs('2026-06-18 00:00:00'),
    dayjs('2026-06-18 23:59:59'),
  ],
  openStatus: 'all',
  prizeType: 'all',
});

const splitSearchTerms = (value?: string) =>
  String(value ?? '')
    .split(/[\n,]+/)
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);

export default function ReactivationMysteryBoxReportModal({ open, onClose }: Props) {
  const [form] = Form.useForm();
  const [searchField, setSearchField] = useState<SearchField>('phone');
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>(() => getDefaultFilters());

  useEffect(() => {
    if (open) {
      const defaultFilters = getDefaultFilters();
      form.setFieldsValue(defaultFilters);
      setSearchField('phone');
      setSearchText('');
      setFilters(defaultFilters);
    }
  }, [open, form]);

  const searchCount = useMemo(() => splitSearchTerms(searchText).length, [searchText]);

  const filteredRecords = useMemo(() => {
    return recallBoxOpenRecords.filter((record) => {
      const terms = splitSearchTerms(filters.searchText);

      if (terms.length > 0) {
        const field = (filters.searchField ?? 'phone') as SearchField;
        const value = String(record[field]).toLowerCase();
        if (!terms.some((term) => value.includes(term))) return false;
      }

      if (filters.grantedRange && Array.isArray(filters.grantedRange)) {
        const [start, end] = filters.grantedRange as [Dayjs, Dayjs];
        if (start && end) {
          const grantedAt = dayjs(record.grantedAt);
          if (grantedAt.isBefore(start) || grantedAt.isAfter(end)) return false;
        }
      }

      if (
        filters.openStatus &&
        filters.openStatus !== 'all' &&
        record.openStatus !== filters.openStatus
      ) {
        return false;
      }

      if (
        filters.prizeType &&
        filters.prizeType !== 'all' &&
        record.prizeType !== filters.prizeType
      ) {
        return false;
      }

      if (
        filters.prizeMin !== undefined &&
        filters.prizeMin !== null &&
        record.prizeAmount < filters.prizeMin
      ) {
        return false;
      }

      if (
        filters.prizeMax !== undefined &&
        filters.prizeMax !== null &&
        record.prizeAmount > filters.prizeMax
      ) {
        return false;
      }

      return true;
    });
  }, [filters]);

  const columns: ColumnsType<RecallBoxOpenRecord> = [
    {
      title: '盲盒单号',
      dataIndex: 'orderId',
      width: 170,
      fixed: 'left',
      render: (value) => <Text code>{value}</Text>,
    },
    {
      title: '开盒状态',
      dataIndex: 'openStatus',
      width: 100,
      render: (value: BoxOpenStatus) => {
        const status = statusMap[value];
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    { title: '派发时间', dataIndex: 'grantedAt', width: 170 },
    {
      title: '开盒时间',
      dataIndex: 'claimedAt',
      width: 170,
      render: (value) => (value === '-' ? <Text type="secondary">—</Text> : value),
    },
    { title: '手机号', dataIndex: 'phone', width: 130 },
    { title: '会员账号', dataIndex: 'account', width: 140 },
    { title: 'UID', dataIndex: 'uid', width: 100 },
    {
      title: '中奖奖品',
      dataIndex: 'prizeType',
      width: 120,
      render: (value: PrizeType) => (
        <Tag color={prizeColorMap[value]}>{prizeTypeLabels[value]}</Tag>
      ),
    },
    {
      title: '奖品内容/金额',
      dataIndex: 'prizeValue',
      width: 150,
      render: (value) => <Text strong style={{ color: '#fa8c16' }}>{value}</Text>,
    },
    { title: '名单批次', dataIndex: 'batchId', width: 140 },
  ];

  const handleQuery = () => {
    setFilters({
      ...form.getFieldsValue(),
      searchField,
      searchText,
    });
  };

  const handleReset = () => {
    const defaultFilters = getDefaultFilters();
    form.resetFields();
    form.setFieldsValue(defaultFilters);
    setSearchField('phone');
    setSearchText('');
    setFilters(defaultFilters);
  };

  return (
    <Modal
      title="召回盲盒 - 开盒明细"
      open={open}
      onCancel={onClose}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button data-e2e-id={`${E2E}-footer-close-btn`} onClick={onClose}>
            关闭
          </Button>
        </div>
      }
      width="94%"
      style={{ top: 20 }}
      styles={{ body: { maxHeight: '78vh', overflowY: 'auto', padding: 16 } }}
    >
      <div data-e2e-id={`${E2E}-modal`}>
        <Card size="small" style={{ marginBottom: 12 }}>
          <Form
            form={form}
            layout="inline"
            initialValues={getDefaultFilters()}
            style={{ gap: 8, rowGap: 8, flexWrap: 'wrap' }}
          >
            <Form.Item label={searchFieldOptions.find((item) => item.value === searchField)?.label}>
              <Space direction="vertical" size={2}>
                <Space.Compact>
                  <Select
                    data-e2e-id={`${E2E}-filter-search-field-select`}
                    value={searchField}
                    style={{ width: 100 }}
                    options={searchFieldOptions}
                    onChange={setSearchField}
                  />
                  <Input
                    data-e2e-id={`${E2E}-filter-search-input`}
                    allowClear
                    value={searchText}
                    placeholder="支持批量查询，以 ',' 或换行分隔"
                    style={{ width: 320 }}
                    onChange={(event) => setSearchText(event.target.value)}
                  />
                </Space.Compact>
                <Text
                  data-e2e-id={`${E2E}-filter-search-count-text`}
                  type={searchCount > 5000 ? 'danger' : 'secondary'}
                  style={{ fontSize: 12 }}
                >
                  {searchCount} / 5000
                </Text>
              </Space>
            </Form.Item>

            <Form.Item name="grantedRange" label="派发时间">
              <RangePicker
                data-e2e-id={`${E2E}-filter-granted-range`}
                showTime
                style={{ width: 260 }}
                format="YYYY-MM-DD HH:mm:ss"
              />
            </Form.Item>

            <Form.Item name="openStatus" label="开盒状态">
              <Select
                data-e2e-id={`${E2E}-filter-open-status-select`}
                style={{ width: 110 }}
                options={[
                  { value: 'all', label: '全部' },
                  ...openStatusOptions,
                ]}
              />
            </Form.Item>

            <Form.Item name="prizeType" label="中奖奖品">
              <Select
                data-e2e-id={`${E2E}-filter-prize-type-select`}
                style={{ width: 130 }}
                options={[
                  { value: 'all', label: '全部' },
                  ...prizeTypeOptions,
                ]}
              />
            </Form.Item>

            <Form.Item label="中奖金额">
              <Space.Compact>
                <Form.Item name="prizeMin" noStyle>
                  <InputNumber
                    data-e2e-id={`${E2E}-filter-prize-min-input`}
                    min={0}
                    placeholder="最小"
                    style={{ width: 115 }}
                  />
                </Form.Item>
                <Form.Item name="prizeMax" noStyle>
                  <InputNumber
                    data-e2e-id={`${E2E}-filter-prize-max-input`}
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
                  data-e2e-id={`${E2E}-filter-reset-btn`}
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                >
                  重置
                </Button>
                <Button
                  data-e2e-id={`${E2E}-filter-query-btn`}
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
            data-e2e-id={`${E2E}-toolbar-export-btn`}
            icon={<DownloadOutlined />}
            onClick={() => message.success('已导出 xlsx')}
          >
            导出
          </Button>
          <Button
            data-e2e-id={`${E2E}-toolbar-refresh-btn`}
            icon={<ReloadOutlined />}
            onClick={() => message.success('已刷新')}
          />
          <Button
            data-e2e-id={`${E2E}-toolbar-settings-btn`}
            icon={<SettingOutlined />}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredRecords}
          rowKey="id"
          onRow={(record) =>
            ({
              'data-e2e-id': `${E2E}-table-row-${record.orderId}`,
            } as React.HTMLAttributes<HTMLTableRowElement>)
          }
          size="small"
          scroll={{ x: 1430 }}
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

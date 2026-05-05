'use client';

import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
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
  ColumnHeightOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  depositRecords,
  depositChannels,
  paymentProviders,
  orderStatuses,
  getDepositSummary,
  type DepositRecord,
} from '@/data/depositRecordData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const statusTagMap: Record<string, { color: string }> = {
  '已发起': { color: 'processing' },
  '存款成功': { color: 'success' },
  '存款失败': { color: 'error' },
};

export default function DepositRecordsPage() {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [collapsed, setCollapsed] = useState(false);

  const filtered = useMemo(() => {
    return depositRecords.filter((item) => {
      if (filters.thirdPartyOrderId && !item.thirdPartyOrderId.includes(filters.thirdPartyOrderId)) return false;
      if (filters.memberPhone && !item.memberPhone.includes(filters.memberPhone)) return false;
      if (filters.orderStatus && item.orderStatus !== filters.orderStatus) return false;
      if (filters.paymentChannel && item.paymentChannel !== filters.paymentChannel) return false;
      if (filters.remark && filters.remark !== '-' && !item.remark.includes(filters.remark)) return false;
      if (filters.minAmount && item.depositAmount < filters.minAmount) return false;
      if (filters.maxAmount && item.depositAmount > filters.maxAmount) return false;
      return true;
    });
  }, [filters]);

  const summary = useMemo(() => getDepositSummary(filtered), [filtered]);

  const columns: ColumnsType<DepositRecord> = [
    {
      title: '序号',
      dataIndex: 'seq',
      width: 60,
      fixed: 'left',
    },
    {
      title: '存款订单ID',
      dataIndex: 'depositOrderId',
      width: 150,
      render: (v) => <Text copyable={{ text: v }} style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '三方订单ID',
      dataIndex: 'thirdPartyOrderId',
      width: 160,
      render: (v) => <Text copyable={{ text: v }} style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '会员账号',
      dataIndex: 'memberAccount',
      width: 120,
    },
    {
      title: '会员手机',
      dataIndex: 'memberPhone',
      width: 140,
    },
    {
      title: '订单状态',
      dataIndex: 'orderStatus',
      width: 100,
      render: (v: string, record) => <Tag data-e2e-id={`deposit-records-table-status-tag-${record.depositOrderId}`} color={statusTagMap[v]?.color}>{v}</Tag>,
    },
    {
      title: '存款时间',
      dataIndex: 'depositTime',
      width: 170,
      sorter: (a, b) => a.depositTime.localeCompare(b.depositTime),
    },
    {
      title: '存款账户类型',
      dataIndex: 'depositAccountType',
      width: 120,
    },
    {
      title: '入款账户ID',
      dataIndex: 'paymentAccountId',
      width: 120,
    },
    {
      title: '存款金额',
      dataIndex: 'depositAmount',
      width: 120,
      sorter: (a, b) => a.depositAmount - b.depositAmount,
      render: (v: number) => <Text strong>₱{v.toLocaleString()}</Text>,
    },
    {
      title: '到账时间',
      dataIndex: 'arrivalTime',
      width: 170,
      render: (v) => v === '-' ? <Text type="secondary">—</Text> : v,
    },
    {
      title: '到账金额',
      dataIndex: 'arrivalAmount',
      width: 120,
      render: (v: number) => v > 0 ? <Text strong style={{ color: '#52c41a' }}>₱{v.toLocaleString()}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: '手续费',
      dataIndex: 'fee',
      width: 100,
      render: (v: number) => v > 0 ? `₱${v.toLocaleString()}` : <Text type="secondary">—</Text>,
    },
    {
      title: '支付服务商',
      dataIndex: 'paymentProvider',
      width: 120,
    },
    {
      title: '支付渠道',
      dataIndex: 'paymentChannel',
      width: 120,
    },
    {
      title: '订单来源域名',
      dataIndex: 'orderSourceDomain',
      width: 140,
    },
    {
      title: '取消原因',
      dataIndex: 'cancelReason',
      width: 120,
      render: (v) => v === '-' ? <Text type="secondary">—</Text> : <Text type="danger">{v}</Text>,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 120,
      render: (v, record) => v === '-' ? <Text type="secondary">—</Text> : <Tag data-e2e-id={`deposit-records-table-remark-tag-${record.depositOrderId}`}>{v}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Button
          data-e2e-id={`deposit-records-table-detail-btn-${record.depositOrderId}`}
          type="link"
          size="small"
          onClick={() => message.info(`查看订单 ${record.depositOrderId}`)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>存款记录</Title>
        <Text type="secondary">财务管理 / 存款记录（同步自 FAT 环境）</Text>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" style={{ gap: 8, flexWrap: 'wrap', rowGap: 12 }}>
          <Form.Item name="thirdPartyOrderId" label="三方订单ID">
            <Input data-e2e-id="deposit-records-filter-third-party-order-id-input" placeholder={'支持批量查询，以","分隔'} allowClear style={{ width: 220 }} />
          </Form.Item>
          <Form.Item name="memberPhone" label="会员手机">
            <Input data-e2e-id="deposit-records-filter-member-phone-input" placeholder={'支持批量查询，以","分隔'} allowClear style={{ width: 220 }} />
          </Form.Item>
          <Form.Item name="orderStatus" label="订单状态">
            <Select data-e2e-id="deposit-records-filter-order-status-select" placeholder="请选择" allowClear style={{ width: 130 }}>
              {orderStatuses.map((s) => (
                <Select.Option key={s} value={s}>{s}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="存款金额">
            <Space>
              <Form.Item name="minAmount" noStyle>
                <InputNumber data-e2e-id="deposit-records-filter-min-amount-input" placeholder="最小金额" prefix="₱" style={{ width: 130 }} min={0} />
              </Form.Item>
              <Text type="secondary">~</Text>
              <Form.Item name="maxAmount" noStyle>
                <InputNumber data-e2e-id="deposit-records-filter-max-amount-input" placeholder="最大金额" prefix="₱" style={{ width: 130 }} min={0} />
              </Form.Item>
            </Space>
          </Form.Item>
          {!collapsed && (
            <>
              <Form.Item name="dateRange" label="存款时间">
                <RangePicker data-e2e-id="deposit-records-filter-date-range" showTime style={{ width: 340 }} />
              </Form.Item>
              <Form.Item name="paymentChannel" label="存款渠道名称">
                <Select data-e2e-id="deposit-records-filter-payment-channel-select" placeholder="存款渠道名称" allowClear style={{ width: 160 }}>
                  {depositChannels.map((c) => (
                    <Select.Option key={c} value={c}>{c}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="remark" label="备注">
                <Input data-e2e-id="deposit-records-filter-remark-input" placeholder={'支持批量查询，以","分隔'} allowClear style={{ width: 220 }} />
              </Form.Item>
            </>
          )}
          <Form.Item>
            <Space>
              <Button
                data-e2e-id="deposit-records-filter-query-btn"
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => setFilters(form.getFieldsValue())}
              >
                查 询
              </Button>
              <Button
                data-e2e-id="deposit-records-filter-reset-btn"
                icon={<ReloadOutlined />}
                onClick={() => { form.resetFields(); setFilters({}); }}
              >
                重 置
              </Button>
              <a data-e2e-id="deposit-records-filter-toggle-btn" onClick={() => setCollapsed(!collapsed)} style={{ fontSize: 13 }}>
                {collapsed ? '展开' : '收起'} ▾
              </a>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button data-e2e-id="deposit-records-toolbar-export-btn" icon={<DownloadOutlined />}>导出</Button>
        <Button data-e2e-id="deposit-records-toolbar-refresh-btn" icon={<ReloadOutlined />} />
        <Button data-e2e-id="deposit-records-toolbar-density-btn" icon={<ColumnHeightOutlined />} />
        <Button data-e2e-id="deposit-records-toolbar-settings-btn" icon={<SettingOutlined />} />
      </div>

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="key"
        onRow={(record) => ({ 'data-e2e-id': `deposit-records-table-row-${record.depositOrderId}` } as React.HTMLAttributes<HTMLTableRowElement>)}
        size="small"
        scroll={{ x: 2600 }}
        pagination={{
          pageSize: 20,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        summary={() => (
          <Table.Summary fixed="bottom">
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={1}>
                <Text strong>小计</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} colSpan={1}>
                <Text strong>{summary.total}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={1}>
                <Text strong>{summary.successCount}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} colSpan={1}>
                <Text strong>₱{summary.totalArrival.toLocaleString()}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} colSpan={1}>
                <Text strong>₱{summary.totalFee.toLocaleString()}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} colSpan={14}>
                <Text strong>{summary.successRate}</Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={1}>
                <Text strong>合计</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} colSpan={1}>
                <Text strong>{summary.total}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={1}>
                <Text strong>{summary.successCount}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} colSpan={1}>
                <Text strong>₱{summary.totalArrival.toLocaleString()}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} colSpan={1}>
                <Text strong>₱{summary.totalFee.toLocaleString()}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} colSpan={14}>
                <Text strong>{summary.successRate}</Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </div>
  );
}

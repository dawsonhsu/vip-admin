'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
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
  consolidatedPrizeStatusLabels,
  consolidatedPrizeStatusOptions,
  consolidatedPrizeStatusOrder,
  openStatusLabels,
  prizeTypeLabels,
  prizeTypeOptions,
  recallBoxOpenRecords,
  toConsolidatedPrizeStatus,
  type BoxOpenStatus,
  type ConsolidatedPrizeStatus,
  type PrizeType,
  type RecallBoxOpenRecord,
} from '@/data/reactivationMysteryBoxData';

const { Text } = Typography;
const { RangePicker } = DatePicker;

type SearchField = 'phone' | 'account' | 'uid' | 'batchId';

const E2E = 'reactivation-mystery-box-report-modal';

const searchFieldOptions: { value: SearchField; label: string }[] = [
  { value: 'phone', label: '手机' },
  { value: 'account', label: '账号' },
  { value: 'uid', label: 'UID' },
  { value: 'batchId', label: '批次' },
];

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

interface ReportFilters {
  grantedRange?: [Dayjs, Dayjs];
  prizeType?: PrizeType | 'all';
  prizeStatus?: ConsolidatedPrizeStatus | 'all';
  payoutMin?: number | null;
  payoutMax?: number | null;
  searchField?: SearchField;
  searchText?: string;
}

interface TypeStat {
  type: PrizeType;
  count: number;
  statusCounts: Partial<Record<ConsolidatedPrizeStatus, number>>;
  moneyTotal: number;
  unitTotal: number;
}

interface ReportStats {
  claimedCount: number;
  fulfilledCount: number;
  processingCount: number;
  totalPaid: number;
  byType: TypeStat[];
}

const getDefaultFilters = (): ReportFilters => ({
  grantedRange: [
    dayjs('2026-06-18 00:00:00'),
    dayjs('2026-06-18 23:59:59'),
  ],
  prizeType: 'all',
  prizeStatus: 'all',
});

const splitSearchTerms = (value?: string) =>
  String(value ?? '')
    .split(/[\n,]+/)
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);

const dash = <Text type="secondary">—</Text>;

const formatNumber = (value?: number | null) =>
  typeof value === 'number' ? value.toLocaleString('en-US') : '—';

const formatCurrency = (value?: number | null) =>
  typeof value === 'number'
    ? `₱${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : '—';

const formatPercent = (value?: number | null) =>
  typeof value === 'number'
    ? `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}%`
    : '—';

const formatDateTime = (value?: string) => (value && value !== '-' ? value : '—');

const formatShortDateTime = (value?: string) => {
  if (!value || value === '-') return '—';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('MM-DD HH:mm') : value;
};

const getCountUnit = (record: RecallBoxOpenRecord) => {
  if (record.prizeType === 'freeSpins') return '次';
  if (record.prizeType === 'filCoins') return '枚';
  return '';
};

const formatPrizeValue = (record: RecallBoxOpenRecord) => {
  if (!record.prizeValueKind || typeof record.prizeValue !== 'number') return '—';
  if (record.prizeValueKind === 'amount') return formatCurrency(record.prizeValue);
  if (record.prizeValueKind === 'ratio') return formatPercent(record.prizeValue);

  const unit = getCountUnit(record);
  return `${formatNumber(record.prizeValue)}${unit ? ` ${unit}` : ''}`;
};

const formatPayoutValue = (record: RecallBoxOpenRecord) => {
  if (record.prizeStatus === 'calculating') return '待结算';
  return formatCurrency(record.payoutAmount);
};

const renderDateTime = (value?: string) => {
  const text = formatDateTime(value);
  return text === '—' ? dash : text;
};

const renderCurrencyCell = (value?: number | null) => {
  const text = formatCurrency(value);
  return text === '—' ? dash : <Text strong>{text}</Text>;
};

const passesCommonFilters = (record: RecallBoxOpenRecord, filters: ReportFilters) => {
  const terms = splitSearchTerms(filters.searchText);

  if (terms.length > 0) {
    const field = filters.searchField ?? 'phone';
    const value = String(record[field] ?? '').toLowerCase();
    if (!terms.some((term) => value.includes(term))) return false;
  }

  if (filters.grantedRange) {
    const [start, end] = filters.grantedRange;
    if (start && end) {
      const grantedAt = dayjs(record.grantedAt);
      if (grantedAt.isBefore(start) || grantedAt.isAfter(end)) return false;
    }
  }

  return true;
};

const passesPrizeFilters = (record: RecallBoxOpenRecord, filters: ReportFilters) => {
  if (filters.prizeType && filters.prizeType !== 'all' && record.prizeType !== filters.prizeType) {
    return false;
  }

  if (
    filters.prizeStatus &&
    filters.prizeStatus !== 'all' &&
    toConsolidatedPrizeStatus(record.prizeStatus) !== filters.prizeStatus
  ) {
    return false;
  }

  if (filters.payoutMin !== undefined && filters.payoutMin !== null) {
    if (typeof record.payoutAmount !== 'number' || record.payoutAmount < filters.payoutMin) {
      return false;
    }
  }

  if (filters.payoutMax !== undefined && filters.payoutMax !== null) {
    if (typeof record.payoutAmount !== 'number' || record.payoutAmount > filters.payoutMax) {
      return false;
    }
  }

  return true;
};

export default function ReactivationMysteryBoxReportModal({ open, onClose }: Props) {
  const [form] = Form.useForm<ReportFilters>();
  const [activeTab, setActiveTab] = useState<BoxOpenStatus>('claimed');
  const [searchField, setSearchField] = useState<SearchField>('phone');
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<ReportFilters>(() => getDefaultFilters());
  const [selectedRecord, setSelectedRecord] = useState<RecallBoxOpenRecord | null>(null);

  useEffect(() => {
    if (open) {
      const defaultFilters = getDefaultFilters();
      form.setFieldsValue(defaultFilters);
      setSearchField('phone');
      setSearchText('');
      setFilters(defaultFilters);
      setActiveTab('claimed');
    }
    setSelectedRecord(null);
  }, [open, form]);

  const searchCount = useMemo(() => splitSearchTerms(searchText).length, [searchText]);

  const pendingRecords = useMemo(() => {
    return recallBoxOpenRecords.filter(
      (record) => record.openStatus === 'pending' && passesCommonFilters(record, filters),
    );
  }, [filters]);

  const claimedRecords = useMemo(() => {
    return recallBoxOpenRecords.filter(
      (record) =>
        record.openStatus === 'claimed' &&
        passesCommonFilters(record, filters) &&
        passesPrizeFilters(record, filters),
    );
  }, [filters]);

  const pendingCount = pendingRecords.length;
  const claimedCount = claimedRecords.length;
  const tableRecords = activeTab === 'pending' ? pendingRecords : claimedRecords;

  const stats = useMemo<ReportStats>(() => {
    const byType = new Map<PrizeType, TypeStat>();
    let fulfilledCount = 0;
    let processingCount = 0;
    let totalPaid = 0;

    claimedRecords.forEach((record) => {
      const consolidatedStatus = toConsolidatedPrizeStatus(record.prizeStatus);
      if (consolidatedStatus === 'fulfilled') fulfilledCount += 1;
      if (consolidatedStatus === 'calculating' || consolidatedStatus === 'pendingUse') {
        processingCount += 1;
      }
      if (typeof record.payoutAmount === 'number') totalPaid += record.payoutAmount;

      if (!record.prizeType) return;
      const typeStat = byType.get(record.prizeType) ?? {
        type: record.prizeType,
        count: 0,
        statusCounts: {},
        moneyTotal: 0,
        unitTotal: 0,
      };
      typeStat.count += 1;
      if (consolidatedStatus) {
        typeStat.statusCounts[consolidatedStatus] =
          (typeStat.statusCounts[consolidatedStatus] ?? 0) + 1;
      }
      if (typeof record.payoutAmount === 'number') {
        typeStat.moneyTotal += record.payoutAmount;
      }
      if (record.prizeValueKind === 'count' && typeof record.prizeValue === 'number') {
        typeStat.unitTotal += record.prizeValue;
      }
      byType.set(record.prizeType, typeStat);
    });

    return {
      claimedCount: claimedRecords.length,
      fulfilledCount,
      processingCount,
      totalPaid,
      byType: prizeTypeOptions
        .map((option) => byType.get(option.value as PrizeType))
        .filter((item): item is TypeStat => Boolean(item)),
    };
  }, [claimedRecords]);

  const operationColumn: ColumnsType<RecallBoxOpenRecord>[number] = {
    title: '操作',
    key: 'action',
    width: 90,
    fixed: 'right',
    render: (_value, record) => (
      <Button
        data-e2e-id={`${E2E}-detail-btn-${record.orderId}`}
        type="link"
        size="small"
        onClick={() => setSelectedRecord(record)}
      >
        详情
      </Button>
    ),
  };

  const pendingColumns: ColumnsType<RecallBoxOpenRecord> = [
    {
      title: '盲盒单号',
      dataIndex: 'orderId',
      width: 180,
      fixed: 'left',
      render: (value: string) => <Text code>{value}</Text>,
    },
    { title: '派发时间', dataIndex: 'grantedAt', width: 170 },
    {
      title: '手机号 / 会员账号 / UID',
      dataIndex: 'phone',
      width: 220,
      render: (_value: string, record) => (
        <Space direction="vertical" size={0}>
          <Text>{record.phone}</Text>
          <Text type="secondary">{record.account}</Text>
          <Text type="secondary">{record.uid}</Text>
        </Space>
      ),
    },
    { title: '名单批次', dataIndex: 'batchId', width: 140 },
    operationColumn,
  ];

  const claimedColumns: ColumnsType<RecallBoxOpenRecord> = [
    {
      title: '盲盒单号',
      dataIndex: 'orderId',
      width: 180,
      fixed: 'left',
      render: (value: string) => <Text code>{value}</Text>,
    },
    { title: '派发时间', dataIndex: 'grantedAt', width: 170 },
    {
      title: '开盒时间',
      dataIndex: 'claimedAt',
      width: 170,
      render: (value: string) => renderDateTime(value),
    },
    {
      title: '手机号 / 会员账号 / UID',
      dataIndex: 'phone',
      width: 220,
      render: (_value: string, record) => (
        <Space direction="vertical" size={0}>
          <Text>{record.phone}</Text>
          <Text type="secondary">{record.account}</Text>
          <Text type="secondary">{record.uid}</Text>
        </Space>
      ),
    },
    {
      title: '奖品种类',
      dataIndex: 'prizeType',
      width: 110,
      render: (value?: PrizeType) => (value ? prizeTypeLabels[value] : dash),
    },
    {
      title: '金额 (₱)',
      dataIndex: 'prizeValue',
      width: 100,
      render: (_value: number | undefined, record) =>
        record.prizeValueKind === 'amount' ? renderCurrencyCell(record.prizeValue) : dash,
    },
    {
      title: '比例 (%)',
      dataIndex: 'prizeValue',
      width: 90,
      render: (_value: number | undefined, record) =>
        record.prizeValueKind === 'ratio' && typeof record.prizeValue === 'number'
          ? formatPercent(record.prizeValue)
          : dash,
    },
    {
      title: '次数/数量',
      dataIndex: 'prizeValue',
      width: 100,
      render: (_value: number | undefined, record) =>
        record.prizeValueKind === 'count' && typeof record.prizeValue === 'number'
          ? formatNumber(record.prizeValue)
          : dash,
    },
    {
      title: '奖品状态',
      dataIndex: 'prizeStatus',
      width: 140,
      render: (_value, record) => {
        const consolidatedStatus = toConsolidatedPrizeStatus(record.prizeStatus);
        if (!consolidatedStatus) return dash;
        if (consolidatedStatus === 'calculating') {
          return (
            <Space direction="vertical" size={0}>
              <span>{consolidatedPrizeStatusLabels[consolidatedStatus]}</span>
              <Text type="secondary" style={{ fontSize: 12 }}>
                至 {formatShortDateTime(record.rebateWindowEnd)}
              </Text>
            </Space>
          );
        }
        return consolidatedPrizeStatusLabels[consolidatedStatus];
      },
    },
    {
      title: '实际派发金额 (₱)',
      dataIndex: 'payoutAmount',
      width: 140,
      render: (_value: number | null | undefined, record) => {
        if (record.prizeStatus === 'calculating') {
          return <Text type="secondary">待结算</Text>;
        }
        return renderCurrencyCell(record.payoutAmount);
      },
    },
    { title: '名单批次', dataIndex: 'batchId', width: 140 },
    operationColumn,
  ];

  const statColumns: ColumnsType<TypeStat> = [
    {
      title: '奖品种类',
      dataIndex: 'type',
      width: 150,
      render: (type: PrizeType) => prizeTypeLabels[type],
    },
    { title: '笔数', dataIndex: 'count', width: 100 },
    {
      title: '状态分布',
      dataIndex: 'statusCounts',
      render: (statusCounts: TypeStat['statusCounts']) =>
        consolidatedPrizeStatusOrder
          .filter((status) => (statusCounts[status] ?? 0) > 0)
          .map((status) => `${consolidatedPrizeStatusLabels[status]} ${statusCounts[status]}`)
          .join(' / '),
    },
    {
      title: '合计产值',
      key: 'totalValue',
      width: 180,
      render: (_value, record) => {
        if (record.type === 'freeSpins') return `${formatNumber(record.unitTotal)} 次`;
        if (record.type === 'filCoins') return `${formatNumber(record.unitTotal)} 枚`;
        return formatCurrency(record.moneyTotal);
      },
    },
  ];

  const handleQuery = () => {
    setFilters({
      ...form.getFieldsValue(true),
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
    setActiveTab('claimed');
  };

  const renderPrizeType = (record: RecallBoxOpenRecord) => {
    if (!record.prizeType) return dash;
    return <Tag color={prizeColorMap[record.prizeType]}>{prizeTypeLabels[record.prizeType]}</Tag>;
  };

  const renderDrawerValue = (id: string, value: React.ReactNode) => (
    <span data-e2e-id={`${E2E}-detail-${id}`}>{value}</span>
  );

  const renderRebateDetail = (record: RecallBoxOpenRecord) => {
    if (record.prizeType !== 'rebateCoupon') return null;

    return (
      <Card size="small" title="返水券结算" style={{ marginTop: 12 }}>
        {record.prizeStatus === 'calculating' && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            message="开盒后 24 小时内的有效投注 × 返水比例，期满自动派发（不超过上限）"
          />
        )}
        <Descriptions size="small" column={1}>
          <Descriptions.Item label="计算窗口">
            {renderDrawerValue(
              'rebate-window',
              `${formatDateTime(record.rebateWindowStart)} ~ ${formatDateTime(
                record.rebateWindowEnd,
              )}（24 小时）`,
            )}
          </Descriptions.Item>
          <Descriptions.Item label="累计有效投注">
            {renderDrawerValue(
              'rebate-turnover',
              typeof record.rebateValidTurnover === 'number'
                ? formatCurrency(record.rebateValidTurnover)
                : dash,
            )}
          </Descriptions.Item>
          <Descriptions.Item label="返水比例或固定金额">
            {renderDrawerValue('rebate-value', formatPrizeValue(record))}
          </Descriptions.Item>
          <Descriptions.Item label="派发上限">
            {renderDrawerValue('rebate-cap', formatCurrency(record.rebateBonusCap))}
          </Descriptions.Item>
          <Descriptions.Item label="实际派发金额">
            {renderDrawerValue('rebate-payout', formatPayoutValue(record))}
          </Descriptions.Item>
          <Descriptions.Item label="派发时间">
            {renderDrawerValue('rebate-settled-at', formatDateTime(record.rebateSettledAt))}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  const renderDepositDetail = (record: RecallBoxOpenRecord) => {
    if (record.prizeType !== 'depositCoupon') return null;

    return (
      <Card size="small" title="存款券使用" style={{ marginTop: 12 }}>
        <Descriptions size="small" column={1}>
          <Descriptions.Item label="最低存款">
            {renderDrawerValue('coupon-min-deposit', formatCurrency(record.couponMinDeposit))}
          </Descriptions.Item>
          <Descriptions.Item label="使用期限">
            {renderDrawerValue('coupon-expire-at', formatDateTime(record.couponExpireAt))}
          </Descriptions.Item>
          <Descriptions.Item label="使用时间">
            {renderDrawerValue('coupon-used-at', formatDateTime(record.couponUsedAt))}
          </Descriptions.Item>
          <Descriptions.Item label="加赠金额">
            {renderDrawerValue('coupon-payout', formatCurrency(record.payoutAmount))}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
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
        <Tabs
          data-e2e-id={`${E2E}-filter-open-status-select`}
          activeKey={activeTab}
          items={[
            {
              key: 'pending',
              label: (
                <span data-e2e-id={`${E2E}-stats-pending`}>未开盒 ({pendingCount})</span>
              ),
            },
            { key: 'claimed', label: `已开盒 (${claimedCount})` },
          ]}
          onChange={(key) => setActiveTab(key as BoxOpenStatus)}
        />

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

            {activeTab === 'claimed' && (
              <>
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

                <Form.Item name="prizeStatus" label="奖品状态">
                  <Select
                    data-e2e-id={`${E2E}-filter-prize-status-select`}
                    style={{ width: 120 }}
                    options={[
                      { value: 'all', label: '全部' },
                      ...consolidatedPrizeStatusOptions,
                    ]}
                  />
                </Form.Item>

                <Form.Item label="实际派发金额">
                  <Space.Compact>
                    <Form.Item name="payoutMin" noStyle>
                      <InputNumber
                        data-e2e-id={`${E2E}-filter-payout-min-input`}
                        min={0}
                        placeholder="最小"
                        style={{ width: 115 }}
                      />
                    </Form.Item>
                    <Form.Item name="payoutMax" noStyle>
                      <InputNumber
                        data-e2e-id={`${E2E}-filter-payout-max-input`}
                        min={0}
                        placeholder="最大"
                        style={{ width: 115 }}
                      />
                    </Form.Item>
                  </Space.Compact>
                </Form.Item>
              </>
            )}

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

        {activeTab === 'claimed' && (
          <Card size="small" style={{ marginBottom: 12 }}>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  data-e2e-id={`${E2E}-stats-claimed-count`}
                  title="已开盒笔数"
                  value={stats.claimedCount}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  data-e2e-id={`${E2E}-stats-fulfilled-count`}
                  title="已派发笔数"
                  value={stats.fulfilledCount}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  data-e2e-id={`${E2E}-stats-processing-count`}
                  title="进行中笔数"
                  value={stats.processingCount}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  data-e2e-id={`${E2E}-stats-total-paid`}
                  title="累计实际派发"
                  value={formatCurrency(stats.totalPaid)}
                />
              </Col>
            </Row>

            <Table<TypeStat>
              columns={statColumns}
              dataSource={stats.byType}
              rowKey="type"
              onRow={(record) => {
                const legacyIdByType: Record<PrizeType, string> = {
                  bonus: 'bonus',
                  depositCoupon: 'deposit',
                  rebateCoupon: 'rebate',
                  freeSpins: 'free-spins',
                  filCoins: 'fil-coins',
                };
                return {
                  'data-e2e-id': `${E2E}-stats-${legacyIdByType[record.type]}`,
                } as React.HTMLAttributes<HTMLTableRowElement>;
              }}
              size="small"
              pagination={false}
            />
          </Card>
        )}

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
          columns={activeTab === 'pending' ? pendingColumns : claimedColumns}
          dataSource={tableRecords}
          rowKey="id"
          onRow={(record) =>
            ({
              'data-e2e-id': `${E2E}-table-row-${record.orderId}`,
            } as React.HTMLAttributes<HTMLTableRowElement>)
          }
          size="small"
          scroll={{ x: activeTab === 'pending' ? 900 : 1720 }}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `共 ${total} 笔`,
            showSizeChanger: true,
          }}
        />

        <Drawer
          data-e2e-id={`${E2E}-detail-drawer`}
          title="开盒详情"
          placement="right"
          width={520}
          open={Boolean(selectedRecord)}
          onClose={() => setSelectedRecord(null)}
          zIndex={1100}
        >
          {selectedRecord && (
            <div>
              <Card size="small" title="基础信息">
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="盲盒单号">
                    {renderDrawerValue('order-id', <Text code>{selectedRecord.orderId}</Text>)}
                  </Descriptions.Item>
                  <Descriptions.Item label="名单批次">
                    {renderDrawerValue('batch-id', selectedRecord.batchId)}
                  </Descriptions.Item>
                  <Descriptions.Item label="会员账号">
                    {renderDrawerValue('account', selectedRecord.account)}
                  </Descriptions.Item>
                  <Descriptions.Item label="手机号">
                    {renderDrawerValue('phone', selectedRecord.phone)}
                  </Descriptions.Item>
                  <Descriptions.Item label="UID">
                    {renderDrawerValue('uid', selectedRecord.uid)}
                  </Descriptions.Item>
                  <Descriptions.Item label="派发时间">
                    {renderDrawerValue('granted-at', selectedRecord.grantedAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label="开盒状态">
                    {renderDrawerValue('open-status', openStatusLabels[selectedRecord.openStatus])}
                  </Descriptions.Item>
                  <Descriptions.Item label="开盒时间">
                    {renderDrawerValue('claimed-at', formatDateTime(selectedRecord.claimedAt))}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {selectedRecord.openStatus === 'claimed' && (
                <>
                  <Card size="small" title="奖品信息" style={{ marginTop: 12 }}>
                    <Descriptions size="small" column={1}>
                      <Descriptions.Item label="奖品种类">
                        {renderDrawerValue('prize-type', renderPrizeType(selectedRecord))}
                      </Descriptions.Item>
                      <Descriptions.Item label="奖品数值">
                        {renderDrawerValue('prize-value', formatPrizeValue(selectedRecord))}
                      </Descriptions.Item>
                      <Descriptions.Item label="奖品状态">
                        {renderDrawerValue(
                          'prize-status',
                          selectedRecord.prizeStatus
                            ? consolidatedPrizeStatusLabels[
                                toConsolidatedPrizeStatus(selectedRecord.prizeStatus)!
                              ]
                            : '—',
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="实际派发金额">
                        {renderDrawerValue('payout', formatPayoutValue(selectedRecord))}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>

                  {renderRebateDetail(selectedRecord)}
                  {renderDepositDetail(selectedRecord)}
                </>
              )}
            </div>
          )}
        </Drawer>
      </div>
    </Modal>
  );
}

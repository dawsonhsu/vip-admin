'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
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
  openStatusLabels,
  openStatusOptions,
  prizeStatusLabels,
  prizeStatusOptions,
  prizeTypeLabels,
  prizeTypeOptions,
  recallBoxOpenRecords,
  type BoxOpenStatus,
  type PrizeStatus,
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

interface ReportStats {
  pending: number;
  bonus: { count: number; amount: number };
  deposit: { count: number; unused: number; used: number; expired: number; paid: number };
  rebate: { count: number; calculating: number; settled: number; voided: number; paid: number };
  freeSpins: { count: number; total: number };
  filCoins: { count: number; total: number };
}

const getDefaultFilters = (): Record<string, any> => ({
  grantedRange: [
    dayjs('2026-06-18 00:00:00'),
    dayjs('2026-06-18 23:59:59'),
  ],
  openStatus: 'all',
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

const renderStatItem = (id: string, content: React.ReactNode) => (
  <div
    key={id}
    data-e2e-id={`${E2E}-stats-${id}`}
    style={{
      flex: '1 1 210px',
      minWidth: 180,
      lineHeight: 1.7,
      whiteSpace: 'normal',
    }}
  >
    {content}
  </div>
);

const createEmptyStats = (): ReportStats => ({
  pending: 0,
  bonus: { count: 0, amount: 0 },
  deposit: { count: 0, unused: 0, used: 0, expired: 0, paid: 0 },
  rebate: { count: 0, calculating: 0, settled: 0, voided: 0, paid: 0 },
  freeSpins: { count: 0, total: 0 },
  filCoins: { count: 0, total: 0 },
});

export default function ReactivationMysteryBoxReportModal({ open, onClose }: Props) {
  const [form] = Form.useForm();
  const [searchField, setSearchField] = useState<SearchField>('phone');
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>(() => getDefaultFilters());
  const [selectedRecord, setSelectedRecord] = useState<RecallBoxOpenRecord | null>(null);

  useEffect(() => {
    if (open) {
      const defaultFilters = getDefaultFilters();
      form.setFieldsValue(defaultFilters);
      setSearchField('phone');
      setSearchText('');
      setFilters(defaultFilters);
    }
    setSelectedRecord(null);
  }, [open, form]);

  const searchCount = useMemo(() => splitSearchTerms(searchText).length, [searchText]);

  const filteredRecords = useMemo(() => {
    return recallBoxOpenRecords.filter((record) => {
      const terms = splitSearchTerms(filters.searchText);

      if (terms.length > 0) {
        const field = (filters.searchField ?? 'phone') as SearchField;
        const value = String(record[field] ?? '').toLowerCase();
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
        filters.prizeStatus &&
        filters.prizeStatus !== 'all' &&
        record.prizeStatus !== filters.prizeStatus
      ) {
        return false;
      }

      const payoutMin = filters.payoutMin;
      if (payoutMin !== undefined && payoutMin !== null) {
        if (typeof record.payoutAmount !== 'number' || record.payoutAmount < payoutMin) {
          return false;
        }
      }

      const payoutMax = filters.payoutMax;
      if (payoutMax !== undefined && payoutMax !== null) {
        if (typeof record.payoutAmount !== 'number' || record.payoutAmount > payoutMax) {
          return false;
        }
      }

      return true;
    });
  }, [filters]);

  const stats = useMemo(() => {
    const nextStats = createEmptyStats();

    filteredRecords.forEach((record) => {
      if (record.openStatus === 'pending') {
        nextStats.pending += 1;
        return;
      }

      if (record.prizeType === 'bonus') {
        nextStats.bonus.count += 1;
        nextStats.bonus.amount += typeof record.payoutAmount === 'number' ? record.payoutAmount : 0;
        return;
      }

      if (record.prizeType === 'depositCoupon') {
        nextStats.deposit.count += 1;
        if (record.prizeStatus === 'unused') nextStats.deposit.unused += 1;
        if (record.prizeStatus === 'used') nextStats.deposit.used += 1;
        if (record.prizeStatus === 'expired') nextStats.deposit.expired += 1;
        nextStats.deposit.paid += typeof record.payoutAmount === 'number' ? record.payoutAmount : 0;
        return;
      }

      if (record.prizeType === 'rebateCoupon') {
        nextStats.rebate.count += 1;
        if (record.prizeStatus === 'calculating') nextStats.rebate.calculating += 1;
        if (record.prizeStatus === 'settled') nextStats.rebate.settled += 1;
        if (record.prizeStatus === 'voided') nextStats.rebate.voided += 1;
        nextStats.rebate.paid += typeof record.payoutAmount === 'number' ? record.payoutAmount : 0;
        return;
      }

      if (record.prizeType === 'freeSpins') {
        nextStats.freeSpins.count += 1;
        nextStats.freeSpins.total +=
          record.prizeValueKind === 'count' && typeof record.prizeValue === 'number'
            ? record.prizeValue
            : 0;
        return;
      }

      if (record.prizeType === 'filCoins') {
        nextStats.filCoins.count += 1;
        nextStats.filCoins.total +=
          record.prizeValueKind === 'count' && typeof record.prizeValue === 'number'
            ? record.prizeValue
            : 0;
      }
    });

    return nextStats;
  }, [filteredRecords]);

  const columns: ColumnsType<RecallBoxOpenRecord> = [
    {
      title: '盲盒单号',
      dataIndex: 'orderId',
      width: 180,
      fixed: 'left',
      render: (value: string) => <Text code>{value}</Text>,
    },
    {
      title: '开盒状态',
      dataIndex: 'openStatus',
      width: 90,
      render: (value: BoxOpenStatus) => openStatusLabels[value],
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
      render: (value: PrizeStatus | undefined, record) => {
        if (!value) return dash;
        if (value === 'calculating') {
          return (
            <Space direction="vertical" size={0}>
              <span>{prizeStatusLabels[value]}</span>
              <Text type="secondary" style={{ fontSize: 12 }}>
                至 {formatShortDateTime(record.rebateWindowEnd)}
              </Text>
            </Space>
          );
        }
        return prizeStatusLabels[value];
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
    {
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
    const defaultFilters = getDefaultFilters();
    form.resetFields();
    form.setFieldsValue(defaultFilters);
    setSearchField('phone');
    setSearchText('');
    setFilters(defaultFilters);
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

            <Form.Item name="prizeStatus" label="奖品状态">
              <Select
                data-e2e-id={`${E2E}-filter-prize-status-select`}
                style={{ width: 120 }}
                options={[
                  { value: 'all', label: '全部' },
                  ...prizeStatusOptions,
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

        <Card size="small" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
            {renderStatItem('pending', `未开盒 ${stats.pending} 笔`)}
            {renderStatItem(
              'bonus',
              `彩金: ${stats.bonus.count} 笔 · 合计 ${formatCurrency(stats.bonus.amount)}`,
            )}
            {renderStatItem(
              'deposit',
              `存款券: ${stats.deposit.count} 笔（待使用 ${stats.deposit.unused} / 已使用 ${stats.deposit.used} / 已过期 ${stats.deposit.expired}）· 已派发加赠 ${formatCurrency(stats.deposit.paid)}`,
            )}
            {renderStatItem(
              'rebate',
              `返水券: ${stats.rebate.count} 笔（计算中 ${stats.rebate.calculating} / 已派发 ${stats.rebate.settled} / 已作废 ${stats.rebate.voided}）· 已派发 ${formatCurrency(stats.rebate.paid)}`,
            )}
            {renderStatItem(
              'free-spins',
              `Free Spins: ${stats.freeSpins.count} 笔 · 合计 ${formatNumber(stats.freeSpins.total)} 次`,
            )}
            {renderStatItem(
              'fil-coins',
              `FilCoins: ${stats.filCoins.count} 笔 · 合计 ${formatNumber(stats.filCoins.total)} 枚`,
            )}
          </div>
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
          scroll={{ x: 1820 }}
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
                      selectedRecord.prizeStatus ? prizeStatusLabels[selectedRecord.prizeStatus] : '—',
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="实际派发金额">
                    {renderDrawerValue('payout', formatPayoutValue(selectedRecord))}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {renderRebateDetail(selectedRecord)}
              {renderDepositDetail(selectedRecord)}
            </div>
          )}
        </Drawer>
      </div>
    </Modal>
  );
}

'use client';

import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import {
  DownloadOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  generateLossRebateReport,
  type LossRebateBreakdownRow,
  type LossRebateReportRow,
} from '@/data/lossRebateReportData';
import {
  DEFAULT_LOSS_REBATE_SETTINGS,
  VIP_TIERS,
} from '@/data/lossRebateConfig';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const E2E = 'loss-rebate-report-modal';

const { minNetLoss, rebateCap, rolloverMultiplier } =
  DEFAULT_LOSS_REBATE_SETTINGS;

interface ReportFilters {
  account?: string;
  uid?: string;
  phone?: string;
  vipLevel?: number;
  vipTier?: string;
  statDateRange?: [Dayjs, Dayjs];
}

const formatCurrency = (value: number) =>
  `₱ ${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const escapeCsvCell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const downloadCsv = (rows: LossRebateReportRow[]) => {
  const csvRows: (string | number)[][] = [
    [
      '序號',
      '玩家帳號',
      '會員UID',
      '手機號',
      'VIP等級',
      'VIP分級',
      '統計日期',
      '有效投注額',
      '派彩金額',
      '淨輸值',
      '封頂前返利',
      '實派返利金額',
      '是否封頂',
      '打碼要求',
      '派發時間',
    ],
    ...rows.map((row) => [
      row.id,
      row.account,
      row.uid,
      row.phone,
      `V${row.vipLevel}`,
      row.vipTier,
      row.statDate,
      row.effectiveBet.toFixed(2),
      row.payout.toFixed(2),
      row.netLoss.toFixed(2),
      row.rebateBeforeCap.toFixed(2),
      row.rebateAmount.toFixed(2),
      row.capped ? '是' : '否',
      row.rolloverRequired.toFixed(2),
      row.dispatchedAt,
    ]),
  ];
  const content = `\uFEFF${csvRows
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\n')}`;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.setAttribute('download', 'loss-rebate-report.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
};

interface LossRebateReportModalProps {
  open: boolean;
  onClose: () => void;
}

const statisticCardStyle: React.CSSProperties = { height: '100%' };
const statisticValueStyle: React.CSSProperties = {
  fontSize: 22,
  lineHeight: 1.25,
  whiteSpace: 'nowrap',
};

export default function LossRebateReportModal({ open, onClose }: LossRebateReportModalProps) {
  const [form] = Form.useForm<ReportFilters>();
  const [filters, setFilters] = useState<ReportFilters>({});
  const [allRows] = useState(() => generateLossRebateReport());
  const [selectedRow, setSelectedRow] = useState<LossRebateReportRow | null>(null);

  const filteredRows = useMemo(
    () =>
      allRows.filter((row) => {
        if (
          filters.account &&
          !row.account.toLowerCase().includes(filters.account.toLowerCase())
        ) {
          return false;
        }
        if (filters.uid && !row.uid.includes(filters.uid)) return false;
        if (filters.phone && !row.phone.includes(filters.phone)) return false;
        if (filters.vipLevel !== undefined && row.vipLevel !== filters.vipLevel) {
          return false;
        }
        if (filters.vipTier && row.vipTier !== filters.vipTier) return false;
        if (filters.statDateRange?.length === 2) {
          const statDate = dayjs(row.statDate);
          if (
            statDate.isBefore(filters.statDateRange[0].startOf('day')) ||
            statDate.isAfter(filters.statDateRange[1].endOf('day'))
          ) {
            return false;
          }
        }
        return true;
      }),
    [allRows, filters]
  );

  const stats = useMemo(() => {
    const totalNetLoss = filteredRows.reduce((sum, row) => sum + row.netLoss, 0);
    const totalRebate = filteredRows.reduce((sum, row) => sum + row.rebateAmount, 0);
    const totalRollover = filteredRows.reduce(
      (sum, row) => sum + row.rolloverRequired,
      0
    );

    return {
      members: new Set(filteredRows.map((row) => row.uid)).size,
      totalNetLoss,
      totalRebate,
      totalRollover,
    };
  }, [filteredRows]);

  const columns: ColumnsType<LossRebateReportRow> = [
    { title: '序號', dataIndex: 'id', width: 70, fixed: 'left' },
    {
      title: '玩家帳號',
      dataIndex: 'account',
      width: 140,
      fixed: 'left',
      render: (value, row) => (
        <a
          data-e2e-id={`${E2E}-table-account-${row.id}`}
          style={{ color: '#1668dc' }}
        >
          {value}
        </a>
      ),
    },
    { title: '會員UID', dataIndex: 'uid', width: 100 },
    { title: '手機號', dataIndex: 'phone', width: 130 },
    {
      title: 'VIP等級',
      dataIndex: 'vipLevel',
      width: 100,
      render: (value) => `V${value}`,
    },
    { title: 'VIP分級', dataIndex: 'vipTier', width: 100 },
    { title: '統計日期', dataIndex: 'statDate', width: 120 },
    {
      title: '有效投注額',
      dataIndex: 'effectiveBet',
      width: 130,
      align: 'right',
      render: formatCurrency,
    },
    {
      title: '派彩金額',
      dataIndex: 'payout',
      width: 130,
      align: 'right',
      render: formatCurrency,
    },
    {
      title: '淨輸值',
      dataIndex: 'netLoss',
      width: 130,
      align: 'right',
      render: formatCurrency,
    },
    {
      title: '封頂前返利',
      dataIndex: 'rebateBeforeCap',
      width: 130,
      align: 'right',
      render: formatCurrency,
    },
    {
      title: '實派返利金額',
      dataIndex: 'rebateAmount',
      width: 140,
      align: 'right',
      render: (value: number, row) => (
        <>
          <Text style={{ color: '#faad14' }}>{formatCurrency(value)}</Text>
          {row.capped ? (
            <Text type="secondary" style={{ fontSize: 12 }}>
              （已封頂）
            </Text>
          ) : null}
        </>
      ),
    },
    {
      title: '打碼要求',
      dataIndex: 'rolloverRequired',
      width: 120,
      align: 'right',
      render: formatCurrency,
    },
    { title: '派發時間', dataIndex: 'dispatchedAt', width: 170 },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, row) => (
        <Button
          data-e2e-id={`${E2E}-table-detail-btn-${row.id}`}
          type="link"
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedRow(row);
          }}
        >
          明細
        </Button>
      ),
    },
  ];

  const detailColumns: ColumnsType<LossRebateBreakdownRow> = [
    {
      title: '命中規則',
      dataIndex: 'ruleTier',
      width: 120,
      render: (value: LossRebateBreakdownRow['ruleTier']) =>
        value === 'game' ? '指定遊戲' : 'VIP×遊戲類型',
    },
    {
      title: '統計對象',
      key: 'target',
      width: 240,
      render: (_, row) =>
        row.ruleTier === 'game' ? (
          <div>
            <div>{row.groupName}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.groupGames?.join('、')}
            </Text>
          </div>
        ) : (
          row.gameTypes.join('、')
        ),
    },
    {
      title: '遊戲類型',
      dataIndex: 'gameTypes',
      width: 100,
      render: (value: LossRebateBreakdownRow['gameTypes']) => value.join('、'),
    },
    {
      title: '有效投注額',
      dataIndex: 'effectiveBet',
      width: 140,
      align: 'right',
      render: formatCurrency,
    },
    {
      title: '派彩金額',
      dataIndex: 'payout',
      width: 140,
      align: 'right',
      render: formatCurrency,
    },
    {
      title: (
        <>
          淨輸值
          <Tooltip title="負值（玩家淨贏）計入當日淨輸值，但不產生返利">
            <Text type="secondary" style={{ marginLeft: 6, cursor: 'help' }}>
              <QuestionCircleOutlined data-e2e-id={`${E2E}-detail-net-loss-tooltip`} />
            </Text>
          </Tooltip>
        </>
      ),
      dataIndex: 'netLoss',
      width: 140,
      align: 'right',
      render: (value: number) => (
        <Text type={value < 0 ? 'secondary' : undefined}>{formatCurrency(value)}</Text>
      ),
    },
    {
      title: '返利比例',
      dataIndex: 'rate',
      width: 100,
      align: 'right',
      render: (value: number) => `${value}%`,
    },
    {
      title: (
        <>
          返利金額
          <Tooltip title="= max(淨輸值, 0) × 返利比例，封頂前">
            <Text type="secondary" style={{ marginLeft: 6, cursor: 'help' }}>
              <QuestionCircleOutlined data-e2e-id={`${E2E}-detail-rebate-tooltip`} />
            </Text>
          </Tooltip>
        </>
      ),
      dataIndex: 'rebate',
      width: 140,
      align: 'right',
      render: formatCurrency,
    },
  ];

  const handleReset = () => {
    form.resetFields();
    setFilters({});
  };

  const handleClose = () => {
    setSelectedRow(null);
    onClose();
  };

  return (
    <Modal
      title="輸值返利 - 報表"
      open={open}
      onCancel={handleClose}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button data-e2e-id={`${E2E}-footer-close-btn`} onClick={handleClose}>
            關閉
          </Button>
        </div>
      }
      width="94%"
      style={{ top: 20 }}
      styles={{ body: { maxHeight: '78vh', overflowY: 'auto', padding: 16 } }}
    >
      <div data-e2e-id={`${E2E}-modal`}>
        <Card style={{ marginBottom: 16 }}>
          <Form
            form={form}
            layout="inline"
            style={{ gap: 12, flexWrap: 'wrap', rowGap: 12 }}
          >
            <Form.Item name="account" label="會員帳號">
              <Input
                data-e2e-id={`${E2E}-filter-account-input`}
                placeholder="輸入帳號"
                allowClear
                style={{ width: 140 }}
              />
            </Form.Item>
            <Form.Item name="uid" label="會員UID">
              <Input
                data-e2e-id={`${E2E}-filter-uid-input`}
                placeholder="輸入 UID"
                allowClear
                style={{ width: 130 }}
              />
            </Form.Item>
            <Form.Item name="phone" label="手機號">
              <Input
                data-e2e-id={`${E2E}-filter-phone-input`}
                placeholder="輸入手機號"
                allowClear
                style={{ width: 150 }}
              />
            </Form.Item>
            <Form.Item name="vipLevel" label="VIP等級">
              <Select
                data-e2e-id={`${E2E}-filter-vip-level-select`}
                placeholder="全部"
                allowClear
                style={{ width: 100 }}
                options={Array.from({ length: 31 }, (_, value) => ({
                  value,
                  label: `V${value}`,
                }))}
              />
            </Form.Item>
            <Form.Item name="vipTier" label="VIP分級">
              <Select
                data-e2e-id={`${E2E}-filter-vip-tier-select`}
                placeholder="全部"
                allowClear
                style={{ width: 140 }}
                options={VIP_TIERS.map((tier) => ({
                  value: tier.key,
                  label: `${tier.label}（${tier.levelRange}）`,
                }))}
              />
            </Form.Item>
            <Form.Item name="statDateRange" label="統計日期">
              <RangePicker
                data-e2e-id={`${E2E}-filter-date-range`}
                style={{ width: 260 }}
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button
                  data-e2e-id={`${E2E}-filter-query-btn`}
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={() => setFilters(form.getFieldsValue())}
                >
                  查詢
                </Button>
                <Button
                  data-e2e-id={`${E2E}-filter-reset-btn`}
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                >
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col flex="1" style={{ minWidth: 0 }}>
            <Card style={statisticCardStyle}>
              <Statistic
                data-e2e-id={`${E2E}-summary-members`}
                title="不重複人數"
                value={stats.members}
                valueStyle={statisticValueStyle}
              />
            </Card>
          </Col>
          <Col flex="1" style={{ minWidth: 0 }}>
            <Card style={statisticCardStyle}>
              <Statistic
                data-e2e-id={`${E2E}-summary-net-loss`}
                title="總淨輸值"
                value={stats.totalNetLoss}
                valueStyle={statisticValueStyle}
                prefix="₱"
                precision={2}
              />
            </Card>
          </Col>
          <Col flex="1" style={{ minWidth: 0 }}>
            <Card style={statisticCardStyle}>
              <Statistic
                data-e2e-id={`${E2E}-summary-rebate`}
                title="總返利"
                value={stats.totalRebate}
                prefix="₱"
                precision={2}
                valueStyle={{ ...statisticValueStyle, color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col flex="1" style={{ minWidth: 0 }}>
            <Card style={statisticCardStyle}>
              <Statistic
                data-e2e-id={`${E2E}-summary-rollover`}
                title="總打碼要求"
                value={stats.totalRollover}
                valueStyle={statisticValueStyle}
                prefix="₱"
                precision={2}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <Button
              data-e2e-id={`${E2E}-toolbar-export-btn`}
              icon={<DownloadOutlined />}
              onClick={() => downloadCsv(filteredRows)}
            >
              匯出 CSV
            </Button>
          </div>
          <Table
            data-e2e-id={`${E2E}-table`}
            columns={columns}
            dataSource={filteredRows}
            rowKey="id"
            size="small"
            scroll={{ x: 1810 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 筆`,
            }}
            onRow={(record) =>
              ({
                'data-e2e-id': `${E2E}-table-row-${record.id}`,
                onClick: () => setSelectedRow(record),
                style: { cursor: 'pointer' },
              } as React.HTMLAttributes<HTMLTableRowElement>)
            }
          />
        </Card>

        <Modal
          data-e2e-id={`${E2E}-detail-modal`}
          title={
            selectedRow
              ? `輸值返利明細 — ${selectedRow.account}（${selectedRow.statDate}）`
              : '輸值返利明細'
          }
          open={open && Boolean(selectedRow)}
          onCancel={() => setSelectedRow(null)}
          width={1200}
          footer={
            <Button data-e2e-id={`${E2E}-detail-close-btn`} onClick={() => setSelectedRow(null)}>
              關閉
            </Button>
          }
        >
          {selectedRow ? (
            <>
              <div
                data-e2e-id={`${E2E}-detail-summary`}
                style={{ marginBottom: 12, fontSize: 14 }}
              >
                <Text>
                  {`當日淨輸值 ${formatCurrency(selectedRow.netLoss)} ＞ 起始淨輸門檻 ${formatCurrency(minNetLoss)} → 封頂前返利 ${formatCurrency(selectedRow.rebateBeforeCap)} → 返利上限 ${rebateCap === 0 ? '不限' : formatCurrency(rebateCap)} → 實派 `}
                </Text>
                <Text strong style={{ color: '#faad14' }}>
                  {formatCurrency(selectedRow.rebateAmount)}
                </Text>
                <Text>
                  {`（× 打碼倍數 ${rolloverMultiplier} = 打碼要求 ${formatCurrency(
                    selectedRow.rolloverRequired
                  )}）`}
                </Text>
                {selectedRow.capped ? (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    　已封頂
                  </Text>
                ) : null}
              </div>
              <Descriptions
                data-e2e-id={`${E2E}-detail-descriptions`}
                size="small"
                column={4}
                bordered
                style={{ marginBottom: 16 }}
              >
                <Descriptions.Item label="玩家帳號">
                  {selectedRow.account}
                </Descriptions.Item>
                <Descriptions.Item label="手機號">{selectedRow.phone}</Descriptions.Item>
                <Descriptions.Item label="VIP等級">
                  {`V${selectedRow.vipLevel}`}
                </Descriptions.Item>
                <Descriptions.Item label="VIP分級">
                  {selectedRow.vipTier}
                </Descriptions.Item>
                <Descriptions.Item label="統計日期">
                  {selectedRow.statDate}
                </Descriptions.Item>
                <Descriptions.Item label="派發時間">
                  {selectedRow.dispatchedAt}
                </Descriptions.Item>
                <Descriptions.Item label="有效投注額">
                  {formatCurrency(selectedRow.effectiveBet)}
                </Descriptions.Item>
                <Descriptions.Item label="派彩金額">
                  {formatCurrency(selectedRow.payout)}
                </Descriptions.Item>
                <Descriptions.Item label="淨輸值">
                  {formatCurrency(selectedRow.netLoss)}
                </Descriptions.Item>
                <Descriptions.Item label="封頂前返利">
                  {formatCurrency(selectedRow.rebateBeforeCap)}
                </Descriptions.Item>
                <Descriptions.Item label="實派返利金額">
                  {formatCurrency(selectedRow.rebateAmount)}
                </Descriptions.Item>
                <Descriptions.Item label="打碼要求">
                  {formatCurrency(selectedRow.rolloverRequired)}
                </Descriptions.Item>
              </Descriptions>
            </>
          ) : null}
          <Table
            data-e2e-id={`${E2E}-detail-table`}
            columns={detailColumns}
            dataSource={selectedRow?.breakdown ?? []}
            rowKey="key"
            size="small"
            pagination={false}
            scroll={{ x: 1120 }}
            onRow={(record) =>
              ({
                'data-e2e-id': `${E2E}-detail-row-${record.key}`,
              } as React.HTMLAttributes<HTMLTableRowElement>)
            }
          />
        </Modal>
      </div>
    </Modal>
  );
}

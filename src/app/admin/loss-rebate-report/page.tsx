'use client';

import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Typography,
} from 'antd';
import {
  DownloadOutlined,
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

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const E2E = 'loss-rebate-report';

// 返利上限與流水倍數是「全活動共用一組」設定，報表只負責呈現，不在此重新定義數字。
const { rebateCap: REBATE_CAP, rolloverMultiplier: ROLLOVER_MULTIPLIER } =
  DEFAULT_LOSS_REBATE_SETTINGS;

interface ReportFilters {
  account?: string;
  uid?: string;
  phone?: string;
  vipLevel?: number;
  vipTier?: string;
  settledRange?: [Dayjs, Dayjs];
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
      '統計週期',
      '有效投注額',
      '派彩金額',
      '淨輸值',
      '封頂前返利',
      '實派返利金額',
      '是否封頂',
      '打碼要求',
      '結算時間',
    ],
    ...rows.map((row) => [
      row.id,
      row.account,
      row.uid,
      row.phone,
      `V${row.vipLevel}`,
      row.vipTier,
      row.statPeriod,
      row.effectiveBet.toFixed(2),
      row.payout.toFixed(2),
      row.netLoss.toFixed(2),
      row.rebateBeforeCap.toFixed(2),
      row.rebateAmount.toFixed(2),
      row.capped ? '是' : '否',
      row.rolloverRequired.toFixed(2),
      row.settledAt,
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

export default function LossRebateReportPage() {
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
        if (filters.settledRange?.length === 2) {
          const settledAt = dayjs(row.settledAt);
          if (
            settledAt.isBefore(filters.settledRange[0].startOf('day')) ||
            settledAt.isAfter(filters.settledRange[1].endOf('day'))
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
    { title: '統計週期', dataIndex: 'statPeriod', width: 120 },
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
    { title: '結算時間', dataIndex: 'settledAt', width: 170 },
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
              {`${row.providerName} ${row.gameName}`}
            </Text>
          </div>
        ) : (
          row.gameType
        ),
    },
    { title: '遊戲類型', dataIndex: 'gameType', width: 100 },
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
      title: '淨輸值',
      dataIndex: 'netLoss',
      width: 140,
      align: 'right',
      // 淨輸值 ≤ 0 代表當期該規則玩家反贏，不派發返利。
      render: (value: number) => (
        <Text type={value <= 0 ? 'secondary' : undefined}>{formatCurrency(value)}</Text>
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
      title: '返利金額',
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

  return (
    <div data-e2e-id={`${E2E}-page`}>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, color: '#e8e8e8' }}>
          輸值返利報表
        </Title>
        <Text type="secondary">
          輸值返利（Loss Rebate）派發明細（每會員每結算週期一筆）
        </Text>
      </div>

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
          <Form.Item name="settledRange" label="結算時間">
            <RangePicker
              data-e2e-id={`${E2E}-filter-settled-range`}
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

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              data-e2e-id={`${E2E}-summary-members`}
              title="不重複人數"
              value={stats.members}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              data-e2e-id={`${E2E}-summary-net-loss`}
              title="總淨輸值"
              value={stats.totalNetLoss}
              prefix="₱"
              precision={2}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              data-e2e-id={`${E2E}-summary-rebate`}
              title="總返利"
              value={stats.totalRebate}
              prefix="₱"
              precision={2}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              data-e2e-id={`${E2E}-summary-rollover`}
              title="總打碼要求"
              value={stats.totalRollover}
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
            導出 Excel
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

      <Drawer
        data-e2e-id={`${E2E}-detail-drawer`}
        title={
          selectedRow
            ? `輸值返利明細 — ${selectedRow.account}（${selectedRow.statPeriod}）`
            : '輸值返利明細'
        }
        open={Boolean(selectedRow)}
        onClose={() => setSelectedRow(null)}
        width={1240}
      >
        {selectedRow ? (
          <>
            {/* 讓運營一眼對上主表數字：封頂前 → 上限 → 實派 → 打碼要求。 */}
            <div
              data-e2e-id={`${E2E}-detail-summary`}
              style={{ marginBottom: 12, fontSize: 14 }}
            >
              <Text>
                {`封頂前合計 ${formatCurrency(selectedRow.rebateBeforeCap)} → 返利上限 ${
                  REBATE_CAP !== undefined ? formatCurrency(REBATE_CAP) : '無上限'
                } → 實派 `}
              </Text>
              <Text strong style={{ color: '#faad14' }}>
                {formatCurrency(selectedRow.rebateAmount)}
              </Text>
              <Text>
                {`（× 流水倍數 ${ROLLOVER_MULTIPLIER} = 打碼要求 ${formatCurrency(
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
              <Descriptions.Item label="統計週期">
                {selectedRow.statPeriod}
              </Descriptions.Item>
              <Descriptions.Item label="結算時間">
                {selectedRow.settledAt}
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
            {/* 明細僅供對帳；封頂後金額無法回攤至各規則，實際派發為合併單筆。 */}
            <Text type="secondary" style={{ fontSize: 12 }}>
              以下逐規則明細為封頂前的計算過程，僅供對帳；實際派發時合併為單筆帳變。
            </Text>
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
      </Drawer>
    </div>
  );
}

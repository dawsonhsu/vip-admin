'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  ColumnHeightOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import {
  PROVIDER_LEADERBOARD_REPORT_END_DATE,
  PROVIDER_LEADERBOARD_SHORTAGE_DATE,
  PROVIDER_LEADERBOARD_SHORTAGE_PROVIDER_CODE,
  PROVIDER_LEADERBOARD_SHORTAGE_QUALIFIED_COUNT,
  providerLeaderboardReportData,
  type ProviderLeaderboardReportRow,
} from '@/data/providerLeaderboardReportData';
import { DEFAULT_LEADERBOARD_PROVIDERS, LEADERBOARD_PROVIDER_CATALOG, type RewardType } from '@/data/providerLeaderboardConfig';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const E2E = 'provider-leaderboard-report-modal';

interface ProviderLeaderboardReportModalProps {
  open: boolean;
  onClose: () => void;
}

interface ReportFilters {
  statisticalRange?: [Dayjs, Dayjs];
  providerCode?: string;
  memberKeyword?: string;
  rewardType?: RewardType;
  minRank?: number;
  maxRank?: number;
}

const initialDateRange: [Dayjs, Dayjs] = [
  dayjs(PROVIDER_LEADERBOARD_REPORT_END_DATE).subtract(6, 'day'),
  dayjs(PROVIDER_LEADERBOARD_REPORT_END_DATE),
];

const formatCurrency = (value: number) =>
  `₱ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statisticCardStyle: React.CSSProperties = { height: '100%' };
const statisticValueStyle: React.CSSProperties = {
  fontSize: 22,
  lineHeight: 1.25,
  whiteSpace: 'nowrap',
};

const escapeCsvCell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

function downloadCsv(rows: ProviderLeaderboardReportRow[]) {
  const values: (string | number)[][] = [
    ['統計日期', '廠商', '名次', '會員帳號', '手機號', '當日有效投注', '達標時間', '獎勵類型', '獎勵內容', '流水要求', '派發時間', '派發狀態'],
    ...rows.map((row) => [
      row.statisticalDate,
      row.providerName,
      row.rank,
      row.account,
      row.phone,
      row.validBet.toFixed(2),
      row.reachedAt,
      row.rewardTypeLabel,
      row.rewardContent,
      row.rolloverRequirement,
      row.dispatchedAt,
      row.dispatchStatus,
    ]),
  ];
  const content = `\uFEFF${values.map((row) => row.map(escapeCsvCell).join(',')).join('\n')}`;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = 'provider-daily-leaderboard-report.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

export default function ProviderLeaderboardReportModal({
  open,
  onClose,
}: ProviderLeaderboardReportModalProps) {
  const [form] = Form.useForm<ReportFilters>();
  const [filters, setFilters] = useState<ReportFilters>({ statisticalRange: initialDateRange });

  const filteredRows = useMemo(() => providerLeaderboardReportData.filter((row) => {
    if (filters.statisticalRange?.length === 2) {
      const date = dayjs(row.statisticalDate);
      if (date.isBefore(filters.statisticalRange[0].startOf('day')) || date.isAfter(filters.statisticalRange[1].endOf('day'))) return false;
    }
    if (filters.providerCode && row.providerCode !== filters.providerCode) return false;
    if (filters.memberKeyword) {
      const keyword = filters.memberKeyword.toLowerCase();
      if (!row.account.toLowerCase().includes(keyword) && !row.phone.includes(keyword)) return false;
    }
    if (filters.rewardType && row.rewardType !== filters.rewardType) return false;
    if (filters.minRank !== undefined && row.rank < filters.minRank) return false;
    if (filters.maxRank !== undefined && row.rank > filters.maxRank) return false;
    return true;
  }), [filters]);

  const stats = useMemo(() => {
    return {
      entries: filteredRows.length,
      uniqueWinners: new Set(filteredRows.map((row) => row.account)).size,
      cash: filteredRows.reduce((sum, row) => sum + row.cashAmount, 0),
      freeSpins: filteredRows.reduce((sum, row) => sum + row.freeSpinSpins, 0),
      mallCoins: filteredRows.reduce((sum, row) => sum + row.mallCoinAmount, 0),
    };
  }, [filteredRows]);

  const columns: ColumnsType<ProviderLeaderboardReportRow> = [
    { title: '統計日期', dataIndex: 'statisticalDate', width: 115, fixed: 'left' },
    { title: '廠商', dataIndex: 'providerName', width: 140, fixed: 'left' },
    { title: '名次', dataIndex: 'rank', width: 75, align: 'right' },
    { title: '會員帳號', dataIndex: 'account', width: 145 },
    { title: '手機號', dataIndex: 'phone', width: 120 },
    { title: '當日有效投注', dataIndex: 'validBet', width: 150, align: 'right', render: formatCurrency },
    {
      title: (
        <Space size={4}>
          達標時間
          <Tooltip title="同分時較早達標者排名較前">
            <span data-e2e-id={`${E2E}-reached-at-tooltip`} style={{ cursor: 'help' }}>ⓘ</span>
          </Tooltip>
        </Space>
      ),
      dataIndex: 'reachedAt',
      width: 170,
    },
    { title: '獎勵類型', dataIndex: 'rewardTypeLabel', width: 100 },
    { title: '獎勵內容', dataIndex: 'rewardContent', width: 280 },
    { title: '流水要求', dataIndex: 'rolloverRequirement', width: 150 },
    { title: '派發時間', dataIndex: 'dispatchedAt', width: 170 },
    { title: '派發狀態', dataIndex: 'dispatchStatus', width: 95 },
  ];

  const shortageProvider = LEADERBOARD_PROVIDER_CATALOG.find((item) => item.code === PROVIDER_LEADERBOARD_SHORTAGE_PROVIDER_CODE)?.name ?? PROVIDER_LEADERBOARD_SHORTAGE_PROVIDER_CODE;

  const resetFilters = () => {
    form.resetFields();
    form.setFieldValue('statisticalRange', initialDateRange);
    setFilters({ statisticalRange: initialDateRange });
  };

  return (
    <Modal
      title="廠商排行榜 - 報表"
      open={open}
      onCancel={onClose}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button data-e2e-id={`${E2E}-footer-close-btn`} onClick={onClose}>
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
        <Form form={form} layout="inline" initialValues={{ statisticalRange: initialDateRange }} style={{ gap: 10, rowGap: 12, flexWrap: 'wrap' }}>
          <Form.Item name="statisticalRange" label="統計日期">
            <RangePicker data-e2e-id={`${E2E}-filter-date-range`} style={{ width: 250 }} />
          </Form.Item>
          <Form.Item name="providerCode" label="廠商">
            <Select
              data-e2e-id={`${E2E}-filter-provider-select`}
              allowClear
              placeholder="全部廠商"
              style={{ width: 160 }}
              options={DEFAULT_LEADERBOARD_PROVIDERS.map((row) => ({ value: row.providerCode, label: LEADERBOARD_PROVIDER_CATALOG.find((provider) => provider.code === row.providerCode)?.name ?? row.providerCode }))}
            />
          </Form.Item>
          <Form.Item name="memberKeyword" label="會員帳號/手機號">
            <Input data-e2e-id={`${E2E}-filter-member-input`} allowClear placeholder="輸入帳號或手機號" style={{ width: 190 }} />
          </Form.Item>
          <Form.Item name="rewardType" label="獎勵類型">
            <Select
              data-e2e-id={`${E2E}-filter-reward-select`}
              allowClear
              placeholder="全部"
              style={{ width: 130 }}
              options={[{ value: 'cash', label: '現金' }, { value: 'freeSpin', label: 'Free Spin' }, { value: 'mallCoin', label: '商城幣' }]}
            />
          </Form.Item>
          <Form.Item label="名次">
            <Space size={4}>
              <Form.Item name="minRank" noStyle><InputNumber data-e2e-id={`${E2E}-filter-min-rank-input`} min={1} precision={0} placeholder="起" style={{ width: 80 }} /></Form.Item>
              <Text type="secondary">–</Text>
              <Form.Item name="maxRank" noStyle><InputNumber data-e2e-id={`${E2E}-filter-max-rank-input`} min={1} precision={0} placeholder="迄" style={{ width: 80 }} /></Form.Item>
            </Space>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button data-e2e-id={`${E2E}-filter-query-btn`} type="primary" icon={<SearchOutlined />} onClick={() => setFilters(form.getFieldsValue())}>查詢</Button>
              <Button data-e2e-id={`${E2E}-filter-reset-btn`} icon={<ReloadOutlined />} onClick={resetFilters}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col flex="1" style={{ minWidth: 0 }}><Card style={statisticCardStyle}><Statistic title="得獎人次" value={stats.entries} valueStyle={statisticValueStyle} /></Card></Col>
        <Col flex="1" style={{ minWidth: 0 }}><Card style={statisticCardStyle}><Statistic title="不重複得獎人數" value={stats.uniqueWinners} valueStyle={statisticValueStyle} /></Card></Col>
        <Col flex="1" style={{ minWidth: 0 }}><Card style={statisticCardStyle}><Statistic title="現金派發總額" value={stats.cash} formatter={() => formatCurrency(stats.cash)} valueStyle={statisticValueStyle} /></Card></Col>
        <Col flex="1" style={{ minWidth: 0 }}><Card style={statisticCardStyle}><Statistic title="Free Spin 總次數" value={stats.freeSpins} suffix="次" valueStyle={statisticValueStyle} /></Card></Col>
        <Col flex="1" style={{ minWidth: 0 }}><Card style={statisticCardStyle}><Statistic title="商城幣總額" value={stats.mallCoins} suffix="幣" valueStyle={statisticValueStyle} /></Card></Col>
      </Row>

      <Card>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message={`僅列出獲獎會員；未達上榜門檻者不排名、名額不遞補（例：${PROVIDER_LEADERBOARD_SHORTAGE_DATE} ${shortageProvider} 僅 ${PROVIDER_LEADERBOARD_SHORTAGE_QUALIFIED_COUNT} 人達標，38–100 名無人派發）。注單依結算時間歸日，派獎後的取消/重新結算不追回。`}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <Space wrap>
            <Button data-e2e-id={`${E2E}-toolbar-export-btn`} icon={<DownloadOutlined />} onClick={() => downloadCsv(filteredRows)}>匯出 CSV</Button>
          </Space>
          <Space>
            <Tooltip title="刷新"><Button data-e2e-id={`${E2E}-toolbar-refresh-btn`} icon={<ReloadOutlined />} onClick={() => message.success('列表已刷新')} /></Tooltip>
            <Tooltip title="列高"><Button data-e2e-id={`${E2E}-toolbar-density-btn`} icon={<ColumnHeightOutlined />} onClick={() => message.info('原型暫未提供列高切換')} /></Tooltip>
            <Tooltip title="欄位設定"><Button data-e2e-id={`${E2E}-toolbar-columns-btn`} icon={<SettingOutlined />} onClick={() => message.info('原型暫未提供欄位設定')} /></Tooltip>
          </Space>
        </div>
        <Table
          data-e2e-id={`${E2E}-table`}
          rowKey="id"
          columns={columns}
          dataSource={filteredRows}
          size="small"
          scroll={{ x: 1700 }}
          pagination={{ pageSize: 20, showSizeChanger: false, showTotal: (total) => `共 ${total} 筆` }}
          onRow={(row) => ({ 'data-e2e-id': `${E2E}-table-row-${row.id}` } as React.HTMLAttributes<HTMLTableRowElement>)}
        />
      </Card>
      </div>
    </Modal>
  );
}

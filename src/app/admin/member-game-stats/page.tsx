'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  Col,
  DatePicker,
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
import { DownloadOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { gameStats, gameTypes, type GameStat, type GameType } from '@/data/memberStatsData';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

interface GameFilters {
  uid?: string;
  inviterUid?: string;
  gameType: 'ALL' | GameType;
  dateRange: [Dayjs, Dayjs];
}

interface AggregatedGameStat {
  uid: string;
  username: string;
  inviterUid?: string;
  inviterUsername?: string;
  totalBet: number;
  excludedBet: number;
  validBet: number;
  totalPayout: number;
  ggr: number;
}

interface ExpandGameRow extends AggregatedGameStat {
  gameType: GameType;
}

const defaultRange = (): [Dayjs, Dayjs] => [dayjs(), dayjs()];

const formatAmount = (value: number) => value.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatDateRange = (start: string, end: string) => `${start} ~ ${end}`;

const renderAmount = (value: number) => formatAmount(value);

const renderGgr = (value: number) => (
  <span style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
    {formatAmount(value)}
  </span>
);

const exportCsv = (filename: string, headers: string[], rows: Array<Array<string | number>>) => {
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map((cell) => {
      const text = String(cell ?? '');
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    }).join(',')),
  ].join('\n');

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const sumGameRows = (rows: AggregatedGameStat[]) => rows.reduce(
  (acc, row) => ({
    totalBet: acc.totalBet + row.totalBet,
    excludedBet: acc.excludedBet + row.excludedBet,
    validBet: acc.validBet + row.validBet,
    totalPayout: acc.totalPayout + row.totalPayout,
    ggr: acc.ggr + row.ggr,
  }),
  { totalBet: 0, excludedBet: 0, validBet: 0, totalPayout: 0, ggr: 0 }
);

const aggregateByMember = (rows: GameStat[]): AggregatedGameStat[] => {
  const grouped = rows.reduce<Record<string, AggregatedGameStat>>((acc, row) => {
    if (!acc[row.uid]) {
      acc[row.uid] = {
        uid: row.uid,
        username: row.username,
        inviterUid: row.inviterUid,
        inviterUsername: row.inviterUsername,
        totalBet: 0,
        excludedBet: 0,
        validBet: 0,
        totalPayout: 0,
        ggr: 0,
      };
    }

    acc[row.uid].totalBet += row.totalBet;
    acc[row.uid].excludedBet += row.excludedBet;
    acc[row.uid].validBet += row.validBet;
    acc[row.uid].totalPayout += row.totalPayout;
    acc[row.uid].ggr += row.ggr;

    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => a.uid.localeCompare(b.uid));
};

const aggregateByMemberAndGameType = (rows: GameStat[]): Record<string, ExpandGameRow[]> => rows.reduce<Record<string, ExpandGameRow[]>>((acc, row) => {
  if (!acc[row.uid]) {
    acc[row.uid] = [];
  }

  const current = acc[row.uid].find(item => item.gameType === row.gameType);
  if (current) {
    current.totalBet += row.totalBet;
    current.excludedBet += row.excludedBet;
    current.validBet += row.validBet;
    current.totalPayout += row.totalPayout;
    current.ggr += row.ggr;
  } else {
    acc[row.uid].push({
      uid: row.uid,
      username: row.username,
      inviterUid: row.inviterUid,
      inviterUsername: row.inviterUsername,
      gameType: row.gameType,
      totalBet: row.totalBet,
      excludedBet: row.excludedBet,
      validBet: row.validBet,
      totalPayout: row.totalPayout,
      ggr: row.ggr,
    });
  }

  acc[row.uid].sort((a, b) => gameTypes.indexOf(a.gameType) - gameTypes.indexOf(b.gameType));
  return acc;
}, {});

export default function MemberGameStatsPage() {
  const router = useRouter();
  const [form] = Form.useForm<GameFilters>();
  const [filters, setFilters] = useState<GameFilters>({ gameType: 'ALL', dateRange: defaultRange() });
  const [drawerTarget, setDrawerTarget] = useState<AggregatedGameStat | null>(null);

  const queryStart = filters.dateRange[0].format('YYYY-MM-DD');
  const queryEnd = filters.dateRange[1].format('YYYY-MM-DD');
  const dateRangeText = formatDateRange(queryStart, queryEnd);
  const isAllMode = filters.gameType === 'ALL';

  const filteredRows = useMemo(() => gameStats.filter((row) => (
    row.date >= queryStart
    && row.date <= queryEnd
    && (filters.uid ? row.uid === filters.uid.trim() : true)
    && (filters.inviterUid ? row.inviterUid === filters.inviterUid.trim() : true)
    && (filters.gameType === 'ALL' ? true : row.gameType === filters.gameType)
  )), [filters, queryEnd, queryStart]);

  const aggregatedRows = useMemo(() => aggregateByMember(filteredRows), [filteredRows]);
  const expandedRows = useMemo(() => aggregateByMemberAndGameType(filteredRows), [filteredRows]);
  const summary = useMemo(() => sumGameRows(aggregatedRows), [aggregatedRows]);

  const detailRows = useMemo(() => {
    if (!drawerTarget) {
      return [];
    }
    return filteredRows
      .filter(row => row.uid === drawerTarget.uid)
      .sort((a, b) => {
        if (a.date === b.date) {
          return a.gameType.localeCompare(b.gameType);
        }
        return b.date.localeCompare(a.date);
      });
  }, [drawerTarget, filteredRows]);

  const handleSearch = () => {
    const values = form.getFieldsValue();
    setFilters({
      uid: values.uid?.trim() || undefined,
      inviterUid: values.inviterUid?.trim() || undefined,
      gameType: values.gameType || 'ALL',
      dateRange: values.dateRange || defaultRange(),
    });
  };

  const handleReset = () => {
    const nextRange = defaultRange();
    form.setFieldsValue({ uid: undefined, inviterUid: undefined, gameType: 'ALL', dateRange: nextRange });
    setFilters({ gameType: 'ALL', dateRange: nextRange });
  };

  const columns: ColumnsType<AggregatedGameStat> = [
    {
      title: '統計日期',
      key: 'dateRange',
      width: 240,
      ellipsis: true,
      render: () => <span style={{ whiteSpace: 'nowrap' }}>{dateRangeText}</span>,
    },
    {
      title: '會員',
      dataIndex: 'username',
      width: 140,
      sorter: (a, b) => a.username.localeCompare(b.username),
      defaultSortOrder: 'ascend',
      render: (_, record) => (
        <a data-e2e-id={`member-game-stats-table-member-link-${record.uid}`} onClick={() => router.push(`/admin/members/${record.uid}`)}>
          {record.username}
        </a>
      ),
    },
    {
      title: '邀請人',
      dataIndex: 'inviterUsername',
      width: 140,
      render: (_, record) => record.inviterUid && record.inviterUsername ? (
        <a data-e2e-id={`member-game-stats-table-inviter-link-${record.uid}`} onClick={() => router.push(`/admin/members/${record.inviterUid}`)}>
          {record.inviterUsername}
        </a>
      ) : '-',
    },
    { title: '總投注額', dataIndex: 'totalBet', width: 140, align: 'right', sorter: (a, b) => a.totalBet - b.totalBet, render: renderAmount },
    { title: '排除投注額', dataIndex: 'excludedBet', width: 140, align: 'right', sorter: (a, b) => a.excludedBet - b.excludedBet, render: renderAmount },
    { title: '有效投注額', dataIndex: 'validBet', width: 140, align: 'right', sorter: (a, b) => a.validBet - b.validBet, render: renderAmount },
    { title: '總派獎', dataIndex: 'totalPayout', width: 140, align: 'right', sorter: (a, b) => a.totalPayout - b.totalPayout, render: renderAmount },
    { title: 'GGR', dataIndex: 'ggr', width: 140, align: 'right', sorter: (a, b) => a.ggr - b.ggr, render: renderGgr },
    {
      title: '詳情',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button data-e2e-id={`member-game-stats-table-detail-btn-${record.uid}`} size="small" onClick={() => setDrawerTarget(record)}>
          查看
        </Button>
      ),
    },
  ];

  const expandedColumns: ColumnsType<ExpandGameRow> = [
    { title: '遊戲類型', dataIndex: 'gameType', width: 120 },
    { title: '總投注額', dataIndex: 'totalBet', width: 140, align: 'right', render: renderAmount },
    { title: '排除投注額', dataIndex: 'excludedBet', width: 140, align: 'right', render: renderAmount },
    { title: '有效投注額', dataIndex: 'validBet', width: 140, align: 'right', render: renderAmount },
    { title: '總派獎', dataIndex: 'totalPayout', width: 140, align: 'right', render: renderAmount },
    { title: 'GGR', dataIndex: 'ggr', width: 140, align: 'right', render: renderGgr },
  ];

  const detailColumns: ColumnsType<GameStat> = [
    { title: '統計日期', dataIndex: 'date', width: 120, sorter: (a, b) => a.date.localeCompare(b.date), defaultSortOrder: 'descend' },
    ...(isAllMode ? [{ title: '遊戲類型', dataIndex: 'gameType', width: 120 } as const] : []),
    { title: '總投注額', dataIndex: 'totalBet', width: 140, align: 'right', render: renderAmount },
    { title: '排除投注額', dataIndex: 'excludedBet', width: 140, align: 'right', render: renderAmount },
    { title: '有效投注額', dataIndex: 'validBet', width: 140, align: 'right', render: renderAmount },
    { title: '總派獎', dataIndex: 'totalPayout', width: 140, align: 'right', render: renderAmount },
    { title: 'GGR', dataIndex: 'ggr', width: 140, align: 'right', render: renderGgr },
  ];

  return (
    <div>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>會員遊戲日統計</Title>
          <Text type="secondary">依會員與遊戲類型查詢指定區間的遊戲統計資料</Text>
        </div>

        <Card size="small">
          <Form
            form={form}
            layout="vertical"
            initialValues={{ gameType: 'ALL', dateRange: defaultRange() }}
          >
            <Row gutter={16}>
              <Col span={5}>
                <Form.Item label="會員帳號" name="uid">
                  <Input data-e2e-id="member-game-stats-filter-uid-input" placeholder="輸入會員帳號" />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item label="邀請人帳號" name="inviterUid">
                  <Input data-e2e-id="member-game-stats-filter-inviter-uid-input" placeholder="輸入邀請人帳號" />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="遊戲類型" name="gameType">
                  <Select
                    data-e2e-id="member-game-stats-filter-game-type-select"
                    options={[
                      { label: '全部', value: 'ALL' },
                      ...gameTypes.map(type => ({ label: type, value: type })),
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="統計時間" name="dateRange">
                  <RangePicker data-e2e-id="member-game-stats-filter-date-range" style={{ width: '100%' }} allowClear={false} />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label=" ">
                  <Space>
                    <Button data-e2e-id="member-game-stats-filter-query-btn" type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查詢</Button>
                    <Button data-e2e-id="member-game-stats-filter-reset-btn" icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        <Card size="small" title="摘要">
          <Row gutter={16}>
            <Col span={4}><Statistic data-e2e-id="member-game-stats-summary-total-bet" title="總投注" value={summary.totalBet} formatter={value => formatAmount(Number(value || 0))} /></Col>
            <Col span={4}><Statistic data-e2e-id="member-game-stats-summary-excluded-bet" title="排除投注" value={summary.excludedBet} formatter={value => formatAmount(Number(value || 0))} /></Col>
            <Col span={4}><Statistic data-e2e-id="member-game-stats-summary-valid-bet" title="有效投注" value={summary.validBet} formatter={value => formatAmount(Number(value || 0))} /></Col>
            <Col span={4}><Statistic data-e2e-id="member-game-stats-summary-total-payout" title="總派獎" value={summary.totalPayout} formatter={value => formatAmount(Number(value || 0))} /></Col>
            <Col span={4}><Statistic data-e2e-id="member-game-stats-summary-ggr" title="GGR" value={summary.ggr} valueStyle={{ color: summary.ggr >= 0 ? '#52c41a' : '#ff4d4f' }} formatter={value => formatAmount(Number(value || 0))} /></Col>
          </Row>
        </Card>

        <Card
          size="small"
          extra={(
            <Button
              data-e2e-id="member-game-stats-toolbar-export-btn"
              icon={<DownloadOutlined />}
              onClick={() => exportCsv(
                `member-game-stats-${queryStart}-${queryEnd}-${filters.gameType}.csv`,
                ['統計日期', '會員 UID', '會員帳號', '邀請人 UID', '邀請人帳號', '遊戲類型', '總投注額', '排除投注額', '有效投注額', '總派獎', 'GGR'],
                (isAllMode ? filteredRows : filteredRows).map(row => [
                  row.date,
                  row.uid,
                  row.username,
                  row.inviterUid || '',
                  row.inviterUsername || '',
                  row.gameType,
                  formatAmount(row.totalBet),
                  formatAmount(row.excludedBet),
                  formatAmount(row.validBet),
                  formatAmount(row.totalPayout),
                  formatAmount(row.ggr),
                ])
              )}
            >
              數據匯出
            </Button>
          )}
        >
          <Table
            rowKey="uid"
            columns={columns}
            dataSource={aggregatedRows}
            onRow={(record) => ({ 'data-e2e-id': `member-game-stats-table-row-${record.uid}` } as React.HTMLAttributes<HTMLTableRowElement>)}
            scroll={{ x: 1500 }}
            expandable={isAllMode ? {
              expandedRowRender: (record) => (
                <Table
                  rowKey={(row) => `${row.uid}-${row.gameType}`}
                  columns={expandedColumns}
                  dataSource={expandedRows[record.uid] || []}
                  onRow={(row) => ({ 'data-e2e-id': `member-game-stats-table-game-row-${row.uid}-${row.gameType}` } as React.HTMLAttributes<HTMLTableRowElement>)}
                  pagination={false}
                  size="small"
                />
              ),
              rowExpandable: (record) => (expandedRows[record.uid] || []).length > 0,
            } : undefined}
            pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'], showTotal: total => `共 ${total} 筆` }}
            size="small"
          />
        </Card>

        <Drawer
          width={1200}
          open={!!drawerTarget}
          onClose={() => setDrawerTarget(null)}
          title={drawerTarget ? `${drawerTarget.username} - 每日明細（${queryStart} ~ ${queryEnd}）` : ''}
        >
          <div data-e2e-id="member-game-stats-drawer">
            <Table
              rowKey={(record) => `${record.uid}-${record.date}-${record.gameType}`}
              columns={detailColumns}
              dataSource={detailRows}
              onRow={(record) => ({ 'data-e2e-id': `member-game-stats-drawer-row-${record.uid}-${record.date}-${record.gameType}` } as React.HTMLAttributes<HTMLTableRowElement>)}
              scroll={{ x: 1200 }}
              pagination={{ pageSize: 10, showTotal: total => `共 ${total} 筆` }}
              size="small"
            />
          </div>
        </Drawer>
      </Space>
    </div>
  );
}

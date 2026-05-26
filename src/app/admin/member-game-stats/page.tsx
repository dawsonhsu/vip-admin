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
  Popover,
  Row,
  Select,
  Space,
  Table,
  Typography,
} from 'antd';
import { DownloadOutlined, ReloadOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { gameStats, gameTypes, getInviterChain, memberStatMembers, type GameStat, type GameType } from '@/data/memberStatsData';
import RecalcButton from '@/components/RecalcButton';
import MemberSelect from '@/components/MemberSelect';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

interface GameFilters {
  uid?: string;
  inviterUid?: string;
  inviterLevel: 1 | 2 | 3;
  gameType: 'ALL' | GameType;
  dateRange: [Dayjs, Dayjs];
}

interface AggregatedGameStat {
  uid: string;
  username: string;
  phone: string;
  inviterUid?: string;
  inviterUsername?: string;
  totalBet: number;
  excludedBet: number;
  validBet: number;
  totalPayout: number;
  ggr: number;
  fsBet: number;
  fsGgr: number;
  jpBet: number;
  jpGgr: number;
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
    fsBet: acc.fsBet + row.fsBet,
    fsGgr: acc.fsGgr + row.fsGgr,
    jpBet: acc.jpBet + row.jpBet,
    jpGgr: acc.jpGgr + row.jpGgr,
  }),
  { totalBet: 0, excludedBet: 0, validBet: 0, totalPayout: 0, ggr: 0, fsBet: 0, fsGgr: 0, jpBet: 0, jpGgr: 0 }
);

const aggregateByMember = (rows: GameStat[]): AggregatedGameStat[] => {
  const grouped = rows.reduce<Record<string, AggregatedGameStat>>((acc, row) => {
    if (!acc[row.uid]) {
      acc[row.uid] = {
        uid: row.uid,
        username: row.username,
        phone: row.phone,
        inviterUid: row.inviterUid,
        inviterUsername: row.inviterUsername,
        totalBet: 0,
        excludedBet: 0,
        validBet: 0,
        totalPayout: 0,
        ggr: 0,
        fsBet: 0,
        fsGgr: 0,
        jpBet: 0,
        jpGgr: 0,
      };
    }

    acc[row.uid].totalBet += row.totalBet;
    acc[row.uid].excludedBet += row.excludedBet;
    acc[row.uid].validBet += row.validBet;
    acc[row.uid].totalPayout += row.totalPayout;
    acc[row.uid].ggr += row.ggr;
    acc[row.uid].fsBet += row.fsBet;
    acc[row.uid].fsGgr += row.fsGgr;
    acc[row.uid].jpBet += row.jpBet;
    acc[row.uid].jpGgr += row.jpGgr;

    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => a.uid.localeCompare(b.uid));
};

export default function MemberGameStatsPage() {
  const router = useRouter();
  const [form] = Form.useForm<GameFilters>();
  const [filters, setFilters] = useState<GameFilters>({ inviterLevel: 1, gameType: 'ALL', dateRange: defaultRange() });
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50'],
  });
  const [drawerTarget, setDrawerTarget] = useState<AggregatedGameStat | null>(null);

  const queryStart = filters.dateRange[0].format('YYYY-MM-DD');
  const queryEnd = filters.dateRange[1].format('YYYY-MM-DD');
  const dateRangeText = formatDateRange(queryStart, queryEnd);
  const isAllMode = filters.gameType === 'ALL';

  const filteredRows = useMemo(() => gameStats.filter((row) => {
    if (row.date < queryStart || row.date > queryEnd) return false;
    if (filters.uid && row.uid !== filters.uid.trim()) return false;
    if (filters.gameType !== 'ALL' && row.gameType !== filters.gameType) return false;
    if (filters.inviterUid) {
      const target = filters.inviterUid.trim();
      const level = filters.inviterLevel;
      if (level === 1) {
        if (row.inviterUid !== target) return false;
      } else if (level === 2) {
        const member = memberStatMembers.find(m => m.uid === row.uid);
        const l1 = member?.inviterUid ? memberStatMembers.find(m => m.uid === member.inviterUid) : undefined;
        if (l1?.inviterUid !== target) return false;
      } else {
        const member = memberStatMembers.find(m => m.uid === row.uid);
        const l1 = member?.inviterUid ? memberStatMembers.find(m => m.uid === member.inviterUid) : undefined;
        const l2 = l1?.inviterUid ? memberStatMembers.find(m => m.uid === l1.inviterUid) : undefined;
        if (l2?.inviterUid !== target) return false;
      }
    }
    return true;
  }), [filters, queryEnd, queryStart]);

  const aggregatedRows = useMemo(() => aggregateByMember(filteredRows), [filteredRows]);

  const pagedRows = useMemo(() => {
    const current = pagination.current || 1;
    const pageSize = pagination.pageSize || 20;
    const startIndex = (current - 1) * pageSize;
    return aggregatedRows.slice(startIndex, startIndex + pageSize);
  }, [aggregatedRows, pagination]);

  const pageSums = useMemo(() => sumGameRows(pagedRows), [pagedRows]);
  const allSums = useMemo(() => sumGameRows(aggregatedRows), [aggregatedRows]);

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
      inviterLevel: (values.inviterLevel as 1 | 2 | 3) || 1,
      gameType: values.gameType || 'ALL',
      dateRange: values.dateRange || defaultRange(),
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    const nextRange = defaultRange();
    form.setFieldsValue({ uid: undefined, inviterUid: undefined, inviterLevel: 1, gameType: 'ALL', dateRange: nextRange });
    setFilters({ inviterLevel: 1, gameType: 'ALL', dateRange: nextRange });
    setPagination(prev => ({ ...prev, current: 1 }));
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
      title: '邀請人',
      dataIndex: 'inviterUsername',
      width: 160,
      render: (_, record) => {
        if (!record.inviterUid || !record.inviterUsername) return '-';
        const chain = getInviterChain(record.uid);
        const allNodes = [...chain, { uid: record.uid, username: record.username }];
        const content = (
          <div style={{ maxWidth: 320 }}>
            {chain.length > 0 && <Text type="secondary">… &gt; </Text>}
            {allNodes.map((node, idx) => (
              <span key={node.uid}>
                {idx > 0 && <Text type="secondary"> &gt; </Text>}
                {node.uid !== record.uid ? (
                  <a onClick={() => { form.setFieldsValue({ inviterUid: node.uid }); handleSearch(); }}>
                    {node.username}
                  </a>
                ) : (
                  <Text>{node.username}</Text>
                )}
              </span>
            ))}
          </div>
        );
        return (
          <Space size={4}>
            <a data-e2e-id={`member-game-stats-table-inviter-link-${record.uid}`} onClick={() => router.push(`/admin/members/${record.inviterUid}`)}>
              {record.inviterUsername}
            </a>
            <Popover content={content} title="邀請人結構" trigger="click">
              <TeamOutlined style={{ cursor: 'pointer', color: '#1677ff' }} />
            </Popover>
          </Space>
        );
      },
    },
    {
      title: 'UID',
      dataIndex: 'uid',
      width: 100,
    },
    {
      title: '帳號',
      dataIndex: 'username',
      width: 140,
      render: (_, record) => (
        <a data-e2e-id={`member-game-stats-table-member-link-${record.uid}`} onClick={() => router.push(`/admin/members/${record.uid}`)}>
          {record.username}
        </a>
      ),
    },
    {
      title: '手機號',
      dataIndex: 'phone',
      width: 130,
    },
    { title: '總投注額', dataIndex: 'totalBet', width: 140, align: 'right', sorter: (a, b) => a.totalBet - b.totalBet, render: renderAmount },
    { title: '排除投注額', dataIndex: 'excludedBet', width: 140, align: 'right', sorter: (a, b) => a.excludedBet - b.excludedBet, render: renderAmount },
    { title: '有效投注額', dataIndex: 'validBet', width: 140, align: 'right', sorter: (a, b) => a.validBet - b.validBet, render: renderAmount },
    { title: '總派獎', dataIndex: 'totalPayout', width: 140, align: 'right', sorter: (a, b) => a.totalPayout - b.totalPayout, render: renderAmount },
    { title: 'GGR', dataIndex: 'ggr', width: 140, align: 'right', sorter: (a, b) => a.ggr - b.ggr, render: renderGgr },
    { title: 'FS 投注額', dataIndex: 'fsBet', width: 140, align: 'right', sorter: (a, b) => a.fsBet - b.fsBet, render: renderAmount },
    { title: 'FS GGR', dataIndex: 'fsGgr', width: 140, align: 'right', sorter: (a, b) => a.fsGgr - b.fsGgr, render: renderGgr },
    { title: 'JP 投注額', dataIndex: 'jpBet', width: 140, align: 'right', sorter: (a, b) => a.jpBet - b.jpBet, render: renderAmount },
    { title: 'JP GGR', dataIndex: 'jpGgr', width: 140, align: 'right', sorter: (a, b) => a.jpGgr - b.jpGgr, render: renderGgr },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button data-e2e-id={`member-game-stats-table-detail-btn-${record.uid}`} size="small" onClick={() => setDrawerTarget(record)}>
            查看
          </Button>
          <RecalcButton
            dataE2eId={`member-game-stats-table-recalc-btn-${record.uid}`}
            successText={`已重算 ${record.username} ${queryStart}~${queryEnd} 遊戲統計`}
          />
        </Space>
      ),
    },
  ];

  const detailColumns: ColumnsType<GameStat> = [
    { title: '統計日期', dataIndex: 'date', width: 120, sorter: (a, b) => a.date.localeCompare(b.date), defaultSortOrder: 'descend' },
    ...(isAllMode ? [{ title: '遊戲類型', dataIndex: 'gameType', width: 120 } as const] : []),
    { title: '總投注額', dataIndex: 'totalBet', width: 140, align: 'right', render: renderAmount },
    { title: '排除投注額', dataIndex: 'excludedBet', width: 140, align: 'right', render: renderAmount },
    { title: '有效投注額', dataIndex: 'validBet', width: 140, align: 'right', render: renderAmount },
    { title: '總派獎', dataIndex: 'totalPayout', width: 140, align: 'right', render: renderAmount },
    { title: 'GGR', dataIndex: 'ggr', width: 140, align: 'right', render: renderGgr },
    { title: 'FS 投注額', dataIndex: 'fsBet', width: 140, align: 'right', render: renderAmount },
    { title: 'FS GGR', dataIndex: 'fsGgr', width: 140, align: 'right', render: renderGgr },
    { title: 'JP 投注額', dataIndex: 'jpBet', width: 140, align: 'right', render: renderAmount },
    { title: 'JP GGR', dataIndex: 'jpGgr', width: 140, align: 'right', render: renderGgr },
    {
      title: '操作',
      key: 'recalc',
      width: 130,
      fixed: 'right',
      render: (_, record) => (
        <RecalcButton
          dataE2eId={`member-game-stats-drawer-recalc-btn-${record.uid}-${record.date}-${record.gameType}`}
          successText={`已重算 ${record.date} ${record.gameType} 遊戲統計`}
        />
      ),
    },
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
                  <MemberSelect dataE2eId="member-game-stats-filter-uid-input" />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item label="邀請人帳號">
                  <Space.Compact block>
                    <Form.Item name="inviterLevel" noStyle initialValue={1}>
                      <Select style={{ width: 80 }} options={[
                        { label: '一級', value: 1 },
                        { label: '二級', value: 2 },
                        { label: '三級', value: 3 },
                      ]} />
                    </Form.Item>
                    <Form.Item name="inviterUid" noStyle>
                      <Input data-e2e-id="member-game-stats-filter-inviter-uid-input" placeholder="輸入邀請人帳號" style={{ width: 'calc(100% - 80px)' }} />
                    </Form.Item>
                  </Space.Compact>
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

        <Card size="small" title="統計">
          {(() => {
            const summaryTableData = [
              { key: 'page', label: '小計', ...pageSums },
              { key: 'all', label: '總計', ...allSums },
            ];
            const summaryColumns = [
              { title: '類型', dataIndex: 'label', width: 60 },
              { title: '總投注額', dataIndex: 'totalBet', width: 140, align: 'right' as const, render: renderAmount },
              { title: '排除投注額', dataIndex: 'excludedBet', width: 140, align: 'right' as const, render: renderAmount },
              { title: '有效投注額', dataIndex: 'validBet', width: 140, align: 'right' as const, render: renderAmount },
              { title: '總派獎', dataIndex: 'totalPayout', width: 140, align: 'right' as const, render: renderAmount },
              { title: 'GGR', dataIndex: 'ggr', width: 140, align: 'right' as const, render: renderGgr },
              { title: 'FS 投注額', dataIndex: 'fsBet', width: 140, align: 'right' as const, render: renderAmount },
              { title: 'FS GGR', dataIndex: 'fsGgr', width: 140, align: 'right' as const, render: renderGgr },
              { title: 'JP 投注額', dataIndex: 'jpBet', width: 140, align: 'right' as const, render: renderAmount },
              { title: 'JP GGR', dataIndex: 'jpGgr', width: 140, align: 'right' as const, render: renderGgr },
            ];
            return <Table dataSource={summaryTableData} columns={summaryColumns} pagination={false} size="small" rowKey="key" scroll={{ x: 'max-content' }} />;
          })()}
        </Card>

        <Card
          size="small"
          extra={(
            <Button
              data-e2e-id="member-game-stats-toolbar-export-btn"
              icon={<DownloadOutlined />}
              onClick={() => exportCsv(
                `member-game-stats-${queryStart}-${queryEnd}-${filters.gameType}.csv`,
                ['統計日期', '會員 UID', '會員帳號', '邀請人 UID', '邀請人帳號', '遊戲類型', '總投注額', '排除投注額', '有效投注額', '總派獎', 'GGR', 'FS 投注額', 'FS GGR', 'JP 投注額', 'JP GGR'],
                filteredRows.map(row => [
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
                  formatAmount(row.fsBet),
                  formatAmount(row.fsGgr),
                  formatAmount(row.jpBet),
                  formatAmount(row.jpGgr),
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
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: aggregatedRows.length,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
              showTotal: total => `共 ${total} 筆`,
            }}
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

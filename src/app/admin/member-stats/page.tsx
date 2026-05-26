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
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { DownloadOutlined, ReloadOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import type { PersonalStat, InviteStat } from '@/data/memberStatsData';
import RecalcButton from '@/components/RecalcButton';
import { inviteStats, personalStats, getInviterChain, memberStatMembers } from '@/data/memberStatsData';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

interface PersonalFilters {
  uid?: string;
  inviterUid?: string;
  inviterLevel: 1 | 2 | 3;
  dateRange: [Dayjs, Dayjs];
}

interface AggregatedPersonalStat {
  uid: string;
  username: string;
  phone: string;
  inviterUid?: string;
  inviterUsername?: string;
  depositCount: number;
  totalDeposit: number;
  withdrawCount: number;
  totalWithdraw: number;
  depositFee: number;
  withdrawFee: number;
  totalBet: number;
  excludedBet: number;
  validBet: number;
  totalPayout: number;
  ggr: number;
  fsBet: number;
  fsGgr: number;
  jpBet: number;
  jpGgr: number;
  totalBonus: number;
  totalCommission: number;
  achievedInvitation: boolean;
}

interface AggregatedInviteStat {
  uid: string;
  username: string;
  phone: string;
  inviterUid?: string;
  inviterUsername?: string;
  inviteCount: number;
  achieveCount: number;
  betUserCount: number;
  depositUserCount: number;
  totalDeposit: number;
  totalWithdraw: number;
  depositFee: number;
  withdrawFee: number;
  totalBet: number;
  validBet: number;
  totalPayout: number;
  ggr: number;
  fsBet: number;
  fsGgr: number;
  jpBet: number;
  jpGgr: number;
  excludedBet: number;
  totalBonus: number;
  totalCommission: number;
}

const defaultRange = (): [Dayjs, Dayjs] => [dayjs(), dayjs()];

const formatInteger = (value: number) => value.toLocaleString();

const formatAmount = (value: number) => value.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatDateRange = (start: string, end: string) => `${start} ~ ${end}`;

const renderInteger = (value: number) => formatInteger(value);

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

const getDateRangeStrings = (range: [Dayjs, Dayjs]) => [
  range[0].format('YYYY-MM-DD'),
  range[1].format('YYYY-MM-DD'),
] as const;

const aggregatePersonalStats = (rows: PersonalStat[]): AggregatedPersonalStat[] => {
  const grouped = rows.reduce<Record<string, AggregatedPersonalStat>>((acc, row) => {
    if (!acc[row.uid]) {
      acc[row.uid] = {
        uid: row.uid,
        username: row.username,
        phone: row.phone,
        inviterUid: row.inviterUid,
        inviterUsername: row.inviterUsername,
        depositCount: 0,
        totalDeposit: 0,
        withdrawCount: 0,
        totalWithdraw: 0,
        depositFee: 0,
        withdrawFee: 0,
        totalBet: 0,
        excludedBet: 0,
        validBet: 0,
        totalPayout: 0,
        ggr: 0,
        fsBet: 0,
        fsGgr: 0,
        jpBet: 0,
        jpGgr: 0,
        totalBonus: 0,
        totalCommission: 0,
        achievedInvitation: row.achievedInvitation,
      };
    }

    acc[row.uid].depositCount += row.depositCount;
    acc[row.uid].totalDeposit += row.totalDeposit;
    acc[row.uid].withdrawCount += row.withdrawCount;
    acc[row.uid].totalWithdraw += row.totalWithdraw;
    acc[row.uid].depositFee += row.depositFee;
    acc[row.uid].withdrawFee += row.withdrawFee;
    acc[row.uid].totalBet += row.totalBet;
    acc[row.uid].excludedBet += row.excludedBet;
    acc[row.uid].validBet += row.validBet;
    acc[row.uid].totalPayout += row.totalPayout;
    acc[row.uid].ggr += row.ggr;
    acc[row.uid].fsBet += row.fsBet;
    acc[row.uid].fsGgr += row.fsGgr;
    acc[row.uid].jpBet += row.jpBet;
    acc[row.uid].jpGgr += row.jpGgr;
    acc[row.uid].totalBonus += row.totalBonus;
    acc[row.uid].totalCommission += row.totalCommission;

    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => a.uid.localeCompare(b.uid));
};

const sumPersonal = (rows: AggregatedPersonalStat[]) => rows.reduce(
  (acc, row) => ({
    memberCount: acc.memberCount + 1,
    achievedCount: acc.achievedCount + (row.achievedInvitation ? 1 : 0),
    depositCount: acc.depositCount + row.depositCount,
    totalDeposit: acc.totalDeposit + row.totalDeposit,
    withdrawCount: acc.withdrawCount + row.withdrawCount,
    totalWithdraw: acc.totalWithdraw + row.totalWithdraw,
    depositFee: acc.depositFee + row.depositFee,
    withdrawFee: acc.withdrawFee + row.withdrawFee,
    totalBet: acc.totalBet + row.totalBet,
    excludedBet: acc.excludedBet + row.excludedBet,
    validBet: acc.validBet + row.validBet,
    totalPayout: acc.totalPayout + row.totalPayout,
    ggr: acc.ggr + row.ggr,
    fsBet: acc.fsBet + row.fsBet,
    fsGgr: acc.fsGgr + row.fsGgr,
    jpBet: acc.jpBet + row.jpBet,
    jpGgr: acc.jpGgr + row.jpGgr,
    totalBonus: acc.totalBonus + row.totalBonus,
    totalCommission: acc.totalCommission + row.totalCommission,
  }),
  { memberCount: 0, achievedCount: 0, depositCount: 0, totalDeposit: 0, withdrawCount: 0, totalWithdraw: 0, depositFee: 0, withdrawFee: 0, totalBet: 0, excludedBet: 0, validBet: 0, totalPayout: 0, ggr: 0, fsBet: 0, fsGgr: 0, jpBet: 0, jpGgr: 0, totalBonus: 0, totalCommission: 0 }
);

const aggregateInviteStats = (rows: InviteStat[]): AggregatedInviteStat[] => {
  const grouped = rows.reduce<Record<string, AggregatedInviteStat>>((acc, row) => {
    if (!acc[row.uid]) {
      acc[row.uid] = {
        uid: row.uid,
        username: row.username,
        phone: row.phone,
        inviterUid: row.inviterUid,
        inviterUsername: row.inviterUsername,
        inviteCount: 0,
        achieveCount: 0,
        betUserCount: 0,
        depositUserCount: 0,
        totalDeposit: 0,
        totalWithdraw: 0,
        depositFee: 0,
        withdrawFee: 0,
        totalBet: 0,
        validBet: 0,
        totalPayout: 0,
        ggr: 0,
        fsBet: 0,
        fsGgr: 0,
        jpBet: 0,
        jpGgr: 0,
        excludedBet: 0,
        totalBonus: 0,
        totalCommission: 0,
      };
    }

    acc[row.uid].inviteCount += row.inviteCount;
    acc[row.uid].achieveCount += row.achieveCount;
    acc[row.uid].betUserCount += row.betUserCount;
    acc[row.uid].depositUserCount += row.depositUserCount;
    acc[row.uid].totalDeposit += row.totalDeposit;
    acc[row.uid].totalWithdraw += row.totalWithdraw;
    acc[row.uid].depositFee += row.depositFee;
    acc[row.uid].withdrawFee += row.withdrawFee;
    acc[row.uid].totalBet += row.totalBet;
    acc[row.uid].validBet += row.validBet;
    acc[row.uid].totalPayout += row.totalPayout;
    acc[row.uid].ggr += row.ggr;
    acc[row.uid].fsBet += row.fsBet;
    acc[row.uid].fsGgr += row.fsGgr;
    acc[row.uid].jpBet += row.jpBet;
    acc[row.uid].jpGgr += row.jpGgr;
    acc[row.uid].excludedBet += row.excludedBet;
    acc[row.uid].totalBonus += row.totalBonus;
    acc[row.uid].totalCommission += row.totalCommission;

    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => a.uid.localeCompare(b.uid));
};

const sumInvite = (rows: AggregatedInviteStat[]) => rows.reduce(
  (acc, row) => ({
    inviteCount: acc.inviteCount + row.inviteCount,
    achieveCount: acc.achieveCount + row.achieveCount,
    betUserCount: acc.betUserCount + row.betUserCount,
    depositUserCount: acc.depositUserCount + row.depositUserCount,
    totalDeposit: acc.totalDeposit + row.totalDeposit,
    totalWithdraw: acc.totalWithdraw + row.totalWithdraw,
    depositFee: acc.depositFee + row.depositFee,
    withdrawFee: acc.withdrawFee + row.withdrawFee,
    totalBet: acc.totalBet + row.totalBet,
    excludedBet: acc.excludedBet + row.excludedBet,
    validBet: acc.validBet + row.validBet,
    totalPayout: acc.totalPayout + row.totalPayout,
    ggr: acc.ggr + row.ggr,
    fsBet: acc.fsBet + row.fsBet,
    fsGgr: acc.fsGgr + row.fsGgr,
    jpBet: acc.jpBet + row.jpBet,
    jpGgr: acc.jpGgr + row.jpGgr,
    totalBonus: acc.totalBonus + row.totalBonus,
    totalCommission: acc.totalCommission + row.totalCommission,
  }),
  { inviteCount: 0, achieveCount: 0, betUserCount: 0, depositUserCount: 0, totalDeposit: 0, totalWithdraw: 0, depositFee: 0, withdrawFee: 0, totalBet: 0, excludedBet: 0, validBet: 0, totalPayout: 0, ggr: 0, fsBet: 0, fsGgr: 0, jpBet: 0, jpGgr: 0, totalBonus: 0, totalCommission: 0 }
);

function PersonalStatsTab() {
  const router = useRouter();
  const [form] = Form.useForm<PersonalFilters>();
  const [filters, setFilters] = useState<PersonalFilters>({ inviterLevel: 1, dateRange: defaultRange() });
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50'],
  });
  const [drawerTarget, setDrawerTarget] = useState<AggregatedPersonalStat | null>(null);

  const [queryStart, queryEnd] = getDateRangeStrings(filters.dateRange);
  const dateRangeText = formatDateRange(queryStart, queryEnd);

  const filteredRows = useMemo(() => personalStats.filter((row) => {
    if (row.date < queryStart || row.date > queryEnd) return false;
    if (filters.uid && row.uid !== filters.uid.trim()) return false;
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

  const aggregatedRows = useMemo(() => aggregatePersonalStats(filteredRows), [filteredRows]);

  const pagedRows = useMemo(() => {
    const current = pagination.current || 1;
    const pageSize = pagination.pageSize || 20;
    const startIndex = (current - 1) * pageSize;
    return aggregatedRows.slice(startIndex, startIndex + pageSize);
  }, [aggregatedRows, pagination]);

  const handleSearch = () => {
    const values = form.getFieldsValue();
    setFilters({
      uid: values.uid?.trim() || undefined,
      inviterUid: values.inviterUid?.trim() || undefined,
      inviterLevel: (values.inviterLevel as 1 | 2 | 3) || 1,
      dateRange: values.dateRange || defaultRange(),
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    const nextRange = defaultRange();
    form.setFieldsValue({ uid: undefined, inviterUid: undefined, inviterLevel: 1, dateRange: nextRange });
    setFilters({ inviterLevel: 1, dateRange: nextRange });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const detailRows = useMemo(() => {
    if (!drawerTarget) {
      return [];
    }
    return filteredRows
      .filter(row => row.uid === drawerTarget.uid)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [drawerTarget, filteredRows]);

  const personalColumns: ColumnsType<AggregatedPersonalStat> = [
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
            <a data-e2e-id={`member-stats-table-inviter-link-${record.uid}`} onClick={() => router.push(`/admin/members/${record.inviterUid}`)}>
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
        <a data-e2e-id={`member-stats-table-member-link-${record.uid}`} onClick={() => router.push(`/admin/members/${record.uid}`)}>
          {record.username}
        </a>
      ),
    },
    {
      title: '手機號',
      dataIndex: 'phone',
      width: 130,
    },
    {
      title: '達標',
      dataIndex: 'achievedInvitation',
      width: 80,
      align: 'center',
      sorter: (a, b) => Number(a.achievedInvitation) - Number(b.achievedInvitation),
      render: (value: boolean) => value
        ? <Tag color="green">是</Tag>
        : <Tag>否</Tag>,
    },
    {
      title: '存款次數',
      dataIndex: 'depositCount',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.depositCount - b.depositCount,
      render: renderInteger,
    },
    {
      title: '總存款',
      dataIndex: 'totalDeposit',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.totalDeposit - b.totalDeposit,
      render: renderAmount,
    },
    {
      title: '提款次數',
      dataIndex: 'withdrawCount',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.withdrawCount - b.withdrawCount,
      render: renderInteger,
    },
    {
      title: '總提款',
      dataIndex: 'totalWithdraw',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.totalWithdraw - b.totalWithdraw,
      render: renderAmount,
    },
    {
      title: '存款手續費',
      dataIndex: 'depositFee',
      width: 130,
      align: 'right',
      sorter: (a, b) => a.depositFee - b.depositFee,
      render: renderAmount,
    },
    {
      title: '提款手續費',
      dataIndex: 'withdrawFee',
      width: 130,
      align: 'right',
      sorter: (a, b) => a.withdrawFee - b.withdrawFee,
      render: renderAmount,
    },
    {
      title: '總投注',
      dataIndex: 'totalBet',
      width: 130,
      align: 'right',
      sorter: (a, b) => a.totalBet - b.totalBet,
      render: renderAmount,
    },
    {
      title: '排除投注額',
      dataIndex: 'excludedBet',
      width: 130,
      align: 'right',
      sorter: (a, b) => a.excludedBet - b.excludedBet,
      render: renderAmount,
    },
    {
      title: '有效流水',
      dataIndex: 'validBet',
      width: 130,
      align: 'right',
      sorter: (a, b) => a.validBet - b.validBet,
      render: renderAmount,
    },
    {
      title: '總派獎',
      dataIndex: 'totalPayout',
      width: 130,
      align: 'right',
      sorter: (a, b) => a.totalPayout - b.totalPayout,
      render: renderAmount,
    },
    {
      title: 'GGR',
      dataIndex: 'ggr',
      width: 130,
      align: 'right',
      sorter: (a, b) => a.ggr - b.ggr,
      render: renderGgr,
    },
    {
      title: 'FS 投注額',
      dataIndex: 'fsBet',
      width: 130,
      align: 'right',
      sorter: (a, b) => a.fsBet - b.fsBet,
      render: renderAmount,
    },
    {
      title: 'FS GGR',
      dataIndex: 'fsGgr',
      width: 130,
      align: 'right',
      sorter: (a, b) => a.fsGgr - b.fsGgr,
      render: renderGgr,
    },
    {
      title: 'JP 投注額',
      dataIndex: 'jpBet',
      width: 130,
      align: 'right',
      sorter: (a, b) => a.jpBet - b.jpBet,
      render: renderAmount,
    },
    {
      title: 'JP GGR',
      dataIndex: 'jpGgr',
      width: 130,
      align: 'right',
      sorter: (a, b) => a.jpGgr - b.jpGgr,
      render: renderGgr,
    },
    {
      title: '總彩金',
      dataIndex: 'totalBonus',
      width: 130,
      align: 'right',
      sorter: (a, b) => a.totalBonus - b.totalBonus,
      render: renderAmount,
    },
    {
      title: '總佣金',
      dataIndex: 'totalCommission',
      width: 130,
      align: 'right',
      sorter: (a, b) => a.totalCommission - b.totalCommission,
      render: renderAmount,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button data-e2e-id={`member-stats-table-detail-btn-${record.uid}`} size="small" onClick={() => setDrawerTarget(record)}>
            查看
          </Button>
          <RecalcButton
            dataE2eId={`member-stats-table-recalc-btn-${record.uid}`}
            successText={`已重算 ${record.username} ${queryStart}~${queryEnd} 個人統計`}
          />
        </Space>
      ),
    },
  ];

  const detailColumns: ColumnsType<PersonalStat> = [
    { title: '統計日期', dataIndex: 'date', width: 120, sorter: (a, b) => a.date.localeCompare(b.date), defaultSortOrder: 'descend' },
    { title: '存款次數', dataIndex: 'depositCount', align: 'right', width: 110, render: renderInteger },
    { title: '總存款', dataIndex: 'totalDeposit', align: 'right', width: 120, render: renderAmount },
    { title: '提款次數', dataIndex: 'withdrawCount', align: 'right', width: 110, render: renderInteger },
    { title: '總提款', dataIndex: 'totalWithdraw', align: 'right', width: 120, render: renderAmount },
    { title: '存款手續費', dataIndex: 'depositFee', align: 'right', width: 120, render: renderAmount },
    { title: '提款手續費', dataIndex: 'withdrawFee', align: 'right', width: 120, render: renderAmount },
    { title: '總投注', dataIndex: 'totalBet', align: 'right', width: 120, render: renderAmount },
    { title: '排除投注額', dataIndex: 'excludedBet', align: 'right', width: 120, render: renderAmount },
    { title: '有效流水', dataIndex: 'validBet', align: 'right', width: 120, render: renderAmount },
    { title: '總派獎', dataIndex: 'totalPayout', align: 'right', width: 120, render: renderAmount },
    { title: 'GGR', dataIndex: 'ggr', align: 'right', width: 120, render: renderGgr },
    { title: 'FS 投注額', dataIndex: 'fsBet', align: 'right', width: 120, render: renderAmount },
    { title: 'FS GGR', dataIndex: 'fsGgr', align: 'right', width: 120, render: renderGgr },
    { title: 'JP 投注額', dataIndex: 'jpBet', align: 'right', width: 120, render: renderAmount },
    { title: 'JP GGR', dataIndex: 'jpGgr', align: 'right', width: 120, render: renderGgr },
    { title: '總彩金', dataIndex: 'totalBonus', align: 'right', width: 120, render: renderAmount },
    { title: '總佣金', dataIndex: 'totalCommission', align: 'right', width: 120, render: renderAmount },
    {
      title: '操作',
      key: 'recalc',
      width: 130,
      fixed: 'right',
      render: (_, record) => (
        <RecalcButton
          dataE2eId={`member-stats-drawer-recalc-btn-${record.uid}-${record.date}`}
          successText={`已重算 ${record.date} 個人統計`}
        />
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card size="small">
        <Form
          form={form}
          layout="vertical"
          initialValues={{ dateRange: defaultRange() }}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="會員帳號" name="uid">
                <Input data-e2e-id="member-stats-filter-uid-input" placeholder="輸入會員帳號" />
              </Form.Item>
            </Col>
            <Col span={6}>
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
                    <Input data-e2e-id="member-stats-filter-inviter-uid-input" placeholder="輸入邀請人帳號" style={{ width: 'calc(100% - 80px)' }} />
                  </Form.Item>
                </Space.Compact>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="統計時間" name="dateRange">
                <RangePicker data-e2e-id="member-stats-filter-date-range" style={{ width: '100%' }} allowClear={false} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label=" ">
                <Space>
                  <Button data-e2e-id="member-stats-filter-query-btn" type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查詢</Button>
                  <Button data-e2e-id="member-stats-filter-reset-btn" icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card size="small" title="統計">
        {(() => {
          const pageSums = sumPersonal(pagedRows);
          const allSums = sumPersonal(aggregatedRows);
          const summaryTableData = [
            { key: 'page', label: '小計', ...pageSums },
            { key: 'all', label: '總計', ...allSums },
          ];
          const summaryColumns = [
            { title: '類型', dataIndex: 'label', width: 60 },
            { title: '總人數', dataIndex: 'memberCount', width: 90, align: 'right' as const, render: renderInteger },
            { title: '達標人數', dataIndex: 'achievedCount', width: 90, align: 'right' as const, render: renderInteger },
            { title: '存款次數', dataIndex: 'depositCount', width: 100, align: 'right' as const, render: renderInteger },
            { title: '總存款', dataIndex: 'totalDeposit', width: 120, align: 'right' as const, render: renderAmount },
            { title: '提款次數', dataIndex: 'withdrawCount', width: 100, align: 'right' as const, render: renderInteger },
            { title: '總提款', dataIndex: 'totalWithdraw', width: 120, align: 'right' as const, render: renderAmount },
            { title: '存款手續費', dataIndex: 'depositFee', width: 120, align: 'right' as const, render: renderAmount },
            { title: '提款手續費', dataIndex: 'withdrawFee', width: 120, align: 'right' as const, render: renderAmount },
            { title: '總投注', dataIndex: 'totalBet', width: 120, align: 'right' as const, render: renderAmount },
            { title: '排除投注額', dataIndex: 'excludedBet', width: 120, align: 'right' as const, render: renderAmount },
            { title: '有效流水', dataIndex: 'validBet', width: 120, align: 'right' as const, render: renderAmount },
            { title: '總派獎', dataIndex: 'totalPayout', width: 120, align: 'right' as const, render: renderAmount },
            { title: 'GGR', dataIndex: 'ggr', width: 120, align: 'right' as const, render: renderGgr },
            { title: 'FS 投注額', dataIndex: 'fsBet', width: 120, align: 'right' as const, render: renderAmount },
            { title: 'FS GGR', dataIndex: 'fsGgr', width: 120, align: 'right' as const, render: renderGgr },
            { title: 'JP 投注額', dataIndex: 'jpBet', width: 120, align: 'right' as const, render: renderAmount },
            { title: 'JP GGR', dataIndex: 'jpGgr', width: 120, align: 'right' as const, render: renderGgr },
            { title: '總彩金', dataIndex: 'totalBonus', width: 120, align: 'right' as const, render: renderAmount },
            { title: '總佣金', dataIndex: 'totalCommission', width: 120, align: 'right' as const, render: renderAmount },
          ];
          return <Table dataSource={summaryTableData} columns={summaryColumns} pagination={false} size="small" rowKey="key" scroll={{ x: 'max-content' }} />;
        })()}
      </Card>

      <Card
        size="small"
        extra={(
          <Button
            data-e2e-id="member-stats-toolbar-export-btn"
            icon={<DownloadOutlined />}
            onClick={() => exportCsv(
              `member-personal-stats-${queryStart}-${queryEnd}.csv`,
              ['統計日期', '會員 UID', '會員帳號', '邀請人 UID', '邀請人帳號', '達標', '存款次數', '總存款', '提款次數', '總提款', '存款手續費', '提款手續費', '總投注', '排除投注額', '有效流水', '總派獎', 'GGR', 'FS 投注額', 'FS GGR', 'JP 投注額', 'JP GGR', '總彩金', '總佣金'],
              aggregatedRows.map(row => [
                dateRangeText,
                row.uid,
                row.username,
                row.inviterUid || '',
                row.inviterUsername || '',
                row.achievedInvitation ? '是' : '否',
                row.depositCount,
                formatAmount(row.totalDeposit),
                row.withdrawCount,
                formatAmount(row.totalWithdraw),
                formatAmount(row.depositFee),
                formatAmount(row.withdrawFee),
                formatAmount(row.totalBet),
                formatAmount(row.excludedBet),
                formatAmount(row.validBet),
                formatAmount(row.totalPayout),
                formatAmount(row.ggr),
                formatAmount(row.fsBet),
                formatAmount(row.fsGgr),
                formatAmount(row.jpBet),
                formatAmount(row.jpGgr),
                formatAmount(row.totalBonus),
                formatAmount(row.totalCommission),
              ])
            )}
          >
            數據匯出
          </Button>
        )}
      >
        <Table
          rowKey="uid"
          columns={personalColumns}
          dataSource={aggregatedRows}
          onRow={(record) => ({ 'data-e2e-id': `member-stats-table-row-${record.uid}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          scroll={{ x: 2200 }}
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
        <div data-e2e-id="member-stats-drawer">
          <Table
            rowKey={(record) => `${record.uid}-${record.date}`}
            columns={detailColumns}
            dataSource={detailRows}
            onRow={(record) => ({ 'data-e2e-id': `member-stats-drawer-row-${record.uid}-${record.date}` } as React.HTMLAttributes<HTMLTableRowElement>)}
            scroll={{ x: 1600 }}
            pagination={{ pageSize: 10, showTotal: total => `共 ${total} 筆` }}
            size="small"
          />
        </div>
      </Drawer>
    </Space>
  );
}

function InviteStatsTab() {
  const router = useRouter();
  const [form] = Form.useForm<PersonalFilters>();
  const [filters, setFilters] = useState<PersonalFilters>({ inviterLevel: 1, dateRange: defaultRange() });
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50'],
  });
  const [drawerTarget, setDrawerTarget] = useState<AggregatedInviteStat | null>(null);

  const [queryStart, queryEnd] = getDateRangeStrings(filters.dateRange);
  const dateRangeText = formatDateRange(queryStart, queryEnd);

  const filteredRows = useMemo(() => inviteStats.filter((row) => {
    if (row.date < queryStart || row.date > queryEnd) return false;
    if (filters.uid && row.uid !== filters.uid.trim()) return false;
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

  const aggregatedRows = useMemo(() => aggregateInviteStats(filteredRows), [filteredRows]);

  const pagedRows = useMemo(() => {
    const current = pagination.current || 1;
    const pageSize = pagination.pageSize || 20;
    const startIndex = (current - 1) * pageSize;
    return aggregatedRows.slice(startIndex, startIndex + pageSize);
  }, [aggregatedRows, pagination]);

  const handleSearch = () => {
    const values = form.getFieldsValue();
    setFilters({
      uid: values.uid?.trim() || undefined,
      inviterUid: values.inviterUid?.trim() || undefined,
      inviterLevel: (values.inviterLevel as 1 | 2 | 3) || 1,
      dateRange: values.dateRange || defaultRange(),
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    const nextRange = defaultRange();
    form.setFieldsValue({ uid: undefined, inviterUid: undefined, inviterLevel: 1, dateRange: nextRange });
    setFilters({ inviterLevel: 1, dateRange: nextRange });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const detailRows = useMemo(() => {
    if (!drawerTarget) {
      return [];
    }
    return filteredRows
      .filter(row => row.uid === drawerTarget.uid)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [drawerTarget, filteredRows]);

  const inviteColumns: ColumnsType<AggregatedInviteStat> = [
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
            <a data-e2e-id={`member-stats-invite-table-inviter-link-${record.uid}`} onClick={() => router.push(`/admin/members/${record.inviterUid}`)}>
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
        <a data-e2e-id={`member-stats-invite-table-member-link-${record.uid}`} onClick={() => router.push(`/admin/members/${record.uid}`)}>
          {record.username}
        </a>
      ),
    },
    {
      title: '手機號',
      dataIndex: 'phone',
      width: 130,
    },
    { title: '邀請人數', dataIndex: 'inviteCount', width: 110, align: 'right', sorter: (a, b) => a.inviteCount - b.inviteCount, render: renderInteger },
    { title: '達成人數', dataIndex: 'achieveCount', width: 110, align: 'right', sorter: (a, b) => a.achieveCount - b.achieveCount, render: renderInteger },
    { title: '投注人數', dataIndex: 'betUserCount', width: 110, align: 'right', sorter: (a, b) => a.betUserCount - b.betUserCount, render: renderInteger },
    { title: '存款人數', dataIndex: 'depositUserCount', width: 110, align: 'right', sorter: (a, b) => a.depositUserCount - b.depositUserCount, render: renderInteger },
    { title: '總存款', dataIndex: 'totalDeposit', width: 120, align: 'right', sorter: (a, b) => a.totalDeposit - b.totalDeposit, render: renderAmount },
    { title: '總提款', dataIndex: 'totalWithdraw', width: 120, align: 'right', sorter: (a, b) => a.totalWithdraw - b.totalWithdraw, render: renderAmount },
    { title: '存款手續費', dataIndex: 'depositFee', width: 120, align: 'right', sorter: (a, b) => a.depositFee - b.depositFee, render: renderAmount },
    { title: '提款手續費', dataIndex: 'withdrawFee', width: 120, align: 'right', sorter: (a, b) => a.withdrawFee - b.withdrawFee, render: renderAmount },
    { title: '總投注', dataIndex: 'totalBet', width: 120, align: 'right', sorter: (a, b) => a.totalBet - b.totalBet, render: renderAmount },
    { title: '排除投注額', dataIndex: 'excludedBet', width: 120, align: 'right', sorter: (a, b) => a.excludedBet - b.excludedBet, render: renderAmount },
    { title: '有效流水', dataIndex: 'validBet', width: 120, align: 'right', sorter: (a, b) => a.validBet - b.validBet, render: renderAmount },
    { title: '總派獎', dataIndex: 'totalPayout', width: 120, align: 'right', sorter: (a, b) => a.totalPayout - b.totalPayout, render: renderAmount },
    { title: 'GGR', dataIndex: 'ggr', width: 120, align: 'right', sorter: (a, b) => a.ggr - b.ggr, render: renderGgr },
    { title: 'FS 投注額', dataIndex: 'fsBet', width: 130, align: 'right', sorter: (a, b) => a.fsBet - b.fsBet, render: renderAmount },
    { title: 'FS GGR', dataIndex: 'fsGgr', width: 130, align: 'right', sorter: (a, b) => a.fsGgr - b.fsGgr, render: renderGgr },
    { title: 'JP 投注額', dataIndex: 'jpBet', width: 130, align: 'right', sorter: (a, b) => a.jpBet - b.jpBet, render: renderAmount },
    { title: 'JP GGR', dataIndex: 'jpGgr', width: 130, align: 'right', sorter: (a, b) => a.jpGgr - b.jpGgr, render: renderGgr },
    { title: '總彩金', dataIndex: 'totalBonus', width: 120, align: 'right', sorter: (a, b) => a.totalBonus - b.totalBonus, render: renderAmount },
    { title: '總佣金', dataIndex: 'totalCommission', width: 120, align: 'right', sorter: (a, b) => a.totalCommission - b.totalCommission, render: renderAmount },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button data-e2e-id={`member-stats-invite-table-detail-btn-${record.uid}`} size="small" onClick={() => setDrawerTarget(record)}>
            查看
          </Button>
          <RecalcButton
            dataE2eId={`member-stats-invite-table-recalc-btn-${record.uid}`}
            successText={`已重算 ${record.username} ${queryStart}~${queryEnd} 邀請統計`}
          />
        </Space>
      ),
    },
  ];

  const inviteDetailColumns: ColumnsType<InviteStat> = [
    { title: '統計日期', dataIndex: 'date', width: 120, sorter: (a, b) => a.date.localeCompare(b.date), defaultSortOrder: 'descend' },
    { title: '邀請人數', dataIndex: 'inviteCount', align: 'right', width: 100, render: renderInteger },
    { title: '達成人數', dataIndex: 'achieveCount', align: 'right', width: 100, render: renderInteger },
    { title: '投注人數', dataIndex: 'betUserCount', align: 'right', width: 100, render: renderInteger },
    { title: '存款人數', dataIndex: 'depositUserCount', align: 'right', width: 100, render: renderInteger },
    { title: '總存款', dataIndex: 'totalDeposit', align: 'right', width: 120, render: renderAmount },
    { title: '總提款', dataIndex: 'totalWithdraw', align: 'right', width: 120, render: renderAmount },
    { title: '存款手續費', dataIndex: 'depositFee', align: 'right', width: 120, render: renderAmount },
    { title: '提款手續費', dataIndex: 'withdrawFee', align: 'right', width: 120, render: renderAmount },
    { title: '總投注', dataIndex: 'totalBet', align: 'right', width: 120, render: renderAmount },
    { title: '排除投注額', dataIndex: 'excludedBet', align: 'right', width: 120, render: renderAmount },
    { title: '有效流水', dataIndex: 'validBet', align: 'right', width: 120, render: renderAmount },
    { title: '總派獎', dataIndex: 'totalPayout', align: 'right', width: 120, render: renderAmount },
    { title: 'GGR', dataIndex: 'ggr', align: 'right', width: 120, render: renderGgr },
    { title: 'FS 投注額', dataIndex: 'fsBet', align: 'right', width: 120, render: renderAmount },
    { title: 'FS GGR', dataIndex: 'fsGgr', align: 'right', width: 120, render: renderGgr },
    { title: 'JP 投注額', dataIndex: 'jpBet', align: 'right', width: 120, render: renderAmount },
    { title: 'JP GGR', dataIndex: 'jpGgr', align: 'right', width: 120, render: renderGgr },
    { title: '總彩金', dataIndex: 'totalBonus', align: 'right', width: 120, render: renderAmount },
    { title: '總佣金', dataIndex: 'totalCommission', align: 'right', width: 120, render: renderAmount },
    {
      title: '操作',
      key: 'recalc',
      width: 130,
      fixed: 'right',
      render: (_, record) => (
        <RecalcButton
          dataE2eId={`member-stats-invite-drawer-recalc-btn-${record.uid}-${record.date}`}
          successText={`已重算 ${record.date} 邀請統計`}
        />
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card size="small">
        <Form
          form={form}
          layout="vertical"
          initialValues={{ dateRange: defaultRange() }}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="會員帳號" name="uid">
                <Input data-e2e-id="member-stats-invite-filter-uid-input" placeholder="輸入會員帳號" />
              </Form.Item>
            </Col>
            <Col span={6}>
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
                    <Input data-e2e-id="member-stats-invite-filter-inviter-uid-input" placeholder="輸入邀請人帳號" style={{ width: 'calc(100% - 80px)' }} />
                  </Form.Item>
                </Space.Compact>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="統計時間" name="dateRange">
                <RangePicker data-e2e-id="member-stats-invite-filter-date-range" style={{ width: '100%' }} allowClear={false} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label=" ">
                <Space>
                  <Button data-e2e-id="member-stats-invite-filter-query-btn" type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查詢</Button>
                  <Button data-e2e-id="member-stats-invite-filter-reset-btn" icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card size="small" title="統計">
        {(() => {
          const pageSums = sumInvite(pagedRows);
          const allSums = sumInvite(aggregatedRows);
          const summaryTableData = [
            { key: 'page', label: '小計', ...pageSums },
            { key: 'all', label: '總計', ...allSums },
          ];
          const summaryColumns = [
            { title: '類型', dataIndex: 'label', width: 60 },
            { title: '邀請人數', dataIndex: 'inviteCount', width: 100, align: 'right' as const, render: renderInteger },
            { title: '達成人數', dataIndex: 'achieveCount', width: 100, align: 'right' as const, render: renderInteger },
            { title: '投注人數', dataIndex: 'betUserCount', width: 100, align: 'right' as const, render: renderInteger },
            { title: '存款人數', dataIndex: 'depositUserCount', width: 100, align: 'right' as const, render: renderInteger },
            { title: '總存款', dataIndex: 'totalDeposit', width: 120, align: 'right' as const, render: renderAmount },
            { title: '總提款', dataIndex: 'totalWithdraw', width: 120, align: 'right' as const, render: renderAmount },
            { title: '存款手續費', dataIndex: 'depositFee', width: 120, align: 'right' as const, render: renderAmount },
            { title: '提款手續費', dataIndex: 'withdrawFee', width: 120, align: 'right' as const, render: renderAmount },
            { title: '總投注', dataIndex: 'totalBet', width: 120, align: 'right' as const, render: renderAmount },
            { title: '排除投注額', dataIndex: 'excludedBet', width: 120, align: 'right' as const, render: renderAmount },
            { title: '有效流水', dataIndex: 'validBet', width: 120, align: 'right' as const, render: renderAmount },
            { title: '總派獎', dataIndex: 'totalPayout', width: 120, align: 'right' as const, render: renderAmount },
            { title: 'GGR', dataIndex: 'ggr', width: 120, align: 'right' as const, render: renderGgr },
            { title: 'FS 投注額', dataIndex: 'fsBet', width: 120, align: 'right' as const, render: renderAmount },
            { title: 'FS GGR', dataIndex: 'fsGgr', width: 120, align: 'right' as const, render: renderGgr },
            { title: 'JP 投注額', dataIndex: 'jpBet', width: 120, align: 'right' as const, render: renderAmount },
            { title: 'JP GGR', dataIndex: 'jpGgr', width: 120, align: 'right' as const, render: renderGgr },
            { title: '總彩金', dataIndex: 'totalBonus', width: 120, align: 'right' as const, render: renderAmount },
            { title: '總佣金', dataIndex: 'totalCommission', width: 120, align: 'right' as const, render: renderAmount },
          ];
          return <Table dataSource={summaryTableData} columns={summaryColumns} pagination={false} size="small" rowKey="key" scroll={{ x: 'max-content' }} />;
        })()}
      </Card>

      <Card
        size="small"
        extra={(
          <Button
            data-e2e-id="member-stats-invite-toolbar-export-btn"
            icon={<DownloadOutlined />}
            onClick={() => exportCsv(
              `member-invite-stats-${queryStart}-${queryEnd}.csv`,
              ['統計日期', '會員 UID', '會員帳號', '邀請人 UID', '邀請人帳號', '邀請人數', '達成人數', '投注人數', '存款人數', '總存款', '總提款', '存款手續費', '提款手續費', '總投注', '排除投注額', '有效流水', '總派獎', 'GGR', 'FS 投注額', 'FS GGR', 'JP 投注額', 'JP GGR', '總彩金', '總佣金'],
              aggregatedRows.map(row => [
                dateRangeText,
                row.uid,
                row.username,
                row.inviterUid || '',
                row.inviterUsername || '',
                row.inviteCount,
                row.achieveCount,
                row.betUserCount,
                row.depositUserCount,
                formatAmount(row.totalDeposit),
                formatAmount(row.totalWithdraw),
                formatAmount(row.depositFee),
                formatAmount(row.withdrawFee),
                formatAmount(row.totalBet),
                formatAmount(row.excludedBet),
                formatAmount(row.validBet),
                formatAmount(row.totalPayout),
                formatAmount(row.ggr),
                formatAmount(row.fsBet),
                formatAmount(row.fsGgr),
                formatAmount(row.jpBet),
                formatAmount(row.jpGgr),
                formatAmount(row.totalBonus),
                formatAmount(row.totalCommission),
              ])
            )}
          >
            數據匯出
          </Button>
        )}
      >
        <Table
          rowKey="uid"
          columns={inviteColumns}
          dataSource={aggregatedRows}
          onRow={(record) => ({ 'data-e2e-id': `member-stats-invite-table-row-${record.uid}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          scroll={{ x: 2100 }}
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
        <div data-e2e-id="member-stats-invite-drawer">
          <Table
            rowKey={(record) => `${record.uid}-${record.date}`}
            columns={inviteDetailColumns}
            dataSource={detailRows}
            onRow={(record) => ({ 'data-e2e-id': `member-stats-invite-drawer-row-${record.uid}-${record.date}` } as React.HTMLAttributes<HTMLTableRowElement>)}
            scroll={{ x: 1500 }}
            pagination={{ pageSize: 10, showTotal: total => `共 ${total} 筆` }}
            size="small"
          />
        </div>
      </Drawer>
    </Space>
  );
}

export default function MemberStatsPage() {
  const tabItems = [
    { key: 'personal', label: <span data-e2e-id="member-stats-tab-personal">個人統計</span>, children: <PersonalStatsTab /> },
    { key: 'invite', label: <span data-e2e-id="member-stats-tab-invite">邀請統計</span>, children: <InviteStatsTab /> },
  ];

  return (
    <div>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>會員日統計</Title>
          <Text type="secondary">依會員查詢指定區間的個人與邀請統計資料</Text>
        </div>
        <Tabs data-e2e-id="member-stats-tab" items={tabItems} />
      </Space>
    </div>
  );
}

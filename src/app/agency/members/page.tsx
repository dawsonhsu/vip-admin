'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Button, Card, Checkbox, Col, DatePicker, Dropdown, Form, Input, Popover,
  Row, Space, Table, Typography, message,
} from 'antd';
import { ColumnHeightOutlined, FolderOpenOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { agencyAccount, agencyActiveMembers, agencyMembers, type AgencyMember } from '@/data/agency/shared';
import { downloadCsv, formatCount, formatPeso, formatTs, memberStateLabels, toCsvCell } from '@/lib/agencyUtils';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const secondaryStyle: React.CSSProperties = { color: '#8c8c8c', fontSize: 12 };
const stateColors: Record<number, string> = { 1: '#52c41a', 2: '#fa8c16', 3: '#ff4d4f' };
const gainColor = (value: string | number) => Number(value) > 0 ? '#52c41a' : Number(value) < 0 ? '#ff4d4f' : undefined;

interface MemberListFd {
  username?: string;
  phone?: string;
  parent_name?: string;
  parent_phone?: string;
  start_time?: number;
  end_time?: number;
}

type MemberFilterForm = Omit<MemberListFd, 'start_time' | 'end_time'> & {
  created_at?: [Dayjs, Dayjs] | null;
};

function memberFilters(values: MemberFilterForm): MemberListFd {
  return {
    username: values.username?.trim(), phone: values.phone?.trim(),
    parent_name: values.parent_name?.trim(), parent_phone: values.parent_phone?.trim(),
    start_time: values.created_at?.[0].startOf('day').unix(),
    end_time: values.created_at?.[1].endOf('day').unix(),
  };
}

function matches(value: string, query?: string): boolean {
  return !query || value.toLowerCase().includes(query.toLowerCase());
}

function AmountPair({ total, month, color, signed = false, counts }: {
  total: string; month: string; color?: string; signed?: boolean; counts?: [number, number];
}) {
  return (
    <div style={{ whiteSpace: 'nowrap', lineHeight: 1.8 }}>
      <div><span style={secondaryStyle}>累計 </span><span style={{ color: signed ? gainColor(total) : color }}>{formatPeso(total)}</span>{counts && <span style={secondaryStyle}> · {formatCount(counts[0])} 筆</span>}</div>
      <div><span style={secondaryStyle}>當月 </span><span style={{ color: signed ? gainColor(month) : color }}>{formatPeso(month)}</span>{counts && <span style={secondaryStyle}> · {formatCount(counts[1])} 筆</span>}</div>
    </div>
  );
}

const exportColumns: Array<[string, (row: AgencyMember, index: number) => string]> = [
  ['序號', (_r, index) => String(index + 1)],
  ['在線狀態', (r) => r.is_online ? '在線' : '離線'],
  ['會員帳號', (r) => r.username], ['暱稱', (r) => r.nick_name],
  ['真實姓名', (r) => Object.values(r.real_usernames).filter(Boolean).join(' ')],
  ['會員手機', (r) => r.phone], ['會員狀態', (r) => memberStateLabels[r.state] ?? '-'],
  ['VIP 等級', (r) => `VIP ${r.vip}`],
  ['累計存款', (r) => formatPeso(r.deposit_total)], ['累計存款筆數', (r) => String(r.deposit_count)],
  ['當月存款', (r) => formatPeso(r.stat.deposit_amount_month)], ['當月存款筆數', (r) => String(r.stat.deposit_count_month)],
  ['累計提款', (r) => formatPeso(r.withdraw_total)], ['累計提款筆數', (r) => String(r.withdraw_count)],
  ['當月提款', (r) => formatPeso(r.stat.withdraw_amount_month)], ['當月提款筆數', (r) => String(r.stat.withdraw_count_month)],
  ['累計存提差', (r) => formatPeso(r.stat.dw_diff)], ['當月存提差', (r) => formatPeso(r.stat.dw_diff_month)],
  ['累計投注', (r) => formatPeso(r.stat.bet)], ['當月投注', (r) => formatPeso(r.stat.bet_month)],
  ['累計有效投注', (r) => formatPeso(r.stat.valid_bet)], ['當月有效投注', (r) => formatPeso(r.stat.valid_bet_month)],
  ['累計 GGR', (r) => formatPeso(r.stat.ggr)], ['當月 GGR', (r) => formatPeso(r.stat.ggr_month)],
  ['稅收', (r) => formatPeso(r.stat.tax)], ['場館費', (r) => formatPeso(r.stat.venue_fee)],
  ['活動禮金', (r) => formatPeso(r.stat.bonus)],
  ['最後登入', (r) => formatTs(r.last_login_at)], ['註冊時間', (r) => formatTs(r.created_at)],
];

export default function AgencyMembersPage() {
  const [form] = Form.useForm<MemberFilterForm>();
  const [messageApi, contextHolder] = message.useMessage();
  const [mounted, setMounted] = useState(false);
  const [allRows, setAllRows] = useState<AgencyMember[]>([]);
  const [filters, setFilters] = useState<MemberListFd>({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [density, setDensity] = useState<TableProps<AgencyMember>['size']>('small');
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  // 註冊時間預設不帶條件，進頁即可看到完整下線名單；
  // 真實 API 預設抓最近 7 天，但本示範的註冊時間散佈一年以上，帶預設值會開場空白。
  useEffect(() => {
    setFilters({});
    setAllRows([...agencyMembers]);
    setMounted(true);
  }, [form]);

  const rows = useMemo(() => allRows.filter((row) => {
    if (!matches(row.username, filters.username) || !matches(row.phone, filters.phone)) return false;
    // 此示範的所有會員都屬於登入代理，代理條件因此會全數符合或全數排除。
    if (!matches(agencyAccount.username, filters.parent_name) || !matches(agencyAccount.phone, filters.parent_phone)) return false;
    if (filters.start_time !== undefined && row.created_at < filters.start_time) return false;
    if (filters.end_time !== undefined && row.created_at > filters.end_time) return false;
    return true;
  }), [allRows, filters]);

  const totals = useMemo(() => ({
    members: rows.length,
    active: agencyActiveMembers(rows).length,
    deposit: rows.reduce((sum, r) => sum + Math.round(Number(r.stat.deposit_amount_month) * 100), 0) / 100,
    validBet: rows.reduce((sum, r) => sum + Math.round(Number(r.stat.valid_bet_month) * 100), 0) / 100,
    ggr: rows.reduce((sum, r) => sum + Math.round(Number(r.stat.ggr_month) * 100), 0) / 100,
  }), [rows]);

  const search = (values: MemberFilterForm) => {
    setFilters(memberFilters(values));
    setPagination((current) => ({ ...current, current: 1 }));
  };

  const reset = () => {
    form.resetFields();
    search({});
  };

  const onExport = () => {
    const lines = [
      exportColumns.map(([label]) => toCsvCell(label)).join(','),
      ...rows.map((row, index) => exportColumns.map(([, read]) => toCsvCell(read(row, index))).join(',')),
    ];
    downloadCsv(`會員列表_${dayjs().format('YYYYMMDD_HHmmss')}.csv`, lines.join('\n'));
  };

  const columns: ColumnsType<AgencyMember> = [
    { title: '序號', key: 'index', width: 80, fixed: 'left', align: 'center', render: (_v, _r, index) => (pagination.current - 1) * pagination.pageSize + index + 1 },
    { title: '在線狀態', key: 'is_online', width: 110, render: (_v, r) => <Space size={6}><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: r.is_online ? '#52c41a' : '#8c8c8c' }} /><span style={{ color: r.is_online ? '#52c41a' : '#8c8c8c' }}>{r.is_online ? '在線' : '離線'}</span></Space> },
    {
      title: '會員資訊', key: 'username', width: 280,
      render: (_v, r) => (
        <div style={{ lineHeight: 1.8 }}>
          <Text strong copyable={{ text: r.username, tooltips: ['複製會員帳號', '已複製'] }} data-e2e-id={`agency-members-username-${r.uid}-copy`}>{r.username}</Text>
          <div style={secondaryStyle}>暱稱：{r.nick_name}</div>
          <div style={secondaryStyle}>真實姓名：{[r.real_usernames.first_name, r.real_usernames.middle_name, r.real_usernames.last_name].filter(Boolean).join(' ')}</div>
          <div style={secondaryStyle}>{r.phone}</div>
        </div>
      ),
    },
    { title: '會員狀態', key: 'state', width: 120, render: (_v, r) => <span style={{ color: stateColors[r.state] }}>{memberStateLabels[r.state] ?? '-'}</span> },
    { title: 'VIP 等級', key: 'vip', width: 110, render: (_v, r) => `VIP ${r.vip}` },
    { title: '存款', key: 'deposit', width: 200, render: (_v, r) => <AmountPair total={r.deposit_total} month={r.stat.deposit_amount_month} color="#52c41a" counts={[r.deposit_count, r.stat.deposit_count_month]} /> },
    { title: '提款', key: 'withdraw', width: 200, render: (_v, r) => <AmountPair total={r.withdraw_total} month={r.stat.withdraw_amount_month} color="#ff4d4f" counts={[r.withdraw_count, r.stat.withdraw_count_month]} /> },
    { title: '存提差', key: 'dw_diff', width: 200, render: (_v, r) => <AmountPair total={r.stat.dw_diff} month={r.stat.dw_diff_month} signed /> },
    { title: '投注', key: 'bet', width: 180, render: (_v, r) => <AmountPair total={r.stat.bet} month={r.stat.bet_month} /> },
    { title: '有效投注', key: 'valid_bet', width: 180, render: (_v, r) => <AmountPair total={r.stat.valid_bet} month={r.stat.valid_bet_month} /> },
    { title: 'GGR', key: 'ggr', width: 180, render: (_v, r) => <AmountPair total={r.stat.ggr} month={r.stat.ggr_month} signed /> },
    { title: '稅收', key: 'tax', width: 150, align: 'right', render: (_v, r) => formatPeso(r.stat.tax) },
    { title: '場館費', key: 'venue_fee', width: 150, align: 'right', render: (_v, r) => formatPeso(r.stat.venue_fee) },
    { title: '活動禮金', key: 'bonus', width: 150, align: 'right', render: (_v, r) => formatPeso(r.stat.bonus) },
    { title: '最後登入', key: 'last_login_at', width: 180, render: (_v, r) => formatTs(r.last_login_at) },
    { title: '註冊時間', key: 'created_at', width: 180, render: (_v, r) => formatTs(r.created_at) },
  ];
  const visibleColumns = columns.filter((column) => !hiddenColumns.includes(String(column.key)));

  return (
    <div>
      {contextHolder}
      <Card data-e2e-id="agency-members-filter-card" style={{ marginBottom: 16 }}>
        <Form form={form} onFinish={search} layout="horizontal" colon={false} labelCol={{ flex: '0 0 84px' }} wrapperCol={{ flex: 1 }}>
          <Row gutter={[16, 0]}>
            {([
              ['username', '會員帳號'], ['phone', '會員手機'], ['parent_name', '代理帳號'], ['parent_phone', '代理手機'],
            ] as const).map(([name, label]) => (
              <Col key={name} xs={24} sm={12} xl={6}>
                <Form.Item name={name} label={label}><Input allowClear placeholder={`請輸入${label}`} data-e2e-id={`agency-members-filter-${name}-input`} /></Form.Item>
              </Col>
            ))}
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="created_at" label="註冊時間">
                <RangePicker allowClear format="YYYY-MM-DD" placeholder={['開始日期', '結束日期']} style={{ width: '100%' }} data-e2e-id="agency-members-filter-created_at-range" />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button data-e2e-id="agency-members-filter-reset-btn" onClick={reset} style={{ background: '#e6a23c', borderColor: '#e6a23c', color: '#fff' }}>重置</Button>
              <Button data-e2e-id="agency-members-filter-search-btn" htmlType="submit" style={{ background: '#67c23a', borderColor: '#67c23a', color: '#fff' }}>搜尋</Button>
            </Space>
          </div>
        </Form>
      </Card>

      <Card data-e2e-id="agency-members-table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>會員列表 <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>示範資料</Text></Title>
          <Space wrap>
            <Button type="primary" icon={<FolderOpenOutlined />} onClick={onExport} disabled={!mounted} data-e2e-id="agency-members-toolbar-export-btn">匯出</Button>
            <Button icon={<ReloadOutlined />} data-e2e-id="agency-members-toolbar-refresh-btn" onClick={() => { setAllRows([...agencyMembers]); void messageApi.success('會員列表已重新整理'); }}>重新整理</Button>
            <Dropdown trigger={['click']} menu={{
              selectable: true, selectedKeys: [density ?? 'small'],
              items: [{ key: 'small', label: <span data-e2e-id="agency-members-density-small-option">緊湊</span> }, { key: 'middle', label: <span data-e2e-id="agency-members-density-middle-option">適中</span> }, { key: 'large', label: <span data-e2e-id="agency-members-density-large-option">寬鬆</span> }],
              onClick: ({ key }) => setDensity(key as TableProps<AgencyMember>['size']),
            }}><Button icon={<ColumnHeightOutlined />} data-e2e-id="agency-members-toolbar-density-btn">密度</Button></Dropdown>
            <Popover trigger="click" placement="bottomRight" title="顯示欄位" content={
              <Space direction="vertical" style={{ maxHeight: 360, overflowY: 'auto' }}>
                {columns.map((column) => <Checkbox key={String(column.key)} checked={!hiddenColumns.includes(String(column.key))} disabled={column.key === 'index'} data-e2e-id={`agency-members-settings-${column.key}-checkbox`} onChange={(event) => setHiddenColumns((current) => event.target.checked ? current.filter((key) => key !== column.key) : [...current, String(column.key)])}>{String(column.title)}</Checkbox>)}
                <Button size="small" onClick={() => setHiddenColumns([])} data-e2e-id="agency-members-settings-reset-btn">還原欄位</Button>
              </Space>
            }><Button icon={<SettingOutlined />} data-e2e-id="agency-members-toolbar-settings-btn">設定</Button></Popover>
          </Space>
        </div>

        <Row gutter={[24, 12]} data-e2e-id="agency-members-summary-strip" style={{ padding: '12px 16px', marginBottom: 16, background: '#fafafa', borderRadius: 6 }}>
          {[
            { label: '會員數', value: formatCount(totals.members) },
            { label: '活躍會員數', value: formatCount(totals.active) },
            { label: '當月存款', value: formatPeso(totals.deposit), color: '#52c41a' },
            { label: '當月有效投注', value: formatPeso(totals.validBet) },
            { label: '當月 GGR', value: formatPeso(totals.ggr), color: gainColor(totals.ggr) },
          ].map((item) => <Col key={item.label} xs={12} sm={8} xl={{ flex: 1 }}><div style={secondaryStyle}>{item.label}</div><div style={{ marginTop: 4, fontSize: 18, fontWeight: 600, color: item.color }}>{item.value}</div></Col>)}
        </Row>

        <Table<AgencyMember>
          data-e2e-id="agency-members-table"
          columns={visibleColumns}
          dataSource={mounted ? rows : []}
          rowKey="uid"
          size={density}
          scroll={{ x: visibleColumns.reduce((sum, column) => sum + Number(column.width), 0) }}
          locale={{ emptyText: '沒有符合條件的會員' }}
          onRow={(record) => ({ 'data-e2e-id': `agency-members-table-row-${record.uid}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          pagination={{
            ...pagination, showSizeChanger: true, showQuickJumper: true,
            onChange: (current, pageSize) => setPagination({ current, pageSize }),
            showTotal: (total, range) => `當前：第 ${total ? Math.ceil(range[0] / pagination.pageSize) : 0} 頁, 共 ${total} 筆資料`,
          }}
        />
      </Card>
    </div>
  );
}

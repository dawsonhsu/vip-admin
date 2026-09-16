'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Button, Card, Checkbox, Col, DatePicker, Dropdown, Form, Input, Popover,
  Row, Space, Table, Typography, message,
} from 'antd';
import { ColumnHeightOutlined, FolderOpenOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { agencyAccount, agencyMembers, type AgencyMember } from '@/data/agency/shared';
import { downloadCsv, formatTs, maskName, maskPhone, memberStateLabels, toCsvCell } from '@/lib/agencyUtils';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const secondaryStyle: React.CSSProperties = { color: '#8c8c8c', fontSize: 12 };
const stateColors: Record<number, string> = { 1: '#52c41a', 2: '#fa8c16', 3: '#ff4d4f' };

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

const exportColumns: Array<[string, (row: AgencyMember, index: number) => string]> = [
  ['序號', (_r, index) => String(index + 1)],
  ['在線狀態', (r) => r.is_online ? '在線' : '離線'],
  ['會員帳號', (r) => r.username],
  ['暱稱', (r) => r.nick_name],
  ['真實姓名', (r) => maskName(Object.values(r.real_usernames).filter(Boolean).join(' '))],
  ['會員手機', (r) => maskPhone(r.phone)],
  ['會員狀態', (r) => memberStateLabels[r.state] ?? '-'],
  ['註冊時間', (r) => formatTs(r.created_at)],
  ['最後登入時間', (r) => formatTs(r.last_login_at)],
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
          <div style={secondaryStyle}>真實姓名：{maskName([r.real_usernames.first_name, r.real_usernames.middle_name, r.real_usernames.last_name].filter(Boolean).join(' '))}</div>
          <div style={secondaryStyle}>{maskPhone(r.phone)}</div>
        </div>
      ),
    },
    { title: '會員狀態', key: 'state', width: 120, render: (_v, r) => <span style={{ color: stateColors[r.state] }}>{memberStateLabels[r.state] ?? '-'}</span> },
    { title: '註冊時間', key: 'created_at', width: 180, render: (_v, r) => formatTs(r.created_at) },
    { title: '最後登入時間', key: 'last_login_at', width: 180, render: (_v, r) => formatTs(r.last_login_at) },
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

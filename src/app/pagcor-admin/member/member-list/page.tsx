'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, DatePicker, Descriptions, Form, Input, Modal, Row, Select, Space, Table, Tooltip, Typography } from 'antd';
import { ColumnHeightOutlined, FolderOpenOutlined, InfoCircleOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { pagcorSites } from '@/data/pagcorMockData';
import { generatePagcorMembers, pagcorMemberStates, pagcorMemberSubStates, pagcorMemberKycStatuses, type PagcorMember, type PagcorMemberBrand, type PagcorMemberWallet } from '@/data/pagcorMemberData';
import { downloadCsv, formatPagcorAmount, rangeOf, toCsvCell, type PagcorQuickRange } from '@/lib/pagcorReportUtils';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const brands: PagcorMemberBrand[] = ['filbet', 'filplay'];
const brandNames = { filbet: 'Filbet', filplay: 'Filplay' };
const quickButtons: Array<{ key: PagcorQuickRange; label: string; id: string }> = [
  { key: 'today', label: '今 日', id: 'today' }, { key: 'yesterday', label: '昨 日', id: 'yesterday' },
  { key: 'week', label: '本 周', id: 'week' }, { key: 'month', label: '本 月', id: 'month' },
  { key: 'lastMonth', label: '上 月', id: 'last-month' },
];
interface MemberFilters {
  brandOwner?: PagcorMemberBrand[];
  uid?: string;
  username?: string;
  phone?: string;
  state?: PagcorMember['state'];
  subState?: PagcorMember['subState'];
  kycStatus?: PagcorMember['kycStatus'];
  site?: string;
  dateRange?: [Dayjs, Dayjs] | null;
}
const exportColumns: Array<[string, (record: PagcorMember) => string]> = [
  ['品牌归属', (r) => r.brandOwner], ['UID', (r) => r.uid], ['用户名', (r) => r.username],
  ['First Name', (r) => r.firstName], ['Middle Name', (r) => r.middleName], ['Last Name', (r) => r.lastName],
  ['手机号', (r) => r.phone], ['门店', (r) => r.site],
  ['Filbet 余额', (r) => r.wallets.filbet ? formatPagcorAmount(r.wallets.filbet.balance) : '-'],
  ['Filplay 余额', (r) => r.wallets.filplay ? formatPagcorAmount(r.wallets.filplay.balance) : '-'],
  ['会员状态', (r) => r.state], ['子状态', (r) => r.subState], ['KYC状态', (r) => r.kycStatus],
  ['注册时间', (r) => r.createdAt],
];

export default function MemberListPage() {
  const [form] = Form.useForm<MemberFilters>();
  const [filters, setFilters] = useState<MemberFilters>({});
  const [records, setRecords] = useState<PagcorMember[]>([]);
  const [mounted, setMounted] = useState(false);
  const [activeQuick, setActiveQuick] = useState<PagcorQuickRange | null>(null);
  const [detail, setDetail] = useState<PagcorMember | null>(null);

  useEffect(() => {
    setRecords(generatePagcorMembers(120, dayjs()));
    setMounted(true);
  }, []);

  const filteredData = useMemo(() => records.filter((record) => {
    if (filters.brandOwner?.length && !filters.brandOwner.includes(record.brandOwner)) return false;
    for (const key of ['uid', 'username', 'phone'] as const) {
      if (filters[key] && !record[key].includes(filters[key]!.trim())) return false;
    }
    for (const key of ['state', 'subState', 'kycStatus', 'site'] as const) {
      if (filters[key] && record[key] !== filters[key]) return false;
    }
    const range = filters.dateRange;
    if (range?.[0] && range?.[1]) {
      const time = dayjs(record.createdAt);
      if (time.isBefore(range[0]) || time.isAfter(range[1])) return false;
    }
    return true;
  }), [records, filters]);

  const onReset = () => {
    form.resetFields();
    setActiveQuick(null);
    setFilters({});
  };
  const onExport = () => downloadCsv(`会员列表_${dayjs().format('YYYYMMDD_HHmmss')}.csv`, [
    exportColumns.map(([label]) => toCsvCell(label)).join(','),
    ...filteredData.map((record) => exportColumns.map(([, get]) => toCsvCell(get(record))).join(',')),
  ].join('\n'));

  const balanceColumn = (brand: PagcorMemberBrand): ColumnsType<PagcorMember>[number] => ({
    title: `${brandNames[brand]} 余额`, key: `${brand}-balance`, width: 130, align: 'right',
    sorter: (a, b) => (a.wallets[brand]?.balance ?? -Infinity) - (b.wallets[brand]?.balance ?? -Infinity) || 0,
    render: (_, record) => {
      const wallet = record.wallets[brand];
      return wallet ? <Space size={4}>
        {formatPagcorAmount(wallet.balance)}
        <Tooltip title={<><div>流水完成：{formatPagcorAmount(wallet.turnoverDone)}</div><div>流水未完成：{formatPagcorAmount(wallet.turnoverLeft)}</div></>}>
          <InfoCircleOutlined data-e2e-id={`member-list-${brand}-wallet-info-${record.uid}`} />
        </Tooltip>
      </Space> : '-';
    },
  });
  const columns: ColumnsType<PagcorMember> = [
    { title: '品牌归属', dataIndex: 'brandOwner', width: 90, fixed: 'left' },
    { title: 'UID', dataIndex: 'uid', width: 180, fixed: 'left' },
    { title: '用户名', dataIndex: 'username', width: 150 },
    { title: 'First Name', dataIndex: 'firstName', width: 100 },
    { title: 'Middle Name', dataIndex: 'middleName', width: 110 },
    { title: 'Last Name', dataIndex: 'lastName', width: 110 },
    { title: '手机号', dataIndex: 'phone', width: 140 },
    { title: '门店', dataIndex: 'site', width: 150, ellipsis: true },
    balanceColumn('filbet'), balanceColumn('filplay'),
    { title: '会员状态', dataIndex: 'state', width: 100 },
    { title: '子状态', dataIndex: 'subState', width: 100 },
    { title: 'KYC状态', dataIndex: 'kycStatus', width: 170 },
    { title: '注册时间', dataIndex: 'createdAt', width: 190 },
    { title: '操作', key: 'action', width: 80, render: (_, record) => <a data-e2e-id={`member-list-detail-link-${record.uid}`} onClick={() => setDetail(record)}>详情</a> },
  ];
  type WalletRow = { brand: PagcorMemberBrand; wallet: PagcorMemberWallet | null };
  const walletColumns: ColumnsType<WalletRow> = [
    { title: '品牌', dataIndex: 'brand', render: (brand: PagcorMemberBrand) => brandNames[brand] },
    ...(['balance', 'turnoverDone', 'turnoverLeft'] as const).map((key, index) => ({
      title: ['余额', '流水完成', '流水未完成'][index], key, align: 'right' as const,
      render: (_: unknown, row: WalletRow) => row.wallet ? formatPagcorAmount(row.wallet[key]) : '-',
    })),
  ];
  const basicFields: Array<[string, keyof PagcorMember]> = [
    ['UID', 'uid'], ['用户名', 'username'], ['品牌归属', 'brandOwner'], ['门店', 'site'],
    ['First Name', 'firstName'], ['Middle Name', 'middleName'], ['Last Name', 'lastName'], ['性别', 'gender'],
    ['生日', 'birthday'], ['国籍', 'nationality'], ['手机号', 'phone'], ['注册时间', 'createdAt'], ['会员状态', 'state'], ['子状态', 'subState'],
  ];

  return <div>
    <Card data-e2e-id="member-list-filter-card" style={{ marginBottom: 16 }}>
      <Form form={form} layout="horizontal" colon={false} labelCol={{ flex: '0 0 88px' }} wrapperCol={{ flex: 1 }}>
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12} xl={6}><Form.Item name="brandOwner" label="品牌归属"><Select data-e2e-id="member-list-filter-brand-owner-select" mode="multiple" placeholder="请选择品牌归属" allowClear options={brands.map((value) => ({ value, label: value }))} /></Form.Item></Col>
          {(['uid', 'username', 'phone'] as const).map((key, index) => <Col key={key} xs={24} sm={12} xl={6}><Form.Item name={key} label={['UID', '用户名', '手机号'][index]}><Input data-e2e-id={`member-list-filter-${key}-input`} placeholder={`请输入${['UID', '用户名', '手机号'][index]}`} allowClear /></Form.Item></Col>)}
          {[
            { key: 'state', id: 'state', label: '会员状态', options: pagcorMemberStates },
            { key: 'subState', id: 'sub-state', label: '子状态', options: pagcorMemberSubStates },
            { key: 'kycStatus', id: 'kyc-status', label: 'KYC状态', options: pagcorMemberKycStatuses },
          ].map((field) => <Col key={field.key} xs={24} sm={12} xl={6}><Form.Item name={field.key} label={field.label}><Select data-e2e-id={`member-list-filter-${field.id}-select`} placeholder="请选择" allowClear options={field.options.map((value) => ({ value, label: value }))} /></Form.Item></Col>)}
          <Col xs={24} sm={12} xl={6}><Form.Item name="site" label="门店"><Select data-e2e-id="member-list-filter-site-select" placeholder="请选择" allowClear showSearch optionFilterProp="label" options={pagcorSites.map((value) => ({ value, label: value }))} /></Form.Item></Col>
          <Col xs={24} xl={18}>
            <Form.Item label="注册时间"><Space wrap size={8}>
              <Form.Item name="dateRange" noStyle><RangePicker data-e2e-id="member-list-filter-date-range" showTime format="YYYY-MM-DD HH:mm:ss" placeholder={['开始日期', '结束日期']} style={{ width: 380 }} onChange={() => setActiveQuick(null)} /></Form.Item>
              {quickButtons.map((button) => <Button key={button.key} data-e2e-id={`member-list-filter-quick-${button.id}-btn`} type={activeQuick === button.key ? 'primary' : 'text'} onClick={() => { setActiveQuick(button.key); form.setFieldsValue({ dateRange: rangeOf(button.key) }); }}>{button.label}</Button>)}
            </Space></Form.Item>
          </Col>
        </Row>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Space>
          <Button data-e2e-id="member-list-filter-reset-btn" onClick={onReset} style={{ background: '#e6a23c', borderColor: '#e6a23c', color: '#fff' }}>重 置</Button>
          <Button data-e2e-id="member-list-filter-search-btn" onClick={() => setFilters(form.getFieldsValue())} style={{ background: '#67c23a', borderColor: '#67c23a', color: '#fff' }}>搜 索</Button>
        </Space></div>
      </Form>
    </Card>
    <Card data-e2e-id="member-list-table-card" styles={{ body: { paddingInline: 8 } }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Title level={5} style={{ margin: 0 }}>会员列表</Title>
        <Space>
          <Button data-e2e-id="member-list-toolbar-export-btn" type="primary" icon={<FolderOpenOutlined />} onClick={onExport}>导 出</Button>
          <Button data-e2e-id="member-list-toolbar-refresh-btn" icon={<ReloadOutlined />} />
          <Button data-e2e-id="member-list-toolbar-density-btn" icon={<ColumnHeightOutlined />} />
          <Button data-e2e-id="member-list-toolbar-settings-btn" icon={<SettingOutlined />} />
        </Space>
      </div>
      <Table data-e2e-id="member-list-table" columns={columns} dataSource={mounted ? filteredData : []} rowKey="uid" size="small" scroll={{ x: 1930 }} onRow={(record) => ({ 'data-e2e-id': `member-list-table-row-${record.uid}` } as React.HTMLAttributes<HTMLTableRowElement>)} pagination={{ pageSize: 20, showSizeChanger: true, showQuickJumper: true, showTotal: (t, range) => `当前：第 ${Math.ceil(range[0] / 20)} 页, 共 ${t} 条数据` }} />
    </Card>
    <Modal data-e2e-id="member-list-detail-modal" open={!!detail} title="会员详情" width={880} onCancel={() => setDetail(null)} closable={false} footer={<Button data-e2e-id="member-list-detail-close-btn" onClick={() => setDetail(null)}>关 闭</Button>}>
      {detail && <>
        <Title level={5}>基本信息</Title>
        <Descriptions bordered size="small" column={2} items={basicFields.map(([label, key]) => ({ key, label, children: String(detail[key]) }))} />
        <Title level={5}>钱包余额</Title>
        <Table data-e2e-id="member-list-detail-wallet-table" bordered size="small" pagination={false} rowKey="brand" columns={walletColumns} dataSource={brands.map((brand) => ({ brand, wallet: detail.wallets[brand] }))} onRow={(record) => ({ 'data-e2e-id': `member-list-detail-wallet-row-${record.brand}` } as React.HTMLAttributes<HTMLTableRowElement>)} />
        <Title level={5}>KYC 信息 <Tooltip title="KYC 资料由 Filbet 与 Filplay 共用"><InfoCircleOutlined data-e2e-id="member-list-detail-kyc-info" /></Tooltip></Title>
        <Descriptions bordered size="small" column={2} items={[
          { key: 'status', label: 'KYC状态', children: detail.kycStatus }, { key: 'type', label: '证件类型', children: detail.idType },
          { key: 'number', label: '证件号码', children: detail.idNumber }, { key: 'reviewed', label: '审核时间', children: detail.kycReviewedAt },
          { key: 'remark', label: '备注', children: detail.kycRemark },
        ]} />
      </>}
    </Modal>
  </div>;
}

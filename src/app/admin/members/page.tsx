'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Card, Table, Tag, Input, Select, DatePicker, Button, Space, Typography, Form, Badge, InputNumber, Modal, Alert, message, Checkbox, Descriptions, Segmented, Tooltip,
} from 'antd';
import {
  ReloadOutlined, FolderOpenOutlined, ColumnHeightOutlined, SettingOutlined, CopyOutlined, TeamOutlined, PlusOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import {
  getMembers, type MemberItem,
  capabilityDict, getCapabilityDictItem,
  getMemberCapabilityStates,
} from '@/data/mockData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const memberStatusColor: Record<string, string> = {
  Verified: 'green',
  Unverified: 'orange',
  Suspended: 'red',
};

const kycStatusColor: Record<string, string> = {
  Approved: 'green',
  Pending: 'gold',
  Rejected: 'red',
  'Not Submitted': 'default',
};

const riskLevelColor: Record<string, string> = {
  無: 'default',
  低: 'green',
  中: 'orange',
  高: 'red',
};

const riskTagColor: Record<string, string> = {
  正常: 'green',
  異常充值: 'orange',
  多帳號: 'red',
  可疑行為: 'volcano',
};

export default function MembersPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [collapsed, setCollapsed] = useState(false);
  const [allMembers, setAllMembers] = useState<MemberItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [transferModal, setTransferModal] = useState<{ open: boolean; member: MemberItem | null }>({ open: false, member: null });
  const [transferForm] = Form.useForm();
  const [transferTarget, setTransferTarget] = useState<{ status: 'idle' | 'found' | 'notFound'; member: MemberItem | null }>({ status: 'idle', member: null });
  const [searchType, setSearchType] = useState<string>('手機號');
  const [dateType, setDateType] = useState<string>('註冊時間');
  const [riskType, setRiskType] = useState<string>('風控等級');
  const [countType, setCountType] = useState<string>('存款次數');

  useEffect(() => {
    setAllMembers(getMembers());
    setMounted(true);
  }, []);

  const countFieldMap: Record<string, keyof MemberItem> = {
    '存款次數': 'depositCount',
    '提款次數': 'withdrawCount',
    '累計存款': 'totalDeposit',
    '累計提款': 'totalWithdraw',
    '累計存提差': 'depositWithdrawDiff',
    '累計GGR': 'ggr',
  };

  const filteredData = useMemo(() => {
    return allMembers.filter((item) => {
      // Dynamic search field (手機號/賬號/UID)
      if (filters.searchValue) {
        const val = filters.searchValue;
        if (searchType === '手機號' && !item.phone.includes(val)) return false;
        if (searchType === '賬號' && !item.account.includes(val)) return false;
        if (searchType === 'UID' && !item.uid.includes(val)) return false;
      }
      if (filters.memberStatus && item.memberStatus !== filters.memberStatus) return false;
      if (filters.agentStatus && filters.agentStatus !== '全部' && item.agentStatus !== filters.agentStatus) return false;
      if (filters.accountType && item.accountType !== filters.accountType) return false;
      if (filters.registerIP && !item.registerIP.includes(filters.registerIP)) return false;
      if (filters.parentAgentPhone && !item.parentAgentPhone.includes(filters.parentAgentPhone)) return false;
      if (filters.vipLevel !== undefined && filters.vipLevel !== null && item.vipLevel !== filters.vipLevel) return false;
      if (filters.kycStatus && item.kycStatus !== filters.kycStatus) return false;
      // 能力狀態多選 + 命中模式 + 限制類型
      const capabilityKeys: string[] = filters.capabilityKeys ?? [];
      if (capabilityKeys.length > 0 || filters.restrictionType) {
        const states = getMemberCapabilityStates(item.uid);
        const now = dayjs();
        const matchType = (s: ReturnType<typeof getMemberCapabilityStates>[number]) => {
          if (!s.restricted) return false;
          const isPermanent = !s.restrictedUntil;
          const isActiveTemp = s.restrictedUntil ? dayjs(s.restrictedUntil).isAfter(now) : false;
          if (filters.restrictionType === 'permanent') return isPermanent;
          if (filters.restrictionType === 'temporary') return isActiveTemp;
          return isPermanent || isActiveTemp;
        };
        const activeKeys = states.filter(matchType).map(s => s.capabilityKey);
        if (capabilityKeys.length > 0) {
          if (filters.capabilityMatch === 'all') {
            if (!capabilityKeys.every(k => activeKeys.includes(k))) return false;
          } else {
            if (!capabilityKeys.some(k => activeKeys.includes(k))) return false;
          }
        } else if (filters.restrictionType && filters.restrictionType !== 'any') {
          if (activeKeys.length === 0) return false;
        }
      }
      // Dynamic risk filter (風控等級/風控標籤)
      if (filters.riskValue) {
        if (riskType === '風控等級' && item.riskLevel !== filters.riskValue) return false;
        if (riskType === '風控標籤' && item.riskTag !== filters.riskValue) return false;
      }
      // Dynamic count range filter
      if (filters.countMin !== undefined && filters.countMin !== null) {
        const field = countFieldMap[countType];
        if (field && (item[field] as number) < filters.countMin) return false;
      }
      if (filters.countMax !== undefined && filters.countMax !== null) {
        const field = countFieldMap[countType];
        if (field && (item[field] as number) > filters.countMax) return false;
      }
      if (filters.trafficSource && item.trafficSource !== filters.trafficSource) return false;
      if (filters.inviterType === '有邀請人') {
        if (item.inviterPhone === '-') return false;
        if (filters.inviterPhone && !item.inviterPhone.includes(filters.inviterPhone)) return false;
      }
      if (filters.inviterType === '無邀請人' && item.inviterPhone !== '-') return false;
      return true;
    });
  }, [filters, allMembers, searchType, riskType, countType]);

  const onSearch = () => {
    const values = form.getFieldsValue();
    setFilters(values);
  };

  const onReset = () => {
    form.resetFields();
    setFilters({});
    setSearchType('手機號');
    setDateType('註冊時間');
    setRiskType('風控等級');
    setCountType('存款次數');
  };

  const columns: ColumnsType<MemberItem> = [
    {
      title: 'UID',
      dataIndex: 'uid',
      width: 180,
      fixed: 'left',
      render: (val: string) => (
        <div style={{ fontSize: 12 }}>
          <span>{val}</span>
          <Button data-e2e-id={`members-table-copy-uid-btn-${val}`} type="text" size="small" icon={<CopyOutlined />} style={{ padding: '0 4px' }} />
          <TeamOutlined style={{ marginLeft: 4, color: '#888' }} />
        </div>
      ),
    },
    {
      title: '帳號',
      dataIndex: 'account',
      width: 130,
      fixed: 'left',
      render: (val: string) => (
        <div style={{ fontSize: 12 }}>
          <a data-e2e-id={`members-table-account-link-${val}`} style={{ color: '#1668dc' }}>{val}</a>
          <Button data-e2e-id={`members-table-copy-account-btn-${val}`} type="text" size="small" icon={<CopyOutlined />} style={{ padding: '0 4px' }} />
        </div>
      ),
    },
    {
      title: '手機',
      dataIndex: 'phone',
      width: 160,
      render: (val: string, record: MemberItem) => (
        <div style={{ fontSize: 12 }}>
          <span>{val}</span>
          <Button data-e2e-id={`members-table-copy-phone-btn-${record.uid}`} type="text" size="small" icon={<CopyOutlined />} style={{ padding: '0 4px' }} />
        </div>
      ),
    },
    {
      title: '餘額',
      key: 'balance',
      width: 160,
      render: (_, r) => (
        <div style={{ fontSize: 12, lineHeight: '20px' }}>
          <div><Text type="secondary">錢包餘額: </Text><span>₱{r.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div><Text type="secondary">商城代幣餘額: </Text><span>{r.mallTokenBalance.toLocaleString()}</span></div>
        </div>
      ),
      sorter: (a, b) => a.walletBalance - b.walletBalance,
    },
    {
      title: '會員等級',
      key: 'vipInfo',
      width: 150,
      render: (_, r) => (
        <div style={{ fontSize: 12, lineHeight: '20px' }}>
          <div><Tag data-e2e-id={`members-table-vip-tag-${r.uid}`} color="blue">V{r.vipLevel}</Tag><Tag data-e2e-id={`members-table-tier-tag-${r.uid}`} color="purple">{r.tierRange}</Tag></div>
          <div><Text type="secondary">XP: </Text><span>{r.xpPoints.toLocaleString()}</span></div>
          <div><a data-e2e-id={`members-table-xp-log-link-${r.uid}`} style={{ color: '#1668dc', fontSize: 11 }}>XP成長日誌</a></div>
        </div>
      ),
    },
    {
      title: '邀請人',
      dataIndex: 'inviterPhone',
      width: 140,
      render: (val: string, record: MemberItem) => val && val !== '-'
        ? <a data-e2e-id={`members-table-inviter-link-${record.uid}`} style={{ color: '#1668dc', fontSize: 12 }}>{val}</a>
        : <Button data-e2e-id={`members-table-transfer-btn-${record.uid}`} type="link" size="small" style={{ padding: 0, fontSize: 12 }} onClick={() => { setTransferModal({ open: true, member: record }); transferForm.resetFields(); setTransferTarget({ status: 'idle', member: null }); }}>轉移</Button>,
    },
    {
      title: '代理資格',
      dataIndex: 'agentStatus',
      width: 90,
      render: (val: string, record: MemberItem) => <Tag data-e2e-id={`members-table-agent-status-tag-${record.uid}`} color={val === '已開啟' ? 'blue' : 'default'}>{val}</Tag>,
    },
    {
      title: '會員狀態',
      key: 'statusCombo',
      width: 150,
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>會員狀態: </Text>
            <Tag data-e2e-id={`members-table-member-status-tag-${r.uid}`} color={memberStatusColor[r.memberStatus]} style={{ fontSize: 11 }}>{r.memberStatus}</Tag>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>KYC狀態: </Text>
            <Tag data-e2e-id={`members-table-kyc-status-tag-${r.uid}`} color={kycStatusColor[r.kycStatus]} style={{ fontSize: 11 }}>{r.kycStatus}</Tag>
          </div>
        </Space>
      ),
    },
    {
      title: '能力狀態',
      key: 'capabilityStatus',
      width: 220,
      render: (_, r) => {
        const states = getMemberCapabilityStates(r.uid);
        const now = dayjs();
        const restricted = states
          .filter(s => s.restricted && (!s.restrictedUntil || dayjs(s.restrictedUntil).isAfter(now)))
          .map(s => ({ state: s, dict: getCapabilityDictItem(s.capabilityKey) }))
          .filter((x): x is { state: typeof x.state; dict: NonNullable<typeof x.dict> } => Boolean(x.dict));
        if (restricted.length === 0) {
          return <Tag style={{ fontSize: 11, color: '#52c41a', borderColor: '#b7eb8f', background: '#f6ffed' }}>全部正常</Tag>;
        }
        const visible = restricted.slice(0, 3);
        const hidden = restricted.slice(3);
        const tooltip = (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {restricted.map(({ state, dict }) => (
              <div key={dict.key}>
                <Tag color={dict.color} style={{ fontSize: 11, marginRight: 6 }}>{dict.nameZh}</Tag>
                <span style={{ fontSize: 11 }}>{state.restrictedUntil ? `至 ${state.restrictedUntil}` : '永久'}</span>
              </div>
            ))}
          </div>
        );
        return (
          <Tooltip title={tooltip} placement="topLeft">
            <span data-e2e-id={`members-table-capability-tags-${r.uid}`} style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4 }}>
              {visible.map(({ dict }) => (
                <Tag key={dict.key} color={dict.color} style={{ fontSize: 11, marginRight: 0 }}>{dict.nameZh}</Tag>
              ))}
              {hidden.length > 0 && (
                <Tag style={{ fontSize: 11, marginRight: 0 }}>+{hidden.length}</Tag>
              )}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: '風控等級',
      dataIndex: 'riskLevel',
      width: 90,
      render: (val: string, record: MemberItem) => <Tag data-e2e-id={`members-table-risk-level-tag-${record.uid}`} color={riskLevelColor[val] || 'default'}>{val}</Tag>,
    },
    {
      title: '風控標籤',
      dataIndex: 'riskTag',
      width: 100,
      render: (val: string, record: MemberItem) => val ? <Tag data-e2e-id={`members-table-risk-tag-${record.uid}`} color={riskTagColor[val] || 'default'}>{val}</Tag> : <span style={{ color: '#888' }}>-</span>,
    },
    {
      title: '最近登錄',
      key: 'loginInfo',
      width: 240,
      render: (_, r) => (
        <div style={{ fontSize: 12, lineHeight: '20px' }}>
          <div><Text type="secondary">登錄時間: </Text><span>{r.lastLoginTime}</span></div>
          <div>
            <Text type="secondary">IP: </Text><span>{r.loginIP}</span>
            {r.loginIPDuplicates > 1 && <Tag color="orange" style={{ marginLeft: 4, fontSize: 10 }}>x{r.loginIPDuplicates}</Tag>}
          </div>
          <div>
            <Text type="secondary">設備: </Text><span>{r.loginDevice}</span>
            {r.loginDeviceDuplicates > 1 && <Tag color="orange" style={{ marginLeft: 4, fontSize: 10 }}>x{r.loginDeviceDuplicates}</Tag>}
          </div>
          <div><Text type="secondary">版本: </Text><span>{r.clientVersion}</span></div>
          <div><Text type="secondary">註冊時間: </Text><span>{r.registerTime}</span></div>
          <div><Text type="secondary">註冊IP: </Text><span>{r.registerIP}</span></div>
        </div>
      ),
    },
    {
      title: '引流渠道',
      dataIndex: 'trafficSource',
      width: 100,
      render: (val: string) => <span style={{ fontSize: 12 }}>{val}</span>,
    },
    {
      title: '歸屬門店',
      dataIndex: 'storeName',
      width: 120,
      render: (val: string) => <span style={{ fontSize: 12 }}>{val}</span>,
    },
    {
      title: '在線狀態',
      dataIndex: 'isOnline',
      width: 90,
      render: (val: boolean) => val
        ? <Badge color="green" text={<span style={{ fontSize: 12 }}>在線</span>} />
        : <Badge color="gray" text={<span style={{ fontSize: 12 }}>離線</span>} />,
    },
    {
      title: '存款',
      key: 'deposit',
      width: 130,
      render: (_, r) => (
        <div style={{ fontSize: 12, lineHeight: '20px' }}>
          <div><Text type="secondary">累計存款: </Text></div>
          <div>₱{r.totalDeposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div><Text type="secondary">存款次數: </Text><span>{r.depositCount}</span></div>
        </div>
      ),
      sorter: (a, b) => a.totalDeposit - b.totalDeposit,
    },
    {
      title: '提款',
      key: 'withdraw',
      width: 130,
      render: (_, r) => (
        <div style={{ fontSize: 12, lineHeight: '20px' }}>
          <div><Text type="secondary">累計提現: </Text></div>
          <div>₱{r.totalWithdraw.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div><Text type="secondary">提現次數: </Text><span>{r.withdrawCount}</span></div>
        </div>
      ),
      sorter: (a, b) => a.totalWithdraw - b.totalWithdraw,
    },
    {
      title: '存提差',
      dataIndex: 'depositWithdrawDiff',
      width: 120,
      render: (val: number) => <span>₱{val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>,
      sorter: (a, b) => a.depositWithdrawDiff - b.depositWithdrawDiff,
    },
    {
      title: 'GGR',
      dataIndex: 'ggr',
      width: 120,
      render: (val: number) => <span>₱{val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>,
      sorter: (a, b) => a.ggr - b.ggr,
    },
    {
      title: '累計投注',
      dataIndex: 'totalBet',
      width: 130,
      render: (val: number) => <span>₱{val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>,
      sorter: (a, b) => a.totalBet - b.totalBet,
    },
    {
      title: '活動禮金',
      dataIndex: 'activityBonus',
      width: 120,
      render: (val: number) => <span>₱{val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>,
      sorter: (a, b) => a.activityBonus - b.activityBonus,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Button
            data-e2e-id={`members-table-detail-btn-${record.uid}`}
            type="link" size="small"
            style={{ padding: 0, height: 'auto', color: '#1668dc' }}
            onClick={() => router.push(`/admin/members/${record.uid}`)}
          >
            查看明細
          </Button>
          <Button data-e2e-id={`members-table-unblock-btn-${record.uid}`} type="link" size="small" disabled style={{ padding: 0, height: 'auto' }}>解封</Button>
          <Button data-e2e-id={`members-table-risk-btn-${record.uid}`} type="link" size="small" danger style={{ padding: 0, height: 'auto' }}>風控</Button>
          <Button data-e2e-id={`members-table-reset-password-btn-${record.uid}`} type="link" size="small" style={{ padding: 0, height: 'auto', color: '#1668dc' }}>重置密碼</Button>
          <Button data-e2e-id={`members-table-convert-agent-btn-${record.uid}`} type="link" size="small" style={{ padding: 0, height: 'auto', color: '#1668dc' }}>轉為代理</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, color: '#e8e8e8' }}>會員列表</Title>
        <Text type="secondary">查詢與管理所有平台會員帳號、狀態與財務資料</Text>
      </div>

      {/* Filter Card */}
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" style={{ gap: 12, flexWrap: collapsed ? 'nowrap' : 'wrap', rowGap: 12, overflow: collapsed ? 'hidden' : undefined }}>
          <Form.Item name="searchValue" label={
            <Select data-e2e-id="members-filter-search-type-select" value={searchType} onChange={(v) => { setSearchType(v); form.setFieldValue('searchValue', undefined); }} variant="borderless" size="small" style={{ width: 80 }}>
              <Select.Option value="手機號">手機號</Select.Option>
              <Select.Option value="賬號">賬號</Select.Option>
              <Select.Option value="UID">UID</Select.Option>
            </Select>
          }>
            <Input data-e2e-id="members-filter-search-value-input" placeholder={`輸入${searchType}`} allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="memberStatus" label="會員狀態">
            <Select data-e2e-id="members-filter-member-status-select" placeholder="全部" allowClear style={{ width: 120 }}>
              <Select.Option value="Verified">Verified</Select.Option>
              <Select.Option value="Unverified">Unverified</Select.Option>
              <Select.Option value="Suspended">Suspended</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="agentStatus" label="代理資格">
            <Select data-e2e-id="members-filter-agent-status-select" placeholder="全部" allowClear style={{ width: 110 }}>
              <Select.Option value="全部">全部</Select.Option>
              <Select.Option value="已開啟">已開啟</Select.Option>
              <Select.Option value="未開啟">未開啟</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="accountType" label="賬號類型">
            <Select data-e2e-id="members-filter-account-type-select" placeholder="全部" allowClear style={{ width: 100 }}>
              <Select.Option value="正式">正式</Select.Option>
              <Select.Option value="測試">測試</Select.Option>
            </Select>
          </Form.Item>
          {!collapsed && (
            <>
              <Form.Item name="registerIP" label="註冊IP">
                <Input data-e2e-id="members-filter-register-ip-input" placeholder="輸入IP" allowClear style={{ width: 130 }} />
              </Form.Item>
              <Form.Item name="parentAgentPhone" label="上級代理手機">
                <Input data-e2e-id="members-filter-parent-agent-phone-input" placeholder="輸入手機號" allowClear style={{ width: 140 }} />
              </Form.Item>
              <Form.Item name="vipLevel" label="會員等級">
                <Select data-e2e-id="members-filter-vip-level-select" placeholder="全部" allowClear style={{ width: 100 }}>
                  {Array.from({ length: 31 }, (_, i) => (
                    <Select.Option key={i} value={i}>V{i}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="dateRange" label={
                <Select data-e2e-id="members-filter-date-type-select" value={dateType} onChange={(v) => setDateType(v)} variant="borderless" size="small" style={{ width: 110 }}>
                  <Select.Option value="註冊時間">註冊時間</Select.Option>
                  <Select.Option value="最後登錄時間">最後登錄時間</Select.Option>
                </Select>
              }>
                <RangePicker data-e2e-id="members-filter-date-range" style={{ width: 260 }} />
              </Form.Item>
              <Form.Item name="kycStatus" label="KYC狀態">
                <Select data-e2e-id="members-filter-kyc-status-select" placeholder="全部" allowClear style={{ width: 130 }}>
                  <Select.Option value="Approved">Approved</Select.Option>
                  <Select.Option value="Pending">Pending</Select.Option>
                  <Select.Option value="Rejected">Rejected</Select.Option>
                  <Select.Option value="Not Submitted">Not Submitted</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="capabilityKeys" label="能力狀態">
                <Select
                  data-e2e-id="members-filter-capability-keys-select"
                  mode="multiple"
                  placeholder="選擇能力"
                  allowClear
                  style={{ minWidth: 220 }}
                  options={capabilityDict
                    .filter(c => c.enabled)
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map(c => ({ value: c.key, label: c.nameZh }))}
                  maxTagCount="responsive"
                />
              </Form.Item>
              <Form.Item name="capabilityMatch" label="命中模式" initialValue="any">
                <Segmented
                  data-e2e-id="members-filter-capability-match-segmented"
                  size="small"
                  options={[
                    { label: '任一命中', value: 'any' },
                    { label: '全部命中', value: 'all' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="restrictionType" label="限制類型" initialValue="any">
                <Segmented
                  data-e2e-id="members-filter-restriction-type-segmented"
                  size="small"
                  options={[
                    { label: '全部', value: 'any' },
                    { label: '永久', value: 'permanent' },
                    { label: '暫時', value: 'temporary' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="riskValue" label={
                <Select data-e2e-id="members-filter-risk-type-select" value={riskType} onChange={(v) => { setRiskType(v); form.setFieldValue('riskValue', undefined); }} variant="borderless" size="small" style={{ width: 90 }}>
                  <Select.Option value="風控等級">風控等級</Select.Option>
                  <Select.Option value="風控標籤">風控標籤</Select.Option>
                </Select>
              }>
                <Select data-e2e-id="members-filter-risk-value-select" placeholder="全部" allowClear style={{ width: 100 }}>
                  {riskType === '風控等級' ? (
                    <>
                      <Select.Option value="無">無</Select.Option>
                      <Select.Option value="低">低</Select.Option>
                      <Select.Option value="中">中</Select.Option>
                      <Select.Option value="高">高</Select.Option>
                    </>
                  ) : (
                    <>
                      <Select.Option value="正常">正常</Select.Option>
                      <Select.Option value="異常充值">異常充值</Select.Option>
                      <Select.Option value="多帳號">多帳號</Select.Option>
                      <Select.Option value="可疑行為">可疑行為</Select.Option>
                    </>
                  )}
                </Select>
              </Form.Item>
              <Form.Item label={
                <Select data-e2e-id="members-filter-count-type-select" value={countType} onChange={(v) => { setCountType(v); form.setFieldValue('countMin', undefined); form.setFieldValue('countMax', undefined); }} variant="borderless" size="small" style={{ width: 100 }}>
                  <Select.Option value="存款次數">存款次數</Select.Option>
                  <Select.Option value="提款次數">提款次數</Select.Option>
                  <Select.Option value="累計存款">累計存款</Select.Option>
                  <Select.Option value="累計提款">累計提款</Select.Option>
                  <Select.Option value="累計存提差">累計存提差</Select.Option>
                  <Select.Option value="累計GGR">累計GGR</Select.Option>
                </Select>
              }>
                <Space>
                  <Form.Item name="countMin" noStyle>
                    <InputNumber data-e2e-id="members-filter-count-min-input" placeholder="最小" min={0} style={{ width: 80 }} />
                  </Form.Item>
                  <span>~</span>
                  <Form.Item name="countMax" noStyle>
                    <InputNumber data-e2e-id="members-filter-count-max-input" placeholder="最大" min={0} style={{ width: 80 }} />
                  </Form.Item>
                </Space>
              </Form.Item>
              <Form.Item name="trafficSource" label="引流渠道">
                <Select data-e2e-id="members-filter-traffic-source-select" placeholder="全部" allowClear style={{ width: 110 }}>
                  <Select.Option value="adjust">adjust</Select.Option>
                  <Select.Option value="organic">organic</Select.Option>
                  <Select.Option value="facebook">facebook</Select.Option>
                  <Select.Option value="google">google</Select.Option>
                  <Select.Option value="tiktok">tiktok</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="inviterType" label="邀請人">
                <Select data-e2e-id="members-filter-inviter-type-select" placeholder="全部" allowClear style={{ width: 120 }}>
                  <Select.Option value="有邀請人">有邀請人</Select.Option>
                  <Select.Option value="無邀請人">無邀請人</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item noStyle shouldUpdate={(prev, cur) => prev.inviterType !== cur.inviterType}>
                {() => form.getFieldValue('inviterType') === '有邀請人' ? (
                  <Form.Item name="inviterPhone" label="邀請人手機">
                    <Input data-e2e-id="members-filter-inviter-phone-input" placeholder="輸入手機號" allowClear style={{ width: 140 }} />
                  </Form.Item>
                ) : null}
              </Form.Item>
            </>
          )}
          <Form.Item>
            <Space>
              <Button data-e2e-id="members-filter-query-btn" type="primary" onClick={onSearch}>查詢</Button>
              <Button data-e2e-id="members-filter-reset-btn" onClick={onReset}>重置</Button>
              <Button data-e2e-id="members-filter-toggle-btn" type="link" onClick={() => setCollapsed(v => !v)}>
                {collapsed ? '展開' : '收起'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Table Card */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Space>
            <Button data-e2e-id="members-toolbar-create-btn" type="primary" icon={<PlusOutlined />}>新增會員</Button>
            <Button data-e2e-id="members-toolbar-export-btn" icon={<FolderOpenOutlined />}>導出</Button>
            <Button data-e2e-id="members-toolbar-refresh-btn" icon={<ReloadOutlined />} />
            <Button data-e2e-id="members-toolbar-density-btn" icon={<ColumnHeightOutlined />} />
            <Button data-e2e-id="members-toolbar-settings-btn" icon={<SettingOutlined />} />
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          onRow={(record) => ({ 'data-e2e-id': `members-table-row-${record.uid}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          scroll={{ x: 3010 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 筆`,
          }}
          size="small"
        />
      </Card>

      {/* Transfer Modal */}
      <Modal
        title="邀請人轉移"
        open={transferModal.open}
        onCancel={() => { setTransferModal({ open: false, member: null }); setTransferTarget({ status: 'idle', member: null }); }}
        onOk={() => {
          transferForm.validateFields().then((values) => {
            if (transferTarget.status !== 'found') return;
            message.success(`已將 ${transferModal.member?.account} 轉移至邀請人 ${values.targetPhone}`);
            setTransferModal({ open: false, member: null });
            setTransferTarget({ status: 'idle', member: null });
          });
        }}
        okText="確認轉移"
        cancelText="取消"
        okButtonProps={{ ...{ disabled: transferTarget.status !== 'found' }, 'data-e2e-id': 'members-modal-submit-btn' }}
        cancelButtonProps={{ 'data-e2e-id': 'members-modal-cancel-btn' }}
      >
        <div data-e2e-id="members-modal">
          {transferModal.member && (
            <div style={{ marginBottom: 16 }}>
            <Text type="secondary">被轉移會員：</Text>
            <Text strong>{transferModal.member.account}</Text>
            <Text type="secondary" style={{ marginLeft: 8 }}>({transferModal.member.phone})</Text>
            </div>
          )}
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="轉移提示"
            description={
              <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                <li>被轉移人需無下級會員、無邀請人。</li>
                <li>更新後系統將重新計算好友邀請獎勵、里程碑獎勵。</li>
              </ul>
            }
          />
          <Form form={transferForm} layout="vertical">
            <Form.Item
              name="targetPhone"
              label="目標邀請人手機號"
              rules={[{ required: true, message: '請輸入目標邀請人手機號' }]}
              validateStatus={transferTarget.status === 'notFound' ? 'error' : transferTarget.status === 'found' ? 'success' : undefined}
              help={transferTarget.status === 'notFound' ? '查無此手機號，請確認後重新輸入' : undefined}
            >
              <Input.Search
                data-e2e-id="members-modal-target-phone-input"
                placeholder="輸入欲轉移的目標手機號"
                enterButton="查詢"
                onSearch={(val) => {
                  if (!val) { setTransferTarget({ status: 'idle', member: null }); return; }
                  const found = allMembers.find(m => m.phone === val && m.id !== transferModal.member?.id);
                  if (found) {
                    setTransferTarget({ status: 'found', member: found });
                  } else {
                    setTransferTarget({ status: 'notFound', member: null });
                  }
                }}
              />
            </Form.Item>
            {transferTarget.status === 'found' && transferTarget.member && (
              <div style={{ marginBottom: 16, padding: 12, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
                <div style={{ marginBottom: 4 }}>
                  <Text type="secondary">UID：</Text><Text>{transferTarget.member.uid}</Text>
                </div>
                <div style={{ marginBottom: 4 }}>
                  <Text type="secondary">帳號：</Text><Text>{transferTarget.member.account}</Text>
                </div>
                <div>
                  <Text type="secondary">餘額：</Text><Text>₱{transferTarget.member.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                </div>
                <Alert type="error" showIcon style={{ marginTop: 8 }} message="請仔細核對轉移目標，轉移後無法再次轉移" />
              </div>
            )}
            <Form.Item name="remark" label="備註" rules={[{ required: true, message: '請輸入備註' }]}>
              <Input.TextArea data-e2e-id="members-modal-remark-input" placeholder="輸入備註" rows={3} />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
}

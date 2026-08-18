'use client';

import React, { useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  DownloadOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  generateMockSmsOtpRecords,
  initialProviderConfigs,
  sendModeLabel,
  sendModeTagColor,
  type ProviderChannel,
  type SendMode,
  type SmsOtpRecord,
  type SmsProviderConfig,
  type SmsUsage,
} from '@/data/smsOtpData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const channelOptions: ProviderChannel[] = ['m360', 'hamsV2', 'laaffic', 'test'];
const usageOptions: SmsUsage[] = ['login', 'register', 'retrieve_password', 'withdraw', 'bind_phone'];

const defaultRange: [Dayjs, Dayjs] = [
  dayjs('2026-05-28').startOf('day'),
  dayjs('2026-06-04').endOf('day'),
];

interface FilterState {
  channel?: ProviderChannel | 'all';
  sendMode?: SendMode | 'all';
  usage?: SmsUsage | 'all';
  phone?: string;
  memberAccount?: string;
  uid?: string;
  range?: [Dayjs, Dayjs];
}

const mockRecords = generateMockSmsOtpRecords(120);

export default function SmsOtpPage() {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<FilterState>({
    channel: 'all',
    sendMode: 'all',
    usage: 'all',
    range: defaultRange,
  });
  const [revealMap, setRevealMap] = useState<Record<string, boolean>>({});

  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [providerDraft, setProviderDraft] = useState<SmsProviderConfig[]>(initialProviderConfigs);
  const [providers, setProviders] = useState<SmsProviderConfig[]>(initialProviderConfigs);

  const filteredRecords = useMemo(() => {
    return mockRecords.filter((r) => {
      if (filters.channel && filters.channel !== 'all' && r.channel !== filters.channel) return false;
      if (filters.sendMode && filters.sendMode !== 'all' && r.sendMode !== filters.sendMode) return false;
      if (filters.usage && filters.usage !== 'all' && r.usage !== filters.usage) return false;
      if (filters.phone && !r.phone.includes(filters.phone.trim())) return false;
      if (filters.memberAccount && !r.memberAccount.toLowerCase().includes(filters.memberAccount.trim().toLowerCase())) return false;
      if (filters.uid && !r.uid.includes(filters.uid.trim())) return false;
      if (filters.range) {
        const created = dayjs(r.createdAt);
        if (created.isBefore(filters.range[0]) || created.isAfter(filters.range[1])) return false;
      }
      return true;
    });
  }, [filters]);

  const columns: ColumnsType<SmsOtpRecord> = [
    { title: '序號', dataIndex: 'id', width: 70, fixed: 'left' },
    {
      title: '渠道',
      dataIndex: 'channel',
      width: 110,
      render: (v: ProviderChannel) => <Tag color="geekblue">{v}</Tag>,
    },
    {
      title: '發送模式',
      dataIndex: 'sendMode',
      width: 130,
      render: (v: SendMode) => (
        <Tag color={sendModeTagColor[v]}>{v === 'sms' ? 'SMS' : 'PIN API'}</Tag>
      ),
    },
    { title: '創建時間', dataIndex: 'createdAt', width: 180 },
    { title: '國際區號', dataIndex: 'countryCode', width: 90 },
    { title: '會員帳號', dataIndex: 'memberAccount', width: 160 },
    { title: 'UID', dataIndex: 'uid', width: 180 },
    { title: '號碼', dataIndex: 'phone', width: 130 },
    {
      title: '用途',
      dataIndex: 'usage',
      width: 150,
      render: (v: SmsUsage) => <Tag>{v}</Tag>,
    },
    {
      title: '驗證碼',
      dataIndex: 'code',
      width: 150,
      render: (code: string | undefined, record) => {
        if (!code) return null;
        const revealed = revealMap[record.key];
        return (
          <Space size={4}>
            <Text style={{ fontFamily: 'monospace' }}>{revealed ? code : '******'}</Text>
            <Tooltip title={revealed ? '隱藏' : '顯示'}>
              <Button
                type="text"
                size="small"
                icon={revealed ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => setRevealMap((m) => ({ ...m, [record.key]: !m[record.key] }))}
              />
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: 'Ref Code',
      dataIndex: 'refCode',
      width: 130,
      render: (v?: string) => (v ? <Text style={{ fontFamily: 'monospace' }}>{v}</Text> : null),
    },
    { title: '過期時間', dataIndex: 'expireAt', width: 180 },
    { title: '消費時間', dataIndex: 'consumedAt', width: 180 },
  ];

  const handleQuery = () => {
    const v = form.getFieldsValue();
    setFilters({
      channel: v.channel ?? 'all',
      sendMode: v.sendMode ?? 'all',
      usage: v.usage ?? 'all',
      phone: v.phone,
      memberAccount: v.memberAccount,
      uid: v.uid,
      range: v.range,
    });
  };

  const handleReset = () => {
    form.resetFields();
    form.setFieldsValue({ channel: 'all', sendMode: 'all', usage: 'all', range: defaultRange });
    setFilters({ channel: 'all', sendMode: 'all', usage: 'all', range: defaultRange });
  };

  const handleOpenProviderModal = () => {
    setProviderDraft(providers.map((p) => ({ ...p })));
    setProviderModalOpen(true);
  };

  const handleSaveProviders = () => {
    const invalid = providerDraft.find((p) => p.sendMode === 'pin_api' && !p.supportsPinApi);
    if (invalid) {
      message.error(`${invalid.name} 不支援 PIN API 模式`);
      return;
    }
    setProviders(providerDraft);
    setProviderModalOpen(false);
    message.success('短信商配置已儲存');
  };

  const handleExport = () => {
    message.info(`已匯出 ${filteredRecords.length} 筆紀錄（mock）`);
  };

  const updateDraft = (key: string, patch: Partial<SmsProviderConfig>) => {
    setProviderDraft((arr) => arr.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  };

  const providerColumns: ColumnsType<SmsProviderConfig> = [
    {
      title: '名稱',
      dataIndex: 'name',
      width: 140,
      render: (v: ProviderChannel) => <Tag color="geekblue">{v}</Tag>,
    },
    {
      title: '發送模式',
      dataIndex: 'sendMode',
      width: 220,
      render: (v: SendMode, record) => (
        <Tooltip title={record.supportsPinApi ? '' : '此供應商僅支援 SMS 廣播模式'}>
          <Select
            value={v}
            style={{ width: 180 }}
            onChange={(next) => updateDraft(record.key, { sendMode: next })}
            options={[
              { value: 'sms', label: 'SMS（廣播模式）' },
              {
                value: 'pin_api',
                label: 'PIN API（供應商生成驗證）',
                disabled: !record.supportsPinApi,
              },
            ]}
          />
        </Tooltip>
      ),
    },
    {
      title: '權重',
      dataIndex: 'weight',
      width: 120,
      render: (v: number, record) => (
        <InputNumber
          min={0}
          max={100}
          value={v}
          onChange={(next) => updateDraft(record.key, { weight: Number(next ?? 0) })}
        />
      ),
    },
    {
      title: '狀態',
      dataIndex: 'enabled',
      width: 120,
      render: (v: boolean, record) => (
        <Switch
          checked={v}
          checkedChildren="開啟"
          unCheckedChildren="關閉"
          onChange={(next) => updateDraft(record.key, { enabled: next })}
        />
      ),
    },
  ];

  return (
    <div data-e2e-id="sms-otp-page">
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>短信驗證碼</Title>
        <Text type="secondary">系統 / 短信驗證碼</Text>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          initialValues={{ channel: 'all', sendMode: 'all', usage: 'all', range: defaultRange }}
          style={{ rowGap: 12, flexWrap: 'wrap' }}
        >
          <Form.Item name="channel" label="渠道">
            <Select style={{ width: 140 }} data-e2e-id="sms-otp-channel-select">
              <Select.Option value="all">全部</Select.Option>
              {channelOptions.map((c) => (
                <Select.Option key={c} value={c}>{c}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="sendMode" label="發送模式">
            <Select style={{ width: 160 }} data-e2e-id="sms-otp-mode-select">
              <Select.Option value="all">全部</Select.Option>
              <Select.Option value="sms">SMS</Select.Option>
              <Select.Option value="pin_api">PIN API</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="usage" label="用途">
            <Select style={{ width: 180 }} data-e2e-id="sms-otp-usage-select">
              <Select.Option value="all">全部</Select.Option>
              {usageOptions.map((u) => (
                <Select.Option key={u} value={u}>{u}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="phone" label="號碼">
            <Input placeholder="輸入手機號碼" style={{ width: 160 }} allowClear />
          </Form.Item>
          <Form.Item name="memberAccount" label="會員帳號">
            <Input placeholder="filbet_xxx" style={{ width: 180 }} allowClear />
          </Form.Item>
          <Form.Item name="uid" label="UID">
            <Input placeholder="UID" style={{ width: 200 }} allowClear />
          </Form.Item>
          <Form.Item name="range" label="創建時間">
            <RangePicker showTime style={{ width: 380 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleQuery} data-e2e-id="sms-otp-query-btn">
                查詢
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset} data-e2e-id="sms-otp-reset-btn">
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card size="small">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Space>
            <Button icon={<SettingOutlined />} onClick={handleOpenProviderModal} data-e2e-id="sms-otp-provider-config-btn">
              短信商配置
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport} data-e2e-id="sms-otp-export-btn">
              導出 Excel
            </Button>
          </Space>
        </div>
        <Table
          rowKey="key"
          columns={columns}
          dataSource={filteredRecords}
          scroll={{ x: 1800 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 條`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          data-e2e-id="sms-otp-table"
        />
      </Card>

      <Modal
        title="短信商配置"
        open={providerModalOpen}
        onCancel={() => setProviderModalOpen(false)}
        onOk={handleSaveProviders}
        okText="儲存"
        cancelText="取消"
        width={780}
        data-e2e-id="sms-otp-provider-modal"
      >
        <Table
          rowKey="key"
          columns={providerColumns}
          dataSource={providerDraft}
          pagination={false}
          size="small"
        />
      </Modal>
    </div>
  );
}

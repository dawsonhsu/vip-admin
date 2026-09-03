'use client';

import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Image,
  Input,
  Select,
  Space,
  Table,
  Tabs,
  Tooltip,
  Typography,
  message,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, SearchOutlined, SettingOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import KycEditModal from '@/components/KycEditModal';
import KycReviewModal from '@/components/KycReviewModal';
import KycChangeLogModal from '@/components/KycChangeLogModal';
import KycEkycConfigModal, { type KycEkycConfig } from '@/components/KycEkycConfigModal';
import {
  getKycChannelCounts,
  kycDocumentLabelMap,
  kycDocumentSlots,
  kycOperators,
  kycStatusColorMap,
  kycStatusLabelMap,
  kycStatuses,
  type KycChannel,
  type KycEditFieldChange,
  type KycPhotoChange,
  type KycRecord,
  type KycStatus,
  type KycVerifyResult,
} from '@/data/kycData';
import { kycStore, useKycCurrentOperator, useKycRecords } from '@/data/kycStore';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface KycFilters {
  phone?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  statuses?: KycStatus[];
  submittedRange?: [Dayjs, Dayjs];
  regIp?: string;
}

const getVerifyColor = (result: KycVerifyResult, token: ReturnType<typeof theme.useToken>['token']) => {
  if (result === '通過') return token.colorSuccess;
  if (result === '不通過') return token.colorError;
  if (result === '未返回') return token.colorWarning;
  return token.colorTextSecondary;
};

const valueOrDash = (value?: string) => value?.trim() || '-';

export default function KycPage() {
  const [form] = Form.useForm<KycFilters>();
  const { token } = theme.useToken();
  const records = useKycRecords();
  const [filters, setFilters] = useState<KycFilters>({});
  const [activeChannel, setActiveChannel] = useState<KycChannel>('主站APP/H5');
  const currentOperator = useKycCurrentOperator();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editRecord, setEditRecord] = useState<KycRecord | null>(null);
  const [reviewRecord, setReviewRecord] = useState<KycRecord | null>(null);
  const [logRecord, setLogRecord] = useState<KycRecord | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [ekycConfig, setEkycConfig] = useState<KycEkycConfig>({
    thirdPartyVerification: false,
    autoReview: false,
  });

  const today = dayjs().format('YYYY-MM-DD');
  const channelCounts = useMemo(() => ({
    '主站APP/H5': getKycChannelCounts(records, '主站APP/H5', today),
    '未分類渠道': getKycChannelCounts(records, '未分類渠道', today),
  }), [records, today]);
  const filteredData = useMemo(() => records.filter((record) => {
    if (record.channel !== activeChannel) return false;
    if (filters.phone) {
      const query = filters.phone.replace(/\s|\+63/g, '').toLowerCase();
      if (!record.phone.toLowerCase().includes(query)) return false;
    }
    if (filters.firstName && !record.firstName.toLowerCase().includes(filters.firstName.trim().toLowerCase())) return false;
    if (filters.middleName && !record.middleName.toLowerCase().includes(filters.middleName.trim().toLowerCase())) return false;
    if (filters.lastName && !record.lastName.toLowerCase().includes(filters.lastName.trim().toLowerCase())) return false;
    if (filters.statuses?.length && !filters.statuses.includes(record.status)) return false;
    if (filters.regIp && !record.regIp.includes(filters.regIp.trim())) return false;
    if (filters.submittedRange?.length === 2) {
      const submittedAt = dayjs(record.submittedAt);
      if (submittedAt.isBefore(filters.submittedRange[0]) || submittedAt.isAfter(filters.submittedRange[1])) return false;
    }
    return true;
  }), [activeChannel, filters, records]);

  const handleOpenEdit = (record: KycRecord) => {
    if (record.pendingEdit) {
      message.warning('此筆已有待複核的編輯，請先完成複核');
      return;
    }

    setEditRecord(record);
  };

  const handleSubmitEdit = (changes: KycEditFieldChange[], photoChanges: KycPhotoChange[]) => {
    if (!editRecord) return;
    kycStore.submitEdit(editRecord.key, currentOperator, changes, photoChanges);
    setEditRecord(null);
  };

  const handleReview = (
    decision: Extract<KycStatus, 'Approved' | 'Rejected' | 'Resubmit Required'>,
    remark: string,
  ) => {
    if (!reviewRecord) return;
    kycStore.reviewStatus(reviewRecord.key, decision, currentOperator, remark);
    setReviewRecord(null);
    message.success('KYC 審核結果已保存');
  };

  const columns: ColumnsType<KycRecord> = [
    {
      title: '序號',
      key: 'index',
      width: 72,
      fixed: 'left',
      align: 'center',
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: '提交時間',
      dataIndex: 'submittedAt',
      width: 170,
    },
    {
      title: 'KYC狀態',
      dataIndex: 'status',
      width: 160,
      render: (status: KycStatus, record) => (
        <div>
          <div style={{ color: kycStatusColorMap[status], fontWeight: 500 }}>{status}</div>
          {record.pendingEdit && (
            <div style={{ color: token.colorWarning, fontSize: 12, fontWeight: 500 }}>● 待複核</div>
          )}
        </div>
      ),
    },
    {
      title: '會員信息',
      key: 'memberInfo',
      width: 180,
      render: (_, record) => (
        <div style={{ fontSize: 12, lineHeight: '20px' }}>
          <div><Text type="secondary">UID: </Text>{record.uid}</div>
          <div><Text type="secondary">手機號: </Text>+63 {record.phone}</div>
        </div>
      ),
    },
    {
      title: 'KYC信息',
      key: 'kycInfo',
      width: 330,
      render: (_, record) => {
        const info = [
          ['First Name', record.firstName],
          ['Middle Name', record.middleName],
          ['Last Name', record.lastName],
          ['生日', record.birthday],
          ['性別', record.gender],
          ['手機號', `+63 ${record.phone}`],
          ['國籍', record.nationality],
          ['出生地', record.birthplace],
          ['現住址', record.currentAddress],
          ['常住地址', record.permanentAddress],
          ['鄰近分行', record.nearestBranch],
          ['職業', record.occupation],
          ['收入來源', record.incomeSource],
        ];
        return (
          <div style={{ fontSize: 12, lineHeight: '19px' }}>
            {info.map(([label, value]) => (
              <div key={label}>
                <Text type="secondary">{label}: </Text>
                <span>{valueOrDash(value)}</span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: '證件',
      key: 'documents',
      width: 220,
      render: (_, record) => (
        <Image.PreviewGroup>
          <div style={{ display: 'flex', gap: 6 }}>
            {kycDocumentSlots.map((slot) => (
              <Tooltip key={slot} title={kycDocumentLabelMap[slot]}>
                <span data-e2e-id={`kyc-table-document-${slot}-${record.uid}`}>
                  <Image
                    src={record.documents[slot]}
                    alt={kycDocumentLabelMap[slot]}
                    width={60}
                    height={48}
                    style={{
                      objectFit: 'cover',
                      border: `1px solid ${token.colorBorder}`,
                      borderRadius: token.borderRadiusSM,
                    }}
                  />
                </span>
              </Tooltip>
            ))}
          </div>
        </Image.PreviewGroup>
      ),
    },
    {
      title: '驗證結果',
      dataIndex: 'verifyResult',
      width: 110,
      render: (result: KycVerifyResult) => (
        <span style={{ color: getVerifyColor(result, token), fontWeight: result === '-' ? 400 : 500 }}>{result}</span>
      ),
    },
    {
      title: '註冊信息',
      key: 'registrationInfo',
      width: 235,
      render: (_, record) => (
        <div style={{ fontSize: 12, lineHeight: '20px' }}>
          <div><Text type="secondary">註冊IP: </Text>{record.regIp}</div>
          <div><Text type="secondary">註冊時間: </Text>{record.registeredAt}</div>
          <div><Text type="secondary">渠道: </Text>{record.regChannel}</div>
        </div>
      ),
    },
    {
      title: '審核人',
      dataIndex: 'reviewer',
      width: 100,
      render: valueOrDash,
    },
    {
      title: '審核時間',
      dataIndex: 'reviewedAt',
      width: 170,
      render: valueOrDash,
    },
    {
      title: '用戶留言',
      dataIndex: 'userMessage',
      width: 190,
      render: (value: string) => <span style={{ whiteSpace: 'normal' }}>{valueOrDash(value)}</span>,
    },
    {
      title: '備註',
      dataIndex: 'remark',
      width: 180,
      render: (value: string) => <span style={{ whiteSpace: 'normal' }}>{valueOrDash(value)}</span>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, record) => {
        const reviewDisabled = record.status === 'Approved' || record.status === 'Rejected';
        return (
          <Space size={0} split={<span style={{ color: token.colorSplit }}>|</span>}>
            <Button
              data-e2e-id={`kyc-table-edit-btn-${record.uid}`}
              type="link"
              size="small"
              style={{ paddingInline: 4 }}
              onClick={() => handleOpenEdit(record)}
            >
              編輯
            </Button>
            <Button
              data-e2e-id={`kyc-table-review-btn-${record.uid}`}
              type="link"
              size="small"
              disabled={reviewDisabled}
              style={{ paddingInline: 4 }}
              onClick={() => setReviewRecord(record)}
            >
              審核
            </Button>
            <Button
              data-e2e-id={`kyc-table-change-log-btn-${record.uid}`}
              type="link"
              size="small"
              style={{ paddingInline: 4 }}
              onClick={() => setLogRecord(record)}
            >
              異動記錄
            </Button>
          </Space>
        );
      },
    },
  ];

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const submittedRange = values.submittedRange?.length === 2
      ? [values.submittedRange[0].startOf('day'), values.submittedRange[1].endOf('day')] as [Dayjs, Dayjs]
      : undefined;
    setFilters({ ...values, submittedRange });
    setCurrentPage(1);
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({});
    setCurrentPage(1);
  };

  const handleReload = () => {
    kycStore.reset();
    setCurrentPage(1);
    message.success('KYC 列表已刷新');
  };

  const tabItems = (['主站APP/H5', '未分類渠道'] as KycChannel[]).map((channel) => {
    const counts = channelCounts[channel];
    return {
      key: channel,
      label: (
        <span data-e2e-id={`kyc-channel-tab-${channel === '主站APP/H5' ? 'main' : 'uncategorized'}`}>
          <span style={{ display: 'block', fontWeight: 500 }}>{channel}</span>
          <span style={{ display: 'block', fontSize: 11, color: token.colorTextSecondary }}>
            今日通過 {counts.approvedToday}　當前待審 {counts.pendingNow}
          </span>
        </span>
      ),
    };
  });

  return (
    <div data-e2e-id="kyc-page">
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>KYC 列表</Title>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" style={{ gap: 12, rowGap: 12, flexWrap: 'wrap' }}>
          <Form.Item name="phone" label="手機號">
            <Input data-e2e-id="kyc-filter-phone-input" allowClear placeholder="請輸入手機號" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="firstName" label="First Name">
            <Input data-e2e-id="kyc-filter-first-name-input" allowClear placeholder="請輸入 First Name" style={{ width: 170 }} />
          </Form.Item>
          <Form.Item name="middleName" label="Middle Name">
            <Input data-e2e-id="kyc-filter-middle-name-input" allowClear placeholder="請輸入 Middle Name" style={{ width: 170 }} />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name">
            <Input data-e2e-id="kyc-filter-last-name-input" allowClear placeholder="請輸入 Last Name" style={{ width: 170 }} />
          </Form.Item>
          <Form.Item name="statuses" label="kyc狀態">
            <Select
              data-e2e-id="kyc-filter-status-select"
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              placeholder="請選擇 KYC 狀態"
              style={{ width: 250 }}
              options={kycStatuses.map((status) => ({
                value: status,
                label: `${status}（${kycStatusLabelMap[status]}）`,
              }))}
            />
          </Form.Item>
          <Form.Item name="submittedRange" label="提交時間">
            <RangePicker data-e2e-id="kyc-filter-submitted-range" style={{ width: 260 }} />
          </Form.Item>
          <Form.Item name="regIp" label="註冊IP">
            <Input data-e2e-id="kyc-filter-reg-ip-input" allowClear placeholder="請輸入註冊IP" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item style={{ marginInlineStart: 'auto' }}>
            <Space>
              <Button data-e2e-id="kyc-filter-reset-btn" onClick={handleReset}>重置</Button>
              <Button data-e2e-id="kyc-filter-query-btn" type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查詢</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Tabs
          data-e2e-id="kyc-channel-tabs"
          activeKey={activeChannel}
          items={tabItems}
          onChange={(key) => {
            setActiveChannel(key as KycChannel);
            setCurrentPage(1);
          }}
          tabBarExtraContent={(
            <Space>
              <Space size={6}>
                <Text type="secondary">當前操作員：</Text>
                <Select
                  data-e2e-id="kyc-toolbar-current-operator-select"
                  value={currentOperator}
                  style={{ width: 110 }}
                  options={kycOperators.map((operator) => ({ value: operator, label: operator }))}
                  onChange={kycStore.setCurrentOperator}
                />
              </Space>
              <Button
                data-e2e-id="kyc-toolbar-ekyc-config-btn"
                icon={<SettingOutlined />}
                onClick={() => setConfigOpen(true)}
              >
                EKYC 配置
              </Button>
              <Tooltip title="刷新">
                <Button data-e2e-id="kyc-toolbar-reload-btn" aria-label="刷新" icon={<ReloadOutlined />} onClick={handleReload} />
              </Tooltip>
            </Space>
          )}
        />

        <Table
          data-e2e-id="kyc-table"
          rowKey="key"
          columns={columns}
          dataSource={filteredData}
          size="small"
          scroll={{ x: 2500 }}
          onRow={(record) => ({ 'data-e2e-id': `kyc-table-row-${record.uid}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          pagination={{
            current: currentPage,
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 條/總共 ${total} 條`,
            onChange: (page, size) => {
              setCurrentPage(size !== pageSize ? 1 : page);
              setPageSize(size);
            },
          }}
        />
      </Card>

      <KycEditModal
        open={Boolean(editRecord)}
        record={editRecord}
        onCancel={() => setEditRecord(null)}
        onSave={handleSubmitEdit}
      />
      <KycReviewModal
        open={Boolean(reviewRecord)}
        record={reviewRecord}
        onCancel={() => setReviewRecord(null)}
        onConfirm={handleReview}
      />
      <KycChangeLogModal
        open={Boolean(logRecord)}
        record={logRecord}
        onClose={() => setLogRecord(null)}
      />
      <KycEkycConfigModal
        open={configOpen}
        value={ekycConfig}
        onClose={() => setConfigOpen(false)}
        onSave={(value) => {
          setEkycConfig(value);
          setConfigOpen(false);
          message.success('EKYC 配置已保存');
        }}
      />
    </div>
  );
}

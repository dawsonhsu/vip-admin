'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import {
  Alert,
  Button,
  Card,
  Cascader,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd';
import {
  ColumnHeightOutlined,
  DownloadOutlined,
  InboxOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd';
import {
  getMemberProfileByPhone,
  getMemberProfileByUid,
  orderStatusOptions,
  searchTypeOptions,
  upDownScoreRecords,
  venueLimitOptions,
  type BatchUploadRow,
  type SearchType,
  type UpDownScoreRecord,
  type UpDownStatus,
  type UpDownType,
} from '@/data/upDownScoreData';
import { freeSpinRestrictionCatalog } from '@/data/mockData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Dragger } = Upload;

const todayRange: [Dayjs, Dayjs] = [dayjs().startOf('day'), dayjs().endOf('day')];

interface SingleModalState {
  open: boolean;
  triggerType: UpDownType;
}

type CsvKeyType = 'phone' | 'uid';

interface BatchModalState {
  open: boolean;
  currentStep: number;
  batchType: '上分' | '下分';
  sharedVenueLimit?: string[][];
  csvKeyType: CsvKeyType;
  rows: BatchUploadRow[];
  result: {
    successRows: BatchUploadRow[];
    failedRows: BatchUploadRow[];
  } | null;
}

interface RecordTabContentProps {
  type: '上分' | '下分';
  records: UpDownScoreRecord[];
  onOpenSingle: (type: UpDownType) => void;
  onOpenBatch: (type: '上分' | '下分') => void;
}

const orderTypeTagColor: Record<UpDownType, string> = {
  上分: 'success',
  下分: 'error',
  清零: 'volcano',
};

const statusTagColor: Record<UpDownStatus, string> = {
  待審核: 'gold',
  已通過: 'success',
  已拒絕: 'error',
  處理中: 'processing',
};

function formatCurrency(value: number) {
  return `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function createOrderNo(type: UpDownType, sequence: number) {
  const prefix = type === '上分' ? 'UP' : type === '下分' ? 'DOWN' : 'ZERO';
  return `${prefix}${dayjs().format('YYMMDDHHmm')}${String(sequence).padStart(3, '0')}`;
}

function parseCsv(
  content: string,
  sharedVenueLimit: string[][],
  keyType: CsvKeyType,
  batchType: UpDownType,
): BatchUploadRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) return [];

  const isUp = batchType === '上分';

  return lines.slice(1).map((line, index) => {
    const columns = line.split(',').map((item) => item.trim());
    const keyValue = columns[0] ?? '';
    const amountText = columns[1] ?? '';
    const turnoverText = isUp ? (columns[2] ?? '') : '';
    const reason = (isUp ? columns[3] : columns[2]) ?? '';
    const profile = keyValue
      ? (keyType === 'phone' ? getMemberProfileByPhone(keyValue) : getMemberProfileByUid(keyValue))
      : undefined;
    const parsedAmount = amountText ? Number(amountText) : null;
    const turnoverMultiplier = isUp ? (turnoverText ? Number(turnoverText) : NaN) : null;
    const errors: string[] = [];

    if (!keyValue) errors.push(keyType === 'phone' ? '缺少手機號' : '缺少會員UID');
    if (keyValue && !profile) errors.push('會員不存在');
    if (!parsedAmount || Number.isNaN(parsedAmount) || parsedAmount < 0.01) errors.push('調整金額需大於 0.01');
    if (isUp) {
      if (
        !turnoverMultiplier ||
        Number.isNaN(turnoverMultiplier) ||
        turnoverMultiplier < 1 ||
        turnoverMultiplier > 100
      ) {
        errors.push('流水倍數需為 1-100');
      }
    }
    if (!reason || reason.length > 500) errors.push('調整理由需為 1-500 字');

    return {
      key: `${batchType}-${index + 1}`,
      memberPhone: keyType === 'phone' ? keyValue : (profile?.phone ?? ''),
      memberUid: keyType === 'uid' ? keyValue : (profile?.uid ?? ''),
      memberAccountId: profile?.accountId ?? '',
      memberName: profile?.memberName ?? '',
      accountStatus: profile?.accountStatus ?? '',
      walletBalance: profile?.walletBalance ?? null,
      submitAmount: parsedAmount,
      turnoverMultiplier: typeof turnoverMultiplier === 'number' && !Number.isNaN(turnoverMultiplier) ? turnoverMultiplier : null,
      venueLimit: sharedVenueLimit,
      reason,
      valid: errors.length === 0,
      errorMessage: errors.join('；'),
    };
  });
}

function RecordTabContent({ type, records, onOpenSingle, onOpenBatch }: RecordTabContentProps) {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<{
    orderNo?: string;
    searchType?: SearchType;
    memberKeyword?: string;
    status?: UpDownStatus;
    reason?: string;
    minAmount?: number;
    maxAmount?: number;
    dateRange?: [Dayjs, Dayjs];
  }>({
    searchType: '手機號',
    dateRange: todayRange,
  });

  const filteredRecords = useMemo(() => records.filter((record) => {
    if (filters.orderNo && !record.orderNo.toLowerCase().includes(filters.orderNo.toLowerCase())) return false;
    if (filters.memberKeyword) {
      const keyword = filters.memberKeyword.toLowerCase();
      if (filters.searchType === '手機號' && !record.memberPhone.toLowerCase().includes(keyword)) return false;
      if (filters.searchType === '會員UID' && !record.memberUid.toLowerCase().includes(keyword)) return false;
      if (filters.searchType === '會員帳號ID') {
        const profile = getMemberProfileByUid(record.memberUid);
        if (!profile?.accountId.toLowerCase().includes(keyword)) return false;
      }
    }
    if (filters.status && record.status !== filters.status) return false;
    if (filters.reason && !record.reason.toLowerCase().includes(filters.reason.toLowerCase())) return false;
    if (typeof filters.minAmount === 'number' && record.submitAmount < filters.minAmount) return false;
    if (typeof filters.maxAmount === 'number' && record.submitAmount > filters.maxAmount) return false;
    if (filters.dateRange) {
      const current = dayjs(record.submitTime);
      if (current.isBefore(filters.dateRange[0]) || current.isAfter(filters.dateRange[1])) return false;
    }
    return true;
  }), [filters, records]);

  const columns: ColumnsType<UpDownScoreRecord> = [
    { title: '序號', dataIndex: 'seq', width: 70, fixed: 'left' },
    {
      title: '訂單號',
      dataIndex: 'orderNo',
      width: 170,
      render: (value: string) => <Text copyable={{ text: value }}>{value}</Text>,
    },
    {
      title: '訂單類型',
      dataIndex: 'type',
      width: 100,
      render: (value: UpDownType) => <Tag color={orderTypeTagColor[value]}>{value}</Tag>,
    },
    { title: '會員手機', dataIndex: 'memberPhone', width: 130 },
    { title: '會員 UID', dataIndex: 'memberUid', width: 120 },
    { title: '會員名', dataIndex: 'memberName', width: 120 },
    {
      title: '訂單狀態',
      dataIndex: 'status',
      width: 100,
      render: (value: UpDownStatus) => <Tag color={statusTagColor[value]}>{value}</Tag>,
    },
    { title: '提交人', dataIndex: 'submitter', width: 120 },
    { title: '提交時間', dataIndex: 'submitTime', width: 170 },
    {
      title: '提交金額',
      dataIndex: 'submitAmount',
      width: 130,
      render: (value: number) => <Text strong>{formatCurrency(value)}</Text>,
    },
    { title: '調整原因', dataIndex: 'reason', width: 180 },
    {
      title: '上分流水要求',
      dataIndex: 'turnoverRequirement',
      width: 130,
      render: (value: number, record) => (record.type === '上分' ? `${value} 倍` : <Text type="secondary">—</Text>),
    },
    {
      title: '審核人',
      dataIndex: 'reviewer',
      width: 120,
      render: (value: string) => (value === '-' ? <Text type="secondary">—</Text> : value),
    },
    {
      title: '審核時間',
      dataIndex: 'reviewTime',
      width: 170,
      render: (value: string) => (value === '-' ? <Text type="secondary">—</Text> : value),
    },
  ];

  const handleExport = () => {
    const header = '序號,訂單號,訂單類型,會員手機,會員UID,會員名,訂單狀態,提交人,提交時間,提交金額,調整原因,上分流水要求,審核人,審核時間\n';
    const rows = filteredRecords.map((record) => [
      record.seq,
      record.orderNo,
      record.type,
      record.memberPhone,
      record.memberUid,
      record.memberName,
      record.status,
      record.submitter,
      record.submitTime,
      record.submitAmount,
      record.reason,
      record.type === '上分' ? `${record.turnoverRequirement} 倍` : '-',
      record.reviewer,
      record.reviewTime,
    ].join(',')).join('\n');
    downloadCsv(`${type}記錄_${dayjs().format('YYYYMMDDHHmmss')}.csv`, header + rows);
    message.success(`已導出 ${filteredRecords.length} 筆${type}記錄`);
  };

  return (
    <>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          initialValues={{ searchType: '手機號', dateRange: todayRange }}
          style={{ gap: 8, rowGap: 12, flexWrap: 'wrap' }}
        >
          <Form.Item name="orderNo" label="訂單號">
            <Input placeholder="請輸入" allowClear style={{ width: 170 }} />
          </Form.Item>
          <Form.Item label="會員">
            <Space.Compact block>
              <Form.Item name="searchType" noStyle>
                <Select style={{ width: 130 }}>
                  {searchTypeOptions.map((option) => (
                    <Select.Option key={option} value={option}>
                      {option}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="memberKeyword" noStyle>
                <Input placeholder="請輸入" allowClear style={{ width: 200 }} />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
          <Form.Item name="status" label="訂單狀態">
            <Select placeholder="請選擇" allowClear style={{ width: 150 }}>
              {orderStatusOptions.map((status) => (
                <Select.Option key={status} value={status}>
                  {status}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="reason" label="調整原因">
            <Input placeholder="請輸入" allowClear style={{ width: 180 }} />
          </Form.Item>
          <Form.Item label="提交金額">
            <Space>
              <Form.Item name="minAmount" noStyle>
                <InputNumber min={0} precision={2} prefix="₱" placeholder="min" style={{ width: 130 }} />
              </Form.Item>
              <Text type="secondary">~</Text>
              <Form.Item name="maxAmount" noStyle>
                <InputNumber min={0} precision={2} prefix="₱" placeholder="max" style={{ width: 130 }} />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item name="dateRange" label="帳變時間">
            <RangePicker showTime style={{ width: 320, maxWidth: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={() => setFilters(form.getFieldsValue())}>
                查詢
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  form.resetFields();
                  form.setFieldsValue({ searchType: '手機號', dateRange: todayRange });
                  setFilters({ searchType: '手機號', dateRange: todayRange });
                }}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card size="small">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <Space wrap>
            <Button icon={<UploadOutlined />} onClick={() => onOpenBatch(type)}>
              批量{type}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              導出 Excel
            </Button>
          </Space>
          <Space>
            <Tooltip title="刷新">
              <Button icon={<ReloadOutlined />} onClick={() => message.success('列表已刷新')} />
            </Tooltip>
            <Tooltip title="列高">
              <Button icon={<ColumnHeightOutlined />} onClick={() => message.info('原型暫未提供列高切換')} />
            </Tooltip>
            <Tooltip title="欄位設定">
              <Button icon={<SettingOutlined />} onClick={() => message.info('原型暫未提供欄位設定')} />
            </Tooltip>
          </Space>
        </div>

        <Table
          rowKey="key"
          columns={columns}
          dataSource={filteredRecords}
          scroll={{ x: 1800 }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
        />
      </Card>
    </>
  );
}

export default function UpDownScorePage() {
  const [records, setRecords] = useState<UpDownScoreRecord[]>(upDownScoreRecords);
  const [activeTab, setActiveTab] = useState<'上分' | '下分'>('上分');
  const [singleForm] = Form.useForm();
  const [singleModal, setSingleModal] = useState<SingleModalState>({ open: false, triggerType: '上分' });
  const [singleLookupPhone, setSingleLookupPhone] = useState('');
  const [batchModal, setBatchModal] = useState<BatchModalState>({
    open: false,
    currentStep: 0,
    batchType: '上分',
    sharedVenueLimit: undefined,
    csvKeyType: 'phone',
    rows: [],
    result: null,
  });

  const upRecords = useMemo(() => records.filter((item) => item.type === '上分'), [records]);
  const downRecords = useMemo(() => records.filter((item) => item.type === '下分' || item.type === '清零'), [records]);

  const gameRestrictionOptions = useMemo(
    () => Object.entries(freeSpinRestrictionCatalog).map(([gameType, restrictionProviders]) => ({
      value: gameType,
      label: gameType,
      children: restrictionProviders.map((restrictionProvider) => ({
        value: restrictionProvider.code,
        label: restrictionProvider.name,
        children: restrictionProvider.games.map((game) => ({
          value: game.code,
          label: game.name,
        })),
      })),
    })),
    [],
  );

  const currentSingleType = Form.useWatch<UpDownType>('adjustType', singleForm) ?? singleModal.triggerType;
  const currentSinglePhone = Form.useWatch<string>('memberPhone', singleForm);
  const isSingleTurnoverDisabled = currentSingleType !== '上分';

  const syncSingleProfile = (profile?: ReturnType<typeof getMemberProfileByPhone>) => {
    if (!profile) {
      singleForm.setFieldsValue({
        memberPhone: undefined,
        memberUid: undefined,
        accountId: undefined,
        accountStatus: undefined,
        walletBalance: undefined,
        amount: currentSingleType === '清零' ? undefined : singleForm.getFieldValue('amount'),
      });
      return;
    }
    singleForm.setFieldsValue({
      memberPhone: profile.phone,
      memberUid: profile.uid,
      accountId: profile.accountId,
      accountStatus: profile.accountStatus,
      walletBalance: formatCurrency(profile.walletBalance),
      amount: currentSingleType === '清零' ? profile.walletBalance : singleForm.getFieldValue('amount'),
    });
  };

  useEffect(() => {
    if (currentSingleType === '上分') {
      if (!singleForm.getFieldValue('turnoverMultiplier')) {
        singleForm.setFieldValue('turnoverMultiplier', 1);
      }
      if (!singleForm.getFieldValue('venueLimit')) {
        singleForm.setFieldValue('venueLimit', '全站');
      }
      return;
    }
    if (currentSingleType === '清零') {
      const profile = currentSinglePhone ? getMemberProfileByPhone(currentSinglePhone) : undefined;
      singleForm.setFieldValue('amount', profile?.walletBalance);
    }
  }, [currentSinglePhone, currentSingleType, singleForm]);

  const handleOpenSingle = (type: UpDownType) => {
    singleForm.resetFields();
    singleForm.setFieldsValue({
      adjustType: type,
      turnoverMultiplier: 1,
      venueLimit: '全站',
    });
    setSingleLookupPhone('');
    setSingleModal({ open: true, triggerType: type });
  };

  const handleSinglePhoneLookup = () => {
    const phone = singleLookupPhone.trim();
    if (!phone) {
      syncSingleProfile(undefined);
      return;
    }
    const profile = getMemberProfileByPhone(phone);
    if (!profile) {
      message.warning('查無此手機號，請輸入 mock 名單中的手機號');
      syncSingleProfile(undefined);
      return;
    }
    syncSingleProfile(profile);
  };

  const handleSubmitSingle = async () => {
    const values = await singleForm.validateFields();
    const profile = getMemberProfileByPhone(values.memberPhone);
    if (!profile) {
      message.error('會員手機不存在');
      return;
    }

    const nextType = values.adjustType as UpDownType;
    const nextAmount = nextType === '清零' ? profile.walletBalance : values.amount;
    const nextRecord: UpDownScoreRecord = {
      key: `manual-${Date.now()}`,
      seq: records.length + 1,
      orderNo: createOrderNo(nextType, records.length + 1),
      type: nextType,
      memberPhone: profile.phone,
      memberUid: profile.uid,
      memberName: profile.memberName,
      status: '待審核',
      submitter: 'current.admin',
      submitTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      submitAmount: nextAmount,
      reason: values.reason,
      turnoverRequirement: nextType === '上分' ? values.turnoverMultiplier : 0,
      reviewer: '-',
      reviewTime: '-',
    };

    setRecords((prev) => [nextRecord, ...prev]);
    setActiveTab(nextType === '上分' ? '上分' : '下分');
    setSingleModal((prev) => ({ ...prev, open: false }));
    singleForm.resetFields();
    setSingleLookupPhone('');
    message.success(`${nextType}申請提交成功`);
  };

  const handleOpenBatch = (type: '上分' | '下分') => {
    setBatchModal({
      open: true,
      currentStep: 0,
      batchType: type,
      sharedVenueLimit: undefined,
      csvKeyType: 'phone',
      rows: [],
      result: null,
    });
  };

  const handleDownloadTemplate = () => {
    const isPhone = batchModal.csvKeyType === 'phone';
    const isUp = batchModal.batchType === '上分';
    const keyHeader = isPhone ? '手機號' : '會員UID';
    const keyExample = isPhone ? '9762100000' : 'UID100001';
    const header = isUp
      ? `${keyHeader},調整金額,流水倍數,調整理由`
      : `${keyHeader},調整金額,調整理由`;
    const example = isUp
      ? `${keyExample},1000,5,活動補發`
      : `${keyExample},1000,異常修正`;
    downloadCsv(`批量${batchModal.batchType}_CSV模板_${keyHeader}.csv`, [header, example].join('\n'));
  };

  const uploadProps: UploadProps = {
    accept: '.csv',
    maxCount: 1,
    beforeUpload: async (file) => {
      if (batchModal.batchType === '上分' && (!batchModal.sharedVenueLimit || batchModal.sharedVenueLimit.length === 0)) {
        message.error('請先選擇場館限制');
        return Upload.LIST_IGNORE;
      }
      const content = await file.text();
      const rows = parseCsv(
        content,
        batchModal.sharedVenueLimit ?? [],
        batchModal.csvKeyType,
        batchModal.batchType,
      );
      setBatchModal((prev) => ({
        ...prev,
        rows,
        result: null,
      }));
      message.success(`已解析 ${rows.length} 筆資料`);
      return false;
    },
    showUploadList: false,
  };

  const failedResultColumns: ColumnsType<BatchUploadRow> = [
    { title: '手機號', dataIndex: 'memberPhone', width: 130 },
    {
      title: '調整金額',
      dataIndex: 'submitAmount',
      width: 120,
      render: (value: number | null) => (value ? formatCurrency(value) : <Text type="secondary">—</Text>),
    },
    { title: '失敗原因', dataIndex: 'errorMessage', width: 300 },
  ];

  const executeBatch = () => {
    const successRows = batchModal.rows.filter((row) => row.valid);
    const failedRows = batchModal.rows.filter((row) => !row.valid);

    const batchType = batchModal.batchType;
    const newRecords = successRows.map((row, index) => {
      const profile = getMemberProfileByPhone(row.memberPhone)!;
      return {
        key: `batch-${Date.now()}-${index}`,
        seq: records.length + index + 1,
        orderNo: createOrderNo(batchType, records.length + index + 1),
        type: batchType,
        memberPhone: profile.phone,
        memberUid: profile.uid,
        memberName: profile.memberName,
        status: '待審核' as UpDownStatus,
        submitter: 'batch.admin',
        submitTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        submitAmount: row.submitAmount ?? 0,
        reason: row.reason,
        turnoverRequirement: row.turnoverMultiplier ?? 0,
        reviewer: '-',
        reviewTime: '-',
      };
    });

    setRecords((prev) => [...newRecords, ...prev]);
    setActiveTab(batchType === '上分' ? '上分' : '下分');
    setBatchModal((prev) => ({
      ...prev,
      currentStep: 1,
      result: { successRows, failedRows },
    }));
    message.success(`批量${batchType}已建立 ${successRows.length} 筆申請`);
  };

  const stepContent = () => {
    if (batchModal.currentStep === 0) {
      const isUp = batchModal.batchType === '上分';
      const hasVenueLimit = !isUp || (!!batchModal.sharedVenueLimit && batchModal.sharedVenueLimit.length > 0);
      const hasRows = batchModal.rows.length > 0;
      const keyHeader = batchModal.csvKeyType === 'phone' ? '手機號' : '會員UID';
      const exceedsLimit = batchModal.rows.length > 2000;
      return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="單次匯入最多 2000 名會員"
          />
          <Form layout="vertical">
            <Row gutter={[24, 16]}>
              {isUp && (
                <Col span={24}>
                  <Form.Item
                    label="場館限制"
                    tooltip="同一批匯入名單會套用相同的場館/遊戲限制"
                    required
                  >
                    <Cascader
                      multiple
                      options={gameRestrictionOptions}
                      placeholder="選擇遊戲類型 → 廠商 → 遊戲"
                      showCheckedStrategy={Cascader.SHOW_PARENT}
                      value={batchModal.sharedVenueLimit}
                      onChange={(value) =>
                        setBatchModal((prev) => ({ ...prev, sharedVenueLimit: value as string[][] }))
                      }
                      showSearch={{
                        filter: (inputValue, path) =>
                          path.some((option) =>
                            String(option.label).toLowerCase().includes(inputValue.toLowerCase()),
                          ),
                      }}
                    />
                  </Form.Item>
                </Col>
              )}
              <Col span={24}>
                <Form.Item label="會員識別欄位" required style={{ marginBottom: 0 }}>
                  <Radio.Group
                    value={batchModal.csvKeyType}
                    onChange={(event) =>
                      setBatchModal((prev) => ({
                        ...prev,
                        csvKeyType: event.target.value as CsvKeyType,
                        rows: [],
                      }))
                    }
                    optionType="button"
                    buttonStyle="solid"
                    options={[
                      { label: '手機號', value: 'phone' },
                      { label: '會員 UID', value: 'uid' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span>CSV 上傳</span>
                      <Button size="small" type="link" icon={<DownloadOutlined />} onClick={handleDownloadTemplate} style={{ padding: 0 }}>
                        下載 CSV 模板
                      </Button>
                    </div>
                  }
                  style={{ marginBottom: 0 }}
                >
                  <Dragger {...uploadProps}>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">拖曳 CSV 到此處，或點擊上傳</p>
                    <p className="ant-upload-hint">
                      模板欄位：{keyHeader}, 調整金額{isUp ? ', 流水倍數' : ''}, 調整理由 · 單次最多 2000 名會員
                    </p>
                  </Dragger>
                </Form.Item>
              </Col>
            </Row>
          </Form>
          {hasRows && !exceedsLimit && (
            <Alert
              type="success"
              showIcon
              message={`已解析 ${batchModal.rows.length} 筆資料，點擊「確認執行」立即處理`}
            />
          )}
          {exceedsLimit && (
            <Alert
              type="error"
              showIcon
              message={`已上傳 ${batchModal.rows.length} 筆，超過單次匯入上限 2000 名會員，請刪減後重新上傳`}
            />
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button onClick={() => setBatchModal((prev) => ({ ...prev, open: false }))}>取消</Button>
              <Button
                type="primary"
                disabled={!hasVenueLimit || !hasRows || exceedsLimit}
                onClick={executeBatch}
              >
                確認執行
              </Button>
            </Space>
          </div>
        </Space>
      );
    }

    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Text>成功筆數：{batchModal.result?.successRows.length ?? 0} 筆</Text>
        <Text>失敗筆數：{batchModal.result?.failedRows.length ?? 0} 筆</Text>
        <Table
          rowKey="key"
          columns={failedResultColumns}
          dataSource={batchModal.result?.failedRows ?? []}
          locale={{ emptyText: '無失敗資料' }}
          pagination={false}
          scroll={{ x: 720 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <Button
            icon={<DownloadOutlined />}
            disabled={!batchModal.result?.failedRows.length}
            onClick={() => {
              const header = '手機號,調整金額,失敗原因\n';
              const rows = (batchModal.result?.failedRows ?? [])
                .map((row) => `${row.memberPhone},${row.submitAmount ?? ''},${row.errorMessage}`)
                .join('\n');
              downloadCsv(`批量${batchModal.batchType}_失敗清單.csv`, header + rows);
            }}
          >
            下載失敗清單
          </Button>
          <Button onClick={() => setBatchModal((prev) => ({ ...prev, open: false }))}>關閉</Button>
        </div>
      </Space>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>上下分紀錄</Title>
        <Text type="secondary">風控管理 / 上下分紀錄</Text>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as '上分' | '下分')}
        items={[
          {
            key: '上分',
            label: '上分記錄',
            children: <RecordTabContent type="上分" records={upRecords} onOpenSingle={handleOpenSingle} onOpenBatch={handleOpenBatch} />,
          },
          {
            key: '下分',
            label: '下分記錄',
            children: <RecordTabContent type="下分" records={downRecords} onOpenSingle={handleOpenSingle} onOpenBatch={handleOpenBatch} />,
          },
        ]}
      />

      <Modal
        title="上下分申請/錢包清零"
        open={singleModal.open}
        width={920}
        onCancel={() => {
          setSingleModal((prev) => ({ ...prev, open: false }));
          setSingleLookupPhone('');
        }}
        onOk={handleSubmitSingle}
        okText="確認提交"
        cancelText="取消"
        destroyOnHidden
      >
        <Form layout="horizontal" labelCol={{ flex: '110px' }} labelAlign="right" style={{ marginBottom: 16 }}>
          <Form.Item label="手機號查找" style={{ marginBottom: 0 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={singleLookupPhone}
                placeholder="請輸入 9762100000 ~ 9762100029"
                onChange={(event) => setSingleLookupPhone(event.target.value)}
                onPressEnter={handleSinglePhoneLookup}
              />
              <Button type="primary" onClick={handleSinglePhoneLookup}>
                查找
              </Button>
            </Space.Compact>
          </Form.Item>
        </Form>
        <Form form={singleForm} layout="horizontal" labelCol={{ flex: '110px' }} labelAlign="right">
          <Row gutter={[24, 12]}>
            <Col span={12}>
              <Form.Item name="memberPhone" label="手機號" rules={[{ required: true, message: '請先查找手機號' }]}>
                <Input disabled placeholder="查找後自動帶入" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="accountId" label="會員帳號ID">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="memberUid" label="會員UID">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="accountStatus" label="會員帳號狀態">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="walletBalance" label="提交時錢包餘額">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="adjustType" label="調整類型" rules={[{ required: true, message: '請選擇調整類型' }]}>
                <Radio.Group>
                  <Radio value="上分">上分</Radio>
                  <Radio value="下分">下分</Radio>
                  <Radio value="清零">清零</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="調整金額"
                rules={[
                  {
                    validator: (_, value) => {
                      if (currentSingleType === '清零') return Promise.resolve();
                      if (value === undefined || value === null || value === '') return Promise.reject(new Error('請輸入調整金額'));
                      if (Number(value) <= 0) return Promise.reject(new Error('只填非零正值'));
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  min={0.01}
                  precision={2}
                  disabled={currentSingleType === '清零'}
                  placeholder="只填非零正值，最多兩位小數"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="turnoverMultiplier"
                label="上分提現流水要求"
                rules={[
                  {
                    validator: (_, value) => {
                      if (isSingleTurnoverDisabled) return Promise.resolve();
                      if (value === undefined || value === null || value === '') return Promise.reject(new Error('請輸入流水倍數'));
                      if (Number(value) < 0 || Number(value) > 99) return Promise.reject(new Error('請輸入 0-99'));
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  max={99}
                  precision={0}
                  addonAfter="倍"
                  disabled={isSingleTurnoverDisabled}
                  placeholder="0~99，僅上分調整"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="venueLimit"
                label="流水場館/遊戲限制"
                rules={[
                  {
                    validator: (_, value) => {
                      if (isSingleTurnoverDisabled) return Promise.resolve();
                      if (!value) return Promise.reject(new Error('請選擇場館限制'));
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Select placeholder="請選擇" disabled={isSingleTurnoverDisabled}>
                  {venueLimitOptions.map((option) => (
                    <Select.Option key={option} value={option}>
                      {option}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="otp"
                label="Google驗證碼"
                rules={[
                  { required: true, message: '請輸入驗證碼' },
                  { pattern: /^\d{6}$/, message: '請輸入 6 位數字' },
                ]}
              >
                <Input maxLength={6} placeholder="請輸入 6 位數字" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="reason" label="調整理由" rules={[{ required: true, message: '請輸入調整理由' }]}>
                <Input.TextArea showCount maxLength={500} rows={4} placeholder="1~500字文本" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={`批量${batchModal.batchType}`}
        open={batchModal.open}
        width={900}
        footer={null}
        onCancel={() => setBatchModal((prev) => ({ ...prev, open: false }))}
        destroyOnHidden
      >
        <Steps
          current={batchModal.currentStep}
          items={[
            { title: '上傳 CSV' },
            { title: '執行結果' },
          ]}
          style={{ marginBottom: 24 }}
        />
        {stepContent()}
      </Modal>
    </div>
  );
}

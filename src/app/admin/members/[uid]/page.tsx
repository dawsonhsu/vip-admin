'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Card, Tabs, Tag, Button, Space, Typography, Descriptions, Table, Modal, Form, Select, Input, Alert, message, Empty, Tooltip, DatePicker, Row, Col, Statistic, Segmented, Upload,
} from 'antd';
const { RangePicker } = DatePicker;
import {
  ArrowLeftOutlined, CrownOutlined, CopyOutlined, WarningOutlined, CheckCircleOutlined, EditOutlined, DeleteOutlined, EyeOutlined, FilePdfOutlined, UploadOutlined, PlusOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile, UploadProps } from 'antd';
import dayjs from 'dayjs';
import {
  getMemberByUid, updateMember, getVipHistory, appendVipHistory,
  getVipConfig, vipConfig, type MemberItem, type VipLevelHistoryItem, type VipLevelHistoryTy,
  VipHistoryTyColor, VipHistoryTyLabel,
  capabilityDict, capabilitySourceLabel, capabilitySourceColor,
  getCapabilityDictItem,
  getMemberCapabilityStates, setMemberCapabilityState,
  getMemberCapabilityLogs, appendMemberCapabilityLog,
  type CapabilityDictItem, type MemberCapabilityState, type MemberCapabilityLog,
  type CapabilitySource, type CapabilityAction,
} from '@/data/mockData';
import { gameStats, inviteStats, personalStats, gameTypes, type GameStat, type GameType, type InviteStat, type PersonalStat } from '@/data/memberStatsData';

const { Title, Text } = Typography;

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

const getTierRangeName = (level: number): string => {
  if (level <= 6) return '黃銅';
  if (level <= 12) return '白銀';
  if (level <= 18) return '黃金';
  if (level <= 24) return '鉑金';
  return '鑽石';
};
const getTierRangeEn = (level: number): string => {
  if (level <= 6) return 'Bronze';
  if (level <= 12) return 'Silver';
  if (level <= 18) return 'Gold';
  if (level <= 24) return 'Platinum';
  return 'Diamond';
};

type SummaryMode = 'page' | 'all';

interface DateRangeFilter {
  dateRange: [any, any];
}

interface GameDateRangeFilter extends DateRangeFilter {
  gameType: 'ALL' | GameType;
}

type KycPhotoCategory =
  | '身份證正面'
  | '身份證反面'
  | '自拍'
  | '銀行卡'
  | '補充憑證 1'
  | '補充憑證 2';

type KycPhotoAction = '上傳' | '編輯' | '刪除';
type RestrictionModalMode = 'create' | 'edit' | 'release';

interface KycSummaryInfo {
  status: '已通過' | '審核中' | '待提交' | '已拒絕';
  submittedAt: string;
  name: string;
  birthDate: string;
  gender: string;
  nationality: string;
  reviewer: string;
  reviewedAt: string;
  overallResult: string;
  faceResult: string;
  ocrResult: string;
}

interface KycPhotoRecord {
  id: string;
  category: KycPhotoCategory;
  fileName: string;
  note: string;
  uploader: string;
  uploadedAt: string;
  mimeType: 'image/jpeg' | 'image/png' | 'application/pdf';
}

interface KycUploadHistoryRecord {
  id: string;
  createdAt: string;
  operator: string;
  action: KycPhotoAction;
  category: KycPhotoCategory;
  fileName: string;
  note: string;
}

interface KycPhotoModalState {
  open: boolean;
  mode: 'create' | 'edit';
  category: KycPhotoCategory | null;
  record: KycPhotoRecord | null;
}

interface KycDeleteModalState {
  open: boolean;
  record: KycPhotoRecord | null;
}

interface KycPreviewModalState {
  open: boolean;
  record: KycPhotoRecord | null;
}

interface RestrictionModalState {
  open: boolean;
  mode: RestrictionModalMode;
  capabilityKey: string | null;
}

const defaultStatRange = (): [any, any] => [dayjs(), dayjs()];
const { TextArea } = Input;
const { Dragger } = Upload;

const formatInteger = (value: number) => value.toLocaleString();

const formatAmount = (value: number) => value.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const renderGgrText = (value: number) => (
  <Text style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
    {formatAmount(value)}
  </Text>
);

const kycPhotoCategories: KycPhotoCategory[] = [
  '身份證正面',
  '身份證反面',
  '自拍',
  '銀行卡',
  '補充憑證 1',
  '補充憑證 2',
];

const kycPhotoTagColor: Record<KycPhotoCategory, string> = {
  身份證正面: 'blue',
  身份證反面: 'cyan',
  自拍: 'purple',
  銀行卡: 'green',
  '補充憑證 1': 'orange',
  '補充憑證 2': 'gold',
};

const capabilityDeniedMessage = (cap: CapabilityDictItem): string =>
  `您的${cap.nameZh}功能已被限制，請聯繫客服`;

const restrictionActionLabel: Record<CapabilityAction, string> = {
  open: '開啟',
  close: '關閉',
  update: '修改',
};

const restrictionActionColor: Record<CapabilityAction, string> = {
  open: 'green',
  close: 'red',
  update: 'gold',
};

const acceptedMimeTypes = '.jpg,.jpeg,.png,.pdf';
const currentOperator = 'darren@filbetph.com';

const mapKycStatusLabel = (status: MemberItem['kycStatus']): KycSummaryInfo['status'] => {
  switch (status) {
    case 'Approved':
      return '已通過';
    case 'Pending':
      return '審核中';
    case 'Rejected':
      return '已拒絕';
    default:
      return '待提交';
  }
};

const getKycSummarySeed = (member: MemberItem): KycSummaryInfo => ({
  status: mapKycStatusLabel(member.kycStatus),
  submittedAt: dayjs(member.registerTime).add(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
  name: member.realName,
  birthDate: '1994-08-18',
  gender: '男',
  nationality: 'Philippines',
  reviewer: 'kyc.audit@filbet.com',
  reviewedAt: dayjs(member.registerTime).add(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
  overallResult: member.kycStatus === 'Approved' ? 'PASS' : member.kycStatus === 'Rejected' ? 'REJECT' : 'PENDING',
  faceResult: 'MATCH 98.7%',
  ocrResult: '姓名 / 生日 / 證件號一致',
});

const getKycPhotoSeed = (member: MemberItem): KycPhotoRecord[] => {
  const stamp = member.uid.slice(-3);
  return [
    {
      id: `${member.uid}-kyc-1`,
      category: '身份證正面',
      fileName: `id-front-${stamp}.jpg`,
      note: '證件正面清晰可辨識',
      uploader: 'kyc.audit@filbet.com',
      uploadedAt: '2026-04-29 10:15:00',
      mimeType: 'image/jpeg',
    },
    {
      id: `${member.uid}-kyc-2`,
      category: '身份證反面',
      fileName: `id-back-${stamp}.jpg`,
      note: '補充證件背面資訊',
      uploader: 'kyc.audit@filbet.com',
      uploadedAt: '2026-04-29 10:20:00',
      mimeType: 'image/jpeg',
    },
    {
      id: `${member.uid}-kyc-3`,
      category: '自拍',
      fileName: `selfie-${stamp}.png`,
      note: '手持證件自拍',
      uploader: 'ops.supervisor@filbet.com',
      uploadedAt: '2026-04-29 10:25:00',
      mimeType: 'image/png',
    },
    {
      id: `${member.uid}-kyc-4`,
      category: '銀行卡',
      fileName: `bank-card-${stamp}.jpg`,
      note: '卡號中段已遮罩',
      uploader: 'ops.supervisor@filbet.com',
      uploadedAt: '2026-04-29 10:30:00',
      mimeType: 'image/jpeg',
    },
    {
      id: `${member.uid}-kyc-5`,
      category: '補充憑證 1',
      fileName: `proof-of-address-${stamp}.pdf`,
      note: '地址證明文件',
      uploader: 'risk.ops@filbet.com',
      uploadedAt: '2026-04-29 10:35:00',
      mimeType: 'application/pdf',
    },
  ];
};

const getKycHistorySeed = (member: MemberItem): KycUploadHistoryRecord[] => [
  { id: `${member.uid}-kh-08`, createdAt: '2026-04-29 10:35:00', operator: 'risk.ops@filbet.com', action: '上傳', category: '補充憑證 1', fileName: `proof-of-address-${member.uid.slice(-3)}.pdf`, note: '地址證明文件' },
  { id: `${member.uid}-kh-07`, createdAt: '2026-04-29 10:30:00', operator: 'ops.supervisor@filbet.com', action: '上傳', category: '銀行卡', fileName: `bank-card-${member.uid.slice(-3)}.jpg`, note: '卡號中段已遮罩' },
  { id: `${member.uid}-kh-06`, createdAt: '2026-04-29 10:25:00', operator: 'ops.supervisor@filbet.com', action: '上傳', category: '自拍', fileName: `selfie-${member.uid.slice(-3)}.png`, note: '手持證件自拍' },
  { id: `${member.uid}-kh-05`, createdAt: '2026-04-29 10:20:00', operator: 'kyc.audit@filbet.com', action: '上傳', category: '身份證反面', fileName: `id-back-${member.uid.slice(-3)}.jpg`, note: '補充證件背面資訊' },
  { id: `${member.uid}-kh-04`, createdAt: '2026-04-29 10:18:00', operator: 'kyc.audit@filbet.com', action: '編輯', category: '身份證正面', fileName: `id-front-${member.uid.slice(-3)}.jpg`, note: '調整為最新版本證件' },
  { id: `${member.uid}-kh-03`, createdAt: '2026-04-29 10:15:00', operator: 'kyc.audit@filbet.com', action: '上傳', category: '身份證正面', fileName: `id-front-${member.uid.slice(-3)}.jpg`, note: '證件正面清晰可辨識' },
  { id: `${member.uid}-kh-02`, createdAt: '2026-04-28 18:50:00', operator: 'kyc.audit@filbet.com', action: '刪除', category: '補充憑證 2', fileName: `old-income-proof-${member.uid.slice(-3)}.pdf`, note: '檔案過期，改由新版收入證明取代' },
  { id: `${member.uid}-kh-01`, createdAt: '2026-04-28 17:10:00', operator: 'ops.supervisor@filbet.com', action: '上傳', category: '補充憑證 2', fileName: `income-proof-${member.uid.slice(-3)}.pdf`, note: '初次補充收入證明' },
];

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

export default function MemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const uid = Array.isArray(params?.uid) ? params.uid[0] : params?.uid;

  const [member, setMember] = useState<MemberItem | undefined>(() => (
    uid ? getMemberByUid(uid) : undefined
  ));
  const [history, setHistory] = useState<VipLevelHistoryItem[]>(() => (
    uid ? [...getVipHistory(uid)] : []
  ));
  const [refreshKey, setRefreshKey] = useState(0);
  const [kycSummary, setKycSummary] = useState<KycSummaryInfo | null>(null);
  const [kycPhotos, setKycPhotos] = useState<KycPhotoRecord[]>([]);
  const [kycUploadHistory, setKycUploadHistory] = useState<KycUploadHistoryRecord[]>([]);
  const [restrictionStates, setRestrictionStates] = useState<MemberCapabilityState[]>([]);
  const [restrictionHistory, setRestrictionHistory] = useState<MemberCapabilityLog[]>([]);
  const [showAllCapabilities, setShowAllCapabilities] = useState(false);
  const [photoModal, setPhotoModal] = useState<KycPhotoModalState>({ open: false, mode: 'create', category: null, record: null });
  const [photoDeleteModal, setPhotoDeleteModal] = useState<KycDeleteModalState>({ open: false, record: null });
  const [photoPreviewModal, setPhotoPreviewModal] = useState<KycPreviewModalState>({ open: false, record: null });
  const [restrictionModal, setRestrictionModal] = useState<RestrictionModalState>({ open: false, mode: 'create', capabilityKey: null });
  const [uploadFileList, setUploadFileList] = useState<UploadFile[]>([]);

  // VIP 調整 Modal
  const [vipModal, setVipModal] = useState<{
    open: boolean;
    step: 'form' | 'result';
    auditId: string | null;
    formValues: any;
  }>({ open: false, step: 'form', auditId: null, formValues: null });
  const [vipForm] = Form.useForm();
  const [kycPhotoForm] = Form.useForm();
  const [kycDeleteForm] = Form.useForm();
  const [restrictionForm] = Form.useForm();

  // VIP 等級紀錄 篩選
  const [historyFilters, setHistoryFilters] = useState<{
    ty?: VipLevelHistoryTy;
    dateRange?: [any, any] | null;
  }>({});

  useEffect(() => {
    const nextMember = uid ? getMemberByUid(uid) : undefined;
    setMember(nextMember);
    setHistory(uid ? [...getVipHistory(uid)] : []);
    if (nextMember && uid) {
      setKycSummary(getKycSummarySeed(nextMember));
      setKycPhotos(getKycPhotoSeed(nextMember));
      setKycUploadHistory(getKycHistorySeed(nextMember));
      setRestrictionStates([...getMemberCapabilityStates(uid)]);
      setRestrictionHistory([...getMemberCapabilityLogs(uid)]);
      setShowAllCapabilities(false);
      setPhotoModal({ open: false, mode: 'create', category: null, record: null });
      setPhotoDeleteModal({ open: false, record: null });
      setPhotoPreviewModal({ open: false, record: null });
      setRestrictionModal({ open: false, mode: 'create', capabilityKey: null });
      setUploadFileList([]);
      kycPhotoForm.resetFields();
      kycDeleteForm.resetFields();
      restrictionForm.resetFields();
    }
  }, [kycDeleteForm, kycPhotoForm, restrictionForm, uid, refreshKey]);

  const calcUpgradeBonus = (from: number, to: number): number => {
    if (to <= from) return 0;
    let total = 0;
    for (let lv = from + 1; lv <= to; lv++) {
      const c = getVipConfig(lv);
      if (c) total += c.upgradeBonus;
    }
    return total;
  };

  const openVipAdjust = () => {
    vipForm.resetFields();
    setVipModal({ open: true, step: 'form', auditId: null, formValues: null });
  };
  const closeVipAdjust = () => {
    setVipModal({ open: false, step: 'form', auditId: null, formValues: null });
    vipForm.resetFields();
  };

  const onVipSubmit = () => {
    vipForm.validateFields().then((values) => {
      if (!member) return;
      if (values.target_level === member.vipLevel) {
        message.error('目標等級不能與當前等級相同');
        return;
      }
      doVipAdjust(values);
    });
  };

  const doVipAdjust = (v: any) => {
    if (!member) return;
    const targetLevel: number = v.target_level;
    const isUpgrade = targetLevel > member.vipLevel;
    const now = Date.now();
    const newKeepExpire = dayjs().add(30, 'day').format('YYYYMMDD');
    const bonusGranted = isUpgrade ? calcUpgradeBonus(member.vipLevel, targetLevel) : 0;

    // 1. 更新會員主資料
    updateMember(member.id, {
      vipLevel: targetLevel,
      tierRange: getTierRangeEn(targetLevel),
      currentLevelXp: 0,
      keepExpire: newKeepExpire,
      vipUpgradeAt: now,
    });

    // 2. 寫一筆 VIP 等級紀錄（依方向分流 ty）
    const auditId = `VIP-ADJ-${dayjs().format('YYYYMMDD-HHmmss')}-${member.uid}`;
    const ty: VipLevelHistoryTy = isUpgrade ? 'ManualUpgrade' : 'ManualDowngrade';
    const remarkPrefix = isUpgrade ? '[手動升級]' : '[手動降級]';
    appendVipHistory(member.uid, {
      id: auditId,
      uid: member.uid,
      username: member.account,
      ty,
      beforeLevel: member.vipLevel,
      afterLevel: targetLevel,
      beforeXp: member.xpPoints,
      changeXp: 0,
      afterXp: member.xpPoints,
      remark: `${remarkPrefix} ${v.reason}`,
      keepExpire: dayjs(newKeepExpire, 'YYYYMMDD').format('YYYY-MM-DD'),
      tierRange: getTierRangeEn(targetLevel),
      upgradeRecordId: '0',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: 'darren@filbetph.com',
      bonusGranted,
      resetKeepTimer: true,
    });

    setVipModal(prev => ({ ...prev, step: 'result', auditId }));
    setRefreshKey(k => k + 1);
  };

  // 必須放在 early return 之前（hooks rule）
  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      if (historyFilters.ty && h.ty !== historyFilters.ty) return false;
      if (historyFilters.dateRange && historyFilters.dateRange[0] && historyFilters.dateRange[1]) {
        const t = dayjs(h.createdAt);
        if (t.isBefore(historyFilters.dateRange[0].startOf('day'))) return false;
        if (t.isAfter(historyFilters.dateRange[1].endOf('day'))) return false;
      }
      return true;
    });
  }, [history, historyFilters]);

  if (!member) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>返回</Button>
        <Empty description="找不到此會員" style={{ marginTop: 80 }} />
      </div>
    );
  }

  // ============== 詳情 Tab ==============
  const renderDetailTab = () => (
    <>
      <Card size="small" title="會員資訊" style={{ marginBottom: 16 }}>
        <Descriptions size="small" column={3} colon>
          <Descriptions.Item label="UID">
            <Space size={4}>
              <Text>{member.uid}</Text>
              <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(member.uid); message.success('已複製'); }} />
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="帳號">{member.account}</Descriptions.Item>
          <Descriptions.Item label="暱稱">{member.nickname || '-'}</Descriptions.Item>
          <Descriptions.Item label="真實姓名">{member.realName}</Descriptions.Item>
          <Descriptions.Item label="手機">{member.phone}</Descriptions.Item>
          <Descriptions.Item label="會員狀態">
            <Tag color={memberStatusColor[member.memberStatus]}>{member.memberStatus}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="KYC 狀態">
            <Tag color={kycStatusColor[member.kycStatus]}>{member.kycStatus}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="代理資格">
            <Tag color={member.agentStatus === '已開啟' ? 'blue' : 'default'}>{member.agentStatus}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="風控等級">
            <Tag color={member.riskLevel === '高' ? 'red' : member.riskLevel === '中' ? 'orange' : 'default'}>{member.riskLevel}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="註冊時間">{member.registerTime}</Descriptions.Item>
          <Descriptions.Item label="註冊 IP">{member.registerIP}</Descriptions.Item>
          <Descriptions.Item label="最近登錄">{member.lastLoginTime}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small" title="財務概覽" style={{ marginBottom: 16 }}>
        <Descriptions size="small" column={4} colon>
          <Descriptions.Item label="錢包餘額">₱{member.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
          <Descriptions.Item label="商城代幣">{member.mallTokenBalance.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="累計存款">₱{member.totalDeposit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
          <Descriptions.Item label="累計提款">₱{member.totalWithdraw.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
          <Descriptions.Item label="存提差">₱{member.depositWithdrawDiff.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
          <Descriptions.Item label="GGR">₱{member.ggr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
          <Descriptions.Item label="累計投注">₱{member.totalBet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
          <Descriptions.Item label="活動禮金">₱{member.activityBonus.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small" title={
        <Space>
          <CrownOutlined style={{ color: '#faad14' }} />
          <span>VIP 狀態</span>
        </Space>
      }>
        <Descriptions size="small" column={3} colon>
          <Descriptions.Item label="當前等級">
            <Tag color="blue" style={{ fontSize: 13 }}>V{member.vipLevel}</Tag>
            <Tag color="purple">{getTierRangeName(member.vipLevel)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="總 XP">{member.xpPoints.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="當前等級已累積">{member.currentLevelXp.toLocaleString()} XP</Descriptions.Item>
          <Descriptions.Item label="升下一級需 XP">
            {member.vipLevel >= 30 ? <Text type="secondary">已達上限</Text> : (getVipConfig(member.vipLevel + 1)?.upgradeDiffXp || 0).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="保級門檻 XP">
            {(getVipConfig(member.vipLevel)?.keepLevelXp ?? 0).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="保級到期日">
            {dayjs(member.keepExpire, 'YYYYMMDD').format('YYYY-MM-DD')}
            <Text type="secondary" style={{ marginLeft: 8 }}>
              （{Math.max(0, dayjs(member.keepExpire, 'YYYYMMDD').diff(dayjs(), 'day'))} 天）
            </Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </>
  );

  // ============== VIP 等級紀錄 Tab ==============
  const historyColumns: ColumnsType<VipLevelHistoryItem> = [
    {
      title: '觸發時間',
      dataIndex: 'createdAt',
      width: 170,
      sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
      defaultSortOrder: 'descend',
    },
    {
      title: '下次結算時間',
      dataIndex: 'keepExpire',
      width: 130,
    },
    {
      title: '結算區間',
      key: 'settle_range',
      width: 220,
      render: (_, r) => {
        const start = dayjs(r.createdAt).format('YYYY-MM-DD');
        const end = r.keepExpire;
        return <Text>{start} ~ {end}</Text>;
      },
    },
    {
      title: '異動前等級',
      dataIndex: 'beforeLevel',
      width: 110,
      render: (val: number) => <Tag color="blue">V{val}</Tag>,
    },
    {
      title: '異動後等級',
      dataIndex: 'afterLevel',
      width: 110,
      render: (val: number, r) => (
        <Tag color={r.afterLevel > r.beforeLevel ? 'green' : r.afterLevel < r.beforeLevel ? 'red' : 'blue'}>V{val}</Tag>
      ),
    },
    {
      title: '類型',
      dataIndex: 'ty',
      width: 110,
      render: (val: VipLevelHistoryTy) => (
        <Tag color={VipHistoryTyColor[val]}>{VipHistoryTyLabel[val]}</Tag>
      ),
    },
    {
      title: '變動前 XP',
      dataIndex: 'beforeXp',
      width: 120,
      align: 'right',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '變動 XP',
      dataIndex: 'changeXp',
      width: 110,
      align: 'right',
      render: (val: number) => (
        <Text type={val > 0 ? 'success' : val < 0 ? 'danger' : 'secondary'}>
          {val > 0 ? '+' : ''}{val.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '變動後 XP',
      dataIndex: 'afterXp',
      width: 120,
      align: 'right',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '操作說明',
      dataIndex: 'remark',
      width: 240,
      ellipsis: true,
      render: (val: string) => <Tooltip title={val}><Text style={{ fontSize: 12 }}>{val}</Text></Tooltip>,
    },
    {
      title: '操作員',
      dataIndex: 'operator',
      width: 160,
    },
    {
      title: '記錄 ID',
      dataIndex: 'id',
      width: 220,
      render: (val: string) => (
        <Space size={2}>
          <Text code style={{ fontSize: 11 }}>{val}</Text>
          <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(val); message.success('已複製'); }} />
        </Space>
      ),
    },
  ];

  const renderVipHistoryTab = () => (
    <Card
      size="small"
      title={
        <Space>
          <CrownOutlined style={{ color: '#faad14' }} />
          <span>VIP 等級紀錄</span>
          <Text type="secondary" style={{ fontSize: 12 }}>共 {filteredHistory.length} / {history.length} 筆</Text>
        </Space>
      }
      extra={
        <Button data-e2e-id="member-detail-vip-history-adjust-btn" type="primary" icon={<EditOutlined />} onClick={openVipAdjust}>
          VIP 等級手動調整
        </Button>
      }
    >
      {/* 篩選列 */}
      <Space style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13 }}>類型：</span>
        <Select
          data-e2e-id="member-detail-vip-history-type-select"
          allowClear
          placeholder="全部"
          style={{ width: 160 }}
          value={historyFilters.ty}
          onChange={(v) => setHistoryFilters(f => ({ ...f, ty: v }))}
        >
          <Select.Option value="Upgrade">{VipHistoryTyLabel.Upgrade}</Select.Option>
          <Select.Option value="Degrade">{VipHistoryTyLabel.Degrade}</Select.Option>
          <Select.Option value="Keep">{VipHistoryTyLabel.Keep}</Select.Option>
          <Select.Option value="ManualUpgrade">{VipHistoryTyLabel.ManualUpgrade}</Select.Option>
          <Select.Option value="ManualDowngrade">{VipHistoryTyLabel.ManualDowngrade}</Select.Option>
        </Select>
        <span style={{ fontSize: 13, marginLeft: 12 }}>創建時間：</span>
        <RangePicker
          data-e2e-id="member-detail-vip-history-date-range"
          value={historyFilters.dateRange as any}
          onChange={(range) => setHistoryFilters(f => ({ ...f, dateRange: range as any }))}
          allowClear
        />
        <Button data-e2e-id="member-detail-vip-history-reset-btn" onClick={() => setHistoryFilters({})}>重置</Button>
      </Space>

      <Table
        columns={historyColumns}
        dataSource={filteredHistory}
        rowKey="id"
        onRow={(record) => ({ 'data-e2e-id': `member-detail-vip-history-row-${record.id}` } as React.HTMLAttributes<HTMLTableRowElement>)}
        scroll={{ x: 1900 }}
        pagination={{ pageSize: 20, showTotal: t => `共 ${t} 筆` }}
        size="small"
      />
    </Card>
  );

  const MemberStatCard = ({
    title,
    extra,
    children,
  }: {
    title?: React.ReactNode;
    extra?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <Card size="small" title={title} extra={extra}>
      {children}
    </Card>
  );

  const PersonalDailyStatsTab = () => {
    const [form] = Form.useForm<DateRangeFilter>();
    const [filters, setFilters] = useState<DateRangeFilter>({ dateRange: defaultStatRange() });
    const [summaryMode, setSummaryMode] = useState<SummaryMode>('page');

    const queryStart = filters.dateRange[0].format('YYYY-MM-DD');
    const queryEnd = filters.dateRange[1].format('YYYY-MM-DD');

    const rows = useMemo(() => personalStats
      .filter(row => row.uid === uid && row.date >= queryStart && row.date <= queryEnd)
      .sort((a, b) => b.date.localeCompare(a.date)), [queryEnd, queryStart, uid]);

    const summaryRows = summaryMode === 'all' ? rows : rows.slice(0, 10);
    const summary = useMemo(() => summaryRows.reduce((acc, row) => ({
      totalDeposit: acc.totalDeposit + row.totalDeposit,
      totalWithdraw: acc.totalWithdraw + row.totalWithdraw,
      totalBet: acc.totalBet + row.totalBet,
      validBet: acc.validBet + row.validBet,
      ggr: acc.ggr + row.ggr,
    }), {
      totalDeposit: 0,
      totalWithdraw: 0,
      totalBet: 0,
      validBet: 0,
      ggr: 0,
    }), [summaryRows]);

    const columns: ColumnsType<PersonalStat> = [
      { title: '統計日期', dataIndex: 'date', width: 120, sorter: (a, b) => a.date.localeCompare(b.date), defaultSortOrder: 'descend' },
      { title: '存款次數', dataIndex: 'depositCount', width: 100, align: 'right', render: (value: number) => formatInteger(value) },
      { title: '總存款', dataIndex: 'totalDeposit', width: 120, align: 'right', render: (value: number) => formatAmount(value) },
      { title: '提款次數', dataIndex: 'withdrawCount', width: 100, align: 'right', render: (value: number) => formatInteger(value) },
      { title: '總提款', dataIndex: 'totalWithdraw', width: 120, align: 'right', render: (value: number) => formatAmount(value) },
      { title: '存款手續費', dataIndex: 'depositFee', width: 120, align: 'right', render: (value: number) => formatAmount(value) },
      { title: '提款手續費', dataIndex: 'withdrawFee', width: 120, align: 'right', render: (value: number) => formatAmount(value) },
      { title: '總投注', dataIndex: 'totalBet', width: 120, align: 'right', render: (value: number) => formatAmount(value) },
      { title: '有效流水', dataIndex: 'validBet', width: 120, align: 'right', render: (value: number) => formatAmount(value) },
      { title: '總派獎', dataIndex: 'totalPayout', width: 120, align: 'right', render: (value: number) => formatAmount(value) },
      { title: 'GGR', dataIndex: 'ggr', width: 120, align: 'right', render: (value: number) => renderGgrText(value) },
      { title: '總彩金', dataIndex: 'totalBonus', width: 120, align: 'right', render: (value: number) => formatAmount(value) },
      { title: '總佣金', dataIndex: 'totalCommission', width: 120, align: 'right', render: (value: number) => formatAmount(value) },
    ];

    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <MemberStatCard>
          <Form form={form} layout="vertical" initialValues={{ dateRange: defaultStatRange() }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="統計時間" name="dateRange">
                  <RangePicker data-e2e-id="member-detail-personal-filter-date-range" style={{ width: '100%' }} allowClear={false} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label=" ">
                  <Space>
                    <Button
                      data-e2e-id="member-detail-personal-filter-query-btn"
                      type="primary"
                      onClick={() => setFilters({ dateRange: form.getFieldValue('dateRange') || defaultStatRange() })}
                    >
                      查詢
                    </Button>
                    <Button
                      data-e2e-id="member-detail-personal-filter-reset-btn"
                      onClick={() => {
                        const nextRange = defaultStatRange();
                        form.setFieldsValue({ dateRange: nextRange });
                        setFilters({ dateRange: nextRange });
                      }}
                    >
                      重置
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </MemberStatCard>

        <MemberStatCard
          title="摘要"
          extra={(
            <Segmented<SummaryMode>
              data-e2e-id="member-detail-personal-summary-mode"
              value={summaryMode}
              onChange={value => setSummaryMode(value)}
              options={[
                { label: '小計', value: 'page' },
                { label: '總計', value: 'all' },
              ]}
            />
          )}
        >
          <Row gutter={16}>
            <Col span={4}><Statistic data-e2e-id="member-detail-personal-summary-total-deposit" title="總存款" value={summary.totalDeposit} formatter={value => formatAmount(Number(value || 0))} /></Col>
            <Col span={4}><Statistic data-e2e-id="member-detail-personal-summary-total-withdraw" title="總提款" value={summary.totalWithdraw} formatter={value => formatAmount(Number(value || 0))} /></Col>
            <Col span={4}><Statistic data-e2e-id="member-detail-personal-summary-total-bet" title="總投注" value={summary.totalBet} formatter={value => formatAmount(Number(value || 0))} /></Col>
            <Col span={4}><Statistic data-e2e-id="member-detail-personal-summary-valid-bet" title="有效流水" value={summary.validBet} formatter={value => formatAmount(Number(value || 0))} /></Col>
            <Col span={4}><Statistic data-e2e-id="member-detail-personal-summary-ggr" title="GGR" value={summary.ggr} valueStyle={{ color: summary.ggr >= 0 ? '#52c41a' : '#ff4d4f' }} formatter={value => formatAmount(Number(value || 0))} /></Col>
          </Row>
        </MemberStatCard>

        <MemberStatCard
          extra={(
            <Button
              data-e2e-id="member-detail-personal-toolbar-export-btn"
              onClick={() => exportCsv(
                `member-${uid}-personal-daily-${queryStart}-${queryEnd}.csv`,
                ['統計日期', '會員 UID', '會員帳號', '存款次數', '總存款', '提款次數', '總提款', '存款手續費', '提款手續費', '總投注', '有效流水', '總派獎', 'GGR', '總彩金', '總佣金'],
                rows.map(row => [
                  row.date,
                  row.uid,
                  row.username,
                  row.depositCount,
                  formatAmount(row.totalDeposit),
                  row.withdrawCount,
                  formatAmount(row.totalWithdraw),
                  formatAmount(row.depositFee),
                  formatAmount(row.withdrawFee),
                  formatAmount(row.totalBet),
                  formatAmount(row.validBet),
                  formatAmount(row.totalPayout),
                  formatAmount(row.ggr),
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
            rowKey={(record) => `${record.uid}-${record.date}`}
            columns={columns}
            dataSource={rows}
            onRow={(record) => ({ 'data-e2e-id': `member-detail-personal-table-row-${record.uid}-${record.date}` } as React.HTMLAttributes<HTMLTableRowElement>)}
            scroll={{ x: 1600 }}
            pagination={{ pageSize: 10, showTotal: total => `共 ${total} 筆` }}
            size="small"
          />
        </MemberStatCard>
      </Space>
    );
  };

  const InviteDailyStatsTab = () => {
    const [form] = Form.useForm<DateRangeFilter>();
    const [filters, setFilters] = useState<DateRangeFilter>({ dateRange: defaultStatRange() });
    const [summaryMode, setSummaryMode] = useState<SummaryMode>('page');

    const queryStart = filters.dateRange[0].format('YYYY-MM-DD');
    const queryEnd = filters.dateRange[1].format('YYYY-MM-DD');

    const rows = useMemo(() => inviteStats
      .filter(row => row.uid === uid && row.date >= queryStart && row.date <= queryEnd)
      .sort((a, b) => b.date.localeCompare(a.date)), [queryEnd, queryStart, uid]);

    const summaryRows = summaryMode === 'all' ? rows : rows.slice(0, 10);
    const summary = useMemo(() => summaryRows.reduce((acc, row) => ({
      inviteCount: acc.inviteCount + row.inviteCount,
      achieveCount: acc.achieveCount + row.achieveCount,
      betUserCount: acc.betUserCount + row.betUserCount,
      totalDeposit: acc.totalDeposit + row.totalDeposit,
      ggr: acc.ggr + row.ggr,
    }), {
      inviteCount: 0,
      achieveCount: 0,
      betUserCount: 0,
      totalDeposit: 0,
      ggr: 0,
    }), [summaryRows]);

    const columns: ColumnsType<InviteStat> = [
      { title: '統計日期', dataIndex: 'date', width: 120, sorter: (a, b) => a.date.localeCompare(b.date), defaultSortOrder: 'descend' },
      { title: '邀請人數', dataIndex: 'inviteCount', width: 100, align: 'right', render: (value: number) => formatInteger(value) },
      { title: '達成人數', dataIndex: 'achieveCount', width: 100, align: 'right', render: (value: number) => formatInteger(value) },
      { title: '投注人數', dataIndex: 'betUserCount', width: 100, align: 'right', render: (value: number) => formatInteger(value) },
      { title: '存款人數', dataIndex: 'depositUserCount', width: 100, align: 'right', render: (value: number) => formatInteger(value) },
      { title: '總存款', dataIndex: 'totalDeposit', width: 120, align: 'right', render: (value: number) => formatAmount(value) },
      { title: '總提款', dataIndex: 'totalWithdraw', width: 120, align: 'right', render: (value: number) => formatAmount(value) },
      { title: '存款手續費', dataIndex: 'depositFee', width: 120, align: 'right', render: (value: number) => formatAmount(value) },
      { title: '提款手續費', dataIndex: 'withdrawFee', width: 120, align: 'right', render: (value: number) => formatAmount(value) },
      { title: '總投注', dataIndex: 'totalBet', width: 120, align: 'right', render: (value: number) => formatAmount(value) },
      { title: '有效流水', dataIndex: 'validBet', width: 120, align: 'right', render: (value: number) => formatAmount(value) },
      { title: '總派獎', dataIndex: 'totalPayout', width: 120, align: 'right', render: (value: number) => formatAmount(value) },
      { title: 'GGR', dataIndex: 'ggr', width: 120, align: 'right', render: (value: number) => renderGgrText(value) },
    ];

    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <MemberStatCard>
          <Form form={form} layout="vertical" initialValues={{ dateRange: defaultStatRange() }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="統計時間" name="dateRange">
                  <RangePicker data-e2e-id="member-detail-invite-filter-date-range" style={{ width: '100%' }} allowClear={false} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label=" ">
                  <Space>
                    <Button
                      data-e2e-id="member-detail-invite-filter-query-btn"
                      type="primary"
                      onClick={() => setFilters({ dateRange: form.getFieldValue('dateRange') || defaultStatRange() })}
                    >
                      查詢
                    </Button>
                    <Button
                      data-e2e-id="member-detail-invite-filter-reset-btn"
                      onClick={() => {
                        const nextRange = defaultStatRange();
                        form.setFieldsValue({ dateRange: nextRange });
                        setFilters({ dateRange: nextRange });
                      }}
                    >
                      重置
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </MemberStatCard>

        <MemberStatCard
          title="摘要"
          extra={(
            <Segmented<SummaryMode>
              data-e2e-id="member-detail-invite-summary-mode"
              value={summaryMode}
              onChange={value => setSummaryMode(value)}
              options={[
                { label: '小計', value: 'page' },
                { label: '總計', value: 'all' },
              ]}
            />
          )}
        >
          <Row gutter={16}>
            <Col span={4}><Statistic data-e2e-id="member-detail-invite-summary-invite-count" title="邀請人數" value={summary.inviteCount} formatter={value => formatInteger(Number(value || 0))} /></Col>
            <Col span={4}><Statistic data-e2e-id="member-detail-invite-summary-achieve-count" title="達成人數" value={summary.achieveCount} formatter={value => formatInteger(Number(value || 0))} /></Col>
            <Col span={4}><Statistic data-e2e-id="member-detail-invite-summary-bet-user-count" title="投注人數" value={summary.betUserCount} formatter={value => formatInteger(Number(value || 0))} /></Col>
            <Col span={4}><Statistic data-e2e-id="member-detail-invite-summary-total-deposit" title="總存款" value={summary.totalDeposit} formatter={value => formatAmount(Number(value || 0))} /></Col>
            <Col span={4}><Statistic data-e2e-id="member-detail-invite-summary-ggr" title="GGR" value={summary.ggr} valueStyle={{ color: summary.ggr >= 0 ? '#52c41a' : '#ff4d4f' }} formatter={value => formatAmount(Number(value || 0))} /></Col>
          </Row>
        </MemberStatCard>

        <MemberStatCard
          extra={(
            <Button
              data-e2e-id="member-detail-invite-toolbar-export-btn"
              onClick={() => exportCsv(
                `member-${uid}-invite-daily-${queryStart}-${queryEnd}.csv`,
                ['統計日期', '會員 UID', '會員帳號', '邀請人數', '達成人數', '投注人數', '存款人數', '總存款', '總提款', '存款手續費', '提款手續費', '總投注', '有效流水', '總派獎', 'GGR'],
                rows.map(row => [
                  row.date,
                  row.uid,
                  row.username,
                  row.inviteCount,
                  row.achieveCount,
                  row.betUserCount,
                  row.depositUserCount,
                  formatAmount(row.totalDeposit),
                  formatAmount(row.totalWithdraw),
                  formatAmount(row.depositFee),
                  formatAmount(row.withdrawFee),
                  formatAmount(row.totalBet),
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
            rowKey={(record) => `${record.uid}-${record.date}`}
            columns={columns}
            dataSource={rows}
            onRow={(record) => ({ 'data-e2e-id': `member-detail-invite-table-row-${record.uid}-${record.date}` } as React.HTMLAttributes<HTMLTableRowElement>)}
            scroll={{ x: 1500 }}
            pagination={{ pageSize: 10, showTotal: total => `共 ${total} 筆` }}
            size="small"
          />
        </MemberStatCard>
      </Space>
    );
  };

  const GameDailyStatsTab = () => {
    const [form] = Form.useForm<GameDateRangeFilter>();
    const [filters, setFilters] = useState<GameDateRangeFilter>({ gameType: 'ALL', dateRange: defaultStatRange() });
    const [summaryMode, setSummaryMode] = useState<SummaryMode>('page');

    const queryStart = filters.dateRange[0].format('YYYY-MM-DD');
    const queryEnd = filters.dateRange[1].format('YYYY-MM-DD');

    const rows = useMemo(() => gameStats
      .filter(row => row.uid === uid
        && row.date >= queryStart
        && row.date <= queryEnd
        && (filters.gameType === 'ALL' ? true : row.gameType === filters.gameType))
      .sort((a, b) => {
        if (a.date === b.date) return a.gameType.localeCompare(b.gameType);
        return b.date.localeCompare(a.date);
      }), [filters.gameType, queryEnd, queryStart, uid]);

    const summaryRows = summaryMode === 'all' ? rows : rows.slice(0, 10);
    const summary = useMemo(() => summaryRows.reduce((acc, row) => ({
      totalBet: acc.totalBet + row.totalBet,
      excludedBet: acc.excludedBet + row.excludedBet,
      validBet: acc.validBet + row.validBet,
      totalPayout: acc.totalPayout + row.totalPayout,
      ggr: acc.ggr + row.ggr,
    }), {
      totalBet: 0,
      excludedBet: 0,
      validBet: 0,
      totalPayout: 0,
      ggr: 0,
    }), [summaryRows]);

    const columns: ColumnsType<GameStat> = [
      { title: '統計日期', dataIndex: 'date', width: 120, sorter: (a, b) => a.date.localeCompare(b.date), defaultSortOrder: 'descend' },
      { title: '遊戲類型', dataIndex: 'gameType', width: 120 },
      { title: '總投注額', dataIndex: 'totalBet', width: 130, align: 'right', render: (value: number) => formatAmount(value) },
      { title: '排除投注額', dataIndex: 'excludedBet', width: 130, align: 'right', render: (value: number) => formatAmount(value) },
      { title: '有效投注額', dataIndex: 'validBet', width: 130, align: 'right', render: (value: number) => formatAmount(value) },
      { title: '總派獎', dataIndex: 'totalPayout', width: 130, align: 'right', render: (value: number) => formatAmount(value) },
      { title: 'GGR', dataIndex: 'ggr', width: 120, align: 'right', render: (value: number) => renderGgrText(value) },
    ];

    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <MemberStatCard>
          <Form form={form} layout="vertical" initialValues={{ gameType: 'ALL', dateRange: defaultStatRange() }}>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="遊戲類型" name="gameType">
                  <Select
                    data-e2e-id="member-detail-game-filter-game-type-select"
                    options={[
                      { label: '全部', value: 'ALL' },
                      ...gameTypes.map(type => ({ label: type, value: type })),
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="統計時間" name="dateRange">
                  <RangePicker data-e2e-id="member-detail-game-filter-date-range" style={{ width: '100%' }} allowClear={false} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label=" ">
                  <Space>
                    <Button
                      data-e2e-id="member-detail-game-filter-query-btn"
                      type="primary"
                      onClick={() => setFilters({
                        gameType: form.getFieldValue('gameType') || 'ALL',
                        dateRange: form.getFieldValue('dateRange') || defaultStatRange(),
                      })}
                    >
                      查詢
                    </Button>
                    <Button
                      data-e2e-id="member-detail-game-filter-reset-btn"
                      onClick={() => {
                        const nextRange = defaultStatRange();
                        form.setFieldsValue({ gameType: 'ALL', dateRange: nextRange });
                        setFilters({ gameType: 'ALL', dateRange: nextRange });
                      }}
                    >
                      重置
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </MemberStatCard>

        <MemberStatCard
          title="摘要"
          extra={(
            <Segmented<SummaryMode>
              data-e2e-id="member-detail-game-summary-mode"
              value={summaryMode}
              onChange={value => setSummaryMode(value)}
              options={[
                { label: '小計', value: 'page' },
                { label: '總計', value: 'all' },
              ]}
            />
          )}
        >
          <Row gutter={16}>
            <Col span={4}><Statistic data-e2e-id="member-detail-game-summary-total-bet" title="總投注" value={summary.totalBet} formatter={value => formatAmount(Number(value || 0))} /></Col>
            <Col span={4}><Statistic data-e2e-id="member-detail-game-summary-excluded-bet" title="排除投注" value={summary.excludedBet} formatter={value => formatAmount(Number(value || 0))} /></Col>
            <Col span={4}><Statistic data-e2e-id="member-detail-game-summary-valid-bet" title="有效投注" value={summary.validBet} formatter={value => formatAmount(Number(value || 0))} /></Col>
            <Col span={4}><Statistic data-e2e-id="member-detail-game-summary-total-payout" title="總派獎" value={summary.totalPayout} formatter={value => formatAmount(Number(value || 0))} /></Col>
            <Col span={4}><Statistic data-e2e-id="member-detail-game-summary-ggr" title="GGR" value={summary.ggr} valueStyle={{ color: summary.ggr >= 0 ? '#52c41a' : '#ff4d4f' }} formatter={value => formatAmount(Number(value || 0))} /></Col>
          </Row>
        </MemberStatCard>

        <MemberStatCard
          extra={(
            <Button
              data-e2e-id="member-detail-game-toolbar-export-btn"
              onClick={() => exportCsv(
                `member-${uid}-game-daily-${queryStart}-${queryEnd}-${filters.gameType}.csv`,
                ['統計日期', '會員 UID', '會員帳號', '遊戲類型', '總投注額', '排除投注額', '有效投注額', '總派獎', 'GGR'],
                rows.map(row => [
                  row.date,
                  row.uid,
                  row.username,
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
            rowKey={(record) => `${record.uid}-${record.date}-${record.gameType}`}
            columns={columns}
            dataSource={rows}
            onRow={(record) => ({ 'data-e2e-id': `member-detail-game-table-row-${record.uid}-${record.date}-${record.gameType}` } as React.HTMLAttributes<HTMLTableRowElement>)}
            scroll={{ x: 1200 }}
            pagination={{ pageSize: 10, showTotal: total => `共 ${total} 筆` }}
            size="small"
          />
        </MemberStatCard>
      </Space>
    );
  };

  const sortedKycUploadHistory = useMemo(
    () => kycUploadHistory.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [kycUploadHistory],
  );

  const sortedRestrictionHistory = useMemo(
    () => restrictionHistory.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [restrictionHistory],
  );

  const getPhotoByCategory = (category: KycPhotoCategory) => (
    kycPhotos.find((record) => record.category === category) ?? null
  );

  const resetPhotoModal = () => {
    setPhotoModal({ open: false, mode: 'create', category: null, record: null });
    setUploadFileList([]);
    kycPhotoForm.resetFields();
  };

  const openPhotoModal = (category: KycPhotoCategory, record?: KycPhotoRecord | null) => {
    const nextRecord = record ?? getPhotoByCategory(category);
    setPhotoModal({
      open: true,
      mode: nextRecord ? 'edit' : 'create',
      category,
      record: nextRecord,
    });
    setUploadFileList(nextRecord ? [{
      uid: nextRecord.id,
      name: nextRecord.fileName,
      status: 'done',
    }] : []);
    kycPhotoForm.setFieldsValue({
      category,
      note: nextRecord?.note,
    });
  };

  const closeDeletePhotoModal = () => {
    setPhotoDeleteModal({ open: false, record: null });
    kycDeleteForm.resetFields();
  };

  const handlePhotoUploadBeforeUpload: UploadProps['beforeUpload'] = (file) => {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['jpg', 'jpeg', 'png', 'pdf'].includes(extension)) {
      message.error('僅支援 jpg / jpeg / png / pdf');
      return Upload.LIST_IGNORE;
    }
    if (file.size > 10 * 1024 * 1024) {
      message.error('單檔大小不得超過 10MB');
      return Upload.LIST_IGNORE;
    }
    setUploadFileList([{ uid: String(Date.now()), name: file.name, status: 'done', originFileObj: file }]);
    return false;
  };

  const handlePhotoSubmit = async () => {
    if (!photoModal.category) return;
    const values = await kycPhotoForm.validateFields();
    if (uploadFileList.length === 0) {
      message.error('請先選擇上傳檔案');
      return;
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const uploadFile = uploadFileList[0];
    const extension = uploadFile.name.split('.').pop()?.toLowerCase() ?? '';
    const mimeType = extension === 'pdf'
      ? 'application/pdf'
      : extension === 'png'
        ? 'image/png'
        : 'image/jpeg';

    const nextRecord: KycPhotoRecord = {
      id: photoModal.record?.id ?? `kyc-${Date.now()}`,
      category: values.category,
      fileName: uploadFile.name,
      note: values.note,
      uploader: currentOperator,
      uploadedAt: now,
      mimeType,
    };

    setKycPhotos((prev) => {
      const filtered = prev.filter((item) => item.category !== photoModal.category && item.category !== values.category && item.id !== photoModal.record?.id);
      return [nextRecord, ...filtered];
    });

    setKycUploadHistory((prev) => [
      {
        id: `kh-${Date.now()}`,
        createdAt: now,
        operator: currentOperator,
        action: photoModal.record ? '編輯' : '上傳',
        category: values.category,
        fileName: uploadFile.name,
        note: values.note,
      },
      ...prev,
    ]);

    message.success(`KYC 照片已${photoModal.record ? '更新' : '新增'}`);
    resetPhotoModal();
  };

  const handleDeletePhoto = async () => {
    if (!photoDeleteModal.record) return;
    const targetRecord = photoDeleteModal.record;
    const values = await kycDeleteForm.validateFields();
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    setKycPhotos((prev) => prev.filter((item) => item.id !== targetRecord.id));
    setKycUploadHistory((prev) => [
      {
        id: `kh-${Date.now()}`,
        createdAt: now,
        operator: currentOperator,
        action: '刪除',
        category: targetRecord.category,
        fileName: targetRecord.fileName,
        note: values.deleteReason,
      },
      ...prev,
    ]);

    message.success('檔案已 soft delete，可於 90 天內復原');
    closeDeletePhotoModal();
  };

  const openCreateRestrictionModal = () => {
    restrictionForm.resetFields();
    restrictionForm.setFieldsValue({ durationType: 'permanent' });
    setRestrictionModal({ open: true, mode: 'create', capabilityKey: null });
  };

  const openEditRestrictionModal = (state: MemberCapabilityState) => {
    restrictionForm.resetFields();
    restrictionForm.setFieldsValue({
      capabilityKey: state.capabilityKey,
      reason: state.reason,
      durationType: state.restrictedUntil ? 'until' : 'permanent',
      restrictedUntil: state.restrictedUntil ? dayjs(state.restrictedUntil) : null,
    });
    setRestrictionModal({ open: true, mode: 'edit', capabilityKey: state.capabilityKey });
  };

  const openReleaseRestrictionModal = (capabilityKey: string) => {
    restrictionForm.resetFields();
    restrictionForm.setFieldsValue({ capabilityKey });
    setRestrictionModal({ open: true, mode: 'release', capabilityKey });
  };

  const closeRestrictionModal = () => {
    setRestrictionModal({ open: false, mode: 'create', capabilityKey: null });
    restrictionForm.resetFields();
  };

  const handleRestrictionSubmit = async () => {
    if (!uid) return;
    const values = await restrictionForm.validateFields();
    const targetKey: string | undefined = restrictionModal.mode === 'create'
      ? values.capabilityKey
      : restrictionModal.capabilityKey ?? undefined;
    if (!targetKey) return;
    const dictItem = getCapabilityDictItem(targetKey);
    if (!dictItem) return;

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const source: CapabilitySource = 'manual';

    if (restrictionModal.mode === 'release') {
      const nextState: MemberCapabilityState = {
        capabilityKey: targetKey,
        restricted: false,
        reason: values.reason,
        source,
        restrictedAt: now,
        restrictedUntil: null,
        operator: currentOperator,
      };
      setMemberCapabilityState(uid, nextState);
      const log: MemberCapabilityLog = {
        id: `cap-${Date.now()}`,
        createdAt: now,
        capabilityKey: targetKey,
        action: 'open',
        reason: values.reason,
        source,
        restrictedUntil: null,
        operator: currentOperator,
      };
      appendMemberCapabilityLog(uid, log);
      setRestrictionStates([...getMemberCapabilityStates(uid)]);
      setRestrictionHistory([...getMemberCapabilityLogs(uid)]);
      message.success(`已解除 ${dictItem.nameZh} 限制`);
      closeRestrictionModal();
      return;
    }

    const restrictedUntil: string | null = values.durationType === 'until' && values.restrictedUntil
      ? dayjs(values.restrictedUntil).format('YYYY-MM-DD HH:mm:ss')
      : null;

    const nextState: MemberCapabilityState = {
      capabilityKey: targetKey,
      restricted: true,
      reason: values.reason,
      source,
      restrictedAt: restrictionModal.mode === 'edit'
        ? (restrictionStates.find(s => s.capabilityKey === targetKey)?.restrictedAt ?? now)
        : now,
      restrictedUntil,
      operator: currentOperator,
    };
    setMemberCapabilityState(uid, nextState);

    const log: MemberCapabilityLog = {
      id: `cap-${Date.now()}`,
      createdAt: now,
      capabilityKey: targetKey,
      action: restrictionModal.mode === 'edit' ? 'update' : 'close',
      reason: values.reason,
      source,
      restrictedUntil,
      operator: currentOperator,
    };
    appendMemberCapabilityLog(uid, log);

    setRestrictionStates([...getMemberCapabilityStates(uid)]);
    setRestrictionHistory([...getMemberCapabilityLogs(uid)]);
    message.success(restrictionModal.mode === 'edit'
      ? `${dictItem.nameZh} 限制設定已更新`
      : `已限制 ${dictItem.nameZh} 功能`);
    closeRestrictionModal();
  };

  const kycHistoryColumns: ColumnsType<KycUploadHistoryRecord> = [
    { title: '時間', dataIndex: 'createdAt', width: 180 },
    { title: '操作員', dataIndex: 'operator', width: 220 },
    {
      title: '動作',
      dataIndex: 'action',
      width: 100,
      render: (value: KycPhotoAction) => (
        <Tag color={value === '刪除' ? 'red' : value === '編輯' ? 'gold' : 'green'}>{value}</Tag>
      ),
    },
    {
      title: '分類',
      dataIndex: 'category',
      width: 140,
      render: (value: KycPhotoCategory) => <Tag color={kycPhotoTagColor[value]}>{value}</Tag>,
    },
    { title: '檔名', dataIndex: 'fileName', width: 220 },
    { title: '備註', dataIndex: 'note' },
  ];

  const restrictionHistoryColumns: ColumnsType<MemberCapabilityLog> = [
    { title: '時間', dataIndex: 'createdAt', width: 170 },
    { title: '操作員', dataIndex: 'operator', width: 200 },
    {
      title: '能力',
      dataIndex: 'capabilityKey',
      width: 120,
      render: (value: string) => {
        const dict = getCapabilityDictItem(value);
        return dict ? <Tag color={dict.color}>{dict.nameZh}</Tag> : <Tag>{value}</Tag>;
      },
    },
    {
      title: '動作',
      dataIndex: 'action',
      width: 90,
      render: (value: CapabilityAction) => <Tag color={restrictionActionColor[value]}>{restrictionActionLabel[value]}</Tag>,
    },
    {
      title: '來源',
      dataIndex: 'source',
      width: 110,
      render: (value: CapabilitySource) => <Tag color={capabilitySourceColor[value]}>{capabilitySourceLabel[value]}</Tag>,
    },
    {
      title: '限制至',
      dataIndex: 'restrictedUntil',
      width: 170,
      render: (value: string | null) => value ?? <Text type="secondary">-</Text>,
    },
    { title: '限制原因 / 備註', dataIndex: 'reason' },
  ];

  const renderKycPhotoSlot = (category: KycPhotoCategory) => {
    const record = getPhotoByCategory(category);
    const isPdf = record?.mimeType === 'application/pdf';

    return (
      <div
        key={category}
        style={{
          width: '100%',
          minHeight: 200,
          border: record ? '1px solid #f0f0f0' : '1px dashed #d9d9d9',
          borderRadius: 8,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: record ? '#fff' : '#fafafa',
        }}
      >
        {record ? (
          <>
            <div
              style={{
                height: 92,
                borderRadius: 8,
                background: isPdf ? '#fff7e6' : '#f0f5ff',
                border: `1px solid ${isPdf ? '#ffd591' : '#adc6ff'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                fontWeight: 600,
                color: isPdf ? '#d46b08' : '#1d39c4',
              }}
            >
              {isPdf ? <Space direction="vertical" size={4}><FilePdfOutlined style={{ fontSize: 24 }} /><span>PDF 預覽</span></Space> : <span>{category}</span>}
            </div>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <Tag color={kycPhotoTagColor[record.category]} style={{ width: 'fit-content', marginInlineEnd: 0 }}>{record.category}</Tag>
              <Text strong ellipsis={{ tooltip: record.fileName }}>{record.fileName}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>上傳人：{record.uploader}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>時間：{record.uploadedAt}</Text>
              <Space size={4} wrap>
                <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setPhotoPreviewModal({ open: true, record })}>
                  預覽
                </Button>
                <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openPhotoModal(category, record)}>
                  編輯
                </Button>
                <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => setPhotoDeleteModal({ open: true, record })} />
              </Space>
            </Space>
          </>
        ) : (
          <Button
            type="text"
            style={{ height: '100%', minHeight: 174 }}
            onClick={() => openPhotoModal(category, null)}
          >
            <Space direction="vertical" size={8}>
              <UploadOutlined style={{ fontSize: 24, color: '#1677ff' }} />
              <Text>+ 點擊上傳</Text>
              <Tag color="default" style={{ marginInlineEnd: 0 }}>{category}</Tag>
            </Space>
          </Button>
        )}
      </div>
    );
  };

  const renderKycTab = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card size="small" title="KYC 主檔資訊">
        <Descriptions
          size="small"
          column={{ xxl: 4, xl: 4, lg: 2, md: 2, sm: 1, xs: 1 }}
          colon
        >
          <Descriptions.Item label="KYC 狀態">
            <Tag color={kycSummary?.status === '已通過' ? 'green' : kycSummary?.status === '已拒絕' ? 'red' : kycSummary?.status === '審核中' ? 'gold' : 'default'}>
              {kycSummary?.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="提交時間">{kycSummary?.submittedAt}</Descriptions.Item>
          <Descriptions.Item label="姓名 / 生日">{kycSummary?.name} / {kycSummary?.birthDate}</Descriptions.Item>
          <Descriptions.Item label="性別 / 國籍">{kycSummary?.gender} / {kycSummary?.nationality}</Descriptions.Item>
          <Descriptions.Item label="審核人">{kycSummary?.reviewer}</Descriptions.Item>
          <Descriptions.Item label="審核時間">{kycSummary?.reviewedAt}</Descriptions.Item>
          <Descriptions.Item label="Overall 驗證">{kycSummary?.overallResult}</Descriptions.Item>
          <Descriptions.Item label="Face 驗證">{kycSummary?.faceResult}</Descriptions.Item>
          <Descriptions.Item label="OCR 驗證">{kycSummary?.ocrResult}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small" title="KYC 紀錄照片">
        <Row gutter={[16, 16]}>
          {kycPhotoCategories.map((category) => (
            <Col xs={24} sm={12} lg={8} xl={8} xxl={8} key={category}>
              {renderKycPhotoSlot(category)}
            </Col>
          ))}
        </Row>
      </Card>

      <Card size="small" title="上傳歷史">
        <Table
          rowKey="id"
          columns={kycHistoryColumns}
          dataSource={sortedKycUploadHistory}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 8, showTotal: total => `共 ${total} 筆` }}
          size="small"
        />
      </Card>
    </Space>
  );

  const renderRestrictionsTab = () => {
    const enabledDict = capabilityDict.filter(c => c.enabled).slice().sort((a, b) => a.sortOrder - b.sortOrder);
    const stateMap = new Map(restrictionStates.map(s => [s.capabilityKey, s] as const));
    const nowTs = dayjs();
    const isActiveRestriction = (s: MemberCapabilityState) =>
      s.restricted && (!s.restrictedUntil || dayjs(s.restrictedUntil).isAfter(nowTs));

    const restrictedDict = enabledDict.filter((c) => {
      const s = stateMap.get(c.key);
      return s ? isActiveRestriction(s) : false;
    });
    const otherDict = enabledDict.filter(c => !restrictedDict.includes(c));
    const totalCount = enabledDict.length;
    const restrictedCount = restrictedDict.length;
    const noKeyTaken = (key: string) => !stateMap.get(key) || !isActiveRestriction(stateMap.get(key)!);

    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card size="small">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Space>
              <Text strong>目前限制</Text>
              <Tag color={restrictedCount > 0 ? 'red' : 'green'}>{restrictedCount} / {totalCount}</Tag>
            </Space>
            <Button
              data-e2e-id="member-detail-restriction-add-btn"
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateRestrictionModal}
              disabled={restrictedDict.length === enabledDict.length}
            >
              新增限制
            </Button>
          </div>
          {restrictedCount === 0 ? (
            <Empty description="目前所有功能正常" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Row gutter={[16, 16]}>
              {restrictedDict.map((cap) => {
                const state = stateMap.get(cap.key)!;
                return (
                  <Col xs={24} md={12} xl={8} key={cap.key}>
                    <Card
                      size="small"
                      style={{ borderColor: '#ffa39e' }}
                      title={
                        <Space>
                          <Tag color={cap.color} style={{ marginRight: 0 }}>{cap.nameZh}</Tag>
                          <Tag color={capabilitySourceColor[state.source]}>{capabilitySourceLabel[state.source]}</Tag>
                        </Space>
                      }
                      extra={<Tag color="red">已限制</Tag>}
                    >
                      <Space direction="vertical" size={6} style={{ width: '100%' }}>
                        <div>
                          <Text type="secondary">限制原因：</Text>
                          <Text>{state.reason}</Text>
                        </div>
                        <div>
                          <Text type="secondary">限制時間：</Text>
                          <Text>{state.restrictedAt}</Text>
                        </div>
                        <div>
                          <Text type="secondary">限制至：</Text>
                          <Text>{state.restrictedUntil ?? '永久'}</Text>
                        </div>
                        <div>
                          <Text type="secondary">操作員：</Text>
                          <Text>{state.operator}</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                          <Button
                            data-e2e-id={`member-detail-restriction-edit-btn-${cap.key}`}
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openEditRestrictionModal(state)}
                          >
                            編輯
                          </Button>
                          <Button
                            data-e2e-id={`member-detail-restriction-release-btn-${cap.key}`}
                            size="small"
                            danger
                            onClick={() => openReleaseRestrictionModal(cap.key)}
                          >
                            解除限制
                          </Button>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </Card>

        <Card
          size="small"
          title={
            <Space>
              <Text>顯示其他能力</Text>
              <Tag>{otherDict.length}</Tag>
            </Space>
          }
          extra={
            <Button
              data-e2e-id="member-detail-restriction-toggle-others-btn"
              type="link"
              size="small"
              onClick={() => setShowAllCapabilities(v => !v)}
            >
              {showAllCapabilities ? '收起' : '展開'}
            </Button>
          }
        >
          {showAllCapabilities ? (
            otherDict.length === 0 ? (
              <Empty description="所有能力皆已限制" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Row gutter={[12, 12]}>
                {otherDict.map((cap) => (
                  <Col xs={24} md={12} xl={8} key={cap.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: '#fafafa', borderRadius: 4 }}>
                      <Space>
                        <Tag color={cap.color} style={{ marginRight: 0 }}>{cap.nameZh}</Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>{cap.description}</Text>
                      </Space>
                      <Button
                        data-e2e-id={`member-detail-restriction-set-btn-${cap.key}`}
                        type="link"
                        size="small"
                        disabled={!noKeyTaken(cap.key)}
                        onClick={() => {
                          restrictionForm.resetFields();
                          restrictionForm.setFieldsValue({ capabilityKey: cap.key, durationType: 'permanent' });
                          setRestrictionModal({ open: true, mode: 'create', capabilityKey: cap.key });
                        }}
                      >
                        設為限制
                      </Button>
                    </div>
                  </Col>
                ))}
              </Row>
            )
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              點擊右側「展開」可檢視全部 {totalCount} 種能力的當前狀態。
            </Text>
          )}
        </Card>

        <Card size="small" title="操作歷史">
          <Table
            rowKey="id"
            columns={restrictionHistoryColumns}
            dataSource={sortedRestrictionHistory}
            scroll={{ x: 1100 }}
            pagination={{ pageSize: 12, showTotal: total => `共 ${total} 筆` }}
            size="small"
          />
        </Card>

        <Card size="small" title="玩家端體驗預覽">
          {restrictedDict.length === 0 ? (
            <Empty description="無限制 → 玩家端不會出現拒絕提示" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Row gutter={[12, 12]}>
              {restrictedDict.map((cap) => (
                <Col xs={24} md={12} xl={8} key={cap.key}>
                  <Card size="small" style={{ background: '#fafafa' }}>
                    <Tag color={cap.color}>{cap.nameZh}</Tag>
                    <Text style={{ marginLeft: 4 }}>{capabilityDeniedMessage(cap)}</Text>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card>
      </Space>
    );
  };

  // ============== Tabs 配置 ==============
  const tabItems = [
    { key: 'detail', label: '詳情', children: renderDetailTab() },
    { key: 'kyc', label: 'KYC 紀錄', children: renderKycTab() },
    { key: 'restrictions', label: '功能限制', children: renderRestrictionsTab() },
    { key: 'wallet', label: '錢包賬變', children: <Empty description="（demo 略）" /> },
    { key: 'orders', label: '注單明細', children: <Empty description="（demo 略）" /> },
    { key: 'deposit', label: '存款日誌', children: <Empty description="（demo 略）" /> },
    { key: 'withdraw', label: '提現日誌', children: <Empty description="（demo 略）" /> },
    { key: 'bonus', label: '禮金日誌', children: <Empty description="（demo 略）" /> },
    { key: 'turnover', label: '流水明細', children: <Empty description="（demo 略）" /> },
    {
      key: 'daily-stats',
      label: '日統計',
      children: (
        <Tabs
          items={[
            { key: 'personal', label: '個人', children: <PersonalDailyStatsTab /> },
            { key: 'invite', label: '邀請', children: <InviteDailyStatsTab /> },
          ]}
        />
      ),
    },
    { key: 'game-stats', label: '遊戲統計', children: <GameDailyStatsTab /> },
    { key: 'vip-history', label: 'VIP 等級紀錄', children: renderVipHistoryTab() },
    { key: 'xp-log', label: 'XP 成長日誌', children: <Empty description="（demo 略）" /> },
    { key: 'risk', label: '風控日誌', children: <Empty description="（demo 略）" /> },
    { key: 'login', label: '登錄日誌', children: <Empty description="（demo 略）" /> },
  ];

  return (
    <div>
      {/* 標題列 */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          <Button data-e2e-id="member-detail-header-back-btn" icon={<ArrowLeftOutlined />} onClick={() => router.push('/admin/members')}>返回會員列表</Button>
          <Title level={4} style={{ margin: 0 }}>會員詳情</Title>
          <Text type="secondary">{member.account}（uid: {member.uid}）</Text>
          <Tag data-e2e-id="member-detail-header-vip-tag" color="blue">V{member.vipLevel}</Tag>
          <Tag data-e2e-id="member-detail-header-tier-tag" color="purple">{getTierRangeName(member.vipLevel)}</Tag>
          <Tag data-e2e-id="member-detail-header-status-tag" color={memberStatusColor[member.memberStatus]}>{member.memberStatus}</Tag>
        </Space>
        <Space>
          <Button data-e2e-id="member-detail-header-unblock-btn" disabled>解封</Button>
          <Button data-e2e-id="member-detail-header-risk-btn" danger>風控</Button>
          <Button data-e2e-id="member-detail-header-reset-password-btn">重置密碼</Button>
          <Button data-e2e-id="member-detail-header-convert-agent-btn">轉為代理</Button>
        </Space>
      </div>

      <Tabs
        data-e2e-id="member-detail-tab"
        items={tabItems.map((item) => ({
          ...item,
          label: <span data-e2e-id={`member-detail-tab-${item.key}`}>{item.label}</span>,
        }))}
        defaultActiveKey="detail"
      />

      <Modal
        title={photoModal.mode === 'edit' ? '編輯 KYC 照片' : '上傳 KYC 照片'}
        open={photoModal.open}
        onCancel={resetPhotoModal}
        onOk={handlePhotoSubmit}
        okText="確認"
        cancelText="取消"
      >
        <Form form={kycPhotoForm} layout="vertical">
          <Form.Item label="上傳檔">
            <Dragger
              accept={acceptedMimeTypes}
              beforeUpload={handlePhotoUploadBeforeUpload}
              fileList={uploadFileList}
              maxCount={1}
              onRemove={() => {
                setUploadFileList([]);
                return true;
              }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">拖曳檔案到此，或點擊上傳</p>
              <p className="ant-upload-hint">支援 jpg/jpeg/png/pdf，且單檔不得超過 10MB</p>
            </Dragger>
          </Form.Item>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="分類"
                name="category"
                rules={[{ required: true, message: '請選擇分類' }]}
              >
                <Select
                  options={kycPhotoCategories.map((category) => ({ label: category, value: category }))}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="備註"
                name="note"
                rules={[
                  { required: true, message: '請輸入備註' },
                  { min: 1, max: 200, message: '備註長度需為 1-200 字' },
                ]}
              >
                <TextArea rows={4} maxLength={200} showCount />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="確認刪除 KYC 照片"
        open={photoDeleteModal.open}
        onCancel={closeDeletePhotoModal}
        onOk={handleDeletePhoto}
        okText="確認刪除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Soft delete，90 天內可復原"
        />
        <Form form={kycDeleteForm} layout="vertical">
          <Form.Item
            label="刪除原因"
            name="deleteReason"
            rules={[
              { required: true, message: '請輸入刪除原因' },
              { min: 1, max: 200, message: '刪除原因長度需為 1-200 字' },
            ]}
          >
            <TextArea rows={4} maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="KYC 照片預覽"
        open={photoPreviewModal.open}
        onCancel={() => setPhotoPreviewModal({ open: false, record: null })}
        footer={null}
      >
        {photoPreviewModal.record && (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div
              style={{
                height: 220,
                borderRadius: 8,
                border: '1px solid #d9d9d9',
                background: photoPreviewModal.record.mimeType === 'application/pdf' ? '#fff7e6' : '#f0f5ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                color: photoPreviewModal.record.mimeType === 'application/pdf' ? '#d46b08' : '#1d39c4',
              }}
            >
              {photoPreviewModal.record.mimeType === 'application/pdf' ? 'PDF 文件預覽' : photoPreviewModal.record.category}
            </div>
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="檔名">{photoPreviewModal.record.fileName}</Descriptions.Item>
              <Descriptions.Item label="分類">{photoPreviewModal.record.category}</Descriptions.Item>
              <Descriptions.Item label="上傳人">{photoPreviewModal.record.uploader}</Descriptions.Item>
              <Descriptions.Item label="上傳時間">{photoPreviewModal.record.uploadedAt}</Descriptions.Item>
              <Descriptions.Item label="備註">{photoPreviewModal.record.note}</Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Modal>

      <Modal
        title={(() => {
          const dict = restrictionModal.capabilityKey ? getCapabilityDictItem(restrictionModal.capabilityKey) : null;
          if (restrictionModal.mode === 'release') return `解除 ${dict?.nameZh ?? '能力'} 限制`;
          if (restrictionModal.mode === 'edit') return `編輯 ${dict?.nameZh ?? '能力'} 限制設定`;
          return '新增功能限制';
        })()}
        open={restrictionModal.open}
        onCancel={closeRestrictionModal}
        onOk={handleRestrictionSubmit}
        okText="確認"
        cancelText="取消"
      >
        <Form
          form={restrictionForm}
          layout="vertical"
          initialValues={{ durationType: 'permanent' }}
        >
          {restrictionModal.mode === 'create' ? (
            <Form.Item
              label="能力"
              name="capabilityKey"
              rules={[{ required: true, message: '請選擇要限制的能力' }]}
            >
              <Select
                data-e2e-id="member-detail-restriction-modal-capability-select"
                placeholder="選擇能力"
                options={capabilityDict
                  .filter(c => c.enabled)
                  .filter((c) => {
                    const s = restrictionStates.find(rs => rs.capabilityKey === c.key);
                    if (!s) return true;
                    if (!s.restricted) return true;
                    if (s.restrictedUntil && dayjs(s.restrictedUntil).isBefore(dayjs())) return true;
                    return false;
                  })
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map(c => ({
                    value: c.key,
                    label: <Space><Tag color={c.color} style={{ marginRight: 0 }}>{c.nameZh}</Tag><Text type="secondary" style={{ fontSize: 12 }}>{c.category} · {c.description}</Text></Space>,
                  }))}
              />
            </Form.Item>
          ) : (
            <Form.Item label="能力">
              {(() => {
                const dict = restrictionModal.capabilityKey ? getCapabilityDictItem(restrictionModal.capabilityKey) : null;
                return dict ? <Tag color={dict.color}>{dict.nameZh}</Tag> : null;
              })()}
            </Form.Item>
          )}

          <Form.Item
            label={restrictionModal.mode === 'release' ? '解除原因' : '限制原因'}
            name="reason"
            rules={[
              { required: true, message: '請輸入原因' },
              { min: 1, max: 500, message: '原因長度需為 1-500 字' },
            ]}
          >
            <TextArea
              data-e2e-id="member-detail-restriction-modal-reason-input"
              rows={4}
              maxLength={500}
              showCount
            />
          </Form.Item>

          {restrictionModal.mode !== 'release' && (
            <>
              <Form.Item
                label="限制時間"
                name="durationType"
                rules={[{ required: true }]}
              >
                <Segmented
                  data-e2e-id="member-detail-restriction-modal-duration-segmented"
                  options={[
                    { label: '永久', value: 'permanent' },
                    { label: '至指定時間', value: 'until' },
                  ]}
                />
              </Form.Item>
              <Form.Item
                noStyle
                shouldUpdate={(prev, cur) => prev.durationType !== cur.durationType}
              >
                {() => restrictionForm.getFieldValue('durationType') === 'until' ? (
                  <Form.Item
                    label="限制至"
                    name="restrictedUntil"
                    rules={[{ required: true, message: '請選擇限制截止時間' }]}
                  >
                    <DatePicker
                      data-e2e-id="member-detail-restriction-modal-until-picker"
                      showTime
                      format="YYYY-MM-DD HH:mm:ss"
                      style={{ width: '100%' }}
                      disabledDate={(d) => d.isBefore(dayjs().startOf('day'))}
                    />
                  </Form.Item>
                ) : null}
              </Form.Item>
            </>
          )}

          <Form.Item
            label="Google 驗證碼"
            name="googleCode"
            rules={[{ required: true, message: '請輸入 Google 驗證碼' }]}
          >
            <Input
              data-e2e-id="member-detail-restriction-modal-google-input"
              placeholder="輸入 6 位驗證碼"
              maxLength={6}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* VIP 等級手動調整 Modal */}
      <Modal
        title={
          <Space>
            <CrownOutlined style={{ color: '#faad14' }} />
            <span>VIP 等級手動調整</span>
            {vipModal.step === 'result' && <Tag color="green">已完成</Tag>}
          </Space>
        }
        open={vipModal.open}
        onCancel={closeVipAdjust}
        width={640}
        maskClosable={false}
        footer={
          vipModal.step === 'form' ? (
            <Space>
              <Button data-e2e-id="member-detail-modal-cancel-btn" onClick={closeVipAdjust}>取消</Button>
              <Button data-e2e-id="member-detail-modal-submit-btn" type="primary" danger onClick={onVipSubmit}>確認執行</Button>
            </Space>
          ) : (
            <Button data-e2e-id="member-detail-modal-done-btn" type="primary" onClick={closeVipAdjust}>完成</Button>
          )
        }
      >
        <div data-e2e-id="member-detail-modal">
        {/* Step 1: 表單 */}
        {vipModal.step === 'form' && (
          <>
            <Card size="small" style={{ marginBottom: 16, background: 'rgba(22, 104, 220, 0.06)' }}>
              <Descriptions size="small" column={2} colon={false}>
                <Descriptions.Item label={<Text type="secondary">當前等級</Text>}>
                  <Tag data-e2e-id="member-detail-modal-current-vip-tag" color="blue">V{member.vipLevel}</Tag>
                  <Tag data-e2e-id="member-detail-modal-current-tier-tag" color="purple">{getTierRangeName(member.vipLevel)}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label={<Text type="secondary">總 XP</Text>}>{member.xpPoints.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label={<Text type="secondary">等級內 XP</Text>}>{member.currentLevelXp.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label={<Text type="secondary">保級到期</Text>}>{dayjs(member.keepExpire, 'YYYYMMDD').format('YYYY-MM-DD')}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Form form={vipForm} layout="vertical" initialValues={{ target_level: undefined, reason: '' }}>
              <Form.Item
                name="target_level"
                label="目標等級"
                rules={[{ required: true, message: '請選擇目標等級' }]}
                extra="V0 ~ V30，不能與當前等級相同"
              >
                <Select data-e2e-id="member-detail-modal-target-level-select" placeholder="選擇目標 VIP 等級" showSearch>
                  {Array.from({ length: 31 }, (_, i) => (
                    <Select.Option key={i} value={i} disabled={i === member.vipLevel}>
                      V{i}（{getTierRangeName(i)}）
                      {i === member.vipLevel && <Tag color="default" style={{ marginLeft: 8 }}>當前</Tag>}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="reason"
                label="操作原因"
                rules={[
                  { required: true, message: '請填寫操作原因' },
                  { max: 200, message: '最多 200 字' },
                ]}
                extra="必填，最多 200 字"
              >
                <Input.TextArea
                  data-e2e-id="member-detail-modal-reason-input"
                  rows={3}
                  placeholder="例如：客服申訴 — 投注流水正確但系統未升等"
                  showCount
                  maxLength={200}
                />
              </Form.Item>

              <Alert
                type="info"
                showIcon
                message="調整規則（自動套用，無需設定）"
                description={
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li>玩家總 XP 不變</li>
                    <li>等級內 XP 計數器歸 0（重新累積）</li>
                    <li>保級倒計時重置（從今天起 30 天）</li>
                    <li>升級時自動發放升級禮金</li>
                  </ul>
                }
              />
            </Form>
          </>
        )}

        {/* Step 3: 結果 */}
        {vipModal.step === 'result' && vipModal.auditId && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircleOutlined style={{ fontSize: 56, color: '#52c41a', marginBottom: 16 }} />
            <div style={{ fontSize: 18, marginBottom: 16 }}>
              <Text type="secondary">已生效</Text>
            </div>
            <Card size="small" style={{ textAlign: 'left', marginBottom: 16 }}>
              <Descriptions size="small" column={1} colon={false}>
                <Descriptions.Item label={<Text type="secondary">操作 ID</Text>}>
                  <Space>
                    <Text code style={{ fontSize: 13 }}>{vipModal.auditId}</Text>
                    <Button data-e2e-id="member-detail-modal-copy-audit-btn" type="text" size="small" icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(vipModal.auditId!); message.success('已複製'); }} />
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={<Text type="secondary">完成時間</Text>}>{dayjs().format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              </Descriptions>
            </Card>
            <Alert type="success" showIcon message="VIP 等級紀錄已更新，可切到「VIP 等級紀錄」Tab 查看" />
          </div>
        )}
        </div>
      </Modal>
    </div>
  );
}

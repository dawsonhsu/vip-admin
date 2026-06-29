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
  VipHistoryTyLabel,
  capabilityDict, capabilitySourceLabel,
  getCapabilityDictItem,
  getMemberCapabilityStates, setMemberCapabilityState,
  getMemberCapabilityLogs, appendMemberCapabilityLog,
  deriveAutoRestrictions,
  type CapabilityDictItem, type MemberCapabilityState, type MemberCapabilityLog,
  type CapabilitySource, type CapabilityAction, type AutoRestriction,
} from '@/data/mockData';
import { gameStats, inviteStats, personalStats, gameTypes, type GameStat, type GameType, type InviteStat, type PersonalStat } from '@/data/memberStatsData';
import { getTurnoverDetailsByUid, TURNOVER_SOURCES, type TurnoverDetailItem, type TurnoverSource, type VenueRestrictionItem } from '@/data/turnoverDetailData';
import RecalcButton from '@/components/RecalcButton';

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

interface TurnoverDetailFilter {
  sourceOrderIds?: string;
  dateRange?: [any, any] | null;
  sources: TurnoverSource[];
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
              （{Math.max(0, dayjs(member.keepExpire, 'YYYYMMDD').startOf('day').diff(dayjs().startOf('day'), 'day'))} 天）
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
      render: (val: number) => `V${val}`,
    },
    {
      title: '異動後等級',
      dataIndex: 'afterLevel',
      width: 110,
      render: (val: number) => `V${val}`,
    },
    {
      title: '類型',
      dataIndex: 'ty',
      width: 110,
      render: (val: VipLevelHistoryTy) => VipHistoryTyLabel[val],
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

    const queryStart = filters.dateRange[0].format('YYYY-MM-DD');
    const queryEnd = filters.dateRange[1].format('YYYY-MM-DD');

    const rows = useMemo(() => personalStats
      .filter(row => row.uid === uid && row.date >= queryStart && row.date <= queryEnd)
      .sort((a, b) => b.date.localeCompare(a.date)), [queryEnd, queryStart, uid]);

    const sumPersonalRows = (input: PersonalStat[]) => input.reduce((acc, row) => ({
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
    }), {
      depositCount: 0, totalDeposit: 0, withdrawCount: 0, totalWithdraw: 0,
      depositFee: 0, withdrawFee: 0, totalBet: 0, excludedBet: 0, validBet: 0,
      totalPayout: 0, ggr: 0, fsBet: 0, fsGgr: 0, jpBet: 0, jpGgr: 0,
      totalBonus: 0, totalCommission: 0,
    });

    const pageSums = useMemo(() => sumPersonalRows(rows.slice(0, 10)), [rows]);
    const allSums = useMemo(() => sumPersonalRows(rows), [rows]);
    const summaryData = [
      { key: 'page', label: '小計', ...pageSums },
      { key: 'all', label: '總計', ...allSums },
    ];

    // 達成邀請條件：此會員所有日資料的 achievedInvitation 一致；取第一筆即可
    const achievedInvitation = rows.length > 0 ? rows[0].achievedInvitation : false;
    const hasInviter = !!(rows.length > 0 && rows[0].inviterUid);

    const columns: ColumnsType<PersonalStat> = [
      { title: '統計日期', dataIndex: 'date', width: 120, sorter: (a, b) => a.date.localeCompare(b.date), defaultSortOrder: 'descend' },
      { title: '存款次數', dataIndex: 'depositCount', width: 100, align: 'right', sorter: (a, b) => a.depositCount - b.depositCount, render: (value: number) => formatInteger(value) },
      { title: '總存款', dataIndex: 'totalDeposit', width: 120, align: 'right', sorter: (a, b) => a.totalDeposit - b.totalDeposit, render: (value: number) => formatAmount(value) },
      { title: '提款次數', dataIndex: 'withdrawCount', width: 100, align: 'right', sorter: (a, b) => a.withdrawCount - b.withdrawCount, render: (value: number) => formatInteger(value) },
      { title: '總提款', dataIndex: 'totalWithdraw', width: 120, align: 'right', sorter: (a, b) => a.totalWithdraw - b.totalWithdraw, render: (value: number) => formatAmount(value) },
      { title: '存款手續費', dataIndex: 'depositFee', width: 120, align: 'right', sorter: (a, b) => a.depositFee - b.depositFee, render: (value: number) => formatAmount(value) },
      { title: '提款手續費', dataIndex: 'withdrawFee', width: 120, align: 'right', sorter: (a, b) => a.withdrawFee - b.withdrawFee, render: (value: number) => formatAmount(value) },
      { title: '總投注', dataIndex: 'totalBet', width: 120, align: 'right', sorter: (a, b) => a.totalBet - b.totalBet, render: (value: number) => formatAmount(value) },
      { title: '排除投注額', dataIndex: 'excludedBet', width: 120, align: 'right', sorter: (a, b) => a.excludedBet - b.excludedBet, render: (value: number) => formatAmount(value) },
      { title: '有效流水', dataIndex: 'validBet', width: 120, align: 'right', sorter: (a, b) => a.validBet - b.validBet, render: (value: number) => formatAmount(value) },
      { title: '總派獎', dataIndex: 'totalPayout', width: 120, align: 'right', sorter: (a, b) => a.totalPayout - b.totalPayout, render: (value: number) => formatAmount(value) },
      { title: 'GGR', dataIndex: 'ggr', width: 120, align: 'right', sorter: (a, b) => a.ggr - b.ggr, render: (value: number) => renderGgrText(value) },
      { title: 'FS 投注額', dataIndex: 'fsBet', width: 120, align: 'right', sorter: (a, b) => a.fsBet - b.fsBet, render: (value: number) => formatAmount(value) },
      { title: 'FS GGR', dataIndex: 'fsGgr', width: 120, align: 'right', sorter: (a, b) => a.fsGgr - b.fsGgr, render: (value: number) => renderGgrText(value) },
      { title: 'JP 投注額', dataIndex: 'jpBet', width: 120, align: 'right', sorter: (a, b) => a.jpBet - b.jpBet, render: (value: number) => formatAmount(value) },
      { title: 'JP GGR', dataIndex: 'jpGgr', width: 120, align: 'right', sorter: (a, b) => a.jpGgr - b.jpGgr, render: (value: number) => renderGgrText(value) },
      { title: '總彩金', dataIndex: 'totalBonus', width: 120, align: 'right', sorter: (a, b) => a.totalBonus - b.totalBonus, render: (value: number) => formatAmount(value) },
      { title: '總佣金', dataIndex: 'totalCommission', width: 120, align: 'right', sorter: (a, b) => a.totalCommission - b.totalCommission, render: (value: number) => formatAmount(value) },
      {
        title: '操作',
        key: 'recalc',
        width: 130,
        fixed: 'right',
        render: (_, record) => (
          <RecalcButton
            dataE2eId={`member-detail-personal-recalc-btn-${record.date}`}
            successText={`已重算 ${record.date} 個人統計`}
          />
        ),
      },
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
          title="統計"
          extra={hasInviter ? (
            <Tag
              data-e2e-id="member-detail-personal-summary-achieved-tag"
              color={achievedInvitation ? 'green' : 'default'}
            >
              好友邀請：{achievedInvitation ? '已達標' : '未達標'}
            </Tag>
          ) : undefined}
        >
          <Table
            dataSource={summaryData}
            rowKey="key"
            pagination={false}
            size="small"
            scroll={{ x: 'max-content' }}
            columns={[
              { title: '類型', dataIndex: 'label', width: 60 },
              { title: '存款次數', dataIndex: 'depositCount', width: 100, align: 'right' as const, render: (v: number) => formatInteger(v) },
              { title: '總存款', dataIndex: 'totalDeposit', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: '提款次數', dataIndex: 'withdrawCount', width: 100, align: 'right' as const, render: (v: number) => formatInteger(v) },
              { title: '總提款', dataIndex: 'totalWithdraw', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: '存款手續費', dataIndex: 'depositFee', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: '提款手續費', dataIndex: 'withdrawFee', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: '總投注', dataIndex: 'totalBet', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: '排除投注額', dataIndex: 'excludedBet', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: '有效流水', dataIndex: 'validBet', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: '總派獎', dataIndex: 'totalPayout', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: 'GGR', dataIndex: 'ggr', width: 120, align: 'right' as const, render: (v: number) => renderGgrText(v) },
              { title: 'FS 投注額', dataIndex: 'fsBet', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: 'FS GGR', dataIndex: 'fsGgr', width: 120, align: 'right' as const, render: (v: number) => renderGgrText(v) },
              { title: 'JP 投注額', dataIndex: 'jpBet', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: 'JP GGR', dataIndex: 'jpGgr', width: 120, align: 'right' as const, render: (v: number) => renderGgrText(v) },
              { title: '總彩金', dataIndex: 'totalBonus', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: '總佣金', dataIndex: 'totalCommission', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
            ]}
          />
        </MemberStatCard>

        <MemberStatCard
          extra={(
            <Button
              data-e2e-id="member-detail-personal-toolbar-export-btn"
              onClick={() => exportCsv(
                `member-${uid}-personal-daily-${queryStart}-${queryEnd}.csv`,
                ['統計日期', '會員 UID', '會員帳號', '達標', '存款次數', '總存款', '提款次數', '總提款', '存款手續費', '提款手續費', '總投注', '排除投注額', '有效流水', '總派獎', 'GGR', 'FS 投注額', 'FS GGR', 'JP 投注額', 'JP GGR', '總彩金', '總佣金'],
                rows.map(row => [
                  row.date,
                  row.uid,
                  row.username,
                  row.inviterUid ? (row.achievedInvitation ? '是' : '否') : '-',
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

    const queryStart = filters.dateRange[0].format('YYYY-MM-DD');
    const queryEnd = filters.dateRange[1].format('YYYY-MM-DD');

    const rows = useMemo(() => inviteStats
      .filter(row => row.uid === uid && row.date >= queryStart && row.date <= queryEnd)
      .sort((a, b) => b.date.localeCompare(a.date)), [queryEnd, queryStart, uid]);

    const sumInviteRows = (input: InviteStat[]) => input.reduce((acc, row) => ({
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
    }), {
      inviteCount: 0, achieveCount: 0, betUserCount: 0, depositUserCount: 0,
      totalDeposit: 0, totalWithdraw: 0, depositFee: 0, withdrawFee: 0,
      totalBet: 0, excludedBet: 0, validBet: 0, totalPayout: 0, ggr: 0,
      fsBet: 0, fsGgr: 0, jpBet: 0, jpGgr: 0, totalBonus: 0, totalCommission: 0,
    });

    const pageSums = useMemo(() => sumInviteRows(rows.slice(0, 10)), [rows]);
    const allSums = useMemo(() => sumInviteRows(rows), [rows]);
    const summaryData = [
      { key: 'page', label: '小計', ...pageSums },
      { key: 'all', label: '總計', ...allSums },
    ];

    const columns: ColumnsType<InviteStat> = [
      { title: '統計日期', dataIndex: 'date', width: 120, sorter: (a, b) => a.date.localeCompare(b.date), defaultSortOrder: 'descend' },
      { title: '邀請人數', dataIndex: 'inviteCount', width: 100, align: 'right', sorter: (a, b) => a.inviteCount - b.inviteCount, render: (value: number) => formatInteger(value) },
      { title: '達成人數', dataIndex: 'achieveCount', width: 100, align: 'right', sorter: (a, b) => a.achieveCount - b.achieveCount, render: (value: number) => formatInteger(value) },
      { title: '投注人數', dataIndex: 'betUserCount', width: 100, align: 'right', sorter: (a, b) => a.betUserCount - b.betUserCount, render: (value: number) => formatInteger(value) },
      { title: '存款人數', dataIndex: 'depositUserCount', width: 100, align: 'right', sorter: (a, b) => a.depositUserCount - b.depositUserCount, render: (value: number) => formatInteger(value) },
      { title: '總存款', dataIndex: 'totalDeposit', width: 120, align: 'right', sorter: (a, b) => a.totalDeposit - b.totalDeposit, render: (value: number) => formatAmount(value) },
      { title: '總提款', dataIndex: 'totalWithdraw', width: 120, align: 'right', sorter: (a, b) => a.totalWithdraw - b.totalWithdraw, render: (value: number) => formatAmount(value) },
      { title: '存款手續費', dataIndex: 'depositFee', width: 120, align: 'right', sorter: (a, b) => a.depositFee - b.depositFee, render: (value: number) => formatAmount(value) },
      { title: '提款手續費', dataIndex: 'withdrawFee', width: 120, align: 'right', sorter: (a, b) => a.withdrawFee - b.withdrawFee, render: (value: number) => formatAmount(value) },
      { title: '總投注', dataIndex: 'totalBet', width: 120, align: 'right', sorter: (a, b) => a.totalBet - b.totalBet, render: (value: number) => formatAmount(value) },
      { title: '排除投注額', dataIndex: 'excludedBet', width: 120, align: 'right', sorter: (a, b) => a.excludedBet - b.excludedBet, render: (value: number) => formatAmount(value) },
      { title: '有效流水', dataIndex: 'validBet', width: 120, align: 'right', sorter: (a, b) => a.validBet - b.validBet, render: (value: number) => formatAmount(value) },
      { title: '總派獎', dataIndex: 'totalPayout', width: 120, align: 'right', sorter: (a, b) => a.totalPayout - b.totalPayout, render: (value: number) => formatAmount(value) },
      { title: 'GGR', dataIndex: 'ggr', width: 120, align: 'right', sorter: (a, b) => a.ggr - b.ggr, render: (value: number) => renderGgrText(value) },
      { title: 'FS 投注額', dataIndex: 'fsBet', width: 120, align: 'right', sorter: (a, b) => a.fsBet - b.fsBet, render: (value: number) => formatAmount(value) },
      { title: 'FS GGR', dataIndex: 'fsGgr', width: 120, align: 'right', sorter: (a, b) => a.fsGgr - b.fsGgr, render: (value: number) => renderGgrText(value) },
      { title: 'JP 投注額', dataIndex: 'jpBet', width: 120, align: 'right', sorter: (a, b) => a.jpBet - b.jpBet, render: (value: number) => formatAmount(value) },
      { title: 'JP GGR', dataIndex: 'jpGgr', width: 120, align: 'right', sorter: (a, b) => a.jpGgr - b.jpGgr, render: (value: number) => renderGgrText(value) },
      { title: '總彩金', dataIndex: 'totalBonus', width: 120, align: 'right', sorter: (a, b) => a.totalBonus - b.totalBonus, render: (value: number) => formatAmount(value) },
      { title: '總佣金', dataIndex: 'totalCommission', width: 120, align: 'right', sorter: (a, b) => a.totalCommission - b.totalCommission, render: (value: number) => formatAmount(value) },
      {
        title: '操作',
        key: 'recalc',
        width: 130,
        fixed: 'right',
        render: (_, record) => (
          <RecalcButton
            dataE2eId={`member-detail-invite-recalc-btn-${record.date}`}
            successText={`已重算 ${record.date} 邀請統計`}
          />
        ),
      },
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

        <MemberStatCard title="統計">
          <Table
            dataSource={summaryData}
            rowKey="key"
            pagination={false}
            size="small"
            scroll={{ x: 'max-content' }}
            columns={[
              { title: '類型', dataIndex: 'label', width: 60 },
              { title: '邀請人數', dataIndex: 'inviteCount', width: 100, align: 'right' as const, render: (v: number) => formatInteger(v) },
              { title: '達成人數', dataIndex: 'achieveCount', width: 100, align: 'right' as const, render: (v: number) => formatInteger(v) },
              { title: '投注人數', dataIndex: 'betUserCount', width: 100, align: 'right' as const, render: (v: number) => formatInteger(v) },
              { title: '存款人數', dataIndex: 'depositUserCount', width: 100, align: 'right' as const, render: (v: number) => formatInteger(v) },
              { title: '總存款', dataIndex: 'totalDeposit', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: '總提款', dataIndex: 'totalWithdraw', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: '存款手續費', dataIndex: 'depositFee', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: '提款手續費', dataIndex: 'withdrawFee', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: '總投注', dataIndex: 'totalBet', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: '排除投注額', dataIndex: 'excludedBet', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: '有效流水', dataIndex: 'validBet', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: '總派獎', dataIndex: 'totalPayout', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: 'GGR', dataIndex: 'ggr', width: 120, align: 'right' as const, render: (v: number) => renderGgrText(v) },
              { title: 'FS 投注額', dataIndex: 'fsBet', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: 'FS GGR', dataIndex: 'fsGgr', width: 120, align: 'right' as const, render: (v: number) => renderGgrText(v) },
              { title: 'JP 投注額', dataIndex: 'jpBet', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: 'JP GGR', dataIndex: 'jpGgr', width: 120, align: 'right' as const, render: (v: number) => renderGgrText(v) },
              { title: '總彩金', dataIndex: 'totalBonus', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: '總佣金', dataIndex: 'totalCommission', width: 120, align: 'right' as const, render: (v: number) => formatAmount(v) },
            ]}
          />
        </MemberStatCard>

        <MemberStatCard
          extra={(
            <Button
              data-e2e-id="member-detail-invite-toolbar-export-btn"
              onClick={() => exportCsv(
                `member-${uid}-invite-daily-${queryStart}-${queryEnd}.csv`,
                ['統計日期', '會員 UID', '會員帳號', '邀請人數', '達成人數', '投注人數', '存款人數', '總存款', '總提款', '存款手續費', '提款手續費', '總投注', '排除投注額', '有效流水', '總派獎', 'GGR', 'FS 投注額', 'FS GGR', 'JP 投注額', 'JP GGR', '總彩金', '總佣金'],
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

    const sumGameRows = (input: GameStat[]) => input.reduce((acc, row) => ({
      totalBet: acc.totalBet + row.totalBet,
      excludedBet: acc.excludedBet + row.excludedBet,
      validBet: acc.validBet + row.validBet,
      totalPayout: acc.totalPayout + row.totalPayout,
      ggr: acc.ggr + row.ggr,
      fsBet: acc.fsBet + row.fsBet,
      fsGgr: acc.fsGgr + row.fsGgr,
      jpBet: acc.jpBet + row.jpBet,
      jpGgr: acc.jpGgr + row.jpGgr,
    }), {
      totalBet: 0, excludedBet: 0, validBet: 0, totalPayout: 0, ggr: 0,
      fsBet: 0, fsGgr: 0, jpBet: 0, jpGgr: 0,
    });

    const pageSums = useMemo(() => sumGameRows(rows.slice(0, 10)), [rows]);
    const allSums = useMemo(() => sumGameRows(rows), [rows]);
    const summaryData = [
      { key: 'page', label: '小計', ...pageSums },
      { key: 'all', label: '總計', ...allSums },
    ];

    type GameStatRow = {
      key: string;
      displayLabel: string;
      isAggregate: boolean;
      dateSort: string;
      totalBet: number;
      excludedBet: number;
      validBet: number;
      totalPayout: number;
      ggr: number;
      fsBet: number;
      fsGgr: number;
      jpBet: number;
      jpGgr: number;
      date: string;
      gameType?: string;
      children?: GameStatRow[];
    };

    const tableData = useMemo<GameStatRow[]>(() => {
      if (filters.gameType !== 'ALL') {
        return rows.map(r => ({
          key: `${r.date}-${r.gameType}`,
          displayLabel: r.date,
          isAggregate: false,
          dateSort: r.date,
          totalBet: r.totalBet,
          excludedBet: r.excludedBet,
          validBet: r.validBet,
          totalPayout: r.totalPayout,
          ggr: r.ggr,
          fsBet: r.fsBet,
          fsGgr: r.fsGgr,
          jpBet: r.jpBet,
          jpGgr: r.jpGgr,
          date: r.date,
          gameType: r.gameType,
        }));
      }
      const grouped = new Map<string, GameStat[]>();
      for (const r of rows) {
        if (!grouped.has(r.date)) grouped.set(r.date, []);
        grouped.get(r.date)!.push(r);
      }
      return Array.from(grouped.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, group]) => {
          const totals = sumGameRows(group);
          return {
            key: date,
            displayLabel: date,
            isAggregate: true,
            dateSort: date,
            ...totals,
            date,
            children: group
              .slice()
              .sort((a, b) => a.gameType.localeCompare(b.gameType))
              .map(r => ({
                key: `${date}-${r.gameType}`,
                displayLabel: r.gameType,
                isAggregate: false,
                dateSort: date,
                totalBet: r.totalBet,
                excludedBet: r.excludedBet,
                validBet: r.validBet,
                totalPayout: r.totalPayout,
                ggr: r.ggr,
                fsBet: r.fsBet,
                fsGgr: r.fsGgr,
                jpBet: r.jpBet,
                jpGgr: r.jpGgr,
                date,
                gameType: r.gameType,
              })),
          };
        });
    }, [rows, filters.gameType]);

    const columns: ColumnsType<GameStatRow> = [
      {
        title: '統計日期',
        dataIndex: 'displayLabel',
        width: 180,
        sorter: (a, b) => a.dateSort.localeCompare(b.dateSort),
        defaultSortOrder: 'descend',
        render: (value: string, record) => record.isAggregate ? value : <strong>{value}</strong>,
      },
      { title: '總投注額', dataIndex: 'totalBet', width: 130, align: 'right', sorter: (a, b) => a.totalBet - b.totalBet, render: (value: number) => formatAmount(value) },
      { title: '排除投注額', dataIndex: 'excludedBet', width: 130, align: 'right', sorter: (a, b) => a.excludedBet - b.excludedBet, render: (value: number) => formatAmount(value) },
      { title: '有效投注額', dataIndex: 'validBet', width: 130, align: 'right', sorter: (a, b) => a.validBet - b.validBet, render: (value: number) => formatAmount(value) },
      { title: '總派獎', dataIndex: 'totalPayout', width: 130, align: 'right', sorter: (a, b) => a.totalPayout - b.totalPayout, render: (value: number) => formatAmount(value) },
      { title: 'GGR', dataIndex: 'ggr', width: 120, align: 'right', sorter: (a, b) => a.ggr - b.ggr, render: (value: number) => renderGgrText(value) },
      { title: 'FS 投注額', dataIndex: 'fsBet', width: 130, align: 'right', sorter: (a, b) => a.fsBet - b.fsBet, render: (value: number) => formatAmount(value) },
      { title: 'FS GGR', dataIndex: 'fsGgr', width: 130, align: 'right', sorter: (a, b) => a.fsGgr - b.fsGgr, render: (value: number) => renderGgrText(value) },
      { title: 'JP 投注額', dataIndex: 'jpBet', width: 130, align: 'right', sorter: (a, b) => a.jpBet - b.jpBet, render: (value: number) => formatAmount(value) },
      { title: 'JP GGR', dataIndex: 'jpGgr', width: 130, align: 'right', sorter: (a, b) => a.jpGgr - b.jpGgr, render: (value: number) => renderGgrText(value) },
      {
        title: '操作',
        key: 'recalc',
        width: 130,
        fixed: 'right',
        render: (_, record) => (
          <RecalcButton
            dataE2eId={`member-detail-game-recalc-btn-${record.key}`}
            successText={record.isAggregate ? `已重算 ${record.date} 遊戲統計` : `已重算 ${record.date} ${record.gameType} 遊戲統計`}
          />
        ),
      },
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

        <MemberStatCard title="統計">
          <Table
            dataSource={summaryData}
            rowKey="key"
            pagination={false}
            size="small"
            scroll={{ x: 'max-content' }}
            columns={[
              { title: '類型', dataIndex: 'label', width: 60 },
              { title: '總投注額', dataIndex: 'totalBet', width: 130, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: '排除投注額', dataIndex: 'excludedBet', width: 130, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: '有效投注額', dataIndex: 'validBet', width: 130, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: '總派獎', dataIndex: 'totalPayout', width: 130, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: 'GGR', dataIndex: 'ggr', width: 120, align: 'right' as const, render: (v: number) => renderGgrText(v) },
              { title: 'FS 投注額', dataIndex: 'fsBet', width: 130, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: 'FS GGR', dataIndex: 'fsGgr', width: 130, align: 'right' as const, render: (v: number) => renderGgrText(v) },
              { title: 'JP 投注額', dataIndex: 'jpBet', width: 130, align: 'right' as const, render: (v: number) => formatAmount(v) },
              { title: 'JP GGR', dataIndex: 'jpGgr', width: 130, align: 'right' as const, render: (v: number) => renderGgrText(v) },
            ]}
          />
        </MemberStatCard>

        <MemberStatCard
          extra={(
            <Button
              data-e2e-id="member-detail-game-toolbar-export-btn"
              onClick={() => exportCsv(
                `member-${uid}-game-daily-${queryStart}-${queryEnd}-${filters.gameType}.csv`,
                ['統計日期', '會員 UID', '會員帳號', '遊戲類型', '總投注額', '排除投注額', '有效投注額', '總派獎', 'GGR', 'FS 投注額', 'FS GGR', 'JP 投注額', 'JP GGR'],
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
            rowKey="key"
            columns={columns}
            dataSource={tableData}
            onRow={(record) => ({ 'data-e2e-id': `member-detail-game-table-row-${record.key}` } as React.HTMLAttributes<HTMLTableRowElement>)}
            scroll={{ x: 1500 }}
            pagination={{ pageSize: 10, showTotal: total => `共 ${total} 筆` }}
            size="small"
          />
        </MemberStatCard>
      </Space>
    );
  };

  const TurnoverDetailTab = () => {
    const defaultTurnoverRange = (): [any, any] => [dayjs().subtract(30, 'day'), dayjs()];
    const [form] = Form.useForm<TurnoverDetailFilter>();
    const [filters, setFilters] = useState<TurnoverDetailFilter>({
      sourceOrderIds: '',
      dateRange: defaultTurnoverRange(),
      sources: [...TURNOVER_SOURCES],
    });
    const [venueModalData, setVenueModalData] = useState<VenueRestrictionItem[] | null>(null);

    const allRows = useMemo(() => (
      uid ? getTurnoverDetailsByUid(uid) : []
    ), [uid]);

    const rows = useMemo(() => {
      const idSet = new Set((filters.sourceOrderIds || '')
        .split(/[\n,，]+/)
        .map(item => item.trim())
        .filter(Boolean));
      const selectedSources = filters.sources.length > 0 ? filters.sources : TURNOVER_SOURCES;

      return allRows
        .filter((row) => {
          if (idSet.size > 0 && !idSet.has(row.sourceOrderId)) return false;
          if (!selectedSources.includes(row.source)) return false;
          if (filters.dateRange?.[0] && filters.dateRange?.[1]) {
            const transactionAt = dayjs(row.transactionTime);
            if (transactionAt.isBefore(filters.dateRange[0].startOf('day'))) return false;
            if (transactionAt.isAfter(filters.dateRange[1].endOf('day'))) return false;
          }
          return true;
        })
        .sort((a, b) => b.transactionTime.localeCompare(a.transactionTime));
    }, [allRows, filters]);

    const renderVenueRestriction = (value: VenueRestrictionItem[], recordId: string) => (
      <Button
        data-e2e-id={`member-detail-turnover-venue-detail-btn-${recordId}`}
        type="link"
        size="small"
        style={{ padding: 0 }}
        onClick={() => setVenueModalData(value)}
      >
        詳情
      </Button>
    );

    const columns: ColumnsType<TurnoverDetailItem> = [
      {
        title: '來源訂單ID',
        dataIndex: 'sourceOrderId',
        width: 190,
        render: (value: string) => (
          <Space size={2}>
            <Text code style={{ fontSize: 11 }}>{value}</Text>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(value);
                message.success('已複製');
              }}
            />
          </Space>
        ),
      },
      {
        title: '帳變時間',
        dataIndex: 'transactionTime',
        width: 170,
        sorter: (a, b) => a.transactionTime.localeCompare(b.transactionTime),
        defaultSortOrder: 'descend',
      },
      {
        title: '流水來源',
        dataIndex: 'source',
        width: 120,
        render: (value: TurnoverSource) => value,
      },
      {
        title: '金額',
        dataIndex: 'amount',
        width: 120,
        align: 'right',
        render: (value: number) => formatAmount(value),
      },
      {
        title: '流水倍數',
        dataIndex: 'multiplier',
        width: 100,
        align: 'right',
        render: (value: number) => `×${value}`,
      },
      {
        title: '流水要求',
        dataIndex: 'requirement',
        width: 130,
        align: 'right',
        render: (value: number) => formatAmount(value),
      },
      {
        title: '是否完成',
        dataIndex: 'completed',
        width: 100,
        render: (value: boolean) => (value ? '是' : '否'),
      },
      {
        title: '剩餘流水要求',
        dataIndex: 'remaining',
        width: 130,
        align: 'right',
        render: (value: number) => formatAmount(value),
      },
      {
        title: '場館限制',
        dataIndex: 'venueRestriction',
        width: 220,
        render: (value: VenueRestrictionItem[], record) => renderVenueRestriction(value, record.id),
      },
      {
        title: '執行人',
        dataIndex: 'operator',
        width: 160,
      },
    ];

    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <MemberStatCard>
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              sourceOrderIds: '',
              dateRange: defaultTurnoverRange(),
              sources: TURNOVER_SOURCES,
            }}
          >
            <Row gutter={16}>
              <Col span={7}>
                <Form.Item label="來源訂單ID" name="sourceOrderIds">
                  <TextArea
                    data-e2e-id="member-detail-turnover-filter-source-order-id-input"
                    placeholder="支持批量查詢，多筆以換行或逗號分隔"
                    maxLength={5000}
                    showCount
                    autoSize={{ minRows: 1, maxRows: 2 }}
                  />
                </Form.Item>
              </Col>
              <Col span={7}>
                <Form.Item label="帳變時間" name="dateRange">
                  <RangePicker data-e2e-id="member-detail-turnover-filter-date-range" style={{ width: '100%' }} allowClear />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="流水來源" name="sources">
                  <Select
                    data-e2e-id="member-detail-turnover-filter-source-select"
                    mode="multiple"
                    allowClear
                    placeholder="默認全選"
                    style={{ width: 280 }}
                    options={TURNOVER_SOURCES.map(source => ({ label: source, value: source }))}
                  />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label=" ">
                  <Space>
                    <Button
                      data-e2e-id="member-detail-turnover-filter-query-btn"
                      type="primary"
                      onClick={() => setFilters({
                        sourceOrderIds: form.getFieldValue('sourceOrderIds') || '',
                        dateRange: form.getFieldValue('dateRange') || null,
                        sources: form.getFieldValue('sources') || [],
                      })}
                    >
                      查詢
                    </Button>
                    <Button
                      data-e2e-id="member-detail-turnover-filter-reset-btn"
                      onClick={() => {
                        const nextRange = defaultTurnoverRange();
                        const nextSources = [...TURNOVER_SOURCES];
                        form.setFieldsValue({ sourceOrderIds: '', dateRange: nextRange, sources: nextSources });
                        setFilters({ sourceOrderIds: '', dateRange: nextRange, sources: nextSources });
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
          title="流水明細"
          extra={(
            <Button
              data-e2e-id="member-detail-turnover-refresh-btn"
              size="small"
              onClick={() => message.success('已刷新流水明細')}
            >
              刷新記錄
            </Button>
          )}
        >
          <Table
            data-e2e-id="member-detail-turnover-table"
            rowKey="id"
            columns={columns}
            dataSource={rows}
            onRow={(record) => ({ 'data-e2e-id': `member-detail-turnover-table-row-${record.id}` } as React.HTMLAttributes<HTMLTableRowElement>)}
            scroll={{ x: 1500 }}
            pagination={{ pageSize: 20, showTotal: total => `共 ${total} 筆` }}
            size="small"
          />
        </MemberStatCard>

        <Modal
          title="場館限制詳情"
          open={!!venueModalData}
          onCancel={() => setVenueModalData(null)}
          footer={[
            <Button key="close" onClick={() => setVenueModalData(null)}>
              關閉
            </Button>,
          ]}
        >
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {venueModalData?.map(item => (
              <div key={`${item.category}-${item.provider}`} style={{ padding: '4px 0' }}>
                <Text>{item.category} / {item.provider}</Text>
              </div>
            ))}
          </div>
        </Modal>
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
    setRestrictionModal({ open: true, mode: 'create', capabilityKey: null });
  };

  const openEditRestrictionModal = (state: MemberCapabilityState) => {
    restrictionForm.resetFields();
    restrictionForm.setFieldsValue({
      capabilityKey: state.capabilityKey,
      reason: state.reason,
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
    // modal.capabilityKey 已預填時優先使用（row 加鎖入口），fallback 到 form 值（總覽級新增入口）
    const targetKey: string | undefined = restrictionModal.capabilityKey ?? values.capabilityKey;
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

    // 不再提供暫時限制，所有手動鎖一律永久（restrictedUntil=null）
    const restrictedUntil: string | null = null;

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
      render: (value: KycPhotoAction) => value,
    },
    {
      title: '分類',
      dataIndex: 'category',
      width: 140,
      render: (value: KycPhotoCategory) => value,
    },
    { title: '檔名', dataIndex: 'fileName', width: 220 },
    { title: '備註', dataIndex: 'note' },
  ];

  const restrictionHistoryColumns: ColumnsType<MemberCapabilityLog> = [
    { title: '時間', dataIndex: 'createdAt', width: 170 },
    { title: '操作員', dataIndex: 'operator', width: 200 },
    {
      title: '功能',
      dataIndex: 'capabilityKey',
      width: 120,
      render: (value: string) => {
        const dict = getCapabilityDictItem(value);
        return dict ? dict.nameZh : value;
      },
    },
    {
      title: '動作',
      dataIndex: 'action',
      width: 90,
      render: (value: CapabilityAction) => restrictionActionLabel[value],
    },
    {
      title: '來源',
      dataIndex: 'source',
      width: 110,
      render: (value: CapabilitySource) => capabilitySourceLabel[value],
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
    if (!member) return <Empty description="會員不存在" />;

    const enabledDict = capabilityDict.filter(c => c.enabled).slice().sort((a, b) => a.sortOrder - b.sortOrder);
    const stateMap = new Map(restrictionStates.map(s => [s.capabilityKey, s] as const));
    const nowTs = dayjs();
    const isActiveRestriction = (s: MemberCapabilityState) =>
      s.restricted && (!s.restrictedUntil || dayjs(s.restrictedUntil).isAfter(nowTs));

    // 衍生自動規則鎖：依會員當前狀態 (memberStatus / kycStatus / blockState / bannedState) 推導
    const autoRestrictions = deriveAutoRestrictions(member);
    const autoByKey = new Map<string, AutoRestriction[]>();
    for (const a of autoRestrictions) {
      const arr = autoByKey.get(a.capabilityKey) ?? [];
      arr.push(a);
      autoByKey.set(a.capabilityKey, arr);
    }

    type Row = {
      capability: CapabilityDictItem;
      autoLocks: AutoRestriction[];
      manualLock: MemberCapabilityState | null; // 僅顯示 active 的
      finalLocked: boolean;
    };

    const rows: Row[] = enabledDict.map((cap) => {
      const autoLocks = autoByKey.get(cap.key) ?? [];
      const state = stateMap.get(cap.key);
      const manualLock = state && isActiveRestriction(state) ? state : null;
      const finalLocked = autoLocks.length > 0 || !!manualLock;
      return { capability: cap, autoLocks, manualLock, finalLocked };
    });

    const totalCount = enabledDict.length;
    const finalLockedCount = rows.filter(r => r.finalLocked).length;
    const autoLockedCount = rows.filter(r => r.autoLocks.length > 0).length;
    const manualLockedCount = rows.filter(r => r.manualLock).length;
    const allManualBlocked = rows.every(r => r.manualLock);

    const renderAutoCell = (autoLocks: AutoRestriction[]) => {
      if (autoLocks.length === 0) return <Text type="secondary">—</Text>;
      // 同 source 同 capability 多條規則合併顯示，Tooltip 列出所有 reason
      const grouped = new Map<CapabilitySource, string[]>();
      for (const lock of autoLocks) {
        const arr = grouped.get(lock.source) ?? [];
        arr.push(lock.reason);
        grouped.set(lock.source, arr);
      }
      return (
        <Space size={4} wrap>
          {Array.from(grouped.entries()).map(([source, reasons]) => (
            <Tooltip
              key={source}
              title={
                <Space direction="vertical" size={2}>
                  {reasons.map((r, i) => <Text key={i} style={{ color: '#fff' }}>• {r}</Text>)}
                </Space>
              }
            >
              <Text style={{ cursor: 'help' }}>
                <WarningOutlined /> {capabilitySourceLabel[source]}{reasons.length > 1 ? ` ×${reasons.length}` : ''}
              </Text>
            </Tooltip>
          ))}
        </Space>
      );
    };

    const renderManualCell = (row: Row) => {
      if (!row.manualLock) {
        return (
          <Button
            data-e2e-id={`member-detail-restriction-set-btn-${row.capability.key}`}
            type="link"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => {
              restrictionForm.resetFields();
              restrictionForm.setFieldsValue({ capabilityKey: row.capability.key });
              setRestrictionModal({ open: true, mode: 'create', capabilityKey: row.capability.key });
            }}
          >
            加鎖
          </Button>
        );
      }
      const s = row.manualLock;
      return (
        <Tooltip title={s.reason}>
          <Text>已加鎖</Text>
        </Tooltip>
      );
    };

    const renderFinalCell = (row: Row) => (row.finalLocked ? '❌ 禁止' : '✅ 允許');

    const columns: ColumnsType<Row> = [
      {
        title: '功能',
        key: 'capability',
        width: 120,
        render: (_: unknown, r: Row) => r.capability.nameZh,
      },
      {
        title: <Tooltip title="由 KYC / 帳號狀態 / 風控標籤推導，無法在此處取消">自動規則</Tooltip>,
        key: 'auto',
        width: 280,
        render: (_: unknown, r: Row) => renderAutoCell(r.autoLocks),
      },
      {
        title: <Tooltip title="後台單獨設置，與自動規則 OR 疊加">手動鎖</Tooltip>,
        key: 'manual',
        width: 180,
        render: (_: unknown, r: Row) => renderManualCell(r),
      },
      {
        title: '最終結果',
        key: 'final',
        width: 140,
        render: (_: unknown, r: Row) => renderFinalCell(r),
      },
      {
        title: '操作',
        key: 'actions',
        width: 120,
        render: (_: unknown, r: Row) => {
          if (!r.manualLock) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
          return (
            <Button
              data-e2e-id={`member-detail-restriction-release-btn-${r.capability.key}`}
              size="small"
              danger
              onClick={() => openReleaseRestrictionModal(r.capability.key)}
            >
              解除
            </Button>
          );
        },
      },
    ];

    const bannerType: 'error' | 'warning' | 'info' | 'success' =
      finalLockedCount === 0 ? 'success' : autoLockedCount > 0 ? 'warning' : 'info';
    const bannerMessage = (
      <Space wrap>
        <span>會員當前狀態：</span>
        <Tag color={memberStatusColor[member.memberStatus]}>{member.memberStatus}</Tag>
        <Tag color={kycStatusColor[member.kycStatus]}>KYC {member.kycStatus}</Tag>
        {member.bannedState && <Tag color="red">黑名單</Tag>}
        {member.blockState && <Tag color="volcano">封禁</Tag>}
        <span style={{ marginLeft: 12 }}>
          自動鎖 <Tag color={autoLockedCount > 0 ? 'orange' : 'default'}>{autoLockedCount}</Tag>
          手動鎖 <Tag color={manualLockedCount > 0 ? 'blue' : 'default'}>{manualLockedCount}</Tag>
          最終受限 <Tag color={finalLockedCount > 0 ? 'red' : 'green'}>{finalLockedCount} / {totalCount}</Tag>
        </span>
      </Space>
    );

    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          data-e2e-id="member-detail-restriction-status-banner"
          type={bannerType}
          showIcon
          message={bannerMessage}
        />

        <Card
          size="small"
          title="功能限制總覽"
        >
          <Table
            data-e2e-id="member-detail-restriction-table"
            rowKey={(r) => r.capability.key}
            columns={columns}
            dataSource={rows}
            pagination={false}
            size="small"
          />
        </Card>

        <Card size="small" title="手動鎖操作歷史">
          <Table
            rowKey="id"
            columns={restrictionHistoryColumns}
            dataSource={sortedRestrictionHistory}
            scroll={{ x: 1100 }}
            pagination={{ pageSize: 12, showTotal: total => `共 ${total} 筆` }}
            size="small"
          />
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
    { key: 'turnover', label: '流水明細', children: <TurnoverDetailTab /> },
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
        destroyOnClose
      >
        <Form
          form={restrictionForm}
          layout="vertical"
          initialValues={{}}
          preserve={false}
        >
          {restrictionModal.mode === 'create' && !restrictionModal.capabilityKey ? (
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

import dayjs from 'dayjs';

export type UpDownType = '上分' | '下分' | '清零';
export type UpDownStatus = '待審核' | '已通過' | '已拒絕' | '處理中';
export type SearchType = '手機號' | '會員UID' | '會員帳號ID';

export interface UpDownMemberProfile {
  uid: string;
  accountId: string;
  memberName: string;
  phone: string;
  accountStatus: string;
  walletBalance: number;
}

export interface UpDownScoreRecord {
  key: string;
  seq: number;
  orderNo: string;
  type: UpDownType;
  memberPhone: string;
  memberUid: string;
  memberName: string;
  status: UpDownStatus;
  submitter: string;
  submitTime: string;
  submitAmount: number;
  reason: string;
  turnoverRequirement: number;
  reviewer: string;
  reviewTime: string;
}

export interface BatchUploadRow {
  key: string;
  memberPhone: string;
  memberUid: string;
  memberAccountId: string;
  memberName: string;
  accountStatus: string;
  walletBalance: number | null;
  submitAmount: number | null;
  turnoverMultiplier: number | null;
  venueLimit: string;
  reason: string;
  valid: boolean;
  errorMessage: string;
}

export const searchTypeOptions: SearchType[] = ['手機號', '會員UID', '會員帳號ID'];
export const orderStatusOptions: UpDownStatus[] = ['待審核', '已通過', '已拒絕', '處理中'];
export const venueLimitOptions = ['全站', '老虎機', 'Live', 'FC', 'JDB', 'JILI', 'PG', 'PP'] as const;

const submitters = ['amy.lin', 'bryan.chan', 'carol.tan', 'derek.lim'];
const reviewers = ['Mika', 'Cindy', 'Harold', 'Jessie'];
const reasons = ['VIP 補償', '活動補發', '人工調整', '異常修正', '提款回沖', '客服核補'];
const firstNames = ['Luna', 'Noah', 'Isla', 'Liam', 'Ava', 'Ethan', 'Mia', 'Lucas', 'Ella', 'Leo'];

export const memberProfiles: UpDownMemberProfile[] = Array.from({ length: 30 }, (_, index) => {
  const uid = `UID${String(100001 + index)}`;
  return {
    uid,
    accountId: `vip_${1001 + index}`,
    memberName: `${firstNames[index % firstNames.length]}${index + 1}`,
    phone: `9762${String(100000 + index).padStart(6, '0')}`,
    accountStatus: index % 6 === 0 ? '凍結' : '正常',
    walletBalance: 1200 + index * 325,
  };
});

function createOrderNo(type: UpDownType, index: number) {
  const prefix = type === '上分' ? 'UP' : type === '下分' ? 'DOWN' : 'ZERO';
  return `${prefix}${dayjs('2026-04-28').format('YYMMDD')}${String(1000 + index)}`;
}

function createDate(index: number) {
  return dayjs('2026-04-28 09:00:00').subtract(index * 3, 'hour').format('YYYY-MM-DD HH:mm:ss');
}

function createReviewTime(status: UpDownStatus, index: number) {
  if (status === '待審核' || status === '處理中') return '-';
  return dayjs('2026-04-28 10:30:00').subtract(index * 2, 'hour').format('YYYY-MM-DD HH:mm:ss');
}

function createReviewer(status: UpDownStatus, index: number) {
  if (status === '待審核' || status === '處理中') return '-';
  return reviewers[index % reviewers.length];
}

function generateRecords(type: UpDownType, startSeq: number): UpDownScoreRecord[] {
  return Array.from({ length: 15 }, (_, index) => {
    const profile = memberProfiles[(type === '上分' ? index : index + 15) % memberProfiles.length];
    const statuses: UpDownStatus[] = ['待審核', '已通過', '已拒絕', '處理中'];
    const status = statuses[index % statuses.length];
    return {
      key: `${type}-${profile.uid}-${index}`,
      seq: startSeq + index,
      orderNo: createOrderNo(type, startSeq + index),
      type,
      memberPhone: profile.phone,
      memberUid: profile.uid,
      memberName: profile.memberName,
      status,
      submitter: submitters[index % submitters.length],
      submitTime: createDate(index),
      submitAmount: 500 + index * 175,
      reason: reasons[index % reasons.length],
      turnoverRequirement: type === '上分' ? (index % 8) + 1 : 0,
      reviewer: createReviewer(status, index),
      reviewTime: createReviewTime(status, index),
    };
  });
}

export const upDownScoreRecords: UpDownScoreRecord[] = [
  ...generateRecords('上分', 1),
  ...generateRecords('下分', 16),
];

export function getMemberProfileByUid(uid: string) {
  return memberProfiles.find((item) => item.uid.toLowerCase() === uid.trim().toLowerCase());
}

export function getMemberProfileByPhone(phone: string) {
  return memberProfiles.find((item) => item.phone === phone.trim());
}

export function getMemberProfileByAccountId(accountId: string) {
  return memberProfiles.find((item) => item.accountId.toLowerCase() === accountId.trim().toLowerCase());
}

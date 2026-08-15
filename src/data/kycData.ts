export type KycStatus =
  | 'Pending'
  | 'Under Review'
  | 'Resubmit Required'
  | 'Approved'
  | 'Rejected';

export type KycChannel = '主站APP/H5' | '未分類渠道';
export type KycVerifyResult = '通過' | '不通過' | '未返回' | '-';

export interface KycChangeLogEntry {
  id: string;
  time: string;
  operator: string;
  action: string;
  detail: string;
}

export interface KycRecord {
  key: string;
  uid: string;
  submittedAt: string;
  status: KycStatus;
  phone: string;
  firstName: string;
  middleName: string;
  lastName: string;
  birthday: string;
  gender: '男' | '女';
  nationality: 'Philippines' | 'Others';
  birthplace: string;
  currentAddress: string;
  permanentAddress: string;
  nearestBranch: string;
  occupation: string;
  incomeSource: string;
  verifyResult: KycVerifyResult;
  regIp: string;
  registeredAt: string;
  regChannel: string;
  channel: KycChannel;
  reviewer: string;
  reviewedAt: string;
  userMessage: string;
  remark: string;
  changeLog: KycChangeLogEntry[];
}

export const KYC_SEED_DATE = '2026-08-15';

export const kycStatuses: KycStatus[] = [
  'Pending',
  'Under Review',
  'Resubmit Required',
  'Approved',
  'Rejected',
];

export const kycStatusLabelMap: Record<KycStatus, string> = {
  Pending: '待審核',
  'Under Review': '審核中',
  'Resubmit Required': '需重新提交',
  Approved: '已通過',
  Rejected: '已拒絕',
};

export const kycStatusColorMap: Record<KycStatus, string> = {
  Pending: '#8c8c8c',
  'Under Review': '#8c8c8c',
  'Resubmit Required': '#fa8c16',
  Approved: '#52c41a',
  Rejected: '#ff4d4f',
};

const firstNames = [
  'Maria', 'Jose', 'Angelica', 'Mark', 'Camille', 'Paolo', 'Beatriz', 'Joshua',
  'Sofia', 'Miguel', 'Patricia', 'Carlo', 'Jasmine', 'Rafael', 'Bianca', 'Daniel',
  'Clarisse', 'Nathaniel', 'Isabella', 'Gabriel',
];

const middleNames = [
  'Santos', 'Reyes', '', 'Garcia', 'Mendoza', 'Cruz', 'Torres', '', 'Flores', 'Ramos',
];

const lastNames = [
  'Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Mendoza', 'Bautista', 'Villanueva',
  'Fernandez', 'Castillo', 'Navarro', 'Aquino', 'Domingo', 'Salazar', 'Mercado', 'Pascual',
];

const branches = ['Makati Branch', 'Quezon City Branch', 'Cebu Branch', 'Davao Branch', 'Pasay Branch'];
const occupations = ['受僱', '自僱', '學生', '退休', '其他'];
const incomeSources = ['薪資', '生意', '投資', '其他'];
const cities = ['Manila', 'Quezon City', 'Makati', 'Cebu City', 'Davao City', 'Pasig'];
const statusPattern: KycStatus[] = [
  'Pending',
  'Under Review',
  'Approved',
  'Approved',
  'Rejected',
  'Resubmit Required',
  'Approved',
  'Pending',
];

const pad = (value: number) => String(value).padStart(2, '0');

const getSubmittedAt = (index: number) => {
  const day = 15 - Math.floor(index / 8);
  const hour = 8 + ((index * 3) % 11);
  const minute = (index * 7) % 60;
  return `2026-08-${pad(day)} ${pad(hour)}:${pad(minute)}:00`;
};

const getReviewedAt = (index: number, status: KycStatus) => {
  if (status === 'Pending') return '';
  if (status === 'Under Review' && index % 3 !== 0) return '';
  const reviewDay = index < 16 ? 15 : 15 - Math.floor(index / 8);
  const hour = 10 + ((index * 2) % 9);
  return `2026-08-${pad(reviewDay)} ${pad(hour)}:${pad((index * 11) % 60)}:00`;
};

const getVerifyResult = (status: KycStatus, index: number): KycVerifyResult => {
  if (status === 'Approved') return '通過';
  if (status === 'Rejected' || status === 'Resubmit Required') return '不通過';
  if (status === 'Under Review') return index % 2 === 0 ? '未返回' : '-';
  return index % 3 === 0 ? '未返回' : '-';
};

const makeChangeLog = (
  index: number,
  status: KycStatus,
  reviewedAt: string,
  reviewer: string,
): KycChangeLogEntry[] => {
  if (!reviewedAt || (!['Approved', 'Rejected', 'Resubmit Required'].includes(status)) || (index >= 10 && index % 11 !== 0)) {
    return [];
  }

  const action = status === 'Approved' ? '審核通過' : status === 'Rejected' ? '審核駁回' : '要求重新提交';
  const detail = status === 'Approved'
    ? '身份資料與證件驗證通過'
    : status === 'Rejected'
      ? '證件影像不清晰，無法辨識'
      : '請重新上傳清晰的證件照片';

  return [
    {
      id: `log-${index + 1}-review`,
      time: reviewedAt,
      operator: reviewer,
      action,
      detail,
    },
    ...(index === 3
      ? [{
          id: `log-${index + 1}-submit`,
          time: getSubmittedAt(index),
          operator: '系統',
          action: '提交 KYC',
          detail: '會員完成身份資料與證件提交',
        }]
      : []),
  ];
};

export const kycSeedData: KycRecord[] = Array.from({ length: 40 }, (_, index) => {
  const status = statusPattern[index % statusPattern.length];
  const submittedAt = getSubmittedAt(index);
  const reviewedAt = getReviewedAt(index, status);
  const reviewer = reviewedAt ? (status === 'Under Review' ? 'Alicia' : 'Darren') : '';
  const city = cities[index % cities.length];
  const channel: KycChannel = index % 5 === 4 ? '未分類渠道' : '主站APP/H5';
  const phone = `9${String(170000000 + index * 137).slice(-9)}`;

  return {
    key: `kyc-${index + 1}`,
    uid: `FB${String(26080001 + index)}`,
    submittedAt,
    status,
    phone,
    firstName: firstNames[index % firstNames.length],
    middleName: middleNames[index % middleNames.length],
    lastName: lastNames[(index * 3) % lastNames.length],
    birthday: `${1985 + (index % 17)}-${pad(1 + (index % 12))}-${pad(2 + (index % 26))}`,
    gender: index % 2 === 0 ? '女' : '男',
    nationality: index % 13 === 0 ? 'Others' : 'Philippines',
    birthplace: `${city}, Philippines`,
    currentAddress: `${128 + index} Rizal Street, ${city}`,
    permanentAddress: index % 6 === 0 ? '' : `${52 + index} Mabini Avenue, ${city}`,
    nearestBranch: branches[index % branches.length],
    occupation: occupations[index % occupations.length],
    incomeSource: incomeSources[index % incomeSources.length],
    verifyResult: getVerifyResult(status, index),
    regIp: `112.${20 + (index % 20)}.${40 + (index % 30)}.${80 + index}`,
    registeredAt: `2026-07-${pad(3 + (index % 25))} ${pad(7 + (index % 12))}:${pad((index * 13) % 60)}:00`,
    regChannel: channel === '主站APP/H5' ? (index % 2 === 0 ? 'Android APP' : 'H5') : 'Unknown',
    channel,
    reviewer,
    reviewedAt,
    userMessage: index % 7 === 0 ? '請協助盡快完成審核，謝謝。' : '',
    remark: status === 'Rejected'
      ? '證件影像模糊'
      : status === 'Resubmit Required'
        ? '請重新提交證件照片'
        : '',
    changeLog: makeChangeLog(index, status, reviewedAt, reviewer),
  };
});

export const getKycChannelCounts = (
  records: KycRecord[],
  channel: KycChannel,
  today: string = KYC_SEED_DATE,
) => {
  const channelRecords = records.filter((record) => record.channel === channel);
  return {
    approvedToday: channelRecords.filter(
      (record) => record.status === 'Approved' && record.reviewedAt.startsWith(today),
    ).length,
    pendingNow: channelRecords.filter(
      (record) => record.status === 'Pending' || record.status === 'Under Review',
    ).length,
  };
};

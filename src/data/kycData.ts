import dayjs from 'dayjs';

export type KycStatus =
  | 'Pending'
  | 'Under Review'
  | 'Resubmit Required'
  | 'Approved'
  | 'Rejected';

export type KycChannel = '主站APP/H5' | '未分類渠道';
export type KycVerifyResult = '通過' | '不通過' | '未返回' | '-';

export type KycDocumentSlot = 'front' | 'back' | 'selfie';

export const kycDocumentLabelMap: Record<KycDocumentSlot, string> = {
  front: '證件照-正面',
  back: '證件照-反面',
  selfie: '手持證件照',
};

export const kycDocumentSlots: KycDocumentSlot[] = ['front', 'back', 'selfie'];

export type KycDocuments = Record<KycDocumentSlot, string>;

const documentPalette: Record<KycDocumentSlot, { bg: string; fg: string }> = {
  front: { bg: '#e6f4ff', fg: '#1677ff' },
  back: { bg: '#fff7e6', fg: '#fa8c16' },
  selfie: { bg: '#f6ffed', fg: '#52c41a' },
};

/** 產生模擬證件圖（inline SVG data URI），讓上傳／變更前後可以直接用 <img> 呈現。 */
export const makeKycDocumentImage = (slot: KycDocumentSlot, caption: string) => {
  const { bg, fg } = documentPalette[slot];
  const label = kycDocumentLabelMap[slot];
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="228" viewBox="0 0 360 228">',
    `<rect width="360" height="228" fill="${bg}"/>`,
    `<rect x="12" y="12" width="336" height="204" rx="12" fill="none" stroke="${fg}" stroke-opacity="0.55" stroke-width="2" stroke-dasharray="9 7"/>`,
    `<rect x="34" y="52" width="92" height="112" rx="8" fill="${fg}" fill-opacity="0.16"/>`,
    `<circle cx="80" cy="94" r="22" fill="${fg}" fill-opacity="0.38"/>`,
    `<path d="M46 156c0-20 15-32 34-32s34 12 34 32z" fill="${fg}" fill-opacity="0.38"/>`,
    `<rect x="146" y="58" width="176" height="13" rx="6" fill="${fg}" fill-opacity="0.34"/>`,
    `<rect x="146" y="84" width="140" height="13" rx="6" fill="${fg}" fill-opacity="0.22"/>`,
    `<rect x="146" y="110" width="158" height="13" rx="6" fill="${fg}" fill-opacity="0.22"/>`,
    `<text x="146" y="154" font-family="Helvetica, Arial, sans-serif" font-size="15" font-weight="600" fill="${fg}">${label}</text>`,
    `<text x="146" y="176" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="${fg}" fill-opacity="0.8">${caption}</text>`,
    '</svg>',
  ].join('');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export type KycPhotoChange = {
  slot: KycDocumentSlot;
  label: string;
  oldImage: string;
  newImage: string;
};

export type KycEditFieldChange = {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
};

/** 異動記錄的操作類型：用戶自行提交／後台審核／後台編輯／編輯複核。 */
export type KycChangeLogAction = '用戶操作' | '審核' | '編輯' | '複核';

/**
 * 異動記錄一列。
 * 狀態異動（用戶操作／審核）不會有 reviewStatus 與前後資訊；
 * 只有 KYC 已通過後的後台編輯（編輯／複核）才帶 reviewStatus + changes/photoChanges。
 */
export interface KycChangeLogEntry {
  id: string;
  time: string;
  action: KycChangeLogAction;
  statusBefore: KycStatus | '';
  statusAfter: KycStatus | '';
  reviewStatus?: KycEditReviewStatus | null;
  reviewId?: string;
  remark: string;
  operator: string;
  changes?: KycEditFieldChange[];
  photoChanges?: KycPhotoChange[];
}

export type KycPendingEdit = {
  submittedBy: string;
  submittedAt: string;
  changes: KycEditFieldChange[];
  photoChanges: KycPhotoChange[];
};

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
  documents: KycDocuments;
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
  pendingEdit?: KycPendingEdit | null;
}

export type KycEditReviewStatus = 'Pending' | 'Approved' | 'Rejected';

export const kycEditReviewStatuses: KycEditReviewStatus[] = ['Pending', 'Approved', 'Rejected'];

export const kycEditReviewStatusLabelMap: Record<KycEditReviewStatus, string> = {
  Pending: '待複核',
  Approved: '已核准',
  Rejected: '已駁回',
};

export const kycEditReviewStatusColorMap: Record<KycEditReviewStatus, string> = {
  Pending: '#fa8c16',
  Approved: '#52c41a',
  Rejected: '#ff4d4f',
};

/** 一筆編輯複核條目；待複核與已複核（歷史）共用同一結構。 */
export interface KycEditReviewEntry {
  id: string;
  recordKey: string;
  uid: string;
  phone: string;
  firstName: string;
  middleName: string;
  lastName: string;
  submittedBy: string;
  submittedAt: string;
  changes: KycEditFieldChange[];
  photoChanges: KycPhotoChange[];
  status: KycEditReviewStatus;
  reviewedBy: string;
  reviewedAt: string;
  reason: string;
}

export const shiftTime = (base: string, minutes: number) =>
  dayjs(base).add(minutes, 'minute').format('YYYY-MM-DD HH:mm:ss');

export const describeEditSubmission = (
  changes: KycEditFieldChange[],
  photoChanges: KycPhotoChange[],
) => {
  const parts: string[] = [];
  if (changes.length) {
    parts.push(`欄位 ${changes.length} 項：${changes.map((change) => change.label).join('、')}`);
  }
  if (photoChanges.length) {
    parts.push(`證件照 ${photoChanges.length} 張：${photoChanges.map((photo) => photo.label).join('、')}`);
  }
  return parts.join('；') || '未變更任何內容';
};

export const KYC_SEED_DATE = '2026-08-15';

export const kycStatuses: KycStatus[] = [
  'Pending',
  'Under Review',
  'Resubmit Required',
  'Approved',
  'Rejected',
];

export const kycOperators = ['Darren', 'Alice', 'Ben'];

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
const memberAccounts = [
  'filbet_M2s3xr', 'filbet_K9d1pq', 'filbet_R4t7bn', 'filbet_X8w2cz',
  'filbet_Q3h6vm', 'filbet_L5y8jd', 'filbet_T7n4wk', 'filbet_B1c6zf',
];
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

/** 審核時間一律由提交時間往後推，確保異動記錄的先後順序合理。 */
const getReviewedAt = (index: number, status: KycStatus, submittedAt: string) => {
  if (status === 'Pending') return '';
  if (status === 'Under Review' && index % 3 !== 0) return '';
  return shiftTime(submittedAt, 150 + ((index * 37) % 420));
};

const getVerifyResult = (status: KycStatus, index: number): KycVerifyResult => {
  if (status === 'Approved') return '通過';
  if (status === 'Rejected' || status === 'Resubmit Required') return '不通過';
  if (status === 'Under Review') return index % 2 === 0 ? '未返回' : '-';
  return index % 3 === 0 ? '未返回' : '-';
};

const makeDocuments = (uid: string): KycDocuments => ({
  front: makeKycDocumentImage('front', `${uid}・原始檔`),
  back: makeKycDocumentImage('back', `${uid}・原始檔`),
  selfie: makeKycDocumentImage('selfie', `${uid}・原始檔`),
});

const makePendingPhotoChange = (
  uid: string,
  slot: KycDocumentSlot,
  documents: KycDocuments,
): KycPhotoChange => ({
  slot,
  label: kycDocumentLabelMap[slot],
  oldImage: documents[slot],
  newImage: makeKycDocumentImage(slot, `${uid}・新上傳`),
});

/**
 * 狀態異動記錄：用戶提交／後台審核的來回，對應 FAT 既有的異動記錄內容。
 * 這些列不會有複核狀態與異動前後資訊。
 */
const makeStatusChangeLog = (
  index: number,
  status: KycStatus,
  submittedAt: string,
  reviewedAt: string,
  reviewer: string,
  remark: string,
): KycChangeLogEntry[] => {
  const account = memberAccounts[index % memberAccounts.length];
  const rows: KycChangeLogEntry[] = [];
  const push = (row: Omit<KycChangeLogEntry, 'id'>) => {
    rows.push({ ...row, id: `log-${index + 1}-status-${rows.length + 1}` });
  };

  if (status === 'Pending') {
    push({
      time: submittedAt,
      action: '用戶操作',
      statusBefore: '',
      statusAfter: 'Pending',
      reviewStatus: null,
      remark: '',
      operator: account,
    });
    return rows;
  }

  push({
    time: submittedAt,
    action: '用戶操作',
    statusBefore: '',
    statusAfter: 'Under Review',
    reviewStatus: null,
    remark: '',
    operator: account,
  });

  if (status === 'Under Review') {
    if (reviewedAt) {
      push({
        time: reviewedAt,
        action: '審核',
        statusBefore: 'Under Review',
        statusAfter: 'Resubmit Required',
        reviewStatus: null,
        remark: 'ID details not clear',
        operator: 'Alicia',
      });
      push({
        time: shiftTime(reviewedAt, 45),
        action: '用戶操作',
        statusBefore: 'Resubmit Required',
        statusAfter: 'Under Review',
        reviewStatus: null,
        remark: '',
        operator: account,
      });
    }
    return rows;
  }

  if (index % 3 === 0) {
    push({
      time: shiftTime(submittedAt, 45),
      action: '審核',
      statusBefore: 'Under Review',
      statusAfter: 'Resubmit Required',
      reviewStatus: null,
      remark: 'ID details not clear',
      operator: 'Alicia',
    });
    push({
      time: shiftTime(submittedAt, 90),
      action: '用戶操作',
      statusBefore: 'Resubmit Required',
      statusAfter: 'Under Review',
      reviewStatus: null,
      remark: '',
      operator: account,
    });
  }

  if (reviewedAt) {
    push({
      time: reviewedAt,
      action: '審核',
      statusBefore: 'Under Review',
      statusAfter: status,
      reviewStatus: null,
      remark: remark || (status === 'Approved' ? 'APPROVED' : ''),
      operator: reviewer || 'Darren',
    });
  }

  return rows;
};

/**
 * 待複核的編輯只掛在 KYC 已通過（Approved）的紀錄上，
 * 對應「只有驗證結果＝通過才能編輯」的規則。
 */
const pendingEditPlans: Record<number, (args: {
  uid: string;
  documents: KycDocuments;
  values: Pick<KycRecord, 'currentAddress' | 'nearestBranch' | 'occupation' | 'incomeSource'>;
  reviewedAt: string;
}) => KycPendingEdit> = {
  2: ({ values, reviewedAt }) => ({
    submittedBy: 'Alice',
    submittedAt: shiftTime(reviewedAt, 180),
    changes: [
      { field: 'currentAddress', label: '現住址', oldValue: values.currentAddress, newValue: '88 Ayala Avenue, Makati' },
      { field: 'occupation', label: '職業', oldValue: values.occupation, newValue: '自僱' },
    ],
    photoChanges: [],
  }),
  3: ({ uid, documents, values, reviewedAt }) => ({
    submittedBy: 'Darren',
    submittedAt: shiftTime(reviewedAt, 240),
    changes: [
      { field: 'nearestBranch', label: '鄰近分行', oldValue: values.nearestBranch, newValue: 'Makati Branch' },
      { field: 'occupation', label: '職業', oldValue: values.occupation, newValue: '受僱' },
    ],
    photoChanges: [makePendingPhotoChange(uid, 'front', documents)],
  }),
  6: ({ uid, documents, values, reviewedAt }) => ({
    submittedBy: 'Ben',
    submittedAt: shiftTime(reviewedAt, 300),
    changes: [
      { field: 'currentAddress', label: '現住址', oldValue: values.currentAddress, newValue: '27 Bonifacio Street, Davao City' },
      { field: 'incomeSource', label: '收入來源', oldValue: values.incomeSource, newValue: '生意' },
    ],
    photoChanges: [
      makePendingPhotoChange(uid, 'back', documents),
      makePendingPhotoChange(uid, 'selfie', documents),
    ],
  }),
};

export const kycSeedData: KycRecord[] = Array.from({ length: 40 }, (_, index) => {
  const status = statusPattern[index % statusPattern.length];
  const submittedAt = getSubmittedAt(index);
  const reviewedAt = getReviewedAt(index, status, submittedAt);
  const reviewer = reviewedAt ? (status === 'Under Review' ? 'Alicia' : 'Darren') : '';
  const city = cities[index % cities.length];
  const channel: KycChannel = index % 5 === 4 ? '未分類渠道' : '主站APP/H5';
  const uid = `FB${String(26080001 + index)}`;
  const phone = `9${String(170000000 + index * 137).slice(-9)}`;
  const currentAddress = `${128 + index} Rizal Street, ${city}`;
  const nearestBranch = branches[index % branches.length];
  const occupation = occupations[index % occupations.length];
  const incomeSource = incomeSources[index % incomeSources.length];
  const documents = makeDocuments(uid);
  const remark = status === 'Rejected'
    ? '證件影像模糊'
    : status === 'Resubmit Required'
      ? '請重新提交證件照片'
      : '';

  const pendingEditPlan = pendingEditPlans[index];
  const pendingEdit = pendingEditPlan
    ? pendingEditPlan({
        uid,
        documents,
        values: { currentAddress, nearestBranch, occupation, incomeSource },
        reviewedAt,
      })
    : null;

  const changeLog = makeStatusChangeLog(index, status, submittedAt, reviewedAt, reviewer, remark);

  if (pendingEdit) {
    changeLog.push({
      id: `log-${index + 1}-edit-submit`,
      time: pendingEdit.submittedAt,
      action: '編輯',
      statusBefore: status,
      statusAfter: status,
      reviewStatus: 'Pending',
      reviewId: `kyc-${index + 1}-review-pending`,
      remark: describeEditSubmission(pendingEdit.changes, pendingEdit.photoChanges),
      operator: pendingEdit.submittedBy,
      changes: pendingEdit.changes,
      photoChanges: pendingEdit.photoChanges,
    });
  }

  return {
    key: `kyc-${index + 1}`,
    uid,
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
    currentAddress,
    permanentAddress: index % 6 === 0 ? '' : `${52 + index} Mabini Avenue, ${city}`,
    nearestBranch,
    occupation,
    incomeSource,
    documents,
    verifyResult: getVerifyResult(status, index),
    regIp: `112.${20 + (index % 20)}.${40 + (index % 30)}.${80 + index}`,
    registeredAt: `2026-07-${pad(3 + (index % 25))} ${pad(7 + (index % 12))}:${pad((index * 13) % 60)}:00`,
    regChannel: channel === '主站APP/H5' ? (index % 2 === 0 ? 'Android APP' : 'H5') : 'Unknown',
    channel,
    reviewer,
    reviewedAt,
    userMessage: index % 7 === 0 ? '請協助盡快完成審核，謝謝。' : '',
    remark,
    changeLog,
    pendingEdit,
  };
});

type ReviewHistoryPlan = {
  /** 皆為 Approved 的紀錄（index % 8 ∈ {2, 3, 6}），編輯只發生在 KYC 已通過之後 */
  index: number;
  submittedBy: string;
  submitAfterMinutes: number;
  status: Exclude<KycEditReviewStatus, 'Pending'>;
  reviewedBy: string;
  settleAfterMinutes: number;
  reason: string;
  fields: { field: keyof KycRecord & string; label: string; counterValue: string }[];
  photoSlots: KycDocumentSlot[];
};

/**
 * 已複核（歷史）條目。
 * Approved：counterValue 是變更前的舊值，新值即目前檔案上的值。
 * Rejected：counterValue 是被駁回、未生效的提議值。
 */
const reviewHistoryPlans: ReviewHistoryPlan[] = [
  {
    index: 10,
    submittedBy: 'Ben',
    submitAfterMinutes: 240,
    status: 'Approved',
    reviewedBy: 'Darren',
    settleAfterMinutes: 65,
    reason: '',
    fields: [{ field: 'occupation', label: '職業', counterValue: '學生' }],
    photoSlots: [],
  },
  {
    index: 11,
    submittedBy: 'Alice',
    submitAfterMinutes: 320,
    status: 'Rejected',
    reviewedBy: 'Ben',
    settleAfterMinutes: 230,
    reason: '新地址與證件不符，請補件後再提交',
    fields: [{ field: 'currentAddress', label: '現住址', counterValue: '19 Katipunan Road, Quezon City' }],
    photoSlots: ['front'],
  },
  {
    index: 14,
    submittedBy: 'Darren',
    submitAfterMinutes: 180,
    status: 'Approved',
    reviewedBy: 'Alice',
    settleAfterMinutes: 95,
    reason: '',
    fields: [
      { field: 'nearestBranch', label: '鄰近分行', counterValue: 'Cebu Branch' },
      { field: 'incomeSource', label: '收入來源', counterValue: '其他' },
    ],
    photoSlots: [],
  },
  {
    index: 18,
    submittedBy: 'Alice',
    submitAfterMinutes: 420,
    status: 'Approved',
    reviewedBy: 'Ben',
    settleAfterMinutes: 150,
    reason: '',
    fields: [{ field: 'lastName', label: 'Last Name', counterValue: 'Navaro' }],
    photoSlots: ['selfie'],
  },
  {
    index: 19,
    submittedBy: 'Ben',
    submitAfterMinutes: 275,
    status: 'Rejected',
    reviewedBy: 'Darren',
    settleAfterMinutes: 200,
    reason: '證件照模糊，無法辨識證件號碼',
    fields: [],
    photoSlots: ['front', 'back'],
  },
  {
    index: 22,
    submittedBy: 'Darren',
    submitAfterMinutes: 195,
    status: 'Approved',
    reviewedBy: 'Alice',
    settleAfterMinutes: 80,
    reason: '',
    fields: [{ field: 'birthplace', label: '出生地', counterValue: 'Manila, Philippines' }],
    photoSlots: [],
  },
  {
    index: 26,
    submittedBy: 'Alice',
    submitAfterMinutes: 360,
    status: 'Rejected',
    reviewedBy: 'Ben',
    settleAfterMinutes: 260,
    reason: '職業變更缺少在職證明',
    fields: [{ field: 'occupation', label: '職業', counterValue: '學生' }],
    photoSlots: [],
  },
  {
    index: 27,
    submittedBy: 'Ben',
    submitAfterMinutes: 210,
    status: 'Approved',
    reviewedBy: 'Darren',
    settleAfterMinutes: 130,
    reason: '',
    fields: [
      { field: 'currentAddress', label: '現住址', counterValue: '7 Legaspi Street, Makati' },
      { field: 'incomeSource', label: '收入來源', counterValue: '投資' },
    ],
    photoSlots: ['back'],
  },
  {
    index: 30,
    submittedBy: 'Darren',
    submitAfterMinutes: 285,
    status: 'Approved',
    reviewedBy: 'Ben',
    settleAfterMinutes: 110,
    reason: '',
    fields: [{ field: 'middleName', label: 'Middle Name', counterValue: 'Aquino' }],
    photoSlots: [],
  },
  {
    index: 34,
    submittedBy: 'Alice',
    submitAfterMinutes: 330,
    status: 'Rejected',
    reviewedBy: 'Darren',
    settleAfterMinutes: 175,
    reason: '重複提交，已有相同變更在複核中',
    fields: [{ field: 'currentAddress', label: '現住址', counterValue: '5 Roxas Boulevard, Manila' }],
    photoSlots: ['selfie'],
  },
];

const makeEntryFromRecord = (
  record: KycRecord,
  base: Pick<
    KycEditReviewEntry,
    'id' | 'submittedBy' | 'submittedAt' | 'changes' | 'photoChanges' | 'status' | 'reviewedBy' | 'reviewedAt' | 'reason'
  >,
): KycEditReviewEntry => ({
  ...base,
  recordKey: record.key,
  uid: record.uid,
  phone: record.phone,
  firstName: record.firstName,
  middleName: record.middleName,
  lastName: record.lastName,
});

const pendingReviewSeed: KycEditReviewEntry[] = kycSeedData
  .filter((record) => record.pendingEdit)
  .map((record) => makeEntryFromRecord(record, {
    id: `${record.key}-review-pending`,
    submittedBy: record.pendingEdit!.submittedBy,
    submittedAt: record.pendingEdit!.submittedAt,
    changes: record.pendingEdit!.changes,
    photoChanges: record.pendingEdit!.photoChanges,
    status: 'Pending',
    reviewedBy: '',
    reviewedAt: '',
    reason: '',
  }));

const historyReviewSeed: KycEditReviewEntry[] = reviewHistoryPlans.map((plan, planIndex) => {
  const record = kycSeedData[plan.index];
  const approved = plan.status === 'Approved';
  const reviewId = `${record.key}-review-history-${planIndex}`;
  const submittedAt = shiftTime(record.reviewedAt, plan.submitAfterMinutes);
  const settledAt = shiftTime(submittedAt, plan.settleAfterMinutes);

  const changes: KycEditFieldChange[] = plan.fields.map(({ field, label, counterValue }) => {
    const liveValue = String(record[field] ?? '');
    return {
      field,
      label,
      oldValue: approved ? counterValue : liveValue,
      newValue: approved ? liveValue : counterValue,
    };
  });

  const photoChanges: KycPhotoChange[] = plan.photoSlots.map((slot) => ({
    slot,
    label: kycDocumentLabelMap[slot],
    oldImage: approved ? makeKycDocumentImage(slot, `${record.uid}・舊版`) : record.documents[slot],
    newImage: approved
      ? record.documents[slot]
      : makeKycDocumentImage(slot, `${record.uid}・新上傳（已駁回）`),
  }));

  const summary = describeEditSubmission(changes, photoChanges);

  record.changeLog.push({
    id: `${reviewId}-submit`,
    time: submittedAt,
    action: '編輯',
    statusBefore: record.status,
    statusAfter: record.status,
    reviewStatus: plan.status,
    reviewId,
    remark: summary,
    operator: plan.submittedBy,
    changes,
    photoChanges,
  });
  record.changeLog.push({
    id: `${reviewId}-settle`,
    time: settledAt,
    action: '複核',
    statusBefore: record.status,
    statusAfter: record.status,
    reviewStatus: plan.status,
    reviewId,
    remark: approved ? `核准變更：${summary}` : `駁回原因：${plan.reason}`,
    operator: plan.reviewedBy,
    changes,
    photoChanges,
  });

  return makeEntryFromRecord(record, {
    id: reviewId,
    submittedBy: plan.submittedBy,
    submittedAt,
    changes,
    photoChanges,
    status: plan.status,
    reviewedBy: plan.reviewedBy,
    reviewedAt: settledAt,
    reason: plan.reason,
  });
});

kycSeedData.forEach((record) => {
  record.changeLog.sort((a, b) => b.time.localeCompare(a.time));
});

export const kycEditReviewSeed: KycEditReviewEntry[] = [...pendingReviewSeed, ...historyReviewSeed]
  .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

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

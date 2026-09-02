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

export interface KycChangeLogEntry {
  id: string;
  time: string;
  operator: string;
  action: string;
  detail: string;
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

export const describeEditSubmission = (
  changes: KycEditFieldChange[],
  photoChanges: KycPhotoChange[],
) => {
  const parts: string[] = [];
  if (changes.length) {
    parts.push(`已提交 ${changes.length} 個欄位變更：${changes.map((change) => change.label).join('、')}`);
  }
  if (photoChanges.length) {
    parts.push(`已更新 ${photoChanges.length} 張證件照：${photoChanges.map((photo) => photo.label).join('、')}`);
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

const makePendingEdit = (
  index: number,
  uid: string,
  documents: KycDocuments,
  values: Pick<KycRecord, 'currentAddress' | 'nearestBranch' | 'occupation' | 'incomeSource'>,
): KycPendingEdit | null => {
  if (index === 0) {
    return {
      submittedBy: 'Alice',
      submittedAt: '2026-08-15 13:20:00',
      changes: [
        {
          field: 'currentAddress',
          label: '現住址',
          oldValue: values.currentAddress,
          newValue: '88 Ayala Avenue, Makati',
        },
        {
          field: 'occupation',
          label: '職業',
          oldValue: values.occupation,
          newValue: '自僱',
        },
      ],
      photoChanges: [],
    };
  }

  if (index === 1) {
    return {
      submittedBy: 'Darren',
      submittedAt: '2026-08-15 14:05:00',
      changes: [
        {
          field: 'nearestBranch',
          label: '鄰近分行',
          oldValue: values.nearestBranch,
          newValue: 'Makati Branch',
        },
        {
          field: 'occupation',
          label: '職業',
          oldValue: values.occupation,
          newValue: '受僱',
        },
      ],
      photoChanges: [makePendingPhotoChange(uid, 'front', documents)],
    };
  }

  if (index === 4) {
    return {
      submittedBy: 'Ben',
      submittedAt: '2026-08-15 15:40:00',
      changes: [
        {
          field: 'currentAddress',
          label: '現住址',
          oldValue: values.currentAddress,
          newValue: '27 Bonifacio Street, Davao City',
        },
        {
          field: 'incomeSource',
          label: '收入來源',
          oldValue: values.incomeSource,
          newValue: '生意',
        },
      ],
      photoChanges: [
        makePendingPhotoChange(uid, 'back', documents),
        makePendingPhotoChange(uid, 'selfie', documents),
      ],
    };
  }

  return null;
};

export const kycSeedData: KycRecord[] = Array.from({ length: 40 }, (_, index) => {
  const status = statusPattern[index % statusPattern.length];
  const submittedAt = getSubmittedAt(index);
  const reviewedAt = getReviewedAt(index, status);
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
  const pendingEdit = makePendingEdit(index, uid, documents, {
    currentAddress,
    nearestBranch,
    occupation,
    incomeSource,
  });
  const changeLog = makeChangeLog(index, status, reviewedAt, reviewer);

  if (pendingEdit) {
    changeLog.unshift({
      id: `log-${index + 1}-edit-submit`,
      time: pendingEdit.submittedAt,
      operator: pendingEdit.submittedBy,
      action: '提交編輯複核',
      detail: describeEditSubmission(pendingEdit.changes, pendingEdit.photoChanges),
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
    remark: status === 'Rejected'
      ? '證件影像模糊'
      : status === 'Resubmit Required'
        ? '請重新提交證件照片'
        : '',
    changeLog,
    pendingEdit,
  };
});

type ReviewHistoryPlan = {
  index: number;
  submittedBy: string;
  submittedAt: string;
  status: Exclude<KycEditReviewStatus, 'Pending'>;
  reviewedBy: string;
  reviewedAt: string;
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
    index: 2,
    submittedBy: 'Ben',
    submittedAt: '2026-08-14 09:12:00',
    status: 'Approved',
    reviewedBy: 'Darren',
    reviewedAt: '2026-08-14 10:05:00',
    reason: '',
    fields: [{ field: 'occupation', label: '職業', counterValue: '受僱' }],
    photoSlots: [],
  },
  {
    index: 3,
    submittedBy: 'Alice',
    submittedAt: '2026-08-13 11:30:00',
    status: 'Rejected',
    reviewedBy: 'Ben',
    reviewedAt: '2026-08-13 15:22:00',
    reason: '新地址與證件不符，請補件後再提交',
    fields: [{ field: 'currentAddress', label: '現住址', counterValue: '19 Katipunan Road, Quezon City' }],
    photoSlots: ['front'],
  },
  {
    index: 5,
    submittedBy: 'Darren',
    submittedAt: '2026-08-13 16:40:00',
    status: 'Approved',
    reviewedBy: 'Alice',
    reviewedAt: '2026-08-14 09:02:00',
    reason: '',
    fields: [
      { field: 'nearestBranch', label: '鄰近分行', counterValue: 'Pasay Branch' },
      { field: 'incomeSource', label: '收入來源', counterValue: '其他' },
    ],
    photoSlots: [],
  },
  {
    index: 6,
    submittedBy: 'Alice',
    submittedAt: '2026-08-12 10:05:00',
    status: 'Approved',
    reviewedBy: 'Ben',
    reviewedAt: '2026-08-12 14:18:00',
    reason: '',
    fields: [{ field: 'lastName', label: 'Last Name', counterValue: 'Delacruz' }],
    photoSlots: ['selfie'],
  },
  {
    index: 7,
    submittedBy: 'Ben',
    submittedAt: '2026-08-12 13:55:00',
    status: 'Rejected',
    reviewedBy: 'Darren',
    reviewedAt: '2026-08-12 17:30:00',
    reason: '證件照模糊，無法辨識證件號碼',
    fields: [],
    photoSlots: ['front', 'back'],
  },
  {
    index: 9,
    submittedBy: 'Darren',
    submittedAt: '2026-08-11 09:41:00',
    status: 'Approved',
    reviewedBy: 'Alice',
    reviewedAt: '2026-08-11 11:20:00',
    reason: '',
    fields: [{ field: 'birthplace', label: '出生地', counterValue: 'Manila, Philippines' }],
    photoSlots: [],
  },
  {
    index: 10,
    submittedBy: 'Alice',
    submittedAt: '2026-08-10 15:08:00',
    status: 'Rejected',
    reviewedBy: 'Ben',
    reviewedAt: '2026-08-11 09:55:00',
    reason: '職業變更缺少在職證明',
    fields: [{ field: 'occupation', label: '職業', counterValue: '自僱' }],
    photoSlots: [],
  },
  {
    index: 12,
    submittedBy: 'Ben',
    submittedAt: '2026-08-10 08:26:00',
    status: 'Approved',
    reviewedBy: 'Darren',
    reviewedAt: '2026-08-10 10:44:00',
    reason: '',
    fields: [
      { field: 'currentAddress', label: '現住址', counterValue: '7 Legaspi Street, Makati' },
      { field: 'incomeSource', label: '收入來源', counterValue: '投資' },
    ],
    photoSlots: ['back'],
  },
  {
    index: 16,
    submittedBy: 'Darren',
    submittedAt: '2026-08-09 14:12:00',
    status: 'Approved',
    reviewedBy: 'Ben',
    reviewedAt: '2026-08-09 16:30:00',
    reason: '',
    fields: [{ field: 'middleName', label: 'Middle Name', counterValue: 'Aquino' }],
    photoSlots: [],
  },
  {
    index: 18,
    submittedBy: 'Alice',
    submittedAt: '2026-08-08 10:33:00',
    status: 'Rejected',
    reviewedBy: 'Darren',
    reviewedAt: '2026-08-08 13:02:00',
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
  const changedLabels = [
    ...changes.map((change) => change.label),
    ...photoChanges.map((photo) => photo.label),
  ].join('、');

  record.changeLog.unshift({
    id: `${record.key}-history-${planIndex}-submit`,
    time: plan.submittedAt,
    operator: plan.submittedBy,
    action: '提交編輯複核',
    detail: summary,
    changes,
    photoChanges,
  });
  record.changeLog.unshift({
    id: `${record.key}-history-${planIndex}-result`,
    time: plan.reviewedAt,
    operator: plan.reviewedBy,
    action: approved ? '編輯核准' : '編輯駁回',
    detail: approved
      ? `已核准變更：${changedLabels}`
      : `駁回原因：${plan.reason}；已捨棄變更：${changedLabels}`,
    changes,
    photoChanges,
  });

  return makeEntryFromRecord(record, {
    id: `${record.key}-review-history-${planIndex}`,
    submittedBy: plan.submittedBy,
    submittedAt: plan.submittedAt,
    changes,
    photoChanges,
    status: plan.status,
    reviewedBy: plan.reviewedBy,
    reviewedAt: plan.reviewedAt,
    reason: plan.reason,
  });
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

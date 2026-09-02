import { useSyncExternalStore } from 'react';
import dayjs from 'dayjs';
import {
  describeEditSubmission,
  kycEditReviewSeed,
  kycOperators,
  kycSeedData,
  kycStatusLabelMap,
  type KycEditFieldChange,
  type KycEditReviewEntry,
  type KycPhotoChange,
  type KycRecord,
  type KycStatus,
} from '@/data/kycData';

type Listener = () => void;
type ReviewDecision = Extract<KycStatus, 'Approved' | 'Rejected' | 'Resubmit Required'>;

export const cloneSeedRecords = () => kycSeedData.map((record) => ({
  ...record,
  documents: { ...record.documents },
  changeLog: record.changeLog.map((entry) => ({
    ...entry,
    changes: entry.changes?.map((change) => ({ ...change })),
    photoChanges: entry.photoChanges?.map((photo) => ({ ...photo })),
  })),
  pendingEdit: record.pendingEdit
    ? {
        ...record.pendingEdit,
        changes: record.pendingEdit.changes.map((change) => ({ ...change })),
        photoChanges: record.pendingEdit.photoChanges.map((photo) => ({ ...photo })),
      }
    : null,
}));

export const cloneSeedReviews = () => kycEditReviewSeed.map((entry) => ({
  ...entry,
  changes: entry.changes.map((change) => ({ ...change })),
  photoChanges: entry.photoChanges.map((photo) => ({ ...photo })),
}));

export const editableFieldNames = new Set([
  'firstName',
  'middleName',
  'lastName',
  'birthday',
  'gender',
  'nationality',
  'birthplace',
  'currentAddress',
  'permanentAddress',
  'nearestBranch',
  'occupation',
  'incomeSource',
]);

export const applyEditToRecord = (
  record: KycRecord,
  changes: KycEditFieldChange[],
  photoChanges: KycPhotoChange[],
): KycRecord => {
  const liveChanges = Object.fromEntries(
    changes
      .filter((change) => editableFieldNames.has(change.field))
      .map((change) => [change.field, change.newValue]),
  ) as Partial<KycRecord>;
  const documents = { ...record.documents };
  photoChanges.forEach((photo) => {
    documents[photo.slot] = photo.newImage;
  });
  return { ...record, ...liveChanges, documents };
};

let records: KycRecord[] = cloneSeedRecords();
let reviews: KycEditReviewEntry[] = cloneSeedReviews();
let currentOperator: string = kycOperators[0];
const listeners = new Set<Listener>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

export const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getSnapshot = () => records;
export const getServerSnapshot = () => records;
export const getReviewsSnapshot = () => reviews;
export const getCurrentOperator = () => currentOperator;

export const setCurrentOperator = (operator: string) => {
  if (currentOperator === operator) return;
  currentOperator = operator;
  notify();
};

export const reset = () => {
  records = cloneSeedRecords();
  reviews = cloneSeedReviews();
  notify();
};

/** 送出編輯：寫入待複核狀態、異動記錄，並產生一筆待複核條目。 */
export const submitEdit = (
  key: string,
  operator: string,
  changes: KycEditFieldChange[],
  photoChanges: KycPhotoChange[],
) => {
  const target = records.find((record) => record.key === key);
  if (!target || target.pendingEdit) return;

  const submittedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const detail = describeEditSubmission(changes, photoChanges);

  records = records.map((record) => (
    record.key === key
      ? {
          ...record,
          pendingEdit: { submittedBy: operator, submittedAt, changes, photoChanges },
          changeLog: [
            {
              id: `${record.key}-edit-submit-${submittedAt}`,
              time: submittedAt,
              operator,
              action: '提交編輯複核',
              detail,
              changes,
              photoChanges,
            },
            ...record.changeLog,
          ],
        }
      : record
  ));

  reviews = [
    {
      id: `${key}-review-${submittedAt}`,
      recordKey: key,
      uid: target.uid,
      phone: target.phone,
      firstName: target.firstName,
      middleName: target.middleName,
      lastName: target.lastName,
      submittedBy: operator,
      submittedAt,
      changes,
      photoChanges,
      status: 'Pending',
      reviewedBy: '',
      reviewedAt: '',
      reason: '',
    },
    ...reviews,
  ];

  notify();
};

export const reviewStatus = (
  key: string,
  decision: ReviewDecision,
  operator: string,
  remark: string,
) => {
  const reviewedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const action = decision === 'Approved' ? '審核通過' : decision === 'Rejected' ? '審核駁回' : '要求重新提交';
  const detail = remark || (decision === 'Approved' ? '身份資料與證件驗證通過' : kycStatusLabelMap[decision]);

  records = records.map((record) => (
    record.key === key
      ? {
          ...record,
          status: decision,
          reviewer: operator,
          reviewedAt,
          remark,
          changeLog: [
            {
              id: `${record.key}-${reviewedAt}`,
              time: reviewedAt,
              operator,
              action,
              detail,
            },
            ...record.changeLog,
          ],
        }
      : record
  ));
  notify();
};

const settleEdit = (
  reviewId: string,
  operator: string,
  approved: boolean,
  reason: string,
) => {
  const entry = reviews.find((review) => review.id === reviewId);
  if (!entry || entry.status !== 'Pending') return;

  const reviewedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const changedLabels = [
    ...entry.changes.map((change) => change.label),
    ...entry.photoChanges.map((photo) => photo.label),
  ].join('、');

  records = records.map((record) => {
    if (record.key !== entry.recordKey) return record;
    const base = approved
      ? applyEditToRecord(record, entry.changes, entry.photoChanges)
      : record;
    return {
      ...base,
      pendingEdit: null,
      changeLog: [
        {
          id: `${record.key}-edit-${approved ? 'approved' : 'rejected'}-${reviewedAt}`,
          time: reviewedAt,
          operator,
          action: approved ? '編輯核准' : '編輯駁回',
          detail: approved
            ? `已核准變更：${changedLabels}`
            : `駁回原因：${reason}；已捨棄變更：${changedLabels}`,
          changes: entry.changes,
          photoChanges: entry.photoChanges,
        },
        ...record.changeLog,
      ],
    };
  });

  reviews = reviews.map((review) => (
    review.id === reviewId
      ? {
          ...review,
          status: approved ? 'Approved' : 'Rejected',
          reviewedBy: operator,
          reviewedAt,
          reason: approved ? '' : reason,
        }
      : review
  ));

  notify();
};

export const approveEdit = (reviewId: string, operator: string) => {
  settleEdit(reviewId, operator, true, '');
};

export const rejectEdit = (reviewId: string, operator: string, reason: string) => {
  settleEdit(reviewId, operator, false, reason);
};

export const useKycRecords = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

export const useKycEditReviews = () => useSyncExternalStore(
  subscribe,
  getReviewsSnapshot,
  getReviewsSnapshot,
);

export const useKycCurrentOperator = () => useSyncExternalStore(
  subscribe,
  getCurrentOperator,
  getCurrentOperator,
);

export const kycStore = {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  getReviewsSnapshot,
  getCurrentOperator,
  setCurrentOperator,
  reset,
  submitEdit,
  reviewStatus,
  approveEdit,
  rejectEdit,
};

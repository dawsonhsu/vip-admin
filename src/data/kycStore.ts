import { useSyncExternalStore } from 'react';
import dayjs from 'dayjs';
import {
  kycSeedData,
  kycStatusLabelMap,
  type KycRecord,
  type KycStatus,
} from '@/data/kycData';

type Listener = () => void;
type ReviewDecision = Extract<KycStatus, 'Approved' | 'Rejected' | 'Resubmit Required'>;

export const cloneSeedRecords = () => kycSeedData.map((record) => ({
  ...record,
  changeLog: record.changeLog.map((entry) => ({
    ...entry,
    changes: entry.changes?.map((change) => ({ ...change })),
  })),
  pendingEdit: record.pendingEdit
    ? { ...record.pendingEdit, changes: record.pendingEdit.changes.map((change) => ({ ...change })) }
    : null,
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

export const applyPendingEdit = (record: KycRecord): KycRecord => {
  if (!record.pendingEdit) return record;
  const liveChanges = Object.fromEntries(
    record.pendingEdit.changes
      .filter((change) => editableFieldNames.has(change.field))
      .map((change) => [change.field, change.newValue]),
  ) as Partial<KycRecord>;
  return { ...record, ...liveChanges };
};

let records: KycRecord[] = cloneSeedRecords();
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

export const reset = () => {
  records = cloneSeedRecords();
  notify();
};

export const saveEdit = (updated: KycRecord) => {
  records = records.map((record) => (record.key === updated.key ? updated : record));
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

export const approveEdit = (key: string, operator: string) => {
  const reviewedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');

  records = records.map((record) => {
    if (record.key !== key || !record.pendingEdit) return record;
    const changes = record.pendingEdit.changes;
    const changedFields = changes.map((change) => change.label).join('、');
    const updatedRecord = applyPendingEdit(record);
    return {
      ...updatedRecord,
      pendingEdit: null,
      changeLog: [
        {
          id: `${record.key}-edit-approved-${reviewedAt}`,
          time: reviewedAt,
          operator,
          action: '編輯核准',
          detail: `已核准欄位：${changedFields}`,
          changes,
        },
        ...record.changeLog,
      ],
    };
  });
  notify();
};

export const rejectEdit = (key: string, operator: string, reason: string) => {
  const reviewedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');

  records = records.map((record) => {
    if (record.key !== key || !record.pendingEdit) return record;
    const changes = record.pendingEdit.changes;
    const changedFields = changes.map((change) => change.label).join('、');
    return {
      ...record,
      pendingEdit: null,
      changeLog: [
        {
          id: `${record.key}-edit-rejected-${reviewedAt}`,
          time: reviewedAt,
          operator,
          action: '編輯駁回',
          detail: `駁回原因：${reason}；已捨棄欄位：${changedFields}`,
          changes,
        },
        ...record.changeLog,
      ],
    };
  });
  notify();
};

export const useKycRecords = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

export const kycStore = {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  reset,
  saveEdit,
  reviewStatus,
  approveEdit,
  rejectEdit,
};

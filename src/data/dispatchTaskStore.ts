import dayjs from 'dayjs';
import {
  mockDispatchTasks,
  vendorErrorCodes,
  type BatchDispatchStatus,
  type BatchDispatchTask,
  type BatchIdentifierType,
  type BatchResolvedSourceEntry,
  type BatchResultRow,
} from '@/data/mockData';

export interface CreateDispatchTaskInput {
  activityName: string;
  total: number;
  entries: BatchResolvedSourceEntry[];
  formValues: Record<string, unknown>;
  identifierType?: BatchIdentifierType;
}

type Listener = () => void;
type ProcessingInterval = ReturnType<typeof setInterval>;

let tasks: BatchDispatchTask[] = [...mockDispatchTasks];
let taskSequence = 1000 + Math.floor(Math.random() * 8000);
const listeners = new Set<Listener>();
const processingIntervals = new Map<string, ProcessingInterval>();

export const batchDispatchStatusMap: Record<BatchDispatchStatus, { label: string; color: string }> = {
  processing: { label: '處理中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  partial_failed: { label: '部分失敗', color: 'warning' },
  failed: { label: '全部失敗', color: 'error' },
};

const notify = () => {
  listeners.forEach((listener) => listener());
};

const createBatchTaskId = () => {
  taskSequence += 1;
  return `BAT-${dayjs().format('YYYYMMDD')}-${String(taskSequence).slice(-4)}`;
};

const startDispatchTask = (task: BatchDispatchTask) => {
  if (processingIntervals.has(task.id)) return;

  const totalTicks = 12;
  let tick = 0;
  let processed = 0;
  let successCount = 0;
  const failedList: BatchResultRow[] = [];

  const intervalId = setInterval(() => {
    tick += 1;
    const targetProcessed = tick >= totalTicks
      ? task.total
      : Math.floor((task.total * tick) / totalTicks);
    const entriesToProcess = task.config.entries.slice(processed, targetProcessed);

    entriesToProcess.forEach((entry, offset) => {
      const index = processed + offset;
      const playerId = entry.playerId ?? null;

      if (playerId === null) {
        failedList.push({
          key: `${task.id}-failed-${index}`,
          identifierRaw: entry.identifier,
          userId: null,
          status: 'failed',
          failureReason: '會員不存在',
        });
        return;
      }

      if (Math.random() < 0.14) {
        const vendorErrorCode = vendorErrorCodes[Math.floor(Math.random() * vendorErrorCodes.length)];
        failedList.push({
          key: `${task.id}-failed-${index}`,
          identifierRaw: entry.identifier,
          userId: playerId,
          status: 'failed',
          failureReason: `供應商回傳失敗（${vendorErrorCode}）`,
        });
        return;
      }

      successCount += 1;
    });

    processed = targetProcessed;
    const isFinished = processed >= task.total;
    const failedCount = failedList.length;
    const status: BatchDispatchStatus = !isFinished
      ? 'processing'
      : successCount === task.total
        ? 'completed'
        : successCount === 0
          ? 'failed'
          : 'partial_failed';

    tasks = tasks.map((currentTask) => (
      currentTask.id === task.id
        ? {
            ...currentTask,
            processed,
            successCount,
            failedCount,
            failedList: [...failedList],
            status,
            finishedAt: isFinished ? dayjs().format('YYYY-MM-DD HH:mm:ss') : null,
          }
        : currentTask
    ));
    notify();

    if (isFinished) {
      clearInterval(intervalId);
      processingIntervals.delete(task.id);
    }
  }, 350);

  processingIntervals.set(task.id, intervalId);
};

export const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getSnapshot = () => tasks;
export const getServerSnapshot = () => tasks;

export const createTask = (input: CreateDispatchTaskInput) => {
  const task: BatchDispatchTask = {
    id: createBatchTaskId(),
    activityName: input.activityName,
    operator: 'darren@filbetph.com',
    submittedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    finishedAt: null,
    total: input.total,
    processed: 0,
    successCount: 0,
    failedCount: 0,
    status: 'processing',
    failedList: [],
    config: {
      identifierType: input.identifierType ?? 'uid',
      entries: input.entries.map((entry) => ({ ...entry })),
      formValues: { ...input.formValues },
    },
  };

  tasks = [task, ...tasks];
  notify();
  startDispatchTask(task);
  return task;
};

export const retryFailed = (taskId: string) => {
  const parentTask = tasks.find((task) => task.id === taskId);
  if (!parentTask || parentTask.failedList.length === 0) return null;

  const entries = parentTask.failedList.map((row) => {
    const originalEntry = parentTask.config.entries.find(
      (entry) => entry.identifier === row.identifierRaw
    );
    return originalEntry
      ? {
          identifier: originalEntry.identifier,
          spinOverride: originalEntry.spinOverride,
          playerId: originalEntry.playerId,
        }
      : {
          identifier: row.identifierRaw,
          spinOverride: null,
          playerId: row.userId ?? null,
        };
  });

  return createTask({
    activityName: parentTask.activityName,
    total: entries.length,
    entries,
    formValues: parentTask.config.formValues,
    identifierType: parentTask.config.identifierType,
  });
};

export const dispatchTaskStore = {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  createTask,
  retryFailed,
};

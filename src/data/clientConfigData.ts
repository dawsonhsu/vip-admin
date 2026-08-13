import dayjs, { type Dayjs } from 'dayjs';

export interface ComplianceConfig {
  /** 手動強制開啟：true = 立即強制合規開；false = 不強制（交由排程判定） */
  manualEnabled: boolean;
  /** 是否啟用排程 */
  scheduleEnabled: boolean;
  /** 排程日期範圍 'YYYY-MM-DD' */
  scheduleDateStart: string;
  scheduleDateEnd: string;
  /** 排程每日時段 'HH:mm:ss'（同日窗口，結束需晚於開始） */
  scheduleTimeStart: string;
  scheduleTimeEnd: string;
}

export interface ComplianceGameRow {
  key: string;
  gameId: string;
  gameNameEn: string;
  isCompliant: string;
}

export const defaultComplianceConfig: ComplianceConfig = {
  manualEnabled: false,
  scheduleEnabled: true,
  scheduleDateStart: '2026-03-01',
  scheduleDateEnd: '2026-04-30',
  scheduleTimeStart: '08:00:00',
  scheduleTimeEnd: '18:00:00',
};

export const defaultFirstDepositAmount = 500;

export const complianceGameTemplateRows: ComplianceGameRow[] = [
  {
    key: 'compliance-game-10001',
    gameId: '10001',
    gameNameEn: 'Fortune Gems',
    isCompliant: '是',
  },
];

export const clientConfigTabLabels: string[] = [
  '頂部banner',
  '中間banner',
  '加載頁banner',
  '站點logo',
  '首頁彈窗',
  '自媒體號',
  '底部公示',
  '版本號管理',
  'pagor聲明',
  'Terms of Services',
  'Privacy Policy',
  'FAQ',
  'VIP',
  'rewards(welfare)',
  '充值倍率設置',
  '登錄素材',
  '三方登錄開關',
  '合規開關',
  '門店客戶端',
];

// ---- Compliance effective-state resolution (shared by the page + the header) ----

export interface ComplianceResolveInput {
  manualEnabled?: boolean;
  scheduleEnabled?: boolean;
  dateStart?: Dayjs | null;
  dateEnd?: Dayjs | null;
  timeStart?: Dayjs | null;
  timeEnd?: Dayjs | null;
}

export interface ComplianceEffective {
  open: boolean;
  label: string;
}

const secondsOfDay = (d: Dayjs) => d.hour() * 3600 + d.minute() * 60 + d.second();

// Resolved compliance state = 手動強制開啟 OR 排程時段內.
// Manual only forces ON; manual-off has no power (never forces OFF), so there is
// no manual-vs-schedule conflict — off means "let the schedule decide".
export const resolveCompliance = (input: ComplianceResolveInput, now: Dayjs): ComplianceEffective => {
  const manualOn = !!input.manualEnabled;

  let scheduleActive = false;
  let scheduleReason = '';
  let dailyWindow = '';
  if (input.scheduleEnabled && input.dateStart && input.dateEnd && input.timeStart && input.timeEnd) {
    const dateStart = input.dateStart.startOf('day');
    const dateEnd = input.dateEnd.endOf('day');
    const inDate =
      (now.isAfter(dateStart) || now.isSame(dateStart)) &&
      (now.isBefore(dateEnd) || now.isSame(dateEnd));
    const nowSec = secondsOfDay(now);
    const inTime = nowSec >= secondsOfDay(input.timeStart) && nowSec <= secondsOfDay(input.timeEnd);
    scheduleActive = inDate && inTime;
    dailyWindow = `${input.timeStart.format('HH:mm')}~${input.timeEnd.format('HH:mm')}`;
    if (!inDate) {
      scheduleReason = now.isBefore(dateStart) ? '排程未開始' : '排程已結束';
    } else if (!inTime) {
      scheduleReason = `非每日時段（每日 ${dailyWindow} 才開啟）`;
    }
  }

  const open = manualOn || scheduleActive;
  let label: string;
  if (open) {
    if (manualOn && scheduleActive) label = '開啟中（手動＋排程時段內）';
    else if (manualOn) label = '開啟中（手動強制開啟）';
    else label = `開啟中（排程時段內，每日 ${dailyWindow}）`;
  } else if (!input.scheduleEnabled) {
    label = '關閉（手動關、未啟用排程）';
  } else {
    label = `關閉（${scheduleReason || '排程外'}）`;
  }
  return { open, label };
};

// Build a resolve-input from the saved config. Time strings are split manually
// (not parsed via dayjs custom format) so this works regardless of which dayjs
// plugins happen to be loaded on the current page.
export const complianceInputFromConfig = (cfg: ComplianceConfig): ComplianceResolveInput => {
  const parseTimeOfDay = (value: string): Dayjs => {
    const [h, m, s] = value.split(':').map((part) => Number(part) || 0);
    return dayjs().hour(h).minute(m).second(s).millisecond(0);
  };
  return {
    manualEnabled: cfg.manualEnabled,
    scheduleEnabled: cfg.scheduleEnabled,
    dateStart: dayjs(cfg.scheduleDateStart),
    dateEnd: dayjs(cfg.scheduleDateEnd),
    timeStart: parseTimeOfDay(cfg.scheduleTimeStart),
    timeEnd: parseTimeOfDay(cfg.scheduleTimeEnd),
  };
};

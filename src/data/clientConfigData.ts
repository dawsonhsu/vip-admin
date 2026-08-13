export type ComplianceMode = 'manual' | 'schedule';

export interface ComplianceConfig {
  /** 立即手動 or 排程時間 — mutually exclusive */
  mode: ComplianceMode;
  /** used when mode === 'manual' */
  manualEnabled: boolean;
  /** used when mode === 'schedule', 'YYYY-MM-DD HH:mm:ss' */
  scheduleStart: string;
  scheduleEnd: string;
}

export interface ComplianceGameRow {
  key: string;
  gameId: string;
  gameNameEn: string;
  isCompliant: string;
}

export const defaultComplianceConfig: ComplianceConfig = {
  mode: 'schedule',
  manualEnabled: false,
  scheduleStart: '2026-03-01 08:00:00',
  scheduleEnd: '2026-04-30 08:00:00',
};

export const defaultFirstDepositAmount = 500;

export const complianceModeOptions: Array<{ value: ComplianceMode; label: string }> = [
  { value: 'manual', label: '立即手動' },
  { value: 'schedule', label: '排程時間' },
];

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

export type ComplianceStatus = 'enabled' | 'disabled';

export interface ComplianceConfig {
  frontStatus: ComplianceStatus;
  backStatus: ComplianceStatus;
  deadlineStart: string;
  deadlineEnd: string;
}

export interface ComplianceGameRow {
  key: string;
  gameId: string;
  gameNameEn: string;
  isCompliant: string;
}

export const defaultComplianceConfig: ComplianceConfig = {
  frontStatus: 'disabled',
  backStatus: 'disabled',
  deadlineStart: '2026-03-01 08:00:00',
  deadlineEnd: '2026-04-30 08:00:00',
};

export const defaultFirstDepositAmount = 500;

export const complianceStatusOptions: Array<{ value: ComplianceStatus; label: string }> = [
  { value: 'enabled', label: '啟用' },
  { value: 'disabled', label: '禁用' },
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

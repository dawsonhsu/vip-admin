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

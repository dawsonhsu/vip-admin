export type ClientType = 'PC' | 'H5' | 'Android' | 'iOS';

export interface DepositChannel {
  id: number;
  channelId: string;
  nameEn: string;
  nameTa: string;
  category: string;
  iconUrl: string;
  callMode: '輪詢' | '一般';
  weight: number;
  status: boolean;
  clientTypes: ClientType[];
  amountMin: number;
  amountMax: number;
  firstDepositButtons: number[];     // 首充金額按鈕清單
  repeatDepositButtons: number[];    // 復充金額按鈕清單
  visibleVipLevels: string[];        // 可見會員等級範圍，['ALL'] 代表全部
  visibleRiskLabels: string[];       // 可見會員風控標籤，空 = 不限制 (FAT 預設為 "-")
  /** 新增欄位：渠道包專屬 (packageScope)，本 PRD 重點。
   *  - 空字串（預設）：所有客戶端皆可見
   *  - 字串 (例 "huawei")：僅 source / X-App-Package header 為相同字串的客戶端可見
   */
  packageScope: string;
  /** 扣除金額比例 (%)，僅 Huawei IAP 渠道適用。會員實際到帳金額 = 存款金額 * (1 - deductionRatio/100) */
  deductionRatio?: number;
  lastUpdatedAt: string;
  updatedBy: string;
}

export interface DepositMerchantConfigItem {
  key: string;
  value: string;
}

export interface DepositMerchant {
  id: number;
  merchantId: string;
  nameEn: string;
  nameTa: string;
  channelName: string;
  weight: number;
  amountMin: number;
  amountMax: number;
  status: boolean;
  autoCloseEnabled: boolean;
  autoCloseHours: number;
  visibleVipLevels: string[];
  visibleRiskLabels: string[];
  successRate100: number | null;     // 近 100 單成功率 (%)
  arrivalTime100: number | null;     // 近 100 單到帳時間 (秒)
  configs: DepositMerchantConfigItem[];
  lastUpdatedAt: string;
  updatedBy: string;
}

export const VIP_LEVEL_OPTIONS = ['ALL', 'V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
export const RISK_LABEL_OPTIONS = ['套利會員', '高風險', '黑名單觀察', '正常'];

const DEFAULT_FIRST = [100, 200, 500, 1000];
const DEFAULT_REPEAT = [200, 500, 1000, 2000, 5000];

export const depositChannels: DepositChannel[] = [
  { id: 1, channelId: '47870534954254469', nameEn: 'Gcash', nameTa: 'Gcash', category: 'GCash', iconUrl: '', callMode: '輪詢', weight: 1, status: true, clientTypes: ['PC', 'H5', 'Android', 'iOS'], amountMin: 50, amountMax: 1000000, firstDepositButtons: [100, 200, 500, 1000], repeatDepositButtons: [200, 500, 1000, 2000, 5000], visibleVipLevels: ['ALL'], visibleRiskLabels: [], packageScope: '', lastUpdatedAt: '2026-06-05 13:13:17', updatedBy: 'davinci@filbetph.com' },
  { id: 2, channelId: '47870545347477637', nameEn: 'mayaaaaa', nameTa: 'maya', category: 'Maya', iconUrl: '', callMode: '一般', weight: 1, status: true, clientTypes: ['PC', 'H5', 'Android', 'iOS'], amountMin: 100, amountMax: 50000, firstDepositButtons: [100, 200, 500], repeatDepositButtons: [200, 500, 1000], visibleVipLevels: ['ALL'], visibleRiskLabels: [], packageScope: '', lastUpdatedAt: '2026-06-04 11:11:35', updatedBy: 'davinci@filbetph.com' },
  { id: 3, channelId: '54831891597028330', nameEn: 'QRPH', nameTa: 'QRPH', category: 'QRPH', iconUrl: '', callMode: '輪詢', weight: 10, status: true, clientTypes: ['PC', 'H5', 'Android', 'iOS'], amountMin: 100, amountMax: 500000, firstDepositButtons: DEFAULT_FIRST, repeatDepositButtons: DEFAULT_REPEAT, visibleVipLevels: ['ALL'], visibleRiskLabels: [], packageScope: '', lastUpdatedAt: '2026-06-04 10:22:01', updatedBy: 'davinci@filbetph.com' },
  { id: 4, channelId: '55277859459099626', nameEn: 'GRAB', nameTa: 'GRAB', category: 'GrabPay', iconUrl: '', callMode: '一般', weight: 50, status: false, clientTypes: ['PC', 'H5', 'Android', 'iOS'], amountMin: 100, amountMax: 30000, firstDepositButtons: DEFAULT_FIRST, repeatDepositButtons: DEFAULT_REPEAT, visibleVipLevels: ['ALL'], visibleRiskLabels: [], packageScope: '', lastUpdatedAt: '2026-06-03 16:01:00', updatedBy: 'davinci@filbetph.com' },
  { id: 5, channelId: '55278060248820716', nameEn: 'PALAWAN', nameTa: 'PALAWAN', category: 'Palawan', iconUrl: '', callMode: '一般', weight: 80, status: false, clientTypes: ['H5', 'Android', 'iOS'], amountMin: 200, amountMax: 100000, firstDepositButtons: DEFAULT_FIRST, repeatDepositButtons: DEFAULT_REPEAT, visibleVipLevels: ['ALL'], visibleRiskLabels: [], packageScope: '', lastUpdatedAt: '2026-06-02 09:30:11', updatedBy: 'davinci@filbetph.com' },
  { id: 6, channelId: '61638710873091051', nameEn: 'INSTA', nameTa: 'INSTA', category: 'InstaPay', iconUrl: '', callMode: '一般', weight: 1, status: true, clientTypes: ['PC', 'H5', 'Android', 'iOS'], amountMin: 100, amountMax: 200000, firstDepositButtons: DEFAULT_FIRST, repeatDepositButtons: DEFAULT_REPEAT, visibleVipLevels: ['ALL'], visibleRiskLabels: [], packageScope: '', lastUpdatedAt: '2026-06-02 09:31:08', updatedBy: 'davinci@filbetph.com' },
  { id: 7, channelId: '61638710873091052', nameEn: 'PESONET', nameTa: 'PESONET', category: 'PesoNet', iconUrl: '', callMode: '一般', weight: 1, status: false, clientTypes: ['PC', 'H5', 'Android', 'iOS'], amountMin: 500, amountMax: 1000000, firstDepositButtons: DEFAULT_FIRST, repeatDepositButtons: DEFAULT_REPEAT, visibleVipLevels: ['ALL'], visibleRiskLabels: [], packageScope: '', lastUpdatedAt: '2026-06-02 09:31:42', updatedBy: 'davinci@filbetph.com' },
  // 範例：華為包專屬渠道（packageScope = "huawei"）
  { id: 99, channelId: 'HW-IAP-2026', nameEn: 'Huawei IAP', nameTa: 'Huawei IAP', category: 'Huawei IAP', iconUrl: '', callMode: '一般', weight: 1, status: true, clientTypes: ['Android'], amountMin: 100, amountMax: 10000, firstDepositButtons: [100, 300, 500], repeatDepositButtons: [100, 300, 500, 1000, 3000, 5000], visibleVipLevels: ['ALL'], visibleRiskLabels: [], packageScope: 'huawei', deductionRatio: 30, lastUpdatedAt: '2026-06-12 22:00:00', updatedBy: 'darren@filbetph.com' },
];

export const depositMerchants: DepositMerchant[] = [
  { id: 1, merchantId: '1005', nameEn: 'gcasha_hipay', nameTa: 'gcasha_hipay', channelName: 'Gcash', weight: 2, amountMin: 200, amountMax: 5000000, status: true, autoCloseEnabled: false, autoCloseHours: 1, visibleVipLevels: ['ALL'], visibleRiskLabels: [], successRate100: null, arrivalTime100: null, configs: [{ key: 'merchant_no', value: 'GCASH_HIPAY_001' }], lastUpdatedAt: '2026-06-05 13:12:27', updatedBy: 'davinci@filbetph.com' },
  { id: 2, merchantId: '1101', nameEn: 'gcash_paycools', nameTa: 'gcash_paycools', channelName: 'Gcash', weight: 2, amountMin: 100, amountMax: 8000, status: true, autoCloseEnabled: false, autoCloseHours: 1, visibleVipLevels: ['ALL'], visibleRiskLabels: [], successRate100: null, arrivalTime100: null, configs: [], lastUpdatedAt: '2026-06-05 13:12:15', updatedBy: 'davinci@filbetph.com' },
  { id: 3, merchantId: '1201', nameEn: 'qrph_paycools', nameTa: 'qrph_paycools', channelName: 'QRPH', weight: 2, amountMin: 100, amountMax: 5000000, status: true, autoCloseEnabled: false, autoCloseHours: 1, visibleVipLevels: ['ALL'], visibleRiskLabels: [], successRate100: null, arrivalTime100: null, configs: [], lastUpdatedAt: '2026-06-05 13:11:02', updatedBy: 'davinci@filbetph.com' },
  { id: 4, merchantId: '1001', nameEn: 'maya_paycools', nameTa: 'maya_paycools', channelName: 'Maya', weight: 2, amountMin: 1, amountMax: 5000, status: true, autoCloseEnabled: false, autoCloseHours: 1, visibleVipLevels: ['ALL'], visibleRiskLabels: [], successRate100: null, arrivalTime100: null, configs: [], lastUpdatedAt: '2026-06-05 13:10:50', updatedBy: 'davinci@filbetph.com' },
  { id: 5, merchantId: '1212', nameEn: 'magicPay_gcash', nameTa: 'magicPay_gcash', channelName: 'Gcash', weight: 89, amountMin: 100, amountMax: 20000000, status: true, autoCloseEnabled: false, autoCloseHours: 1, visibleVipLevels: ['ALL'], visibleRiskLabels: [], successRate100: null, arrivalTime100: null, configs: [], lastUpdatedAt: '2026-06-05 13:10:08', updatedBy: 'davinci@filbetph.com' },
  { id: 6, merchantId: '1207', nameEn: 'sevenElevenPaycools', nameTa: 'sevenElevenPaycools', channelName: '7-11', weight: 2, amountMin: 100, amountMax: 5000000, status: false, autoCloseEnabled: false, autoCloseHours: 1, visibleVipLevels: ['ALL'], visibleRiskLabels: [], successRate100: null, arrivalTime100: null, configs: [], lastUpdatedAt: '2026-06-04 09:21:13', updatedBy: 'davinci@filbetph.com' },
  { id: 7, merchantId: '1206', nameEn: 'coins_paycools', nameTa: 'coins_paycools', channelName: 'COINS', weight: 2, amountMin: 100, amountMax: 5000000, status: false, autoCloseEnabled: false, autoCloseHours: 1, visibleVipLevels: ['ALL'], visibleRiskLabels: [], successRate100: null, arrivalTime100: null, configs: [], lastUpdatedAt: '2026-06-04 09:20:30', updatedBy: 'davinci@filbetph.com' },
  // 範例：華為包專屬商戶
  { id: 99, merchantId: '9901', nameEn: 'huawei_iap_appgallery', nameTa: 'huawei_iap_appgallery', channelName: 'Huawei IAP', weight: 1, amountMin: 100, amountMax: 10000, status: true, autoCloseEnabled: true, autoCloseHours: 1, visibleVipLevels: ['ALL'], visibleRiskLabels: [], successRate100: null, arrivalTime100: null, configs: [{ key: 'app_id', value: 'AGC_APP_ID' }, { key: 'client_id', value: 'OAUTH_CLIENT_ID' }, { key: 'public_key', value: 'IAP_PUBLIC_KEY' }], lastUpdatedAt: '2026-06-12 22:00:00', updatedBy: 'darren@filbetph.com' },
];

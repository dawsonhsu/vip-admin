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
  /** 新增欄位：華為包專屬渠道。
   *  - false（預設）：非華為包用戶才看得到
   *  - true：僅華為包用戶可見，且付款走 Huawei IAP
   */
  huaweiExclusive: boolean;
  amountMin: number;
  amountMax: number;
  visible: boolean;
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
  autoCloseHours: number | null;
  visibleVipLevels: string;
}

export const depositChannels: DepositChannel[] = [
  { id: 1, channelId: '47870534954254469', nameEn: 'Gcash', nameTa: 'Gcash', category: 'GCash', iconUrl: '/icons/gcash.png', callMode: '輪詢', weight: 1, status: true, clientTypes: ['PC', 'H5', 'Android', 'iOS'], huaweiExclusive: false, amountMin: 50, amountMax: 1000000, visible: true },
  { id: 2, channelId: '47870545347477637', nameEn: 'mayaaaaa', nameTa: 'maya', category: 'Maya', iconUrl: '/icons/maya.png', callMode: '一般', weight: 1, status: true, clientTypes: ['PC', 'H5', 'Android', 'iOS'], huaweiExclusive: false, amountMin: 100, amountMax: 50000, visible: true },
  { id: 3, channelId: '54831891597028330', nameEn: 'QRPH', nameTa: 'QRPH', category: 'QRPH', iconUrl: '/icons/qrph.png', callMode: '輪詢', weight: 10, status: true, clientTypes: ['PC', 'H5', 'Android', 'iOS'], huaweiExclusive: false, amountMin: 100, amountMax: 500000, visible: true },
  { id: 4, channelId: '55277859459099626', nameEn: 'GRAB', nameTa: 'GRAB', category: 'GrabPay', iconUrl: '/icons/grab.png', callMode: '一般', weight: 50, status: false, clientTypes: ['PC', 'H5', 'Android', 'iOS'], huaweiExclusive: false, amountMin: 100, amountMax: 30000, visible: true },
  { id: 5, channelId: '55278060248820716', nameEn: 'PALAWAN', nameTa: 'PALAWAN', category: 'Palawan', iconUrl: '/icons/palawan.png', callMode: '一般', weight: 80, status: false, clientTypes: ['H5', 'Android', 'iOS'], huaweiExclusive: false, amountMin: 200, amountMax: 100000, visible: true },
  { id: 6, channelId: '61638710873091051', nameEn: 'INSTA', nameTa: 'INSTA', category: 'InstaPay', iconUrl: '/icons/insta.png', callMode: '一般', weight: 1, status: true, clientTypes: ['PC', 'H5', 'Android', 'iOS'], huaweiExclusive: false, amountMin: 100, amountMax: 200000, visible: true },
  { id: 7, channelId: '61638710873091052', nameEn: 'PESONET', nameTa: 'PESONET', category: 'PesoNet', iconUrl: '/icons/pesonet.png', callMode: '一般', weight: 1, status: false, clientTypes: ['PC', 'H5', 'Android', 'iOS'], huaweiExclusive: false, amountMin: 500, amountMax: 1000000, visible: true },
  // 範例：華為包專屬渠道（新增）
  { id: 99, channelId: 'HW-IAP-2026', nameEn: 'Huawei IAP', nameTa: 'Huawei IAP', category: 'Huawei IAP', iconUrl: '/icons/huawei.png', callMode: '一般', weight: 1, status: true, clientTypes: ['Android'], huaweiExclusive: true, amountMin: 100, amountMax: 10000, visible: true },
];

export const depositMerchants: DepositMerchant[] = [
  { id: 1, merchantId: '1005', nameEn: 'gcasha_hipay', nameTa: 'gcasha_hipay', channelName: 'Gcash', weight: 2, amountMin: 200, amountMax: 5000000, status: true, autoCloseHours: null, visibleVipLevels: '全部' },
  { id: 2, merchantId: '1101', nameEn: 'gcash_paycools', nameTa: 'gcash_paycools', channelName: 'Gcash', weight: 2, amountMin: 100, amountMax: 8000, status: true, autoCloseHours: null, visibleVipLevels: '全部' },
  { id: 3, merchantId: '1201', nameEn: 'qrph_paycools', nameTa: 'qrph_paycools', channelName: 'QRPH', weight: 2, amountMin: 100, amountMax: 5000000, status: true, autoCloseHours: null, visibleVipLevels: '全部' },
  { id: 4, merchantId: '1001', nameEn: 'maya_paycools', nameTa: 'maya_paycools', channelName: 'Maya', weight: 2, amountMin: 1, amountMax: 5000, status: true, autoCloseHours: null, visibleVipLevels: '全部' },
  { id: 5, merchantId: '1212', nameEn: 'magicPay_gcash', nameTa: 'magicPay_gcash', channelName: 'Gcash', weight: 89, amountMin: 100, amountMax: 20000000, status: true, autoCloseHours: null, visibleVipLevels: '全部' },
  { id: 6, merchantId: '1207', nameEn: 'sevenElevenPaycools', nameTa: 'sevenElevenPaycools', channelName: '7-11', weight: 2, amountMin: 100, amountMax: 5000000, status: false, autoCloseHours: null, visibleVipLevels: '全部' },
  { id: 7, merchantId: '1206', nameEn: 'coins_paycools', nameTa: 'coins_paycools', channelName: 'COINS', weight: 2, amountMin: 100, amountMax: 5000000, status: false, autoCloseHours: null, visibleVipLevels: '全部' },
  // 範例：華為包專屬商戶
  { id: 99, merchantId: '9901', nameEn: 'huawei_iap_appgallery', nameTa: 'huawei_iap_appgallery', channelName: 'Huawei IAP', weight: 1, amountMin: 100, amountMax: 10000, status: true, autoCloseHours: 1, visibleVipLevels: '全部' },
];

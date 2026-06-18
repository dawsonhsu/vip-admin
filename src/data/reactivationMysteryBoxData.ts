export type PrizeType = 'bonus' | 'depositCoupon' | 'rebateCoupon' | 'freeSpins' | 'filCoins';
export type PrizeValueMode = 'fixed' | 'range';
export type AmountMode = 'ratio' | 'fixed';
export type BoxOpenStatus = 'pending' | 'claimed';
export type GrantIdentifierType = 'memberId' | 'phone' | 'uid';

export interface PrizeConfig {
  type: PrizeType;
  label: string;
  enabled: boolean;
  weight: number;
  valueMode: PrizeValueMode;
  valueFixed: number;
  valueMin: number;
  valueMax: number;
  venueRestriction?: string[][];
  rolloverMultiplier?: number;
  maxWithdraw?: number;
  bonusMode?: AmountMode;
  minDeposit?: number;
  rolloverLimit?: number;
  historyDepositThreshold?: number;
  rebateMode?: AmountMode;
  bonusCap?: number;
  withdrawCap?: number;
  gameRestriction?: string[][];
  fsQuantityMode?: PrizeValueMode;
  fsQuantityFixed?: number;
  fsQuantityMin?: number;
  fsQuantityMax?: number;
  purposeNote?: string;
}

export interface RecallBoxOpenRecord {
  id: string;
  orderId: string;
  openStatus: BoxOpenStatus;
  grantedAt: string;
  claimedAt: string;
  phone: string;
  account: string;
  uid: string;
  prizeType: PrizeType;
  prizeValue: string;
  prizeAmount: number;
  batchId: string;
}

export interface GrantRejectedEntry {
  key: string;
  identifier: string;
  reason: string;
}

export interface GrantResult {
  successCount: number;
  rejectedCount: number;
  rejectedEntries: GrantRejectedEntry[];
}

export const prizeTypeLabels: Record<PrizeType, string> = {
  bonus: '彩金',
  depositCoupon: '存款券',
  rebateCoupon: '返水券',
  freeSpins: 'Free Spins',
  filCoins: 'FilCoins',
};

export const prizeTypeOptions = Object.entries(prizeTypeLabels).map(([value, label]) => ({
  value,
  label,
}));

export const openStatusOptions: { value: BoxOpenStatus; label: string }[] = [
  { value: 'pending', label: '待领取' },
  { value: 'claimed', label: '已领取' },
];

export const grantIdentifierTypeOptions: { value: GrantIdentifierType; label: string }[] = [
  { value: 'memberId', label: '会员ID' },
  { value: 'phone', label: '手机号' },
  { value: 'uid', label: 'UID' },
];

export const defaultPrizePool: PrizeConfig[] = [
  {
    type: 'bonus',
    label: prizeTypeLabels.bonus,
    enabled: true,
    weight: 30,
    valueMode: 'fixed',
    valueFixed: 88,
    valueMin: 50,
    valueMax: 188,
    venueRestriction: [['Slots', 'JILI'], ['Slots', 'PG']],
    rolloverMultiplier: 3,
    maxWithdraw: 500,
  },
  {
    type: 'depositCoupon',
    label: prizeTypeLabels.depositCoupon,
    enabled: true,
    weight: 25,
    valueMode: 'range',
    valueFixed: 10,
    valueMin: 5,
    valueMax: 20,
    bonusMode: 'ratio',
    minDeposit: 300,
    rolloverLimit: 3,
    historyDepositThreshold: 3,
  },
  {
    type: 'rebateCoupon',
    label: prizeTypeLabels.rebateCoupon,
    enabled: true,
    weight: 15,
    valueMode: 'fixed',
    valueFixed: 8,
    valueMin: 5,
    valueMax: 15,
    rebateMode: 'ratio',
    bonusCap: 300,
    withdrawCap: 500,
    rolloverLimit: 1,
    gameRestriction: [['Slots', 'PP'], ['Fishing', 'JDB']],
  },
  {
    type: 'freeSpins',
    label: prizeTypeLabels.freeSpins,
    enabled: true,
    weight: 20,
    valueMode: 'fixed',
    valueFixed: 10,
    valueMin: 5,
    valueMax: 20,
    fsQuantityMode: 'fixed',
    fsQuantityFixed: 20,
    fsQuantityMin: 10,
    fsQuantityMax: 30,
  },
  {
    type: 'filCoins',
    label: prizeTypeLabels.filCoins,
    enabled: true,
    weight: 10,
    valueMode: 'range',
    valueFixed: 300,
    valueMin: 100,
    valueMax: 500,
    purposeNote: 'FilCoins 可用于任务中心、兑换商城与指定活动消耗；开盒后立即入账。',
  },
];

export const mockGrantResult: GrantResult = {
  successCount: 8,
  rejectedCount: 2,
  rejectedEntries: [
    { key: 'reject-1', identifier: '09171234567', reason: '仍有未开盲盒' },
    { key: 'reject-2', identifier: 'U900314', reason: '仍有未开盲盒' },
  ],
};

export const recallBoxOpenRecords: RecallBoxOpenRecord[] = [
  {
    id: 'box-1',
    orderId: 'RMB-20260618-0001',
    openStatus: 'claimed',
    grantedAt: '2026-06-18 09:02:11',
    claimedAt: '2026-06-18 09:18:45',
    phone: '09171234567',
    account: 'maya_return_01',
    uid: 'U900301',
    prizeType: 'bonus',
    prizeValue: '彩金 ₱88.00',
    prizeAmount: 88,
    batchId: 'RB-20260618-A',
  },
  {
    id: 'box-2',
    orderId: 'RMB-20260618-0002',
    openStatus: 'pending',
    grantedAt: '2026-06-18 09:06:30',
    claimedAt: '-',
    phone: '09181234568',
    account: 'gcash_back_22',
    uid: 'U900302',
    prizeType: 'depositCoupon',
    prizeValue: '存款券 10%',
    prizeAmount: 10,
    batchId: 'RB-20260618-A',
  },
  {
    id: 'box-3',
    orderId: 'RMB-20260618-0003',
    openStatus: 'claimed',
    grantedAt: '2026-06-18 09:12:09',
    claimedAt: '2026-06-18 09:44:02',
    phone: '09201234569',
    account: 'slot_wakeup',
    uid: 'U900303',
    prizeType: 'rebateCoupon',
    prizeValue: '返水券 8%',
    prizeAmount: 8,
    batchId: 'RB-20260618-A',
  },
  {
    id: 'box-4',
    orderId: 'RMB-20260618-0004',
    openStatus: 'claimed',
    grantedAt: '2026-06-18 10:01:26',
    claimedAt: '2026-06-18 10:03:19',
    phone: '09211234570',
    account: 'spin_again',
    uid: 'U900304',
    prizeType: 'freeSpins',
    prizeValue: 'Free Spins 20 次',
    prizeAmount: 20,
    batchId: 'RB-20260618-A',
  },
  {
    id: 'box-5',
    orderId: 'RMB-20260618-0005',
    openStatus: 'pending',
    grantedAt: '2026-06-18 10:18:54',
    claimedAt: '-',
    phone: '09221234571',
    account: 'coin_recall',
    uid: 'U900305',
    prizeType: 'filCoins',
    prizeValue: 'FilCoins 300',
    prizeAmount: 300,
    batchId: 'RB-20260618-A',
  },
  {
    id: 'box-6',
    orderId: 'RMB-20260618-0006',
    openStatus: 'claimed',
    grantedAt: '2026-06-18 10:41:08',
    claimedAt: '2026-06-18 11:06:35',
    phone: '09231234572',
    account: 'old_vip_77',
    uid: 'U900306',
    prizeType: 'bonus',
    prizeValue: '彩金 ₱188.00',
    prizeAmount: 188,
    batchId: 'RB-20260618-B',
  },
  {
    id: 'box-7',
    orderId: 'RMB-20260618-0007',
    openStatus: 'pending',
    grantedAt: '2026-06-18 11:15:42',
    claimedAt: '-',
    phone: '09241234573',
    account: 'return_jili',
    uid: 'U900307',
    prizeType: 'depositCoupon',
    prizeValue: '存款券 ₱50.00',
    prizeAmount: 50,
    batchId: 'RB-20260618-B',
  },
  {
    id: 'box-8',
    orderId: 'RMB-20260618-0008',
    openStatus: 'claimed',
    grantedAt: '2026-06-18 11:32:10',
    claimedAt: '2026-06-18 12:10:12',
    phone: '09251234574',
    account: 'rebate_chaser',
    uid: 'U900308',
    prizeType: 'rebateCoupon',
    prizeValue: '返水券 ₱25.00',
    prizeAmount: 25,
    batchId: 'RB-20260618-B',
  },
  {
    id: 'box-9',
    orderId: 'RMB-20260618-0009',
    openStatus: 'claimed',
    grantedAt: '2026-06-18 12:08:59',
    claimedAt: '2026-06-18 12:11:26',
    phone: '09261234575',
    account: 'fs_hunter',
    uid: 'U900309',
    prizeType: 'freeSpins',
    prizeValue: 'Free Spins 12 次',
    prizeAmount: 12,
    batchId: 'RB-20260618-B',
  },
  {
    id: 'box-10',
    orderId: 'RMB-20260618-0010',
    openStatus: 'pending',
    grantedAt: '2026-06-18 12:44:37',
    claimedAt: '-',
    phone: '09271234576',
    account: 'coin_reset',
    uid: 'U900310',
    prizeType: 'filCoins',
    prizeValue: 'FilCoins 500',
    prizeAmount: 500,
    batchId: 'RB-20260618-B',
  },
  {
    id: 'box-11',
    orderId: 'RMB-20260617-0011',
    openStatus: 'claimed',
    grantedAt: '2026-06-17 16:05:12',
    claimedAt: '2026-06-17 18:23:40',
    phone: '09281234577',
    account: 'bonus_back',
    uid: 'U900311',
    prizeType: 'bonus',
    prizeValue: '彩金 ₱58.00',
    prizeAmount: 58,
    batchId: 'RB-20260617-A',
  },
  {
    id: 'box-12',
    orderId: 'RMB-20260617-0012',
    openStatus: 'claimed',
    grantedAt: '2026-06-17 17:28:05',
    claimedAt: '2026-06-17 17:35:31',
    phone: '09291234578',
    account: 'coupon_ready',
    uid: 'U900312',
    prizeType: 'depositCoupon',
    prizeValue: '存款券 15%',
    prizeAmount: 15,
    batchId: 'RB-20260617-A',
  },
  {
    id: 'box-13',
    orderId: 'RMB-20260617-0013',
    openStatus: 'pending',
    grantedAt: '2026-06-17 18:15:19',
    claimedAt: '-',
    phone: '09301234579',
    account: 'netloss_win',
    uid: 'U900313',
    prizeType: 'rebateCoupon',
    prizeValue: '返水券 12%',
    prizeAmount: 12,
    batchId: 'RB-20260617-A',
  },
  {
    id: 'box-14',
    orderId: 'RMB-20260617-0014',
    openStatus: 'claimed',
    grantedAt: '2026-06-17 19:42:54',
    claimedAt: '2026-06-17 20:01:18',
    phone: '09311234580',
    account: 'fs_restart',
    uid: 'U900314',
    prizeType: 'freeSpins',
    prizeValue: 'Free Spins 30 次',
    prizeAmount: 30,
    batchId: 'RB-20260617-B',
  },
  {
    id: 'box-15',
    orderId: 'RMB-20260617-0015',
    openStatus: 'pending',
    grantedAt: '2026-06-17 21:08:03',
    claimedAt: '-',
    phone: '09321234581',
    account: 'coin_lucky',
    uid: 'U900315',
    prizeType: 'filCoins',
    prizeValue: 'FilCoins 100',
    prizeAmount: 100,
    batchId: 'RB-20260617-B',
  },
];

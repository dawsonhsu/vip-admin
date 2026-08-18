export type PrizeType = 'bonus' | 'depositCoupon' | 'rebateCoupon' | 'freeSpins' | 'filCoins';
export type PrizeValueKind = 'amount' | 'ratio' | 'count';
export type PrizeStatus =
  | 'credited'
  | 'calculating'
  | 'settled'
  | 'voided'
  | 'unused'
  | 'used'
  | 'expired';
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
  batchId: string;
  prizeType?: PrizeType;
  prizeValueKind?: PrizeValueKind;
  prizeValue?: number;
  prizeStatus?: PrizeStatus;
  payoutAmount?: number | null;
  rebateWindowStart?: string;
  rebateWindowEnd?: string;
  rebateValidTurnover?: number;
  rebateBonusCap?: number;
  rebateSettledAt?: string;
  couponMinDeposit?: number;
  couponUsedAt?: string;
  couponExpireAt?: string;
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

export const prizeValueKindLabels: Record<PrizeValueKind, string> = {
  amount: '固定金额',
  ratio: '比例',
  count: '次数·数量',
};

export const prizeStatusLabels: Record<PrizeStatus, string> = {
  credited: '已到账',
  calculating: '计算中',
  settled: '已派发',
  voided: '已作废',
  unused: '待使用',
  used: '已使用',
  expired: '已过期',
};

export const prizeStatusOptions: { value: PrizeStatus; label: string }[] = Object.entries(
  prizeStatusLabels,
).map(([value, label]) => ({
  value: value as PrizeStatus,
  label,
}));

// 收拢后的 4 种对外展示状态
export type ConsolidatedPrizeStatus = 'calculating' | 'pendingUse' | 'fulfilled' | 'invalidated';

export const consolidatedPrizeStatusLabels: Record<ConsolidatedPrizeStatus, string> = {
  calculating: '计算中',
  pendingUse: '待使用',
  fulfilled: '已派发',
  invalidated: '已失效',
};

// 展示/筛选顺序固定
export const consolidatedPrizeStatusOrder: ConsolidatedPrizeStatus[] = [
  'calculating',
  'pendingUse',
  'fulfilled',
  'invalidated',
];

export const consolidatedPrizeStatusOptions: {
  value: ConsolidatedPrizeStatus;
  label: string;
}[] = consolidatedPrizeStatusOrder.map((value) => ({
  value,
  label: consolidatedPrizeStatusLabels[value],
}));

// 原始 7 状态 → 收拢 4 状态 的映射
const rawToConsolidatedPrizeStatus: Record<PrizeStatus, ConsolidatedPrizeStatus> = {
  credited: 'fulfilled',
  settled: 'fulfilled',
  used: 'fulfilled',
  calculating: 'calculating',
  unused: 'pendingUse',
  voided: 'invalidated',
  expired: 'invalidated',
};

export const toConsolidatedPrizeStatus = (
  status?: PrizeStatus,
): ConsolidatedPrizeStatus | undefined =>
  status ? rawToConsolidatedPrizeStatus[status] : undefined;

export const openStatusLabels: Record<BoxOpenStatus, string> = {
  pending: '未开盒',
  claimed: '已开盒',
};

export const openStatusOptions: { value: BoxOpenStatus; label: string }[] = [
  { value: 'pending', label: openStatusLabels.pending },
  { value: 'claimed', label: openStatusLabels.claimed },
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
    batchId: 'RB-20260618-A',
    prizeType: 'bonus',
    prizeValueKind: 'amount',
    prizeValue: 88,
    prizeStatus: 'credited',
    payoutAmount: 88,
  },
  {
    id: 'box-2',
    orderId: 'RMB-20260618-0002',
    openStatus: 'claimed',
    grantedAt: '2026-06-18 09:06:30',
    claimedAt: '2026-06-18 09:22:13',
    phone: '09181234568',
    account: 'gcash_back_22',
    uid: 'U900302',
    batchId: 'RB-20260618-A',
    prizeType: 'bonus',
    prizeValueKind: 'amount',
    prizeValue: 188,
    prizeStatus: 'credited',
    payoutAmount: 188,
  },
  {
    id: 'box-3',
    orderId: 'RMB-20260618-0003',
    openStatus: 'claimed',
    grantedAt: '2026-06-18 19:58:21',
    claimedAt: '2026-06-18 20:12:09',
    phone: '09201234569',
    account: 'slot_wakeup',
    uid: 'U900303',
    batchId: 'RB-20260618-C',
    prizeType: 'rebateCoupon',
    prizeValueKind: 'ratio',
    prizeValue: 8,
    prizeStatus: 'calculating',
    payoutAmount: null,
    rebateWindowStart: '2026-06-18 20:12:09',
    rebateWindowEnd: '2026-06-19 20:12:09',
    rebateValidTurnover: 1280,
    rebateBonusCap: 300,
  },
  {
    id: 'box-4',
    orderId: 'RMB-20260617-0004',
    openStatus: 'claimed',
    grantedAt: '2026-06-17 14:58:10',
    claimedAt: '2026-06-17 15:20:34',
    phone: '09211234570',
    account: 'rebate_regular',
    uid: 'U900304',
    batchId: 'RB-20260617-A',
    prizeType: 'rebateCoupon',
    prizeValueKind: 'ratio',
    prizeValue: 8,
    prizeStatus: 'settled',
    payoutAmount: 260,
    rebateWindowStart: '2026-06-17 15:20:34',
    rebateWindowEnd: '2026-06-18 15:20:34',
    rebateValidTurnover: 3250,
    rebateBonusCap: 300,
    rebateSettledAt: '2026-06-18 15:21:02',
  },
  {
    id: 'box-5',
    orderId: 'RMB-20260617-0005',
    openStatus: 'claimed',
    grantedAt: '2026-06-17 17:02:45',
    claimedAt: '2026-06-17 17:40:18',
    phone: '09221234571',
    account: 'cap_rebate_88',
    uid: 'U900305',
    batchId: 'RB-20260617-A',
    prizeType: 'rebateCoupon',
    prizeValueKind: 'ratio',
    prizeValue: 12,
    prizeStatus: 'settled',
    payoutAmount: 500,
    rebateWindowStart: '2026-06-17 17:40:18',
    rebateWindowEnd: '2026-06-18 17:40:18',
    rebateValidTurnover: 6800,
    rebateBonusCap: 500,
    rebateSettledAt: '2026-06-18 17:41:06',
  },
  {
    id: 'box-6',
    orderId: 'RMB-20260617-0006',
    openStatus: 'claimed',
    grantedAt: '2026-06-17 17:51:08',
    claimedAt: '2026-06-17 18:05:35',
    phone: '09231234572',
    account: 'fixed_rebate',
    uid: 'U900306',
    batchId: 'RB-20260617-A',
    prizeType: 'rebateCoupon',
    prizeValueKind: 'amount',
    prizeValue: 25,
    prizeStatus: 'settled',
    payoutAmount: 25,
    rebateWindowStart: '2026-06-17 18:05:35',
    rebateWindowEnd: '2026-06-18 18:05:35',
    rebateValidTurnover: 2100,
    rebateBonusCap: 100,
    rebateSettledAt: '2026-06-18 18:06:12',
  },
  {
    id: 'box-7',
    orderId: 'RMB-20260617-0007',
    openStatus: 'claimed',
    grantedAt: '2026-06-17 18:45:42',
    claimedAt: '2026-06-17 19:10:27',
    phone: '09241234573',
    account: 'no_turnover',
    uid: 'U900307',
    batchId: 'RB-20260617-B',
    prizeType: 'rebateCoupon',
    prizeValueKind: 'ratio',
    prizeValue: 10,
    prizeStatus: 'voided',
    payoutAmount: 0,
    rebateWindowStart: '2026-06-17 19:10:27',
    rebateWindowEnd: '2026-06-18 19:10:27',
    rebateValidTurnover: 0,
    rebateBonusCap: 300,
    rebateSettledAt: '2026-06-18 19:11:00',
  },
  {
    id: 'box-8',
    orderId: 'RMB-20260618-0008',
    openStatus: 'claimed',
    grantedAt: '2026-06-18 10:05:10',
    claimedAt: '2026-06-18 10:22:12',
    phone: '09251234574',
    account: 'coupon_ready',
    uid: 'U900308',
    batchId: 'RB-20260618-A',
    prizeType: 'depositCoupon',
    prizeValueKind: 'ratio',
    prizeValue: 10,
    prizeStatus: 'unused',
    payoutAmount: null,
    couponMinDeposit: 300,
    couponExpireAt: '2026-06-21 23:59:59',
  },
  {
    id: 'box-9',
    orderId: 'RMB-20260618-0009',
    openStatus: 'claimed',
    grantedAt: '2026-06-18 10:31:59',
    claimedAt: '2026-06-18 10:48:26',
    phone: '09261234575',
    account: 'deposit_boost',
    uid: 'U900309',
    batchId: 'RB-20260618-A',
    prizeType: 'depositCoupon',
    prizeValueKind: 'ratio',
    prizeValue: 15,
    prizeStatus: 'used',
    payoutAmount: 120,
    couponMinDeposit: 500,
    couponExpireAt: '2026-06-21 23:59:59',
    couponUsedAt: '2026-06-18 13:32:44',
  },
  {
    id: 'box-10',
    orderId: 'RMB-20260617-0010',
    openStatus: 'claimed',
    grantedAt: '2026-06-17 16:35:37',
    claimedAt: '2026-06-17 17:02:19',
    phone: '09271234576',
    account: 'coupon_expired',
    uid: 'U900310',
    batchId: 'RB-20260617-A',
    prizeType: 'depositCoupon',
    prizeValueKind: 'ratio',
    prizeValue: 20,
    prizeStatus: 'expired',
    payoutAmount: null,
    couponMinDeposit: 800,
    couponExpireAt: '2026-06-18 23:59:59',
  },
  {
    id: 'box-11',
    orderId: 'RMB-20260618-0011',
    openStatus: 'claimed',
    grantedAt: '2026-06-18 11:15:12',
    claimedAt: '2026-06-18 11:23:40',
    phone: '09281234577',
    account: 'fixed_coupon',
    uid: 'U900311',
    batchId: 'RB-20260618-B',
    prizeType: 'depositCoupon',
    prizeValueKind: 'amount',
    prizeValue: 50,
    prizeStatus: 'unused',
    payoutAmount: null,
    couponMinDeposit: 300,
    couponExpireAt: '2026-06-21 23:59:59',
  },
  {
    id: 'box-12',
    orderId: 'RMB-20260618-0012',
    openStatus: 'claimed',
    grantedAt: '2026-06-18 12:08:05',
    claimedAt: '2026-06-18 12:12:31',
    phone: '09291234578',
    account: 'fs_hunter',
    uid: 'U900312',
    batchId: 'RB-20260618-B',
    prizeType: 'freeSpins',
    prizeValueKind: 'count',
    prizeValue: 20,
    prizeStatus: 'credited',
    payoutAmount: null,
  },
  {
    id: 'box-13',
    orderId: 'RMB-20260617-0013',
    openStatus: 'claimed',
    grantedAt: '2026-06-17 19:42:19',
    claimedAt: '2026-06-17 20:01:18',
    phone: '09301234579',
    account: 'fs_restart',
    uid: 'U900313',
    batchId: 'RB-20260617-B',
    prizeType: 'freeSpins',
    prizeValueKind: 'count',
    prizeValue: 30,
    prizeStatus: 'credited',
    payoutAmount: null,
  },
  {
    id: 'box-14',
    orderId: 'RMB-20260618-0014',
    openStatus: 'claimed',
    grantedAt: '2026-06-18 12:44:54',
    claimedAt: '2026-06-18 12:58:18',
    phone: '09311234580',
    account: 'coin_recall',
    uid: 'U900314',
    batchId: 'RB-20260618-B',
    prizeType: 'filCoins',
    prizeValueKind: 'count',
    prizeValue: 300,
    prizeStatus: 'credited',
    payoutAmount: null,
  },
  {
    id: 'box-15',
    orderId: 'RMB-20260617-0015',
    openStatus: 'claimed',
    grantedAt: '2026-06-17 21:08:03',
    claimedAt: '2026-06-17 21:24:46',
    phone: '09321234581',
    account: 'coin_lucky',
    uid: 'U900315',
    batchId: 'RB-20260617-B',
    prizeType: 'filCoins',
    prizeValueKind: 'count',
    prizeValue: 500,
    prizeStatus: 'credited',
    payoutAmount: null,
  },
  {
    id: 'box-16',
    orderId: 'RMB-20260618-0016',
    openStatus: 'pending',
    grantedAt: '2026-06-18 13:19:22',
    claimedAt: '-',
    phone: '09331234582',
    account: 'pending_maya',
    uid: 'U900316',
    batchId: 'RB-20260618-B',
  },
  {
    id: 'box-17',
    orderId: 'RMB-20260618-0017',
    openStatus: 'pending',
    grantedAt: '2026-06-18 14:02:57',
    claimedAt: '-',
    phone: '09341234583',
    account: 'pending_gcash',
    uid: 'U900317',
    batchId: 'RB-20260618-B',
  },
  {
    id: 'box-18',
    orderId: 'RMB-20260617-0018',
    openStatus: 'pending',
    grantedAt: '2026-06-17 22:15:41',
    claimedAt: '-',
    phone: '09351234584',
    account: 'pending_vip',
    uid: 'U900318',
    batchId: 'RB-20260617-B',
  },
];

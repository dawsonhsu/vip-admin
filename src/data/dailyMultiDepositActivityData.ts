export interface DailyMultiDepositLadderRow {
  key: string;
  startAmount: number;        // 起存金额≥ (P)
  bonusRate: number;          // 礼金比例 (%)
  freeSpinCount: number;      // 免费旋转次数 (次)
  principalRollover: number;  // 本金打码倍数 (倍)
  bonusRollover: number;      // 礼金打码倍数 (倍)
}

export const dailyMultiDepositLadderDefault: DailyMultiDepositLadderRow[] = [
  { key: 'tier-1', startAmount: 100,   bonusRate: 50, freeSpinCount: 1, principalRollover: 5, bonusRollover: 21 },
  { key: 'tier-2', startAmount: 10000, bonusRate: 0,  freeSpinCount: 1, principalRollover: 5, bonusRollover: 20 },
];

export const dailyMultiDepositDefaultConfig = {
  dailyDepositCount: 2,     // 每日多次存款数量
  rewardFormula: 'ratio',   // 'ratio'=比例发放 | 'fixed'=定额发放
};

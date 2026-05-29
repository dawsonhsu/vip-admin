import {
  depositChannels,
  defaultSelectedDepositChannels,
  gameOptions,
  providerOptions,
} from './newMemberTriDepositData';

export { depositChannels, defaultSelectedDepositChannels, gameOptions, providerOptions };

export interface DailyCumulativeLadderRow {
  key: string;
  threshold: number;
  bonusAmount: number;
  freeSpinCount: number;
  rolloverMultiplier: number;
}

export const dailyCumulativeLadderDefault: DailyCumulativeLadderRow[] = [
  { key: 'ladder-1', threshold: 500,   bonusAmount: 5,   freeSpinCount: 5,  rolloverMultiplier: 1 },
  { key: 'ladder-2', threshold: 1000,  bonusAmount: 10,  freeSpinCount: 10, rolloverMultiplier: 1 },
  { key: 'ladder-3', threshold: 2000,  bonusAmount: 20,  freeSpinCount: 20, rolloverMultiplier: 1 },
  { key: 'ladder-4', threshold: 5000,  bonusAmount: 50,  freeSpinCount: 30, rolloverMultiplier: 2 },
  { key: 'ladder-5', threshold: 10000, bonusAmount: 100, freeSpinCount: 50, rolloverMultiplier: 2 },
];

export const dailyCumulativeDefaultConfig = {
  cumulationType: 'deposit',      // deposit | turnover
  settleCycle: 'hour',            // realtime | hour | day
  timeRangeStart: '00:00',
  timeRangeEnd: '23:59',
  budgetCap: 50000,
};

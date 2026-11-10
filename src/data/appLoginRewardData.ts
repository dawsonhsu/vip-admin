import { gameOptions } from './newMemberTriDepositData';

const defaultGame = gameOptions.find((game) => game.provider === 'JILI')!;

export const appLoginRewardDefaultConfig = {
  rewardType: 'cash',
  cash: { amount: 20, rolloverMultiplier: 1, venueRestriction: [] as string[][] },
  freeSpin: {
    provider: 'JILI',
    gameId: defaultGame.value,
    fsCount: 10,
    betAmount: 0.20,
    validityDays: 7,
  },
};

export interface AppLoginRewardRecord {
  orderId: string;
  /** GMT+8 wall-clock time. */
  dispatchedAt: string;
  phone: string;
  account: string;
  uid: string;
  terminal: 'Android' | 'iOS';
  rewardType: 'cash' | 'freeSpin';
  rewardTypeLabel: '现金' | 'Free Spin';
  rewardContent: string;
  cashAmount: number;
  freeSpinSpins: number;
  rolloverRequirement: string;
  dispatchStatus: '已派发';
}

const accountSeeds = ['maya_app', 'lucky_spin', 'gcash_player', 'palawan_ace', 'coin_hunter'];
const pad = (value: number) => String(value).padStart(2, '0');

export const appLoginRewardRecords: AppLoginRewardRecord[] = Array.from({ length: 40 }, (_, index) => {
  const rewardType = index % 10 < 7 ? 'cash' : 'freeSpin';
  const cashAmount = rewardType === 'cash' ? [20, 30, 50][index % 3] : 0;
  const freeSpinSpins = rewardType === 'freeSpin' ? [10, 15, 20][index % 3] : 0;
  const rolloverMultiplier = [1, 2, 0, 1.5][index % 4];
  const day = pad(3 + Math.floor(index / 5));

  return {
    orderId: `ALR-202611${day}-${String(index + 1).padStart(4, '0')}`,
    dispatchedAt: `2026-11-${day} ${pad(7 + (index % 5) * 3)}:${pad((index * 7) % 60)}:${pad((index * 11) % 60)}`,
    phone: `09${171234500 + index}`,
    account: `${accountSeeds[index % accountSeeds.length]}_${index + 1}`,
    uid: `U${910001 + index}`,
    terminal: index % 2 === 0 ? 'Android' : 'iOS',
    rewardType,
    rewardTypeLabel: rewardType === 'cash' ? '现金' : 'Free Spin',
    rewardContent: rewardType === 'cash'
      ? `₱${cashAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `${freeSpinSpins} 次`,
    cashAmount,
    freeSpinSpins,
    rolloverRequirement: rolloverMultiplier === 0 ? '—' : `${rolloverMultiplier} 倍`,
    dispatchStatus: '已派发',
  };
});

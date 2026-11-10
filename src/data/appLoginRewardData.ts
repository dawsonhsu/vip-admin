import { gameOptions } from './newMemberTriDepositData';

const defaultGame = gameOptions.find((game) => game.provider === 'JILI')!;

export const appLoginRewardDefaultConfig = {
  terminals: ['android', 'ios'],
  minAppVersion: '',
  kycRequired: 'required',
  rewardTypes: ['cash', 'freespin'],
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
  appVersion: string;
  cashAmount: number | null;
  rolloverMultiplier: number | null;
  rolloverRequired: number | null;
  rolloverCompleted: number | null;
  rolloverStatus: '进行中' | '已完成' | '已失效' | '无流水' | null;
  fsProvider: string | null;
  fsGame: string | null;
  fsCount: number | null;
  fsUsed: number | null;
  fsPayout: number | null;
}

const accountSeeds = ['maya_app', 'lucky_spin', 'gcash_player', 'palawan_ace', 'coin_hunter'];
const pad = (value: number) => String(value).padStart(2, '0');

export const appLoginRewardRecords: AppLoginRewardRecord[] = Array.from({ length: 40 }, (_, index) => {
  const hasCash = index % 5 !== 4;
  const hasFs = index % 5 !== 3;
  const cashAmount = hasCash ? [20, 30, 50][index % 3] : null;
  const rolloverMultiplier = hasCash ? [1, 2, 0, 1.5][index % 4] : null;
  const rolloverRequired = cashAmount === null ? null : cashAmount * rolloverMultiplier!;
  const rolloverStatus: AppLoginRewardRecord['rolloverStatus'] = !hasCash
    ? null
    : rolloverMultiplier === 0
      ? '无流水'
      : (['进行中', '已完成', '已失效'] as const)[index % 3];
  const game = gameOptions[index % gameOptions.length];
  const fsCount = hasFs ? [10, 15, 20][index % 3] : null;
  const fsUsed = fsCount === null ? null : index % (fsCount + 1);
  const day = pad(3 + Math.floor(index / 5));

  return {
    orderId: `ALR-202611${day}-${String(index + 1).padStart(4, '0')}`,
    dispatchedAt: `2026-11-${day} ${pad(7 + (index % 5) * 3)}:${pad((index * 7) % 60)}:${pad((index * 11) % 60)}`,
    phone: `09${171234500 + index}`,
    account: `${accountSeeds[index % accountSeeds.length]}_${index + 1}`,
    uid: `U${910001 + index}`,
    terminal: index % 2 === 0 ? 'Android' : 'iOS',
    appVersion: ['1.2.29', '1.2.28', '1.2.27'][index % 3],
    cashAmount,
    rolloverMultiplier,
    rolloverRequired,
    rolloverCompleted: rolloverRequired === null ? null : rolloverStatus === '已完成'
      ? rolloverRequired : Number((rolloverRequired * (index % 5) / 5).toFixed(2)),
    rolloverStatus,
    fsProvider: hasFs ? game.provider : null,
    fsGame: hasFs ? game.label : null,
    fsCount,
    fsUsed,
    fsPayout: fsUsed === null ? null : Number((fsUsed * (0.8 + index % 7)).toFixed(2)),
  };
});

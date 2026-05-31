import dayjs from 'dayjs';

export type GameType = 'Slots' | 'Fishing' | 'Sports' | 'Table' | 'Live' | 'Arcade' | 'Bingo';

export interface PersonalStat {
  date: string;
  uid: string;
  username: string;
  phone: string;
  inviterUid?: string;
  inviterUsername?: string;
  depositCount: number;
  totalDeposit: number;
  withdrawCount: number;
  totalWithdraw: number;
  depositFee: number;
  withdrawFee: number;
  totalBet: number;
  excludedBet: number;        // 排除投注額（不計入有效流水的部分；對應「好友邀請活動」所配置的排除遊戲）
  validBet: number;
  totalPayout: number;
  ggr: number;
  fsBet: number;
  fsGgr: number;
  jpBet: number;
  jpGgr: number;
  totalBonus: number;
  totalCommission: number;
  achievedInvitation: boolean; // 此會員是否達成「好友邀請活動」配置的達標條件；若達標則計入其邀請人的「達成人數」
}

export interface InviteStat {
  date: string;
  uid: string;
  username: string;
  phone: string;
  inviterUid?: string;
  inviterUsername?: string;
  inviteCount: number;
  loginUserCount: number;
  achieveCount: number;
  betUserCount: number;
  firstDepositUserCount: number;
  firstDepositAmount: number;
  newDepositUserCount: number;
  newDepositAmount: number;
  depositUserCount: number;
  depositCount: number;
  totalDeposit: number;
  totalWithdraw: number;
  depositFee: number;
  withdrawFee: number;
  totalBet: number;
  validBet: number;
  totalPayout: number;
  ggr: number;
  fsBet: number;
  fsGgr: number;
  jpBet: number;
  jpGgr: number;
  totalBonus: number;      // 此會員邀請的會員當日獲得彩金加總
  totalCommission: number; // 此會員邀請的會員當日獲得佣金加總
  excludedBet: number;     // 此會員邀請的會員當日排除投注額加總
}

export interface GameStat {
  date: string;
  uid: string;
  username: string;
  phone: string;
  inviterUid?: string;
  inviterUsername?: string;
  gameType: GameType;
  totalBet: number;
  excludedBet: number;
  validBet: number;
  totalPayout: number;
  ggr: number;
  fsBet: number;
  fsGgr: number;
  jpBet: number;
  jpGgr: number;
}

interface MockMember {
  uid: string;
  username: string;
  phone: string;
  inviterUid?: string;
  inviterUsername?: string;
}

const TOTAL_MEMBERS = 50;
const TOTAL_DAYS = 30;

export const gameTypes: GameType[] = ['Slots', 'Fishing', 'Sports', 'Table', 'Live', 'Arcade', 'Bingo'];

const usernameSeeds = [
  'lucky', 'tiger', 'dragon', 'phoenix', 'ace', 'king', 'queen', 'nova', 'flash', 'blaze',
  'storm', 'viper', 'eagle', 'falcon', 'ruby', 'gold', 'silver', 'wolf', 'jade', 'ocean',
  'hero', 'thunder', 'shadow', 'rapid', 'royal', 'crystal', 'mega', 'night', 'sun', 'moon',
];

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const pickInt = (seed: string, min: number, max: number): number => {
  const range = max - min + 1;
  return min + (hashString(seed) % range);
};

const roundToTwo = (value: number): number => Math.round(value * 100) / 100;

const pickAmountWithDecimal = (seed: string, min: number, max: number): number => {
  const cents = pickInt(`${seed}-cents`, Math.round(min * 100), Math.round(max * 100));
  return roundToTwo(cents / 100);
};

// Hardcoded inviter overrides to guarantee specific demo chains:
//   Page-1 overflow case: tiger_02(1) → dragon_03(2) → phoenix_04(3) → ace_05(4)
//   silver_47 overflow case: falcon_44(43) → ruby_45(44) → gold_46(45) → silver_47(46)
// Both chains have ≥4 ancestors above the bottom member, so Popover shows '…' at the top.
const HARDCODED_INVITERS: Record<number, number> = {
  1: 0, 2: 1, 3: 2, 4: 3,
  43: 42, 44: 43, 45: 44, 46: 45,
};

const buildMembers = (): MockMember[] => (
  Array.from({ length: TOTAL_MEMBERS }, (_, index) => {
    const uid = `U${String(10001 + index)}`;
    const username = `${usernameSeeds[index % usernameSeeds.length]}_${String(index + 1).padStart(2, '0')}`;
    const phoneBody = pickInt(`${uid}-phone`, 10000000, 99999999);
    const phone = `09${phoneBody}`;

    const hardcodedInviterIdx = HARDCODED_INVITERS[index];
    if (hardcodedInviterIdx !== undefined) {
      const inviterUid = `U${String(10001 + hardcodedInviterIdx)}`;
      const inviterUsername = `${usernameSeeds[hardcodedInviterIdx % usernameSeeds.length]}_${String(hardcodedInviterIdx + 1).padStart(2, '0')}`;
      return { uid, username, phone, inviterUid, inviterUsername };
    }

    const inviterEnabled = index > 0 && hashString(`${uid}-inviter-enabled`) % 10 < 3;
    if (!inviterEnabled) {
      return { uid, username, phone };
    }

    const inviterIndex = hashString(`${uid}-inviter`) % index;
    const inviterUid = `U${String(10001 + inviterIndex)}`;
    const inviterUsername = `${usernameSeeds[inviterIndex % usernameSeeds.length]}_${String(inviterIndex + 1).padStart(2, '0')}`;

    return {
      uid,
      username,
      phone,
      inviterUid,
      inviterUsername,
    };
  })
);

const mockMembers = buildMembers();

export const memberStatMembers = mockMembers;

export function getInviterChain(uid: string): { chain: Array<{ uid: string; username: string }>; hasMoreAbove: boolean } {
  const chain: Array<{ uid: string; username: string }> = [];
  let current: { uid: string; username: string; inviterUid?: string; inviterUsername?: string } | undefined = mockMembers.find(m => m.uid === uid);
  while (current?.inviterUid) {
    const inviter = mockMembers.find(m => m.uid === current!.inviterUid);
    if (!inviter) break;
    if (chain.length >= 3) {
      return { chain, hasMoreAbove: true };
    }
    chain.unshift({ uid: inviter.uid, username: inviter.username });
    current = inviter;
  }
  return { chain, hasMoreAbove: false }; // chain ordered top-to-bottom, immediate inviter is last
}

const dates = Array.from({ length: TOTAL_DAYS }, (_, index) => dayjs().subtract(index, 'day').format('YYYY-MM-DD'));

const createPersonalStat = (member: MockMember, date: string): PersonalStat => {
  const depositCount = pickInt(`${member.uid}-${date}-deposit-count`, 0, 6);
  const totalDeposit = depositCount === 0 ? 0 : pickAmountWithDecimal(`${member.uid}-${date}-deposit-amount`, 100, 50000);
  const withdrawCount = pickInt(`${member.uid}-${date}-withdraw-count`, 0, 4);
  const totalWithdraw = withdrawCount === 0 ? 0 : pickAmountWithDecimal(`${member.uid}-${date}-withdraw-amount`, 0, 35000);
  const totalBet = pickAmountWithDecimal(`${member.uid}-${date}-total-bet`, 50, 200000);
  const excludedBet = pickAmountWithDecimal(`${member.uid}-${date}-excluded-bet`, 0, Math.max(totalBet * 0.2, 0));
  const validBet = roundToTwo(Math.max(totalBet - excludedBet, 0));
  const payoutFactor = pickInt(`${member.uid}-${date}-payout-factor`, 70, 120) / 100;
  const totalPayout = roundToTwo(validBet * payoutFactor);
  const depositFee = totalDeposit === 0 ? 0 : roundToTwo(totalDeposit * (pickInt(`${member.uid}-${date}-deposit-fee`, 0, 25) / 1000));
  const withdrawFee = totalWithdraw === 0 ? 0 : roundToTwo(totalWithdraw * (pickInt(`${member.uid}-${date}-withdraw-fee`, 0, 30) / 1000));
  const totalBonus = pickAmountWithDecimal(`${member.uid}-${date}-bonus`, 0, 5000);
  const totalCommission = member.inviterUid ? pickAmountWithDecimal(`${member.uid}-${date}-commission`, 0, 2500) : 0;
  // achievedInvitation：僅有邀請人的會員才可能達標；以 uid hash 決定（同一會員所有日期一致），約 40% 命中
  const achievedInvitation = !!member.inviterUid && hashString(`${member.uid}-achieved-invitation`) % 10 < 4;
  const fsBet = pickAmountWithDecimal(`${member.uid}-${date}-fs-bet`, 0, 8000);
  const fsGgr = roundToTwo(fsBet * (pickInt(`${member.uid}-${date}-fs-ggr-factor`, -20, 25) / 100));
  const jpBet = pickAmountWithDecimal(`${member.uid}-${date}-jp-bet`, 0, 5000);
  const jpGgr = roundToTwo(jpBet * (pickInt(`${member.uid}-${date}-jp-ggr-factor`, -15, 30) / 100));

  return {
    date,
    uid: member.uid,
    username: member.username,
    phone: member.phone,
    inviterUid: member.inviterUid,
    inviterUsername: member.inviterUsername,
    depositCount,
    totalDeposit,
    withdrawCount,
    totalWithdraw,
    depositFee,
    withdrawFee,
    totalBet,
    excludedBet,
    validBet,
    totalPayout,
    ggr: roundToTwo(totalBet - totalPayout),
    fsBet,
    fsGgr,
    jpBet,
    jpGgr,
    totalBonus,
    totalCommission,
    achievedInvitation,
  };
};

const createInviteStat = (member: MockMember, date: string): InviteStat => {
  const inviteCount = pickInt(`${member.uid}-${date}-invite-count`, 0, 8);
  const loginUserCount = inviteCount === 0 ? 0 : pickInt(`${member.uid}-${date}-login-user-count`, 0, inviteCount * 2);
  const achieveCount = inviteCount === 0 ? 0 : pickInt(`${member.uid}-${date}-achieve-count`, 0, inviteCount);
  const betUserCount = pickInt(`${member.uid}-${date}-bet-user-count`, 0, 12);
  const firstDepositUserCount = inviteCount === 0 ? 0 : pickInt(`${member.uid}-${date}-first-deposit-user-count`, 0, inviteCount);
  const firstDepositAmount = firstDepositUserCount === 0 ? 0 : pickAmountWithDecimal(`${member.uid}-${date}-first-deposit-amount`, 100, 30000);
  const newDepositUserCount = firstDepositUserCount === 0 ? 0 : pickInt(`${member.uid}-${date}-new-deposit-user-count`, 0, firstDepositUserCount);
  const newDepositAmount = newDepositUserCount === 0 ? 0 : pickAmountWithDecimal(`${member.uid}-${date}-new-deposit-amount`, 100, 20000);
  const depositUserCount = betUserCount === 0 ? 0 : pickInt(`${member.uid}-${date}-deposit-user-count`, 0, betUserCount);
  const depositCount = depositUserCount === 0 ? 0 : pickInt(`${member.uid}-${date}-invite-deposit-count`, depositUserCount, depositUserCount * 4);
  const totalDeposit = depositUserCount === 0 ? 0 : pickAmountWithDecimal(`${member.uid}-${date}-invite-total-deposit`, 200, 80000);
  const totalWithdraw = betUserCount === 0 ? 0 : pickAmountWithDecimal(`${member.uid}-${date}-invite-total-withdraw`, 0, 45000);
  const totalBet = betUserCount === 0 ? 0 : pickAmountWithDecimal(`${member.uid}-${date}-invite-total-bet`, 100, 250000);
  const excludedBet = pickAmountWithDecimal(`${member.uid}-${date}-invite-excluded-bet`, 0, Math.max(totalBet * 0.18, 0));
  const validBet = roundToTwo(Math.max(totalBet - excludedBet, 0));
  const totalPayout = roundToTwo(validBet * (pickInt(`${member.uid}-${date}-invite-payout-factor`, 72, 118) / 100));
  const depositFee = totalDeposit === 0 ? 0 : roundToTwo(totalDeposit * (pickInt(`${member.uid}-${date}-invite-deposit-fee`, 0, 18) / 1000));
  const withdrawFee = totalWithdraw === 0 ? 0 : roundToTwo(totalWithdraw * (pickInt(`${member.uid}-${date}-invite-withdraw-fee`, 0, 20) / 1000));

  const totalBonus = pickAmountWithDecimal(`${member.uid}-${date}-invite-bonus`, 0, 2000);
  const totalCommission = pickAmountWithDecimal(`${member.uid}-${date}-invite-commission`, 0, 1500);
  const fsBet = pickAmountWithDecimal(`${member.uid}-${date}-invite-fs-bet`, 0, 8000);
  const fsGgr = roundToTwo(fsBet * (pickInt(`${member.uid}-${date}-invite-fs-ggr-factor`, -20, 25) / 100));
  const jpBet = pickAmountWithDecimal(`${member.uid}-${date}-invite-jp-bet`, 0, 5000);
  const jpGgr = roundToTwo(jpBet * (pickInt(`${member.uid}-${date}-invite-jp-ggr-factor`, -15, 30) / 100));

  return {
    date,
    uid: member.uid,
    username: member.username,
    phone: member.phone,
    inviterUid: member.inviterUid,
    inviterUsername: member.inviterUsername,
    inviteCount,
    loginUserCount,
    achieveCount,
    betUserCount,
    firstDepositUserCount,
    firstDepositAmount,
    newDepositUserCount,
    newDepositAmount,
    depositUserCount,
    depositCount,
    totalDeposit,
    totalWithdraw,
    depositFee,
    withdrawFee,
    totalBet,
    excludedBet,
    validBet,
    totalPayout,
    ggr: roundToTwo(totalBet - totalPayout),
    fsBet,
    fsGgr,
    jpBet,
    jpGgr,
    totalBonus,
    totalCommission,
  };
};

const createGameStat = (member: MockMember, date: string, gameType: GameType): GameStat | null => {
  const included = hashString(`${member.uid}-${date}-${gameType}-enabled`) % 10 < 6;
  if (!included) {
    return null;
  }

  const totalBet = pickAmountWithDecimal(`${member.uid}-${date}-${gameType}-bet`, 50, 120000);
  const excludedBet = pickAmountWithDecimal(`${member.uid}-${date}-${gameType}-excluded`, 0, Math.max(totalBet * 0.25, 0));
  const validBet = roundToTwo(Math.max(totalBet - excludedBet, 0));
  const totalPayout = roundToTwo(validBet * (pickInt(`${member.uid}-${date}-${gameType}-payout-factor`, 68, 122) / 100));
  const fsBet = pickAmountWithDecimal(`${member.uid}-${date}-${gameType}-fs-bet`, 0, 4000);
  const fsGgr = roundToTwo(fsBet * (pickInt(`${member.uid}-${date}-${gameType}-fs-ggr-factor`, -20, 25) / 100));
  const jpBet = pickAmountWithDecimal(`${member.uid}-${date}-${gameType}-jp-bet`, 0, 2500);
  const jpGgr = roundToTwo(jpBet * (pickInt(`${member.uid}-${date}-${gameType}-jp-ggr-factor`, -15, 30) / 100));

  return {
    date,
    uid: member.uid,
    username: member.username,
    phone: member.phone,
    inviterUid: member.inviterUid,
    inviterUsername: member.inviterUsername,
    gameType,
    totalBet,
    excludedBet,
    validBet,
    totalPayout,
    ggr: roundToTwo(totalBet - totalPayout),
    fsBet,
    fsGgr,
    jpBet,
    jpGgr,
  };
};

export const personalStats: PersonalStat[] = mockMembers.flatMap((member) => dates.map(date => createPersonalStat(member, date)));

export const inviteStats: InviteStat[] = mockMembers.flatMap((member) => dates.map(date => createInviteStat(member, date)));

export const gameStats: GameStat[] = mockMembers.flatMap((member) => (
  dates.flatMap((date) => gameTypes.map(gameType => createGameStat(member, date, gameType)).filter((item): item is GameStat => item !== null))
));

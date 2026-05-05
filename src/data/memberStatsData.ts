import dayjs from 'dayjs';

export type GameType = 'Slots' | 'Fishing' | 'Sports' | 'Table' | 'Live' | 'Arcade' | 'Bingo';

export interface PersonalStat {
  date: string;
  uid: string;
  username: string;
  inviterUid?: string;
  inviterUsername?: string;
  depositCount: number;
  totalDeposit: number;
  withdrawCount: number;
  totalWithdraw: number;
  depositFee: number;
  withdrawFee: number;
  totalBet: number;
  validBet: number;
  totalPayout: number;
  ggr: number;
  totalBonus: number;
  totalCommission: number;
}

export interface InviteStat {
  date: string;
  uid: string;
  username: string;
  inviterUid?: string;
  inviterUsername?: string;
  inviteCount: number;
  achieveCount: number;
  betUserCount: number;
  depositUserCount: number;
  totalDeposit: number;
  totalWithdraw: number;
  depositFee: number;
  withdrawFee: number;
  totalBet: number;
  validBet: number;
  totalPayout: number;
  ggr: number;
}

export interface GameStat {
  date: string;
  uid: string;
  username: string;
  inviterUid?: string;
  inviterUsername?: string;
  gameType: GameType;
  totalBet: number;
  excludedBet: number;
  validBet: number;
  totalPayout: number;
  ggr: number;
}

interface MockMember {
  uid: string;
  username: string;
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

const buildMembers = (): MockMember[] => (
  Array.from({ length: TOTAL_MEMBERS }, (_, index) => {
    const uid = `U${String(10001 + index)}`;
    const username = `${usernameSeeds[index % usernameSeeds.length]}_${String(index + 1).padStart(2, '0')}`;
    const inviterEnabled = index > 0 && hashString(`${uid}-inviter-enabled`) % 10 < 3;

    if (!inviterEnabled) {
      return { uid, username };
    }

    const inviterIndex = hashString(`${uid}-inviter`) % index;
    const inviterUid = `U${String(10001 + inviterIndex)}`;
    const inviterUsername = `${usernameSeeds[inviterIndex % usernameSeeds.length]}_${String(inviterIndex + 1).padStart(2, '0')}`;

    return {
      uid,
      username,
      inviterUid,
      inviterUsername,
    };
  })
);

const mockMembers = buildMembers();

export const memberStatMembers = mockMembers;

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

  return {
    date,
    uid: member.uid,
    username: member.username,
    inviterUid: member.inviterUid,
    inviterUsername: member.inviterUsername,
    depositCount,
    totalDeposit,
    withdrawCount,
    totalWithdraw,
    depositFee,
    withdrawFee,
    totalBet,
    validBet,
    totalPayout,
    ggr: roundToTwo(totalBet - totalPayout),
    totalBonus,
    totalCommission,
  };
};

const createInviteStat = (member: MockMember, date: string): InviteStat => {
  const inviteCount = pickInt(`${member.uid}-${date}-invite-count`, 0, 8);
  const achieveCount = inviteCount === 0 ? 0 : pickInt(`${member.uid}-${date}-achieve-count`, 0, inviteCount);
  const betUserCount = pickInt(`${member.uid}-${date}-bet-user-count`, 0, 12);
  const depositUserCount = betUserCount === 0 ? 0 : pickInt(`${member.uid}-${date}-deposit-user-count`, 0, betUserCount);
  const totalDeposit = depositUserCount === 0 ? 0 : pickAmountWithDecimal(`${member.uid}-${date}-invite-total-deposit`, 200, 80000);
  const totalWithdraw = betUserCount === 0 ? 0 : pickAmountWithDecimal(`${member.uid}-${date}-invite-total-withdraw`, 0, 45000);
  const totalBet = betUserCount === 0 ? 0 : pickAmountWithDecimal(`${member.uid}-${date}-invite-total-bet`, 100, 250000);
  const excludedBet = pickAmountWithDecimal(`${member.uid}-${date}-invite-excluded-bet`, 0, Math.max(totalBet * 0.18, 0));
  const validBet = roundToTwo(Math.max(totalBet - excludedBet, 0));
  const totalPayout = roundToTwo(validBet * (pickInt(`${member.uid}-${date}-invite-payout-factor`, 72, 118) / 100));
  const depositFee = totalDeposit === 0 ? 0 : roundToTwo(totalDeposit * (pickInt(`${member.uid}-${date}-invite-deposit-fee`, 0, 18) / 1000));
  const withdrawFee = totalWithdraw === 0 ? 0 : roundToTwo(totalWithdraw * (pickInt(`${member.uid}-${date}-invite-withdraw-fee`, 0, 20) / 1000));

  return {
    date,
    uid: member.uid,
    username: member.username,
    inviterUid: member.inviterUid,
    inviterUsername: member.inviterUsername,
    inviteCount,
    achieveCount,
    betUserCount,
    depositUserCount,
    totalDeposit,
    totalWithdraw,
    depositFee,
    withdrawFee,
    totalBet,
    validBet,
    totalPayout,
    ggr: roundToTwo(totalBet - totalPayout),
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

  return {
    date,
    uid: member.uid,
    username: member.username,
    inviterUid: member.inviterUid,
    inviterUsername: member.inviterUsername,
    gameType,
    totalBet,
    excludedBet,
    validBet,
    totalPayout,
    ggr: roundToTwo(totalBet - totalPayout),
  };
};

export const personalStats: PersonalStat[] = mockMembers.flatMap((member) => dates.map(date => createPersonalStat(member, date)));

export const inviteStats: InviteStat[] = mockMembers.flatMap((member) => dates.map(date => createInviteStat(member, date)));

export const gameStats: GameStat[] = mockMembers.flatMap((member) => (
  dates.flatMap((date) => gameTypes.map(gameType => createGameStat(member, date, gameType)).filter((item): item is GameStat => item !== null))
));

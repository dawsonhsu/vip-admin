// 代理推廣後台 demo — 共用資料與型別
//
// 欄位命名 1:1 對應後端 ~/claudeproject/agency 的 JSON tag：
//   /agency/profile      → ProfileResult / profileStat
//   /agency/member/list  → MemberInfo / MemberListStat
// 金額一律 string（後端為 decimal），時間戳一律「秒級」int64。
//
// 注意：代理端前端不在已 clone 的 repo 內，以下資料為依 API 結構合成的假資料。

import dayjs from 'dayjs';
import { agencySeed, createRng, rngInt, rngPick } from '@/lib/agencyUtils';

// 每小時的 demo 快照：同一小時、同 seed 跨頁或重新載入皆相同，事件不晚於現在。
export const AGENCY_DATA_NOW = dayjs().startOf('hour').unix();

// ---- 遊戲分類（對應 fb_game_class，demo 取平台常見八類）----
export interface AgencyGameClass {
  game_class: number;
  name: string;
}

export const agencyGameClasses: AgencyGameClass[] = [
  { game_class: 1, name: '電子' },
  { game_class: 2, name: '真人' },
  { game_class: 3, name: '體育' },
  { game_class: 4, name: '彩票' },
  { game_class: 5, name: '捕魚' },
  { game_class: 6, name: '棋牌' },
  { game_class: 7, name: '電競' },
  { game_class: 8, name: '賓果' },
];

// ---- 場館 / 廠商費率（/agency/vendorrate/list → VenueSettingData）----
export interface AgencyVenueSetting {
  venue_id: string;
  name: string;
  fee_ratio: string;
}

export const agencyVenues: AgencyVenueSetting[] = [
  { venue_id: 'pg', name: 'PG Soft', fee_ratio: '12.00' },
  { venue_id: 'jili', name: 'JILI', fee_ratio: '11.50' },
  { venue_id: 'fc', name: 'FC Game', fee_ratio: '11.00' },
  { venue_id: 'jdb', name: 'JDB', fee_ratio: '11.00' },
  { venue_id: 'pp', name: 'Pragmatic Play', fee_ratio: '13.00' },
  { venue_id: 'evo', name: 'Evolution', fee_ratio: '15.00' },
  { venue_id: 'sexy', name: 'Sexy Gaming', fee_ratio: '14.00' },
  { venue_id: 'cq9', name: 'CQ9', fee_ratio: '10.50' },
  { venue_id: 'bti', name: 'BTI Sports', fee_ratio: '9.00' },
  { venue_id: 'habanero', name: 'Habanero', fee_ratio: '11.00' },
  { venue_id: 'hacksaw', name: 'Hacksaw Gaming', fee_ratio: '12.50' },
  { venue_id: 'sa', name: 'SA Gaming', fee_ratio: '14.00' },
];

// ---- PAGCOR 稅率（/agency/taxrate/list）----
export interface AgencyPagcorTaxRate {
  id: string;
  pagcor_name: string;
  pagcor_tax_ratio: string;
}

export const agencyPagcorTaxRates: AgencyPagcorTaxRate[] = [
  { id: '1', pagcor_name: 'ECasino', pagcor_tax_ratio: '35.00' },
  { id: '2', pagcor_name: 'Sports', pagcor_tax_ratio: '30.00' },
  { id: '3', pagcor_name: 'E-bingo', pagcor_tax_ratio: '25.00' },
  { id: '4', pagcor_name: 'Specialty games', pagcor_tax_ratio: '30.00' },
];

// ---- 活動禮金類型（PromoBonusDb.cash_type）----
export const agencyBonusCashTypes: Record<number, string> = {
  4001: '註冊禮金',
  4002: '首存禮金',
  4003: '二存禮金',
  4004: '三存禮金',
  4005: '每日簽到',
  4009: '每日返水',
  4012: 'VIP 升級禮金',
  4015: '生日禮金',
  4019: '彩金佣金',
  4021: '免費旋轉',
  4025: '召回禮金',
};

// ---- 佣金帳變類型（MemberTransaction.cash_type）----
export const agencyTransCashTypes: Record<number, string> = {
  1001: '佣金發放',
  1002: '佣金校準',
  1003: '系統調整',
};

// ---- 型別：會員（/agency/member/list → MemberInfo）----
export interface AgencyRealUsername {
  first_name: string;
  middle_name: string;
  last_name: string;
}

export interface AgencyMemberStat {
  bet: string;
  bet_month: string;
  valid_bet: string;
  valid_bet_month: string;
  ggr: string;
  ggr_month: string;
  deposit_amount_month: string;
  deposit_count_month: number;
  withdraw_amount_month: string;
  withdraw_count_month: number;
  dw_diff: string;
  dw_diff_month: string;
  tax: string;
  venue_fee: string;
  bonus: string;
}

export interface AgencyParentInfo {
  uid: string;
  username: string;
  nick_name: string;
  phone: string;
}

export interface AgencyMember {
  uid: string;
  username: string;
  phone: string;
  nick_name: string;
  real_usernames: AgencyRealUsername;
  vip: number;
  state: number; // 1 正常 2 停用 3 刪除
  kyc_status: number;
  created_at: number; // 秒
  last_login_at: number; // 秒
  last_login_ip: string;
  deposit_total: string;
  deposit_count: number;
  withdraw_total: string;
  withdraw_count: number;
  first_deposit: number; // 1 表示生涯曾經存款，須與存款總額及事件一致
  balance: string;
  is_online: boolean;
  parent: AgencyParentInfo;
  stat: AgencyMemberStat;
}

// ---- 登入中的代理（/agency/profile 的身分部分）----
export const agencyAccount = {
  uid: '80251143',
  username: 'agent_darren',
  phone: '09171234567',
  settle_type: 2, // 1 每週 2 每月
  // 真實 /agency/profile 的邀請欄位保留，目前前端未呈現。
  invite_code: 'FB8K2M',
  invite_link: 'https://www.filbet.com/?c=FB8K2M',
  invite_img: [
    'https://cdn.filbet.com/h5/invite/poster_01.jpg',
    'https://cdn.filbet.com/h5/invite/poster_02.jpg',
    'https://cdn.filbet.com/h5/invite/poster_03.jpg',
  ],
  last_login_ip: '112.198.64.21',
  last_login_at: 1789459200,
  last_login_device: 2,
  last_login_addr: 'Manila, Philippines',
  real_username: {
    first_name: 'Darren',
    middle_name: 'C',
    last_name: 'Hsu',
  } as AgencyRealUsername,
};

// ---- 姓名 / 帳號素材 ----
const firstNames = [
  'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlo', 'Liza', 'Mark', 'Grace',
  'Ramon', 'Elena', 'Nino', 'Cristina', 'Paolo', 'Jasmine', 'Rico', 'Divina', 'Allan', 'Mylene',
];
const middleNames = ['S', 'D', 'M', 'L', 'B', 'R', 'T', 'C', 'G', 'V'];
const lastNames = [
  'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres',
  'Ramos', 'Flores', 'Villanueva', 'Aquino', 'Castillo', 'Navarro', 'Domingo', 'Salazar',
];

// 暱稱素材刻意與 firstNames 無關：暱稱不隱碼，若沿用真實名字會把 maskName 遮掉的字洩漏回去。
const nickWords = [
  'Tiger', 'Lucky', 'Ocean', 'Falcon', 'Storm', 'Jade', 'Comet', 'Bamboo',
  'Panther', 'Sunrise', 'Cobalt', 'Mango', 'Thunder', 'Pearl', 'Zenith', 'Coral',
  'Onyx', 'Breeze', 'Summit', 'Amber',
];

function phoneOf(rng: () => number): string {
  const prefixes = ['0917', '0918', '0919', '0920', '0927', '0935', '0945', '0956', '0966', '0977'];
  return `${rngPick(rng, prefixes)}${String(rngInt(rng, 1000000, 9999999))}`;
}

function amount(rng: () => number, min: number, max: number): string {
  return (rng() * (max - min) + min).toFixed(2);
}

export interface AgencyMonthProfile {
  hasDeposit: boolean;
  hasWithdraw: boolean;
  hasBet: boolean;
}

export function agencyHistoricFirstDepositAt(seed: number, uid: string, createdAt: number): number {
  const monthStart = dayjs.unix(AGENCY_DATA_NOW).startOf('month').unix();
  const rng = createRng(agencySeed(seed, uid, 'first-deposit'));
  return Math.min(createdAt + rngInt(rng, 0, 30 * 86400), monthStart - 1);
}

type MemberIdentity = Pick<AgencyMember, 'uid' | 'created_at' | 'first_deposit'>;

// 小型展示樣本採分層抽樣：用各會員自己的 seeded roll 排序，避免 2~4 位新會員全轉換。
function sampleMembers(members: MemberIdentity[], count: number, roll: (member: MemberIdentity) => number): Set<string> {
  return new Set([...members].sort((a, b) => roll(a) - roll(b) || a.uid.localeCompare(b.uid))
    .slice(0, Math.max(0, Math.round(count))).map((member) => member.uid));
}

function monthProfiles(seed: number, members: MemberIdentity[], month: string): Map<string, AgencyMonthProfile> {
  const period = dayjs(month).startOf('month');
  const current = period.isSame(dayjs.unix(AGENCY_DATA_NOW), 'month');
  const alive = members.filter((member) => member.created_at <= Math.min(AGENCY_DATA_NOW, period.endOf('month').unix()));
  const rolls = new Map(alive.map((member) => {
    const rng = createRng(agencySeed(seed, member.uid, month, 'profile'));
    return [member.uid, [rng(), rng(), rng()]] as const;
  }));
  const roll = (index: number) => (member: MemberIdentity) => rolls.get(member.uid)![index];
  const newMembers = alive.filter((member) => member.created_at >= period.unix());
  const oldMembers = alive.filter((member) => member.created_at < period.unix());
  const firstAt = (member: MemberIdentity) => agencyHistoricFirstDepositAt(seed, member.uid, member.created_at);
  const eligible = alive.filter((member) => member.first_deposit === 1 && firstAt(member) <= period.endOf('month').unix());
  const firstMembers = current ? [] : eligible.filter((member) => firstAt(member) >= period.unix());
  const deposits = current ? sampleMembers(newMembers, newMembers.length * 0.45, roll(0)) : new Set<string>();
  firstMembers.forEach((member) => deposits.add(member.uid));
  const repeatCandidates = eligible.filter((member) => !deposits.has(member.uid) && member.created_at < period.unix());
  // 已有存款經驗才會續存；未曾首存者不能出現存款流水。
  const repeat = sampleMembers(repeatCandidates, oldMembers.length * 0.60 - firstMembers.filter((member) => member.created_at < period.unix()).length, roll(0));
  repeat.forEach((uid) => deposits.add(uid));
  const depositMembers = alive.filter((member) => deposits.has(member.uid));
  // 只有曾經首存的會員才可能有結餘可動用；從未首存者當月不得投注或提款。
  const nonDepositMembers = oldMembers.filter((member) => !deposits.has(member.uid) && member.first_deposit === 1);
  const bettingWithoutDeposit = sampleMembers(nonDepositMembers, alive.length * 0.10, roll(2));
  // 58% 目標取整若剛好等於存款人數，少抽一位，保留小樣本的行為差異。
  const betTarget = Math.round(alive.length * 0.58);
  const betting = sampleMembers(depositMembers,
    betTarget - (betTarget === deposits.size ? 1 : 0) - bettingWithoutDeposit.size, roll(2));
  bettingWithoutDeposit.forEach((uid) => betting.add(uid));
  const withdrawing = sampleMembers(depositMembers, depositMembers.length * (0.35 / 0.60), roll(1));
  sampleMembers(nonDepositMembers.filter((member) => betting.has(member.uid)), alive.length * 0.03, roll(1))
    .forEach((uid) => withdrawing.add(uid));
  sampleMembers(nonDepositMembers.filter((member) => !betting.has(member.uid)), alive.length * 0.02, roll(1))
    .forEach((uid) => withdrawing.add(uid));
  return new Map(alive.map((member) => [member.uid, {
    hasDeposit: deposits.has(member.uid), hasWithdraw: withdrawing.has(member.uid), hasBet: betting.has(member.uid),
  }]));
}

const monthProfileCache = new Map<string, Map<string, AgencyMonthProfile>>();

// 會員列表、歷史事件、禮金共用同一月份與同一批會員的行為輪廓。
export function agencyMonthProfile(seed: number, uid: string, month: string): AgencyMonthProfile {
  const key = `${seed}:${month}`;
  let profiles = monthProfileCache.get(key);
  if (!profiles) {
    profiles = monthProfiles(seed, agencyMembers, month);
    monthProfileCache.set(key, profiles);
  }
  return profiles.get(uid) ?? { hasDeposit: false, hasWithdraw: false, hasBet: false };
}

/** 相同 seed 與小時快照必得相同會員；基本資料與月度行為分開抽樣。 */
export function generateAgencyMembers(seed: number, count = 60): AgencyMember[] {
  const now = AGENCY_DATA_NOW;
  const month = dayjs.unix(now).startOf('month');
  const members: AgencyMember[] = Array.from({ length: count }, (_, index) => {
    const rng = createRng(agencySeed(seed, index, 'member'));
    const first = rngPick(rng, firstNames);
    const middle = rngPick(rng, middleNames);
    const last = rngPick(rng, lastNames);
    const uid = String(80260000 + index * 7 + rngInt(rng, 1, 6));
    // 帳號與暱稱同源於 nickWords，與真實姓名無關：兩者都不隱碼，沿用本名會抵銷 maskName。
    const nick = rngPick(rng, nickWords);
    const bet = Number(amount(rng, 20000, 4000000));
    const validBet = bet * (0.82 + rng() * 0.15);
    const ggr = validBet * (0.02 + rng() * 0.06);
    const createdAt = now - rngInt(rng, 86400, 86400 * 400);
    return {
      uid, username: `${nick.toLowerCase()}${rngInt(rng, 10, 99)}`,
      phone: phoneOf(rng), nick_name: `${nick}${rngInt(rng, 1, 999)}`,
      real_usernames: { first_name: first, middle_name: middle, last_name: last },
      vip: rngInt(rng, 0, 8), state: rng() > 0.94 ? 2 : 1,
      kyc_status: rngPick(rng, [1, 1, 1, 2, 4, 5, 5]), created_at: createdAt,
      last_login_at: createdAt,
      last_login_ip: `112.${rngInt(rng, 190, 210)}.${rngInt(rng, 1, 254)}.${rngInt(rng, 1, 254)}`,
      deposit_total: amount(rng, 5000, 900000), deposit_count: rngInt(rng, 3, 220),
      // 生涯 GGR 恆為正（平台贏），所以累計提款必定小於累計存款；實際值在下方依存款推算。
      withdraw_total: '0.00', withdraw_count: rngInt(rng, 1, 90),
      first_deposit: 0, balance: amount(rng, 0, 45000), is_online: false,
      parent: { uid: agencyAccount.uid, username: agencyAccount.username, nick_name: 'Darren', phone: agencyAccount.phone },
      stat: {
        bet: bet.toFixed(2), bet_month: '0.00', valid_bet: validBet.toFixed(2), valid_bet_month: '0.00',
        ggr: ggr.toFixed(2), ggr_month: '0.00',
        deposit_amount_month: '0.00', deposit_count_month: 0, withdraw_amount_month: '0.00', withdraw_count_month: 0,
        dw_diff: '0.00', dw_diff_month: '0.00', tax: (ggr * 0.32).toFixed(2),
        venue_fee: (validBet * 0.012).toFixed(2), bonus: amount(rng, 0, 12000),
      },
    };
  });
  // 帳號是登入身分，必須唯一；nickWords × 兩位數的組合會撞號，依固定順序遞增去重。
  const usedUsernames = new Set<string>();
  members.forEach((member) => {
    let candidate = member.username;
    const base = candidate.replace(/\d+$/, '');
    let suffix = Number(candidate.slice(base.length));
    while (usedUsernames.has(candidate)) {
      suffix = suffix >= 99 ? 10 : suffix + 1;
      candidate = `${base}${suffix}`;
    }
    usedUsernames.add(candidate);
    member.username = candidate;
  });
  // 新近註冊仍有未轉換者；較久的會員累積較高的生涯首存率。
  const cohorts = new Map<string, AgencyMember[]>();
  members.forEach((member) => {
    const key = dayjs.unix(member.created_at).format('YYYY-MM');
    cohorts.set(key, [...(cohorts.get(key) ?? []), member]);
  });
  cohorts.forEach((cohort, key) => {
    const rate = dayjs(key).isBefore(month.subtract(2, 'month')) ? 0.85 : 0.45;
    const converted = sampleMembers(cohort, cohort.length * rate,
      (member) => createRng(agencySeed(seed, member.uid, 'conversion'))());
    cohort.forEach((member) => { member.first_deposit = converted.has(member.uid) ? 1 : 0; });
  });
  const profiles = monthProfiles(seed, members, month.format('YYYY-MM'));
  return members.map((member) => {
    const rng = createRng(agencySeed(seed, member.uid, month.format('YYYY-MM'), 'amounts'));
    const profile = profiles.get(member.uid)!;
    const dormant = !profile.hasDeposit && !profile.hasWithdraw && !profile.hasBet;
    const isNew = member.created_at >= month.unix();
    const deposit = profile.hasDeposit ? amount(rng, 800, 180000) : '0.00';
    const withdraw = profile.hasWithdraw ? amount(rng, 400, 120000) : '0.00';
    const depositCount = profile.hasDeposit ? rngInt(rng, 1, 26) : 0;
    const withdrawCount = profile.hasWithdraw ? rngInt(rng, 1, 12) : 0;
    const ratio = profile.hasBet ? 0.08 + rng() * 0.22 : 0;
    if (isNew) member.first_deposit = profile.hasDeposit ? 1 : 0;
    // 從未首存者沒有任何資金進出，生涯存提、投注與 GGR 一律為 0，餘額只剩未使用的註冊禮金。
    const neverDeposited = member.first_deposit === 0;
    // 累計提款＝累計存款 ×0.35~0.95：生涯 GGR 為正代表平台贏錢，提款不可能超過存款。
    // 累計存款同時墊高到「當月提款 ÷ 比例」，確保累計提款不低於當月提款。
    const payout = 0.35 + rng() * 0.6;
    const depositTotal = neverDeposited ? '0.00'
      : Math.max(Number(deposit), isNew ? 0 : Number(member.deposit_total), Number(withdraw) / payout).toFixed(2);
    const withdrawTotal = neverDeposited ? '0.00' : (Number(depositTotal) * payout).toFixed(2);
    const bet = neverDeposited ? '0.00' : member.stat.bet;
    const validBet = neverDeposited ? '0.00' : member.stat.valid_bet;
    const ggr = neverDeposited ? '0.00' : member.stat.ggr;
    const difference = (a: string, b: string) => ((Math.round(Number(a) * 100) - Math.round(Number(b) * 100)) / 100).toFixed(2);
    return {
      ...member, deposit_total: depositTotal, withdraw_total: withdrawTotal,
      deposit_count: Number(depositTotal) === 0 ? 0 : isNew ? depositCount : Math.max(depositCount, member.deposit_count),
      withdraw_count: Number(withdrawTotal) === 0 ? 0 : isNew ? withdrawCount : Math.max(withdrawCount, member.withdraw_count),
      balance: neverDeposited ? Math.min(Number(member.balance), Number(member.stat.bonus)).toFixed(2) : member.balance,
      last_login_at: Math.max(member.created_at, now - (dormant ? rngInt(rng, 86400 * 20, 86400 * 180) : rngInt(rng, 300, 86400 * 14))),
      is_online: !dormant && rng() > 0.6,
      stat: {
        ...member.stat, bet, valid_bet: validBet, ggr,
        bet_month: (Number(bet) * ratio).toFixed(2),
        valid_bet_month: (Number(validBet) * ratio).toFixed(2), ggr_month: (Number(ggr) * ratio).toFixed(2),
        deposit_amount_month: deposit, deposit_count_month: depositCount,
        withdraw_amount_month: withdraw, withdraw_count_month: withdrawCount,
        tax: (Number(ggr) * 0.32).toFixed(2), venue_fee: (Number(validBet) * 0.012).toFixed(2),
        dw_diff: difference(depositTotal, withdrawTotal), dw_diff_month: difference(deposit, withdraw),
      },
    };
  });
}

// 全站共用的下線名單（固定 seed，跨頁一致）
export const AGENCY_MEMBER_SEED = agencySeed('agency-members', 20260916);
export const agencyMembers: AgencyMember[] = generateAgencyMembers(AGENCY_MEMBER_SEED);

/** 活躍會員判定門檻（對應 /agency/ladder 回傳的 active_* 欄位） */
export const agencyActiveThreshold = {
  active_bet_amount: '3000.00',
  active_deposit_amount: '500.00',
};

/** 依門檻篩出活躍會員 */
export function agencyActiveMembers(members: AgencyMember[] = agencyMembers): AgencyMember[] {
  const betGate = Number(agencyActiveThreshold.active_bet_amount);
  const depositGate = Number(agencyActiveThreshold.active_deposit_amount);
  return members.filter(
    (m) =>
      Number(m.stat.valid_bet_month) >= betGate &&
      Number(m.stat.deposit_amount_month) >= depositGate,
  );
}

// 代理推广后台 demo — 共用数据与型别
//
// 字段命名 1:1 对应后端 ~/claudeproject/agency 的 JSON tag：
//   /agency/profile      → ProfileResult / profileStat
//   /agency/member/list  → MemberInfo / MemberListStat
// 金额一律 string（后端为 decimal），时间戳一律「秒级」int64。
//
// 注意：代理端前端不在已 clone 的 repo 内，以下数据为依 API 结构合成的假数据。

import dayjs from 'dayjs';
import { agencySeed, createRng, rngInt, rngPick } from '@/lib/agencyUtils';

// 每小时的 demo 快照：同一小时、同 seed 跨页或重新载入皆相同，事件不晚于现在。
export const AGENCY_DATA_NOW = dayjs().startOf('hour').unix();

// ---- 游戏分类（对应 fb_game_class，demo 取平台常见八类）----
export interface AgencyGameClass {
  game_class: number;
  name: string;
}

export const agencyGameClasses: AgencyGameClass[] = [
  { game_class: 1, name: '电子' },
  { game_class: 2, name: '真人' },
  { game_class: 3, name: '体育' },
  { game_class: 4, name: '彩票' },
  { game_class: 5, name: '捕鱼' },
  { game_class: 6, name: '棋牌' },
  { game_class: 7, name: '电竞' },
  { game_class: 8, name: '宾果' },
];

// ---- 场馆 / 厂商费率（/agency/vendorrate/list → VenueSettingData）----
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

// ---- PAGCOR 税率（/agency/taxrate/list）----
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

// ---- 活动礼金类型（PromoBonusDb.cash_type）----
export const agencyBonusCashTypes: Record<number, string> = {
  4001: '注册礼金',
  4002: '首存礼金',
  4003: '二存礼金',
  4004: '三存礼金',
  4005: '每日签到',
  4009: '每日返水',
  4012: 'VIP 升级礼金',
  4015: '生日礼金',
  4019: '彩金佣金',
  4021: '免费旋转',
  4025: '召回礼金',
};

// ---- 佣金账变类型（MemberTransaction.cash_type）----
export const agencyTransCashTypes: Record<number, string> = {
  1001: '佣金发放',
  1002: '佣金校准',
  1003: '系统调整',
};

// ---- 型别：会员（/agency/member/list → MemberInfo）----
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
  state: number; // 1 正常 2 停用 3 删除
  kyc_status: number;
  created_at: number; // 秒
  last_login_at: number; // 秒
  last_login_ip: string;
  deposit_total: string;
  deposit_count: number;
  withdraw_total: string;
  withdraw_count: number;
  first_deposit: number; // 1 表示生涯曾经存款，须与存款总额及事件一致
  balance: string;
  is_online: boolean;
  parent: AgencyParentInfo;
  stat: AgencyMemberStat;
}

// ---- 登录中的代理（/agency/profile 的身分部分）----
export const agencyAccount = {
  uid: '80251143',
  username: 'agent_darren',
  phone: '09171234567',
  settle_type: 2, // 1 每周 2 每月
  // 后端 agency/model/agency.go：invite_link = AgencyUrl + "?u=" + invite_code
  invite_code: 'FB8K2M',
  invite_link: 'https://www.filbet.com/?u=FB8K2M',
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

// ---- 代理专属域名（fb_agency_domain，由运营在管理后台配置）----
// 会员注册时 modules/members.go 以来源域名比对 state=1 的记录，命中即归属该代理，不需带邀请码。
// 代理端只看得到自己名下、启用中的域名；后端目前没有代理端查询 API，上线前需新增。
export interface AgencyDomain {
  id: string;
  domain: string;
  remark: string;
  created_at: number;
}

export const agencyDomains: AgencyDomain[] = [
  { id: '1847201', domain: 'darrenwin.com', remark: 'FB 广告投放', created_at: 1786118400 },
  { id: '1847202', domain: 'play.darrenwin.com', remark: 'TikTok 主页链接', created_at: 1788796800 },
];

// ---- 姓名 / 账号素材 ----
const firstNames = [
  'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlo', 'Liza', 'Mark', 'Grace',
  'Ramon', 'Elena', 'Nino', 'Cristina', 'Paolo', 'Jasmine', 'Rico', 'Divina', 'Allan', 'Mylene',
];
const middleNames = ['S', 'D', 'M', 'L', 'B', 'R', 'T', 'C', 'G', 'V'];
const lastNames = [
  'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres',
  'Ramos', 'Flores', 'Villanueva', 'Aquino', 'Castillo', 'Navarro', 'Domingo', 'Salazar',
];

// 昵称素材刻意与 firstNames 无关：昵称不隐码，若沿用真实名字会把 maskName 遮掉的字泄漏回去。
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

// 小型展示样本采分层抽样：用各会员自己的 seeded roll 排序，避免 2~4 位新会员全转换。
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
  // 已有存款经验才会续存；未曾首存者不能出现存款流水。
  const repeat = sampleMembers(repeatCandidates, oldMembers.length * 0.60 - firstMembers.filter((member) => member.created_at < period.unix()).length, roll(0));
  repeat.forEach((uid) => deposits.add(uid));
  const depositMembers = alive.filter((member) => deposits.has(member.uid));
  // 只有曾经首存的会员才可能有结余可动用；从未首存者当月不得投注或提款。
  const nonDepositMembers = oldMembers.filter((member) => !deposits.has(member.uid) && member.first_deposit === 1);
  const bettingWithoutDeposit = sampleMembers(nonDepositMembers, alive.length * 0.10, roll(2));
  // 58% 目标取整若刚好等于存款人数，少抽一位，保留小样本的行为差异。
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

// 会员列表、历史事件、礼金共用同一月份与同一批会员的行为轮廓。
export function agencyMonthProfile(seed: number, uid: string, month: string): AgencyMonthProfile {
  const key = `${seed}:${month}`;
  let profiles = monthProfileCache.get(key);
  if (!profiles) {
    profiles = monthProfiles(seed, agencyMembers, month);
    monthProfileCache.set(key, profiles);
  }
  return profiles.get(uid) ?? { hasDeposit: false, hasWithdraw: false, hasBet: false };
}

/** 相同 seed 与小时快照必得相同会员；基本数据与月度行为分开抽样。 */
export function generateAgencyMembers(seed: number, count = 60): AgencyMember[] {
  const now = AGENCY_DATA_NOW;
  const month = dayjs.unix(now).startOf('month');
  const members: AgencyMember[] = Array.from({ length: count }, (_, index) => {
    const rng = createRng(agencySeed(seed, index, 'member'));
    const first = rngPick(rng, firstNames);
    const middle = rngPick(rng, middleNames);
    const last = rngPick(rng, lastNames);
    const uid = String(80260000 + index * 7 + rngInt(rng, 1, 6));
    // 账号与昵称同源于 nickWords，与真实姓名无关：两者都不隐码，沿用本名会抵销 maskName。
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
      // 生涯 GGR 恒为正（平台赢），所以累计提款必定小于累计存款；实际值在下方依存款推算。
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
  // 账号是登录身分，必须唯一；nickWords × 两位数的组合会撞号，依固定顺序递增去重。
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
  // 新近注册仍有未转换者；较久的会员累积较高的生涯首存率。
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
    // 从未首存者没有任何资金进出，生涯存提、投注与 GGR 一律为 0，余额只剩未使用的注册礼金。
    const neverDeposited = member.first_deposit === 0;
    // 累计提款＝累计存款 ×0.35~0.95：生涯 GGR 为正代表平台赢钱，提款不可能超过存款。
    // 累计存款同时垫高到「当月提款 ÷ 比例」，确保累计提款不低于当月提款。
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

// 全站共用的下线名单（固定 seed，跨页一致）
export const AGENCY_MEMBER_SEED = agencySeed('agency-members', 20260916);
export const agencyMembers: AgencyMember[] = generateAgencyMembers(AGENCY_MEMBER_SEED);

/** 活跃会员判定门槛（对应 /agency/ladder 回传的 active_* 字段） */
export const agencyActiveThreshold = {
  active_bet_amount: '3000.00',
  active_deposit_amount: '500.00',
};

/** 依门槛筛出活跃会员 */
export function agencyActiveMembers(members: AgencyMember[] = agencyMembers): AgencyMember[] {
  const betGate = Number(agencyActiveThreshold.active_bet_amount);
  const depositGate = Number(agencyActiveThreshold.active_deposit_amount);
  return members.filter(
    (m) =>
      Number(m.stat.valid_bet_month) >= betGate &&
      Number(m.stat.deposit_amount_month) >= depositGate,
  );
}

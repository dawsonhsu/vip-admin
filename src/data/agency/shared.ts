// 代理推廣後台 demo — 共用資料與型別
//
// 欄位命名 1:1 對應後端 ~/claudeproject/agency 的 JSON tag：
//   /agency/profile      → ProfileResult / profileStat
//   /agency/member/list  → MemberInfo / MemberListStat
// 金額一律 string（後端為 decimal），時間戳一律「秒級」int64。
//
// 注意：代理端前端不在已 clone 的 repo 內，以下資料為依 API 結構合成的假資料。

import { agencySeed, createRng, rngInt, rngPick } from '@/lib/agencyUtils';

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
  first_deposit: number;
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

function phoneOf(rng: () => number): string {
  const prefixes = ['0917', '0918', '0919', '0920', '0927', '0935', '0945', '0956', '0966', '0977'];
  return `${rngPick(rng, prefixes)}${String(rngInt(rng, 1000000, 9999999))}`;
}

function amount(rng: () => number, min: number, max: number): string {
  return (rng() * (max - min) + min).toFixed(2);
}

/**
 * 產生代理的下線會員名單。相同 seed 必得相同結果，
 * 讓會員列表 / 活躍會員 / 投注紀錄 / 禮金各頁的會員能對得起來。
 */
export function generateAgencyMembers(seed: number, count = 60): AgencyMember[] {
  const rng = createRng(seed);
  const now = Math.floor(Date.now() / 1000);

  return Array.from({ length: count }, (_, index) => {
    const first = rngPick(rng, firstNames);
    const middle = rngPick(rng, middleNames);
    const last = rngPick(rng, lastNames);
    const uid = String(80260000 + index * 7 + rngInt(rng, 1, 6));
    const username = `${first.toLowerCase()}${rngInt(rng, 10, 99)}`;

    const betTotal = Number(amount(rng, 20000, 4000000));
    const validBetTotal = betTotal * (0.82 + rng() * 0.15);
    const ggrTotal = validBetTotal * (0.02 + rng() * 0.06);

    // 約 35% 的下線當月沉睡（無存款、無投注），符合真實代理下線結構；
    // 若全員皆有當月流水，活躍會員數會等於會員總數，活躍門檻就失去意義。
    const isDormant = rng() < 0.35;
    const monthRatio = isDormant ? 0 : 0.08 + rng() * 0.22;

    const depositMonth = isDormant ? 0 : Number(amount(rng, 800, 180000));
    const withdrawMonth = isDormant ? 0 : depositMonth * (0.3 + rng() * 0.8);
    const depositTotal = Number(amount(rng, 5000, 900000));
    const withdrawTotal = depositTotal * (0.35 + rng() * 0.6);

    return {
      uid,
      username,
      phone: phoneOf(rng),
      nick_name: `${first}${rngInt(rng, 1, 999)}`,
      real_usernames: { first_name: first, middle_name: middle, last_name: last },
      vip: rngInt(rng, 0, 8),
      state: rng() > 0.94 ? 2 : 1,
      kyc_status: rngPick(rng, [1, 1, 1, 2, 4, 5, 5]),
      created_at: now - rngInt(rng, 86400, 86400 * 400),
      // 沉睡會員的最後登入時間拉遠，讓列表上的「沉睡」狀態前後一致
      last_login_at: isDormant
        ? now - rngInt(rng, 86400 * 20, 86400 * 180)
        : now - rngInt(rng, 300, 86400 * 14),
      last_login_ip: `112.${rngInt(rng, 190, 210)}.${rngInt(rng, 1, 254)}.${rngInt(rng, 1, 254)}`,
      deposit_total: depositTotal.toFixed(2),
      deposit_count: rngInt(rng, 3, 220),
      withdraw_total: withdrawTotal.toFixed(2),
      withdraw_count: rngInt(rng, 1, 90),
      first_deposit: rng() > 0.15 ? 1 : 0,
      balance: amount(rng, 0, 45000),
      is_online: isDormant ? false : rng() > 0.6,
      parent: {
        uid: agencyAccount.uid,
        username: agencyAccount.username,
        nick_name: 'Darren',
        phone: agencyAccount.phone,
      },
      stat: {
        bet: betTotal.toFixed(2),
        bet_month: (betTotal * monthRatio).toFixed(2),
        valid_bet: validBetTotal.toFixed(2),
        valid_bet_month: (validBetTotal * monthRatio).toFixed(2),
        ggr: ggrTotal.toFixed(2),
        ggr_month: (ggrTotal * monthRatio).toFixed(2),
        // 筆數必須跟金額同進退：金額為 0 就不能有筆數，有金額就至少 1 筆
        deposit_amount_month: depositMonth.toFixed(2),
        deposit_count_month: depositMonth > 0 ? rngInt(rng, 1, 26) : 0,
        withdraw_amount_month: withdrawMonth.toFixed(2),
        withdraw_count_month: withdrawMonth > 0 ? rngInt(rng, 1, 12) : 0,
        dw_diff: (depositTotal - withdrawTotal).toFixed(2),
        dw_diff_month: (depositMonth - withdrawMonth).toFixed(2),
        tax: (ggrTotal * 0.32).toFixed(2),
        venue_fee: (validBetTotal * 0.012).toFixed(2),
        bonus: amount(rng, 0, 12000),
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

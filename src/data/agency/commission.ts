import dayjs from 'dayjs';
import { agencyEventTime, agencySeed, createRng, rngInt, rngPick } from '@/lib/agencyUtils';
import {
  agencyAccount, agencyActiveMembers, agencyBonusCashTypes, agencyGameClasses,
  agencyMembers, agencyMonthProfile, agencyPagcorTaxRates, agencyTransCashTypes, agencyVenues, AGENCY_DATA_NOW, AGENCY_MEMBER_SEED,
} from './shared';

// 全部為合成展示資料；報表與帳變共用種子，讓已通過佣金和實際發放可互相核對。
export const AGENCY_COMMISSION_SEED = agencySeed('agency-commission', 20260916);
export const AGENCY_BONUS_SEED = agencySeed('agency-bonus', 20260916);

export interface AgencyCommissionRow {
  id: string;
  settle_begin_date: number;
  settle_end_date: number;
  uid: string;
  username: string;
  phone: string;
  parent_uid: string;
  parent_name: string;
  last_tax_ggr: string;
  last_profit: string;
  remaining_tax_ggr: string;
  remaining_profit: string;
  ggr: string;
  tax_ggr: string;
  profit: string;
  active: number;
  rebate: string;
  tax: string;
  venue_fee: string;
  bonus: string;
  adjust: string;
  amount: string;
  percent: string;
  desc: string;
  state: number;
  created_at: number;
  updated_at: number;
  reach_standard: number;
}

export interface AgencyCommissionTrans {
  id: string;
  bill_no: string;
  uid: string;
  username: string;
  phone: string;
  cash_type: number;
  cash_type_fmt: string;
  business_type: number;
  amount: string;
  before_amount: string;
  after_amount: string;
  created_at: number;
  state: number;
  remark: string;
  operator_name: string;
  device: string;
}

export interface AgencyBonusRow {
  id: string;
  uid: string;
  username: string;
  phone: string;
  parent_uid: string;
  parent_name: string;
  activity_id: string;
  cash_type: number;
  bonus: string;
  multiple: string;
  created_at: number;
  review_state: number;
  review_at: number;
  review_name: string;
  remark: string;
  created_name: string;
}

export interface ActiveMemberItem {
  uid: string;
  username: string;
  phone: string;
  deposit_amount: string;
  valid_bet_amount: string;
}

const cents = (value: number | string) => Math.round(Number(value) * 100);
const decimal = (value: number) => (value / 100).toFixed(2);
const memberGgr = () => agencyMembers.reduce((sum, member) => sum + cents(member.stat.ggr_month), 0);

// 以分為單位分攤，最後一筆承接尾差，避免明細加總和主表差一分。
function allocate(total: number, weights: number[]): number[] {
  const denominator = weights.reduce((sum, value) => sum + value, 0) || 1;
  let allocated = 0;
  return weights.map((weight, index) => {
    const value = index === weights.length - 1 ? total - allocated : Math.round(total * weight / denominator);
    allocated += value;
    return value;
  });
}

export function agencyCommissionDetailSeed(row: AgencyCommissionRow): number {
  return agencySeed(row.id);
}

// /agency/child/ggr：將共用會員當月 GGR 依種子分配到遊戲分類。
export function agencyChildGgrDetail(seed: number, scale = 1) {
  const rng = createRng(seed);
  const weights = agencyGameClasses.map((_, index) => agencyMembers.reduce(
    (sum, member, memberIndex) => sum + (memberIndex % agencyGameClasses.length === index ? Number(member.stat.ggr_month) : 0), 0,
  ) * (0.8 + rng() * 0.4));
  const amounts = allocate(Math.round(memberGgr() * scale), weights);
  return agencyGameClasses.map((game, index) => ({ ...game, ggr: decimal(amounts[index]) }));
}

// /agency/commission/pagcor/tax：分類稅率取自共用展示費率，稅基來自同一批會員 GGR。
export function agencyPagcorTaxDetail(seed: number, ggrTotal: number | string) {
  return agencyChildGgrDetail(seed, memberGgr() ? cents(ggrTotal) / memberGgr() : 0).map((item) => {
    const rateId = [3, 7].includes(item.game_class) ? '2' : item.game_class === 8 ? '3' : [4, 5, 6].includes(item.game_class) ? '4' : '1';
    const rate = agencyPagcorTaxRates.find((itemRate) => itemRate.id === rateId)!;
    return { ...item, ratio: rate.pagcor_tax_ratio, fee: decimal(Math.round(cents(item.ggr) * Number(rate.pagcor_tax_ratio) / 100)) };
  });
}

// /agency/commission/venue/fee：依會員場館費權重分攤本期 GGR，再套用共用場館費率。
export function agencyVenueFeeDetail(seed: number, ggrTotal: number | string) {
  const rng = createRng(agencySeed(seed, 'venue'));
  const weights = agencyVenues.map((_, index) => agencyMembers.reduce(
    (sum, member, memberIndex) => sum + (memberIndex % agencyVenues.length === index ? Number(member.stat.venue_fee) : 0), 0,
  ) * (0.8 + rng() * 0.4));
  const amounts = allocate(cents(ggrTotal), weights);
  return agencyVenues.map((venue, index) => ({
    venue_id: venue.venue_id,
    venue_name: venue.name,
    ggr: decimal(amounts[index]),
    ratio: venue.fee_ratio,
    fee: decimal(Math.round(amounts[index] * Number(venue.fee_ratio) / 100)),
  }));
}

export function generateAgencyCommissions(seed: number): AgencyCommissionRow[] {
  const now = dayjs();
  const currentMonth = now.startOf('month');
  const baseGgr = memberGgr();
  const baseBonus = agencyMembers.reduce((sum, member) => sum + cents(member.stat.bonus), 0);
  const activeMembers = agencyActiveMembers();
  const rows: AgencyCommissionRow[] = [];
  // 展示起始月份承接更早的負結餘；各月只將未抵銷的負結餘帶入下期。
  let lastTaxGgr = -Math.round(baseGgr * 0.06);
  let lastProfit = lastTaxGgr;
  for (let offset = 11; offset >= 0; offset--) {
    const month = currentMonth.subtract(offset, 'month');
    const rng = createRng(agencySeed(seed, month.format('YYYY-MM')));
    const factor = offset === 0 ? 1 : offset === 8 ? 0.08 + rng() * 0.02 : 0.65 + rng() * 0.34;
    const id = `CM${month.format('YYYYMM')}${agencyAccount.uid}`;
    const detailSeed = agencySeed(id);
    const ggr = Math.round(baseGgr * factor);
    const tax = agencyPagcorTaxDetail(detailSeed, decimal(ggr)).reduce((sum, item) => sum + cents(item.fee), 0);
    const venueFee = agencyVenueFeeDetail(detailSeed, decimal(ggr)).reduce((sum, item) => sum + cents(item.fee), 0);
    // 活動禮金多為固定檔期成本，低流水月份不會等比縮減。
    // offset 8 因此出現稅後 GGR 為負，可在報表上實際看到「負結餘帶入下期」這條規則生效。
    const bonus = offset === 8 ? Math.round(baseBonus * 0.85) : Math.round(baseBonus * factor);
    const active = Math.min(activeMembers.length, Math.floor(activeMembers.length * factor));
    const state = offset === 0 ? 2 : offset === 4 ? 4 : offset === 8 ? 1 : 3;
    const reachStandard = state === 1 ? 1 : 2;
    const percent = active >= 50 ? 35 : active >= 30 ? 30 : 25;
    const adjust = offset % 3 === 1 ? rngInt(rng, -500, 800) * 100 : 0;
    // 應發金額計算鏈：tax_ggr = ggr - tax - venue_fee - bonus；
    // profit = tax_ggr + last_profit；amount = profit × percent% + adjust；不達標時應發金額歸零。
    const taxGgr = ggr - tax - venueFee - bonus;
    const profit = taxGgr + lastProfit;
    const amount = reachStandard === 1 ? 0 : Math.round(profit * percent / 100) + adjust;
    const remainingTaxGgr = Math.min(0, taxGgr + lastTaxGgr);
    const remainingProfit = Math.min(0, profit);
    const createdAt = offset === 0 ? now.unix() : month.add(1, 'month').date(1).hour(8).unix();
    rows.push({
      id, settle_begin_date: month.unix(), settle_end_date: month.endOf('month').unix(),
      uid: agencyAccount.uid, username: agencyAccount.username, phone: agencyAccount.phone,
      parent_uid: '', parent_name: '', last_tax_ggr: decimal(lastTaxGgr), last_profit: decimal(lastProfit),
      remaining_tax_ggr: decimal(remainingTaxGgr), remaining_profit: decimal(remainingProfit),
      ggr: decimal(ggr), tax_ggr: decimal(taxGgr), profit: decimal(profit), active,
      rebate: '0.00', tax: decimal(tax), venue_fee: decimal(venueFee), bonus: decimal(bonus),
      adjust: decimal(adjust), amount: decimal(amount), percent: percent.toFixed(2),
      desc: state === 1 ? '活躍會員未達展示門檻，應發佣金為零' : state === 4 ? '結算資料待補正，本期審核拒絕' : offset === 0 ? '本月暫估，待月底結算審核' : '月結佣金；審核通過後於次月 5 日發放',
      state, created_at: createdAt, updated_at: Math.min(now.unix(), createdAt + (offset ? 86400 : 0)),
      reach_standard: reachStandard,
    });
    lastTaxGgr = remainingTaxGgr;
    lastProfit = remainingProfit;
  }
  return rows.reverse();
}

// /agency/commission/trans/list：先建立完整時間序列，再按月份篩選，保留跨月期初餘額。
export function generateAgencyTransactions(seed: number, month: string): AgencyCommissionTrans[] {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return [];
  const now = dayjs();
  const commissions = generateAgencyCommissions(seed);
  const events: Array<{ id: string; cash_type: number; amount: string; created_at: number; remark: string }> = [];
  for (const row of commissions) {
    if (row.state !== 3) continue;
    const payoutAt = dayjs.unix(row.settle_begin_date).add(1, 'month').date(5).hour(10).unix();
    if (payoutAt > now.unix()) continue;
    events.push({ id: `${row.id}-PAY`, cash_type: 1001, amount: row.amount, created_at: payoutAt, remark: `${dayjs.unix(row.settle_begin_date).format('YYYY-MM')} 月結佣金（${row.id}）` });
  }
  for (const offset of [2, 1, 0]) {
    const period = now.startOf('month').subtract(offset, 'month');
    const rng = createRng(agencySeed(seed, period.format('YYYY-MM'), 'adjustments'));
    for (const cashType of [1002, 1003]) {
      const createdAt = period.date(cashType === 1002 ? 9 : 14).hour(11).unix();
      if (createdAt > now.unix()) continue;
      events.push({
        id: `CT${period.format('YYYYMM')}-${cashType}`, cash_type: cashType,
        amount: decimal(rngInt(rng, 50, 300) * 100 * (cashType === 1003 ? -1 : 1)), created_at: createdAt,
        remark: cashType === 1002 ? '歷史佣金差額補發（展示）' : '重複差額沖正（展示）',
      });
    }
  }
  let balance = 0;
  return events.sort((a, b) => a.created_at - b.created_at || a.id.localeCompare(b.id)).map((event) => {
    const before = balance;
    balance += cents(event.amount);
    return {
      ...event, bill_no: `AGT-${event.id}`, uid: agencyAccount.uid, username: agencyAccount.username, phone: agencyAccount.phone,
      cash_type_fmt: agencyTransCashTypes[event.cash_type], business_type: event.cash_type,
      before_amount: decimal(before), after_amount: decimal(balance), state: 1,
      operator_name: event.cash_type === 1001 ? '結算系統' : '財務審核員', device: '管理後台',
    };
  }).filter((row) => dayjs.unix(row.created_at).format('YYYY-MM') === month);
}

export function generateAgencyBonuses(seed: number, count = 300): AgencyBonusRow[] {
  const rng = createRng(seed);
  const now = dayjs.unix(AGENCY_DATA_NOW);
  const cashTypes = Object.keys(agencyBonusCashTypes).map(Number);
  const periods = Array.from({ length: 6 }, (_, offset) => {
    const period = now.startOf('month').subtract(offset, 'month');
    const end = Math.min(now.unix(), period.endOf('month').unix());
    const eligibleMembers = agencyMembers.filter((member) => {
      if (member.created_at > end) return false;
      const profile = agencyMonthProfile(AGENCY_MEMBER_SEED, member.uid, period.format('YYYY-MM'));
      return profile.hasDeposit || profile.hasWithdraw || profile.hasBet;
    });
    return { period, end, eligibleMembers };
  });
  const rows = Array.from({ length: Math.max(0, Math.floor(count)) }, (_, index) => {
    const { period, end, eligibleMembers } = periods[index % periods.length];
    // 各月共用該月行為輪廓；尚未註冊或三項行為皆無的會員不發禮金。
    if (!eligibleMembers.length) return null;
    const member = rngPick(rng, eligibleMembers);
    const createdAt = agencyEventTime(rng, Math.max(period.unix(), member.created_at), end);
    const cashType = rngPick(rng, cashTypes);
    const reviewState = rngPick(rng, [2, 2, 2, 2, 2, 1, 3]);
    return {
      id: `BONUS-${seed}-${String(index + 1).padStart(4, '0')}`,
      uid: member.uid, username: member.username, phone: member.phone,
      parent_uid: member.parent.uid, parent_name: member.parent.username,
      activity_id: `ACT-${cashType}-${period.format('YYYYMM')}`, cash_type: cashType,
      bonus: decimal(rngInt(rng, 1000, cashType === 4012 ? 500000 : 150000)),
      multiple: String(rngPick(rng, [1, 3, 5, 10, 15, 20])), created_at: createdAt,
      review_state: reviewState, review_at: reviewState === 1 ? 0 : Math.min(now.unix(), createdAt + rngInt(rng, 60, 3600)),
      review_name: reviewState === 1 ? '' : rngPick(rng, ['活動審核員', '禮金系統']),
      remark: reviewState === 3 ? '活動條件未符合（展示）' : reviewState === 1 ? '等待活動資格審核（展示）' : `${agencyBonusCashTypes[cashType]}發放（展示）`,
      created_name: '活動系統',
    };
  }).filter((row): row is AgencyBonusRow => row !== null)
    .sort((a, b) => b.created_at - a.created_at || a.id.localeCompare(b.id));

  // 當月總額精確等於會員列表；歷史月依活躍人數與該月確定性係數正規化。
  const target = agencyMembers.reduce((sum, member) => sum + cents(member.stat.bonus), 0);
  periods.forEach(({ period, eligibleMembers }, offset) => {
    const monthRows = rows.filter((row) => dayjs.unix(row.created_at).isSame(period, 'month'));
    const factorRng = createRng(agencySeed(seed, period.format('YYYY-MM'), 'bonus-target'));
    const monthTarget = offset === 0 ? target : Math.round(
      target * eligibleMembers.length / Math.max(1, periods[0].eligibleMembers.length) * (0.75 + factorRng() * 0.45),
    );
    const amounts = allocate(monthTarget, monthRows.map((row) => cents(row.bonus)));
    monthRows.forEach((row, index) => { row.bonus = decimal(amounts[index]); });
  });

  return rows;
}

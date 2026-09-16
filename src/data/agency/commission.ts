import dayjs from 'dayjs';
import { agencyEventTime, agencySeed, createRng, rngInt, rngPick } from '@/lib/agencyUtils';
import { agencyBonusCashTypes, agencyMembers, agencyMonthProfile, AGENCY_DATA_NOW, AGENCY_MEMBER_SEED } from './shared';

// 首頁看板與會員日統計共用的禮金資料來源。
export const AGENCY_BONUS_SEED = agencySeed('agency-bonus', 20260916);

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

const cents = (value: number | string) => Math.round(Number(value) * 100);
const decimal = (value: number) => (value / 100).toFixed(2);

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

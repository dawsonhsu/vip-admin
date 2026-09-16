import dayjs from 'dayjs';
import {
  agencyAccount,
  agencyActiveMembers,
  agencyBonusCashTypes,
  agencyGameClasses,
  agencyMembers,
  type AgencyRealUsername,
} from '@/data/agency/shared';
import { agencySeed, createRng, rngInt } from '@/lib/agencyUtils';

export interface ProfileResult {
  uid: string;
  username: string;
  settle_type: number;
  phone: string;
  invite_code: string;
  invite_link: string;
  invite_img: string[];
  last_login_ip: string;
  last_login_at: number;
  last_login_device: number;
  last_login_addr: string;
  real_username: AgencyRealUsername;
  stat: {
    ggr: string;
    members: number;
    active_members: number;
    reg: number;
    first_deposit: number;
    bonus: string;
    bonus_list: Array<{ cash_type: number; bonus: string }>;
    ggr_detail: Array<{ game_class: number; name: string; ggr: string }>;
  };
}

// 以分為單位分攤，尾差歸入最後一類，確保分類加總與會員總額完全一致。
function splitAmount(totalCents: number, weights: number[]): string[] {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let remaining = totalCents;
  return weights.map((weight, index) => {
    const cents = index === weights.length - 1
      ? remaining
      : Math.round(totalCents * weight / totalWeight);
    remaining -= cents;
    return (cents / 100).toFixed(2);
  });
}

export function buildAgencyProfile(startTs?: number, endTs?: number): ProfileResult {
  const now = dayjs();
  const monthStart = now.startOf('month').unix();
  const monthEnd = now.endOf('month').unix();
  const rng = createRng(agencySeed('agency-profile', startTs ?? monthStart, endTs ?? monthEnd));
  const monthlyRng = createRng(agencySeed('agency-profile-month', monthStart));
  const newMembers = agencyMembers.filter((member) => member.created_at >= monthStart && member.created_at <= monthEnd);
  const reg = newMembers.length || Math.min(agencyMembers.length, rngInt(monthlyRng, 5, 10));

  // 共用會員缺少首存時間，以當月註冊且已首存的會員估算當月首存人數。
  const firstDeposit = newMembers.filter((member) => member.first_deposit === 1).length;
  const ggrCents = agencyMembers.reduce((sum, member) => sum + Math.round(Number(member.stat.ggr_month) * 100), 0);
  const bonusCents = agencyMembers.reduce((sum, member) => sum + Math.round(Number(member.stat.bonus) * 100), 0);

  // 共用資料只有當月彙總；日期僅影響示範分類分布，總額持續與會員列表對齊。
  const gameWeights = agencyGameClasses.map(({ game_class }) => {
    const baseWeight = game_class === 1 ? 52 : game_class === 2 ? 29 : 3;
    return baseWeight * (0.85 + rng() * 0.3);
  });
  const gameAmounts = splitAmount(ggrCents, gameWeights);
  const cashTypes = Object.keys(agencyBonusCashTypes).map(Number).slice(0, 8);
  const bonusAmounts = splitAmount(bonusCents, cashTypes.map(() => rngInt(rng, 5, 22)));

  return {
    ...agencyAccount,
    invite_img: [...agencyAccount.invite_img],
    real_username: { ...agencyAccount.real_username },
    stat: {
      ggr: (ggrCents / 100).toFixed(2),
      members: agencyMembers.length,
      active_members: agencyActiveMembers().length,
      reg,
      first_deposit: newMembers.length ? firstDeposit : Math.min(reg, agencyMembers.filter((member) => member.first_deposit === 1).length, rngInt(monthlyRng, 3, 7)),
      bonus: (bonusCents / 100).toFixed(2),
      bonus_list: cashTypes.map((cash_type, index) => ({ cash_type, bonus: bonusAmounts[index] })),
      ggr_detail: agencyGameClasses.map((game, index) => ({ ...game, ggr: gameAmounts[index] })),
    },
  };
}

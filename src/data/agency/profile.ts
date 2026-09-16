/**
 * 後端 model/agency.go profileStat 現有：ggr / members / active_members / reg / first_deposit / bonus / bonus_list / ggr_detail
 * 本次沿用：members(→累積會員總數) / reg / first_deposit(→首存人數) / ggr / bonus
 * 本次新增，後端尚未提供，上線前需擴充 profileStat：
 *   first_deposit_amount / deposit_users / deposit_count / deposit_amount /
 *   withdraw_users / withdraw_count / withdraw_amount / dw_diff /
 *   bet_users / valid_bet / ngr
 * 另：現有 reg / first_deposit 後端是「當月」口徑（寫死當月），本次改為依 start_time / end_time 區間，後端也需配合調整。
 */
import dayjs from 'dayjs';
import { agencyDailyEvents } from './daily';
import { AGENCY_DATA_NOW, agencyAccount, agencyMembers, type AgencyRealUsername } from './shared';

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
    members: number;
    reg: number;
    first_deposit: number;
    first_deposit_amount: string;
    deposit_users: number;
    deposit_count: number;
    deposit_amount: string;
    withdraw_users: number;
    withdraw_count: number;
    withdraw_amount: string;
    dw_diff: string;
    bet_users: number;
    valid_bet: string;
    ggr: string;
    bonus: string;
    ngr: string;
  };
}

export function buildAgencyProfile(
  startTs = dayjs.unix(AGENCY_DATA_NOW).startOf('month').unix(),
  endTs = dayjs.unix(AGENCY_DATA_NOW).endOf('month').unix(),
): ProfileResult {
  const start = Math.max(startTs, agencyDailyEvents.start_time);
  const end = Math.min(endTs, agencyDailyEvents.end_time);
  const inRange = (event: { created_at: number }) => event.created_at >= start && event.created_at <= end;
  const deposits = agencyDailyEvents.deposits.filter(inRange);
  const withdrawals = agencyDailyEvents.withdrawals.filter(inRange);
  const bets = agencyDailyEvents.bets.filter(inRange);
  const firstDeposits = agencyDailyEvents.firstDeposits.filter(inRange);
  const deposit = deposits.reduce((sum, event) => sum + event.amount_cents, 0);
  const withdraw = withdrawals.reduce((sum, event) => sum + event.amount_cents, 0);
  const ggr = bets.reduce((sum, event) => sum + event.ggr_cents, 0);
  const bonus = agencyDailyEvents.bonuses.filter(inRange).reduce((sum, row) => sum + Math.round(Number(row.bonus) * 100), 0);
  const users = (events: Array<{ uid: string }>) => new Set(events.map((event) => event.uid)).size;
  const decimal = (value: number) => (value / 100).toFixed(2);

  return {
    ...agencyAccount,
    invite_img: [...agencyAccount.invite_img],
    real_username: { ...agencyAccount.real_username },
    stat: {
      members: agencyMembers.filter((member) => member.created_at <= endTs).length,
      // 註冊是會員屬性而非事件，不受事件視窗（近 6 個月）限制，一律用原始區間比對。
      reg: agencyMembers.filter((member) => member.created_at >= startTs && member.created_at <= endTs).length,
      first_deposit: users(firstDeposits),
      first_deposit_amount: decimal(firstDeposits.reduce((sum, event) => sum + event.amount_cents, 0)),
      deposit_users: users(deposits),
      deposit_count: deposits.length,
      deposit_amount: decimal(deposit),
      withdraw_users: users(withdrawals),
      withdraw_count: withdrawals.length,
      withdraw_amount: decimal(withdraw),
      dw_diff: decimal(deposit - withdraw),
      bet_users: users(bets),
      valid_bet: decimal(bets.reduce((sum, event) => sum + event.valid_bet_cents, 0)),
      ggr: decimal(ggr),
      bonus: decimal(bonus),
      ngr: decimal(ggr - bonus),
    },
  };
}

import { agencyGameClasses, agencyMembers, agencyVenues } from '@/data/agency/shared';
import { createRng, rngInt, rngPick } from '@/lib/agencyUtils';

// 對應 modules.GameRecord；所有紀錄均為示範資料，金額為字串、時間為秒。
export interface AgencyBetRecord {
  id: string;
  bill_no: string;
  platform_bill_no: string;
  platform_id: string;
  platform_name: string;
  player_name: string;
  uid: string;
  username: string;
  phone: string;
  game_class: number;
  game_name: string;
  round_id: string;
  bet_area: string;
  bet_amount: string;
  valid_bet_amount: string;
  payout_amount: string;
  net_amount: string;
  bet_time: number;
  settle_time: number;
  state: number;
  bet_type: number;
  jp_contribution: string;
  jp_winning: string;
}

// 遊戲名稱沿用廠商名稱；體育場館以實際運動項目展示。
export const agencyGameNames: Record<string, string[]> = {
  pg: ['Fortune Tiger', 'Mahjong Ways 2'],
  jili: ['Super Ace', 'Golden Empire'],
  fc: ['Fortune Gems'],
  jdb: ['Open Sesame', 'Lucky Pearl'],
  pp: ['Gates of Olympus', 'Sweet Bonanza'],
  evo: ['Crazy Time', 'Baccarat'],
  sexy: ['Baccarat', 'Dragon Tiger'],
  cq9: ['Jump High 2', 'Gu Gu Gu 3'],
  bti: ['足球', '籃球'],
  habanero: ['Koi Gate'],
  hacksaw: ['Wanted Dead or a Wild'],
  sa: ['Baccarat', 'Dragon Tiger'],
};

export function generateAgencyBetRecords(seed: number, count = 600): AgencyBetRecord[] {
  const rng = createRng(seed);
  const now = Math.floor(Date.now() / 1000);
  const amount = (cents: number) => (cents / 100).toFixed(2);

  return Array.from({ length: count }, (_, index) => {
    const member = rngPick(rng, agencyMembers);
    const venue = rngPick(rng, agencyVenues);
    const gameName = rngPick(rng, agencyGameNames[venue.venue_id]);
    // 場館與遊戲分類保持一致，真人與體育不混入電子遊戲。
    const className = ['evo', 'sexy', 'sa'].includes(venue.venue_id)
      ? '真人' : venue.venue_id === 'bti' ? '體育' : '電子';
    const gameClass = agencyGameClasses.find((item) => item.name === className)!;
    const stateRoll = rng();
    const state = stateRoll < 0.88 ? 1 : stateRoll < 0.94 ? 0 : stateRoll < 0.98 ? 2 : 3;
    const typeRoll = rng();
    const betType = className !== '電子' || typeRoll < 0.86 ? 1 : typeRoll < 0.93 ? 2 : typeRoll < 0.97 ? 3 : 4;
    const stake = rngPick(rng, [2000, 5000, 10000, 20000, 50000, 100000]);
    const betCents = betType === 2 ? 0 : stake;
    const validCents = state === 1 ? betCents : 0;
    const payoutCents = state === 1
      ? Math.round(stake * rngPick(rng, [0, 0, 0, 0.5, 0.8, 1, 1.5, 1.95, 2, 3, 5]))
      : 0;
    const jackpotCents = state === 1 && betType === 3 ? rngInt(rng, 50000, 500000) : 0;
    const totalPayoutCents = payoutCents + jackpotCents;
    // 投注不得早於會員註冊；未結算紀錄保留 0 作為尚無結算時間的標記。
    const firstBetTime = Math.max(now - 60 * 86400, member.created_at);
    const betTime = state === 0 ? rngInt(rng, now - 3600, now - 60) : rngInt(rng, firstBetTime, now - 60);
    const id = String(960000000 + index + 1);

    return {
      id,
      bill_no: `AG${betTime}${String(index + 1).padStart(5, '0')}`,
      platform_bill_no: `${venue.venue_id.toUpperCase()}-${betTime}-${id}`,
      platform_id: venue.venue_id,
      platform_name: venue.name,
      player_name: member.username,
      uid: member.uid,
      username: member.username,
      phone: member.phone,
      game_class: gameClass.game_class,
      game_name: gameName,
      round_id: `${venue.venue_id}-${betTime}-${index + 1}`,
      bet_area: gameName === 'Baccarat' ? rngPick(rng, ['莊', '閒', '和'])
        : gameName === 'Dragon Tiger' ? rngPick(rng, ['龍', '虎', '和'])
          : className === '體育' ? rngPick(rng, ['主隊', '客隊']) : '主遊戲',
      bet_amount: amount(betCents),
      valid_bet_amount: amount(validCents),
      payout_amount: amount(totalPayoutCents),
      // 單筆輸贏以會員角度計算；尚未結算、取消與無效注單不產生輸贏。
      net_amount: amount(state === 1 ? totalPayoutCents - betCents : 0),
      bet_time: betTime,
      settle_time: state === 0 ? 0 : Math.min(now, betTime + rngInt(rng, 5, 300)),
      state,
      bet_type: betType,
      jp_contribution: amount(state === 1 && className === '電子' ? Math.round(betCents * 0.005) : 0),
      jp_winning: amount(jackpotCents),
    };
  }).sort((a, b) => b.bet_time - a.bet_time);
}

export function agencyBetTotals(rows: AgencyBetRecord[]): {
  valid_bet_amount: string;
  payout_amount: string;
  net_amount: string;
} {
  // 以分加總避免小數累加誤差；後端 SUM(-net_amount) 代表平台輸贏，須將會員輸贏加總取負號。
  const totals = rows.reduce((sum, row) => ({
    valid_bet_amount: sum.valid_bet_amount + Math.round(Number(row.valid_bet_amount) * 100),
    payout_amount: sum.payout_amount + Math.round(Number(row.payout_amount) * 100),
    net_amount: sum.net_amount - Math.round(Number(row.net_amount) * 100),
  }), { valid_bet_amount: 0, payout_amount: 0, net_amount: 0 });
  return {
    valid_bet_amount: (totals.valid_bet_amount / 100).toFixed(2),
    payout_amount: (totals.payout_amount / 100).toFixed(2),
    net_amount: (totals.net_amount / 100).toFixed(2),
  };
}

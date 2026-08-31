// PAGCOR Admin (合規後台) mock 資料
// 來源：https://admin-pagcor-fat.filbet2025.com  #/game_records/all_plat_records
// 下拉選項與門店清單為 2026-08-31 由 FAT 站實際擷取；注單本身為合成資料。

// ---- 業務歸屬（門店）21 間，取自 FAT「業務歸屬」下拉 ----
export const pagcorSites: string[] = [
  '2040 Taft Ave, Pasay, Metro Mani',
  'Bigwin29 Capitol - Cebu City',
  'Bigwin29 Banilad - Cebu City',
  'Bigwin29 Tipolo - Mandaue City',
  'Bigwin29 Punta Princesa - Cebu City',
  'Bigwin29 Runway 2 - Lapu-Lapu City',
  'Egames – Sta. Ana',
  'Egames – Malibay',
  'eBingo - RDM Pandacan',
  'eBingo – San Andres',
  'gotech-test',
  'Grami Hotel L1 B7 Dr. A. Santos Avenue Goodwill 3 Subdivision, Paranaque City',
  'C.M. Recto Ave., Ground Floor Tutuban Center Mall, Prime Block, Barangay 245, Tondo Manila',
  '2F Jocevil Center, J.P. Rizal St., Concepcion Uno, Marikina City',
  'Ground Floor, Tripolee Bldg., Don Mariano Marcos Highway Mayamot, Antipolo City',
  '342 Carmen Bldg., Sen Gil Puyat Ave. Sta. Clara, Pasay City',
  'Unit 1, 2 and 3 San BMI Bldg., Brgy. Banlic, Cabuyao, Laguna',
  'Unit 1 & 2 Crisostomo Bldg., No. 23 Sumulong Highway Brgy. Mayamot, Antipolo City',
  '2nd Floor, Unit F&B U-2 Greenhills Promenade, GSC, Brgy. Greenhills San Juan City',
  '1666-1668 Building Units 5C and 6C, Angel Linao Street Barangay 686, Malate, Manila',
  'Estrellita Bldg., JM Loyola St., Brgy. Maduya, Carmona, Cavite',
];

// ---- 遊戲廠商 36 家，取自 FAT「遊戲廠商」下拉 ----
export const pagcorProviders: string[] = [
  'bng', 'btg', 'bti', 'cq9', 'evo', 'fastspin', 'fc', 'funky', 'galaxsys',
  'gemini', 'habanero', 'hacksaw', 'jdb', 'jili', 'maxwin', 'mi', 'netent',
  'nlc', 'op', 'panda', 'pg', 'playstar', 'playtech', 'pp', 'redtiger',
  'rtg', 'sa', 'sexy', 'simpleplay', 'taparoo', 'tpg', 'uu', 'uuslot',
  'we', 'yellowbat', 'ygr',
];

// ---- 遊戲類型（PAGCOR 分類）----
export const pagcorGameTypes = [
  { label: 'E-bingo', value: 'ebingo' },
  { label: 'ECasino', value: 'ecasino' },
  { label: 'Specialty games', value: 'specialty' },
  { label: 'Sports', value: 'sports' },
];

export const pagcorBetTypes = ['Onsite', 'Online'];
export const pagcorBrands = ['filbet', 'filplay'];
export const pagcorOrderTypes = ['一般投注', '免费旋转', 'Jackpot'];
export const pagcorTimeTypes = [
  { label: '投注时间', value: 'bet' },
  { label: '结算时间', value: 'settle' },
];
// 線上僅觀察到「已结算」；其餘狀態為原型假設值。
export const pagcorStates = ['已结算', '未结算', '已取消'];

const sportsTypes = ['足球', '篮球', '网球', '棒球', '电竞'];

// 各廠商的代表遊戲（原型用）
const gameCatalog: Record<string, Array<{ code: string; name: string; type: string }>> = {
  fc: [
    { code: '22032', name: 'MAGIC BEANS', type: 'ecasino' },
    { code: '22015', name: 'Jungle Party', type: 'ecasino' },
  ],
  bng: [
    { code: '391', name: 'Lucky Penny', type: 'ecasino' },
    { code: '412', name: 'Aloha King Elvis', type: 'ecasino' },
  ],
  pg: [
    { code: '1543462', name: 'Fortune Tiger', type: 'ecasino' },
    { code: '1420892', name: 'Mahjong Ways 2', type: 'ecasino' },
  ],
  jili: [
    { code: '135', name: 'Super Ace', type: 'ecasino' },
    { code: '181', name: 'Money Coming', type: 'ecasino' },
  ],
  jdb: [
    { code: '14043', name: 'Lucky Miner', type: 'ecasino' },
    { code: '14052', name: 'Fortune Neko', type: 'ecasino' },
  ],
  pp: [
    { code: 'vs20fruitsw', name: 'Sweet Bonanza', type: 'ecasino' },
    { code: 'vs20olympgate', name: 'Gates of Olympus', type: 'ecasino' },
  ],
  evo: [
    { code: 'LightningBac0001', name: 'Lightning Baccarat', type: 'ecasino' },
    { code: 'CrazyTime0000001', name: 'Crazy Time', type: 'specialty' },
  ],
  bti: [
    { code: 'SB-1001', name: 'Sportsbook', type: 'sports' },
    { code: 'SB-1002', name: 'Live Betting', type: 'sports' },
  ],
  cq9: [
    { code: 'AB1', name: 'Fortune Gods', type: 'ecasino' },
    { code: 'BB2', name: 'Bingo Carnival', type: 'ebingo' },
  ],
  simpleplay: [
    { code: 'SP-BG01', name: 'Bingo Fortune', type: 'ebingo' },
    { code: 'SP-BG02', name: 'Bingo Cowboy', type: 'ebingo' },
  ],
};

function catalogFor(provider: string) {
  return (
    gameCatalog[provider] ?? [
      { code: `${provider.toUpperCase()}-001`, name: `${provider} Classic`, type: 'ecasino' },
      { code: `${provider.toUpperCase()}-002`, name: `${provider} Deluxe`, type: 'ecasino' },
    ]
  );
}

export interface PagcorBetRecord {
  id: number;
  brandOwner: string;      // 品牌归属
  transactionId: string;   // Transaction ID
  gamingSite: string;      // Gaming Site
  onsiteBet: 'YES' | 'NO'; // Onsite Bet
  onlineBet: 'YES' | 'NO'; // Online Bet
  orderType: string;       // 注单类型
  merchantNo: string;      // 商户编号
  uid: string;             // UID
  username: string;        // 用户名（後端可查詢，表格不顯示）
  gameCode: string;        // 游戏代码
  gameName: string;        // 游戏名称
  gameType: string;        // 游戏类型
  sportsType: string;      // 体育类型
  provider: string;        // 品牌（廠商）
  betAmount: string;       // 投注金额
  state: string;           // 状态
  payout: string;          // 派彩
  drawResult: string;      // 开奖结果
  ggr: string;             // GGR
  settleTime: string;      // 结算时间
  betTime: string;         // 投注时间
}

function hex(len: number, rnd: () => number): string {
  const chars = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(rnd() * 16)];
  return s;
}

// 以固定 seed 產生，確保 SSR / CSR 與多次渲染結果一致
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generatePagcorBetRecords(count: number = 200): PagcorBetRecord[] {
  const rnd = mulberry32(20260831);
  const records: PagcorBetRecord[] = [];
  const base = Date.UTC(2026, 7, 31, 5, 30, 0); // 2026-08-31 13:30 GMT+8

  for (let i = 1; i <= count; i++) {
    const uidNum = 5021870000000000 + Math.floor(rnd() * 999999999);
    const provider = pagcorProviders[Math.floor(rnd() * pagcorProviders.length)];
    const game = catalogFor(provider)[Math.floor(rnd() * catalogFor(provider).length)];
    const isOnline = rnd() > 0.35;
    const orderType =
      rnd() > 0.88 ? pagcorOrderTypes[1] : rnd() > 0.96 ? pagcorOrderTypes[2] : pagcorOrderTypes[0];
    const siteIdx = Math.floor(rnd() * pagcorSites.length);

    const betAmount = orderType === '免费旋转' ? 0 : [1, 5, 10, 50, 100, 500, 2500][Math.floor(rnd() * 7)];
    const win = rnd();
    const payout = win > 0.72 ? Math.round(betAmount * (1 + rnd() * 4) * 100) / 100 : 0;
    const settled = rnd() > 0.06;
    const state = settled ? '已结算' : '未结算';

    const ts = base - Math.floor(rnd() * 30 * 24 * 3600 * 1000) - i * 1000;
    const betTime = new Date(ts).toISOString().replace('T', ' ').slice(0, 19);
    const settleTime = settled ? betTime : '-';

    records.push({
      id: i,
      brandOwner: pagcorBrands[rnd() > 0.82 ? 1 : 0],
      transactionId: hex(rnd() > 0.5 ? 33 : 24, rnd),
      gamingSite: pagcorSites[siteIdx],
      onsiteBet: isOnline ? 'NO' : 'YES',
      onlineBet: isOnline ? 'YES' : 'NO',
      orderType,
      merchantNo: String(siteIdx + 2),
      uid: String(uidNum),
      username: `user${String(uidNum).slice(-6)}`,
      gameCode: game.code,
      gameName: game.name,
      gameType: game.type,
      sportsType: game.type === 'sports' ? sportsTypes[Math.floor(rnd() * sportsTypes.length)] : '-',
      provider: provider === 'fc' ? 'FC' : provider,
      betAmount: betAmount.toFixed(2),
      state,
      payout: payout.toFixed(2),
      drawResult: '0.00',
      ggr: settled ? (betAmount - payout).toFixed(2) : '0.00',
      settleTime,
      betTime,
    });
  }
  return records.sort((a, b) => b.betTime.localeCompare(a.betTime));
}

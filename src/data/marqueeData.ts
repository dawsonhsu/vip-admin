import dayjs from 'dayjs';

export type MarqueeType = 'announcement' | 'activity' | 'jackpot' | 'maintenance' | 'other';
export type MarqueeStatus = 'enabled' | 'disabled';
export type MarqueeJumpType = 'none' | 'internal' | 'external';

export interface MarqueeItem {
  key: string;
  id: number;
  content: string;
  type: MarqueeType;
  status: MarqueeStatus;
  sort: number;
  jumpType: MarqueeJumpType;
  h5Url: string;
  appUrl: string;
  startTime: string;
  endTime: string;
  creator: string;
  updatedAt: string;
}

export const marqueeTypeOptions: Array<{ value: MarqueeType; label: string }> = [
  { value: 'announcement', label: '系統公告' },
  { value: 'activity', label: '活動推廣' },
  { value: 'jackpot', label: '中獎播報' },
  { value: 'maintenance', label: '維護通知' },
  { value: 'other', label: '其他' },
];

export const marqueeJumpTypeOptions: Array<{ value: MarqueeJumpType; label: string }> = [
  { value: 'none', label: '不跳轉' },
  { value: 'internal', label: '站內' },
  { value: 'external', label: '外部' },
];

export const marqueeStatusOptions: Array<{ value: MarqueeStatus; label: string }> = [
  { value: 'enabled', label: '啟用' },
  { value: 'disabled', label: '停用' },
];

interface MarqueeSeedRow {
  content: string;
  type: MarqueeType;
  jumpType: MarqueeJumpType;
  h5Url: string;
  appUrl: string;
  creator: string;
}

const seedRows: MarqueeSeedRow[] = [
  {
    content: '恭喜會員 jade**88 在 Fortune Tiger 贏得 ₱128,000!',
    type: 'jackpot',
    jumpType: 'none',
    h5Url: '',
    appUrl: '',
    creator: 'ops01',
  },
  {
    content: '【系統公告】6/28 02:00-04:00 進行系統維護，期間暫停存提款',
    type: 'maintenance',
    jumpType: 'none',
    h5Url: '',
    appUrl: '',
    creator: 'admin',
  },
  {
    content: '新人三存活動火熱進行中，最高再送 888 Free Spin！',
    type: 'activity',
    jumpType: 'internal',
    h5Url: '/promo/tri-deposit',
    appUrl: '/app/promo/tri-deposit',
    creator: 'marketing01',
  },
  {
    content: 'GCash／Maya 存款秒到帳，立即體驗',
    type: 'activity',
    jumpType: 'internal',
    h5Url: '/deposit',
    appUrl: '/app/deposit',
    creator: 'ops02',
  },
  {
    content: 'VIP 專屬簽到獎勵已更新，前往 VIP 中心查看',
    type: 'announcement',
    jumpType: 'internal',
    h5Url: '/vip/center',
    appUrl: '/app/vip/center',
    creator: 'vip01',
  },
  {
    content: '恭喜會員 spin**27 在 Super Ace 贏得 ₱86,500!',
    type: 'jackpot',
    jumpType: 'none',
    h5Url: '',
    appUrl: '',
    creator: 'ops01',
  },
  {
    content: '週末加碼活動開跑，指定遊戲任務完成即可領取獎勵',
    type: 'activity',
    jumpType: 'external',
    h5Url: 'https://www.filbet.example/promo/weekend-mission',
    appUrl: 'https://app.filbet.example/promo/weekend-mission',
    creator: 'marketing02',
  },
  {
    content: '【系統公告】部分銀行通道維護中，建議改用電子錢包通道',
    type: 'announcement',
    jumpType: 'none',
    h5Url: '',
    appUrl: '',
    creator: 'finance01',
  },
  {
    content: '恭喜會員 lucky**13 在 Fortune Gems 贏得 ₱52,800!',
    type: 'jackpot',
    jumpType: 'none',
    h5Url: '',
    appUrl: '',
    creator: 'ops02',
  },
  {
    content: 'FreeBet 活動頁已上線，符合資格會員可查看可用票券',
    type: 'activity',
    jumpType: 'internal',
    h5Url: '/promo/freebet',
    appUrl: '/app/promo/freebet',
    creator: 'marketing01',
  },
  {
    content: '【維護通知】客服系統將於凌晨短暫切換，請改用站內信聯繫',
    type: 'maintenance',
    jumpType: 'none',
    h5Url: '',
    appUrl: '',
    creator: 'cs01',
  },
  {
    content: '累積存款達標可解鎖更多 VIP 權益，立即查看等級進度',
    type: 'announcement',
    jumpType: 'internal',
    h5Url: '/vip/center',
    appUrl: '/app/vip/center',
    creator: 'vip01',
  },
  {
    content: '恭喜會員 royal**20 在 Sweet Bonanza 贏得 ₱214,600!',
    type: 'jackpot',
    jumpType: 'none',
    h5Url: '',
    appUrl: '',
    creator: 'ops01',
  },
  {
    content: '節慶任務倒數中，完成指定存款與遊戲條件可領限定獎勵',
    type: 'activity',
    jumpType: 'external',
    h5Url: 'https://www.filbet.example/promo/festival-task',
    appUrl: 'https://app.filbet.example/promo/festival-task',
    creator: 'marketing02',
  },
  {
    content: '【系統公告】請確認綁定手機可正常接收 OTP 驗證碼',
    type: 'announcement',
    jumpType: 'internal',
    h5Url: '/account/security',
    appUrl: '/app/account/security',
    creator: 'risk01',
  },
];

const createRng = (seed: number) => {
  let value = seed;
  return () => {
    value += 0x6D2B79F5;
    let result = Math.imul(value ^ (value >>> 15), value | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
};

const randInt = (rng: () => number, min: number, max: number) =>
  Math.floor(rng() * (max - min + 1)) + min;

export function generateMarqueeItems(): MarqueeItem[] {
  const todaySeed = Number(dayjs().format('YYYYMMDD'));
  const rng = createRng(todaySeed + 1207);
  const baseTime = dayjs().startOf('hour');

  return seedRows.map((row, index) => {
    const id = 720000 + seedRows.length - index;
    const startTime = baseTime
      .subtract(randInt(rng, 0, 7), 'day')
      .add(randInt(rng, 0, 12), 'hour');
    const endTime = startTime.add(randInt(rng, 7, 45), 'day').endOf('hour');
    const updatedAt = baseTime
      .subtract(randInt(rng, 0, 96), 'hour')
      .subtract(index * 7, 'minute');
    const status: MarqueeStatus = index % 5 === 1 ? 'disabled' : 'enabled';

    return {
      key: `marquee-${id}`,
      id,
      content: row.content,
      type: row.type,
      status,
      sort: 1000 - index * 42 + randInt(rng, 0, 18),
      jumpType: row.jumpType,
      h5Url: row.jumpType === 'none' ? '' : row.h5Url,
      appUrl: row.jumpType === 'none' ? '' : row.appUrl,
      startTime: startTime.format('YYYY-MM-DD HH:mm:ss'),
      endTime: endTime.format('YYYY-MM-DD HH:mm:ss'),
      creator: row.creator,
      updatedAt: updatedAt.format('YYYY-MM-DD HH:mm:ss'),
    };
  }).sort((a, b) => b.sort - a.sort || b.updatedAt.localeCompare(a.updatedAt));
}

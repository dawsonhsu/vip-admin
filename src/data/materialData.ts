import dayjs from 'dayjs';

export type MaterialPlatform =
  | 'filbet'
  | 'filgame'
  | 'filslots'
  | 'filplay'
  | 'glife1'
  | 'glife2'
  | 'maya'
  | 'lazada';
export type MaterialLinkType = 'internal' | 'external' | 'none';
export type MaterialStatus = 'enabled' | 'disabled';
export type MaterialPopupFrequency = 'daily_once' | 'every_home';
export type MaterialPopupScope = 'all' | 'vip_only';

export interface MaterialItem {
  key: string;
  id: string;
  platform: MaterialPlatform;
  category: string;
  name: string;
  description: string;
  hasImage: boolean;
  linkType: MaterialLinkType;
  h5Url: string;
  appUrl: string;
  content: string;
  priority: number;
  popupFrequency: MaterialPopupFrequency;
  popupScope: MaterialPopupScope;
  startTime: string;
  endTime: string;
  status: MaterialStatus;
  updatedAt: string;
  updater: string;
}

export const materialPlatformOptions: Array<{ value: MaterialPlatform; label: MaterialPlatform }> = [
  { value: 'filbet', label: 'filbet' },
  { value: 'filgame', label: 'filgame' },
  { value: 'filslots', label: 'filslots' },
  { value: 'filplay', label: 'filplay' },
  { value: 'glife1', label: 'glife1' },
  { value: 'glife2', label: 'glife2' },
  { value: 'maya', label: 'maya' },
  { value: 'lazada', label: 'lazada' },
];

export const materialCategoryOptions = [
  { value: 'homepagebanner', label: 'homepagebanner' },
  { value: 'popup', label: 'popup' },
  { value: 'signup', label: 'signup' },
  { value: 'signinpromo', label: 'signinpromo' },
];

export const materialLinkTypeOptions: Array<{
  value: Exclude<MaterialLinkType, 'none'>;
  label: string;
}> = [
  { value: 'internal', label: '站內跳轉' },
  { value: 'external', label: '外部鏈接' },
];

export const materialStatusOptions: Array<{ value: MaterialStatus; label: string }> = [
  { value: 'enabled', label: '啟用' },
  { value: 'disabled', label: '停用' },
];

export const materialPopupFrequencyOptions: Array<{
  value: MaterialPopupFrequency;
  label: string;
}> = [
  { value: 'daily_once', label: '一天一次' },
  { value: 'every_home', label: '每次進入首頁顯示' },
];

export const materialPopupScopeOptions: Array<{ value: MaterialPopupScope; label: string }> = [
  { value: 'all', label: '全部會員可見' },
  { value: 'vip_only', label: '僅指定會員等級可見' },
];

interface MaterialSeedRow {
  platform: MaterialPlatform;
  category: string;
  name: string;
  description: string;
  hasImage: boolean;
  linkType: MaterialLinkType;
  h5Url: string;
  appUrl: string;
  content: string;
  priority: number;
  updater: string;
}

const seedRows: MaterialSeedRow[] = [
  {
    platform: 'filbet',
    category: 'signup',
    name: '登錄banner-無跳轉',
    description: '註冊頁登錄入口素材，僅展示圖片不設定跳轉',
    hasImage: true,
    linkType: 'none',
    h5Url: '',
    appUrl: '',
    content: '',
    priority: 10,
    updater: 'davinci@filbetph.com',
  },
  {
    platform: 'filbet',
    category: 'homepagebanner',
    name: '首頁頂部Banner',
    description: '首頁頂部第一版測試素材',
    hasImage: true,
    linkType: 'internal',
    h5Url: 'https://www.baidu.com',
    appUrl: 'https://www.baidu.com',
    content: '首頁頂部活動 Banner，點擊後導向活動內容頁。',
    priority: 2,
    updater: 'bali@filbetph.com',
  },
  {
    platform: 'filbet',
    category: 'signup',
    name: '登錄banner',
    description: '登錄頁外部推廣連結素材',
    hasImage: true,
    linkType: 'external',
    h5Url: 'https://www.qq.com',
    appUrl: 'https://www.baidu.com',
    content: '',
    priority: 0,
    updater: 'logan@filbetph.com',
  },
  {
    platform: 'filbet',
    category: 'homepagebanner',
    name: '首頁頂部Banner3',
    description: '首頁頂部活動素材第三版',
    hasImage: true,
    linkType: 'internal',
    h5Url: '/activity/1',
    appUrl: 'app://activity/1',
    content: '首頁熱門活動入口，展示最新優惠與活動規則。',
    priority: 100,
    updater: 'asher@filbetph.com',
  },
  {
    platform: 'filbet',
    category: 'popup',
    name: 'losen測試素材管理',
    description: '測試彈窗素材管理流程與多端顯示效果，確認不同螢幕尺寸、跳轉行為及會員可見範圍是否符合預期',
    hasImage: true,
    linkType: 'external',
    h5Url: 'https://www.filbet.example/promo/welcome',
    appUrl: 'https://app.filbet.example/promo/welcome',
    content: '歡迎回來，今日限定任務與獎勵已開放。',
    priority: 1,
    updater: 'logan@filbetph.com',
  },
  {
    platform: 'filgame',
    category: 'homepagebanner',
    name: '123',
    description: 'filgame 首頁測試素材',
    hasImage: false,
    linkType: 'none',
    h5Url: '',
    appUrl: '',
    content: '',
    priority: 0,
    updater: 'davinci@filbetph.com',
  },
  {
    platform: 'filbet',
    category: 'signinpromo',
    name: 'demo-asher',
    description: '每日簽到推廣素材測試',
    hasImage: true,
    linkType: 'internal',
    h5Url: '/demo/h5',
    appUrl: '/demo/asher-1',
    content: '每日簽到即可領取專屬獎勵。',
    priority: 100,
    updater: 'asher@filbetph.com',
  },
  {
    platform: 'filslots',
    category: 'homepagebanner',
    name: '熱門老虎機推薦',
    description: 'filslots 首頁熱門遊戲輪播',
    hasImage: true,
    linkType: 'internal',
    h5Url: '/games/slots',
    appUrl: 'app://games/slots',
    content: '本週熱門老虎機遊戲推薦。',
    priority: 88,
    updater: 'bali@filbetph.com',
  },
  {
    platform: 'filplay',
    category: 'popup',
    name: '週末任務提醒',
    description: '週末活動進站彈窗',
    hasImage: true,
    linkType: 'internal',
    h5Url: '/promo/weekend',
    appUrl: 'app://promo/weekend',
    content: '完成指定任務，即可領取週末限定獎勵。',
    priority: 60,
    updater: 'logan@filbetph.com',
  },
  {
    platform: 'maya',
    category: 'signup',
    name: 'Maya 新會員禮',
    description: 'Maya 渠道新會員註冊推廣',
    hasImage: true,
    linkType: 'external',
    h5Url: 'https://www.filbet.example/maya/signup',
    appUrl: 'https://app.filbet.example/maya/signup',
    content: '完成註冊與首次存款，解鎖新會員專屬優惠。',
    priority: 75,
    updater: 'davinci@filbetph.com',
  },
  {
    platform: 'lazada',
    category: 'homepagebanner',
    name: 'Lazada 聯名活動',
    description: '渠道聯名檔期首頁素材',
    hasImage: true,
    linkType: 'external',
    h5Url: 'https://www.filbet.example/lazada',
    appUrl: 'https://app.filbet.example/lazada',
    content: 'Lazada 渠道會員限定活動。',
    priority: 50,
    updater: 'bali@filbetph.com',
  },
  {
    platform: 'glife1',
    category: 'signinpromo',
    name: 'Glife 每日簽到',
    description: 'glife1 每日簽到入口',
    hasImage: false,
    linkType: 'internal',
    h5Url: '/vip/checkin',
    appUrl: 'app://vip/checkin',
    content: '連續簽到可獲得更多會員獎勵。',
    priority: 45,
    updater: 'asher@filbetph.com',
  },
  {
    platform: 'glife2',
    category: 'popup',
    name: 'VIP 權益更新通知',
    description: 'VIP 權益改版通知彈窗',
    hasImage: true,
    linkType: 'internal',
    h5Url: '/vip/center',
    appUrl: 'app://vip/center',
    content: 'VIP 權益已更新，立即前往會員中心查看。',
    priority: 90,
    updater: 'asher@filbetph.com',
  },
  {
    platform: 'maya',
    category: 'homepagebanner',
    name: '電子錢包快速存款',
    description: '電子錢包存款入口素材',
    hasImage: true,
    linkType: 'internal',
    h5Url: '/deposit',
    appUrl: 'app://deposit',
    content: '',
    priority: 30,
    updater: 'logan@filbetph.com',
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

export function generateMaterialItems(): MaterialItem[] {
  const todaySeed = Number(dayjs().format('YYYYMMDD'));
  const rng = createRng(todaySeed + 2819);
  const baseTime = dayjs().startOf('hour');

  return seedRows.map((row, index) => {
    const id = `7396291820237${String(1050 + index).padStart(4, '0')}`;
    const usesPastWindow = [1, 5, 6, 10].includes(index);
    const endTime = usesPastWindow
      ? baseTime.subtract(randInt(rng, 1, 12), 'day').endOf('hour')
      : baseTime.add(randInt(rng, 12, 75), 'day').endOf('hour');
    const startTime = endTime.subtract(randInt(rng, 10, 45), 'day').startOf('hour');
    const updatedAt = baseTime
      .subtract(randInt(rng, 0, 168), 'hour')
      .subtract(index * 9, 'minute');

    return {
      ...row,
      key: `material-${id}`,
      id,
      popupFrequency: index % 3 === 0 ? 'every_home' : 'daily_once',
      popupScope: index % 4 === 0 ? 'vip_only' : 'all',
      startTime: startTime.format('YYYY-MM-DD HH:mm:ss'),
      endTime: endTime.format('YYYY-MM-DD HH:mm:ss'),
      status: index % 5 === 2 ? 'disabled' : 'enabled',
      updatedAt: updatedAt.format('YYYY-MM-DD HH:mm:ss'),
    };
  });
}

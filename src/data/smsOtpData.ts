import dayjs from 'dayjs';

export type SendMode = 'sms' | 'pin_api';

export const sendModeLabel: Record<SendMode, string> = {
  sms: 'SMS（廣播模式）',
  pin_api: 'PIN API（供應商生成驗證）',
};

export const sendModeTagColor: Record<SendMode, string> = {
  sms: 'blue',
  pin_api: 'gold',
};

export type ProviderChannel = 'laaffic' | 'm360' | 'hamsV2' | 'test';

export type SmsUsage =
  | 'login'
  | 'register'
  | 'retrieve_password'
  | 'withdraw'
  | 'bind_phone';

export const usageLabel: Record<SmsUsage, string> = {
  login: 'login',
  register: 'register',
  retrieve_password: 'retrieve_password',
  withdraw: 'withdraw',
  bind_phone: 'bind_phone',
};

export interface SmsProviderConfig {
  key: string;
  name: ProviderChannel;
  sendMode: SendMode;
  weight: number;
  enabled: boolean;
  supportsPinApi: boolean;
}

export interface SmsOtpRecord {
  key: string;
  id: number;
  channel: ProviderChannel;
  sendMode: SendMode;
  createdAt: string;
  countryCode: string;
  memberAccount: string;
  uid: string;
  phone: string;
  usage: SmsUsage;
  code?: string;
  refCode?: string;
  expireAt: string;
  consumedAt?: string;
}

export const initialProviderConfigs: SmsProviderConfig[] = [
  { key: 'laaffic', name: 'laaffic', sendMode: 'sms', weight: 30, enabled: true, supportsPinApi: false },
  { key: 'm360-sms', name: 'm360', sendMode: 'sms', weight: 50, enabled: true, supportsPinApi: true },
  { key: 'hamsV2', name: 'hamsV2', sendMode: 'sms', weight: 20, enabled: true, supportsPinApi: false },
  { key: 'test', name: 'test', sendMode: 'sms', weight: 0, enabled: false, supportsPinApi: false },
];

const channels: ProviderChannel[] = ['m360', 'hamsV2', 'laaffic', 'test'];
const usages: SmsUsage[] = ['login', 'register', 'retrieve_password', 'withdraw', 'bind_phone'];

function pad(n: number, len = 6): string {
  return n.toString().padStart(len, '0');
}

function randomMemberAccount(seed: number): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let s = 'filbet_';
  let v = seed * 9301 + 49297;
  for (let i = 0; i < 6; i += 1) {
    v = (v * 9301 + 49297) % 233280;
    s += alphabet[v % alphabet.length];
  }
  return s;
}

function randomUid(seed: number): string {
  let v = seed * 12345 + 67890;
  let s = '';
  for (let i = 0; i < 17; i += 1) {
    v = (v * 1103515245 + 12345) % 0x7fffffff;
    s += (v % 10).toString();
  }
  return s;
}

function randomPhone(seed: number): string {
  let v = seed * 7919 + 1009;
  let s = '9';
  for (let i = 0; i < 9; i += 1) {
    v = (v * 1664525 + 1013904223) % 0x7fffffff;
    s += (v % 10).toString();
  }
  return s;
}

function randomRefCode(seed: number): string {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let v = seed * 31 + 7;
  let s = 'REF#';
  for (let i = 0; i < 5; i += 1) {
    v = (v * 1664525 + 1013904223) % 0x7fffffff;
    s += alphabet[v % alphabet.length];
  }
  return s;
}

export function generateMockSmsOtpRecords(count = 120): SmsOtpRecord[] {
  const records: SmsOtpRecord[] = [];
  const base = dayjs('2026-06-04 16:00:00');
  for (let i = 0; i < count; i += 1) {
    const channel = channels[i % channels.length];
    // m360 about 40% PIN API, others stay SMS
    const sendMode: SendMode = channel === 'm360' && i % 5 < 2 ? 'pin_api' : 'sms';
    const usage = usages[i % usages.length];
    const created = base.subtract(i * 7, 'minute');
    const expire = created.add(5, 'minute');
    const consumed = i % 4 === 0 ? undefined : created.add((i % 5) + 1, 'minute');
    const code = sendMode === 'sms' ? pad(((i + 1) * 16807) % 1000000) : undefined;
    records.push({
      key: `sms-otp-${i + 1}`,
      id: i + 1,
      channel,
      sendMode,
      createdAt: created.format('YYYY-MM-DD HH:mm:ss'),
      countryCode: '63',
      memberAccount: randomMemberAccount(i + 1),
      uid: randomUid(i + 1),
      phone: randomPhone(i + 1),
      usage,
      code,
      refCode: sendMode === 'pin_api' ? randomRefCode(i + 1) : undefined,
      expireAt: expire.format('YYYY-MM-DD HH:mm:ss'),
      consumedAt: consumed?.format('YYYY-MM-DD HH:mm:ss'),
    });
  }
  return records;
}

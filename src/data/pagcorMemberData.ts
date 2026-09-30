import type { Dayjs } from 'dayjs';
import { pagcorSites } from '@/data/pagcorMockData';

export type PagcorMemberBrand = 'filbet' | 'filplay';
export interface PagcorMemberWallet {
  balance: number;
  turnoverDone: number;
  turnoverLeft: number;
}
export const pagcorMemberStates = ['正常', '风控', '冻结', '封禁'] as const;
export const pagcorMemberSubStates = ['-', 'Risk', 'Frozen', 'Banned', 'Block'] as const;
export const pagcorMemberKycStatuses = ['Pending', 'Under Review', 'Resubmit Required', 'Approved'] as const;
export interface PagcorMember {
  brandOwner: PagcorMemberBrand;
  uid: string;
  username: string;
  firstName: string;
  middleName: string;
  lastName: string;
  phone: string;
  site: string;
  wallets: Record<PagcorMemberBrand, PagcorMemberWallet | null>;
  state: typeof pagcorMemberStates[number];
  subState: typeof pagcorMemberSubStates[number];
  kycStatus: typeof pagcorMemberKycStatuses[number];
  createdAt: string;
  gender: string;
  birthday: string;
  nationality: string;
  idType: string;
  idNumber: string;
  kycReviewedAt: string;
  kycRemark: string;
}

function mulberry32(seed: number) {
  return () => {
    let value = seed += 0x6d2b79f5;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function generatePagcorMembers(count = 120, anchor: Dayjs): PagcorMember[] {
  const rnd = mulberry32(20260922);
  const pick = <T,>(values: readonly T[]): T => values[Math.floor(rnd() * values.length)];
  const digits = (length: number) => Array.from({ length }, () => Math.floor(rnd() * 10)).join('');
  const chars = (length: number) => Array.from({ length }, () => pick('abcdefghijklmnopqrstuvwxyz0123456789'.split(''))).join('');
  const money = (max: number) => Math.round(rnd() * max * 100) / 100;
  const wallet = (): PagcorMemberWallet => ({ balance: money(250000), turnoverDone: money(900000), turnoverLeft: money(150000) });
  const historySeconds = anchor.diff(anchor.subtract(18, 'month'), 'second');
  return Array.from({ length: count }, (_, index) => {
    const brandOwner: PagcorMemberBrand = rnd() < 0.7 ? 'filbet' : 'filplay';
    const otherWallet = rnd() < (brandOwner === 'filbet' ? 0.35 : 0.25);
    // Keep five recent registrations, all old enough for a review at least one day later.
    const offset = index === 0 ? 86400 : index < 5
      ? 86400 + Math.floor(rnd() * 6 * 86400)
      : 7 * 86400 + Math.floor(rnd() * (historySeconds - 7 * 86400));
    const created = anchor.subtract(offset, 'second');
    const kycStatus = pick(pagcorMemberKycStatuses);
    return {
      brandOwner,
      uid: `${1 + Math.floor(rnd() * 9)}${digits(10 + index % 3)}${String(index).padStart(6, '0')}`,
      username: `${brandOwner}_${chars(brandOwner === 'filbet' ? 6 : 8)}`,
      firstName: pick(['Jose', 'Maria', 'Juan', 'Ana', 'Carlo', 'Isabel', 'Miguel', 'Angelica', 'Paolo', 'Rafael']),
      middleName: pick(['Cruz', 'Reyes', 'Santos', 'Garcia', 'Mendoza', 'Bautista']),
      lastName: pick(['Dela Cruz', 'Santos', 'Reyes', 'Ramos', 'Aquino', 'Villanueva', 'Flores', 'Gonzales']),
      phone: `+63 9${digits(9)}`,
      site: pick(pagcorSites),
      wallets: {
        filbet: brandOwner === 'filbet' || otherWallet ? wallet() : null,
        filplay: brandOwner === 'filplay' || otherWallet ? wallet() : null,
      },
      state: rnd() < 0.8 ? '正常' : pick(['风控', '冻结', '封禁'] as const),
      subState: rnd() < 0.8 ? '-' : pick(['Risk', 'Frozen', 'Banned', 'Block'] as const),
      kycStatus,
      createdAt: created.format('YYYY-MM-DD HH:mm:ss'),
      gender: pick(['男', '女']),
      birthday: `${1975 + Math.floor(rnd() * 28)}-${String(1 + Math.floor(rnd() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rnd() * 28)).padStart(2, '0')}`,
      nationality: 'Filipino',
      idType: pick(['UMID', "Driver's License", 'Passport', 'PhilSys ID']),
      idNumber: `****-****-${digits(4)}`,
      kycReviewedAt: kycStatus === 'Pending' ? '-' : created.add(1 + Math.floor(rnd() * Math.min(10, Math.floor(offset / 86400))), 'day').format('YYYY-MM-DD HH:mm:ss'),
      kycRemark: kycStatus === 'Resubmit Required' ? '请重新提交清晰的证件照片' : '-',
    };
  });
}

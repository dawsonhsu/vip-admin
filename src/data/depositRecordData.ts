export interface DepositRecord {
  key: string;
  seq: number;
  depositOrderId: string;
  thirdPartyOrderId: string;
  memberAccount: string;
  memberPhone: string;
  orderStatus: '已发起' | '存款成功' | '存款失败';
  depositTime: string;
  depositAccountType: string;
  paymentAccountId: string;
  depositAmount: number;
  arrivalTime: string;
  arrivalAmount: number;
  fee: number;
  paymentProvider: string;
  paymentChannel: string;
  orderSourceDomain: string;
  cancelReason: string;
  remark: string;
}

export const depositChannels = [
  'GcashGcash',
  'PESONET',
  'PALAWAN',
  'COINS',
  'BPI',
  'Gcash',
  'QRPH',
  'Maya',
];

export const paymentProviders = [
  'PayMongo',
  'DragonPay',
  'GCash Direct',
  'PayMaya',
  'Xendit',
];

export const orderStatuses = ['已发起', '存款成功', '存款失败'] as const;

const names = ['Juan', 'Maria', 'Pedro', 'Ana', 'Jose', 'Rosa', 'Carlos', 'Elena', 'Miguel', 'Sofia'];
const domains = ['filbet.com', 'filbet.ph', 'm.filbet.com', 'app.filbet.ph'];
const accountTypes = ['GCash', 'Bank Transfer', 'Maya', 'QRPH', 'OTC'];

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhone(): string {
  return `+639${Math.floor(100000000 + Math.random() * 900000000)}`;
}

function generateOrderId(): string {
  return `D${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateThirdPartyId(): string {
  return `TP${Math.floor(10000000000 + Math.random() * 90000000000)}`;
}

function generateTime(baseDate: string, offsetHours: number): string {
  const d = new Date(baseDate);
  d.setHours(d.getHours() + offsetHours);
  d.setMinutes(Math.floor(Math.random() * 60));
  d.setSeconds(Math.floor(Math.random() * 60));
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

function generateRecords(): DepositRecord[] {
  const records: DepositRecord[] = [];
  for (let i = 0; i < 50; i++) {
    const status = randomFrom(orderStatuses);
    const amount = Math.floor(100 + Math.random() * 49900);
    const fee = Math.round(amount * 0.02 * 100) / 100;
    const arrivalAmount = status === '存款成功' ? amount - fee : 0;
    const depositTime = generateTime('2026-04-19', Math.floor(Math.random() * 48) - 24);
    const arrivalTime = status === '存款成功'
      ? generateTime(depositTime, Math.random() * 0.5)
      : '-';
    const channel = randomFrom(depositChannels);
    const provider = randomFrom(paymentProviders);

    records.push({
      key: `dep-${i}`,
      seq: i + 1,
      depositOrderId: generateOrderId(),
      thirdPartyOrderId: generateThirdPartyId(),
      memberAccount: `${randomFrom(names).toLowerCase()}${Math.floor(100 + Math.random() * 900)}`,
      memberPhone: generatePhone(),
      orderStatus: status,
      depositTime,
      depositAccountType: randomFrom(accountTypes),
      paymentAccountId: `ACC${Math.floor(10000 + Math.random() * 90000)}`,
      depositAmount: amount,
      arrivalTime,
      arrivalAmount,
      fee: status === '存款成功' ? fee : 0,
      paymentProvider: provider,
      paymentChannel: channel,
      orderSourceDomain: randomFrom(domains),
      cancelReason: status === '存款失败' ? randomFrom(['超时未支付', '用户取消', '渠道异常', '金额不符']) : '-',
      remark: Math.random() > 0.8 ? randomFrom(['VIP客户', '大额审核', '首充', '重复订单']) : '-',
    });
  }
  return records.sort((a, b) => b.depositTime.localeCompare(a.depositTime));
}

export const depositRecords: DepositRecord[] = generateRecords();

export function getDepositSummary(records: DepositRecord[]) {
  const total = records.length;
  const success = records.filter(r => r.orderStatus === '存款成功');
  const successCount = success.length;
  const totalArrival = success.reduce((sum, r) => sum + r.arrivalAmount, 0);
  const totalFee = success.reduce((sum, r) => sum + r.fee, 0);
  const successRate = total > 0 ? ((successCount / total) * 100).toFixed(2) + '%' : '-';

  return { total, successCount, totalArrival, totalFee, successRate };
}

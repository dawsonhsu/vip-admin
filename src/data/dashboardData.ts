import dayjs, { type Dayjs } from 'dayjs';

export type MetricFormat = 'int' | 'money' | 'rate' | 'decimal';
export type GroupKey = 'member' | 'betting' | 'game';
export type QuickKey = '今日' | '昨日' | '本週' | '上週' | '本月' | '上月';
export type ChartUnit = '日' | '週' | '月';

export interface MetricDef {
  key: string;
  label: string;
  group: GroupKey;
  format: MetricFormat;
  icon?: string;
  tooltip?: string;
  secondary?: {
    key: string;
    label: string;
    format: MetricFormat;
  };
}

export interface DashboardStatTime {
  quickKey: QuickKey | null;
  range: [Dayjs, Dayjs];
}

export type DashboardSeriesRow = { bucket: string } & Record<string, string | number>;

export const QUICK_KEYS: QuickKey[] = ['今日', '昨日', '本週', '上週', '本月', '上月'];

export const dashboardMetrics: MetricDef[] = [
  {
    key: 'registerCount',
    label: '註冊人數',
    group: 'member',
    format: 'int',
    icon: 'user-add',
    secondary: { key: 'registerRate', label: '註冊率', format: 'rate' },
  },
  { key: 'loginCount', label: '登陸人數', group: 'member', format: 'int', icon: 'login' },
  { key: 'depositUserCount', label: '充值人數', group: 'member', format: 'int', icon: 'team' },
  {
    key: 'firstDepositCount',
    label: '首充人數',
    group: 'member',
    format: 'int',
    icon: 'usergroup-add',
    secondary: { key: 'firstDepositRate', label: '注充率', format: 'rate' },
  },
  { key: 'betUserCount', label: '投注人數', group: 'member', format: 'int', icon: 'solution' },
  {
    key: 'depositAmount',
    label: '充值金額',
    group: 'member',
    format: 'money',
    icon: 'dollar',
    secondary: { key: 'depositSuccessRate', label: '成功率', format: 'rate' },
  },
  { key: 'firstDepositAmount', label: '首充金額', group: 'member', format: 'money', icon: 'dollar' },
  {
    key: 'redepositAmount',
    label: '復充金額',
    group: 'member',
    format: 'money',
    icon: 'dollar',
    tooltip: '此統計區間的復充金額加總。（非首充）',
    secondary: { key: 'redepositUserCount', label: '復充人數', format: 'int' },
  },
  {
    key: 'depositUserArpu',
    label: '充值用戶客單價',
    group: 'member',
    format: 'decimal',
    icon: 'dollar',
    tooltip: '此區間有存款的不重複人平均充值金額。',
  },
  {
    key: 'activeUserArpu',
    label: '活躍用戶客單價',
    group: 'member',
    format: 'decimal',
    icon: 'dollar',
    tooltip: '此區間登入用戶平均充值金額。',
  },
  { key: 'bonusAmount', label: '彩金', group: 'member', format: 'money', icon: 'trophy' },
  { key: 'withdrawAmount', label: '提現金額', group: 'member', format: 'money', icon: 'account-book' },
  { key: 'withdrawUserCount', label: '提現人數', group: 'member', format: 'int', icon: 'user' },
  {
    key: 'depositWithdrawDiff',
    label: '充提差',
    group: 'member',
    format: 'money',
    icon: 'swap',
    tooltip: '充值金額 − 提款金額',
  },
  { key: 'totalBet', label: '總投注', group: 'betting', format: 'money', icon: 'dollar' },
  { key: 'validBet', label: '有效投注', group: 'betting', format: 'money', icon: 'dollar' },
  { key: 'totalPayout', label: '總派彩', group: 'betting', format: 'money', icon: 'money-collect' },
  {
    key: 'totalGgr',
    label: '總GGR',
    group: 'betting',
    format: 'money',
    icon: 'fund',
    tooltip: '包含一般注單、FS、Jackpot',
    secondary: { key: 'ggrRate', label: 'GGR%', format: 'rate' },
  },
  {
    key: 'betDepositRatio',
    label: '投充比',
    group: 'betting',
    format: 'rate',
    icon: 'percentage',
    tooltip: '有效投注金額 / 充值金額',
  },
  { key: 'fsGgr', label: 'FS GGR', group: 'betting', format: 'money', icon: 'gift' },
  { key: 'jackpotGgr', label: 'JACKPOT GGR', group: 'betting', format: 'money', icon: 'gift' },
  ...(
    [
      ['slotsGgr', 'SLOTS GGR'],
      ['fishingGgr', 'FISHING GGR'],
      ['sportsGgr', 'SPORTS GGR'],
      ['tableGgr', 'TABLE GGR'],
      ['liveGgr', 'LIVE GGR'],
      ['arcadeGgr', 'ARCADE GGR'],
      ['bingoGgr', 'BINGO GGR'],
    ] as const
  ).map(([key, label]): MetricDef => ({
    key,
    label,
    group: 'game',
    format: 'money',
    icon: 'appstore',
    secondary: { key: `${key}Rate`, label: 'GGR%', format: 'rate' },
  })),
];

const metricMap = new Map(dashboardMetrics.map((metric) => [metric.key, metric]));

export const getGroupMetrics = (group: GroupKey): MetricDef[] =>
  dashboardMetrics.filter((metric) => metric.group === group);

export const getGroupMetricKeys = (group: GroupKey): string[] =>
  getGroupMetrics(group).flatMap((metric) =>
    metric.secondary ? [metric.key, metric.secondary.key] : [metric.key]
  );

export const getMetricByKey = (key: string): MetricDef => {
  const metric = metricMap.get(key);
  if (!metric) throw new Error(`Unknown dashboard metric: ${key}`);
  return metric;
};

export const formatMetric = (value: number, format: MetricFormat): string => {
  if (format === 'rate') return `${value.toFixed(2)} %`;
  if (format === 'decimal') return value.toFixed(2);
  return Math.round(value).toLocaleString('en-US');
};

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const mulberry32 = (seed: number) => () => {
  let value = (seed += 0x6d2b79f5);
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
};

const numberForMetric = (seed: string, key: string, format: MetricFormat): number => {
  const random = mulberry32(hashString(`${seed}:${key}`))();

  if (key === 'depositWithdrawDiff') return -12_000_000 + random * 36_000_000;
  if (format === 'int') return 1_000 + random * 49_000;
  if (format === 'money') return 1_000_000 + random * 49_000_000;
  if (format === 'decimal') return 50 + random * 750;
  if (key === 'betDepositRatio' || key === 'ggrRate' || key.endsWith('GgrRate')) {
    return 5 + random * 35;
  }
  return 20 + random * 70;
};

// Some metrics have explicit definitions in the requirement doc; derive them from
// their base metrics so the on-card tooltips actually hold (instead of independent
// random mocks). Only computed when all inputs exist in the record, so it works both
// for the full dashboard summary and for per-group series rows.
const applyDerivations = (values: Record<string, number>): void => {
  if (values.depositAmount != null && values.withdrawAmount != null) {
    values.depositWithdrawDiff = values.depositAmount - values.withdrawAmount;
  }
  if (values.depositAmount != null && values.depositUserCount) {
    values.depositUserArpu = values.depositAmount / values.depositUserCount;
  }
  if (values.depositAmount != null && values.loginCount) {
    values.activeUserArpu = values.depositAmount / values.loginCount;
  }
  if (values.validBet != null && values.depositAmount) {
    values.betDepositRatio = (values.validBet / values.depositAmount) * 100;
  }
};

const entriesForGroup = (group: GroupKey) =>
  getGroupMetrics(group).flatMap((metric) => [
    { key: metric.key, format: metric.format },
    ...(metric.secondary
      ? [{ key: metric.secondary.key, format: metric.secondary.format }]
      : []),
  ]);

export const getDashboardSummary = (
  rangeStartISO: string,
  rangeEndISO: string
): Record<string, number> => {
  const rangeSeed = `${rangeStartISO}:${rangeEndISO}`;
  const summary = dashboardMetrics.reduce<Record<string, number>>((acc, metric) => {
    acc[metric.key] = numberForMetric(rangeSeed, metric.key, metric.format);
    if (metric.secondary) {
      acc[metric.secondary.key] = numberForMetric(
        rangeSeed,
        metric.secondary.key,
        metric.secondary.format
      );
    }
    return acc;
  }, {});
  applyDerivations(summary);
  return summary;
};

const mondayOfWeek = (date: Dayjs): Dayjs => {
  const day = date.day();
  return date.startOf('day').subtract(day === 0 ? 6 : day - 1, 'day');
};

const orderedRange = (startISO: string, endISO: string): [Dayjs, Dayjs] => {
  const start = dayjs(startISO).startOf('day');
  const end = dayjs(endISO).startOf('day');
  return start.isAfter(end) ? [end, start] : [start, end];
};

export const getSeries = (
  group: GroupKey,
  startISO: string,
  endISO: string,
  unit: ChartUnit
): DashboardSeriesRow[] => {
  const [requestedStart, rangeEnd] = orderedRange(startISO, endISO);
  const rangeStart = requestedStart.isBefore(rangeEnd.subtract(179, 'day'))
    ? rangeEnd.subtract(179, 'day')
    : requestedStart;
  const metricEntries = entriesForGroup(group);

  let cursor = rangeStart;
  let step: 'day' | 'week' | 'month' = 'day';
  let bucketFormat = 'YYYY-MM-DD';
  if (unit === '週') {
    cursor = mondayOfWeek(rangeStart);
    step = 'week';
  } else if (unit === '月') {
    cursor = rangeStart.startOf('month');
    step = 'month';
    bucketFormat = 'YYYY-MM';
  }

  const rows: DashboardSeriesRow[] = [];
  while (!cursor.isAfter(rangeEnd, unit === '月' ? 'month' : 'day')) {
    const bucket = cursor.format(bucketFormat);
    const row: DashboardSeriesRow = { bucket };
    metricEntries.forEach(({ key, format }) => {
      row[key] = numberForMetric(bucket, key, format);
    });
    applyDerivations(row as unknown as Record<string, number>);
    rows.push(row);
    cursor = cursor.add(1, step);
  }

  return rows;
};

export const getQuickRange = (quickKey: QuickKey): { start: Dayjs; end: Dayjs } => {
  const today = dayjs().startOf('day');
  const thisMonday = mondayOfWeek(today);

  switch (quickKey) {
    case '今日':
      return { start: today, end: today };
    case '昨日': {
      const yesterday = today.subtract(1, 'day');
      return { start: yesterday, end: yesterday };
    }
    case '本週':
      return { start: thisMonday, end: thisMonday.add(6, 'day') };
    case '上週': {
      const lastMonday = thisMonday.subtract(1, 'week');
      return { start: lastMonday, end: lastMonday.add(6, 'day') };
    }
    case '本月':
      return { start: today.startOf('month'), end: today.endOf('month').startOf('day') };
    case '上月': {
      const lastMonth = today.subtract(1, 'month');
      return {
        start: lastMonth.startOf('month'),
        end: lastMonth.endOf('month').startOf('day'),
      };
    }
  }
};

export const getChartDefaults = (
  quickKey: QuickKey | null,
  customRange: [Dayjs, Dayjs]
): { start: Dayjs; end: Dayjs; unit: ChartUnit } => {
  const today = dayjs().startOf('day');
  const thisMonday = mondayOfWeek(today);

  switch (quickKey) {
    case '今日':
      return { start: today.subtract(6, 'day'), end: today, unit: '日' };
    case '昨日':
      return { start: today.subtract(7, 'day'), end: today.subtract(1, 'day'), unit: '日' };
    case '本週':
      return {
        start: thisMonday.subtract(4, 'week'),
        end: thisMonday.add(6, 'day'),
        unit: '週',
      };
    case '上週':
      return {
        start: thisMonday.subtract(5, 'week'),
        end: thisMonday.subtract(1, 'day'),
        unit: '週',
      };
    case '本月':
      return {
        start: today.startOf('month').subtract(5, 'month'),
        end: today.endOf('month').startOf('day'),
        unit: '月',
      };
    case '上月':
      return {
        start: today.startOf('month').subtract(6, 'month'),
        end: today.startOf('month').subtract(1, 'day'),
        unit: '月',
      };
    default:
      return { start: customRange[0], end: customRange[1], unit: '日' };
  }
};

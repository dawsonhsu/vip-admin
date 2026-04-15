export interface ActivityRecord {
  key: number;
  id: number;
  type: string;
  name: string;
  status: '进行中' | '关闭';
  introEN: string;
  introTA: string;
  startTime: string;
  endTime: string;
  cycle: string;           // 活动循环周期：日 / 小时 / - 等
  settleCycle: string;     // 结算周期：实时 / 日 / 小时 / 即时
  report: string;          // 实时报表 label
  budgetLimit: string;     // 预算上限
  currentPaid: string;     // 当期实发
  updatedAt: string;
  updatedBy: string;
}

export interface VipTaskRecord {
  key: number;
  seq: number;
  taskId: string;
  name: string;
  description: string;
  status: '进行中' | '关闭';
  effectiveTime: string;
  taskType: '新手任务' | '日常任务' | '周常任务' | '成就任务';
  vipRange: string;       // 归属等级区间：青铜 / 白银 / 黄金 / - 等
  reward: string;          // 任务奖励
  resetTime: string;       // 重置时间：日 / - 等
  updatedAt: string;
  updatedBy: string;
}

// 限时活动（有效）—— 15 笔（含新增 FreeBet，归类为附加类）
export const activeActivities: ActivityRecord[] = [
  {
    key: 29, id: 29, type: '附加', name: '世界杯冠军 FreeBet', status: '进行中',
    introEN: '-', introTA: '-',
    startTime: '2026-05-01 00:00:00', endTime: '2026-06-10 23:59:59',
    cycle: '-', settleCycle: '即时',
    report: '查看报表', budgetLimit: '-', currentPaid: '₱ 0.00',
    updatedAt: '2026-04-14 10:30:00', updatedBy: 'darren@filbetph.com',
  },
  {
    key: 23, id: 23, type: '附加', name: 'poker rebate', status: '进行中',
    introEN: '-', introTA: '-',
    startTime: '2026-01-09 00:00:00', endTime: '2027-03-20 14:34:08',
    cycle: '日', settleCycle: '实时',
    report: '查看报表', budgetLimit: '-', currentPaid: '₱ 0.00',
    updatedAt: '2026-04-02 23:09:49', updatedBy: 'logan@filbetph.com',
  },
  {
    key: 24, id: 24, type: '其他', name: 'Password Login and Registration Bonus', status: '进行中',
    introEN: '-', introTA: '-',
    startTime: '2026-01-09 00:00:00', endTime: '2027-03-25 14:34:08',
    cycle: '日', settleCycle: '日',
    report: '查看报表', budgetLimit: '-', currentPaid: '₱ 0.00',
    updatedAt: '2026-04-06 13:52:41', updatedBy: 'logan@filbetph.com',
  },
  {
    key: 25, id: 25, type: '其他', name: 'vip签到', status: '进行中',
    introEN: '-', introTA: '-',
    startTime: '2026-01-09 00:00:00', endTime: '2026-03-31 14:34:08',
    cycle: '日', settleCycle: '日',
    report: '查看报表', budgetLimit: '-', currentPaid: '₱ 30.00',
    updatedAt: '2026-03-07 15:25:18', updatedBy: 'davinci@filbetph.com',
  },
  {
    key: 26, id: 26, type: '其他', name: '每日负盈利', status: '进行中',
    introEN: '-', introTA: '-',
    startTime: '2026-01-09 00:00:00', endTime: '2026-03-31 14:34:08',
    cycle: '日', settleCycle: '日',
    report: '查看报表', budgetLimit: '-', currentPaid: '₱ 0.00',
    updatedAt: '2026-03-07 15:25:18', updatedBy: 'davinci@filbetph.com',
  },
  {
    key: 27, id: 27, type: '其他', name: '每日负盈利-半月礼金', status: '进行中',
    introEN: '-', introTA: '-',
    startTime: '2026-01-09 00:00:00', endTime: '2026-03-31 14:34:08',
    cycle: '日', settleCycle: '日',
    report: '查看报表', budgetLimit: '-', currentPaid: '₱ 0.00',
    updatedAt: '2026-03-07 15:25:18', updatedBy: 'davinci@filbetph.com',
  },
  {
    key: 28, id: 28, type: '其他', name: 'Playtech排行榜', status: '进行中',
    introEN: '-', introTA: '-',
    startTime: '2026-04-01 00:00:00', endTime: '2026-04-30 14:34:08',
    cycle: '日', settleCycle: '日',
    report: '查看报表', budgetLimit: '-', currentPaid: '₱ 0.00',
    updatedAt: '2026-04-07 19:10:20', updatedBy: 'bali@filbetph.com',
  },
  {
    key: 12, id: 12, type: '游戏旋转类', name: '首存500/1000P免费旋转', status: '进行中',
    introEN: '-', introTA: '-',
    startTime: '2026-01-01 00:00:00', endTime: '2026-04-17 16:44:37',
    cycle: '-', settleCycle: '即时',
    report: '查看报表', budgetLimit: '-', currentPaid: '₱ 0.00',
    updatedAt: '2026-03-19 17:39:08', updatedBy: 'UKR@filbetph.com',
  },
  {
    key: 13, id: 13, type: '游戏旋转类', name: '日累计存款/流水多重奖励系列活动', status: '进行中',
    introEN: '-', introTA: '-',
    startTime: '2025-12-31 08:00:00', endTime: '2028-06-28 23:59:59',
    cycle: '日', settleCycle: '小时',
    report: '查看报表', budgetLimit: '-', currentPaid: '₱ 1.00',
    updatedAt: '2026-02-13 14:45:59', updatedBy: 'cary@filbetph.com',
  },
  {
    key: 14, id: 14, type: '游戏旋转类', name: '电销指定名单免费旋转', status: '进行中',
    introEN: '-', introTA: '-',
    startTime: '2025-06-19 22:20:34', endTime: '2026-12-31 23:59:59',
    cycle: '-', settleCycle: '小时',
    report: '查看报表', budgetLimit: '-', currentPaid: '₱ 0.00',
    updatedAt: '2026-01-03 18:55:19', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 16, id: 16, type: '返水类', name: '圣诞免费旋转', status: '进行中',
    introEN: '-', introTA: '-',
    startTime: '2025-11-09 16:00:00', endTime: '2026-12-31 15:59:59',
    cycle: '日', settleCycle: '日',
    report: '查看发放记录 | 查看旋转记录', budgetLimit: '-', currentPaid: '₱ 0.00',
    updatedAt: '2026-03-23 15:17:41', updatedBy: 'UKR@filbetph.com',
  },
  {
    key: 17, id: 17, type: '返水类', name: '投注赠送filcoin', status: '进行中',
    introEN: '-', introTA: '-',
    startTime: '2026-03-01 00:00:00', endTime: '2026-06-30 22:20:34',
    cycle: '日', settleCycle: '日',
    report: '查看报表', budgetLimit: '-', currentPaid: 'C 4,260,360.00',
    updatedAt: '2026-03-20 11:10:54', updatedBy: 'UKR@filbetph.com',
  },
  {
    key: 20, id: 20, type: '首存阶梯活动', name: '首存阶梯活动', status: '进行中',
    introEN: '-', introTA: '-',
    startTime: '2026-03-01 13:00:00', endTime: '2026-04-30 11:18:43',
    cycle: '日', settleCycle: '日',
    report: '查看报表', budgetLimit: '-', currentPaid: '₱ 20.00',
    updatedAt: '2026-04-04 17:04:51', updatedBy: 'bali@filbetph.com',
  },
  {
    key: 22, id: 22, type: '每日多存阶梯活动', name: '每日多存阶梯活动', status: '进行中',
    introEN: '-', introTA: '-',
    startTime: '2026-03-19 15:59:59', endTime: '2026-04-30 11:25:06',
    cycle: '日', settleCycle: '日',
    report: '查看报表', budgetLimit: '-', currentPaid: '₱ 500.00',
    updatedAt: '2026-04-01 15:26:09', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 19, id: 19, type: '其他', name: 'KYC Free Spin', status: '进行中',
    introEN: '-', introTA: '-',
    startTime: '2026-01-01 22:20:34', endTime: '2026-07-30 00:00:00',
    cycle: '日', settleCycle: '日',
    report: '查看报表', budgetLimit: '-', currentPaid: '₱ 115.11',
    updatedAt: '2026-04-10 17:59:40', updatedBy: 'davinci@filbetph.com',
  },
];

// 限时活动（失效）—— 9 笔 from FAT
export const inactiveActivities: ActivityRecord[] = [
  {
    key: 6, id: 6, type: 'CQ9投注返水0.8%活动', name: 'CQ9 Daily Rebate Campaign', status: '关闭',
    introEN: '-', introTA: '-',
    startTime: '2025-07-09 02:20:34', endTime: '2025-12-25 22:21:08',
    cycle: '日', settleCycle: '日',
    report: '查看报表', budgetLimit: '₱ 33,333.00', currentPaid: '₱ 0.00',
    updatedAt: '2025-12-20 19:12:25', updatedBy: 'wadewen',
  },
  {
    key: 7, id: 7, type: 'TPG负盈利返水1%活动', name: 'TPG Daily Loss Rebate Promotion', status: '关闭',
    introEN: '-', introTA: '-',
    startTime: '2025-06-19 22:20:34', endTime: '2025-12-22 16:31:19',
    cycle: '日', settleCycle: '日',
    report: '查看报表', budgetLimit: '-', currentPaid: '₱ 0.00',
    updatedAt: '2025-12-20 18:28:14', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 8, id: 8, type: 'App首次登录奖励', name: 'app首次登录奖励', status: '关闭',
    introEN: '-', introTA: '-',
    startTime: '2025-06-19 22:20:34', endTime: '2025-12-28 11:28:24',
    cycle: '-', settleCycle: '即时',
    report: '查看报表', budgetLimit: '-', currentPaid: '₱ 0.00',
    updatedAt: '2025-12-29 11:28:24', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 9, id: 9, type: '充值活动返现5%', name: 'GCash & Maya Deposit Bonus (5% Deposit Bonus Every Transaction)', status: '关闭',
    introEN: '-', introTA: '-',
    startTime: '2025-06-19 22:20:34', endTime: '2025-12-28 11:27:37',
    cycle: '日', settleCycle: '日',
    report: '查看报表', budgetLimit: '-', currentPaid: '₱ 0.00',
    updatedAt: '2025-12-29 11:27:37', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 10, id: 10, type: '排行榜类', name: 'Slot Betting Rankings', status: '关闭',
    introEN: '-', introTA: '-',
    startTime: '2026-01-01 00:00:00', endTime: '2026-01-31 14:20:34',
    cycle: '日', settleCycle: '日',
    report: '查看报表', budgetLimit: '-', currentPaid: '₱ 0.00',
    updatedAt: '2026-01-14 16:15:29', updatedBy: 'cary@filbetph.com',
  },
  {
    key: 11, id: 11, type: '游戏旋转类', name: '注册免费旋转20次', status: '关闭',
    introEN: '-', introTA: '-',
    startTime: '2026-01-01 00:00:00', endTime: '2026-04-01 19:08:38',
    cycle: '-', settleCycle: '即时',
    report: '查看报表', budgetLimit: '-', currentPaid: '₱ 0.00',
    updatedAt: '2026-03-19 17:38:45', updatedBy: 'UKR@filbetph.com',
  },
  {
    key: 15, id: 15, type: 'App新版本首次登录送50', name: 'app新版本首次登录送50', status: '关闭',
    introEN: '-', introTA: '-',
    startTime: '2025-06-19 22:20:34', endTime: '2025-12-28 11:27:14',
    cycle: '-', settleCycle: '即时',
    report: '查看报表', budgetLimit: '-', currentPaid: '₱ 0.00',
    updatedAt: '2025-12-29 11:27:14', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 18, id: 18, type: '其它', name: 'List of winners', status: '关闭',
    introEN: '-', introTA: '-',
    startTime: '2025-12-29 22:20:34', endTime: '2026-01-23 00:00:00',
    cycle: '日', settleCycle: '日',
    report: '查看报表', budgetLimit: '-', currentPaid: '₱ 0.00',
    updatedAt: '2025-12-30 17:45:36', updatedBy: 'cary@filbetph.com',
  },
  {
    key: 21, id: 21, type: '复存阶梯活动', name: '复存阶梯活动', status: '关闭',
    introEN: '-', introTA: '-',
    startTime: '2025-11-08 18:00:00', endTime: '2026-03-18 18:06:38',
    cycle: '日', settleCycle: '日',
    report: '查看报表', budgetLimit: '-', currentPaid: '₱ 0.00',
    updatedAt: '2026-03-19 18:06:38', updatedBy: 'UKR@filbetph.com',
  },
  {
    key: 1, id: 1, type: '盲盒活动', name: '盲合活动', status: '关闭',
    introEN: 'https://client-fat.filbet2025.com/blind-box',
    introTA: 'https://client-fat.filbet2025.com/blind-box',
    startTime: '2025-06-19 22:20:34', endTime: '2025-12-31 22:20:34',
    cycle: '日', settleCycle: '日',
    report: '查看报表', budgetLimit: '₱ 1,600,000.00', currentPaid: '₱ 0.00',
    updatedAt: '2025-12-26 17:53:25', updatedBy: 'bali@filbetph.com',
  },
];

// VIP 任务中心 —— 25 笔 from FAT
export const vipTasks: VipTaskRecord[] = [
  {
    key: 1, seq: 1, taskId: '27445328064080866',
    name: 'EN: Download Filbet App | TA: I-download ang Filbet App',
    description: 'EN: Download Filbet App | TA: I-download ang Filbet App',
    status: '关闭', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '新手任务', vipRange: '-', reward: '代币: 500', resetTime: '-',
    updatedAt: '2025-07-09 16:04:50', updatedBy: '-',
  },
  {
    key: 2, seq: 2, taskId: '28147209069456364',
    name: 'EN: Bind any E-Wallet / Bank Account for Withdrawal | TA: I-link ang anumang E-Wallet / Bank Account para sa Pag-withdraw',
    description: 'EN: Bind any E-Wallet / Bank Account for Withdrawal | TA: I-link ang anumang E-Wallet / Bank Account para sa Pag-withdraw',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '新手任务', vipRange: '-', reward: '代币: 100', resetTime: '-',
    updatedAt: '2025-07-14 12:17:23', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 3, seq: 3, taskId: '27416563275590626',
    name: 'EN: Make a first deposit of at least P500.00 | TA: Gumawa ng unang deposito na hindi bababa sa P500.00',
    description: 'EN: Make a first deposit of at least P500.00 | TA: Gumawa ng unang deposito na hindi bababa sa P500.00',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '新手任务', vipRange: '-', reward: '代币: 100', resetTime: '-',
    updatedAt: '2025-07-09 11:19:05', updatedBy: '-',
  },
  {
    key: 4, seq: 4, taskId: '27455810720295906',
    name: 'EN: Make 20 spins in any Slots games | TA: Gumawa ng 20 spins sa anumang laro ng Slots',
    description: 'EN: Make 20 spins in any Slots games | TA: Gumawa ng 20 spins sa anumang laro ng Slots',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '新手任务', vipRange: '-', reward: '代币: 100', resetTime: '-',
    updatedAt: '2025-07-09 17:48:58', updatedBy: '-',
  },
  {
    key: 5, seq: 5, taskId: '27760528147409890',
    name: 'EN: Play 10 rounds in any Live Casino games | TA: Maglaro ng 10 round sa anumang laro ng Live Casino',
    description: 'EN: Play 10 rounds in any Live Casino games | TA: Maglaro ng 10 round sa anumang laro ng Live Casino',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '新手任务', vipRange: '-', reward: '代币: 100', resetTime: '-',
    updatedAt: '2025-07-11 20:16:04', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 6, seq: 6, taskId: '28147022490037218',
    name: 'EN: Follow FILBET Facebook Page | TA: Sundan ang Pahina ng FILBET sa Facebook',
    description: 'https://www.facebook.com/FilbetPHofficial',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '新手任务', vipRange: '-', reward: '代币: 500', resetTime: '-',
    updatedAt: '2025-07-14 12:15:32', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 7, seq: 7, taskId: '27322369324411874',
    name: 'EN: Newcomer Sign-in | TA: Araw-araw na Check-in',
    description: 'EN: Newcomer Sign-in | TA: Araw-araw na Check-in',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '新手任务', vipRange: '-',
    reward: '代币: 第1天 50; 第2天 50; 第3天 50; 第4天 50; 第5天 50; 第6天 50; 第7天 100;',
    resetTime: '-',
    updatedAt: '2025-07-08 19:43:21', updatedBy: '-',
  },
  {
    key: 8, seq: 8, taskId: '27760773799406562',
    name: 'EN: Complete a point redemption once | TA: Kumpletuhin ang isang pag-redeem ng puntos',
    description: 'EN: Complete a point redemption once | TA: Kumpletuhin ang isang pag-redeem ng puntos',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '新手任务', vipRange: '-', reward: '代币: 100', resetTime: '-',
    updatedAt: '2025-07-11 20:18:30', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 9, seq: 9, taskId: '28147209069456354',
    name: 'EN: Complete one Daily Mission | TA: Kumpletuhin ang isang Araw-araw na Misyon',
    description: 'EN: Complete one Daily Mission | TA: Kumpletuhin ang isang Araw-araw na Misyon',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '新手任务', vipRange: '-', reward: '代币: 100', resetTime: '-',
    updatedAt: '2025-07-14 12:17:23', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 10, seq: 10, taskId: '28146638224681954',
    name: 'EN: Complete KYC Verification | TA: Kumpletuhin ang KYC Beripikasyon',
    description: 'EN: Complete KYC Verification | TA: Kumpletuhin ang KYC Beripikasyon',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '新手任务', vipRange: '-', reward: '代币: 500', resetTime: '-',
    updatedAt: '2025-07-14 12:11:43', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 11, seq: 11, taskId: '27760647332752354',
    name: 'EN: Make a first withdrawal of at least P200.00 | TA: Mag-withdraw sa unang pagkakataon ng kahit P200.00 lang',
    description: 'EN: Make a first withdrawal of at least P200.00 | TA: Mag-withdraw sa unang pagkakataon ng kahit P200.00 lang',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '新手任务', vipRange: '-', reward: '代币: 200', resetTime: '-',
    updatedAt: '2025-07-11 20:17:15', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 12, seq: 12, taskId: '29176017633471458',
    name: 'EN: Wager on Slot Games | TA: Tumaya ng P100.00 sa Slot Games at subaybayan ang iyong progreso',
    description: 'EN: Wager on Slot Games | TA: Tumaya ng P100.00 sa Slot Games at subaybayan ang iyong progreso',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '日常任务', vipRange: '青铜',
    reward: '场馆限制: 老虎机游戏 | 累计满 P100 → 代币 30 | 累计满 P500 → 代币 80 | 累计满 P1000 → 代币 180',
    resetTime: '日',
    updatedAt: '2025-07-21 14:37:41', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 13, seq: 13, taskId: '29183799325682658',
    name: 'EN: Wager P300.00 on Live Casino | TA: Tumaya ng P300.00 sa Slot Games at subaybayan ang iyong progreso',
    description: 'EN: Wager P300.00 on Live Casino | TA: Tumaya ng P300.00 sa Slot Games at subaybayan ang iyong progreso',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '日常任务', vipRange: '青铜', reward: '累计满 P300 → 代币 50', resetTime: '日',
    updatedAt: '2025-07-21 15:54:59', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 14, seq: 14, taskId: '29184002497768418',
    name: 'EN: Daily Check-in | TA: Araw-araw na Check-in',
    description: 'EN: Daily Check-in | TA: Araw-araw na Check-in',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '日常任务', vipRange: '青铜',
    reward: '连续签到: 第1/7天 10 | 第2/7天 20 | 第3/7天 30 | 第4/7天 40 | 第5/7天 50 | 第6/7天 60 | 第7/7天 70',
    resetTime: '日',
    updatedAt: '2025-07-21 15:57:01', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 15, seq: 15, taskId: '29185387607944162',
    name: 'EN: Spin 31 times with P2.00 on Jili-Super Ace | TA: Makakaikot ka ng 31 beses gamit ang P2.00 sa Jili–Super Ace',
    description: 'EN: Spin 31 times with P2.00 on Jili-Super Ace | TA: Makakaikot ka ng 31 beses gamit ang P2.00 sa Jili–Super Ace',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '日常任务', vipRange: '青铜',
    reward: '场馆限制: 老虎机 | 单笔 ≥ P2 | 有效投注 31 次 → 代币 10',
    resetTime: '日',
    updatedAt: '2025-07-21 16:10:46', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 16, seq: 16, taskId: '29185662552959970',
    name: 'EN: Spin 51 times with P6.60 on FaChai - Lucky Fortunes | TA: Makakaikot ka ng 51 beses gamit ang P6.60 sa FaChai – Lucky Fortune',
    description: 'EN: Spin 51 times with P6.60 on FaChai - Lucky Fortunes | TA: Makakaikot ka ng 51 beses gamit ang P6.60 sa FaChai – Lucky Fortune',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '日常任务', vipRange: '青铜',
    reward: '场馆限制: 老虎机 | 单笔 ≥ P6 | 有效投注 51 次 → 代币 30',
    resetTime: '日',
    updatedAt: '2025-07-21 16:13:30', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 17, seq: 17, taskId: '30205716815997922',
    name: 'EN: Spin 101 times with P10.00 on Pragmatic Play Slot Games | TA: Makakaikot ka ng 101 beses gamit ang P10.00 sa Pragmatic Play Slot Games',
    description: 'EN: Spin 101 times with P10.00 on Pragmatic Play Slot Games | TA: Makakaikot ka ng 101 beses gamit ang P10.00 sa Pragmatic Play Slot Games',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '日常任务', vipRange: '青铜',
    reward: '单笔 ≥ P10 | 有效投注 101 次 → 代币 100',
    resetTime: '日',
    updatedAt: '2025-07-28 17:06:50', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 18, seq: 18, taskId: '29184365070183394',
    name: 'EN: Win P100.00 in a single game | TA: Manalo ng P100.00 sa iisang laro lang',
    description: 'EN: Win P100.00 in a single game | TA: Manalo ng P100.00 sa iisang laro lang',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '日常任务', vipRange: '青铜',
    reward: '单局赢得 GGR ≥ P100 → 代币 100',
    resetTime: '日',
    updatedAt: '2025-07-21 16:00:37', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 19, seq: 19, taskId: '29184506820881378',
    name: 'EN: Win 100 times the bet in a single game | TA: Manalo ng hanggang 100x ng iyong taya sa iisang laro lang',
    description: 'EN: Win 100 times the bet in a single game | TA: Manalo ng hanggang 100x ng iyong taya sa iisang laro lang',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '日常任务', vipRange: '青铜',
    reward: '单注 GGR / 投注额 ≥ 100 倍 → 代币 500',
    resetTime: '日',
    updatedAt: '2025-07-21 16:02:01', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 20, seq: 20, taskId: '29184599145901026',
    name: 'EN: Win a total of P200.00 | TA: Manalo ng kabuuang P200.00 sa iyong paglalaro',
    description: 'EN: Win a total of P200.00 | TA: Manalo ng kabuuang P200.00 sa iyong paglalaro',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '日常任务', vipRange: '青铜',
    reward: '累计 GGR ≥ P200 → 代币 100',
    resetTime: '日',
    updatedAt: '2025-07-21 16:02:56', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 21, seq: 21, taskId: '29184698920004578',
    name: 'EN: Share once on Facebook | TA: I-share sa Facebook isang beses',
    description: 'EN: Share once on Facebook | TA: I-share sa Facebook isang beses',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '日常任务', vipRange: '青铜',
    reward: '代币: 100', resetTime: '日',
    updatedAt: '2025-07-21 16:03:56', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 22, seq: 22, taskId: '29185098167413730',
    name: 'EN: Win 3 times in a row on Baccarat | TA: Manalo ng tatlong sunod-sunod na beses sa Baccarat',
    description: 'EN: Win 3 times in a row on Baccarat | TA: Manalo ng tatlong sunod-sunod na beses sa Baccarat',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '日常任务', vipRange: '青铜',
    reward: '连续 3 注盈利 (GGR>0) → 代币 100',
    resetTime: '日',
    updatedAt: '2025-07-21 16:07:54', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 23, seq: 23, taskId: '30335963964173282',
    name: 'EN: Wager on Slot Games | TA: Tumaya ng 500 pesos sa Slot Games at subaybayan ang iyong progreso',
    description: 'EN: Wager on Slot Games | TA: Tumaya ng 500 pesos sa Slot Games at subaybayan ang iyong progreso',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '日常任务', vipRange: '白银',
    reward: '累计满 P500 → 代币 150 | 累计满 P2000 → 代币 350 | 累计满 P5000 → 代币 900',
    resetTime: '日',
    updatedAt: '2025-07-29 14:40:43', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 24, seq: 24, taskId: '30336485584595938',
    name: 'EN: Wager 3,000 pesos on LiveCasino | TA: Tumaya ng 3,000 pesos sa Slot Games at subaybayan ang iyong progreso',
    description: 'EN: Wager 3,000 pesos on LiveCasino | TA: Tumaya ng 3,000 pesos sa Slot Games at subaybayan ang iyong progreso',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '日常任务', vipRange: '白银',
    reward: '累计满 P3000 → 代币 500', resetTime: '日',
    updatedAt: '2025-07-29 14:45:54', updatedBy: 'seven@filbetph.com',
  },
  {
    key: 25, seq: 25, taskId: '30337694114573282',
    name: 'EN: Spin 51 times with P5.00 on Jili Slot Games | TA: Makakaikot ka ng 51 beses gamit ang P5.00 sa Jili Slot Games',
    description: 'EN: Spin 51 times with P5.00 on Jili Slot Games | TA: Makakaikot ka ng 51 beses gamit ang P5.00 sa Jili Slot Games',
    status: '进行中', effectiveTime: '2025-08-20 00:00:00 - 2026-12-31 23:59:59',
    taskType: '日常任务', vipRange: '白银',
    reward: '单笔 ≥ P5 | 有效投注 51 次 → 代币 40',
    resetTime: '日',
    updatedAt: '2025-07-29 14:57:54', updatedBy: 'seven@filbetph.com',
  },
];

// 活动类型（for filter dropdown）
export const activityTypes = Array.from(
  new Set([...activeActivities, ...inactiveActivities].map((a) => a.type))
);

// 更新人（for filter dropdown）
export const updaters = Array.from(
  new Set(
    [...activeActivities, ...inactiveActivities, ...vipTasks].map((a) => a.updatedBy)
  )
).filter((u) => u && u !== '-');

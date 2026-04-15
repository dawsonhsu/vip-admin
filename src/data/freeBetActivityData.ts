import dayjs from 'dayjs';

export interface FreeBetRewardConfig {
  key: number;
  vipLevel: number;
  bonusId: number;
  rewardAmount: number;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

export interface ActivityConfigModule {
  key: string;
  moduleName: string;
  objective: string;
  configItems: string[];
  controllableActions: string[];
}

export interface FreeBetGrantRecord {
  id: string;
  uid: string;
  playerAccount: string;
  phone: string;
  vipLevelAtSettlement: number;
  triggerBetId: string;
  triggerSettledAt: string;
  rewardAmount: number;
  bonusId: number;
  assigneeId: number | null;
  btiStatusCode: number | null;
  grantStatus: 'success' | 'warning' | 'failed';
  freeBetStatus: 'active' | 'used' | 'expired' | 'ready';
  grantedAt: string | null;
  usedAt: string | null;
  activeTill: string | null;
  lastSyncAt: string | null;
  operator: string | null;
  remark: string;
  errorMessage?: string;
  errorCode?: string;
  errorAt?: string;
}

const rewardAmounts = [
  7, 17, 37, 57, 77, 107, 177, 277, 377, 477,
  577, 677, 777, 877, 977, 1077, 1377, 1777, 2077, 2577,
  2777, 3077, 3377, 3677, 3777, 4077, 4577, 4777, 6777, 7777,
];

const eligibleUsers = [
  211447, 121552, 125135, 85958, 35105, 39688, 5723, 10788, 4133, 1612,
  2425, 7749, 988, 700, 925, 971, 600, 758, 129, 43,
  18, 13, 9, 8, 0, 1, 0, 0, 0, 0,
];

const formatDate = (daysAgo: number) => dayjs().subtract(daysAgo, 'day').format('YYYY-MM-DD HH:mm:ss');

export const freeBetRewardConfigs: FreeBetRewardConfig[] = rewardAmounts.map((rewardAmount, index) => {
  const vipLevel = index + 1;

  return {
    key: vipLevel,
    vipLevel,
    bonusId: 9776,
    rewardAmount,
    lastUpdatedBy: 'admin@filbetph.com',
    lastUpdatedAt: '2026-04-08 15:30:00',
  };
});

// 动态今日日期，确保 mock data 永远包含"今日"记录
const TODAY = dayjs();
const todayAt = (h: number, m: number, s = 0) =>
  TODAY.hour(h).minute(m).second(s).format('YYYY-MM-DD HH:mm:ss');
const yesterdayAt = (h: number, m: number, s = 0) =>
  TODAY.subtract(1, 'day').hour(h).minute(m).second(s).format('YYYY-MM-DD HH:mm:ss');
const daysAgoAt = (d: number, h: number, m: number) =>
  TODAY.subtract(d, 'day').hour(h).minute(m).second(0).format('YYYY-MM-DD HH:mm:ss');
const daysAheadAt = (d: number, h: number, m: number) =>
  TODAY.add(d, 'day').hour(h).minute(m).second(0).format('YYYY-MM-DD HH:mm:ss');

export const freeBetGrantRecords: FreeBetGrantRecord[] = [
  // 今日发放的记录 —— 确保默认"今日"过滤可见
  {
    id: 'CFG-' + TODAY.format('YYYYMMDD') + '-0001',
    uid: 'U100201',
    playerAccount: 'worldcup_ace',
    phone: '+639171234501',
    vipLevelAtSettlement: 8,
    triggerBetId: 'BTI-55372891',
    triggerSettledAt: todayAt(9, 23, 19),
    rewardAmount: 277,
    bonusId: 9776,
    assigneeId: 540112,
    btiStatusCode: 1,
    grantStatus: 'success',
    freeBetStatus: 'active',
    grantedAt: todayAt(9, 24, 2),
    usedAt: null,
    activeTill: daysAheadAt(30, 23, 59),
    lastSyncAt: todayAt(9, 24, 5),
    operator: 'system',
    remark: '活动期间首笔已结算体育注单，自动发放',
  },
  {
    id: 'CFG-' + TODAY.format('YYYYMMDD') + '-0002',
    uid: 'U100302',
    playerAccount: 'vip_tiger',
    phone: '+639181234502',
    vipLevelAtSettlement: 14,
    triggerBetId: 'BTI-55372955',
    triggerSettledAt: todayAt(11, 2, 41),
    rewardAmount: 877,
    bonusId: 9776,
    assigneeId: 540148,
    btiStatusCode: 2,
    grantStatus: 'success',
    freeBetStatus: 'used',
    grantedAt: todayAt(11, 3, 15),
    usedAt: todayAt(13, 34, 9),
    activeTill: daysAheadAt(30, 23, 59),
    lastSyncAt: todayAt(13, 35, 0),
    operator: 'system',
    remark: '已用于世界杯冠军盘口 - Brazil',
  },
  {
    id: 'CFG-' + TODAY.format('YYYYMMDD') + '-0003',
    uid: 'U100403',
    playerAccount: 'legend_v21',
    phone: '+639191234503',
    vipLevelAtSettlement: 21,
    triggerBetId: 'BTI-55381207',
    triggerSettledAt: todayAt(13, 18, 54),
    rewardAmount: 2777,
    bonusId: 9776,
    assigneeId: 540394,
    btiStatusCode: 7,
    grantStatus: 'warning',
    freeBetStatus: 'ready',
    grantedAt: todayAt(13, 19, 12),
    usedAt: null,
    activeTill: daysAheadAt(30, 23, 59),
    lastSyncAt: todayAt(13, 20, 0),
    operator: 'system',
    remark: '派发成功但 BTi 返回 warning，等待奖金转 active',
    errorCode: 'BTI-W-2301',
    errorMessage:
      'Bonus assigned but pending activation. BTi returned warning: "Bonus status=PENDING_ACTIVE, activation will complete within 5 minutes, please re-sync if not auto-transitioned."',
    errorAt: todayAt(13, 19, 12),
  },
  {
    id: 'CFG-' + TODAY.format('YYYYMMDD') + '-0004',
    uid: 'U100504',
    playerAccount: 'lucky_ronaldo',
    phone: '+639201234504',
    vipLevelAtSettlement: 5,
    triggerBetId: 'BTI-55391820',
    triggerSettledAt: todayAt(14, 44, 26),
    rewardAmount: 77,
    bonusId: 9776,
    assigneeId: 540688,
    btiStatusCode: 1,
    grantStatus: 'success',
    freeBetStatus: 'active',
    grantedAt: todayAt(14, 44, 58),
    usedAt: null,
    activeTill: daysAheadAt(30, 23, 59),
    lastSyncAt: todayAt(14, 45, 0),
    operator: 'system',
    remark: '今日下午自动派奖，未使用',
  },
  {
    id: 'CFG-' + TODAY.format('YYYYMMDD') + '-0005',
    uid: 'U100605',
    playerAccount: 'goal_master',
    phone: '+639211234505',
    vipLevelAtSettlement: 30,
    triggerBetId: 'BTI-55410118',
    triggerSettledAt: todayAt(15, 31, 7),
    rewardAmount: 7777,
    bonusId: 9776,
    assigneeId: 541102,
    btiStatusCode: 1,
    grantStatus: 'success',
    freeBetStatus: 'active',
    grantedAt: todayAt(15, 31, 36),
    usedAt: null,
    activeTill: daysAheadAt(30, 23, 59),
    lastSyncAt: todayAt(15, 32, 0),
    operator: 'system',
    remark: 'VIP30 自动派奖，等待用户投注',
  },
  {
    id: 'CFG-' + TODAY.format('YYYYMMDD') + '-0006',
    uid: 'U100706',
    playerAccount: 'check_with_cs',
    phone: '+639221234506',
    vipLevelAtSettlement: 11,
    triggerBetId: 'BTI-55413992',
    triggerSettledAt: todayAt(16, 52, 11),
    rewardAmount: 577,
    bonusId: 9776,
    assigneeId: null,
    btiStatusCode: null,
    grantStatus: 'failed',
    freeBetStatus: 'ready',
    grantedAt: null,
    usedAt: null,
    activeTill: null,
    lastSyncAt: null,
    operator: null,
    remark: 'BTi assign 失败，客服待补发',
    errorCode: 'BTI-E-5004',
    errorMessage:
      'Failed to assign bonus to player. BTi responded: "Player balance wallet locked due to ongoing KYC re-verification. Retry after KYC status becomes VERIFIED." Please contact customer service to resolve KYC before retry.',
    errorAt: todayAt(16, 52, 11),
  },

  // 昨天的记录
  {
    id: 'CFG-' + TODAY.subtract(1, 'day').format('YYYYMMDD') + '-0007',
    uid: 'U100807',
    playerAccount: 'manual_review_77',
    phone: '+639231234507',
    vipLevelAtSettlement: 19,
    triggerBetId: 'BTI-55422831',
    triggerSettledAt: yesterdayAt(13, 15, 48),
    rewardAmount: 2077,
    bonusId: 9776,
    assigneeId: 541670,
    btiStatusCode: 6,
    grantStatus: 'success',
    freeBetStatus: 'used',
    grantedAt: yesterdayAt(13, 16, 22),
    usedAt: null,
    activeTill: daysAheadAt(29, 23, 59),
    lastSyncAt: yesterdayAt(15, 0, 0),
    operator: 'risk.ops@filbetph.com',
    remark: '侦测多账号风险，回收奖励',
  },
  {
    id: 'CFG-' + TODAY.subtract(1, 'day').format('YYYYMMDD') + '-0008',
    uid: 'U100908',
    playerAccount: 'upgrade_waiting',
    phone: '+639241234508',
    vipLevelAtSettlement: 1,
    triggerBetId: 'BTI-55430144',
    triggerSettledAt: yesterdayAt(17, 6, 3),
    rewardAmount: 7,
    bonusId: 9776,
    assigneeId: 541995,
    btiStatusCode: 1,
    grantStatus: 'success',
    freeBetStatus: 'active',
    grantedAt: yesterdayAt(17, 6, 47),
    usedAt: null,
    activeTill: daysAheadAt(29, 23, 59),
    lastSyncAt: yesterdayAt(17, 7, 0),
    operator: 'system',
    remark: 'VIP0 升级至 VIP1 后首笔结算触发',
  },

  // 3 天前的记录
  {
    id: 'CFG-' + TODAY.subtract(3, 'day').format('YYYYMMDD') + '-0009',
    uid: 'U101009',
    playerAccount: 'new_player_99',
    phone: '+639251234509',
    vipLevelAtSettlement: 3,
    triggerBetId: 'BTI-55438201',
    triggerSettledAt: daysAgoAt(3, 10, 22),
    rewardAmount: 37,
    bonusId: 9776,
    assigneeId: 542210,
    btiStatusCode: 0,
    grantStatus: 'success',
    freeBetStatus: 'ready',
    grantedAt: daysAgoAt(3, 10, 23),
    usedAt: null,
    activeTill: daysAheadAt(27, 23, 59),
    lastSyncAt: daysAgoAt(3, 10, 23),
    operator: 'system',
    remark: 'BTi 返回 Inactive，等待激活',
  },
];

export const activityConfigModules: ActivityConfigModule[] = [
  {
    key: "activity-basic",
    moduleName: "活动基本设定",
    objective: "定义活动本身是否成立，避免活动文案、时间、适用产品与发放逻辑脱节。",
    configItems: [
      "活动名称 / 活动代号",
      "活动起讫时间与时区",
      "活动状态：草稿 / 预热 / 进行中 / 已结束 / 已关闭",
      "适用站点 / 品牌 / 币别",
      "前台文案版本与 Banner 素材",
    ],
    controllableActions: [
      "发布活动",
      "提前结束活动",
      "下线前台入口",
      "复制活动配置",
    ],
  },
  {
    key: "eligibility",
    moduleName: "参与资格与触发规则",
    objective: "资格判断要由平台掌握，而不是完全依赖 BTi，因为规则涉及 KYC、VIP、首笔结算等平台内资料。",
    configItems: [
      "KYC 条件：仅 Fully KYC",
      "最低 VIP 等级：VIP1+",
      "排除 VIP0，升级后再看首笔已结算注单",
      "触发条件：活动期间内首笔已结算体育注单",
      "参与次数限制：每人仅一次",
      "奖励等级依据：以结算时 VIP 等级为准",
    ],
    controllableActions: [
      "启用 / 关闭资格引擎",
      "重跑资格判定",
      "人工标记不符合资格",
      "人工放行个案",
    ],
  },
  {
    key: "reward-mapping",
    moduleName: "奖励映射与发放模板",
    objective: "平台需要维护 VIP 等级到 FreeBet 金额的映射，同时绑到 BTi 的 Bonus 模板。",
    configItems: [
      "每个 VIP 等级对应发放金额",
      "Bonus ID（BTi FreeBet 模板 ID）",
      "活动内是否允许多 Bonus 模板并存",
      "发放批次编号 / 版本号",
      "发放原因标签：自动 / 补发 / 风控回滚后重发",
    ],
    controllableActions: [
      "调整 VIP 金额映射",
      "切换 Bonus 模板",
      "冻结某个 VIP 档位发放",
      "导出奖励配置",
    ],
  },
  {
    key: "issuance-control",
    moduleName: "发放控制与状态处理",
    objective: "BTi 只负责 assign / query / cancel，平台必须决定何时发、失败怎么补、异常怎么挂起。",
    configItems: [
      "自动发放开关",
      "失败重试次数与间隔",
      "warning / ready 状态处理规则",
      "补发审批层级",
      "是否允许客服取消已发放 FreeBet",
    ],
    controllableActions: [
      "重试发放",
      "人工补发",
      "取消 FreeBet",
      "重新同步 BTi 状态",
      "批量处理 Pending 记录",
    ],
  },
  {
    key: "usage-limit",
    moduleName: "使用限制与核销追踪",
    objective: "活动规则要求仅限世界杯冠军盘口、30 天有效，这部分要能被平台看见并核对。",
    configItems: [
      "使用范围：世界杯冠军盘口",
      "有效期：发放后 30 天",
      "本金不返还，仅净盈利可提领",
      "不可取消 / 不可提前结算",
      "实际使用时间与关联注单号",
    ],
    controllableActions: [
      "查看 BTi 使用明细",
      "查询实际下注时间",
      "核对到期时间",
      "标记逾期未用原因",
    ],
  },
  {
    key: "risk-cs",
    moduleName: "风控与客服处理",
    objective: "活动一定会有多账号、套利、漏发、误发，这些不能只靠游戏商接口，要靠平台工作流处理。",
    configItems: [
      "异常原因分类：多账号 / 套利 / 资料异常 / BTi 超时",
      "客服补发备注",
      "风控拦截标签",
      "人工审核状态",
      "操作日志与责任人",
    ],
    controllableActions: [
      "回收奖励",
      "提交风控审核",
      "客服补发登记",
      "查看完整操作日志",
    ],
  },
];

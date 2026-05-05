'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Button, Card, Cascader, Col, DatePicker, Descriptions, Drawer, Form, Image, Input, InputNumber, Modal, Progress, Radio, Row, Select, Space, Statistic, Steps, Table, Tag, Tooltip, Typography, Upload, message,
} from 'antd';
import {
  CopyOutlined, DownloadOutlined, EyeOutlined, InfoCircleOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, StopOutlined, SyncOutlined, TeamOutlined, UploadOutlined, WarningOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { FormInstance } from 'antd/es/form';
import type { RcFile, UploadChangeParam, UploadFile } from 'antd/es/upload';
import dayjs from 'dayjs';
import { freeSpinRestrictionCatalog, generateFreeSpinGrants, type FreeSpinGrantItem } from '@/data/mockData';
import type { GameType } from '@/data/memberStatsData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const providers = [
  { code: 'FC', name: 'FC Game' },
  { code: 'JDB', name: 'JDB' },
  { code: 'JILI', name: 'JILI' },
  { code: 'PG', name: 'PG SOFT' },
  { code: 'PP', name: 'Pragmatic Play' },
];

const activityOptions = ['春節首存活動', 'VIP月禮', '週年慶活動', '新遊戲推廣'];
const coverImageMaxSize = 500 * 1024;
const acceptedCoverImageExtensions = ['jpg', 'jpeg', 'png', 'webp'];

const defaultFsCoverImage = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
    <defs>
      <linearGradient id="placeholderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#dbeafe" />
        <stop offset="100%" stop-color="#fef3c7" />
      </linearGradient>
    </defs>
    <rect width="400" height="500" rx="28" fill="url(#placeholderGradient)" />
    <path d="M0 355 C110 290 240 435 400 330 L400 500 L0 500 Z" fill="rgba(255,255,255,0.42)" />
    <text x="40" y="138" fill="#1f2937" font-size="28" font-family="Arial, sans-serif" font-weight="700">FREE SPIN</text>
    <text x="40" y="196" fill="#475569" font-size="20" font-family="Arial, sans-serif">FS Preview</text>
    <text x="40" y="420" fill="#1e3a8a" font-size="96" font-family="Arial, sans-serif" font-weight="700">FS</text>
  </svg>
`)}`;

const formatCurrency = (val: number) => `₱${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const providerGames: Record<string, { code: string; name: string }[]> = {
  FC: [
    { code: 'night_market', name: 'Night Market' },
    { code: 'chinese_ny', name: 'Chinese New Year' },
    { code: 'sugar_bang', name: 'Sugar Bang Bang' },
  ],
  JDB: [
    { code: 'zeus', name: 'Zeus' },
    { code: 'cowboys', name: 'Cowboys' },
    { code: 'golden_genie', name: 'Golden Genie' },
  ],
  JILI: [
    { code: 'super_ace', name: 'Super Ace' },
    { code: 'fortune_gems', name: 'Fortune Gems' },
    { code: 'golden_empire', name: 'Golden Empire' },
  ],
  PG: [
    { code: 'fortune_tiger', name: 'Fortune Tiger' },
    { code: 'fortune_rabbit', name: 'Fortune Rabbit' },
    { code: 'mahjong_ways', name: 'Mahjong Ways' },
  ],
  PP: [
    { code: 'sweet_bonanza', name: 'Sweet Bonanza' },
    { code: 'gates_olympus', name: 'Gates of Olympus' },
    { code: 'starlight_princess', name: 'Starlight Princess' },
  ],
};

type GameRestrictionPath = [GameType] | [GameType, string] | [GameType, string, string];
type RestrictionCatalogEntry = [GameType, (typeof freeSpinRestrictionCatalog)[GameType]];
type DispatchAttempt = FreeSpinGrantItem['dispatchSummary']['attempts'][number];
type GrantTypeValue = FreeSpinGrantItem['grantType'];
type BatchIdentifierType = 'phone' | 'uid' | 'account';
type BatchSourceEntry = {
  identifier: string;
  spinOverride: number | null;
};
type BatchParsedSource = {
  rawCount: number;
  entries: BatchSourceEntry[];
};
type BatchResultRow = {
  key: string;
  identifierRaw: string;
  userId: string | null;
  status: 'success' | 'failed';
  failureReason: string | null;
};
type BatchResultData = {
  totalCount: number;
  successCount: number;
  failedCount: number;
  successList: BatchResultRow[];
  failedList: BatchResultRow[];
};

const providerNameMap = [
  ...providers,
  ...Object.values(freeSpinRestrictionCatalog).flatMap((restrictionProviders) =>
    restrictionProviders.map((restrictionProvider) => ({
      code: restrictionProvider.code,
      name: restrictionProvider.name,
    }))
  ),
].reduce<Record<string, string>>((acc, provider) => {
  acc[provider.code] = provider.name;
  return acc;
}, {});

const renderGameRestrictionSummary = (gameRestriction: FreeSpinGrantItem['gameRestriction']) => {
  if (!gameRestriction) return '不限';

  const gameTypeText = gameRestriction.gameTypes.join(' / ');
  const providerText = gameRestriction.providers
    .map((providerCode) => providerNameMap[providerCode] || providerCode)
    .join('、');
  const gameText = gameRestriction.games.map((game) => game.name).join('、');

  return (
    <Space direction="vertical" size={2}>
      <Text>{gameTypeText || '不限'}</Text>
      <Text type="secondary" style={{ fontSize: 12 }}>
        廠商：{providerText || '不限'}
      </Text>
      <Text type="secondary" style={{ fontSize: 12 }}>
        遊戲：{gameText || '不限'}
      </Text>
    </Space>
  );
};

const renderClaimStatus = (val: FreeSpinGrantItem['claimStatus']) => {
  const map: Record<string, { color: string; label: string }> = {
    claimed: { color: 'default', label: '已領取' },
    in_use: { color: 'processing', label: '使用中' },
    completed: { color: 'success', label: '已完成' },
    expired: { color: 'error', label: '已過期' },
    voided: { color: 'default', label: '已作廢' },
  };
  const cfg = map[val] || { color: 'default', label: val };
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
};

const formatRelativeTime = (value: string | null) => {
  if (!value) return '—';

  const target = dayjs(value);
  const now = dayjs();
  const minutes = now.diff(target, 'minute');
  const hours = now.diff(target, 'hour');
  const days = now.diff(target, 'day');

  if (minutes < 1) return '剛剛';
  if (minutes < 60) return `${minutes} 分鐘前`;
  if (hours < 24) return `${hours} 小時前`;
  if (days < 30) return `${days} 天前`;
  return target.format('YYYY-MM-DD HH:mm:ss');
};

const canVoidGrant = (record: FreeSpinGrantItem) => record.claimStatus === 'claimed';

const renderDispatchAnomaly = (record: FreeSpinGrantItem, onClick?: () => void) => {
  const { dispatchSummary } = record;

  if (dispatchSummary.failedAttemptCount === 0) {
    return <Text type="secondary">—</Text>;
  }

  return (
    <Tooltip
      title={
        <div>
          <div>最近失敗：{formatRelativeTime(dispatchSummary.lastAttemptResult === 'fail' ? dispatchSummary.lastAttemptAt : null)}</div>
          <div>失敗次數：{dispatchSummary.failedAttemptCount} 次</div>
          <div>失敗原因：{dispatchSummary.lastFailureReason || '—'}</div>
          <div style={{ marginTop: 4, opacity: 0.8 }}>點擊查看詳情</div>
        </div>
      }
    >
      <span
        style={{ cursor: 'pointer' }}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.();
        }}
      >
        <WarningOutlined style={{ color: '#faad14', fontSize: 16 }} />
      </span>
    </Tooltip>
  );
};

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error('read_cover_image_failed'));
  reader.readAsDataURL(file);
});

const validateCoverImageFile = (file: RcFile) => {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!acceptedCoverImageExtensions.includes(extension)) {
    message.error('封面圖僅支援 jpg / jpeg / png / webp');
    return Upload.LIST_IGNORE;
  }
  if (file.size > coverImageMaxSize) {
    message.error('封面圖大小不可超過 500KB');
    return Upload.LIST_IGNORE;
  }
  return false;
};

const batchIdentifierHeaderSet = new Set(['identifier', 'phone', 'uid', 'account']);

const normalizeBatchIdentifier = (value: string, identifierType: BatchIdentifierType) => {
  const trimmed = value.trim();
  return identifierType === 'phone' ? trimmed.replace(/\D/g, '') : trimmed;
};

const getNextGrantIdSeed = (grants: FreeSpinGrantItem[]) => grants.reduce((maxId, grant) => {
  const numericId = Number.parseInt(grant.id.replace(/^FS/, ''), 10);
  return Number.isNaN(numericId) ? maxId : Math.max(maxId, numericId);
}, 0);

const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
};

const readTextFile = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('read_text_file_failed'));
  reader.readAsText(file, 'utf-8');
});

export default function FreeSpinGrantsPage() {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [allGrants, setAllGrants] = useState(() => generateFreeSpinGrants(60));
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchForm] = Form.useForm();
  const [selectedGrantType, setSelectedGrantType] = useState<string | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [batchStep, setBatchStep] = useState(0);
  const [batchIdentifierType, setBatchIdentifierType] = useState<BatchIdentifierType>('uid');
  const [batchSourceFileName, setBatchSourceFileName] = useState<string | null>(null);
  const [batchSourceRawCount, setBatchSourceRawCount] = useState(0);
  const [batchSourceEntries, setBatchSourceEntries] = useState<BatchSourceEntry[]>([]);
  const [batchSelectedGrantType, setBatchSelectedGrantType] = useState<GrantTypeValue | null>(null);
  const [batchSelectedProviders, setBatchSelectedProviders] = useState<string[]>([]);
  const [batchCoverFileList, setBatchCoverFileList] = useState<UploadFile[]>([]);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchResultData | null>(null);
  const [drawerGrant, setDrawerGrant] = useState<FreeSpinGrantItem | null>(null);
  const [createCoverFileList, setCreateCoverFileList] = useState<UploadFile[]>([]);

  const playerPool = useMemo(() => Array.from(new Set(allGrants.map((grant) => grant.playerId))), [allGrants]);
  const playerPhoneMap = useMemo(
    () => playerPool.reduce<Record<string, string>>((acc, playerId) => {
      let hash = 0;
      for (let index = 0; index < playerId.length; index += 1) {
        hash = (hash * 31 + playerId.charCodeAt(index)) % 100000000;
      }
      acc[playerId] = `09${String(hash).padStart(8, '0')}`;
      return acc;
    }, {}),
    [playerPool]
  );

  useEffect(() => {
    document.title = 'Freespin 派發管理 - Filbet Admin';
  }, []);

  const gameRestrictionOptions = useMemo(
    () => (Object.entries(freeSpinRestrictionCatalog) as RestrictionCatalogEntry[]).map(([gameType, restrictionProviders]) => ({
      value: gameType,
      label: gameType,
      children: restrictionProviders.map((restrictionProvider) => ({
        value: restrictionProvider.code,
        label: restrictionProvider.name,
        children: restrictionProvider.games.map((game) => ({
          value: game.code,
          label: game.name,
        })),
      })),
    })),
    []
  );

  const filteredData = useMemo(() => {
    const filtered = allGrants.filter((item) => {
      if (filters.playerId && !item.playerId.toLowerCase().includes(filters.playerId.toLowerCase())) return false;
      if (filters.vendorEventId && !(item.vendorEventId || '').toLowerCase().includes(filters.vendorEventId.toLowerCase())) return false;
      if (filters.sourceType && item.sourceType !== filters.sourceType) return false;
      if (filters.activityName && item.sourceActivityName !== filters.activityName) return false;
      if (filters.grantType && item.grantType !== filters.grantType) return false;
      if (filters.providerCode && item.providerCode !== filters.providerCode) return false;
      if (filters.claimStatus && item.claimStatus !== filters.claimStatus) return false;
      if (filters.expireDateRange && filters.expireDateRange.length === 2) {
        const [start, end] = filters.expireDateRange;
        const expireAt = dayjs(item.expireAt);
        if (expireAt.isBefore(start) || expireAt.isAfter(end)) return false;
      }
      if (filters.dateRange && filters.dateRange.length === 2) {
        const [start, end] = filters.dateRange;
        const createdAt = dayjs(item.createdAt);
        if (createdAt.isBefore(start) || createdAt.isAfter(end)) return false;
      }
      return true;
    });
    const sorted = [...filtered].sort((a, b) => {
      const aAnomaly = a.dispatchSummary.failedAttemptCount > 0 ? 1 : 0;
      const bAnomaly = b.dispatchSummary.failedAttemptCount > 0 ? 1 : 0;
      if (aAnomaly !== bAnomaly) return bAnomaly - aAnomaly;
      if (a.dispatchSummary.failedAttemptCount !== b.dispatchSummary.failedAttemptCount) {
        return b.dispatchSummary.failedAttemptCount - a.dispatchSummary.failedAttemptCount;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
    return sorted;
  }, [filters, allGrants]);

  const stats = useMemo(() => {
    const totalWin = filteredData.reduce((sum, item) => sum + item.totalWin, 0);
    const uniquePlayers = new Set(filteredData.map((item) => item.playerId)).size;

    return {
      total: filteredData.length,
      totalWin: +totalWin.toFixed(2),
      uniquePlayers,
      completionRate: filteredData.length > 0
        ? +((filteredData.filter((item) => item.claimStatus === 'completed').length / filteredData.length) * 100).toFixed(1)
        : 0,
    };
  }, [filteredData]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success(`已複製：${text}`);
  };

  const handleSync = (record: FreeSpinGrantItem) => {
    const hide = message.loading(`同步中：${record.id}`, 0);
    setTimeout(() => {
      hide();
      message.success('已從廠商同步狀態');
    }, 1200);
  };

  const handleVoid = (record: FreeSpinGrantItem) => {
    let voidReason = '派發失敗，作廢處理';

    Modal.confirm({
      title: '確認作廢此派發？玩家將無法使用',
      icon: <StopOutlined />,
      content: (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Text>派發 ID：{record.id}</Text>
          <Text>玩家：{record.playerId}</Text>
          <Input.TextArea
            rows={3}
            defaultValue={voidReason}
            placeholder="請輸入作廢原因"
            onChange={(event) => {
              voidReason = event.target.value || '派發失敗，作廢處理';
            }}
          />
        </Space>
      ),
      okText: '確認作廢',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const nextGrant: FreeSpinGrantItem = {
          ...record,
          claimStatus: 'voided',
          voidedAt: now,
          voidedBy: 'darren@filbetph.com',
          voidReason,
        };

        setAllGrants((prev) => prev.map((grant) => (grant.id === record.id ? nextGrant : grant)));
        setDrawerGrant((prev) => (prev?.id === record.id ? nextGrant : prev));
        message.success('已作廢');
      },
    });
  };

  const parseGameRestriction = (paths: GameRestrictionPath[] | undefined): FreeSpinGrantItem['gameRestriction'] => {
    if (!paths || paths.length === 0) return null;

    const gameTypes = new Set<GameType>();
    const providerCodes = new Set<string>();
    const gameMap = new Map<string, { code: string; name: string }>();

    paths.forEach((path) => {
      const [gameType, providerCode, gameCode] = path;
      const restrictionProviders = freeSpinRestrictionCatalog[gameType];
      if (!restrictionProviders) return;

      gameTypes.add(gameType);

      if (!providerCode) return;
      providerCodes.add(providerCode);

      if (!gameCode) return;
      const restrictionProvider = restrictionProviders.find((provider) => provider.code === providerCode);
      const game = restrictionProvider?.games.find((item) => item.code === gameCode);
      if (game) {
        gameMap.set(game.code, game);
      }
    });

    if (gameTypes.size === 0 && providerCodes.size === 0 && gameMap.size === 0) {
      return null;
    }

    return {
      gameTypes: Array.from(gameTypes),
      providers: Array.from(providerCodes),
      games: Array.from(gameMap.values()),
    };
  };

  const getGrantedGames = (grantType: GrantTypeValue, providerCodes?: string[], gameCodes?: string[]) => {
    if (grantType !== 'game' || !gameCodes || gameCodes.length === 0) return null;

    return gameCodes.map((gameCode) => {
      for (const providerCode of (providerCodes || [])) {
        const found = providerGames[providerCode]?.find((game) => game.code === gameCode);
        if (found) return found;
      }
      return { code: gameCode, name: gameCode };
    });
  };

  const buildGrantPayload = (
    values: any,
    playerId: string,
    nextIdSeed: number,
    createdBy: string,
    remark: string | null
  ): FreeSpinGrantItem => {
    const createdAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const expireAt = dayjs().add(values.expireDays || 7, 'day').format('YYYY-MM-DD HH:mm:ss');
    const gameRestriction = parseGameRestriction(values.gameRestriction as GameRestrictionPath[] | undefined);
    const providerCode = values.grantType === 'open' ? null : (values.providerCodes?.[0] || null);

    return {
      id: `FS${String(nextIdSeed).padStart(4, '0')}`,
      name: values.name,
      coverImage: values.coverImage || (createdBy === 'admin (batch)' ? defaultFsCoverImage : null),
      playerId,
      sourceType: 'manual',
      sourceActivityName: values.activityName || null,
      grantType: values.grantType,
      providerCode,
      providerName: values.grantType === 'open' ? null : providers.find((provider) => provider.code === providerCode)?.name || null,
      grantedGames: getGrantedGames(values.grantType, values.providerCodes, values.gameCodes),
      selectedGame: null,
      totalSpins: values.totalSpins,
      usedSpins: 0,
      betAmount: values.betAmount ?? 0,
      totalWin: 0,
      wagerMultiple: values.wagerMultiple && values.wagerMultiple > 0 ? values.wagerMultiple : null,
      gameRestriction,
      claimStatus: 'claimed',
      dispatchSummary: {
        lastAttemptAt: null,
        lastAttemptResult: null,
        lastFailureReason: null,
        failedAttemptCount: 0,
        successAttemptCount: 0,
        attempts: [],
      },
      vendorEventId: null,
      currency: 'PHP',
      minWithdraw: values.minWithdraw ?? null,
      maxWithdraw: values.maxWithdraw ?? null,
      expireAt,
      usedAt: null,
      settledAt: null,
      voidedAt: null,
      voidedBy: null,
      voidReason: null,
      createdBy,
      createdAt,
      remark,
    };
  };

  const resetCreateModal = () => {
    setCreateOpen(false);
    createForm.resetFields();
    setSelectedGrantType(null);
    setSelectedProviders([]);
    setCreateCoverFileList([]);
  };

  const resetBatchModal = () => {
    setBatchOpen(false);
    setBatchStep(0);
    setBatchIdentifierType('uid');
    setBatchSourceFileName(null);
    setBatchSourceRawCount(0);
    setBatchSourceEntries([]);
    setBatchSelectedGrantType(null);
    setBatchSelectedProviders([]);
    setBatchCoverFileList([]);
    setBatchSubmitting(false);
    setBatchResult(null);
    batchForm.resetFields();
  };

  const handleCoverUploadChange = async ({ file, fileList }: UploadChangeParam<UploadFile>) => {
    if (file.status === 'removed' || fileList.length === 0) {
      setCreateCoverFileList([]);
      createForm.setFieldValue('coverImage', null);
      return;
    }

    const rawFile = file.originFileObj;
    if (!rawFile) return;

    try {
      const dataUrl = await fileToDataUrl(rawFile);
      setCreateCoverFileList([{
        uid: file.uid,
        name: file.name,
        status: 'done',
        url: dataUrl,
        thumbUrl: dataUrl,
        originFileObj: rawFile,
      }]);
      createForm.setFieldValue('coverImage', dataUrl);
    } catch {
      setCreateCoverFileList([]);
      createForm.setFieldValue('coverImage', null);
      message.error('封面圖讀取失敗，請重新上傳');
    }
  };

  const handleBatchCoverUploadChange = async ({ file, fileList }: UploadChangeParam<UploadFile>) => {
    if (file.status === 'removed' || fileList.length === 0) {
      setBatchCoverFileList([]);
      batchForm.setFieldValue('coverImage', null);
      return;
    }

    const rawFile = file.originFileObj;
    if (!rawFile) return;

    try {
      const dataUrl = await fileToDataUrl(rawFile);
      setBatchCoverFileList([{
        uid: file.uid,
        name: file.name,
        status: 'done',
        url: dataUrl,
        thumbUrl: dataUrl,
        originFileObj: rawFile,
      }]);
      batchForm.setFieldValue('coverImage', dataUrl);
    } catch {
      setBatchCoverFileList([]);
      batchForm.setFieldValue('coverImage', null);
      message.error('封面圖讀取失敗，請重新上傳');
    }
  };

  const parseBatchIdentifiers = (content: string, identifierType: BatchIdentifierType): BatchParsedSource => {
    const normalizedContent = content.replace(/^\uFEFF/, '');
    const lines = normalizedContent.split('\n').map((line) => line.trim()).filter(Boolean);

    if (lines.length === 0) {
      return { rawCount: 0, entries: [] };
    }

    const [firstLine, ...restLines] = lines;
    const firstCell = firstLine.split(',')[0]?.trim().toLowerCase();
    const dataLines = firstCell && batchIdentifierHeaderSet.has(firstCell) ? restLines : lines;
    const dedupedEntries = new Map<string, BatchSourceEntry>();
    let rawCount = 0;

    dataLines.forEach((line) => {
      const cells = line.split(',');
      const identifier = normalizeBatchIdentifier(cells[0] || '', identifierType);
      if (!identifier) return;

      const rawSpin = (cells[1] || '').trim();
      let spinOverride: number | null = null;
      if (rawSpin) {
        const parsed = Number(rawSpin);
        if (Number.isInteger(parsed) && parsed > 0 && parsed <= 999999) {
          spinOverride = parsed;
        }
      }

      rawCount += 1;
      if (!dedupedEntries.has(identifier)) {
        dedupedEntries.set(identifier, { identifier, spinOverride });
      }
    });

    return {
      rawCount,
      entries: Array.from(dedupedEntries.values()),
    };
  };

  const resolveBatchPlayerId = (identifier: string, identifierType: BatchIdentifierType) => {
    if (identifierType === 'phone') {
      const phoneToPlayerIdMap = Object.entries(playerPhoneMap).reduce<Record<string, string>>((acc, [playerId, phone]) => {
        acc[normalizeBatchIdentifier(phone, 'phone')] = playerId;
        return acc;
      }, {});
      return phoneToPlayerIdMap[identifier] || null;
    }

    return playerPool.includes(identifier) ? identifier : null;
  };

  const handleBatchFileUpload = async (file: RcFile) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['csv', 'txt'].includes(extension)) {
      message.error('名單檔案僅支援 .csv / .txt');
      return Upload.LIST_IGNORE;
    }

    try {
      const content = await readTextFile(file);
      const { rawCount, entries } = parseBatchIdentifiers(content, batchIdentifierType);

      if (rawCount === 0) {
        message.error('名單內容為空');
        return Upload.LIST_IGNORE;
      }

      if (rawCount > 200000) {
        message.error('單次上傳不可超過 200,000 行，請拆批');
        return Upload.LIST_IGNORE;
      }

      setBatchSourceFileName(file.name);
      setBatchSourceRawCount(rawCount);
      setBatchSourceEntries(entries);
      message.success(`名單解析完成：${entries.length} 筆`);
    } catch {
      message.error('名單解析失敗，請確認為 UTF-8 編碼');
    }

    return Upload.LIST_IGNORE;
  };

  const downloadBatchTemplate = () => {
    downloadTextFile(
      'freespin-batch-template.csv',
      [
        'identifier,spin_count',
        'example_uid_001,10',
        'example_uid_002,',
        'example_uid_003,25',
      ].join('\n'),
    );
  };

  const createFormSubmit = (values: any) => {
    const newGrant = buildGrantPayload(values, values.playerId, getNextGrantIdSeed(allGrants) + 1, 'admin', values.remark || null);

    setAllGrants((prev) => [newGrant, ...prev]);
    resetCreateModal();
    message.success('派發成功');
  };

  const handleBatchNextStep = async () => {
    if (batchStep === 0) {
      await batchForm.validateFields();
      setBatchStep(1);
    }
  };

  const handleBatchSubmit = async () => {
    if (batchSourceEntries.length === 0) {
      message.error('請先上傳名單');
      return;
    }

    const values = await batchForm.validateFields();
    setBatchSubmitting(true);

    try {
      const nextSeed = getNextGrantIdSeed(allGrants);
      const remarkPrefix = `[批量派發-${values.name}]`;
      const remark = values.remark ? `${remarkPrefix} ${values.remark}` : remarkPrefix;
      const successList: BatchResultRow[] = [];
      const failedList: BatchResultRow[] = [];
      const newGrants: FreeSpinGrantItem[] = [];

      batchSourceEntries.forEach((entry, index) => {
        const { identifier, spinOverride } = entry;
        const playerId = resolveBatchPlayerId(identifier, batchIdentifierType);

        if (!playerId) {
          failedList.push({
            key: `failed-${identifier}-${index}`,
            identifierRaw: identifier,
            userId: null,
            status: 'failed',
            failureReason: '查無會員',
          });
          return;
        }

        const rowValues = spinOverride !== null ? { ...values, totalSpins: spinOverride } : values;
        newGrants.push(
          buildGrantPayload(
            rowValues,
            playerId,
            nextSeed + newGrants.length + 1,
            'admin (batch)',
            remark
          )
        );
        successList.push({
          key: `success-${identifier}-${index}`,
          identifierRaw: identifier,
          userId: playerId,
          status: 'success',
          failureReason: null,
        });
      });

      if (newGrants.length > 0) {
        setAllGrants((prev) => [...newGrants, ...prev]);
      }

      const nextResult: BatchResultData = {
        totalCount: batchSourceEntries.length,
        successCount: successList.length,
        failedCount: failedList.length,
        successList,
        failedList,
      };

      setBatchResult(nextResult);
      setBatchStep(2);
      message.success(`派發完成：成功 ${successList.length} / 失敗 ${failedList.length}`);
    } finally {
      setBatchSubmitting(false);
    }
  };

  const renderGrantConfigFields = ({
    formInstance,
    currentGrantType,
    currentProviders,
    setGrantType,
    setProviders,
    coverFileList,
    onCoverUploadChange,
    onCoverRemove,
    isBatch,
  }: {
    formInstance: FormInstance;
    currentGrantType: GrantTypeValue | null;
    currentProviders: string[];
    setGrantType: (value: GrantTypeValue) => void;
    setProviders: (value: string[]) => void;
    coverFileList: UploadFile[];
    onCoverUploadChange: (info: UploadChangeParam<UploadFile>) => Promise<void>;
    onCoverRemove: () => void;
    isBatch: boolean;
  }) => (
    <Row gutter={[24, 12]}>
      <Form.Item name="coverImage" hidden>
        <Input />
      </Form.Item>

      <Col span={12}>
        <Form.Item name="name" label="名稱" rules={[{ required: true, message: '請輸入名稱' }]}>
          <Input data-e2e-id={isBatch ? 'freespin-grants-batch-form-name-input' : 'freespin-grants-form-name-input'} placeholder="此名稱將顯示在用戶端" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="activityName" label="關聯活動">
          <Select data-e2e-id={isBatch ? 'freespin-grants-batch-form-activity-name-select' : 'freespin-grants-form-activity-name-select'} placeholder="選擇活動" allowClear showSearch>
            {activityOptions.map((activity) => <Select.Option key={activity} value={activity}>{activity}</Select.Option>)}
          </Select>
        </Form.Item>
      </Col>

      <Col span={12}>
        <Form.Item name="grantType" label="派發層級" rules={[{ required: true, message: '請選擇派發層級' }]}>
          <Radio.Group
            data-e2e-id={isBatch ? 'freespin-grants-batch-form-grant-type-radio' : 'freespin-grants-form-grant-type-select'}
            onChange={(event) => {
              const nextValue = event.target.value as GrantTypeValue;
              setGrantType(nextValue);
              setProviders([]);
              formInstance.setFieldsValue({ providerCodes: undefined, gameCodes: undefined });
            }}
          >
            <Radio.Button value="open">OPEN</Radio.Button>
            <Radio.Button value="provider">PROVIDER</Radio.Button>
            <Radio.Button value="game">GAME</Radio.Button>
          </Radio.Group>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="providerCodes" label="廠商" rules={currentGrantType === 'provider' || currentGrantType === 'game' ? [{ required: true, message: '請選擇廠商' }] : []}>
          <Select
            data-e2e-id={isBatch ? 'freespin-grants-batch-form-provider-codes-select' : 'freespin-grants-form-provider-codes-select'}
            mode={currentGrantType === 'provider' ? 'multiple' : 'multiple'}
            placeholder={currentGrantType === 'open' || !currentGrantType ? 'OPEN 不需選擇廠商' : '選擇廠商'}
            disabled={currentGrantType !== 'provider' && currentGrantType !== 'game'}
            onChange={(vals: string[]) => {
              setProviders(vals);
              formInstance.setFieldsValue({ gameCodes: undefined });
            }}
          >
            {providers.map((provider) => <Select.Option key={provider.code} value={provider.code}>{provider.name}</Select.Option>)}
          </Select>
        </Form.Item>
      </Col>

      {currentGrantType === 'game' && (
        <Col span={24}>
          <Form.Item name="gameCodes" label="遊戲" rules={[{ required: true, message: '請選擇遊戲' }]} tooltip="玩家將在這些遊戲中選一款使用">
            <Select
              data-e2e-id={isBatch ? 'freespin-grants-batch-form-game-codes-select' : 'freespin-grants-form-game-codes-select'}
              mode="multiple"
              placeholder="選擇遊戲（可複選，玩家選一款）"
              disabled={currentProviders.length === 0}
            >
              {currentProviders.flatMap((providerCode) =>
                (providerGames[providerCode] || []).map((game) => (
                  <Select.Option key={game.code} value={game.code}>{providers.find((provider) => provider.code === providerCode)?.name} - {game.name}</Select.Option>
                ))
              )}
            </Select>
          </Form.Item>
        </Col>
      )}

      <Col span={12}>
        <Form.Item
          name="totalSpins"
          label={isBatch ? '預設次數' : '次數'}
          rules={[{ required: true, message: `請輸入${isBatch ? '預設' : ''}次數` }]}
          extra={isBatch ? '未在 CSV 第 2 欄指定的會員會用此值' : undefined}
        >
          <InputNumber data-e2e-id={isBatch ? 'freespin-grants-batch-form-total-spins-input' : 'freespin-grants-form-total-spins-input'} min={1} max={999999} style={{ width: '100%' }} placeholder={isBatch ? '預設次數' : '次數'} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="betAmount" label="單次投注額">
          <InputNumber data-e2e-id={isBatch ? 'freespin-grants-batch-form-bet-amount-input' : 'freespin-grants-form-bet-amount-input'} min={0} step={0.1} style={{ width: '100%' }} placeholder="例：0.20" />
        </Form.Item>
      </Col>

      <Col span={12}>
        <Form.Item name="wagerMultiple" label="流水倍數" tooltip="若有設定，免費旋轉派彩入帳時依此倍數寫入流水限制表">
          <InputNumber min={0} max={100} step={1} style={{ width: '100%' }} placeholder="無流水要求請留空或填 0" addonAfter="倍" data-e2e-id={isBatch ? 'freespin-grants-batch-wager-multiple-input' : 'freespin-grants-create-wager-multiple-input'} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="expireDays" label="有效期（天）">
          <InputNumber data-e2e-id={isBatch ? 'freespin-grants-batch-form-expire-days-input' : 'freespin-grants-form-expire-days-input'} min={1} max={365} style={{ width: '100%' }} placeholder="預設 7 天" />
        </Form.Item>
      </Col>

      <Col span={24}>
        <Form.Item name="gameRestriction" label="場館限制" tooltip="若有設定，流水寫入時一同限制可消耗範圍">
          <Cascader
            multiple
            options={gameRestrictionOptions}
            placeholder="選擇遊戲類型 → 廠商 → 遊戲"
            showCheckedStrategy={Cascader.SHOW_PARENT}
            showSearch={{
              filter: (inputValue, path) =>
                path.some((option) => String(option.label).toLowerCase().includes(inputValue.toLowerCase())),
            }}
            data-e2e-id={isBatch ? 'freespin-grants-batch-game-restriction-cascader' : 'freespin-grants-create-game-restriction-cascader'}
          />
        </Form.Item>
      </Col>

      <Col span={24}>
        <Row gutter={[24, 12]}>
          <Col span={12}>
            <Form.Item name="minWithdraw" label="最低提款">
              <InputNumber data-e2e-id={isBatch ? 'freespin-grants-batch-form-min-withdraw-input' : 'freespin-grants-form-min-withdraw-input'} min={0} style={{ width: '100%' }} placeholder="不限" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="maxWithdraw" label="最高提款">
              <InputNumber data-e2e-id={isBatch ? 'freespin-grants-batch-form-max-withdraw-input' : 'freespin-grants-form-max-withdraw-input'} min={0} style={{ width: '100%' }} placeholder="不限" />
            </Form.Item>
          </Col>
        </Row>
      </Col>

      <Col span={24}>
        <Form.Item label="封面圖">
          <Upload
            accept=".jpg,.jpeg,.png,.webp"
            maxCount={1}
            listType="picture-card"
            beforeUpload={validateCoverImageFile}
            fileList={coverFileList}
            onChange={onCoverUploadChange}
            onRemove={onCoverRemove}
          >
            {coverFileList.length >= 1 ? null : (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上傳</div>
              </div>
            )}
          </Upload>
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
            建議尺寸 4:5（例：400 × 500），檔案 ≤ 500KB；未上傳將使用預設 SVG
          </Text>
        </Form.Item>
      </Col>

      <Col span={24}>
        <Form.Item name="remark" label="備註">
          <Input.TextArea data-e2e-id={isBatch ? 'freespin-grants-batch-form-remark-input' : 'freespin-grants-form-remark-input'} rows={2} placeholder="派發原因" />
        </Form.Item>
      </Col>
    </Row>
  );

  const columns: ColumnsType<FreeSpinGrantItem> = [
    { title: '派發 ID', dataIndex: 'id', width: 110, fixed: 'left', render: (val, record) => <a onClick={() => setDrawerGrant(record)}>{val}</a> },
    { title: '名稱', dataIndex: 'name', width: 130 },
    { title: '玩家', dataIndex: 'playerId', width: 120, fixed: 'left', render: (val) => <a style={{ color: '#1668dc' }}>{val}</a> },
    {
      title: (
        <Space size={4}>
          <span>廠商事件 ID</span>
          <Tooltip
            title={(
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                <div style={{ marginBottom: 4 }}>各廠商對應名稱：</div>
                <div>• <strong>JILI</strong>：ReferenceId（平台自生成）<sup>*</sup></div>
                <div>• <strong>PP</strong>：bonusCode（平台自生成）<sup>*</sup></div>
                <div>• <strong>FC</strong>：EventID（廠商建立後回傳）</div>
                <div>• <strong>PG</strong>：freeGameId（廠商建立後回傳）</div>
                <div>• <strong>JDB</strong>：eventId（可自訂或廠商回傳）</div>
                <div style={{ marginTop: 6, opacity: 0.85 }}><sup>*</sup> 標記為平台側建立派發時自行產生並傳給廠商，作為日後對帳的關聯鍵</div>
              </div>
            )}
          >
            <InfoCircleOutlined style={{ color: '#8c8c8c', cursor: 'help' }} />
          </Tooltip>
        </Space>
      ), dataIndex: 'vendorEventId', width: 170,
      render: (val: string | null, record) => {
        if (!val) return <Text type="secondary">—</Text>;
        return (
          <Space size={4}>
            <Text style={{ fontSize: 12 }}>{val}</Text>
            <Button
              data-e2e-id={`freespin-grants-table-copy-vendor-event-btn-${record.id}`}
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                copyToClipboard(val);
              }}
            />
          </Space>
        );
      },
    },
    {
      title: '來源', dataIndex: 'sourceType', width: 90,
      render: (val, record) => {
        if (val === 'activity') return <Tag color="blue">活動</Tag>;
        if (record.createdBy === 'admin (batch)') return <Tag color="gold">手動(批量)</Tag>;
        return <Tag color="green">手動</Tag>;
      },
    },
    {
      title: '關聯活動', dataIndex: 'sourceActivityName', width: 130,
      render: (val) => val || '—',
    },
    {
      title: '贈送類型', dataIndex: 'grantType', width: 100,
      render: (val) => {
        const map: Record<string, { color: string; label: string }> = {
          open: { color: 'purple', label: '不限' },
          provider: { color: 'orange', label: '廠商' },
          game: { color: 'cyan', label: '遊戲' },
        };
        const cfg = map[val] || { color: 'default', label: val };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: '廠商', dataIndex: 'providerName', width: 120,
      render: (val) => val || '—',
    },
    {
      title: '贈送遊戲', dataIndex: 'grantedGames', width: 150,
      render: (games: FreeSpinGrantItem['grantedGames']) => {
        if (!games || games.length === 0) return <Text type="secondary">—</Text>;
        if (games.length === 1) return games[0].name;
        return (
          <Tooltip title={games.map((game) => game.name).join(', ')}>
            <span>{games[0].name} <Tag style={{ marginLeft: 4 }}>+{games.length - 1}</Tag></span>
          </Tooltip>
        );
      },
    },
    {
      title: '選定遊戲', dataIndex: 'selectedGame', width: 140,
      render: (game: FreeSpinGrantItem['selectedGame']) => {
        if (!game) return <Text type="secondary">—</Text>;
        return <Tag color="cyan">{game.name}</Tag>;
      },
    },
    {
      title: '設定投注額', dataIndex: 'betAmount', width: 110,
      render: (val) => (
        <Tooltip title="平台端設置的單注金額，廠商實際扣款可能略有差異">
          {formatCurrency(val)}
        </Tooltip>
      ),
    },
    {
      title: '異常', width: 70,
      render: (_, record) => renderDispatchAnomaly(record, () => setDrawerGrant(record)),
    },
    {
      title: '進度', width: 160,
      sorter: (a, b) => (a.usedSpins / Math.max(a.totalSpins, 1)) - (b.usedSpins / Math.max(b.totalSpins, 1)),
      render: (_, record) => {
        const pct = record.totalSpins > 0 ? Math.round(record.usedSpins / record.totalSpins * 100) : 0;
        return (
          <div>
            <Progress percent={pct} size="small" style={{ marginBottom: 2 }} />
            <Text style={{ fontSize: 12 }} type="secondary">{record.usedSpins} / {record.totalSpins}</Text>
          </div>
        );
      },
    },
    {
      title: '派彩', dataIndex: 'totalWin', width: 110,
      sorter: (a, b) => a.totalWin - b.totalWin,
      render: (val) => formatCurrency(val),
    },
    {
      title: '領取狀態', dataIndex: 'claimStatus', width: 100,
      render: renderClaimStatus,
    },
    {
      title: '到期時間', dataIndex: 'expireAt', width: 170,
    },
    { title: '建立時間', dataIndex: 'createdAt', width: 170, sorter: (a, b) => a.createdAt.localeCompare(b.createdAt) },
    {
      title: '操作', key: 'action', width: 180, fixed: 'right',
      render: (_, record) => (
        <Space size={2} wrap={false}>
          <Button
            type="link"
            size="small"
            style={{ paddingInline: 4 }}
            icon={<SyncOutlined />}
            onClick={() => handleSync(record)}
            data-e2e-id={`freespin-grants-table-sync-btn-${record.id}`}
          >
            同步
          </Button>
          <Button data-e2e-id={`freespin-grants-table-detail-btn-${record.id}`} type="link" size="small" style={{ paddingInline: 4 }} icon={<EyeOutlined />} onClick={() => setDrawerGrant(record)}>詳情</Button>
          {canVoidGrant(record) && (
            <Button
              danger
              type="link"
              size="small"
              style={{ paddingInline: 4 }}
              icon={<StopOutlined />}
              data-e2e-id={`freespin-grants-table-void-btn-${record.id}`}
              onClick={() => handleVoid(record)}
            >
              作廢
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const batchResultRows = useMemo(() => {
    if (!batchResult) return [];
    return batchResult.failedList;
  }, [batchResult]);

  const batchResultColumns: ColumnsType<BatchResultRow> = [
    { title: 'identifier_raw', dataIndex: 'identifierRaw', width: 200 },
    {
      title: 'UID',
      dataIndex: 'userId',
      width: 180,
      render: (value: string | null, record) => {
        const uid = resolveBatchPlayerId(record.identifierRaw, batchIdentifierType) ?? value;
        if (!uid) return <Text type="secondary">—</Text>;
        return (
          <Space size={4}>
            <Text style={{ fontSize: 12 }}>{uid}</Text>
            <Button
              data-e2e-id={`freespin-grants-batch-result-copy-uid-btn-${record.key}`}
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                copyToClipboard(uid);
              }}
            />
          </Space>
        );
      },
    },
    {
      title: '狀態',
      dataIndex: 'status',
      width: 120,
      render: (value: BatchResultRow['status']) => (
        <Tag color={value === 'success' ? 'success' : 'error'}>
          {value === 'success' ? '成功' : '失敗'}
        </Tag>
      ),
    },
    {
      title: '失敗原因',
      dataIndex: 'failureReason',
      render: (value: string | null) => value || <Text type="secondary">—</Text>,
    },
  ];

  const downloadBatchResultCsv = () => {
    if (!batchResult) return;
    const rows = batchResult.failedList;
    const csv = [
      'identifier_raw,uid,status,failure_reason',
      ...rows.map((row) => {
        const uid = resolveBatchPlayerId(row.identifierRaw, batchIdentifierType) ?? row.userId ?? '';
        return [row.identifierRaw, uid, row.status, row.failureReason || ''].join(',');
      }),
    ].join('\n');
    downloadTextFile('freespin-batch-failed.csv', csv);
  };

  const onSearch = () => {
    const values = form.getFieldsValue();
    setFilters(values);
  };

  const onReset = () => {
    form.resetFields();
    setFilters({});
  };

  const drawerProgress = drawerGrant
    ? Math.round((drawerGrant.usedSpins / Math.max(drawerGrant.totalSpins, 1)) * 100)
    : 0;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Freespin 派發管理</Title>
        <Text type="secondary">查詢所有 Freespin 派發管理資料、領取進度與派發異常</Text>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" style={{ gap: 12, flexWrap: 'wrap', rowGap: 12 }}>
          <Form.Item name="playerId" label="玩家帳號">
            <Input data-e2e-id="freespin-grants-filter-player-id-input" placeholder="輸入帳號" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="vendorEventId" label="廠商事件 ID">
            <Input data-e2e-id="freespin-grants-filter-vendor-event-id-input" placeholder="VE…" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="sourceType" label="來源">
            <Select data-e2e-id="freespin-grants-filter-source-type-select" placeholder="全部" allowClear style={{ width: 100 }}>
              <Select.Option value="activity">活動</Select.Option>
              <Select.Option value="manual">手動</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="activityName" label="關聯活動">
            <Select
              data-e2e-id="freespin-grants-filter-activity-name-select"
              placeholder="輸入或選擇活動"
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: 180 }}
            >
              {activityOptions.map((activity) => <Select.Option key={activity} value={activity}>{activity}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="grantType" label="贈送類型">
            <Select data-e2e-id="freespin-grants-filter-grant-type-select" placeholder="全部" allowClear style={{ width: 100 }}>
              <Select.Option value="open">不限</Select.Option>
              <Select.Option value="provider">廠商</Select.Option>
              <Select.Option value="game">遊戲</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="providerCode" label="廠商">
            <Select
              data-e2e-id="freespin-grants-filter-provider-code-select"
              placeholder="輸入或選擇廠商"
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: 160 }}
            >
              {providers.map((provider) => <Select.Option key={provider.code} value={provider.code}>{provider.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="claimStatus" label="領取狀態">
            <Select data-e2e-id="freespin-grants-filter-claim-status-select" placeholder="全部" allowClear style={{ width: 110 }}>
              <Select.Option value="claimed">已領取</Select.Option>
              <Select.Option value="in_use">使用中</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="expired">已過期</Select.Option>
              <Select.Option value="voided">已作廢</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="建立日期">
            <RangePicker
              data-e2e-id="freespin-grants-filter-date-range"
              showTime={{ format: 'HH:mm:ss' }}
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: 380 }}
            />
          </Form.Item>
          <Form.Item name="expireDateRange" label="到期日期">
            <RangePicker
              data-e2e-id="freespin-grants-filter-expire-date-range"
              showTime={{ format: 'HH:mm:ss' }}
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: 380 }}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button data-e2e-id="freespin-grants-filter-query-btn" type="primary" icon={<SearchOutlined />} onClick={onSearch}>查詢</Button>
              <Button data-e2e-id="freespin-grants-filter-reset-btn" icon={<ReloadOutlined />} onClick={onReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="派發總筆數" value={stats.total} /></Card></Col>
        <Col span={6}><Card><Statistic title="不重複玩家數" value={stats.uniquePlayers} /></Card></Col>
        <Col span={6}><Card><Statistic title="總派彩" value={stats.totalWin} prefix="₱" precision={2} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="完成率" value={stats.completionRate} suffix="%" valueStyle={{ color: '#1668dc' }} /></Card></Col>
      </Row>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, gap: 8 }}>
          <Space>
            <Button data-e2e-id="freespin-grants-toolbar-create-btn" type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>手動派發</Button>
            <Button data-e2e-id="freespin-grants-batch-dispatch-btn" icon={<UploadOutlined />} onClick={() => setBatchOpen(true)}>批量派發</Button>
            <Button data-e2e-id="freespin-grants-toolbar-export-btn" icon={<DownloadOutlined />}>導出 CSV</Button>
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          onRow={(record) => ({ 'data-e2e-id': `freespin-grants-table-row-${record.id}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          scroll={{ x: 2480 }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 筆` }}
          size="small"
        />
      </Card>

      <Drawer
        title={drawerGrant ? `派發詳情 ${drawerGrant.id}` : ''}
        width={960}
        open={!!drawerGrant}
        onClose={() => setDrawerGrant(null)}
        extra={drawerGrant && canVoidGrant(drawerGrant) ? (
          <Button data-e2e-id={`freespin-grants-drawer-resend-btn-${drawerGrant.id}`} danger type="primary" icon={<StopOutlined />} onClick={() => { handleVoid(drawerGrant); }}>作廢</Button>
        ) : null}
      >
        {drawerGrant && (
          <div data-e2e-id="freespin-grants-drawer">
            <Title level={5}>基本資訊</Title>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="派發 ID">{drawerGrant.id}</Descriptions.Item>
              <Descriptions.Item label="名稱">{drawerGrant.name}</Descriptions.Item>
              <Descriptions.Item label="玩家">{drawerGrant.playerId}</Descriptions.Item>
              <Descriptions.Item label="幣別">{drawerGrant.currency}</Descriptions.Item>
              <Descriptions.Item label="來源">{drawerGrant.sourceType === 'activity' ? '活動' : drawerGrant.createdBy === 'admin (batch)' ? '手動（批量）' : '手動'}</Descriptions.Item>
              <Descriptions.Item label="關聯活動">{drawerGrant.sourceActivityName || '—'}</Descriptions.Item>
              <Descriptions.Item label="廠商事件 ID" span={2}>
                {drawerGrant.vendorEventId ? (
                  <Space>
                    <Text copyable={{ text: drawerGrant.vendorEventId }}>{drawerGrant.vendorEventId}</Text>
                  </Space>
                ) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="建立人">{drawerGrant.createdBy}</Descriptions.Item>
              <Descriptions.Item label="建立時間">{drawerGrant.createdAt}</Descriptions.Item>
              <Descriptions.Item label="備註" span={2}>{drawerGrant.remark || '—'}</Descriptions.Item>
            </Descriptions>

            <Card size="small" title="封面圖" style={{ marginBottom: 24 }}>
              {drawerGrant.coverImage ? (
                <Image
                  src={drawerGrant.coverImage}
                  alt="freespin-cover"
                  width={80}
                  height={100}
                  style={{ borderRadius: 8, objectFit: 'cover', border: '1px solid #f0f0f0' }}
                  preview={{ src: drawerGrant.coverImage }}
                />
              ) : (
                <Text type="secondary">未設定封面</Text>
              )}
            </Card>

            <Title level={5}>設定</Title>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="贈送類型">
                {drawerGrant.grantType === 'open' ? '不限' : drawerGrant.grantType === 'provider' ? '廠商' : '遊戲'}
              </Descriptions.Item>
              <Descriptions.Item label="廠商">{drawerGrant.providerName || '—'}</Descriptions.Item>
              <Descriptions.Item label="贈送遊戲" span={2}>
                {drawerGrant.grantedGames && drawerGrant.grantedGames.length > 0
                  ? drawerGrant.grantedGames.map((game) => <Tag key={game.code}>{game.name}</Tag>)
                  : <Text type="secondary">—（贈送類型為 {drawerGrant.grantType === 'open' ? '不限' : '廠商'}，玩家自選）</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="選定遊戲" span={2}>
                {drawerGrant.selectedGame
                  ? <Tag color="cyan">{drawerGrant.selectedGame.name}</Tag>
                  : <Text type="secondary">尚未選定</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="總次數">{drawerGrant.totalSpins}</Descriptions.Item>
              <Descriptions.Item label="設定單轉投注">
                <Tooltip title="平台端設置金額，廠商實際扣款可能略有差異">
                  {formatCurrency(drawerGrant.betAmount)}
                </Tooltip>
              </Descriptions.Item>
              <Descriptions.Item label="流水倍數">
                {drawerGrant.wagerMultiple != null ? `${drawerGrant.wagerMultiple} 倍` : '無流水要求'}
              </Descriptions.Item>
              <Descriptions.Item label="場館限制">
                {renderGameRestrictionSummary(drawerGrant.gameRestriction)}
              </Descriptions.Item>
              <Descriptions.Item label="最低提領">{drawerGrant.minWithdraw != null ? formatCurrency(drawerGrant.minWithdraw) : '不限'}</Descriptions.Item>
              <Descriptions.Item label="最高提領">{drawerGrant.maxWithdraw != null ? formatCurrency(drawerGrant.maxWithdraw) : '不限'}</Descriptions.Item>
              <Descriptions.Item label="到期時間" span={2}>{drawerGrant.expireAt}</Descriptions.Item>
              {drawerGrant.claimStatus === 'voided' && (
                <>
                  <Descriptions.Item label="作廢時間">{drawerGrant.voidedAt || '—'}</Descriptions.Item>
                  <Descriptions.Item label="作廢人員">{drawerGrant.voidedBy || '—'}</Descriptions.Item>
                  <Descriptions.Item label="作廢原因" span={2}>{drawerGrant.voidReason || '—'}</Descriptions.Item>
                </>
              )}
            </Descriptions>

            <Title level={5}>進度</Title>
            <Card style={{ marginBottom: 24 }}>
              <Progress percent={drawerProgress} />
              <div style={{ marginTop: 4, marginBottom: 16, fontSize: 13 }}>
                已使用 <strong>{drawerGrant.usedSpins}</strong> / {drawerGrant.totalSpins} 次（剩餘 {drawerGrant.totalSpins - drawerGrant.usedSpins} 次）
              </div>
              <Row gutter={16}>
                <Col span={8}><Statistic title="累計派彩" value={drawerGrant.totalWin} prefix="₱" precision={2} valueStyle={{ color: '#52c41a' }} /></Col>
                <Col span={8}><Statistic title="剩餘次數" value={drawerGrant.totalSpins - drawerGrant.usedSpins} suffix={`/ ${drawerGrant.totalSpins}`} /></Col>
                <Col span={8}>
                  <div style={{ fontSize: 14, color: '#8c8c8c' }}>狀態</div>
                  <div style={{ marginTop: 8 }}>
                    {renderClaimStatus(drawerGrant.claimStatus)}
                  </div>
                </Col>
              </Row>
              {drawerGrant.claimStatus === 'voided' && (
                <div style={{ marginTop: 12, padding: 12, background: '#fafafa', borderRadius: 4, border: '1px solid #d9d9d9' }}>
                  <strong>作廢處理：</strong>{drawerGrant.voidReason || '派發失敗，作廢處理'}
                  <span style={{ marginLeft: 12 }}><strong>作廢人員：</strong>{drawerGrant.voidedBy || '—'}</span>
                </div>
              )}
            </Card>

            <Title level={5}>派發嘗試紀錄</Title>
            <Card style={{ marginBottom: 24 }}>
              <Table
                size="small"
                pagination={false}
                columns={[
                  { title: '時間', dataIndex: 'attemptedAt', width: 170 },
                  {
                    title: '結果',
                    dataIndex: 'result',
                    width: 80,
                    render: (value: 'success' | 'fail') => value === 'success' ? <Tag color="success">成功</Tag> : <Tag color="error">失敗</Tag>,
                  },
                  {
                    title: '廠商回應',
                    dataIndex: 'vendorMessage',
                    render: (value: string | null, row: DispatchAttempt) => row.vendorErrorCode ? `${row.vendorErrorCode}${value ? ` (${value})` : ''}` : '—',
                  },
                ]}
                dataSource={drawerGrant.dispatchSummary.attempts}
                rowKey={(row, index) => `${row.attemptedAt}-${index}`}
                locale={{ emptyText: '尚無派發嘗試' }}
              />
            </Card>
          </div>
        )}
      </Drawer>

      <Modal
        title="手動派發 Free Spin"
        open={createOpen}
        width={920}
        onCancel={() => {
          resetCreateModal();
        }}
        onOk={() => {
          createForm.validateFields().then(createFormSubmit);
        }}
        okText="確認派發"
        cancelText="取消"
        okButtonProps={{ 'data-e2e-id': 'freespin-grants-create-modal-submit-btn' }}
        cancelButtonProps={{ 'data-e2e-id': 'freespin-grants-create-modal-cancel-btn' }}
      >
        <div data-e2e-id="freespin-grants-create-modal">
          <Form
            form={createForm}
            layout="horizontal"
            labelCol={{ flex: '120px' }}
            labelAlign="right"
            style={{ marginTop: 16 }}
            initialValues={{ expireDays: 7 }}
          >
            <Row gutter={[24, 12]}>
              <Col span={12}>
                <Form.Item name="playerId" label="玩家帳號" rules={[{ required: true, message: '請輸入玩家帳號' }]}>
                  <Input data-e2e-id="freespin-grants-form-player-id-input" placeholder="輸入玩家帳號" />
                </Form.Item>
              </Col>
            </Row>
            {renderGrantConfigFields({
              formInstance: createForm,
              currentGrantType: selectedGrantType as GrantTypeValue | null,
              currentProviders: selectedProviders,
              setGrantType: (value) => setSelectedGrantType(value),
              setProviders: setSelectedProviders,
              coverFileList: createCoverFileList,
              onCoverUploadChange: handleCoverUploadChange,
              onCoverRemove: () => {
                setCreateCoverFileList([]);
                createForm.setFieldValue('coverImage', null);
              },
              isBatch: false,
            })}
          </Form>
        </div>
      </Modal>

      <Modal
        title="批量派發 Free Spin"
        open={batchOpen}
        width={960}
        destroyOnClose
        onCancel={resetBatchModal}
        footer={(
          <Space>
            {batchResult ? (
              <Button data-e2e-id="freespin-grants-batch-close-btn" type="primary" onClick={resetBatchModal}>關閉</Button>
            ) : (
              <>
                {batchStep === 0 && <Button data-e2e-id="freespin-grants-batch-cancel-btn" onClick={resetBatchModal}>取消</Button>}
                {batchStep === 1 && <Button data-e2e-id="freespin-grants-batch-prev-btn" onClick={() => setBatchStep(0)}>上一步</Button>}
                {batchStep === 1 ? (
                  <Button data-e2e-id="freespin-grants-batch-submit-btn" type="primary" loading={batchSubmitting} onClick={handleBatchSubmit}>
                    確認派發
                  </Button>
                ) : (
                  <Button data-e2e-id="freespin-grants-batch-next-btn-step-1" type="primary" onClick={handleBatchNextStep}>下一步</Button>
                )}
              </>
            )}
          </Space>
        )}
      >
        <div data-e2e-id="freespin-grants-batch-modal">
          {!batchResult && (
            <Steps
              current={batchStep}
              size="small"
              style={{ marginBottom: 24 }}
              items={[
                { title: '派發設定' },
                { title: '上傳名單' },
              ]}
            />
          )}

          {batchStep === 0 && !batchResult && (
            <Form
              form={batchForm}
              layout="horizontal"
              labelCol={{ flex: '120px' }}
              labelAlign="right"
              style={{ marginTop: 16 }}
              initialValues={{ expireDays: 7 }}
            >
              {renderGrantConfigFields({
                formInstance: batchForm,
                currentGrantType: batchSelectedGrantType,
                currentProviders: batchSelectedProviders,
                setGrantType: (value) => setBatchSelectedGrantType(value),
                setProviders: setBatchSelectedProviders,
                coverFileList: batchCoverFileList,
                onCoverUploadChange: handleBatchCoverUploadChange,
                onCoverRemove: () => {
                  setBatchCoverFileList([]);
                  batchForm.setFieldValue('coverImage', null);
                },
                isBatch: true,
              })}
            </Form>
          )}

          {batchStep === 1 && !batchResult && (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Card size="small">
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <div>
                    <Text strong>識別類型</Text>
                    <div style={{ marginTop: 8 }}>
                      <Radio.Group
                        value={batchIdentifierType}
                        onChange={(event) => {
                          const nextType = event.target.value as BatchIdentifierType;
                          setBatchIdentifierType(nextType);
                          setBatchSourceFileName(null);
                          setBatchSourceRawCount(0);
                          setBatchSourceEntries([]);
                        }}
                        data-e2e-id="freespin-grants-batch-step2-identifier-type-radio"
                      >
                        <Radio.Button value="uid">UID</Radio.Button>
                        <Radio.Button value="phone">手機</Radio.Button>
                        <Radio.Button value="account">帳號</Radio.Button>
                      </Radio.Group>
                    </div>
                  </div>

                  <Space>
                    <Button data-e2e-id="freespin-grants-batch-step2-template-download-btn" icon={<DownloadOutlined />} onClick={downloadBatchTemplate}>下載範本</Button>
                  </Space>

                  <Upload.Dragger
                    accept=".csv,.txt"
                    showUploadList={false}
                    beforeUpload={handleBatchFileUpload}
                    data-e2e-id="freespin-grants-batch-step2-csv-upload"
                  >
                    <p className="ant-upload-drag-icon">
                      <TeamOutlined />
                    </p>
                    <p className="ant-upload-text">拖曳或點擊上傳 CSV / TXT</p>
                    <p className="ant-upload-hint">支援 1 欄或 2 欄（第 2 欄逐筆指定次數，留空以「預設次數」派發）；自動忽略空行、跳過 header、去重；UTF-8；上限 200,000 行</p>
                  </Upload.Dragger>

                  <Descriptions size="small" bordered column={1}>
                    <Descriptions.Item label="檔名">{batchSourceFileName || '—'}</Descriptions.Item>
                    <Descriptions.Item label="原始上傳行數">{batchSourceRawCount || '—'}</Descriptions.Item>
                    <Descriptions.Item label="去重後名單數">{batchSourceEntries.length || '—'}</Descriptions.Item>
                  </Descriptions>
                </Space>
              </Card>
            </Space>
          )}

          {batchResult && (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Row gutter={16}>
                <Col span={8}><Card size="small"><Statistic title="總筆數" value={batchResult.totalCount} /></Card></Col>
                <Col span={8}><Card size="small"><Statistic title="成功" value={batchResult.successCount} valueStyle={{ color: '#52c41a' }} /></Card></Col>
                <Col span={8}><Card size="small"><Statistic title="失敗" value={batchResult.failedCount} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
              </Row>

              <Card
                size="small"
                title="派發明細（僅顯示失敗）"
                extra={(
                  <Space wrap>
                    <Button icon={<DownloadOutlined />} onClick={downloadBatchResultCsv}>下載失敗 CSV</Button>
                  </Space>
                )}
              >
                <Table<BatchResultRow>
                  rowKey="key"
                  columns={batchResultColumns}
                  dataSource={batchResultRows}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  scroll={{ x: 760 }}
                />
              </Card>
            </Space>
          )}
        </div>
      </Modal>
    </div>
  );
}

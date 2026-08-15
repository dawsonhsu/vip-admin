'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Divider,
  Drawer,
  Empty,
  Input,
  InputNumber,
  Segmented,
  Select,
  Space,
  Switch,
  Typography,
  message,
  theme,
} from 'antd';
import {
  CloseOutlined,
  HolderOutlined,
  LockOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  gamesForPlatform,
  sectionTypeLabels,
  type HomeSection,
  type Platform,
  type SectionLayout,
} from '@/data/homeSectionsData';
import {
  gameStatusOptions,
  gameTypeOptions,
  type GameStatus,
  type GameType,
  type ProviderName,
} from '@/data/gameManagementData';

const { Text, Title } = Typography;

interface HomeSectionEditorDrawerProps {
  open: boolean;
  platform: Platform;
  section: HomeSection | null;
  onCancel: () => void;
  onConfirm: (section: HomeSection) => void;
}

const cloneSection = (section: HomeSection): HomeSection => ({
  ...section,
  gameIds: [...section.gameIds],
});

export default function HomeSectionEditorDrawer({
  open,
  platform,
  section,
  onCancel,
  onConfirm,
}: HomeSectionEditorDrawerProps) {
  const { token } = theme.useToken();
  const [draft, setDraft] = useState<HomeSection | null>(null);
  const [providerFilter, setProviderFilter] = useState<ProviderName | 'all'>('all');
  const [gameTypeFilter, setGameTypeFilter] = useState<GameType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<GameStatus | 'all'>('all');
  const [keyword, setKeyword] = useState('');
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [draggedPoolIndex, setDraggedPoolIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !section) return;
    setDraft(cloneSection(section));
    setProviderFilter('all');
    setGameTypeFilter(section.type === 'category' && section.categoryGameType
      ? section.categoryGameType
      : 'all');
    setStatusFilter('all');
    setKeyword('');
    setCheckedIds([]);
    setDraggedPoolIndex(null);
  }, [open, section]);

  const platformGames = useMemo(() => gamesForPlatform(platform), [platform]);
  const providerOptions = useMemo(() => (
    Array.from(new Set(platformGames.map((game) => game.provider)))
  ), [platformGames]);

  const filteredGames = useMemo(() => platformGames.filter((game) => {
    if (draft?.type === 'category' && draft.categoryGameType !== game.gameType) return false;
    if (providerFilter !== 'all' && game.provider !== providerFilter) return false;
    if (gameTypeFilter !== 'all' && game.gameType !== gameTypeFilter) return false;
    if (statusFilter !== 'all' && game.status !== statusFilter) return false;
    if (keyword.trim()) {
      const query = keyword.trim().toLowerCase();
      if (!game.gameNameEn.toLowerCase().includes(query)
        && !game.gameNameTg.toLowerCase().includes(query)
        && !game.gameId.includes(query)) return false;
    }
    return true;
  }), [draft?.categoryGameType, draft?.type, gameTypeFilter, keyword, platformGames, providerFilter, statusFilter]);

  const platformGamesById = useMemo(() => new Map(
    platformGames.map((game) => [game.gameId, game]),
  ), [platformGames]);

  if (!draft) return null;

  const addSelectedGames = () => {
    if (checkedIds.length === 0) {
      message.info('請先勾選遊戲');
      return;
    }
    const existing = new Set(draft.gameIds);
    const additions = checkedIds.filter((gameId) => !existing.has(gameId));
    setDraft({ ...draft, gameIds: [...draft.gameIds, ...additions] });
    setCheckedIds([]);
    message.success(additions.length > 0 ? `已加入 ${additions.length} 個遊戲` : '所選遊戲已在候選池中');
  };

  const removePoolGame = (gameId: string) => {
    setDraft({ ...draft, gameIds: draft.gameIds.filter((id) => id !== gameId) });
  };

  const dropPoolItem = (targetIndex: number) => {
    if (draggedPoolIndex === null || draggedPoolIndex === targetIndex) return;
    const nextIds = [...draft.gameIds];
    const [moved] = nextIds.splice(draggedPoolIndex, 1);
    nextIds.splice(targetIndex, 0, moved);
    setDraft({ ...draft, gameIds: nextIds });
    setDraggedPoolIndex(null);
  };

  const confirm = () => {
    if (draft.type === 'custom' && !draft.name.trim()) {
      message.warning('請輸入板塊名稱');
      return;
    }
    onConfirm({ ...draft, name: draft.name.trim(), gameIds: [...draft.gameIds] });
  };

  const candidateCount = draft.gameIds.length;
  const shownCount = Math.min(draft.displayCount, candidateCount);
  const backfillCount = Math.max(0, candidateCount - draft.displayCount);
  const isSystem = draft.type === 'system';

  return (
    <Drawer
      title={isSystem ? '編輯系統板塊' : '編輯首頁板塊'}
      width={960}
      open={open}
      onClose={onCancel}
      destroyOnClose
      footer={(
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel} data-e2e-id="home-section-editor-cancel-btn">取消</Button>
            <Button type="primary" onClick={confirm} data-e2e-id="home-section-editor-confirm-btn">確定</Button>
          </Space>
        </div>
      )}
      data-e2e-id="home-section-editor-drawer"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
        <div>
          <Text type="secondary">名稱</Text>
          <Input
            value={draft.name}
            disabled={draft.type !== 'custom'}
            suffix={draft.type !== 'custom' ? <LockOutlined /> : undefined}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            style={{ marginTop: 6 }}
            data-e2e-id="home-section-editor-name-input"
          />
        </div>
        <div>
          <Text type="secondary">類型</Text>
          <Input
            value={sectionTypeLabels[draft.type]}
            disabled
            style={{ marginTop: 6 }}
            data-e2e-id="home-section-editor-type-input"
          />
        </div>
        {!isSystem && (
          <div>
            <Text type="secondary">版型</Text>
            <Segmented<SectionLayout>
              block
              value={draft.layout}
              options={[
                { label: '橫版', value: 'landscape' },
                { label: '直版', value: 'portrait' },
              ]}
              onChange={(layout) => setDraft({ ...draft, layout })}
              style={{ marginTop: 6 }}
              data-e2e-id="home-section-editor-layout-segmented"
            />
            {draft.layout === 'portrait' && (
              <Text type="secondary" style={{ display: 'block', marginTop: 6, fontSize: 12 }}>
                直版每行 4 個，最後一行不滿可接受
              </Text>
            )}
          </div>
        )}
        {!isSystem && (
          <div>
            <Text type="secondary">展示數量</Text>
            <InputNumber
              min={1}
              max={100}
              value={draft.displayCount}
              onChange={(value) => setDraft({ ...draft, displayCount: value ?? 1 })}
              style={{ display: 'block', width: '100%', marginTop: 6 }}
              data-e2e-id="home-section-editor-display-count-input"
            />
          </div>
        )}
        <div>
          <Text type="secondary" style={{ marginRight: 10 }}>狀態</Text>
          <Switch
            checked={draft.enabled}
            checkedChildren="啟用"
            unCheckedChildren="停用"
            onChange={(enabled) => setDraft({ ...draft, enabled })}
            data-e2e-id="home-section-editor-enabled-switch"
          />
        </div>
      </div>

      {isSystem ? (
        <Alert
          style={{ marginTop: 20 }}
          type="info"
          showIcon
          message="此板塊由系統排行榜演算法產生（Popular / Highest RTP / Top Multipliers），不可選遊戲。"
          data-e2e-id="home-section-editor-system-note"
        />
      ) : (
        <>
          <Divider style={{ margin: '20px 0 14px' }}>遊戲候選池</Divider>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
            <div
              style={{ border: `1px solid ${token.colorBorder}`, borderRadius: token.borderRadius, padding: 12 }}
              data-e2e-id="home-section-editor-game-picker"
            >
              <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>可選遊戲</Title>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <Select
                  value={providerFilter}
                  onChange={setProviderFilter}
                  options={[
                    { label: '全部供應商', value: 'all' },
                    ...providerOptions.map((provider) => ({ label: provider, value: provider })),
                  ]}
                  data-e2e-id="home-section-editor-provider-filter"
                />
                <Select
                  value={gameTypeFilter}
                  disabled={draft.type === 'category'}
                  onChange={setGameTypeFilter}
                  options={[
                    { label: '全部類型', value: 'all' },
                    ...gameTypeOptions.map((gameType) => ({ label: gameType, value: gameType })),
                  ]}
                  data-e2e-id="home-section-editor-game-type-filter"
                />
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { label: '全部狀態', value: 'all' },
                    ...gameStatusOptions.map((status) => ({ label: status, value: status })),
                  ]}
                  data-e2e-id="home-section-editor-status-filter"
                />
                <Input.Search
                  allowClear
                  placeholder="名稱或遊戲 ID"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  data-e2e-id="home-section-editor-keyword-search"
                />
              </div>
              <div style={{ height: 398, overflowY: 'auto', borderTop: `1px solid ${token.colorSplit}` }}>
                {filteredGames.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : filteredGames.map((game) => (
                  <label
                    key={game.gameId}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '24px 42px minmax(0, 1fr)',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 2px',
                      borderBottom: `1px solid ${token.colorSplit}`,
                      cursor: 'pointer',
                    }}
                  >
                    <Checkbox
                      checked={checkedIds.includes(game.gameId)}
                      onChange={(event) => setCheckedIds((current) => event.target.checked
                        ? [...current, game.gameId]
                        : current.filter((id) => id !== game.gameId))}
                      data-e2e-id={`home-section-picker-checkbox-${game.gameId}`}
                    />
                    <div style={{ height: 34, borderRadius: 5, background: 'linear-gradient(145deg, #1d4ed8, #7c3aed)' }} />
                    <div style={{ minWidth: 0 }}>
                      <Text ellipsis style={{ display: 'block', fontSize: 12 }}>{game.gameNameEn}</Text>
                      <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
                        {game.provider} ｜ {game.status}
                      </Text>
                    </div>
                  </label>
                ))}
              </div>
              <Button
                block
                icon={<PlusOutlined />}
                onClick={addSelectedGames}
                style={{ marginTop: 10 }}
                data-e2e-id="home-section-editor-add-games-btn"
              >
                加入所選
              </Button>
            </div>

            <div
              style={{ border: `1px solid ${token.colorBorder}`, borderRadius: token.borderRadius, padding: 12 }}
              data-e2e-id="home-section-editor-candidate-pool"
            >
              <Title level={5} style={{ marginTop: 0, marginBottom: 4 }}>候選池排序</Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 10 }}>
                已選 {candidateCount} ｜ 展示 {shownCount} ｜ 候補 {backfillCount}
              </Text>
              <div style={{ height: 444, overflowY: 'auto' }}>
                {draft.gameIds.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="尚未加入遊戲" />
                ) : draft.gameIds.map((gameId, index) => {
                  const game = platformGamesById.get(gameId);
                  if (!game) return null;
                  const warning = game.status !== '上架';
                  return (
                    <React.Fragment key={gameId}>
                      <div
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => dropPoolItem(index)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '24px 24px 38px minmax(0, 1fr) 26px',
                          alignItems: 'center',
                          gap: 7,
                          padding: '7px 0',
                          borderBottom: `1px solid ${token.colorSplit}`,
                        }}
                        data-e2e-id={`home-section-pool-row-${gameId}`}
                      >
                        <Text type="secondary" style={{ fontSize: 11 }}>{index + 1}</Text>
                        <span
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = 'move';
                            setDraggedPoolIndex(index);
                          }}
                          onDragEnd={() => setDraggedPoolIndex(null)}
                          style={{ cursor: 'grab', color: token.colorTextSecondary }}
                          data-e2e-id={`home-section-pool-drag-handle-${gameId}`}
                        >
                          <HolderOutlined />
                        </span>
                        <div style={{ height: 32, borderRadius: 5, background: 'linear-gradient(145deg, #0f766e, #2563eb)' }} />
                        <div style={{ minWidth: 0 }}>
                          <Text ellipsis style={{ display: 'block', fontSize: 12 }}>{game.gameNameEn}</Text>
                          <Text
                            style={{
                              display: 'block',
                              fontSize: 11,
                              color: warning ? token.colorError : token.colorTextSecondary,
                            }}
                          >
                            {game.status}
                          </Text>
                        </div>
                        <Button
                          type="text"
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={() => removePoolGame(gameId)}
                          data-e2e-id={`home-section-pool-remove-btn-${gameId}`}
                        />
                      </div>
                      {index + 1 === draft.displayCount && (
                        <Divider
                          plain
                          style={{ margin: '6px 0', color: token.colorPrimary, borderColor: token.colorPrimary }}
                        >
                          展示線
                        </Divider>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </Drawer>
  );
}

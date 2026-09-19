'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  HolderOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Drawer,
  Empty,
  Modal,
  Select,
  Space,
  Typography,
  theme,
} from 'antd';
import SearchPagePhonePreview from '@/components/SearchPagePhonePreview';
import type { GameManagementRecord } from '@/data/gameManagementData';
import {
  getClientHiddenReason,
  SEARCH_RECOMMEND_LIMIT,
} from '@/data/searchRecommendData';

const { Text } = Typography;

interface SearchRecommendDrawerProps {
  open: boolean;
  games: GameManagementRecord[];
  recommendIds: string[];
  onClose: () => void;
  onSave: (ids: string[]) => void;
}

export default function SearchRecommendDrawer({
  open,
  games,
  recommendIds,
  onClose,
  onSave,
}: SearchRecommendDrawerProps) {
  const { token } = theme.useToken();
  const [draftIds, setDraftIds] = useState<string[]>(recommendIds);
  const [selectedGameId, setSelectedGameId] = useState<string>();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraftIds([...recommendIds]);
    setSelectedGameId(undefined);
    setDraggedIndex(null);
  }, [open, recommendIds]);

  const gameMap = useMemo(
    () => new Map(games.map((game) => [game.gameId, game])),
    [games],
  );
  const draftGames = draftIds
    .map((gameId) => gameMap.get(gameId))
    .filter((game): game is GameManagementRecord => Boolean(game));
  const isFull = draftIds.length >= SEARCH_RECOMMEND_LIMIT;
  const hasUnsavedChanges = draftIds.join(',') !== recommendIds.join(',');

  const addOptions = games
    .filter((game) => game.status === '上架' && !draftIds.includes(game.gameId))
    .map((game) => ({
      value: game.gameId,
      label: `${game.gameNameEn}（${game.provider} · ${game.gameId}）`,
      searchText: `${game.gameNameEn} ${game.gameNameTg} ${game.gameId} ${game.provider}`.toLowerCase(),
    }));

  const requestClose = () => {
    if (!hasUnsavedChanges) {
      onClose();
      return;
    }

    Modal.confirm({
      title: '有未保存的調整，確定放棄？',
      okText: '確定放棄',
      cancelText: '繼續編輯',
      okButtonProps: { danger: true },
      onOk: onClose,
    });
  };

  const moveGame = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= draftIds.length || fromIndex === toIndex) return;
    setDraftIds((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const dropGame = (targetIndex: number) => {
    if (draggedIndex === null) return;
    moveGame(draggedIndex, targetIndex);
    setDraggedIndex(null);
  };

  const addSelectedGame = () => {
    if (!selectedGameId || isFull) return;
    setDraftIds((current) => [...current, selectedGameId]);
    setSelectedGameId(undefined);
  };

  return (
    <Drawer
      data-e2e-id="search-recommend-drawer"
      title="搜尋頁推薦遊戲配置"
      width={1100}
      open={open}
      destroyOnClose
      onClose={requestClose}
      footer={(
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Space>
            <Button data-e2e-id="search-recommend-cancel-btn" onClick={requestClose}>
              取消
            </Button>
            <Button
              data-e2e-id="search-recommend-save-btn"
              type="primary"
              onClick={() => onSave(draftIds)}
            >
              保存
            </Button>
          </Space>
        </div>
      )}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Alert
            type="info"
            showIcon
            message="設定 Filbet 客戶端搜尋頁「Recommended Games」區塊的遊戲與排序。最多 10 款；僅「上架」遊戲可加入；已加入的遊戲若變為下架、維護中或接口異常，會保留排序位置但客戶端不顯示。"
            style={{ marginBottom: 16 }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Select
              data-e2e-id="search-recommend-add-select"
              showSearch
              allowClear
              value={selectedGameId}
              options={addOptions}
              disabled={isFull}
              placeholder="輸入遊戲名稱 / 遊戲ID 搜尋"
              style={{ minWidth: 0, flex: 1 }}
              filterOption={(input, option) => (
                String(option?.searchText || '').includes(input.trim().toLowerCase())
              )}
              onChange={setSelectedGameId}
              onClear={() => setSelectedGameId(undefined)}
            />
            <Button
              data-e2e-id="search-recommend-add-btn"
              type="primary"
              disabled={isFull || !selectedGameId}
              onClick={addSelectedGame}
            >
              加入
            </Button>
            <Text data-e2e-id="search-recommend-count" type="secondary" style={{ whiteSpace: 'nowrap' }}>
              已選 {draftIds.length} / {SEARCH_RECOMMEND_LIMIT}
            </Text>
          </div>
          {isFull && (
            <Text type="warning" style={{ display: 'block', marginBottom: 10 }}>
              已達上限 10 款，請先移除再加入
            </Text>
          )}

          {draftGames.length === 0 ? (
            <Empty description="尚未設定推薦遊戲，客戶端將隱藏此區塊" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {draftGames.map((game, index) => {
                const hiddenReason = getClientHiddenReason(game);
                return (
                  <div
                    key={game.gameId}
                    data-e2e-id={`search-recommend-item-${game.gameId}`}
                    draggable
                    onDragStart={() => setDraggedIndex(index)}
                    onDragEnd={() => setDraggedIndex(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => dropGame(index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      border: `1px solid ${token.colorBorderSecondary}`,
                      borderRadius: 8,
                      background: token.colorBgContainer,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                      opacity: draggedIndex === index ? 0.55 : 1,
                    }}
                  >
                    <HolderOutlined style={{ color: token.colorTextTertiary, cursor: 'grab', fontSize: 18 }} />
                    <Text strong style={{ width: 24, textAlign: 'center' }}>{index + 1}</Text>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Text strong style={{ display: 'block' }}>{game.gameNameEn}</Text>
                      <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                        {game.provider} · {game.gameType} · ID {game.gameId}
                      </Text>
                      {hiddenReason && (
                        <Text type="warning" style={{ display: 'block', fontSize: 12 }}>
                          客戶端不顯示：{hiddenReason}
                        </Text>
                      )}
                    </div>
                    <Space size={2}>
                      <Button
                        data-e2e-id={`search-recommend-up-btn-${game.gameId}`}
                        type="text"
                        size="small"
                        icon={<ArrowUpOutlined />}
                        disabled={index === 0}
                        onClick={() => moveGame(index, index - 1)}
                      />
                      <Button
                        data-e2e-id={`search-recommend-down-btn-${game.gameId}`}
                        type="text"
                        size="small"
                        icon={<ArrowDownOutlined />}
                        disabled={index === draftGames.length - 1}
                        onClick={() => moveGame(index, index + 1)}
                      />
                      <Button
                        data-e2e-id={`search-recommend-remove-btn-${game.gameId}`}
                        type="link"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => setDraftIds((current) => current.filter((id) => id !== game.gameId))}
                      >
                        移除
                      </Button>
                    </Space>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ width: 360, flex: '0 0 360px', position: 'sticky', top: 0 }}>
          <SearchPagePhonePreview games={games} recommendIds={draftIds} />
        </div>
      </div>
    </Drawer>
  );
}

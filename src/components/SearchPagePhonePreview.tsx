'use client';

import React, { useMemo } from 'react';
import {
  FireFilled,
  LeftOutlined,
  SearchOutlined,
  StarFilled,
} from '@ant-design/icons';
import { Typography, theme } from 'antd';
import type { GameManagementRecord } from '@/data/gameManagementData';
import {
  buildTrendingGames,
  isSearchClientVisible,
} from '@/data/searchRecommendData';

const { Text } = Typography;

interface SearchPagePhonePreviewProps {
  games: GameManagementRecord[];
  recommendIds: string[];
}

const tileGradients = [
  'linear-gradient(145deg, #253b80, #7357d6)',
  'linear-gradient(145deg, #0f766e, #22c55e)',
  'linear-gradient(145deg, #9a3412, #f59e0b)',
  'linear-gradient(145deg, #831843, #ec4899)',
  'linear-gradient(145deg, #164e63, #06b6d4)',
];

const topBadgeStyles = [
  { background: '#fff1b8', color: '#ad6800', borderColor: '#ffd666' },
  { background: '#f0f0f0', color: '#595959', borderColor: '#bfbfbf' },
  { background: '#ffe7ba', color: '#ad4e00', borderColor: '#ffbb96' },
  { background: '#fafafa', color: '#8c8c8c', borderColor: '#d9d9d9' },
  { background: '#fafafa', color: '#8c8c8c', borderColor: '#d9d9d9' },
];

function TileArtwork({ game, size }: { game: GameManagementRecord; size: number }) {
  const colorIndex = Number(game.gameId.slice(-2)) % tileGradients.length;
  return (
    <div
      style={{
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
        borderRadius: 9,
        background: tileGradients[colorIndex],
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.16)',
      }}
    />
  );
}

export default function SearchPagePhonePreview({
  games,
  recommendIds,
}: SearchPagePhonePreviewProps) {
  const { token } = theme.useToken();
  const gameMap = useMemo(
    () => new Map(games.map((game) => [game.gameId, game])),
    [games],
  );
  const recommendedGames = recommendIds
    .map((gameId) => gameMap.get(gameId))
    .filter((game): game is GameManagementRecord => Boolean(game))
    .filter(isSearchClientVisible);
  const trendingGames = useMemo(() => buildTrendingGames(games), [games]);

  return (
    <div style={{ width: 340, maxWidth: '100%', margin: '0 auto' }}>
      <div
        data-e2e-id="search-preview-phone"
        style={{
          width: '100%',
          padding: '10px 10px 16px',
          borderRadius: 28,
          background: '#fff',
          color: '#262626',
          border: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: '0 12px 30px rgba(0,0,0,0.10)',
        }}
      >
        <div style={{ height: 22, padding: '0 8px', fontSize: 11, fontWeight: 700 }}>
          9:41
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
          <LeftOutlined style={{ color: '#262626', fontSize: 15 }} />
          <div
            style={{
              height: 34,
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '0 12px',
              borderRadius: 999,
              background: '#f5f5f5',
              color: '#bfbfbf',
              fontSize: 11,
            }}
          >
            <SearchOutlined />
            <span>Search game name</span>
          </div>
          <button
            type="button"
            disabled
            style={{
              height: 32,
              padding: '0 11px',
              border: 0,
              borderRadius: 999,
              background: '#e8364f',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              opacity: 0.5,
            }}
          >
            Search
          </button>
        </div>

        {recommendedGames.length > 0 ? (
          <section
            data-e2e-id="search-preview-recommended"
            style={{
              marginBottom: 14,
              padding: '11px 10px',
              borderRadius: 14,
              border: '1px solid #f0f0f0',
              background: '#fff',
              boxShadow: '0 3px 10px rgba(0,0,0,0.05)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                marginBottom: 9,
                color: '#262626',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <StarFilled style={{ color: '#e8364f' }} />
              Recommended Games
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 3 }}>
              {recommendedGames.map((game) => {
                const colorIndex = Number(game.gameId.slice(-2)) % tileGradients.length;
                return (
                  <div
                    key={game.gameId}
                    style={{
                      position: 'relative',
                      width: 58,
                      height: 76,
                      flex: '0 0 58px',
                      overflow: 'hidden',
                      borderRadius: 9,
                      padding: 6,
                      display: 'flex',
                      alignItems: 'flex-end',
                      background: tileGradients[colorIndex],
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.16)',
                    }}
                  >
                    <span
                      style={{
                        color: '#fff',
                        fontSize: 9,
                        fontWeight: 700,
                        lineHeight: 1.15,
                        textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {game.gameNameEn}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <div
            data-e2e-id="search-preview-recommended-empty"
            style={{
              marginBottom: 14,
              padding: '20px 12px',
              borderRadius: 12,
              border: `1px dashed ${token.colorBorder}`,
              textAlign: 'center',
              color: token.colorTextSecondary,
              fontSize: 12,
            }}
          >
            無可顯示遊戲，客戶端將隱藏此區塊
          </div>
        )}

        <section
          data-e2e-id="search-preview-trending"
          style={{
            padding: '12px 10px',
            borderRadius: 14,
            background: 'linear-gradient(180deg,#ffd6e3,#fff0f5)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              marginBottom: 9,
              color: '#e8364f',
              fontSize: 14,
              fontWeight: 900,
              fontStyle: 'italic',
            }}
          >
            <FireFilled />
            TRENDING GAMES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {trendingGames.map((game, index) => (
              <div
                key={game.gameId}
                data-e2e-id={`search-preview-trending-item-${game.gameId}`}
                style={{
                  minHeight: 54,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: 5,
                  borderRadius: 10,
                  background: '#fff',
                  boxShadow: '0 2px 7px rgba(232,54,79,0.08)',
                }}
              >
                <TileArtwork game={game} size={44} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: '#262626',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {game.gameNameEn}
                  </div>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>{game.provider}</div>
                </div>
                <span
                  style={{
                    flex: '0 0 auto',
                    padding: '2px 5px',
                    border: `1px solid ${topBadgeStyles[index].borderColor}`,
                    borderRadius: 5,
                    background: topBadgeStyles[index].background,
                    color: topBadgeStyles[index].color,
                    fontSize: 9,
                    fontWeight: 800,
                  }}
                >
                  TOP {index + 1}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 11, lineHeight: 1.45 }}>
        Trending Games：依近 30 天投注額自動排行 Top 5，無需後台配置（預覽為示意數據）
      </Text>
    </div>
  );
}

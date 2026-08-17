'use client';

import React from 'react';
import { FireOutlined, RiseOutlined, StarOutlined } from '@ant-design/icons';
import { Empty, Space, Typography, theme } from 'antd';
import {
  gamesForPlatform,
  resolveDisplayGames,
  type HomeSection,
  type Platform,
} from '@/data/homeSectionsData';
import type { GameManagementRecord } from '@/data/gameManagementData';
import { renderSectionIcon } from '@/components/homeSectionIcons';

const { Text } = Typography;

interface HomeSectionPhonePreviewProps {
  platform: Platform;
  sections: HomeSection[];
  title?: string;
}

const tileGradients = [
  'linear-gradient(145deg, #253b80, #7357d6)',
  'linear-gradient(145deg, #0f766e, #22c55e)',
  'linear-gradient(145deg, #9a3412, #f59e0b)',
  'linear-gradient(145deg, #831843, #ec4899)',
  'linear-gradient(145deg, #164e63, #06b6d4)',
];

function GameTile({ game, compact }: { game: GameManagementRecord; compact?: boolean }) {
  const colorIndex = Number(game.gameId.slice(-2)) % tileGradients.length;
  return (
    <div style={{ minWidth: 0 }} data-e2e-id={`home-preview-game-${game.gameId}`}>
      <div
        style={{
          height: compact ? 58 : 72,
          borderRadius: 8,
          padding: 7,
          display: 'flex',
          alignItems: 'flex-end',
          background: tileGradients[colorIndex],
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)',
        }}
      >
        <span
          style={{
            color: '#fff',
            fontSize: compact ? 9 : 10,
            fontWeight: 600,
            lineHeight: 1.15,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {game.gameNameEn}
        </span>
      </div>
    </div>
  );
}

function RankingBlock() {
  const pills = [
    { label: 'Popular', icon: <FireOutlined /> },
    { label: 'Highest RTP', icon: <RiseOutlined /> },
    { label: 'Top Multipliers', icon: <StarOutlined /> },
  ];

  return (
    <div
      style={{
        borderRadius: 10,
        padding: 10,
        background: 'linear-gradient(135deg, rgba(87,48,169,0.95), rgba(27,91,170,0.95))',
      }}
      data-e2e-id="home-preview-ranking"
    >
      <Space size={6} wrap>
        {pills.map((pill) => (
          <span
            key={pill.label}
            style={{
              display: 'inline-flex',
              gap: 4,
              alignItems: 'center',
              padding: '5px 7px',
              borderRadius: 999,
              color: '#fff',
              background: 'rgba(255,255,255,0.14)',
              fontSize: 10,
              whiteSpace: 'nowrap',
            }}
          >
            {pill.icon}{pill.label}
          </span>
        ))}
      </Space>
    </div>
  );
}

function RecentPlayedBlock({ platform }: { platform: Platform }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 3,
      }}
      data-e2e-id="home-preview-recent-played"
    >
      {gamesForPlatform(platform).slice(0, 6).map((game) => (
        <div key={game.gameId} style={{ flex: '0 0 92px' }}>
          <GameTile game={game} />
        </div>
      ))}
    </div>
  );
}

export default function HomeSectionPhonePreview({
  platform,
  sections,
  title = '首頁預覽',
}: HomeSectionPhonePreviewProps) {
  const { token } = theme.useToken();
  const visibleSections = sections.flatMap((section) => {
    if (!section.enabled) return [];
    if (section.type === 'system') return [{ section, games: [] }];
    const games = resolveDisplayGames(section, platform);
    return games.length > 0 ? [{ section, games }] : [];
  });

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 390,
        margin: '0 auto',
        padding: 9,
        borderRadius: 34,
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorder}`,
        boxShadow: token.boxShadowSecondary,
      }}
      data-e2e-id="home-section-phone-preview"
    >
      <div
        style={{
          height: 14,
          width: 84,
          margin: '2px auto 8px',
          borderRadius: 99,
          background: token.colorText,
          opacity: 0.8,
        }}
      />
      <div
        style={{
          height: 650,
          overflowY: 'auto',
          borderRadius: 24,
          padding: '14px 12px 22px',
          background: token.colorBgLayout,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text strong>{title}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{platform}</Text>
        </div>

        {visibleSections.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暫無可展示板塊" />
        ) : visibleSections.map(({ section, games }) => (
          <section
            key={section.id}
            style={{ marginBottom: 18 }}
            data-e2e-id={`home-preview-section-${section.id}`}
          >
            <Text
              strong
              style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8, fontSize: 13 }}
            >
              {renderSectionIcon(section.icon)}
              {section.name}
            </Text>
            {section.type === 'system' ? (
              section.systemKind === 'recentPlayed'
                ? <RecentPlayedBlock platform={platform} />
                : <RankingBlock />
            ) : section.layout === 'landscape' ? (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  overflowX: 'auto',
                  paddingBottom: 3,
                }}
              >
                {games.map((game) => (
                  <div key={game.gameId} style={{ flex: '0 0 92px' }}>
                    <GameTile game={game} />
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                  gap: 7,
                }}
              >
                {games.map((game) => (
                  <GameTile key={game.gameId} game={game} compact />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

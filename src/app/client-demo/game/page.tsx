'use client';

import React, { useState } from 'react';
import {
  SearchOutlined,
  PlayCircleFilled,
  FireFilled,
  TrophyFilled,
  StarFilled,
  CrownFilled,
  ThunderboltFilled,
} from '@ant-design/icons';

const OUTER_TABS = ['Game Types', 'Providers'] as const;
const GAME_TYPES = ['Slots', 'Live Casino', 'Sports', 'Fishing', 'Bingo', 'Lottery'];
const PROVIDERS = ['JILI', 'PG', 'PP', 'FC', 'JDB', 'CQ9', 'EVO', 'BTI'];

const GAMES = [
  { name: 'Fortune Gems', tag: 'JILI', color: '#FF3546', rtp: '96.5%' },
  { name: 'Super Ace', tag: 'JILI', color: '#FF9A2E', rtp: '96.8%' },
  { name: 'Money Coming', tag: 'JILI', color: '#6366F1', rtp: '95.2%' },
  { name: 'Boxing King', tag: 'JILI', color: '#EC4899', rtp: '97.1%' },
  { name: 'Wild Ace', tag: 'PG', color: '#14B8A6', rtp: '96.3%' },
  { name: 'Lucky 777', tag: 'PG', color: '#A855F7', rtp: '96.0%' },
  { name: 'Mega Wheel', tag: 'PP', color: '#F59E0B', rtp: '94.8%' },
  { name: 'Dragon Lord', tag: 'PG', color: '#10B981', rtp: '96.6%' },
  { name: 'Mystery Mine', tag: 'PP', color: '#3B82F6', rtp: '95.9%' },
  { name: 'Tiger Strike', tag: 'CQ9', color: '#DC2626', rtp: '96.2%' },
  { name: 'Pirate Bay', tag: 'JDB', color: '#0891B2', rtp: '95.7%' },
  { name: 'Magic Forest', tag: 'PG', color: '#7C3AED', rtp: '96.4%' },
];

const ICONS = [PlayCircleFilled, FireFilled, TrophyFilled, StarFilled, CrownFilled, ThunderboltFilled];

export default function GamePage() {
  const [outer, setOuter] = useState<(typeof OUTER_TABS)[number]>('Game Types');
  const [inner, setInner] = useState(GAME_TYPES[0]);
  const innerList = outer === 'Game Types' ? GAME_TYPES : PROVIDERS;

  return (
    <div style={{ background: '#0e1018', color: '#fff', minHeight: '100%' }}>
      {/* App bar */}
      <div
        style={{
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
        }}
      >
        <div style={{ display: 'flex', gap: 16 }}>
          {OUTER_TABS.map((t) => {
            const active = outer === t;
            return (
              <div
                key={t}
                onClick={() => {
                  setOuter(t);
                  setInner((t === 'Game Types' ? GAME_TYPES : PROVIDERS)[0]);
                }}
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: active ? '#fff' : '#5a5a66',
                  position: 'relative',
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
              >
                {t}
                {active && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 6,
                      height: 6,
                      background: '#FF3546',
                      borderRadius: '50%',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <SearchOutlined style={{ fontSize: 20, color: '#e8e8e8' }} />
      </div>

      {/* Inner tab chips */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '8px 14px 0',
          overflowX: 'auto',
        }}
      >
        {innerList.map((it) => {
          const active = inner === it;
          return (
            <div
              key={it}
              onClick={() => setInner(it)}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: 16,
                fontSize: 12,
                fontWeight: 600,
                background: active ? '#FF3546' : '#1a1c23',
                color: active ? '#fff' : '#8a8a99',
                border: '1px solid',
                borderColor: active ? '#FF3546' : '#2a2d36',
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              {it}
            </div>
          );
        })}
      </div>

      {/* Result count */}
      <div style={{ padding: '12px 14px 4px', fontSize: 11, color: '#5a5a66' }}>
        {inner} · {GAMES.length} games
      </div>

      {/* Game grid */}
      <div
        style={{
          padding: '4px 14px 16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
        }}
      >
        {GAMES.map((g, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <div
              key={g.name}
              style={{
                borderRadius: 8,
                overflow: 'hidden',
                cursor: 'pointer',
                background: '#1a1c23',
                border: '1px solid #2a2d36',
              }}
            >
              <div
                style={{
                  aspectRatio: '1 / 1.1',
                  background: `linear-gradient(135deg, ${g.color} 0%, ${shade(g.color)} 100%)`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 8,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    padding: '2px 6px',
                    background: 'rgba(0,0,0,0.5)',
                    borderRadius: 4,
                    fontSize: 9,
                    fontWeight: 700,
                    width: 'fit-content',
                  }}
                >
                  {g.tag}
                </div>
                <Icon style={{ fontSize: 32, color: 'rgba(255,255,255,0.85)', alignSelf: 'center' }} />
                <div
                  style={{
                    fontSize: 9,
                    color: 'rgba(255,255,255,0.85)',
                    alignSelf: 'flex-end',
                    background: 'rgba(0,0,0,0.4)',
                    padding: '1px 5px',
                    borderRadius: 3,
                  }}
                >
                  RTP {g.rtp}
                </div>
              </div>
              <div style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600, color: '#e8e8e8' }}>
                {g.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function shade(hex: string): string {
  const c = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((c >> 16) & 0xff) - 40);
  const g = Math.max(0, ((c >> 8) & 0xff) - 40);
  const b = Math.max(0, (c & 0xff) - 40);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

'use client';

import React, { useState } from 'react';
import {
  MenuOutlined,
  CustomerServiceOutlined,
  PlayCircleFilled,
  FireFilled,
  TrophyFilled,
  StarFilled,
  ThunderboltFilled,
  CrownFilled,
  GiftFilled,
} from '@ant-design/icons';

const TABS = ['Favorite', 'For You', 'Explore'] as const;
type Tab = (typeof TABS)[number];

const BANNERS = [
  { title: 'Welcome Bonus', sub: 'First Deposit 200%', gradient: 'linear-gradient(135deg, #FF3546 0%, #FF7D00 100%)' },
  { title: 'Free Spin Festival', sub: '100 spins giveaway', gradient: 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)' },
];

const HOT_GAMES = [
  { name: 'Fortune Gems', tag: 'JILI', color: '#FF3546', icon: <TrophyFilled /> },
  { name: 'Super Ace', tag: 'JILI', color: '#FF9A2E', icon: <StarFilled /> },
  { name: 'Money Coming', tag: 'JILI', color: '#6366F1', icon: <ThunderboltFilled /> },
  { name: 'Boxing King', tag: 'JILI', color: '#EC4899', icon: <FireFilled /> },
  { name: 'Wild Ace', tag: 'PG', color: '#14B8A6', icon: <PlayCircleFilled /> },
  { name: 'Lucky 777', tag: 'PG', color: '#A855F7', icon: <CrownFilled /> },
  { name: 'Mega Wheel', tag: 'PP', color: '#F59E0B', icon: <GiftFilled /> },
  { name: 'Dragon Lord', tag: 'PG', color: '#10B981', icon: <ThunderboltFilled /> },
];

const PROVIDERS = ['JILI', 'PG', 'PP', 'FC', 'JDB', 'CQ9'];

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('For You');
  const [bannerIdx, setBannerIdx] = useState(0);

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
        <MenuOutlined style={{ fontSize: 20, color: '#e8e8e8' }} />
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map((t) => {
            const active = tab === t;
            return (
              <div
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '4px 8px',
                  fontSize: 15,
                  fontWeight: 700,
                  color: active ? '#fff' : '#5a5a66',
                  position: 'relative',
                  cursor: 'pointer',
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
        <CustomerServiceOutlined style={{ fontSize: 20, color: '#e8e8e8' }} />
      </div>

      {/* Banner carousel */}
      <div style={{ padding: '8px 14px 0' }}>
        <div
          style={{
            height: 140,
            borderRadius: 12,
            overflow: 'hidden',
            position: 'relative',
            background: BANNERS[bannerIdx].gradient,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 18,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            {BANNERS[bannerIdx].title}
          </div>
          <div style={{ fontSize: 13, opacity: 0.92 }}>{BANNERS[bannerIdx].sub}</div>
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 6,
            }}
          >
            {BANNERS.map((_, i) => (
              <div
                key={i}
                onClick={() => setBannerIdx(i)}
                style={{
                  width: bannerIdx === i ? 16 : 6,
                  height: 6,
                  background: bannerIdx === i ? '#fff' : 'rgba(255,255,255,0.5)',
                  borderRadius: 3,
                  transition: 'width 0.2s',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Provider quick picks */}
      <div style={{ padding: '14px 14px 0' }}>
        <SectionTitle title="Providers" subtitle="精選提供商" />
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {PROVIDERS.map((p) => (
            <div
              key={p}
              style={{
                flexShrink: 0,
                padding: '6px 16px',
                background: '#1a1c23',
                border: '1px solid #2a2d36',
                borderRadius: 16,
                fontSize: 12,
                fontWeight: 600,
                color: '#e8e8e8',
              }}
            >
              {p}
            </div>
          ))}
        </div>
      </div>

      {/* Hot games */}
      <div style={{ padding: '14px 14px 0' }}>
        <SectionTitle title="Hot Games" subtitle="熱門遊戲" action="See all" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}
        >
          {HOT_GAMES.map((g) => (
            <div
              key={g.name}
              style={{
                aspectRatio: '1 / 1.15',
                borderRadius: 8,
                background: `linear-gradient(135deg, ${g.color} 0%, ${shade(g.color)} 100%)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 10,
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  padding: '2px 6px',
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: 4,
                  fontSize: 9,
                  fontWeight: 700,
                  width: 'fit-content',
                  letterSpacing: 0.4,
                }}
              >
                {g.tag}
              </div>
              <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.85)', alignSelf: 'center' }}>
                {g.icon}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>{g.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live winners */}
      <div style={{ padding: '14px 14px 8px' }}>
        <SectionTitle title="Live Winners" subtitle="即時中獎" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { user: 'john***24', game: 'Fortune Gems', amt: '+₱8,420.00' },
            { user: 'maria***88', game: 'Super Ace', amt: '+₱3,250.00' },
            { user: 'kev***07', game: 'Money Coming', amt: '+₱12,800.00' },
          ].map((w, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: '#1a1c23',
                border: '1px solid #2a2d36',
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#FF3546',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {w.user.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ color: '#e8e8e8', fontWeight: 600 }}>{w.user}</div>
                  <div style={{ color: '#8a8a99', fontSize: 10 }}>{w.game}</div>
                </div>
              </div>
              <div style={{ color: '#14E65A', fontWeight: 700 }}>{w.amt}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 10,
      }}
    >
      <div>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#e8e8e8' }}>{title}</span>
        {subtitle && (
          <span style={{ fontSize: 11, color: '#5a5a66', marginLeft: 8 }}>{subtitle}</span>
        )}
      </div>
      {action && <span style={{ fontSize: 11, color: '#FF3546' }}>{action} ›</span>}
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

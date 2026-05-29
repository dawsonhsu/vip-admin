'use client';

import React, { Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  ArrowLeftOutlined,
  HomeOutlined,
  AppstoreOutlined,
  GiftOutlined,
  DollarCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';

const PHONE_W = 390;
const PHONE_H = 844;
const NAV_H = 64;

type Tab = {
  key: string;
  href: string;
  label: string;
  icon: React.ReactNode;
};

const TABS: Tab[] = [
  { key: 'home', href: '/client-demo/home', label: 'Home', icon: <HomeOutlined /> },
  { key: 'game', href: '/client-demo/game', label: 'Game', icon: <AppstoreOutlined /> },
  { key: 'rewards', href: '/client-demo/rewards', label: 'Rewards', icon: <GiftOutlined /> },
  { key: 'filcoin', href: '/client-demo/filcoin', label: 'Filcoin', icon: <DollarCircleOutlined /> },
  { key: 'mine', href: '/client-demo/mine', label: 'My', icon: <UserOutlined /> },
];

const FULLSCREEN_ROUTES = ['/client-demo/deposit', '/client-demo/newbie-rewards'];
const LIGHT_NAV_ROUTES = ['/client-demo/rewards', '/client-demo/newbie-rewards'];

export default function ClientDemoLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const showBottomNav = !FULLSCREEN_ROUTES.some((p) => pathname?.startsWith(p));
  const lightNav = LIGHT_NAV_ROUTES.some((p) => pathname?.startsWith(p));
  const activeTab = TABS.find((t) => pathname?.startsWith(t.href))?.key ?? 'home';
  const isNewbieRewards = pathname === '/client-demo/newbie-rewards';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          marginBottom: 16,
          color: '#a0a0b0',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#e8e8e8',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          <ArrowLeftOutlined style={{ marginRight: 4 }} />
          返回後台
        </button>
        <span>Client Demo · 純前端模擬，無 API · iPhone 14 (390 × 844)</span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 24,
        }}
      >
      <div
        style={{
          width: PHONE_W + 16,
          background: '#0a0a0a',
          borderRadius: 44,
          padding: 8,
          border: '1px solid #2a2a2a',
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
        }}
      >
        <div
          style={{
            width: PHONE_W,
            height: PHONE_H,
            background: lightNav ? '#f6f7f9' : '#0e1018',
            borderRadius: 36,
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Status bar */}
          <div
            style={{
              height: 44,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 28px',
              color: lightNav ? '#1a1a1a' : '#fff',
              fontSize: 14,
              fontWeight: 600,
              position: 'relative',
              zIndex: 3,
            }}
          >
            <span>9:41</span>
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 8,
                transform: 'translateX(-50%)',
                width: 100,
                height: 26,
                background: '#000',
                borderRadius: 16,
              }}
            />
            <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11 }}>●●●●●</span>
              <span style={{ fontSize: 12 }}>5G</span>
              <span
                style={{
                  display: 'inline-block',
                  width: 22,
                  height: 11,
                  border: lightNav ? '1px solid #1a1a1a' : '1px solid #fff',
                  borderRadius: 3,
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 1,
                    left: 1,
                    bottom: 1,
                    right: 4,
                    background: lightNav ? '#1a1a1a' : '#fff',
                    borderRadius: 1,
                  }}
                />
              </span>
            </span>
          </div>

          {/* Page content (scrollable) */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              position: 'relative',
              paddingBottom: showBottomNav ? NAV_H + 24 : 0,
            }}
          >
            {children}
          </div>

          {/* Bottom navigation — always pinned to bottom: 0 */}
          {showBottomNav && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                background: lightNav ? '#ffffff' : 'rgba(20, 22, 30, 0.92)',
                backdropFilter: 'blur(8px)',
                borderTopLeftRadius: 14,
                borderTopRightRadius: 14,
                borderTop: lightNav
                  ? '1px solid #ededf1'
                  : '1px solid rgba(255,255,255,0.06)',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  height: NAV_H,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  paddingTop: 6,
                }}
              >
                {TABS.map((t) => {
                  const active = activeTab === t.key;
                  const inactiveColor = lightNav ? '#555d74' : '#8a8a99';
                  return (
                    <div
                      key={t.key}
                      onClick={() => router.push(t.href)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3,
                        cursor: 'pointer',
                        flex: 1,
                        height: '100%',
                        color: active ? '#FF3546' : inactiveColor,
                        transition: 'color 0.18s ease',
                      }}
                    >
                      <span style={{ fontSize: active ? 22 : 20 }}>{t.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: active ? 700 : 500 }}>
                        {t.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Home indicator inside nav */}
              <div
                style={{
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: 140,
                    height: 5,
                    background: lightNav ? '#000' : '#fff',
                    borderRadius: 3,
                    opacity: 0.85,
                  }}
                />
              </div>
            </div>
          )}

          {/* Home indicator (only when nav is hidden) */}
          {!showBottomNav && (
            <div
              style={{
                height: 24,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <div
                style={{
                  width: 140,
                  height: 5,
                  background: lightNav ? '#000' : '#fff',
                  borderRadius: 3,
                  opacity: 0.85,
                }}
              />
            </div>
          )}
        </div>
      </div>
      {isNewbieRewards && (
        <Suspense fallback={null}>
          <NewbieRewardsControls />
        </Suspense>
      )}
      </div>
    </div>
  );
}

// ---------- Newbie Rewards state controls (side panel) ----------

const CARD_STATES = [
  { key: 'lock', label: 'Locked' },
  { key: 'inprogress', label: 'In Progress' },
  { key: 'ok', label: 'Completed' },
  { key: 'givenup', label: 'Given Up' },
] as const;

function NewbieRewardsControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const s1 = searchParams.get('s1') ?? 'inprogress';
  const s2 = searchParams.get('s2') ?? 'lock';
  const s3 = searchParams.get('s3') ?? 'lock';
  const expand = searchParams.get('expand') ?? '';

  const setParam = (key: string, val: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (val) next.set(key, val);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`);
  };

  const resetAll = () => router.replace(pathname);

  const applyPreset = (preset: Record<string, string>) => {
    const next = new URLSearchParams();
    Object.entries(preset).forEach(([k, v]) => v && next.set(k, v));
    router.replace(`${pathname}?${next.toString()}`);
  };

  const PRESETS: { label: string; params: Record<string, string> }[] = [
    { label: 'Default', params: {} },
    { label: 'All Locked', params: { s1: 'lock', s2: 'lock', s3: 'lock' } },
    {
      label: 'All In Progress',
      params: { s1: 'inprogress', s2: 'inprogress', s3: 'inprogress' },
    },
    { label: 'All Completed', params: { s1: 'ok', s2: 'ok', s3: 'ok' } },
    { label: 'All Given Up', params: { s1: 'givenup', s2: 'givenup', s3: 'givenup' } },
    {
      label: 'Card 1 Expanded',
      params: { s1: 'inprogress', s2: 'lock', s3: 'lock', expand: '1' },
    },
    {
      label: 'Card 2 In Progress',
      params: { s1: 'ok', s2: 'inprogress', s3: 'lock', expand: '2' },
    },
    {
      label: 'Card 3 In Progress',
      params: { s1: 'ok', s2: 'ok', s3: 'inprogress', expand: '3' },
    },
  ];

  return (
    <div
      style={{
        width: 280,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12,
        padding: 16,
        color: '#e8e8e8',
        backdropFilter: 'blur(8px)',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>State Controls</div>
      <div style={{ fontSize: 11, color: '#a0a0b0', marginBottom: 14 }}>
        Demo only · URL params drive the cards
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Preset Scenarios</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p.params)}
            style={{
              padding: '6px 8px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#e8e8e8',
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.18s',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,53,70,0.2)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#FF3546';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div
        style={{
          height: 1,
          background: 'rgba(255,255,255,0.1)',
          margin: '16px 0',
        }}
      />

      <StateSelector
        label="1st Deposit"
        value={s1}
        onChange={(v) => setParam('s1', v)}
      />
      <div style={{ height: 12 }} />
      <StateSelector
        label="2nd Deposit"
        value={s2}
        onChange={(v) => setParam('s2', v)}
      />
      <div style={{ height: 12 }} />
      <StateSelector
        label="3rd Deposit"
        value={s3}
        onChange={(v) => setParam('s3', v)}
      />

      <div style={{ height: 16 }} />
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Expand Card</div>
      <div style={{ display: 'flex', gap: 4 }}>
        {['', '1', '2', '3'].map((id) => (
          <button
            key={id || 'none'}
            onClick={() => setParam('expand', id)}
            style={{
              flex: 1,
              padding: '6px 0',
              background: expand === id ? '#FF3546' : 'rgba(255,255,255,0.06)',
              border: '1px solid',
              borderColor: expand === id ? '#FF3546' : 'rgba(255,255,255,0.12)',
              color: expand === id ? '#fff' : '#e8e8e8',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.18s',
            }}
          >
            {id || 'None'}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 10, color: '#7a7a8a', marginTop: 6 }}>
        Locked cards do not expand. Card 3 cannot expand in Completed state
        (Figma asset missing).
      </div>

      <div style={{ height: 16 }} />
      <button
        onClick={resetAll}
        style={{
          width: '100%',
          padding: '8px 0',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#e8e8e8',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Reset to Default
      </button>
    </div>
  );
}

function StateSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
        {CARD_STATES.map((s) => (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            style={{
              padding: '6px 8px',
              background: value === s.key ? '#FF3546' : 'rgba(255,255,255,0.06)',
              border: '1px solid',
              borderColor: value === s.key ? '#FF3546' : 'rgba(255,255,255,0.12)',
              color: value === s.key ? '#fff' : '#e8e8e8',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.18s',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

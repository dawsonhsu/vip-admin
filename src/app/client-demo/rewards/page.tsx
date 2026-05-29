'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RightOutlined, FileTextOutlined } from '@ant-design/icons';

const COLORS = {
  text: '#353845',
  textWeak: '#555d74',
  textDisable: '#b2b7c7',
  textPrimary: '#ff3546',
  iconSubtle: '#8991a7',
  iconWeak: '#69728c',
  layer: '#ffffff',
  layerSecondary50: '#f6f7f9',
  layerSecondary100: '#ededf1',
  layerPrimary: '#ff3546',
  layerPrimary10: '#fff1f3',
  border: '#ededf1',
};

const TABS = ['All', 'Newcomer', 'Daily'] as const;
type Tab = (typeof TABS)[number];

const BANNERS = [
  '/figma-rewards/banner-1.png',
  '/figma-rewards/banner-2.png',
  '/figma-rewards/banner-3.png',
];

type Reward = {
  amount: string;
  type: 'cash' | 'spin' | 'combo';
  combo?: { cash: string; spin: string };
  state: 'claimed' | 'active' | 'locked';
};

const REWARDS: Reward[] = [
  { amount: '₱ 10', type: 'cash', state: 'claimed' },
  { amount: 'FS × 9', type: 'spin', state: 'claimed' },
  { amount: '₱ 567', type: 'combo', combo: { cash: '₱ 567', spin: 'FS × 999' }, state: 'claimed' },
  { amount: '₱ 10', type: 'cash', state: 'locked' },
  { amount: 'FS × 9', type: 'spin', state: 'locked' },
];

const MILESTONES = [
  { label: '₱ 200', reached: true, leftPct: 7 },
  { label: '₱ 1,200', reached: true, leftPct: 27 },
  { label: '₱ 3,000', reached: true, leftPct: 48 },
  { label: '₱ 5,000', reached: false, leftPct: 68 },
  { label: '₱ 7,000', reached: false, leftPct: 88 },
];

const ACTIVITIES = [
  {
    id: 'a1',
    title: 'Slot Betting Rankings',
    endsAt: '2025/12/31 23:59:59',
    img: '/figma-rewards/activity-1.png',
  },
  {
    id: 'a2',
    title: 'P777 First Deposit',
    endsAt: '2025/12/31 23:59:59',
    img: '/figma-rewards/activity-2.png',
  },
  {
    id: 'a3',
    title: 'Daily Bet Rewards',
    endsAt: '2025/12/31 23:59:59',
    img: '/figma-rewards/activity-1.png',
  },
];

export default function RewardsPage() {
  const [tab, setTab] = useState<Tab>('All');

  return (
    <div style={{ background: COLORS.layerSecondary50, minHeight: '100%' }}>
      {/* Top hero gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 240,
          background:
            'linear-gradient(147.38deg, #fcbdca 0%, #fff0f3 21.487%, #ffc7b8 60%, #ff6e4b 100%)',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,225,180,0.5) 0%, rgba(255,225,180,0) 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: -30,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 70%)',
          }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div
          style={{
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: '0 14px',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text }}>Rewards</div>
          <FileTextOutlined
            style={{ position: 'absolute', right: 14, fontSize: 22, color: COLORS.text }}
          />
        </div>

        {/* Filcoin card */}
        <div style={{ padding: '12px 14px 0', position: 'relative' }}>
          <FilcoinCard />
        </div>

        {/* Newbie Rewards section */}
        <div style={{ padding: '20px 14px 0' }}>
          <SectionHeader title="Newbie Rewards" href="/client-demo/newbie-rewards" />
          <BannerCarousel images={BANNERS} />
        </div>

        {/* Daily Rewards card */}
        <div style={{ padding: '16px 14px 0' }}>
          <DailyRewardsCard />
        </div>

        {/* Tabs */}
        <div style={{ padding: '16px 14px 0' }}>
          <TabRow tab={tab} setTab={setTab} />
        </div>

        {/* Activity list */}
        <div
          style={{
            padding: '12px 14px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {ACTIVITIES.map((a) => (
            <ActivityCard key={a.id} {...a} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FilcoinCard() {
  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          height: 84,
          borderRadius: 12,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px -8px rgba(255, 53, 70, 0.35)',
        }}
      >
        {/* Card background from Figma (correct gradient edges) */}
        <img
          src="/figma-rewards/filcoin-card-bg.svg"
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />
        {/* Top-right decoration */}
        <img
          src="/figma-rewards/filcoin-card-deco.svg"
          alt=""
          style={{
            position: 'absolute',
            right: 0,
            top: 2,
            width: 78,
            height: 36,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 16,
            top: 14,
            right: 16,
            height: 52,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <StatCol label="My Filcoin" value="4,456,647.40" />
          <div
            style={{
              width: 1,
              height: 40,
              background: 'rgba(255,255,255,0.4)',
              margin: '0 12px',
            }}
          />
          <StatCol label="My Free Spin" value="189" />
        </div>
      </div>

      {/* Mascot — transparent RGBA PNG, overflows above card */}
      <img
        src="/figma-rewards/ip-mascot.png"
        alt="Filbet mascot"
        style={{
          position: 'absolute',
          right: 4,
          top: -22,
          width: 64,
          height: 37,
          objectFit: 'contain',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

function StatCol({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: '#fff',
          lineHeight: 1,
          letterSpacing: -0.6,
          fontFamily:
            'DIN Alternate, "DIN Condensed", "Helvetica Neue", Arial, sans-serif',
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 12,
          color: 'rgba(255,255,255,0.92)',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {label}
        <RightOutlined style={{ fontSize: 9, opacity: 0.9 }} />
      </div>
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  const router = useRouter();
  return (
    <div
      onClick={href ? () => router.push(href) : undefined}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: href ? 'pointer' : 'default',
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>{title}</div>
      <RightOutlined style={{ fontSize: 13, color: COLORS.iconSubtle }} />
    </div>
  );
}

function BannerCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  const [dragX, setDragX] = useState(0);
  const startX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-advance every 4s, paused while dragging
  useEffect(() => {
    if (dragX !== 0) return;
    const t = setTimeout(() => setIdx((i) => (i + 1) % images.length), 4000);
    return () => clearTimeout(t);
  }, [idx, dragX, images.length]);

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    setDragX(e.clientX - startX.current);
  };

  const onPointerUp = () => {
    if (startX.current === null) return;
    const w = containerRef.current?.offsetWidth ?? 1;
    if (dragX > w * 0.18 && idx > 0) {
      setIdx(idx - 1);
    } else if (dragX < -w * 0.18 && idx < images.length - 1) {
      setIdx(idx + 1);
    }
    setDragX(0);
    startX.current = null;
  };

  return (
    <div
      ref={containerRef}
      style={{
        marginTop: 8,
        height: 64,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        touchAction: 'pan-y',
        cursor: 'grab',
        userSelect: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        style={{
          display: 'flex',
          width: `${images.length * 100}%`,
          height: '100%',
          transform: `translateX(calc(${(-idx * 100) / images.length}% + ${dragX}px))`,
          transition: dragX === 0 ? 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
        }}
      >
        {images.map((src, i) => (
          <div key={i} style={{ flex: `0 0 ${100 / images.length}%`, height: '100%' }}>
            <img
              src={src}
              alt=""
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        ))}
      </div>

      {/* Pagination dots */}
      <div
        style={{
          position: 'absolute',
          bottom: 6,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 3,
          pointerEvents: 'none',
        }}
      >
        {images.map((_, i) => {
          const isActive = idx === i;
          return (
            <span
              key={i}
              style={{
                width: isActive ? 12 : 3,
                height: 3,
                background: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                borderRadius: 2,
                transition: 'width 0.3s ease',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function DailyRewardsCard() {
  return (
    <div
      style={{
        background:
          'linear-gradient(180deg, #ffebf2 0%, #ffffff 10%, #ffffff 100%)',
        border: '1px solid #ffffff',
        borderRadius: 12,
        padding: 12,
        boxShadow: '0 2px 8px rgba(255, 53, 70, 0.06)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>Daily Rewards</div>
        <div
          style={{
            fontSize: 12,
            color: COLORS.textPrimary,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          Refresh in 23:59:59
          <RightOutlined style={{ fontSize: 9 }} />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'hidden',
          marginBottom: 14,
        }}
      >
        {REWARDS.map((r, i) => (
          <RewardChip key={i} reward={r} />
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ position: 'relative', height: 22, marginTop: 4 }}>
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 4,
            right: 4,
            height: 4,
            background: COLORS.layerSecondary100,
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 4,
            width: 'calc(48% - 4px)',
            height: 4,
            background: COLORS.layerPrimary,
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 7,
            left: 'calc(48% - 5px)',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: COLORS.layerPrimary,
            boxShadow: '0 0 0 2px #fff, 0 2px 4px rgba(255,53,70,0.5)',
          }}
        />
        {MILESTONES.map((m) => (
          <div
            key={m.label}
            style={{
              position: 'absolute',
              top: -1,
              left: `${m.leftPct}%`,
              transform: 'translateX(-50%)',
              padding: '2px 6px',
              borderRadius: 31,
              background: m.reached ? COLORS.layerPrimary10 : COLORS.layerSecondary50,
              fontSize: 9,
              fontWeight: 600,
              color: m.reached ? COLORS.textPrimary : COLORS.textDisable,
              whiteSpace: 'nowrap',
              border: m.reached ? '0.5px solid #ffd1d6' : '0.5px solid #ededf1',
            }}
          >
            {m.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function RewardChip({ reward }: { reward: Reward }) {
  const claimed = reward.state === 'claimed';
  const locked = reward.state === 'locked';
  const textColor = claimed ? '#fff' : COLORS.textDisable;

  const iconSrc = claimed
    ? '/figma-rewards/reward-gift-spin.png'
    : reward.type === 'spin'
    ? '/figma-rewards/reward-wheel-unclaimed.png'
    : '/figma-rewards/reward-gift-unclaimed.png';

  const iconW = reward.type === 'combo' ? 48 : 32;

  return (
    <div
      style={{
        width: 64,
        height: 72,
        borderRadius: 8,
        flexShrink: 0,
        position: 'relative',
        paddingTop: 10,
        overflow: 'hidden',
      }}
    >
      {/* Chip background image */}
      <img
        src={claimed ? '/figma-rewards/chip-bg-claimed.png' : '/figma-rewards/chip-bg-unclaimed.png'}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          pointerEvents: 'none',
        }}
      />

      {/* Claimed: decoration overlay (top-right glow) */}
      {claimed && (
        <img
          src="/figma-rewards/chip-deco.png"
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 20,
            height: 20,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Corner badge */}
      {locked ? (
        <>
          <img
            src="/figma-rewards/badge-locked-corner.svg"
            alt=""
            style={{ position: 'absolute', top: 0, right: 0, width: 20, height: 20, pointerEvents: 'none' }}
          />
          <img
            src="/figma-rewards/badge-locked-icon.svg"
            alt=""
            style={{ position: 'absolute', top: 5, right: 5, width: 10, height: 10, pointerEvents: 'none' }}
          />
        </>
      ) : claimed ? (
        <img
          src="/figma-rewards/badge-claimed.png"
          alt=""
          style={{ position: 'absolute', top: 4, right: 4, width: 10, height: 10, pointerEvents: 'none' }}
        />
      ) : null}

      {/* Reward text */}
      {reward.type === 'combo' && reward.combo ? (
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: textColor, lineHeight: 1.2 }}>
            {reward.combo.cash}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: textColor, lineHeight: 1.2 }}>
            {reward.combo.spin}
          </div>
        </div>
      ) : (
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: textColor,
            textAlign: 'center',
            lineHeight: 1.2,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {reward.amount}
        </div>
      )}

      {/* Icon */}
      <img
        src={iconSrc}
        alt=""
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 4,
          transform: 'translateX(-50%)',
          width: iconW,
          height: 32,
          objectFit: 'contain',
          zIndex: 1,
        }}
      />
    </div>
  );
}

function TabRow({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        height: 36,
      }}
    >
      {TABS.map((t) => {
        const active = tab === t;
        return (
          <div
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: active ? '0 0 auto' : 1,
              padding: active ? '8px 28px' : '8px 0',
              background: active ? COLORS.layer : 'transparent',
              color: active ? COLORS.textPrimary : COLORS.textDisable,
              fontSize: active ? 18 : 16,
              fontWeight: active ? 800 : 600,
              borderRadius: 999,
              textAlign: 'center',
              cursor: 'pointer',
              boxShadow: active ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.18s',
              whiteSpace: 'nowrap',
            }}
          >
            {t}
          </div>
        );
      })}
    </div>
  );
}

function ActivityCard({
  title,
  endsAt,
  img,
}: {
  title: string;
  endsAt: string;
  img: string;
}) {
  return (
    <div
      style={{
        background: COLORS.layer,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      <img
        src={img}
        alt={title}
        style={{
          width: '100%',
          height: 127,
          objectFit: 'cover',
          display: 'block',
        }}
      />
      <div style={{ padding: '8px 14px 12px' }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.iconSubtle,
            textTransform: 'capitalize',
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 10,
            color: COLORS.textDisable,
            fontWeight: 500,
          }}
        >
          Ends At：{endsAt}
        </div>
      </div>
    </div>
  );
}

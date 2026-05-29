'use client';

import React, { Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const COLORS = {
  text: '#353845',
  textWeak: '#555d74',
  textDisable: '#b2b7c7',
  textPrimary: '#ff3546',
};

type CardState = 'lock' | 'inprogress' | 'ok' | 'givenup';

function isCardState(v: string | null): v is CardState {
  return v === 'lock' || v === 'inprogress' || v === 'ok' || v === 'givenup';
}

type CardCfg = {
  idx: number;
  paramKey: 's1' | 's2' | 's3';
  defaultState: CardState;
};

const CARDS: CardCfg[] = [
  { idx: 1, paramKey: 's1', defaultState: 'inprogress' },
  { idx: 2, paramKey: 's2', defaultState: 'lock' },
  { idx: 3, paramKey: 's3', defaultState: 'lock' },
];

// Map state → expand-image suffix. null = no expand asset for that state.
const EXPAND_ASSET: Record<CardState, string | null> = {
  lock: null, // locked cards do not expand
  inprogress: 'inprogress',
  ok: 'completed',
  givenup: 'givenup',
};

// Card 3 has no "completed" expand asset in Figma → exception
function expandAssetFor(idx: number, state: CardState): string | null {
  if (state === 'ok' && idx === 3) return null;
  return EXPAND_ASSET[state];
}

const ACTIVITY_PERIOD_TEXT = 'Until December 31, 2026, 23:59:59';
const INTRO_TEXT = 'Enjoy rewards on your 1st, 2nd, and 3rd deposits at Filbet!';
const GENERAL_MECHANICS_LINES = [
  '1. Open to eligible Filbet members.',
  '2. Rewards are automatically credited within 1 hour after each successful deposit.',
  '3. Bonus: 5× wagering requirement',
  '4. Deposit Principal: 2× turnover requirement',
  '5. Free Spins Winnings: No wagering requirement',
];
const KEY_NOTES_LINES = [
  '- Only one claim per member; duplicate or fraudulent accounts are disqualified.',
  '- Filbet reserves the right to modify or terminate this promotion with PAGCOR approval.',
];

export default function NewbieRewardsPage() {
  return (
    <Suspense fallback={null}>
      <NewbieRewardsContent />
    </Suspense>
  );
}

function NewbieRewardsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const states: CardState[] = CARDS.map((cfg) => {
    const v = searchParams.get(cfg.paramKey);
    return isCardState(v) ? v : cfg.defaultState;
  });

  const expandParam = searchParams.get('expand') ?? '';
  const expandedIdx = ['1', '2', '3'].includes(expandParam) ? Number(expandParam) : 0;

  const toggleExpand = (idx: number) => {
    const next = new URLSearchParams(searchParams.toString());
    if (expandedIdx === idx) next.delete('expand');
    else next.set('expand', String(idx));
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <div
      style={{
        background:
          'linear-gradient(180deg, #d7defd 0%, #f0f0fb 40%, #fafafd 70%, #ffffff 100%)',
        minHeight: '100%',
      }}
    >
      {/* Hero header */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '375 / 218' }}>
        <img
          src="/figma-rewards/newbie-header-bg.png"
          alt="First 3 Deposits Mega Rewards"
          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
        />
        <button
          onClick={() => router.back()}
          aria-label="Back"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 48,
            height: 88,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        />
      </div>

      {/* Card list */}
      <div
        style={{
          padding: '14px 16px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {CARDS.map((cfg, i) => {
          const state = states[i];
          const expandSuffix = expandAssetFor(cfg.idx, state);
          const canExpand = expandSuffix !== null;
          const isExpanded = canExpand && expandedIdx === cfg.idx;

          // Pick the right image — either collapsed or expanded
          const imgSrc = isExpanded
            ? `/figma-rewards/newbie-card-${cfg.idx}-expand-${expandSuffix}.png`
            : `/figma-rewards/newbie-card-${cfg.idx}-${state}.png`;

          return (
            <CardEntry
              key={cfg.idx}
              imgSrc={imgSrc}
              canExpand={canExpand}
              onToggle={() => canExpand && toggleExpand(cfg.idx)}
            />
          );
        })}
      </div>

      {/* Activity Period + Mechanics */}
      <div style={{ padding: '28px 16px 0', color: COLORS.text }}>
        <SectionDot title="ACTIVITY PERIOD" />
        <p style={{ marginTop: 8, fontSize: 13, color: COLORS.textWeak, lineHeight: 1.5 }}>
          {ACTIVITY_PERIOD_TEXT}
        </p>

        <div style={{ height: 20 }} />
        <p style={{ fontSize: 13, color: COLORS.textWeak, lineHeight: 1.5 }}>{INTRO_TEXT}</p>

        <div style={{ height: 20 }} />
        <SectionDot title="GENERAL MECHANICS" />
        <div style={{ marginTop: 8 }}>
          {GENERAL_MECHANICS_LINES.map((line, idx) => (
            <p key={idx} style={{ margin: 0, fontSize: 13, color: COLORS.textWeak, lineHeight: 1.6 }}>
              {line}
            </p>
          ))}
        </div>

        <div style={{ height: 20 }} />
        <SectionDot title="KEY NOTES" />
        <div style={{ marginTop: 8 }}>
          {KEY_NOTES_LINES.map((line, idx) => (
            <p key={idx} style={{ margin: 0, fontSize: 13, color: COLORS.textWeak, lineHeight: 1.6 }}>
              {line}
            </p>
          ))}
        </div>
      </div>

      <div style={{ height: 32 }} />
    </div>
  );
}

function CardEntry({
  imgSrc,
  canExpand,
  onToggle,
}: {
  imgSrc: string;
  canExpand: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={() => canExpand && onToggle()}
      style={{
        cursor: canExpand ? 'pointer' : 'default',
        transition: 'transform 0.18s ease',
      }}
      onMouseEnter={(e) => {
        if (canExpand) {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      <img src={imgSrc} alt="" style={{ width: '100%', display: 'block' }} />
    </div>
  );
}

function SectionDot({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: COLORS.text,
        }}
      />
      <span
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: COLORS.text,
          letterSpacing: 0.6,
        }}
      >
        {title}
      </span>
    </div>
  );
}

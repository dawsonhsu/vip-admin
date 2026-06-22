'use client';

import type { InPlayMatch } from '@/lib/winwinwin/types';

type Score = {
  home: number;
  away: number;
};

type LiveScoreProps = {
  match: InPlayMatch;
};

const statusLabels: Record<string, string> = {
  '1h': '上半場',
  '2h': '下半場',
  ht: '中場',
  paused: '中場',
  ft: '完場',
  ended: '完場',
  aet: '延長賽',
  pen: 'PK 大戰',
};

function statusLabel(status: string | null | undefined) {
  const value = status?.trim();
  if (!value) return '';
  return statusLabels[value.toLowerCase()] ?? value.toUpperCase();
}

function StatusChip({ status }: { status: string | null }) {
  const label = statusLabel(status);
  if (!label) return null;

  return (
    <span
      style={{
        color: '#D4AF37',
        background: 'rgba(212,175,55,0.12)',
        border: '1px solid rgba(212,175,55,0.35)',
        borderRadius: 999,
        padding: '3px 8px',
        fontSize: 11,
        fontWeight: 800,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function PeriodBreakdown({ periods }: { periods: Array<{ label: string; score: Score }> }) {
  if (periods.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
      {periods.map(({ label, score }) => (
        <span
          key={label}
          style={{
            fontSize: 11,
            color: '#c4b078',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(212,175,55,0.16)',
            borderRadius: 999,
            padding: '3px 8px',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
          }}
        >
          {label} {score.home}:{score.away}
        </span>
      ))}
    </div>
  );
}

export default function LiveScore({ match }: LiveScoreProps) {
  const live = match.live;
  if (!live) return null;

  const currentScore = live.scores?.CURRENT_SCORE;
  const periods = [
    live.scores?.PERIOD1_SCORE ? { label: '上半', score: live.scores.PERIOD1_SCORE } : null,
    live.scores?.PERIOD2_SCORE ? { label: '下半', score: live.scores.PERIOD2_SCORE } : null,
  ].filter((period): period is { label: string; score: Score } => Boolean(period));

  if (!currentScore) {
    if (periods.length === 0) {
      const label = statusLabel(live.status);
      return (
        <div style={{ fontSize: 12, color: '#a89a72', marginTop: 8 }}>
          {label ? `狀態：${label}` : '比分更新中'}
        </div>
      );
    }

    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusChip status={live.status} />
        </div>
        <PeriodBreakdown periods={periods} />
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            columnGap: 7,
            rowGap: 2,
            minWidth: 0,
          }}
        >
          <span style={{ color: '#f0ead6', fontSize: 13, fontWeight: 700, wordBreak: 'break-word' }}>
            {match.home_team}
          </span>
          <span style={{ color: '#D4AF37', fontSize: 24, fontWeight: 900, lineHeight: 1 }}>
            {currentScore.home}
          </span>
          <span style={{ color: '#a89a72', fontSize: 17, fontWeight: 700 }}>:</span>
          <span style={{ color: '#D4AF37', fontSize: 24, fontWeight: 900, lineHeight: 1 }}>
            {currentScore.away}
          </span>
          <span style={{ color: '#f0ead6', fontSize: 13, fontWeight: 700, wordBreak: 'break-word' }}>
            {match.away_team}
          </span>
        </div>
        <StatusChip status={live.status} />
      </div>
      <PeriodBreakdown periods={periods} />
    </div>
  );
}

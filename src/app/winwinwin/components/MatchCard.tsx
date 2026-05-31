'use client';

import Link from 'next/link';
import { Space } from 'antd';
import type { BetSelection, MatchRow, OddsRow } from '@/lib/winwinwin/types';
import { formatTaipeiTime } from '@/lib/winwinwin/format';
import OddsButton from './OddsButton';

type MatchCardProps = {
  match: MatchRow;
  mainOdds: OddsRow[];
  isFirst?: boolean;
};

function toSelection(match: MatchRow, odds: OddsRow): BetSelection {
  return {
    bet_type: 'match',
    event_label: `${match.home_team} vs ${match.away_team}`,
    event_time: match.start_time,
    api_match_id: match.api_match_id,
    market_key: odds.market_key,
    market_category: odds.market_category,
    market_label_zh: odds.market_label_zh,
    selection_label_zh: odds.selection_label_zh,
    line: odds.line,
    price_decimal: odds.price_decimal,
  };
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M9 18l6-6-6-6" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FootballSmall() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', verticalAlign: 'middle' }}>
      <circle cx="12" cy="12" r="10" stroke="#D4AF37" strokeWidth="1.8" />
      <polygon points="12,5 14.5,9 12,13 9.5,9" stroke="#D4AF37" strokeWidth="1.2" fill="rgba(212,175,55,0.25)" />
    </svg>
  );
}

export default function MatchCard({ match, mainOdds, isFirst = false }: MatchCardProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(15,45,34,0.95) 0%, rgba(10,36,25,0.98) 100%)',
        border: '1px solid rgba(212,175,55,0.28)',
        borderRadius: 12,
        padding: '14px 14px 12px',
        boxShadow: isFirst
          ? '0 4px 24px rgba(212,175,55,0.15), 0 1px 0 rgba(212,175,55,0.1) inset'
          : '0 2px 12px rgba(0,0,0,0.35)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: isFirst
            ? 'linear-gradient(90deg, #D4AF37 0%, rgba(212,175,55,0.3) 100%)'
            : 'linear-gradient(90deg, rgba(212,175,55,0.3) 0%, transparent 100%)',
          borderRadius: '12px 12px 0 0',
        }}
      />

      <Space direction="vertical" size={11} style={{ width: '100%' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div
              style={{
                fontSize: 11,
                color: '#a89a72',
                marginBottom: 5,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <FootballSmall />
              <span>{formatTaipeiTime(match.start_time)}</span>
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: '#f0ead6',
                fontFamily: 'var(--font-serif), serif',
                lineHeight: 1.25,
                letterSpacing: '0.01em',
              }}
            >
              {match.home_team}
              <span style={{ color: '#D4AF37', margin: '0 6px', fontWeight: 400, fontSize: 14 }}>vs</span>
              {match.away_team}
            </div>
          </div>

          {/* Upcoming badge for first match */}
          {isFirst && (
            <div
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #b8960f 100%)',
                color: '#071f18',
                fontSize: 10,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 999,
                whiteSpace: 'nowrap',
                letterSpacing: '0.06em',
                flexShrink: 0,
                marginLeft: 8,
              }}
            >
              即將開賽
            </div>
          )}
        </div>

        {/* Odds buttons */}
        {mainOdds.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {mainOdds.map((odds) => (
              <div key={odds.market_key} style={{ flex: '1 1 0', minWidth: 72 }}>
                <OddsButton selection={toSelection(match, odds)} compact />
              </div>
            ))}
          </div>
        )}

        {/* More markets link */}
        <Link
          href={`/winwinwin/match/${match.api_match_id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textDecoration: 'none',
            padding: '6px 0 0',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: '#a89a72',
              fontWeight: 500,
            }}
          >
            更多 {match.total_market_count} 個盤口
          </span>
          <span
            style={{
              fontSize: 12,
              color: '#D4AF37',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            查看全部 <ArrowRight />
          </span>
        </Link>
      </Space>
    </div>
  );
}

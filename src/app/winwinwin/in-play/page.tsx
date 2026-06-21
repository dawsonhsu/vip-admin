'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Empty, Skeleton, Space } from 'antd';
import type { BetSelection, InPlayMarket, InPlayMatch, InPlayResponse, InPlaySelection } from '@/lib/winwinwin/types';
import { formatTaipeiTime } from '@/lib/winwinwin/format';
import BottomNav from '../components/BottomNav';
import LiveScore from '../components/LiveScore';
import OddsButton from '../components/OddsButton';

const POLL_MS = 10_000;

function FootballSmall() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', verticalAlign: 'middle' }}>
      <circle cx="12" cy="12" r="10" stroke="#D4AF37" strokeWidth="1.8" />
      <polygon points="12,5 14.5,9 12,13 9.5,9" stroke="#D4AF37" strokeWidth="1.2" fill="rgba(212,175,55,0.25)" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M9 18l6-6-6-6" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LiveBadge() {
  return (
    <span
      style={{
        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
        color: '#fff7ed',
        fontSize: 10,
        fontWeight: 900,
        padding: '3px 8px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
        letterSpacing: '0.08em',
        boxShadow: '0 0 12px rgba(220,38,38,0.35)',
      }}
    >
      LIVE
    </span>
  );
}

function toSelection(match: InPlayMatch, market: InPlayMarket, selection: InPlaySelection): BetSelection {
  return {
    bet_type: 'inplay',
    event_label: `${match.home_team} vs ${match.away_team}`,
    event_time: match.start_time,
    api_match_id: match.api_match_id,
    no: match.no,
    market_id: market.market_id,
    selection_id: selection.selection_id,
    market_category: market.market_category,
    market_label_zh: market.market_label_zh,
    selection_label_zh: selection.selection_label_zh,
    line: selection.line,
    price_decimal: selection.price_decimal,
  };
}

function mainMarket(match: InPlayMatch) {
  return (
    match.markets.find((market) => market.market_category === 'Main' && market.period === 0) ??
    match.markets.find((market) => market.market_category === 'Main') ??
    null
  );
}

function LiveMatchCard({ match, isFirst = false }: { match: InPlayMatch; isFirst?: boolean }) {
  const market = mainMarket(match);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(15,45,34,0.95) 0%, rgba(10,36,25,0.98) 100%)',
        border: '1px solid rgba(212,175,55,0.28)',
        borderRadius: 12,
        padding: '14px 14px 12px',
        boxShadow: isFirst
          ? '0 4px 24px rgba(220,38,38,0.12), 0 1px 0 rgba(212,175,55,0.1) inset'
          : '0 2px 12px rgba(0,0,0,0.35)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: 'linear-gradient(90deg, #dc2626 0%, rgba(212,175,55,0.3) 100%)',
          borderRadius: '12px 12px 0 0',
        }}
      />

      <Space direction="vertical" size={11} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
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
                wordBreak: 'break-word',
              }}
            >
              {match.home_team}
              <span style={{ color: '#D4AF37', margin: '0 6px', fontWeight: 400, fontSize: 14 }}>vs</span>
              {match.away_team}
            </div>
            <LiveScore match={match} />
          </div>
          <LiveBadge />
        </div>

        {market && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {market.selections.slice(0, 3).map((selection) => (
              <div key={selection.selection_id} style={{ flex: '1 1 0', minWidth: 72 }}>
                <OddsButton selection={toSelection(match, market, selection)} compact />
              </div>
            ))}
          </div>
        )}

        <Link
          href={`/winwinwin/in-play/${encodeURIComponent(match.no)}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textDecoration: 'none',
            padding: '6px 0 0',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span style={{ fontSize: 12, color: '#a89a72', fontWeight: 500 }}>
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

export default function WinWinWinInPlayPage() {
  const [matches, setMatches] = useState<InPlayMatch[]>([]);
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load(initial = false) {
      if (initial) setLoading(true);
      const response = await fetch('/api/winwinwin/inplay', { cache: 'no-store' });
      const data = (await response.json().catch(() => ({}))) as Partial<InPlayResponse>;
      if (!mounted) return;
      setMatches(data.matches ?? []);
      setUpdatedAt(data.updated_at ?? '');
      setLoading(false);
    }

    load(true).catch(() => {
      if (mounted) setLoading(false);
    });
    const interval = setInterval(() => {
      load().catch(() => undefined);
    }, POLL_MS);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'linear-gradient(180deg, #0B3B2E 0%, rgba(11,59,46,0.97) 100%)',
          borderBottom: '1px solid rgba(212,175,55,0.2)',
          padding: '14px 16px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LiveBadge />
            <span
              style={{
                fontFamily: 'var(--font-serif), serif',
                fontSize: 18,
                fontWeight: 900,
                color: '#f0ead6',
                letterSpacing: '0.06em',
              }}
            >
              場中投注
            </span>
          </div>
          {updatedAt && (
            <div style={{ fontSize: 11, color: '#a89a72', marginTop: 5 }}>
              更新 {formatTaipeiTime(updatedAt)}
            </div>
          )}
        </div>
      </header>

      <div style={{ padding: '14px 14px 0' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#a89a72',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          進行中賽事
        </div>

        {loading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : matches.length === 0 ? (
          <div
            style={{
              padding: 24,
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.08)',
              textAlign: 'center',
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: '#a89a72' }}>目前無進行中的足球賽事</span>}
            />
          </div>
        ) : (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {matches.map((match, index) => (
              <LiveMatchCard key={match.no} match={match} isFirst={index === 0} />
            ))}
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

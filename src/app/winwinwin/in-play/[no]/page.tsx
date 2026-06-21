'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Empty, Skeleton, Space, Tabs } from 'antd';
import type { BetSelection, InPlayMarket, InPlayMatch, InPlayResponse, InPlaySelection } from '@/lib/winwinwin/types';
import { formatTaipeiTime } from '@/lib/winwinwin/format';
import LiveScore from '../../components/LiveScore';
import OddsButton from '../../components/OddsButton';

const POLL_MS = 10_000;

const categoryLabels: Record<string, string> = {
  Main: '主盤',
  Handicap: '讓分',
  Goals: '大小球',
  Corners: '角球',
  BTTS: 'BTTS',
  'Correct Score': '正確比分',
  'HT/FT': '半全場',
  Margin: '勝分差',
  'Odd/Even': '單雙',
  'Team Specials': '球隊特殊',
  Combo: '組合盤',
  Other: '其他',
};

const categoryOrder = [
  'Main',
  'Handicap',
  'Goals',
  'Corners',
  'BTTS',
  'Correct Score',
  'HT/FT',
  'Margin',
  'Odd/Even',
  'Team Specials',
  'Combo',
  'Other',
];

function categoryLabel(category: string) {
  return categoryLabels[category] ?? category;
}

function categoryRank(category: string) {
  const index = categoryOrder.indexOf(category);
  return index === -1 ? categoryOrder.length : index;
}

function BackArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M15 18l-6-6 6-6" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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

export default function WinWinWinInPlayDetailPage() {
  const params = useParams<{ no: string }>();
  const no = Array.isArray(params.no) ? params.no[0] : params.no;
  const [match, setMatch] = useState<InPlayMatch | null>(null);
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load(initial = false) {
      if (initial) setLoading(true);
      const response = await fetch('/api/winwinwin/inplay', { cache: 'no-store' });
      const data = (await response.json().catch(() => ({}))) as Partial<InPlayResponse>;
      if (!mounted) return;
      setMatch((data.matches ?? []).find((row) => row.no === no) ?? null);
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
  }, [no]);

  const groupedMarkets = useMemo(() => {
    const map = new Map<string, InPlayMarket[]>();
    (match?.markets ?? []).forEach((market) => {
      const key = market.market_category || 'Other';
      map.set(key, [...(map.get(key) ?? []), market]);
    });
    return Array.from(map.entries()).sort(([a], [b]) => categoryRank(a) - categoryRank(b) || a.localeCompare(b));
  }, [match]);

  if (loading) {
    return (
      <div style={{ padding: '60px 16px 16px' }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (!match) {
    return (
      <div style={{ padding: '60px 16px 16px', textAlign: 'center' }}>
        <Empty description={<span style={{ color: '#a89a72' }}>目前無此場中賽事</span>} />
        <Link
          href="/winwinwin/in-play"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: '#D4AF37',
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: 13,
            marginTop: 16,
          }}
        >
          <BackArrow />
          回場中
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', boxSizing: 'border-box' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'linear-gradient(180deg, #0B3B2E 0%, rgba(11,59,46,0.97) 100%)',
          borderBottom: '1px solid rgba(212,175,55,0.2)',
          padding: '12px 14px',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Link
          href="/winwinwin/in-play"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: '#D4AF37',
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: 13,
            marginBottom: 10,
          }}
        >
          <BackArrow />
          回場中
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <LiveBadge />
          <span style={{ fontSize: 11, color: '#a89a72', letterSpacing: '0.04em' }}>
            {formatTaipeiTime(match.start_time)}
          </span>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-serif), serif',
            fontSize: 20,
            fontWeight: 900,
            color: '#f0ead6',
            lineHeight: 1.25,
            letterSpacing: '0.02em',
            wordBreak: 'break-word',
          }}
        >
          {match.home_team}
          <span style={{ color: '#D4AF37', margin: '0 8px', fontWeight: 400, fontSize: 16 }}>vs</span>
          {match.away_team}
        </div>
        <LiveScore match={match} />
        <div style={{ fontSize: 11, color: '#6b7a6e', marginTop: 8 }}>
          {match.total_market_count} 個盤口{updatedAt ? ` · 更新 ${formatTaipeiTime(updatedAt)}` : ''}
        </div>
      </header>

      <div style={{ padding: '0 14px 24px' }}>
        {groupedMarkets.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: '#a89a72', fontSize: 13 }}>目前無盤口</span>}
            />
          </div>
        ) : (
          <Tabs
            tabBarGutter={0}
            tabBarStyle={{
              position: 'sticky',
              top: 160,
              zIndex: 9,
              background: 'linear-gradient(180deg, #092a1f 0%, rgba(9,42,31,0.97) 100%)',
              marginBottom: 0,
              paddingTop: 6,
              borderBottom: '1px solid rgba(212,175,55,0.15)',
            }}
            items={groupedMarkets.map(([category, markets]) => ({
              key: category,
              label: (
                <span style={{ fontSize: 12, padding: '0 10px' }}>
                  {categoryLabel(category)}
                  <span
                    style={{
                      marginLeft: 4,
                      fontSize: 10,
                      background: 'rgba(212,175,55,0.2)',
                      color: '#D4AF37',
                      borderRadius: 999,
                      padding: '0 5px',
                      lineHeight: '16px',
                      display: 'inline-block',
                      verticalAlign: 'middle',
                    }}
                  >
                    {markets.length}
                  </span>
                </span>
              ),
              children: (
                <Space direction="vertical" size={10} style={{ width: '100%', paddingTop: 12 }}>
                  {markets.map((market) => (
                    <div
                      key={market.market_id}
                      style={{
                        background: 'linear-gradient(135deg, rgba(15,45,34,0.95) 0%, rgba(10,36,25,0.98) 100%)',
                        border: '1px solid rgba(212,175,55,0.2)',
                        borderRadius: 10,
                        padding: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#c4b078',
                            letterSpacing: '0.01em',
                            lineHeight: 1.35,
                            wordBreak: 'break-word',
                          }}
                        >
                          {market.market_label_zh}
                          {market.period ? (
                            <span style={{ color: '#6b7a6e', marginLeft: 6, fontSize: 11 }}>
                              · {market.period}H
                            </span>
                          ) : null}
                        </span>
                        {market.in_running && <LiveBadge />}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {market.selections.map((selection) => (
                          <div key={selection.selection_id} style={{ flex: '1 1 80px', minWidth: 76 }}>
                            <OddsButton selection={toSelection(match, market, selection)} compact />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </Space>
              ),
            }))}
          />
        )}
      </div>
    </div>
  );
}

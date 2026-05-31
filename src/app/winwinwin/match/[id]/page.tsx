'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Empty, Input, Skeleton, Space, Tabs } from 'antd';
import type { BetSelection, MatchRow, OddsRow } from '@/lib/winwinwin/types';
import { formatTaipeiTime } from '@/lib/winwinwin/format';
import OddsButton from '../../components/OddsButton';

const categoryTabs = [
  { key: 'Main', label: '主盤' },
  { key: 'Handicap', label: '讓分' },
  { key: 'Goals', label: '大小球' },
  { key: 'BTTS', label: 'BTTS' },
  { key: 'Correct Score', label: '正確比分' },
  { key: 'HT/FT', label: '半全場' },
  { key: 'Margin', label: '勝分差' },
  { key: 'Odd/Even', label: '單雙' },
  { key: 'Team Specials', label: '球隊特殊' },
  { key: 'Combo', label: '組合盤' },
  { key: '1H', label: '上半場' },
  { key: 'Other', label: '其他' },
];

function groupKey(odds: OddsRow) {
  return `${odds.market_label_zh}|${odds.period}|${odds.market_type}`;
}

function tabKey(category: string) {
  return categoryTabs.some((tab) => tab.key === category) ? category : 'Other';
}

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

function BackArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M15 18l-6-6 6-6" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function WinWinWinMatchPage() {
  const params = useParams<{ id: string }>();
  const matchId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [match, setMatch] = useState<MatchRow | null>(null);
  const [oddsRows, setOddsRows] = useState<OddsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const searchActive = search.trim().length > 0;

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const [matchesResponse, oddsResponse] = await Promise.all([
        fetch('/api/winwinwin/matches', { cache: 'no-store' }),
        fetch(`/api/winwinwin/odds?match_id=${encodeURIComponent(matchId)}`, { cache: 'no-store' }),
      ]);
      const [matchesData, oddsData] = await Promise.all([
        matchesResponse.json().catch(() => ({})),
        oddsResponse.json().catch(() => ({})),
      ]);

      if (!mounted) return;
      setMatch((matchesData.matches ?? []).find((row: MatchRow) => row.api_match_id === matchId) ?? null);
      setOddsRows(oddsData.odds ?? []);
      setLoading(false);
    }

    load();
    return () => { mounted = false; };
  }, [matchId]);

  const groupedByTab = useMemo(() => {
    const map = new Map<string, Map<string, OddsRow[]>>();
    categoryTabs.forEach((tab) => map.set(tab.key, new Map()));

    oddsRows.forEach((odds) => {
      const key = tabKey(odds.market_category);
      const tabGroup = map.get(key) ?? new Map<string, OddsRow[]>();
      const marketKey = groupKey(odds);
      tabGroup.set(marketKey, [...(tabGroup.get(marketKey) ?? []), odds]);
      map.set(key, tabGroup);
    });

    return map;
  }, [oddsRows]);

  const searchGroups = useMemo(() => {
    if (!searchActive) return [];
    const needle = search.trim().toLowerCase();
    const filtered = oddsRows.filter((odds) => {
      const sel = (odds.selection_label_zh || '').toLowerCase();
      const lbl = (odds.market_label_zh || '').toLowerCase();
      return sel.includes(needle) || lbl.includes(needle);
    });
    const map = new Map<string, OddsRow[]>();
    filtered.forEach((odds) => {
      const key = groupKey(odds);
      map.set(key, [...(map.get(key) ?? []), odds]);
    });
    return Array.from(map.entries());
  }, [oddsRows, search, searchActive]);

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
        <Empty
          description={<span style={{ color: '#a89a72' }}>找不到賽事</span>}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', boxSizing: 'border-box' }}>
      {/* Sticky header */}
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
        {/* Back link */}
        <Link
          href="/winwinwin/home"
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
          回首頁
        </Link>

        {/* Match title */}
        <div style={{ fontSize: 11, color: '#a89a72', marginBottom: 4, letterSpacing: '0.04em' }}>
          {formatTaipeiTime(match.start_time)}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-serif), serif',
            fontSize: 20,
            fontWeight: 900,
            color: '#f0ead6',
            lineHeight: 1.25,
            letterSpacing: '0.02em',
          }}
        >
          {match.home_team}
          <span style={{ color: '#D4AF37', margin: '0 8px', fontWeight: 400, fontSize: 16 }}>vs</span>
          {match.away_team}
        </div>
        <div style={{ fontSize: 11, color: '#6b7a6e', marginTop: 4 }}>
          {match.total_market_count} 個盤口
        </div>
      </header>

      {/* Search bar */}
      <div
        style={{
          padding: '10px 14px 8px',
          background: 'linear-gradient(180deg, #092a1f 0%, #082519 100%)',
          borderBottom: '1px solid rgba(212,175,55,0.1)',
        }}
      >
        <Input
          allowClear
          placeholder="搜尋盤口或選項（如：墨西哥、大、讓分）"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(212,175,55,0.25)',
            color: '#f0ead6',
            borderRadius: 8,
          }}
          styles={{ input: { background: 'transparent', color: '#f0ead6' } }}
        />
      </div>

      {/* Tabs (hidden during search) */}
      <div style={{ padding: '0 14px 24px', display: searchActive ? 'none' : undefined }}>
        <Tabs
          tabBarGutter={0}
          tabBarStyle={{
            position: 'sticky',
            top: 108,
            zIndex: 9,
            background: 'linear-gradient(180deg, #092a1f 0%, rgba(9,42,31,0.97) 100%)',
            marginBottom: 0,
            paddingTop: 6,
            borderBottom: '1px solid rgba(212,175,55,0.15)',
          }}
          items={categoryTabs.map((tab) => {
            const groups = Array.from(groupedByTab.get(tab.key)?.entries() ?? []);
            const hasOdds = groups.length > 0;
            return {
              key: tab.key,
              label: (
                <span
                  style={{
                    fontSize: 12,
                    padding: '0 10px',
                    color: hasOdds ? undefined : '#4a5a52',
                  }}
                >
                  {tab.label}
                  {hasOdds && (
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
                      {groups.length}
                    </span>
                  )}
                </span>
              ),
              children:
                groups.length === 0 ? (
                  <div style={{ padding: '24px 0', textAlign: 'center' }}>
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={<span style={{ color: '#a89a72', fontSize: 13 }}>目前無盤口</span>}
                    />
                  </div>
                ) : (
                  <Space direction="vertical" size={10} style={{ width: '100%', paddingTop: 12 }}>
                    {groups.map(([key, rows]) => {
                      const first = rows[0];
                      return (
                        <div
                          key={key}
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
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#c4b078',
                              marginBottom: 10,
                              letterSpacing: '0.01em',
                            }}
                          >
                            {first.market_label_zh}
                            {first.period ? (
                              <span style={{ color: '#6b7a6e', marginLeft: 6, fontSize: 11 }}>
                                · {first.period}H
                              </span>
                            ) : null}
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {rows.map((odds) => (
                              <div key={odds.market_key} style={{ flex: '1 1 80px', minWidth: 76 }}>
                                <OddsButton selection={toSelection(match, odds)} compact />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </Space>
                ),
            };
          })}
        />
      </div>

      {/* Search results */}
      {searchActive && (
        <div style={{ padding: '14px 14px 24px' }}>
          <div style={{ fontSize: 12, color: '#a89a72', marginBottom: 10 }}>
            找到 {searchGroups.reduce((sum, [, rows]) => sum + rows.length, 0)} 個選項（{searchGroups.length} 組盤口）
          </div>
          {searchGroups.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span style={{ color: '#a89a72', fontSize: 13 }}>沒有符合的盤口</span>}
              />
            </div>
          ) : (
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              {searchGroups.map(([key, rows]) => {
                const first = rows[0];
                const tabLabel = categoryTabs.find((t) => t.key === tabKey(first.market_category))?.label;
                return (
                  <div
                    key={key}
                    style={{
                      background: 'linear-gradient(135deg, rgba(15,45,34,0.95) 0%, rgba(10,36,25,0.98) 100%)',
                      border: '1px solid rgba(212,175,55,0.2)',
                      borderRadius: 10,
                      padding: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#c4b078' }}>
                        {first.market_label_zh}
                        {first.period ? (
                          <span style={{ color: '#6b7a6e', marginLeft: 6, fontSize: 11 }}>· {first.period}H</span>
                        ) : null}
                      </span>
                      {tabLabel && (
                        <span
                          style={{
                            fontSize: 10,
                            background: 'rgba(212,175,55,0.15)',
                            color: '#D4AF37',
                            border: '1px solid rgba(212,175,55,0.3)',
                            borderRadius: 999,
                            padding: '1px 8px',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {tabLabel}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {rows.map((odds) => (
                        <div key={odds.market_key} style={{ flex: '1 1 80px', minWidth: 76 }}>
                          <OddsButton selection={toSelection(match, odds)} compact />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </Space>
          )}
        </div>
      )}
    </div>
  );
}

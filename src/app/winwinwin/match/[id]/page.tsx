'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, Empty, Skeleton, Space, Tabs, Typography } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
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

export default function WinWinWinMatchPage() {
  const params = useParams<{ id: string }>();
  const matchId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [match, setMatch] = useState<MatchRow | null>(null);
  const [oddsRows, setOddsRows] = useState<OddsRow[]>([]);
  const [loading, setLoading] = useState(true);

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
    return () => {
      mounted = false;
    };
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

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (!match) {
    return (
      <div style={{ padding: 16 }}>
        <Empty description="找不到賽事" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '14px 14px 24px', boxSizing: 'border-box' }}>
      <Link href="/winwinwin/home" style={{ color: '#1668dc', fontWeight: 700, textDecoration: 'none' }}>
        <LeftOutlined /> 回首頁
      </Link>

      <header style={{ margin: '14px 0 16px' }}>
        <Typography.Text type="secondary">{formatTaipeiTime(match.start_time)}</Typography.Text>
        <Typography.Title level={3} style={{ margin: '4px 0 2px', fontSize: 24 }}>
          {match.home_team} vs {match.away_team}
        </Typography.Title>
        <Typography.Text type="secondary">{match.total_market_count} 個盤口</Typography.Text>
      </header>

      <Tabs
        tabBarGutter={14}
        items={categoryTabs.map((tab) => {
          const groups = Array.from(groupedByTab.get(tab.key)?.entries() ?? []);
          return {
            key: tab.key,
            label: tab.label,
            children:
              groups.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="目前無盤口" />
              ) : (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {groups.map(([key, rows]) => {
                    const first = rows[0];
                    return (
                      <Card key={key} style={{ borderRadius: 8 }} styles={{ body: { padding: 14 } }}>
                        <Typography.Text strong>
                          {first.market_label_zh}
                          {first.period ? ` · ${first.period}H` : ''}
                        </Typography.Text>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                          {rows.map((odds) => (
                            <OddsButton key={odds.market_key} selection={toSelection(match, odds)} compact />
                          ))}
                        </div>
                      </Card>
                    );
                  })}
                </Space>
              ),
          };
        })}
      />
    </div>
  );
}

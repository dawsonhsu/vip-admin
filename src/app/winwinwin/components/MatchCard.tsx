'use client';

import Link from 'next/link';
import { Card, Space, Typography } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import type { BetSelection, MatchRow, OddsRow } from '@/lib/winwinwin/types';
import { formatTaipeiTime } from '@/lib/winwinwin/format';
import OddsButton from './OddsButton';

type MatchCardProps = {
  match: MatchRow;
  mainOdds: OddsRow[];
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

export default function MatchCard({ match, mainOdds }: MatchCardProps) {
  return (
    <Card
      styles={{ body: { padding: 16 } }}
      style={{
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
      }}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div>
          <Typography.Text type="secondary">{formatTaipeiTime(match.start_time)}</Typography.Text>
          <Typography.Title level={4} style={{ margin: '4px 0 0', fontSize: 18 }}>
            {match.home_team} vs {match.away_team}
          </Typography.Title>
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {mainOdds.map((odds) => (
            <OddsButton key={odds.market_key} selection={toSelection(match, odds)} compact />
          ))}
        </div>

        <Link
          href={`/winwinwin/match/${match.api_match_id}`}
          style={{
            color: '#1668dc',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textDecoration: 'none',
          }}
        >
          <span>更多 {match.total_market_count} 個盤口</span>
          <RightOutlined />
        </Link>
      </Space>
    </Card>
  );
}

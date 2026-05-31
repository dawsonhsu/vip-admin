'use client';

import type { BetRow } from '@/lib/winwinwin/types';
import { formatTaipeiDateTime } from '@/lib/winwinwin/format';

const STATUS_COLORS: Record<string, string> = {
  '待結算': '#fbbf24',
  '贏': '#4ade80',
  '輸': '#f87171',
  '取消': '#6b7a6e',
  pending: '#fbbf24',
  won: '#4ade80',
  lost: '#f87171',
  void: '#6b7a6e',
};

function getStatusColor(status: string) {
  return STATUS_COLORS[status] ?? '#a89a72';
}

type Props = {
  bet: BetRow;
  isCurrentUser?: boolean;
  onNameClick?: (name: string) => void;
};

export default function BetCard({ bet, isCurrentUser = false, onNameClick }: Props) {
  const statusColor = getStatusColor(bet.status);
  const nameClickable = Boolean(onNameClick);

  return (
    <div
      style={{
        background: isCurrentUser
          ? 'linear-gradient(135deg, rgba(18,52,38,0.98) 0%, rgba(12,42,28,0.99) 100%)'
          : 'linear-gradient(135deg, rgba(15,45,34,0.95) 0%, rgba(10,36,25,0.98) 100%)',
        border: isCurrentUser
          ? '1px solid rgba(212,175,55,0.35)'
          : '1px solid rgba(212,175,55,0.22)',
        borderRadius: 12,
        padding: '14px',
        boxShadow: isCurrentUser
          ? '0 2px 16px rgba(212,175,55,0.08)'
          : '0 2px 12px rgba(0,0,0,0.3)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: statusColor,
          borderRadius: '12px 0 0 12px',
        }}
      />
      <div style={{ paddingLeft: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          {nameClickable ? (
            <button
              type="button"
              onClick={() => onNameClick?.(bet.name)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontSize: 12,
                fontWeight: isCurrentUser ? 700 : 500,
                color: isCurrentUser ? '#D4AF37' : '#a89a72',
                letterSpacing: '0.02em',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'underline',
                textDecorationColor: 'rgba(212,175,55,0.25)',
                textUnderlineOffset: 3,
              }}
            >
              {bet.name}
              {isCurrentUser && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 10,
                    background: 'rgba(212,175,55,0.15)',
                    border: '1px solid rgba(212,175,55,0.3)',
                    color: '#D4AF37',
                    borderRadius: 999,
                    padding: '1px 6px',
                  }}
                >
                  我
                </span>
              )}
            </button>
          ) : (
            <span
              style={{
                fontSize: 11,
                color: '#a89a72',
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}
            >
              {bet.name}
            </span>
          )}
          <span style={{ fontSize: 11, color: '#6b7a6e' }}>{formatTaipeiDateTime(bet.created_at)}</span>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-serif), serif',
            fontSize: 15,
            fontWeight: 700,
            color: '#f0ead6',
            marginBottom: 6,
            lineHeight: 1.3,
          }}
        >
          {bet.bet_type === 'match' ? bet.match_name : '冠軍盤'}
        </div>

        <div style={{ fontSize: 13, color: '#a89a72', marginBottom: 10, lineHeight: 1.4 }}>
          {bet.market_label_zh}
          {bet.line ? ` ${bet.line}` : ''} —{' '}
          <span style={{ color: '#f0ead6', fontWeight: 600 }}>{bet.selection_label_zh}</span>
          {' '}@{' '}
          <span style={{ color: '#D4AF37', fontWeight: 700 }}>{bet.price_decimal.toFixed(2)}</span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 10,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span style={{ fontSize: 13, color: '#a89a72' }}>
            下注：<span style={{ color: '#f0ead6', fontWeight: 700 }}>{bet.stake}</span>
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: statusColor,
              background: `${statusColor}18`,
              border: `1px solid ${statusColor}40`,
              borderRadius: 999,
              padding: '2px 10px',
              letterSpacing: '0.04em',
            }}
          >
            {bet.status}
          </span>
        </div>
      </div>
    </div>
  );
}

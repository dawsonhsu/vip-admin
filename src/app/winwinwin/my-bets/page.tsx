import { redirect } from 'next/navigation';
import { getSessionFromCookies } from '@/lib/winwinwin/auth';
import { getBets } from '@/lib/winwinwin/sheets';
import type { BetRow } from '@/lib/winwinwin/types';
import { formatTaipeiDateTime as formatTaipeiTime } from '@/lib/winwinwin/format';
import BottomNav from '../components/BottomNav';

export const dynamic = 'force-dynamic';

const STATUS_COLORS: Record<string, string> = {
  '待結算': '#fbbf24',
  '贏': '#4ade80',
  '輸': '#f87171',
  '取消': '#6b7a6e',
  'pending': '#fbbf24',
  'won': '#4ade80',
  'lost': '#f87171',
  'void': '#6b7a6e',
};

function getStatusColor(status: string) {
  return STATUS_COLORS[status] ?? '#a89a72';
}

function BetCard({ bet }: { bet: BetRow }) {
  const statusColor = getStatusColor(bet.status);
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(15,45,34,0.95) 0%, rgba(10,36,25,0.98) 100%)',
        border: '1px solid rgba(212,175,55,0.22)',
        borderRadius: 12,
        padding: '14px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left accent bar */}
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
        {/* Top row: name + time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
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
          <span style={{ fontSize: 11, color: '#6b7a6e' }}>{formatTaipeiTime(bet.created_at)}</span>
        </div>

        {/* Match name */}
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

        {/* Market info */}
        <div style={{ fontSize: 13, color: '#a89a72', marginBottom: 10, lineHeight: 1.4 }}>
          {bet.market_label_zh}
          {bet.line ? ` ${bet.line}` : ''} —{' '}
          <span style={{ color: '#f0ead6', fontWeight: 600 }}>{bet.selection_label_zh}</span>
          {' '}@{' '}
          <span style={{ color: '#D4AF37', fontWeight: 700 }}>{bet.price_decimal.toFixed(2)}</span>
        </div>

        {/* Bottom row: stake + status */}
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

export default async function WinWinWinMyBetsPage() {
  const session = getSessionFromCookies();
  if (!session) redirect('/winwinwin');

  const bets = (await getBets()).filter((bet) => bet.email === session.email);

  return (
    <div style={{ minHeight: '100vh', padding: '0 0 86px', boxSizing: 'border-box' }}>
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'linear-gradient(180deg, #0B3B2E 0%, rgba(11,59,46,0.97) 100%)',
          borderBottom: '1px solid rgba(212,175,55,0.2)',
          padding: '14px 16px 12px',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-serif), serif',
            fontSize: 18,
            fontWeight: 900,
            color: '#f0ead6',
            letterSpacing: '0.04em',
            marginBottom: 2,
          }}
        >
          我的注單
        </div>
        <div style={{ fontSize: 12, color: '#a89a72' }}>
          {session.name} · {bets.length} 筆記錄
        </div>
      </header>

      <div style={{ padding: '14px 14px 0' }}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {bets.length === 0 ? (
            <div
              style={{
                padding: 32,
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#a89a72',
                textAlign: 'center',
                fontSize: 14,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              目前沒有下注紀錄
            </div>
          ) : (
            bets.map((bet) => <BetCard key={bet.bet_id} bet={bet} />)
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { getSessionFromCookies } from '@/lib/winwinwin/auth';
import { getBets } from '@/lib/winwinwin/sheets';
import BottomNav from '../components/BottomNav';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const session = getSessionFromCookies();
  if (!session) redirect('/winwinwin');

  const bets = await getBets();

  // Compute per-player net P&L from settled bets only
  const stats: Record<string, { name: string; net: number; won: number; lost: number }> = {};
  for (const bet of bets) {
    if (bet.status !== 'won' && bet.status !== 'lost') continue;
    if (!stats[bet.email]) stats[bet.email] = { name: bet.name, net: 0, won: 0, lost: 0 };
    if (bet.status === 'won') {
      stats[bet.email].net += +(bet.stake * bet.price_decimal - bet.stake).toFixed(0);
      stats[bet.email].won += 1;
    } else {
      stats[bet.email].net -= bet.stake;
      stats[bet.email].lost += 1;
    }
  }

  const rows = Object.entries(stats)
    .map(([email, s]) => ({ email, ...s }))
    .sort((a, b) => b.net - a.net);

  const medals = ['🥇', '🥈', '🥉'];

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
          損益排行
        </div>
        <div style={{ fontSize: 12, color: '#a89a72' }}>
          {rows.length} 人已有已結算注單
        </div>
      </header>

      <div style={{ padding: '14px' }}>
        {rows.length === 0 ? (
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
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
            尚無已結算注單
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map((row, i) => {
              const isMe = row.email === session.email;
              const netColor = row.net > 0 ? '#4ade80' : row.net < 0 ? '#f87171' : '#a89a72';
              const settled = row.won + row.lost;
              const winRate = settled > 0 ? Math.round((row.won / settled) * 100) : 0;

              return (
                <div
                  key={row.email}
                  style={{
                    background: isMe
                      ? 'linear-gradient(135deg, rgba(18,52,38,0.98) 0%, rgba(12,42,28,0.99) 100%)'
                      : 'linear-gradient(135deg, rgba(15,45,34,0.95) 0%, rgba(10,36,25,0.98) 100%)',
                    border: isMe
                      ? '1px solid rgba(212,175,55,0.35)'
                      : '1px solid rgba(212,175,55,0.15)',
                    borderRadius: 12,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  {/* Rank */}
                  <div
                    style={{
                      width: 32,
                      textAlign: 'center',
                      fontSize: i < 3 ? 22 : 14,
                      fontWeight: 700,
                      color: i < 3 ? undefined : '#6b7a6e',
                      flexShrink: 0,
                    }}
                  >
                    {i < 3 ? medals[i] : `#${i + 1}`}
                  </div>

                  {/* Name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: isMe ? 700 : 600,
                          color: isMe ? '#D4AF37' : '#f0ead6',
                        }}
                      >
                        {row.name}
                      </span>
                      {isMe && (
                        <span
                          style={{
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
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7a6e' }}>
                      {settled} 注已結算 · 勝率 {winRate}%（{row.won}贏 {row.lost}輸）
                    </div>
                  </div>

                  {/* Net P&L */}
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: netColor,
                      flexShrink: 0,
                      fontFamily: 'var(--font-serif), serif',
                    }}
                  >
                    {row.net > 0 ? `+${row.net}` : row.net}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

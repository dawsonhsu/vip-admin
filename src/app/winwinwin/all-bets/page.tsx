import { redirect } from 'next/navigation';
import { getSessionFromCookies } from '@/lib/winwinwin/auth';
import { getBets } from '@/lib/winwinwin/sheets';
import BottomNav from '../components/BottomNav';
import BetList from '../components/BetList';

export const dynamic = 'force-dynamic';

export default async function WinWinWinAllBetsPage() {
  const session = getSessionFromCookies();
  if (!session) redirect('/winwinwin');

  const bets = await getBets();
  const playerCount = new Set(bets.map((b) => b.name)).size;

  return (
    <div style={{ minHeight: '100vh', padding: '0 0 86px', boxSizing: 'border-box' }}>
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
          所有注單
        </div>
        <div style={{ fontSize: 12, color: '#a89a72' }}>
          {bets.length} 筆 · {playerCount} 人參與 · 登入：{session.name}
        </div>
      </header>

      <div style={{ padding: '14px 14px 0' }}>
        <BetList
          bets={bets}
          currentUserEmail={session.email}
          enableNameFilter
          emptyHint="目前沒有下注紀錄"
        />
      </div>

      <BottomNav />
    </div>
  );
}

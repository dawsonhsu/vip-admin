import { redirect } from 'next/navigation';
import { getSessionFromCookies } from '@/lib/winwinwin/auth';
import { getBets } from '@/lib/winwinwin/sheets';
import type { BetRow } from '@/lib/winwinwin/types';
import { formatTaipeiDateTime as formatTaipeiTime } from '@/lib/winwinwin/format';
import BottomNav from '../components/BottomNav';

export const dynamic = 'force-dynamic';

function BetCard({ bet }: { bet: BetRow }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: 14,
        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 13 }}>
        <span>{bet.name}</span>
        <span>{formatTaipeiTime(bet.created_at)}</span>
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, marginTop: 8 }}>
        {bet.bet_type === 'match' ? bet.match_name : '冠軍盤'}
      </div>
      <div style={{ marginTop: 6, color: '#334155' }}>
        {bet.market_label_zh}
        {bet.line ? ` ${bet.line}` : ''} - {bet.selection_label_zh} @ {bet.price_decimal.toFixed(2)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontWeight: 700 }}>
        <span>下注：{bet.stake}</span>
        <span style={{ color: '#1668dc' }}>狀態：{bet.status}</span>
      </div>
    </div>
  );
}

export default async function WinWinWinAllBetsPage() {
  const session = getSessionFromCookies();
  if (!session) redirect('/winwinwin');

  const bets = await getBets();

  return (
    <div style={{ minHeight: '100vh', padding: '18px 14px 86px', boxSizing: 'border-box' }}>
      <header style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>所有人的注單</div>
        <div style={{ color: '#64748b', marginTop: 4 }}>登入：{session.name}</div>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {bets.length === 0 ? (
          <div style={{ padding: 18, background: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
            目前沒有下注紀錄。
          </div>
        ) : (
          bets.map((bet) => <BetCard key={bet.bet_id} bet={bet} />)
        )}
      </section>

      <BottomNav />
    </div>
  );
}

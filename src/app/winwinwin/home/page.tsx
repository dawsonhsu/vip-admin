import { redirect } from 'next/navigation';
import { getSessionFromCookies } from '@/lib/winwinwin/auth';
import { getMatches, getOdds } from '@/lib/winwinwin/sheets';
import BottomNav from '../components/BottomNav';
import MatchCard from '../components/MatchCard';
import DataFreshness from '../components/DataFreshness';

export const dynamic = 'force-dynamic';

export default async function WinWinWinHomePage() {
  const session = getSessionFromCookies();
  if (!session) redirect('/winwinwin');

  const [matches, oddsRows] = await Promise.all([getMatches(), getOdds()]);
  const latestUpdated = matches
    .map((m) => m.updated_at)
    .filter(Boolean)
    .sort()
    .pop() || '';

  return (
    <div style={{ minHeight: '100vh', padding: '18px 14px 86px', boxSizing: 'border-box' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800 }}>🏆 winwinwin</div>
        <div style={{ color: '#475569', fontWeight: 700 }}>👤 {session.name}</div>
      </header>

      <div style={{ marginBottom: 14 }}>
        <DataFreshness updatedAt={latestUpdated} label="賽事資料" />
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {matches.length === 0 ? (
          <div style={{ padding: 18, background: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
            目前沒有可顯示的賽事。
          </div>
        ) : (
          matches.map((match) => {
            const mainOdds = oddsRows
              .filter(
                (odds) =>
                  odds.api_match_id === match.api_match_id &&
                  odds.market_category === 'Main' &&
                  odds.market_type === 'moneyline',
              )
              .slice(0, 3);

            return <MatchCard key={match.api_match_id} match={match} mainOdds={mainOdds} />;
          })
        )}
      </section>

      <BottomNav />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { getSessionFromCookies } from '@/lib/winwinwin/auth';
import { getMatches, getOdds } from '@/lib/winwinwin/sheets';
import BottomNav from '../components/BottomNav';
import MatchCard from '../components/MatchCard';
import DataFreshness from '../components/DataFreshness';

export const dynamic = 'force-dynamic';

// Inline football SVG for header
function FootballSVG() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#D4AF37" strokeWidth="1.8" />
      <path d="M12 2c0 0-2 4-2 10s2 10 2 10" stroke="#D4AF37" strokeWidth="1.2" opacity="0.6" />
      <path d="M2 12h20" stroke="#D4AF37" strokeWidth="1.2" opacity="0.6" />
      <polygon points="12,6 14,10 12,14 10,10" stroke="#D4AF37" strokeWidth="1.2" fill="rgba(212,175,55,0.2)" />
    </svg>
  );
}

export default async function WinWinWinHomePage() {
  const session = getSessionFromCookies();
  if (!session) redirect('/winwinwin');

  const [matches, oddsRows] = await Promise.all([getMatches(), getOdds()]);
  const latestUpdated = matches.map((m) => m.updated_at).filter(Boolean).sort().pop() || '';

  return (
    <div style={{ minHeight: '100vh', padding: '0 0 86px', boxSizing: 'border-box' }}>
      {/* Sticky header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'linear-gradient(180deg, #0B3B2E 0%, rgba(11,59,46,0.97) 100%)',
          borderBottom: '1px solid rgba(212,175,55,0.2)',
          padding: '14px 16px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FootballSVG />
          <span
            style={{
              fontFamily: 'var(--font-serif), serif',
              fontSize: 18,
              fontWeight: 900,
              color: '#f0ead6',
              letterSpacing: '0.06em',
            }}
          >
            世界盃朋友局
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#a89a72',
            background: 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: 999,
            padding: '4px 10px',
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          {session.name}
        </div>
      </header>

      <div style={{ padding: '14px 14px 0' }}>
        {/* Data freshness */}
        <div style={{ marginBottom: 14 }}>
          <DataFreshness updatedAt={latestUpdated} label="賽事資料" />
        </div>

        {/* Section label */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#a89a72',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          開放賽事
        </div>

        {/* Match cards */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {matches.length === 0 ? (
            <div
              style={{
                padding: 24,
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#a89a72',
                textAlign: 'center',
                fontSize: 14,
              }}
            >
              目前沒有可顯示的賽事
            </div>
          ) : (
            matches.map((match, index) => {
              const mainOdds = oddsRows
                .filter(
                  (odds) =>
                    odds.api_match_id === match.api_match_id &&
                    odds.market_category === 'Main' &&
                    odds.market_type === 'moneyline',
                )
                .slice(0, 3);

              return (
                <MatchCard
                  key={match.api_match_id}
                  match={match}
                  mainOdds={mainOdds}
                  isFirst={index === 0}
                />
              );
            })
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}

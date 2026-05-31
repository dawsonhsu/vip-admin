import { redirect } from 'next/navigation';
import { getSessionFromCookies } from '@/lib/winwinwin/auth';
import { getOutrights } from '@/lib/winwinwin/sheets';
import type { BetSelection, OutrightRow } from '@/lib/winwinwin/types';
import BottomNav from '../components/BottomNav';
import OddsButton from '../components/OddsButton';
import DataFreshness from '../components/DataFreshness';

export const dynamic = 'force-dynamic';

function toSelection(row: OutrightRow): BetSelection {
  return {
    bet_type: 'outright',
    event_label: row.description_zh,
    outright_id: row.outright_id,
    selection_id: row.selection_id,
    market_category: row.category_zh,
    market_label_zh: row.description_zh,
    selection_label_zh: row.selection_label,
    line: '',
    price_decimal: row.price_decimal,
  };
}

// Category icon map — SVG inline
function CategoryIcon({ category }: { category: string }) {
  if (category.includes('冠軍') || category.includes('champion')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <path d="M8 21h8M12 17v4M7 4H5a2 2 0 00-2 2v1c0 3.31 2.69 6 6 6h6c3.31 0 6-2.69 6-6V6a2 2 0 00-2-2h-2" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 4v7a5 5 0 0010 0V4H7z" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="rgba(212,175,55,0.15)" />
      </svg>
    );
  }
  if (category.includes('第一') || category.includes('first')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="8" r="5" stroke="#D4AF37" strokeWidth="1.8" />
        <path d="M7 21l5-8 5 8" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  // Default — star / qualify icon
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M12 2l3 7h7l-6 4.5 2.3 7L12 17l-6.3 3.5L8 13.5 2 9h7z" stroke="#D4AF37" strokeWidth="1.6" fill="rgba(212,175,55,0.12)" />
    </svg>
  );
}

export default async function WinWinWinOutrightsPage() {
  const session = getSessionFromCookies();
  if (!session) redirect('/winwinwin');

  const outrights = await getOutrights();
  const latestUpdated = outrights.map((r) => r.updated_at).filter(Boolean).sort().pop() || '';

  const grouped = outrights.reduce<Record<string, OutrightRow[]>>((acc, row) => {
    const key = `${row.category_zh}｜${row.description_zh}`;
    acc[key] = [...(acc[key] ?? []), row];
    return acc;
  }, {});

  // Group by category for section headers
  const byCategory: Record<string, { description: string; rows: OutrightRow[] }[]> = {};
  Object.entries(grouped).forEach(([key, rows]) => {
    const [category, description] = key.split('｜');
    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push({ description, rows });
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M8 21h8M12 17v4M7 4H5a2 2 0 00-2 2v1c0 3.31 2.69 6 6 6h6c3.31 0 6-2.69 6-6V6a2 2 0 00-2-2h-2" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 4v7a5 5 0 0010 0V4H7z" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="rgba(212,175,55,0.15)" />
          </svg>
          <span
            style={{
              fontFamily: 'var(--font-serif), serif',
              fontSize: 18,
              fontWeight: 900,
              color: '#f0ead6',
              letterSpacing: '0.04em',
            }}
          >
            冠軍盤
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#a89a72', marginLeft: 28 }}>冠軍 · 小組第一 · 小組出線</div>
      </header>

      <div style={{ padding: '14px 14px 0' }}>
        <div style={{ marginBottom: 16 }}>
          <DataFreshness
            updatedAt={latestUpdated}
            label="冠軍盤資料"
            lagAfter={1200}
            anomalyAfter={2700}
          />
        </div>

        {Object.keys(byCategory).length === 0 ? (
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
            目前沒有可顯示的冠軍盤
          </div>
        ) : (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Object.entries(byCategory).map(([category, items]) => (
              <div key={category}>
                {/* Category header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    marginBottom: 10,
                  }}
                >
                  <CategoryIcon category={category} />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#D4AF37',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {category}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(212,175,55,0.15)' }} />
                </div>

                {/* Items under this category */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.map(({ description, rows }) => (
                    <div
                      key={description}
                      style={{
                        background: 'linear-gradient(135deg, rgba(15,45,34,0.95) 0%, rgba(10,36,25,0.98) 100%)',
                        border: '1px solid rgba(212,175,55,0.22)',
                        borderRadius: 12,
                        padding: '14px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 2,
                          background: 'linear-gradient(90deg, rgba(212,175,55,0.4) 0%, transparent 100%)',
                        }}
                      />
                      <div
                        style={{
                          fontFamily: 'var(--font-serif), serif',
                          fontSize: 15,
                          fontWeight: 700,
                          color: '#f0ead6',
                          marginBottom: 12,
                          letterSpacing: '0.02em',
                        }}
                      >
                        {description}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {rows.map((row) => (
                          <div key={`${row.outright_id}-${row.selection_id}`} style={{ flex: '1 1 100px', minWidth: 90 }}>
                            <OddsButton selection={toSelection(row)} compact />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

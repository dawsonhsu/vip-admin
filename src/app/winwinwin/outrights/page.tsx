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

export default async function WinWinWinOutrightsPage() {
  const session = getSessionFromCookies();
  if (!session) redirect('/winwinwin');

  const outrights = await getOutrights();
  const latestUpdated = outrights
    .map((r) => r.updated_at)
    .filter(Boolean)
    .sort()
    .pop() || '';
  const grouped = outrights.reduce<Record<string, OutrightRow[]>>((acc, row) => {
    const key = `${row.category_zh}｜${row.description_zh}`;
    acc[key] = [...(acc[key] ?? []), row];
    return acc;
  }, {});

  return (
    <div style={{ minHeight: '100vh', padding: '18px 14px 86px', boxSizing: 'border-box' }}>
      <header style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>冠軍盤</div>
        <div style={{ color: '#64748b', marginTop: 4 }}>冠軍 / 小組第一 / 小組出線</div>
      </header>

      <div style={{ marginBottom: 14 }}>
        <DataFreshness updatedAt={latestUpdated} label="冠軍盤資料" />
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Object.entries(grouped).length === 0 ? (
          <div style={{ padding: 18, background: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
            目前沒有可顯示的冠軍盤。
          </div>
        ) : (
          Object.entries(grouped).map(([key, rows]) => {
            const [category, description] = key.split('｜');
            return (
              <div
                key={key}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 14,
                  boxShadow: '0 6px 18px rgba(15, 23, 42, 0.05)',
                }}
              >
                <div style={{ color: '#1668dc', fontWeight: 800, fontSize: 13 }}>{category}</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{description}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {rows.map((row) => (
                    <OddsButton
                      key={`${row.outright_id}-${row.selection_id}`}
                      selection={toSelection(row)}
                      compact
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </section>

      <BottomNav />
    </div>
  );
}

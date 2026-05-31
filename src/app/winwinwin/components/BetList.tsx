'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Empty } from 'antd';
import type { BetRow } from '@/lib/winwinwin/types';
import BetCard from './BetCard';

const PAGE_SIZE = 10;

type Props = {
  bets: BetRow[];
  currentUserEmail: string;
  enableNameFilter?: boolean;
  emptyHint?: string;
};

export default function BetList({
  bets,
  currentUserEmail,
  enableNameFilter = false,
  emptyHint = '目前沒有下注紀錄',
}: Props) {
  const [filterName, setFilterName] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const sorted = useMemo(() => {
    return [...bets].sort((a, b) => {
      // descending by created_at; non-parseable times stay at the bottom
      const at = Date.parse(a.created_at);
      const bt = Date.parse(b.created_at);
      const ax = Number.isFinite(at) ? at : 0;
      const bx = Number.isFinite(bt) ? bt : 0;
      return bx - ax;
    });
  }, [bets]);

  const playerCounts = useMemo(() => {
    if (!enableNameFilter) return null;
    const counts: Record<string, number> = {};
    sorted.forEach((bet) => {
      counts[bet.name] = (counts[bet.name] ?? 0) + 1;
    });
    return counts;
  }, [enableNameFilter, sorted]);

  const filtered = useMemo(() => {
    if (!filterName) return sorted;
    return sorted.filter((bet) => bet.name === filterName);
  }, [sorted, filterName]);

  // Reset visible count when filter changes.
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [filterName, bets.length]);

  const slice = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  // IntersectionObserver: load more when sentinel enters viewport.
  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible((v) => Math.min(v + PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, filtered.length]);

  function handleNameClick(name: string) {
    setFilterName((current) => (current === name ? null : name));
  }

  return (
    <div>
      {enableNameFilter && playerCounts && Object.keys(playerCounts).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => setFilterName(null)}
            style={{
              fontSize: 11,
              border: 'none',
              cursor: 'pointer',
              padding: '3px 10px',
              borderRadius: 999,
              fontWeight: 600,
              color: !filterName ? '#0B3B2E' : '#a89a72',
              background: !filterName ? '#D4AF37' : 'rgba(255,255,255,0.05)',
              fontFamily: 'inherit',
            }}
          >
            全部 {sorted.length}
          </button>
          {Object.entries(playerCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([name, count]) => {
              const active = filterName === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleNameClick(name)}
                  style={{
                    fontSize: 11,
                    border: active
                      ? '1px solid #D4AF37'
                      : '1px solid rgba(255,255,255,0.08)',
                    background: active ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.05)',
                    color: active ? '#D4AF37' : '#a89a72',
                    cursor: 'pointer',
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                  }}
                >
                  {name} {count}
                </button>
              );
            })}
        </div>
      )}

      {filtered.length === 0 ? (
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
          {filterName ? `${filterName} 還沒下注` : emptyHint}
        </div>
      ) : (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {slice.map((bet) => (
            <BetCard
              key={bet.bet_id}
              bet={bet}
              isCurrentUser={bet.email === currentUserEmail}
              onNameClick={enableNameFilter ? handleNameClick : undefined}
            />
          ))}
        </section>
      )}

      {hasMore && (
        <div
          ref={sentinelRef}
          style={{
            textAlign: 'center',
            padding: '20px 0 4px',
            fontSize: 11,
            color: '#6b7a6e',
            letterSpacing: '0.05em',
          }}
        >
          載入中…（顯示 {slice.length} / {filtered.length}）
        </div>
      )}

      {!hasMore && filtered.length > PAGE_SIZE && (
        <div style={{ textAlign: 'center', padding: '20px 0 4px', fontSize: 11, color: '#6b7a6e' }}>
          已顯示全部 {filtered.length} 筆
        </div>
      )}
    </div>
  );
}

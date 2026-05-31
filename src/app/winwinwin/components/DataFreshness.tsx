'use client';

import { useEffect, useState } from 'react';
import { formatTaipeiTime } from '@/lib/winwinwin/format';

type Props = {
  updatedAt: string;
  label?: string;
};

export default function DataFreshness({ updatedAt, label = '賽事資料' }: Props) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!updatedAt) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: '#6b7a6e',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 999,
          padding: '3px 10px',
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#6b7a6e',
          }}
        />
        {label}：尚未更新
      </div>
    );
  }

  const updated = new Date(updatedAt);
  const now = new Date();
  const diffSec = Math.max(0, Math.floor((now.getTime() - updated.getTime()) / 1000));
  void tick;

  let color = '#4ade80';
  let dotColor = '#22c55e';
  let status = '即時';
  if (diffSec >= 300) {
    color = '#f87171';
    dotColor = '#ef4444';
    status = '異常';
  } else if (diffSec >= 120) {
    color = '#fbbf24';
    dotColor = '#f59e0b';
    status = '延遲';
  }

  const relative = relativeZh(diffSec);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        color,
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${dotColor}44`,
        borderRadius: 999,
        padding: '3px 10px',
        letterSpacing: '0.02em',
      }}
      title={`最後更新：${formatTaipeiTime(updatedAt)}（${relative}）`}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: dotColor,
          boxShadow: `0 0 5px ${dotColor}`,
        }}
      />
      {label} · {status}（{relative}）
    </div>
  );
}

function relativeZh(sec: number) {
  if (sec < 60) return `${sec} 秒前`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分前`;
  const hr = Math.floor(min / 60);
  return `${hr} 小時前`;
}

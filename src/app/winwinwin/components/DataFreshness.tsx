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
      <div style={{ fontSize: 12, color: '#9ca3af' }}>
        {label}：尚未更新
      </div>
    );
  }

  const updated = new Date(updatedAt);
  const now = new Date();
  const diffSec = Math.max(0, Math.floor((now.getTime() - updated.getTime()) / 1000));
  void tick;

  let color = '#16a34a';   // green
  let dotColor = '#22c55e';
  let status = '正常';
  if (diffSec >= 300) {
    color = '#dc2626';
    dotColor = '#ef4444';
    status = '異常';
  } else if (diffSec >= 120) {
    color = '#d97706';
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
        fontSize: 12,
        color,
        background: '#f8fafc',
        border: '1px solid #e5e7eb',
        borderRadius: 999,
        padding: '4px 10px',
      }}
      title={`最後更新：${formatTaipeiTime(updatedAt)}（${relative}）`}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: dotColor,
        }}
      />
      <span>
        {label} · {status}（{relative}）
      </span>
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

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { AppstoreOutlined, HomeOutlined, OrderedListOutlined, TrophyOutlined } from '@ant-design/icons';

const tabs = [
  { href: '/winwinwin/home', label: '首頁', icon: <HomeOutlined /> },
  { href: '/winwinwin/outrights', label: '冠軍', icon: <TrophyOutlined /> },
  { href: '/winwinwin/my-bets', label: '我的', icon: <OrderedListOutlined /> },
  { href: '/winwinwin/all-bets', label: '全部', icon: <AppstoreOutlined /> },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 0,
        transform: 'translateX(-50%)',
        width: 'min(100%, 430px)',
        background: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        boxShadow: '0 -8px 20px rgba(15, 23, 42, 0.08)',
        zIndex: 20,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', height: 64 }}>
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
          return (
            <button
              key={tab.href}
              type="button"
              onClick={() => router.push(tab.href)}
              style={{
                border: 0,
                background: 'transparent',
                color: active ? '#1668dc' : '#64748b',
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

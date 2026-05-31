'use client';

import { usePathname, useRouter } from 'next/navigation';

// SVG icons — inline, no extra package
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 12L12 3l9 9"
        stroke={active ? '#D4AF37' : '#6b7a6e'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"
        stroke={active ? '#D4AF37' : '#6b7a6e'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrophyIcon({ active }: { active: boolean }) {
  const c = active ? '#D4AF37' : '#6b7a6e';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 21h8M12 17v4M7 4H5a2 2 0 00-2 2v1c0 3.31 2.69 6 6 6h6c3.31 0 6-2.69 6-6V6a2 2 0 00-2-2h-2"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 4v7a5 5 0 0010 0V4H7z"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MyBetsIcon({ active }: { active: boolean }) {
  const c = active ? '#D4AF37' : '#6b7a6e';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="3" width="14" height="18" rx="2" stroke={c} strokeWidth="2" />
      <line x1="9" y1="8" x2="15" y2="8" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="9" y1="12" x2="15" y2="12" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="9" y1="16" x2="12" y2="16" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function AllBetsIcon({ active }: { active: boolean }) {
  const c = active ? '#D4AF37' : '#6b7a6e';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="2" />
      <line x1="3" y1="9" x2="21" y2="9" stroke={c} strokeWidth="1.5" />
      <line x1="3" y1="15" x2="21" y2="15" stroke={c} strokeWidth="1.5" />
      <path d="M11.5 3C10 7 10 17 11.5 21" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12.5 3C14 7 14 17 12.5 21" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const tabs = [
  { href: '/winwinwin/home', label: '賽事', Icon: HomeIcon },
  { href: '/winwinwin/outrights', label: '冠軍', Icon: TrophyIcon },
  { href: '/winwinwin/my-bets', label: '我的', Icon: MyBetsIcon },
  { href: '/winwinwin/all-bets', label: '全部', Icon: AllBetsIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav
      style={{
        position: 'sticky',
        bottom: 0,
        marginTop: 'auto',
        width: '100%',
        background: 'linear-gradient(180deg, #0a2419 0%, #071f18 100%)',
        borderTop: '1px solid rgba(212,175,55,0.25)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
        zIndex: 20,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', height: 64 }}>
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <button
              key={href}
              type="button"
              onClick={() => router.push(href)}
              style={{
                border: 0,
                background: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                cursor: 'pointer',
                padding: '8px 0',
                position: 'relative',
              }}
            >
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '20%',
                    width: '60%',
                    height: 2,
                    background: '#D4AF37',
                    borderRadius: '0 0 2px 2px',
                  }}
                />
              )}
              <Icon active={active} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#D4AF37' : '#6b7a6e',
                  fontFamily: 'var(--font-sans), system-ui, sans-serif',
                  letterSpacing: '0.02em',
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

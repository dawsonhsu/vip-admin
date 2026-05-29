'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  BellOutlined,
  CustomerServiceOutlined,
  BgColorsOutlined,
  CrownFilled,
  WalletOutlined,
  DownloadOutlined,
  UploadOutlined,
  SwapOutlined,
  HistoryOutlined,
  GiftOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  LogoutOutlined,
  RightOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

const OPERATIONS: { key: string; label: string; icon: React.ReactNode; color: string; href?: string }[] = [
  { key: 'deposit', label: 'Deposit', icon: <DownloadOutlined />, color: '#FF3546', href: '/client-demo/deposit' },
  { key: 'withdraw', label: 'Withdraw', icon: <UploadOutlined />, color: '#FF9A2E' },
  { key: 'transfer', label: 'Transfer', icon: <SwapOutlined />, color: '#6366F1' },
  { key: 'records', label: 'Records', icon: <HistoryOutlined />, color: '#14B8A6' },
  { key: 'bonus', label: 'Bonus', icon: <GiftOutlined />, color: '#EC4899' },
  { key: 'invite', label: 'Invite', icon: <TeamOutlined />, color: '#A855F7' },
  { key: 'kyc', label: 'KYC', icon: <SafetyCertificateOutlined />, color: '#10B981' },
  { key: 'settings', label: 'Settings', icon: <SettingOutlined />, color: '#8a8a99' },
];

const LIST_ITEMS = [
  { label: 'Bank Card Management', icon: <WalletOutlined /> },
  { label: 'Transaction Password', icon: <SafetyCertificateOutlined /> },
  { label: 'Help Center', icon: <QuestionCircleOutlined /> },
];

export default function MinePage() {
  const router = useRouter();

  return (
    <div style={{ background: '#0e1018', color: '#fff', minHeight: '100%' }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 14px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FFD700 0%, #FF9A2E 100%)',
            border: '2px solid #FFD700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1a1a1a',
            fontSize: 20,
            fontWeight: 800,
            position: 'relative',
          }}
        >
          D
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              padding: '1px 6px',
              background: '#FF3546',
              borderRadius: 8,
              fontSize: 9,
              fontWeight: 700,
              color: '#fff',
              border: '1.5px solid #0e1018',
            }}
          >
            VIP 7
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#e8e8e8' }}>darren888</div>
          <div style={{ fontSize: 11, color: '#8a8a99', marginTop: 2 }}>UID: 270898</div>
        </div>
        <IconBtn icon={<BgColorsOutlined />} />
        <IconBtn icon={<BellOutlined />} dot />
        <IconBtn icon={<CustomerServiceOutlined />} />
      </div>

      {/* VIP card */}
      <div style={{ padding: '14px 14px 0' }}>
        <div
          style={{
            background:
              'linear-gradient(135deg, rgba(255, 215, 0, 0.18) 0%, rgba(255, 154, 46, 0.08) 100%)',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CrownFilled style={{ fontSize: 22, color: '#FFD700' }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FFD700' }}>VIP Level 7</div>
                <div style={{ fontSize: 10, color: '#8a8a99', marginTop: 2 }}>
                  68,420 XP · Next: VIP 8 (100,000)
                </div>
              </div>
            </div>
            <RightOutlined style={{ color: '#FFD700', fontSize: 12 }} />
          </div>
          {/* Progress bar */}
          <div
            style={{
              marginTop: 10,
              height: 6,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '68%',
                height: '100%',
                background: 'linear-gradient(90deg, #FFD700 0%, #FF9A2E 100%)',
                borderRadius: 3,
              }}
            />
          </div>
        </div>
      </div>

      {/* Balance card */}
      <div style={{ padding: '14px 14px 0' }}>
        <div
          style={{
            background: '#1a1c23',
            border: '1px solid #2a2d36',
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 12, color: '#8a8a99' }}>Main Balance</div>
            <ReloadOutlined style={{ color: '#8a8a99', fontSize: 12 }} />
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#e8e8e8',
              marginTop: 4,
            }}
          >
            ₱ 12,485.50
          </div>
          <div
            style={{
              marginTop: 10,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 4,
            }}
          >
            {[
              { l: 'JILI', v: '₱120.00' },
              { l: 'PG', v: '₱0.00' },
              { l: 'PP', v: '₱45.00' },
            ].map((w) => (
              <div key={w.l} style={{ fontSize: 11 }}>
                <div style={{ color: '#5a5a66' }}>{w.l}</div>
                <div style={{ color: '#e8e8e8', fontWeight: 600, marginTop: 1 }}>{w.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invite banner */}
      <div style={{ padding: '12px 14px 0' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Invite & Earn</div>
            <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2 }}>
              Up to 30% commission · Lifetime
            </div>
          </div>
          <button
            style={{
              background: '#fff',
              border: 'none',
              color: '#6366F1',
              padding: '4px 12px',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Share
          </button>
        </div>
      </div>

      {/* Operations grid */}
      <div style={{ padding: '14px 14px 0' }}>
        <div
          style={{
            background: '#1a1c23',
            border: '1px solid #2a2d36',
            borderRadius: 12,
            padding: '14px 8px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
          }}
        >
          {OPERATIONS.map((op) => (
            <div
              key={op.key}
              onClick={() => op.href && router.push(op.href)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                cursor: op.href ? 'pointer' : 'default',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: `${op.color}22`,
                  border: `1px solid ${op.color}44`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: op.color,
                  fontSize: 18,
                }}
              >
                {op.icon}
              </div>
              <div style={{ fontSize: 10, color: '#e8e8e8', fontWeight: 500 }}>{op.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* List items */}
      <div style={{ padding: '14px 14px 0' }}>
        <div
          style={{
            background: '#1a1c23',
            border: '1px solid #2a2d36',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {LIST_ITEMS.map((it, i) => (
            <div
              key={it.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 14px',
                borderBottom: i === LIST_ITEMS.length - 1 ? 'none' : '1px solid #2a2d36',
                fontSize: 13,
                color: '#e8e8e8',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#8a8a99' }}>{it.icon}</span>
                {it.label}
              </div>
              <RightOutlined style={{ color: '#5a5a66', fontSize: 11 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div style={{ padding: '14px 14px 0' }}>
        <button
          style={{
            width: '100%',
            padding: '12px 0',
            background: '#1a1c23',
            border: '1px solid #2a2d36',
            color: '#FF3546',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <LogoutOutlined />
          Logout
        </button>
      </div>

      {/* Version */}
      <div
        style={{
          textAlign: 'center',
          padding: '12px 0 4px',
          fontSize: 10,
          color: '#3a3a44',
        }}
      >
        Filbet v1.2.22
      </div>
    </div>
  );
}

function IconBtn({ icon, dot }: { icon: React.ReactNode; dot?: boolean }) {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: '#1a1c23',
        border: '1px solid #2a2d36',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e8e8e8',
        fontSize: 14,
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      {icon}
      {dot && (
        <span
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 6,
            height: 6,
            background: '#FF3546',
            borderRadius: '50%',
          }}
        />
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import {
  CustomerServiceOutlined,
  CheckCircleFilled,
  ShoppingFilled,
  GiftFilled,
} from '@ant-design/icons';

const TABS = ['Tasks', 'Mall'] as const;
type Tab = (typeof TABS)[number];

const TASKS = [
  { id: 't1', title: 'Daily Check-in', reward: 5, status: 'claim', desc: 'Day 3 / 7 streak' },
  { id: 't2', title: 'Deposit ₱100', reward: 20, status: 'done', desc: 'Completed today' },
  { id: 't3', title: 'Play 10 Slot Rounds', reward: 15, status: 'progress', desc: '6 / 10 today' },
  { id: 't4', title: 'Invite 1 Friend', reward: 100, status: 'progress', desc: '0 / 1 this week' },
  { id: 't5', title: 'Bind Bank Account', reward: 30, status: 'go', desc: 'One-time bonus' },
];

const GOODS = [
  { id: 'g1', name: 'iPhone 15 Pro', price: 9999, img: '#FF3546', tag: 'HOT' },
  { id: 'g2', name: '₱500 Cash Bonus', price: 500, img: '#FF9A2E', tag: 'POPULAR' },
  { id: 'g3', name: 'AirPods Pro', price: 3500, img: '#6366F1' },
  { id: 'g4', name: '50 Free Spins', price: 80, img: '#14B8A6', tag: 'NEW' },
  { id: 'g5', name: '₱100 Voucher', price: 100, img: '#A855F7' },
  { id: 'g6', name: 'Mystery Box', price: 60, img: '#EC4899', tag: 'HOT' },
];

export default function FilcoinPage() {
  const [tab, setTab] = useState<Tab>('Tasks');

  return (
    <div style={{ background: '#0e1018', color: '#fff', minHeight: '100%' }}>
      {/* App bar */}
      <div
        style={{
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
        }}
      >
        <div style={{ display: 'flex', gap: 18 }}>
          {TABS.map((t) => {
            const active = tab === t;
            return (
              <div
                key={t}
                onClick={() => setTab(t)}
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: active ? '#fff' : '#5a5a66',
                  position: 'relative',
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
              >
                {t}
                {active && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 6,
                      height: 6,
                      background: '#FFD700',
                      borderRadius: '50%',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <CustomerServiceOutlined style={{ fontSize: 20, color: '#e8e8e8' }} />
      </div>

      {/* Balance card */}
      <div style={{ padding: '8px 14px 0' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FF9A2E 100%)',
            borderRadius: 12,
            padding: 16,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)', fontWeight: 600 }}>
            Filcoin Balance
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: '#1a1a1a',
              marginTop: 4,
              letterSpacing: 0.5,
            }}
          >
            1,248
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              style={{
                padding: '6px 14px',
                background: '#1a1a1a',
                border: 'none',
                color: '#FFD700',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Earn More
            </button>
            <button
              style={{
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.4)',
                border: 'none',
                color: '#1a1a1a',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              History
            </button>
          </div>
          <div
            style={{
              position: 'absolute',
              right: -10,
              top: -10,
              fontSize: 90,
              color: 'rgba(0,0,0,0.08)',
            }}
          >
            <GiftFilled />
          </div>
        </div>
      </div>

      {tab === 'Tasks' ? <TasksList /> : <MallList />}
    </div>
  );
}

function TasksList() {
  return (
    <div style={{ padding: '14px 14px 0' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e8e8', marginBottom: 10 }}>
        Daily Tasks
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {TASKS.map((t) => (
          <div
            key={t.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 14px',
              background: '#1a1c23',
              border: '1px solid #2a2d36',
              borderRadius: 10,
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#e8e8e8',
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                }}
              >
                {t.title}
                <span
                  style={{
                    fontSize: 10,
                    color: '#FFD700',
                    background: 'rgba(255,215,0,0.1)',
                    padding: '1px 6px',
                    borderRadius: 4,
                    fontWeight: 700,
                  }}
                >
                  +{t.reward}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#8a8a99', marginTop: 3 }}>{t.desc}</div>
            </div>
            <TaskButton status={t.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskButton({ status }: { status: string }) {
  if (status === 'done')
    return <CheckCircleFilled style={{ fontSize: 22, color: '#14E65A' }} />;
  const label = status === 'claim' ? 'Claim' : status === 'go' ? 'Go' : 'Continue';
  const isClaim = status === 'claim';
  return (
    <button
      style={{
        padding: '4px 14px',
        background: isClaim ? '#FFD700' : 'transparent',
        border: isClaim ? 'none' : '1px solid #FF3546',
        color: isClaim ? '#1a1a1a' : '#FF3546',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function MallList() {
  return (
    <div style={{ padding: '14px 14px 16px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e8e8', marginBottom: 10 }}>
        Filcoin Mall
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
        }}
      >
        {GOODS.map((g) => (
          <div
            key={g.id}
            style={{
              borderRadius: 10,
              background: '#1a1c23',
              border: '1px solid #2a2d36',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                aspectRatio: '1 / 0.85',
                background: `linear-gradient(135deg, ${g.img} 0%, ${shade(g.img)} 100%)`,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {g.tag && (
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    padding: '2px 7px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: 4,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 0.4,
                  }}
                >
                  {g.tag}
                </div>
              )}
              <ShoppingFilled style={{ fontSize: 40, color: 'rgba(255,255,255,0.85)' }} />
            </div>
            <div style={{ padding: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e8e8e8', minHeight: 32 }}>
                {g.name}
              </div>
              <div
                style={{
                  marginTop: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: '#FFD700' }}>
                  {g.price.toLocaleString()}
                </div>
                <button
                  style={{
                    padding: '3px 10px',
                    background: '#FF3546',
                    border: 'none',
                    color: '#fff',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Redeem
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function shade(hex: string): string {
  const c = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((c >> 16) & 0xff) - 40);
  const g = Math.max(0, ((c >> 8) & 0xff) - 40);
  const b = Math.max(0, (c & 0xff) - 40);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

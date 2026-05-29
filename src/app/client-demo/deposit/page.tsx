'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LeftOutlined,
  QuestionCircleOutlined,
  CheckCircleFilled,
  CustomerServiceOutlined,
} from '@ant-design/icons';

const CHANNELS = [
  { key: 'gcash', label: 'GCash', sub: 'Instant', logo: '#0085FF' },
  { key: 'maya', label: 'Maya', sub: 'Instant', logo: '#00C896' },
  { key: 'bank', label: 'Bank', sub: '5-30 min', logo: '#FF9A2E' },
  { key: 'usdt', label: 'USDT', sub: 'Crypto', logo: '#26A17B' },
];

const QUICK_AMOUNTS = [100, 300, 500, 1000, 3000, 5000, 10000, 20000];

export default function DepositPage() {
  const router = useRouter();
  const [channel, setChannel] = useState('gcash');
  const [amount, setAmount] = useState<string>('500');

  const amountNum = Number(amount) || 0;
  const bonusEligible = amountNum >= 100;
  const bonusAmount = Math.min(amountNum * 2, 8888);

  return (
    <div style={{ background: '#0e1018', color: '#fff', minHeight: '100%', position: 'relative' }}>
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
        <LeftOutlined
          onClick={() => router.back()}
          style={{ fontSize: 18, color: '#e8e8e8', cursor: 'pointer' }}
        />
        <div style={{ fontSize: 17, fontWeight: 700, color: '#e8e8e8' }}>Deposit</div>
        <CustomerServiceOutlined style={{ fontSize: 18, color: '#e8e8e8' }} />
      </div>

      {/* Channels */}
      <div style={{ padding: '12px 14px 0' }}>
        <SectionLabel text="Payment Channel" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {CHANNELS.map((c) => {
            const active = channel === c.key;
            return (
              <div
                key={c.key}
                onClick={() => setChannel(c.key)}
                style={{
                  padding: '10px 6px',
                  borderRadius: 10,
                  background: active ? 'rgba(255, 53, 70, 0.1)' : '#1a1c23',
                  border: active ? '1.5px solid #FF3546' : '1px solid #2a2d36',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: c.logo,
                    margin: '0 auto 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {c.label.charAt(0)}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#e8e8e8' }}>{c.label}</div>
                <div style={{ fontSize: 9, color: '#8a8a99', marginTop: 1 }}>{c.sub}</div>
                {active && (
                  <CheckCircleFilled
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      color: '#FF3546',
                      fontSize: 12,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Amount input */}
      <div style={{ padding: '16px 14px 0' }}>
        <SectionLabel text="Amount" />
        <div
          style={{
            background: '#1a1c23',
            border: '1px solid #2a2d36',
            borderRadius: 10,
            padding: '14px 14px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 800, color: '#FF3546', marginRight: 8 }}>₱</span>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="0"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: 22,
              fontWeight: 800,
            }}
          />
          {amount && (
            <span
              onClick={() => setAmount('')}
              style={{
                color: '#5a5a66',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Clear
            </span>
          )}
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: '#8a8a99',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Min: ₱100 · Max: ₱500,000</span>
          <span>Fee: ₱0</span>
        </div>

        {/* Quick amounts */}
        <div
          style={{
            marginTop: 10,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
          }}
        >
          {QUICK_AMOUNTS.map((a) => {
            const active = String(a) === amount;
            return (
              <div
                key={a}
                onClick={() => setAmount(String(a))}
                style={{
                  padding: '8px 0',
                  background: active ? 'rgba(255, 53, 70, 0.12)' : '#1a1c23',
                  border: active ? '1px solid #FF3546' : '1px solid #2a2d36',
                  borderRadius: 8,
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: active ? '#FF3546' : '#e8e8e8',
                  cursor: 'pointer',
                }}
              >
                ₱{a.toLocaleString()}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bonus offer */}
      <div style={{ padding: '16px 14px 0' }}>
        <div
          style={{
            background: bonusEligible
              ? 'linear-gradient(135deg, rgba(255, 53, 70, 0.12) 0%, rgba(255, 154, 46, 0.08) 100%)'
              : '#1a1c23',
            border: bonusEligible ? '1px solid rgba(255, 53, 70, 0.4)' : '1px dashed #2a2d36',
            borderRadius: 10,
            padding: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: bonusEligible ? '#FF3546' : '#8a8a99',
              }}
            >
              First Deposit Bonus 200%
            </div>
            <div style={{ fontSize: 11, color: '#8a8a99', marginTop: 3 }}>
              {bonusEligible
                ? `Get extra ₱${bonusAmount.toLocaleString()} on this deposit`
                : 'Deposit ≥ ₱100 to unlock'}
            </div>
          </div>
          {bonusEligible ? (
            <CheckCircleFilled style={{ color: '#14E65A', fontSize: 18 }} />
          ) : (
            <QuestionCircleOutlined style={{ color: '#5a5a66', fontSize: 18 }} />
          )}
        </div>
      </div>

      {/* Hints */}
      <div style={{ padding: '14px 14px 0' }}>
        <div
          style={{
            fontSize: 11,
            color: '#5a5a66',
            lineHeight: 1.6,
          }}
        >
          • Funds arrive within 5 minutes during normal hours.
          <br />• Single-day deposit limit: ₱500,000.
          <br />• Please confirm channel matches your account to avoid loss.
          <br />• Customer service available 24/7.
        </div>
      </div>

      <div style={{ height: 100 }} />

      {/* Bottom fixed CTA */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 24,
          padding: '14px',
          background: 'linear-gradient(180deg, rgba(14,16,24,0) 0%, #0e1018 30%)',
        }}
      >
        <button
          disabled={!amount}
          onClick={() => alert(`Demo: 充值 ₱${amount} via ${channel}`)}
          style={{
            width: '100%',
            padding: '14px 0',
            background: amount
              ? 'linear-gradient(135deg, #FF3546 0%, #FF7D00 100%)'
              : '#2a2d36',
            border: 'none',
            color: '#fff',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 800,
            cursor: amount ? 'pointer' : 'not-allowed',
            opacity: amount ? 1 : 0.6,
            letterSpacing: 0.4,
          }}
        >
          Confirm Deposit {amount ? `· ₱${Number(amount).toLocaleString()}` : ''}
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: '#8a8a99',
        fontWeight: 600,
        marginBottom: 8,
        letterSpacing: 0.4,
      }}
    >
      {text.toUpperCase()}
    </div>
  );
}

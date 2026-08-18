'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LeftOutlined,
  CustomerServiceOutlined,
  CopyOutlined,
  CheckOutlined,
  TeamOutlined,
  FacebookFilled,
  MessageFilled,
  WhatsAppOutlined,
  LinkOutlined,
  UserAddOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
} from '@ant-design/icons';

type Period = 'today' | 'last3' | 'thisWeek' | 'lastWeek' | 'lastMonth';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'last3', label: 'Last 3d' },
  { key: 'thisWeek', label: 'This Wk' },
  { key: 'lastWeek', label: 'Last Wk' },
  { key: 'lastMonth', label: 'Last Mo' },
];

type Stats = {
  newInvite: number;
  totalInvite: number;
  totalDeposit: string;
  depositCount: number;
  firstDepositAmt: string;
  firstDepositUsers: number;
  newFirstAmt: string;
  newFirstUsers: number;
  withdrawalAmt: string;
  withdrawalCount: number;
  claimedComm: string;
  unclaimedComm: string;
  directComm: string;
  otherComm: string;
  validBet: string;
  winLoss: string;
  winLossPositive: boolean;
};

const DATA: Record<Period, Stats> = {
  today: {
    newInvite: 3, totalInvite: 47,
    totalDeposit: '₱8,420', depositCount: 12,
    firstDepositAmt: '₱3,200', firstDepositUsers: 3,
    newFirstAmt: '₱3,200', newFirstUsers: 3,
    withdrawalAmt: '₱2,100', withdrawalCount: 5,
    claimedComm: '₱420.50', unclaimedComm: '₱180.20',
    directComm: '₱320.00', otherComm: '₱100.50',
    validBet: '₱45,200', winLoss: '₱1,240', winLossPositive: false,
  },
  last3: {
    newInvite: 11, totalInvite: 47,
    totalDeposit: '₱22,840', depositCount: 38,
    firstDepositAmt: '₱9,600', firstDepositUsers: 9,
    newFirstAmt: '₱9,600', newFirstUsers: 9,
    withdrawalAmt: '₱7,200', withdrawalCount: 14,
    claimedComm: '₱1,142.00', unclaimedComm: '₱540.80',
    directComm: '₱880.00', otherComm: '₱262.00',
    validBet: '₱128,400', winLoss: '₱3,840', winLossPositive: true,
  },
  thisWeek: {
    newInvite: 18, totalInvite: 47,
    totalDeposit: '₱41,680', depositCount: 67,
    firstDepositAmt: '₱14,200', firstDepositUsers: 14,
    newFirstAmt: '₱14,200', newFirstUsers: 14,
    withdrawalAmt: '₱13,500', withdrawalCount: 26,
    claimedComm: '₱2,084.00', unclaimedComm: '₱920.40',
    directComm: '₱1,540.00', otherComm: '₱544.00',
    validBet: '₱234,600', winLoss: '₱5,120', winLossPositive: false,
  },
  lastWeek: {
    newInvite: 24, totalInvite: 47,
    totalDeposit: '₱63,200', depositCount: 98,
    firstDepositAmt: '₱21,400', firstDepositUsers: 22,
    newFirstAmt: '₱21,400', newFirstUsers: 22,
    withdrawalAmt: '₱20,100', withdrawalCount: 40,
    claimedComm: '₱3,160.00', unclaimedComm: '₱1,240.00',
    directComm: '₱2,340.00', otherComm: '₱820.00',
    validBet: '₱380,200', winLoss: '₱8,640', winLossPositive: true,
  },
  lastMonth: {
    newInvite: 47, totalInvite: 47,
    totalDeposit: '₱248,400', depositCount: 412,
    firstDepositAmt: '₱82,600', firstDepositUsers: 47,
    newFirstAmt: '₱82,600', newFirstUsers: 47,
    withdrawalAmt: '₱78,200', withdrawalCount: 163,
    claimedComm: '₱12,420.00', unclaimedComm: '₱3,840.50',
    directComm: '₱9,200.00', otherComm: '₱3,220.00',
    validBet: '₱1,482,000', winLoss: '₱32,600', winLossPositive: true,
  },
};

const RECENT_MEMBERS = [
  { uid: 'A****28', time: 'Today 14:32', deposited: true, amount: '₱500' },
  { uid: 'B****91', time: 'Today 09:15', deposited: false, amount: null },
  { uid: 'C****04', time: 'Yesterday', deposited: true, amount: '₱1,200' },
  { uid: 'D****77', time: '2 days ago', deposited: true, amount: '₱300' },
  { uid: 'E****33', time: '3 days ago', deposited: false, amount: null },
];

export default function InvitePage() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('today');
  const [copied, setCopied] = useState(false);
  const d = DATA[period];

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ background: '#0e1018', color: '#fff', minHeight: '100%' }}>
      {/* Header — same pattern as deposit/page.tsx */}
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
        <div style={{ fontSize: 17, fontWeight: 700, color: '#e8e8e8' }}>Invite Friends</div>
        <CustomerServiceOutlined style={{ fontSize: 18, color: '#e8e8e8' }} />
      </div>

      {/* Commission hero banner */}
      <div style={{ padding: '4px 14px 0' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
            borderRadius: 12,
            padding: '16px 16px 14px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative circles */}
          <div
            style={{
              position: 'absolute', top: -20, right: -20, width: 100, height: 100,
              borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
            }}
          />
          <div
            style={{
              position: 'absolute', bottom: -10, left: 60, width: 60, height: 60,
              borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
            }}
          />
          <UserAddOutlined style={{ fontSize: 14, opacity: 0.9, marginBottom: 4, display: 'block' }} />
          <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1 }}>
            Earn up to <span style={{ color: '#FFD700' }}>30%</span> Commission
          </div>
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
            Get paid every time your friends place bets — for life
          </div>
          {/* Commission tiers */}
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            {[
              { level: 'Lv.1 Direct', pct: '20%' },
              { level: 'Lv.2', pct: '5%' },
              { level: 'Lv.3', pct: '5%' },
            ].map((t) => (
              <div
                key={t.level}
                style={{
                  padding: '4px 10px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  gap: 4,
                  alignItems: 'center',
                }}
              >
                <span style={{ opacity: 0.75 }}>{t.level}</span>
                <span style={{ color: '#FFD700' }}>{t.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Referral code */}
      <div style={{ padding: '14px 14px 0' }}>
        <SectionLabel text="Referral Code" />
        <div
          style={{
            background: '#1a1c23',
            border: '1px solid #2a2d36',
            borderRadius: 10,
            padding: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 10, color: '#5a5a66', marginBottom: 4 }}>Your Code</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 3, color: '#fff' }}>
                DARREN30
              </div>
            </div>
            <button
              onClick={handleCopy}
              style={{
                padding: '8px 16px',
                background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(168,85,247,0.15)',
                border: '1px solid',
                borderColor: copied ? '#10B981' : '#A855F7',
                color: copied ? '#10B981' : '#A855F7',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              {copied ? <CheckOutlined /> : <CopyOutlined />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <div
            style={{
              marginTop: 10,
              padding: '8px 12px',
              background: '#0e1018',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                flex: 1,
                fontSize: 11,
                color: '#5a5a66',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              https://filbet.com/r/DARREN30
            </div>
            <LinkOutlined style={{ color: '#A855F7', fontSize: 13, flexShrink: 0 }} />
          </div>
        </div>
      </div>

      {/* Share via */}
      <div style={{ padding: '14px 14px 0' }}>
        <SectionLabel text="Share Via" />
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { icon: <FacebookFilled />, label: 'Facebook', color: '#1877F2' },
            { icon: <MessageFilled />, label: 'Messenger', color: '#0099FF' },
            { icon: <WhatsAppOutlined />, label: 'WhatsApp', color: '#25D366' },
            { icon: <LinkOutlined />, label: 'Copy Link', color: '#A855F7' },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: `${s.color}22`,
                  border: `1px solid ${s.color}44`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: s.color,
                  fontSize: 20,
                }}
              >
                {s.icon}
              </div>
              <div style={{ fontSize: 10, color: '#8a8a99', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Team section */}
      <div style={{ padding: '18px 14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <TeamOutlined style={{ fontSize: 15, color: '#A855F7' }} />
          <div style={{ fontSize: 15, fontWeight: 700 }}>My Team</div>
        </div>

        {/* Date filter */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, marginBottom: 14 }}>
          {PERIODS.map((p) => {
            const active = period === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                style={{
                  flexShrink: 0,
                  padding: '6px 14px',
                  background: active ? '#A855F7' : '#1a1c23',
                  border: '1px solid',
                  borderColor: active ? '#A855F7' : '#2a2d36',
                  color: active ? '#fff' : '#8a8a99',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Stats */}
        <StatSection title="Invitations">
          <StatCell label="New Invite" value={String(d.newInvite)} />
          <StatCell label="Total Invite" value={String(d.totalInvite)} />
        </StatSection>

        <StatSection title="Deposits">
          <StatCell label="Total Deposit" value={d.totalDeposit} accent />
          <StatCell label="Total Deposit Count" value={String(d.depositCount)} />
          <StatCell label="First Deposit Amount" value={d.firstDepositAmt} accent />
          <StatCell label="First Deposit Users" value={String(d.firstDepositUsers)} />
          <StatCell label="New + First Deposit Amt" value={d.newFirstAmt} accent />
          <StatCell label="New + First Deposit Users" value={String(d.newFirstUsers)} />
        </StatSection>

        <StatSection title="Withdrawals">
          <StatCell label="Total Withdrawal Amt" value={d.withdrawalAmt} />
          <StatCell label="Total Withdrawals" value={String(d.withdrawalCount)} />
        </StatSection>

        <StatSection title="Commission">
          <StatCell label="Claimed Commission" value={d.claimedComm} accent />
          <StatCell label="Unclaimed Commission" value={d.unclaimedComm} highlight />
          <StatCell label="Direct Commission" value={d.directComm} accent />
          <StatCell label="Other Commission" value={d.otherComm} />
        </StatSection>

        <StatSection title="Betting">
          <StatCell label="Valid Bet" value={d.validBet} />
          <StatCell
            label="Win / Loss"
            value={(d.winLossPositive ? '+' : '-') + d.winLoss}
            winLoss={d.winLossPositive}
          />
        </StatSection>
      </div>

      {/* Recent invites */}
      <div style={{ padding: '18px 14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <UserAddOutlined style={{ fontSize: 15, color: '#A855F7' }} />
          <div style={{ fontSize: 15, fontWeight: 700 }}>Recent Invites</div>
        </div>
        <div
          style={{
            background: '#1a1c23',
            border: '1px solid #2a2d36',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {RECENT_MEMBERS.map((m, i) => (
            <div
              key={m.uid}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 14px',
                borderBottom: i < RECENT_MEMBERS.length - 1 ? '1px solid #2a2d36' : 'none',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: m.deposited ? 'rgba(168,85,247,0.15)' : '#12141a',
                  border: `1.5px solid ${m.deposited ? '#A855F7' : '#2a2d36'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: m.deposited ? '#A855F7' : '#5a5a66',
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                {m.deposited ? <CheckCircleFilled /> : <ClockCircleOutlined />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8e8' }}>{m.uid}</div>
                <div style={{ fontSize: 10, color: '#5a5a66', marginTop: 2 }}>{m.time}</div>
              </div>
              {m.deposited && m.amount ? (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: '#5a5a66' }}>Deposited</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>{m.amount}</div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '3px 10px',
                    background: 'rgba(255,154,46,0.1)',
                    border: '1px solid rgba(255,154,46,0.3)',
                    borderRadius: 20,
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#FF9A2E',
                  }}
                >
                  No Deposit
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: '#5a5a72',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
      }}
    >
      {text}
    </div>
  );
}

function StatSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <SectionLabel text={title} />
      <div
        style={{
          background: '#1a1c23',
          border: '1px solid #2a2d36',
          borderRadius: 10,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  accent,
  highlight,
  winLoss,
}: {
  label: string;
  value: string;
  accent?: boolean;
  highlight?: boolean;
  winLoss?: boolean;
}) {
  const valueColor =
    winLoss !== undefined
      ? winLoss
        ? '#10B981'
        : '#FF3546'
      : highlight
      ? '#FF9A2E'
      : '#e8e8e8';

  return (
    <div
      style={{
        padding: '11px 14px',
        borderRight: '1px solid #2a2d36',
        borderBottom: '1px solid #2a2d36',
      }}
    >
      <div style={{ fontSize: 10, color: '#5a5a72', marginBottom: 4, lineHeight: 1.3 }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: valueColor, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

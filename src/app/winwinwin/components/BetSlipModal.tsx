'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Button, InputNumber, Modal, Space, Typography } from 'antd';
import type { BetSelection } from '@/lib/winwinwin/types';

type BetSlipModalProps = {
  open: boolean;
  selection: BetSelection | null;
  onClose: () => void;
};

// Small football SVG
function FootballIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }}>
      <circle cx="12" cy="12" r="10" stroke="#D4AF37" strokeWidth="1.5" />
      <path d="M12 2c0 0-2 4-2 10s2 10 2 10" stroke="#D4AF37" strokeWidth="1" opacity="0.5" />
      <path d="M2 12h20" stroke="#D4AF37" strokeWidth="1" opacity="0.5" />
      <polygon points="12,5 14.5,9 12,13 9.5,9" stroke="#D4AF37" strokeWidth="1" fill="rgba(212,175,55,0.15)" />
    </svg>
  );
}

export default function BetSlipModal({ open, selection, onClose }: BetSlipModalProps) {
  const router = useRouter();
  const { message } = App.useApp();
  const [stake, setStake] = useState<number | null>(100);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setStake(100);
  }, [open]);

  async function submitBet() {
    if (!selection || !stake || stake <= 0) {
      message.warning('請輸入下注金額');
      return;
    }

    setSubmitting(true);
    const response = await fetch('/api/winwinwin/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bet_type: selection.bet_type,
        stake,
        api_match_id: selection.api_match_id,
        market_key: selection.market_key,
        outright_id: selection.outright_id,
        selection_id: selection.selection_id,
      }),
    });
    setSubmitting(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const errorText =
        data?.error === 'match_locked'
          ? '比賽已鎖盤'
          : data?.error === 'odds_closed' || data?.error === 'outright_closed'
            ? '盤口已關閉'
            : '下注失敗';
      message.error(errorText);
      return;
    }

    message.success('下注成功 ⚽');
    onClose();
    router.refresh();
  }

  const payout = selection && stake ? (selection.price_decimal * stake).toFixed(0) : null;

  return (
    <Modal
      title={
        <span style={{ color: '#D4AF37', fontFamily: 'var(--font-serif), serif', fontSize: 16, fontWeight: 700 }}>
          <FootballIcon />
          確認下注
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      centered
      styles={{
        content: {
          background: '#0f2d22',
          border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: 14,
          padding: 0,
        },
        header: {
          background: '#0f2d22',
          borderBottom: '1px solid rgba(212,175,55,0.15)',
          padding: '14px 20px',
          borderRadius: '14px 14px 0 0',
        },
        body: {
          padding: '16px 20px 20px',
          background: '#0f2d22',
        },
      }}
    >
      {selection && (
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          {/* Event info */}
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '10px 14px',
            }}
          >
            <Typography.Text style={{ fontSize: 12, color: '#a89a72', display: 'block', marginBottom: 4 }}>
              {selection.event_label}
            </Typography.Text>
            <Typography.Text
              strong
              style={{
                fontSize: 15,
                color: '#f0ead6',
                fontFamily: 'var(--font-sans), system-ui, sans-serif',
                display: 'block',
                lineHeight: 1.4,
              }}
            >
              {selection.market_label_zh}
              {selection.line ? ` ${selection.line}` : ''} — {selection.selection_label_zh}
            </Typography.Text>
          </div>

          {/* Odds display */}
          <div
            style={{
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: 8,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(212,175,55,0.06)',
            }}
          >
            <Typography.Text style={{ fontSize: 13, color: '#a89a72' }}>下注當下賠率</Typography.Text>
            <Typography.Text
              strong
              style={{ fontSize: 24, color: '#D4AF37', fontWeight: 800, letterSpacing: '0.02em' }}
            >
              {selection.price_decimal.toFixed(2)}
            </Typography.Text>
          </div>

          {/* Stake input */}
          <InputNumber
            min={1}
            precision={0}
            value={stake}
            onChange={setStake}
            addonBefore={<span style={{ color: '#a89a72', fontSize: 13 }}>下注</span>}
            style={{ width: '100%' }}
            size="large"
          />

          {/* Payout estimate */}
          {payout && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                color: '#a89a72',
                padding: '0 2px',
              }}
            >
              <span>預估可贏</span>
              <span style={{ color: '#4ade80', fontWeight: 700 }}>≈ {payout}</span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              onClick={onClose}
              style={{
                flex: 1,
                background: 'transparent',
                borderColor: 'rgba(255,255,255,0.15)',
                color: '#a89a72',
              }}
              size="large"
            >
              取消
            </Button>
            <Button
              type="primary"
              loading={submitting}
              onClick={submitBet}
              size="large"
              style={{
                flex: 2,
                background: 'linear-gradient(135deg, #D4AF37 0%, #b8960f 100%)',
                border: 'none',
                color: '#071f18',
                fontWeight: 800,
                letterSpacing: '0.04em',
              }}
            >
              確認下注
            </Button>
          </div>
        </Space>
      )}
    </Modal>
  );
}

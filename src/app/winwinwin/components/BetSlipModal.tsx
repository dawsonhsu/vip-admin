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

    message.success('下注成功');
    onClose();
    router.refresh();
  }

  return (
    <Modal
      title="確認下注"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      centered
      styles={{ body: { paddingTop: 8 } }}
    >
      {selection && (
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <div>
            <Typography.Text type="secondary">{selection.event_label}</Typography.Text>
            <Typography.Title level={5} style={{ margin: '4px 0 0' }}>
              {selection.market_label_zh}
              {selection.line ? ` ${selection.line}` : ''} - {selection.selection_label_zh}
            </Typography.Title>
          </div>

          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography.Text type="secondary">下注當下賠率</Typography.Text>
            <Typography.Text strong style={{ fontSize: 20 }}>
              {selection.price_decimal.toFixed(2)}
            </Typography.Text>
          </div>

          <InputNumber
            min={1}
            precision={0}
            value={stake}
            onChange={setStake}
            addonBefore="下注"
            style={{ width: '100%' }}
            size="large"
          />

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" loading={submitting} onClick={submitBet}>
              確認下注
            </Button>
          </Space>
        </Space>
      )}
    </Modal>
  );
}

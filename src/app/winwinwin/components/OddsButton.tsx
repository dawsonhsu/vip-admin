'use client';

import { useState } from 'react';
import { Button } from 'antd';
import type { BetSelection } from '@/lib/winwinwin/types';
import BetSlipModal from './BetSlipModal';

type OddsButtonProps = {
  selection: BetSelection;
  compact?: boolean;
};

export default function OddsButton({ selection, compact = false }: OddsButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="default"
        onClick={() => setOpen(true)}
        style={{
          width: '100%',
          minHeight: compact ? 56 : 64,
          height: 'auto',
          padding: '8px 6px',
          borderRadius: 8,
          borderColor: '#c7d2fe',
          background: '#f8fafc',
          color: '#111827',
          fontWeight: 700,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1.2,
          whiteSpace: 'normal',
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            width: '100%',
            wordBreak: 'break-word',
            whiteSpace: 'normal',
            textAlign: 'center',
            marginBottom: 4,
          }}
        >
          {selection.selection_label_zh}
          {selection.line ? ` ${selection.line}` : ''}
        </span>
        <span style={{ fontSize: 14 }}>{selection.price_decimal.toFixed(2)}</span>
      </Button>
      <BetSlipModal open={open} selection={selection} onClose={() => setOpen(false)} />
    </>
  );
}

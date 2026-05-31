'use client';

import { useState } from 'react';
import type { BetSelection } from '@/lib/winwinwin/types';
import BetSlipModal from './BetSlipModal';

type OddsButtonProps = {
  selection: BetSelection;
  compact?: boolean;
};

export default function OddsButton({ selection, compact = false }: OddsButtonProps) {
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        style={{
          width: '100%',
          minHeight: compact ? 54 : 64,
          height: 'auto',
          padding: '8px 10px',
          borderRadius: 8,
          border: '1px solid rgba(212,175,55,0.35)',
          background: pressed
            ? 'rgba(212,175,55,0.18)'
            : 'linear-gradient(135deg, rgba(15,45,34,0.9) 0%, rgba(10,36,25,0.95) 100%)',
          color: '#f0ead6',
          fontWeight: 700,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1.25,
          whiteSpace: 'normal',
          cursor: 'pointer',
          boxShadow: pressed
            ? '0 0 12px rgba(212,175,55,0.35), inset 0 1px 0 rgba(212,175,55,0.2)'
            : '0 2px 8px rgba(0,0,0,0.3)',
          transition: 'all 0.12s ease',
          boxSizing: 'border-box',
          fontFamily: 'var(--font-sans), system-ui, sans-serif',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            width: '100%',
            wordBreak: 'break-word',
            whiteSpace: 'normal',
            textAlign: 'center',
            marginBottom: 5,
            color: '#c4b078',
            lineHeight: 1.3,
          }}
        >
          {selection.selection_label_zh}
          {selection.line ? ` ${selection.line}` : ''}
        </span>
        <span
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: '#D4AF37',
            letterSpacing: '0.02em',
          }}
        >
          {selection.price_decimal.toFixed(2)}
        </span>
      </button>
      <BetSlipModal open={open} selection={selection} onClose={() => setOpen(false)} />
    </>
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button, message } from 'antd';

const COUNTDOWN_SECONDS = 60;

interface RecalcButtonProps {
  dataE2eId?: string;
  successText?: string;
}

export default function RecalcButton({ dataE2eId, successText = '重算完成' }: RecalcButtonProps) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const handleClick = () => {
    if (remaining !== null) return;
    setRemaining(COUNTDOWN_SECONDS);
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          message.success(successText);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const isRunning = remaining !== null;

  return (
    <Button
      data-e2e-id={dataE2eId}
      size="small"
      loading={isRunning}
      disabled={isRunning}
      onClick={handleClick}
    >
      {isRunning ? `重算中 ${remaining}s` : '重算'}
    </Button>
  );
}

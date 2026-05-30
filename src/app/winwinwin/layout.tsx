'use client';

import React from 'react';
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd';
import zhTW from 'antd/locale/zh_TW';

export default function WinWinWinLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={zhTW}
      theme={{
        token: {
          colorPrimary: '#1668dc',
          borderRadius: 8,
          colorBgLayout: '#f4f7fb',
          colorText: '#0f172a',
          colorTextSecondary: '#64748b',
        },
        algorithm: antdTheme.defaultAlgorithm,
      }}
    >
      <AntdApp>
        <main
          style={{
            minHeight: '100vh',
            background: '#e8edf5',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 430,
              minHeight: '100vh',
              background: '#f8fafc',
              color: '#0f172a',
              boxSizing: 'border-box',
            }}
          >
            {children}
          </div>
        </main>
      </AntdApp>
    </ConfigProvider>
  );
}

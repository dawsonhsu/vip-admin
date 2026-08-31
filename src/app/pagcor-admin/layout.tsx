'use client';

import React, { useState, useEffect } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import PagcorLayout from '@/components/PagcorLayout';

export default function PagcorRootLayout({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('pagcor-admin-theme');
    if (saved !== null) setIsDark(saved === 'dark');
  }, []);

  const handleThemeChange = (dark: boolean) => {
    setIsDark(dark);
    localStorage.setItem('pagcor-admin-theme', dark ? 'dark' : 'light');
  };

  const lightToken = {
    colorPrimary: '#1668dc',
    colorBgBase: '#ffffff',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBorder: '#d9d9d9',
    colorText: '#1a1a1a',
    colorTextSecondary: '#666666',
    borderRadius: 6,
  };

  const darkToken = {
    colorPrimary: '#1668dc',
    colorBgBase: '#141414',
    colorBgContainer: '#1f1f1f',
    colorBgElevated: '#2a2a2a',
    colorBorder: '#424242',
    colorText: '#e8e8e8',
    colorTextSecondary: '#a0a0a0',
    borderRadius: 6,
  };

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: isDark ? darkToken : lightToken,
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <PagcorLayout isDark={isDark} onThemeChange={handleThemeChange}>
        {children}
      </PagcorLayout>
    </ConfigProvider>
  );
}

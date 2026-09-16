'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ConfigProvider, theme as antdTheme } from 'antd';
import zhTW from 'antd/locale/zh_TW';
import AgencyLayout from '@/components/AgencyLayout';

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

export default function AgencyRootLayout({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const pathname = usePathname();
  const isLogin = pathname === '/agency/login';

  useEffect(() => {
    try {
      const saved = localStorage.getItem('agency-admin-theme');
      if (saved !== null) setIsDark(saved === 'dark');
    } catch {
      // 私密模式下 localStorage 可能不可用，維持預設淺色
    }
  }, []);

  const handleThemeChange = (dark: boolean) => {
    setIsDark(dark);
    try {
      localStorage.setItem('agency-admin-theme', dark ? 'dark' : 'light');
    } catch {
      // 忽略寫入失敗
    }
  };

  return (
    <ConfigProvider
      locale={zhTW}
      theme={{
        token: isDark ? darkToken : lightToken,
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      {isLogin ? (
        children
      ) : (
        <AgencyLayout isDark={isDark} onThemeChange={handleThemeChange}>
          {children}
        </AgencyLayout>
      )}
    </ConfigProvider>
  );
}

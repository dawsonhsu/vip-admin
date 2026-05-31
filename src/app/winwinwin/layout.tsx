'use client';

import React from 'react';
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd';
import zhTW from 'antd/locale/zh_TW';
import { Noto_Serif_TC, Inter } from 'next/font/google';

const notoSerifTC = Noto_Serif_TC({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Pitch pattern SVG — faint grass lines (centre circle + penalty arc + field lines)
const PITCH_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200' viewBox='0 0 320 200'>
  <rect width='320' height='200' fill='none'/>
  <!-- field outline -->
  <rect x='4' y='4' width='312' height='192' rx='2' fill='none' stroke='%23ffffff' stroke-width='1.2' opacity='0.06'/>
  <!-- halfway line -->
  <line x1='160' y1='4' x2='160' y2='196' stroke='%23ffffff' stroke-width='1' opacity='0.06'/>
  <!-- centre circle -->
  <circle cx='160' cy='100' r='36' fill='none' stroke='%23ffffff' stroke-width='1' opacity='0.06'/>
  <!-- centre spot -->
  <circle cx='160' cy='100' r='2' fill='%23ffffff' opacity='0.07'/>
  <!-- left penalty box -->
  <rect x='4' y='58' width='52' height='84' fill='none' stroke='%23ffffff' stroke-width='1' opacity='0.06'/>
  <!-- right penalty box -->
  <rect x='264' y='58' width='52' height='84' fill='none' stroke='%23ffffff' stroke-width='1' opacity='0.06'/>
  <!-- left goal box -->
  <rect x='4' y='78' width='20' height='44' fill='none' stroke='%23ffffff' stroke-width='1' opacity='0.05'/>
  <!-- right goal box -->
  <rect x='296' y='78' width='20' height='44' fill='none' stroke='%23ffffff' stroke-width='1' opacity='0.05'/>
  <!-- left penalty spot -->
  <circle cx='40' cy='100' r='2' fill='%23ffffff' opacity='0.06'/>
  <!-- right penalty spot -->
  <circle cx='280' cy='100' r='2' fill='%23ffffff' opacity='0.06'/>
</svg>`;

const pitchBg = `url("data:image/svg+xml,${PITCH_SVG}")`;

export default function WinWinWinLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${notoSerifTC.variable} ${inter.variable}`}>
      <ConfigProvider
        locale={zhTW}
        theme={{
          token: {
            colorPrimary: '#D4AF37',
            colorPrimaryHover: '#e8c84a',
            colorPrimaryActive: '#b8960f',
            borderRadius: 10,
            colorBgLayout: '#071f18',
            colorBgContainer: '#0f2d22',
            colorText: '#f0ead6',
            colorTextSecondary: '#a89a72',
            colorBorder: 'rgba(212,175,55,0.22)',
            colorBorderSecondary: 'rgba(255,255,255,0.08)',
            fontFamily: 'var(--font-sans), system-ui, sans-serif',
          },
          components: {
            Button: {
              defaultBg: '#0f2d22',
              defaultColor: '#f0ead6',
              defaultBorderColor: 'rgba(212,175,55,0.3)',
            },
            Input: {
              colorBgContainer: '#0a2419',
              colorText: '#f0ead6',
              colorBorder: 'rgba(212,175,55,0.3)',
              activeBorderColor: '#D4AF37',
              hoverBorderColor: '#D4AF37',
            },
            InputNumber: {
              colorBgContainer: '#0a2419',
              colorText: '#f0ead6',
              colorBorder: 'rgba(212,175,55,0.3)',
              activeBorderColor: '#D4AF37',
            },
            Card: {
              colorBgContainer: '#0f2d22',
              colorBorderSecondary: 'rgba(212,175,55,0.2)',
            },
            Modal: {
              colorBgElevated: '#0f2d22',
              colorText: '#f0ead6',
            },
            Tabs: {
              inkBarColor: '#D4AF37',
              itemActiveColor: '#D4AF37',
              itemSelectedColor: '#D4AF37',
              itemHoverColor: '#e8c84a',
              colorBorderSecondary: 'rgba(255,255,255,0.1)',
            },
            Form: {
              labelColor: '#c4b078',
            },
            Select: {
              colorBgContainer: '#0a2419',
            },
          },
          algorithm: antdTheme.darkAlgorithm,
        }}
      >
        <AntdApp>
          <main
            style={{
              minHeight: '100vh',
              background: '#071f18',
              backgroundImage: pitchBg,
              backgroundSize: '320px 200px',
              backgroundRepeat: 'repeat',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 430,
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #0B3B2E 0%, #092a1f 40%, #071f18 100%)',
                color: '#f0ead6',
                boxSizing: 'border-box',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {children}
            </div>
          </main>
        </AntdApp>
      </ConfigProvider>
    </div>
  );
}

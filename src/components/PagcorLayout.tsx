'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu, Typography, Switch, Space, Avatar, Dropdown, Breadcrumb, Segmented, Divider, ConfigProvider } from 'antd';
import {
  TeamOutlined,
  DesktopOutlined,
  DollarOutlined,
  BarChartOutlined,
  SwapOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  SunOutlined,
  MoonOutlined,
  BellOutlined,
  FullscreenOutlined,
  LogoutOutlined,
  HomeOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { usePagcorSite, pagcorSiteLabels, type PagcorSite } from '@/components/PagcorSiteContext';
import type { MenuProps } from 'antd';

const { Sider, Content, Header } = Layout;
const { Title, Text } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

// 選單結構 1:1 對應 admin-pagcor-fat.filbet2025.com（2026-08-31 擷取）
// 尚未實作的模組保留為選單項目，點擊不導頁。
const menuItems: MenuItem[] = [
  {
    key: 'member', icon: <TeamOutlined />, label: <span data-e2e-id="pagcor-menu-member">会员管理</span>,
    children: [
      { key: '/pagcor-admin/member/member-list', label: <span data-e2e-id="pagcor-menu-member-list">会员列表</span> },
    ],
  },
  {
    key: 'backend', icon: <DesktopOutlined />, label: <span data-e2e-id="pagcor-menu-backend">后台管理</span>,
    children: [
      { key: '/pagcor-admin/backend/merchant', label: <span data-e2e-id="pagcor-menu-merchant">门店管理</span> },
    ],
  },
  {
    key: 'finance', icon: <DollarOutlined />, label: <span data-e2e-id="pagcor-menu-finance">财务管理</span>,
    children: [
      { key: '/pagcor-admin/finance/deposit-records', label: <span data-e2e-id="pagcor-menu-deposit-records">存款记录</span> },
      { key: '/pagcor-admin/finance/withdraw-records', label: <span data-e2e-id="pagcor-menu-withdraw-records">提款记录</span> },
    ],
  },
  {
    key: 'report-center',
    icon: <BarChartOutlined />,
    label: <span data-e2e-id="pagcor-menu-report-center">报表中心</span>,
    children: [
      { key: '/pagcor-admin/report-center/pagcor', icon: <FileTextOutlined />, label: <span data-e2e-id="pagcor-menu-report-pagcor">Pagcor税收报表</span> },
      { key: '/pagcor-admin/report-center/shop', icon: <FileTextOutlined />, label: <span data-e2e-id="pagcor-menu-report-shop">门店税收报表</span> },
      { key: '/pagcor-admin/report-center/summary', icon: <FileTextOutlined />, label: <span data-e2e-id="pagcor-menu-report-summary">报告摘要</span> },
    ],
  },
  {
    key: 'transaction', icon: <SwapOutlined />, label: <span data-e2e-id="pagcor-menu-transaction">交易管理</span>,
    children: [
      { key: '/pagcor-admin/transaction/transaction-records', label: <span data-e2e-id="pagcor-menu-transaction-records">交易记录</span> },
    ],
  },
  {
    key: 'game-manage', icon: <PlayCircleOutlined />, label: <span data-e2e-id="pagcor-menu-game-manage">游戏管理</span>,
    children: [
      { key: '/pagcor-admin/game-manage/games', label: <span data-e2e-id="pagcor-menu-games">游戏列表</span> },
    ],
  },
  {
    key: 'game-records',
    icon: <FileTextOutlined />,
    label: <span data-e2e-id="pagcor-menu-game-records">游戏记录</span>,
    children: [
      {
        key: '/pagcor-admin/game-records/all-plat-records',
        icon: <FileTextOutlined />,
        label: <span data-e2e-id="pagcor-menu-all-plat-records">全平台投注记录</span>,
      },
      { key: 'jackpot-records', icon: <TrophyOutlined />, label: <span data-e2e-id="pagcor-menu-jackpot-records">Jackpot记录</span> },
    ],
  },
];

const breadcrumbMap: Record<string, string[]> = {
  '/pagcor-admin/member/member-list': ['会员管理', '会员列表'],
  '/pagcor-admin/backend/merchant': ['后台管理', '门店管理'],
  '/pagcor-admin/finance/deposit-records': ['财务管理', '财务记录', '存款记录'],
  '/pagcor-admin/finance/withdraw-records': ['财务管理', '财务记录', '提款记录'],
  '/pagcor-admin/transaction/transaction-records': ['交易管理', '交易记录'],
  '/pagcor-admin/game-manage/games': ['游戏管理', '游戏列表'],
  '/pagcor-admin/game-records/all-plat-records': ['游戏记录', '全平台投注记录'],
  '/pagcor-admin/report-center/pagcor': ['报表中心', 'Pagcor税收报表'],
  '/pagcor-admin/report-center/shop': ['报表中心', '门店税收报表'],
  '/pagcor-admin/report-center/summary': ['报表中心', '报告摘要'],
};

interface PagcorLayoutProps {
  children: React.ReactNode;
  isDark: boolean;
  onThemeChange: (dark: boolean) => void;
}

export default function PagcorLayout({ children, isDark, onThemeChange }: PagcorLayoutProps) {
  const { site, setSite } = usePagcorSite();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  const reportOnly = site === 'all';
  const blockedRoute = reportOnly && !pathname.startsWith('/pagcor-admin/report-center/');
  useEffect(() => {
    if (blockedRoute) router.replace('/pagcor-admin/report-center/pagcor');
  }, [blockedRoute, pathname, router]);

  const onClick: MenuProps['onClick'] = ({ key }) => {
    if (key.startsWith('/pagcor-admin')) router.push(key);
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: <span data-e2e-id="pagcor-user-profile">个人设定</span> },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: <span data-e2e-id="pagcor-user-logout">登出</span>, danger: true },
  ];

  const siderBg = isDark ? '#141414' : '#fff';
  const siderBorder = isDark ? '#303030' : '#f0f0f0';
  const headerBg = isDark ? '#1f1f1f' : '#fff';
  const contentBg = isDark ? '#0a0a0a' : '#f5f5f5';
  const logoColor = isDark ? '#fff' : '#1a1a1a';
  const headerTextColor = isDark ? '#e8e8e8' : '#333';

  return (
    <Layout style={{ minHeight: '100vh' }} data-e2e-id="pagcor-layout-root">
      <Sider
        data-e2e-id="pagcor-layout-sider"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={240}
        theme={isDark ? 'dark' : 'light'}
        style={{
          background: siderBg,
          borderRight: `1px solid ${siderBorder}`,
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div
          data-e2e-id="pagcor-layout-sider-logo"
          style={{
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 20px',
            borderBottom: `1px solid ${siderBorder}`,
            background: siderBg,
          }}
        >
          <Title level={5} style={{ color: logoColor, margin: 0, whiteSpace: 'nowrap' }}>
            {collapsed ? 'F' : 'Filbet Admin'}
          </Title>
        </div>
        <Menu
          data-e2e-id="pagcor-layout-sider-menu"
          theme={isDark ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[pathname]}
          key={reportOnly ? 'reports' : 'full'}
          openKeys={reportOnly ? ['report-center'] : undefined}
          defaultOpenKeys={['member', 'backend', 'finance', 'report-center', 'transaction', 'game-manage', 'game-records']}
          items={reportOnly ? menuItems.filter((item) => item?.key === 'report-center') : menuItems}
          onClick={onClick}
          style={{ background: 'transparent', borderRight: 0 }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header
          data-e2e-id="pagcor-layout-header"
          style={{
            background: headerBg,
            borderBottom: `1px solid ${siderBorder}`,
            padding: '0 24px',
            height: 48,
            lineHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <Space size={12}>
            <Space size={8}>
              <Text>站点</Text>
              <ConfigProvider theme={{ components: { Segmented: { itemSelectedBg: '#1668dc', itemSelectedColor: '#fff' } } }}>
                <Segmented
                  size="middle"
                  data-e2e-id="pagcor-site-switch"
                  value={site}
                  options={(['filbet', 'filplay', 'all'] as const).map((value) => ({
                    value, label: <span data-e2e-id={`pagcor-site-option-${value}`}>{pagcorSiteLabels[value]}</span>,
                  }))}
                  onChange={(value) => setSite(value as PagcorSite)}
                />
              </ConfigProvider>
            </Space>
            <Divider type="vertical" style={{ margin: 0 }} />
            <Breadcrumb
              data-e2e-id="pagcor-layout-breadcrumb"
              items={[
                { title: <HomeOutlined /> },
                ...(breadcrumbMap[pathname] ?? []).map((t) => ({ title: t })),
              ]}
            />
          </Space>
          <Space size="middle">
            {mounted && (
              <span data-e2e-id="pagcor-online-count" style={{ fontSize: 13, color: headerTextColor, whiteSpace: 'nowrap' }}>
                在线人数 <span style={{ color: '#52c41a' }}>{site === 'filbet' ? 47 : site === 'filplay' ? 12 : 59}</span>
              </span>
            )}
            <Switch
              data-e2e-id="pagcor-theme-toggle"
              checked={isDark}
              onChange={onThemeChange}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
            />
            <BellOutlined data-e2e-id="pagcor-bell-btn" style={{ fontSize: 16, color: headerTextColor, cursor: 'pointer' }} />
            <FullscreenOutlined
              data-e2e-id="pagcor-fullscreen-btn"
              style={{ fontSize: 16, color: headerTextColor, cursor: 'pointer' }}
              onClick={() => {
                if (!document.fullscreenElement) document.documentElement.requestFullscreen();
                else document.exitFullscreen();
              }}
            />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }} data-e2e-id="pagcor-header-user-menu">
                <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1668dc' }} />
                <Text style={{ color: headerTextColor, fontSize: 13 }}>darren@filbetph.com</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content data-e2e-id="pagcor-layout-content" style={{ padding: 24, background: contentBg, minHeight: 'calc(100vh - 48px)' }}>
          {!blockedRoute && children}
        </Content>
      </Layout>
    </Layout>
  );
}

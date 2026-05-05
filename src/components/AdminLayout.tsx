'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu, Typography, Switch, Space, Avatar, Dropdown, Breadcrumb } from 'antd';
import {
  TeamOutlined,
  GiftOutlined,
  CalendarOutlined,
  SettingOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
  DollarOutlined,
  BankOutlined,
  AlertOutlined,
  NotificationOutlined,
  GlobalOutlined,
  PlayCircleOutlined,
  AppstoreOutlined,
  ToolOutlined,
  FileTextOutlined,
  SwapOutlined,
  ApiOutlined,
  HomeOutlined,
  SunOutlined,
  MoonOutlined,
  BellOutlined,
  FullscreenOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Sider, Content, Header } = Layout;
const { Title, Text } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

const menuItems: MenuItem[] = [
  { key: '/admin', icon: <HomeOutlined />, label: <span data-e2e-id="layout-menu-home">首頁</span> },
  {
    key: 'member-mgmt',
    icon: <TeamOutlined />,
    label: <span data-e2e-id="layout-menu-member-mgmt">會員管理</span>,
    children: [
      { key: '/admin/members', icon: <UserOutlined />, label: <span data-e2e-id="layout-menu-members">會員列表</span> },
      { key: '/admin/inviter-transfer-log', icon: <SwapOutlined />, label: <span data-e2e-id="layout-menu-inviter-transfer">邀請人轉移紀錄</span> },
      { key: '/admin/vip-rewards', icon: <GiftOutlined />, label: <span data-e2e-id="layout-menu-vip-rewards">VIP 獎勵表</span> },
      { key: '/admin/vip-checkin-log', icon: <CalendarOutlined />, label: <span data-e2e-id="layout-menu-vip-checkin">VIP 簽到日誌</span> },
      { key: '/admin/vip-config', icon: <SettingOutlined />, label: <span data-e2e-id="layout-menu-vip-config">VIP 配置</span> },
    ],
  },
  { key: 'kyc', icon: <SafetyCertificateOutlined />, label: <span data-e2e-id="layout-menu-kyc">KYC</span> },
  { key: 'agent', icon: <TeamOutlined />, label: <span data-e2e-id="layout-menu-agent">代理管理</span> },
  {
    key: 'report',
    icon: <BarChartOutlined />,
    label: <span data-e2e-id="layout-menu-report">報表管理</span>,
    children: [
      { key: '/admin/member-stats', icon: <BarChartOutlined />, label: <span data-e2e-id="layout-menu-member-stats">會員日統計</span> },
      { key: '/admin/member-game-stats', icon: <PlayCircleOutlined />, label: <span data-e2e-id="layout-menu-member-game-stats">會員遊戲日統計</span> },
    ],
  },
  {
    key: 'finance',
    icon: <DollarOutlined />,
    label: <span data-e2e-id="layout-menu-finance">財務管理</span>,
    children: [
      { key: '/admin/deposit-records', icon: <DollarOutlined />, label: <span data-e2e-id="layout-menu-deposit-records">存款記錄</span> },
    ],
  },
  { key: 'settlement', icon: <BankOutlined />, label: <span data-e2e-id="layout-menu-settlement">結算管理</span> },
  {
    key: 'risk',
    icon: <AlertOutlined />,
    label: <span data-e2e-id="layout-menu-risk">風控管理</span>,
    children: [
      { key: '/admin/up-down-score', icon: <DollarOutlined />, label: <span data-e2e-id="layout-menu-up-down-score">上下分紀錄</span> },
    ],
  },
  {
    key: 'operations',
    icon: <NotificationOutlined />,
    label: <span data-e2e-id="layout-menu-operations">運營管理</span>,
    children: [
      { key: '/admin/activity-list', icon: <NotificationOutlined />, label: <span data-e2e-id="layout-menu-activity-list">活動列表</span> },
      { key: '/admin/ops-tools', icon: <ToolOutlined />, label: <span data-e2e-id="layout-menu-ops-tools">運營小工具</span> },
    ],
  },
  { key: 'promotion', icon: <NotificationOutlined />, label: <span data-e2e-id="layout-menu-promotion">推廣管理</span> },
  { key: 'site', icon: <GlobalOutlined />, label: <span data-e2e-id="layout-menu-site">站點管理</span> },
  { key: 'game', icon: <PlayCircleOutlined />, label: <span data-e2e-id="layout-menu-game">遊戲</span> },
  {
    key: 'game-mgmt',
    icon: <AppstoreOutlined />,
    label: <span data-e2e-id="layout-menu-game-mgmt">遊戲管理</span>,
    children: [
      { key: '/admin/freespin-grants', icon: <GiftOutlined />, label: <span data-e2e-id="layout-menu-freespin-grants">Freespin 派發管理</span> },
      { key: '/admin/freebet-campaign', icon: <NotificationOutlined />, label: <span data-e2e-id="layout-menu-freebet-campaign">FreeBet 活動管理</span> },
      { key: '/admin/game-management', icon: <AppstoreOutlined />, label: <span data-e2e-id="layout-menu-game-management">遊戲管理</span> },
    ],
  },
  { key: 'system', icon: <ToolOutlined />, label: <span data-e2e-id="layout-menu-system">系統</span> },
  { key: 'logs', icon: <FileTextOutlined />, label: <span data-e2e-id="layout-menu-logs">日誌</span> },
  { key: 'integration', icon: <ApiOutlined />, label: <span data-e2e-id="layout-menu-integration">集成後台</span> },
];

const breadcrumbMap: Record<string, string> = {
  '/admin': '首頁',
  '/admin/members': '會員列表',
  '/admin/inviter-transfer-log': '邀請人轉移紀錄',
  '/admin/vip-rewards': 'VIP 獎勵表',
  '/admin/vip-checkin-log': 'VIP 簽到日誌',
  '/admin/vip-config': 'VIP 配置',
  '/admin/freespin-grants': 'Freespin 派發管理',
  '/admin/freebet-campaign': 'FreeBet 活動管理',
  '/admin/game-management': '遊戲管理',
  '/admin/activity-list': '活動列表',
  '/admin/ops-tools': '運營小工具',
  '/admin/deposit-records': '存款記錄',
  '/admin/up-down-score': '上下分紀錄',
  '/admin/member-stats': '會員日統計',
  '/admin/member-game-stats': '會員遊戲日統計',
};

const parentBreadcrumbMap: Record<string, string> = {
  '/admin/members': '會員管理',
  '/admin/inviter-transfer-log': '會員管理',
  '/admin/vip-rewards': '會員管理',
  '/admin/vip-checkin-log': '會員管理',
  '/admin/vip-config': '會員管理',
  '/admin/freespin-grants': '遊戲管理',
  '/admin/freebet-campaign': '遊戲管理',
  '/admin/game-management': '遊戲管理',
  '/admin/activity-list': '運營管理',
  '/admin/ops-tools': '運營管理',
  '/admin/deposit-records': '財務管理',
  '/admin/up-down-score': '風控管理',
  '/admin/member-stats': '報表管理',
  '/admin/member-game-stats': '報表管理',
};

interface AdminLayoutProps {
  children: React.ReactNode;
  isDark: boolean;
  onThemeChange: (dark: boolean) => void;
}

export default function AdminLayout({ children, isDark, onThemeChange }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const onClick: MenuProps['onClick'] = ({ key }) => {
    if (key.startsWith('/admin')) {
      router.push(key);
    }
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: <span data-e2e-id="layout-user-profile">個人設定</span> },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: <span data-e2e-id="layout-user-logout">登出</span>, danger: true },
  ];

  // Theme-aware colors
  const siderBg = isDark ? '#141414' : '#fff';
  const siderBorder = isDark ? '#303030' : '#f0f0f0';
  const headerBg = isDark ? '#1f1f1f' : '#fff';
  const contentBg = isDark ? '#0a0a0a' : '#f5f5f5';
  const logoBg = isDark ? '#141414' : '#fff';
  const logoColor = isDark ? '#fff' : '#1a1a1a';
  const headerTextColor = isDark ? '#e8e8e8' : '#333';

  return (
    <Layout style={{ minHeight: '100vh' }} data-e2e-id="layout-root">
      <Sider
        data-e2e-id="layout-sider"
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
        <div data-e2e-id="layout-sider-logo" style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 20px',
          borderBottom: `1px solid ${siderBorder}`,
          background: logoBg,
        }}>
          <Title level={5} style={{ color: logoColor, margin: 0, whiteSpace: 'nowrap' }}>
            {collapsed ? 'F' : 'Filbet Admin'}
          </Title>
        </div>
        <Menu
          data-e2e-id="layout-sider-menu"
          theme={isDark ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[pathname]}
          defaultOpenKeys={['member-mgmt']}
          items={menuItems}
          onClick={onClick}
          style={{ background: 'transparent', borderRight: 0 }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header data-e2e-id="layout-header" style={{
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
        }}>
          <Breadcrumb
            data-e2e-id="layout-breadcrumb"
            items={[
              { title: <HomeOutlined /> },
              ...(parentBreadcrumbMap[pathname]
                ? [{ title: parentBreadcrumbMap[pathname] }]
                : []),
              ...(breadcrumbMap[pathname] ? [{ title: breadcrumbMap[pathname] }] : []),
            ]}
          />
          <Space size="middle">
            <Switch
              data-e2e-id="layout-theme-toggle"
              checked={isDark}
              onChange={onThemeChange}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
            />
            <BellOutlined data-e2e-id="layout-bell-btn" style={{ fontSize: 16, color: headerTextColor, cursor: 'pointer' }} />
            <FullscreenOutlined
              data-e2e-id="layout-fullscreen-btn"
              style={{ fontSize: 16, color: headerTextColor, cursor: 'pointer' }}
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen();
                } else {
                  document.exitFullscreen();
                }
              }}
            />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }} data-e2e-id="layout-header-user-menu">
                <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1668dc' }} />
                <Text style={{ color: headerTextColor, fontSize: 13 }}>Darren</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content data-e2e-id="layout-content" style={{ padding: 24, background: contentBg, minHeight: 'calc(100vh - 48px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

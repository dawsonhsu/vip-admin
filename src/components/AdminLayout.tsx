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
  { key: '/admin', icon: <HomeOutlined />, label: '首頁' },
  {
    key: 'member-mgmt',
    icon: <TeamOutlined />,
    label: '會員管理',
    children: [
      { key: '/admin/members', icon: <UserOutlined />, label: '會員列表' },
      { key: '/admin/vip-rewards', icon: <GiftOutlined />, label: 'VIP 獎勵表' },
      { key: '/admin/vip-checkin-log', icon: <CalendarOutlined />, label: 'VIP 簽到日誌' },
      { key: '/admin/vip-config', icon: <SettingOutlined />, label: 'VIP 配置' },
    ],
  },
  { key: 'kyc', icon: <SafetyCertificateOutlined />, label: 'KYC' },
  { key: 'agent', icon: <TeamOutlined />, label: '代理管理' },
  { key: 'report', icon: <BarChartOutlined />, label: '報表管理' },
  { key: 'finance', icon: <DollarOutlined />, label: '財務管理' },
  { key: 'settlement', icon: <BankOutlined />, label: '結算管理' },
  { key: 'risk', icon: <AlertOutlined />, label: '風控管理' },
  {
    key: 'operations',
    icon: <NotificationOutlined />,
    label: '運營管理',
    children: [
      { key: '/admin/activity-list', icon: <NotificationOutlined />, label: '活動列表' },
    ],
  },
  { key: 'promotion', icon: <NotificationOutlined />, label: '推廣管理' },
  { key: 'site', icon: <GlobalOutlined />, label: '站點管理' },
  { key: 'game', icon: <PlayCircleOutlined />, label: '遊戲' },
  {
    key: 'game-mgmt',
    icon: <AppstoreOutlined />,
    label: '遊戲管理',
    children: [
      { key: '/admin/freespin-grants', icon: <GiftOutlined />, label: 'Free Spin 派發記錄' },
      { key: '/admin/freespin-usage', icon: <FileTextOutlined />, label: 'Free Spin 使用記錄' },
      { key: '/admin/freebet-campaign', icon: <NotificationOutlined />, label: 'FreeBet 活動管理' },
    ],
  },
  { key: 'system', icon: <ToolOutlined />, label: '系統' },
  { key: 'logs', icon: <FileTextOutlined />, label: '日誌' },
  { key: 'integration', icon: <ApiOutlined />, label: '集成後台' },
];

const breadcrumbMap: Record<string, string> = {
  '/admin': '首頁',
  '/admin/members': '會員列表',
  '/admin/vip-rewards': 'VIP 獎勵表',
  '/admin/vip-checkin-log': 'VIP 簽到日誌',
  '/admin/vip-config': 'VIP 配置',
  '/admin/freespin-grants': 'Free Spin 派發記錄',
  '/admin/freespin-usage': 'Free Spin 使用記錄',
  '/admin/freebet-campaign': 'FreeBet 活動管理',
  '/admin/activity-list': '活動列表',
};

const parentBreadcrumbMap: Record<string, string> = {
  '/admin/members': '會員管理',
  '/admin/vip-rewards': '會員管理',
  '/admin/vip-checkin-log': '會員管理',
  '/admin/vip-config': '會員管理',
  '/admin/freespin-grants': '遊戲管理',
  '/admin/freespin-usage': '遊戲管理',
  '/admin/freebet-campaign': '遊戲管理',
  '/admin/activity-list': '運營管理',
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
    { key: 'profile', icon: <UserOutlined />, label: '個人設定' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '登出', danger: true },
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
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
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
        <div style={{
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
        <Header style={{
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
              checked={isDark}
              onChange={onThemeChange}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
            />
            <BellOutlined style={{ fontSize: 16, color: headerTextColor, cursor: 'pointer' }} />
            <FullscreenOutlined
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
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1668dc' }} />
                <Text style={{ color: headerTextColor, fontSize: 13 }}>Darren</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ padding: 24, background: contentBg, minHeight: 'calc(100vh - 48px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

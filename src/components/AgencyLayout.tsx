'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu, Typography, Switch, Space, Avatar, Dropdown, Breadcrumb, Tag } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
  PercentageOutlined,
  SettingOutlined,
  LockOutlined,
  UserOutlined,
  SunOutlined,
  MoonOutlined,
  BellOutlined,
  FullscreenOutlined,
  LogoutOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { agencyAccount } from '@/data/agency/shared';
import { settleTypeLabels } from '@/lib/agencyUtils';

const { Sider, Content, Header } = Layout;
const { Title, Text } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

// 選單依後端 ~/claudeproject/agency 的 /agency/* 路由分組。
const menuItems: MenuItem[] = [
  {
    key: '/agency/home',
    icon: <DashboardOutlined />,
    label: <span data-e2e-id="agency-menu-home">首頁看板</span>,
  },
  {
    key: 'member',
    icon: <TeamOutlined />,
    label: <span data-e2e-id="agency-menu-member">會員管理</span>,
    children: [
      {
        key: '/agency/members',
        icon: <UnorderedListOutlined />,
        label: <span data-e2e-id="agency-menu-members">會員列表</span>,
      },
      {
        key: '/agency/member-stats',
        icon: <BarChartOutlined />,
        label: <span data-e2e-id="agency-menu-member-stats">會員日統計</span>,
      },
    ],
  },
  {
    key: '/agency/rates',
    icon: <PercentageOutlined />,
    label: <span data-e2e-id="agency-menu-rates">費率查詢</span>,
  },
  {
    key: 'account',
    icon: <SettingOutlined />,
    label: <span data-e2e-id="agency-menu-account">帳號設定</span>,
    children: [
      {
        key: '/agency/password',
        icon: <LockOutlined />,
        label: <span data-e2e-id="agency-menu-password">修改密碼</span>,
      },
    ],
  },
];

const breadcrumbMap: Record<string, string[]> = {
  '/agency/home': ['首頁看板'],
  '/agency/members': ['會員管理', '會員列表'],
  '/agency/member-stats': ['會員管理', '會員日統計'],
  '/agency/rates': ['費率查詢'],
  '/agency/password': ['帳號設定', '修改密碼'],
};

interface AgencyLayoutProps {
  children: React.ReactNode;
  isDark: boolean;
  onThemeChange: (dark: boolean) => void;
}

export default function AgencyLayout({ children, isDark, onThemeChange }: AgencyLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  const onClick: MenuProps['onClick'] = ({ key }) => {
    if (key.startsWith('/agency')) router.push(key);
  };

  const onLogout = () => {
    try {
      localStorage.removeItem('agency-demo-session');
    } catch {
      // 私密模式下 localStorage 可能不可用，忽略
    }
    router.push('/agency/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'password',
      icon: <LockOutlined />,
      label: <span data-e2e-id="agency-user-password">修改密碼</span>,
      onClick: () => router.push('/agency/password'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: <span data-e2e-id="agency-user-logout">登出</span>,
      danger: true,
      onClick: onLogout,
    },
  ];

  const siderBg = isDark ? '#141414' : '#fff';
  const siderBorder = isDark ? '#303030' : '#f0f0f0';
  const headerBg = isDark ? '#1f1f1f' : '#fff';
  const contentBg = isDark ? '#0a0a0a' : '#f5f5f5';
  const logoColor = isDark ? '#fff' : '#1a1a1a';
  const headerTextColor = isDark ? '#e8e8e8' : '#333';

  const openKeys = ['member', 'account'];

  return (
    <Layout style={{ minHeight: '100vh' }} data-e2e-id="agency-layout-root">
      <Sider
        data-e2e-id="agency-layout-sider"
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
          data-e2e-id="agency-layout-sider-logo"
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
            {collapsed ? 'F' : 'Filbet 代理後台'}
          </Title>
        </div>
        <Menu
          data-e2e-id="agency-layout-sider-menu"
          theme={isDark ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[pathname]}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={onClick}
          style={{ background: 'transparent', borderRight: 0 }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header
          data-e2e-id="agency-layout-header"
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
          <Breadcrumb
            data-e2e-id="agency-layout-breadcrumb"
            items={[
              { title: <HomeOutlined /> },
              ...(breadcrumbMap[pathname] ?? []).map((t) => ({ title: t })),
            ]}
          />
          <Space size="middle">
            {mounted && (
              <Tag data-e2e-id="agency-settle-type" color="blue" style={{ marginInlineEnd: 0 }}>
                {settleTypeLabels[agencyAccount.settle_type]}
              </Tag>
            )}
            <Switch
              data-e2e-id="agency-theme-toggle"
              checked={isDark}
              onChange={onThemeChange}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
            />
            <BellOutlined
              data-e2e-id="agency-bell-btn"
              style={{ fontSize: 16, color: headerTextColor, cursor: 'pointer' }}
            />
            <FullscreenOutlined
              data-e2e-id="agency-fullscreen-btn"
              style={{ fontSize: 16, color: headerTextColor, cursor: 'pointer' }}
              onClick={() => {
                if (!document.fullscreenElement) document.documentElement.requestFullscreen();
                else document.exitFullscreen();
              }}
            />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }} data-e2e-id="agency-header-user-menu">
                <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1668dc' }} />
                <Text style={{ color: headerTextColor, fontSize: 13 }}>{agencyAccount.username}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          data-e2e-id="agency-layout-content"
          style={{ padding: 24, background: contentBg, minHeight: 'calc(100vh - 48px)' }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

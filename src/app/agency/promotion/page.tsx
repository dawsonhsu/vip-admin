'use client';

import React from 'react';
import { Alert, Button, Card, Col, Descriptions, Input, Row, Space, Typography, message } from 'antd';
import { CopyOutlined, DownloadOutlined, LinkOutlined } from '@ant-design/icons';
import { agencyAccount } from '@/data/agency/shared';
import { settleTypeLabels } from '@/lib/agencyUtils';

const { Paragraph, Text } = Typography;
const posterThemes = [
  { name: '品牌推廣海報', title: '精彩，由你分享', subtitle: '探索 Filbet 遊戲世界', start: '#102b4e', end: '#1668dc', accent: '#91caff' },
  { name: '電子遊戲海報', title: '多元遊戲，隨心探索', subtitle: '電子遊戲 · 豐富選擇', start: '#29144f', end: '#722ed1', accent: '#d3adf7' },
  { name: '真人遊戲海報', title: '分享你的精彩時刻', subtitle: '真人遊戲 · 互動體驗', start: '#073b3b', end: '#08979c', accent: '#87e8de' },
];

// 原始海報連結為佔位網址，改用可預覽、可下載的本地示意圖呈現。
function posterDataUrl(poster: typeof posterThemes[number]): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${poster.start}"/><stop offset="1" stop-color="${poster.end}"/></linearGradient></defs>
    <rect width="600" height="750" fill="url(#bg)"/>
    <circle cx="535" cy="140" r="235" fill="none" stroke="${poster.accent}" stroke-opacity=".16" stroke-width="54"/>
    <circle cx="535" cy="140" r="140" fill="none" stroke="${poster.accent}" stroke-opacity=".2" stroke-width="2"/>
    <circle cx="40" cy="745" r="230" fill="${poster.accent}" fill-opacity=".08"/>
    <g fill="white" font-family="Arial, 'Noto Sans TC', 'PingFang TC', sans-serif">
      <text x="48" y="90" font-size="45" font-weight="700">Filbet</text>
      <text x="48" y="133" font-size="19" fill="${poster.accent}">代理專屬推廣</text>
      <rect x="48" y="234" width="48" height="5" rx="2" fill="${poster.accent}"/>
      <text x="48" y="306" font-size="34" font-weight="700">${poster.title}</text>
      <text x="48" y="351" font-size="23" fill="${poster.accent}">${poster.subtitle}</text>
      <rect x="48" y="430" width="504" height="155" rx="18" fill="white" fill-opacity=".1" stroke="white" stroke-opacity=".22"/>
      <text x="76" y="477" font-size="20">專屬邀請碼</text>
      <text x="76" y="548" font-size="46" font-weight="700" letter-spacing="8">${agencyAccount.invite_code}</text>
      <text x="48" y="666" font-size="23">${poster.name}</text>
      <text x="48" y="707" font-size="18" fill="${poster.accent}">示範海報 · 僅供版面展示</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function AgencyPromotionPage() {
  const [messageApi, contextHolder] = message.useMessage();

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      messageApi.success('已複製');
    } catch {
      messageApi.error('複製失敗，請確認瀏覽器的剪貼簿權限後重試');
    }
  };

  return (
    <div>
      {contextHolder}
      <Card data-e2e-id="agency-promotion-link-card" title="我的推廣連結" style={{ marginBottom: 16 }}>
        <Row gutter={[24, 20]}>
          <Col xs={24} lg={8}>
            <label htmlFor="agency-promotion-invite-code" style={{ display: 'block', marginBottom: 8 }}>邀請碼</label>
            <Space.Compact style={{ width: '100%' }}>
              <Input id="agency-promotion-invite-code" data-e2e-id="agency-promotion-invite-code-input" readOnly value={agencyAccount.invite_code} style={{ fontWeight: 600, letterSpacing: 2 }} />
              <Button data-e2e-id="agency-promotion-copy-code-btn" icon={<CopyOutlined />} onClick={() => void copy(agencyAccount.invite_code)}>複製</Button>
            </Space.Compact>
          </Col>
          <Col xs={24} lg={16}>
            <label htmlFor="agency-promotion-invite-link" style={{ display: 'block', marginBottom: 8 }}>推薦連結</label>
            <Space.Compact style={{ width: '100%' }}>
              <Input id="agency-promotion-invite-link" data-e2e-id="agency-promotion-invite-link-input" readOnly value={agencyAccount.invite_link} prefix={<LinkOutlined />} />
              <Button data-e2e-id="agency-promotion-copy-link-btn" icon={<CopyOutlined />} onClick={() => void copy(agencyAccount.invite_link)}>複製</Button>
            </Space.Compact>
          </Col>
        </Row>
        <Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>新會員透過此推薦連結註冊後，將綁定至您的代理帳號，納入下線會員與佣金統計。</Paragraph>
      </Card>

      <Card data-e2e-id="agency-promotion-posters-card" title="推廣海報" style={{ marginBottom: 16 }}>
        <Alert type="info" showIcon message="目前展示示意海報；下載提供 SVG 圖檔，複製連結提供原始海報佔位網址。" style={{ marginBottom: 20 }} />
        <Row gutter={[20, 20]}>
          {agencyAccount.invite_img.map((url, index) => {
            const poster = posterThemes[index % posterThemes.length];
            const dataUrl = posterDataUrl(poster);
            return (
              <Col key={url} xs={24} sm={12} xl={8}>
                <Card data-e2e-id={`agency-promotion-poster-${index + 1}-card`} size="small" styles={{ body: { padding: 12 } }}>
                  <div
                    role="img"
                    aria-label={`${poster.name}示意圖，邀請碼 ${agencyAccount.invite_code}`}
                    style={{ width: '100%', aspectRatio: '4 / 5', borderRadius: 6, background: `${poster.start} url("${dataUrl}") center / cover no-repeat`, marginBottom: 16 }}
                  />
                  <Text strong>{poster.name}</Text>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    <Button data-e2e-id={`agency-promotion-poster-${index + 1}-download-btn`} icon={<DownloadOutlined />} href={dataUrl} download={`${poster.name}_${agencyAccount.invite_code}.svg`}>下載</Button>
                    <Button data-e2e-id={`agency-promotion-poster-${index + 1}-copy-btn`} icon={<CopyOutlined />} onClick={() => void copy(url)}>複製連結</Button>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      <Card data-e2e-id="agency-promotion-guide-card" title="推廣說明">
        <Paragraph>推廣採三層佣金模式：您直接邀請的會員為第一層，透過第一層延伸的下線為第二層，再由第二層延伸的下線為第三層。各層依平台規則計算佣金，適用比例與門檻可於「費率查詢」查看。</Paragraph>
        <Descriptions
          size="small"
          column={1}
          items={[
            { key: 'settle', label: '結算週期', children: `${settleTypeLabels[agencyAccount.settle_type]}（每月）` },
            { key: 'report', label: '佣金查詢', children: '佣金依結算週期彙總，實際應發金額與審核狀態以佣金報表為準。' },
          ]}
        />
        <Text type="secondary">此頁為示範環境，帳號、連結與海報均為展示用途。</Text>
      </Card>
    </div>
  );
}

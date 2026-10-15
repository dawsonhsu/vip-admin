'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Empty, message, Popover, QRCode, Row, Space, Table, Tooltip, Typography } from 'antd';
import { CopyOutlined, DownloadOutlined, InfoCircleOutlined, QrcodeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { agencyAccount, agencyDomains, type AgencyDomain } from '@/data/agency/shared';

const { Text } = Typography;

function downloadQr(wrapperId: string, fileName: string) {
  const canvas = document.getElementById(wrapperId)?.querySelector<HTMLCanvasElement>('canvas');
  if (!canvas) return;
  const a = document.createElement('a');
  a.download = `${fileName}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

function QrBlock({ id, value, size, fileName }: { id: string; value: string; size: number; fileName: string }) {
  return (
    <Space direction="vertical" align="center" size={8}>
      <div id={id}>
        <QRCode data-e2e-id={`${id}-qrcode`} value={value} size={size} bordered={false} bgColor="#fff" type="canvas" />
      </div>
      <Button data-e2e-id={`${id}-download-btn`} size="small" icon={<DownloadOutlined />} onClick={() => downloadQr(id, fileName)}>
        下载 QR Code
      </Button>
    </Space>
  );
}

export default function AgencyPromotionPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      messageApi.success('已复制');
    } catch {
      messageApi.error('复制失败，请手动选取');
    }
  };

  const { invite_code: code, invite_link: link } = agencyAccount;

  const columns: ColumnsType<AgencyDomain> = [
    {
      title: '链接',
      dataIndex: 'domain',
      render: (domain: string) => <Text data-e2e-id={`agency-promotion-domain-${domain}-link`}>{`https://${domain}`}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, row) => {
        const url = `https://${row.domain}`;
        return (
          <Space size={0}>
            <Button data-e2e-id={`agency-promotion-domain-${row.domain}-copy-btn`} type="link" icon={<CopyOutlined />} onClick={() => copy(url)}>复制</Button>
            <Popover
              trigger="click"
              placement="left"
              content={<QrBlock id={`agency-promotion-domain-qr-${row.id}`} value={url} size={160} fileName={row.domain} />}
            >
              <Button data-e2e-id={`agency-promotion-domain-${row.domain}-qr-btn`} type="link" icon={<QrcodeOutlined />}>QR Code</Button>
            </Popover>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {contextHolder}
      <Card data-e2e-id="agency-promotion-default-card" title="推广信息" style={{ marginBottom: 16 }}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={16}>
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
              <div>
                <Text type="secondary">邀请码</Text>
                <Space style={{ display: 'flex', marginTop: 4 }}>
                  <Text data-e2e-id="agency-promotion-invite-code" strong style={{ fontSize: 20, letterSpacing: 2 }}>{code}</Text>
                  <Button data-e2e-id="agency-promotion-invite-code-copy-btn" type="link" icon={<CopyOutlined />} onClick={() => copy(code)}>复制</Button>
                </Space>
              </div>
              <div>
                <Text type="secondary">推广链接</Text>
                <Space style={{ display: 'flex', marginTop: 4 }} wrap>
                  <Text data-e2e-id="agency-promotion-invite-link" style={{ fontSize: 16, overflowWrap: 'anywhere' }}>{link}</Text>
                  <Button data-e2e-id="agency-promotion-invite-link-copy-btn" type="link" icon={<CopyOutlined />} onClick={() => copy(link)}>复制</Button>
                </Space>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'center' }}>
            {mounted && <QrBlock id="agency-promotion-default-qr" value={link} size={140} fileName={`invite_${code}`} />}
          </Col>
        </Row>
      </Card>

      <Card
        data-e2e-id="agency-promotion-domain-card"
        title={(
          <Space>
            专属域名
            <Tooltip title="通过专属域名注册的会员会自动归属于你，不需输入邀请码。如需开通请联系客服。">
              <InfoCircleOutlined data-e2e-id="agency-promotion-domain-info-icon" style={{ color: '#999' }} />
            </Tooltip>
          </Space>
        )}
      >
        <Table<AgencyDomain>
          data-e2e-id="agency-promotion-domain-table"
          rowKey="id"
          columns={columns}
          dataSource={agencyDomains}
          pagination={false}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="尚未开通专属域名" /> }}
        />
      </Card>
    </div>
  );
}

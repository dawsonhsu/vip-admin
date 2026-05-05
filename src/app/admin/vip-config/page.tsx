'use client';

import React, { useState } from 'react';
import {
  Card, Table, Tag, Button, Typography, Modal, Form, InputNumber, Input, message, Space, Divider, Tabs, Checkbox, Alert,
} from 'antd';
import { EditOutlined, SettingOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { vipConfigData, type VipConfigItem } from '@/data/vipConfigData';

const { Title, Text } = Typography;

const tierColors: Record<string, string> = {
  Bronze: '#cd7f32',
  Silver: '#c0c0c0',
  Gold: '#ffd700',
  Platinum: '#e5e4e2',
  Diamond: '#b9f2ff',
};

export default function VipConfigPage() {
  const [data, setData] = useState<VipConfigItem[]>([...vipConfigData]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<VipConfigItem | null>(null);
  const [form] = Form.useForm();

  const handleEdit = (record: VipConfigItem) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setEditModalOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      setData(prev => prev.map(item =>
        item.id === editingRecord!.id
          ? { ...item, ...values, maintainer: 'darren@filbetph.com', maintainTime: new Date().toISOString().replace('T', ' ').slice(0, 19) }
          : item
      ));
      setEditModalOpen(false);
      message.success('配置已更新');
    });
  };

  // rowSpan calc for tierRange
  const getTierRowSpan = (record: VipConfigItem, index: number | undefined) => {
    if (index === undefined) return {};
    const range = record.tierRange;
    const firstIdx = data.findIndex(d => d.tierRange === range);
    if (index === firstIdx) {
      return { rowSpan: data.filter(d => d.tierRange === range).length };
    }
    return { rowSpan: 0 };
  };

  const titleWithTip = (label: string, tip: string) => (
    <span style={{ whiteSpace: 'nowrap' }}>
      {label}{' '}
      <Tooltip title={tip}><QuestionCircleOutlined style={{ color: '#999', cursor: 'pointer' }} /></Tooltip>
    </span>
  );

  const columns: ColumnsType<VipConfigItem> = [
    { title: '序號', dataIndex: 'id', width: 60, fixed: 'left', align: 'center' },
    {
      title: '等級區間', dataIndex: 'tierRange', width: 100, fixed: 'left', align: 'center',
      render: (val, record) => <Tag data-e2e-id={`vip-config-table-tier-tag-${record.id}`} color={tierColors[val]}>{val}</Tag>,
      onCell: (record, index) => getTierRowSpan(record, index),
    },
    {
      title: 'VIP等級', dataIndex: 'vipLevel', width: 80, align: 'center',
      render: (val, record) => <Tag data-e2e-id={`vip-config-table-vip-tag-${record.id}`} color="blue">V{val}</Tag>,
    },
    {
      title: 'XP要求', dataIndex: 'xpRequired', width: 120, align: 'right',
      render: (val) => val.toLocaleString(),
    },
    {
      title: '升級禮金', dataIndex: 'upgradeBonus', width: 90, align: 'right',
      render: (val) => `₱${val.toLocaleString()}`,
    },
    {
      title: '生日禮金', dataIndex: 'birthdayBonus', width: 90, align: 'right',
      render: (val) => val === 0 ? '-' : `₱${val.toLocaleString()}`,
    },
    {
      title: titleWithTip('累計存款要求', '半月禮金結算存款最低要求\n半月：1~15 日 / 16~當月月底'),
      dataIndex: 'biweeklyDepositMin', width: 130, align: 'right',
      render: (val) => `₱${val.toLocaleString()}`,
    },
    {
      title: titleWithTip('Slot 最低有效流水', '半月禮金結算 Slot 最低有效流水要求\n半月：1~15 日 / 16~當月月底'),
      dataIndex: 'minFlow', width: 140, align: 'right',
      render: (val) => `₱${val.toLocaleString()}`,
    },
    {
      title: titleWithTip('達標獎勵', '達標對應 VIP 等級的存款、最低有效流水要求時派發獎勵。'),
      dataIndex: 'qualifyReward', width: 100, align: 'right',
      render: (val) => `₱${val.toLocaleString()}`,
    },
    {
      title: titleWithTip('越級獎勵', '半月存款、最低有效流水要求超過用戶當下 VIP 等級時，依對應層級 VIP 發放越級獎勵。'),
      dataIndex: 'biweeklyUpgradeReward', width: 100, align: 'right',
      render: (val) => val === 0 ? '-' : `₱${val.toLocaleString()}`,
    },
    {
      title: titleWithTip('月保級積分', '於結算時需維持相同等級的對應 XP 值（結算期間累積）。'),
      dataIndex: 'xpRequired', width: 120, align: 'right',
      render: (val) => val.toLocaleString(),
    },
    {
      title: titleWithTip('每日負盈利', '每日負盈利獎勵對應 VIP 等級返還比例。'),
      dataIndex: 'dailyNegReturn', width: 110, align: 'center',
    },
    {
      title: titleWithTip('補簽累存', '該 VIP 等級若需補簽到所需當日存款累計，每日至多補簽一次。'),
      dataIndex: 'makeupDeposit', width: 120, align: 'right',
      render: (val) => `₱${val.toLocaleString()}`,
    },
    {
      title: '補簽上限', dataIndex: 'makeupLimit', width: 80, align: 'center',
    },
    {
      title: titleWithTip('第6天', '該 VIP 等級連續簽到 6 天時，第 6 天時獲得的獎勵。'),
      dataIndex: 'day6', width: 90, align: 'center',
      render: (val, record) => <Tag data-e2e-id={`vip-config-table-day6-tag-${record.id}`} color="gold">₱{val}</Tag>,
    },
    {
      title: titleWithTip('第7天', '該 VIP 等級連續簽到 7 天時，第 7 天時獲得的獎勵。'),
      dataIndex: 'day7P', width: 140, align: 'center',
      render: (val, record) => <Tag data-e2e-id={`vip-config-table-day7-tag-${record.id}`} color="green">₱{val} + {record.day7FS}FS</Tag>,
    },
    {
      title: titleWithTip('第16天', '該 VIP 等級連續簽到 16 天時，第 16 天時獲得的獎勵。'),
      dataIndex: 'day16', width: 90, align: 'center',
      render: (val, record) => <Tag data-e2e-id={`vip-config-table-day16-tag-${record.id}`} color="gold">₱{val}</Tag>,
    },
    {
      title: titleWithTip('第17天', '該 VIP 等級連續簽到 17 天時，第 17 天時獲得的獎勵。'),
      dataIndex: 'day17P', width: 140, align: 'center',
      render: (val, record) => <Tag data-e2e-id={`vip-config-table-day17-tag-${record.id}`} color="green">₱{val} + {record.day17FS}FS</Tag>,
    },
    {
      title: titleWithTip('第26天', '該 VIP 等級連續簽到 26 天時，第 26 天時獲得的獎勵。'),
      dataIndex: 'day26', width: 90, align: 'center',
      render: (val, record) => <Tag data-e2e-id={`vip-config-table-day26-tag-${record.id}`} color="gold">₱{val}</Tag>,
    },
    {
      title: titleWithTip('第27天', '該 VIP 等級連續簽到 27 天時，第 27 天時獲得的獎勵。'),
      dataIndex: 'day27P', width: 140, align: 'center',
      render: (val, record) => <Tag data-e2e-id={`vip-config-table-day27-tag-${record.id}`} color="purple">₱{val} + {record.day27FS}FS</Tag>,
    },
    { title: '維護人', dataIndex: 'maintainer', width: 160 },
    { title: '維護時間', dataIndex: 'maintainTime', width: 170 },
    {
      title: '操作', width: 80, fixed: 'right', align: 'center',
      render: (_, record) => (
        <Button data-e2e-id={`vip-config-table-edit-btn-${record.id}`} type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} size="small">
          編輯
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>VIP 配置</Title>
        <Text type="secondary">管理所有 VIP 等級的配置信息，包括升級要求、獎勵和簽到設置</Text>
      </div>

      <Card
        bodyStyle={{ padding: 0 }}
        extra={<Text type="secondary" style={{ fontSize: 12 }}>所有數據實時同步</Text>}
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          onRow={(record) => ({ 'data-e2e-id': `vip-config-table-row-${record.id}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          scroll={{ x: 3200 }}
          pagination={false}
          size="small"
          bordered
        />
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--ant-color-border)' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            表格支持橫向滾動查看所有列。點擊編輯按鈕修改該 VIP 等級配置。
          </Text>
        </div>
      </Card>

      <Modal
        title={
          <Space>
            <SettingOutlined />
            <span>編輯 VIP 配置 — {editingRecord?.tierRange} V{editingRecord?.vipLevel}</span>
          </Space>
        }
        open={editModalOpen}
        onOk={handleSave}
        onCancel={() => setEditModalOpen(false)}
        width={760}
        okText="確定"
        cancelText="取消"
      >
        {editingRecord && (
          <div data-e2e-id="vip-config-modal">
            <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            {/* 基本設定 */}
            <Divider orientation="left" orientationMargin={0}>基本設定</Divider>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Form.Item label="等級區間" name="tierRange">
                <Input data-e2e-id="vip-config-form-tier-range-input" disabled />
              </Form.Item>
              <Form.Item label="VIP 等級" name="vipLevel">
                <InputNumber data-e2e-id="vip-config-form-vip-level-input" disabled style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="XP 要求" name="xpRequired" rules={[{ required: true }]}>
                <InputNumber data-e2e-id="vip-config-form-xp-required-input" style={{ width: '100%' }} min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </div>

            {/* 獎勵設定 — 頁籤 */}
            <Divider orientation="left" orientationMargin={0}>獎勵設定</Divider>
            <Tabs
              data-e2e-id="vip-config-tab"
              defaultActiveKey="basic"
              items={[
                {
                  key: 'basic',
                  label: <span data-e2e-id="vip-config-tab-basic">基礎獎勵</span>,
                  children: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <Form.Item label="升級禮金 (₱)" name="upgradeBonus" rules={[{ required: true }]}>
                          <InputNumber data-e2e-id="vip-config-form-upgrade-bonus-input" style={{ width: '100%' }} min={0} />
                        </Form.Item>
                        <Form.Item label="流水要求" name="upgradeBonusFlow" rules={[{ required: true }]}>
                          <InputNumber data-e2e-id="vip-config-form-upgrade-bonus-flow-input" style={{ width: '100%' }} min={0} addonAfter="倍" />
                        </Form.Item>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <Form.Item label="生日禮金 (₱)" name="birthdayBonus" rules={[{ required: true }]}>
                          <InputNumber data-e2e-id="vip-config-form-birthday-bonus-input" style={{ width: '100%' }} min={0} />
                        </Form.Item>
                        <Form.Item label="流水要求" name="birthdayBonusFlow" rules={[{ required: true }]}>
                          <InputNumber data-e2e-id="vip-config-form-birthday-bonus-flow-input" style={{ width: '100%' }} min={0} addonAfter="倍" />
                        </Form.Item>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <Form.Item label="每日負盈利" name="dailyNegReturn" rules={[{ required: true }]}>
                          <Input data-e2e-id="vip-config-form-daily-neg-return-input" style={{ width: '100%' }} placeholder="例：3%" />
                        </Form.Item>
                        <Form.Item label="流水要求" name="dailyNegReturnFlow" rules={[{ required: true }]}>
                          <InputNumber data-e2e-id="vip-config-form-daily-neg-return-flow-input" style={{ width: '100%' }} min={0} addonAfter="倍" />
                        </Form.Item>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'biweekly',
                  label: <span data-e2e-id="vip-config-tab-biweekly">半月禮金</span>,
                  children: (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                      <Form.Item label="累計存款要求 (₱)" name="biweeklyDepositMin" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={0} />
                      </Form.Item>
                      <Form.Item label="Slot 最低有效流水 (₱)" name="minFlow" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={0} />
                      </Form.Item>
                      <Form.Item label="達標獎勵 (₱)" name="qualifyReward" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={0} />
                      </Form.Item>
                      <Form.Item label="流水要求" name="qualifyRewardFlow" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={0} addonAfter="倍" />
                      </Form.Item>
                      <Form.Item label="越級獎勵 (₱)" name="biweeklyUpgradeReward" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={0} />
                      </Form.Item>
                      <Form.Item label="流水要求" name="biweeklyUpgradeRewardFlow" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={0} addonAfter="倍" />
                      </Form.Item>
                    </div>
                  ),
                },
                {
                  key: 'checkin',
                  label: <span data-e2e-id="vip-config-tab-checkin">簽到</span>,
                  children: (
                    <>
                      <Alert
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                        message="第 1-5 天、8-15 天、18-25 天無簽到獎勵，僅第 6/7/16/17/26/27 天可領取彩金。滿 27 天後第 28 天重新從第 1 天開始。"
                      />

                      <Text strong style={{ display: 'block', marginBottom: 8 }}>補簽設定</Text>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px', marginBottom: 16 }}>
                        <Form.Item label="補簽累存 (₱)" name="makeupDeposit" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>
                        <Form.Item label="補簽上限 (次/月)" name="makeupLimit" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} min={0} max={10} />
                        </Form.Item>
                      </div>

                      <Divider style={{ margin: '8px 0 16px' }} />

                      <Text strong style={{ display: 'block', marginBottom: 12 }}>第 6 天</Text>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <Form.Item label="彩金 (₱)" name="day6" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>
                        <Form.Item label="流水要求" name="day6Flow" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} min={0} addonAfter="倍" />
                        </Form.Item>
                      </div>

                      <Text strong style={{ display: 'block', marginBottom: 12 }}>第 7 天</Text>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <Form.Item label="彩金 (₱)" name="day7P" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>
                        <Form.Item label="彩金流水要求" name="day7Flow" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} min={0} addonAfter="倍" />
                        </Form.Item>
                        <Form.Item label="Free Spins (次)" name="day7FS" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>
                        <Form.Item label="FS 流水要求" name="day7FSFlow" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} min={0} addonAfter="倍" />
                        </Form.Item>
                      </div>

                      <Divider style={{ margin: '8px 0 16px' }} />

                      <Text strong style={{ display: 'block', marginBottom: 12 }}>第 16 天</Text>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <Form.Item label="彩金 (₱)" name="day16" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>
                        <Form.Item label="流水要求" name="day16Flow" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} min={0} addonAfter="倍" />
                        </Form.Item>
                      </div>

                      <Text strong style={{ display: 'block', marginBottom: 12 }}>第 17 天</Text>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <Form.Item label="彩金 (₱)" name="day17P" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>
                        <Form.Item label="彩金流水要求" name="day17Flow" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} min={0} addonAfter="倍" />
                        </Form.Item>
                        <Form.Item label="Free Spins (次)" name="day17FS" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>
                        <Form.Item label="FS 流水要求" name="day17FSFlow" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} min={0} addonAfter="倍" />
                        </Form.Item>
                      </div>

                      <Divider style={{ margin: '8px 0 16px' }} />

                      <Text strong style={{ display: 'block', marginBottom: 12 }}>第 26 天</Text>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <Form.Item label="彩金 (₱)" name="day26" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>
                        <Form.Item label="流水要求" name="day26Flow" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} min={0} addonAfter="倍" />
                        </Form.Item>
                      </div>

                      <Text strong style={{ display: 'block', marginBottom: 12 }}>第 27 天</Text>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <Form.Item label="彩金 (₱)" name="day27P" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>
                        <Form.Item label="彩金流水要求" name="day27Flow" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} min={0} addonAfter="倍" />
                        </Form.Item>
                        <Form.Item label="Free Spins (次)" name="day27FS" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>
                        <Form.Item label="FS 流水要求" name="day27FSFlow" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} min={0} addonAfter="倍" />
                        </Form.Item>
                      </div>
                    </>
                  ),
                },
              ]}
            />
          </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}

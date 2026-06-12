'use client';

import React, { useState } from 'react';
import {
  Card, Table, Tag, Button, Typography, Modal, Form, Input, InputNumber, Select, Switch, Space, Tabs, message, Tooltip, Alert,
} from 'antd';
import { EditOutlined, PlusOutlined, QuestionCircleOutlined, MobileOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  depositChannels as initialChannels,
  depositMerchants as initialMerchants,
  type DepositChannel,
  type DepositMerchant,
  type ClientType,
} from '@/data/paymentChannelData';

const { Title, Text } = Typography;

const CLIENT_OPTIONS: ClientType[] = ['PC', 'H5', 'Android', 'iOS'];
const CATEGORY_OPTIONS = ['GCash', 'Maya', 'QRPH', 'GrabPay', 'Palawan', 'InstaPay', 'PesoNet', '7-11', 'COINS', 'Huawei IAP'];

export default function PaymentChannelsPage() {
  const [channels, setChannels] = useState<DepositChannel[]>([...initialChannels]);
  const [merchants] = useState<DepositMerchant[]>([...initialMerchants]);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<DepositChannel | null>(null);
  const [form] = Form.useForm<DepositChannel>();
  const [addForm] = Form.useForm<DepositChannel>();

  const openEdit = (record: DepositChannel) => {
    setEditing(record);
    form.setFieldsValue(record);
    setEditOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      setChannels(prev => prev.map(c => c.id === editing!.id ? { ...c, ...values } : c));
      setEditOpen(false);
      message.success('渠道配置已更新');
    });
  };

  const handleAdd = () => {
    addForm.validateFields().then((values) => {
      const nextId = Math.max(...channels.map(c => c.id)) + 1;
      const channelId = values.channelId || `HW-IAP-${Date.now()}`;
      setChannels(prev => [...prev, { ...values, id: nextId, channelId, status: true, visible: true }]);
      setAddOpen(false);
      addForm.resetFields();
      message.success('渠道已新增');
    });
  };

  const channelColumns: ColumnsType<DepositChannel> = [
    { title: '序號', dataIndex: 'id', width: 60, align: 'center' },
    { title: '渠道ID', dataIndex: 'channelId', width: 180, ellipsis: true },
    {
      title: '渠道名稱', dataIndex: 'nameEn', width: 140,
      render: (v, r) => (
        <Space>
          <span>{v}</span>
          {r.huaweiExclusive && <Tag color="orange" data-e2e-id={`channel-huawei-tag-${r.id}`}>華為包專屬</Tag>}
        </Space>
      ),
    },
    {
      title: '渠道分類', dataIndex: 'category', width: 110,
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '調用模式', dataIndex: 'callMode', width: 90, align: 'center',
      render: (v) => <Tag color={v === '輪詢' ? 'green' : 'default'}>{v}</Tag>,
    },
    { title: '排序權重', dataIndex: 'weight', width: 90, align: 'center' },
    {
      title: '渠道狀態', dataIndex: 'status', width: 90, align: 'center',
      render: (v, r) => <Switch checked={v} size="small" data-e2e-id={`channel-status-${r.id}`} />,
    },
    {
      title: '適用客戶端', dataIndex: 'clientTypes', width: 200,
      render: (v: ClientType[]) => v.map(t => <Tag key={t}>{t}</Tag>),
    },
    {
      title: (
        <Space size={4}>
          華為包專屬
          <Tooltip title="開啟後此渠道只在華為包（AppGallery 上架版本）顯示，並走 Huawei IAP 支付流程；一般 Google Play / iOS / PC / H5 不會看到。">
            <QuestionCircleOutlined style={{ color: '#999' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'huaweiExclusive', width: 120, align: 'center',
      render: (v, r) => (
        <Switch
          checked={v}
          checkedChildren={<MobileOutlined />}
          size="small"
          data-e2e-id={`channel-huawei-flag-${r.id}`}
          onChange={(checked) => {
            setChannels(prev => prev.map(c => c.id === r.id ? { ...c, huaweiExclusive: checked } : c));
            message.success(checked ? `${r.nameEn} 已標記為華為包專屬` : `${r.nameEn} 已取消華為包專屬`);
          }}
        />
      ),
    },
    {
      title: '操作', width: 80, align: 'center', fixed: 'right',
      render: (_, r) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(r)} data-e2e-id={`channel-edit-${r.id}`}>
          編輯
        </Button>
      ),
    },
  ];

  const merchantColumns: ColumnsType<DepositMerchant> = [
    { title: '序號', dataIndex: 'id', width: 60, align: 'center' },
    { title: '商戶ID', dataIndex: 'merchantId', width: 100 },
    { title: '商戶名稱', dataIndex: 'nameEn', width: 200 },
    { title: '歸屬渠道', dataIndex: 'channelName', width: 130, render: (v) => <Tag color="blue">{v}</Tag> },
    {
      title: '金額範圍', width: 160, align: 'right',
      render: (_, r) => `₱${r.amountMin.toLocaleString()} ~ ₱${r.amountMax.toLocaleString()}`,
    },
    { title: '優先級權重', dataIndex: 'weight', width: 100, align: 'center' },
    {
      title: '商戶狀態', dataIndex: 'status', width: 100, align: 'center',
      render: (v) => <Switch checked={v} size="small" />,
    },
    { title: '操作', width: 80, align: 'center', render: () => <Button type="link" icon={<EditOutlined />}>編輯</Button> },
  ];

  const channelTab = (
    <div>
      <Alert
        message="渠道配置新增「華為包專屬」flag"
        description="此欄位用於判斷渠道是否僅供華為包 (AppGallery 上架版本) 使用。當客戶端為華為包時，後端 API 將只回傳 huaweiExclusive=true 的渠道；其他客戶端則只看到 huaweiExclusive=false 的渠道。預設為 false。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { addForm.resetFields(); setAddOpen(true); }} data-e2e-id="channel-add-btn">
          添加存款渠道
        </Button>
      </Space>
      <Table
        rowKey="id"
        size="small"
        columns={channelColumns}
        dataSource={channels}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 1400 }}
        data-e2e-id="channel-table"
      />
    </div>
  );

  const merchantTab = (
    <Table
      rowKey="id"
      size="small"
      columns={merchantColumns}
      dataSource={merchants}
      pagination={{ pageSize: 20 }}
      scroll={{ x: 1100 }}
    />
  );

  const placeholderTab = (label: string) => (
    <Card><Text type="secondary">{label} 配置（仿 FAT 後台同名 Tab，本 Demo 僅展示存款渠道與商戶配置）</Text></Card>
  );

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>支付渠道 V2（含華為包專屬 flag）</Title>
      <Text type="secondary">仿 FAT 後台 <Text code>/payment/channel-ordersV2</Text>，新增「華為包專屬」flag 用於華為應用市場上架版本的支付渠道區隔。</Text>
      <Card style={{ marginTop: 16 }}>
        <Tabs
          defaultActiveKey="channel"
          items={[
            { key: 'channel', label: '存款渠道配置', children: channelTab },
            { key: 'merchant', label: '存款商戶配置', children: merchantTab },
            { key: 'withdraw-channel', label: '提現渠道配置', children: placeholderTab('提現渠道') },
            { key: 'withdraw-merchant', label: '提現商戶配置', children: placeholderTab('提現商戶') },
            { key: 'bank', label: '銀行列表', children: placeholderTab('銀行列表') },
          ]}
        />
      </Card>

      <Modal
        title="存款渠道配置"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={handleSave}
        width={720}
        okText="確認"
        cancelText="取消"
        data-e2e-id="channel-edit-modal"
      >
        <Form form={form} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 16 }} style={{ marginTop: 16 }}>
          <Form.Item label="渠道ID" name="channelId">
            <Input disabled />
          </Form.Item>
          <Form.Item label="存款渠道名稱(EN)" name="nameEn" rules={[{ required: true, max: 50 }]}>
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item label="渠道名稱(TA)" name="nameTa">
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item label="分類" name="category" rules={[{ required: true }]}>
            <Select options={CATEGORY_OPTIONS.map(c => ({ label: c, value: c }))} />
          </Form.Item>
          <Form.Item label="適用客戶端" name="clientTypes" rules={[{ required: true }]}>
            <Select mode="multiple" options={CLIENT_OPTIONS.map(c => ({ label: c, value: c }))} />
          </Form.Item>
          <Form.Item
            label={
              <Space size={4}>
                華為包專屬
                <Tooltip title="開啟後此渠道只在華為包顯示，並改走 Huawei IAP 流程">
                  <QuestionCircleOutlined style={{ color: '#999' }} />
                </Tooltip>
              </Space>
            }
            name="huaweiExclusive"
            valuePropName="checked"
            extra="開啟後本渠道僅供華為應用市場 (AppGallery) 上架的 App 版本使用，後端會檢查請求來源並過濾"
          >
            <Switch checkedChildren="是" unCheckedChildren="否" data-e2e-id="channel-edit-huawei-flag" />
          </Form.Item>
          <Form.Item label="支持金額範圍" required>
            <Space>
              <Form.Item name="amountMin" noStyle rules={[{ required: true }]}>
                <InputNumber prefix="₱" min={0} style={{ width: 160 }} />
              </Form.Item>
              <span>~</span>
              <Form.Item name="amountMax" noStyle rules={[{ required: true }]}>
                <InputNumber prefix="₱" min={0} style={{ width: 160 }} />
              </Form.Item>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加存款渠道"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={handleAdd}
        width={720}
        okText="新增"
        cancelText="取消"
        data-e2e-id="channel-add-modal"
      >
        <Form form={addForm} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 16 }} style={{ marginTop: 16 }} initialValues={{ huaweiExclusive: false, callMode: '一般', weight: 1, clientTypes: ['Android'], amountMin: 100, amountMax: 10000 }}>
          <Form.Item label="渠道ID" name="channelId" extra="留空將自動生成（demo）">
            <Input placeholder="自動生成" />
          </Form.Item>
          <Form.Item label="存款渠道名稱(EN)" name="nameEn" rules={[{ required: true, max: 50 }]}>
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item label="渠道名稱(TA)" name="nameTa">
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item label="分類" name="category" rules={[{ required: true }]}>
            <Select options={CATEGORY_OPTIONS.map(c => ({ label: c, value: c }))} />
          </Form.Item>
          <Form.Item label="調用模式" name="callMode">
            <Select options={[{ label: '輪詢', value: '輪詢' }, { label: '一般', value: '一般' }]} />
          </Form.Item>
          <Form.Item label="排序權重" name="weight">
            <InputNumber min={1} max={999} style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="適用客戶端" name="clientTypes" rules={[{ required: true }]}>
            <Select mode="multiple" options={CLIENT_OPTIONS.map(c => ({ label: c, value: c }))} />
          </Form.Item>
          <Form.Item
            label={
              <Space size={4}>
                華為包專屬
                <Tooltip title="開啟後此渠道只在華為包顯示，並改走 Huawei IAP 流程">
                  <QuestionCircleOutlined style={{ color: '#999' }} />
                </Tooltip>
              </Space>
            }
            name="huaweiExclusive"
            valuePropName="checked"
            extra="開啟後本渠道僅供華為應用市場 (AppGallery) 上架的 App 版本使用"
          >
            <Switch checkedChildren="是" unCheckedChildren="否" data-e2e-id="channel-add-huawei-flag" />
          </Form.Item>
          <Form.Item label="支持金額範圍" required>
            <Space>
              <Form.Item name="amountMin" noStyle rules={[{ required: true }]}>
                <InputNumber prefix="₱" min={0} style={{ width: 160 }} />
              </Form.Item>
              <span>~</span>
              <Form.Item name="amountMax" noStyle rules={[{ required: true }]}>
                <InputNumber prefix="₱" min={0} style={{ width: 160 }} />
              </Form.Item>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

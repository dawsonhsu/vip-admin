'use client';

import React, { useState } from 'react';
import {
  Card, Table, Tag, Button, Typography, Modal, Form, Input, InputNumber, Select, Switch, Space, Tabs, message, Tooltip, Alert,
} from 'antd';
import { EditOutlined, PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
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

const PACKAGE_SCOPE_TIP = '輸入 App 包識別字串 (例 huawei) 後，僅 source / X-App-Package header 值相同的客戶端才能取得本渠道。留空代表所有客戶端皆可見。';

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
      setChannels(prev => prev.map(c => c.id === editing!.id ? { ...c, ...values, packageScope: (values.packageScope || '').trim() } : c));
      setEditOpen(false);
      message.success('渠道配置已更新');
    });
  };

  const handleAdd = () => {
    addForm.validateFields().then((values) => {
      const nextId = Math.max(...channels.map(c => c.id)) + 1;
      const channelId = values.channelId || `CH-${Date.now()}`;
      setChannels(prev => [...prev, { ...values, id: nextId, channelId, status: true, visible: true, packageScope: (values.packageScope || '').trim() }]);
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
          {r.packageScope && <Tag color="orange" data-e2e-id={`channel-scope-tag-${r.id}`}>{r.packageScope}</Tag>}
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
          渠道包專屬
          <Tooltip title={PACKAGE_SCOPE_TIP}>
            <QuestionCircleOutlined style={{ color: '#999' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'packageScope', width: 140, align: 'center',
      render: (v: string, r) => (
        v
          ? <Tag color="orange" data-e2e-id={`channel-scope-${r.id}`}>{v}</Tag>
          : <Text type="secondary" data-e2e-id={`channel-scope-${r.id}`}>—</Text>
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
        message="渠道配置新增「渠道包專屬 (packageScope)」字串欄位"
        description={
          <div>
            <div>非對稱可見規則：</div>
            <div>• 欄位留空：所有客戶端皆可見此渠道</div>
            <div>• 欄位有值 (例 huawei)：僅 source / X-App-Package header 為相同字串的客戶端能取得此渠道</div>
            <div>例：華為包用戶可看到「無 scope」+「scope=huawei」的所有渠道；一般 Android 用戶只看得到「無 scope」的渠道，不會看到 Huawei IAP。</div>
          </div>
        }
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
      <Title level={3}>支付渠道 V2（含渠道包專屬 packageScope）</Title>
      <Text type="secondary">仿 FAT 後台 <Text code>/payment/channel-ordersV2</Text>，新增「渠道包專屬 (packageScope)」字串欄位，用於依 App 包來源過濾可見渠道。</Text>
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
                渠道包專屬
                <Tooltip title={PACKAGE_SCOPE_TIP}>
                  <QuestionCircleOutlined style={{ color: '#999' }} />
                </Tooltip>
              </Space>
            }
            name="packageScope"
            extra="留空 = 所有客戶端皆可見；填字串 (例 huawei) = 僅 source / X-App-Package 為相同值的客戶端可見。可支援未來其他特殊包 (例 ios-test、b2b)。"
          >
            <Input maxLength={32} placeholder="留空 = 所有客戶端可見；例：huawei" data-e2e-id="channel-edit-scope" />
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
        <Form form={addForm} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 16 }} style={{ marginTop: 16 }} initialValues={{ packageScope: '', callMode: '一般', weight: 1, clientTypes: ['Android'], amountMin: 100, amountMax: 10000 }}>
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
                渠道包專屬
                <Tooltip title={PACKAGE_SCOPE_TIP}>
                  <QuestionCircleOutlined style={{ color: '#999' }} />
                </Tooltip>
              </Space>
            }
            name="packageScope"
            extra="留空 = 所有客戶端皆可見；填字串 (例 huawei) = 僅對應包可見。"
          >
            <Input maxLength={32} placeholder="留空 = 所有客戶端可見；例：huawei" data-e2e-id="channel-add-scope" />
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

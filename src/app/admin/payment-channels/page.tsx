'use client';

import React, { useState } from 'react';
import {
  Card, Table, Tag, Button, Typography, Modal, Form, Input, InputNumber, Select, Switch, Space, Tabs, message, Tooltip, Alert, Avatar, Checkbox, Divider,
} from 'antd';
import { EditOutlined, PlusOutlined, QuestionCircleOutlined, UserOutlined, PictureOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  depositChannels as initialChannels,
  depositMerchants as initialMerchants,
  VIP_LEVEL_OPTIONS, RISK_LABEL_OPTIONS,
  type DepositChannel, type DepositMerchant, type ClientType, type DepositMerchantConfigItem,
} from '@/data/paymentChannelData';

const { Title, Text } = Typography;

const CLIENT_OPTIONS: ClientType[] = ['PC', 'H5', 'Android', 'iOS'];
const CATEGORY_OPTIONS = ['GCash', 'Maya', 'QRPH', 'GrabPay', 'Palawan', 'InstaPay', 'PesoNet', '7-11', 'COINS', 'Huawei IAP'];
const PACKAGE_SCOPE_TIP = '輸入 App 包識別字串 (例 huawei) 後，僅 source / X-App-Package header 值相同的客戶端才能取得本渠道。留空代表所有客戶端皆可見。';

const brandColor: Record<string, string> = {
  GCash: '#1672ec', Maya: '#33b15e', QRPH: '#0d4d9a', GrabPay: '#00b14f',
  Palawan: '#e30613', InstaPay: '#1c4193', PesoNet: '#3070b1', 'Huawei IAP': '#ff6a00',
};

const renderIcon = (category: string) => {
  const c = brandColor[category];
  if (c) {
    return <Avatar size={36} style={{ backgroundColor: c, color: '#fff', fontWeight: 700 }}>{category.slice(0, 2)}</Avatar>;
  }
  return <Avatar size={36} icon={<PictureOutlined />} />;
};

const renderAmountList = (arr: number[]) => arr.length ? arr.join(',') : '—';
const renderTagList = (arr: string[], color = 'blue') => arr.length ? arr.map(v => <Tag key={v} color={color}>{v}</Tag>) : <Text type="secondary">—</Text>;
const renderNullable = (v: number | null, suffix = '') => v == null ? <Text type="secondary">—</Text> : <span>{v}{suffix}</span>;

export default function PaymentChannelsPage() {
  const [channels, setChannels] = useState<DepositChannel[]>([...initialChannels]);
  const [merchants, setMerchants] = useState<DepositMerchant[]>([...initialMerchants]);
  const [editChannelOpen, setEditChannelOpen] = useState(false);
  const [addChannelOpen, setAddChannelOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<DepositChannel | null>(null);
  const [editMerchantOpen, setEditMerchantOpen] = useState(false);
  const [addMerchantOpen, setAddMerchantOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<DepositMerchant | null>(null);

  const [channelForm] = Form.useForm();
  const [channelAddForm] = Form.useForm();
  const [merchantForm] = Form.useForm();
  const [merchantAddForm] = Form.useForm();

  // --- helpers to convert array <-> comma string for amount button inputs
  const amountListToText = (arr: number[]) => arr.join(',');
  const textToAmountList = (text: string): number[] =>
    (text || '').split(/[,，\s]+/).map(s => parseInt(s, 10)).filter(n => !isNaN(n) && n > 0);

  // ===== Channel handlers
  const openEditChannel = (record: DepositChannel) => {
    setEditingChannel(record);
    channelForm.setFieldsValue({
      ...record,
      firstButtonsText: amountListToText(record.firstDepositButtons),
      repeatButtonsText: amountListToText(record.repeatDepositButtons),
    });
    setEditChannelOpen(true);
  };
  const saveChannel = () => {
    channelForm.validateFields().then((values: any) => {
      const next: Partial<DepositChannel> = {
        ...values,
        firstDepositButtons: textToAmountList(values.firstButtonsText),
        repeatDepositButtons: textToAmountList(values.repeatButtonsText),
        packageScope: (values.packageScope || '').trim(),
        lastUpdatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        updatedBy: 'darren@filbetph.com',
      };
      delete (next as any).firstButtonsText;
      delete (next as any).repeatButtonsText;
      setChannels(prev => prev.map(c => c.id === editingChannel!.id ? { ...c, ...next } as DepositChannel : c));
      setEditChannelOpen(false);
      message.success('渠道配置已更新');
    });
  };
  const addChannel = () => {
    channelAddForm.validateFields().then((values: any) => {
      const nextId = Math.max(...channels.map(c => c.id)) + 1;
      const channelId = values.channelId || `CH-${Date.now()}`;
      const newRow: DepositChannel = {
        ...values,
        id: nextId, channelId,
        firstDepositButtons: textToAmountList(values.firstButtonsText),
        repeatDepositButtons: textToAmountList(values.repeatButtonsText),
        packageScope: (values.packageScope || '').trim(),
        lastUpdatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        updatedBy: 'darren@filbetph.com',
        iconUrl: '',
      };
      delete (newRow as any).firstButtonsText;
      delete (newRow as any).repeatButtonsText;
      setChannels(prev => [...prev, newRow]);
      setAddChannelOpen(false);
      channelAddForm.resetFields();
      message.success('渠道已新增');
    });
  };

  // ===== Merchant handlers
  const openEditMerchant = (record: DepositMerchant) => {
    setEditingMerchant(record);
    merchantForm.setFieldsValue(record);
    setEditMerchantOpen(true);
  };
  const saveMerchant = () => {
    merchantForm.validateFields().then((values: any) => {
      const next = {
        ...values,
        lastUpdatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        updatedBy: 'darren@filbetph.com',
      };
      setMerchants(prev => prev.map(c => c.id === editingMerchant!.id ? { ...c, ...next } : c));
      setEditMerchantOpen(false);
      message.success('商戶配置已更新');
    });
  };
  const addMerchant = () => {
    merchantAddForm.validateFields().then((values: any) => {
      const nextId = Math.max(...merchants.map(c => c.id)) + 1;
      const merchantId = values.merchantId || String(1300 + nextId);
      setMerchants(prev => [...prev, {
        ...values, id: nextId, merchantId,
        successRate100: null, arrivalTime100: null,
        lastUpdatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        updatedBy: 'darren@filbetph.com',
      }]);
      setAddMerchantOpen(false);
      merchantAddForm.resetFields();
      message.success('商戶已新增');
    });
  };

  // ===== Columns
  const channelColumns: ColumnsType<DepositChannel> = [
    { title: '序號', dataIndex: 'id', width: 60, align: 'center', fixed: 'left' },
    { title: '渠道ID', dataIndex: 'channelId', width: 180, ellipsis: true, fixed: 'left' },
    { title: '渠道名稱', dataIndex: 'nameEn', width: 140, fixed: 'left' },
    { title: '渠道圖標', dataIndex: 'iconUrl', width: 90, align: 'center', render: (_, r) => renderIcon(r.category) },
    { title: '調用模式', dataIndex: 'callMode', width: 90, align: 'center', render: (v) => <Tag color={v === '輪詢' ? 'green' : 'default'}>{v}</Tag> },
    { title: '排序權重', dataIndex: 'weight', width: 90, align: 'center' },
    { title: '渠道狀態', dataIndex: 'status', width: 90, align: 'center', render: (v) => <Switch checked={v} size="small" /> },
    { title: '適用客戶端', dataIndex: 'clientTypes', width: 200, render: (v: ClientType[]) => v.map(t => <Tag key={t}>{t}</Tag>) },
    { title: '可見會員等級範圍', dataIndex: 'visibleVipLevels', width: 160, render: (v: string[]) => renderTagList(v, 'purple') },
    { title: '可見會員風控標籤', dataIndex: 'visibleRiskLabels', width: 160, render: (v: string[]) => renderTagList(v, 'red') },
    { title: '快捷金額按鈕', dataIndex: 'repeatDepositButtons', width: 200, render: (v: number[]) => renderAmountList(v) },
    {
      title: (
        <Space size={4}>渠道包專屬
          <Tooltip title={PACKAGE_SCOPE_TIP}><QuestionCircleOutlined style={{ color: '#999' }} /></Tooltip>
        </Space>
      ),
      dataIndex: 'packageScope', width: 140, align: 'center',
      render: (v: string, r) => v
        ? <Tag color="orange" data-e2e-id={`channel-scope-${r.id}`}>{v}</Tag>
        : <Text type="secondary" data-e2e-id={`channel-scope-${r.id}`}>—</Text>,
    },
    { title: '最後更新時間', dataIndex: 'lastUpdatedAt', width: 160 },
    { title: '更新人', dataIndex: 'updatedBy', width: 180, ellipsis: true },
    {
      title: '操作', width: 80, align: 'center', fixed: 'right',
      render: (_, r) => <Button type="link" icon={<EditOutlined />} onClick={() => openEditChannel(r)} data-e2e-id={`channel-edit-${r.id}`}>編輯</Button>,
    },
  ];

  const merchantColumns: ColumnsType<DepositMerchant> = [
    { title: '序號', dataIndex: 'id', width: 60, align: 'center', fixed: 'left' },
    { title: '商戶ID', dataIndex: 'merchantId', width: 100, fixed: 'left' },
    { title: '商戶名稱', dataIndex: 'nameEn', width: 200, fixed: 'left' },
    { title: '歸屬渠道', dataIndex: 'channelName', width: 130, render: (v) => <Tag color="blue">{v}</Tag> },
    { title: '金額範圍', width: 180, align: 'right', render: (_, r) => `₱${r.amountMin.toLocaleString()} - ₱${r.amountMax.toLocaleString()}` },
    { title: '優先級權重', dataIndex: 'weight', width: 100, align: 'center' },
    { title: '商戶狀態', dataIndex: 'status', width: 100, align: 'center', render: (v) => <Switch checked={v} size="small" /> },
    { title: '可見會員等級範圍', dataIndex: 'visibleVipLevels', width: 160, render: (v: string[]) => renderTagList(v, 'purple') },
    { title: '可見會員風控標籤', dataIndex: 'visibleRiskLabels', width: 160, render: (v: string[]) => renderTagList(v, 'red') },
    { title: '近100單成功率', dataIndex: 'successRate100', width: 130, align: 'center', render: (v) => renderNullable(v, '%') },
    { title: '近100單到帳時間', dataIndex: 'arrivalTime100', width: 150, align: 'center', render: (v) => renderNullable(v, 's') },
    { title: '最後更新時間', dataIndex: 'lastUpdatedAt', width: 160 },
    { title: '更新人', dataIndex: 'updatedBy', width: 180, ellipsis: true },
    {
      title: '操作', width: 80, align: 'center', fixed: 'right',
      render: (_, r) => <Button type="link" icon={<EditOutlined />} onClick={() => openEditMerchant(r)}>編輯</Button>,
    },
  ];

  // ===== Channel form (used by Edit and Add)
  const ChannelFormFields: React.FC<{ form: any; isAdd?: boolean }> = ({ form, isAdd }) => (
    <Form form={form} layout="horizontal" labelCol={{ span: 8 }} wrapperCol={{ span: 14 }} style={{ marginTop: 16 }}>
      <Form.Item label="渠道ID" name="channelId" extra={isAdd ? '留空將自動生成（demo）' : undefined}>
        <Input disabled={!isAdd} placeholder={isAdd ? '自動生成' : ''} />
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
      <Form.Item label="渠道圖片" extra="請上傳 .webp 格式的圖片（demo 僅展示）">
        <Button icon={<PictureOutlined />}>選擇圖片</Button>
      </Form.Item>
      <Form.Item label="適用客戶端" name="clientTypes" rules={[{ required: true }]}>
        <Select mode="multiple" options={CLIENT_OPTIONS.map(c => ({ label: c, value: c }))} />
      </Form.Item>
      <Form.Item label="支持金額範圍" required>
        <Space>
          <Form.Item name="amountMin" noStyle rules={[{ required: true }]}>
            <InputNumber prefix="₱" min={0} style={{ width: 140 }} />
          </Form.Item>
          <span>~</span>
          <Form.Item name="amountMax" noStyle rules={[{ required: true }]}>
            <InputNumber prefix="₱" min={0} style={{ width: 140 }} />
          </Form.Item>
        </Space>
      </Form.Item>
      <Form.Item label="調用模式" name="callMode">
        <Select options={[{ label: '輪詢', value: '輪詢' }, { label: '一般', value: '一般' }]} />
      </Form.Item>
      <Form.Item label="首充金額按鈕清單" name="firstButtonsText" extra="逗號分隔，例 100,200,500,1000">
        <Input placeholder="100,200,500,1000" />
      </Form.Item>
      <Form.Item label="復充金額按鈕清單" name="repeatButtonsText" extra="逗號分隔，例 200,500,1000,2000,5000">
        <Input placeholder="200,500,1000,2000,5000" />
      </Form.Item>
      <Form.Item label="排序權重" name="weight">
        <InputNumber min={1} max={999} style={{ width: 140 }} />
      </Form.Item>
      <Form.Item label="可見會員等級範圍" name="visibleVipLevels">
        <Select mode="multiple" placeholder="請選擇" options={VIP_LEVEL_OPTIONS.map(v => ({ label: v, value: v }))} />
      </Form.Item>
      <Form.Item
        label={
          <Space size={4}>渠道包專屬
            <Tooltip title={PACKAGE_SCOPE_TIP}><QuestionCircleOutlined style={{ color: '#999' }} /></Tooltip>
          </Space>
        }
        name="packageScope"
        extra="留空 = 所有客戶端可見；填字串（例 huawei）= 僅對應包可見。"
      >
        <Input maxLength={32} placeholder="留空 = 所有客戶端可見；例：huawei" />
      </Form.Item>
    </Form>
  );

  // ===== Merchant form
  const MerchantFormFields: React.FC<{ form: any; isAdd?: boolean }> = ({ form, isAdd }) => (
    <Form form={form} layout="horizontal" labelCol={{ span: 8 }} wrapperCol={{ span: 14 }} style={{ marginTop: 16 }}>
      <Form.Item label="商戶ID" name="merchantId" extra={isAdd ? '自動生成不可修改' : undefined}>
        <Input disabled placeholder="自動生成" />
      </Form.Item>
      <Form.Item label="商戶名稱（EN）" name="nameEn" rules={[{ required: true, max: 50 }]}>
        <Input maxLength={50} placeholder="最多輸入50個英文字符" />
      </Form.Item>
      <Form.Item label="商戶名稱（TA）" name="nameTa">
        <Input maxLength={50} placeholder="最多輸入50個英文字符" />
      </Form.Item>
      <Form.Item label="歸屬渠道" name="channelName" rules={[{ required: true }]}>
        <Select placeholder="請選擇" options={channels.map(c => ({ label: c.nameEn, value: c.nameEn }))} />
      </Form.Item>
      <Form.Item label="優先級權重" name="weight">
        <InputNumber min={1} max={999} style={{ width: 140 }} />
      </Form.Item>
      <Form.Item label="支持金額範圍" required>
        <Space>
          <Form.Item name="amountMin" noStyle rules={[{ required: true }]}>
            <InputNumber prefix="₱" min={0} style={{ width: 140 }} />
          </Form.Item>
          <span>~</span>
          <Form.Item name="amountMax" noStyle rules={[{ required: true }]}>
            <InputNumber prefix="₱" min={0} style={{ width: 140 }} />
          </Form.Item>
        </Space>
      </Form.Item>
      <Form.Item label="開啟訂單超時自動關閉">
        <Space>
          <Form.Item name="autoCloseEnabled" noStyle valuePropName="checked">
            <Checkbox>訂單提交</Checkbox>
          </Form.Item>
          <Form.Item name="autoCloseHours" noStyle>
            <InputNumber min={1} max={24} style={{ width: 80 }} />
          </Form.Item>
          <span>小時後，仍未到帳，將自動關閉</span>
        </Space>
      </Form.Item>
      <Form.Item label="可見會員等級範圍" name="visibleVipLevels">
        <Select mode="multiple" placeholder="請選擇" options={VIP_LEVEL_OPTIONS.map(v => ({ label: v, value: v }))} />
      </Form.Item>
      <Form.Item label="可見會員風控標籤" name="visibleRiskLabels">
        <Select mode="multiple" placeholder="請選擇 (留空 = 不限制)" options={RISK_LABEL_OPTIONS.map(v => ({ label: v, value: v }))} />
      </Form.Item>
      <Divider style={{ margin: '12px 0' }}>商戶對接配置</Divider>
      <Form.List name="configs">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...rest }) => (
              <Form.Item label={name === 0 ? '配置' : ' '} colon={name === 0} key={key} style={{ marginBottom: 8 }}>
                <Space>
                  <Form.Item {...rest} name={[name, 'key']} noStyle><Input placeholder="key" style={{ width: 150 }} /></Form.Item>
                  <Form.Item {...rest} name={[name, 'value']} noStyle><Input placeholder="value" style={{ width: 240 }} /></Form.Item>
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                </Space>
              </Form.Item>
            ))}
            <Form.Item wrapperCol={{ offset: 8, span: 14 }}>
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ key: '', value: '' })}>增加配置</Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </Form>
  );

  const channelTab = (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { channelAddForm.resetFields(); setAddChannelOpen(true); }} data-e2e-id="channel-add-btn">
          添加存款渠道
        </Button>
      </Space>
      <Table
        rowKey="id" size="small"
        columns={channelColumns}
        dataSource={channels}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 2300 }}
      />
    </div>
  );

  const merchantTab = (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { merchantAddForm.resetFields(); setAddMerchantOpen(true); }}>
          添加存款商戶
        </Button>
      </Space>
      <Table
        rowKey="id" size="small"
        columns={merchantColumns}
        dataSource={merchants}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 2000 }}
      />
    </div>
  );

  const placeholderTab = (label: string) => (
    <Card><Text type="secondary">{label} 配置（仿 FAT 同名 Tab；本 Demo 僅展示存款渠道與商戶配置）</Text></Card>
  );

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>支付渠道 V2</Title>
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

      <Modal title="存款渠道配置" open={editChannelOpen} onCancel={() => setEditChannelOpen(false)} onOk={saveChannel} width={820} okText="確認" cancelText="取消">
        <ChannelFormFields form={channelForm} />
      </Modal>
      <Modal title="添加存款渠道" open={addChannelOpen} onCancel={() => setAddChannelOpen(false)} onOk={addChannel} width={820} okText="新增" cancelText="取消">
        <ChannelFormFields form={channelAddForm} isAdd />
      </Modal>
      <Modal title="存款商戶配置" open={editMerchantOpen} onCancel={() => setEditMerchantOpen(false)} onOk={saveMerchant} width={820} okText="確認" cancelText="取消">
        <MerchantFormFields form={merchantForm} />
      </Modal>
      <Modal title="添加存款商戶" open={addMerchantOpen} onCancel={() => setAddMerchantOpen(false)} onOk={addMerchant} width={820} okText="新增" cancelText="取消">
        <MerchantFormFields form={merchantAddForm} isAdd />
      </Modal>
    </div>
  );
}

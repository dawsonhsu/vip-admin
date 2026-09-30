'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, DatePicker, Form, Input, InputNumber, message, Modal, Row, Select, Space, Switch, Table, Typography } from 'antd';
import { ColumnHeightOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { generatePagcorShops, normalizePagcorDomains, validatePagcorDomains, type PagcorShop } from '@/data/pagcorShopData';
import { rangeOf, type PagcorQuickRange } from '@/lib/pagcorReportUtils';

const { Title } = Typography;
const { RangePicker } = DatePicker;
interface ShopFilters {
  name?: string;
  state?: 1 | 2;
  operator?: string;
  note?: string;
  dateRange?: [Dayjs, Dayjs] | null;
}
interface ShopForm {
  id: number;
  name: string;
  address?: string;
  filbetDomains?: string;
  filplayDomains?: string;
  enabled: boolean;
  note?: string;
}
const quickButtons: Array<{ key: PagcorQuickRange; label: string; id: string }> = [
  { key: 'today', label: '今 日', id: 'today' }, { key: 'yesterday', label: '昨 日', id: 'yesterday' },
  { key: 'week', label: '本 周', id: 'week' }, { key: 'month', label: '本 月', id: 'month' },
  { key: 'lastMonth', label: '上 月', id: 'last-month' },
];

export default function MerchantPage() {
  const [form] = Form.useForm<ShopFilters>();
  const [editForm] = Form.useForm<ShopForm>();
  const [messageApi, contextHolder] = message.useMessage();
  const [records, setRecords] = useState<PagcorShop[]>([]);
  const [filters, setFilters] = useState<ShopFilters>({});
  const [mounted, setMounted] = useState(false);
  const [activeQuick, setActiveQuick] = useState<PagcorQuickRange | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PagcorShop | null>(null);

  useEffect(() => {
    setRecords(generatePagcorShops(dayjs()));
    setMounted(true);
  }, []);

  const filteredData = useMemo(() => records.filter((record) => {
    for (const key of ['name', 'operator', 'note'] as const) {
      if (filters[key] && !record[key].toLowerCase().includes(filters[key]!.trim().toLowerCase())) return false;
    }
    if (filters.state && filters.state !== record.state) return false;
    const range = filters.dateRange;
    if (range?.[0] && range?.[1]) {
      const time = dayjs(record.createdAt);
      if (time.isBefore(range[0]) || time.isAfter(range[1])) return false;
    }
    return true;
  }), [records, filters]);

  const openEditor = (record: PagcorShop | null) => {
    setEditing(record);
    setModalOpen(true);
  };
  const onSave = async () => {
    let values: ShopForm;
    try {
      values = await editForm.validateFields();
    } catch {
      return;
    }
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const saved: PagcorShop = {
      id: values.id,
      name: values.name.trim(),
      address: values.address?.trim() ?? '',
      filbetDomains: normalizePagcorDomains(values.filbetDomains),
      filplayDomains: normalizePagcorDomains(values.filplayDomains),
      state: values.enabled ? 1 : 2,
      createdAt: editing?.createdAt ?? now,
      operator: 'darren@filbetph.com',
      operatedAt: now,
      note: values.note?.trim() ?? '',
    };
    setRecords((current) => editing ? current.map((record) => record.id === editing.id ? saved : record) : [...current, saved]);
    setModalOpen(false);
    messageApi.success('保存成功');
  };
  const columns: ColumnsType<PagcorShop> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '门店名称', dataIndex: 'name', width: 260 },
    { title: '地址', dataIndex: 'address', width: 260, ellipsis: true },
    ...(['filbet', 'filplay'] as const).map((brand) => ({
      title: `${brand === 'filbet' ? 'Filbet' : 'Filplay'} 域名`, dataIndex: `${brand}Domains`, width: 220,
      render: (domains: string[]) => domains.length ? domains.map((domain) => <div key={domain}>{domain}</div>) : '-',
    })),
    { title: '创建时间', dataIndex: 'createdAt', width: 190 },
    { title: '状态', dataIndex: 'state', width: 90, render: (state: 1 | 2) => state === 1 ? '正常' : '关闭' },
    { title: '操作人', dataIndex: 'operator', width: 210 },
    { title: '操作时间', dataIndex: 'operatedAt', width: 190 },
    { title: '备注', dataIndex: 'note', width: 180 },
    { title: '操作', key: 'action', width: 80, fixed: 'right', render: (_, record) => <a data-e2e-id={`merchant-edit-link-${record.id}`} onClick={() => openEditor(record)}>编辑</a> },
  ];

  return <div>
    {contextHolder}
    <Card data-e2e-id="merchant-filter-card" style={{ marginBottom: 16 }}>
      <Form form={form} layout="horizontal" colon={false} labelCol={{ flex: '0 0 88px' }} wrapperCol={{ flex: '1 1 0', style: { minWidth: 0 } }}>
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12} xl={6}><Form.Item name="name" label="门店名称"><Input data-e2e-id="merchant-filter-name-input" placeholder="请输入门店名称" allowClear /></Form.Item></Col>
          <Col xs={24} sm={12} xl={6}><Form.Item name="state" label="状态"><Select data-e2e-id="merchant-filter-state-select" placeholder="请选择" allowClear options={[{ label: '正常', value: 1 }, { label: '关闭', value: 2 }]} /></Form.Item></Col>
          <Col xs={24} sm={12} xl={6}><Form.Item name="operator" label="操作人"><Input data-e2e-id="merchant-filter-operator-input" placeholder="请输入操作人" allowClear /></Form.Item></Col>
          <Col xs={24} sm={12} xl={6}><Form.Item name="note" label="备注"><Input data-e2e-id="merchant-filter-note-input" placeholder="请输入备注" allowClear /></Form.Item></Col>
          <Col xs={24}>
            <Form.Item label="创建时间"><Space wrap={false} size={8}>
              <Form.Item name="dateRange" noStyle><RangePicker data-e2e-id="merchant-filter-date-range" showTime format="YYYY-MM-DD HH:mm:ss" placeholder={['开始日期', '结束日期']} style={{ width: 380 }} onChange={() => setActiveQuick(null)} /></Form.Item>
              {quickButtons.map((button) => <Button key={button.key} data-e2e-id={`merchant-filter-quick-${button.id}-btn`} type={activeQuick === button.key ? 'primary' : 'text'} onClick={() => { setActiveQuick(button.key); form.setFieldsValue({ dateRange: rangeOf(button.key) }); }}>{button.label}</Button>)}
            </Space></Form.Item>
          </Col>
        </Row>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Space>
          <Button data-e2e-id="merchant-filter-reset-btn" onClick={() => { form.resetFields(); setFilters({}); setActiveQuick(null); }} style={{ background: '#e6a23c', borderColor: '#e6a23c', color: '#fff' }}>重 置</Button>
          <Button data-e2e-id="merchant-filter-search-btn" onClick={() => setFilters(form.getFieldsValue())} style={{ background: '#67c23a', borderColor: '#67c23a', color: '#fff' }}>搜 索</Button>
        </Space></div>
      </Form>
    </Card>
    <Card data-e2e-id="merchant-table-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Title level={5} style={{ margin: 0 }}>门店管理</Title>
        <Space>
          <Button data-e2e-id="merchant-toolbar-add-btn" type="primary" onClick={() => openEditor(null)}>新增门店</Button>
          <Button data-e2e-id="merchant-toolbar-refresh-btn" icon={<ReloadOutlined />} />
          <Button data-e2e-id="merchant-toolbar-density-btn" icon={<ColumnHeightOutlined />} />
          <Button data-e2e-id="merchant-toolbar-settings-btn" icon={<SettingOutlined />} />
        </Space>
      </div>
      <Table data-e2e-id="merchant-table" columns={columns} dataSource={mounted ? filteredData : []} rowKey="id" size="small" scroll={{ x: 2070 }} onRow={(record) => ({ 'data-e2e-id': `merchant-table-row-${record.id}` } as React.HTMLAttributes<HTMLTableRowElement>)} pagination={{ pageSize: 20, showSizeChanger: true, showQuickJumper: true, showTotal: (t, range) => `当前：第 ${Math.ceil(range[0] / 20)} 页, 共 ${t} 条数据` }} />
    </Card>
    <Modal data-e2e-id="merchant-edit-modal" title={editing ? '编辑门店' : '新增门店'} width={640} open={modalOpen} onOk={onSave} onCancel={() => setModalOpen(false)} okText="确 定" cancelText="取 消" okButtonProps={{ 'data-e2e-id': 'merchant-edit-confirm-btn' } as React.ComponentProps<typeof Button>} cancelButtonProps={{ 'data-e2e-id': 'merchant-edit-cancel-btn' } as React.ComponentProps<typeof Button>} closable={false} destroyOnHidden
      afterOpenChange={(open) => {
        if (!open) return;
        editForm.resetFields();
        editForm.setFieldsValue(editing ? {
          ...editing, filbetDomains: editing.filbetDomains.join('\n'), filplayDomains: editing.filplayDomains.join('\n'), enabled: editing.state === 1,
        } : { enabled: true });
      }}>
      <Form form={editForm} layout="vertical" preserve={false} initialValues={{ enabled: true }}>
        <Form.Item name="id" label="ID" rules={[{ required: true, message: '请输入ID' }, { validator: (_, value: number | null | undefined) => value != null && records.some((record) => record.id === value && record.id !== editing?.id) ? Promise.reject(new Error('ID已存在')) : Promise.resolve() }]}><InputNumber data-e2e-id="merchant-edit-id-input" disabled={!!editing} precision={0} style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="name" label="门店名称" rules={[{ required: true, whitespace: true, message: '请输入门店名称' }]}><Input data-e2e-id="merchant-edit-name-input" /></Form.Item>
        <Form.Item name="address" label="地址"><Input data-e2e-id="merchant-edit-address-input" /></Form.Item>
        {(['filbet', 'filplay'] as const).map((brand) => {
          const field = `${brand}Domains` as const;
          const otherField = brand === 'filbet' ? 'filplayDomains' : 'filbetDomains';
          return <Form.Item key={brand} name={field} label={`${brand === 'filbet' ? 'Filbet' : 'Filplay'} 域名`} dependencies={[otherField]} rules={[{ validator: (_, value: string | undefined) => {
            const error = validatePagcorDomains(normalizePagcorDomains(value), normalizePagcorDomains(editForm.getFieldValue(otherField)), records, editing?.id);
            return error ? Promise.reject(new Error(error)) : Promise.resolve();
          } }]}><Input.TextArea data-e2e-id={`merchant-edit-${brand}-domains-input`} rows={3} placeholder="每行一个域名" /></Form.Item>;
        })}
        <Form.Item name="enabled" label="状态" valuePropName="checked"><Switch data-e2e-id="merchant-edit-state-switch" checkedChildren="正常" unCheckedChildren="关闭" /></Form.Item>
        <Form.Item name="note" label="备注"><Input.TextArea data-e2e-id="merchant-edit-note-input" rows={2} /></Form.Item>
      </Form>
    </Modal>
  </div>;
}

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Checkbox, Col, Dropdown, Form, Input, message, Modal, Popover, Row, Select, Space, Table, Typography } from 'antd';
import { ColumnHeightOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import PagcorBrandTabs, { pagcorBrandLabels, type PagcorBrand } from '@/components/PagcorBrandTabs';
import { generatePagcorGames, pagcorGameCategories, pagcorGameCategoryLabels, type PagcorGame } from '@/data/pagcorGameData';

const { Title } = Typography;

interface Filters {
  keyword?: string;
  category?: PagcorGame['category'];
  provider?: string;
  online?: 'online' | 'offline';
  maintained?: 'normal' | 'maintained';
}

type GameAction = 'online' | 'offline' | 'maintain' | 'unmaintain';
const actionLabels: Record<GameAction, string> = {
  online: '上线', offline: '下线', maintain: '维护', unmaintain: '取消维护',
};
const columnOptions = [
  ['id', 'ID'], ['name', '游戏名称'], ['code', '游戏代码'], ['category', '分类'], ['provider', '厂商'],
  ['online', '上线状态'], ['maintained', '维护状态'], ['created-at', '创建时间'], ['updated-at', '更新时间'], ['actions', '操作'],
];

export default function GamesPage() {
  const [form] = Form.useForm<Filters>();
  const [modal, modalContextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();
  const [brand, setBrand] = useState<PagcorBrand>('filbet');
  const [games, setGames] = useState<Record<PagcorBrand, PagcorGame[]>>({ filbet: [], filplay: [] });
  const [filters, setFilters] = useState<Filters>({});
  const [mounted, setMounted] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [density, setDensity] = useState<'small' | 'middle' | 'large'>('small');
  const [visibleColumns, setVisibleColumns] = useState(columnOptions.map(([key]) => key));

  useEffect(() => {
    setGames(generatePagcorGames(dayjs()));
    setMounted(true);
  }, []);

  const onReset = () => {
    form.resetFields();
    setFilters({});
    setCurrent(1);
    setSelectedRowKeys([]);
  };

  const onBrandChange = (nextBrand: PagcorBrand) => {
    const nextOptions = games[nextBrand].map((game) => game.provider);
    const value = form.getFieldValue('provider');
    if (value !== undefined && !nextOptions.includes(value)) {
      form.setFieldsValue({ provider: undefined });
    }
    setFilters((previous) => previous.provider !== undefined && !nextOptions.includes(previous.provider)
      ? { ...previous, provider: undefined } : previous);
    setBrand(nextBrand);
    setCurrent(1);
    setSelectedRowKeys([]);
  };

  const providers = useMemo(() => Array.from(new Set(games[brand].map((game) => game.provider))).sort(), [games, brand]);
  const filteredData = useMemo(() => games[brand].filter((game) => {
    const keyword = filters.keyword?.trim().toLowerCase();
    if (keyword && !game.name.toLowerCase().includes(keyword) && !game.code.toLowerCase().includes(keyword)) return false;
    if (filters.category && game.category !== filters.category) return false;
    if (filters.provider && game.provider !== filters.provider) return false;
    if (filters.online !== undefined && game.online !== (filters.online === 'online')) return false;
    if (filters.maintained !== undefined && game.maintained !== (filters.maintained === 'maintained')) return false;
    return true;
  }), [games, brand, filters]);

  const confirmAction = (action: GameAction, ids: React.Key[], singleGame?: PagcorGame) => {
    const targetBrand = brand;
    const targetIds = new Set(ids.map(String));
    const label = actionLabels[action];
    const scope = singleGame ? `「${singleGame.name}」` : ` ${targetIds.size} 款游戏`;
    modal.confirm({
      title: `确认${label}`,
      content: `确定将 ${pagcorBrandLabels[targetBrand]} 的${scope}${label}？`,
      okText: '确 定', cancelText: '取 消',
      okButtonProps: { ...{ 'data-e2e-id': `games-${targetBrand}-confirm-${action}-ok-btn` } },
      cancelButtonProps: { ...{ 'data-e2e-id': `games-${targetBrand}-confirm-${action}-cancel-btn` } },
      modalRender: (node) => <div data-e2e-id={`games-${targetBrand}-confirm-${action}-modal`}>{node}</div>,
      onOk: () => {
        const updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
        setGames((previous) => ({
          ...previous,
          [targetBrand]: previous[targetBrand].map((game) => {
            if (!targetIds.has(game.id)) return game;
            return {
              ...game,
              ...(action === 'online' || action === 'offline' ? { online: action === 'online' } : { maintained: action === 'maintain' }),
              updatedAt,
            };
          }),
        }));
        setSelectedRowKeys([]);
        messageApi.success('操作成功');
      },
    });
  };

  const columns: ColumnsType<PagcorGame> = [
    { title: 'ID', key: 'id', dataIndex: 'id', width: 80, align: 'center' },
    { title: '游戏名称', key: 'name', dataIndex: 'name', width: 190, align: 'center' },
    { title: '游戏代码', key: 'code', dataIndex: 'code', width: 190, align: 'center' },
    { title: '分类', key: 'category', dataIndex: 'category', width: 80, align: 'center', render: (value: PagcorGame['category']) => pagcorGameCategoryLabels[value] },
    { title: '厂商', key: 'provider', dataIndex: 'provider', width: 80, align: 'center' },
    { title: '上线状态', key: 'online', dataIndex: 'online', width: 80, align: 'center', render: (value: boolean) => value ? '上线' : '下线' },
    { title: '维护状态', key: 'maintained', dataIndex: 'maintained', width: 80, align: 'center', render: (value: boolean) => value ? '维护中' : '正常' },
    { title: '创建时间', key: 'created-at', dataIndex: 'createdAt', width: 160, align: 'center' },
    { title: '更新时间', key: 'updated-at', dataIndex: 'updatedAt', width: 160, align: 'center' },
    {
      title: '操作', key: 'actions', width: 130, align: 'center', fixed: 'right',
      render: (_, game) => (
        <Space>
          <Button type="link" size="small" data-e2e-id={`games-${brand}-row-${game.id}-online-btn`}
            onClick={() => confirmAction(game.online ? 'offline' : 'online', [game.id], game)}>
            {game.online ? '下线' : '上线'}
          </Button>
          <Button type="link" size="small" data-e2e-id={`games-${brand}-row-${game.id}-maintain-btn`}
            onClick={() => confirmAction(game.maintained ? 'unmaintain' : 'maintain', [game.id], game)}>
            {game.maintained ? '取消维护' : '维护'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {modalContextHolder}
      {messageContextHolder}
      <Card style={{ marginBottom: 16 }} data-e2e-id="games-filter-card">
        <Form form={form} layout="horizontal" colon={false} labelCol={{ flex: '0 0 88px' }} wrapperCol={{ flex: '1 1 0', style: { minWidth: 0 } }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="keyword" label="关键字">
                <Input data-e2e-id="games-filter-keyword-input" placeholder="请输入游戏名称或代码" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="category" label="分类">
                <Select data-e2e-id="games-filter-category-select" placeholder="请选择" allowClear
                  options={pagcorGameCategories.map((value) => ({ value, label: pagcorGameCategoryLabels[value] }))} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="provider" label="厂商">
                <Select data-e2e-id="games-filter-provider-select" placeholder="请选择" allowClear showSearch optionFilterProp="label"
                  options={mounted ? providers.map((value) => ({ value, label: value })) : []} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="online" label="上线状态">
                <Select data-e2e-id="games-filter-online-select" placeholder="请选择" allowClear
                  options={[{ value: 'online', label: '上线' }, { value: 'offline', label: '下线' }]} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Form.Item name="maintained" label="维护状态">
                <Select data-e2e-id="games-filter-maintained-select" placeholder="请选择" allowClear
                  options={[{ value: 'normal', label: '正常' }, { value: 'maintained', label: '维护中' }]} />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button data-e2e-id="games-filter-reset-btn" onClick={onReset}
                style={{ background: '#e6a23c', borderColor: '#e6a23c', color: '#fff' }}>重 置</Button>
              <Button data-e2e-id="games-filter-search-btn"
                onClick={() => { setFilters(form.getFieldsValue()); setCurrent(1); setSelectedRowKeys([]); }}
                style={{ background: '#67c23a', borderColor: '#67c23a', color: '#fff' }}>搜 索</Button>
            </Space>
          </div>
        </Form>
      </Card>
      <PagcorBrandTabs value={brand} onChange={onBrandChange} e2ePrefix="games" />
      <Card data-e2e-id="games-table-card" styles={{ body: { paddingInline: 8 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Title level={5} style={{ margin: 0 }}>游戏列表 · {pagcorBrandLabels[brand]}</Title>
          <Space>
            <Button data-e2e-id="games-toolbar-batch-online-btn" disabled={!selectedRowKeys.length}
              onClick={() => confirmAction('online', selectedRowKeys)}>批量上线</Button>
            <Button data-e2e-id="games-toolbar-batch-offline-btn" disabled={!selectedRowKeys.length}
              onClick={() => confirmAction('offline', selectedRowKeys)}>批量下线</Button>
            <Button data-e2e-id="games-toolbar-refresh-btn" aria-label="刷新" icon={<ReloadOutlined />}
              onClick={() => { setFilters({ ...filters }); setCurrent(1); setSelectedRowKeys([]); }} />
            <Dropdown trigger={['click']} menu={{
              selectedKeys: [density],
              items: [{ key: 'small', label: <span data-e2e-id="games-density-small">紧凑</span> },
                { key: 'middle', label: <span data-e2e-id="games-density-middle">默认</span> },
                { key: 'large', label: <span data-e2e-id="games-density-large">宽松</span> }],
              onClick: ({ key }) => { if (key === 'small' || key === 'middle' || key === 'large') setDensity(key); },
            }}>
              <Button data-e2e-id="games-toolbar-density-btn" aria-label="表格密度" icon={<ColumnHeightOutlined />} />
            </Dropdown>
            <Popover trigger="click" placement="bottomRight" content={(
              <Space direction="vertical">
                {columnOptions.map(([key, label]) => (
                  <Checkbox key={key} data-e2e-id={`games-column-${key}-checkbox`} checked={visibleColumns.includes(key)}
                    disabled={visibleColumns.length === 1 && visibleColumns.includes(key)}
                    onChange={(event) => setVisibleColumns((previous) => event.target.checked
                      ? [...previous, key] : previous.filter((value) => value !== key))}>
                    {label}
                  </Checkbox>
                ))}
              </Space>
            )}>
              <Button data-e2e-id="games-toolbar-settings-btn" aria-label="列设置" icon={<SettingOutlined />} />
            </Popover>
          </Space>
        </div>
        <Table<PagcorGame>
          data-e2e-id="games-table"
          columns={columns.filter((column) => visibleColumns.includes(String(column.key)))}
          dataSource={mounted ? filteredData : []} rowKey="id" size={density} scroll={{ x: 1280 }}
          onRow={(game) => ({ 'data-e2e-id': `games-${brand}-table-row-${game.id}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          rowSelection={{
            columnWidth: 50,
            selectedRowKeys, onChange: setSelectedRowKeys,
            getCheckboxProps: (game) => ({ name: game.id, ...{ 'data-e2e-id': `games-${brand}-row-${game.id}-checkbox` } }),
            columnTitle: (checkbox) => <span data-e2e-id={`games-${brand}-select-all-checkbox`}>{checkbox}</span>,
          }}
          pagination={{ current, pageSize, showSizeChanger: true, showQuickJumper: true,
            onChange: (page, size) => { setCurrent(size === pageSize ? page : 1); setPageSize(size); },
            showTotal: (total, range) => `当前：第 ${Math.ceil(range[0] / pageSize)} 页, 共 ${total} 条数据`,
          }}
        />
      </Card>
    </div>
  );
}

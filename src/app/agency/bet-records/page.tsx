'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Button, Card, Checkbox, Col, DatePicker, Dropdown, Form, Input, InputNumber,
  Popover, Row, Select, Space, Table, Typography, message,
} from 'antd';
import { ColumnHeightOutlined, DownOutlined, FolderOpenOutlined, ReloadOutlined, SettingOutlined, UpOutlined } from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import dayjs from 'dayjs';
import { agencyBetTotals, generateAgencyBetRecords, type AgencyBetRecord } from '@/data/agency/betRecords';
import { agencyGameClasses, agencyVenues } from '@/data/agency/shared';
import { agencySeed, betStateLabels, betTypeLabels, downloadCsv, formatCount, formatPeso, formatTs, toCsvCell } from '@/lib/agencyUtils';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const recordSeed = agencySeed('agency-bet-records', 20260916);
const stateColors: Record<number, string> = { 0: '#fa8c16', 1: '#52c41a', 2: '#8c8c8c', 3: '#ff4d4f' };
const typeColors: Record<number, string> = { 1: '#595959', 2: '#1677ff', 3: '#722ed1', 4: '#fa8c16' };
const gainColor = (value: string) => Number(value) > 0 ? '#52c41a' : Number(value) < 0 ? '#ff4d4f' : undefined;
const gameClassName = (id: number) => agencyGameClasses.find((item) => item.game_class === id)?.name ?? '-';

interface RecordGameListFd {
  username?: string;
  phone?: string;
  id?: string;
  brand_name?: string;
  game_type?: number;
  game_name?: string;
  status?: number;
  bet_amount_min?: number | null;
  bet_amount_max?: number | null;
  settle_amount_min?: number | null;
  settle_amount_max?: number | null;
  start_time?: number;
  end_time?: number;
  settle_start_time?: number;
  settle_end_time?: number;
}

function lastSevenDays(): Pick<RecordGameListFd, 'start_time' | 'end_time'> {
  const now = Date.now();
  return { start_time: dayjs(now).subtract(6, 'day').startOf('day').unix(), end_time: dayjs(now).endOf('day').unix() };
}

function matches(value: string, query?: string): boolean {
  return !query?.trim() || value.toLowerCase().includes(query.trim().toLowerCase());
}

function inAmountRange(value: string, min?: number | null, max?: number | null): boolean {
  return (min == null || Number(value) >= min) && (max == null || Number(value) <= max);
}

// 表單儲存 API 的起訖秒數；RangePicker 僅負責編輯，避免多出非規格欄位。
function TimeRangeFilter({ label, startName, endName }: {
  label: string;
  startName: 'start_time' | 'settle_start_time';
  endName: 'end_time' | 'settle_end_time';
}) {
  const form = Form.useFormInstance<RecordGameListFd>();
  const start = Form.useWatch(startName, form) as number | undefined;
  const end = Form.useWatch(endName, form) as number | undefined;
  return (
    <>
      <Form.Item name={startName} hidden><InputNumber data-e2e-id={`agency-bet-records-filter-${startName}-input`} /></Form.Item>
      <Form.Item name={endName} hidden><InputNumber data-e2e-id={`agency-bet-records-filter-${endName}-input`} /></Form.Item>
      <Form.Item label={label}>
        <RangePicker
          data-e2e-id={`agency-bet-records-filter-${startName}-range`}
          showTime format="YYYY-MM-DD HH:mm:ss" placeholder={['開始時間', '結束時間']}
          style={{ width: '100%' }}
          value={start !== undefined && end !== undefined ? [dayjs.unix(start), dayjs.unix(end)] : null}
          onChange={(range) => form.setFieldsValue({ [startName]: range?.[0]?.unix(), [endName]: range?.[1]?.unix() })}
        />
      </Form.Item>
    </>
  );
}

function AmountRangeFilter({ label, minName, maxName }: {
  label: string;
  minName: 'bet_amount_min' | 'settle_amount_min';
  maxName: 'bet_amount_max' | 'settle_amount_max';
}) {
  return (
    <Form.Item label={label}>
      <Space.Compact style={{ width: '100%' }}>
        <Form.Item name={minName} noStyle>
          <InputNumber min={0} precision={2} controls={false} prefix="P" placeholder="最小金額" aria-label={`${label}最小金額`} style={{ width: '50%' }} data-e2e-id={`agency-bet-records-filter-${minName}-input`} />
        </Form.Item>
        <Form.Item name={maxName} noStyle dependencies={[minName]} rules={[
          ({ getFieldValue }) => ({ validator: (_, value: number | null | undefined) => {
            const min = getFieldValue(minName) as number | null | undefined;
            return min != null && value != null && value < min ? Promise.reject(new Error('最大金額不可小於最小金額')) : Promise.resolve();
          } }),
        ]}>
          <InputNumber min={0} precision={2} controls={false} prefix="P" placeholder="最大金額" aria-label={`${label}最大金額`} style={{ width: '50%' }} data-e2e-id={`agency-bet-records-filter-${maxName}-input`} />
        </Form.Item>
      </Space.Compact>
    </Form.Item>
  );
}

const exportColumns: Array<[string, (r: AgencyBetRecord) => string]> = [
  ['注單號', (r) => r.bill_no], ['三方注單號', (r) => r.platform_bill_no],
  ['會員帳號', (r) => r.username], ['手機', (r) => r.phone],
  ['場館', (r) => r.platform_name], ['遊戲分類', (r) => gameClassName(r.game_class)],
  ['遊戲名稱', (r) => r.game_name], ['投注金額', (r) => formatPeso(r.bet_amount)],
  ['有效投注', (r) => formatPeso(r.valid_bet_amount)], ['派彩金額', (r) => formatPeso(r.payout_amount)],
  ['輸贏（會員）', (r) => formatPeso(r.net_amount)], ['注單類型', (r) => betTypeLabels[r.bet_type] ?? '-'],
  ['結算狀態', (r) => betStateLabels[r.state] ?? '-'], ['投注時間', (r) => formatTs(r.bet_time)],
  ['結算時間', (r) => formatTs(r.settle_time)],
];

export default function AgencyBetRecordsPage() {
  const [form] = Form.useForm<RecordGameListFd>();
  const [messageApi, contextHolder] = message.useMessage();
  const [mounted, setMounted] = useState(false);
  const [allRows, setAllRows] = useState<AgencyBetRecord[]>([]);
  const [filters, setFilters] = useState<RecordGameListFd>({});
  const [expanded, setExpanded] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [density, setDensity] = useState<TableProps<AgencyBetRecord>['size']>('small');
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  useEffect(() => {
    const defaults = lastSevenDays();
    form.setFieldsValue(defaults);
    setFilters(defaults);
    setAllRows(generateAgencyBetRecords(recordSeed));
    setMounted(true);
  }, [form]);

  const rows = useMemo(() => allRows.filter((row) => {
    if (!matches(row.username, filters.username) || !matches(row.phone, filters.phone)) return false;
    if (!matches(row.bill_no, filters.id) && !matches(row.id, filters.id)) return false;
    if (filters.brand_name && row.platform_id !== filters.brand_name) return false;
    if (filters.game_type !== undefined && row.game_class !== filters.game_type) return false;
    if (!matches(row.game_name, filters.game_name)) return false;
    if (filters.status !== undefined && row.state !== filters.status) return false;
    if (!inAmountRange(row.bet_amount, filters.bet_amount_min, filters.bet_amount_max)) return false;
    if (!inAmountRange(row.payout_amount, filters.settle_amount_min, filters.settle_amount_max)) return false;
    if (filters.start_time !== undefined && row.bet_time < filters.start_time) return false;
    if (filters.end_time !== undefined && row.bet_time > filters.end_time) return false;
    // 設定結算時間範圍時，尚無結算時間的注單不納入結果。
    if ((filters.settle_start_time !== undefined || filters.settle_end_time !== undefined) && !row.settle_time) return false;
    if (filters.settle_start_time !== undefined && row.settle_time < filters.settle_start_time) return false;
    if (filters.settle_end_time !== undefined && row.settle_time > filters.settle_end_time) return false;
    return true;
  }), [allRows, filters]);
  const totals = useMemo(() => agencyBetTotals(rows), [rows]);
  const advancedCount = [filters.bet_amount_min, filters.bet_amount_max, filters.settle_amount_min, filters.settle_amount_max, filters.settle_start_time, filters.settle_end_time].filter((value) => value != null).length;

  const search = (values: RecordGameListFd) => {
    setFilters({ ...values });
    setPagination((current) => ({ ...current, current: 1 }));
  };

  const reset = () => {
    form.resetFields();
    const defaults = lastSevenDays();
    form.setFieldsValue(defaults);
    search(defaults);
    setExpanded(false);
  };

  const onExport = () => {
    const lines = [
      exportColumns.map(([label]) => toCsvCell(label)).join(','),
      ...rows.map((row) => exportColumns.map(([, read]) => toCsvCell(read(row))).join(',')),
    ];
    downloadCsv(`投注紀錄_${dayjs().format('YYYYMMDD_HHmmss')}.csv`, lines.join('\n'));
  };

  const columns: ColumnsType<AgencyBetRecord> = [
    { title: '注單號', key: 'bill_no', width: 250, fixed: 'left', render: (_v, r) => <Text copyable={{ text: r.bill_no, tooltips: ['複製注單號', '已複製'] }} data-e2e-id={`agency-bet-records-bill-${r.id}-copy`}>{r.bill_no}</Text> },
    { title: '三方注單號', key: 'platform_bill_no', dataIndex: 'platform_bill_no', width: 300 },
    { title: '會員帳號', key: 'username', dataIndex: 'username', width: 140 },
    { title: '手機', key: 'phone', dataIndex: 'phone', width: 150 },
    { title: '場館', key: 'platform_name', dataIndex: 'platform_name', width: 160 },
    { title: '遊戲分類', key: 'game_class', width: 110, render: (_v, r) => gameClassName(r.game_class) },
    { title: '遊戲名稱', key: 'game_name', dataIndex: 'game_name', width: 220 },
    { title: '投注金額', key: 'bet_amount', width: 170, align: 'right', render: (_v, r) => formatPeso(r.bet_amount) },
    { title: '有效投注', key: 'valid_bet_amount', width: 170, align: 'right', render: (_v, r) => formatPeso(r.valid_bet_amount) },
    { title: '派彩金額', key: 'payout_amount', width: 170, align: 'right', render: (_v, r) => formatPeso(r.payout_amount) },
    // 列內輸贏採會員視角：正數為會員贏錢（綠），負數為會員輸錢（紅）。
    { title: '輸贏', key: 'net_amount', width: 180, align: 'right', render: (_v, r) => <span style={{ color: gainColor(r.net_amount) }}>{formatPeso(r.net_amount)}</span> },
    { title: '注單類型', key: 'bet_type', width: 130, render: (_v, r) => <span style={{ color: typeColors[r.bet_type] }}>{betTypeLabels[r.bet_type] ?? '-'}</span> },
    { title: '結算狀態', key: 'state', width: 120, render: (_v, r) => <span style={{ color: stateColors[r.state] }}>{betStateLabels[r.state] ?? '-'}</span> },
    { title: '投注時間', key: 'bet_time', width: 180, render: (_v, r) => formatTs(r.bet_time) },
    { title: '結算時間', key: 'settle_time', width: 180, render: (_v, r) => formatTs(r.settle_time) },
  ];
  const visibleColumns = columns.filter((column) => !hiddenColumns.includes(String(column.key)));
  // 合計欄保留顯示，讓欄位設定不會隱藏整份篩選結果的金額。
  const requiredColumns = ['bill_no', 'valid_bet_amount', 'payout_amount', 'net_amount'];
  const summaryLabels: Record<string, string> = { valid_bet_amount: '有效投注合計', payout_amount: '派彩合計', net_amount: '平台輸贏合計' };

  return (
    <div>
      {contextHolder}
      <Card data-e2e-id="agency-bet-records-filter-card" style={{ marginBottom: 16 }}>
        <Form form={form} onFinish={search} onFinishFailed={() => setExpanded(true)} layout="horizontal" colon={false} labelCol={{ flex: '0 0 100px' }} wrapperCol={{ flex: 1 }}>
          <Row gutter={[16, 0]}>
            {([['username', '會員帳號'], ['phone', '會員手機'], ['id', '注單號']] as const).map(([name, label]) => (
              <Col key={name} xs={24} sm={12} xl={6}><Form.Item name={name} label={label}><Input allowClear placeholder={`請輸入${label}`} data-e2e-id={`agency-bet-records-filter-${name}-input`} /></Form.Item></Col>
            ))}
            <Col xs={24} sm={12} xl={6}><Form.Item name="brand_name" label="場館"><Select allowClear showSearch optionFilterProp="label" placeholder="全部場館" options={agencyVenues.map((venue) => ({ value: venue.venue_id, label: venue.name }))} data-e2e-id="agency-bet-records-filter-brand_name-select" /></Form.Item></Col>
            <Col xs={24} sm={12} xl={6}><Form.Item name="game_type" label="遊戲分類"><Select allowClear placeholder="全部分類" options={agencyGameClasses.map((item) => ({ value: item.game_class, label: item.name }))} data-e2e-id="agency-bet-records-filter-game_type-select" /></Form.Item></Col>
            <Col xs={24} sm={12} xl={6}><Form.Item name="game_name" label="遊戲名稱"><Input allowClear placeholder="請輸入遊戲名稱" data-e2e-id="agency-bet-records-filter-game_name-input" /></Form.Item></Col>
            <Col xs={24} sm={12} xl={6}><Form.Item name="status" label="結算狀態"><Select allowClear placeholder="全部狀態" options={Object.entries(betStateLabels).map(([value, label]) => ({ value: Number(value), label }))} data-e2e-id="agency-bet-records-filter-status-select" /></Form.Item></Col>
            <Col xs={24} xl={12}><TimeRangeFilter label="投注時間" startName="start_time" endName="end_time" /></Col>
          </Row>
          <Row gutter={[16, 0]} id="agency-bet-records-advanced-filters" style={{ display: expanded ? undefined : 'none' }}>
            <Col xs={24} sm={12} xl={6}><AmountRangeFilter label="投注金額區間" minName="bet_amount_min" maxName="bet_amount_max" /></Col>
            <Col xs={24} sm={12} xl={6}><AmountRangeFilter label="派彩金額區間" minName="settle_amount_min" maxName="settle_amount_max" /></Col>
            <Col xs={24} xl={12}><TimeRangeFilter label="結算時間" startName="settle_start_time" endName="settle_end_time" /></Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space wrap>
              <Button type="link" icon={expanded ? <UpOutlined /> : <DownOutlined />} aria-expanded={expanded} aria-controls="agency-bet-records-advanced-filters" onClick={() => setExpanded((current) => !current)} data-e2e-id="agency-bet-records-filter-expand-btn">{expanded ? '收合' : '展開'}{advancedCount > 0 ? `（已套用 ${advancedCount} 項進階條件）` : ''}</Button>
              <Button onClick={reset} style={{ background: '#e6a23c', borderColor: '#e6a23c', color: '#fff' }} data-e2e-id="agency-bet-records-filter-reset-btn">重置</Button>
              <Button htmlType="submit" style={{ background: '#67c23a', borderColor: '#67c23a', color: '#fff' }} data-e2e-id="agency-bet-records-filter-search-btn">搜尋</Button>
            </Space>
          </div>
        </Form>
      </Card>

      <Card data-e2e-id="agency-bet-records-table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <Title level={5} style={{ margin: 0 }}>投注紀錄 <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>示範資料</Text></Title>
          <Space wrap>
            <Button type="primary" icon={<FolderOpenOutlined />} onClick={onExport} disabled={!mounted} data-e2e-id="agency-bet-records-toolbar-export-btn">匯出</Button>
            <Button icon={<ReloadOutlined />} onClick={() => { setAllRows(generateAgencyBetRecords(recordSeed)); void messageApi.success('投注紀錄已重新整理'); }} data-e2e-id="agency-bet-records-toolbar-refresh-btn">重新整理</Button>
            <Dropdown trigger={['click']} menu={{
              selectable: true, selectedKeys: [density ?? 'small'],
              items: [{ key: 'small', label: <span data-e2e-id="agency-bet-records-density-small-option">緊湊</span> }, { key: 'middle', label: <span data-e2e-id="agency-bet-records-density-middle-option">適中</span> }, { key: 'large', label: <span data-e2e-id="agency-bet-records-density-large-option">寬鬆</span> }],
              onClick: ({ key }) => setDensity(key as TableProps<AgencyBetRecord>['size']),
            }}><Button icon={<ColumnHeightOutlined />} data-e2e-id="agency-bet-records-toolbar-density-btn">密度</Button></Dropdown>
            <Popover trigger="click" placement="bottomRight" title="顯示欄位" content={
              <Space direction="vertical" style={{ maxHeight: 360, overflowY: 'auto' }}>
                {columns.map((column) => <Checkbox key={String(column.key)} checked={!hiddenColumns.includes(String(column.key))} disabled={requiredColumns.includes(String(column.key))} data-e2e-id={`agency-bet-records-settings-${column.key}-checkbox`} onChange={(event) => setHiddenColumns((current) => event.target.checked ? current.filter((key) => key !== column.key) : [...current, String(column.key)])}>{String(column.title)}</Checkbox>)}
                <Button size="small" onClick={() => setHiddenColumns([])} data-e2e-id="agency-bet-records-settings-reset-btn">還原欄位</Button>
              </Space>
            }><Button icon={<SettingOutlined />} data-e2e-id="agency-bet-records-toolbar-settings-btn">設定</Button></Popover>
          </Space>
        </div>
        <Table<AgencyBetRecord>
          data-e2e-id="agency-bet-records-table"
          columns={visibleColumns}
          dataSource={mounted ? rows : []}
          rowKey="id"
          size={density}
          scroll={{ x: visibleColumns.reduce((sum, column) => sum + Number(column.width), 0), y: 560 }}
          locale={{ emptyText: '沒有符合條件的投注紀錄' }}
          onRow={(record) => ({ 'data-e2e-id': `agency-bet-records-table-row-${record.id}` } as React.HTMLAttributes<HTMLTableRowElement>)}
          pagination={{
            ...pagination, showSizeChanger: true, showQuickJumper: true,
            onChange: (current, pageSize) => setPagination({ current, pageSize }),
            showTotal: (total, range) => `當前：第 ${total ? Math.ceil(range[0] / pagination.pageSize) : 0} 頁, 共 ${total} 筆資料`,
          }}
          summary={() => (
            <Table.Summary fixed="bottom">
              <Table.Summary.Row data-e2e-id="agency-bet-records-summary-row">
                {visibleColumns.map((column, index) => {
                  const key = String(column.key);
                  const totalKey = key as keyof typeof totals;
                  return (
                    <Table.Summary.Cell key={key} index={index} align={column.align}>
                      {index === 0 ? <Text strong>合計（{formatCount(rows.length)} 筆）</Text> : summaryLabels[key] ? (
                        <div style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ color: '#8c8c8c', fontSize: 12 }}>{summaryLabels[key]}</div>
                          <Text strong style={{ color: key === 'net_amount' ? gainColor(totals.net_amount) : undefined }}>{formatPeso(totals[totalKey])}</Text>
                        </div>
                      ) : null}
                    </Table.Summary.Cell>
                  );
                })}
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </div>
  );
}

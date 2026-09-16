'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Modal, Table } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  agencyChildGgrDetail, agencyCommissionDetailSeed, agencyPagcorTaxDetail, agencyVenueFeeDetail,
  type ActiveMemberItem, type AgencyCommissionRow,
} from '@/data/agency/commission';
import { agencyActiveMembers, agencyActiveThreshold, agencyMembers } from '@/data/agency/shared';
import { formatCount, formatPercent, formatPeso } from '@/lib/agencyUtils';

interface CommissionDetailProps {
  open: boolean;
  onClose: () => void;
  row: AgencyCommissionRow;
}

function DetailTitle({ label, slug, row, onClose }: {
  label: string; slug: string; row: AgencyCommissionRow; onClose: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <span>{label} · {dayjs.unix(row.settle_begin_date).format('YYYY-MM-DD')} ～ {dayjs.unix(row.settle_end_date).format('YYYY-MM-DD')}</span>
      <Button data-e2e-id={`agency-commission-${slug}-close-btn`} type="text" aria-label="關閉明細" icon={<CloseOutlined />} onClick={onClose} />
    </div>
  );
}

const sumAmount = (values: string[]) => values.reduce((sum, value) => sum + Math.round(Number(value) * 100), 0) / 100;

export function ChildGgrModal({ open, onClose, row }: CommissionDetailProps) {
  // 對應 /agency/child/ggr；使用主表金額反推月份比例，明細加總與該筆佣金一致。
  const baseGgr = agencyMembers.reduce((sum, member) => sum + Number(member.stat.ggr_month), 0);
  const rows = agencyChildGgrDetail(agencyCommissionDetailSeed(row), baseGgr ? Number(row.ggr) / baseGgr : 0);
  return (
    <Modal data-e2e-id="agency-commission-child-ggr-modal" open={open} onCancel={onClose} width={860} footer={null} closable={false}
      title={<DetailTitle label="下線 GGR 明細" slug="child-ggr" row={row} onClose={onClose} />}>
      <Table data-e2e-id="agency-commission-child-ggr-table" size="small" rowKey="game_class" dataSource={rows} pagination={false} scroll={{ x: 660 }}
        columns={[
          { title: '遊戲分類', dataIndex: 'name', width: 220 },
          { title: 'GGR', dataIndex: 'ggr', width: 240, align: 'right', render: formatPeso },
          { title: '佔比', key: 'share', width: 200, align: 'right', render: (_, item) => formatPercent(Number(row.ggr) ? Number(item.ggr) / Number(row.ggr) * 100 : 0) },
        ]}
        summary={() => <Table.Summary.Row>
          <Table.Summary.Cell index={0}>合計</Table.Summary.Cell>
          <Table.Summary.Cell index={1} align="right"><strong>{formatPeso(sumAmount(rows.map((item) => item.ggr)))}</strong></Table.Summary.Cell>
          <Table.Summary.Cell index={2} align="right">{formatPercent(Number(row.ggr) ? 100 : 0)}</Table.Summary.Cell>
        </Table.Summary.Row>}
      />
    </Modal>
  );
}

export function ActiveMemberModal({ open, onClose, row }: CommissionDetailProps) {
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [open, row.id]);
  const baseGgr = agencyMembers.reduce((sum, member) => sum + Number(member.stat.ggr_month), 0);
  const scale = baseGgr ? Number(row.ggr) / baseGgr : 0;
  // /agency/commission/active/list：歷史月份依展示比例縮放，共用會員身分並保留活躍門檻。
  const rows: ActiveMemberItem[] = agencyActiveMembers().slice(0, row.active).map((member) => ({
    uid: member.uid, username: member.username, phone: member.phone,
    deposit_amount: Math.max(Number(agencyActiveThreshold.active_deposit_amount), Number(member.stat.deposit_amount_month) * scale).toFixed(2),
    valid_bet_amount: Math.max(Number(agencyActiveThreshold.active_bet_amount), Number(member.stat.valid_bet_month) * scale).toFixed(2),
  }));
  return (
    <Modal data-e2e-id="agency-commission-active-modal" open={open} onCancel={onClose} width={860} footer={null} closable={false}
      title={<DetailTitle label="活躍會員明細" slug="active" row={row} onClose={onClose} />}>
      <Alert type="info" showIcon style={{ marginBottom: 16 }}
        message={`活躍門檻：當月存款 ≥ ${formatPeso(agencyActiveThreshold.active_deposit_amount)}，且當月有效投注 ≥ ${formatPeso(agencyActiveThreshold.active_bet_amount)}`}
        description={`本期共 ${formatCount(row.active)} 位活躍會員。歷史月份使用共用會員資料依月份比例合成。`} />
      <Table data-e2e-id="agency-commission-active-table" size="small" rowKey="uid" dataSource={rows} scroll={{ x: 780 }}
        columns={[
          { title: '會員帳號', dataIndex: 'username', width: 180 },
          { title: '手機', dataIndex: 'phone', width: 180 },
          { title: '當月存款', dataIndex: 'deposit_amount', width: 210, align: 'right', render: formatPeso },
          { title: '當月有效投注', dataIndex: 'valid_bet_amount', width: 210, align: 'right', render: formatPeso },
        ]}
        pagination={{
          current: page, pageSize: 10, showSizeChanger: false, onChange: setPage,
          showTotal: (total) => `共 ${formatCount(total)} 位活躍會員`,
          itemRender: (value, type, element) => <span data-e2e-id={`agency-commission-active-page-${type}-${value}-btn`}>{element}</span>,
        }}
      />
    </Modal>
  );
}

export function PagcorTaxModal({ open, onClose, row }: CommissionDetailProps) {
  // 對應 /agency/commission/pagcor/tax，費用逐筆四捨五入到分後加總。
  const rows = agencyPagcorTaxDetail(agencyCommissionDetailSeed(row), row.ggr);
  return (
    <Modal data-e2e-id="agency-commission-pagcor-tax-modal" open={open} onCancel={onClose} width={860} footer={null} closable={false}
      title={<DetailTitle label="PAGCOR 稅費明細" slug="pagcor-tax" row={row} onClose={onClose} />}>
      <Table data-e2e-id="agency-commission-pagcor-tax-table" size="small" rowKey="game_class" dataSource={rows} pagination={false} scroll={{ x: 780 }}
        columns={[
          { title: '遊戲分類', dataIndex: 'name', width: 190 },
          { title: 'GGR', dataIndex: 'ggr', width: 220, align: 'right', render: formatPeso },
          { title: '稅率', dataIndex: 'ratio', width: 150, align: 'right', render: formatPercent },
          { title: '稅費', dataIndex: 'fee', width: 220, align: 'right', render: formatPeso },
        ]}
        summary={() => <Table.Summary.Row>
          <Table.Summary.Cell index={0}>合計</Table.Summary.Cell>
          <Table.Summary.Cell index={1} align="right">{formatPeso(sumAmount(rows.map((item) => item.ggr)))}</Table.Summary.Cell>
          <Table.Summary.Cell index={2} align="right">—</Table.Summary.Cell>
          <Table.Summary.Cell index={3} align="right"><strong>{formatPeso(sumAmount(rows.map((item) => item.fee)))}</strong></Table.Summary.Cell>
        </Table.Summary.Row>}
      />
    </Modal>
  );
}

export function VenueFeeModal({ open, onClose, row }: CommissionDetailProps) {
  // 對應 /agency/commission/venue/fee。
  const rows = agencyVenueFeeDetail(agencyCommissionDetailSeed(row), row.ggr);
  return (
    <Modal data-e2e-id="agency-commission-venue-fee-modal" open={open} onCancel={onClose} width={860} footer={null} closable={false}
      title={<DetailTitle label="場館費明細" slug="venue-fee" row={row} onClose={onClose} />}>
      <Table data-e2e-id="agency-commission-venue-fee-table" size="small" rowKey="venue_id" dataSource={rows} pagination={false} scroll={{ x: 780 }}
        columns={[
          { title: '場館', dataIndex: 'venue_name', width: 220 },
          { title: 'GGR', dataIndex: 'ggr', width: 210, align: 'right', render: formatPeso },
          { title: '費率', dataIndex: 'ratio', width: 140, align: 'right', render: formatPercent },
          { title: '場館費', dataIndex: 'fee', width: 210, align: 'right', render: formatPeso },
        ]}
        summary={() => <Table.Summary.Row>
          <Table.Summary.Cell index={0}>合計</Table.Summary.Cell>
          <Table.Summary.Cell index={1} align="right">{formatPeso(sumAmount(rows.map((item) => item.ggr)))}</Table.Summary.Cell>
          <Table.Summary.Cell index={2} align="right">—</Table.Summary.Cell>
          <Table.Summary.Cell index={3} align="right"><strong>{formatPeso(sumAmount(rows.map((item) => item.fee)))}</strong></Table.Summary.Cell>
        </Table.Summary.Row>}
      />
    </Modal>
  );
}

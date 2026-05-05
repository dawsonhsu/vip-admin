'use client';

import React, { useState } from 'react';
import { Typography, DatePicker, Button, Space, message, Collapse } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { getMembers, type MemberItem } from '@/data/mockData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Mock：首存未二存名單（依指定日期過濾「首存日 = 該日 + 至今只有一筆存款」）
function generateFirstDepositNoSecond(targetDate: Dayjs | null): MemberItem[] {
  if (!targetDate) return [];
  const all = getMembers();
  const dateStr = targetDate.format('YYYY-MM-DD');
  // mock：用日期字串 charCode 與 member.id 做 hash 決定哪些命中
  const dateSeed = dateStr.charCodeAt(2) + dateStr.charCodeAt(8);
  return all.filter((m) => {
    return ((dateSeed + m.id * 7) % 11) < 4;  // 約 36% 命中率，模擬合理樣本量
  });
}

interface ToolCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function ToolCard({ title, description, children }: ToolCardProps) {
  return (
    <Collapse
      defaultActiveKey={['1']}
      style={{ marginBottom: 16 }}
      items={[
        {
          key: '1',
          label: (
            <div>
              <Text strong style={{ fontSize: 14 }}>{title}</Text>
              <Text type="secondary" style={{ marginLeft: 12, fontSize: 12 }}>{description}</Text>
            </div>
          ),
          children,
        },
      ]}
    />
  );
}

export default function OpsToolsPage() {
  const [turnoverDates, setTurnoverDates] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [turnoverPickedStart, setTurnoverPickedStart] = useState<Dayjs | null>(null);

  // 首存未二存
  const [fdDate, setFdDate] = useState<Dayjs | null>(null);

  const handleTurnoverExport = () => {
    if (!turnoverDates || !turnoverDates[0] || !turnoverDates[1]) {
      message.warning('請先選擇日期範圍');
      return;
    }
    const diff = turnoverDates[1].diff(turnoverDates[0], 'day');
    if (diff > 6) {
      message.error('日期範圍最長為 7 天');
      return;
    }
    const start = turnoverDates[0].format('YYYY-MM-DD');
    const end = turnoverDates[1].format('YYYY-MM-DD');
    message.success(`正在匯出 ${start} ~ ${end} 的會員流水資料`);
  };

  const handleFdExport = () => {
    if (!fdDate) {
      message.warning('請先選擇指定日期');
      return;
    }
    const list = generateFirstDepositNoSecond(fdDate);
    if (list.length === 0) {
      message.warning('該日期無符合條件的名單');
      return;
    }
    const dateStr = fdDate.format('YYYY-MM-DD');
    const header = 'UID,帳號,手機號,VIP等級,累計存款,註冊時間\n';
    const rows = list.map(m =>
      `${m.uid},${m.account},${m.phone},V${m.vipLevel},${m.totalDeposit},${m.registerTime}`
    ).join('\n');
    const csv = header + rows;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `首存未二存名單_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`已匯出 ${list.length} 筆`);
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, color: '#e8e8e8' }}>運營小工具</Title>
        <Text type="secondary">提供運營團隊日常工作所需的資料匯出與批次操作工具</Text>
      </div>

      {/* Tool: 會員流水匯出 */}
      <ToolCard title="會員流水匯出" description="依日期範圍匯出會員流水明細">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <Text type="secondary" style={{ marginRight: 8 }}>日期範圍：</Text>
            <RangePicker
              data-e2e-id="ops-tools-turnover-form-date-range"
              value={turnoverDates as any}
              onChange={(dates) => {
                setTurnoverDates(dates as [Dayjs | null, Dayjs | null] | null);
                setTurnoverPickedStart(null);
              }}
              onCalendarChange={(dates) => {
                if (dates && dates[0] && !dates[1]) {
                  setTurnoverPickedStart(dates[0]);
                } else if (!dates || (!dates[0] && !dates[1])) {
                  setTurnoverPickedStart(null);
                }
              }}
              disabledDate={(current) => {
                if (!turnoverPickedStart) return false;
                const diff = current.diff(turnoverPickedStart, 'day');
                return diff > 6 || diff < -6;
              }}
              style={{ width: 280 }}
            />
          </div>
          <Button data-e2e-id="ops-tools-turnover-form-export-btn" type="primary" icon={<DownloadOutlined />} onClick={handleTurnoverExport}>
            匯出
          </Button>
        </div>
      </ToolCard>

      {/* Tool: 首存未二存名單 */}
      <ToolCard
        title="首存未二存名單"
        description="匯出「指定日期完成首存、且至今仍未進行第二次存款」的會員名單"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <Text type="secondary" style={{ marginRight: 8 }}>指定日期：</Text>
            <DatePicker
              data-e2e-id="ops-tools-first-deposit-form-date-picker"
              value={fdDate}
              onChange={(d) => setFdDate(d)}
              style={{ width: 200 }}
            />
          </div>
          <Button data-e2e-id="ops-tools-first-deposit-form-export-btn" type="primary" icon={<DownloadOutlined />} onClick={handleFdExport}>
            匯出
          </Button>
        </div>
      </ToolCard>
    </div>
  );
}

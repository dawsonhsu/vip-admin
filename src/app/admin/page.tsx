'use client';

import React, { useMemo, useState } from 'react';
import {
  AccountBookOutlined,
  AppstoreOutlined,
  DollarOutlined,
  FundOutlined,
  GiftOutlined,
  InfoCircleOutlined,
  LoginOutlined,
  MoneyCollectOutlined,
  PercentageOutlined,
  SolutionOutlined,
  SwapOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserAddOutlined,
  UsergroupAddOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Segmented,
  Space,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import type { Dayjs } from 'dayjs';
import DashboardChartModal from '@/components/DashboardChartModal';
import {
  QUICK_KEYS,
  formatMetric,
  getDashboardSummary,
  getGroupMetrics,
  getQuickRange,
  type DashboardStatTime,
  type GroupKey,
  type MetricDef,
  type QuickKey,
} from '@/data/dashboardData';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const QUICK_E2E_KEYS: Record<QuickKey, string> = {
  今日: 'today',
  昨日: 'yesterday',
  本週: 'this-week',
  上週: 'last-week',
  本月: 'this-month',
  上月: 'last-month',
};

const iconMap: Record<string, React.ReactNode> = {
  'user-add': <UserAddOutlined />,
  login: <LoginOutlined />,
  team: <TeamOutlined />,
  'usergroup-add': <UsergroupAddOutlined />,
  solution: <SolutionOutlined />,
  dollar: <DollarOutlined />,
  trophy: <TrophyOutlined />,
  'account-book': <AccountBookOutlined />,
  user: <UserOutlined />,
  swap: <SwapOutlined />,
  'money-collect': <MoneyCollectOutlined />,
  fund: <FundOutlined />,
  percentage: <PercentageOutlined />,
  gift: <GiftOutlined />,
  appstore: <AppstoreOutlined />,
};

const initialStatTime = (): DashboardStatTime => {
  const range = getQuickRange('今日');
  return { quickKey: '今日', range: [range.start, range.end] };
};

interface MetricCardProps {
  metric: MetricDef;
  values: Record<string, number>;
  onOpen: (metricKey: string) => void;
}

function MetricCard({ metric, values, onOpen }: MetricCardProps) {
  const { token } = theme.useToken();
  const openChart = () => onOpen(metric.key);

  return (
    <Card
      data-e2e-id={`dashboard-card-${metric.key}`}
      hoverable
      role="button"
      tabIndex={0}
      onClick={openChart}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openChart();
        }
      }}
      styles={{
        body: {
          minHeight: 116,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        },
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: token.colorTextSecondary,
            fontSize: 13,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: token.colorPrimary, fontSize: 15, display: 'inline-flex' }}>
            {metric.icon ? iconMap[metric.icon] : null}
          </span>
          <span>{metric.label}</span>
          {metric.tooltip ? (
            <Tooltip title={metric.tooltip}>
              <InfoCircleOutlined
                data-e2e-id={`dashboard-card-tooltip-${metric.key}`}
                style={{ color: token.colorTextTertiary }}
                onClick={(event) => event.stopPropagation()}
              />
            </Tooltip>
          ) : null}
        </div>
        {metric.secondary ? (
          <div
            title={`${metric.secondary.label} ${formatMetric(values[metric.secondary.key], metric.secondary.format)}`}
            style={{
              flexShrink: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'right',
              fontSize: 11,
              color: token.colorTextTertiary,
            }}
          >
            {metric.secondary.label}{' '}
            {formatMetric(values[metric.secondary.key], metric.secondary.format)}
          </div>
        ) : null}
      </div>
      <div
        style={{
          color: token.colorText,
          fontSize: 24,
          fontWeight: 600,
          lineHeight: 1.25,
          fontVariantNumeric: 'tabular-nums',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {formatMetric(values[metric.key], metric.format)}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [statTime, setStatTime] = useState<DashboardStatTime>(initialStatTime);
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [customRangeAnchor, setCustomRangeAnchor] = useState<Dayjs | null>(null);
  const [selectedMetricKey, setSelectedMetricKey] = useState('registerCount');
  const [chartOpen, setChartOpen] = useState(false);

  const summary = useMemo(
    () =>
      getDashboardSummary(
        statTime.range[0].format('YYYY-MM-DD'),
        statTime.range[1].format('YYYY-MM-DD')
      ),
    [statTime]
  );

  const applyQuickRange = (quickKey: QuickKey) => {
    const range = getQuickRange(quickKey);
    setStatTime({ quickKey, range: [range.start, range.end] });
    setCustomRange(null);
    setCustomRangeAnchor(null);
  };

  const reset = () => {
    const range = getQuickRange('今日');
    setStatTime({ quickKey: '今日', range: [range.start, range.end] });
    setCustomRange(null);
    setCustomRangeAnchor(null);
  };

  const applyCustomRange = () => {
    if (!customRange) return;
    setStatTime({ quickKey: null, range: customRange });
  };

  const disabledCustomDate = (current: Dayjs) => {
    if (!customRangeAnchor) return false;
    return (
      current.isBefore(customRangeAnchor.subtract(89, 'day'), 'day') ||
      current.isAfter(customRangeAnchor.add(89, 'day'), 'day')
    );
  };

  const openChart = (metricKey: string) => {
    setSelectedMetricKey(metricKey);
    setChartOpen(true);
  };

  const groups: GroupKey[] = ['member', 'betting', 'game'];

  return (
    <div data-e2e-id="dashboard-root">
      <Card data-e2e-id="dashboard-timebar" style={{ marginBottom: 20 }}>
        <div className="dashboard-timebar-content">
          <Space wrap size={12}>
            <Text>統計時間</Text>
            <Segmented
              data-e2e-id="dashboard-quick-segmented"
              value={statTime.quickKey ?? '__custom__'}
              options={QUICK_KEYS.map((quickKey) => ({
                value: quickKey,
                label: (
                  <span data-e2e-id={`dashboard-quick-${QUICK_E2E_KEYS[quickKey]}`}>
                    {quickKey}
                  </span>
                ),
              }))}
              onChange={(value) => applyQuickRange(value as QuickKey)}
            />
          </Space>
          <Space wrap size={12}>
            <Text>自訂時間</Text>
            <RangePicker
              data-e2e-id="dashboard-custom-range"
              value={customRange}
              disabledDate={disabledCustomDate}
              onCalendarChange={(dates) => {
                const first = dates?.[0] ?? dates?.[1] ?? null;
                setCustomRangeAnchor(dates?.[0] && dates[1] ? null : first);
              }}
              onChange={(dates) => {
                setCustomRange(dates?.[0] && dates[1] ? [dates[0], dates[1]] : null);
                setCustomRangeAnchor(null);
              }}
            />
            <Button data-e2e-id="dashboard-reset-btn" onClick={reset}>
              重置
            </Button>
            <Button
              data-e2e-id="dashboard-query-btn"
              type="primary"
              disabled={!customRange}
              onClick={applyCustomRange}
            >
              查詢
            </Button>
          </Space>
        </div>
      </Card>

      {groups.map((group, groupIndex) => (
        <React.Fragment key={group}>
          {groupIndex > 0 ? <Divider style={{ margin: '24px 0' }} /> : null}
          <div className="dashboard-grid">
            {getGroupMetrics(group).map((metric) => (
              <MetricCard
                key={metric.key}
                metric={metric}
                values={summary}
                onOpen={openChart}
              />
            ))}
          </div>
        </React.Fragment>
      ))}

      <DashboardChartModal
        open={chartOpen}
        onClose={() => setChartOpen(false)}
        metricKey={selectedMetricKey}
        statTime={statTime}
      />

      <style jsx>{`
        .dashboard-timebar-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
        }

        @media (max-width: 1199px) {
          .dashboard-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        @media (max-width: 991px) {
          .dashboard-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 767px) {
          .dashboard-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 479px) {
          .dashboard-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

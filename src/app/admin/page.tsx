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

const GROUP_GRADIENTS: Record<GroupKey, string> = {
  member: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
  betting: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
  game: 'linear-gradient(135deg, #55efc4 0%, #00b894 100%)',
};

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
  const openChart = () => onOpen(metric.key);

  return (
    <>
      <div
        className="metric-card"
        style={{ background: GROUP_GRADIENTS[metric.group] }}
        data-e2e-id={`dashboard-card-${metric.key}`}
        role="button"
        tabIndex={0}
        onClick={openChart}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openChart();
          }
        }}
      >
        <div className="metric-card__top-row">
          <span className="metric-card__icon">
            {metric.icon ? iconMap[metric.icon] : null}
          </span>
          {metric.secondary ? (
            <div
              className="metric-card__secondary"
              title={`${metric.secondary.label} ${formatMetric(values[metric.secondary.key], metric.secondary.format)}`}
            >
              {metric.secondary.label}{' '}
              {formatMetric(values[metric.secondary.key], metric.secondary.format)}
            </div>
          ) : null}
        </div>

        <div className="metric-card__label-row">
          <span>{metric.label}</span>
          {metric.tooltip ? (
            <Tooltip title={metric.tooltip}>
              <InfoCircleOutlined
                data-e2e-id={`dashboard-card-tooltip-${metric.key}`}
                className="metric-card__tooltip"
                onClick={(event) => event.stopPropagation()}
              />
            </Tooltip>
          ) : null}
        </div>

        <div className="metric-card__value">
          {formatMetric(values[metric.key], metric.format)}
        </div>
      </div>

      <style jsx>{`
        .metric-card {
          min-height: 116px;
          padding: 16px;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          cursor: pointer;
          color: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .metric-card::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 60px;
          height: 60px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 50%;
          transform: translate(20px, -20px);
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
        }

        .metric-card__top-row,
        .metric-card__label-row,
        .metric-card__value {
          position: relative;
          z-index: 1;
        }

        .metric-card__top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .metric-card__icon {
          display: inline-flex;
          flex-shrink: 0;
          color: #fff;
          font-size: 22px;
        }

        .metric-card__secondary {
          min-width: 0;
          overflow: hidden;
          color: rgba(255, 255, 255, 0.85);
          font-size: 11px;
          text-align: right;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .metric-card__label-row {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(255, 255, 255, 0.92);
          font-size: 14px;
          white-space: nowrap;
        }

        .metric-card__label-row :global(.metric-card__tooltip) {
          color: rgba(255, 255, 255, 0.8);
        }

        .metric-card__value {
          overflow: hidden;
          color: #fff;
          font-size: 24px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          line-height: 1.25;
          text-overflow: ellipsis;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
          white-space: nowrap;
        }
      `}</style>
    </>
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

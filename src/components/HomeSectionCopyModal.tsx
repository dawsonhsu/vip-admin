'use client';

import React, { useMemo, useState } from 'react';
import { Alert, Button, Checkbox, Modal, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  cloneSections,
  gamesForPlatform,
  platformLabels,
  platforms,
  platformSupportsGameType,
  type HomeSection,
  type Platform,
} from '@/data/homeSectionsData';

const { Text } = Typography;

interface CompatibilityRow {
  key: Platform;
  target: Platform;
  completeCount: number;
  partialOrSkippedCount: number;
  missingGameCount: number;
}

interface HomeSectionCopyModalProps {
  open: boolean;
  sourcePlatform: Platform;
  sourceSections: HomeSection[];
  onCancel: () => void;
  onCopy: (copies: Partial<Record<Platform, HomeSection[]>>) => void;
}

const compatibilityColumns: ColumnsType<CompatibilityRow> = [
  {
    title: '目標平台',
    dataIndex: 'target',
    render: (target: Platform) => platformLabels[target],
  },
  { title: '可完整複製板塊數', dataIndex: 'completeCount' },
  { title: '需部分/跳過的板塊', dataIndex: 'partialOrSkippedCount' },
  { title: '缺少遊戲數', dataIndex: 'missingGameCount' },
];

export default function HomeSectionCopyModal({
  open,
  sourcePlatform,
  sourceSections,
  onCancel,
  onCopy,
}: HomeSectionCopyModalProps) {
  const [targets, setTargets] = useState<Platform[]>([]);
  const targetOptions = platforms.filter((platform) => platform !== sourcePlatform);

  const compatibilityRows = useMemo(() => targets.map((target): CompatibilityRow => {
    const targetGameIds = new Set(gamesForPlatform(target).map((game) => game.gameId));
    let completeCount = 0;
    let partialOrSkippedCount = 0;
    let missingGameCount = 0;

    sourceSections.forEach((section) => {
      if (section.type === 'system') {
        completeCount += 1;
        return;
      }
      const categoryUnavailable = section.type === 'category'
        && !!section.categoryGameType
        && !platformSupportsGameType(target, section.categoryGameType);
      const missingForSection = section.gameIds.filter((gameId) => !targetGameIds.has(gameId)).length;
      missingGameCount += missingForSection;
      if (categoryUnavailable || missingForSection > 0) {
        partialOrSkippedCount += 1;
      } else {
        completeCount += 1;
      }
    });

    return {
      key: target,
      target,
      completeCount,
      partialOrSkippedCount,
      missingGameCount,
    };
  }), [sourceSections, targets]);

  const close = () => {
    setTargets([]);
    onCancel();
  };

  const confirmCopy = () => {
    const copies: Partial<Record<Platform, HomeSection[]>> = {};
    targets.forEach((target) => {
      const targetGameIds = new Set(gamesForPlatform(target).map((game) => game.gameId));
      copies[target] = cloneSections(sourceSections)
        .filter((section) => section.type !== 'category'
          || !section.categoryGameType
          || platformSupportsGameType(target, section.categoryGameType))
        .map((section) => ({
          ...section,
          gameIds: section.gameIds.filter((gameId) => targetGameIds.has(gameId)),
        }));
    });
    onCopy(copies);
    message.success(`已複製到 ${targets.length} 個平台草稿`);
    setTargets([]);
  };

  return (
    <Modal
      title="複製到其他平台"
      open={open}
      onCancel={close}
      width={760}
      footer={[
        <Button key="cancel" onClick={close} data-e2e-id="home-section-copy-cancel-btn">取消</Button>,
        <Button
          key="confirm"
          type="primary"
          disabled={targets.length === 0}
          onClick={confirmCopy}
          data-e2e-id="home-section-copy-confirm-btn"
        >
          確認複製
        </Button>,
      ]}
      data-e2e-id="home-section-copy-modal"
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Text type="secondary">來源平台：</Text>
          <Text strong>{platformLabels[sourcePlatform]}</Text>
        </div>
        <div>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>目標平台</Text>
          <Checkbox.Group
            value={targets}
            options={targetOptions.map((platform) => ({
              label: platformLabels[platform],
              value: platform,
            }))}
            onChange={(values) => setTargets(values as Platform[])}
            data-e2e-id="home-section-copy-targets"
          />
        </div>
        <Table<CompatibilityRow>
          size="small"
          bordered
          pagination={false}
          columns={compatibilityColumns}
          dataSource={compatibilityRows}
          locale={{ emptyText: '請選擇目標平台以檢查相容性' }}
          data-e2e-id="home-section-copy-compatibility-table"
        />
        <Alert
          type="warning"
          showIcon
          message="目標平台現有草稿將被整份覆蓋，複製後進入草稿，需自行發布。"
        />
      </Space>
    </Modal>
  );
}

'use client';

import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Radio,
  Table,
  Tag,
  Typography,
  Space,
  Button,
  message,
  Tooltip,
} from 'antd';
import { EditOutlined, SaveOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  freeBetRewardConfigs,
  type FreeBetRewardConfig,
} from '@/data/freeBetActivityData';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const formatCurrency = (value: number) =>
  `₱${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// 与 FAT 编辑配置页保持一致的 VIP 等级表头（分 6 级区段）
const VIP_SEGMENTS = [
  { key: 'bronze', label: '青铜', range: 'VIP 1-5' },
  { key: 'silver', label: '白银', range: 'VIP 6-10' },
  { key: 'gold', label: '黄金', range: 'VIP 11-15' },
  { key: 'platinum', label: '铂金', range: 'VIP 16-20' },
  { key: 'diamond', label: '钻石', range: 'VIP 21-25' },
  { key: 'diamond_supreme', label: '钻石至尊', range: 'VIP 26-30' },
];

interface FreeBetConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export default function FreeBetConfigModal({ open, onClose }: FreeBetConfigModalProps) {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [configData, setConfigData] = useState<FreeBetRewardConfig[]>(freeBetRewardConfigs);
  const [editingConfigKey, setEditingConfigKey] = useState<number | null>(null);

  const handleConfigEdit = (record: FreeBetRewardConfig) => {
    setEditingConfigKey(record.key);
    editForm.setFieldsValue({
      bonusId: record.bonusId,
      rewardAmount: record.rewardAmount,
    });
  };

  const handleConfigSave = (key: number) => {
    const values = editForm.getFieldsValue();
    const now = new Date()
      .toLocaleString('sv-SE', { timeZone: 'Asia/Manila' })
      .replace('T', ' ');
    setConfigData((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, ...values, lastUpdatedBy: 'current_admin', lastUpdatedAt: now }
          : item
      )
    );
    setEditingConfigKey(null);
    message.success('VIP 等级奖励已更新');
  };

  // VIP × FreeBet 金额表格
  const rewardColumns: ColumnsType<FreeBetRewardConfig> = [
    {
      title: 'VIP 等级',
      dataIndex: 'vipLevel',
      width: 100,
      render: (value) => <Tag color="blue">VIP {value}</Tag>,
    },
    {
      title: 'Bonus ID',
      dataIndex: 'bonusId',
      width: 140,
      render: (value, record) => {
        if (editingConfigKey === record.key) {
          return (
            <Form.Item name="bonusId" style={{ margin: 0 }}>
              <InputNumber style={{ width: 120 }} />
            </Form.Item>
          );
        }
        return <Text code>{value}</Text>;
      },
    },
    {
      title: 'FreeBet 金额',
      dataIndex: 'rewardAmount',
      render: (value, record) => {
        if (editingConfigKey === record.key) {
          return (
            <Form.Item name="rewardAmount" style={{ margin: 0 }}>
              <InputNumber style={{ width: '100%' }} prefix="₱" />
            </Form.Item>
          );
        }
        return <Text strong>{formatCurrency(value)}</Text>;
      },
    },
    {
      title: '最后更新时间',
      dataIndex: 'lastUpdatedAt',
      width: 170,
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      render: (_, record) => {
        if (editingConfigKey === record.key) {
          return (
            <Space size={4}>
              <Button type="link" size="small" onClick={() => setEditingConfigKey(null)}>
                取消
              </Button>
              <Button
                type="link"
                size="small"
                icon={<SaveOutlined />}
                onClick={() => handleConfigSave(record.key)}
              >
                保存
              </Button>
            </Space>
          );
        }
        return (
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleConfigEdit(record)}
          >
            编辑
          </Button>
        );
      },
    },
  ];

  const handleOk = () => {
    form
      .validateFields()
      .then(() => {
        message.success('活动配置已保存');
        onClose();
      })
      .catch(() => {
        message.error('请检查必填项');
      });
  };

  // 按钮文案、标题都与 FAT 完全一致
  return (
    <Modal
      title="世界杯冠军 FreeBet - 编辑配置"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="OK"
      cancelText="Cancel"
      width={1060}
      styles={{ body: { maxHeight: '65vh', overflowY: 'auto', paddingRight: 16 } }}
      centered
    >
      <Form
        form={form}
        labelCol={{ span: 5 }}
        wrapperCol={{ span: 18 }}
        labelAlign="right"
        initialValues={{
          activityType: 'extra',
          activityId: 29,
          name: '世界杯冠军 FreeBet',
          ruleSource: 'code',
          status: 'active',
          timeRange: [dayjs('2026-05-01 00:00:00'), dayjs('2026-06-10 23:59:59')],
          introSource: 'frontend',
          orderReview: 'auto',
          autoCredit: 'auto',
          wagerLimit: [],
          wagerRequirement: 0,
          googleCode: undefined,
        }}
      >
        {/* 活动类型：与 FAT 保持一致；FreeBet 归类为附加类 */}
        <Form.Item label="活动类型" name="activityType" rules={[{ required: true }]}>
          <Radio.Group>
            <Radio value="blindbox">盲盒类</Radio>
            <Radio value="rebate">返水类</Radio>
            <Radio value="deposit">首存类</Radio>
            <Radio value="leaderboard">排行榜类</Radio>
            <Radio value="extra">附加类</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="活动ID" name="activityId" rules={[{ required: true }]}>
          <InputNumber disabled style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="活动名称" name="name" rules={[{ required: true }]}>
          <Input placeholder="请输入活动名称" />
        </Form.Item>

        <Form.Item
          label="活动规则来源"
          name="ruleSource"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio value="backend">后台配置</Radio>
            <Radio value="code">开发代码配置</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="活动状态" name="status" rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'active', label: '有效' },
              { value: 'closed', label: '失效' },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="活动持续时间"
          name="timeRange"
          rules={[{ required: true }]}
        >
          <RangePicker
            showTime
            style={{ width: '100%' }}
            format="YYYY-MM-DD HH:mm:ss"
          />
        </Form.Item>

        <Form.Item
          label="活动介绍页来源"
          name="introSource"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio value="backend">后台配置</Radio>
            <Radio value="frontend">前端开发设计</Radio>
          </Radio.Group>
        </Form.Item>

        {/* FreeBet 奖励配置 */}
        <Form.Item label="FreeBet 奖励配置" required>
          <Form form={editForm} component={false}>
            <Table
              columns={rewardColumns}
              dataSource={configData}
              rowKey="key"
              size="small"
              pagination={false}
              scroll={{ y: 360 }}
            />
          </Form>
        </Form.Item>

        <Form.Item
          label="订单审核方式"
          name="orderReview"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio value="auto">自动</Radio>
            <Radio value="manual">人工</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label="是否自动到帐"
          name="autoCredit"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio value="manual">手动领取</Radio>
            <Radio value="auto">自动到账</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="流水场馆/游戏限制" name="wagerLimit">
          <Select
            mode="tags"
            style={{ width: '100%' }}
            placeholder="添加允许流水的场馆或游戏"
            options={[
              { value: 'BTi Sports', label: 'BTi Sports' },
              { value: 'FIFA World Cup Champion', label: 'FIFA World Cup Champion' },
              { value: 'PBA', label: 'PBA' },
              { value: 'NBA', label: 'NBA' },
              { value: 'Saba Sports', label: 'Saba Sports' },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="礼金流水要求"
          name="wagerRequirement"
          rules={[{ required: true }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            step={0.5}
            addonAfter="倍"
          />
        </Form.Item>

        <Form.Item
          label="谷歌验证码"
          name="googleCode"
          rules={[{ required: true, message: '请输入谷歌验证码' }]}
        >
          <Input.Password placeholder="请输入谷歌验证码" maxLength={6} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

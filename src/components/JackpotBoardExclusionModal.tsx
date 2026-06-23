'use client';

import React, { useState } from 'react';
import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  generateBlacklist,
  generateOptOuts,
  type JackpotBlacklistEntry,
  type JackpotOptOutEntry,
} from '@/data/jackpotBoardData';

const { Text } = Typography;

interface JackpotBoardExclusionModalProps {
  open: boolean;
  onClose: () => void;
}

interface BlacklistFormValues {
  account: string;
  reason: string;
}

type ExclusionTabKey = 'blacklist' | 'rules' | 'vip' | 'optOut';

const accountRuleOptions = [
  { value: 'test', label: '測試帳號' },
  { value: 'internal', label: '內部員工' },
  { value: 'studio', label: '工作室標記' },
  { value: 'risk', label: '風控標記帳號' },
];

const vipOptions = Array.from({ length: 8 }, (_, index) => `VIP${index}`);

export default function JackpotBoardExclusionModal({
  open,
  onClose,
}: JackpotBoardExclusionModalProps) {
  const [blacklistForm] = Form.useForm<BlacklistFormValues>();
  const [activeTab, setActiveTab] = useState<ExclusionTabKey>('blacklist');
  const [blacklist, setBlacklist] = useState<JackpotBlacklistEntry[]>(generateBlacklist);
  const [optOuts, setOptOuts] = useState<JackpotOptOutEntry[]>(generateOptOuts);
  const [showAddBlacklist, setShowAddBlacklist] = useState(false);
  const [accountRules, setAccountRules] = useState<string[]>(
    accountRuleOptions.map((option) => option.value)
  );
  const [vipProtectionEnabled, setVipProtectionEnabled] = useState(true);
  const [protectedVipLevel, setProtectedVipLevel] = useState('VIP5');

  const handleAddBlacklist = async () => {
    try {
      const values = await blacklistForm.validateFields();
      setBlacklist((prev) => [
        {
          key: `blacklist-custom-${Date.now()}`,
          account: values.account.trim(),
          reason: values.reason.trim(),
          operator: 'admin01',
          addedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        },
        ...prev,
      ]);
      blacklistForm.resetFields();
      setShowAddBlacklist(false);
      message.success('已新增黑名單');
    } catch {
      message.error('請填寫帳號與原因');
    }
  };

  const handleRemoveBlacklist = (record: JackpotBlacklistEntry) => {
    setBlacklist((prev) => prev.filter((item) => item.key !== record.key));
    message.success('已解除黑名單');
  };

  const handleRestoreOptOut = (record: JackpotOptOutEntry) => {
    setOptOuts((prev) => prev.filter((item) => item.key !== record.key));
    message.success('已恢復用戶上榜狀態');
  };

  const blacklistColumns: ColumnsType<JackpotBlacklistEntry> = [
    { title: '帳號', dataIndex: 'account', width: 150 },
    { title: '原因', dataIndex: 'reason', width: 180 },
    { title: '操作人', dataIndex: 'operator', width: 120 },
    { title: '加入時間', dataIndex: 'addedAt', width: 180 },
    {
      title: '操作',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => handleRemoveBlacklist(record)}
          data-e2e-id={`jackpot-board-exclusion-blacklist-remove-btn-${record.key}`}
        >
          解除
        </Button>
      ),
    },
  ];

  const optOutColumns: ColumnsType<JackpotOptOutEntry> = [
    { title: '帳號', dataIndex: 'account', width: 180 },
    { title: '關閉時間', dataIndex: 'optOutAt', width: 200 },
    { title: '範圍', dataIndex: 'scope', width: 120 },
    {
      title: '操作',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => handleRestoreOptOut(record)}
          data-e2e-id={`jackpot-board-exclusion-opt-out-restore-btn-${record.key}`}
        >
          恢復
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'blacklist',
      label: <span data-e2e-id="jackpot-board-exclusion-tab-blacklist">帳號黑名單</span>,
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {!showAddBlacklist ? (
            <Button
              type="primary"
              onClick={() => setShowAddBlacklist(true)}
              data-e2e-id="jackpot-board-exclusion-add-blacklist-btn"
            >
              新增黑名單
            </Button>
          ) : (
            <Form
              form={blacklistForm}
              layout="inline"
              style={{ rowGap: 12, flexWrap: 'wrap' }}
              data-e2e-id="jackpot-board-exclusion-add-blacklist-form"
            >
              <Form.Item name="account" label="帳號" rules={[{ required: true, message: '請輸入帳號' }]}>
                <Input
                  style={{ width: 180 }}
                  placeholder="請輸入帳號"
                  data-e2e-id="jackpot-board-exclusion-blacklist-account-input"
                />
              </Form.Item>
              <Form.Item name="reason" label="原因" rules={[{ required: true, message: '請輸入原因' }]}>
                <Input
                  style={{ width: 220 }}
                  placeholder="請輸入原因"
                  data-e2e-id="jackpot-board-exclusion-blacklist-reason-input"
                />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    onClick={handleAddBlacklist}
                    data-e2e-id="jackpot-board-exclusion-blacklist-submit-btn"
                  >
                    新增
                  </Button>
                  <Button
                    onClick={() => {
                      blacklistForm.resetFields();
                      setShowAddBlacklist(false);
                    }}
                    data-e2e-id="jackpot-board-exclusion-blacklist-cancel-btn"
                  >
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          )}
          <Table
            rowKey="key"
            size="small"
            columns={blacklistColumns}
            dataSource={blacklist}
            pagination={false}
            data-e2e-id="jackpot-board-exclusion-blacklist-table"
          />
        </Space>
      ),
    },
    {
      key: 'rules',
      label: <span data-e2e-id="jackpot-board-exclusion-tab-rules">帳號類型規則</span>,
      children: (
        <Space direction="vertical" size="middle">
          <Text>自動排除以下帳號類型</Text>
          <Checkbox.Group
            value={accountRules}
            onChange={(values) => setAccountRules(values.map(String))}
            data-e2e-id="jackpot-board-exclusion-account-rules-checkbox-group"
          >
            <Space direction="vertical">
              {accountRuleOptions.map((option) => (
                <Checkbox
                  key={option.value}
                  value={option.value}
                  data-e2e-id={`jackpot-board-exclusion-account-rule-${option.value}-checkbox`}
                >
                  {option.label}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </Space>
      ),
    },
    {
      key: 'vip',
      label: <span data-e2e-id="jackpot-board-exclusion-tab-vip">VIP 等級門檻</span>,
      children: (
        <Space direction="vertical" size="middle">
          <Space>
            <Switch
              checked={vipProtectionEnabled}
              onChange={setVipProtectionEnabled}
              data-e2e-id="jackpot-board-exclusion-vip-protection-switch"
            />
            <Text>啟用 VIP 等級保護</Text>
          </Space>
          <Space>
            <Text>≥ 此等級預設不上榜</Text>
            <Select
              value={protectedVipLevel}
              onChange={setProtectedVipLevel}
              style={{ width: 140 }}
              disabled={!vipProtectionEnabled}
              data-e2e-id="jackpot-board-exclusion-vip-level-select"
            >
              {vipOptions.map((level) => (
                <Select.Option key={level} value={level}>
                  {level}
                </Select.Option>
              ))}
            </Select>
          </Space>
          <Text type="secondary">保護高等級玩家(鯨魚)的贏分不被全站曝光</Text>
        </Space>
      ),
    },
    {
      key: 'optOut',
      label: <span data-e2e-id="jackpot-board-exclusion-tab-opt-out">用戶 opt-out 狀態</span>,
      children: (
        <Table
          rowKey="key"
          size="small"
          columns={optOutColumns}
          dataSource={optOuts}
          pagination={false}
          data-e2e-id="jackpot-board-exclusion-opt-out-table"
        />
      ),
    },
  ];

  return (
    <Modal
      title="排除與隱私名單"
      open={open}
      width={760}
      closable={false}
      maskClosable={false}
      onCancel={onClose}
      footer={(
        <Button onClick={onClose} data-e2e-id="jackpot-board-exclusion-close-btn">
          關閉
        </Button>
      )}
      data-e2e-id="jackpot-board-exclusion-modal"
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as ExclusionTabKey)}
        items={tabItems}
        data-e2e-id="jackpot-board-exclusion-tabs"
      />
    </Modal>
  );
}

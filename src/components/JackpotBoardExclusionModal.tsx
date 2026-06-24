'use client';

import React, { useState } from 'react';
import {
  Button,
  Form,
  Input,
  Modal,
  Space,
  Table,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  generateBlacklist,
  type JackpotBlacklistEntry,
} from '@/data/jackpotBoardData';

interface JackpotBoardExclusionModalProps {
  open: boolean;
  onClose: () => void;
}

interface BlacklistFormValues {
  account: string;
  reason: string;
}

export default function JackpotBoardExclusionModal({
  open,
  onClose,
}: JackpotBoardExclusionModalProps) {
  const [blacklistForm] = Form.useForm<BlacklistFormValues>();
  const [blacklist, setBlacklist] = useState<JackpotBlacklistEntry[]>(() => generateBlacklist());
  const [showAddBlacklist, setShowAddBlacklist] = useState(false);

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

  const handleToggleAddBlacklist = () => {
    if (showAddBlacklist) blacklistForm.resetFields();
    setShowAddBlacklist((prev) => !prev);
  };

  return (
    <Modal
      title="帳號黑名單"
      open={open}
      width={680}
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
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Button
          type="primary"
          onClick={handleToggleAddBlacklist}
          data-e2e-id="jackpot-board-exclusion-add-blacklist-btn"
        >
          新增黑名單
        </Button>
        {showAddBlacklist && (
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
    </Modal>
  );
}

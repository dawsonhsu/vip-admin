'use client';

import React, { useEffect, useState } from 'react';
import { Button, Modal, Space, Switch, Typography } from 'antd';

const { Text } = Typography;

export interface KycEkycConfig {
  thirdPartyVerification: boolean;
  autoReview: boolean;
}

interface KycEkycConfigModalProps {
  open: boolean;
  value: KycEkycConfig;
  onClose: () => void;
  onSave: (value: KycEkycConfig) => void;
}

export default function KycEkycConfigModal({ open, value, onClose, onSave }: KycEkycConfigModalProps) {
  const [draft, setDraft] = useState<KycEkycConfig>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  return (
    <Modal
      data-e2e-id="kyc-ekyc-config-modal"
      title="EKYC 配置"
      open={open}
      onCancel={onClose}
      width={480}
      footer={(
        <Space>
          <Button data-e2e-id="kyc-ekyc-config-close-btn" onClick={onClose}>關閉</Button>
          <Button data-e2e-id="kyc-ekyc-config-save-btn" type="primary" onClick={() => onSave(draft)}>保存</Button>
        </Space>
      )}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <Text strong>三方驗證</Text>
            <Text type="secondary" style={{ display: 'block' }}>Zoloz 第三方身份驗證</Text>
          </div>
          <Switch
            data-e2e-id="kyc-ekyc-third-party-switch"
            checked={draft.thirdPartyVerification}
            onChange={(checked) => setDraft((current) => ({ ...current, thirdPartyVerification: checked }))}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <Text strong>自動審核</Text>
            <Text type="secondary" style={{ display: 'block' }}>驗證通過後自動完成審核</Text>
          </div>
          <Switch
            data-e2e-id="kyc-ekyc-auto-review-switch"
            checked={draft.autoReview}
            onChange={(checked) => setDraft((current) => ({ ...current, autoReview: checked }))}
          />
        </div>
      </Space>
    </Modal>
  );
}

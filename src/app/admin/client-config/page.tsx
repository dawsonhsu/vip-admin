'use client';

import React, { useEffect, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import {
  Badge,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Space,
  Switch,
  Table,
  Tabs,
  Typography,
  Upload,
  message,
} from 'antd';
import {
  DownloadOutlined,
  ImportOutlined,
  SettingOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  clientConfigTabLabels,
  complianceGameTemplateRows,
  complianceModeOptions,
  defaultComplianceConfig,
  defaultFirstDepositAmount,
  type ComplianceConfig,
  type ComplianceGameRow,
  type ComplianceMode,
} from '@/data/clientConfigData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss';

interface ComplianceFormValues {
  mode: ComplianceMode;
  manualEnabled: boolean;
  deadline?: [Dayjs, Dayjs];
  googleCode: string;
}

interface FirstDepositFormValues {
  firstDeposit: number;
}

interface EffectiveState {
  open: boolean;
  label: string;
}

// Resolve the actual live compliance state from a mode/manual/schedule combo.
// This is what turns a "setting" into a plain-language "生效狀態" the operator can trust.
const resolveEffective = (
  mode: ComplianceMode | undefined,
  manualEnabled: boolean | undefined,
  start: Dayjs | undefined,
  end: Dayjs | undefined,
  now: Dayjs,
): EffectiveState => {
  if (mode === 'manual') {
    return manualEnabled
      ? { open: true, label: '開啟中（手動）' }
      : { open: false, label: '關閉（手動）' };
  }
  if (!start || !end) {
    return { open: false, label: '排程未設定' };
  }
  const range = `${start.format(dateTimeFormat)} ~ ${end.format(dateTimeFormat)}`;
  if (now.isBefore(start)) {
    return { open: false, label: `未開始（排程 ${range}，將於起始時間開啟）` };
  }
  if (now.isAfter(end)) {
    return { open: false, label: `已過期自動關閉（排程 ${range} 已結束）` };
  }
  return { open: true, label: `開啟中（排程），剩 ${end.diff(now, 'day')} 天後自動關閉` };
};

const complianceGameColumns: ColumnsType<ComplianceGameRow> = [
  { title: '遊戲ID', dataIndex: 'gameId' },
  { title: '英文名', dataIndex: 'gameNameEn' },
  { title: '是否合規', dataIndex: 'isCompliant' },
];

export default function ClientConfigPage() {
  const [complianceForm] = Form.useForm<ComplianceFormValues>();
  const [firstDepositForm] = Form.useForm<FirstDepositFormValues>();
  const [config, setConfig] = useState<ComplianceConfig>(defaultComplianceConfig);
  const [firstDeposit, setFirstDeposit] = useState(defaultFirstDepositAmount);
  const [importedGames, setImportedGames] = useState<ComplianceGameRow[]>([]);
  const [complianceModalOpen, setComplianceModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [firstDepositModalOpen, setFirstDepositModalOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  // antd Tabs auto-overflow measures widths on the client and re-structures the
  // tab strip, which the SSR'd HTML cannot match. Render the interactive content
  // only after mount so the server and first client render agree (no hydration mismatch).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Live preview inside the modal — reflects the pending selection, not what is live now.
  const watchedMode = Form.useWatch('mode', complianceForm);
  const watchedManual = Form.useWatch('manualEnabled', complianceForm);
  const watchedDeadline = Form.useWatch('deadline', complianceForm);
  const previewState = resolveEffective(
    watchedMode ?? config.mode,
    watchedManual,
    watchedDeadline?.[0],
    watchedDeadline?.[1],
    dayjs(),
  );

  // What is actually live right now, from the saved config.
  const currentState = resolveEffective(
    config.mode,
    config.manualEnabled,
    dayjs(config.scheduleStart),
    dayjs(config.scheduleEnd),
    dayjs(),
  );

  const openComplianceModal = () => {
    complianceForm.setFieldsValue({
      mode: config.mode,
      manualEnabled: config.manualEnabled,
      deadline: [dayjs(config.scheduleStart), dayjs(config.scheduleEnd)],
      googleCode: '',
    });
    setComplianceModalOpen(true);
  };

  const handleComplianceConfirm = async () => {
    const values = await complianceForm.validateFields();
    setConfig({
      mode: values.mode,
      manualEnabled: values.mode === 'manual' ? !!values.manualEnabled : config.manualEnabled,
      scheduleStart:
        values.mode === 'schedule' && values.deadline
          ? values.deadline[0].format(dateTimeFormat)
          : config.scheduleStart,
      scheduleEnd:
        values.mode === 'schedule' && values.deadline
          ? values.deadline[1].format(dateTimeFormat)
          : config.scheduleEnd,
    });
    message.success('合規化設定已更新');
    setComplianceModalOpen(false);
    complianceForm.setFieldValue('googleCode', '');
  };

  const handleUploadChange: UploadProps['onChange'] = ({ fileList: nextFileList }) => {
    setFileList(nextFileList);
  };

  const handleImportConfirm = () => {
    setImportedGames(complianceGameTemplateRows);
    message.success('合規遊戲名單已匯入');
    setImportModalOpen(false);
  };

  const openFirstDepositModal = () => {
    firstDepositForm.setFieldsValue({ firstDeposit });
    setFirstDepositModalOpen(true);
  };

  const handleFirstDepositConfirm = async () => {
    const values = await firstDepositForm.validateFields();
    setFirstDeposit(values.firstDeposit);
    message.success('首存金額已更新');
    setFirstDepositModalOpen(false);
  };

  const complianceTabBody = (
    <div style={{ paddingTop: 8 }}>
      <Space wrap style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<SettingOutlined />}
          onClick={openComplianceModal}
          data-e2e-id="client-config-set-compliance-btn"
        >
          設置合規化
        </Button>
        <Button
          type="primary"
          icon={<ImportOutlined />}
          onClick={() => setImportModalOpen(true)}
          data-e2e-id="client-config-import-games-btn"
        >
          導入合規遊戲名單
        </Button>
        <Button
          type="primary"
          icon={<span style={{ fontWeight: 600 }}>₱</span>}
          onClick={openFirstDepositModal}
          data-e2e-id="client-config-first-deposit-btn"
        >
          設置首存金額
        </Button>
      </Space>

      <Descriptions
        size="small"
        bordered
        column={3}
        data-e2e-id="client-config-compliance-state"
        items={[
          {
            key: 'effective',
            label: '當前生效狀態',
            span: 3,
            children: (
              <Badge
                status={currentState.open ? 'success' : 'default'}
                text={currentState.label}
              />
            ),
          },
          {
            key: 'mode',
            label: '生效方式',
            children: config.mode === 'manual' ? '立即手動' : '排程時間',
          },
          {
            key: 'schedule',
            label: '排程時間',
            span: 2,
            children:
              config.mode === 'schedule'
                ? `${config.scheduleStart} ~ ${config.scheduleEnd}`
                : '—',
          },
          {
            key: 'firstDeposit',
            label: '新會員首存起步金額',
            children: `₱ ${firstDeposit}`,
          },
          {
            key: 'importedGames',
            label: '已匯入合規遊戲數',
            span: 2,
            children: importedGames.length,
          },
        ]}
      />
    </div>
  );

  const tabItems = clientConfigTabLabels.map((label, index) => {
    const isComplianceTab = label === '合規開關';
    return {
      key: isComplianceTab ? 'compliance' : `client-config-tab-${index}`,
      label,
      disabled: !isComplianceTab,
      children: isComplianceTab ? complianceTabBody : null,
    };
  });

  return (
    <div data-e2e-id="client-config-page">
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>客戶端配置</Title>
        <Text type="secondary">運營管理 / 客戶端配置</Text>
      </div>

      {mounted && (
      <>
      <Card size="small" data-e2e-id="client-config-card">
        <Tabs defaultActiveKey="compliance" items={tabItems} />
      </Card>

      <Modal
        title="合規化設置"
        open={complianceModalOpen}
        onCancel={() => setComplianceModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setComplianceModalOpen(false)}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleComplianceConfirm}
            data-e2e-id="client-config-compliance-confirm-btn"
          >
            確定
          </Button>,
        ]}
        forceRender
        data-e2e-id="client-config-compliance-modal"
      >
        <div
          style={{
            marginBottom: 16,
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(140,140,140,0.25)',
            borderRadius: 6,
          }}
          data-e2e-id="client-config-preview-state"
        >
          <Text type="secondary" style={{ marginRight: 8 }}>設定後生效狀態：</Text>
          <Badge
            status={previewState.open ? 'success' : 'default'}
            text={previewState.label}
          />
        </div>

        <Form form={complianceForm} layout="vertical" requiredMark>
          <Form.Item
            name="mode"
            label="生效方式"
            rules={[{ required: true, message: '請選擇生效方式' }]}
          >
            <Radio.Group
              options={complianceModeOptions}
              optionType="button"
              data-e2e-id="client-config-mode-radio"
            />
          </Form.Item>

          {watchedMode === 'manual' ? (
            <Form.Item
              name="manualEnabled"
              label="合規開關"
              valuePropName="checked"
              extra="立即生效，直到你手動切換為止"
            >
              <Switch
                checkedChildren="開"
                unCheckedChildren="關"
                data-e2e-id="client-config-manual-switch"
              />
            </Form.Item>
          ) : (
            <Form.Item
              name="deadline"
              label="排程時間"
              rules={[{ required: true, message: '請選擇排程時間' }]}
              extra="到區間起自動開啟；過期後自動恢復為『關閉』"
            >
              <RangePicker
                showTime
                format={dateTimeFormat}
                style={{ width: '100%' }}
                data-e2e-id="client-config-deadline-range-picker"
              />
            </Form.Item>
          )}

          <Form.Item
            name="googleCode"
            label="Google 驗證碼"
            rules={[{ required: true, message: '請輸入 Google 驗證碼' }]}
          >
            <Input
              placeholder="請輸入 Google 驗證碼"
              data-e2e-id="client-config-google-code-input"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="導入合規遊戲名單"
        open={importModalOpen}
        onCancel={() => setImportModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setImportModalOpen(false)}>
            取消
          </Button>,
          <Button key="reset" onClick={() => setFileList([])}>
            重置數據
          </Button>,
          <Button
            key="confirm"
            type="primary"
            disabled={fileList.length === 0}
            onClick={handleImportConfirm}
            data-e2e-id="client-config-import-confirm-btn"
          >
            確認導入
          </Button>,
        ]}
        data-e2e-id="client-config-import-modal"
      >
        <Button
          icon={<DownloadOutlined />}
          onClick={() => message.info('原型：下載 Excel 模板')}
          data-e2e-id="client-config-download-template-btn"
        >
          下載 Excel 模板
        </Button>

        <Divider>上傳文件</Divider>

        <Upload
          accept=".xlsx,.xls"
          beforeUpload={() => false}
          maxCount={1}
          fileList={fileList}
          onChange={handleUploadChange}
          data-e2e-id="client-config-games-upload"
        >
          <Button icon={<UploadOutlined />} data-e2e-id="client-config-select-file-btn">
            選擇文件
          </Button>
        </Upload>
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          支援 .xlsx, .xls 格式
        </Text>

        <div style={{ marginTop: 20, marginBottom: 8 }}>導入模板格式：</div>
        <Table<ComplianceGameRow>
          bordered
          size="small"
          pagination={false}
          columns={complianceGameColumns}
          dataSource={complianceGameTemplateRows}
        />
      </Modal>

      <Modal
        title="設置首存金額"
        open={firstDepositModalOpen}
        onCancel={() => setFirstDepositModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setFirstDepositModalOpen(false)}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleFirstDepositConfirm}
            data-e2e-id="client-config-first-deposit-confirm-btn"
          >
            確定
          </Button>,
        ]}
        forceRender
        data-e2e-id="client-config-first-deposit-modal"
      >
        <Form form={firstDepositForm} layout="vertical" requiredMark>
          <Form.Item
            name="firstDeposit"
            label="新會員首存起步金額"
            rules={[{ required: true, message: '請輸入新會員首存起步金額' }]}
          >
            <InputNumber
              min={0}
              step={100}
              prefix="₱"
              style={{ width: '100%' }}
              data-e2e-id="client-config-first-deposit-input"
            />
          </Form.Item>
        </Form>
      </Modal>
      </>
      )}
    </div>
  );
}

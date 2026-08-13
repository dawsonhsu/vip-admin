'use client';

import React, { useEffect, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import {
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
  complianceStatusOptions,
  defaultComplianceConfig,
  defaultFirstDepositAmount,
  type ComplianceConfig,
  type ComplianceGameRow,
  type ComplianceStatus,
} from '@/data/clientConfigData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss';

interface ComplianceFormValues {
  frontStatus: ComplianceStatus;
  backStatus: ComplianceStatus;
  deadline: [Dayjs, Dayjs];
  googleCode: string;
}

interface FirstDepositFormValues {
  firstDeposit: number;
}

const complianceGameColumns: ColumnsType<ComplianceGameRow> = [
  { title: '遊戲ID', dataIndex: 'gameId' },
  { title: '英文名', dataIndex: 'gameNameEn' },
  { title: '是否合規', dataIndex: 'isCompliant' },
];

const statusLabel = (status: ComplianceStatus) => (
  complianceStatusOptions.find((option) => option.value === status)?.label ?? status
);

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

  const openComplianceModal = () => {
    complianceForm.setFieldsValue({
      frontStatus: config.frontStatus,
      backStatus: config.backStatus,
      deadline: [dayjs(config.deadlineStart), dayjs(config.deadlineEnd)],
      googleCode: '',
    });
    setComplianceModalOpen(true);
  };

  const handleComplianceConfirm = async () => {
    const values = await complianceForm.validateFields();
    setConfig({
      frontStatus: values.frontStatus,
      backStatus: values.backStatus,
      deadlineStart: values.deadline[0].format(dateTimeFormat),
      deadlineEnd: values.deadline[1].format(dateTimeFormat),
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
          { key: 'frontStatus', label: '前端狀態', children: statusLabel(config.frontStatus) },
          { key: 'backStatus', label: '後端狀態', children: statusLabel(config.backStatus) },
          {
            key: 'deadline',
            label: '預期截止時間',
            children: `${config.deadlineStart} ~ ${config.deadlineEnd}`,
          },
          {
            key: 'firstDeposit',
            label: '新會員首存起步金額',
            children: `₱ ${firstDeposit}`,
          },
          {
            key: 'importedGames',
            label: '已匯入合規遊戲數',
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
        <Form form={complianceForm} layout="vertical" requiredMark>
          <Form.Item
            name="frontStatus"
            label="前端狀態"
            rules={[{ required: true, message: '請選擇前端狀態' }]}
          >
            <Radio.Group
              options={complianceStatusOptions}
              data-e2e-id="client-config-front-status-radio"
            />
          </Form.Item>
          <Form.Item
            name="backStatus"
            label="後端狀態"
            rules={[{ required: true, message: '請選擇後端狀態' }]}
          >
            <Radio.Group
              options={complianceStatusOptions}
              data-e2e-id="client-config-back-status-radio"
            />
          </Form.Item>
          <Form.Item
            name="deadline"
            label="預期截止時間"
            rules={[{ required: true, message: '請選擇預期截止時間' }]}
          >
            <RangePicker
              showTime
              format={dateTimeFormat}
              style={{ width: '100%' }}
              data-e2e-id="client-config-deadline-range-picker"
            />
          </Form.Item>
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

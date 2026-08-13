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
  Space,
  Switch,
  Table,
  Tabs,
  TimePicker,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd';
import {
  DownloadOutlined,
  ImportOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCompliance } from '@/components/ComplianceContext';
import {
  clientConfigTabLabels,
  complianceGameTemplateRows,
  complianceInputFromConfig,
  defaultFirstDepositAmount,
  resolveCompliance,
  type ComplianceGameRow,
} from '@/data/clientConfigData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const dateFormat = 'YYYY-MM-DD';
const timeFormat = 'HH:mm:ss';

interface ComplianceFormValues {
  manualEnabled: boolean;
  scheduleEnabled: boolean;
  dateRange?: [Dayjs, Dayjs];
  timeRange?: [Dayjs, Dayjs];
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

export default function ClientConfigPage() {
  const [complianceForm] = Form.useForm<ComplianceFormValues>();
  const [firstDepositForm] = Form.useForm<FirstDepositFormValues>();
  const { config, setConfig } = useCompliance();
  const [firstDeposit, setFirstDeposit] = useState(defaultFirstDepositAmount);
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
  const watchedManual = Form.useWatch('manualEnabled', complianceForm);
  const watchedScheduleEnabled = Form.useWatch('scheduleEnabled', complianceForm);
  const watchedDateRange = Form.useWatch('dateRange', complianceForm);
  const watchedTimeRange = Form.useWatch('timeRange', complianceForm);
  const previewState = resolveCompliance(
    {
      manualEnabled: watchedManual,
      scheduleEnabled: watchedScheduleEnabled,
      dateStart: watchedDateRange?.[0],
      dateEnd: watchedDateRange?.[1],
      timeStart: watchedTimeRange?.[0],
      timeEnd: watchedTimeRange?.[1],
    },
    dayjs(),
  );

  // What is actually live right now, from the saved config.
  const currentState = resolveCompliance(complianceInputFromConfig(config), dayjs());

  const openComplianceModal = () => {
    complianceForm.setFieldsValue({
      manualEnabled: config.manualEnabled,
      scheduleEnabled: config.scheduleEnabled,
      dateRange: [dayjs(config.scheduleDateStart, dateFormat), dayjs(config.scheduleDateEnd, dateFormat)],
      timeRange: [dayjs(config.scheduleTimeStart, timeFormat), dayjs(config.scheduleTimeEnd, timeFormat)],
      googleCode: '',
    });
    setComplianceModalOpen(true);
  };

  const handleComplianceConfirm = async () => {
    const values = await complianceForm.validateFields();
    setConfig({
      manualEnabled: !!values.manualEnabled,
      scheduleEnabled: !!values.scheduleEnabled,
      scheduleDateStart: values.dateRange ? values.dateRange[0].format(dateFormat) : config.scheduleDateStart,
      scheduleDateEnd: values.dateRange ? values.dateRange[1].format(dateFormat) : config.scheduleDateEnd,
      scheduleTimeStart: values.timeRange ? values.timeRange[0].format(timeFormat) : config.scheduleTimeStart,
      scheduleTimeEnd: values.timeRange ? values.timeRange[1].format(timeFormat) : config.scheduleTimeEnd,
    });
    message.success('合規化設定已更新');
    setComplianceModalOpen(false);
    complianceForm.setFieldValue('googleCode', '');
  };

  const handleUploadChange: UploadProps['onChange'] = ({ fileList: nextFileList }) => {
    setFileList(nextFileList);
  };

  const handleImportConfirm = () => {
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

  const scheduleSummary = config.scheduleEnabled
    ? `${config.scheduleDateStart} ~ ${config.scheduleDateEnd}　每日 ${config.scheduleTimeStart.slice(0, 5)}~${config.scheduleTimeEnd.slice(0, 5)}`
    : '未啟用';

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
            key: 'manual',
            label: '手動強制開啟',
            children: config.manualEnabled ? '開' : '關',
          },
          {
            key: 'schedule',
            label: '排程（每日時段）',
            span: 2,
            children: scheduleSummary,
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
          <Text type="secondary" style={{ marginRight: 8 }}>
            設定後生效狀態
            <Tooltip title="合規 = 手動強制開啟 或 排程時段內（任一為開即開）">
              <InfoCircleOutlined style={{ marginLeft: 4, cursor: 'help' }} />
            </Tooltip>
            ：
          </Text>
          <Badge
            status={previewState.open ? 'success' : 'default'}
            text={previewState.label}
          />
        </div>

        <Form form={complianceForm} layout="vertical" requiredMark>
          <Form.Item
            name="manualEnabled"
            label={(
              <span>
                手動強制開啟
                <Tooltip title="開啟＝立即強制合規；關閉＝不強制，交由排程判定">
                  <InfoCircleOutlined style={{ marginLeft: 4, cursor: 'help' }} />
                </Tooltip>
              </span>
            )}
            valuePropName="checked"
          >
            <Switch
              checkedChildren="開"
              unCheckedChildren="關"
              data-e2e-id="client-config-manual-switch"
            />
          </Form.Item>

          <Divider style={{ margin: '8px 0 16px' }}>排程（自動）</Divider>

          <Form.Item name="scheduleEnabled" label="啟用排程" valuePropName="checked">
            <Switch
              checkedChildren="開"
              unCheckedChildren="關"
              data-e2e-id="client-config-schedule-switch"
            />
          </Form.Item>
          <Form.Item
            name="dateRange"
            label="日期範圍"
            rules={[{ required: true, message: '請選擇日期範圍' }]}
          >
            <RangePicker
              format={dateFormat}
              style={{ width: '100%' }}
              disabled={watchedScheduleEnabled === false}
              data-e2e-id="client-config-date-range-picker"
            />
          </Form.Item>
          <Form.Item
            name="timeRange"
            label="每日時段"
            rules={[
              { required: true, message: '請選擇每日時段' },
              {
                validator: (_, value?: [Dayjs, Dayjs]) => {
                  if (!value || !value[0] || !value[1]) return Promise.resolve();
                  return value[1].isAfter(value[0])
                    ? Promise.resolve()
                    : Promise.reject(new Error('結束時間需晚於開始時間（同日窗口）'));
                },
              },
            ]}
            extra="僅在日期範圍內、每日此時段開啟，其餘（夜間、範圍外）自動關閉"
          >
            <TimePicker.RangePicker
              format={timeFormat}
              style={{ width: '100%' }}
              order={false}
              disabled={watchedScheduleEnabled === false}
              data-e2e-id="client-config-time-range-picker"
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

'use client';

import React, { useEffect, useState } from 'react';
import {
  Button,
  DatePicker,
  Form,
  Image,
  Input,
  Modal,
  Select,
  Space,
  Typography,
  Upload,
  message,
  theme,
} from 'antd';
import { UndoOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import {
  kycDocumentLabelMap,
  kycDocumentSlots,
  type KycDocuments,
  type KycEditFieldChange,
  type KycPhotoChange,
  type KycRecord,
} from '@/data/kycData';

const { Text } = Typography;
const { TextArea } = Input;

interface EditFormValues {
  firstName: string;
  middleName?: string;
  lastName: string;
  birthday: Dayjs;
  gender: KycRecord['gender'];
  phone: string;
  nationality: KycRecord['nationality'];
  birthplace: string;
  currentAddress: string;
  permanentAddress: string;
  nearestBranch: string;
  occupation: string;
  incomeSource: string;
  userMessage?: string;
}

interface KycEditModalProps {
  open: boolean;
  record: KycRecord | null;
  onCancel: () => void;
  onSave: (changes: KycEditFieldChange[], photoChanges: KycPhotoChange[]) => void;
}

const branchOptions = ['Makati Branch', 'Quezon City Branch', 'Cebu Branch', 'Davao Branch', 'Pasay Branch'];

const editableFields = [
  { field: 'firstName', label: 'First Name' },
  { field: 'middleName', label: 'Middle Name' },
  { field: 'lastName', label: 'Last Name' },
  { field: 'birthday', label: '生日' },
  { field: 'gender', label: '性別' },
  { field: 'nationality', label: '國籍' },
  { field: 'birthplace', label: '出生地' },
  { field: 'currentAddress', label: '現住址' },
  { field: 'permanentAddress', label: '常住地址' },
  { field: 'nearestBranch', label: '鄰近分行' },
  { field: 'occupation', label: '職業' },
  { field: 'incomeSource', label: '收入來源' },
] as const;

const emptyDocuments: KycDocuments = { front: '', back: '', selfie: '' };

export default function KycEditModal({
  open,
  record,
  onCancel,
  onSave,
}: KycEditModalProps) {
  const [form] = Form.useForm<EditFormValues>();
  const { token } = theme.useToken();
  const [documents, setDocuments] = useState<KycDocuments>(emptyDocuments);

  useEffect(() => {
    if (!open || !record) return;
    form.resetFields();
    form.setFieldsValue({
      firstName: record.firstName,
      middleName: record.middleName || undefined,
      lastName: record.lastName,
      birthday: dayjs(record.birthday),
      gender: record.gender,
      phone: record.phone,
      nationality: record.nationality,
      birthplace: record.birthplace,
      currentAddress: record.currentAddress,
      permanentAddress: record.permanentAddress,
      nearestBranch: record.nearestBranch,
      occupation: record.occupation,
      incomeSource: record.incomeSource,
      userMessage: record.userMessage,
    });
    setDocuments({ ...record.documents });
  }, [form, open, record]);

  const handleSave = async () => {
    if (!record) return;
    if (record.pendingEdit) {
      message.warning('此筆已有待複核的編輯，請先完成複核');
      return;
    }

    const values = await form.validateFields();
    const nextValues = {
      firstName: values.firstName,
      middleName: values.middleName || '',
      lastName: values.lastName,
      birthday: values.birthday.format('YYYY-MM-DD'),
      gender: values.gender,
      nationality: values.nationality,
      birthplace: values.birthplace,
      currentAddress: values.currentAddress,
      permanentAddress: values.permanentAddress,
      nearestBranch: values.nearestBranch,
      occupation: values.occupation,
      incomeSource: values.incomeSource,
    };
    const changes: KycEditFieldChange[] = editableFields.flatMap(({ field, label }) => {
      const oldValue = String(record[field] ?? '');
      const newValue = String(nextValues[field] ?? '');
      return oldValue === newValue ? [] : [{ field, label, oldValue, newValue }];
    });
    const photoChanges: KycPhotoChange[] = kycDocumentSlots.flatMap((slot) => (
      documents[slot] === record.documents[slot]
        ? []
        : [{
            slot,
            label: kycDocumentLabelMap[slot],
            oldImage: record.documents[slot],
            newImage: documents[slot],
          }]
    ));

    if (!changes.length && !photoChanges.length) {
      message.info('未變更任何欄位或證件照');
      return;
    }

    onSave(changes, photoChanges);
    message.success('已提交編輯複核，待他人核准');
  };

  const handleUpload = (slot: keyof KycDocuments) => (file: File) => {
    if (!file.type.startsWith('image/')) {
      message.error('僅支援圖片格式');
      return Upload.LIST_IGNORE;
    }
    if (file.size / 1024 > 500) {
      message.error('圖片需小於 500KB');
      return Upload.LIST_IGNORE;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDocuments((current) => ({ ...current, [slot]: reader.result as string }));
      message.success(`${kycDocumentLabelMap[slot]} 已更換，送出後進入複核`);
    };
    reader.readAsDataURL(file);
    return false;
  };

  return (
    <Modal
      data-e2e-id="kyc-edit-modal"
      title="編輯kyc"
      open={open}
      onCancel={onCancel}
      width={900}
      destroyOnClose
      footer={(
        <Space>
          <Button data-e2e-id="kyc-edit-cancel-btn" onClick={onCancel}>取消</Button>
          <Button data-e2e-id="kyc-edit-confirm-btn" type="primary" onClick={handleSave}>確定</Button>
        </Space>
      )}
    >
      <Form form={form} layout="vertical" requiredMark>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 20 }}>
          <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: '請輸入 First Name' }]}>
            <Input data-e2e-id="kyc-edit-first-name-input" placeholder="請輸入 First Name" />
          </Form.Item>
          <Form.Item name="middleName" label="Middle Name">
            <Input data-e2e-id="kyc-edit-middle-name-input" placeholder="請輸入 Middle Name" />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: '請輸入 Last Name' }]}>
            <Input data-e2e-id="kyc-edit-last-name-input" placeholder="請輸入 Last Name" />
          </Form.Item>
          <Form.Item name="birthday" label="生日" rules={[{ required: true, message: '請選擇生日' }]}>
            <DatePicker data-e2e-id="kyc-edit-birthday-picker" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="gender" label="性別" rules={[{ required: true, message: '請選擇性別' }]}>
            <Select
              data-e2e-id="kyc-edit-gender-select"
              options={[{ value: '男', label: '男' }, { value: '女', label: '女' }]}
            />
          </Form.Item>
          <Form.Item name="phone" label="手機號" rules={[{ required: true }]}>
            <Input data-e2e-id="kyc-edit-phone-input" addonBefore="+63" disabled />
          </Form.Item>
          <Form.Item name="nationality" label="國籍" rules={[{ required: true, message: '請選擇國籍' }]}>
            <Select
              data-e2e-id="kyc-edit-nationality-select"
              options={[{ value: 'Philippines', label: 'Philippines' }, { value: 'Others', label: 'Others' }]}
            />
          </Form.Item>
          <Form.Item name="birthplace" label="出生地" rules={[{ required: true, message: '請輸入出生地' }]}>
            <Input data-e2e-id="kyc-edit-birthplace-input" placeholder="請輸入出生地" />
          </Form.Item>
          <Form.Item name="currentAddress" label="現住址" rules={[{ required: true, message: '請輸入現住址' }]}>
            <Input data-e2e-id="kyc-edit-current-address-input" placeholder="請輸入現住址" />
          </Form.Item>
          <Form.Item name="permanentAddress" label="常住地址" rules={[{ required: true, message: '請輸入常住地址' }]}>
            <Input data-e2e-id="kyc-edit-permanent-address-input" placeholder="請輸入常住地址" />
          </Form.Item>
          <Form.Item name="nearestBranch" label="鄰近分行" rules={[{ required: true, message: '請選擇鄰近分行' }]}>
            <Select
              data-e2e-id="kyc-edit-nearest-branch-select"
              options={branchOptions.map((value) => ({ value, label: value }))}
            />
          </Form.Item>
          <Form.Item name="occupation" label="工作性質" rules={[{ required: true, message: '請選擇工作性質' }]}>
            <Select
              data-e2e-id="kyc-edit-occupation-select"
              options={['受僱', '自僱', '學生', '退休', '其他'].map((value) => ({ value, label: value }))}
            />
          </Form.Item>
          <Form.Item name="incomeSource" label="收入來源" rules={[{ required: true, message: '請選擇收入來源' }]}>
            <Select
              data-e2e-id="kyc-edit-income-source-select"
              options={['薪資', '生意', '投資', '其他'].map((value) => ({ value, label: value }))}
            />
          </Form.Item>
        </div>

        <Form.Item
          label="證件圖片"
          extra="支援 JPG／PNG，單張 ≤500KB；更換後需經複核才會生效"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            {kycDocumentSlots.map((slot) => {
              const label = kycDocumentLabelMap[slot];
              const changed = Boolean(record) && documents[slot] !== record?.documents[slot];
              return (
                <div key={slot}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text type="secondary">{label}</Text>
                    {changed && (
                      <Text style={{ color: token.colorWarning, fontSize: 12 }}>已更換</Text>
                    )}
                  </div>
                  <div
                    style={{
                      border: `1px ${changed ? 'solid' : 'dashed'} ${changed ? token.colorWarning : token.colorBorder}`,
                      borderRadius: token.borderRadius,
                      padding: 6,
                      background: token.colorFillQuaternary,
                    }}
                  >
                    <Image
                      src={documents[slot]}
                      alt={label}
                      width="100%"
                      height={112}
                      style={{ objectFit: 'cover', borderRadius: token.borderRadiusSM }}
                      data-e2e-id={`kyc-edit-document-preview-${slot}`}
                    />
                  </div>
                  <Space size={4} style={{ marginTop: 8 }}>
                    <Upload
                      accept="image/*"
                      showUploadList={false}
                      maxCount={1}
                      beforeUpload={handleUpload(slot)}
                    >
                      <Button
                        size="small"
                        icon={<UploadOutlined />}
                        data-e2e-id={`kyc-edit-document-upload-btn-${slot}`}
                      >
                        更換相片
                      </Button>
                    </Upload>
                    {changed && (
                      <Button
                        size="small"
                        type="text"
                        icon={<UndoOutlined />}
                        data-e2e-id={`kyc-edit-document-reset-btn-${slot}`}
                        onClick={() => setDocuments((current) => ({
                          ...current,
                          [slot]: record?.documents[slot] ?? '',
                        }))}
                      >
                        還原
                      </Button>
                    )}
                  </Space>
                </div>
              );
            })}
          </div>
        </Form.Item>

        <Form.Item name="userMessage" label="用戶留言">
          <TextArea
            data-e2e-id="kyc-edit-user-message-textarea"
            disabled
            rows={3}
            placeholder="用戶提交審核時的留言"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

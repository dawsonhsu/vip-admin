'use client';

import React, { useMemo } from 'react';
import {
  Card,
  Cascader,
  Col,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Upload,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { gameOptions, providerOptions } from '@/data/newMemberTriDepositData';

const LEVEL_OPTIONS = [
  { value: 'OPEN', label: 'OPEN' },
  { value: 'PROVIDER', label: 'PROVIDER' },
  { value: 'GAME', label: 'GAME' },
];

const uploadButton = (e2eId: string, label = '上传') => (
  <button
    data-e2e-id={e2eId}
    type="button"
    style={{ border: 0, background: 'none', cursor: 'pointer' }}
  >
    <PlusOutlined />
    <div style={{ marginTop: 8 }}>{label}</div>
  </button>
);

const normalizeUploadFileList = (event: any) =>
  Array.isArray(event) ? event : event?.fileList;

const freeSpinItemProps = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
  colon: false,
  style: { marginBottom: 0 },
};

interface FreeSpinStepProps {
  form: FormInstance;
  e2ePrefix: string;
}

/**
 * Step 3 — 免费旋转配置 Card + 谷歌验证码 (shared across all activity config wizards).
 * Must be rendered inside the same <Form> as the rest of the wizard.
 */
export function FreeSpinStep({ form, e2ePrefix }: FreeSpinStepProps) {
  const freeSpinValues = (Form.useWatch('freeSpin', form) ?? {}) as Record<string, any>;
  const selectedProvider = freeSpinValues.provider as string | undefined;

  const filteredGameOptions = useMemo(
    () => (selectedProvider ? gameOptions.filter((g) => g.provider === selectedProvider) : []),
    [selectedProvider],
  );

  const gameLimitOptions = useMemo(() => {
    const typeMap = new Map<string, Map<string, { value: string; label: string }[]>>();
    gameOptions.forEach((game) => {
      const providerMap = typeMap.get(game.gameType) ?? new Map<string, { value: string; label: string }[]>();
      const games = providerMap.get(game.provider) ?? [];
      games.push({ value: game.value, label: game.label });
      providerMap.set(game.provider, games);
      typeMap.set(game.gameType, providerMap);
    });
    return Array.from(typeMap.entries()).map(([gameType, providerMap]) => ({
      value: gameType,
      label: gameType,
      children: Array.from(providerMap.entries()).map(([provider, games]) => ({
        value: provider,
        label: provider,
        children: games,
      })),
    }));
  }, []);

  return (
    <>
      <Card
        size="small"
        title="免费旋转配置"
        style={{ marginTop: 16, marginBottom: 8 }}
        data-e2e-id={`${e2ePrefix}-freespin-card`}
      >
        <Row gutter={[16, 12]}>
          <Col span={24}>
            <Form.Item
              {...freeSpinItemProps}
              label="派发层级"
              name={['freeSpin', 'dispatchLevel']}
            >
              <Radio.Group data-e2e-id={`${e2ePrefix}-freespin-level-radio`}>
                {LEVEL_OPTIONS.map((option) => (
                  <Radio key={option.value} value={option.value}>
                    {option.label}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              {...freeSpinItemProps}
              label="厂商"
              name={['freeSpin', 'provider']}
            >
              <Select
                data-e2e-id={`${e2ePrefix}-freespin-provider-select`}
                allowClear
                placeholder="请选择厂商"
                options={providerOptions}
                onChange={() => form.setFieldValue(['freeSpin', 'gameId'], undefined)}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              {...freeSpinItemProps}
              label="赠送游戏"
              name={['freeSpin', 'gameId']}
            >
              <Select
                data-e2e-id={`${e2ePrefix}-freespin-game-select`}
                allowClear
                disabled={!selectedProvider}
                placeholder={selectedProvider ? '请选择游戏' : '请先选择厂商'}
                options={filteredGameOptions}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              {...freeSpinItemProps}
              label="单次投注额"
              name={['freeSpin', 'betAmount']}
            >
              <InputNumber
                data-e2e-id={`${e2ePrefix}-freespin-bet-amount-input`}
                min={0}
                step={0.01}
                precision={2}
                placeholder="例：0.20"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              {...freeSpinItemProps}
              label="流水倍数"
              name={['freeSpin', 'rollover']}
              extra="无流水要求请留空或填 0"
            >
              <InputNumber
                data-e2e-id={`${e2ePrefix}-freespin-rollover-input`}
                min={0}
                step={0.5}
                addonAfter="倍"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              {...freeSpinItemProps}
              label="有效期（天）"
              name={['freeSpin', 'validityDays']}
            >
              <InputNumber
                data-e2e-id={`${e2ePrefix}-freespin-validity-days-input`}
                min={1}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              {...freeSpinItemProps}
              label="场馆限制"
              name={['freeSpin', 'gameLimit']}
            >
              <Cascader
                data-e2e-id={`${e2ePrefix}-freespin-game-limit-cascader`}
                options={gameLimitOptions}
                placeholder="游戏类型 / 厂商 / 游戏"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              {...freeSpinItemProps}
              label="最低提款"
              name={['freeSpin', 'minWithdraw']}
            >
              <InputNumber
                data-e2e-id={`${e2ePrefix}-freespin-min-withdraw-input`}
                min={0}
                prefix="₱"
                placeholder="不限"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              {...freeSpinItemProps}
              label="最高提款"
              name={['freeSpin', 'maxWithdraw']}
            >
              <InputNumber
                data-e2e-id={`${e2ePrefix}-freespin-max-withdraw-input`}
                min={0}
                prefix="₱"
                placeholder="不限"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              {...freeSpinItemProps}
              label="礼金审核方式"
              name={['freeSpin', 'reviewMode']}
            >
              <Radio.Group data-e2e-id={`${e2ePrefix}-freespin-review-mode-radio`}>
                <Radio value="auto">自动</Radio>
                <Radio value="manual">人工</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              {...freeSpinItemProps}
              label="礼金是否自动到帐"
              name={['freeSpin', 'creditMode']}
            >
              <Radio.Group data-e2e-id={`${e2ePrefix}-freespin-credit-mode-radio`}>
                <Radio value="manual">手动领取</Radio>
                <Radio value="auto">自动到帐</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              {...freeSpinItemProps}
              label="封面图"
              name={['freeSpin', 'cover']}
              valuePropName="fileList"
              getValueFromEvent={normalizeUploadFileList}
              extra="建议尺寸 4:5（例：400×500），档案 ≤ 500KB；未上传将使用预设 SVG"
            >
              <Upload
                data-e2e-id={`${e2ePrefix}-freespin-cover-upload`}
                listType="picture-card"
                maxCount={1}
                beforeUpload={() => false}
              >
                {uploadButton(`${e2ePrefix}-freespin-cover-upload-btn`)}
              </Upload>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Form.Item
        label="谷歌验证码"
        name="googleCode"
        rules={[{ required: true, message: '请输入谷歌验证码' }]}
        style={{ marginTop: 16 }}
      >
        <Input.Password
          data-e2e-id={`${e2ePrefix}-form-google-code-input`}
          maxLength={6}
          placeholder="请输入谷歌验证码"
        />
      </Form.Item>
    </>
  );
}

export const defaultFreeSpinValues = {
  dispatchLevel: 'GAME',
  validityDays: 7,
  reviewMode: 'auto',
  creditMode: 'auto',
};

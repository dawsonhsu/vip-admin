'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
  message,
  theme,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { FormInstance } from 'antd';
import ActivityConfigWizardShell, {
  type WizardStepDef,
} from './activityConfigShared/ActivityConfigWizardShell';
import {
  BaseConfigStep,
  BASE_CONFIG_STEP_FIELDS,
  baseConfigInitialValues,
} from './activityConfigShared/BaseConfigStep';
import { FreeSpinStep, defaultFreeSpinValues } from './activityConfigShared/FreeSpinStep';
import { GameRestrictionCascader } from './GameRestrictionCascader';
import {
  defaultPrizePool,
  grantIdentifierTypeOptions,
  mockGrantResult,
  prizeTypeLabels,
  type GrantRejectedEntry,
  type GrantResult,
  type PrizeConfig,
  type PrizeType,
  type PrizeValueMode,
} from '@/data/reactivationMysteryBoxData';

const { Text } = Typography;

const E2E = 'reactivation-mystery-box-config-modal';
const ACTIVITY_ID = 31;
const ACTIVITY_NAME = '召回盲盒';
const HIDDEN_BASE_FIELDS = ['wagerVenueRestriction'];
const PRIZE_TABS: PrizeType[] = ['bonus', 'depositCoupon', 'rebateCoupon', 'freeSpins', 'filCoins'];

const compactItemProps = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
  colon: false,
  style: { marginBottom: 0 },
};

interface Props {
  open: boolean;
  onClose: () => void;
}

const clonePaths = (paths?: string[][]) => paths?.map((path) => [...path]);

const clonePrizePool = (): PrizeConfig[] =>
  defaultPrizePool.map((prize) => ({
    ...prize,
    venueRestriction: clonePaths(prize.venueRestriction),
    gameRestriction: clonePaths(prize.gameRestriction),
  }));

const normalizeUploadFileList = (event: any) =>
  Array.isArray(event) ? event : event?.fileList;

const parseIdentifiers = (raw?: string) =>
  String(raw ?? '')
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const getEnabledWeightTotal = (prizePool?: Partial<PrizeConfig>[]) =>
  (prizePool ?? []).reduce(
    (sum, prize) => (prize.enabled ? sum + Number(prize.weight ?? 0) : sum),
    0
  );

const isWeightTotalValid = (value: number) => Math.abs(value - 100) < 0.001;

function ValueAmountFields({
  form,
  index,
  type,
  enabled,
}: {
  form: FormInstance;
  index: number;
  type: PrizeType;
  enabled: boolean;
}) {
  const prizeValues = (Form.useWatch(['prizePool', index], form) ?? defaultPrizePool[index]) as PrizeConfig;
  const valueMode = prizeValues.valueMode ?? 'fixed';
  const suffixMap: Record<PrizeType, string> = {
    bonus: 'P',
    depositCoupon: '% / P',
    rebateCoupon: '% / P',
    freeSpins: '次',
    filCoins: 'C',
  };

  if (valueMode === 'range') {
    return (
      <>
        <Col span={8}>
          <Form.Item
            {...compactItemProps}
            label="最小值"
            name={['prizePool', index, 'valueMin']}
            rules={[{ required: enabled, message: '请输入最小值' }]}
          >
            <InputNumber
              data-e2e-id={`${E2E}-prize-${type}-value-min-input`}
              min={0}
              addonAfter={suffixMap[type]}
              disabled={!enabled}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            {...compactItemProps}
            label="最大值"
            name={['prizePool', index, 'valueMax']}
            rules={[{ required: enabled, message: '请输入最大值' }]}
          >
            <InputNumber
              data-e2e-id={`${E2E}-prize-${type}-value-max-input`}
              min={0}
              addonAfter={suffixMap[type]}
              disabled={!enabled}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
      </>
    );
  }

  return (
    <Col span={8}>
      <Form.Item
        {...compactItemProps}
        label="固定值"
        name={['prizePool', index, 'valueFixed']}
        rules={[{ required: enabled, message: '请输入固定值' }]}
      >
        <InputNumber
          data-e2e-id={`${E2E}-prize-${type}-value-fixed-input`}
          min={0}
          addonAfter={suffixMap[type]}
          disabled={!enabled}
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Col>
  );
}

function FreeSpinQuantityFields({
  form,
  index,
  enabled,
}: {
  form: FormInstance;
  index: number;
  enabled: boolean;
}) {
  const prizeValues = (Form.useWatch(['prizePool', index], form) ?? defaultPrizePool[index]) as PrizeConfig;
  const quantityMode = prizeValues.fsQuantityMode ?? 'fixed';

  return (
    <Card size="small" title="FS 数量" style={{ marginTop: 16 }}>
      <Row gutter={[16, 12]}>
        <Col span={8}>
          <Form.Item
            {...compactItemProps}
            label="出值模式"
            name={['prizePool', index, 'fsQuantityMode']}
            rules={[{ required: enabled, message: '请选择 FS 数量出值模式' }]}
          >
            <Radio.Group
              data-e2e-id={`${E2E}-prize-freeSpins-fs-quantity-mode-radio`}
              disabled={!enabled}
            >
              <Radio value="fixed">固定值</Radio>
              <Radio value="range">区间随机</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
        {quantityMode === 'range' ? (
          <>
            <Col span={8}>
              <Form.Item
                {...compactItemProps}
                label="最小次数"
                name={['prizePool', index, 'fsQuantityMin']}
                rules={[{ required: enabled, message: '请输入最小次数' }]}
              >
                <InputNumber
                  data-e2e-id={`${E2E}-prize-freeSpins-fs-quantity-min-input`}
                  min={1}
                  precision={0}
                  addonAfter="次"
                  disabled={!enabled}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                {...compactItemProps}
                label="最大次数"
                name={['prizePool', index, 'fsQuantityMax']}
                rules={[{ required: enabled, message: '请输入最大次数' }]}
              >
                <InputNumber
                  data-e2e-id={`${E2E}-prize-freeSpins-fs-quantity-max-input`}
                  min={1}
                  precision={0}
                  addonAfter="次"
                  disabled={!enabled}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </>
        ) : (
          <Col span={8}>
            <Form.Item
              {...compactItemProps}
              label="固定次数"
              name={['prizePool', index, 'fsQuantityFixed']}
              rules={[{ required: enabled, message: '请输入固定次数' }]}
            >
              <InputNumber
                data-e2e-id={`${E2E}-prize-freeSpins-fs-quantity-fixed-input`}
                min={1}
                precision={0}
                addonAfter="次"
                disabled={!enabled}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        )}
      </Row>
    </Card>
  );
}

function PrizePanel({
  form,
  index,
  type,
}: {
  form: FormInstance;
  index: number;
  type: PrizeType;
}) {
  const { token } = theme.useToken();
  const prizeValues = (Form.useWatch(['prizePool', index], form) ?? defaultPrizePool[index]) as PrizeConfig;
  const enabled = prizeValues.enabled ?? defaultPrizePool[index].enabled;

  const renderExtraFields = () => {
    switch (type) {
      case 'bonus':
        return (
          <Row gutter={[16, 12]}>
            <Col span={24}>
              <Form.Item
                {...compactItemProps}
                label="适用场馆"
                name={['prizePool', index, 'venueRestriction']}
              >
                <GameRestrictionCascader
                  placeholder="选择游戏类型 → 厂商"
                  data-e2e-id={`${E2E}-prize-bonus-venue-cascader`}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                {...compactItemProps}
                label="流水倍数"
                name={['prizePool', index, 'rolloverMultiplier']}
              >
                <InputNumber
                  data-e2e-id={`${E2E}-prize-bonus-rollover-input`}
                  min={0}
                  addonAfter="倍"
                  disabled={!enabled}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                {...compactItemProps}
                label="最高提款"
                name={['prizePool', index, 'maxWithdraw']}
              >
                <InputNumber
                  data-e2e-id={`${E2E}-prize-bonus-max-withdraw-input`}
                  min={0}
                  prefix="₱"
                  disabled={!enabled}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        );
      case 'depositCoupon':
        return (
          <Row gutter={[16, 12]}>
            <Col span={8}>
              <Form.Item
                {...compactItemProps}
                label="加成型态"
                name={['prizePool', index, 'bonusMode']}
              >
                <Radio.Group data-e2e-id={`${E2E}-prize-depositCoupon-bonus-mode-radio`} disabled={!enabled}>
                  <Radio value="ratio">比例 %</Radio>
                  <Radio value="fixed">固定额</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                {...compactItemProps}
                label="最低存款额"
                name={['prizePool', index, 'minDeposit']}
              >
                <InputNumber
                  data-e2e-id={`${E2E}-prize-depositCoupon-min-deposit-input`}
                  min={0}
                  prefix="₱"
                  disabled={!enabled}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                {...compactItemProps}
                label="流水限制"
                name={['prizePool', index, 'rolloverLimit']}
              >
                <InputNumber
                  data-e2e-id={`${E2E}-prize-depositCoupon-rollover-limit-input`}
                  min={0}
                  addonAfter="倍"
                  disabled={!enabled}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                {...compactItemProps}
                label="领取门槛"
                name={['prizePool', index, 'historyDepositThreshold']}
              >
                <InputNumber
                  data-e2e-id={`${E2E}-prize-depositCoupon-history-deposit-threshold-input`}
                  min={0}
                  precision={0}
                  addonBefore="历史存款≥"
                  addonAfter="次"
                  disabled={!enabled}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        );
      case 'rebateCoupon':
        return (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Alert
              type="info"
              showIcon
              message="计算窗口:领取后 24 小时净输赢(总投注−总派彩−红利),固定不可调整"
            />
            <Row gutter={[16, 12]}>
              <Col span={8}>
                <Form.Item
                  {...compactItemProps}
                  label="返还型态"
                  name={['prizePool', index, 'rebateMode']}
                >
                  <Radio.Group data-e2e-id={`${E2E}-prize-rebateCoupon-rebate-mode-radio`} disabled={!enabled}>
                    <Radio value="ratio">比例 %</Radio>
                    <Radio value="fixed">固定额</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  {...compactItemProps}
                  label="彩金上限"
                  name={['prizePool', index, 'bonusCap']}
                >
                  <InputNumber
                    data-e2e-id={`${E2E}-prize-rebateCoupon-bonus-cap-input`}
                    min={0}
                    prefix="₱"
                    disabled={!enabled}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  {...compactItemProps}
                  label="提款上限"
                  name={['prizePool', index, 'withdrawCap']}
                >
                  <InputNumber
                    data-e2e-id={`${E2E}-prize-rebateCoupon-withdraw-cap-input`}
                    min={0}
                    prefix="₱"
                    disabled={!enabled}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  {...compactItemProps}
                  label="流水限制"
                  name={['prizePool', index, 'rolloverLimit']}
                >
                  <InputNumber
                    data-e2e-id={`${E2E}-prize-rebateCoupon-rollover-limit-input`}
                    min={0}
                    addonAfter="倍"
                    disabled={!enabled}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  {...compactItemProps}
                  label="游戏限制"
                  name={['prizePool', index, 'gameRestriction']}
                >
                  <GameRestrictionCascader
                    placeholder="选择游戏类型 → 厂商"
                    data-e2e-id={`${E2E}-prize-rebateCoupon-game-restriction-cascader`}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Space>
        );
      case 'freeSpins':
        return (
          <>
            <FreeSpinQuantityFields form={form} index={index} enabled={enabled} />
            <FreeSpinStep
              form={form}
              e2ePrefix={`${E2E}-freeSpins`}
              showGoogleCode={false}
            />
          </>
        );
      case 'filCoins':
        return (
          <Alert
            type="info"
            showIcon
            message="用途"
            description={prizeValues.purposeNote ?? defaultPrizePool[index].purposeNote}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      data-e2e-id={`${E2E}-tab-panel-${type}`}
      style={{
        background: token.colorFillAlter,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadiusLG,
        padding: 16,
      }}
    >
      <Form.Item hidden name={['prizePool', index, 'type']}>
        <Input />
      </Form.Item>
      <Form.Item hidden name={['prizePool', index, 'label']}>
        <Input />
      </Form.Item>

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={[16, 12]} align="top">
          <Col span={6}>
            <Form.Item
              {...compactItemProps}
              label="启用"
              name={['prizePool', index, 'enabled']}
              valuePropName="checked"
            >
              <Switch
                data-e2e-id={`${E2E}-prize-${type}-enabled-switch`}
                checkedChildren="启用"
                unCheckedChildren="停用"
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              {...compactItemProps}
              label="权重(%)"
              name={['prizePool', index, 'weight']}
              rules={[{ required: enabled, message: '请输入权重' }]}
            >
              <InputNumber
                data-e2e-id={`${E2E}-prize-${type}-weight-input`}
                min={0}
                max={100}
                precision={2}
                addonAfter="%"
                disabled={!enabled}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              {...compactItemProps}
              label="出值模式"
              name={['prizePool', index, 'valueMode']}
              rules={[{ required: enabled, message: '请选择出值模式' }]}
            >
              <Radio.Group
                data-e2e-id={`${E2E}-prize-${type}-value-mode-radio`}
                disabled={!enabled}
              >
                <Radio value="fixed">固定值</Radio>
                <Radio value="range">区间随机</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <ValueAmountFields form={form} index={index} type={type} enabled={enabled} />
        </Row>

        {renderExtraFields()}
      </Space>
    </div>
  );
}

function PrizePoolStep({ form }: { form: FormInstance }) {
  const [activeTab, setActiveTab] = useState<PrizeType>('bonus');
  const prizePool = (Form.useWatch('prizePool', form) ?? defaultPrizePool) as PrizeConfig[];
  const totalWeight = useMemo(() => getEnabledWeightTotal(prizePool), [prizePool]);
  const enabledCount = prizePool.filter((prize) => prize.enabled).length;
  const totalValid = isWeightTotalValid(totalWeight);

  return (
    <Card
      title="奖品池与机率"
      size="small"
      style={{ marginTop: 0, marginBottom: 8 }}
      data-e2e-id={`${E2E}-prize-pool-card`}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card size="small" data-e2e-id={`${E2E}-total-weight-card`}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Space>
              <Text strong>TOTAL WEIGHT</Text>
              <Tag color={totalValid ? 'success' : 'error'}>{totalWeight.toFixed(2)}%</Tag>
              <Text type="secondary">已启用 {enabledCount} 个奖品</Text>
            </Space>
            <Text type={totalValid ? 'secondary' : 'danger'}>
              启用奖品的权重总和必须等于 100%，否则不可进入下一步或保存。
            </Text>
            <Alert
              type="info"
              showIcon
              message="若会员不符合某奖品门槛(例:存款未满3次抽不到存款券),系统自动剔除该奖品并将其余权重归一化到100%。每抽必中,无空奖。"
            />
            <Text type="secondary">会员开盒后奖励即时入账，无需另行领取。</Text>
          </Space>
        </Card>

        <Form.Item
          hidden
          name="prizeWeightTotal"
          dependencies={['prizePool']}
          rules={[
            {
              validator: () => {
                const currentPool = form.getFieldValue('prizePool') as PrizeConfig[];
                const currentTotal = getEnabledWeightTotal(currentPool);
                return isWeightTotalValid(currentTotal)
                  ? Promise.resolve()
                  : Promise.reject(new Error('启用奖品权重总和必须等于 100%'));
              },
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Tabs
          data-e2e-id={`${E2E}-prize-tabs`}
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as PrizeType)}
          items={PRIZE_TABS.map((type, index) => ({
            key: type,
            label: (
              <span data-e2e-id={`${E2E}-tab-${type}`}>
                {prizeTypeLabels[type]}
              </span>
            ),
            children: <PrizePanel form={form} index={index} type={type} />,
          }))}
        />
      </Space>
    </Card>
  );
}

function GrantListStep({ form }: { form: FormInstance }) {
  const [grantResult, setGrantResult] = useState<GrantResult | null>(null);

  const rejectedColumns: ColumnsType<GrantRejectedEntry> = [
    { title: '名单值', dataIndex: 'identifier', width: 180 },
    { title: '拒绝原因', dataIndex: 'reason', render: (value) => <Tag color="warning">{value}</Tag> },
  ];

  const handleGrant = async () => {
    const values = form.getFieldsValue();
    const identifiers = parseIdentifiers(values.grantIdentifiers);
    const fileList = values.grantCsv ?? [];

    if (identifiers.length === 0 && fileList.length === 0) {
      message.warning('请先输入名单或上传 CSV');
      return;
    }

    const baseCount = identifiers.length || mockGrantResult.successCount + mockGrantResult.rejectedCount;
    const rejectedCount = Math.min(2, Math.max(1, Math.floor(baseCount / 5)));
    const rejectedEntries = Array.from({ length: rejectedCount }, (_, index) => ({
      key: `reject-${index + 1}`,
      identifier:
        identifiers[index] ??
        mockGrantResult.rejectedEntries[index % mockGrantResult.rejectedEntries.length].identifier,
      reason: '仍有未开盲盒',
    }));

    setGrantResult({
      successCount: Math.max(baseCount - rejectedCount, 0),
      rejectedCount,
      rejectedEntries,
    });
    message.success('派发完成');
  };

  return (
    <Card
      size="small"
      title="名单派发"
      data-e2e-id={`${E2E}-grant-card`}
      style={{ marginTop: 0, marginBottom: 8 }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="每人本期发 1 个盲盒;同一时间最多持有 1 个未开盲盒。"
        />

        <Form.Item
          label="识别类型"
          name="identifierType"
          rules={[{ required: true, message: '请选择识别类型' }]}
        >
          <Radio.Group data-e2e-id={`${E2E}-grant-identifier-type-radio`}>
            {grantIdentifierTypeOptions.map((option) => (
              <Radio key={option.value} value={option.value}>
                {option.label}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label="名单输入"
          name="grantIdentifiers"
          extra="支持逗号或换行分隔；本期仅支持人工名单投放。"
        >
          <Input.TextArea
            data-e2e-id={`${E2E}-grant-identifiers-textarea`}
            rows={6}
            placeholder={`例: 09171234567, U900301\n09181234568`}
          />
        </Form.Item>

        <Form.Item
          label="CSV 上传"
          name="grantCsv"
          valuePropName="fileList"
          getValueFromEvent={normalizeUploadFileList}
        >
          <Upload
            data-e2e-id={`${E2E}-grant-csv-upload`}
            accept=".csv"
            maxCount={1}
            beforeUpload={() => false}
          >
            <Button
              data-e2e-id={`${E2E}-grant-csv-upload-btn`}
              icon={<UploadOutlined />}
            >
              上传 CSV
            </Button>
          </Upload>
        </Form.Item>

        <div style={{ textAlign: 'center' }}>
          <Button
            data-e2e-id={`${E2E}-grant-submit-btn`}
            type="primary"
            onClick={handleGrant}
          >
            派发
          </Button>
        </div>

        {grantResult && (
          <Card size="small" data-e2e-id={`${E2E}-grant-result-card`}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Text strong>
                成功派发 {grantResult.successCount} 笔 / 拒绝 {grantResult.rejectedCount} 笔
              </Text>
              <Table
                data-e2e-id={`${E2E}-grant-rejected-table`}
                columns={rejectedColumns}
                dataSource={grantResult.rejectedEntries}
                rowKey="key"
                size="small"
                pagination={false}
              />
            </Space>
          </Card>
        )}
      </Space>
    </Card>
  );
}

export default function ReactivationMysteryBoxConfigModal({ open, onClose }: Props) {
  const initialValues = {
    ...baseConfigInitialValues(
      ACTIVITY_ID,
      ACTIVITY_NAME,
      'blindbox',
      '2026-06-18 00:00:00',
      '2026-12-31 23:59:59'
    ),
    activityScope: 'specified',
    prizePool: clonePrizePool(),
    freeSpin: { ...defaultFreeSpinValues },
    identifierType: 'memberId',
    grantIdentifiers: '',
    grantCsv: [],
    prizeWeightTotal: undefined,
  };

  const steps: WizardStepDef[] = [
    {
      title: '基本设置',
      validateFields: BASE_CONFIG_STEP_FIELDS.filter((field) => !HIDDEN_BASE_FIELDS.includes(field)),
      render: () => (
        <BaseConfigStep
          e2ePrefix={E2E}
          activityId={ACTIVITY_ID}
          activityName={ACTIVITY_NAME}
          activityTypeDefault="blindbox"
          hideFields={HIDDEN_BASE_FIELDS}
        />
      ),
    },
    {
      title: '奖品池与机率',
      validateFields: ['prizeWeightTotal'],
      render: (form) => <PrizePoolStep form={form} />,
    },
    {
      title: '名单派发',
      validateFields: ['identifierType'],
      render: (form) => <GrantListStep form={form} />,
    },
  ];

  return (
    <ActivityConfigWizardShell
      open={open}
      onClose={onClose}
      title="召回盲盒 - 活动配置"
      steps={steps}
      initialValues={initialValues}
      saveMessage="召回盲盒活动配置已保存"
      e2ePrefix={E2E}
    />
  );
}

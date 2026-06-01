'use client';

import React from 'react';
import {
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
} from 'antd';
import dayjs from 'dayjs';
import { depositChannels, defaultSelectedDepositChannels } from '@/data/newMemberTriDepositData';

const { RangePicker } = DatePicker;

interface BaseConfigStepProps {
  e2ePrefix: string;
  activityId: number;
  activityName: string;
  activityTypeDefault?: string;
  hideFields?: string[];
}

/**
 * Step 1 — 基础配置 (shared across all activity config wizards).
 * Must be rendered inside a <Form> with matching initialValues.
 */
export function BaseConfigStep({
  e2ePrefix,
  activityId,
  activityName,
  activityTypeDefault = 'extra',
  hideFields = [],
}: BaseConfigStepProps) {
  const hide = (field: string) => hideFields.includes(field);

  return (
    <>
      <Form.Item label="活动类型" name="activityType" rules={[{ required: true }]}>
        <Radio.Group data-e2e-id={`${e2ePrefix}-form-activity-type-radio`}>
          <Radio value="blindbox">盲盒类</Radio>
          <Radio value="rebate">返水类</Radio>
          <Radio value="deposit">首存类</Radio>
          <Radio value="leaderboard">排行榜类</Radio>
          <Radio value="extra">附加类</Radio>
          <Radio value="other">其他</Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item label="活动ID" name="activityId" rules={[{ required: true }]}>
        <InputNumber
          data-e2e-id={`${e2ePrefix}-form-activity-id-input`}
          disabled
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item label="活动名称" name="name" rules={[{ required: true }]}>
        <Input
          data-e2e-id={`${e2ePrefix}-form-name-input`}
          placeholder="请输入活动名称"
        />
      </Form.Item>

      {!hide('ruleSource') && (
        <Form.Item label="活动规则来源" name="ruleSource" rules={[{ required: true }]}>
          <Radio.Group data-e2e-id={`${e2ePrefix}-form-rule-source-radio`}>
            <Radio value="backend">后台配置</Radio>
            <Radio value="code">开发代码配置</Radio>
          </Radio.Group>
        </Form.Item>
      )}

      <Form.Item label="活动状态" name="status" rules={[{ required: true }]}>
        <Select
          data-e2e-id={`${e2ePrefix}-form-status-select`}
          options={[
            { value: 'active', label: '有效' },
            { value: 'closed', label: '失效' },
          ]}
        />
      </Form.Item>

      <Form.Item label="活动持续时间" name="timeRange" rules={[{ required: true }]}>
        <RangePicker
          data-e2e-id={`${e2ePrefix}-form-time-range`}
          showTime
          style={{ width: '100%' }}
          format="YYYY-MM-DD HH:mm:ss"
        />
      </Form.Item>

      {!hide('introSource') && (
        <Form.Item label="活动介绍页来源" name="introSource" rules={[{ required: true }]}>
          <Radio.Group data-e2e-id={`${e2ePrefix}-form-intro-source-radio`}>
            <Radio value="backend">后台配置</Radio>
            <Radio value="frontend">前端开发设计</Radio>
          </Radio.Group>
        </Form.Item>
      )}

      {!hide('activityScope') && (
        <Form.Item label="活动范围" name="activityScope" rules={[{ required: true }]}>
          <Radio.Group data-e2e-id={`${e2ePrefix}-form-activity-scope-radio`}>
            <Radio value="all">全部会员</Radio>
            <Radio value="specified">指定名单</Radio>
          </Radio.Group>
        </Form.Item>
      )}

      {!hide('depositChannels') && (
        <Form.Item label="存款渠道" name="depositChannels" rules={[{ required: true }]}>
          <Checkbox.Group
            data-e2e-id={`${e2ePrefix}-form-deposit-channels-checkbox`}
            options={depositChannels.map((ch) => ({ value: ch, label: ch }))}
          />
        </Form.Item>
      )}
    </>
  );
}

/** Default initial values for step 1 fields */
export function baseConfigInitialValues(
  activityId: number,
  activityName: string,
  activityTypeDefault = 'other',
  startTime = '2026-01-01 00:00:00',
  endTime = '2028-12-31 23:59:59',
) {
  return {
    activityType: activityTypeDefault,
    activityId,
    name: activityName,
    ruleSource: 'backend',
    status: 'active',
    timeRange: [dayjs(startTime), dayjs(endTime)],
    introSource: 'backend',
    activityScope: 'all',
    depositChannels: defaultSelectedDepositChannels,
  };
}

export const BASE_CONFIG_STEP_FIELDS = [
  'activityType',
  'activityId',
  'name',
  'ruleSource',
  'status',
  'timeRange',
  'introSource',
  'activityScope',
  'depositChannels',
];

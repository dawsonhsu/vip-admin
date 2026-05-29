'use client';

import React, { useEffect, useState } from 'react';
import { Button, Form, Modal, Steps, message } from 'antd';
import type { FormInstance } from 'antd';

export interface WizardStepDef {
  title: string;
  /** Field names to validate when advancing past this step (empty = no validation) */
  validateFields?: string[];
  /** Render the step content; receives the form instance */
  render: (form: FormInstance) => React.ReactNode;
}

interface ActivityConfigWizardShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  steps: WizardStepDef[];
  initialValues: Record<string, any>;
  saveMessage?: string;
  e2ePrefix: string;
}

/**
 * Outer Modal shell shared by all activity config wizards.
 * Manages step navigation, footer buttons, and form submit.
 */
export default function ActivityConfigWizardShell({
  open,
  onClose,
  title,
  steps,
  initialValues,
  saveMessage = '活动配置已保存',
  e2ePrefix,
}: ActivityConfigWizardShellProps) {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!open) setCurrentStep(0);
  }, [open]);

  const handleNext = async () => {
    const fields = steps[currentStep]?.validateFields ?? [];
    try {
      if (fields.length > 0) {
        await form.validateFields(fields);
      }
      setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
    } catch {
      // validation errors shown inline
    }
  };

  const handlePrev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const handleOk = () => {
    form
      .validateFields()
      .then(() => {
        message.success(saveMessage);
        onClose();
      })
      .catch(() => {
        message.error('请检查必填项');
      });
  };

  const stepItems = steps.map((s) => ({ title: s.title }));

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <Button
            data-e2e-id={`${e2ePrefix}-footer-cancel-btn`}
            onClick={onClose}
          >
            取消
          </Button>
          {currentStep > 0 && (
            <Button
              data-e2e-id={`${e2ePrefix}-footer-prev-btn`}
              onClick={handlePrev}
            >
              上一步
            </Button>
          )}
          {currentStep < steps.length - 1 ? (
            <Button
              data-e2e-id={`${e2ePrefix}-footer-next-btn`}
              type="primary"
              onClick={handleNext}
            >
              下一步
            </Button>
          ) : (
            <Button
              data-e2e-id={`${e2ePrefix}-footer-submit-btn`}
              type="primary"
              onClick={handleOk}
            >
              OK
            </Button>
          )}
        </div>
      }
      width={1120}
      styles={{
        content: {
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 40px)',
        },
        header: { flexShrink: 0 },
        footer: { flexShrink: 0 },
        body: {
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          paddingRight: 16,
        },
      }}
      centered
    >
      <div data-e2e-id={`${e2ePrefix}-modal`}>
        <Steps
          data-e2e-id={`${e2ePrefix}-steps`}
          current={currentStep}
          items={stepItems}
          style={{ marginBottom: 24 }}
        />
        <Form
          form={form}
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 18 }}
          labelAlign="right"
          initialValues={initialValues}
        >
          {steps.map((step, index) => (
            <div
              key={step.title}
              data-e2e-id={`${e2ePrefix}-step-${index}`}
              style={{ display: currentStep === index ? 'block' : 'none' }}
            >
              {step.render(form)}
            </div>
          ))}
        </Form>
      </div>
    </Modal>
  );
}

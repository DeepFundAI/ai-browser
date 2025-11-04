import React from 'react';
import { Form, Radio, InputNumber, Select, Space } from 'antd';
import { ScheduleConfig } from '@/models';
import { useTranslation } from 'react-i18next';

interface ScheduleConfigEditorProps {
  value?: ScheduleConfig;
  onChange?: (value: ScheduleConfig) => void;
}

/**
 * Schedule configuration editor
 * Supports interval time and Cron expression two methods
 */
export const ScheduleConfigEditor: React.FC<ScheduleConfigEditorProps> = ({ value, onChange }) => {
  const { t } = useTranslation('scheduledTask');
  const [scheduleType, setScheduleType] = React.useState<'interval' | 'cron'>(value?.type || 'interval');
  const [intervalUnit, setIntervalUnit] = React.useState<'minute' | 'hour' | 'day'>(
    value?.intervalUnit || 'minute'
  );
  const [intervalValue, setIntervalValue] = React.useState<number>(value?.intervalValue || 1);
  const [cronExpression, setCronExpression] = React.useState<string>(value?.cronExpression || '');

  const handleChange = () => {
    const config: ScheduleConfig = {
      type: scheduleType,
      ...(scheduleType === 'interval'
        ? { intervalUnit, intervalValue }
        : { cronExpression }),
    };

    onChange?.(config);
  };

  React.useEffect(() => {
    handleChange();
  }, [scheduleType, intervalUnit, intervalValue, cronExpression]);

  const getIntervalText = () => {
    const unitText = {
      minute: t('minutes'),
      hour: t('hours'),
      day: t('days'),
    };
    return t('execute_every_interval', { interval: intervalValue, unit: unitText[intervalUnit] });
  };

  return (
    <div className="schedule-config-editor">
      <Form.Item label={t('schedule_type')}>
        <Radio.Group
          value={scheduleType}
          onChange={(e) => setScheduleType(e.target.value)}
        >
          <Radio value="interval">{t('interval_time')}</Radio>
          <Radio value="cron" disabled>
            {t('cron_expression')}
          </Radio>
        </Radio.Group>
      </Form.Item>

      {scheduleType === 'interval' && (
        <Form.Item label={t('execution_interval')}>
          <Space>
            <span>{t('every')}</span>
            <InputNumber
              min={1}
              max={999}
              value={intervalValue}
              onChange={(val) => setIntervalValue(val || 1)}
              className="!w-20"
            />
            <Select
              value={intervalUnit}
              onChange={(val) => setIntervalUnit(val)}
              className="!w-24"
            >
              <Select.Option value="minute">{t('minutes')}</Select.Option>
              <Select.Option value="hour">{t('hours')}</Select.Option>
              <Select.Option value="day">{t('days')}</Select.Option>
            </Select>
            <span>{t('execute_once')}</span>
          </Space>
        </Form.Item>
      )}

      {scheduleType === 'cron' && (
        <Form.Item label={t('cron_expression_label')}>
          <input
            type="text"
            value={cronExpression}
            onChange={(e) => setCronExpression(e.target.value)}
            placeholder={t('cron_example')}
            className="ant-input"
            disabled
          />
          <div className="mt-2 text-sm text-gray-400">
            {t('cron_not_supported')}
          </div>
        </Form.Item>
      )}

      <div className="mt-4 p-3 bg-tool-call rounded border border-border-message">
        <div className="text-sm text-text-12-dark">
          <strong>{t('execution_rule')}</strong>
          {scheduleType === 'interval' ? getIntervalText() : t('execute_by_cron')}
        </div>
      </div>
    </div>
  );
};

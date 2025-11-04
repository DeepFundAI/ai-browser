import React from 'react';
import {
  Alert,
  Button,
  Typography
} from "antd";
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface ErrorAlertProps {
  hasError: boolean;
  errorInfo: string;
  onClose: () => void;
  onContinue: () => void;
}

export const ErrorAlert = ({
  hasError,
  errorInfo,
  onClose,
  onContinue
}: ErrorAlertProps) => {
  const { t } = useTranslation('chat');

  if (!hasError) return null;

  return (
    <Alert
      message={t('error_title')}
      description={
        <div>
          <div>{errorInfo}</div>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t('error_tip')}
            </Text>
          </div>
        </div>
      }
      type="error"
      showIcon
      closable
      onClose={onClose}
      style={{ marginBottom: 16 }}
      action={
        <Button
          size="small"
          type="primary"
          onClick={onContinue}
        >
          {t('continue')}
        </Button>
      }
    />
  );
};

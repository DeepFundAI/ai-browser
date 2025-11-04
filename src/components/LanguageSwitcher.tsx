import React from 'react';
import { Select } from 'antd';
import { useLanguage } from '@/hooks/useLanguage';
import { GlobalOutlined } from '@ant-design/icons';

const languages = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
];

export const LanguageSwitcher: React.FC = () => {
  const { language, changeLanguage } = useLanguage();

  return (
    <Select
      value={language}
      onChange={changeLanguage}
      style={{ width: 100 }}
      suffixIcon={<GlobalOutlined />}
      options={languages}
      size="small"
      className='!text-text-01-dark'
      popupClassName='language-switcher-dropdown'
    />
  );
};

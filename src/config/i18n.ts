import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import zhCN_common from '@/locales/zh-CN/common.json';
import zhCN_header from '@/locales/zh-CN/header.json';
import zhCN_home from '@/locales/zh-CN/home.json';
import zhCN_toolbox from '@/locales/zh-CN/toolbox.json';
import zhCN_agentConfig from '@/locales/zh-CN/agent-config.json';
import zhCN_main from '@/locales/zh-CN/main.json';
import zhCN_chat from '@/locales/zh-CN/chat.json';
import zhCN_fileView from '@/locales/zh-CN/fileView.json';
import zhCN_modelConfig from '@/locales/zh-CN/modelConfig.json';
import zhCN_history from '@/locales/zh-CN/history.json';
import zhCN_scheduledTask from '@/locales/zh-CN/scheduledTask.json';
import zhCN_playback from '@/locales/zh-CN/playback.json';
import zhCN_settings from '@/locales/zh-CN/settings.json';

import enUS_common from '@/locales/en-US/common.json';
import enUS_header from '@/locales/en-US/header.json';
import enUS_home from '@/locales/en-US/home.json';
import enUS_toolbox from '@/locales/en-US/toolbox.json';
import enUS_agentConfig from '@/locales/en-US/agent-config.json';
import enUS_main from '@/locales/en-US/main.json';
import enUS_chat from '@/locales/en-US/chat.json';
import enUS_fileView from '@/locales/en-US/fileView.json';
import enUS_modelConfig from '@/locales/en-US/modelConfig.json';
import enUS_history from '@/locales/en-US/history.json';
import enUS_scheduledTask from '@/locales/en-US/scheduledTask.json';
import enUS_playback from '@/locales/en-US/playback.json';
import enUS_settings from '@/locales/en-US/settings.json';

const resources = {
  'zh': {
    common: zhCN_common,
    header: zhCN_header,
    home: zhCN_home,
    toolbox: zhCN_toolbox,
    agentConfig: zhCN_agentConfig,
    main: zhCN_main,
    chat: zhCN_chat,
    fileView: zhCN_fileView,
    modelConfig: zhCN_modelConfig,
    history: zhCN_history,
    scheduledTask: zhCN_scheduledTask,
    playback: zhCN_playback,
    settings: zhCN_settings,
  },
  'en': {
    common: enUS_common,
    header: enUS_header,
    home: enUS_home,
    toolbox: enUS_toolbox,
    agentConfig: enUS_agentConfig,
    main: enUS_main,
    chat: enUS_chat,
    fileView: enUS_fileView,
    modelConfig: enUS_modelConfig,
    history: enUS_history,
    scheduledTask: enUS_scheduledTask,
    playback: enUS_playback,
    settings: enUS_settings,
  },
};

i18n
  .use(initReactI18next)  // Pass i18n to react-i18next
  .init({
    resources,
    lng: 'en',              // Set initial language to English
    fallbackLng: 'en',      // Default language
    defaultNS: 'common',    // Default namespace
    interpolation: {
      escapeValue: false,   // React already escapes
    },
  });

export default i18n;

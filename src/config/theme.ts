// theme/themeConfig.ts - Fellou.ai inspired glass morphism theme
import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';

/**
 * Dark theme configuration with glass morphism style
 */
export const darkTheme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    // Base colors - purple accent theme (Fellou.ai)
    colorPrimary: '#5e31d8',
    colorPrimaryHover: '#914bf1',
    colorSuccess: '#10B981',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    colorInfo: '#914bf1',

    // Text colors - high contrast white (Fellou.ai style)
    colorText: '#ffffff',
    colorTextSecondary: '#d9d9d9',
    colorTextTertiary: 'rgba(255, 255, 255, 0.5)',
    colorTextQuaternary: 'rgba(255, 255, 255, 0.6)',

    // Background colors - glass morphism (Fellou.ai #ffffff0f style)
    colorBgContainer: 'rgba(255, 255, 255, 0.06)',
    colorBgElevated: 'rgba(255, 255, 255, 0.06)',
    colorBgLayout: 'rgba(255, 255, 255, 0.04)',
    colorBgSpotlight: 'rgba(255, 255, 255, 0.08)',

    // Border colors - subtle borders (Fellou.ai rgba(255,255,255,.17))
    colorBorder: 'rgba(255, 255, 255, 0.17)',
    colorBorderSecondary: 'rgba(255, 255, 255, 0.1)',

    // Others - Fellou.ai inspired
    borderRadius: 12,
    borderRadiusLG: 20,
    borderRadiusXS: 8,
    fontSize: 14,
    fontSizeHeading1: 48,
    fontSizeHeading2: 32,
    fontFamily: 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',

    // Shadows - deeper shadows for glass effect
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    boxShadowSecondary: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  components: {
    Drawer: {
      colorBgElevated: '#1e1c23',
      colorText: '#ffffff',
      colorIcon: '#d9d9d9',
      colorIconHover: '#914bf1',
      colorBorder: 'rgba(255, 255, 255, 0.17)',
      paddingLG: 24,
      borderRadiusLG: 20,
    },
    Button: {
      colorPrimary: '#5e31d8',
      colorPrimaryHover: '#914bf1',
      borderRadius: 8,
      paddingContentHorizontal: 16,
      paddingContentVertical: 8,
      fontWeight: 500,
    },
    Card: {
      colorBgContainer: 'rgba(255, 255, 255, 0.06)',
      colorBorder: 'rgba(255, 255, 255, 0.17)',
      borderRadiusLG: 24,
      paddingLG: 32,
    },
    List: {
      colorBgContainer: 'transparent',
      colorText: '#ffffff',
      colorTextSecondary: '#d9d9d9',
      paddingLG: 16,
    },
    Input: {
      colorBgContainer: 'rgba(255, 255, 255, 0.06)',
      colorText: '#ffffff',
      colorTextPlaceholder: 'rgba(255, 255, 255, 0.5)',
      colorBorder: 'rgba(255, 255, 255, 0.17)',
      activeBg: 'rgba(255, 255, 255, 0.08)',
      hoverBg: 'rgba(255, 255, 255, 0.06)',
      activeShadow: '0 0 0 2px rgba(145, 75, 241, 0.2)',
      borderRadius: 12,
      paddingBlock: 8,
      paddingInline: 12,
      controlHeight: 40,
    },
    Tag: {
      borderRadiusSM: 6,
      colorBgContainer: 'rgba(255, 255, 255, 0.06)',
    },
    Tooltip: {
      colorBgSpotlight: 'rgba(255, 255, 255, 0.08)',
      colorTextLightSolid: '#ffffff',
      borderRadius: 8,
    },
    Popconfirm: {
      colorBgElevated: 'rgba(255, 255, 255, 0.08)',
      colorText: '#ffffff',
      colorWarning: '#F59E0B',
      borderRadius: 10,
    },
    Message: {
      colorSuccess: '#10B981',
      colorError: '#EF4444',
      colorWarning: '#F59E0B',
      colorInfo: '#5e31d8',
      colorBgElevated: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 10,
    },
    Modal: {
      contentBg: '#1e1c23',
      headerBg: '#1e1c23',
      footerBg: '#1e1c23',
      colorText: '#ffffff',
      colorBorder: 'rgba(255, 255, 255, 0.17)',
      borderRadiusLG: 20,
      paddingContentHorizontal: 32,
      paddingContentVertical: 24,
    },
    Select: {
      colorBgContainer: 'rgba(255, 255, 255, 0.06)',
      colorBgElevated: 'rgba(8, 12, 16, 0.96)',
      colorText: '#ffffff',
      colorBorder: 'rgba(255, 255, 255, 0.17)',
      colorPrimaryBorder: 'rgba(145, 75, 241, 0.4)',
      activeBorderColor: 'rgba(145, 75, 241, 0.4)',
      hoverBorderColor: 'rgba(145, 75, 241, 0.3)',
      borderRadius: 12,
      optionSelectedBg: 'rgba(94, 49, 216, 0.2)',
      optionActiveBg: 'rgba(94, 49, 216, 0.1)',
    },
    Switch: {
      colorPrimary: '#5e31d8',
      colorPrimaryHover: '#914bf1',
    }
  }
};

/**
 * Light theme configuration with clean and modern style
 */
export const lightTheme: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    // Base colors - purple accent theme (consistent with dark)
    colorPrimary: '#5e31d8',
    colorPrimaryHover: '#914bf1',
    colorSuccess: '#10B981',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    colorInfo: '#5e31d8',

    // Text colors - dark text on light background
    colorText: '#1f2937',
    colorTextSecondary: '#6b7280',
    colorTextTertiary: '#9ca3af',
    colorTextQuaternary: '#6b7280',

    // Background colors - clean white and light gray
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f9fafb',
    colorBgSpotlight: '#f3f4f6',

    // Border colors - subtle gray borders
    colorBorder: '#e5e7eb',
    colorBorderSecondary: '#f3f4f6',

    // Others - consistent with dark theme
    borderRadius: 12,
    borderRadiusLG: 20,
    borderRadiusXS: 8,
    fontSize: 14,
    fontSizeHeading1: 48,
    fontSizeHeading2: 32,
    fontFamily: 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',

    // Shadows - softer shadows for light theme
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    boxShadowSecondary: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  components: {
    Drawer: {
      colorBgElevated: '#ffffff',
      colorText: '#1f2937',
      colorIcon: '#6b7280',
      colorIconHover: '#5e31d8',
      colorBorder: '#e5e7eb',
      paddingLG: 24,
      borderRadiusLG: 20,
    },
    Button: {
      colorPrimary: '#5e31d8',
      colorPrimaryHover: '#914bf1',
      borderRadius: 8,
      paddingContentHorizontal: 16,
      paddingContentVertical: 8,
      fontWeight: 500,
    },
    Card: {
      colorBgContainer: '#ffffff',
      colorBorder: '#e5e7eb',
      borderRadiusLG: 24,
      paddingLG: 32,
    },
    List: {
      colorBgContainer: 'transparent',
      colorText: '#1f2937',
      colorTextSecondary: '#6b7280',
      paddingLG: 16,
    },
    Input: {
      colorBgContainer: '#ffffff',
      colorText: '#1f2937',
      colorTextPlaceholder: '#9ca3af',
      colorBorder: '#e5e7eb',
      activeBg: '#ffffff',
      hoverBg: '#f9fafb',
      activeShadow: '0 0 0 2px rgba(94, 49, 216, 0.2)',
      borderRadius: 12,
      paddingBlock: 8,
      paddingInline: 12,
      controlHeight: 40,
    },
    Tag: {
      borderRadiusSM: 6,
      colorBgContainer: '#f3f4f6',
    },
    Tooltip: {
      colorBgSpotlight: '#1f2937',
      colorTextLightSolid: '#ffffff',
      borderRadius: 8,
    },
    Popconfirm: {
      colorBgElevated: '#ffffff',
      colorText: '#1f2937',
      colorWarning: '#F59E0B',
      borderRadius: 10,
    },
    Message: {
      colorSuccess: '#10B981',
      colorError: '#EF4444',
      colorWarning: '#F59E0B',
      colorInfo: '#5e31d8',
      colorBgElevated: '#ffffff',
      borderRadius: 10,
    },
    Modal: {
      contentBg: '#ffffff',
      headerBg: '#ffffff',
      footerBg: '#ffffff',
      colorText: '#1f2937',
      colorBorder: '#e5e7eb',
      borderRadiusLG: 20,
      paddingContentHorizontal: 32,
      paddingContentVertical: 24,
    },
    Select: {
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      colorText: '#1f2937',
      colorBorder: '#e5e7eb',
      colorPrimaryBorder: 'rgba(94, 49, 216, 0.4)',
      activeBorderColor: 'rgba(94, 49, 216, 0.4)',
      hoverBorderColor: 'rgba(94, 49, 216, 0.3)',
      borderRadius: 12,
      optionSelectedBg: 'rgba(94, 49, 216, 0.1)',
      optionActiveBg: 'rgba(94, 49, 216, 0.05)',
    },
    Switch: {
      colorPrimary: '#5e31d8',
      colorPrimaryHover: '#914bf1',
    }
  }
};

// Export default dark theme for backward compatibility
export default darkTheme;

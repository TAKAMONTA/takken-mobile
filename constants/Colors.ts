/**
 * 禅デザイン - カラーパレット
 * 行政書士アプリと統一されたデザインシステム
 */

export const ZenColors = {
  // 基本色
  background: '#F4F3EF',      // 和紙のようなベージュ
  surface: '#FFFFFF',         // 白
  
  // テキスト
  text: {
    primary: '#2C2C2C',       // 墨色
    secondary: '#7B5F43',     // セージグリーン
    tertiary: '#A8A29E',      // グレー
    inverse: '#FFFFFF',       // 白（ダークボタン用）
  },
  
  // プライマリカラー（セージグリーン）
  primary: '#7B5F43',
  primaryLight: '#A08968',
  primaryDark: '#5D4832',
  
  // 状態
  success: '#6B8E6F',
  error: '#C85A54',
  warning: '#D4A574',
  info: '#7B9FAD',
  
  // グレースケール
  gray: {
    50: '#FAFAF9',
    100: '#F5F5F4',
    200: '#E7E5E4',
    300: '#D6D3D1',
    400: '#A8A29E',
    500: '#78716C',
    600: '#57534E',
    700: '#44403C',
    800: '#292524',
    900: '#1C1917',
  },
  
  // 特殊用途
  border: '#E7E5E4',
  divider: '#D6D3D1',
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

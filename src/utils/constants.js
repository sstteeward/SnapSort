// SnapSort Design System — iOS 26 Liquid Glass
// Dark-first design with frosted glass surfaces

export const COLORS = {
  // Dark theme (primary — Liquid Glass)
  dark: {
    background: '#0A0A0F',
    surface: 'rgba(255,255,255,0.06)',
    surfaceLight: 'rgba(255,255,255,0.04)',
    surfaceHover: 'rgba(255,255,255,0.10)',
    primary: '#0A84FF',
    primaryLight: '#409CFF',
    primaryDark: '#0064D2',
    accent: '#FF9F0A',
    accentLight: '#FFB340',
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.7)',
    textMuted: 'rgba(255,255,255,0.45)',
    border: 'rgba(255,255,255,0.12)',
    card: 'rgba(255,255,255,0.08)',
    overlay: 'rgba(0,0,0,0.5)',
    tabBar: 'rgba(30,30,40,0.65)',
    statusBar: '#0A0A0F',
    gradient1: '#0A84FF',
    gradient2: '#5E5CE6',
  },
  // Light theme (glass on light — secondary option)
  light: {
    background: '#F2F2F7',
    surface: 'rgba(255,255,255,0.72)',
    surfaceLight: 'rgba(255,255,255,0.5)',
    surfaceHover: 'rgba(255,255,255,0.85)',
    primary: '#007AFF',
    primaryLight: '#409CFF',
    primaryDark: '#0064D2',
    accent: '#FF9500',
    accentLight: '#FFB340',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    text: '#000000',
    textSecondary: 'rgba(0,0,0,0.6)',
    textMuted: 'rgba(0,0,0,0.35)',
    border: 'rgba(0,0,0,0.1)',
    card: 'rgba(255,255,255,0.72)',
    overlay: 'rgba(0,0,0,0.15)',
    tabBar: 'rgba(255,255,255,0.80)',
    statusBar: '#F2F2F7',
    gradient1: '#007AFF',
    gradient2: '#5856D6',
  },
};

// Liquid Glass Design Tokens — Dark Mode (default)
export const GLASS = {
  background: 'rgba(255,255,255,0.08)',
  backgroundLight: 'rgba(255,255,255,0.05)',
  backgroundHover: 'rgba(255,255,255,0.12)',
  backgroundSolid: 'rgba(30,30,40,0.65)',
  border: 'rgba(255,255,255,0.12)',
  borderLight: 'rgba(255,255,255,0.06)',
  highlight: 'rgba(255,255,255,0.15)',
  blur: 30,
  blurLight: 15,
  blurHeavy: 50,
  borderRadius: 24,
  borderRadiusLg: 32,
  borderRadiusPill: 999,
};

// Liquid Glass Design Tokens — Light Mode
export const GLASS_LIGHT = {
  background: 'rgba(255,255,255,0.65)',
  backgroundLight: 'rgba(255,255,255,0.5)',
  backgroundHover: 'rgba(255,255,255,0.82)',
  backgroundSolid: 'rgba(255,255,255,0.75)',
  border: 'rgba(255,255,255,0.4)',
  borderLight: 'rgba(255,255,255,0.25)',
  highlight: 'rgba(255,255,255,0.6)',
  blur: 30,
  blurLight: 15,
  blurHeavy: 50,
  borderRadius: 24,
  borderRadiusLg: 32,
  borderRadiusPill: 999,
};

// Returns the correct glass tokens based on theme
export const getGlass = (isDark) => isDark ? GLASS : GLASS_LIGHT;

export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
    hero: 34,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  glass: 24,
  full: 999,
};

export const SHADOWS = {
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  float: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 16,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  glow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  }),
};

// Light mode shadows — softer to match bright aesthetic
export const SHADOWS_LIGHT = {
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  float: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  glow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  }),
};

export const getShadows = (isDark) => isDark ? SHADOWS : SHADOWS_LIGHT;

export const CATEGORIES = [
  {
    id: 'school',
    name: 'School',
    icon: 'school-outline',
    color: '#0A84FF',
    gradient: ['#0A84FF', '#409CFF'],
  },
  {
    id: 'work',
    name: 'Work',
    icon: 'briefcase-outline',
    color: '#8E8E93',
    gradient: ['#636366', '#8E8E93'],
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: 'cart-outline',
    color: '#30D158',
    gradient: ['#30D158', '#63E68B'],
  },
  {
    id: 'receipts',
    name: 'Receipts',
    icon: 'receipt-outline',
    color: '#FF9F0A',
    gradient: ['#FF9F0A', '#FFB340'],
  },
  {
    id: 'notes',
    name: 'Notes',
    icon: 'document-text-outline',
    color: '#5E5CE6',
    gradient: ['#5E5CE6', '#7D7AFF'],
  },
  {
    id: 'social_media',
    name: 'Social Media',
    icon: 'share-social-outline',
    color: '#FF453A',
    gradient: ['#FF453A', '#FF6961'],
  },
  {
    id: 'personal',
    name: 'Personal',
    icon: 'person-outline',
    color: '#BF5AF2',
    gradient: ['#BF5AF2', '#D68FFF'],
  },
  {
    id: 'others',
    name: 'Others',
    icon: 'ellipsis-horizontal-circle-outline',
    color: '#8E8E93',
    gradient: ['#636366', '#8E8E93'],
  },
];

export const SCREEN_NAMES = {
  SPLASH: 'Splash',
  HOME: 'Home',
  INBOX: 'Inbox',
  CATEGORIES: 'Categories',
  CATEGORY_DETAILS: 'CategoryDetails',
  FAVORITES: 'Favorites',
  SETTINGS: 'Settings',
  SCREENSHOT_DETAILS: 'ScreenshotDetails',
  IMPORT: 'Import',
  MAIN_TABS: 'MainTabs',
};

export const STORAGE_MODES = {
  COPY: 'copy',
  MOVE: 'move',
};

export const THUMBNAIL = {
  WIDTH: 300,
  QUALITY: 0.7,
  FORMAT: 'jpeg',
};

export const MAX_IMPORT_BATCH = 50;
export const SCREENSHOT_SCAN_LIMIT = 100;
export const ALBUM_PREFIX = 'SnapSort - ';

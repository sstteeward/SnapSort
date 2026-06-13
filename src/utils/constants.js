np// SnapSort Design System & Constants

export const COLORS = {
  // Dark theme
  dark: {
    background: '#F8FAFC', // Neutral
    surface: '#FFFFFF',
    surfaceLight: '#F1F5F9',
    surfaceHover: '#E2E8F0',
    primary: '#3B82F6',    // Primary Blue
    primaryLight: '#3B82F6',
    primaryDark: '#3B82F6',
    accent: '#F8A008',     // Tertiary Orange
    accentLight: '#F8A008',
    success: '#10B981',
    warning: '#F8A008',
    error: '#DC2626',
    text: '#0F172A',
    textSecondary: '#A5A9A8', // Secondary Grey
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    card: '#FFFFFF',
    overlay: 'rgba(15, 23, 42, 0.4)',
    tabBar: '#FFFFFF',
    statusBar: '#F8FAFC',
    gradient1: '#3B82F6',
    gradient2: '#3B82F6',
  },
  // Light theme (Strict match to image)
  light: {
    background: '#F8FAFC', // Neutral
    surface: '#FFFFFF',
    surfaceLight: '#F1F5F9',
    surfaceHover: '#E2E8F0',
    primary: '#3B82F6',    // Primary Blue
    primaryLight: '#3B82F6',
    primaryDark: '#3B82F6',
    accent: '#F8A008',     // Tertiary Orange
    accentLight: '#F8A008',
    success: '#10B981',
    warning: '#F8A008',    // Tertiary Orange
    error: '#DC2626',
    text: '#0F172A',
    textSecondary: '#A5A9A8', // Secondary Grey
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    card: '#FFFFFF',
    overlay: 'rgba(15, 23, 42, 0.4)',
    tabBar: '#FFFFFF',
    statusBar: '#F8FAFC',
    gradient1: '#3B82F6',
    gradient2: '#3B82F6',
  },
};

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
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  }),
};

export const CATEGORIES = [
  {
    id: 'school',
    name: 'School',
    icon: 'school-outline',
    color: '#3B82F6', // Primary Blue
    gradient: ['#3B82F6', '#60A5FA'],
  },
  {
    id: 'work',
    name: 'Work',
    icon: 'briefcase-outline',
    color: '#475569', // Slate (Dark Grey)
    gradient: ['#475569', '#64748B'],
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: 'cart-outline',
    color: '#10B981', // Success Green
    gradient: ['#10B981', '#34D399'],
  },
  {
    id: 'receipts',
    name: 'Receipts',
    icon: 'receipt-outline',
    color: '#F8A008', // Tertiary Orange
    gradient: ['#F8A008', '#FBBF24'],
  },
  {
    id: 'notes',
    name: 'Notes',
    icon: 'document-text-outline',
    color: '#6366F1', // Indigo/Blue-Purple
    gradient: ['#6366F1', '#818CF8'],
  },
  {
    id: 'social_media',
    name: 'Social Media',
    icon: 'share-social-outline',
    color: '#EF4444', // Error Red
    gradient: ['#EF4444', '#F87171'],
  },
  {
    id: 'personal',
    name: 'Personal',
    icon: 'person-outline',
    color: '#3B82F6', // Primary Blue
    gradient: ['#3B82F6', '#60A5FA'],
  },
  {
    id: 'others',
    name: 'Others',
    icon: 'ellipsis-horizontal-circle-outline',
    color: '#A5A9A8', // Secondary Grey
    gradient: ['#A5A9A8', '#CBD5E1'],
  },
];

export const SCREEN_NAMES = {
  HOME: 'Home',
  CATEGORIES: 'Categories',
  CATEGORY_DETAILS: 'CategoryDetails',
  FAVORITES: 'Favorites',
  SETTINGS: 'Settings',
  SCREENSHOT_DETAILS: 'ScreenshotDetails',
  IMPORT: 'Import',
  MAIN_TABS: 'MainTabs',
};

export const THUMBNAIL = {
  WIDTH: 300,
  QUALITY: 0.7,
  FORMAT: 'jpeg',
};

export const MAX_IMPORT_BATCH = 50;

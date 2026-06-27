// SettingsScreen — iOS 26 Liquid Glass preferences
// Theme-aware: bright glass sections in Light Mode, dark glass in Dark Mode

import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import useScreenshots from '../hooks/useScreenshots';
import * as imageService from '../services/imageService';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  GLASS,
  STORAGE_MODES,
  NOTIFICATION_FREQUENCIES,
  getGlass,
} from '../utils/constants';

const SettingsScreen = () => {
  const { 
    darkMode, 
    toggleDarkMode, 
    clearAll, 
    stats, 
    storageMode, 
    setStorageMode,
    backgroundMonitoringEnabled,
    setBackgroundMonitoring,
    notificationFrequency,
    setNotificationFrequency
  } = useScreenshots();
  const insets = useSafeAreaInsets();
  const theme = darkMode ? COLORS.dark : COLORS.light;
  const glass = getGlass(darkMode);

  const [storageUsed, setStorageUsed] = useState(0);

  // Theme-aware styling
  const cardBg = darkMode ? glass.background : 'rgba(255,255,255,0.65)';
  const cardBorder = darkMode ? glass.border : 'rgba(0,0,0,0.08)';
  const iconBoxBg = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
  const switchTrackOff = darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
  const dividerColor = darkMode ? glass.borderLight : 'rgba(0,0,0,0.06)';

  const loadStorageInfo = useCallback(async () => {
    const usage = await imageService.getStorageUsage();
    setStorageUsed(usage);
  }, []);

  useEffect(() => {
    loadStorageInfo();
  }, [loadStorageInfo, stats.total]);

  const handleClearData = useCallback(() => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all screenshots, categories, and settings? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await clearAll();
            loadStorageInfo();
            Alert.alert('Success', 'All data has been cleared.');
          },
        },
      ]
    );
  }, [clearAll, loadStorageInfo]);

  const statusBarStyle = darkMode ? 'light-content' : 'dark-content';

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            APPEARANCE
          </Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: iconBoxBg }]}>
                  <Ionicons name={darkMode ? 'moon' : 'sunny'} size={20} color={theme.primary} />
                </View>
                <Text style={[styles.rowText, { color: theme.text }]}>Dark Mode</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: switchTrackOff, true: theme.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={switchTrackOff}
              />
            </View>
          </View>
        </View>

        {/* Background Monitoring Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            BACKGROUND MONITORING
          </Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {/* Enable/Disable Toggle */}
            <View style={[styles.row, styles.rowBorder, { borderBottomColor: dividerColor }]}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: iconBoxBg }]}>
                  <Ionicons name="scan-outline" size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowText, { color: theme.text }]}>Monitor in Background</Text>
                  <Text style={[styles.rowSubtext, { color: theme.textMuted }]}>
                    {Platform.OS === 'ios' ? 'Check for new screenshots on resume' : 'Detect screenshots while app is closed'}
                  </Text>
                </View>
              </View>
              <Switch
                value={backgroundMonitoringEnabled}
                onValueChange={setBackgroundMonitoring}
                trackColor={{ false: switchTrackOff, true: theme.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={switchTrackOff}
              />
            </View>

            {/* Notification Frequency */}
            <View style={{ opacity: backgroundMonitoringEnabled ? 1 : 0.5 }}>
              <Pressable
                disabled={!backgroundMonitoringEnabled}
                onPress={() => setNotificationFrequency(NOTIFICATION_FREQUENCIES.IMMEDIATE)}
                style={({ pressed }) => [
                  styles.row,
                  styles.rowBorder,
                  { borderBottomColor: dividerColor, opacity: pressed && backgroundMonitoringEnabled ? 0.7 : 1 },
                ]}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'transparent' }]}>
                    {/* Empty placeholder to align text */}
                  </View>
                  <Text style={[styles.rowText, { color: theme.text }]}>Immediate (~15 min)</Text>
                </View>
                <Ionicons
                  name={notificationFrequency === NOTIFICATION_FREQUENCIES.IMMEDIATE ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={notificationFrequency === NOTIFICATION_FREQUENCIES.IMMEDIATE ? theme.primary : theme.textMuted}
                />
              </Pressable>

              <Pressable
                disabled={!backgroundMonitoringEnabled}
                onPress={() => setNotificationFrequency(NOTIFICATION_FREQUENCIES.FIFTEEN_MIN)}
                style={({ pressed }) => [
                  styles.row,
                  styles.rowBorder,
                  { borderBottomColor: dividerColor, opacity: pressed && backgroundMonitoringEnabled ? 0.7 : 1 },
                ]}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'transparent' }]} />
                  <Text style={[styles.rowText, { color: theme.text }]}>Every 15 minutes</Text>
                </View>
                <Ionicons
                  name={notificationFrequency === NOTIFICATION_FREQUENCIES.FIFTEEN_MIN ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={notificationFrequency === NOTIFICATION_FREQUENCIES.FIFTEEN_MIN ? theme.primary : theme.textMuted}
                />
              </Pressable>

              <Pressable
                disabled={!backgroundMonitoringEnabled}
                onPress={() => setNotificationFrequency(NOTIFICATION_FREQUENCIES.THIRTY_MIN)}
                style={({ pressed }) => [
                  styles.row,
                  { opacity: pressed && backgroundMonitoringEnabled ? 0.7 : 1 },
                ]}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'transparent' }]} />
                  <Text style={[styles.rowText, { color: theme.text }]}>Every 30 minutes</Text>
                </View>
                <Ionicons
                  name={notificationFrequency === NOTIFICATION_FREQUENCIES.THIRTY_MIN ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={notificationFrequency === NOTIFICATION_FREQUENCIES.THIRTY_MIN ? theme.primary : theme.textMuted}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Storage Mode Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            STORAGE MODE
          </Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {/* Copy Mode */}
            <Pressable
              onPress={() => setStorageMode(STORAGE_MODES.COPY)}
              style={({ pressed }) => [
                styles.row,
                styles.rowBorder,
                { borderBottomColor: dividerColor, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: iconBoxBg }]}>
                  <Ionicons name="copy-outline" size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowText, { color: theme.text }]}>Copy Mode</Text>
                  <Text style={[styles.rowSubtext, { color: theme.textMuted }]}>
                    Keep original, copy into category album
                  </Text>
                </View>
              </View>
              <Ionicons
                name={storageMode === STORAGE_MODES.COPY ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={storageMode === STORAGE_MODES.COPY ? theme.primary : theme.textMuted}
              />
            </Pressable>

            {/* Move Mode */}
            <Pressable
              onPress={() => {
                if (storageMode === STORAGE_MODES.MOVE) return;
                Alert.alert(
                  '⚠️ Enable Move Mode?',
                  'Move Mode will permanently remove original screenshots from your gallery after categorizing. This cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Enable Move Mode',
                      style: 'destructive',
                      onPress: () => setStorageMode(STORAGE_MODES.MOVE),
                    },
                  ]
                );
              }}
              style={({ pressed }) => [
                styles.row,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: theme.warning + '20' }]}>
                  <Ionicons name="arrow-forward-circle-outline" size={20} color={theme.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowText, { color: theme.text }]}>Move Mode</Text>
                  <Text style={[styles.rowSubtext, { color: theme.textMuted }]}>
                    Remove original, save only in category album
                  </Text>
                </View>
              </View>
              <Ionicons
                name={storageMode === STORAGE_MODES.MOVE ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={storageMode === STORAGE_MODES.MOVE ? theme.warning : theme.textMuted}
              />
            </Pressable>
          </View>
        </View>

        {/* Data & Storage Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            DATA & STORAGE
          </Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {/* Storage Info */}
            <View style={[styles.row, styles.rowBorder, { borderBottomColor: dividerColor }]}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: iconBoxBg }]}>
                  <Ionicons name="server-outline" size={20} color={theme.primary} />
                </View>
                <View>
                  <Text style={[styles.rowText, { color: theme.text }]}>Local Storage</Text>
                  <Text style={[styles.rowSubtext, { color: theme.textMuted }]}>
                    {imageService.formatFileSize(storageUsed)} used
                  </Text>
                </View>
              </View>
            </View>

            {/* Clear Data */}
            <Pressable
              onPress={handleClearData}
              style={({ pressed }) => [
                styles.row,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: theme.error + '20' }]}>
                  <Ionicons name="trash-outline" size={20} color={theme.error} />
                </View>
                <Text style={[styles.rowText, { color: theme.error }]}>Clear All Data</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            ABOUT
          </Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: iconBoxBg }]}>
                  <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
                </View>
                <Text style={[styles.rowText, { color: theme.text }]}>Version</Text>
              </View>
              <Text style={[styles.versionText, { color: theme.textMuted }]}>1.0.0</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.footer, { color: theme.textMuted }]}>
          Built by sstteward.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.extrabold,
    letterSpacing: -0.5,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.sm,
    letterSpacing: 1,
  },
  card: {
    borderRadius: GLASS.borderRadius,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  rowSubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: 2,
  },
  versionText: {
    fontSize: TYPOGRAPHY.sizes.md,
  },
  footer: {
    textAlign: 'center',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xl,
  },
});

export default SettingsScreen;

// SettingsScreen — iOS 26 Liquid Glass preferences
// Glass section cards, dark background, translucent surfaces

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
} from '../utils/constants';

const SettingsScreen = () => {
  const { darkMode, toggleDarkMode, clearAll, stats } = useScreenshots();
  const insets = useSafeAreaInsets();
  const theme = darkMode ? COLORS.dark : COLORS.light;

  const [storageUsed, setStorageUsed] = useState(0);

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

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

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
          <View style={[styles.card, { backgroundColor: GLASS.background, borderColor: GLASS.border }]}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                  <Ionicons name={darkMode ? 'moon' : 'sunny'} size={20} color={theme.primary} />
                </View>
                <Text style={[styles.rowText, { color: theme.text }]}>Dark Mode</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: 'rgba(255,255,255,0.15)', true: theme.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="rgba(255,255,255,0.15)"
              />
            </View>
          </View>
        </View>

        {/* Data & Storage Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            DATA & STORAGE
          </Text>
          <View style={[styles.card, { backgroundColor: GLASS.background, borderColor: GLASS.border }]}>
            {/* Storage Info */}
            <View style={[styles.row, styles.rowBorder, { borderBottomColor: GLASS.borderLight }]}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
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
          <View style={[styles.card, { backgroundColor: GLASS.background, borderColor: GLASS.border }]}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
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

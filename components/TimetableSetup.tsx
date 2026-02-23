import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useThemeContext } from '../contexts/ThemeContext';
import { Subject, Timetable } from '../lib/types';
import { getSubjectKey } from '../lib/utils';
import { parseTimetableFromApi } from '../lib/api';

const INDIGO = '#6366f1';
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface TimetableSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (timetable: Timetable) => void;
  subjects: Subject[];
  currentTimetable: Timetable;
  isPremium?: boolean;
  onUpgradePress?: () => void;
}

export default function TimetableSetup({
  isOpen,
  onClose,
  onSave,
  subjects,
  currentTimetable,
  isPremium = false,
  onUpgradePress,
}: TimetableSetupProps) {
  const { dark, colors } = useThemeContext();

  const [activeDay, setActiveDay] = useState(0);
  const [draft, setDraft] = useState<Timetable>({});
  const [showUpload, setShowUpload] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [previewUri, setPreviewUri] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDraft({ ...currentTimetable });
      setActiveDay(0);
      setShowUpload(false);
      setParsing(false);
      setParseError('');
      setPreviewUri('');
    }
  }, [isOpen, currentTimetable]);

  const subjectCodes = subjects.map((s) => s.code || s.name);

  const toggleSubjectForDay = useCallback(
    (subjectKey: string) => {
      setDraft((prev) => {
        const dayCodes = prev[activeDay] ?? [];
        const exists = dayCodes.includes(subjectKey);
        const updated = exists
          ? dayCodes.filter((c) => c !== subjectKey)
          : [...dayCodes, subjectKey];
        return { ...prev, [activeDay]: updated };
      });
    },
    [activeDay],
  );

  const handlePickImage = async () => {
    setParseError('');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      base64: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    setPreviewUri(asset.uri);
    setParsing(true);
    setParseError('');

    try {
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: 'base64',
      });

      // Detect MIME type from URI or asset
      const ext = asset.uri.split('.').pop()?.toLowerCase();
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      const response = await parseTimetableFromApi(
        base64,
        mimeType,
        subjectCodes,
      );

      if (response.success && response.timetable) {
        setDraft(response.timetable);
        setShowUpload(false);
      } else {
        setParseError(response.error || 'Could not parse timetable from image');
      }
    } catch {
      setParseError('Something went wrong while analyzing the image');
    } finally {
      setParsing(false);
    }
  };

  const handleToggleMode = () => {
    if (!showUpload) {
      // Switching to scan mode
      if (!isPremium) {
        onUpgradePress?.();
        return;
      }
    }
    setShowUpload((prev) => !prev);
    setParseError('');
    setPreviewUri('');
    setParsing(false);
  };

  const handleSave = () => {
    onSave(draft);
  };

  // Count total configured subjects across all days
  const totalConfigured = Object.values(draft).reduce(
    (sum, codes) => sum + codes.length,
    0,
  );

  const daySubjects = draft[activeDay] ?? [];

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[
          styles.modal,
          { backgroundColor: colors.background },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, flex: 1, marginLeft: 12 }]}>
            Weekly Timetable
          </Text>
            <TouchableOpacity
              onPress={handleToggleMode}
              style={[
                styles.modeToggle,
                {
                  backgroundColor: showUpload
                    ? (dark ? 'rgba(165, 180, 252, 0.15)' : 'rgba(99, 102, 241, 0.1)')
                    : dark
                      ? 'rgba(100, 116, 139, 0.15)'
                      : 'rgba(148, 163, 184, 0.15)',
                },
              ]}
              accessibilityLabel={showUpload ? 'Switch to manual mode' : 'Switch to scan image mode'}
              accessibilityRole="button"
            >
              <Ionicons
                name={showUpload ? 'create-outline' : 'camera-outline'}
                size={16}
                color={showUpload ? colors.accent : colors.textSecondary}
              />
              <Text
                style={[
                  styles.modeToggleText,
                  { color: showUpload ? colors.accent : colors.textSecondary },
                ]}
              >
                {showUpload ? 'Manual' : 'Scan image'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {showUpload ? (
              /* Image Upload Mode */
              <View style={styles.uploadContainer}>
                {parsing ? (
                  <View style={styles.parsingContainer}>
                    {previewUri ? (
                      <Image
                        source={{ uri: previewUri }}
                        style={styles.previewImage}
                        resizeMode="contain"
                      />
                    ) : null}
                    <ActivityIndicator
                      size="large"
                      color={colors.accent}
                      style={styles.parsingSpinner}
                    />
                    <Text
                      style={[
                        styles.parsingText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Analyzing...
                    </Text>
                  </View>
                ) : previewUri && parseError ? (
                  <View style={styles.uploadResultContainer}>
                    <Image
                      source={{ uri: previewUri }}
                      style={styles.previewImage}
                      resizeMode="contain"
                    />
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{parseError}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setPreviewUri('');
                        setParseError('');
                      }}
                      style={[
                        styles.retryButton,
                        {
                          backgroundColor: dark
                            ? 'rgba(100, 116, 139, 0.2)'
                            : 'rgba(148, 163, 184, 0.15)',
                        },
                      ]}
                      accessibilityLabel="Try a different image"
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.retryButtonText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Try a different image
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadPromptContainer}>
                    <View
                      style={[
                        styles.uploadIconCircle,
                        {
                          backgroundColor: dark ? 'rgba(165, 180, 252, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                        },
                      ]}
                    >
                      <Ionicons name="image-outline" size={32} color={colors.accent} />
                    </View>
                    <Text
                      style={[
                        styles.uploadPromptTitle,
                        { color: colors.text },
                      ]}
                    >
                      Upload your timetable
                    </Text>
                    <Text
                      style={[
                        styles.uploadPromptSubtitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Take a photo or pick an image of your weekly timetable
                    </Text>
                    <TouchableOpacity
                      onPress={handlePickImage}
                      style={[styles.pickImageButton, { backgroundColor: INDIGO }]}
                      accessibilityLabel="Pick an image"
                      accessibilityRole="button"
                    >
                      <Ionicons name="cloud-upload-outline" size={18} color="#ffffff" />
                      <Text style={styles.pickImageButtonText}>Choose Image</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              /* Manual Mode */
              <View style={styles.manualContainer}>
                {/* Day tabs */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dayTabsContent}
                  style={styles.dayTabsScroll}
                >
                  {DAY_NAMES.map((day, index) => {
                    const isActive = index === activeDay;
                    const dayCount = (draft[index] ?? []).length;
                    return (
                      <TouchableOpacity
                        key={day}
                        onPress={() => setActiveDay(index)}
                        style={[
                          styles.dayTab,
                          {
                            backgroundColor: isActive
                              ? INDIGO
                              : dark
                                ? 'rgba(100, 116, 139, 0.15)'
                                : 'rgba(148, 163, 184, 0.12)',
                          },
                        ]}
                        accessibilityLabel={`${day}${dayCount > 0 ? `, ${dayCount} subjects` : ''}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isActive }}
                      >
                        <Text
                          style={[
                            styles.dayTabText,
                            {
                              color: isActive ? '#ffffff' : colors.textSecondary,
                            },
                          ]}
                        >
                          {day}
                        </Text>
                        {dayCount > 0 ? (
                          <View
                            style={[
                              styles.dayCountBadge,
                              {
                                backgroundColor: isActive
                                  ? 'rgba(255, 255, 255, 0.25)'
                                  : (dark ? 'rgba(165, 180, 252, 0.2)' : 'rgba(99, 102, 241, 0.15)'),
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.dayCountText,
                                {
                                  color: isActive ? '#ffffff' : colors.accent,
                                },
                              ]}
                            >
                              {dayCount}
                            </Text>
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Subject checklist */}
                <ScrollView
                  style={styles.subjectList}
                  showsVerticalScrollIndicator={false}
                >
                  {subjects.length === 0 ? (
                    <View style={styles.emptySubjects}>
                      <Text
                        style={[
                          styles.emptySubjectsText,
                          { color: colors.textTertiary },
                        ]}
                      >
                        No subjects available. Fetch your attendance first.
                      </Text>
                    </View>
                  ) : (
                    subjects.map((subject) => {
                      const key = getSubjectKey(subject);
                      const isChecked = daySubjects.includes(key);
                      return (
                        <TouchableOpacity
                          key={key}
                          onPress={() => toggleSubjectForDay(key)}
                          style={[
                            styles.subjectRow,
                            {
                              borderBottomColor: colors.divider,
                            },
                          ]}
                          accessibilityLabel={`${subject.name}${isChecked ? ', selected' : ''}`}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: isChecked }}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              {
                                backgroundColor: isChecked
                                  ? INDIGO
                                  : 'transparent',
                                borderColor: isChecked
                                  ? INDIGO
                                  : colors.inputBorder,
                              },
                            ]}
                          >
                            {isChecked ? (
                              <Ionicons
                                name="checkmark"
                                size={14}
                                color="#ffffff"
                              />
                            ) : null}
                          </View>
                          <View style={styles.subjectInfo}>
                            <Text
                              style={[
                                styles.subjectName,
                                { color: colors.text },
                              ]}
                              numberOfLines={1}
                            >
                              {subject.name}
                            </Text>
                            {subject.code ? (
                              <Text
                                style={[
                                  styles.subjectCode,
                                  { color: colors.textTertiary },
                                ]}
                              >
                                {subject.code}
                              </Text>
                            ) : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.divider }]}>
            <Text style={[styles.footerCount, { color: colors.textTertiary }]}>
              {totalConfigured} {totalConfigured === 1 ? 'class' : 'classes'}{' '}
              configured
            </Text>
            <View style={styles.footerButtons}>
              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.footerButton,
                  {
                    backgroundColor: dark
                      ? 'rgba(100, 116, 139, 0.2)'
                      : 'rgba(148, 163, 184, 0.15)',
                  },
                ]}
                accessibilityLabel="Cancel"
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.footerButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={[
                  styles.footerButton,
                  { backgroundColor: INDIGO },
                ]}
                accessibilityLabel="Save timetable"
                accessibilityRole="button"
              >
                <Text style={[styles.footerButtonText, { color: '#ffffff' }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* Body */
  body: {
    flex: 1,
    minHeight: 300,
  },

  /* Upload mode */
  uploadContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  parsingContainer: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  parsingSpinner: {
    marginTop: 8,
  },
  parsingText: {
    fontSize: 15,
    fontWeight: '500',
  },
  uploadResultContainer: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 12,
    width: '100%',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  uploadPromptContainer: {
    alignItems: 'center',
    gap: 12,
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  uploadPromptTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  uploadPromptSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  pickImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  pickImageButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },

  /* Manual mode */
  manualContainer: {
    flex: 1,
  },
  dayTabsScroll: {
    flexGrow: 0,
  },
  dayTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  dayTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  dayTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayCountBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  dayCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subjectList: {
    flex: 1,
  },
  emptySubjects: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptySubjectsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectInfo: {
    flex: 1,
    gap: 2,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '500',
  },
  subjectCode: {
    fontSize: 12,
    fontFamily: 'monospace',
  },

  /* Footer */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  footerCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  footerButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

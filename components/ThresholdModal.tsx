import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useThemeContext } from '../contexts/ThemeContext';

const INDIGO = '#6366f1';

const PRESETS = [50, 60, 65, 70, 75, 80, 85, 90, 95];
const MIN_THRESHOLD = 50;
const MAX_THRESHOLD = 95;

interface ThresholdModalProps {
  isOpen: boolean;
  currentThreshold: number;
  onClose: () => void;
  onSave: (threshold: number) => void;
}

export default function ThresholdModal({
  isOpen,
  currentThreshold,
  onClose,
  onSave,
}: ThresholdModalProps) {
  const { colors } = useThemeContext();
  const [threshold, setThreshold] = useState(currentThreshold);

  useEffect(() => {
    setThreshold(currentThreshold);
  }, [currentThreshold]);

  const increment = () => {
    setThreshold((prev) => Math.min(prev + 1, MAX_THRESHOLD));
  };

  const decrement = () => {
    setThreshold((prev) => Math.max(prev - 1, MIN_THRESHOLD));
  };

  const handleSave = () => {
    onSave(threshold);
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
          onPress={() => {}}
        >
          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            Default Threshold
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Set the default minimum attendance percentage. You can also set a
            custom threshold per subject on each card.
          </Text>

          {/* Current Value Display */}
          <View style={styles.valueRow}>
            <Text style={[styles.valueLabel, { color: colors.text }]}>
              Threshold:{' '}
            </Text>
            <Text style={[styles.valueNumber, { color: colors.accent }]}>{threshold}%</Text>
          </View>

          {/* Fine-tune Row */}
          <View style={styles.finetuneRow}>
            <TouchableOpacity
              style={[
                styles.finetuneButton,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                },
              ]}
              onPress={decrement}
              activeOpacity={0.7}
              accessibilityLabel="Decrease threshold by 1"
              accessibilityRole="button"
            >
              <Text style={[styles.finetuneText, { color: colors.text }]}>
                -
              </Text>
            </TouchableOpacity>

            <View style={styles.finetuneValueContainer}>
              <Text style={[styles.finetuneValue, { color: colors.text }]}>
                {threshold}%
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.finetuneButton,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                },
              ]}
              onPress={increment}
              activeOpacity={0.7}
              accessibilityLabel="Increase threshold by 1"
              accessibilityRole="button"
            >
              <Text style={[styles.finetuneText, { color: colors.text }]}>
                +
              </Text>
            </TouchableOpacity>
          </View>

          {/* Preset Buttons */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsContainer}
          >
            {PRESETS.map((value) => {
              const isActive = threshold === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.presetPill,
                    isActive
                      ? styles.presetPillActive
                      : {
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBorder,
                        },
                  ]}
                  onPress={() => setThreshold(value)}
                  activeOpacity={0.7}
                  accessibilityLabel={`Set threshold to ${value}%`}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.presetText,
                      isActive
                        ? styles.presetTextActive
                        : { color: colors.textSecondary },
                    ]}
                  >
                    {value}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { borderColor: colors.inputBorder },
              ]}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityLabel="Cancel"
              accessibilityRole="button"
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.7}
              accessibilityLabel="Save threshold"
              accessibilityRole="button"
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  valueLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  valueNumber: {
    fontSize: 15,
    fontWeight: '700',
  },
  finetuneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  finetuneButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finetuneText: {
    fontSize: 20,
    fontWeight: '600',
  },
  finetuneValueContainer: {
    minWidth: 64,
    alignItems: 'center',
  },
  finetuneValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  presetsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
    marginBottom: 24,
  },
  presetPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  presetPillActive: {
    backgroundColor: INDIGO,
    borderColor: INDIGO,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '600',
  },
  presetTextActive: {
    color: '#ffffff',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: INDIGO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});

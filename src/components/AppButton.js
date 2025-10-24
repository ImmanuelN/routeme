import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const AppButton = ({ title, onPress, type = 'primary', style, disabled }) => {
  const stylesMap = {
    primary: styles.primary,
    secondary: styles.secondary,
    danger: styles.danger,
  };

  return (
    <TouchableOpacity
      style={[styles.button, stylesMap[type], style, disabled && styles.disabled]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled}
    >
      <Text style={[styles.text, disabled && styles.textDisabled]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#2563EB',
  },
  secondary: {
    backgroundColor: '#F3F4F6',
  },
  danger: {
    backgroundColor: '#EF4444',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  textDisabled: {
    color: '#9CA3AF',
  },
  disabled: {
    opacity: 0.8,
  },
});

export default AppButton;

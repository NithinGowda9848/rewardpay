import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

export default function GlassCard({ children, style = {}, onPress, interactive = false }) {
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={interactive ? 0.7 : 1}
        style={[styles.glassCard, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.glassCard, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(22, 25, 41, 0.65)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2,
  },
});

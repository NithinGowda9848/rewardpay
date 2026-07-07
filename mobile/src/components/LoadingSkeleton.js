import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function LoadingSkeleton({ type = 'line', count = 1 }) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const renderSkeleton = (index) => {
    switch (type) {
      case 'line':
        return (
          <Animated.View
            key={index}
            style={[styles.line, { opacity: pulseAnim }]}
          />
        );
      case 'card':
        return (
          <Animated.View
            key={index}
            style={[styles.card, { opacity: pulseAnim }]}
          />
        );
      case 'list':
        return (
          <View key={index} style={styles.listRow}>
            <Animated.View style={[styles.avatar, { opacity: pulseAnim }]} />
            <View style={styles.listContent}>
              <Animated.View style={[styles.titleLine, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.subLine, { opacity: pulseAnim }]} />
            </View>
          </View>
        );
      default:
        return (
          <Animated.View
            key={index}
            style={[styles.line, { opacity: pulseAnim }]}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => renderSkeleton(i))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  line: {
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
    width: '100%',
  },
  card: {
    height: 120,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
    width: '100%',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: 12,
  },
  listContent: {
    flex: 1,
  },
  titleLine: {
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
    width: '60%',
  },
  subLine: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    width: '40%',
  },
});

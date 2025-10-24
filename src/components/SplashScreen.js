import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';

const SplashScreen = ({ onFinish, duration = 1200 }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.delay(Math.max(200, duration - 450)),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      if (onFinish) onFinish();
    });
  }, [opacity, duration, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents="none">
      <View style={styles.inner}>
  <Image source={require('../../assets/route-logo.png')} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.subtitle}>Find. Navigate. Explore.</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  inner: {
    alignItems: 'center',
  },
  logoImage: {
    width: 140,
    height: 140,
    marginBottom: 18,
    borderRadius: 20,
    overflow: 'hidden',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
});

export default SplashScreen;

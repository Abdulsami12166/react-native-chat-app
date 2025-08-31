import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TypingDots() {
  return (
    <View style={styles.container}>
      <View style={styles.dot} /><View style={styles.dot} /><View style={styles.dot} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 8, marginVertical: 4, alignSelf: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#666', marginHorizontal: 3 }
});

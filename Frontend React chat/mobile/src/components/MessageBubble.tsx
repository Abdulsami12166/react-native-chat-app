import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MessageBubble({ text, mine, createdAt, delivered, read }: {
  text: string;
  mine?: boolean;
  createdAt?: string;
  delivered?: boolean;
  read?: boolean;
}) {
  return (
    <View style={[styles.bubble, mine ? styles.my : styles.other]}>
      <Text>{text}</Text>
      <View style={styles.meta}>
        <Text style={styles.time}>{createdAt ? new Date(createdAt).toLocaleTimeString() : ''}</Text>
        {mine ? (
          <Text style={[styles.ticks, read ? styles.read : (delivered ? styles.delivered : styles.sent)]}>
            {read ? '✓✓' : (delivered ? '✓✓' : '✓')}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { padding: 8, borderRadius: 8, marginVertical: 6, maxWidth: '80%' },
  my: { backgroundColor: '#daf8cb', alignSelf: 'flex-end' },
  other: { backgroundColor: '#f0f0f0', alignSelf: 'flex-start' },
  meta: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 6 },
  time: { fontSize: 10, color: '#666', marginRight: 6 },
  ticks: { fontSize: 12 },
  sent: { color: '#666' },
  delivered: { color: '#333' },
  read: { color: '#0b84ff' }, // blue for read
});

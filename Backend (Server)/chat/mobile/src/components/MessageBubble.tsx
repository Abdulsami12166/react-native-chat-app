import React from 'react';
import { View, Text } from 'react-native';
import dayjs from 'dayjs';

type Props = {
  text: string;
  mine?: boolean;
  createdAt?: string | number | Date;
  read?: boolean;
};

export default function MessageBubble({ text, mine, createdAt, read }: Props) {
  return (
    <View style={{ padding: 8, alignItems: mine ? 'flex-end' : 'flex-start' }}>
      <View style={{
        maxWidth: '80%',
        backgroundColor: mine ? '#DCF8C6' : '#fff',
        borderRadius: 16,
        padding: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb'
      }}>
        <Text style={{ fontSize: 16 }}>{text}</Text>
        <Text style={{ fontSize: 10, color: '#6b7280', textAlign: 'right' }}>
          {createdAt ? dayjs(createdAt).format('HH:mm') : ''} {mine ? (read ? '✓✓' : '✓') : ''}
        </Text>
      </View>
    </View>
  );
}

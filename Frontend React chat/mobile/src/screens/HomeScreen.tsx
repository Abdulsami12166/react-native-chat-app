import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';

type User = { _id: string; name: string; email: string };
type Row = { user: User; lastMessage?: { content: string; createdAt: string } };

export default function HomeScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [rows, setRows] = useState<Row[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  const load = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/auth/users');
      setRows(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    const onPresence = (ids: string[]) => setOnlineIds(new Set(ids));
    const onStatus = ({ userId, online }: { userId: string; online: boolean }) => {
      setOnlineIds(prev => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    socket.on('presence:update', onPresence);
    socket.on('user:status', onStatus);
    socket.emit('presence:get');

    return () => {
      socket.off('presence:update', onPresence);
      socket.off('user:status', onStatus);
    };
  }, [socket]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Hi {user?.name}</Text>
        <Text onPress={logout} style={{ color: 'red' }}>Logout</Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.user._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('Chat', { peer: item.user })} style={styles.row}>
            <View>
              <Text style={styles.name}>{item.user.name}</Text>
              <Text numberOfLines={1} style={styles.preview}>{item.lastMessage?.content || 'Start a chat'}</Text>
            </View>
            <View style={[styles.dot, { backgroundColor: onlineIds.has(item.user._id) ? 'green' : 'gray' }]} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600' },
  row: { padding: 12, borderBottomWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: '600', fontSize: 16 },
  preview: { color: '#6b7280', maxWidth: 240 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});

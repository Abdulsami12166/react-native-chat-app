import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';

type User = { _id: string; name: string; email: string };
type LastMessage = { text: string; createdAt: string };
type Row = { user: User; lastMessage?: LastMessage; online?: boolean };

export default function HomeScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [rows, setRows] = useState<Row[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  const load = async () => {
    setRefreshing(true);
    const res = await api.get('/users');
    setRows(res.data);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    const onPresence = (payload: { onlineIds: string[] }) => {
      setOnlineIds(new Set(payload.onlineIds));
    };
    socket.on('presence', onPresence);
    socket.emit('presence:get');
    return () => {
      socket.off('presence', onPresence);
    };
  }, [socket]);

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <View style={{ paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 20, fontWeight: '600' }}>Hi {user?.name}</Text>
        <Text onPress={logout} style={{ color: 'red' }}>Logout</Text>
      </View>
      <FlatList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        data={rows}
        keyExtractor={(item) => item.user._id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('Chat', { peer: item.user })}
            style={{ padding: 12, borderBottomWidth: 1, borderColor: '#e5e7eb' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontWeight: '600', fontSize: 16 }}>{item.user.name}</Text>
                <Text numberOfLines={1} style={{ color: '#6b7280', maxWidth: 240 }}>
                  {item.lastMessage?.text || 'Start a chat'}
                </Text>
              </View>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: onlineIds.has(item.user._id) ? 'green' : 'gray' }} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

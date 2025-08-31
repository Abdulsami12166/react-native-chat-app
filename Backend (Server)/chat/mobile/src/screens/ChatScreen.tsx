import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import MessageBubble from '../components/MessageBubble';
import TypingDots from '../components/TypingDots';

type Msg = { _id: string; text: string; senderId: string; read?: boolean; createdAt: string };

export default function ChatScreen({ route }: any) {
  const { peer } = route.params;
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const listRef = useRef<FlatList<Msg>>(null);

  const load = async () => {
    const res = await api.get(`/conversations/${peer._id}/messages`);
    setMessages(res.data);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
  };

  useEffect(() => { load(); }, [peer._id]);

  useEffect(() => {
    if (!socket) return;
    const onNew = (msg: Msg) => {
      if (msg.senderId === peer._id || msg.senderId === user?._id) {
        setMessages(prev => [...prev, msg]);
        listRef.current?.scrollToEnd({ animated: true });
      }
    };
    const onTyping = (payload: { from: string; action: 'start' | 'stop' }) => {
      if (payload.from === peer._id) setTyping(payload.action === 'start');
    };
    const onRead = (payload: { messageIds: string[] }) => {
      setMessages(prev => prev.map(m => payload.messageIds.includes(m._id) ? { ...m, read: true } : m));
    };

    socket.on('message:new', onNew);
    socket.on('typing', onTyping);
    socket.on('message:read', onRead);

    // mark all peer messages as read when opening
    const unreadIds = messages.filter(m => m.senderId === peer._id && !m.read).map(m => m._id);
    if (unreadIds.length) socket.emit('message:read', { peerId: peer._id, messageIds: unreadIds });

    return () => {
      socket.off('message:new', onNew);
      socket.off('typing', onTyping);
      socket.off('message:read', onRead);
    };
  }, [socket, peer._id, messages]);

  const send = () => {
    if (!text.trim() || !socket) return;
    socket.emit('message:send', { to: peer._id, text: text.trim() });
    setText('');
    socket.emit('typing', { to: peer._id, action: 'stop' });
  };

  const onChange = (t: string) => {
    setText(t);
    if (!socket) return;
    socket.emit('typing', { to: peer._id, action: 'start' });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing', { to: peer._id, action: 'stop' });
    }, 1200);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#e5e7eb' }}>
        <Text style={{ fontWeight: '600', fontSize: 16 }}>{peer.name}</Text>
      </View>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <MessageBubble text={item.text} mine={item.senderId === user?._id} createdAt={item.createdAt} read={item.read} />
        )}
        ListFooterComponent={typing ? <TypingDots /> : null}
        contentContainerStyle={{ padding: 8 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderTopWidth: 1, borderColor: '#e5e7eb' }}>
        <TextInput
          value={text}
          onChangeText={onChange}
          placeholder="Type a message"
          style={{ flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 24, paddingHorizontal: 12, paddingVertical: 8 }}
        />
        <TouchableOpacity onPress={send} style={{ backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 }}>
          <Text style={{ color: 'white', fontWeight: '600' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

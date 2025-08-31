import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { api } from '../services/api';
import MessageBubble from '../components/MessageBubble';
import TypingDots from '../components/TypingDots';

export default function ChatScreen({ route }: any) {
  const { peer } = route.params; // { _id, name, email }
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const typingTimeout = useRef<any>(null);
  const listRef = useRef<FlatList<any>>(null);

  const load = async () => {
    try {
      const res = await api.get(`/conversations/${peer._id}/messages`);
      setMessages(res.data);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (err) {
      console.log('load messages err', err);
    }
  };

  useEffect(() => { load(); }, [peer._id]);

  useEffect(() => {
    if (!socket) return;

    const onNew = (msg: any) => {
      // incoming message object from backend
      setMessages(prev => [...prev, msg]);
      listRef.current?.scrollToEnd({ animated: true });
    };

    const onTypingStart = (payload: { from: string }) => {
      if (payload.from === peer._id) setTyping(true);
    };
    const onTypingStop = (payload: { from: string }) => {
      if (payload.from === peer._id) setTyping(false);
    };

    const onRead = (payload: { messageId: string; reader: string }) => {
      setMessages(prev => prev.map(m => m._id === payload.messageId ? { ...m, read: true } : m));
    };

    socket.on('message:new', onNew);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('message:read', onRead);

    // mark unread messages (from peer) as read when opening chat
    const unread = messages.filter(m => m.from._id === peer._id && !m.read).map(m => m._id);
    if (unread.length) {
      socket.emit('message:read', unread);
      // also update locally
      setMessages(prev => prev.map(m => unread.includes(m._id) ? { ...m, read: true } : m));
    }

    return () => {
      socket.off('message:new', onNew);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('message:read', onRead);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, peer._id, messages]);

  const send = async () => {
    if (!text.trim() || !socket) return;
    try {
      // save on server
      const res = await api.post(`/conversations/${peer._id}/messages`, { content: text.trim() });
      const saved = res.data;
      // emit real-time
      socket.emit('message:send', { to: peer._id, content: text.trim() });
      // optimistic update
      setMessages(prev => [...prev, saved]);
      setText('');
      socket.emit('typing:stop', { to: peer._id });
    } catch (err) {
      console.log('send err', err);
    }
  };

  const onChange = (t: string) => {
    setText(t);
    if (!socket) return;
    socket.emit('typing:start', { to: peer._id });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing:stop', { to: peer._id });
    }, 1200);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}><Text style={styles.title}>{peer.name}</Text></View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <MessageBubble
            text={item.content}
            mine={item.from._id === user?._id}
            createdAt={item.createdAt}
            delivered={item.delivered}
            read={item.read}
          />
        )}
        ListFooterComponent={typing ? <TypingDots /> : null}
        contentContainerStyle={{ padding: 8 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputRow}>
        <TextInput value={text} onChangeText={onChange} placeholder="Type a message" style={styles.input} />
        <TouchableOpacity onPress={send} style={styles.sendBtn}><Text style={{ color: 'white' }}>Send</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 12, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  title: { fontWeight: '600', fontSize: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderTopWidth: 1, borderColor: '#e5e7eb' },
  input: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 24, paddingHorizontal: 12, paddingVertical: 8 },
  sendBtn: { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 }
});

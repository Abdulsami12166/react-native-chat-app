import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { useAuth } from '../hooks/useAuth';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async () => {
    try {
      await login(email, password);
    } catch (e: any) {
      Alert.alert('Login failed', e?.response?.data?.message || e.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 12 }}>Login</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none"
        style={{ borderWidth: 1, borderColor: '#e5e7eb', padding: 12, borderRadius: 8 }} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry
        style={{ borderWidth: 1, borderColor: '#e5e7eb', padding: 12, borderRadius: 8 }} />
      <Button title="Login" onPress={onSubmit} />
      <Text style={{ textAlign: 'center', marginTop: 8 }} onPress={() => navigation.navigate('Register')}>
        No account? Register
      </Text>
    </View>
  );
}

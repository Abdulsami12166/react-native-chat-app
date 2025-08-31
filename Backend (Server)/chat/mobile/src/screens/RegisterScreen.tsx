import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { useAuth } from '../hooks/useAuth';

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async () => {
    try {
      await register(name, email, password);
      Alert.alert('Success', 'Account created successfully!');
    } catch (e: any) {
      const apiErr =
        e?.response?.data?.error || // our backend sends { error: "..." }
        e?.response?.data?.message || // fallback if some endpoint uses message
        e.message;
      Alert.alert('Registration failed', apiErr);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 12 }}>Register</Text>

      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={{
          borderWidth: 1,
          borderColor: '#e5e7eb',
          padding: 12,
          borderRadius: 8,
          marginBottom: 12,
        }}
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          borderColor: '#e5e7eb',
          padding: 12,
          borderRadius: 8,
          marginBottom: 12,
        }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: '#e5e7eb',
          padding: 12,
          borderRadius: 8,
          marginBottom: 20,
        }}
      />

      <Button title="Create account" onPress={onSubmit} />

      <Text
        style={{ textAlign: 'center', marginTop: 12, color: '#2563eb' }}
        onPress={() => navigation.goBack()}
      >
        Back to login
      </Text>
    </View>
  );
}

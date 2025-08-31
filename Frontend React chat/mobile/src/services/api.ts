import axios, { AxiosRequestConfig } from 'axios';
import { BASE_URL } from '../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    if (config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

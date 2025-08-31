import axios from "axios";
import { getToken } from "./storage";

export const api = axios.create({
  baseURL: "http://192.168.31.18:4000", // your laptop IP
});

// Attach token if available
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
); // <-- Add this closing parenthesis and semicolon
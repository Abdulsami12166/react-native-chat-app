import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://192.168.31.18:4000', // Updated to use port 4000
});

console.log(`Axios base URL set to: ${axiosInstance.defaults.baseURL}`); // Debug log

// Interceptor to handle errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(`HTTP Error ${error.response.status}: ${error.response.statusText}`);
      if (error.response.status === 404) {
        console.error('Error 404: Resource not found');
      }
    } else if (error.request) {
      console.error('No response received from the server:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

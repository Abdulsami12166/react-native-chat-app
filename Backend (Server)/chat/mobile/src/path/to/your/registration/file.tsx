import axios from 'axios';

type RegisterUserData = {
  name: string;
  email: string;
  password: string;
};

const API_BASE_URL = 'http://0.0.0.0:4000'; // or use your LAN IP if testing on a real device

const registerUser = async (userData: RegisterUserData): Promise<void> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
    // ...handle successful registration...
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error:', error.response?.status, error.response?.data);
      // Optionally show a user-friendly message
      alert('Registration failed: ' + (error.response?.data?.error || 'Unknown error'));
    } else {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred.');
    }
  }
};

// Example usage in a component:
const handleRegister = async (userData: RegisterUserData) => {
  try {
    await registerUser(userData);
    // Navigate to login or home, or show success message
    // navigation.navigate('Login'); // if using React Navigation
  } catch (error) {
    // This will catch any errors thrown by registerUser
    console.error('Registration handler error:', error);
  }
};

// Example of another API call with error handling
const fetchProfile = async (token: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // ...handle profile data...
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Profile fetch error:', error.response?.status, error.response?.data);
      alert('Failed to fetch profile: ' + (error.response?.data?.error || 'Unknown error'));
    } else {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred.');
    }
  }
};
import { config } from '@/config';

interface AuthResponse {
  access_token: string;
  token_type: string;
}

export const auth = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', email); // OAuth2 expects 'username' field
    formData.append('password', password);

    const response = await fetch(`${config.apiUrl}/api/token`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to login');
    }

    const data = await response.json();
    localStorage.setItem('token', data.access_token);
    return data;
  },

  async signup(email: string, password: string, fullName: string): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('full_name', fullName);

    const response = await fetch(`${config.apiUrl}/api/signup`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to sign up');
    }

    const data = await response.json();
    localStorage.setItem('token', data.access_token);
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  // Add this to your API calls
  getAuthHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}; 
import { config } from '@/config';

interface AuthResponse {
  access_token: string;
  token_type: string;
}

export const auth = {
  async login(email: string, password: string): Promise<AuthResponse> {
    console.log('🔐 Login attempt for email:', email);
    const formData = new FormData();
    formData.append('username', email); // OAuth2 expects 'username' field
    formData.append('password', password);

    try {
      console.log('📤 Sending login request to:', `${config.apiUrl}/token`);
      const response = await fetch(`${config.apiUrl}/token`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: formData,
      });

      console.log('📥 Login response status:', response.status);
      const responseText = await response.text();
      console.log('📥 Raw response:', responseText);

      if (!response.ok) {
        let errorDetail;
        try {
          const errorJson = JSON.parse(responseText);
          errorDetail = errorJson.detail;
          console.error('❌ Login error details:', errorJson);
        } catch (e) {
          errorDetail = responseText;
          console.error('❌ Login error raw text:', responseText);
        }
        throw new Error(errorDetail || 'Failed to login');
      }

      const data = JSON.parse(responseText);
      console.log('✅ Login successful, token received');
      if (!data.access_token) {
        console.error('❌ No access token in response:', data);
        throw new Error('No access token received');
      }
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('isAuthenticated', 'true');
      return data;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  },

  async signup(email: string, password: string, fullName: string): Promise<AuthResponse> {
    console.log('📝 Signup attempt for:', { email, fullName });
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('full_name', fullName);
    formData.append('username', email); // Add username field for backend compatibility

    try {
      console.log('📤 Sending signup request to:', `${config.apiUrl}/signup`);
      const response = await fetch(`${config.apiUrl}/signup`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      console.log('📥 Signup response status:', response.status);
      const responseText = await response.text();
      console.log('📥 Raw response:', responseText);

      if (!response.ok) {
        let errorDetail;
        try {
          const errorJson = JSON.parse(responseText);
          errorDetail = errorJson.detail;
        } catch (e) {
          errorDetail = responseText;
        }
        console.error('❌ Signup failed:', errorDetail);
        throw new Error(errorDetail || 'Failed to sign up');
      }

      const data = JSON.parse(responseText);
      console.log('✅ Signup successful, token received');
      localStorage.setItem('token', data.access_token);
      return data;
    } catch (error) {
      console.error('❌ Signup error:', error);
      throw error;
    }
  },

  logout() {
    console.log('🚪 Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
  },

  getToken() {
    const token = localStorage.getItem('token');
    console.log('🎟️ Token retrieved from storage:', token ? 'Present' : 'Not found');
    return token;
  },

  isAuthenticated() {
    const isAuth = !!this.getToken();
    console.log('🔒 Authentication check:', isAuth ? 'Authenticated' : 'Not authenticated');
    return isAuth;
  },

  // Add this to your API calls
  getAuthHeaders() {
    const token = this.getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    console.log('📋 Auth headers:', headers);
    return headers;
  }
}; 
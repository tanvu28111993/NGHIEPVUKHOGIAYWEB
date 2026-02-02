
import { User } from '../types';
import { HttpService } from './http';

export const AuthService = {
  login: async (username: string, password: string): Promise<User | null> => {
    try {
      const response = await HttpService.post({ action: 'login', username, password });
      const data = await response.json();
      
      if (data.success) return data.user;
      return null;
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  }
};

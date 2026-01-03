// Node/Express Authentication Service wrappers
import { apiClient, setAuthToken } from './apiClient';

export interface User {
  uid: string;
  name: string;
  email: string;
  type: 'guest' | 'email';
  avatar?: string;
  bio?: string;
  age?: number;
  gender?: string;
  location?: string;
  badges?: string[];
  joinedDate: string;
  premiumStatus?: 'free' | 'premium';
  lastUsernameChange?: string;
  isEmailVerified: boolean;
}

interface AuthResponse {
  user: User;
  token?: string;
}

export const createEmailAccount = async (email: string, password: string, name: string) => {
  const result = await apiClient.post<AuthResponse>('/auth/signup', { email, password, name }, { auth: false });
  if (result.token) setAuthToken(result.token);
  return result.user;
};

export const resendVerificationEmail = async (email: string) => {
  await apiClient.post('/auth/resend-verification', { email }, { auth: false });
};

export const checkEmailVerification = async (): Promise<boolean> => {
  try {
    const result = await apiClient.get<{ isVerified: boolean }>('/auth/me');
    return !!result.isVerified;
  } catch {
    return false;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  const result = await apiClient.post<AuthResponse>('/auth/login', { email, password }, { auth: false });
  if (result.token) setAuthToken(result.token);
  return result.user;
};

export const signOutUser = async () => {
  try {
    await apiClient.post('/auth/logout', {});
  } finally {
    setAuthToken(null);
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<User>) => {
  await apiClient.patch(`/users/${uid}`, updates);
};

export const getUserData = async (uid: string): Promise<User | null> => {
  try {
    return await apiClient.get<User>(`/users/${uid}`);
  } catch {
    return null;
  }
};

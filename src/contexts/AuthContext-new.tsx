// Node/Express (MERN) Authentication Context
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, getAuthToken, setAuthToken } from '@/lib/apiClient';
import { mapApiUserToAuthUser, AuthUser } from '@/lib/auth-new';

interface AuthContextType {
  user: AuthUser | null;
  currentUser: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, requireEmailVerification?: boolean) => Promise<void>;
  resendEmailVerification: (email: string) => Promise<void>;
  verifyEmail: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: (name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
  updateUserProfile: (data: Partial<AuthUser>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  requestAccountDeletion: () => Promise<{ scheduledFor: number }>;
  cancelAccountDeletion: () => Promise<void>;
  getAccountDeletionStatus: () => Promise<{ pending: boolean; scheduledFor: number | null; daysRemaining: number }>;
  isAuthenticated: boolean;
}

interface AuthApiUser {
  id: string;
  uid?: string;
  email?: string;
  name?: string;
  displayName?: string;
  userType?: 'guest' | 'registered' | 'premium';
  premiumStatus?: 'free' | 'monthly' | 'yearly';
  photoURL?: string;
  avatar?: string;
  bio?: string;
  gender?: string;
  location?: string;
  dob?: string | Date;
  settings?: any;
  lastUsernameChange?: string | Date;
  username?: string;
  emailVerified?: boolean;
  isOnline?: boolean;
  isAnonymous?: boolean;
  lastSeen?: string | Date;
  createdAt?: string | Date;
}

interface AuthContextState {
  user: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

const normalizeUser = (apiUser: AuthApiUser | null): AuthUser | null => {
  if (!apiUser) return null;
  const avatarUrl = (apiUser.avatar || apiUser.photoURL || '').toString().trim();
  return mapApiUserToAuthUser({
    id: apiUser.id,
    uid: apiUser.uid || apiUser.id,
    email: apiUser.email,
    name: apiUser.name || apiUser.displayName,
    displayName: apiUser.displayName,
    username: (apiUser as any).username,
    avatar: avatarUrl || undefined,
    bio: apiUser.bio,
    gender: apiUser.gender,
    location: apiUser.location,
    dob: apiUser.dob,
    settings: apiUser.settings,
    lastUsernameChange: apiUser.lastUsernameChange as any,
    emailVerified: apiUser.emailVerified,
    isOnline: apiUser.isOnline,
    isAnonymous: apiUser.isAnonymous,
    premiumStatus: apiUser.premiumStatus,
    type: (apiUser.userType as AuthUser['type']) || 'registered',
    userType: (apiUser.userType as AuthUser['type']) || 'registered',
    lastSeen: apiUser.lastSeen,
    createdAt: apiUser.createdAt
  });
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthContextState>({ user: null, loading: true });

  useEffect(() => {
    const init = async () => {
      const token = getAuthToken();
      if (!token) {
        setState({ user: null, loading: false });
        return;
      }

      try {
        const me = await apiClient.get<AuthApiUser>('/auth/me');
        setState({ user: normalizeUser(me), loading: false });
      } catch (err) {
        console.error('Failed to load current user', err);
        setAuthToken(null);
        setState({ user: null, loading: false });
      }
    };

    init();
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await apiClient.post<{ user: AuthApiUser; token?: string }>('/auth/login', { email, password }, { auth: false });
    if (result.token) setAuthToken(result.token);
    setState({ user: normalizeUser(result.user), loading: false });
  };

  const signUp = async (email: string, password: string, displayName: string, requireEmailVerification = false) => {
    // Include auth token so guest -> registered conversion can occur
    const result = await apiClient.post<{ user: AuthApiUser; token?: string }>('/auth/signup', {
      email,
      password,
      displayName,
      requireEmailVerification
    });

    if (result.token && !requireEmailVerification) {
      setAuthToken(result.token);
    }

    setState({ user: requireEmailVerification ? null : normalizeUser(result.user), loading: false });
  };

  const resendEmailVerification = async (email: string) => {
    await apiClient.post('/auth/resend-verification', { email }, { auth: false });
  };

  const verifyEmail = async () => {
    await apiClient.post('/auth/verify-email', {});
    setState(prev => {
      if (!prev.user) return prev;
      return { ...prev, user: { ...prev.user, emailVerified: true } };
    });
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await apiClient.post('/auth/change-password', { currentPassword, newPassword });
  };

  const requestAccountDeletion = async () => {
    return apiClient.post<{ scheduledFor: number }>('/auth/delete-account', {});
  };

  const cancelAccountDeletion = async () => {
    await apiClient.post('/auth/cancel-deletion', {});
  };

  const getAccountDeletionStatus = async () => {
    return apiClient.get<{ pending: boolean; scheduledFor: number | null; daysRemaining: number }>('/auth/deletion-status');
  };

  const signInWithGoogle = async () => {
    // Placeholder: implement your OAuth redirect or popup flow
    throw new Error('Google sign-in not implemented for the MERN backend yet');
  };

  const signInAsGuest = async (name?: string) => {
    const result = await apiClient.post<{ user: AuthApiUser; token?: string }>('/auth/guest', { name }, { auth: false });
    if (result.token) setAuthToken(result.token);
    setState({ user: normalizeUser(result.user), loading: false });
  };

  const signOut = async () => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (err) {
      console.warn('Logout request failed, clearing local state anyway', err);
    } finally {
      setAuthToken(null);
      setState({ user: null, loading: false });
    }
  };

  const updateUserProfile = async (data: Partial<AuthUser>) => {
    if (!state.user) return;
    const updatedRaw = await apiClient.patch<any>(`/users/${state.user.id}`, data);
    // Normalize Mongo doc (_id) to API shape expected by normalizeUser
    const updated: AuthApiUser = {
      id: updatedRaw.id || updatedRaw._id || String(updatedRaw.guestId || state.user.id),
      uid: updatedRaw.uid || updatedRaw.id || updatedRaw._id || String(updatedRaw.guestId || state.user.id),
      email: updatedRaw.email ?? state.user.email,
      emailVerified: updatedRaw.emailVerified ?? (state.user as any).emailVerified,
      name: (updatedRaw.name ?? updatedRaw.displayName) ?? state.user.name,
      displayName: (updatedRaw.displayName ?? updatedRaw.name) ?? state.user.displayName,
      userType: updatedRaw.userType ?? state.user.userType,
      premiumStatus: updatedRaw.premiumStatus ?? state.user.premiumStatus,
      avatar: (updatedRaw.avatar ?? updatedRaw.photoURL) ?? state.user.avatar,
      bio: updatedRaw.bio ?? state.user.bio,
      gender: updatedRaw.gender ?? (state.user as any).gender,
      location: updatedRaw.location ?? (state.user as any).location,
      dob: updatedRaw.dob ?? (state.user as any).dob,
      settings: updatedRaw.settings ?? (state.user as any)?.settings,
      lastUsernameChange: updatedRaw.lastUsernameChange ?? (state.user as any).lastUsernameChange,
      username: updatedRaw.username ?? (state.user as any).username,
      createdAt: updatedRaw.createdAt ?? state.user.createdAt
    } as AuthApiUser;

    setState(prev => ({ ...prev, user: normalizeUser(updated) }));
  };

  const value: AuthContextType = {
    user: state.user,
    currentUser: state.user,
    loading: state.loading,
    signIn,
    signUp,
    resendEmailVerification,
    verifyEmail,
    signInWithGoogle,
    signInAsGuest,
    signOut,
    updateProfile: updateUserProfile,
    updateUserProfile,
    changePassword,
    requestAccountDeletion,
    cancelAccountDeletion,
    getAccountDeletionStatus,
    isAuthenticated: !!state.user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

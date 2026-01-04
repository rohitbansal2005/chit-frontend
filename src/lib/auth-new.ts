// Modern Authentication utilities for Node/Express backend
import { AppUser } from './app-data';

export interface AuthUser {
  id: string;
  uid: string; // compatibility alias
  name: string;
  displayName?: string;
  email: string;
  type: 'guest' | 'registered' | 'premium';
  userType?: 'guest' | 'registered' | 'premium';
  avatar?: string;
  bio?: string;
  photoURL?: string;
  gender?: string;
  location?: string;
  dob?: string;
  age?: number;
  settings?: any;
  isOnline: boolean;
  isAnonymous?: boolean;
  emailVerified?: boolean;
  premiumStatus?: 'free' | 'monthly' | 'yearly';
  dob?: string;
  deletePending?: boolean;
  deleteRequestedAt?: Date;
  deleteScheduledFor?: Date;
  lastSeen: Date;
  createdAt: Date;
}

export const mapApiUserToAuthUser = (apiUser: Partial<AuthUser> & { id?: string; uid?: string; email?: string; name?: string }, customData?: AppUser): AuthUser => {
  const baseName = apiUser.name || customData?.displayName || 'Anonymous';
  return {
    id: apiUser.id || apiUser.uid || 'unknown',
    uid: apiUser.uid || apiUser.id || 'unknown',
    name: baseName,
    displayName: baseName,
    email: apiUser.email || '',
    type: (apiUser.type as AuthUser['type']) || 'registered',
    userType: (apiUser.type as AuthUser['type']) || 'registered',
    avatar: apiUser.avatar || customData?.photoURL || '',
    bio: apiUser.bio || customData?.bio,
    gender: (apiUser as any).gender || (customData as any)?.gender,
    location: (apiUser as any).location || (customData as any)?.location,
    dob: (apiUser as any).dob || (customData as any)?.dob,
    settings: (apiUser as any).settings || (customData as any)?.settings,
    dob: (apiUser as any).dob || (customData as any)?.dob,
    isOnline: apiUser.isOnline ?? customData?.isOnline ?? false,
    isAnonymous: apiUser.isAnonymous ?? false,
    premiumStatus: apiUser.premiumStatus || 'free',
    emailVerified: (apiUser as any).emailVerified ?? false,
    deletePending: (apiUser as any).deletePending ?? false,
    deleteRequestedAt: (apiUser as any).deleteRequestedAt ? new Date((apiUser as any).deleteRequestedAt) : undefined,
    deleteScheduledFor: (apiUser as any).deleteScheduledFor ? new Date((apiUser as any).deleteScheduledFor) : undefined,
    lastSeen: apiUser.lastSeen ? new Date(apiUser.lastSeen) : customData?.lastSeen || new Date(),
    createdAt: apiUser.createdAt ? new Date(apiUser.createdAt) : customData?.createdAt || new Date()
  };
};

export const generateGuestName = (): string => {
  const adjectives = ['Cool', 'Happy', 'Smart', 'Funny', 'Brave', 'Kind', 'Quick', 'Bright'];
  const nouns = ['Cat', 'Dog', 'Bear', 'Lion', 'Eagle', 'Fox', 'Wolf', 'Tiger'];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);
  
  return `${adjective}${noun}${number}`;
};
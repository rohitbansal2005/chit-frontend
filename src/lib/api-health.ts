import { request } from './apiClient';

export const logApiStatus = async () => {
  try {
    const result = await request<{ status?: string; message?: string }>('/health', { method: 'GET', auth: false });
    console.info('API health check:', result?.status || 'ok', result?.message || '');
  } catch (error) {
    console.error('API health check failed:', error);
  }
};

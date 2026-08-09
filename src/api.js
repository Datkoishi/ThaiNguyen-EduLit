const API_ROOT = import.meta.env.VITE_API_BASE_URL || '';
export const API_BASE = `${API_ROOT}/api/v1`;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_ROOT || '/';

export class ApiError extends Error {
  constructor(status, payload) {
    super(payload?.error?.message || 'Không thể kết nối tới hệ thống.');
    this.status = status;
    this.code = payload?.error?.code || 'NETWORK_ERROR';
    this.fields = payload?.error?.fields || {};
  }
}

export async function apiRequest(path, options = {}) {
  const { token, body, headers = {}, ...fetchOptions } = options;
  const requestHeaders = { ...headers };
  let requestBody = body;

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }
  if (token) requestHeaders.Authorization = 'Bearer ' + token;

  let response;
  try {
    response = await fetch(API_BASE + path, {
      credentials: 'include',
      ...fetchOptions,
      headers: requestHeaders,
      body: requestBody
    });
  } catch {
    throw new ApiError(0, { error: { code: 'NETWORK_ERROR', message: 'Không thể kết nối tới máy chủ.' } });
  }

  const payload = response.status === 204 ? { data: null } : await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, payload);
  return payload;
}

export const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export const formatLearningDuration = (seconds = 0, compact = false) => {
  const safeSeconds = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = Math.floor(safeSeconds % 60);
  if (compact) return [hours, minutes, remainingSeconds].map((value) => String(value).padStart(2, '0')).join(':');
  if (hours) return `${hours} giờ ${minutes} phút`;
  if (minutes) return `${minutes} phút`;
  return `${remainingSeconds} giây`;
};

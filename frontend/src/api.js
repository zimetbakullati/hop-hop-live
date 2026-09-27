export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const ASSET_BASE_URL =
  import.meta.env.VITE_ASSET_URL || API_URL.replace(/\/api\/?$/, '') || 'http://localhost:5000';

const parseResponseBody = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    return { message: text };
  }
};

export const apiRequest = async (path, options = {}) => {
  const { headers: customHeaders, ...restOptions } = options;
  const headers = { ...(customHeaders || {}) };
  if (
    restOptions.body &&
    !(restOptions.body instanceof FormData) &&
    !headers['Content-Type'] &&
    !headers['content-type']
  ) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...restOptions,
    headers
  });

  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

export const uploadVideo = async (token, formData) => {
  const response = await fetch(`${API_URL}/videos`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token
    },
    body: formData
  });

  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(data.message || 'Upload failed');
  }

  return data;
};

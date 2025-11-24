const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

// Define a custom headers type that includes Authorization
type CustomHeaders = HeadersInit & {
  'Authorization'?: string;
  [key: string]: any;
};

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: CustomHeaders = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Always try to get token if not provided
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('travel_token') || localStorage.getItem('jwt') : null);
  if (authToken && !headers['Authorization']) {
    console.log('Adding Authorization header with token');
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  console.log('Sending request to:', path);
  console.log('Headers:', JSON.stringify(headers, null, 2));

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include', // Important for cookies if using httpOnly tokens
    });

    console.log('Response status:', res.status, res.statusText);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('API Error:', {
        status: res.status,
        statusText: res.statusText,
        url: res.url,
        error: errorText
      });
      throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    }

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    return {} as T;
  } catch (error: any) {
    console.error("API fetch error:", error);
    throw error;
  }
}

export { API_URL };



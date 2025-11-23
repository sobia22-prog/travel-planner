const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any).Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      let errorBody: any = null;
      try {
        errorBody = await res.json();
      } catch {
        // ignore
      }
      console.error("API error", res.status, errorBody || (await res.text()));
      throw new Error(errorBody?.error?.message || `Request failed: ${res.status}`);
    }

    return res.json() as Promise<T>;
  } catch (error: any) {
    // Handle network errors (connection refused, etc.)
    if (error.message?.includes("Failed to fetch") || error.message?.includes("ERR_CONNECTION_REFUSED")) {
      throw new Error("Unable to connect to server. Please make sure the backend server is running on port 1337.");
    }
    throw error;
  }
}

export { API_URL };



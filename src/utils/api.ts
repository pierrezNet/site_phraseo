/**
 * API utility functions for making HTTP requests
 */

type RequestOptions = RequestInit & { timeout?: number };

/**
 * Makes an HTTP request that aborts after `timeout` ms (default 8 s)
 */
export async function fetchWithTimeout(url: string, options: RequestOptions = {}): Promise<Response> {
  const { timeout = 8000, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, { ...fetchOptions, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Makes a GET request and parses the JSON response
 */
export async function get<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetchWithTimeout(url, {
    ...options,
    method: 'GET',
    headers: { Accept: 'application/json', ...options.headers },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Makes a POST request with a JSON body; returns nothing (the relay answers 204)
 */
export async function postJson(url: string, data: unknown, options: RequestOptions = {}): Promise<void> {
  const response = await fetchWithTimeout(url, {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
  }
}

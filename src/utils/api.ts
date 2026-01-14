/**
 * API utility functions for making HTTP requests
 */

/**
 * Makes an HTTP request with the specified options
 * @param url The URL to make the request to
 * @param options The request options
 * @returns The response data
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 8000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    // Add CORS mode but use 'same-origin' credentials which is safer
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      mode: 'cors',
      credentials: 'same-origin'
    });
    
    return response;
  } catch (error) {
    // Improve error handling for fetch errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        console.error('Network error or CORS issue:', error);
        throw new Error('Network error or CORS restriction. Check developer console for details.');
      }
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Makes a GET request to the specified URL
 * @param url The URL to make the request to
 * @param options The request options
 * @returns The response data
 */
export async function get<T>(
  url: string, 
  options: RequestInit & { timeout?: number } = {}
): Promise<T> {
  try {
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': window.location.origin,
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('GET request failed:', error);
    throw error;
  }
}

/**
 * Makes a POST request to the specified URL
 * @param url The URL to make the request to
 * @param data The data to send
 * @param options The request options
 * @returns The response data
 */
export async function post<T>(
  url: string,
  data: any,
  options: RequestInit & { timeout?: number } = {}
): Promise<T> {
  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin,
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });
    
    if (!response.ok) {
      // Get more information about the error
      let errorMessage = `HTTP error! Status: ${response.status} - ${response.statusText}`;
      try {
        const errorData = await response.text();
        if (errorData) {
          errorMessage += ` - ${errorData}`;
        }
      } catch (e) {
        // Ignore text parsing errors
      }
      throw new Error(errorMessage);
    }
    
    return response.json();
  } catch (error) {
    console.error('POST request failed:', error);
    throw error;
  }
}

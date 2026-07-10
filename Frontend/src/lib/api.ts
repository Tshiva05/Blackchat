import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || https://chat-frontend-9k9s.onrender.com ;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // sends the httpOnly refresh-token cookie
});

let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// On a 401, try refreshing the access token once, then retry the original request.
let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api
            .post("/auth/refresh")
            .then((res) => {
              const token = res.data.accessToken as string;
              setAccessToken(token);
              return token;
            })
            .catch(() => null)
            .finally(() => {
              refreshPromise = null;
            });
        }
        const newToken = await refreshPromise;
        if (newToken) {
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch (e) {
        /* fall through to reject below */
      }
    }
    return Promise.reject(error);
  }
);

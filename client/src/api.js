import axios from "axios";

const ACCESS_TOKEN_KEY = "sbf_access_token";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
}

export function setAccessToken(token) {
  if (!token) return localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error?.response?.status;

    if (status !== 401 || original?._retry || original?.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (!refreshPromise) {
      refreshPromise = api.post("/auth/refresh", {}).finally(() => {
        refreshPromise = null;
      });
    }

    try {
      const { data } = await refreshPromise;
      if (data?.accessToken) setAccessToken(data.accessToken);
      if (data?.accessToken) original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch (refreshError) {
      setAccessToken("");
      return Promise.reject(refreshError);
    }
  }
);

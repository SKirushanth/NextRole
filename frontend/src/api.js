const TOKEN_KEY = "nextrole_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Must match ApplicationStatus in backend/app/models.py
export const STATUSES = ["APPLIED", "INTERVIEWING", "OFFER", "REJECTED"];

function errorMessage(data, fallback) {
  const detail = data && data.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) return detail.map((d) => d.msg).join(", ");
  return fallback;
}

async function request(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = new URLSearchParams(form); // OAuth2 login expects form encoding
  } else if (body !== undefined) {
    payload = JSON.stringify(body);
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`/api${path}`, { method, headers, body: payload });
  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    // empty or non-JSON body
  }

  if (!res.ok) {
    if (res.status === 401 && token) {
      clearToken();
      window.dispatchEvent(new Event("nextrole:logout"));
    }
    throw new Error(errorMessage(data, res.statusText || "Request failed"));
  }
  return data;
}

export const api = {
  register: (email, password) =>
    request("/auth/register", { method: "POST", body: { email, password } }),
  login: (email, password) =>
    request("/auth/login", { method: "POST", form: { username: email, password } }),
  me: () => request("/auth/me"),

  listApplications: ({ status, q } = {}) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    const qs = params.toString();
    return request(`/applications${qs ? `?${qs}` : ""}`);
  },
  createApplication: (data) => request("/applications", { method: "POST", body: data }),
  updateApplication: (id, data) =>
    request(`/applications/${id}`, { method: "PATCH", body: data }),
  deleteApplication: (id) => request(`/applications/${id}`, { method: "DELETE" }),
};
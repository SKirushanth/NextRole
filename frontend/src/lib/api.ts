import type {
  ApplicationCreate,
  ApplicationResponse,
  ApplicationStatus,
  ApplicationUpdate,
  ListApplicationsParams,
  Token,
  UserResponse,
} from "../types";

const TOKEN_KEY = "nextrole_token";

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

// Must match ApplicationStatus in backend/app/models.py
export const STATUSES: ApplicationStatus[] = ["APPLIED", "INTERVIEWING", "OFFER", "REJECTED"];

interface ApiErrorPayload {
  detail?: string | Array<{ msg: string }>;
}

function errorMessage(data: ApiErrorPayload | null, fallback: string): string {
  const detail = data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) return detail.map((d) => d.msg).join(", ");
  return fallback;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  form?: Record<string, string>;
}

async function request<T = unknown>(
  path: string,
  { method = "GET", body, form }: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: string | URLSearchParams | undefined;
  if (form) {
    payload = new URLSearchParams(form); // OAuth2 login expects form encoding
  } else if (body !== undefined) {
    payload = JSON.stringify(body);
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`/api${path}`, { method, headers, body: payload });
  if (res.status === 204) return null as T;

  let data: unknown = null;
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
    throw new Error(errorMessage(data as ApiErrorPayload | null, res.statusText || "Request failed"));
  }
  return data as T;
}

export const api = {
  register: (email: string, password: string): Promise<UserResponse> =>
    request<UserResponse>("/auth/register", { method: "POST", body: { email, password } }),
  login: (email: string, password: string): Promise<Token> =>
    request<Token>("/auth/login", { method: "POST", form: { username: email, password } }),
  me: (): Promise<UserResponse> => request<UserResponse>("/auth/me"),

  listApplications: ({ status, q }: ListApplicationsParams = {}): Promise<ApplicationResponse[]> => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    const qs = params.toString();
    return request<ApplicationResponse[]>(`/applications${qs ? `?${qs}` : ""}`);
  },
  createApplication: (data: ApplicationCreate): Promise<ApplicationResponse> =>
    request<ApplicationResponse>("/applications", { method: "POST", body: data }),
  updateApplication: (id: number, data: ApplicationUpdate): Promise<ApplicationResponse> =>
    request<ApplicationResponse>(`/applications/${id}`, { method: "PATCH", body: data }),
  deleteApplication: (id: number): Promise<null> =>
    request<null>(`/applications/${id}`, { method: "DELETE" }),
};

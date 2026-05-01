import axios, { AxiosError } from "axios";

import { useAuthStore } from "@/store/auth";
import type {
  AuthResponse,
  Category,
  DashboardStats,
  FullReport,
  Gala,
  LiveResults,
  MyVote,
  Nominee,
  NotificationItem,
  ScanLogEntry,
  ScanResult,
  Student,
  StudentImportResult,
  Ticket,
  TicketType,
  AttendeeStatus,
  User,
  UserWithSpend,
  Role,
} from "./types";

// Dev: Vite proxie /api -> localhost:8000 (rien à configurer)
// Prod: VITE_API_URL pointe vers le backend déployé (ex: https://it-gala-api.onrender.com/api/v1)
const baseURL = import.meta.env.VITE_API_URL || "/api/v1";

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err: AxiosError<{ detail?: string }>) => {
    if (err.response?.status === 401) useAuthStore.getState().logout();
    return Promise.reject(err);
  }
);

export function apiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = (err.response?.data as { detail?: string })?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d: any) => d.msg).join(", ");
  }
  return "Une erreur est survenue";
}

/* ============ Auth ============ */
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/login", { email, password }).then((r) => r.data),
  register: (full_name: string, email: string, password: string, school_promotion?: string) =>
    api
      .post<AuthResponse>("/auth/register", { full_name, email, password, school_promotion })
      .then((r) => r.data),
  me: () => api.get<User>("/auth/me").then((r) => r.data),
};

/* ============ Galas ============ */
export const galaApi = {
  active: () => api.get<Gala | null>("/galas/active").then((r) => r.data),
  list: () => api.get<Gala[]>("/galas").then((r) => r.data),
  get: (id: number) => api.get<Gala>(`/galas/${id}`).then((r) => r.data),
  create: (data: Partial<Gala>) => api.post<Gala>("/galas", data).then((r) => r.data),
  update: (id: number, data: Partial<Gala>) =>
    api.patch<Gala>(`/galas/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/galas/${id}`),
};

/* ============ Categories ============ */
export const categoryApi = {
  list: (gala_id?: number) =>
    api.get<Category[]>("/categories", { params: { gala_id } }).then((r) => r.data),
  create: (data: Partial<Category>) => api.post<Category>("/categories", data).then((r) => r.data),
  update: (id: number, data: Partial<Category>) =>
    api.patch<Category>(`/categories/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/categories/${id}`),
};

/* ============ Nominees ============ */
export const nomineeApi = {
  list: (category_id?: number) =>
    api.get<Nominee[]>("/nominees", { params: { category_id } }).then((r) => r.data),
  create: (data: Partial<Nominee>) => api.post<Nominee>("/nominees", data).then((r) => r.data),
  update: (id: number, data: Partial<Nominee>) =>
    api.patch<Nominee>(`/nominees/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/nominees/${id}`),
};

/* ============ Tickets ============ */
export const ticketApi = {
  create: (data: {
    gala_id: number;
    type: TicketType;
    attendee_status: AttendeeStatus;
    price: number;
    buyer_full_name: string;
    buyer_email: string;
    buyer_phone?: string | null;
    partner_full_name?: string | null;
    group_size?: number | null;
  }) => api.post<Ticket>("/tickets", data).then((r) => r.data),
  list: (params: { q?: string; gala_id?: number; status?: string; limit?: number } = {}) =>
    api.get<Ticket[]>("/tickets", { params }).then((r) => r.data),
  byCode: (code: string) => api.get<Ticket>(`/tickets/${code}`).then((r) => r.data),
};

/* ============ Votes ============ */
export const voteApi = {
  cast: (nominee_id: number) =>
    api.post<{ id: number; user_id: number; category_id: number; nominee_id: number }>("/votes", { nominee_id }).then((r) => r.data),
  mine: () => api.get<MyVote[]>("/votes/me").then((r) => r.data),
};

/* ============ Scans ============ */
export const scanApi = {
  scan: (code: string) => api.post<ScanResult>(`/scans/${code}`).then((r) => r.data),
  stats: () =>
    api.get<{ total_tickets: number; scanned_tickets: number; remaining: number; my_scans: number }>("/scans/stats").then((r) => r.data),
  recent: (limit = 20) => api.get<Ticket[]>("/scans/recent", { params: { limit } }).then((r) => r.data),
};

/* ============ Reports ============ */
export const reportApi = {
  dashboard: () => api.get<DashboardStats>("/reports/dashboard").then((r) => r.data),
  full: () => api.get<FullReport>("/reports/full").then((r) => r.data),
};

/* ============ Live ============ */
export const liveApi = {
  results: () => api.get<LiveResults>("/live/results").then((r) => r.data),
};

/* ============ Certificates ============ */
export const certificateApi = {
  nomineeUrl: (nomineeId: number) => `/api/v1/certificates/nominee/${nomineeId}`,
  winnerUrl: (categoryId: number) => `/api/v1/certificates/category/${categoryId}/winner`,
};

/* ============ Notifications ============ */
export const notificationApi = {
  list: () => api.get<NotificationItem[]>("/notifications").then((r) => r.data),
  broadcast: (subject: string, body: string, role?: string) =>
    api.post<{ recipients: number; sent: number; failed: number }>("/notifications/broadcast", { subject, body, role }).then((r) => r.data),
};

/* ============ Audit ============ */
export const auditApi = {
  scans: (params: { limit?: number; controller_id?: number } = {}) =>
    api.get<ScanLogEntry[]>("/audit/scans", { params }).then((r) => r.data),
};

/* ============ Students ============ */
export const studentApi = {
  list: (params: { q?: string; promotion?: string; limit?: number } = {}) =>
    api.get<Student[]>("/students", { params }).then((r) => r.data),
  promotions: () => api.get<string[]>("/students/promotions").then((r) => r.data),
  create: (data: Omit<Student, "id" | "created_at">) =>
    api.post<Student>("/students", data).then((r) => r.data),
  update: (id: number, data: Partial<Student>) =>
    api.patch<Student>(`/students/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/students/${id}`),
  removeAll: (promotion?: string) =>
    api.delete("/students", { params: { promotion } }),
  importXlsx: (file: File, promotion?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    return api
      .post<StudentImportResult>("/students/import", fd, {
        params: { promotion },
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};

/* ============ Users ============ */
export const userApi = {
  list: () => api.get<UserWithSpend[]>("/users").then((r) => r.data),
  create: (data: { full_name: string; email: string; password: string; role: Role; school_promotion?: string }) =>
    api.post<User>("/users", data).then((r) => r.data),
  update: (id: number, data: Partial<User & { password: string }>) =>
    api.patch<User>(`/users/${id}`, data).then((r) => r.data),
  suspend: (id: number) => api.post<User>(`/users/${id}/suspend`).then((r) => r.data),
  activate: (id: number) => api.post<User>(`/users/${id}/activate`).then((r) => r.data),
  remove: (id: number) => api.delete(`/users/${id}`),
};

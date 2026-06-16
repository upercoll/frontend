const BASE = import.meta.env.VITE_API_URL || "";
const PANEL = `${BASE}/api/panel`;

function getToken(): string | null {
  return localStorage.getItem("panel_token");
}

async function req<T>(
  method: string,
  path: string,
  body?: unknown,
  isFormData = false
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData && body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${PANEL}${path}`, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

const get = <T>(path: string) => req<T>("GET", path);
const post = <T>(path: string, body?: unknown) => req<T>("POST", path, body);
const patch = <T>(path: string, body?: unknown) => req<T>("PATCH", path, body);
const del = <T>(path: string, body?: unknown) => req<T>("DELETE", path, body);
const postForm = <T>(path: string, form: FormData) => req<T>("POST", path, form, true);
const patchForm = <T>(path: string, form: FormData) => req<T>("PATCH", path, form, true);

export const adminApi = {
  auth: {
    ownerLogin: (email: string, password: string) =>
      post<{ success: boolean; token: string; data: { user: import("./types").AdminUser; profile: import("./types").AdminProfile; profileComplete: boolean } }>("/auth/owner-login", { email, password }),
    memberLogin: (email: string, password: string) =>
      post<{ success: boolean; token: string; data: { user: import("./types").AdminUser; profile: import("./types").AdminProfile; role: import("./types").AdminRole; permissions: string[]; claimGames: string[] } }>("/auth/member-login", { email, password }),
    validateInvite: (token: string) =>
      get<{ success: boolean; data: { email: string; role: import("./types").AdminRole; memberId: string } }>(`/auth/invite/${token}`),
    sendVerificationCode: (token: string) =>
      post<{ success: boolean; message: string }>(`/auth/invite/${token}/send-code`),
    verifyAndActivate: (token: string, body: { code: string; password: string; displayName?: string; username?: string }) =>
      post<{ success: boolean; token: string; data: { user: import("./types").AdminUser; profile: import("./types").AdminProfile; role: import("./types").AdminRole; permissions: string[] } }>(`/auth/invite/${token}/verify`, body),
    me: () => get<{ success: boolean; data: { user: import("./types").AdminUser; profile: import("./types").AdminProfile } }>("/auth/me"),
    logout: () => post("/auth/logout"),
  },

  profile: {
    get: () => get<{ success: boolean; data: { profile: import("./types").AdminProfile } }>("/profile"),
    update: (data: Partial<import("./types").AdminProfile>) =>
      patch<{ success: boolean; data: { profile: import("./types").AdminProfile } }>("/profile", data),
    uploadPicture: (form: FormData) =>
      postForm<{ success: boolean; data: { profilePicture: string } }>("/profile/picture", form),
    changePassword: (currentPassword: string, newPassword: string) =>
      patch("/profile/password", { currentPassword, newPassword }),
  },

  analytics: {
    dashboard: () => get<{ success: boolean; data: { stats: import("./types").DashboardStats; recentOrders: import("./types").Order[] } }>("/analytics/dashboard"),
    revenue: (period: "monthly" | "daily", year?: number) =>
      get<{ success: boolean; data: { chart: import("./types").RevenueChartPoint[]; period: string; year?: number } }>(`/analytics/revenue?period=${period}${year ? `&year=${year}` : ""}`),
    byGame: () => get<{ success: boolean; data: { byGame: { _id: string; revenue: number; orders: number }[] } }>("/analytics/by-game"),
    topProducts: () => get<{ success: boolean; data: { topProducts: { _id: string; name: string; game: string; totalSold: number; revenue: number }[] } }>("/analytics/top-products"),
    claims: () => get<{ success: boolean; data: { claims: Record<string, number>; avgResponseMs: number } }>("/analytics/claims"),
    salesSummary: (period: string) =>
      get<{ success: boolean; data: { revenue: number; orders: number; avgOrderValue: number; revenueGrowth?: number; ordersGrowth?: number; statusBreakdown?: Record<string, number> } }>(`/analytics/sales-summary?period=${period}`),
    conversion: () =>
      get<{ success: boolean; data: { totalOrders: number; paidOrders: number; conversionRate: number; abandonmentRate: number } }>("/analytics/conversion"),
  },

  roles: {
    permissions: () => get<{ success: boolean; data: { permissions: string[] } }>("/roles/permissions"),
    list: () => get<{ success: boolean; data: { roles: import("./types").AdminRole[] } }>("/roles"),
    get: (id: string) => get<{ success: boolean; data: { role: import("./types").AdminRole; members: import("./types").TeamMember[] } }>(`/roles/${id}`),
    create: (data: { name: string; description?: string; color?: string; permissions: string[] }) =>
      post<{ success: boolean; data: { role: import("./types").AdminRole } }>("/roles", data),
    update: (id: string, data: { name?: string; description?: string; color?: string; permissions?: string[] }) =>
      patch<{ success: boolean; data: { role: import("./types").AdminRole } }>(`/roles/${id}`, data),
    delete: (id: string) => del(`/roles/${id}`),
  },

  team: {
    list: (params?: { role?: string; status?: string; game?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return get<{ success: boolean; data: { members: import("./types").TeamMember[] } }>(`/team${q ? `?${q}` : ""}`);
    },
    get: (id: string) => get<{ success: boolean; data: { member: import("./types").TeamMember; profile: import("./types").AdminProfile; stats: import("./types").AgentStatsSummary } }>(`/team/${id}`),
    invite: (data: { email: string; roleId: string; claimGames?: string[] }) =>
      post<{ success: boolean; data: { member: import("./types").TeamMember } }>("/team/invite", data),
    update: (id: string, data: { roleId?: string; claimGames?: string[]; claimCategories?: string[]; active?: boolean }) =>
      patch<{ success: boolean; data: { member: import("./types").TeamMember } }>(`/team/${id}`, data),
    remove: (id: string) => del(`/team/${id}`),
    hardDelete: (id: string) => del(`/team/${id}/hard-delete`),
    resendInvite: (id: string) => post(`/team/${id}/resend-invite`),
    updateCommission: (id: string, commissionRate: number) =>
      patch(`/team/${id}/commission`, { commissionRate }),
  },

  orders: {
    list: (params?: Record<string, string>) => {
      const q = new URLSearchParams(params || {}).toString();
      return get<{ success: boolean; data: { orders: import("./types").Order[]; total: number; pages: number } }>(`/orders${q ? `?${q}` : ""}`);
    },
    get: (id: string) => get<{ success: boolean; data: { order: import("./types").Order; claimSession: import("./types").ClaimSession } }>(`/orders/${id}`),
    updateStatus: (id: string, status: string, adminNotes?: string) =>
      patch(`/orders/${id}/status`, { status, adminNotes }),
    fulfill: (id: string, data?: { trackingNumber?: string; carrier?: string; notes?: string }) =>
      post(`/orders/${id}/fulfill`, data || {}),
    refund: (id: string, data: { amount: number; reason?: string; partial?: boolean; restockItems?: boolean }) =>
      post<{ success: boolean; data: { order: import("./types").Order; refundAmount: number; isPartial: boolean; message: string } }>(`/orders/${id}/refund`, data),
    addTimeline: (id: string, action: string, details?: string) =>
      post(`/orders/${id}/timeline`, { action, details }),
    updateTags: (id: string, tags: string[]) =>
      patch(`/orders/${id}/tags`, { tags }),
    getClaimChat: (orderId: string) =>
      get<{ success: boolean; data: { claimSession: import("./types").ClaimSession } }>(`/orders/${orderId}/claim-chat`),
    bulkUpdateStatus: (orderIds: string[], status: string) =>
      patch("/orders/bulk-status", { orderIds, status }),
  },

  games: {
    list: (active?: boolean) => get<{ success: boolean; data: { games: import("./types").Game[] } }>(`/games${active !== undefined ? `?active=${active}` : ""}`),
    get: (slug: string) => get<{ success: boolean; data: { game: import("./types").Game; categories: import("./types").Category[]; productCount: number } }>(`/games/${slug}`),
    create: (form: FormData) => postForm<{ success: boolean; data: { game: import("./types").Game } }>("/games", form),
    update: (slug: string, form: FormData) => patchForm<{ success: boolean; data: { game: import("./types").Game } }>(`/games/${slug}`, form),
    delete: (slug: string) => del(`/games/${slug}`),
  },

  categories: {
    all: (game?: string) => get<{ success: boolean; data: import("./types").Category[] }>(`/categories${game ? `?game=${game}` : ""}`),
    byGame: (game: string) => get<{ success: boolean; data: import("./types").Category[] }>(`/categories/game/${game}`),
    create: (data: Partial<import("./types").Category>) => post<{ success: boolean; data: import("./types").Category }>("/categories", data),
    update: (id: string, data: Partial<import("./types").Category>) => patch<{ success: boolean; data: import("./types").Category }>(`/categories/${id}`, data),
    delete: (id: string) => del(`/categories/${id}`),
    addSubcategory: (id: string, data: { name: string; slug?: string }) =>
      post<{ success: boolean; data: import("./types").Category }>(`/categories/${id}/subcategories`, data),
    removeSubcategory: (id: string, subId: string) =>
      del<{ success: boolean; data: import("./types").Category }>(`/categories/${id}/subcategories/${subId}`),
  },

  products: {
    list: (params?: Record<string, string>) => {
      const q = new URLSearchParams(params || {}).toString();
      return get<{ success: boolean; data: import("./types").Product[]; total: number }>(`/products${q ? `?${q}` : ""}`);
    },
    get: (id: string) => get<{ success: boolean; data: import("./types").Product }>(`/products/${id}`),
    create: (form: FormData) => postForm<{ success: boolean; data: import("./types").Product }>("/products", form),
    update: (id: string, form: FormData) => patchForm<{ success: boolean; data: import("./types").Product }>(`/products/${id}`, form),
    delete: (id: string) => del(`/products/${id}`),
  },

  siteContent: {
    all: () => get<{ success: boolean; data: { content: Record<string, import("./types").SiteContentItem[]>; flat: import("./types").SiteContentItem[] } }>("/site-content"),
    section: (s: string) => get<{ success: boolean; data: { items: import("./types").SiteContentItem[] } }>(`/site-content/section/${s}`),
    update: (key: string, value: unknown) => patch<{ success: boolean; data: { item: import("./types").SiteContentItem } }>(`/site-content/${encodeURIComponent(key)}`, { value }),
    bulkUpdate: (updates: { key: string; value: unknown }[]) => post("/site-content/bulk-update", { updates }),
    reset: (key: string) => post(`/site-content/${encodeURIComponent(key)}/reset`),
  },

  proof: {
    list: (params?: Record<string, string>) => {
      const q = new URLSearchParams(params || {}).toString();
      return get<{ success: boolean; data: { proofs: import("./types").ProofOfDelivery[]; total: number; unviewedCount: number } }>(`/proof${q ? `?${q}` : ""}`);
    },
    get: (id: string) => get<{ success: boolean; data: { proof: import("./types").ProofOfDelivery } }>(`/proof/${id}`),
    submit: (form: FormData) => postForm<{ success: boolean; data: { proof: import("./types").ProofOfDelivery } }>("/proof/submit", form),
    addNotes: (id: string, notes: string) => patch(`/proof/${id}/notes`, { notes }),
  },

  agentStats: {
    all: (params?: Record<string, string>) => {
      const q = new URLSearchParams(params || {}).toString();
      return get<{ success: boolean; data: { agents: { member: import("./types").TeamMember; profile: import("./types").AdminProfile; stats: import("./types").AgentStatsSummary }[] } }>(`/agent-stats${q ? `?${q}` : ""}`);
    },
    me: () => get<{ success: boolean; data: { stats: import("./types").AgentStatsSummary; recentSessions: import("./types").ClaimSession[]; completionRate: number } }>("/agent-stats/me"),
    detail: (id: string) => get<{ success: boolean; data: { member: import("./types").TeamMember; profile: import("./types").AdminProfile; stats: import("./types").AgentStatsSummary; recentSessions: import("./types").ClaimSession[] } }>(`/agent-stats/${id}`),
  },

  upload: {
    single: (form: FormData, params?: Record<string, string>) => {
      const q = new URLSearchParams(params || {}).toString();
      return postForm<{ success: boolean; data: { url: string; publicId: string } }>(`/upload/single${q ? `?${q}` : ""}`, form);
    },
    multiple: (form: FormData) => postForm<{ success: boolean; data: { files: { url: string; publicId: string }[] } }>("/upload/multiple", form),
    delete: (publicId: string) => del("/upload", { publicId }),
  },

  promos: {
    list: () => get<{ success: boolean; data: unknown[] }>("/promos"),
    create: (data: unknown) => post("/promos", data),
    update: (id: string, data: unknown) => patch(`/promos/${id}`, data),
    delete: (id: string) => del(`/promos/${id}`),
  },

  settings: {
    get: () => get<{ success: boolean; data: { salesTaxRate: number; taxLabel: string; taxEnabled: boolean } }>("/settings"),
    update: (data: { salesTaxRate?: number; taxLabel?: string; taxEnabled?: boolean }) =>
      patch<{ success: boolean; data: { salesTaxRate: number; taxLabel: string; taxEnabled: boolean } }>("/settings", data),
  },

  claimSessions: {
    active: () => get<{ success: boolean; data: { sessions: import("./types").ClaimSession[] } }>("/claims/active"),
    getSession: (roomId: string) =>
      get<{ success: boolean; data: { roomId: string; status: string; assignedAgent: import("./types").ClaimSession["assignedAgent"]; messages: import("./types").ClaimSession["messages"] } }>(`/claims/${roomId}`),
  },

  tutorials: {
    list: () => get<{ success: boolean; data: { tutorials: import("./types").Tutorial[] } }>("/tutorials"),
    create: (data: Partial<import("./types").Tutorial>) =>
      post<{ success: boolean; data: { tutorial: import("./types").Tutorial } }>("/tutorials", data),
    update: (id: string, data: Partial<import("./types").Tutorial>) =>
      patch<{ success: boolean; data: { tutorial: import("./types").Tutorial } }>(`/tutorials/${id}`, data),
    delete: (id: string) => del(`/tutorials/${id}`),
  },

  customers: {
    list: (params?: Record<string, string>) => {
      const q = new URLSearchParams(params || {}).toString();
      return get<{ success: boolean; data: { customers: import("./types").CustomerAdmin[]; total: number; pages: number } }>(`/customers${q ? `?${q}` : ""}`);
    },
    stats: () => get<{ success: boolean; data: { total: number; active: number; newThisMonth: number; topSpenders: { _id: string; robloxUsername?: string; total: number; orders: number }[] } }>("/customers/stats"),
    get: (id: string) => get<{ success: boolean; data: { customer: import("./types").CustomerAdmin } }>(`/customers/${id}`),
    update: (id: string, data: Partial<import("./types").CustomerAdmin>) =>
      patch<{ success: boolean; data: { customer: import("./types").CustomerAdmin } }>(`/customers/${id}`, data),
  },
};

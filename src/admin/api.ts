const BASE = import.meta.env.VITE_API_URL || "";
const PANEL = `${BASE}/api/panel`;
const COLLAB_BASE = `${BASE}/api/collab`;
const STOCKER_BASE = `${BASE}/api/stocker`;

function getToken(): string | null {
  return localStorage.getItem("panel_token");
}

function getStockerToken(): string | null {
  return localStorage.getItem("stocker_token");
}

async function req<T>(
  method: string,
  path: string,
  body?: unknown,
  isFormData = false,
  baseUrl = PANEL
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData && body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

async function collabReq<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${COLLAB_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

const cget = <T>(path: string) => collabReq<T>("GET", path);
const cpost = <T>(path: string, body?: unknown) => collabReq<T>("POST", path, body);
const cpatch = <T>(path: string, body?: unknown) => collabReq<T>("PATCH", path, body);
const cdel = <T>(path: string) => collabReq<T>("DELETE", path);

const get = <T>(path: string) => req<T>("GET", path);
const post = <T>(path: string, body?: unknown) => req<T>("POST", path, body);
const patch = <T>(path: string, body?: unknown) => req<T>("PATCH", path, body);
const del = <T>(path: string, body?: unknown) => req<T>("DELETE", path, body);
const postForm = <T>(path: string, form: FormData) => req<T>("POST", path, form, true);
const patchForm = <T>(path: string, form: FormData) => req<T>("PATCH", path, form, true);

const sget = <T>(path: string) => stockerReq<T>("GET", path);
const spost = <T>(path: string, body?: unknown) => stockerReq<T>("POST", path, body);

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
    updateCommission: (id: string, commissionRate: number) =>
      patch<{ success: boolean; data: { member: import("./types").TeamMember } }>(`/team/${id}/commission`, { commissionRate }),
    remove: (id: string) => del(`/team/${id}`),
    hardDelete: (id: string) => del(`/team/${id}/hard-delete`),
    resendInvite: (id: string) => post(`/team/${id}/resend-invite`),
  },

  orders: {
    list: (params?: Record<string, string>) => {
      const q = new URLSearchParams(params || {}).toString();
      return get<{ success: boolean; data: import("./types").Order[]; total: number; pages: number }>(`/orders${q ? `?${q}` : ""}`);
    },
    get: (id: string) => get<{ success: boolean; data: { order: import("./types").Order } }>(`/orders/${id}`),
    updateStatus: (id: string, status: string, notes?: string) =>
      patch<{ success: boolean; data: { order: import("./types").Order } }>(`/orders/${id}/status`, { status, notes }),
    fulfill: (id: string, data: { trackingNumber?: string; carrier?: string; notes?: string }) =>
      post<{ success: boolean; data: { order: import("./types").Order } }>(`/orders/${id}/fulfill`, data),
    refund: (id: string, data: { amount?: number; reason?: string }) =>
      post<{ success: boolean; data: { order: import("./types").Order } }>(`/orders/${id}/refund`, data),
    addTimeline: (id: string, data: { action: string; details?: string }) =>
      post<{ success: boolean; data: { order: import("./types").Order } }>(`/orders/${id}/timeline`, data),
    updateTags: (id: string, tags: string[]) =>
      patch<{ success: boolean; data: { order: import("./types").Order } }>(`/orders/${id}/tags`, { tags }),
    bulkUpdateStatus: (ids: string[], status: string) =>
      patch<{ success: boolean }>("/orders/bulk-status", { ids, status }),
    syncStripe: () => post("/orders/sync-stripe"),
    getClaimChat: (orderId: string) =>
      get<{ success: boolean; data: any }>(`/orders/${orderId}/claim-chat`),
  },

  products: {
    list: (params?: Record<string, string>) => {
      const q = new URLSearchParams(params || {}).toString();
      return get<{ success: boolean; data: import("./types").Product[]; total: number; pages: number }>(`/products${q ? `?${q}` : ""}`);
    },
    get: (id: string) => get<{ success: boolean; data: import("./types").Product }>(`/products/${id}`),
    create: (form: FormData) => postForm<{ success: boolean; data: import("./types").Product }>("/products", form),
    update: (id: string, form: FormData) => patchForm<{ success: boolean; data: import("./types").Product }>(`/products/${id}`, form),
    partialUpdate: (id: string, data: Partial<import("./types").Product>) =>
      patch<{ success: boolean; data: import("./types").Product }>(`/products/${id}`, data),
    updateStockFields: (id: string, data: { stock?: number; onHand?: number; outOfStock?: boolean }) =>
      patch<{ success: boolean; data: import("./types").Product }>(`/products/${id}/stock-fields`, data),
    delete: (id: string) => del(`/products/${id}`),
    toggleActive: (id: string) => patch(`/products/${id}/toggle-active`),
    bulkCreate: (products: any[]) => post<{ success: boolean; data: { total: number; errors: { name: string; error: string }[] } }>("/products/bulk", { products }),
  },

  games: {
    list: () => get<{ success: boolean; data: { games: import("./types").Game[] } }>("/games"),
    get: (slug: string) => get<{ success: boolean; data: { game: import("./types").Game } }>(`/games/${slug}`),
    create: (form: FormData) => postForm<{ success: boolean; data: { game: import("./types").Game } }>("/games", form),
    update: (slug: string, form: FormData) => patchForm<{ success: boolean; data: { game: import("./types").Game } }>(`/games/${slug}`, form),
    delete: (slug: string) => del(`/games/${slug}`),
  },

  categories: {
    all: () => get<{ success: boolean; data: import("./types").Category[] }>("/categories"),
    byGame: (game: string) => get<{ success: boolean; data: { categories: import("./types").Category[] } }>(`/categories/game/${game}`),
    create: (data: { name: string; game: string; description?: string; sortOrder?: number }) =>
      post<{ success: boolean; data: { category: import("./types").Category } }>("/categories", data),
    update: (id: string, data: Partial<import("./types").Category>) =>
      patch<{ success: boolean; data: { category: import("./types").Category } }>(`/categories/${id}`, data),
    delete: (id: string) => del(`/categories/${id}`),
    addSubcategory: (id: string, data: { name: string; sortOrder?: number }) =>
      post<{ success: boolean; data: { category: import("./types").Category } }>(`/categories/${id}/subcategories`, data),
    removeSubcategory: (id: string, subId: string) =>
      del(`/categories/${id}/subcategories/${subId}`),
  },

  siteContent: {
    getAll: () => get<{ success: boolean; data: import("./types").SiteContentItem[] }>("/site-content"),
    getSection: (section: string) => get<{ success: boolean; data: import("./types").SiteContentItem[] }>(`/site-content/section/${section}`),
    update: (key: string, value: unknown) =>
      patch<{ success: boolean; data: { item: import("./types").SiteContentItem } }>(`/site-content/${key}`, { value }),
    bulkUpdate: (updates: { key: string; value: unknown }[]) =>
      post<{ success: boolean }>("/site-content/bulk-update", { updates }),
    reset: (key: string) =>
      post<{ success: boolean; data: { item: import("./types").SiteContentItem } }>(`/site-content/${key}/reset`),
  },

  proof: {
    list: (params?: Record<string, string>) => {
      const q = new URLSearchParams(params || {}).toString();
      return get<{ success: boolean; data: { proofs: import("./types").ProofOfDelivery[]; total: number; unviewedCount: number } }>(`/proof${q ? `?${q}` : ""}`);
    },
    get: (id: string) => get<{ success: boolean; data: { proof: import("./types").ProofOfDelivery } }>(`/proof/${id}`),
    addNotes: (id: string, notes: string) =>
      patch<{ success: boolean; data: { proof: import("./types").ProofOfDelivery } }>(`/proof/${id}/notes`, { notes }),
    submit: (form: FormData) =>
      postForm<{ success: boolean; data: { proof: import("./types").ProofOfDelivery } }>("/proof/submit", form),
  },

  agentStats: {
    getAll: () => get<{ success: boolean; data: { stats: import("./types").AgentStatsSummary[] } }>("/agent-stats"),
    getMe: () => get<{ success: boolean; data: { stats: import("./types").AgentStatsSummary } }>("/agent-stats/me"),
    getDetail: (id: string) => get<{ success: boolean; data: any }>(`/agent-stats/${id}`),
  },

  promos: {
    list: () => get<{ success: boolean; data: { promos: any[] } }>("/promos"),
    create: (data: any) => post<{ success: boolean; data: { promo: any } }>("/promos", data),
    update: (id: string, data: any) => patch<{ success: boolean; data: { promo: any } }>(`/promos/${id}`, data),
    delete: (id: string) => del(`/promos/${id}`),
  },

  settings: {
    get: () => get<{ success: boolean; data: { settings: any } }>("/settings"),
    update: (data: any) => patch<{ success: boolean; data: { settings: any } }>("/settings", data),
  },

  upload: {
    single: (form: FormData) => postForm<{ success: boolean; data: { url: string } }>("/upload/single", form),
    multiple: (form: FormData) => postForm<{ success: boolean; data: { urls: string[] } }>("/upload/multiple", form),
    delete: (url: string) => del<{ success: boolean }>("/upload", { url }),
  },

  tutorials: {
    list: () => get<{ success: boolean; data: { tutorials: any[] } }>("/tutorials"),
    create: (data: any) => post<{ success: boolean; data: { tutorial: any } }>("/tutorials", data),
    update: (id: string, data: any) => patch<{ success: boolean; data: { tutorial: any } }>(`/tutorials/${id}`, data),
    reorder: (ids: string[]) => patch<{ success: boolean }>("/tutorials/reorder", { ids }),
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

  stock: {
    listStockers: () =>
      get<{ success: boolean; data: { stockers: import("./types").Stocker[] } }>("/stock/stockers"),
    getStockerDetail: (id: string) =>
      get<{ success: boolean; data: { stocker: import("./types").Stocker; requests: import("./types").StockRequest[]; stats: Record<string, number> } }>(`/stock/stockers/${id}`),
    getStockerSales: (id: string) =>
      get<{ success: boolean; data: { stocker: { _id: string; name: string; email: string }; deliveries: any[]; total: number; productSummary: any[] } }>(`/stock/stockers/${id}/sales`),
    getStockerPayouts: (id: string) =>
      get<{ success: boolean; data: { stocker: import("./types").Stocker; payouts: import("./types").StockerPayout[]; unpaidAmount: number; unpaidDeliveries: any[]; unpaidDeliveryCount: number } }>(`/stock/stockers/${id}/payouts`),
    markStockerPaid: (id: string, data?: { notes?: string }) =>
      post<{ success: boolean; data: { payout: import("./types").StockerPayout } }>(`/stock/stockers/${id}/payouts/mark-paid`, data || {}),
    inviteStocker: (data: { email: string; name?: string; commissionRate?: number; games?: string[] }) =>
      post<{ success: boolean; data: { stocker: import("./types").Stocker } }>("/stock/stockers/invite", data),
    updateStocker: (id: string, data: { name?: string; status?: string; commissionRate?: number; games?: string[]; cryptoAddress?: string; cryptoNetwork?: string }) =>
      patch<{ success: boolean; data: { stocker: import("./types").Stocker } }>(`/stock/stockers/${id}`, data),
    deleteStocker: (id: string) =>
      del(`/stock/stockers/${id}`),

    listRequests: (params?: { status?: string; stocker?: string; game?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return get<{ success: boolean; data: { requests: import("./types").StockRequest[] } }>(`/stock/requests${q ? `?${q}` : ""}`);
    },
    getRequest: (id: string) =>
      get<{ success: boolean; data: { request: import("./types").StockRequest } }>(`/stock/requests/${id}`),
    approveRequest: (id: string, data: { paymentAmount?: number; adminNotes?: string }) =>
      patch<{ success: boolean; data: { request: import("./types").StockRequest } }>(`/stock/requests/${id}/approve`, data),
    markStocked: (id: string, data?: { adminNotes?: string }) =>
      patch<{ success: boolean; data: { request: import("./types").StockRequest } }>(`/stock/requests/${id}/stocked`, data || {}),
    rejectRequest: (id: string, data?: { adminNotes?: string }) =>
      patch<{ success: boolean; data: { request: import("./types").StockRequest } }>(`/stock/requests/${id}/reject`, data || {}),
  },

  stockerPanel: {
    login: (email: string, password: string) =>
      stockerReq<{ success: boolean; token: string; data: { user: import("./types").AdminUser; profile: import("./types").AdminProfile } }>("POST", "/auth/login", { email, password }),
    validateInvite: (token: string) =>
      stockerReq<{ success: boolean; data: { email: string; stockerId: string } }>("GET", `/auth/invite/${token}`),
    sendCode: (token: string) =>
      stockerReq<{ success: boolean; message: string }>("POST", `/auth/invite/${token}/send-code`),
    verifyAndActivate: (token: string, body: { code: string; password: string; displayName?: string; username?: string }) =>
      stockerReq<{ success: boolean; token: string; data: { user: import("./types").AdminUser; profile: import("./types").AdminProfile } }>("POST", `/auth/invite/${token}/verify`, body),
    me: () => sget<{ success: boolean; data: { stocker: import("./types").Stocker } }>("/auth/me"),
    getProducts: (game?: string) =>
      sget<{ success: boolean; data: { products: (import("./types").Product & { pendingClaims?: number; onHand?: number; availableForSale?: number })[] } }>(`/products${game ? `?game=${game}` : ""}`),
    getMyRequests: () =>
      sget<{ success: boolean; data: { requests: import("./types").StockRequest[] } }>("/requests"),
    submitRequest: (data: { game: string; items: { productId: string; quantity: number }[] }) =>
      spost<{ success: boolean; data: { request: import("./types").StockRequest } }>("/requests", data),
    getMyStats: () =>
      sget<{ success: boolean; data: { stats: Record<string, number>; recentRequests: import("./types").StockRequest[]; productBreakdown: { productName: string; quantityStocked: number; totalValue: number; game?: string; imageUrl?: string }[] } }>("/stats"),
    getSoldDeliveries: () =>
      sget<{ success: boolean; data: { deliveries: { roomId: string; robloxUsername: string; game?: string; orderRef?: string; agentName: string; deliveredAt: string; items: { name: string; quantity: number; productName?: string; imageUrl?: string; game?: string }[] }[]; total: number } }>("/sold-deliveries"),
    getMyPayouts: () =>
      sget<{ success: boolean; data: { stocker: any; payouts: import("./types").StockerPayout[]; unpaidAmount: number; unpaidDeliveries: any[]; totalPaid: number } }>("/payouts"),
  },

  claimSessions: {
    getAgentQueue: () =>
      get<{ success: boolean; data: { pending: any[]; mine: any[]; completed: any[]; closed: any[] } }>("/claims/queue"),
    active: () =>
      get<{ success: boolean; data: { sessions: any[] } }>("/claims/active"),
    getSession: (roomId: string) =>
      get<{ success: boolean; data: { session: any; messages: any[] } }>(`/claims/${roomId}`),
    getFullSession: (roomId: string) =>
      get<{ success: boolean; data: { session: any } }>(`/claims/${roomId}/full`),
  },

  collab: {
    listCollaborators: () =>
      cget<any>(""),
    getCollaborator: (id: string) =>
      cget<any>(`/${id}`),
    invite: (name: string, email: string) =>
      cpost<any>("/invite", { name, email }),
    inviteCollaborator: (name: string, email: string) =>
      cpost<any>("/invite", { name, email }),
    updateCollaborator: (id: string, data: any) =>
      cpatch<any>(`/${id}`, data),
    delete: (id: string) =>
      cdel(`/${id}`),
    deleteCollaborator: (id: string) =>
      cdel(`/${id}`),
    getAvailableProducts: (id: string) =>
      cget<any>(`/${id}/available-products`),
    addProduct: (id: string, productId: string, cut: number) =>
      cpost<any>(`/${id}/products`, { productId, cut }),
    updateProduct: (id: string, cpId: string, cut: number) =>
      cpatch<any>(`/${id}/products/${cpId}`, { cut }),
    removeProduct: (id: string, cpId: string) =>
      cdel(`/${id}/products/${cpId}`),
    getCollaboratorPayouts: (id: string) =>
      cget<any>(`/${id}/payouts`),
    markPaid: (id: string) =>
      cpost<any>(`/${id}/payouts/mark-paid`, {}),
    listAllPayouts: () =>
      cget<any>("/payouts"),
  },

  socials: {
    list: (params?: { status?: string; platform?: string }) => {
      const q = params ? new URLSearchParams(params as Record<string, string>).toString() : "";
      return get<any>(`/socials${q ? `?${q}` : ""}`);
    },
    listCreators: () => get<any>("/socials/creators"),
    getCreator: (collabId: string) => get<any>(`/socials/creators/${collabId}`),
    setRate: (id: string, data: { rateType: "per_view" | "auto"; ratePerView?: number; offeredAmount?: number; adminNote?: string }) =>
      patch<any>(`/socials/${id}/rate`, data),
    markPaid: (collabId: string) => post<any>(`/socials/creators/${collabId}/mark-paid`),
    inviteCreator: (name: string, email: string) =>
      cpost<any>("/invite", { name, email, inviteType: "social" }),
  },
};

function stockerReq<T>(method: string, path: string, body?: unknown, isFormData = false): Promise<T> {
  const token = getStockerToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData && body) headers["Content-Type"] = "application/json";

  return fetch(`${STOCKER_BASE}${path}`, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  }).then(async res => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  });
}

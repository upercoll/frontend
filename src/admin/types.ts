export interface AdminUser {
  id: string;
  email: string;
  type: "owner" | "team_member";
  isOwner: boolean;
  permissions: string[];
  claimGames?: string[];
  role?: AdminRole;
}

export interface AdminProfile {
  _id: string;
  memberId: string;
  memberType: "User" | "TeamMember";
  isOwner: boolean;
  displayName: string;
  username: string;
  profilePicture?: string;
  bio?: string;
  profileComplete: boolean;
  timezone: string;
  notifications: {
    newOrders: boolean;
    newClaims: boolean;
    teamUpdates: boolean;
  };
}

export interface AdminRole {
  _id: string;
  name: string;
  description?: string;
  color: string;
  permissions: string[];
  memberCount?: number;
  createdAt: string;
}

export interface TeamMember {
  _id: string;
  email: string;
  role: AdminRole;
  status: "invited" | "active" | "disabled";
  claimGames: string[];
  claimCategories?: string[];
  active: boolean;
  lastLogin?: string;
  createdAt: string;
  profile?: AdminProfile;
  stats?: AgentStatsSummary;
  commissionRate?: number;
}

export interface AgentStatsSummary {
  totalClaims: number;
  completedClaims: number;
  declinedClaims?: number;
  timedOutClaims?: number;
  avgResponseTimeMs?: number;
  totalOnlineMs?: number;
  isOnline: boolean;
  lastSeen?: string;
  gamesHandled?: string[];
  completionRate: number;
  rating?: { total: number; count: number; average: number };
  monthlyStats?: { month: string; year: number; claims: number; completed: number }[];
}

export interface Game {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  imagePublicId?: string;
  bannerUrl?: string;
  gradient: { from: string; to: string };
  active: boolean;
  featured: boolean;
  sortOrder: number;
  claimTeam?: string;
  productCount?: number;
  categoryCount?: number;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  game: string;
  icon?: string;
  subcategories: { _id: string; name: string; slug: string }[];
  active: boolean;
  sortOrder: number;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  game: string;
  category: { _id: string; name: string; slug: string };
  subcategory?: string;
  price: number;
  originalPrice?: number;
  gradient: { from: string; to: string };
  imageUrl?: string;
  images?: string[];
  stock: number;
  outOfStock: boolean;
  featured: boolean;
  bestSeller: boolean;
  tags: string[];
  active: boolean;
  salesCount: number;
  createdAt: string;
}

export interface Tutorial {
  _id: string;
  game: string;
  title: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  gradient?: { from: string; to: string };
  sortOrder: number;
  active: boolean;
  createdAt: string;
}

export interface CustomerAdmin {
  _id: string;
  email: string;
  displayName: string;
  robloxUsername?: string;
  active?: boolean;
  orderCount?: number;
  totalSpent?: number;
  createdAt: string;
}

export interface TimelineEvent {
  action: string;
  by: string;
  details?: string;
  timestamp: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    email: string;
    robloxUsername: string;
    shippingAddress?: {
      line1?: string; line2?: string; city?: string; state?: string; postalCode?: string; country?: string;
    };
    billingAddress?: {
      name?: string; line1?: string; line2?: string; city?: string; state?: string; postalCode?: string; country?: string;
    };
  };
  items: {
    product?: string;
    productSnapshot: { name: string; price: number; game: string; imageUrl?: string; gradient?: { from: string; to: string } };
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  pricing: { subtotal: number; discount: number; discountPercent?: number; promoCode?: string; total: number };
  payment: { method: string; status: string; paidAt?: string; failureReason?: string };
  delivery: { status: string; deliveredAt?: string; trackingNumber?: string; carrier?: string; notes?: string };
  status: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
  fulfillmentStatus?: "unfulfilled" | "partial" | "fulfilled";
  fulfilledAt?: string;
  fulfilledBy?: string;
  adminNotes?: string;
  notes?: string;
  tags?: string[];
  timeline?: TimelineEvent[];
  source?: string;
  riskLevel?: "low" | "medium" | "high";
  customerOrderCount?: number;
  createdAt: string;
  claimSession?: ClaimSession;
}

export interface ClaimSession {
  _id: string;
  roomId: string;
  robloxUsername: string;
  contactEmail: string;
  orderRef?: string;
  game?: string;
  itemName?: string;
  items: { name: string; quantity: number }[];
  status: "pending" | "active" | "claimed" | "ended";
  assignedAgent?: { userId: string; name: string; joinedAt: string };
  messages: ClaimMessage[];
  createdAt: string;
  resolvedAt?: string;
}

export interface ClaimMessage {
  _id: string;
  sender: "customer" | "agent" | "system";
  text: string;
  senderName: string;
  timestamp: string;
}

export interface ProofOfDelivery {
  _id: string;
  claimSessionId: string;
  roomId: string;
  orderRef?: string;
  agentId: { _id: string; email: string } | string;
  agentName: string;
  proofImageUrl: string;
  estimatedDelivery: string;
  notes?: string;
  customerEmail?: string;
  robloxUsername?: string;
  game?: string;
  viewedByOwner: boolean;
  viewedAt?: string;
  ownerNotes?: string;
  createdAt: string;
}

export interface SiteContentItem {
  _id: string;
  key: string;
  section: string;
  label: string;
  type: "text" | "richtext" | "image" | "json" | "boolean" | "number" | "color";
  value: unknown;
  defaultValue?: unknown;
  lastEditedBy?: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueGrowth: number;
  ordersToday: number;
  ordersThisMonth: number;
  totalOrders: number;
  pendingClaims: number;
  activeClaims: number;
  totalProducts: number;
  totalCustomers: number;
  onlineAgents: number;
}

export interface RevenueChartPoint {
  month?: string;
  date?: string;
  label?: string;
  revenue: number;
  orders: number;
}

export const ALL_PERMISSIONS: { key: string; label: string; description: string; group: string }[] = [
  { key: "view_analytics", label: "View Analytics", description: "Access the analytics dashboard", group: "Analytics" },
  { key: "manage_games", label: "Manage Games", description: "Add, edit, and remove games", group: "Content" },
  { key: "manage_categories", label: "Manage Categories", description: "Add, edit, and remove categories", group: "Content" },
  { key: "manage_products", label: "Manage Products", description: "Add, edit, and remove products", group: "Content" },
  { key: "edit_site_content", label: "Edit Site Content", description: "Edit homepage and site text", group: "Content" },
  { key: "upload_images", label: "Upload Images", description: "Upload images to the media library", group: "Content" },
  { key: "manage_orders", label: "Manage Orders", description: "View and update orders", group: "Operations" },
  { key: "manage_claims", label: "Manage Claims", description: "View all claim sessions", group: "Operations" },
  { key: "claim_agent", label: "Claim Agent", description: "Answer and handle claim chats", group: "Operations" },
  { key: "view_pod", label: "View Proof of Delivery", description: "View proof of delivery submissions", group: "Operations" },
  { key: "manage_promos", label: "Manage Promos", description: "Create and manage promo codes", group: "Marketing" },
  { key: "manage_team", label: "Manage Team", description: "Invite and manage team members", group: "Team" },
  { key: "manage_roles", label: "Manage Roles", description: "Create and edit permission roles", group: "Team" },
  { key: "monitor_agents", label: "Monitor Agents", description: "View agent statistics and activity", group: "Team" },
  { key: "manage_collaborators", label: "Manage Collaborators", description: "Manage collaborator accounts and products", group: "Team" },
];

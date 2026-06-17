export interface AdminUser {
  id: string;
  _id?: string;
  email: string;
  name?: string;
  type: "owner" | "team_member" | "stocker";
  isOwner: boolean;
  isStocker?: boolean;
  permissions: string[];
  claimGames?: string[];
  role?: AdminRole;
  games?: string[];
  commissionRate?: number;
}

export interface AdminProfile {
  _id: string;
  memberId: string;
  memberType: "User" | "TeamMember" | "Stocker";
  displayName?: string;
  username?: string;
  bio?: string;
  profilePicture?: string;
  profileComplete: boolean;
  isOwner?: boolean;
  createdAt?: string;
}

export interface AdminRole {
  _id: string;
  name: string;
  description?: string;
  color: string;
  permissions: string[];
  memberCount?: number;
  createdAt?: string;
}

export interface TeamMember {
  _id: string;
  email: string;
  status: "invited" | "active" | "disabled";
  role: AdminRole;
  claimGames: string[];
  commissionRate?: number;
  active: boolean;
  profile?: {
    displayName?: string;
    username?: string;
    profilePicture?: string;
  };
  stats?: {
    isOnline: boolean;
    completedClaims: number;
    activeClaims: number;
    avgResponseTime?: number;
  };
  createdAt: string;
}

export interface TimelineEvent {
  action: string;
  by: string;
  details?: string;
  timestamp: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  game: string;
  description?: string;
  sortOrder: number;
  subcategories: { _id: string; name: string; slug: string; sortOrder: number }[];
}

export interface Game {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  gradient: { from: string; to: string };
  active: boolean;
  featured: boolean;
  sortOrder: number;
  categories?: Category[];
  productCount?: number;
  categoryCount?: number;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  originalPrice?: number;
  game: string;
  category?: Category | string;
  imageUrl?: string;
  images?: string[];
  gradient?: { from: string; to: string };
  features?: string[];
  stock: number;
  outOfStock: boolean;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string;
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
  fulfillmentStatus?: "pending" | "partial" | "completed";
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
  orderDetails?: {
    items: Order["items"];
    pricing: Order["pricing"];
    status: string;
  };
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

export interface Stocker {
  _id: string;
  email: string;
  name: string;
  status: "invited" | "active" | "disabled";
  commissionRate: number;
  games: string[];
  lastLogin?: string;
  totalStocked: number;
  totalRevenue: number;
  totalCommission: number;
  requestCount?: number;
  stockedCount?: number;
  createdAt: string;
}

export interface StockRequestItem {
  product?: string;
  productName: string;
  productSlug?: string;
  game?: string;
  imageUrl?: string;
  gradient?: { from: string; to: string };
  quantity: number;
  salePrice: number;
  totalSaleValue: number;
}

export interface StockRequest {
  _id: string;
  stocker: Stocker | string;
  stockerName: string;
  stockerEmail: string;
  game: string;
  items: StockRequestItem[];
  totalSaleValue: number;
  status: "pending" | "approved" | "stocked" | "rejected";
  adminNotes?: string;
  paymentAmount: number;
  paymentSent: boolean;
  commission: number;
  commissionRate: number;
  approvedAt?: string;
  stockedAt?: string;
  rejectedAt?: string;
  stockedBy?: string;
  createdAt: string;
}

export const ALL_PERMISSIONS: { key: string; label: string; description: string; group: string }[] = [
  { key: "view_analytics", label: "View Analytics", description: "Access the analytics dashboard", group: "Analytics" },

  { key: "view_products", label: "View Products", description: "View the product catalog", group: "Products" },
  { key: "create_products", label: "Add Products", description: "Create new products", group: "Products" },
  { key: "edit_products", label: "Edit Products", description: "Modify existing products", group: "Products" },
  { key: "delete_products", label: "Delete Products", description: "Remove products from the catalog", group: "Products" },

  { key: "view_orders", label: "View Orders", description: "See the orders list and details", group: "Orders" },
  { key: "update_order_status", label: "Update Order Status", description: "Change order status (e.g. paid, delivering)", group: "Orders" },
  { key: "fulfill_orders", label: "Mark as Delivered", description: "Mark orders as completed/delivered", group: "Orders" },
  { key: "refund_orders", label: "Refund Orders", description: "Issue refunds on orders", group: "Orders" },

  { key: "view_games", label: "View Games", description: "See the games list", group: "Games" },
  { key: "create_games", label: "Add Games", description: "Create new games", group: "Games" },
  { key: "edit_games", label: "Edit Games", description: "Modify existing games", group: "Games" },
  { key: "delete_games", label: "Delete Games", description: "Remove games", group: "Games" },
  { key: "manage_categories", label: "Manage Categories", description: "Add, edit, and remove categories", group: "Games" },

  { key: "edit_site_content", label: "Edit Site Content", description: "Edit homepage and site text", group: "Content" },
  { key: "upload_images", label: "Upload Images", description: "Upload images to the media library", group: "Content" },

  { key: "manage_promos", label: "Manage Promos", description: "Create and manage promo codes", group: "Marketing" },

  { key: "view_claims", label: "View Claims", description: "View all claim sessions", group: "Claims" },
  { key: "claim_agent", label: "Claim Agent", description: "Answer and handle claim chats", group: "Claims" },
  { key: "monitor_agents", label: "Monitor Agents", description: "View agent statistics and activity", group: "Claims" },
  { key: "view_pod", label: "View Proof of Delivery", description: "View proof of delivery submissions", group: "Claims" },

  { key: "view_team", label: "View Team", description: "See team members list", group: "Team" },
  { key: "invite_team", label: "Invite Members", description: "Invite new team members", group: "Team" },
  { key: "edit_team", label: "Edit Members", description: "Update team member roles and assignments", group: "Team" },
  { key: "remove_team", label: "Remove Members", description: "Remove or disable team members", group: "Team" },
  { key: "manage_roles", label: "Manage Roles", description: "Create and edit permission roles", group: "Team" },
  { key: "manage_collaborators", label: "Manage Collaborators", description: "Manage collaborator accounts and products", group: "Team" },

  { key: "view_stock", label: "View Stock", description: "View stock requests and stocker tracking", group: "Stock" },
  { key: "manage_stock", label: "Manage Stock", description: "Approve, reject, and mark stock requests as stocked", group: "Stock" },
  { key: "manage_stockers", label: "Manage Stockers", description: "Invite and manage stocker accounts", group: "Stock" },
];

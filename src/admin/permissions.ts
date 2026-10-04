import { ALL_PERMISSIONS } from "./types";

/**
 * What each permission actually unlocks in the panel.
 *
 * Roles used to be a wall of abstract checkboxes, so the owner had no way to
 * answer "if I tick this, what can they actually reach?" This maps every
 * permission to the pages/behaviours it grants, and is rendered inline in the
 * role editor.
 */
export const PERMISSION_UNLOCKS: Record<string, string[]> = {
  view_analytics: ["Dashboard", "Analytics"],
  view_products: ["Products"],
  create_products: ["Add products"],
  edit_products: ["Edit products"],
  delete_products: ["Delete products"],
  manage_products: ["Everything in Products"],
  view_orders: ["Orders"],
  update_order_status: ["Change order status"],
  fulfill_orders: ["Mark orders fulfilled"],
  refund_orders: ["Issue refunds (real money)"],
  manage_orders: ["Everything in Orders"],
  view_games: ["Games & Categories"],
  create_games: ["Add games"],
  edit_games: ["Edit games"],
  delete_games: ["Delete games"],
  manage_games: ["Everything in Games"],
  manage_categories: ["Add / edit / delete categories"],
  edit_site_content: ["Site Content", "Tutorials"],
  upload_images: ["Upload & delete images"],
  manage_promos: ["Promo Codes"],
  view_claims: ["Claim Queue (read)"],
  claim_agent: ["Chat with customers", "Submit proof of delivery"],
  monitor_agents: ["Agent Monitor", "Open Chats", "Any claim session"],
  view_pod: ["Proof of Delivery"],
  manage_claims: ["Claim administration"],
  manage_pod: ["Add internal notes to proof of delivery"],
  delete_claims: ["Delete claim sessions", "Bulk-clear claim history"],
  view_team: ["Team"],
  invite_team: ["Invite team members"],
  edit_team: ["Edit team members"],
  remove_team: ["Remove / hard-delete team members"],
  manage_roles: ["Roles & Permissions", "Role View"],
  manage_collaborators: ["Collaborators & payouts"],
  manage_team: ["Everything in Team"],
  delete_deliverers: ["Delete delivery team accounts"],
  view_deliverers: ["Delivery Team"],
  manage_deliverers: ["Mark deliveries paid", "Delivery Team"],
  view_stock: ["Stock Requests", "Stocker Tracking"],
  manage_stock: ["Approve / reject / mark stock requests"],
  manage_stockers: ["Stocker accounts & payouts"],
  delete_stockers: ["Delete stocker accounts"],
  view_socials: ["Videos", "Creators & Payments"],
  manage_socials: ["Review submissions", "Set creator rates", "Mark payouts paid"],
  view_tickets: ["Support Tickets"],
  manage_tickets: ["Assign, retag, reprioritise tickets"],
  ticket_agent: ["Reply to and resolve tickets"],
  view_customers: ["Customers"],
  manage_customers: ["Edit customer records"],
  delete_customers: ["Delete customer records"],
  view_settings: ["Settings"],
  manage_settings: ["Change site settings", "Reset site content to defaults"],
  view_site_modes: ["Site Modes"],
  manage_site_modes: ["Turn seasonal modes on/off"],
  view_commissions: ["Stocker & team commission reports"],
  manage_commissions: ["Set team commission rates"],
  view_announcements: ["Announcements (read)"],
  manage_announcements: ["Create & publish the customer popup"],
  send_broadcasts: ["Email every registered customer"],
};

/**
 * Broad keys that already imply their granular siblings. Ticking a broad one
 * makes the granular ticks pointless, so the grid shows them as "implied"
 * instead of letting the owner grant redundant pairs by accident.
 */
export const IMPLIED_BY: Record<string, string[]> = {
  manage_products: ["view_products", "create_products", "edit_products", "delete_products"],
  manage_orders: ["view_orders", "update_order_status", "fulfill_orders", "refund_orders"],
  manage_games: ["view_games", "create_games", "edit_games", "delete_games"],
  manage_claims: ["view_claims", "claim_agent", "monitor_agents", "view_pod"],
  manage_team: ["view_team", "invite_team", "edit_team", "remove_team", "manage_roles"],
  manage_stock: ["view_stock"],
};

/** Preset roles so the common cases are one click, not 20 ticks. */
export interface PermissionPreset {
  id: string;
  label: string;
  blurb: string;
  permissions: string[];
}

const K = (...keys: string[]) => keys;

export const PERMISSION_PRESETS: PermissionPreset[] = [
  {
    id: "viewer",
    label: "Read-only",
    blurb: "Can see the dashboard, orders, products and analytics. Cannot change anything.",
    permissions: K("view_analytics", "view_products", "view_orders", "view_games"),
  },
  {
    id: "support",
    label: "Support agent",
    blurb: "Handles chats, tickets and proof of delivery for their assigned games.",
    permissions: K("claim_agent", "ticket_agent", "view_tickets", "view_pod", "view_claims", "view_products", "view_orders", "view_analytics"),
  },
  {
    id: "content",
    label: "Content editor",
    blurb: "Runs the storefront copy, tutorials, images and announcements.",
    permissions: K("edit_site_content", "upload_images", "view_announcements", "manage_announcements", "view_games", "view_products"),
  },
  {
    id: "ops",
    label: "Store manager",
    blurb: "Full day-to-day control: orders, refunds, products, promos, claims and customers.",
    permissions: K(
      "manage_products", "manage_orders", "manage_games", "manage_categories", "manage_promos",
      "manage_claims", "manage_pod", "view_customers", "manage_customers",
      "view_analytics", "view_deliverers", "manage_deliverers", "view_stock", "manage_stock",
      "view_socials", "manage_socials", "view_announcements", "manage_announcements", "view_commissions"
    ),
  },
  {
    id: "full",
    label: "Everything",
    blurb: "Every permission in the panel, including destructive deletes and broadcast email.",
    permissions: ALL_PERMISSIONS.map((p) => p.key),
  },
];

/** Permissions that destroy data or move real money — surfaced separately. */
export const SENSITIVE_PERMISSIONS: Record<string, string> = {
  refund_orders: "issues real refunds",
  delete_customers: "deletes customer records",
  delete_claims: "deletes claim history",
  delete_deliverers: "deletes delivery accounts",
  delete_stockers: "deletes stocker accounts",
  send_broadcasts: "emails every customer",
  manage_roles: "can grant any permission",
  manage_settings: "changes site-wide settings",
};
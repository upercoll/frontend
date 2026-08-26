/* ════════════════════════════════════════════════════════════
   DEMO MODE — offline mock API so every page is browsable
   without a backend. Activated via ?demo=1 or VITE_DEMO=1.
   Never active in production builds unless explicitly enabled.
════════════════════════════════════════════════════════════ */

const NAVY = "#0E1A3C";
const ROYAL = "#2B50F6";
const GOLD = "#FFC53D";

function j(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
const ok = (data: unknown) => j({ success: true, data });
const okPlain = () => j({ success: true });

/* ── deterministic pseudo-random ── */
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

const GAMES = [
  { _id: "g1", name: "Murder Mystery 2",        slug: "murder-mystery-2",        gradient: { from: "#7C5CFF", to: NAVY } },
  { _id: "g2", name: "Blade Ball",              slug: "blade-ball",               gradient: { from: ROYAL, to: "#131F4D" } },
  { _id: "g3", name: "Grow A Garden 2",         slug: "grow-a-garden-2",          gradient: { from: "#22C55E", to: "#0E9F6E" } },
  { _id: "g4", name: "Steal A Brainrot",        slug: "steal-a-brainrot",         gradient: { from: "#FF9D2E", to: "#E2231A" } },
  { _id: "g5", name: "Blox Fruits",             slug: "blox-fruits",              gradient: { from: GOLD, to: "#FF8A1E" } },
  { _id: "g6", name: "Garden Tower Defense",    slug: "garden-tower-defense",     gradient: { from: "#16A34A", to: "#14532D" } },
  { _id: "g7", name: "99 Nights In The Forest", slug: "99-nights-in-the-forest",  gradient: { from: "#334E85", to: "#101A44" } },
  { _id: "g8", name: "Dress To Impress",        slug: "dress-to-impress",         gradient: { from: "#FF6B9D", to: "#BE185D" } },
  { _id: "g9", name: "Pet Simulator 99",        slug: "pet-simulator-99",         gradient: { from: "#22D3EE", to: ROYAL } },
];

const CATEGORIES: Record<string, { _id: string; name: string; icon?: string }[]> = {
  default: [
    { _id: "c1", name: "Common", icon: "package" },
    { _id: "c2", name: "Rare", icon: "gem" },
    { _id: "c3", name: "Legendary", icon: "flame" },
    { _id: "c4", name: "Bundles", icon: "gift" },
  ],
  "grow-a-garden-2": [
    { _id: "c1", name: "Seeds", icon: "sprout" },
    { _id: "c2", name: "Gears", icon: "wrench" },
    { _id: "c3", name: "Pets", icon: "pawprint" },
    { _id: "c4", name: "Bundles", icon: "gift" },
  ],
  "murder-mystery-2": [
    { _id: "c1", name: "Knives", icon: "sword" },
    { _id: "c2", name: "Guns", icon: "target" },
    { _id: "c3", name: "Godly", icon: "flame" },
    { _id: "c4", name: "Ancient", icon: "gem" },
  ],
};

const NAME_POOL: Record<string, string[]> = {
  default: ["Starter Pack", "Golden Crate", "Mystery Box", "Skin Bundle", "Booster Kit", "Elite Pass", "Coin Bag ×1000", "Limited Item"],
  "murder-mystery-2": ["Batwing", "Harvester", "Nik's Scythe", "Icewing", "Chroma Luger", "Seer", "Luger", "Ghost Blade"],
  "grow-a-garden-2": ["Carrot ×100", "Super Sprinkler", "Raccoon Pet", "Dragon Fruit Seed", "Master Watering Can", "Golden Egg", "Beanstalk Starter", "Bee Swarm Pack"],
  "blade-ball": ["Bat Bat", "Fire Fang", "Leviathan Shield", "Thunder Aura", "Vanguard Sword", "Neon Scythe"],
};

const PALETTES: [string, string][] = [
  ["#7C5CFF", "#16204D"], ["#2B50F6", "#131F4D"], ["#FFC53D", "#FF8A1E"],
  ["#22C55E", "#15803D"], ["#FF6B9D", "#BE185D"], ["#22D3EE", "#2563EB"],
  ["#FF9D2E", "#DC2626"], ["#93A8FF", "#5A78FF"],
];

interface DemoProduct {
  _id: string; name: string; slug: string; description: string; game: string;
  category: { _id: string; name: string };
  price: number; originalPrice?: number;
  gradient: { from: string; to: string };
  stock: number; onHand?: number;
  featured: boolean; bestSeller: boolean;
  features?: string[]; tags?: string[];
  images?: string[];
}

const productCache = new Map<string, DemoProduct[]>();

function productsForGame(slug: string): DemoProduct[] {
  const cached = productCache.get(slug);
  if (cached) return cached;
  const rnd = seeded(slug);
  const game = GAMES.find(g => g.slug === slug);
  const cats = CATEGORIES[slug] || CATEGORIES.default;
  const names = NAME_POOL[slug] || NAME_POOL.default;
  const count = 10 + Math.floor(rnd() * 4);
  const out: DemoProduct[] = [];
  for (let i = 0; i < count; i++) {
    const pal = PALETTES[Math.floor(rnd() * PALETTES.length)];
    const price = Math.round((1.5 + rnd() * 45) * 100) / 100;
    const hasSale = rnd() > 0.65;
    const cat = cats[i % cats.length];
    out.push({
      _id: `${slug}-p${i + 1}`,
      name: names[i % names.length] + (i >= names.length ? ` ${["II", "III", "IV", "X"][i % 4]}` : ""),
      slug: `${slug}-item-${i + 1}`,
      description: "Instantly delivered to your Roblox account by our claim team. 100% legit, thousands of happy customers.",
      game: slug,
      category: { _id: cat._id, name: cat.name },
      price,
      originalPrice: hasSale ? Math.round(price * 1.35 * 100) / 100 : undefined,
      gradient: { from: pal[0], to: pal[1] },
      stock: i === 2 ? 0 : 5 + Math.floor(rnd() * 40),
      onHand: i === 2 ? 0 : 20,
      featured: i < 3,
      bestSeller: i >= 3 && i < 6,
      features: ["Instant delivery", "24/7 support", "Refund guarantee"],
      tags: [cat.name.toLowerCase(), "fast delivery"],
      images: [],
    });
  }
  productCache.set(slug, out);
  void game;
  return out;
}

function findProduct(id: string): DemoProduct | undefined {
  for (const g of GAMES) {
    const p = productsForGame(g.slug).find(x => x._id === id);
    if (p) return p;
  }
  return undefined;
}

let demoOrderCounter = 4821;
function makeOrder(overrides: Record<string, unknown> = {}) {
  const n = demoOrderCounter++;
  const statuses = ["completed", "completed", "delivering", "paid", "pending", "cancelled"];
  const games = GAMES[Math.floor(Math.random() * GAMES.length)];
  return {
    _id: `o${n}`,
    orderNumber: `RB-${10530 + n}`,
    customer: {
      robloxUsername: ["bloxfan42", "ninja_gamer", "starseeker", "xXDarkXx", "pixelkid", "moonracer"][n % 6],
      email: "player@example.com",
    },
    items: [{ id: "demo", name: "Demo Item", quantity: 1 }],
    pricing: { total: Math.round((4 + Math.random() * 60) * 100) / 100 },
    status: statuses[n % statuses.length],
    createdAt: new Date(Date.now() - (n % 9) * 86400000).toISOString(),
    game: games.slug,
    ...overrides,
  };
}

export function installDemoFetch() {
  const origFetch = window.fetch.bind(window);

  const handler = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    let path = url;
    try { path = new URL(url, window.location.origin).pathname + new URL(url, window.location.origin).search; } catch {}
    const method = (init?.method || "GET").toUpperCase();

    // only intercept same-origin /api calls
    if (!path.startsWith("/api")) return origFetch(input as RequestInfo, init);

    /* ── storefront ── */
    if (path.startsWith("/api/games?") || path === "/api/games")
      return ok({ games: GAMES.map(g => ({ ...g, active: true, productCount: productsForGame(g.slug).length })) });

    const gm = path.match(/^\/api\/games\/([a-z0-9-]+)$/);
    if (gm) {
      const g = GAMES.find(x => x.slug === gm[1]);
      if (g) return ok({ game: g });
      return j({ success: false }, 404);
    }

    if (path.startsWith("/api/categories/game/"))
      return ok(CATEGORIES[path.split("/").pop() as string] || CATEGORIES.default);

    const pg = path.match(/^\/api\/products\/game\/([a-z0-9-]+)/);
    if (pg) {
      const all = productsForGame(pg[1]);
      return ok(all.slice(0, 200));
    }

    const pr = path.match(/^\/api\/products\/([^/]+)\/related/);
    if (pr) {
      const p = findProduct(pr[1]);
      const sib = p ? productsForGame(p.game).filter(x => x._id !== p._id) : [];
      return ok(sib.slice(0, 8));
    }

    const pd = path.match(/^\/api\/products\/([^/]+)$/);
    if (pd) {
      const p = findProduct(pd[1]);
      if (p) return ok(p);
      return j({ success: false, message: "Not found" }, 404);
    }

    if (path.startsWith("/api/socials/featured-youtubers"))
      return ok({ creators: [
        { _id: "y1", name: "KreekCraft", username: "@kreek", subscribers: 6200000, channelUrl: "#" },
        { _id: "y2", name: "Flamingo", username: "@flamingo", subscribers: 12100000, channelUrl: "#" },
        { _id: "y3", name: "Ant", username: "@ant", subscribers: 4300000, channelUrl: "#" },
        { _id: "y4", name: "Tofuu", username: "@tofuu", subscribers: 2800000, channelUrl: "#" },
        { _id: "y5", name: "Russo", username: "@russo", subscribers: 3100000, channelUrl: "#" },
        { _id: "y6", name: "Sketch", username: "@sketch", subscribers: 2400000, channelUrl: "#" },
      ]});

    if (path.startsWith("/api/claims/public-reviews"))
      return ok({
        reviews: [
          { name: "Dawn Hughes", rating: 5, comment: "Prices way cheaper than every other store I tried. Joined the server and got my items instantly. Support replied within a minute!", submittedAt: new Date(Date.now() - 76 * 86400000).toISOString() },
          { name: "Max Rivera", rating: 5, comment: "Super fast delivery! Got my items within minutes. The team was helpful when I had a question about trading.", submittedAt: new Date(Date.now() - 14 * 86400000).toISOString() },
          { name: "Sara K", rating: 5, comment: "Best place to buy Roblox items hands down. Trusted sellers, fair prices, smooth from start to finish.", submittedAt: new Date(Date.now() - 31 * 86400000).toISOString() },
          { name: "Leo M", rating: 5, comment: "Was skeptical but completely legit. Will definitely buy again.", submittedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
          { name: "Ash P", rating: 4, comment: "Great selection and fair prices. Delivery took a bit longer than expected once but support sorted it fast.", submittedAt: new Date(Date.now() - 52 * 86400000).toISOString() },
          { name: "Kim W", rating: 5, comment: "Idiot proof honestly. Join server, get items, done. 10/10.", submittedAt: new Date(Date.now() - 9 * 86400000).toISOString() },
        ],
        averageRating: 4.9,
      });

    if (path === "/api/promo/validate" && method === "POST")
      return ok({ code: "RBSTARS10", discountType: "percent", discountValue: 10 });

    /* ── customer auth ── */
    if (path === "/api/customer-auth/login" || path === "/api/customer-auth/register")
      return j({ success: true, token: "demo-cust-token", requiresVerification: false, customer: {
        _id: "cust1", email: "demo@rbstars.fun", displayName: "DemoPlayer",
        robloxUsername: "DemoPlayer", robloxAvatarUrl: null, emailVerified: true,
      }});
    if (path === "/api/customer-auth/me")
      return j({ success: true, customer: {
        _id: "cust1", email: "demo@rbstars.fun", displayName: "DemoPlayer",
        robloxUsername: "DemoPlayer", robloxAvatarUrl: null, emailVerified: true,
      }});
    if (path.includes("customer-auth")) return okPlain();

    /* ── claims / auto delivery ── */
    if (path === "/api/claims/auto" && method === "POST") {
      try {
        const body = JSON.parse((init?.body as string) || "{}");
        return ok({
          roomId: "demo-room-1", status: "pending", mode: "auto",
          items: [{ name: "Carrot ×100", quantity: 1, category: "Seeds" }],
          game: body.game || "grow-a-garden-2", orderRef: body.orderRef || "RB-DEMO-1",
        });
      } catch { return okPlain(); }
    }
    if (path.includes("/api/claims/") && path.endsWith("/status"))
      return ok({ status: "claimed", orderRef: "RB-DEMO-1" });
    if (path.startsWith("/api/claims")) return ok(Array.isArray([]) ? [] : {});

    /* ── panel (admin) ── */
    if (path.startsWith("/api/panel")) {
      if (path === "/api/panel/auth/owner-login" || path === "/api/panel/auth/member-login") {
        const member = path.includes("member");
        return j({ success: true, token: "demo-panel-token", data: {
          user: { _id: "u1", email: "demo@rbstars.fun", isOwner: !member, type: member ? "team_member" : "owner", role: { name: member ? "Agent" : "Owner" } },
          profile: { displayName: "Demo Owner", profileComplete: true },
          ...(member ? { role: { _id: "r1", name: "Agent", color: ROYAL }, permissions: [], claimGames: [] } : {}),
          profileComplete: true,
        }});
      }
      if (path === "/api/panel/auth/me")
        return j({ success: true, data: {
          user: { _id: "u1", email: "demo@rbstars.fun", isOwner: true, type: "owner", role: { name: "Owner" } },
          profile: { displayName: "Demo Owner", profileComplete: true },
        }});
      if (path === "/api/panel/analytics/dashboard")
        return ok({
          stats: {
            totalRevenue: 48250.75, revenueThisMonth: 12480.5, ordersToday: 37,
            totalOrders: 1284, pendingClaims: 6, onlineAgents: 4,
            totalProducts: 342, totalCustomers: 2961,
            ordersThisMonth: 212, revenueGrowth: 12.4,
          },
          recentOrders: Array.from({ length: 8 }, (_, i) => makeOrder({ _id: `ro${i}` })),
        });
      if (path.startsWith("/api/panel/analytics/revenue"))
        return ok({ period: "monthly", year: new Date().getFullYear(), chart: [
          { month: "Jan", revenue: 2840 }, { month: "Feb", revenue: 3120 },
          { month: "Mar", revenue: 2980 }, { month: "Apr", revenue: 3660 },
          { month: "May", revenue: 4110 }, { month: "Jun", revenue: 3890 },
          { month: "Jul", revenue: 4520 }, { month: "Aug", revenue: 4980 },
          { month: "Sep", revenue: 4640 }, { month: "Oct", revenue: 5210 },
          { month: "Nov", revenue: 5870 }, { month: "Dec", revenue: 6240 },
        ]});
      if (path === "/api/panel/orders" || path.startsWith("/api/panel/orders?")) {
        const orders = Array.from({ length: 12 }, (_, i) => makeOrder());
        return j({ success: true, data: orders, total: 1284, pages: 107 });
      }
      const od = path.match(/^\/api\/panel\/orders\/([^/]+)$/);
      if (od) return ok(makeOrder({ _id: od[1], items: [
        { id: "i1", name: "Demo Item A", quantity: 1, price: 12.5 },
        { id: "i2", name: "Demo Item B", quantity: 2, price: 7.25 },
      ], pricing: { subtotal: 27, total: 27, delivery: 0 } }));
      if (path === "/api/panel/roles") return ok({ roles: [
        { _id: "r1", name: "Agent", color: ROYAL, permissions: ["claim_agent"] },
        { _id: "r2", name: "Moderator", color: GOLD, permissions: ["view_orders", "monitor_agents"] },
        { _id: "r3", name: "Admin", color: "#FF6B9D", permissions: ["view_orders", "manage_team"] },
      ]});
      // generic panel fallback — keep every admin page alive
      return ok({});
    }

    /* generic api fallback */
    if (method === "GET") return ok({});
    return okPlain();
  };

  window.fetch = handler as typeof window.fetch;
}
